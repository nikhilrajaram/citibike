import { kv } from "@vercel/kv";
import { getClient } from "./clickhouse-client";

type Station = {
  stationId: string;
  currentStationId: string;
  stationName: string;
  latitude: number;
  longitude: number;
};

export const runtime = "edge";

export const getStationsById = async () => {
  const map = (await kv.get("station-map")) as Record<string, Station>;
  if (map) {
    return map;
  }

  const client = getClient();
  const sql = `
    SELECT 
      short_name AS stationId,
      station_id AS currentStationId,
      name AS stationName,
      latitude AS latitude,
      longitude AS longitude,
      capacity AS capacity
    FROM current_stations;
  `;

  const rows = await client.query({
    query: sql,
    format: "JSONEachRow",
  });

  const json = await rows.json<Station>();

  const stationsById = json.reduce((acc, station) => {
    acc[station.stationId] = station;
    return acc;
  }, {} as Record<string, Station>);
  await kv.set("station-map", stationsById);

  return stationsById;
};
