import { createClient } from "@clickhouse/client";

let client;

export const getClient = () => {
  return (
    client ||
    createClient({
      url: "http://clickhouse:8123",
    })
  );
};
