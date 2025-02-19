import { S3Client } from "@aws-sdk/client-s3";

const config = {
  region: process.env.AWS_REGION || "us-east-1",
};
export const s3 = new S3Client(config);
