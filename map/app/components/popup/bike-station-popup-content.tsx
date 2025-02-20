import { FluxProperties } from "@/app/hooks/use-flux";
import { Typography } from "antd";

export const BikeStationPopupContent = (fluxProperties: FluxProperties) => {
  return (
    <div className="flex flex-col">
      <Typography.Text strong>{fluxProperties.stationName}</Typography.Text>
      <Typography.Text>
        Net flow: {fluxProperties.flux}{" "}
        {fluxProperties.flux > 0 ? "arriving" : "departing"}
      </Typography.Text>
      <Typography.Text>Total ridership: {fluxProperties.rides}</Typography.Text>
      <Typography.Text>Arrivals: {fluxProperties.inbound}</Typography.Text>
      <Typography.Text>Departures: {fluxProperties.outbound}</Typography.Text>
    </div>
  );
};
