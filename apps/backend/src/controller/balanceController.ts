import { httpPusher } from "@repo/redis/queue";
import { Request, Response } from "express";
import { responseLoopObj } from "../utils/responseLoop";

export const getAssetBalanceController = async (
  req: Request,
  res: Response
) => {
  const userId = (req as unknown as { userId: string }).userId;
  const reqId = Date.now().toString() + crypto.randomUUID();

  try {
    await httpPusher.xAdd("stream:app:info", "*", {
      type: "get-asset-bal",
      reqId,
      userId,
    });

    const data = await responseLoopObj.waitForResponse(reqId);

    res.json({
      message: "Fetched asset balance successfully",
      data,
    });
  } catch (err) {
    console.warn("[balance] get-asset-bal request failed", err);
    res.status(411).json({ message: "Could not get the asset balance" });
  }
};

export const getUsdBalanceController = async (req: Request, res: Response) => {
  const userId = (req as unknown as { userId: string }).userId;
  const reqId = Date.now().toString() + crypto.randomUUID();

  try {
    await httpPusher.xAdd("stream:app:info", "*", {
      type: "get-user-bal",
      reqId,
      userId,
    });

    const data = await responseLoopObj.waitForResponse(reqId);

    res.json({
      message: "Fetched usd balance successfully",
      data,
    });
  } catch (err) {
    console.warn("[balance] get-usd-bal request failed", err);
    res.status(411).json({ message: "Could not get the USD balance" });
  }
};
