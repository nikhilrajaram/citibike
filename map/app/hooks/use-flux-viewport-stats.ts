import * as d3 from "d3";
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

  const updateViewportStats = useCallback(() => {
    const currMap = map.current;
    let features: GeoJSON.Feature[] | undefined = flux?.features;
    if (currMap?.getLayer("flux-point-layer")) {
      features = currMap?.queryRenderedFeatures({
        layers: ["flux-point-layer"],
      });
    }
    if (!features || features.length === 0) {
      return;
    }

    const visibleFluxes = features.map((f) => f.properties?.flux as number);
    const visibleRides = features.map((f) => f.properties?.rides as number);

    setViewportStats({
      maxRides: d3.max(visibleRides) || 0,
      minFlux: d3.min(visibleFluxes) || 0,
      maxFlux: d3.max(visibleFluxes) || 0,
    });
  }, [flux?.features, map]);

  // set initial stats
  useEffect(() => {
    updateViewportStats();
  }, [flux, map, updateViewportStats]);

  // update stats on viewport change
  useEffect(() => {
    const currMap = map.current;

    const debouncedUpdate = debounce(() => {
      updateViewportStats();
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
  }, [flux?.features, map, updateViewportStats]);

  return viewportStats;
};
