// Atelier sign-in and session probe.
// The cookie is httpOnly, so client script cannot read it. The browser only
// learns "yes, you may edit" from this JSON response.

import { clearAdminCookie, isAdmin, passwordsMatch, previewHint, setAdminCookie } from "@/lib/auth";
import { clip } from "@/lib/guards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return Response.json({ ok: await isAdmin(), previewHint: previewHint() });
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SECRET) {
    return Response.json(
      { ok: false, error: "Set ADMIN_PASSWORD and ADMIN_SECRET before opening the studio." },
      { status: 503 },
    );
  }

  if (!passwordsMatch(clip(body.password, 200))) {
    return Response.json({ ok: false, error: "That studio key is not right." }, { status: 401 });
  }

  await setAdminCookie();
  return Response.json({ ok: true });
}

export async function DELETE() {
  await clearAdminCookie();
  return Response.json({ ok: true });
}
