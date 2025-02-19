import axios from "axios";
import { FeatureCollection } from "geojson";
import { hashData, upload } from "./utils";

const bikeLaneGeoJSONUrl = process.env.BIKE_LANE_GEOJSON_URL;
if (!bikeLaneGeoJSONUrl) {
  throw new Error("BIKE_LANE_GEOJSON_URL is required");
}

const s3Key = "routes/routes.geojson";

const downloadBikeRoutes = async () => {
  console.log("Downloading bike routes", { bikeLaneGeoJSONUrl });
  const resp = await axios.get<FeatureCollection>(bikeLaneGeoJSONUrl);
  console.log("Downloaded bike routes");
  return resp.data;
};

export const processBikeRoutes = async () => {
  const geoJson = await downloadBikeRoutes();
  const hash = await hashData(geoJson);

  const json = JSON.stringify(geoJson);
  await upload(json, s3Key, {
    lastUpdated: new Date().toISOString(),
    dataHash: hash,
    size: json.length,
  });
};
