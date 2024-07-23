import argparse

from archive_transformer import ArchiveTransformer
from archive_extractor import ArchiveExtractor


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
