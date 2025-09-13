import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./packages/db/src/drizzle/schema.ts",
  out: "./packages/db/drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});

