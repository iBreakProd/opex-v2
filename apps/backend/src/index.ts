import express from "express";
import cookieParser from "cookie-parser";
import "dotenv/config";
import router from "./router";
import cors from "cors";
import { loadBackendConfig } from "./config";
import { errorHandler } from "./middleware/errorHandler";

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

app.listen(config.HTTP_PORT, () => {
  console.log(`Server started at ${config.HTTP_PORT}`);
});
