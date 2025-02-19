import { processBikeRoutes } from "./bike-lane-routes";
import { processGTFS } from "./gtfs";

const main = async () => {
  const args = process.argv.slice(2);

  if (args.includes("--bikeRoutes")) {
    await processBikeRoutes();
  }
  if (args.includes("--gtfs")) {
    await processGTFS();
  }
};

main()
  .then(() => {
    console.log("success");
  })
  .catch((e) => {
    console.error(e);
  });
