"use client";
import dayjs, { Dayjs } from "dayjs";
import { useState } from "react";
import { BikeMap } from "./components/bike-map";
import { Sidebar } from "./sidebar/sidebar";
import { DAYS_OF_WEEK } from "./util/days-of-week";

export const App = () => {
  const today = dayjs();
  const [startDate, setStartDate] = useState<Dayjs>(today.subtract(1, "year"));
  const [startTime, setStartTime] = useState<Dayjs>(
    dayjs("06:00:00", "HH:mm:ss")
  );
  const [endDate, setEndDate] = useState<Dayjs>(today);
  const [endTime, setEndTime] = useState<Dayjs>(dayjs("10:00:00", "HH:mm:ss"));

  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(
    DAYS_OF_WEEK.slice(0, 5)
  );

  return (
    <div>
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
      <div className="w-full h-full z-0">
        <BikeMap
          showFlux
          fluxFilter={{
            startDate,
            endDate,
            startTime,
            endTime,
            daysOfWeek,
          }}
          showBikeLanes
        ></BikeMap>
      </div>
    </div>
  );
};
