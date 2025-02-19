import AdmZip from "adm-zip";
import axios from "axios";
import * as fs from "fs";
import path from "path";
import { hashData, upload } from "./utils";

const gtfsUrl = process.env.GTFS_URL;
if (!gtfsUrl) {
  throw new Error("GTFS_URL is required");
}
const gtfsFolder = process.env.AWS_LAMBDA_FUNCTION_NAME ? "/tmp/gtfs" : "gtfs";

const downloadGTFS = async () => {
  console.log("Downloading GTFS", { gtfsUrl });
  const resp = await axios.get<ArrayBuffer>(gtfsUrl, {
    responseType: "arraybuffer",
  });

  fs.mkdirSync(gtfsFolder, { recursive: true });
  const zipPath = path.join(gtfsFolder, "gtfs.zip");
  fs.writeFileSync(zipPath, new Uint8Array(resp.data));
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(gtfsFolder, true);

  console.log("Downloaded GTFS");
};

const geoJSONifyStops = async (stopsData: string) => {
  const [header, ...data] = stopsData.split("\n");
  const columns = header.split(",");
  if (!columns.includes("stop_id")) {
    throw new Error();
  }

  const geoJson: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [],
  };
  data.forEach((row) => {
    const value = row.split(",").reduce(
      (acc, value, i) => ({
        ...acc,
        [columns[i]]: value,
      }),
      {} as Record<string, string>
    );

    if (
      !value.stop_id ||
      !value.stop_name ||
      !value.stop_lat ||
      !value.stop_lon
    ) {
      return;
    }

    const feature: GeoJSON.Feature = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [parseFloat(value.stop_lon), parseFloat(value.stop_lat)],
      },
      properties: {
        stop_id: value.stop_id,
        stop_name: value.stop_name,
        location_type: value.location_type,
        parent_station: value.parent_station,
      },
    };

    geoJson.features.push(feature);
  });

  return JSON.stringify(geoJson);
};

export const processGTFS = async () => {
  await downloadGTFS();
  const files = fs.readdirSync(gtfsFolder);
  for (let i = 0; i < files[0].length; i++) {
    const file = files[i];
    const data = fs.readFileSync(path.join(gtfsFolder, file));
    const fileKey = path.join(gtfsFolder, file);

    const metadata = {
      lastUpdated: new Date().toISOString(),
      dataHash: await hashData(data),
      size: data.length,
    };

    await upload(data.toString(), fileKey, metadata);

    if (path.basename(file) === "stops.txt") {
      const transformedStops = await geoJSONifyStops(data.toString());
      const stopsKey = path.join(gtfsFolder, "stops.geojson");
      const stopsMetadata = {
        lastUpdated: new Date().toISOString(),
        dataHash: await hashData(transformedStops),
        size: transformedStops.length,
      };
      await upload(transformedStops, stopsKey, stopsMetadata);
    }
  }
};
