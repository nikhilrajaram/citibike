import cors from "cors";
import express from "express";
import { queryFlux } from "./flux/flux";
import { getStationsById } from "./stations/stations";

const app = express();
express.json();
app.use(cors());

const requireParam = (query: Record<string, unknown>, param: string) => {
  const value = query[param];
  if (!value) {
    throw new Error(`Missing required parameter: ${param}`);
  }

  return value.toString();
};

app.get(
  "/flux",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const startDate = requireParam(req.query, "startDate");
    const endDate = requireParam(req.query, "endDate");
    const startTime = requireParam(req.query, "startTime");
    const endTime = requireParam(req.query, "endTime");
    const daysOfWeek = req.query.daysOfWeek?.toString();

    queryFlux({ startDate, endDate, startTime, endTime, daysOfWeek }, res);
  }
);

app.get(
  "/ping",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    res.send("pong");
  }
);

const PORT = 3001;
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await getStationsById();
});
