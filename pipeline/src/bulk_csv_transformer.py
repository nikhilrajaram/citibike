import dask.dataframe as dd

from schemas import schemas


def get_header_version(unparsed_headers: str):
    headers = set(unparsed_headers.replace('"', "").strip("\n").split(","))
    max_score, likely_header = 0, None
    for version, schema in schemas.items():
        if headers.issubset(set(schema["dtypes"].keys())):
            return version
        score = len(headers.intersection(set(schema["dtypes"].keys()))) / len(headers)
        if score > max_score:
            max_score = score
            likely_header = version

    if max_score > 0:
        print(
            "Could not strictly determine header version for file",
            {"max_score": max_score, "likely_header": likely_header},
        )
        return likely_header

    print("Could not determine header version for file", {"headers": headers})
    return "unk"


class BulkCSVTransformer:
    HEADERS = [
        "ride_id",
        "rideable_type",
        "started_at",
        "ended_at",
        "start_station_id",
        "start_station_name",
        "start_lat",
        "start_lng",
        "end_station_id",
        "end_station_name",
        "end_lat",
        "end_lng",
        "member_casual",
        "bike_id",
        "gender",
        "birth_year",
    ]

    def __init__(self, paths, header_version):
        self.paths = paths
        self.header_version = header_version

    def transform(self) -> dd.DataFrame:
        df = None
        if self.header_version == "v11":
            df = self.transform_v11()
        elif self.header_version == "v12":
            df = self.transform_v12()
        elif self.header_version == "v2":
            df = self.transform_v2()
        else:
            raise ValueError("Unknown header version")

        df["gender"] = df["gender"].replace({0: "O", 1: "M", 2: "F"})
        return df[BulkCSVTransformer.HEADERS]

    def load_df(self) -> dd.DataFrame:
        dtypes = schemas[self.header_version]["dtypes"]
        dt_cols = schemas[self.header_version]["dt_cols"]
        df = dd.read_csv(self.paths, dtype=dtypes, na_values=["\\N", ""])
        for col in dt_cols:
            df[col] = dd.to_datetime(df[col])
        return df

    def transform_v11(self) -> dd.DataFrame:
        df = self.load_df()
        df["usertype"] = df["usertype"].replace(
            {"Subscriber": "member", "Customer": "casual"}
        )
        df: dd.DataFrame = df.drop(columns=["tripduration"]).assign(
            ride_id=None, rideable_type=None
        )
        return df.rename(
            columns={
                "starttime": "started_at",
                "stoptime": "ended_at",
                "start station id": "start_station_id",
                "start station name": "start_station_name",
                "start station latitude": "start_lat",
                "start station longitude": "start_lng",
                "end station id": "end_station_id",
                "end station name": "end_station_name",
                "end station latitude": "end_lat",
                "end station longitude": "end_lng",
                "usertype": "member_casual",
                "bikeid": "bike_id",
                "birth year": "birth_year",
            },
        )

    def transform_v12(self) -> dd.DataFrame:
        df = self.load_df()
        df["User Type"] = df["User Type"].replace(
            {"Subscriber": "member", "Customer": "casual"}
        )
        df: dd.DataFrame = df.drop(columns=["Trip Duration"]).assign(
            ride_id=None, rideable_type=None
        )
        return df.rename(
            columns={
                "Start Time": "started_at",
                "Stop Time": "ended_at",
                "Start Station ID": "start_station_id",
                "Start Station Name": "start_station_name",
                "Start Station Latitude": "start_lat",
                "Start Station Longitude": "start_lng",
                "End Station ID": "end_station_id",
                "End Station Name": "end_station_name",
                "End Station Latitude": "end_lat",
                "End Station Longitude": "end_lng",
                "User Type": "member_casual",
                "Bike ID": "bike_id",
                "Gender": "gender",
                "Birth Year": "birth_year",
            },
        )

    def transform_v2(self) -> dd.DataFrame:
        df = self.load_df()
        return df.assign(bike_id=None, gender=None, birth_year=None)
