// Full invitation payload for Atelier, including hidden wishes and replies.
// The public page never calls this.

import { isAdmin } from "@/lib/auth";
import { getSiteData } from "@/lib/site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ ok: false, error: "Sign in to the studio." }, { status: 401 });
  return Response.json({ ok: true, data: await getSiteData() });
}
