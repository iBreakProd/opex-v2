import { drizzle as neonDrizzle } from "drizzle-orm/neon-serverless";
import { drizzle as pgDrizzle } from "drizzle-orm/node-postgres";
import { Pool as NeonPool } from "@neondatabase/serverless";
import pg from "pg";
import * as schema from "./schema.js";

let dbInstance:
  | ReturnType<typeof pgDrizzle<typeof schema>>
  | ReturnType<typeof neonDrizzle<typeof schema>>
  | undefined;

const connectionUrl = process.env.DATABASE_URL;

if (!connectionUrl) {
  throw new Error("DATABASE_URL is not defined");
}

if (process.env.NODE_ENV === "production") {
  const pool = new NeonPool({
    connectionString: connectionUrl,
  });
  dbInstance = neonDrizzle(pool, { schema });
} else {
  const pool = new pg.Pool({
    connectionString: connectionUrl,
  });
  dbInstance = pgDrizzle(pool, { schema });
}

if (!dbInstance) {
  throw new Error("DB is not initialized");
}

export const db = dbInstance;
export { schema };
export default dbInstance;
