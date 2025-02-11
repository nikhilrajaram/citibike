import { DAYS_OF_WEEK } from "@/constants/days-of-week";
import Mapbox from "@rnmapbox/maps";
import dayjs, { Dayjs } from "dayjs";
import React, { useState } from "react";
import FluxMap from "./flux-map";
import { Sidebar } from "./sidebar";

const BikeMap = () => {
  Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || null);
  const today = dayjs();
  const [startDate, setStartDate] = useState<Dayjs>(today.subtract(1, "year"));
  const [startTime, setStartTime] = useState<Dayjs>(
    dayjs(`${startDate.format("YYYY-MM-DD")} 06:00:00`, "YYYY-MM-DD HH:mm:ss")
  );
  const [endDate, setEndDate] = useState<Dayjs>(today);
  const [endTime, setEndTime] = useState<Dayjs>(
    dayjs(`${endDate.format("YYYY-MM-DD")} 10:00:00`, "YYYY-MM-DD HH:mm:ss")
  );

  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(
    DAYS_OF_WEEK.slice(0, 5)
  );

  return (
    <>
      <Sidebar
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        startTime={startTime}
        setStartTime={setStartTime}
        endTime={endTime}
        setEndTime={setEndTime}
        daysOfWeek={daysOfWeek}
        setDaysOfWeek={setDaysOfWeek}
      ></Sidebar>
      <FluxMap
        startDate={startDate}
        endDate={endDate}
        startTime={startTime}
        endTime={endTime}
        daysOfWeek={daysOfWeek}
      ></FluxMap>
    </>
  );
};

export default BikeMap;
