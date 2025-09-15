import {
  GetAssetBalMsg,
  GetUserBalMsg,
  Message,
  MessageSchema,
  PriceUpdateMsg,
  TradeCloseMsg,
  TradeOpenMsg,
  OpenTradesFetchMsg,
  UserAuthMsg,
} from "@repo/types/zodSchema";
import {
  AssetBalance,
  EngineResponseType,
  FilteredDataType,
  OpenOrders,
  OrderType,
  UserBalance,
} from "@repo/types/types";
import { randomUUID } from "crypto";
import { TypeOfMongoClient } from "./dbClient";
import { TypeOfRedisClient } from "@repo/redis/index";
import { publisher } from "@repo/redis/pubsub";
import { db, schema } from "@repo/db/client";
import z from "zod";
import { fixed4ToInt, EngineSnapshotSchema } from "./utils";
import { eq } from "drizzle-orm";

export class Engine {
  constructor(
    private readonly enginePuller: TypeOfRedisClient,
    private readonly enginePusher: TypeOfRedisClient,
    private readonly mongo: TypeOfMongoClient
  ) {}

  private currentPrice: Record<string, FilteredDataType> = {
    BTC_USDC_PERP: { ask_price: 0, bid_price: 0, decimal: 0 },
    SOL_USDC_PERP: { ask_price: 0, bid_price: 0, decimal: 0 },
    ETH_USDC_PERP: { ask_price: 0, bid_price: 0, decimal: 0 },
  };
  private openOrders: Record<string, OpenOrders[]> = {};
  private userBalances: Record<string, UserBalance> = {};
  private lastConsumedStreamItemId: string = "";
  private lastSnapShotAt: number = Date.now();

  private readonly dbName = "opex-snapshot";
  private readonly collectionName = "engine_backup";
  private readonly streamKey = "stream:app:info";
  private readonly responseStreamKey = "stream:engine:response";
  private readonly groupName = "group-1";
  private readonly consumerName = "consumer-1";

  private running = true;

  stop(): void {
    console.log("\n\n[Engine] Stopping...");
    this.running = false;
  }

  async run(): Promise<void> {
    console.log("\n\n[Engine] Starting run loop...");
    await this.enginePuller.connect();
    await this.enginePusher.connect();
    await publisher.connect();
    await this.mongo.connect();
    console.log("\n\n[Engine] Connected to Redis, PubSub, and Mongo.");

    try {
      await this.enginePuller.xGroupCreate(
        this.streamKey,
        this.groupName,
        "0",
        {
          MKSTREAM: true,
        }
      );
      console.log("\n\n[Engine] Consumer group created.");
    } catch (err) {
      console.log("\n\n[Engine] Consumer group already exists.");
    }

    try {
      console.log("\n\n[Engine] Loading snapshot...");
      await this.loadSnapshot();
      console.log("\n\n[Engine] Snapshot loaded.");

      const groups = await this.enginePuller.xInfoGroups(this.streamKey);
      const lastDeliveredId = groups[0]?.["last-delivered-id"]?.toString();

      if (
        lastDeliveredId &&
        this.lastConsumedStreamItemId !== "" &&
        this.lastConsumedStreamItemId !== lastDeliveredId
      ) {
        console.log(`\n\n[Engine] Replaying from ${this.lastConsumedStreamItemId} to ${lastDeliveredId}`);
        await this.replay(this.lastConsumedStreamItemId, lastDeliveredId);
      }
    } catch (err) {
      console.error("\n\n[Engine] Startup failed during load/replay", err);
      throw err;
    }

    this.lastSnapShotAt = Date.now();
    while (this.running) {
      try {
        if (this.lastConsumedStreamItemId !== "") {
          await this.enginePuller.xAck(
            this.streamKey,
            this.groupName,
            this.lastConsumedStreamItemId
          );
        }

        await this.enginePuller.xGroupSetId(
          this.streamKey,
          this.groupName,
          "$"
        );
        const res = await this.enginePuller.xReadGroup(
          this.groupName,
          this.consumerName,
          { key: this.streamKey, id: ">" },
          { BLOCK: 5000, COUNT: 1 }
        );

        if (res && res[0]) {
          const entry = res[0].messages[0];
          this.lastConsumedStreamItemId = entry!.id;

          try {
            const msg = this.parseMessage(entry!.message);
            await this.handleMessage(msg);
          } catch (err) {
            console.error("\n\n[Engine] Error processing message:", err);
            const raw = entry?.message as { reqId?: string; type?: string } | undefined;
            const reqId = raw?.reqId;
            if (reqId) {
              try {
                await this.sendResponse({
                  type: "request-failed",
                  reqId,
                  payload: { message: "Request failed" },
                });
              } catch (sendErr) {
                console.error("\n\n[Engine] Failed to send error response", sendErr);
              }
            }
          }
        }

        if (Date.now() - this.lastSnapShotAt > 5000) {
          const maxAttempts = 3;
          const delaysMs = [1000, 2000];
          let lastErr: unknown;
          for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
              await this.persistSnapshot();
              await this.enginePuller.xTrim(this.streamKey, "MAXLEN", 10000);
              lastErr = undefined;
              break;
            } catch (err) {
              lastErr = err;
              if (attempt < maxAttempts) {
                const delay = delaysMs[attempt - 1] ?? 2000;
                await new Promise((r) => setTimeout(r, delay));
              }
            }
          }
          if (lastErr !== undefined) {
            console.error(
              "[Engine] Failed to persist snapshot after",
              maxAttempts,
              "attempts",
              lastErr
            );
            process.exit(1);
          }
        }
      } catch (loopErr) {
        console.error("\n\n[Engine] Loop error:", loopErr);
      }
    }

    try {
      console.log("\n\n[Engine] Persisting final snapshot...");
      await this.persistSnapshot();
      console.log("\n\n[Engine] Final snapshot persisted.");
    } catch (err) {
      console.error("\n\n[Engine] Final snapshot on shutdown failed", err);
    }
  }

  private async replay(fromId: string, toId: string): Promise<void> {
    const entries = await this.enginePuller.xRange(
      this.streamKey,
      fromId,
      toId
    );

    const missed = entries.slice(1);
    console.log(`\n\n[Engine] Replaying ${missed.length} missed messages.`);
    const maxRetries = 3;
    const retryDelayMs = 500;

    for (const entry of missed) {
      let lastErr: unknown;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const msg = this.parseMessage(entry.message);
          await this.handleReplayMessage(msg);
          this.lastConsumedStreamItemId = entry.id;
          lastErr = undefined;
          break;
        } catch (err) {
          lastErr = err;
          if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, retryDelayMs));
          }
        }
      }
      if (lastErr !== undefined) {
        console.error(
          "[Engine] Replay message failed after retries",
          entry.id,
          lastErr
        );
        throw lastErr;
      }
    }
  }

  private async handleReplayMessage(msg: Message): Promise<void> {
    switch (msg.type) {
      case "user-signup":
      case "user-signin":
        this.handleUserAuth(UserAuthMsg.parse(msg));
        break;
      case "price-update":
        await this.handlePriceUpdate(PriceUpdateMsg.parse(msg));
        break;
      case "trade-open":
        this.handleTradeOpen(TradeOpenMsg.parse(msg));
        break;
      case "trade-close":
        await this.handleTradeClose(TradeCloseMsg.parse(msg));
        break;
      case "get-asset-bal":
        this.handleGetAssetBal(GetAssetBalMsg.parse(msg));
        break;
      case "get-user-bal":
        this.handleGetUserBal(GetUserBalMsg.parse(msg));
        break;
      case "open-trades-fetch":
        this.handleOpenTradesFetch(OpenTradesFetchMsg.parse(msg));
        break;
    }
  }

  private async handleMessage(msg: Message): Promise<void> {
    let res: EngineResponseType | undefined = undefined;
    switch (msg.type) {
      case "user-signup":
      case "user-signin":
        console.log("\n\n[Engine] Handling User Auth:", JSON.stringify(msg));
        res = this.handleUserAuth(UserAuthMsg.parse(msg));
        break;
      case "price-update":
        await this.handlePriceUpdate(PriceUpdateMsg.parse(msg));
        break;
      case "trade-open":
        console.log("\n\n[Engine] Handling Trade Open:", JSON.stringify(msg));
        res = this.handleTradeOpen(TradeOpenMsg.parse(msg));
        break;
      case "trade-close":
        console.log("\n\n[Engine] Handling Trade Close:", JSON.stringify(msg));
        res = await this.handleTradeClose(TradeCloseMsg.parse(msg));
        break;
      case "get-asset-bal":
        console.log("\n\n[Engine] Handling Get Asset Bal:", JSON.stringify(msg));
        res = this.handleGetAssetBal(GetAssetBalMsg.parse(msg));
        break;
      case "get-user-bal":
        console.log("\n\n[Engine] Handling Get User Bal:", JSON.stringify(msg));
        res = this.handleGetUserBal(GetUserBalMsg.parse(msg));
        break;
      case "open-trades-fetch":
        console.log("\n\n[Engine] Handling Open Trades Fetch:", JSON.stringify(msg));
        res = this.handleOpenTradesFetch(OpenTradesFetchMsg.parse(msg));
        break;
    }

    if (res) {
      console.log(`\n\n[Engine] Sending Response: ${res.type}`);
      await this.sendResponse(res);
    }
  }

  private parseMessage(raw: unknown): Message {
    return MessageSchema.parse(raw);
  }

  private async loadSnapshot(): Promise<void> {
    const db = this.mongo.db(this.dbName);
    const collection = db.collection(this.collectionName);
    const doc = await collection.findOne({ id: "dump" });
    if (!doc || !doc.data) {
        console.log("\n\n[Engine] No snapshot found.");
        return;
    }

    const parsed = EngineSnapshotSchema.safeParse(doc.data);
    if (!parsed.success) {
      console.error("\n\n[Engine] Invalid snapshot format, skipping load", parsed.error.message);
      return;
    }
    const data = parsed.data;
    this.currentPrice = data.currentPrice;
    this.openOrders = data.openOrders as Record<string, OpenOrders[]>;
    this.userBalances = data.userBalances;
    this.lastConsumedStreamItemId = data.lastConsumedStreamItemId;
    this.lastSnapShotAt = data.lastSnapShotAt;
    console.log("\n\n[Engine] Snapshot data applied.");
  }

  private async persistSnapshot(): Promise<void> {
    const db = this.mongo.db(this.dbName);
    const collection = db.collection(this.collectionName);

    this.lastSnapShotAt = Date.now();
    const data = {
      currentPrice: this.currentPrice,
      openOrders: this.openOrders,
      userBalances: this.userBalances,
      lastConsumedStreamItemId: this.lastConsumedStreamItemId,
      lastSnapShotAt: this.lastSnapShotAt,
    };

    await collection.findOneAndReplace(
      { id: "dump" },
      { id: "dump", data },
      { upsert: true }
    );
     // console.log("\n\n[Engine] Snapshot persisted."); // Commented out to reduce noise
  }

  private async sendResponse({
    type,
    reqId,
    payload,
  }: EngineResponseType): Promise<void> {
    console.log(`\n\n[Engine] Pushing response to stream ${this.responseStreamKey}. Type: ${type}, ReqId: ${reqId}`);
    await this.enginePusher.xAdd(this.responseStreamKey, "*", {
      type,
      reqId,
      response: JSON.stringify(payload),
    });
    console.log(`\n\n[Engine] Successfully pushed response. ReqId: ${reqId}`);
  }

  private publishUserStateChanged(userId: string): void {
    const channel = `ws:user:state:${userId}`;
    const payload = JSON.stringify({ type: "userStateChanged" });
    publisher.publish(channel, payload).catch((err) => {
      console.error("\n\n[Engine] publish user state changed error", err);
    });
  }

  private handleUserAuth(msg: z.infer<typeof UserAuthMsg>): EngineResponseType {
    const user = JSON.parse(msg.user) as {
      id: string;
      balance: number;
      decimal: number;
    };
    console.log(`\n\n[Engine] Auth user: ${user.id}, Balance: ${user.balance}`);

    if (!this.userBalances[user.id]) {
      this.userBalances[user.id] = {
        balance: user.balance,
        decimal: user.decimal,
      };
    }
    if (!this.openOrders[user.id]) {
      this.openOrders[user.id] = [];
    }

    return {
      type: "user-signup/in-ack",
      reqId: msg.reqId,
      payload: {
        message: "User added to in memory successfully",
      },
    };
  }

  private liquidatedUserIdsInTick = new Set<string>();

  private async handlePriceUpdate(
    msg: z.infer<typeof PriceUpdateMsg>
  ): Promise<void> {
    const tradePrices = JSON.parse(msg.tradePrices);

    for (const [key, value] of Object.entries(tradePrices)) {
      this.currentPrice[key] = value as unknown as FilteredDataType;
    }

    this.liquidatedUserIdsInTick.clear();

    for (const [userId, orders] of Object.entries(this.openOrders)) {
      for (const order of [...orders]) {
        const price = this.currentPrice[order.asset];
        if (!price) continue;

        const assetPrice =
          order.type === "long" ? price.bid_price : price.ask_price;
        if (assetPrice == null) continue;

        const priceChange =
          order.type === "long"
            ? assetPrice - order.openPrice
            : order.openPrice - assetPrice;

        const pnl = (priceChange * order.leverage * order.quantity) / 10 ** 4;
        const pnlInt = fixed4ToInt(pnl);

        const lossTakingCapacity = order.margin / order.leverage;
        const lossTakingCapacityInt = fixed4ToInt(lossTakingCapacity);

        // console.log(`\n\n[Engine] Check PnL User: ${userId}, Order: ${order.id}, PnL: ${pnlInt}, Capacity: ${lossTakingCapacityInt}`);

        if (pnlInt < -0.9 * lossTakingCapacityInt) {
            console.log(`\n\n[Engine] LIQUIDATION! User: ${userId}, Order: ${order.id}`);
          this.liquidatedUserIdsInTick.add(userId);
          const newBalChange = pnlInt + order.margin;
          this.userBalances[userId] = {
            balance: this.userBalances[userId]!.balance + newBalChange,
            decimal: 4,
          };

          this.openOrders[userId] = this.openOrders[userId]!.filter(
            (o) => o.id !== order.id
          );

          const closedOrder = {
            ...order,
            closePrice: assetPrice,
            pnl: pnlInt,
            decimal: 4,
            liquidated: true,
            userId,
          };

          try {
            await db.insert(schema.existingTrades).values(closedOrder);
            console.log(`\n\n[Engine] Liquidation persisted for Order: ${order.id}`);
          } catch (dbErr) {
            console.error("\n\n[Engine] Failed to persist liquidation", dbErr);
          }
        }
      }
    }

    for (const uid of this.liquidatedUserIdsInTick) {
      this.publishUserStateChanged(uid);
    }
  }

  private handleTradeOpen(
    msg: z.infer<typeof TradeOpenMsg>
  ): EngineResponseType {
    const tradeInfo = JSON.parse(msg.tradeInfo) as {
      type: OrderType;
      asset: string;
      leverage: number;
      quantity: number;
      openPrice: number;
      slippage: number;
    };

    const userId = msg.userId;
    console.log(`\n\n[Engine] Processing Trade Request ${msg.reqId}`);
    console.log(`\n\n[Engine] Inputs - User: ${userId}, Asset: ${tradeInfo.asset}, Qty: ${tradeInfo.quantity}, Lev: ${tradeInfo.leverage}, Slip: ${tradeInfo.slippage}`);
    
    const assetCurrentPrice = this.currentPrice[tradeInfo.asset];

    if (!assetCurrentPrice) {
      console.warn(`\n\n[Engine] Trade Failed: Asset ${tradeInfo.asset} not found in currentPrice map`);
      return {
        type: "trade-open-err",
        reqId: msg.reqId,
        payload: {
          message: "Asset does not exists (Asset not found in currentPrices)",
        },
      };
    }

    if (!this.userBalances[userId]) {
      console.warn(`\n\n[Engine] Trade Failed: User ${userId} not found in userBalances`);
      return {
        type: "trade-open-err",
        reqId: msg.reqId,
        payload: {
          message: "User does not exists (User not found in balances array)",
        },
      };
    }

    let openPrice: number;
    let priceDiff: number;

    if (tradeInfo.type === "long") {
      openPrice = assetCurrentPrice.ask_price;
      priceDiff = Math.abs(assetCurrentPrice.ask_price - tradeInfo.openPrice);
    } else {
      openPrice = assetCurrentPrice.bid_price;
      priceDiff = Math.abs(assetCurrentPrice.bid_price - tradeInfo.openPrice);
    }

    const priceDiffInPercent = (priceDiff / tradeInfo.openPrice) * 100;
    console.log(`\n\n[Engine] Price Check - ReqOpen: ${tradeInfo.openPrice}, MktOpen: ${openPrice}, Diff: ${priceDiff} (${priceDiffInPercent.toFixed(4)}%)`);

    if (priceDiffInPercent > tradeInfo.slippage / 100) {
      console.warn(`\n\n[Engine] Trade Failed: Slippage too high. Req: ${tradeInfo.slippage/100}%, Actual: ${priceDiffInPercent}%`);
      return {
        type: "trade-open-err",
        reqId: msg.reqId,
        payload: {
          message: "Price slippage exceded",
        },
      };
    }

    const margin = (openPrice * tradeInfo.quantity) / tradeInfo.leverage / 10 ** 4;
    const marginInt = fixed4ToInt(margin);
    
    const currentBalance = this.userBalances[userId!]!.balance;
    const newBal = currentBalance! - marginInt;
    
    console.log(`\n\n[Engine] Margin Calc - OpenPrice: ${openPrice} * Qty: ${tradeInfo.quantity} / Lev: ${tradeInfo.leverage} = ${margin}`);
    console.log(`\n\n[Engine] Balance Check - Current: ${currentBalance} - MarginInt: ${marginInt} = NewBal: ${newBal}`);

    if (newBal < 0) {
      console.warn(`\n\n[Engine] Trade Failed: Insufficient funds. Need ${marginInt}, Have ${currentBalance}`);
      return {
        type: "trade-open-err",
        reqId: msg.reqId,
        payload: {
          message: "User does not have enough balance",
        },
      };
    }

    const orderId = randomUUID();

    const order: OpenOrders = {
      id: orderId,
      type: tradeInfo.type as unknown as OrderType,
      leverage: tradeInfo.leverage,
      asset: tradeInfo.asset,
      margin: marginInt,
      quantity: tradeInfo.quantity,
      openPrice,
    };

    if (!this.openOrders[userId]) {
      this.openOrders[userId] = [];
    }

    this.openOrders[userId].push(order);

    this.userBalances[userId!] = {
      balance: newBal,
      decimal: this.userBalances[userId].decimal!,
    };

    console.log(`\n\n[Engine] Trade Success. OrderID: ${orderId}. User New Balance: ${newBal}`);
    this.publishUserStateChanged(userId);

    return {
      type: "trade-open-ack",
      reqId: msg.reqId,
      payload: {
        message: "Order Created",
        orderId,
        order,
      },
    };
  }

  private async handleTradeClose(
    msg: z.infer<typeof TradeCloseMsg>
  ): Promise<EngineResponseType> {
    const orderId = msg.orderId;
    const userId = msg.userId;
    console.log(`\n\n[Engine] Closing Trade User: ${userId}, Order: ${orderId}`);

    if (!this.userBalances[userId]) {
      return {
        type: "trade-close-err",
        reqId: msg.reqId,
        payload: {
          message: "User does not exists (User not found in balances array)",
        },
      };
    }

    let order: OpenOrders | undefined;

    this.openOrders[userId]?.forEach((o) => {
      if (o.id === orderId) {
        order = o;
      }
    });

    if (!order) {
        console.warn("\n\n[Engine] Trade Close Failed: Order not found");
      return {
        type: "trade-close-err",
        reqId: msg.reqId,
        payload: {
          message: "Order does not exists (Order not found in OpenOrders)",
        },
      };
    }

    const assetCurrentPrice = this.currentPrice[order.asset];
    let closePrice: number;
    let priceChange: number;
    let pnl: number;

    if (!assetCurrentPrice) {
      return {
        type: "trade-close-err",
        reqId: msg.reqId,
        payload: {
          message: "Asset does not exists (Asset not found in currentPrices)",
        },
      };
    }

    if (order.type === "long") {
      closePrice = assetCurrentPrice.bid_price!;
      priceChange = closePrice - order.openPrice;
    } else {
      closePrice = assetCurrentPrice.ask_price!;
      priceChange = order.openPrice - closePrice;
    }

    pnl = (priceChange * order.leverage * order.quantity) / 10 ** 4;
    const pnlInt = fixed4ToInt(pnl);
    console.log(`\n\n[Engine] Trade Close PnL: ${pnl}, Int: ${pnlInt}`);

    const newBalChange = pnlInt + order.margin;
    const newUserBal: UserBalance = {
      balance: this.userBalances[userId].balance + newBalChange,
      decimal: 4,
    };

    const closedOrder = {
      ...order,
      closePrice,
      pnl: pnlInt,
      decimal: 4,
      liquidated: false,
      userId,
    };

    try {
      await db.transaction(async (tx) => {
        await tx.insert(schema.existingTrades).values(closedOrder);
        await tx
          .update(schema.users)
          .set({
            balance: newUserBal.balance,
            decimal: newUserBal.decimal,
          })
          .where(eq(schema.users.id as any, userId) as any);
      });
      console.log(`\n\n[Engine] Trade Close Persisted. User New Balance: ${newUserBal.balance}`);
    } catch (dbErr) {
      const raw =
        dbErr instanceof Error ? dbErr.message : String(dbErr ?? "");
      const code =
        dbErr &&
        typeof dbErr === "object" &&
        "code" in dbErr &&
        typeof (dbErr as { code: string }).code === "string"
          ? (dbErr as { code: string }).code
          : "";
      console.error("\n\n[Engine] Failed to persist trade close", dbErr);

      const isDuplicateKey =
        code === "23505" ||
        /unique|duplicate/i.test(raw);
      if (isDuplicateKey) {
        this.userBalances[userId] = newUserBal;
        this.openOrders[userId] = this.openOrders[userId]!.filter(
          (o) => o.id !== orderId
        );
        this.publishUserStateChanged(userId);
        return {
          type: "trade-close-ack",
          reqId: msg.reqId,
          payload: {
            message: "Order Closed",
            orderId,
            userBal: newUserBal,
          },
        };
      }

      return {
        type: "trade-close-err",
        reqId: msg.reqId,
        payload: { message: "Failed to save trade" },
      };
    }

    this.userBalances[userId] = newUserBal;
    this.openOrders[userId] = this.openOrders[userId]!.filter(
      (o) => o.id !== orderId
    );

    this.publishUserStateChanged(userId);

    return {
      type: "trade-close-ack",
      reqId: msg.reqId,
      payload: {
        message: "Order Closed",
        orderId,
        userBal: newUserBal,
      },
    };
  }

  private handleGetAssetBal(
    msg: z.infer<typeof GetAssetBalMsg>
  ): EngineResponseType {
    const userId = msg.userId;

    let assetBal: AssetBalance = {
      BTC_USDC_PERP: { balance: 0, decimal: 4 },
      SOL_USDC_PERP: { balance: 0, decimal: 4 },
      ETH_USDC_PERP: { balance: 0, decimal: 4 },
    };

    this.openOrders[userId]?.forEach((o) => {
      if (o.type === "long") {
        assetBal[o.asset]!.balance += o.margin;
      } else {
        assetBal[o.asset]!.balance -= o.margin;
      }
    });

    return {
      type: "get-asset-bal-ack",
      reqId: msg.reqId,
      payload: { assetBal },
    };
  }

  private handleGetUserBal(
    msg: z.infer<typeof GetUserBalMsg>
  ): EngineResponseType {
    const userId = msg.userId;

    const userBal = this.userBalances[userId];
    console.log(`\n\n[Engine] GetUserBal: ${userId}, Balance: ${userBal?.balance}`);

    if (!userBal) {
      return {
        type: "get-user-bal-err",
        reqId: msg.reqId,
        payload: {
          message: "User does not exists (User not found in balances array)",
        },
      };
    }

    return { type: "get-user-bal-ack", reqId: msg.reqId, payload: { userBal } };
  }

  private handleOpenTradesFetch(
    msg: z.infer<typeof OpenTradesFetchMsg>
  ): EngineResponseType {
    const userId = msg.userId;
    const trades = this.openOrders[userId];
    return {
      type: "open-trades-fetch-ack",
      reqId: msg.reqId,
      payload: { trades },
    };
  }
}
