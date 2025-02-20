# citibike

A webapp to explore [Citi Bike system data](https://citibikenyc.com/system-data). Composed of four services:
 - `pipeline`: a data pipeline that extracts historical data from the [`tripdata`](https://s3.amazonaws.com/tripdata/index.html) bucket, transforms the data into Parquet, and uploads it to S3
 - `clickhouse`: a Clickhouse server that reads the Parquet data and further normalizes it for querying
 - `map`: a Next.js app that exposes an interface to explore the data (including serverless API routes)
 - `mapdata`: provisions AWS infrastructure and lambda implementations for fetching static data that `map` depends on

## Instructions

There are two compose files: `docker-compose.etl.yml` and `docker-compose.local.yml`. The former runs all three services while the latter skips the pipeline (as well as Clickhouse initialization, if already initialized).
