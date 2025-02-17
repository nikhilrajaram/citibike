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
  const startDateFormatted = dayjs(startDate, "YYYYMMDD").format("YYYY-MM-DD");
  const endDateFormatted = dayjs(endDate, "YYYYMMDD").format("YYYY-MM-DD");

  if (startDateFormatted === endDateFormatted) {
    return `
      toYYYYMMDDhhmmss(${field}) BETWEEN '${startDate}${startTime}' AND '${endDate}${endTime}'
    `;
  }

  let condition = `
    ${field} BETWEEN '${startDateFormatted}' AND '${endDateFormatted}'
  `;

  if (startTime && endTime) {
    if (Number.parseInt(startTime) > Number.parseInt(endTime)) {
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
      SELECT start_station_id AS station_id,
             SUM(c) AS c
      FROM outbound_trips
      WHERE ${startedAtCondition}
      GROUP BY start_station_id
    ) ot
    JOIN (
      SELECT end_station_id AS station_id,
             SUM(c) AS c
      FROM inbound_trips
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
    const json = await rows.json<{
      stationId: string;
      // note: Clickhouse returns inbound/outbound as strings
      inbound: string;
      outbound: string;
    }>();

    res.json(
      json.map(({ stationId, inbound, outbound }) => ({
        ...stationsById[stationId],
        stationId,
        inbound: Number.parseInt(inbound),
        outbound: Number.parseInt(outbound),
      }))
    );
  } catch {
    res.json([]);
  }
};
