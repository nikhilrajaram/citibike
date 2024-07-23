import { Dayjs } from "dayjs";
import { useEffect } from "react";

export type FluxPoint = {
  stationId: string;
  currentStationId: string;
  stationName: string;
  latitude: number;
  longitude: number;
  inbound: number;
  outbound: number;
};

export const useFlux = (
  {
    startDate,
    endDate,
    startTime,
    endTime,
  }: {
    startDate: Dayjs;
    endDate: Dayjs;
    startTime: Dayjs;
    endTime: Dayjs;
  },
  {
    onData,
  }: {
    onData: (data: FluxPoint[]) => void;
  }
) => {
  const formatParams = () => {
    return {
      startDate: startDate.format("YYYYMMDD"),
      endDate: endDate.format("YYYYMMDD"),
      startTime: startTime.format("HHmmss"),
      endTime: endTime.format("HHmmss"),
    };
  };

  const fetchData = async () => {
    const queryParams = new URLSearchParams(formatParams());
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_MAPSERVER_URL
        }/flux?${queryParams.toString()}`
      );

      const reader = response.body?.getReader();
      if (!reader) {
        return;
      }
      const decoder = new TextDecoder("utf-8");

      let buffer = "";
      const data: FluxPoint[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.trim()) {
            try {
              const {
                stationId,
                currentStationId,
                stationName,
                latitude,
                longitude,
                inbound,
                outbound,
              } = JSON.parse(line);
              const fluxPoint = {
                stationId,
                currentStationId,
                stationName,
                latitude,
                longitude,
                inbound,
                outbound,
              };
              data.push(fluxPoint);
            } catch (_e) {
              buffer = line;
            }
          }
        }
      }
      onData(data);
    } catch (e) {
      console.error(e);
      onData([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, [JSON.stringify(formatParams())]);
};
