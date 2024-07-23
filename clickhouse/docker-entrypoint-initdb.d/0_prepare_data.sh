#!/bin/bash

# get GBFS station data and dump to file
rm -f /var/lib/clickhouse/user_files/stations.json
wget -q -O - https://gbfs.lyft.com/gbfs/1.1/bkn/en/station_information.json | jq '.data.stations' >> \
  /var/lib/clickhouse/user_files/stations.json
