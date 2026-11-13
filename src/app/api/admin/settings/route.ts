// Replaces the singleton invitation settings row.
// Colors, URLs, and the attire palette are sanitized before they are stored.

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { defaultPalette } from "@/lib/defaults";
import { clip, clipBlock, parsePalette, safeColor, safeUrl } from "@/lib/guards";
import { getSiteData } from "@/lib/site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PUT(request: Request) {
  if (!(await isAdmin())) return Response.json({ ok: false, error: "Sign in to the studio." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "Those settings could not be read." }, { status: 400 });
  }

  const palette = parsePalette(String(body.paletteJson ?? ""), defaultPalette);
  const weddingDate = /^\d{4}-\d{2}-\d{2}$/.test(String(body.weddingDate)) ? String(body.weddingDate) : "2026-12-28";
  const time = (value: unknown, fallback: string) => (/^\d{2}:\d{2}$/.test(String(value)) ? String(value) : fallback);

  const next = {
    brideName: clip(body.brideName, 40) || "Liana",
    groomName: clip(body.groomName, 40) || "Mateo",
    brideFull: clip(body.brideFull, 80),
    groomFull: clip(body.groomFull, 80),
    monogram: clip(body.monogram, 12) || "L&M",
    tagline: clipBlock(body.tagline, 220),
    announcement: clipBlock(body.announcement, 280),
    quote: clipBlock(body.quote, 320),
    weddingDate,
    ceremonyTime: time(body.ceremonyTime, "16:00"),
    receptionTime: time(body.receptionTime, "18:30"),
    endTime: time(body.endTime, "23:00"),
    timezone: clip(body.timezone, 60) || "Asia/Manila",
    rsvpDeadline: /^\d{4}-\d{2}-\d{2}$/.test(String(body.rsvpDeadline)) ? String(body.rsvpDeadline) : weddingDate,
    city: clip(body.city, 80),
    country: clip(body.country, 80),
    venueName: clip(body.venueName, 120),
    venueRoom: clip(body.venueRoom, 120),
    venueAddress: clipBlock(body.venueAddress, 240),
    venueNote: clipBlock(body.venueNote, 800),
    arrivalNote: clipBlock(body.arrivalNote, 800),
    mapQuery: clip(body.mapQuery, 180),
    dressCode: clip(body.dressCode, 80),
    dressNote: clipBlock(body.dressNote, 800),
    paletteJson: JSON.stringify(palette),
    hashtag: clip(body.hashtag, 40),
    brideBio: clipBlock(body.brideBio, 700),
    groomBio: clipBlock(body.groomBio, 700),
    brideParents: clip(body.brideParents, 160),
    groomParents: clip(body.groomParents, 160),
    brideRole: clip(body.brideRole, 60),
    groomRole: clip(body.groomRole, 60),
    bridePortrait: safeUrl(body.bridePortrait),
    groomPortrait: safeUrl(body.groomPortrait),
    couplePortrait: safeUrl(body.couplePortrait),
    accent: safeColor(body.accent, "#1C6B49"),
    accentDeep: safeColor(body.accentDeep, "#0C221B"),
    ink: safeColor(body.ink, "#12241C"),
    ivory: safeColor(body.ivory, "#F4F0E6"),
    gold: safeColor(body.gold, "#B8956C"),
    sage: safeColor(body.sage, "#E7F0EA"),
    mealOptions: clip(body.mealOptions, 240),
    giftNote: clipBlock(body.giftNote, 800),
    footerNote: clipBlock(body.footerNote, 320),
    unpluggedNote: clipBlock(body.unpluggedNote, 500),
    livestreamUrl: safeUrl(body.livestreamUrl),
    musicUrl: safeUrl(body.musicUrl),
    updatedAt: new Date(),
  };

  try {
    await db.update(settings).set(next).where(eq(settings.id, 1));
    return Response.json({ ok: true, data: await getSiteData() });
  } catch (error) {
    console.error(error);
    return Response.json({ ok: false, error: "Settings could not be saved." }, { status: 500 });
  }
}
