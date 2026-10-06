import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import routes from "./routes";
import { notFoundHandler, errorHandler } from "./middleware/error.middleware";
import { config } from "./config/env";

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  // CORS_ORIGINS locks this down to known frontend domains once set (production); left unset,
  // this stays permissive for local dev — see config/env.ts.
  app.use(cors(config.corsOrigins ? { origin: config.corsOrigins } : undefined));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", service: "medireach-api" });
  });

  app.use("/api", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
