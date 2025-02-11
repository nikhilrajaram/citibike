import { FluxPoint, useFlux } from "@/hooks/use-flux";
import {
  Camera,
  MapView,
  MarkerView,
} from "@rnmapbox/maps";
import * as d3 from "d3";
import { Dayjs } from "dayjs";
import React, { useState } from "react";
import { View } from "react-native";

const mapStyle = {
  width: "100%",
  height: "100%",
} as const;

type Props = {
  startDate: Dayjs;
  endDate: Dayjs;
  startTime: Dayjs;
  endTime: Dayjs;
  daysOfWeek: string[];
};

const FluxMap = ({
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
    <MapView style={mapStyle} styleURL="mapbox://styles/mapbox/streets-v12">
      <Camera
        centerCoordinate={[-73.984638, 40.759211]}
        zoomLevel={12}
        animationDuration={0}
      />
      {flux &&
        fluxScale &&
        rideScale &&
        flux.map((point) => {
          const flux = point.inbound - point.outbound;
          const rides = point.inbound + point.outbound;
          const fluxScaleValue = fluxScale(flux);
          const rideScaleValue = rideScale(rides);
          return (
            <MarkerView
              key={`marker-view-${point.currentStationId}`}
              coordinate={[point.longitude, point.latitude]}
            >
              <View
                style={{
                  backgroundColor: fluxScaleValue,
                  width: 10 * (rideScaleValue + 0.5),
                  height: 10 * (rideScaleValue + 0.5),
                  borderRadius: "50%",
                }}
              ></View>
            </MarkerView>
          );
        })}
    </MapView>
  );
};

export default FluxMap;
