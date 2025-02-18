import glob
import os
import re
import typing
import zipfile
from concurrent.futures import Future, ThreadPoolExecutor, as_completed

import dask.dataframe as dd
from dask.distributed import Client

from log import log
from schemas import normalized_schema
from bulk_csv_transformer import BulkCSVTransformer, get_header_version

# there are several types of archives in the dataset:
# 1. year archives with the filename YYYY-citibike-tripdata.zip
#   (a) that contain 1M chunk CSVs at the top level and redundant CSVs nested in month folders (2013-2018)
#   (b) that contain nested archives at the top level for each month (2020-2023)
# 2. newer monthly archives with the filename YYYYMM-citibike-tripdata_<n>.csv.zip that expands to n CSV chunks
# 3. Jersey City archives that are the same as (2) but with a JC- prefix


def parse_year_month_part(file_name):
    return re.match(
        r"(JC-)?(\d{4})(\d{1,2})[- ](?:citibike|citbike)-tripdata(?:_)?([\d]+)?",
        file_name,
    )


def normalize_file_name(file_path):
    filename = os.path.split(file_path)[-1]
    match = parse_year_month_part(filename)
    if not match:
        return

    groups = match.groups()
    is_nyc = groups[0] is None
    year = groups[1]
    month = groups[2]
    part = groups[3] if groups[3] else "1"
    return f"{'NYC' if is_nyc else 'JC'}-{year}-{month.zfill(2)}-{part}.csv"


class ArchiveTransformer:
    IGNORE_FILES = [r".*__MACOSX/.*", r".*/.DS_Store"]

    def __init__(self, out_dir: str):
        self.out_dir = out_dir
        self.archive_dir = os.path.join(out_dir, "archives")
        self.extracted_dir = os.path.join(out_dir, "extracted")

        self.trips_df = None

        # instantiating the distributed client to make Dask use the distributed scheduler
        n_workers_str = os.environ.get("DASK_N_WORKERS", "0")
        n_workers = int(n_workers_str)
        self.client = Client(
            n_workers=n_workers if n_workers else None,
            threads_per_worker=1,
            memory_limit=os.environ.get("DASK_MEMORY_PER_WORKER"),
            local_directory=os.path.join(out_dir, "dask-worker-space"),
        )
        log("Dask client started", {"dashboard": self.client.dashboard_link})

    def transform_archives(self):
        self.extract_csvs()

        extracted_csvs = glob.glob(
            os.path.join(self.extracted_dir, "**/*.csv"), recursive=True
        )

        files_by_header: dict[str, typing.List[str]] = {}
        for file in extracted_csvs:
            with open(file, "r") as f:
                header_version = get_header_version(f.readline().replace("\r", ""))
                files_for_header = files_by_header.get(header_version, [])
                files_for_header.append(file)
                files_by_header[header_version] = files_for_header

        log("Transforming files", {"files_by_header": files_by_header})
        for header_version, files in files_by_header.items():
            df = BulkCSVTransformer(files, header_version).transform()
            self.trips_df = dd.concat(
                list(filter(lambda x: x is not None, [self.trips_df, df])), axis=0
            )

        log("Repartitioning df")
        repartitioned_df = self.trips_df.repartition(npartitions=50)

        log(
            "Writing df to parquet (visit the dask dashboard to see progress)",
            {"dashboard": self.client.dashboard_link},
        )
        repartitioned_df.to_parquet(
            os.path.join(self.out_dir, "parquet"),
            schema=normalized_schema,
            write_index=False,
            overwrite=True,
        )

        log("Wrote df to parquet")

    def extract_all_archives(self):
        archives = sorted(os.listdir(self.archive_dir))
        for file in archives:
            if not file.endswith(".zip"):
                log("Skipping non-archive file", {"file": file})
                continue

            archive_path = os.path.join(self.archive_dir, file)
            self.extract(archive_path)

    def extract_csvs(self):
        archive_paths = sorted(os.listdir(self.archive_dir))

        archives_to_extract = [
            os.path.join(self.archive_dir, file)
            for file in archive_paths
            if file.endswith(".zip")
        ]

        with ThreadPoolExecutor(max_workers=8) as executor:
            while archives_to_extract:
                future_map: dict[Future, str] = {
                    executor.submit(self.extract, archive_path): archive_path
                    for archive_path in archives_to_extract
                }

                archives_to_extract.clear()

                for future in as_completed(future_map):
                    archive_path = future_map[future]
                    try:
                        log(f"Extracted archive", {"archive": archive_path})
                        nested_archives = future.result()
                        if nested_archives:
                            archives_to_extract.extend(nested_archives)
                    except Exception as e:
                        log(
                            f"Failed to extract archive",
                            {"archive": archive_path, "exception": e},
                        )

    def extract(
        self,
        archive_path: str,
    ):
        try:
            with open(archive_path, "rb") as f, zipfile.ZipFile(f) as zip_ref:
                infolist = zip_ref.infolist()
                members = self.get_files_to_extract(infolist)

                log(
                    f"Extracting members from archive",
                    {"members": members, "archive": archive_path},
                )
                zip_ref.extractall(self.extracted_dir, members)

                nested_zip_files = filter(lambda x: x.endswith(".zip"), members)
                return (
                    list(
                        map(
                            lambda x: os.path.join(self.extracted_dir, x),
                            nested_zip_files,
                        )
                    )
                    if nested_zip_files
                    else None
                )
        except zipfile.BadZipFile as e:
            log("Failed to extract archive", {"archive": archive_path, "exception": e})

    def get_files_to_extract(self, infolist: typing.List[zipfile.ZipInfo]):
        """
        Gets the members in the archive to extract. Ignores non-data files and
        directories, skips over chunked files where the full file is present.
        """
        extract_members: typing.List[str] = []
        all_members = list(map(lambda x: x.filename, infolist))
        for zipinfo in infolist:
            if any(
                map(
                    lambda x: re.match(x, zipinfo.filename),
                    ArchiveTransformer.IGNORE_FILES,
                )
            ):
                log("Ignoring file", {"filename": zipinfo.filename})
                continue

            if zipinfo.is_dir():
                log("Ignoring directory", {"directory": zipinfo.filename})
                continue

            if zipinfo.filename.endswith(".zip"):
                if os.path.exists(os.path.join(self.extracted_dir, zipinfo.filename)):
                    log("Skipping extracted file", {"filename": zipinfo.filename})
                    continue
                extract_members.append(zipinfo.filename)
            else:
                file_basename = os.path.basename(zipinfo.filename)
                if re.search("_[0-9]+.csv$", file_basename):
                    unchunked_file_name = (
                        re.match("(.*)_[0-9]+.csv$", file_basename).group(1) + ".csv"
                    )
                    if any(
                        map(lambda x: re.search(unchunked_file_name, x), all_members)
                    ):
                        log("Ignoring chunked file", {"filename": zipinfo.filename})
                        continue

                if os.path.exists(os.path.join(self.extracted_dir, zipinfo.filename)):
                    log("Skipping extracted file", {"filename": zipinfo.filename})
                    continue

                extract_members.append(zipinfo.filename)

        return extract_members
