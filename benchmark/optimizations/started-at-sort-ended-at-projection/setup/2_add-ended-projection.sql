ALTER TABLE trips_benchmark ADD PROJECTION trips_benchmark_ended_at_station (
  SELECT
    *
  ORDER BY
    (ended_at, end_station_id)
);