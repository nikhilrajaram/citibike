import { Dayjs } from "dayjs";
import { useState } from "react";
import { Marker } from "react-map-gl";
import { FluxPoint, useFlux } from "../hooks/use-flux";
import * as d3 from "d3";

export type FluxFilter = {
  startDate: Dayjs;
  endDate: Dayjs;
  startTime: Dayjs;
  endTime: Dayjs;
  daysOfWeek: string[];
};

export const FluxLayer = ({
  startDate,
  endDate,
  startTime,
  endTime,
  daysOfWeek,
}: FluxFilter) => {
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
    const maxRides = Math.max(...rides);

    const fluxScale = d3.scaleDiverging(
      [minFlux, 0, maxFlux],
      ["red", "rgb(255, 237, 148)", "rgb(0, 209, 0)"]
    );
    const rideScale = d3.scaleLinear(
      [0, Math.abs(maxRides)],
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
    flux &&
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
    })
  );
};
