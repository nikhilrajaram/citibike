import { useFluxViewportStats } from "@/app/hooks/use-flux-viewport-stats";
import { DAYS_OF_WEEK_LABELS } from "@/app/util/days-of-week";
import { daysOfWeekBetween } from "@/app/util/days-of-week-between";
import { useQuery } from "@tanstack/react-query";
import { Dayjs } from "dayjs";
import { useEffect, useRef } from "react";

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
    retry: 3,
  });

  const fetchData = async () => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const response = await fetch(`/api/flux`, {
      method: "POST",
      body: JSON.stringify({
        startDate: startDate.format("YYYYMMDD"),
        endDate: endDate.format("YYYYMMDD"),
        startTime: startTime.format("HHmmss"),
        endTime: endTime.format("HHmmss"),
        daysOfWeek: daysOfWeek.map((d) => DAYS_OF_WEEK_LABELS.indexOf(d)),
      }),
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

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
      features: data.features.map((f) => {
        // normalize to daily values
        const inbound = Math.round(f.properties.inbound / daysInSelection);
        const outbound = Math.round(f.properties.outbound / daysInSelection);
        // rely on normalized values to avoid rounding errors
        const flux = inbound - outbound;
        const rides = inbound + outbound;
        return {
          ...f,
          properties: {
            ...f.properties,
            inbound,
            outbound,
            flux,
            rides,
          },
        };
      }),
    };
  };

  if (!isPending && !fluxCollection && error?.name === "AbortError") {
    // if the previous request was aborted, refetch
    refetch();
  }

  const fluxViewportStats = useFluxViewportStats(fluxCollection);

  return { isPending, fluxCollection, ...fluxViewportStats };
};
