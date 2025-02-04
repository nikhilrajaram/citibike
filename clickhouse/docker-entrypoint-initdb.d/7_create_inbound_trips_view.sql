CREATE MATERIALIZED VIEW inbound_trips_mv TO inbound_trips AS (
  SELECT
    ended_at,
    end_station_id,
    COUNT(*) AS c
  FROM
    trips
  GROUP BY
    (ended_at, end_station_id)
);