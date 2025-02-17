import dayjs, { Dayjs } from "dayjs";
import { createContext, useState } from "react";
import { DAYS_OF_WEEK_LABELS } from "../util/days-of-week";

type FluxFilter = {
  startDate: Dayjs;
  endDate: Dayjs;
  startTime: Dayjs;
  endTime: Dayjs;
  daysOfWeek: string[];
};

type FluxFilterSetters = {
  setStartDate: (date: Dayjs) => void;
  setEndDate: (date: Dayjs) => void;
  setStartTime: (time: Dayjs) => void;
  setEndTime: (time: Dayjs) => void;
  setDaysOfWeek: (days: string[]) => void;
};

type FluxContextType = FluxFilter & FluxFilterSetters;

const today = dayjs();
const initialStartDate = today.subtract(1, "year");
const initialEndDate = today;
// dayjs objects without a date don't play nice with the antd time range picker so we
// default them to today
const initialStartTime = dayjs(
  `${today.format("YYYY-MM-DD")} 06:00:00`,
  "HH:mm:ss"
);
const initialEndTime = dayjs(
  `${today.format("YYYY-MM-DD")} 10:00:00`,
  "HH:mm:ss"
);
const initialDaysOfWeek = DAYS_OF_WEEK_LABELS.slice(0, 5);

/**
 * Context for managing the flux filter state
 */
export const FluxContext = createContext<FluxContextType>({
  startDate: initialStartDate,
  endDate: initialEndDate,
  startTime: initialStartTime,
  endTime: initialEndTime,
  daysOfWeek: initialDaysOfWeek,
  setStartDate: () => {},
  setEndDate: () => {},
  setStartTime: () => {},
  setEndTime: () => {},
  setDaysOfWeek: () => {},
});

export const FluxProvider = ({ children }: { children: React.ReactNode }) => {
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [daysOfWeek, setDaysOfWeek] = useState(initialDaysOfWeek);

  return (
    <FluxContext.Provider
      value={{
        startDate,
        endDate,
        startTime,
        endTime,
        daysOfWeek,
        setStartDate,
        setEndDate,
        setStartTime,
        setEndTime,
        setDaysOfWeek,
      }}
    >
      {children}
    </FluxContext.Provider>
  );
};
