// Postgres client.
//
// Locally this is the sandbox database. On Vercel, point DATABASE_URL at the
// Supabase Session pooler (IPv4-friendly) and the same pool works. Serverless
// functions keep the pool small so a traffic spike does not exhaust Supabase
// connections. SSL is enabled only for hosted providers — local Postgres has none.

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";
import * as schema from "@/db/schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

function poolConfig(url: string): PoolConfig {
  const hosted = /supabase\.(co|com)|sslmode=require/i.test(url);
  return {
    connectionString: url,
    max: process.env.NODE_ENV === "production" ? 1 : 8,
    idleTimeoutMillis: 10_000,
    ssl: hosted ? { rejectUnauthorized: false } : undefined,
  };
}

const globalForDb = globalThis as typeof globalThis & {
  __verdePool?: Pool;
};

export const pool = globalForDb.__verdePool ?? new Pool(poolConfig(databaseUrl));

if (process.env.NODE_ENV !== "production") {
  globalForDb.__verdePool = pool;
}

export const db = drizzle(pool, { schema });
