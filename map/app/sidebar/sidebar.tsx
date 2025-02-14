import { RightOutlined } from "@ant-design/icons";
import {
  Button,
  Checkbox,
  DatePicker,
  Drawer,
  Space,
  Tag,
  TimePicker,
} from "antd";
import Title from "antd/es/typography/Title";
import { Dayjs } from "dayjs";
import { useState } from "react";
import { DAYS_OF_WEEK } from "../util/days-of-week";
import { CheckboxChangeEvent } from "antd/es/checkbox";

type FluxFilterProps = {
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
}

type BikeLaneLayerProps = {
  showBikeLanes: boolean;
  setShowBikeLanes: (show: boolean) => void;
}

type Props = FluxFilterProps & BikeLaneLayerProps;

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
  showBikeLanes,
  setShowBikeLanes,
}: Props) => {
  const [open, setOpen] = useState(false);

  const showDrawer = () => {
    setOpen(true);
  };

  const hideDrawer = () => {
    setOpen(false);
  };

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

  const handleBikeLaneChange = (e: CheckboxChangeEvent) => {  
    setShowBikeLanes(e.target.checked);
  }

  return open ? (
    <Drawer
      onClose={hideDrawer}
      open={open}
      placement="left"
      width={280}
      mask={false}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col">
          <Title level={5}>Layers</Title>
          <Checkbox checked={showBikeLanes} onChange={handleBikeLaneChange}>Bike lanes</Checkbox>
        </div>
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
          <div className="flex flex-row justify-between">
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
    </Drawer>
  ) : (
    <div className="absolute left-0 z-10" onClick={showDrawer}>
      <Button
        style={{
          height: "60px",
          width: "30px",
          borderRadius: "0",
          position: "absolute",
          left: 0,
          top: "50%",
          transform: "translateY(100%)",
          boxShadow: "2px 0 5px rgba(7, 7, 7, 0.1)",
        }}
        icon={<RightOutlined />}
      ></Button>
    </div>
  );
};
