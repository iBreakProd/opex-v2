import z from "zod";

export const authBodySchema = z.object({
  email: z.email(),
});

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const createOrderSchema = z.object({
  asset: z.string().min(1),
  type: z.enum(["long", "short"]),
  quantity: z.number().positive().max(1e12),
  leverage: z.number().int().min(1).max(100),
  slippage: z.number().min(0).max(100),
  openPrice: z.number().positive(),
  decimal: z.number().int().min(0).max(8),
});

export const closeOrderSchema = z.object({
  orderId: z.string().min(1).max(64).regex(UUID_REGEX),
});

// Engine Message Schemas:

export const BaseMsg = z.object({ reqId: z.string(), type: z.string() });

export const UserAuthMsg = BaseMsg.extend({
  type: z.enum(["user-signup", "user-signin"]),
  user: z.string(),
});

export const PriceUpdateMsg = BaseMsg.extend({
  type: z.literal("price-update"),
  tradePrices: z.string(),
});

export const TradeOpenMsg = BaseMsg.extend({
  type: z.literal("trade-open"),
  tradeInfo: z.string(),
  userId: z.string(),
});

export const TradeCloseMsg = BaseMsg.extend({
  type: z.literal("trade-close"),
  orderId: z.string(),
  userId: z.string(),
});

export const GetAssetBalMsg = BaseMsg.extend({
  type: z.literal("get-asset-bal"),
  userId: z.string(),
});

export const GetUserBalMsg = BaseMsg.extend({
  type: z.literal("get-user-bal"),
  userId: z.string(),
});

export const OpenTradesFetchMsg = BaseMsg.extend({
  type: z.literal("open-trades-fetch"),
  userId: z.string(),
});

export const MessageSchema = z.discriminatedUnion("type", [
  UserAuthMsg,
  PriceUpdateMsg,
  TradeOpenMsg,
  TradeCloseMsg,
  GetAssetBalMsg,
  GetUserBalMsg,
  OpenTradesFetchMsg,
]);

export type Message = z.infer<typeof MessageSchema>;
