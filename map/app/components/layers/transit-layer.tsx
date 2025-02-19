import { DefaultError, useQuery } from "@tanstack/react-query";
import { Typography } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { Layer, MapMouseEvent, Popup, Source, useMap } from "react-map-gl";

const GTFS_STOPS_GEOJSON = process.env.NEXT_PUBLIC_GTFS_STOPS_GEOJSON_URL;

type TransitPointProperties = {
  stop_id: number;
  stop_name: string;
  location_type: string;
  parent_station: string;
};

export const TransitLayer = () => {
  const map = useMap();
  // add mta logo
  if (!map.current?.hasImage("mta_logo")) {
    const mtaLogoImage = new Image(100, 100);
    mtaLogoImage.src = "/mta_logo.svg";
    mtaLogoImage.onload = () => {
      map.current?.addImage("mta_logo", mtaLogoImage);
    };
  }

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  });

  const { isPending, data } = useQuery<
    unknown,
    DefaultError,
    GeoJSON.FeatureCollection<GeoJSON.Point, TransitPointProperties>
  >({
    queryKey: ["stops-geojson"],
    queryFn: () => {
      if (!GTFS_STOPS_GEOJSON) {
        return;
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      return fetch(GTFS_STOPS_GEOJSON, {
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
          console.error("Error loading subway stops:", err);
        });
    },
    staleTime: Number.POSITIVE_INFINITY,
  });

  const [hoveredStation, setHoveredStation] = useState<{
    stopName: string;
    longitude: number;
    latitude: number;
  } | null>(null);
  const [cursor, setCursor] = useState<"default" | "pointer">("default");

  const onMouseEnter = useCallback(
    (e: MapMouseEvent) => {
      const station = e.features?.[0] as GeoJSON.Feature<
        GeoJSON.Point,
        GeoJSON.GeoJsonProperties
      >;
      setCursor("pointer");
      if (!hoveredStation && station) {
        setHoveredStation({
          stopName: station.properties?.stop_name,
          longitude: station.geometry.coordinates[0],
          latitude: station.geometry.coordinates[1],
        });
      }
    },
    [hoveredStation]
  );

  const onMouseLeave = useCallback(() => {
    setCursor("default");
    setHoveredStation(null);
  }, []);

  const onClick = useCallback((e: MapMouseEvent) => {
    if (e.features && e.features.length > 0) {
      // Prevent click from propagating to the map
      e.originalEvent.stopPropagation();

      setHoveredStation({
        stopName: e.features[0].properties?.stop_name,
        longitude: e.lngLat.lng,
        latitude: e.lngLat.lat,
      });
    }
  }, []);

  useEffect(() => {
    const currMap = map.current;
    if (!currMap) {
      return;
    }

    currMap.on("mouseenter", "subway-stops-layer", onMouseEnter);
    currMap.on("mouseleave", "subway-stops-layer", onMouseLeave);
    currMap.on("click", "subway-stops-layer", onClick);

    return () => {
      currMap.off("mouseenter", "subway-stops-layer", onMouseEnter);
      currMap.off("mouseleave", "subway-stops-layer", onMouseLeave);
      currMap.off("click", "subway-stops-layer", onClick);
    };
  });

  useEffect(() => {
    const currMap = map.current;
    if (!currMap) {
      return;
    }
    currMap.getCanvas().style.cursor = cursor;
  }, [cursor, map]);

  if (!GTFS_STOPS_GEOJSON) {
    console.warn("BIKE_LANES_URL is not set");
    return null;
  }

  if (isPending || !data) {
    return null;
  }

  return (
    <Source id="subway-stops" type="geojson" data={data}>
      <Layer
        id="subway-stops-layer"
        type="symbol"
        layout={{
          "icon-image": "mta_logo",
          "icon-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10,
            0.05,
            12,
            0.06,
            16,
            0.15,
            18,
            0.25,
          ],
          "icon-allow-overlap": true,
        }}
      />
      {hoveredStation && (
        <Popup
          longitude={hoveredStation.longitude}
          latitude={hoveredStation.latitude}
          closeButton={false}
          closeOnClick={false}
          anchor="left"
          className="blur-popup blur-border popup-no-tip"
        >
          <Typography className="text-white">
            {hoveredStation.stopName}
          </Typography>
        </Popup>
      )}
    </Source>
  );
};
