import * as d3 from "d3";
import { Dayjs } from "dayjs";
import { useState } from "react";
import Map, { Marker } from "react-map-gl";

import { FluxPoint, useFlux } from "./hooks/use-flux";

type Props = {
  startDate: Dayjs;
  endDate: Dayjs;
  startTime: Dayjs;
  endTime: Dayjs;
  daysOfWeek: string[];
};

export const BikeMap = ({
  startDate,
  endDate,
  startTime,
  endTime,
  daysOfWeek,
}: Props) => {
  const [flux, setFlux] = useState<FluxPoint[]>([]);
  const [fluxScale, setFluxScale] =
    useState<d3.ScaleDiverging<string, never>>();
  const [rideScale, setRideScale] = useState<d3.ScaleLinear<number, number>>();

  const onFluxStreamEnd = (data: FluxPoint[]) => {
    setFlux(data);
    const fluxes = data.map((f) => f.inbound - f.outbound);
    const rides = data.map((f) => f.outbound + f.inbound);
    const minFlux = Math.min(...fluxes);
    const maxFlux = Math.max(...fluxes);
    const minRides = Math.min(...rides);
    const maxRides = Math.max(...rides);

    const fluxScale = d3.scaleDiverging(
      [minFlux, 0, maxFlux],
      ["red", "rgb(255, 237, 148)", "rgb(0, 209, 0)"]
    );
    const rideScale = d3.scaleLinear(
      [0, Math.max(Math.abs(minRides), Math.abs(maxRides))],
      [0, 1]
    );
    setFluxScale(() => fluxScale);
    setRideScale(() => rideScale);
  };

  useFlux(
    { startDate, endDate, startTime, endTime, daysOfWeek },
    { onData: onFluxStreamEnd }
  );

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
      {flux &&
        fluxScale &&
        rideScale &&
        flux.map((point) => {
          const flux = point.inbound - point.outbound;
          const rides = point.inbound + point.outbound;
          const fluxScaleValue = fluxScale(flux);
          const rideScaleValue = rideScale(rides);
          return (
            <div key={point.currentStationId}>
              <Marker
                latitude={point.latitude}
                longitude={point.longitude}
                anchor="bottom"
              >
                <div
                  style={{
                    backgroundColor: fluxScaleValue,
                    width: `${10 * (rideScaleValue + 0.5)}px`,
                    height: `${10 * (rideScaleValue + 0.5)}px`,
                    borderRadius: "50%",
                  }}
                />
              </Marker>
            </div>
          );
        })}
    </Map>
  );
};
