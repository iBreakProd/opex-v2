import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  doublePrecision,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const orderTypeEnum = pgEnum("OrderType", ["short", "long"]);

export const users = pgTable("Users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  balance: integer("balance").notNull(),
  decimal: integer("decimal").notNull().default(4),
  lastLoggedInt: timestamp("lastLoggedInt", { withTimezone: false }),
});

export const existingTrades = pgTable("ExistingTrades", {
  id: uuid("id").primaryKey().defaultRandom(),
  openPrice: integer("openPrice").notNull(),
  leverage: integer("leverage").notNull(),
  asset: varchar("asset", { length: 255 }).notNull(),
  margin: integer("margin").notNull(),
  quantity: doublePrecision("quantity").notNull(),
  type: orderTypeEnum("type").notNull(),
  closePrice: integer("closePrice").notNull(),
  pnl: integer("pnl").notNull(),
  decimal: integer("decimal").notNull(),
  liquidated: boolean("liquidated").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("createdAt", { withTimezone: false })
    .notNull()
    .defaultNow(),
});

