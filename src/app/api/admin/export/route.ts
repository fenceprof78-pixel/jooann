// CSV of every reply, for the couple's own spreadsheet.
// Opened from Atelier. Not linked on the public invitation.

import { desc } from "drizzle-orm";
import { db } from "@/db";
import { rsvps } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { mapRsvp } from "@/lib/site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function cell(value: string | number) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await isAdmin())) return Response.json({ ok: false, error: "Sign in to the studio." }, { status: 401 });

  const rows = (await db.select().from(rsvps).orderBy(desc(rsvps.updatedAt))).map(mapRsvp);
  const header = ["Name", "Email", "Relation", "Attending", "Seats", "Guest names", "Meal", "Dietary", "Song", "Message", "Updated"];
  const lines = [
    header.join(","),
    ...rows.map((row) =>
      [row.name, row.email, row.relation, row.attending, row.guests, row.guestNames, row.meal, row.dietary, row.song, row.message, row.updatedAt]
        .map(cell)
        .join(","),
    ),
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="wedding-replies.csv"',
    },
  });
}
