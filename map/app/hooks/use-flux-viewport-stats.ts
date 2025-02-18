import * as d3 from "d3";
import { GeoJSONFeature } from "mapbox-gl";
import { useCallback, useEffect, useState } from "react";
import { useMap } from "react-map-gl";
import { debounce } from "../util/debounce";
import { FluxProperties } from "./use-flux";

/**
 * Gets statistics for flux values in the current viewport
 */
export const useFluxViewportStats = (
  flux?: GeoJSON.FeatureCollection<GeoJSON.Point, FluxProperties>
) => {
  const map = useMap();

  const [viewportStats, setViewportStats] = useState({
    maxRides: 0,
    minFlux: 0,
    maxFlux: 0,
  });

  const updateViewportStats = useCallback(
    (
      features:
        | GeoJSON.Feature<GeoJSON.Point, FluxProperties>[]
        | GeoJSONFeature[]
    ) => {
      if (features.length === 0) {
        return;
      }

      const visibleFluxes = features.map((f) => f.properties?.flux as number);
      const visibleRides = features.map((f) => f.properties?.rides as number);

      setViewportStats({
        maxRides: d3.max(visibleRides) || 0,
        minFlux: d3.min(visibleFluxes) || 0,
        maxFlux: d3.max(visibleFluxes) || 0,
      });
    },
    []
  );

  // set initial stats
  useEffect(() => {
    const currMap = map.current;
    const features =
      currMap?.queryRenderedFeatures({
        layers: ["flux-point-layer"],
      }) || flux?.features;
    if (features) {
      updateViewportStats(features);
    }
  }, [flux, map, updateViewportStats]);

  // update stats on viewport change
  useEffect(() => {
    const currMap = map.current;

    const debouncedUpdate = debounce(() => {
      const features = currMap?.queryRenderedFeatures({
        layers: ["flux-point-layer"],
      });

      if (features) {
        updateViewportStats(features);
      }
    }, 10);

    currMap?.on("move", debouncedUpdate);
    currMap?.on("zoom", debouncedUpdate);
    currMap?.on("moveend", debouncedUpdate);
    currMap?.on("zoomend", debouncedUpdate);

    return () => {
      currMap?.off("move", debouncedUpdate);
      currMap?.off("zoom", debouncedUpdate);
      currMap?.off("moveend", debouncedUpdate);
      currMap?.off("zoomend", debouncedUpdate);
    };
  }, [map, updateViewportStats]);

  return viewportStats;
};
