# citibike

A webapp to explore [Citi Bike system data](https://citibikenyc.com/system-data). Composed of four services, in dependency order:
 - `pipeline`: a pipeline implemented in Python to extract historical data from the `tripdata` bucket and transform it into Parquet
 - `clickhouse`: a Clickhouse server that reads from the Parquet and further normalizes the data for querying
 - `mapserver`: a Node/express server that exposes various analytic routes
 - `map`: a React client that hits `mapserver`

## Instructions

There are two compose files: `docker-compose-etl.yml` and `docker-compose-app.yml`. The former runs all four services while the latter skips the pipeline (as well as Clickhouse initialization, if already initialized).
