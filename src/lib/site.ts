// Loads the invitation and seeds it on first run.
//
// `pg_advisory_xact_lock` keeps two simultaneous first visitors from inserting
// the sample twice. Explicit serial ids are omitted on insert so PostgreSQL's
// sequence stays ahead of the sample rows — important once the couple adds a
// chapter from Atelier.
//
// If the database is unreachable (a Vercel build without a network path, for
// example) the page still renders the sample. RSVP writes will say so plainly.

import { cache } from "react";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  faqs,
  galleryItems,
  gifts,
  partyMembers,
  rsvps,
  scheduleItems,
  sections,
  settings,
  stays,
  stories,
  wishes,
} from "@/db/schema";
import {
  defaultFaqs,
  defaultGallery,
  defaultGifts,
  defaultParty,
  defaultSchedule,
  defaultSections,
  defaultSettings,
  defaultStays,
  defaultStories,
  defaultWishes,
  fallbackSiteData,
} from "@/lib/defaults";
import type { Attending, Rsvp, Section, Settings, SiteData, Wish } from "@/lib/types";

function iso(value: Date | string | null | undefined) {
  if (!value) return new Date(0).toISOString();
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function withoutId<T extends { id: number }>(rows: T[]) {
  return rows.map((row) => {
    const copy = { ...row };
    delete (copy as { id?: number }).id;
    return copy;
  });
}

export async function ensureSeeded() {
  await db.transaction(async (tx) => {
    // Released automatically when the transaction ends.
    await tx.execute(sql`select pg_advisory_xact_lock(28122026)`);
    const existing = await tx.select({ id: settings.id }).from(settings).limit(1);
    if (existing.length > 0) return;

    const { id: _id, updatedAt: _updated, ...settingRow } = defaultSettings;
    await tx.insert(settings).values({ ...settingRow, id: 1 });
    await tx.insert(sections).values(defaultSections);
    await tx.insert(stories).values(withoutId(defaultStories));
    await tx.insert(scheduleItems).values(withoutId(defaultSchedule));
    await tx.insert(partyMembers).values(withoutId(defaultParty));
    await tx.insert(galleryItems).values(withoutId(defaultGallery));
    await tx.insert(stays).values(withoutId(defaultStays));
    await tx.insert(faqs).values(withoutId(defaultFaqs));
    await tx.insert(gifts).values(withoutId(defaultGifts));
    await tx.insert(wishes).values(
      defaultWishes.map(({ id: _wishId, createdAt, ...wish }) => ({
        ...wish,
        createdAt: new Date(createdAt),
      })),
    );
  });
}

function mapSettings(row: typeof settings.$inferSelect): Settings {
  return {
    ...row,
    livestreamUrl: row.livestreamUrl ?? "",
    musicUrl: row.musicUrl ?? "",
    updatedAt: iso(row.updatedAt),
  };
}

function mapSection(row: typeof sections.$inferSelect): Section {
  const backgroundType = row.backgroundType === "gradient" || row.backgroundType === "image" ? row.backgroundType : "color";
  const tone = row.tone === "dark" ? "dark" : "light";
  return { ...row, backgroundType, tone, overlay: row.overlay ?? 40 };
}

export async function loadSiteData(): Promise<SiteData> {
  const [settingRow] = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
  if (!settingRow) return fallbackSiteData();

  const [sectionRows, storyRows, scheduleRows, partyRows, galleryRows, stayRows, faqRows, giftRows, wishRows, rsvpRows] =
    await Promise.all([
      db.select().from(sections).orderBy(asc(sections.sortOrder)),
      db.select().from(stories).orderBy(asc(stories.sortOrder)),
      db.select().from(scheduleItems).orderBy(asc(scheduleItems.sortOrder)),
      db.select().from(partyMembers).orderBy(asc(partyMembers.sortOrder)),
      db.select().from(galleryItems).orderBy(asc(galleryItems.sortOrder)),
      db.select().from(stays).orderBy(asc(stays.sortOrder)),
      db.select().from(faqs).orderBy(asc(faqs.sortOrder)),
      db.select().from(gifts).orderBy(asc(gifts.sortOrder)),
      db.select().from(wishes).orderBy(desc(wishes.createdAt)),
      db.select().from(rsvps).orderBy(desc(rsvps.updatedAt)),
    ]);

  return {
    settings: mapSettings(settingRow),
    sections: sectionRows.map(mapSection),
    stories: storyRows,
    schedule: scheduleRows,
    gallery: galleryRows,
    party: partyRows,
    stays: stayRows,
    faqs: faqRows,
    gifts: giftRows,
    wishes: wishRows.map(mapWish),
    rsvps: rsvpRows.map(mapRsvp),
    source: "database",
  };
}

export function mapWish(row: typeof wishes.$inferSelect): Wish {
  return { ...row, createdAt: iso(row.createdAt) };
}

export function mapRsvp(row: typeof rsvps.$inferSelect): Rsvp {
  return {
    ...row,
    attending: row.attending as Attending,
    relation: row.relation ?? "",
    guestNames: row.guestNames ?? "",
    meal: row.meal ?? "",
    dietary: row.dietary ?? "",
    song: row.song ?? "",
    message: row.message ?? "",
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

// React cache() dedupes the read inside a single request (metadata + page).
export const getSiteData = cache(async (): Promise<SiteData> => {
  try {
    await ensureSeeded();
    return await loadSiteData();
  } catch (error) {
    console.error("Invitation database unavailable. Rendering the sample.", error);
    return fallbackSiteData();
  }
});

export const getPublicSiteData = cache(async (): Promise<SiteData> => {
  const data = await getSiteData();
  return {
    ...data,
    wishes: data.wishes.filter((wish) => wish.approved),
    // Replies stay in the database. They are not serialized into the public page.
    rsvps: [],
  };
});
