import fs from "fs";
import path from "path";

import { getClient } from "./get-client";

const client = getClient();

export const runScriptsInFolder = async (
  folder: string,
  attemptAll: boolean = false
) => {
  const scriptsStatements = fs
    .readdirSync(folder)
    .sort()
    .map((fname) => [
      fname,
      fs.readFileSync(path.join(folder, fname)).toString(),
    ]);

  for (let [fname, statement] of scriptsStatements) {
    const meta = { statement, description: fname };
    console.log("running script", meta);
    const startTime = new Date().getTime();
    try {
      await client.command({ query: statement });
      console.log("ran script", {
        ...meta,
        elapsed: (new Date().getTime() - startTime) / 1000,
      });
    } catch (err) {
      if (!attemptAll) {
        throw err;
      } else {
        console.log("error running script", {
          ...meta,
          elapsed: (new Date().getTime() - startTime) / 1000,
        });
        console.error(err);
      }
    }
  }
};
