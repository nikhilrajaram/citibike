import { DatePicker, Space, Tag, TimePicker } from "antd";
import Title from "antd/es/typography/Title";
import { Dayjs } from "dayjs";
import { DAYS_OF_WEEK } from "./util/days-of-week";

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
  const handleTimeRangeChange = (dates: unknown) => {
    if (!dates || !Array.isArray(dates)) {
      return;
    }

    setStartTime(dates[0]);
    setEndTime(dates[1]);
  };

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
    <div className="absolute top-0 left-0 bg-opacity-80 bg-white p-4 z-50 margin-20 shadow-md">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col">
          <Title level={5}>Time of day</Title>
          <TimePicker.RangePicker
            format={"hh:mm a"}
            use12Hours
            value={[startTime, endTime]}
            onChange={handleTimeRangeChange}
            order={false}
          />
        </div>
        <div className="flex flex-col">
          <Title level={5}>Day of week</Title>
          <div className="flex flex-row">
            {DAYS_OF_WEEK.map((day) => (
              <Tag.CheckableTag
                key={day}
                checked={daysOfWeek.includes(day)}
                onChange={(checked) => handleDaysOfWeekChange(day, checked)}
              >
                {day.charAt(0).toUpperCase()}
              </Tag.CheckableTag>
            ))}
          </div>
        </div>
        <div className="flex flex-col">
          <Title level={5}>Date range</Title>
          <Space direction="vertical" size={12}>
            <DatePicker.RangePicker
              value={[startDate, endDate]}
              onChange={handleDateRangeChange}
            />
          </Space>
        </div>
      </div>
    </div>
  );
};
