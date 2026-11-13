import { db } from "@/db";
import { sql } from "drizzle-orm";
import { ensureSeeded } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    // Warm the invitation tables when they exist. A missing schema must not
    // fail the platform healthcheck — the page falls back to sample copy.
    try {
      await ensureSeeded();
    } catch (error) {
      console.error("Seed skipped.", error);
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
