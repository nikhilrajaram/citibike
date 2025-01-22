import { ClickHouseClient, createClient } from "@clickhouse/client";

let client: ClickHouseClient;

const timeout = Math.pow(2, 31) - 1;

export const getClient = () => {
  if (!client) {
    client = createClient({
      url: "http://localhost:8123",
      request_timeout: timeout,
      clickhouse_settings: {
        mutations_sync: "1",
        session_timeout: timeout,
      },
    });
  }
  return client;
};
