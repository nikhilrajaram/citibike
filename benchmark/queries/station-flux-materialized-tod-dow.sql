SELECT
  it.station_id AS stationId,
  it.c AS inbound,
  ot.c AS outbound
FROM
  (
    SELECT
      start_station_id AS station_id,
      COUNT(*) AS c
    FROM
      {{tableName}}
    WHERE
      started_at BETWEEN '{{startDate}}' AND '{{endDate}}'
      AND started_time % 1000000 BETWEEN {{startTime}} AND {{endTime}}
      AND started_day IN ({{daysOfWeek}})
    GROUP BY
      start_station_id
  ) ot
  JOIN (
    SELECT
      end_station_id AS station_id,
      COUNT(*) AS c
    FROM
      {{tableName}}
    WHERE
      ended_at BETWEEN '{{startDate}}' AND '{{endDate}}'
      AND ended_time % 1000000 BETWEEN {{startTime}} AND {{endTime}}
      AND ended_day IN ({{daysOfWeek}})
    GROUP BY
      end_station_id
  ) it ON ot.station_id = it.station_id;