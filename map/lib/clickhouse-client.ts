import { createClient } from "@clickhouse/client";

const querySettings = {
  // todo: tune for production
  // https://altinity.com/blog/unraveling-the-mystery-of-idle-threads-in-clickhouse
  // max_threads: 1,
  // max_memory_usage: "8G",
} as const;

export const getClient = () =>
  createClient({
    url: process.env.CLICKHOUSE_URL,
    username: process.env.CLICKHOUSE_USER,
    password: process.env.CLICKHOUSE_PASSWORD,
    clickhouse_settings: querySettings,
  });
