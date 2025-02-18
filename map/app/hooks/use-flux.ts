import { useQuery } from "@tanstack/react-query";
import { Dayjs } from "dayjs";
import { useEffect, useRef } from "react";
import { DAYS_OF_WEEK_LABELS } from "../util/days-of-week";
import { daysOfWeekBetween } from "../util/days-of-week-between";
import { useFluxViewportStats } from "./use-flux-viewport-stats";

export type FluxProperties = {
  stationId: string;
  currentStationId: string;
  stationName: string;
  inbound: number;
  outbound: number;
  flux: number;
  rides: number;
};

type FluxFilter = {
  startDate: Dayjs;
  endDate: Dayjs;
  startTime: Dayjs;
  endTime: Dayjs;
  daysOfWeek: string[];
};

export const useFlux = ({
  startDate,
  endDate,
  startTime,
  endTime,
  daysOfWeek,
}: FluxFilter) => {
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

  const {
    isPending,
    data: fluxCollection,
    refetch,
    error,
  } = useQuery({
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
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_MAPSERVER_URL}/flux?${queryParams.toString()}`,
      { signal: controller.signal }
    );

    const data = (await response.json()) as GeoJSON.FeatureCollection<
      GeoJSON.Point,
      FluxProperties
    >;
    const daysInSelection = daysOfWeekBetween(
      startDate,
      endDate,
      daysOfWeek.map(
        (d) =>
          // convert to sunday start
          (DAYS_OF_WEEK_LABELS.indexOf(d) + 1) % 7
      )
    );

    return {
      ...data,
      features: data.features.map((f) => ({
        ...f,
        properties: {
          ...f.properties,
          // normalize to daily values
          inbound: Math.round(f.properties.inbound / daysInSelection),
          outbound: Math.round(f.properties.outbound / daysInSelection),
          flux: Math.round(f.properties.flux / daysInSelection),
          rides: Math.round(f.properties.rides / daysInSelection),
        },
      })),
    };
  };

  if (!isPending && !fluxCollection && error?.name === "AbortError") {
    // if the previous request was aborted, refetch
    refetch();
  }

  const fluxViewportStats = useFluxViewportStats(fluxCollection);

  return { isPending, fluxCollection, ...fluxViewportStats };
};
