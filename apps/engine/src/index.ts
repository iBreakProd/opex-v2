import { enginePuller, enginePusher } from "@repo/redis/queue";
import { mongodbClient } from "./dbClient";
import { Engine } from "./engineClass";

process.on("unhandledRejection", (reason) => {
  console.error("\n\nUnhandled rejection", reason);
  process.exitCode = 1;
});
process.on("uncaughtException", (err) => {
  console.error("\n\nUncaught exception", err);
  process.exitCode = 1;
  process.exit(1);
});

const SHUTDOWN_TIMEOUT_MS = 10_000;

const engine = new Engine(enginePuller, enginePusher, mongodbClient);

const runPromise = engine.run();

function onSignal(): void {
  engine.stop();
  const timeout = setTimeout(() => {
    console.error("\n\nEngine shutdown timeout");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  runPromise
    .then(() => {
      clearTimeout(timeout);
      process.exit(0);
    })
    .catch(() => {
      clearTimeout(timeout);
      process.exit(1);
    });
}

process.on("SIGTERM", onSignal);
process.on("SIGINT", onSignal);

(async () => {
  try {
    await runPromise;
  } catch (err) {
    console.error("\n\nEngine failed to start", err);
    process.exitCode = 1;
    process.exit(1);
  }
})();
