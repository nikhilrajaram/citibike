CREATE MATERIALIZED VIEW outbound_trips_mv TO outbound_trips AS (
  SELECT
    started_at,
    start_station_id,
    COUNT(*) AS c
  FROM
    trips_benchmark
  GROUP BY
    (started_at, start_station_id)
);