ALTER TABLE trips_benchmark MATERIALIZE COLUMN started_time,
MATERIALIZE COLUMN ended_time,
MATERIALIZE COLUMN started_day,
MATERIALIZE COLUMN ended_day;