import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { createHash } from "crypto";
import path from "path";
import { s3 } from "./clients";

export type Metadata = {
  lastUpdated: string;
  dataHash: string;
  size: number;
};

export const bucketName = process.env.BUCKET_NAME;
const metadataFolder = "metadata";

export const hashData = async <T extends Record<string, any>>(
  data: string | T
) => {
  return createHash("sha256")
    .update(typeof data === "string" ? data : JSON.stringify(data))
    .digest("hex");
};

const getMetadataKey = (fileKey: string) =>
  path.join(metadataFolder, fileKey).concat(".json");

export const getMetadata = async (
  fileKey: string
): Promise<Metadata | undefined> => {
  try {
    const metadataKey = getMetadataKey(fileKey);
    const resp = await s3.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: metadataKey,
      })
    );
    const body = await resp.Body?.transformToString();
    if (!body) {
      throw new Error("No metadata body");
    }
    return JSON.parse(body);
  } catch (e) {
    if (e instanceof NoSuchKey) {
      return undefined;
    }
    throw e;
  }
};

export const upload = async (
  data: string,
  fileKey: string,
  metadata: Metadata
) => {
  const existingMetadata = await getMetadata(fileKey);
  if (existingMetadata?.dataHash === metadata.dataHash) {
    console.log("Data has not changed, skipping upload", { fileKey });
    return;
  }

  console.log("Uploading data", { bucketName, key: fileKey });
  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: data,
      ContentType: "application/json",
      CacheControl: "public, max-age=604800",
    })
  );

  const metadataKey = getMetadataKey(fileKey);
  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: metadataKey,
      Body: JSON.stringify(metadata),
      ContentType: "application/json",
    })
  );

  console.log("Uploaded data", { bucketName, key: fileKey });
};
