// Invitation data model.
//
// This schema is intentionally plain PostgreSQL so the same tables work in:
//   1. this local sandbox (DATABASE_URL in .env)
//   2. Supabase Postgres — paste the Session pooler URI into Vercel as DATABASE_URL
//   3. any other Postgres host
//
// Apply it with `npx drizzle-kit push` (no migration files required).
// The app seeds a complete sample invitation the first time the tables are empty.
// After that, every string, color, and photograph is edited in /atelier — nothing
// guest-facing is hardcoded in the React tree except layout.

import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// Singleton row (id = 1). Names, the Manila date, theme colors, and long copy.
export const settings = pgTable("settings", {
  id: integer("id").primaryKey(),
  brideName: text("bride_name").notNull(),
  groomName: text("groom_name").notNull(),
  brideFull: text("bride_full").notNull(),
  groomFull: text("groom_full").notNull(),
  monogram: text("monogram").notNull(),
  tagline: text("tagline").notNull(),
  announcement: text("announcement").notNull(),
  quote: text("quote").notNull(),
  weddingDate: text("wedding_date").notNull(),
  ceremonyTime: text("ceremony_time").notNull(),
  receptionTime: text("reception_time").notNull(),
  endTime: text("end_time").notNull(),
  timezone: text("timezone").notNull(),
  rsvpDeadline: text("rsvp_deadline").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  venueName: text("venue_name").notNull(),
  venueRoom: text("venue_room").notNull(),
  venueAddress: text("venue_address").notNull(),
  venueNote: text("venue_note").notNull(),
  arrivalNote: text("arrival_note").notNull(),
  mapQuery: text("map_query").notNull(),
  dressCode: text("dress_code").notNull(),
  dressNote: text("dress_note").notNull(),
  // JSON array of { name, hex, note } — the interactive attire palette.
  paletteJson: text("palette_json").notNull(),
  hashtag: text("hashtag").notNull(),
  brideBio: text("bride_bio").notNull(),
  groomBio: text("groom_bio").notNull(),
  brideParents: text("bride_parents").notNull(),
  groomParents: text("groom_parents").notNull(),
  brideRole: text("bride_role").notNull(),
  groomRole: text("groom_role").notNull(),
  bridePortrait: text("bride_portrait").notNull(),
  groomPortrait: text("groom_portrait").notNull(),
  couplePortrait: text("couple_portrait").notNull(),
  // Theme tokens. Section backgrounds are independent and live on `sections`.
  accent: text("accent").notNull(),
  accentDeep: text("accent_deep").notNull(),
  ink: text("ink").notNull(),
  ivory: text("ivory").notNull(),
  gold: text("gold").notNull(),
  sage: text("sage").notNull(),
  mealOptions: text("meal_options").notNull(),
  giftNote: text("gift_note").notNull(),
  footerNote: text("footer_note").notNull(),
  unpluggedNote: text("unplugged_note").notNull(),
  livestreamUrl: text("livestream_url").notNull().default(""),
  // Optional licensed audio URL (Supabase Storage is a good home). Never autoplays.
  musicUrl: text("music_url").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// One row per landing band. Background can be a flat color, a CSS gradient, or an image.
// `tone` decides whether type on top of that background is ivory ("light") or ink ("dark").
export const sections = pgTable("sections", {
  key: text("key").primaryKey(),
  label: text("label").notNull(),
  eyebrow: text("eyebrow").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  visible: boolean("visible").notNull().default(true),
  sortOrder: integer("sort_order").notNull(),
  backgroundType: text("background_type").notNull(),
  backgroundColor: text("background_color").notNull(),
  backgroundGradient: text("background_gradient").notNull(),
  backgroundImage: text("background_image").notNull(),
  overlay: integer("overlay").notNull().default(40),
  tone: text("tone").notNull(),
});

export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  year: text("year").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  image: text("image").notNull().default(""),
  sortOrder: integer("sort_order").notNull(),
});

export const scheduleItems = pgTable("schedule_items", {
  id: serial("id").primaryKey(),
  time: text("time").notNull(),
  title: text("title").notNull(),
  detail: text("detail").notNull(),
  location: text("location").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const partyMembers = pgTable("party_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  side: text("side").notNull(),
  bio: text("bio").notNull(),
  image: text("image").notNull().default(""),
  sortOrder: integer("sort_order").notNull(),
});

export const galleryItems = pgTable("gallery_items", {
  id: serial("id").primaryKey(),
  src: text("src").notNull(),
  alt: text("alt").notNull(),
  caption: text("caption").notNull(),
  category: text("category").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const stays = pgTable("stays", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  area: text("area").notNull(),
  note: text("note").notNull(),
  url: text("url").notNull().default(""),
  distance: text("distance").notNull(),
  featured: boolean("featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull(),
});

export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const gifts = pgTable("gifts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  detail: text("detail").notNull(),
  url: text("url").notNull().default(""),
  sortOrder: integer("sort_order").notNull(),
});

// Guest replies. Email is unique so a guest can update rather than duplicate.
export const rsvps = pgTable("rsvps", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  relation: text("relation").notNull().default(""),
  attending: text("attending").notNull(),
  guests: integer("guests").notNull().default(1),
  guestNames: text("guest_names").notNull().default(""),
  meal: text("meal").notNull().default(""),
  dietary: text("dietary").notNull().default(""),
  song: text("song").notNull().default(""),
  message: text("message").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const wishes = pgTable("wishes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  message: text("message").notNull(),
  approved: boolean("approved").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
