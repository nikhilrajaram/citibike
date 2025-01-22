CREATE TABLE
  trips_benchmark (
    ride_id String,
    rideable_type String,
    started_at DateTime64,
    ended_at DateTime64,
    start_current_station_id String,
    start_station_id String,
    start_station_name String,
    start_lat Decimal(7, 5),
    start_lng Decimal(8, 5),
    end_current_station_id String,
    end_station_id String,
    end_station_name String,
    end_lat Decimal(7, 5),
    end_lng Decimal(8, 5),
    member_casual String,
    bike_id String,
    gender String,
    birth_year Int64
  ) ENGINE = MergeTree ()
ORDER BY
  (started_at, start_station_id);