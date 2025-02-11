import { Dayjs } from "dayjs";
import { Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { TimePicker } from "./time-picker";
import { DAYS_OF_WEEK } from "@/constants/days-of-week";
import { TimeRangePicker } from "./time-range-picker";

export const Sidebar = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  daysOfWeek,
  setDaysOfWeek,
}: {
  startDate: Dayjs;
  setStartDate: (date: Dayjs) => void;
  endDate: Dayjs;
  setEndDate: (date: Dayjs) => void;
  startTime: Dayjs;
  setStartTime: (date: Dayjs) => void;
  endTime: Dayjs;
  setEndTime: (date: Dayjs) => void;
  daysOfWeek: string[];
  setDaysOfWeek: (days: string[]) => void;
}) => {
  // TODO: make "Sidebar" a drawer on mobile
  const handleDaysOfWeekChange = (day: string, checked: boolean) => {
    setDaysOfWeek(
      checked ? [...daysOfWeek, day] : daysOfWeek.filter((d) => d !== day)
    );
  };

  const handleDateRangeChange = (dates: unknown) => {
    if (!dates || !Array.isArray(dates)) {
      return;
    }

    setStartDate(dates[0]);
    setEndDate(dates[1]);
  };

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        padding: 16,
        zIndex: 50,
        margin: 20,
        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.2)",
        elevation: 5,
      }}
    >
      <View
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <View
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Text style={{ paddingBottom: 10 }}>Time of day</Text>
          <TimeRangePicker
            startTime={startTime}
            setStartTime={setStartTime}
            endTime={endTime}
            setEndTime={setEndTime}
          />
        </View>
      </View>
    </View>
  );
};
