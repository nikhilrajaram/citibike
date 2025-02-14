import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import axios from "axios";
import { createHash } from "crypto";
import { FeatureCollection } from "geojson";
import { gzip } from "zlib";

const bikeLaneGeoJSONUrl = process.env.BIKE_LANE_GEOJSON_URL;
if (!bikeLaneGeoJSONUrl) {
  throw new Error("BIKE_LANE_GEOJSON_URL is required");
}
const bucketName = process.env.BUCKET_NAME;
const s3Key = "routes/routes.geojson";
const metadataKey = "routes/routes-metadata.json";

const config = {
  region: process.env.AWS_REGION || "us-east-1",
};
const s3 = new S3Client(config);

type Metadata = {
  lastUpdated: string;
  dataHash: string;
  size: number;
};

const downloadBikeRoutes = async () => {
  console.log("Downloading bike routes");
  const resp = await axios.get<FeatureCollection>(bikeLaneGeoJSONUrl);
  console.log("Downloaded bike routes");
  return resp.data;
};

const hashData = async <T extends Record<string, any>>(data: T) => {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex");
};

const getMetadata = async (): Promise<Metadata | undefined> => {
  try {
    const resp = await s3.send(
      new GetObjectCommand({ Bucket: bucketName, Key: metadataKey })
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

const upload = async (data: string, metadata: Metadata) => {
  const existingMetadata = await getMetadata();
  if (existingMetadata?.dataHash === metadata.dataHash) {
    console.log("Data has not changed, skipping upload");
    return;
  }

  console.log("Uploading data", { bucketName, s3Key });
  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: data,
      ContentType: "application/json",
      CacheControl: "public, max-age=604800",
    })
  );

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: metadataKey,
      Body: JSON.stringify(metadata),
      ContentType: "application/json",
    })
  );

  console.log("Uploaded data", { bucketName, s3Key });
};

export const processBikeRoutes = async () => {
  const geoJson = await downloadBikeRoutes();
  const hash = await hashData(geoJson);

  const json = JSON.stringify(geoJson);
  await upload(json, {
    lastUpdated: new Date().toISOString(),
    dataHash: hash,
    size: json.length,
  });
};
