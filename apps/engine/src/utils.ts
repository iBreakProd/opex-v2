import z from "zod";
import type { FilteredDataType } from "@repo/types/types";

/**
 * Parses a fixed-point string "X.XXXX" to an integer (e.g. "12.3400" -> 123400).
 * Safe against missing decimal part or NaN.
 */
export function fixed4ToInt(value: number): number {
  const str = Number.isFinite(value) ? value.toFixed(4) : "0.0000";
  const parts = str.split(".");
  const frac = parts[1] ?? "0000";
  const intPart = parts[0] ?? "0";
  const combined = intPart + frac.slice(0, 4);
  const result = Number.parseInt(combined, 10);
  return Number.isNaN(result) ? 0 : result;
}

const FilteredDataTypeSchema: z.ZodType<FilteredDataType> = z.object({
  ask_price: z.number(),
  bid_price: z.number(),
  decimal: z.number(),
});

const OpenOrdersSchema = z.object({
  id: z.string(),
  openPrice: z.number(),
  leverage: z.number(),
  asset: z.string(),
  margin: z.number(),
  quantity: z.number(),
  type: z.enum(["long", "short"]),
});

const UserBalanceSchema = z.object({
  balance: z.number(),
  decimal: z.number(),
});

export const EngineSnapshotSchema = z.object({
  currentPrice: z.record(z.string(), FilteredDataTypeSchema),
  openOrders: z.record(z.string(), z.array(OpenOrdersSchema)),
  userBalances: z.record(z.string(), UserBalanceSchema),
  lastConsumedStreamItemId: z.string(),
  lastSnapShotAt: z.number(),
});

export type EngineSnapshot = z.infer<typeof EngineSnapshotSchema>;
