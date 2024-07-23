import { Row } from "@clickhouse/client";
import dayjs from "dayjs";
import express from "express";
import { getClient } from "../clickhouse-client";
import { getStationsById } from "../stations/stations";

type FluxQuery = {
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
};

const getDateCondition = (
  { startDate, endDate, startTime, endTime }: FluxQuery,
  field: "started_at" | "ended_at"
) => {
  let condition = `
    toYYYYMMDD(${field}) BETWEEN '${startDate}' AND '${endDate}'
  `;

  if (startTime && endTime) {
    if (dayjs(startTime, "HHmmss") > dayjs(endTime, "HHmmss")) {
      condition += ` 
        AND (
          toYYYYMMDDhhmmss(${field}) % 1000000 > ${startTime} 
          OR toYYYYMMDDhhmmss(${field}) % 1000000 < ${endTime}
        )
      `;
    } else {
      condition += ` 
        AND toYYYYMMDDhhmmss(started_at) % 1000000 BETWEEN ${startTime} AND ${endTime}
      `;
    }
  }

  return condition;
};

export const queryFlux = async (query: FluxQuery, res: express.Response) => {
  const client = getClient();

  const stationsById = await getStationsById();

  const startedAtCondition = getDateCondition(query, "started_at");
  const endedAtCondition = getDateCondition(query, "ended_at");
  const fluxSql = `
    WITH outbound_trips AS (
      SELECT start_station_id AS station_id, COUNT(*) AS c
      FROM trips
      WHERE ${startedAtCondition}
      GROUP BY start_station_id
    ),
    inbound_trips AS (
      SELECT end_station_id AS station_id, COUNT(*) AS c
      FROM trips
      WHERE ${endedAtCondition}
      GROUP BY end_station_id
    )
    SELECT cs.short_name AS stationId,
           it.c AS inbound,
           ot.c AS outbound
    FROM outbound_trips ot
    JOIN inbound_trips it
      ON ot.station_id = it.station_id
    JOIN current_stations cs
      ON cs.short_name = it.station_id;
  `;

  const rows = await client.query({
    query: fluxSql,
    format: "JSONEachRow",
  });
  const stream = rows.stream();

  stream.on(
    "data",
    (rows: Row<{ stationId: string; inbound: number; outbound: number }>[]) => {
      rows.forEach((row) => {
        const stationFlux = row.json();
        const station = stationsById[stationFlux.stationId];
        const content =
          JSON.stringify({
            ...station,
            ...stationFlux,
          }) + "\n";
        res.write(content);
      });
    }
  );

  stream.on("end", () => {
    res.send();
  });
};
