import dayjs from "dayjs";
import { getClient } from "./get-client";

const choose = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const hoursInDay = Array(24)
  .fill(undefined)
  .map((_, i) => i);
const minutesInHour = Array(60)
  .fill(undefined)
  .map((_, i) => i);
const secondsInMinute = minutesInHour;
const daysOfWeek = Array(7)
  .fill(undefined)
  .map((_, i) => i);

export const getRandomStartDate = async (
  daysBeforeMostRecentTrip: number = 365
) => {
  const client = getClient();
  const startDateResponse = await client.query({
    query: `
      SELECT
        date_add (
          day,
          floor(
            randCanonical () * (
              date_diff ('day', min(started_at), max(started_at)) - ${daysBeforeMostRecentTrip}
            )
          ),
          min(started_at)
        ) AS startDate
      FROM
        trips;
    `,
    format: "JSON",
  });
  const [startDateObj] = (await startDateResponse.json<{ startDate: string }>())
    .data;
  const startDateStr = startDateObj.startDate;

  return dayjs(startDateStr);
};

export const getRandomTimeOfDay = () => {
  return (
    choose(hoursInDay) * 10000 +
    choose(minutesInHour) * 100 +
    choose(secondsInMinute)
  );
};

export const getRandomDaysOfWeek = () => {
  const length = Math.ceil(Math.random() * daysOfWeek.length);
  const chosenDays: number[] = [];
  while (chosenDays.length < length) {
    const chooseFrom = daysOfWeek.filter((d) => !chosenDays.includes(d));
    chosenDays.push(choose(chooseFrom));
  }

  return chosenDays;
};
