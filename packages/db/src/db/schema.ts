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

export const orderTypeEnum = pgEnum("order_type", ["short", "long"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  balance: integer("balance").notNull(),
  decimal: integer("decimal").notNull().default(4),
  lastLoggedIn: timestamp("last_logged_in", { withTimezone: false }),
});

export const existingTrades = pgTable("existing_trades", {
  id: uuid("id").primaryKey().defaultRandom(),
  openPrice: integer("open_price").notNull(),
  leverage: integer("leverage").notNull(),
  asset: varchar("asset", { length: 255 }).notNull(),
  margin: integer("margin").notNull(),
  quantity: doublePrecision("quantity").notNull(),
  type: orderTypeEnum("type").notNull(),
  closePrice: integer("close_price").notNull(),
  pnl: integer("pnl").notNull(),
  decimal: integer("decimal").notNull(),
  liquidated: boolean("liquidated").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: false })
    .notNull()
    .defaultNow(),
});

