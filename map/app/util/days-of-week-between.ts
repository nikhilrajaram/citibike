import { Dayjs } from "dayjs";

const getWeekStart = (date: Dayjs) => {
  return date.add(-date.day(), "day");
};

const getWeekEnd = (date: Dayjs) => {
  return date.add(6 - date.day(), "day");
};

/**
 * Given a start and end date as well as a day of week selection, returns the number of
 * applicable days between the start and end date (inclusive).
 */
export const daysOfWeekBetween = (
  start: Dayjs,
  end: Dayjs,
  daysOfWeek: number[]
) => {
  const weekStart = getWeekStart(start);
  const weekEnd = getWeekEnd(end);
  const weeksBetween = weekEnd.diff(weekStart, "week") + 1;
  const withExcess = weeksBetween * daysOfWeek.length;
  const excess =
    daysOfWeek.filter((d) => d < start.day()).length +
    daysOfWeek.filter((d) => d > end.day()).length;

  return withExcess - excess;
};
