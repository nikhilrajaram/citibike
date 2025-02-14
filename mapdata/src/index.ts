import { processBikeRoutes } from "./bike-lane-routes";

export const handler = async (event: any) => {
  console.log("Received event", event);

  const { bikeRoutes } = event;

  if (bikeRoutes === true) {
    await processBikeRoutes();
  }
};
