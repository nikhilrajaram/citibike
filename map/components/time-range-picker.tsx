import { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { TimePicker as WebTimePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { Platform, View } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';

import { TimePicker } from "./time-picker";

type Props = {
  startTime: Dayjs;
  setStartTime: (date: Dayjs) => void;
  endTime: Dayjs;
  setEndTime: (date: Dayjs) => void;
};

export const TimeRangePicker = ({
  startTime,
  setStartTime,
  endTime,
  setEndTime,
}: Props) => {
  const handleTimeRangeChangeWeb = (dates: unknown) => {
    if (!dates || !Array.isArray(dates)) {
      return;
    }

    setStartTime(dates[0]);
    setEndTime(dates[1]);
  };

  const handleTimeChangeNative =
    (setter: (date: Dayjs) => void) =>
    (event: DateTimePickerEvent, date?: Date) => {
      if (date) {
        setter(dayjs(date));
      }
    };

  if (Platform.OS === "web") {
    return (
      <WebTimePicker.RangePicker
        format={"hh:mm a"}
        use12Hours
        value={[startTime, endTime]}
        onChange={handleTimeRangeChangeWeb}
        order={false}
      />
    );
  }

  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <TimePicker
        value={startTime}
        onChange={handleTimeChangeNative(setStartTime)}
      ></TimePicker>
      <AntDesign name="swapright" size={24} color="gray" style={{paddingLeft: 10}}/>
      <TimePicker
        value={endTime}
        onChange={handleTimeChangeNative(setEndTime)}
      ></TimePicker>
    </View>
  );
};
