import prismaClient from "@repo/db/client";
import { enginePuller, enginePusher } from "@repo/redis/queue";
import {
  AssetBalance,
  FilteredDataType,
  OpenOrders,
  OrderType,
  UserBalance,
} from "@repo/types/types";
import { mongodbClient } from "./dbClient";

let currentPrice: Record<string, FilteredDataType> = {
  BTC_USDC_PERP: {
    ask_price: 0,
    bid_price: 0,
    decimal: 0,
  },
  SOL_USDC_PERP: {
    ask_price: 0,
    bid_price: 0,
    decimal: 0,
  },
  ETH_USDC_PERP: {
    ask_price: 0,
    bid_price: 0,
    decimal: 0,
  },
};

let openOrders: Record<string, OpenOrders[]> = {};

let userBalances: Record<string, UserBalance> = {};

let lastConsumedStreamItemId: string = "0-0";
let lastSnapShotAt: number;

const dbName = "opex-snapshot";
const collectionName = "engine_backup";

(async () => {
  await (async () => {
    await enginePuller.connect();
    await enginePusher.connect();

    try {
      await enginePuller.xGroupCreate("stream:app:info", "group-1", "0", {
        MKSTREAM: true,
      });
    } catch (err) {
      console.log("group exists");
    }

    await mongodbClient.connect();
    console.log("Connected to db");

    const db = mongodbClient.db(dbName);
    const collection = db.collection(collectionName);

    const result = await collection.findOne({ id: "dump" });

    if (result) {
      currentPrice = result.data.currentPrice!;
      openOrders = result.data.openOrders!;
      userBalances = result.data.userBalances!;
      lastConsumedStreamItemId = result.data.lastConsumedStreamItemId;
      lastSnapShotAt = result.data.lastSnapShotAt;

      const streamMetaData = await enginePuller.xInfoGroups("stream:app:info");
      const lastDeliveredId = streamMetaData[0]?.["last-delivered-id"];

      // console.log(lastConsumedStreamItemId, lastDeliveredId);

      const res = await enginePuller.xRange(
        "stream:app:info",
        lastConsumedStreamItemId,
        lastDeliveredId!.toString()
      );

      const messagesToProcess = res.slice(1);

      messagesToProcess.forEach((message) => {});
    }
  })();

  lastSnapShotAt = Date.now();
  while (true) {
    await enginePuller.xAck(
      "stream:app:info",
      "group-1",
      lastConsumedStreamItemId
    );
    const res = await enginePuller.xReadGroup(
      "group-1",
      "consumer-1",
      { key: "stream:app:info", id: ">" },
      {
        BLOCK: 0,
        COUNT: 1,
      }
    );

    if (res) {
      let reqId = res[0]?.messages[0]?.message.reqId!;
      const reqType = res[0]?.messages[0]?.message.type;

      lastConsumedStreamItemId = res[0]?.messages[0]?.id!;
      // console.log("res", lastConsumedStreamItemId);

      // User Signup and Signin
      if (reqType === "user-signup" || reqType === "user-signin") {
        const user = JSON.parse(res[0]?.messages[0]?.message.user!);

        if (!userBalances[user.id]) {
          userBalances[user.id] = {
            balance: user.balance,
            decimal: user.decimal,
          };
        }
        if (!openOrders[user.id]) {
          openOrders[user.id] = [];
        }

        await enginePusher.xAdd("stream:engine:response", "*", {
          type: "user-signup/in-ack",
          reqId,
          response: JSON.stringify({
            message: "User added to in memory successfully",
          }),
        });
      } else if (reqType === "price-update") {
        const tradePrices = JSON.parse(
          res[0]!.messages[0]?.message.tradePrices!
        );

        for (const [key, value] of Object.entries(tradePrices)) {
          currentPrice[key] = value as unknown as FilteredDataType;
        }

        for (const [userId, orders] of Object.entries(openOrders)) {
          orders.forEach(async (order) => {
            let assetPrice: number;
            let priceChange: number;
            let pnl: number;

            if (order.type === "long") {
              assetPrice = currentPrice[order.asset]?.bid_price!;
              priceChange = assetPrice - order.openPrice;
            } else {
              assetPrice = currentPrice[order.asset]?.ask_price!;
              priceChange = order.openPrice - assetPrice;
            }

            pnl = (priceChange * order.leverage * order.quantity) / 10 ** 4;

            const pnlStr = pnl.toFixed(4);
            const pnlIntStr = pnlStr.split(".")[0] + pnlStr.split(".")[1]!;
            const pnlInt = Number(pnlIntStr);

            const lossTakingCapacity = order.margin / order.leverage;

            const lossTakingCapacityStr = lossTakingCapacity.toFixed(4);
            const lossTakingCapacityIntStr =
              lossTakingCapacityStr.split(".")[0] +
              lossTakingCapacityStr.split(".")[1]!;
            const lossTakingCapacityInt = Number(lossTakingCapacityIntStr);

            if (pnlInt < -0.9 * lossTakingCapacityInt) {
              //close Trade
              const newBalChange = pnlInt + order.margin;

              userBalances[userId] = {
                balance: userBalances[userId]!.balance + newBalChange,
                decimal: 4,
              };

              openOrders[userId] = openOrders[userId]!.filter(
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

              // Legacy engine path; left unused but kept for reference.
            }
          });
        }

        // console.log(currentPrice);
        // Trade Open
      } else if (reqType === "trade-open") {
        const tradeInfo = JSON.parse(res[0]!.messages[0]?.message.tradeInfo!);
        const userId = res[0]!.messages[0]?.message.userId;

        if (!userBalances[userId!]) {
          await enginePusher.xAdd("stream:engine:response", "*", {
            type: "trade-open-err",
            reqId,
            response: JSON.stringify({
              message:
                "User does not exists (User not found in balances array)",
            }),
          });
          continue;
        }

        const assetCurrentPrice = currentPrice[tradeInfo.asset];

        let openPrice: number;
        let priceDiff: number;

        if (tradeInfo.type === "long") {
          openPrice = assetCurrentPrice?.ask_price!;
          priceDiff = Math.abs(
            assetCurrentPrice!.ask_price! - tradeInfo.openPrice
          );
        } else {
          openPrice = assetCurrentPrice?.bid_price!;
          priceDiff = Math.abs(
            assetCurrentPrice!.bid_price! - tradeInfo.openPrice
          );
        }
        const priceDiffInBips = (priceDiff! / tradeInfo.openPrice) * 100;

        if (priceDiffInBips > tradeInfo.slippage / 100) {
          await enginePusher.xAdd("stream:engine:response", "*", {
            type: "trade-open-err",
            reqId,
            response: JSON.stringify({
              message: "Price slippage exceded",
            }),
          });
          continue;
        }

        const margin = (openPrice * tradeInfo.quantity) / 10 ** 4;

        const marginStr = margin.toFixed(4);
        const marginIntStr = marginStr.split(".")[0] + marginStr.split(".")[1]!;
        const marginInt = Number(marginIntStr);

        const currentBalance = userBalances[userId!]!.balance;
        const newBal = currentBalance! - marginInt;

        if (newBal < 0) {
          await enginePusher.xAdd("stream:engine:response", "*", {
            type: "trade-open-err",
            reqId,
            response: JSON.stringify({
              message: "User does not have enough balance",
            }),
          });
          continue;
        }

        const orderId = crypto.randomUUID();

        const order: OpenOrders = {
          id: orderId,
          type: tradeInfo.type as unknown as OrderType,
          leverage: tradeInfo.leverage,
          asset: tradeInfo.asset,
          margin: marginInt,
          quantity: tradeInfo.quantity,
          openPrice,
        };

        if (!openOrders[userId!]?.length) {
          openOrders[userId!] = [];
        }

        openOrders[userId!]?.push(order);

        userBalances[userId!] = {
          balance: newBal,
          decimal: userBalances[userId!]!.decimal!,
        };

        await enginePusher.xAdd("stream:engine:response", "*", {
          type: "trade-open-ack",
          reqId,
          response: JSON.stringify({
            message: "Order Created",
            orderId,
          }),
        });

        // Trade Close
      } else if (reqType === "trade-close") {
        const orderId = res[0]?.messages[0]?.message.orderId!;
        const userId = res[0]?.messages[0]?.message.userId!;

        if (!userBalances[userId]) {
          await enginePusher.xAdd("stream:engine:response", "*", {
            type: "trade-close-err",
            reqId,
            response: JSON.stringify({
              message:
                "User does not exists (User not found in balances array)",
            }),
          });
          continue;
        }

        let order: OpenOrders | undefined;

        openOrders[userId]?.forEach((o) => {
          if (o.id === orderId) {
            // console.log(o);
            order = o;
          }
        });

        if (!order) {
          await enginePusher.xAdd("stream:engine:response", "*", {
            type: "trade-close-err",
            reqId,
            response: JSON.stringify({
              message: "Order does not exists (Order not found in OpenOrders)",
            }),
          });
          continue;
        }

        const assetCurrentPrice = currentPrice[order.asset];
        let closePrice: number;
        let priceChange: number;
        let pnl: number;

        if (order.type === "long") {
          closePrice = assetCurrentPrice?.bid_price!;
          priceChange = closePrice - order.openPrice;
        } else {
          closePrice = assetCurrentPrice?.ask_price!;
          priceChange = order.openPrice - closePrice;
        }

        pnl = (priceChange * order.leverage * order.quantity) / 10 ** 4;

        const pnlStr = pnl.toFixed(4);
        const pnlIntStr = pnlStr.split(".")[0] + pnlStr.split(".")[1]!;
        const pnlInt = Number(pnlIntStr);

        const newBalChange = pnlInt + order.margin;

        userBalances[userId] = {
          balance: userBalances[userId].balance + newBalChange,
          decimal: 4,
        };

        openOrders[userId] = openOrders[userId]!.filter(
          (o) => o.id !== orderId
        );

        const closedOrder = {
          ...order,
          closePrice,
          pnl: pnlInt,
          decimal: 4,
          liquidated: false,
          userId,
        };

        // Legacy engine path; left unused but kept for reference.

        await enginePusher.xAdd("stream:engine:response", "*", {
          type: "trade-close-ack",
          reqId,
          response: JSON.stringify({
            message: "Order Closed",
            orderId,
          }),
        });
      } else if (reqType === "get-asset-bal") {
        const userId = res[0]?.messages[0]?.message.userId!;

        let assetBal: AssetBalance = {
          BTC_USDC_PERP: {
            balance: 0,
            decimal: 4,
          },
          SOL_USDC_PERP: {
            balance: 0,
            decimal: 4,
          },
          ETH_USDC_PERP: {
            balance: 0,
            decimal: 4,
          },
        };

        openOrders[userId]?.forEach((o) => {
          if (o.type === "long") {
            assetBal[o.asset]!.balance += o.margin;
          } else {
            assetBal[o.asset]!.balance -= o.margin;
          }
        });

        await enginePusher.xAdd("stream:engine:response", "*", {
          type: "get-asset-bal-ack",
          reqId,
          response: JSON.stringify({ assetBal }),
        });
      } else if (reqType === "get-user-bal") {
        const userId = res[0]?.messages[0]?.message.userId!;

        const userBal = userBalances[userId];

        if (!userBal) {
          await enginePusher.xAdd("stream:engine:response", "*", {
            type: "get-user-bal-err",
            reqId,
            response: JSON.stringify({
              message:
                "User does not exists (User not found in balances array)",
            }),
          });
          continue;
        }

        await enginePusher.xAdd("stream:engine:response", "*", {
          type: "get-user-bal-ack",
          reqId,
          response: JSON.stringify({ userBal }),
        });
      }
    }

    if (Date.now() - lastSnapShotAt > 5000) {
      const db = mongodbClient.db(dbName);
      const collection = db.collection(collectionName);

      lastSnapShotAt = Date.now();

      const data = {
        currentPrice,
        openOrders,
        userBalances,
        lastConsumedStreamItemId: lastConsumedStreamItemId,
        lastSnapShotAt,
      };

      const result = await collection.findOneAndReplace(
        { id: "dump" },
        {
          id: "dump",
          data,
        }
      );

      if (!result) {
        const result = await collection.insertOne({
          id: "dump",
          data,
        });

        console.log("inserted");
      } else {
        console.log("replaced");
      }

      console.log(await collection.findOne());
    }
  }
})();
