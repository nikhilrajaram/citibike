CREATE TABLE
  outbound_trips (
    started_at DateTime,
    start_station_id String,
    c Int64
  ) ENGINE = AggregatingMergeTree ()
ORDER BY
  (started_at, start_station_id);