import * as d3 from "d3";
import { GeoJSONFeature } from "mapbox-gl";
import { useCallback, useEffect, useState } from "react";
import { useMap } from "react-map-gl";
import { debounce } from "../util/debounce";
import { FluxProperties } from "./use-flux";

export const useFluxViewportStats = (
  flux?: GeoJSON.FeatureCollection<GeoJSON.Point, FluxProperties>
) => {
  const map = useMap();

  const fluxes = flux?.features.map((f) => f.properties.flux);
  const rides = flux?.features.map((f) => f.properties.rides);
  const minFlux = d3.min(fluxes || []);
  const maxFlux = d3.max(fluxes || []);
  const maxRides = d3.max(rides || []);
  const [viewportStats, setViewportStats] = useState(
    flux && flux
      ? { minFlux, maxFlux, maxRides }
      : {
          maxRides: 0,
          minFlux: 0,
          maxFlux: 0,
        }
  );

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
        maxRides: Math.max(...visibleRides),
        minFlux: Math.min(...visibleFluxes),
        maxFlux: Math.max(...visibleFluxes),
      });
    },
    []
  );

  useEffect(() => {
    if (flux) {
      updateViewportStats(flux.features);
    }
  }, [flux, updateViewportStats]);

  useEffect(() => {
    const currMap = map.current;

    const updateWithFeatures = debounce(() => {
      const features = currMap?.queryRenderedFeatures({
        layers: ["flux-point-layer"],
      });

      if (features) {
        updateViewportStats(features);
      }
    }, 250);

    currMap?.on("moveend", updateWithFeatures);
    currMap?.on("zoomend", updateWithFeatures);

    return () => {
      currMap?.off("moveend", updateWithFeatures);
      currMap?.off("zoomend", updateWithFeatures);
    };
  }, [map, updateViewportStats]);

  return viewportStats;
};
