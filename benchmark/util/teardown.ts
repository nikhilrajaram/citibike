import { getClient } from "./get-client";

const client = getClient();

const killMutations = async () => {
  await client.exec({ query: "KILL MUTATION WHERE TRUE SYNC;" });
};

export const cleanup = async (
  beforeExit: ((...args: any[]) => Promise<void>) | undefined
) => {
  await client.exec({ query: "DROP TABLE IF EXISTS trips_baseline;" });
  await client.exec({ query: "DROP TABLE IF EXISTS trips_benchmark;" });
  await killMutations();
  if (beforeExit) {
    await beforeExit();
  }
  process.exit(0);
};
