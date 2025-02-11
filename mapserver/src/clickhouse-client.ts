import { createClient } from "@clickhouse/client";

let client;

export const getClient = () => {
  return (
    client ||
    createClient({
      url: "https://bibufxd4zn.us-east-1.aws.clickhouse.cloud:8443",
      username: 'default',
      password: 'nlqI9RvxKzvN_',
      clickhouse_settings: {
        max_threads: 1,
        max_memory_usage: "8G",
      },
    })
  );
};
