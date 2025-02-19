import { createClient } from "@clickhouse/client";

let client;

export const getClient = () => {
  return (
    client ||
    createClient({
      url: process.env.CLICKHOUSE_URL,
      username: process.env.CLICKHOUSE_USER,
      password: process.env.CLICKHOUSE_PASSWORD,
    })
  );
};
