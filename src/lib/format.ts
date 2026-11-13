// Date, time, and calendar helpers.
// December in the Philippines does not observe daylight saving.
// Asia/Manila is UTC+8 all year, so a fixed offset is accurate for this wedding.

import type { Settings } from "@/lib/types";

const OFFSETS: Record<string, string> = {
  "Asia/Manila": "+08:00",
  "Asia/Singapore": "+08:00",
  "Asia/Hong_Kong": "+08:00",
  "Asia/Tokyo": "+09:00",
  "Australia/Sydney": "+11:00",
  "Europe/London": "+00:00",
  "America/New_York": "-05:00",
  "America/Los_Angeles": "-08:00",
  UTC: "+00:00",
};

const FILIPINO_MONTHS = [
  "Enero",
  "Pebrero",
  "Marso",
  "Abril",
  "Mayo",
  "Hunyo",
  "Hulyo",
  "Agosto",
  "Setyembre",
  "Oktubre",
  "Nobyembre",
  "Disyembre",
];

export function eventInstant(date: string, time: string, timeZone = "Asia/Manila") {
  const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "2026-12-28";
  const safeTime = /^\d{2}:\d{2}$/.test(time) ? time : "16:00";
  const offset = OFFSETS[timeZone] ?? "+08:00";
  const instant = new Date(`${safeDate}T${safeTime}:00${offset}`);
  return Number.isNaN(instant.getTime()) ? null : instant;
}

export function formatWeddingDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  // UTC construction keeps "2026-12-28" from slipping to the 27th in western zones.
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatFilipinoDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return `${day} ${FILIPINO_MONTHS[month - 1] ?? ""} ${year}`.trim();
}

export function formatTime(hhmm: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!match) return hhmm;
  const date = new Date(Date.UTC(2026, 0, 1, Number(match[1]), Number(match[2])));
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export function formatClock(timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timeZone || "Asia/Manila",
  }).format(new Date());
}

export function mealList(settings: Pick<Settings, "mealOptions">) {
  return settings.mealOptions
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
  return letters || "•";
}

export function buildEventJsonLd(settings: Settings) {
  const start = eventInstant(settings.weddingDate, settings.ceremonyTime, settings.timezone);
  const end = eventInstant(settings.weddingDate, settings.endTime, settings.timezone);
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `Wedding of ${settings.brideFull} and ${settings.groomFull}`,
    description: settings.tagline,
    startDate: start?.toISOString(),
    endDate: end?.toISOString(),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    image: ["/images/og-cover.jpg"],
    location: {
      "@type": "Place",
      name: `${settings.venueRoom}, ${settings.venueName}`,
      address: {
        "@type": "PostalAddress",
        streetAddress: settings.venueAddress,
        addressLocality: settings.city,
        addressCountry: "PH",
      },
    },
  };
}

// ICS times are emitted in UTC so calendar apps do not misread Manila time.
export function buildIcs(settings: Settings) {
  const start = eventInstant(settings.weddingDate, settings.ceremonyTime, settings.timezone);
  const end = eventInstant(settings.weddingDate, settings.endTime, settings.timezone);
  const stamp = (date: Date | null) =>
    date ? date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z") : "";

  const summary = `${settings.brideName} & ${settings.groomName} — Wedding`;
  const location = `${settings.venueRoom}, ${settings.venueName}, ${settings.venueAddress}`;
  const description = `${settings.tagline}\\n${settings.dressCode}. ${settings.hashtag}`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Verde Invitation//Wedding//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:wedding-${settings.weddingDate}@verde-invitation`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escapeIcs(summary)}`,
    `LOCATION:${escapeIcs(location)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

function escapeIcs(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}
