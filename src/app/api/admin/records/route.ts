// Creates, updates, and removes the repeating pieces of the invitation:
// story chapters, the day-of schedule, gallery, entourage, hotels, questions,
// gift notes, wishes, and RSVPs. Fields are allow-listed per collection.

import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  faqs,
  galleryItems,
  gifts,
  partyMembers,
  rsvps,
  scheduleItems,
  stays,
  stories,
  wishes,
} from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { clampNumber, clip, clipBlock, isEmail, safeUrl } from "@/lib/guards";
import { getSiteData } from "@/lib/site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Collection = "story" | "schedule" | "gallery" | "party" | "stay" | "faq" | "gift" | "wish" | "rsvp";

export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ ok: false, error: "Sign in to the studio." }, { status: 401 });

  let body: { collection?: Collection; action?: string; item?: Record<string, unknown> };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, error: "That change could not be read." }, { status: 400 });
  }

  const action = body.action;
  const item = body.item ?? {};
  const id = Number(item.id);

  try {
    if (action === "delete") {
      if (!Number.isFinite(id)) return Response.json({ ok: false, error: "Missing id." }, { status: 400 });
      await remove(body.collection, id);
      return Response.json({ ok: true, data: await getSiteData() });
    }

    if (action !== "create" && action !== "update") {
      return Response.json({ ok: false, error: "Unknown action." }, { status: 400 });
    }

    if (action === "update" && !Number.isFinite(id)) {
      return Response.json({ ok: false, error: "Missing id." }, { status: 400 });
    }

    await save(body.collection, action, item);
    return Response.json({ ok: true, data: await getSiteData() });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Could not save that.";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}

async function remove(collection: Collection | undefined, id: number) {
  switch (collection) {
    case "story":
      return db.delete(stories).where(eq(stories.id, id));
    case "schedule":
      return db.delete(scheduleItems).where(eq(scheduleItems.id, id));
    case "gallery":
      return db.delete(galleryItems).where(eq(galleryItems.id, id));
    case "party":
      return db.delete(partyMembers).where(eq(partyMembers.id, id));
    case "stay":
      return db.delete(stays).where(eq(stays.id, id));
    case "faq":
      return db.delete(faqs).where(eq(faqs.id, id));
    case "gift":
      return db.delete(gifts).where(eq(gifts.id, id));
    case "wish":
      return db.delete(wishes).where(eq(wishes.id, id));
    case "rsvp":
      return db.delete(rsvps).where(eq(rsvps.id, id));
    default:
      throw new Error("Unknown collection.");
  }
}

async function save(collection: Collection | undefined, action: "create" | "update", item: Record<string, unknown>) {
  const id = Number(item.id);
  const order = clampNumber(item.sortOrder, 0, 999, 0);

  if (collection === "story") {
    const values = {
      year: clip(item.year, 20),
      title: clip(item.title, 120),
      body: clipBlock(item.body, 1200),
      image: safeUrl(item.image),
      sortOrder: order,
    };
    if (!values.title) throw new Error("A chapter needs a title.");
    return action === "create"
      ? db.insert(stories).values(values)
      : db.update(stories).set(values).where(eq(stories.id, id));
  }

  if (collection === "schedule") {
    const values = {
      time: /^\d{2}:\d{2}$/.test(String(item.time)) ? String(item.time) : "16:00",
      title: clip(item.title, 80),
      detail: clipBlock(item.detail, 800),
      location: clip(item.location, 120),
      sortOrder: order,
    };
    if (!values.title) throw new Error("A moment needs a title.");
    return action === "create"
      ? db.insert(scheduleItems).values(values)
      : db.update(scheduleItems).set(values).where(eq(scheduleItems.id, id));
  }

  if (collection === "gallery") {
    const values = {
      src: safeUrl(item.src),
      alt: clip(item.alt, 180),
      caption: clip(item.caption, 180),
      category: clip(item.category, 40) || "Notes",
      sortOrder: order,
    };
    if (!values.src) throw new Error("A photograph needs an image URL.");
    return action === "create"
      ? db.insert(galleryItems).values(values)
      : db.update(galleryItems).set(values).where(eq(galleryItems.id, id));
  }

  if (collection === "party") {
    const side = ["bride", "groom", "sponsor"].includes(String(item.side)) ? String(item.side) : "bride";
    const values = {
      name: clip(item.name, 80),
      role: clip(item.role, 80),
      side,
      bio: clipBlock(item.bio, 400),
      image: safeUrl(item.image),
      sortOrder: order,
    };
    if (!values.name) throw new Error("A person needs a name.");
    return action === "create"
      ? db.insert(partyMembers).values(values)
      : db.update(partyMembers).set(values).where(eq(partyMembers.id, id));
  }

  if (collection === "stay") {
    const values = {
      name: clip(item.name, 120),
      area: clip(item.area, 80),
      note: clipBlock(item.note, 400),
      url: safeUrl(item.url),
      distance: clip(item.distance, 60),
      featured: Boolean(item.featured),
      sortOrder: order,
    };
    if (!values.name) throw new Error("A stay needs a name.");
    return action === "create" ? db.insert(stays).values(values) : db.update(stays).set(values).where(eq(stays.id, id));
  }

  if (collection === "faq") {
    const values = {
      question: clip(item.question, 180),
      answer: clipBlock(item.answer, 800),
      sortOrder: order,
    };
    if (!values.question) throw new Error("A question needs words.");
    return action === "create" ? db.insert(faqs).values(values) : db.update(faqs).set(values).where(eq(faqs.id, id));
  }

  if (collection === "gift") {
    const values = {
      title: clip(item.title, 80),
      detail: clipBlock(item.detail, 500),
      url: safeUrl(item.url),
      sortOrder: order,
    };
    if (!values.title) throw new Error("A note needs a title.");
    return action === "create" ? db.insert(gifts).values(values) : db.update(gifts).set(values).where(eq(gifts.id, id));
  }

  if (collection === "wish") {
    const values = {
      name: clip(item.name, 80),
      message: clipBlock(item.message, 500),
      approved: Boolean(item.approved),
    };
    if (action === "create") {
      if (!values.name || !values.message) throw new Error("A wish needs a name and a note.");
      return db.insert(wishes).values(values);
    }
    return db.update(wishes).set(values).where(eq(wishes.id, id));
  }

  if (collection === "rsvp") {
    // The couple may correct a reply, but guests remain the usual writers.
    const attending = ["yes", "no", "maybe"].includes(String(item.attending)) ? String(item.attending) : "yes";
    const email = clip(item.email, 180).toLowerCase();
    if (!isEmail(email)) throw new Error("That email does not look right.");
    const values = {
      name: clip(item.name, 80),
      email,
      relation: clip(item.relation, 80),
      attending,
      guests: attending === "no" ? 0 : clampNumber(item.guests, 1, 8, 1),
      guestNames: clipBlock(item.guestNames, 400),
      meal: clip(item.meal, 80),
      dietary: clipBlock(item.dietary, 280),
      song: clip(item.song, 120),
      message: clipBlock(item.message, 800),
      updatedAt: new Date(),
    };
    if (!values.name) throw new Error("A reply needs a name.");
    return action === "create"
      ? db.insert(rsvps).values(values)
      : db.update(rsvps).set(values).where(eq(rsvps.id, id));
  }

  throw new Error("Unknown collection.");
}


