ALTER TABLE trips_benchmark ADD PROJECTION trips_benchmark_start_station_id (
  SELECT
    *
  ORDER BY
    start_station_id
),
ADD PROJECTION trips_benchmark_end_station_id (
  SELECT
    *
  ORDER BY
    end_station_id
);