#!/bin/bash

# remove data dir
rm -rf /var/lib/clickhouse/data /var/lib/clickhouse/metadata

# copy data
cp -r data/parquet /var/lib/clickhouse/user_files/
clickhouse-server
