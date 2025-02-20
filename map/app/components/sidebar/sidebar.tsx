import { FluxContext } from "@/app/context/flux-context";
import { LayerContext } from "@/app/context/layer-context";
import { DAYS_OF_WEEK_LABELS } from "@/app/util/days-of-week";
import { RightOutlined, UpOutlined } from "@ant-design/icons";
import {
  Button,
  Checkbox,
  DatePicker,
  Drawer,
  Space,
  Tag,
  TimePicker,
} from "antd";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import { RangePickerProps } from "antd/es/date-picker";
import Title from "antd/es/typography/Title";
import { useContext, useState } from "react";
import { useWindowSize } from "usehooks-ts";

export const Sidebar = () => {
  const {
    showFlux,
    showTransit,
    setShowFlux,
    showBikeLanes,
    setShowTransit,
    setShowBikeLanes,
  } = useContext(LayerContext);

  const {
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
  } = useContext(FluxContext);

  const [open, setOpen] = useState(true);

  const { width, height } = useWindowSize();

  const [isDayFilterDisabled, setIsDayFilterDisabled] = useState<boolean>(
    endDate.diff(startDate, "day") < 7
  );

  const showDrawer = () => {
    setOpen(true);
  };

  const hideDrawer = () => {
    setOpen(false);
  };

  const handleShowFluxChange = (e: CheckboxChangeEvent) => {
    setShowFlux(e.target.checked);
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

  const handleDateRangeChange = (
    dates: Parameters<NonNullable<RangePickerProps["onChange"]>>[0]
  ) => {
    if (!dates) {
      return;
    }

    const [start, end] = dates;
    if (!start || !end) {
      return;
    }

    const daysBetween = end.diff(start, "day");
    if (daysBetween < 7) {
      const newDaysOfWeek = [];
      for (let i = 0; i < 7; i++) {
        if (i <= daysBetween) {
          newDaysOfWeek.push(start.add(i, "day").format("dddd"));
        } else {
        }
      }
      setDaysOfWeek(newDaysOfWeek);
      setIsDayFilterDisabled(true);
    } else {
      setIsDayFilterDisabled(false);
    }

    setStartDate(start);
    setEndDate(end);
  };

  const handleShowTransitChange = (e: CheckboxChangeEvent) => {
    setShowTransit(e.target.checked);
  };

  const handleShowBikeLaneChange = (e: CheckboxChangeEvent) => {
    setShowBikeLanes(e.target.checked);
  };

  const isHorizontallyOriented = !width || !height || width > height;

  const buttonStyle = {
    position: "fixed",
    top: isHorizontallyOriented ? "calc(25% - 30px)" : undefined,
    left: isHorizontallyOriented ? 0 : "calc(50% - 30px)",
    height: isHorizontallyOriented ? "60px" : "30px",
    width: isHorizontallyOriented ? "30px" : "60px",
    borderRadius: "0",
    boxShadow: "2px 0 5px rgba(7, 7, 7, 0.1)",
  } as const;

  const drawerStyle = {
    placement: isHorizontallyOriented ? "left" : "bottom",
    width: isHorizontallyOriented ? 290 : undefined,
    height: isHorizontallyOriented ? undefined : 200,
    mask: false,
  } as const;

  const icon = isHorizontallyOriented ? <RightOutlined /> : <UpOutlined />;

  return open ? (
    <Drawer onClose={hideDrawer} open={open} {...drawerStyle}>
      <div className="flex flex-col gap-4">
        <Title level={4}>Layers</Title>
        <div className="flex flex-col">
          <Checkbox checked={showFlux} onChange={handleShowFluxChange}>
            Flux
          </Checkbox>
          <Checkbox checked={showTransit} onChange={handleShowTransitChange}>
            Transit
          </Checkbox>
          <Checkbox checked={showBikeLanes} onChange={handleShowBikeLaneChange}>
            Bike lanes
          </Checkbox>
        </div>
        <Title level={4}>Filters</Title>
        <div className="flex flex-col">
          <Title level={5}>Date range</Title>
          <Space direction="vertical" size={12}>
            <DatePicker.RangePicker
              value={[startDate, endDate]}
              onChange={handleDateRangeChange}
            />
          </Space>
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
            {DAYS_OF_WEEK_LABELS.map((day) => (
              <span
                key={`span-${day}`}
                style={
                  isDayFilterDisabled
                    ? {
                        opacity: 0.5,
                        pointerEvents: "none",
                      }
                    : {}
                }
              >
                <Tag.CheckableTag
                  key={day}
                  checked={daysOfWeek.includes(day)}
                  onChange={(checked) => handleDaysOfWeekChange(day, checked)}
                >
                  {day.charAt(0).toUpperCase()}
                </Tag.CheckableTag>
              </span>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  ) : (
    <div className="relative z-10" onClick={showDrawer}>
      <Button style={buttonStyle} icon={icon}></Button>
    </div>
  );
};
