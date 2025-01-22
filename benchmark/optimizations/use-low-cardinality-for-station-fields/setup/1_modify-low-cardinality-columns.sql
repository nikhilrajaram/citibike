ALTER TABLE trips_benchmark MODIFY COLUMN start_current_station_id LowCardinality (String),
MODIFY COLUMN start_station_id LowCardinality (String),
MODIFY COLUMN start_station_name LowCardinality (String),
MODIFY COLUMN end_current_station_id LowCardinality (String),
MODIFY COLUMN end_station_id LowCardinality (String),
MODIFY COLUMN end_station_name LowCardinality (String);