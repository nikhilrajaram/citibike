import { getClient } from "./get-client";

const client = getClient();

const cloneTable = async (source: string, target: string, n?: number) => {
  console.log(`cloning ${source} into ${target}`);
  await client.command({
    query: `CREATE TABLE IF NOT EXISTS ${target} AS ${source};`,
  });
  await client.command({
    query: `INSERT INTO ${target} SELECT * FROM ${source} ${
      n === undefined ? "" : `LIMIT ${n}`
    };`,
  });
};

export const beforeAllOptimizations = async () => {
  console.log("starting setup");

  const time = new Date().getTime();
  await cloneTable("trips", "trips_baseline");
  await cloneTable("trips_baseline", "trips_benchmark");

  const elapsed = new Date().getTime() - time;
  console.log(`setup complete in (${elapsed / 1000}s)`);
};

const ensureTripsBenchmark = async () => {
  const response = await client.query({
    query: "SELECT COUNT(*) AS c FROM trips_benchmark;",
    format: "JSON",
  });
  const count = await response.json<{ c: string }>();
  if (count.data[0].c === "0") {
    await cloneTable("trips_baseline", "trips_benchmark");
  }
};

export const beforeOptimization = async (config: any) => {
  if (config.willRepopulate) {
    await ensureTripsBenchmark();
  }
};
