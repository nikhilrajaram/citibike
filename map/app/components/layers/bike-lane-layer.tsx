import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Layer, Source } from "react-map-gl";

const BIKE_LANES_URL = process.env.NEXT_PUBLIC_BIKE_LANE_GEOJSON_URL;

export const BikeLaneLayer = () => {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  });

  const { isPending, data } = useQuery({
    queryKey: ["bike-lanes"],
    queryFn: () => {
      if (!BIKE_LANES_URL) {
        return;
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      return fetch(BIKE_LANES_URL, {
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
          return geoJson;
        })
        .catch((err) => {
          if (err.name === "AbortError") {
            return;
          }
          console.error("Error loading bike lanes:", err);
        });
    },
    staleTime: Number.POSITIVE_INFINITY,
  });

  if (!BIKE_LANES_URL) {
    console.warn("BIKE_LANES_URL is not set");
    return null;
  }

  if (isPending) {
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
