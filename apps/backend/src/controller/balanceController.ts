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
    console.log(`\n\n[Balance] Pushing get-asset-bal to stream for User: ${userId}, ReqId: ${reqId}`);
    await httpPusher.xAdd("stream:app:info", "*", {
      type: "get-asset-bal",
      reqId,
      userId,
    });
    console.log(`\n\n[Balance] Successfully pushed get-asset-bal to stream. ReqId: ${reqId}`);

    const data = await responseLoopObj.waitForResponse(reqId);
    res.json({
      message: "Fetched asset balance successfully",
      data,
    });
  } catch (err) {
    console.warn("\n\n[balance] get-asset-bal request failed", err);
    res.status(411).json({ message: "Could not get the asset balance" });
  }
};

export const getUsdBalanceController = async (req: Request, res: Response) => {
  const userId = (req as unknown as { userId: string }).userId;
  const reqId = Date.now().toString() + crypto.randomUUID();

  try {
    console.log(`\n\n[Balance] Pushing get-user-bal to stream for User: ${userId}, ReqId: ${reqId}`);
    await httpPusher.xAdd("stream:app:info", "*", {
      type: "get-user-bal",
      reqId,
      userId,
    });
    console.log(`\n\n[Balance] Successfully pushed get-user-bal to stream. ReqId: ${reqId}`);

    const data = await responseLoopObj.waitForResponse(reqId);

    res.json({
      message: "Fetched usd balance successfully",
      data,
      userId,
    });
  } catch (err) {
    console.warn("\n\n[balance] get-usd-bal request failed", err);
    res.status(411).json({ message: "Could not get the USD balance" });
  }
};
