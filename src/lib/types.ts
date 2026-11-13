// Shared invitation types.
// Kept free of database imports so client components can use them safely.
// Dates cross the server/client boundary as ISO strings, never Date objects.

export type BackgroundType = "color" | "gradient" | "image";
export type Tone = "light" | "dark";
export type Attending = "yes" | "no" | "maybe";
export type PartySide = "bride" | "groom" | "sponsor";

export type PaletteSwatch = {
  name: string;
  hex: string;
  note: string;
};

export type Settings = {
  id: number;
  brideName: string;
  groomName: string;
  brideFull: string;
  groomFull: string;
  monogram: string;
  tagline: string;
  announcement: string;
  quote: string;
  weddingDate: string;
  ceremonyTime: string;
  receptionTime: string;
  endTime: string;
  timezone: string;
  rsvpDeadline: string;
  city: string;
  country: string;
  venueName: string;
  venueRoom: string;
  venueAddress: string;
  venueNote: string;
  arrivalNote: string;
  mapQuery: string;
  dressCode: string;
  dressNote: string;
  paletteJson: string;
  hashtag: string;
  brideBio: string;
  groomBio: string;
  brideParents: string;
  groomParents: string;
  brideRole: string;
  groomRole: string;
  bridePortrait: string;
  groomPortrait: string;
  couplePortrait: string;
  accent: string;
  accentDeep: string;
  ink: string;
  ivory: string;
  gold: string;
  sage: string;
  mealOptions: string;
  giftNote: string;
  footerNote: string;
  unpluggedNote: string;
  livestreamUrl: string;
  musicUrl: string;
  updatedAt: string;
};

export type Section = {
  key: string;
  label: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  visible: boolean;
  sortOrder: number;
  backgroundType: BackgroundType;
  backgroundColor: string;
  backgroundGradient: string;
  backgroundImage: string;
  overlay: number;
  tone: Tone;
};

export type Story = {
  id: number;
  year: string;
  title: string;
  body: string;
  image: string;
  sortOrder: number;
};

export type ScheduleItem = {
  id: number;
  time: string;
  title: string;
  detail: string;
  location: string;
  sortOrder: number;
};

export type PartyMember = {
  id: number;
  name: string;
  role: string;
  side: string;
  bio: string;
  image: string;
  sortOrder: number;
};

export type GalleryItem = {
  id: number;
  src: string;
  alt: string;
  caption: string;
  category: string;
  sortOrder: number;
};

export type Stay = {
  id: number;
  name: string;
  area: string;
  note: string;
  url: string;
  distance: string;
  featured: boolean;
  sortOrder: number;
};

export type Faq = {
  id: number;
  question: string;
  answer: string;
  sortOrder: number;
};

export type Gift = {
  id: number;
  title: string;
  detail: string;
  url: string;
  sortOrder: number;
};

export type Rsvp = {
  id: number;
  name: string;
  email: string;
  relation: string;
  attending: Attending | string;
  guests: number;
  guestNames: string;
  meal: string;
  dietary: string;
  song: string;
  message: string;
  createdAt: string;
  updatedAt: string;
};

export type Wish = {
  id: number;
  name: string;
  message: string;
  approved: boolean;
  createdAt: string;
};

// Public pages strip `rsvps` before rendering. Atelier receives the full list.
export type SiteData = {
  settings: Settings;
  sections: Section[];
  stories: Story[];
  schedule: ScheduleItem[];
  gallery: GalleryItem[];
  party: PartyMember[];
  stays: Stay[];
  faqs: Faq[];
  gifts: Gift[];
  wishes: Wish[];
  rsvps: Rsvp[];
  source: "database" | "fallback";
};
