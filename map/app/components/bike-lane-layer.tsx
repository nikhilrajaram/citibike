import { useEffect, useState } from "react";
import { Layer, Source } from "react-map-gl";

const BIKE_LANES_URL = process.env.NEXT_PUBLIC_BIKE_LANE_GEOJSON_URL;

export const BikeLaneLayer = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!isLoading) {
      return;
    }
    
    const controller = new AbortController();
    if (!BIKE_LANES_URL) {
      return;
    }
    
    fetch(BIKE_LANES_URL, {
      signal: controller.signal,
      headers: {
        "Accept-Encoding": "json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error... status: ${response.status}`);
        }
        return response.json();
      })
      .then((geoJson) => {
        setData(geoJson);
        setError(null);
      })
      .catch((err) => {
        if (err.name === "AbortError") {
          return;
        }
        console.error("Error loading bike lanes:", err);
        setError(err);
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => controller.abort();
  });

  if (!BIKE_LANES_URL) {
    return null;
  }

  return (
    <Source id="bike-lanes" type="geojson" data={data}>
      <Layer
        id="bike-lanes-layer"
        type="line"
        paint={{
          "line-color": [
            "match",
            ["get", "tf_facilit"],
            "Protected Path",
            "#2ecc71",
            "#7f8c8d",
          ],
          "line-width": 2,
          "line-opacity": 0.5,
        }}
      />
    </Source>
  );
};
