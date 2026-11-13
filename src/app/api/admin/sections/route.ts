// Saves every section band: headings, visibility, order, and background.
// A background is a color, a CSS gradient, or an image URL — never raw CSS.

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sections } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import {
  clampNumber,
  clip,
  clipBlock,
  safeBackgroundType,
  safeColor,
  safeGradient,
  safeTone,
  safeUrl,
} from "@/lib/guards";
import { getSiteData } from "@/lib/site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PUT(request: Request) {
  if (!(await isAdmin())) return Response.json({ ok: false, error: "Sign in to the studio." }, { status: 401 });

  let body: { sections?: unknown };
  try {
    body = (await request.json()) as { sections?: unknown };
  } catch {
    return Response.json({ ok: false, error: "Those backgrounds could not be read." }, { status: 400 });
  }

  if (!Array.isArray(body.sections)) {
    return Response.json({ ok: false, error: "Send the full list of sections." }, { status: 400 });
  }

  try {
    for (const item of body.sections) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const key = clip(row.key, 40);
      if (!key) continue;
      await db
        .update(sections)
        .set({
          label: clip(row.label, 40) || key,
          eyebrow: clip(row.eyebrow, 60),
          title: clip(row.title, 120),
          subtitle: clipBlock(row.subtitle, 400),
          visible: Boolean(row.visible),
          sortOrder: clampNumber(row.sortOrder, 0, 999, 0),
          backgroundType: safeBackgroundType(row.backgroundType),
          backgroundColor: safeColor(row.backgroundColor, "#0C221B"),
          backgroundGradient: safeGradient(row.backgroundGradient) || "linear-gradient(160deg, #0C221B, #1C6B49)",
          backgroundImage: safeUrl(row.backgroundImage),
          overlay: clampNumber(row.overlay, 0, 85, 40),
          tone: safeTone(row.tone),
        })
        .where(eq(sections.key, key));
    }
    return Response.json({ ok: true, data: await getSiteData() });
  } catch (error) {
    console.error(error);
    return Response.json({ ok: false, error: "Backgrounds could not be saved." }, { status: 500 });
  }
}
