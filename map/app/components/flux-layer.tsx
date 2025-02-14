import { Typography } from "antd";
import Title from "antd/es/typography/Title";
import * as d3 from "d3";
import { Dayjs } from "dayjs";
import { useState } from "react";
import { Marker } from "react-map-gl";
import { FluxPoint, useFlux } from "../hooks/use-flux";

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

  const daysBetweenInclusive = endDate.diff(startDate, "day") + 1;

  const onFluxStreamEnd = (data: FluxPoint[]) => {
    setFlux(
      data.map((d) => ({
        ...d,
        // normalize to daily averages
        inbound: d.inbound / daysBetweenInclusive,
        outbound: d.outbound / daysBetweenInclusive,
      }))
    );
  };

  useFlux(
    { startDate, endDate, startTime, endTime, daysOfWeek },
    { onData: onFluxStreamEnd }
  );

  const fluxes = flux.map((f) => Math.round(f.inbound - f.outbound));
  const rides = flux.map((f) => Math.round(f.outbound + f.inbound));
  const minFlux = Math.min(...fluxes);
  const maxFlux = Math.max(...fluxes);
  const maxRides = Math.max(...rides);

  // todo: tune/configure this?
  const fluxScaleBucketWidth = 20;
  const fluxScaleBoundLow =
    Math.floor(minFlux / fluxScaleBucketWidth) *
    fluxScaleBucketWidth;
  const fluxScaleBoundHigh =
    Math.ceil(maxFlux / fluxScaleBucketWidth) *
    fluxScaleBucketWidth;
  const fluxScaleRange = fluxScaleBoundHigh - fluxScaleBoundLow;
  const fluxScaleNBuckets = fluxScaleRange / fluxScaleBucketWidth;

  /**
   * Endpoints of the flux scale buckets
   */
  const fluxScaleBucketEndpoints = Array.from(
    { length: fluxScaleNBuckets + 1 },
    (_, i) => fluxScaleBoundLow + fluxScaleBucketWidth * i
  );

  /**
   * Used to color grade the station markers on the map based on net flux
   */
  const fluxColorScale = d3
    .scaleDiverging<string>()
    .domain([fluxScaleBoundLow, 0, fluxScaleBoundHigh])
    .range(["red", "rgb(255, 237, 148)", "rgb(0, 209, 0)"]);

  /**
   * Returns the color value for a flux value
   */
  const colorGradeFlux = (flux: number) => {
    const bucketValue =
      // clamp to flux scale
      flux > fluxScaleBucketEndpoints[fluxScaleBucketEndpoints.length - 1]
        ? fluxScaleBoundHigh
        : (fluxScaleBucketEndpoints.find((b) => flux < b) as number);
    return fluxColorScale(bucketValue);
  };

  /**
   * Used to size the station markers on the map based on total rides
   */
  const rideMagnitudeScale = d3
    .scaleLinear()
    .domain([0, Math.abs(maxRides)])
    .range([0, 1]);

  const FluxPoints = () => {
    if (!flux || !fluxColorScale || !rideMagnitudeScale) {
      return null;
    }

    return flux.map((point) => {
      const flux = Math.round(point.inbound - point.outbound);
      const rides = Math.round(point.inbound + point.outbound);
      const fluxScaleValue = colorGradeFlux(flux);
      const rideScaleValue = rideMagnitudeScale(rides);
      return (
        <Marker
          latitude={point.latitude}
          longitude={point.longitude}
          anchor="bottom"
          key={`station-marker-${point.currentStationId}`}
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
      );
    });
  };

  const FluxLegend = () => {
    if (
      !fluxColorScale ||
      !fluxScaleBucketEndpoints ||
      !Number.isFinite(minFlux) ||
      !Number.isFinite(maxFlux)
    ) {
      return null;
    }

    return (
      <div className="fixed top-4 right-4 p-4 bg-white bg-opacity-75 rounded shadow-lg z-10">
        <div className="flex flex-col items-end justify-between transition-all duration-500">
          <Title level={5}>Net Daily Flux</Title>
          {Array.from({ length: fluxScaleNBuckets }, (_, i) => i).map((i) => {
            // get bucket endpoints
            const left = fluxScaleBucketEndpoints[i];
            const right = fluxScaleBucketEndpoints[i + 1];
            return (
              <div
                className="w-full items-center flex flex-row justify-between"
                key={`flux-legend-${i}`}
              >
                <div
                  style={{
                    backgroundColor: fluxColorScale(left),
                    width: "15px",
                    height: "15px",
                    borderRadius: "50%",
                    display: "inline-block",
                    marginRight: "8px",
                  }}
                />
                <div>
                  {i === 0 ? (
                    <Typography.Text>
                      More than {Math.abs(left)} outbound
                    </Typography.Text>
                  ) : i === (fluxScaleNBuckets - 1) ? (
                    <Typography.Text>
                      More than {Math.abs(left)} inbound
                    </Typography.Text>
                  ) : (
                    <Typography.Text>
                      {Math.abs(right)} - {Math.abs(left)}{" "}
                      {left > 0 ? "inbound" : "outbound"}
                    </Typography.Text>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <FluxPoints />
      <FluxLegend />
    </>
  );
};
