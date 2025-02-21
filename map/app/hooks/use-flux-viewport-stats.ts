import { LAYERS } from "@/app/components/layers/layers";
import { FluxProperties } from "@/app/hooks/use-flux";
import * as d3 from "d3";
import { MapSourceDataEvent } from "mapbox-gl";
import { useCallback, useEffect, useState } from "react";
import { useMap } from "react-map-gl";
import { useDebounceCallback } from "usehooks-ts";

/**
 * Gets statistics for flux values in the current viewport
 */
export const useFluxViewportStats = (
  flux?: GeoJSON.FeatureCollection<GeoJSON.Point, FluxProperties>
) => {
  const map = useMap();

  const [viewportStats, setViewportStats] = useState({
    maxRides: -Infinity,
    minFlux: Infinity,
    maxFlux: -Infinity,
  });

  /**
   * Query the map for features in view and return summary stats
   */
  const updateViewportStats = useCallback(() => {
    const currMap = map.current;
    let features: GeoJSON.Feature[] | undefined = flux?.features;
    if (currMap?.getLayer(LAYERS.FLUX)) {
      features = currMap?.queryRenderedFeatures({
        layers: [LAYERS.FLUX],
      });
    }
    if (!features || features.length === 0) {
      return;
    }

    const visibleFluxes = features.map((f) => f.properties?.flux as number);
    const visibleRides = features.map((f) => f.properties?.rides as number);

    setViewportStats((prev) => ({
      maxRides: d3.max(visibleRides) || prev.maxRides,
      minFlux: d3.min(visibleFluxes) || prev.minFlux,
      maxFlux: d3.max(visibleFluxes) || prev.maxFlux,
    }));
  }, [flux?.features, map]);

  /**
   * Data load listener to update when viewport is not global
   */
  const handleDataLoad = useCallback(
    (e: MapSourceDataEvent) => {
      if (e.isSourceLoaded) {
        updateViewportStats();
      }
    },
    [updateViewportStats]
  );

  /**
   * Debounced listener for other move/zoom events
   */
  const debouncedUpdateViewportStats = useDebounceCallback(
    updateViewportStats,
    100
  );

  // set initial stats
  useEffect(() => {
    updateViewportStats();
  }, [updateViewportStats]);

  // update stats on viewport change
  useEffect(() => {
    const currMap = map.current;

    currMap?.on("sourcedata", handleDataLoad);
    currMap?.on("move", debouncedUpdateViewportStats);
    currMap?.on("zoom", debouncedUpdateViewportStats);
    currMap?.on("moveend", debouncedUpdateViewportStats);
    currMap?.on("zoomend", debouncedUpdateViewportStats);

    return () => {
      currMap?.off("sourcedata", handleDataLoad);
      currMap?.off("move", debouncedUpdateViewportStats);
      currMap?.off("zoom", debouncedUpdateViewportStats);
      currMap?.off("moveend", debouncedUpdateViewportStats);
      currMap?.off("zoomend", debouncedUpdateViewportStats);
    };
  }, [flux?.features, map, handleDataLoad, debouncedUpdateViewportStats]);

  return viewportStats;
};
