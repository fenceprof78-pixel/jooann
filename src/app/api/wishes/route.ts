// Public wishes. Approved notes are listed; new notes are approved immediately
// so a guest sees their line appear. The couple can hide one from Atelier.

import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { wishes } from "@/db/schema";
import { clip, clipBlock } from "@/lib/guards";
import { mapWish } from "@/lib/site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = await db.select().from(wishes).where(eq(wishes.approved, true)).orderBy(desc(wishes.createdAt)).limit(80);
    return Response.json({ ok: true, wishes: rows.map(mapWish) });
  } catch (error) {
    console.error(error);
    return Response.json({ ok: false, error: "Wishes are briefly unavailable." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "That note could not be read." }, { status: 400 });
  }

  if (clip(body.company, 80)) return Response.json({ ok: true });

  const name = clip(body.name, 80);
  const message = clipBlock(body.message, 500);
  if (name.length < 2) return Response.json({ ok: false, error: "Please sign your note." }, { status: 400 });
  if (message.length < 4) return Response.json({ ok: false, error: "A few more words, if you would." }, { status: 400 });

  try {
    const [saved] = await db.insert(wishes).values({ name, message, approved: true }).returning();
    return Response.json({ ok: true, wish: mapWish(saved) });
  } catch (error) {
    console.error(error);
    return Response.json({ ok: false, error: "The note could not be kept just now." }, { status: 500 });
  }
}
