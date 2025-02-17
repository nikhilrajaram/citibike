import { Typography } from "antd";
import Title from "antd/es/typography/Title";
import * as d3 from "d3";
import { useContext, useState } from "react";
import { Marker } from "react-map-gl";
import { FluxContext } from "../context/flux-context";
import { FluxPoint, useFlux } from "../hooks/use-flux";
import { clamp } from "../util/clamp";
import { DAYS_OF_WEEK_LABELS } from "../util/days-of-week";
import { daysOfWeekBetween } from "../util/days-of-week-between";

export const FluxLayer = () => {
  const [flux, setFlux] = useState<FluxPoint[]>([]);

  const { startDate, endDate, startTime, endTime, daysOfWeek } =
    useContext(FluxContext);

  const daysInSelection = daysOfWeekBetween(
    startDate,
    endDate,
    daysOfWeek.map(
      (d) =>
        // convert to sunday start
        (DAYS_OF_WEEK_LABELS.indexOf(d) + 1) % 7
    )
  );

  const normalizedStartTime = startTime.set("date", 0);
  const normalizedEndTime = endTime.set("date", 0);
  const hoursInSelection =
    (normalizedEndTime.diff(normalizedStartTime, "hour", true) + 24) % 24;

  const onFluxStreamEnd = (data: FluxPoint[]) => {
    setFlux(
      data.map((d) => ({
        ...d,
        // normalize to hourly averages
        inbound: Math.round((d.inbound / daysInSelection) * hoursInSelection),
        outbound: Math.round((d.outbound / daysInSelection) * hoursInSelection),
      }))
    );
  };

  useFlux(
    { startDate, endDate, startTime, endTime, daysOfWeek },
    { onData: onFluxStreamEnd }
  );

  if (!flux || !flux.length) {
    return null;
  }

  const fluxes = flux.map((f) => f.inbound - f.outbound);
  const rides = flux.map((f) => f.outbound + f.inbound);
  const minFlux = d3.min(fluxes);
  const maxFlux = d3.max(fluxes);
  const maxRides = d3.max(rides);

  if (
    maxRides === undefined ||
    minFlux === undefined ||
    maxFlux === undefined ||
    maxRides === 0 ||
    (minFlux === 0 && maxFlux === 0)
  ) {
    // no information
    // todo: show message
    return null;
  }

  const absExtent = Math.max(Math.abs(minFlux), Math.abs(maxFlux));

  // todo: better binning/color grading
  // currently just uses a heuristic for binning with some hard-coded behavior
  // relies on d3.ticks to produce "nice" bins
  // uses a symmetric linear scale centered around zero for color grading
  const nBins = clamp(Math.round((maxFlux - minFlux) / 5), 2, 5);
  const ticks = d3.ticks(minFlux, maxFlux, nBins);
  const bins = d3.bin().thresholds(ticks)(fluxes);

  /**
   * Used to color grade the station markers on the map based on net flux
   */
  const fluxColorScale = d3
    .scaleLinear<string>()
    .domain([-absExtent, 0, absExtent])
    .range(["red", "rgb(255, 237, 148)", "rgb(0, 209, 0)"]);

  /**
   * Returns the color value for a flux value
   */
  const colorGradeFlux = (flux: number) => {
    // hard code yellow value
    if (flux === 0) {
      return "rgb(255, 237, 148)";
    }
    // clamp the value within the domain of the scale
    const domain = fluxColorScale.domain();
    const clampedFlux = clamp(flux, domain[0], domain[domain.length - 1]);
    const bucketValue =
      flux <= domain[0]
        ? domain[0]
        : (bins.find(
            (b) =>
              (b.x0 as number) < clampedFlux && clampedFlux <= (b.x1 as number)
          )?.x0 as number);
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
      const flux = point.inbound - point.outbound;
      const rides = point.inbound + point.outbound;
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
      !bins ||
      !Number.isFinite(minFlux) ||
      !Number.isFinite(maxFlux)
    ) {
      return null;
    }

    return (
      <div className="fixed top-4 right-4 p-4 bg-white bg-opacity-75 rounded shadow-lg z-10">
        <div className="flex flex-col items-end justify-between transition-all duration-500">
          <Title level={5}>Net Hourly Flux</Title>
          {bins.map((bin, i) => {
            // get bucket endpoints
            const left = bin.x0 as number;
            const right = bin.x1 as number;
            const colorValue =
              i === 0
                ? -absExtent
                : i === bins.length - 1
                ? absExtent
                : left < 0 && 0 < right
                ? 0
                : Math.round((left + right) / 2);

            const absLeft = Math.abs(left);
            const absRight = Math.abs(right);
            return (
              <div
                className="w-full items-center flex flex-row justify-between"
                key={`flux-legend-${i}`}
              >
                <div
                  style={{
                    backgroundColor: colorGradeFlux(colorValue),
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
                      {`> ${Math.abs(right)} departing`}
                    </Typography.Text>
                  ) : i === bins.length - 1 ? (
                    <Typography.Text>
                      {`> ${Math.abs(left)} arriving`}
                    </Typography.Text>
                  ) : (
                    <Typography.Text>
                      {Math.min(absLeft, absRight)} -{" "}
                      {Math.max(absLeft, absRight)}{" "}
                      {colorValue > 0 ? "arriving" : "departing"}
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
