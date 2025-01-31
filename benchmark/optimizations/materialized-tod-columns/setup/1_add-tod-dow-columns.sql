ALTER TABLE trips_benchmark
ADD COLUMN started_time Int64 MATERIALIZED toYYYYMMDDhhmmss (started_at),
ADD COLUMN ended_time Int64 MATERIALIZED toYYYYMMDDhhmmss (ended_at),
ADD COLUMN started_day Int64 MATERIALIZED toDayOfWeek (started_at, 1),
ADD COLUMN ended_day Int64 MATERIALIZED toDayOfWeek (ended_at, 1);