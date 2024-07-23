import numpy as np
import pandas as pd
import pyarrow as pa

pd_int = pd.Int64Dtype()

v11 = {
    "dtypes": {
        "tripduration": pd_int,
        "starttime": str,
        "stoptime": str,
        "start station id": str,
        "start station name": str,
        "start station latitude": np.double,
        "start station longitude": np.double,
        "end station id": str,
        "end station name": str,
        "end station latitude": np.double,
        "end station longitude": np.double,
        "bikeid": str,
        "usertype": str,
        "birth year": pd_int,
        "gender": str,
    },
    "dt_cols": ["starttime", "stoptime"],
}

v12 = {
    "dtypes": {
        "Start Time": str,
        "End Station Latitude": np.double,
        "Gender": str,
        "Bike ID": str,
        "Start Station Longitude": np.double,
        "Start Station ID": str,
        "Start Station Latitude": np.double,
        "Trip Duration": pd_int,
        "Start Station Name": str,
        "Stop Time": str,
        "End Station Longitude": np.double,
        "End Station Name": str,
        "User Type": str,
        "End Station ID": str,
        "Birth Year": pd_int,
    },
    "dt_cols": ["Start Time", "Stop Time"],
}

v2 = {
    "dtypes": {
        "ride_id": str,
        "rideable_type": str,
        "started_at": str,
        "ended_at": str,
        "start_station_id": str,
        "start_station_name": str,
        "start_lat": np.double,
        "start_lng": np.double,
        "end_station_id": str,
        "end_station_name": str,
        "end_lat": np.double,
        "end_lng": np.double,
        "member_casual": str,
    },
    "dt_cols": ["started_at", "ended_at"],
}


schemas = {
    "v11": v11,
    "v12": v12,
    "v2": v2,
}

normalized_schema = {
    "ride_id": pa.string(),
    "rideable_type": pa.string(),
    "started_at": pa.timestamp("ns"),
    "ended_at": pa.timestamp("ns"),
    "start_station_id": pa.string(),
    "start_station_name": pa.string(),
    "start_lat": pa.float64(),
    "start_lng": pa.float64(),
    "end_station_id": pa.string(),
    "end_station_name": pa.string(),
    "end_lat": pa.float64(),
    "end_lng": pa.float64(),
    "member_casual": pa.string(),
    "bike_id": pa.string(),
    "gender": pa.string(),
    "birth_year": pa.int64(),
}
