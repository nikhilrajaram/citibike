import { Row } from "@clickhouse/client";
import { getClient } from "../clickhouse-client";

type Station = {
  stationId: string;
  currentStationId: string;
  stationName: string;
  latitude: number;
  longitude: number;
};

const stationsById: Record<string, Station> = {};

export const getStationsById = () => {
  if (Object.keys(stationsById).length > 0) {
    return stationsById;
  }

  return new Promise<Record<string, Station>>((resolve, reject) => {
    const client = getClient();
    const sql = `
      SELECT 
        short_name AS stationId,
        station_id AS currentStationId,
        name AS stationName,
        lat AS latitude,
        lon AS longitude,
        capacity AS capacity
      FROM current_stations;
    `;

    client
      .query({
        query: sql,
        format: "JSONEachRow",
      })
      .then((rows) => {
        const stream = rows.stream();

        stream.on("data", (rows: Row[]) => {
          rows.forEach((row) => {
            const station = row.json() as Station;
            stationsById[station.stationId] = station;
          });
        });

        stream.on("end", () => {
          resolve(stationsById);
        });

        stream.on("error", (err) => {
          return reject(err);
        });
      });
  });
};
