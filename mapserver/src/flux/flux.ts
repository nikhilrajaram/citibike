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
  daysOfWeek?: string;
};

const getDateCondition = (
  { startDate, endDate, startTime, endTime, daysOfWeek }: FluxQuery,
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
        AND toYYYYMMDDhhmmss(${field}) % 1000000 BETWEEN ${startTime} AND ${endTime}
      `;
    }
  }
  if (daysOfWeek) {
    condition += `
      AND toDayOfWeek(${field}, 1) IN (${daysOfWeek})
    `;
  }

  return condition;
};

export const queryFlux = async (query: FluxQuery, res: express.Response) => {
  const client = getClient();

  const stationsById = await getStationsById();

  const startedAtCondition = getDateCondition(query, "started_at");
  const endedAtCondition = getDateCondition(query, "ended_at");
  const fluxSql = `
    SELECT it.station_id AS stationId,
           it.c AS inbound,
           ot.c AS outbound
    FROM (
      SELECT start_station_id AS station_id, COUNT(*) AS c
      FROM trips
      WHERE ${startedAtCondition}
      GROUP BY start_station_id
    ) ot
    JOIN (
      SELECT end_station_id AS station_id, COUNT(*) AS c
      FROM trips
      WHERE ${endedAtCondition}
      GROUP BY end_station_id
    ) it
      ON ot.station_id = it.station_id;
  `;

  try {
    const rows = await client.query({
      query: fluxSql,
      format: "JSONEachRow",
      abort_signal: res.locals.abortController.signal,
    });
    const stream = rows.stream();

    stream.on(
      "data",
      (
        rows: Row<{ stationId: string; inbound: number; outbound: number }>[]
      ) => {
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
      res.end();
    });
  } catch {
    res.end();
  }
};
