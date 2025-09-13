import { tradePusher, httpPusher } from "@repo/redis/queue";
import { Request, Response } from "express";
import { responseLoopObj } from "../utils/responseLoop";
import { closeOrderSchema, createOrderSchema } from "@repo/types/zodSchema";
import { db, schema } from "@repo/db/client";
import { eq } from "drizzle-orm";
import {
  logTradeFailure,
  mapTradeErrorToUserMessage,
} from "../utils/tradeErrorMessages";

(async () => {
  try {
    if (!tradePusher.isOpen) {
      await tradePusher.connect();
    }
    if (!httpPusher.isOpen) {
      await httpPusher.connect();
    }
  } catch (err) {
    console.error("[redis] trade/http pusher connect error", err);
  }
})();

async function fetchOpenOrders(userId: string) {
  const reqId = Date.now().toString() + crypto.randomUUID();
  await tradePusher.xAdd("stream:app:info", "*", {
    type: "open-trades-fetch",
    userId,
    reqId,
  });
  const trades = await responseLoopObj.waitForResponse(reqId);
  return trades;
}

async function fetchUsdBalance(userId: string) {
  const reqId = Date.now().toString() + crypto.randomUUID();
  await httpPusher.xAdd("stream:app:info", "*", {
    type: "get-user-bal",
    reqId,
    userId,
  });
  const data = await responseLoopObj.waitForResponse(reqId);
  return data;
}

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

      let openOrders: unknown = undefined;
      let usdBalance: unknown = undefined;
      try {
        const [ordersResult, balResult] = await Promise.all([
          fetchOpenOrders(userId),
          fetchUsdBalance(userId),
        ]);
        openOrders = ordersResult;
        usdBalance = balResult;
      } catch (stateErr) {
        logTradeFailure("open.state-refresh", stateErr);
      }

      res.json({ message: "trade executed", order, orderId, openOrders, usdBalance });
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

  try {
    await tradePusher.xAdd("stream:app:info", "*", {
      type: "trade-close",
      reqId,
      userId,
      orderId,
    });

    const response = await responseLoopObj.waitForResponse(reqId);

    let engineUsdBalance: unknown = undefined;
    if (typeof response === "string") {
      try {
        const parsed = JSON.parse(response) as {
          userBal?: unknown;
          orderId?: string;
        };
        engineUsdBalance = parsed.userBal;
      } catch {
        engineUsdBalance = undefined;
      }
    }

    let openOrders: unknown = undefined;
    let usdBalance: unknown = engineUsdBalance;
    try {
      const ordersResult = await fetchOpenOrders(userId);
      openOrders = ordersResult;
      if (!usdBalance) {
        usdBalance = await fetchUsdBalance(userId);
      }
    } catch (stateErr) {
      logTradeFailure("close.state-refresh", stateErr);
    }

    res.json({ message: "Trade Closed", openOrders, usdBalance });
  } catch (err) {
    const raw =
      typeof err === "string"
        ? err
        : err instanceof Error
        ? err.message
        : "";
    if (raw.toLowerCase().includes("order does not exists")) {
      let openOrders: unknown = undefined;
      let usdBalance: unknown = undefined;
      try {
        const [ordersResult, balResult] = await Promise.all([
          fetchOpenOrders(userId),
          fetchUsdBalance(userId),
        ]);
        openOrders = ordersResult;
        usdBalance = balResult;
      } catch (stateErr) {
        logTradeFailure("close.idempotent-refresh", stateErr);
      }

      res.json({ message: "Trade already closed", openOrders, usdBalance });
      return;
    }

    logTradeFailure("close", err);
    res.status(411).json({ message: mapTradeErrorToUserMessage(err) });
  }
};

export const fetchClosedTrades = async (req: Request, res: Response) => {
  const userId = (req as unknown as { userId: string }).userId;
  try {
    const trades = await db
      .select()
      .from(schema.existingTrades)
      .where(eq(schema.existingTrades.userId as any, userId) as any);

    res.json({
      trades,
    });
  } catch (err) {
    console.log(err);
    res.status(411).json({ message: "Failed to fetch closed trades" });
  }
};
