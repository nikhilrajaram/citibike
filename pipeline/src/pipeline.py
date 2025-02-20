import argparse
import os

from archive_transformer import ArchiveTransformer
from archive_extractor import ArchiveExtractor
from uploader import Uploader


def parse_args():
    parser = argparse.ArgumentParser(
        description="Download data from Citi Bike S3 bucket"
    )
    parser.add_argument(
        "-e",
        "--extract",
        action="store_true",
        help="Download data from S3",
    )
    parser.add_argument(
        "-t",
        "--transform",
        action="store_true",
        help="Extract and transform data",
    )
    parser.add_argument(
        "-u",
        "--upload",
        action="store_true",
        help="Upload data to S3",
    )
    parser.add_argument("--out_dir", help="Output directory", default="./data")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    if args.extract:
        downloader = ArchiveExtractor(args.out_dir)
        downloader.extract()
    if args.transform:
        transformer = ArchiveTransformer(args.out_dir)
        transformer.transform_archives()
    if args.upload:
        pq_dir = os.path.join(args.out_dir, "parquet")
        bucket_name = os.environ.get("BUCKET_NAME")
        if not bucket_name:
            raise ValueError("BUCKET_NAME environment variable is not set")
        uploader = Uploader(pq_dir, args.bucket_name)
        uploader.upload()
