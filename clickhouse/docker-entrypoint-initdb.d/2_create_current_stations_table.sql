DROP TABLE IF EXISTS current_stations;

CREATE TABLE
  current_stations (
    station_id String,
    short_name String,
    name String,
    latitude Decimal(7, 5),
    longitude Decimal(8, 5),
    region_id String,
    external_id String,
    capacity Int64
  ) Engine = MergeTree ()
ORDER BY
  station_id AS (
    SELECT
      station_id,
      short_name,
      name,
      lat AS latitude,
      lon AS longitude,
      region_id,
      external_id,
      capacity
    FROM
      file ('stations.json')
  );