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
  console.error("\n\nUnhandled rejection", reason);
  process.exitCode = 1;
});
process.on("uncaughtException", (err) => {
  console.error("\n\nUncaught exception", err);
  process.exitCode = 1;
  process.exit(1);
});

const SHUTDOWN_TIMEOUT_MS = 5_000;

const config = loadBackendConfig();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
    console.log(`\n\n[Backend] Incoming ${req.method} ${req.url}`);
    console.log(`[Backend] Origin: ${req.headers.origin}`);
    console.log(`[Backend] Configured CORS_ORIGIN: ${config.CORS_ORIGIN}`);
    next();
});

app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  })
);

app.use((req, res, next) => {
    const start = Date.now();
    console.log(`\n\n[Backend] Incoming ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log(`\n\n[Backend] Body: ${JSON.stringify(req.body).slice(0, 500)}`);
    }
    if (req.query && Object.keys(req.query).length > 0) {
        console.log(`\n\n[Backend] Query: ${JSON.stringify(req.query)}`);
    }
    
    res.on("finish", () => {
        const duration = Date.now() - start;
        console.log(`\n\n[Backend] Completed ${req.method} ${req.url} ${res.statusCode} in ${duration}ms`);
    });
    next();
});

app.use("/api/v1", router);

app.use(errorHandler);

let server: ReturnType<express.Express["listen"]> | undefined;

(async () => {
  try {
    await engineResponsePuller.connect();
  } catch (err) {
    console.error("\n\nBackend failed to connect response loop Redis", err);
    process.exit(1);
  }
  responseLoopObj.start();
  server = app.listen(config.HTTP_PORT, () => {
    console.log(`\n\nServer started at ${config.HTTP_PORT}`);
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
        console.error("\n\nBackend shutdown timeout");
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
    console.error("\n\nRedis close error", err);
  }

  process.exit(0);
}

process.on("SIGTERM", () => {
  void gracefulShutdown();
});
process.on("SIGINT", () => {
  void gracefulShutdown();
});
