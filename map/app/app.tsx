"use client";
import { DatePicker, Space, TimePicker, Typography } from "antd";
import * as d3 from "d3";
import dayjs, { Dayjs } from "dayjs";
import { useState } from "react";
import Map, { Marker, Popup } from "react-map-gl";
import { FluxPoint, useFlux } from "./hooks/use-flux";

const { Title } = Typography;

export const App = () => {
  const today = dayjs();
  const [startDate, setStartDate] = useState<Dayjs>(today.subtract(1, "year"));
  const [startTime, setStartTime] = useState<Dayjs>(
    dayjs("06:00:00", "HH:mm:ss")
  );
  const [endDate, setEndDate] = useState<Dayjs>(today);
  const [endTime, setEndTime] = useState<Dayjs>(dayjs("10:00:00", "HH:mm:ss"));

  const [flux, setFlux] = useState<FluxPoint[]>([]);
  const [fluxScale, setFluxScale] =
    useState<d3.ScaleDiverging<string, never>>();
  const [rideScale, setRideScale] =
    useState<d3.ScaleLinear<number, number>>();

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
    { startDate, endDate, startTime, endTime },
    { onData: onFluxStreamEnd }
  );

  const handleDateRangeChange = (dates: unknown) => {
    if (!dates || !Array.isArray(dates)) {
      return;
    }

    setStartDate(dates[0]);
    setEndDate(dates[1]);
  };

  const handleTimeRangeChange = (dates: unknown) => {
    if (!dates || !Array.isArray(dates)) {
      return;
    }

    setStartTime(dates[0]);
    setEndTime(dates[1]);
  };

  return (
    <div>
      <div className="absolute top-0 left-0 bg-opacity-80 bg-white p-4 z-50 margin-20 shadow-md">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <Title level={5}>Time of day</Title>
            <TimePicker.RangePicker
              format={"hh:mm a"}
              use12Hours
              value={[startTime, endTime]}
              onChange={handleTimeRangeChange}
              order={false}
            />
          </div>
          <div className="flex flex-col">
            <Title level={5}>Date range</Title>
            <Space direction="vertical" size={12}>
              <DatePicker.RangePicker
                value={[startDate, endDate]}
                onChange={handleDateRangeChange}
              />
            </Space>
          </div>
        </div>
      </div>
      <div className="w-full h-full z-0">
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
                        opacity: Math.min(1, Math.pow(rideScaleValue, 0.3) + 0.2),
                        borderRadius: "50%",
                      }}
                    />
                  </Marker>
                </div>
              );
            })}
        </Map>
      </div>
    </div>
  );
};
