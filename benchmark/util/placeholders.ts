import fs from "fs";
import {
  getRandomDaysOfWeek,
  getRandomStartDate,
  getRandomTimeOfDay,
} from "./random-date-filters";

export const replaceQueryPlaceholders = (
  queryFilePath: string,
  replacements: Record<string, string>
) => {
  const query = fs.readFileSync(queryFilePath).toString();
  return Object.entries(replacements).reduce<string>(
    (acc, [key, val]) => acc.replaceAll(`{{${key}}}`, val as string),
    query
  );
};
