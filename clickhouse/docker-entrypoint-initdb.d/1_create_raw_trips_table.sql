DROP TABLE IF EXISTS raw_trips;

CREATE TABLE
  raw_trips (
    ride_id String,
    rideable_type String,
    started_at DateTime,
    ended_at DateTime,
    start_station_id String,
    start_station_name String,
    start_lat Decimal(7, 5),
    start_lng Decimal(8, 5),
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
  tuple () AS (
    SELECT
      ride_id,
      rideable_type,
      started_at,
      ended_at,
      start_station_id,
      start_station_name,
      start_lat,
      start_lng,
      end_station_id,
      end_station_name,
      end_lat,
      end_lng,
      member_casual,
      bike_id,
      gender,
      birth_year
    FROM
      file ('parquet/*.parquet', Parquet)
  );