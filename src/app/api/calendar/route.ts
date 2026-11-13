// Downloadable calendar file for the Manila evening.
// Times are converted to UTC inside buildIcs so phones do not shift the hour.

import { buildIcs } from "@/lib/format";
import { getSiteData } from "@/lib/site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const data = await getSiteData();
  const ics = buildIcs(data.settings);
  const filename = `${data.settings.brideName}-and-${data.settings.groomName}-wedding.ics`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename || "wedding"}.ics"`,
    },
  });
}
