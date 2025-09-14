import express from "express";
import cookieParser from "cookie-parser";
import "dotenv/config";
import router from "./router";
import cors from "cors";
import { loadBackendConfig } from "./config";
import { errorHandler } from "./middleware/errorHandler";
import {
  tradePusher,
  httpPusher,
  engineResponsePuller,
} from "@repo/redis/queue";
import { responseLoopObj } from "./utils/responseLoop";

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection", reason);
  process.exitCode = 1;
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception", err);
  process.exitCode = 1;
  process.exit(1);
});

const SHUTDOWN_TIMEOUT_MS = 5_000;

const config = loadBackendConfig();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  })
);

app.use("/api/v1", router);

app.use(errorHandler);

let server: ReturnType<express.Express["listen"]> | undefined;

(async () => {
  try {
    await engineResponsePuller.connect();
  } catch (err) {
    console.error("Backend failed to connect response loop Redis", err);
    process.exit(1);
  }
  responseLoopObj.start();
  server = app.listen(config.HTTP_PORT, () => {
    console.log(`Server started at ${config.HTTP_PORT}`);
  });
})();

let shuttingDown = false;

async function gracefulShutdown(): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  const s = server;
  if (s) {
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        console.error("Backend shutdown timeout");
        resolve();
      }, SHUTDOWN_TIMEOUT_MS);

      s.close(() => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  try {
    await Promise.race([
      Promise.all([
        tradePusher.quit(),
        httpPusher.quit(),
        engineResponsePuller.quit(),
      ]),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Redis close timeout")), 2000)
      ),
    ]);
  } catch (err) {
    console.error("Redis close error", err);
  }

  process.exit(0);
}

process.on("SIGTERM", () => {
  void gracefulShutdown();
});
process.on("SIGINT", () => {
  void gracefulShutdown();
});
