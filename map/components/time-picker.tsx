import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Dayjs } from "dayjs";
import React from "react";
import {Platform, StyleSheet} from 'react-native';

type Props = {
  value: Dayjs;
  onChange: (event: DateTimePickerEvent, date?: Date) => void;
};

export const TimePicker = ({ value, onChange }: Props) => {
  if (Platform.OS === 'web') {
    throw new Error('TimePicker is not supported on web');
  }
  
  return (
    <DateTimePicker
      mode="time"
      value={value.toDate()}
      onChange={onChange}
    ></DateTimePicker>
  );
};
