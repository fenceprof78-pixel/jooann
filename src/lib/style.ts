// Turns a section row into a CSS background.
// Image backgrounds get a readable veil. The veil color follows the type tone:
// ivory type sits on a dark veil, ink type sits on a light veil.

import type { CSSProperties } from "react";
import { safeColor, safeGradient, safeUrl } from "@/lib/guards";
import type { Section, Settings } from "@/lib/types";

export function backgroundStyle(section: Section): CSSProperties {
  const overlay = Math.min(85, Math.max(0, section.overlay)) / 100;
  const color = safeColor(section.backgroundColor, "#0c221b");

  if (section.backgroundType === "image") {
    const image = safeUrl(section.backgroundImage);
    if (image) {
      const veil =
        section.tone === "light"
          ? `rgba(8, 20, 16, ${overlay})`
          : `rgba(244, 240, 230, ${Math.min(overlay, 0.72)})`;
      return {
        backgroundColor: color,
        backgroundImage: `linear-gradient(${veil}, ${veil}), url("${image}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
    }
  }

  if (section.backgroundType === "gradient") {
    const gradient = safeGradient(section.backgroundGradient);
    if (gradient) return { background: gradient };
  }

  return { background: color };
}

export function themeStyle(settings: Settings): CSSProperties {
  return {
    "--emerald": safeColor(settings.accent, "#1c6b49"),
    "--emerald-deep": safeColor(settings.accentDeep, "#0c221b"),
    "--ink": safeColor(settings.ink, "#12241c"),
    "--ivory": safeColor(settings.ivory, "#f4f0e6"),
    "--gold": safeColor(settings.gold, "#b8956c"),
    "--sage": safeColor(settings.sage, "#e7f0ea"),
  } as CSSProperties;
}
