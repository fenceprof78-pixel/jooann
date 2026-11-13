// Guest replies.
// Same email updates the existing row, so a guest can correct a meal or a song
// without creating a duplicate the couple has to reconcile in Atelier.

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { rsvps } from "@/db/schema";
import { clip, clipBlock, isEmail } from "@/lib/guards";
import { mapRsvp } from "@/lib/site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ATTENDING = new Set(["yes", "no", "maybe"]);

function publicRsvp(row: ReturnType<typeof mapRsvp>) {
  return {
    name: row.name,
    email: row.email,
    relation: row.relation,
    attending: row.attending,
    guests: row.guests,
    guestNames: row.guestNames,
    meal: row.meal,
    dietary: row.dietary,
    song: row.song,
    message: row.message,
    updatedAt: row.updatedAt,
  };
}

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get("email")?.trim().toLowerCase() ?? "";
  if (!isEmail(email)) {
    return Response.json({ ok: false, error: "Enter the email you replied with." }, { status: 400 });
  }

  try {
    const [row] = await db.select().from(rsvps).where(eq(rsvps.email, email)).limit(1);
    if (!row) return Response.json({ ok: false, error: "No reply under that email yet." }, { status: 404 });
    return Response.json({ ok: true, rsvp: publicRsvp(mapRsvp(row)) });
  } catch (error) {
    console.error(error);
    return Response.json({ ok: false, error: "The reply book is briefly unavailable." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "That reply could not be read." }, { status: 400 });
  }

  // Honeypot. Bots fill hidden fields; people do not. Pretend it worked.
  if (clip(body.company, 80)) return Response.json({ ok: true });

  const name = clip(body.name, 80);
  const email = clip(body.email, 180).toLowerCase();
  const attending = clip(body.attending, 12);
  const guests = attending === "no" ? 0 : Math.min(8, Math.max(1, Number(body.guests) || 1));

  if (name.length < 2) return Response.json({ ok: false, error: "Please tell us your name." }, { status: 400 });
  if (!isEmail(email)) return Response.json({ ok: false, error: "A valid email lets you update this reply later." }, { status: 400 });
  if (!ATTENDING.has(attending)) return Response.json({ ok: false, error: "Let us know if you can come." }, { status: 400 });

  const next = {
    name,
    email,
    relation: clip(body.relation, 80),
    attending,
    guests,
    guestNames: clipBlock(body.guestNames, 400),
    meal: attending === "no" ? "" : clip(body.meal, 80),
    dietary: clipBlock(body.dietary, 280),
    song: clip(body.song, 120),
    message: clipBlock(body.message, 800),
    updatedAt: new Date(),
  };

  try {
    const [existing] = await db.select({ id: rsvps.id }).from(rsvps).where(eq(rsvps.email, email)).limit(1);
    const [saved] = existing
      ? await db.update(rsvps).set(next).where(eq(rsvps.email, email)).returning()
      : await db.insert(rsvps).values(next).returning();
    return Response.json({ ok: true, rsvp: publicRsvp(mapRsvp(saved)), updated: Boolean(existing) });
  } catch (error) {
    console.error(error);
    return Response.json(
      { ok: false, error: "We could not save that just now. Please try once more." },
      { status: 500 },
    );
  }
}
