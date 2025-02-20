import { emptyFeatureCollection } from "@/app/util/empty-geojson";
import { DefaultError, useQuery } from "@tanstack/react-query";
import { Typography } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { Layer, MapMouseEvent, Popup, Source, useMap } from "react-map-gl";
import { LAYERS } from "./layers";

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
      const shouldShowPopup = (map.current?.getZoom() || -Infinity) >= 12;
      if (!shouldShowPopup) {
        return;
      }
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
    [hoveredStation, map]
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

    currMap.on("mouseenter", LAYERS.SUBWAY_STOPS, onMouseEnter);
    currMap.on("mouseleave", LAYERS.SUBWAY_STOPS, onMouseLeave);
    currMap.on("click", LAYERS.SUBWAY_STOPS, onClick);

    return () => {
      currMap.off("mouseenter", LAYERS.SUBWAY_STOPS, onMouseEnter);
      currMap.off("mouseleave", LAYERS.SUBWAY_STOPS, onMouseLeave);
      currMap.off("click", LAYERS.SUBWAY_STOPS, onClick);
    };
  });

  useEffect(() => {
    const canvas = map.current?.getCanvas();
    if (!canvas?.style) {
      return;
    }
    canvas.style.cursor = cursor;
  }, [cursor, map]);

  return (
    <Source
      id="subway-stops"
      type="geojson"
      // haven't been able to get the slots working so just defaulting to an empty
      // feature collection to ensure that the layers are added in the order rendered
      // in bike-map.tsx
      data={(!isPending && data) ? data : emptyFeatureCollection}
    >
      <Layer
        id={LAYERS.SUBWAY_STOPS}
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
          offset={[10, 0]}
          className="blur-popup blur-border popup-no-tip z-1"
        >
          <Typography>{hoveredStation.stopName}</Typography>
        </Popup>
      )}
    </Source>
  );
};
