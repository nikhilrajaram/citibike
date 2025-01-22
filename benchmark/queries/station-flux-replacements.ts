import {
  getRandomDaysOfWeek,
  getRandomStartDate,
  getRandomTimeOfDay,
} from "../util/random-date-filters";

export const getReplacements = async (): Promise<{
  startDate: string;
  endDate: string;
  startTime: number;
  endTime: number;
  daysOfWeek: string;
}> => {
  const startDate = await getRandomStartDate(365);
  const endDate = startDate.add(1, "year");

  const tod1 = getRandomTimeOfDay();
  const tod2 = getRandomTimeOfDay();
  const startTime = tod1 < tod2 ? tod1 : tod2;
  const endTime = tod1 >= tod2 ? tod1 : tod2;

  const daysOfWeek = getRandomDaysOfWeek().join(",");

  return {
    startDate: startDate.format("YYYY-MM-DD"),
    endDate: endDate.format("YYYY-MM-DD"),
    startTime,
    endTime,
    daysOfWeek,
  };
};
