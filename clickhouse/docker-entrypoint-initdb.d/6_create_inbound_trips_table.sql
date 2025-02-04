CREATE TABLE
  inbound_trips (ended_at DateTime, end_station_id String, c Int64) ENGINE = AggregatingMergeTree ()
ORDER BY
  (ended_at, end_station_id);