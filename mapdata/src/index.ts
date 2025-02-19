import { processBikeRoutes } from "./bike-lane-routes";
import { processGTFS } from "./gtfs";

export const handler = async (event: any) => {
  console.log("Received event", event);

  const { bikeRoutes, gtfs } = event;

  if (bikeRoutes === true) {
    await processBikeRoutes();
  }
  if (gtfs === true) {
    await processGTFS();
  }
};
