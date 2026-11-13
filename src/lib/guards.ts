// Input guards shared by the atelier API and the renderer.
// Admin content is trusted more than guest content, but both are clamped
// so a pasted stylesheet or script URL cannot become an executable background.

import type { BackgroundType, PaletteSwatch, Tone } from "@/lib/types";

export function clip(value: unknown, max: number) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function clipBlock(value: unknown, max: number) {
  return String(value ?? "").replace(/\r\n/g, "\n").trim().slice(0, max);
}

export function safeColor(value: unknown, fallback: string) {
  const color = String(value ?? "").trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color) ? color : fallback;
}

export function safeUrl(value: unknown) {
  const raw = String(value ?? "").trim().slice(0, 800);
  if (!raw) return "";
  // Site-relative assets ("/images/silk.jpg") are allowed. Protocol-relative URLs are not.
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  try {
    const url = new URL(raw);
    if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
  } catch {
    return "";
  }
  return "";
}

export function safeGradient(value: unknown) {
  const gradient = String(value ?? "").trim().slice(0, 500);
  if (!gradient) return "";
  if (/url\s*\(|expression|javascript:|@import|<|>/i.test(gradient)) return "";
  if (!/^(linear-gradient|radial-gradient|conic-gradient)\(/i.test(gradient)) return "";
  return gradient;
}

export function safeTone(value: unknown): Tone {
  return value === "dark" ? "dark" : "light";
}

export function safeBackgroundType(value: unknown): BackgroundType {
  if (value === "gradient" || value === "image" || value === "color") return value;
  return "color";
}

export function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 180;
}

export function parsePalette(raw: string, fallback: PaletteSwatch[]): PaletteSwatch[] {
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return fallback;
    const swatches = data
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const record = item as Record<string, unknown>;
        const hex = safeColor(record.hex, "");
        const name = clip(record.name, 40);
        if (!hex || !name) return null;
        return { name, hex, note: clipBlock(record.note, 280) };
      })
      .filter((item): item is PaletteSwatch => Boolean(item))
      .slice(0, 8);
    return swatches.length ? swatches : fallback;
  } catch {
    return fallback;
  }
}
