import os
from concurrent.futures import ThreadPoolExecutor

import boto3
from concurrent.futures import Future
import psutil

from log import log


class ArchiveExtractor:
    BUCKET_NAME = "tripdata"
    DOWNLOAD_STATE_FILE = "download_progress.json"

    def __init__(self, out_dir: str):
        self.out_dir = out_dir
        self.archive_dir = os.path.join(out_dir, "archives")

        self.s3 = boto3.client("s3")

        self.tmp_file_dir = os.path.join(self.archive_dir, ".tmp")
        os.makedirs(self.tmp_file_dir, exist_ok=True)

    def extract(self) -> None:
        os.makedirs(self.out_dir, exist_ok=True)
        os.makedirs(self.archive_dir, exist_ok=True)

        bucket_contents = self.s3.list_objects_v2(Bucket=ArchiveExtractor.BUCKET_NAME)

        log("Downloading files", {"files": bucket_contents["Contents"]})
        n_workers = min(psutil.cpu_count(logical=False), 10)
        with ThreadPoolExecutor(max_workers=n_workers) as executor:
            future_to_key: dict[Future, str] = {}
            for obj in bucket_contents["Contents"]:
                file_key = obj["Key"]
                future_to_key[
                    executor.submit(
                        self.download_file,
                        file_key,
                    )
                ] = file_key

            for future in future_to_key:
                file_key = future_to_key[future]
                try:
                    downloaded = future.result()
                    if downloaded:
                        log(f"Downloaded file", {"file_key": file_key})
                except Exception as e:
                    log(
                        f"Failed to download file",
                        {"file_key": file_key, "exception": e},
                    )

    def download_file(self, file_key: str) -> None:
        if file_key.endswith(".zip"):
            return self.download_zip(file_key)
        elif file_key == "index.html":
            return None
        else:
            raise Exception("Unsupported file type", file_key)

    def download_zip(self, file_key: str) -> None:
        if os.path.exists(os.path.join(self.archive_dir, file_key)):
            log("File already present, skipping download", {"file_key": file_key})
            return None

        log("Downloading", {"file_key": file_key})
        tmpfile = os.path.join(self.tmp_file_dir, file_key)
        with open(tmpfile, "wb") as f:
            self.s3.download_fileobj(ArchiveExtractor.BUCKET_NAME, file_key, f)

        os.rename(tmpfile, os.path.join(self.archive_dir, file_key))
        return file_key
