import { useQuery } from "@tanstack/react-query";
import { Dayjs } from "dayjs";
import { useEffect, useRef } from "react";
import { DAYS_OF_WEEK_LABELS } from "../util/days-of-week";

export type FluxPoint = {
  stationId: string;
  currentStationId: string;
  stationName: string;
  latitude: number;
  longitude: number;
  inbound: number;
  outbound: number;
};

export const useFlux = ({
  startDate,
  endDate,
  startTime,
  endTime,
  daysOfWeek,
}: {
  startDate: Dayjs;
  endDate: Dayjs;
  startTime: Dayjs;
  endTime: Dayjs;
  daysOfWeek: string[];
}) => {
  const abortControllerRef = useRef<AbortController | null>(null);

  const formatParams = () => {
    return {
      startDate: startDate.format("YYYYMMDD"),
      endDate: endDate.format("YYYYMMDD"),
      startTime: startTime.format("HHmmss"),
      endTime: endTime.format("HHmmss"),
      daysOfWeek: daysOfWeek
        .map((d) => DAYS_OF_WEEK_LABELS.indexOf(d))
        .join(","),
    };
  };

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  });

  const { isPending, data: flux } = useQuery({
    queryKey: [
      "flux",
      startDate.format("YYYYMMDD"),
      endDate.format("YYYYMMDD"),
      startTime.format("HHmmss"),
      endTime.format("HHmmss"),
      daysOfWeek.sort().join(","),
    ],
    queryFn: () => {
      return fetchData();
    },
    // cache data for 5 minutes
    staleTime: 1000 * 60 * 10,
  });

  const fetchData = async () => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const queryParams = new URLSearchParams(formatParams());
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_MAPSERVER_URL
        }/flux?${queryParams.toString()}`,
        { signal: controller.signal }
      );

      const data = await response.json();
      return data as FluxPoint[];
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") {
        console.error(e);
      }
      return [];
    }
  };

  return { isPending, flux };
};
