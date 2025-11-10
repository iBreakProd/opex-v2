import express from "express";
import cookieParser from "cookie-parser";
import "dotenv/config";
import router from "./router";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN!,
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use("/api/v1", router);

app.listen(process.env.HTTP_PORT, () => {
  console.log(`Server started at ${process.env.HTTP_PORT}`);
});
