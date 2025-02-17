import { useContext } from "react";
import Map from "react-map-gl";
import { LayerContext } from "../context/layer-context";
import { BikeLaneLayer } from "./bike-lane-layer";
import { FluxLayer } from "./flux-layer";

export const BikeMap = () => {
  const { showFlux, showBikeLanes } = useContext(LayerContext);
  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
      initialViewState={{
        latitude: 40.7381,
        longitude: -73.9585,
        zoom: 11,
      }}
      style={{ width: "100vw", height: "100vh" }}
      mapStyle="mapbox://styles/mapbox/light-v11"
    >
      {showFlux && <FluxLayer />}
      {showBikeLanes && <BikeLaneLayer />}
    </Map>
  );
};
