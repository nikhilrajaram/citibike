import { Dayjs } from "dayjs";
import Map from "react-map-gl";
import { FluxLayer } from "./flux-layer";
import { BikeLaneLayer } from "./bike-lane-layer";

type FluxFilter = {
  startDate: Dayjs;
  endDate: Dayjs;
  startTime: Dayjs;
  endTime: Dayjs;
  daysOfWeek: string[];
};

type Props = {
  showFlux: boolean;
  fluxFilter: FluxFilter;

  showBikeLanes: boolean;
};

export const BikeMap = ({
  showFlux,
  showBikeLanes,
  fluxFilter: { startDate, endDate, startTime, endTime, daysOfWeek },
}: Props) => {
  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
      initialViewState={{
        latitude: 40.7381,
        longitude: -73.9585,
        zoom: 11,
      }}
      style={{ width: "100vw", height: "100vh" }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
    >
      {showFlux && (
        <FluxLayer
          startDate={startDate}
          endDate={endDate}
          startTime={startTime}
          endTime={endTime}
          daysOfWeek={daysOfWeek}
        ></FluxLayer>
      )}
      {showBikeLanes && <BikeLaneLayer/>}
    </Map>
  );
};
