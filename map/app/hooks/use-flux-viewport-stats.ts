import { LAYERS } from "@/app/components/layers/layers";
import { FluxProperties } from "@/app/hooks/use-flux";
import * as d3 from "d3";
import { useEffect, useState } from "react";
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
    maxRides: 0,
    minFlux: 0,
    maxFlux: 0,
  });

  const updateViewportStats = useDebounceCallback(() => {
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

    setViewportStats({
      maxRides: d3.max(visibleRides) || 0,
      minFlux: d3.min(visibleFluxes) || 0,
      maxFlux: d3.max(visibleFluxes) || 0,
    });
  }, 50);

  // set initial stats
  useEffect(() => {
    updateViewportStats();
  }, [flux, map, updateViewportStats]);

  // update stats on viewport change
  useEffect(() => {
    const currMap = map.current;

    currMap?.on("move", updateViewportStats);
    currMap?.on("zoom", updateViewportStats);
    currMap?.on("moveend", updateViewportStats);
    currMap?.on("zoomend", updateViewportStats);

    return () => {
      currMap?.off("move", updateViewportStats);
      currMap?.off("zoom", updateViewportStats);
      currMap?.off("moveend", updateViewportStats);
      currMap?.off("zoomend", updateViewportStats);
    };
  }, [flux?.features, map, updateViewportStats]);

  return viewportStats;
};
