import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";
import * as schema from "@/db/schema";

function poolConfig(url: string): PoolConfig {
  const hosted = /supabase\.(co|com)|sslmode=require/i.test(url);
  return {
    connectionString: url,
    max: process.env.NODE_ENV === "production" ? 1 : 8,
    idleTimeoutMillis: 10_000,
    ssl: hosted ? { rejectUnauthorized: false } : undefined,
  };
}

type Schema = typeof schema;

const globalForDb = globalThis as typeof globalThis & {
  __verdePool?: Pool;
  __verdeDb?: NodePgDatabase<Schema>;
};

function getPool(): Pool {
  if (globalForDb.__verdePool) return globalForDb.__verdePool;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const created = new Pool(poolConfig(databaseUrl));
  // Cache on globalThis in every environment. In production this also
  // reuses the pool across invocations of a warm serverless instance.
  globalForDb.__verdePool = created;
  return created;
}

function getDb(): NodePgDatabase<Schema> {
  if (!globalForDb.__verdeDb) {
    globalForDb.__verdeDb = drizzle(getPool(), { schema });
  }
  return globalForDb.__verdeDb;
}

// Lazy proxies: same `pool` / `db` exports, but nothing connects or
// validates env until the first real use.
export const pool = new Proxy({} as Pool, {
  get(_t, prop) {
    const real = getPool();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export const db = new Proxy({} as NodePgDatabase<Schema>, {
  get(_t, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
}) as NodePgDatabase<Schema>;
