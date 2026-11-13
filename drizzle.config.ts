// Drizzle Kit reads DATABASE_URL so the same command pushes to local Postgres
// or to Supabase. From a laptop pointed at Supabase:
//   DATABASE_URL="postgresql://..." npx drizzle-kit push

import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
  },
});
