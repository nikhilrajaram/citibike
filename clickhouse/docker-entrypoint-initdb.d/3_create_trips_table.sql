DROP TABLE IF EXISTS trips;

CREATE TABLE
  trips (
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
  started_at AS (
    SELECT
      rt.ride_id,
      rt.rideable_type,
      rt.started_at,
      rt.ended_at,
      cs_s.station_id AS start_current_station_id,
      cs_s.short_name AS start_station_id,
      cs_s.name AS start_station_name,
      cs_s.latitude AS start_lat,
      cs_s.longitude AS start_lng,
      cs_e.station_id AS end_current_station_id,
      cs_e.short_name AS end_station_id,
      cs_e.name AS end_station_name,
      cs_e.latitude AS end_lat,
      cs_e.longitude AS end_lng,
      rt.member_casual,
      rt.bike_id,
      rt.gender,
      rt.birth_year
    FROM
      raw_trips rt
      JOIN current_stations cs_s ON (
        rt.start_station_name = cs_s.name
        OR rt.start_station_id = cs_s.short_name
        OR (
          rt.start_lat = cs_s.latitude
          AND rt.start_lng = cs_s.longitude
        )
      )
      JOIN current_stations cs_e ON (
        rt.end_station_name = cs_e.name
        OR rt.end_station_id = cs_e.short_name
        OR (
          rt.end_lat = cs_e.latitude
          AND rt.end_lng = cs_e.longitude
        )
      )
  );