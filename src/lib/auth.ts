// Atelier session.
//
// A signed, httpOnly cookie is enough for a couple editing their own invitation.
// Set ADMIN_PASSWORD and ADMIN_SECRET on Vercel before sharing the site.
// The sandbox preview uses the values in .env (default studio key: verde-atelier).
// When ADMIN_PASSWORD is missing in production, login is refused outright.

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ATELIER_COOKIE = "verde_atelier";

export function adminPassword() {
  return process.env.ADMIN_PASSWORD || "";
}

export function previewHint() {
  // Only reveal the key when it is still the documented sample. A custom
  // password set on Vercel is never sent to the browser.
  return adminPassword() === "verde-atelier" ? "verde-atelier" : null;
}

function secret() {
  return process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "";
}

export function passwordsMatch(input: string) {
  const expected = adminPassword();
  if (!expected || !secret()) return false;
  const left = Buffer.from(input);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function signSession() {
  const exp = Date.now() + 1000 * 60 * 60 * 12;
  const payload = `atelier.${exp}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifySession(token?: string | null) {
  if (!token || !secret()) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [scope, exp, sig] = parts;
  if (scope !== "atelier") return false;
  const payload = `${scope}.${exp}`;
  const expected = createHmac("sha256", secret()).update(payload).digest("hex");
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  if (!timingSafeEqual(left, right)) return false;
  return Number(exp) > Date.now();
}

export async function isAdmin() {
  const jar = await cookies();
  return verifySession(jar.get(ATELIER_COOKIE)?.value);
}

export async function setAdminCookie() {
  const jar = await cookies();
  jar.set(ATELIER_COOKIE, signSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminCookie() {
  const jar = await cookies();
  jar.set(ATELIER_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
