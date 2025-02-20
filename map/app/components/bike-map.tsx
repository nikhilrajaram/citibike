import { BikeLaneLayer } from "@/app/components/layers/bike-lane-layer";
import { FluxLayer } from "@/app/components/layers/flux-layer";
import { TransitLayer } from "@/app/components/layers/transit-layer";
import { LayerContext } from "@/app/context/layer-context";
import { useContext } from "react";
import Map from "react-map-gl";

export const BikeMap = () => {
  const { showFlux, showTransit, showBikeLanes } = useContext(LayerContext);
  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
      initialViewState={{
        latitude: 40.7381,
        longitude: -73.9585,
        zoom: 11,
      }}
      style={{ width: "100vw", height: "100vh" }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
    >
      {showTransit && <TransitLayer />}
      {showBikeLanes && <BikeLaneLayer />}
      {showFlux && <FluxLayer />}
    </Map>
  );
};
