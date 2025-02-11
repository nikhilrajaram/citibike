import { ClickHouseClient, createClient } from "@clickhouse/client";

let client: ClickHouseClient;

const timeout = Math.pow(2, 31) - 1;

export const getClient = () => {
  if (!client) {
    client = createClient({
      url: "https://bibufxd4zn.us-east-1.aws.clickhouse.cloud:8443",
      username: 'default',
      password: 'nlqI9RvxKzvN_',
      request_timeout: timeout,
      clickhouse_settings: {
        mutations_sync: "1",
        session_timeout: timeout,
      },
    });
  }
  return client;
};

export const querySettings = {
  use_query_cache: 0,
  enable_reads_from_query_cache: 0,
  enable_writes_to_query_cache: 0,
  max_threads: 1,
  max_memory_usage: "8G",
} as const;
