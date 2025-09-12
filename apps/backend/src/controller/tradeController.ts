import { tradePusher } from "@repo/redis/queue";
import { Request, Response } from "express";
import { responseLoopObj } from "../utils/responseLoop";
import { closeOrderSchema, createOrderSchema } from "@repo/types/zodSchema";
import prismaClient from "@repo/db/client";
import {
  logTradeFailure,
  mapTradeErrorToUserMessage,
} from "../utils/tradeErrorMessages";

(async () => {
  await tradePusher.connect();
})();

export const openTradeController = async (req: Request, res: Response) => {
  const validInput = createOrderSchema.safeParse(req.body);

  if (!validInput.success) {
    res.status(411).json({
      message:
        "Invalid trade request. Please check asset, leverage, quantity, slippage, and price.",
    });
    return;
  }

  const userId = (req as unknown as { userId: string }).userId;
  const reqId = Date.now().toString() + crypto.randomUUID();
  const tradeInfo = JSON.stringify(validInput.data);

  try {
    await tradePusher.xAdd("stream:app:info", "*", {
      type: "trade-open",
      tradeInfo,
      userId,
      reqId,
    });

    const response = await responseLoopObj.waitForResponse(reqId);
    if (response === undefined || response === null || typeof response !== "string") {
      res
        .status(411)
        .json({ message: "We couldn’t confirm the trade. Please try again." });
      return;
    }
    try {
      const parsed = JSON.parse(response) as { order?: unknown; orderId?: string };
      const { order, orderId } = parsed;
      if (order === undefined || orderId === undefined) {
        res
          .status(411)
          .json({ message: "We couldn’t confirm the trade. Please try again." });
        return;
      }
      res.json({ message: "trade executed", order, orderId });
    } catch {
      res
        .status(411)
        .json({ message: "We couldn’t confirm the trade. Please try again." });
    }
  } catch (err) {
    logTradeFailure("open", err);
    res.status(411).json({ message: mapTradeErrorToUserMessage(err) });
  }
};

export const fetchOpenTrades = async (req: Request, res: Response) => {
  console.log("fetching open trades");
  const userId = (req as unknown as { userId: string }).userId;
  const reqId = Date.now().toString() + crypto.randomUUID();

  try {
    await tradePusher.xAdd("stream:app:info", "*", {
      type: "open-trades-fetch",
      userId,
      reqId,
    });

    const trades = await responseLoopObj.waitForResponse(reqId);
    res.json({ message: "trades fetched", trades });
    return;
  } catch (err) {
    console.log(err);
    res.status(411).json({ message: "Trades not fetched" });
  }
};

export const closeTradeController = async (req: Request, res: Response) => {
  const validInput = closeOrderSchema.safeParse(req.body);

  if (!validInput.success) {
    res.status(411).json({
      message: "Invalid request. Please provide a valid trade id.",
    });
    return;
  }

  const userId = (req as unknown as { userId: string }).userId;
  const reqId = Date.now().toString() + crypto.randomUUID();
  const orderId = validInput.data.orderId;

  console.log("sending to engine");

  try {
    await tradePusher.xAdd("stream:app:info", "*", {
      type: "trade-close",
      reqId,
      userId,
      orderId,
    });

    await responseLoopObj.waitForResponse(reqId);
    res.json({ message: "Trade Closed" });
  } catch (err) {
    logTradeFailure("close", err);
    res.status(411).json({ message: mapTradeErrorToUserMessage(err) });
  }
};

export const fetchClosedTrades = async (req: Request, res: Response) => {
  const userId = (req as unknown as { userId: string }).userId;
  try {
    const trades = await prismaClient.existingTrades.findMany({
      where: { userId },
    });

    res.json({
      trades,
    });
  } catch (err) {
    console.log(err);
    res.status(411).json({ message: "Failed to fetch closed trades" });
  }
};
