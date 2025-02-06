import { createClient } from "@clickhouse/client";

let client;

export const getClient = () => {
  return (
    client ||
    createClient({
      url: "http://clickhouse:8123",
      clickhouse_settings: {
        max_threads: 1,
        max_memory_usage: "8G",
      },
    })
  );
};
