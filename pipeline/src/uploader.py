import os
import boto3
from botocore.config import Config

from log import log


class Uploader:
    def __init__(self, data_dir: str, bucket_name: str, region: str = "us-east-1"):
        self.data_dir = data_dir
        self.bucket_name = bucket_name
        self.client = boto3.client(
            "s3",
            config=Config(
                region_name=region,
            ),
        )

    def upload(self, region: str = "us-east-1"):
        if not self.bucket_name:
            raise ValueError("Bucket name is required")

        response = self.client.list_buckets(
            Prefix=self.bucket_name, BucketRegion=region
        )
        if not response["Buckets"]:
            if region == "us-east-1":
                self.client.create_bucket(Bucket=self.bucket_name)
            else:
                self.client.create_bucket(
                    Bucket=self.bucket_name,
                    CreateBucketConfiguration=({"LocationConstraint": region}),
                )

        for file in os.listdir(self.data_dir):
            with open(os.path.join(self.data_dir, file), "rb") as data:
                log(f"Uploading file", {"file": file, "bucket": self.bucket_name})
                self.client.upload_fileobj(data, self.bucket_name, file)
                log(f"Uploaded file", {"file": file, "bucket": self.bucket_name})
