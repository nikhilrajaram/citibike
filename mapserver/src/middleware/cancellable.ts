import express from "express";

export const cancellable = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  res.locals.abortController = new AbortController();
  req.on("close", () => {
    if (!res.writableEnded) {
      res.locals.abortController.abort();
    }
  });
  next();
};
