"use client";

// Atelier is the couple's studio.
// It writes to the same Postgres database the invitation reads, which is why
// a Supabase connection string on Vercel is enough — no separate CMS.
// Image fields accept site paths or https URLs (Supabase Storage public links).

import { useEffect, useState, type FormEvent } from "react";
import { formatWeddingDate } from "@/lib/format";
import { defaultPalette } from "@/lib/defaults";
import { parsePalette } from "@/lib/guards";
import type { PaletteSwatch, Section, Settings, SiteData } from "@/lib/types";

type Tab =
  | "overview"
  | "identity"
  | "event"
  | "voice"
  | "theme"
  | "backgrounds"
  | "story"
  | "day"
  | "gallery"
  | "people"
  | "stay"
  | "questions"
  | "gifts"
  | "replies"
  | "wishes"
  | "deploy";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "identity", label: "Names" },
  { id: "event", label: "The day" },
  { id: "voice", label: "Voice" },
  { id: "theme", label: "Colors" },
  { id: "backgrounds", label: "Backgrounds" },
  { id: "story", label: "Story" },
  { id: "day", label: "Schedule" },
  { id: "gallery", label: "Gallery" },
  { id: "people", label: "People" },
  { id: "stay", label: "Stays" },
  { id: "gifts", label: "Gifts" },
  { id: "questions", label: "Questions" },
  { id: "replies", label: "Replies" },
  { id: "wishes", label: "Wishes" },
  { id: "deploy", label: "Deploy" },
];

export function AtelierApp({
  initialAdmin,
  initialData,
  previewHint,
}: {
  initialAdmin: boolean;
  initialData: SiteData | null;
  previewHint: string | null;
}) {
  const [admin, setAdmin] = useState(initialAdmin);
  const [data, setData] = useState<SiteData | null>(initialData);
  const [tab, setTab] = useState<Tab>("overview");
  const [toast, setToast] = useState("");

  function note(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  async function refresh() {
    const response = await fetch("/api/admin/content");
    const payload = (await response.json()) as { ok: boolean; data?: SiteData; error?: string };
    if (!response.ok || !payload.data) {
      note(payload.error || "Could not refresh.");
      return null;
    }
    setData(payload.data);
    return payload.data;
  }

  if (!admin || !data) {
    return <Login previewHint={previewHint} onSuccess={async () => { setAdmin(true); await refresh(); }} />;
  }

  return (
    <div className="min-h-screen bg-[#f4f0e6] text-[#12241c]">
      <header className="sticky top-0 z-20 border-b border-black/10 bg-[#f4f0e6]/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#1c6b49]">Atelier</p>
            <h1 className="display text-3xl leading-none">{data.settings.brideName} & {data.settings.groomName}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <a className="btn btn-line" href="/" target="_blank" rel="noreferrer">View invitation</a>
            <button
              type="button"
              className="btn btn-emerald"
              onClick={async () => {
                await fetch("/api/admin/login", { method: "DELETE" });
                setAdmin(false);
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[200px_1fr]">
        <nav className="flex gap-2 overflow-auto lg:flex-col" aria-label="Studio">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-full px-3 py-2 text-left text-sm ${tab === item.id ? "bg-[#0c221b] text-[#f4f0e6]" : "bg-white/60"}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <main className="min-w-0">
          {tab === "overview" ? <Overview data={data} /> : null}
          {tab === "identity" ? <SettingsForm data={data} group="identity" onSaved={(next) => { setData(next); note("Names saved"); }} /> : null}
          {tab === "event" ? <SettingsForm data={data} group="event" onSaved={(next) => { setData(next); note("Event saved"); }} /> : null}
          {tab === "voice" ? <SettingsForm data={data} group="voice" onSaved={(next) => { setData(next); note("Voice saved"); }} /> : null}
          {tab === "theme" ? <ThemeForm data={data} onSaved={(next) => { setData(next); note("Colors saved"); }} /> : null}
          {tab === "backgrounds" ? <BackgroundForm data={data} onSaved={(next) => { setData(next); note("Backgrounds saved"); }} /> : null}
          {tab === "story" ? <CollectionEditor title="Chapters" collection="story" items={data.stories} fields={storyFields} blank={blankStory} onSaved={refresh} /> : null}
          {tab === "day" ? <CollectionEditor title="Schedule" collection="schedule" items={data.schedule} fields={scheduleFields} blank={blankSchedule} onSaved={refresh} /> : null}
          {tab === "gallery" ? <CollectionEditor title="Gallery" collection="gallery" items={data.gallery} fields={galleryFields} blank={blankGallery} onSaved={refresh} /> : null}
          {tab === "people" ? <CollectionEditor title="Entourage" collection="party" items={data.party} fields={partyFields} blank={blankParty} onSaved={refresh} /> : null}
          {tab === "stay" ? <CollectionEditor title="Places to stay" collection="stay" items={data.stays} fields={stayFields} blank={blankStay} onSaved={refresh} /> : null}
          {tab === "gifts" ? <CollectionEditor title="Gift notes" collection="gift" items={data.gifts} fields={giftFields} blank={blankGift} onSaved={refresh} /> : null}
          {tab === "questions" ? <CollectionEditor title="Questions" collection="faq" items={data.faqs} fields={faqFields} blank={blankFaq} onSaved={refresh} /> : null}
          {tab === "replies" ? <Replies data={data} onSaved={refresh} /> : null}
          {tab === "wishes" ? <Wishes data={data} onSaved={refresh} /> : null}
          {tab === "deploy" ? <Deploy source={data.source} /> : null}
        </main>
      </div>
      {toast ? <p className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full bg-[#0c221b] px-4 py-2 text-sm text-[#f4f0e6]">{toast}</p> : null}
    </div>
  );
}

function Login({ previewHint, onSuccess }: { previewHint: string | null; onSuccess: () => Promise<void> }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const payload = (await response.json()) as { ok: boolean; error?: string };
    setPending(false);
    if (!response.ok) {
      setError(payload.error || "Could not open the studio.");
      return;
    }
    await onSuccess();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#0c221b] px-4 text-[#f4f0e6]">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-xl">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#e6d3b4]">Atelier</p>
        <h1 className="display mt-2 text-5xl">The studio key</h1>
        <p className="mt-2 text-sm text-white/75">Names, colors, photographs, and every section background live behind this door.</p>
        <label className="label mt-5 text-white/80">
          Key
          <input className="field" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoFocus />
        </label>
        {error ? <p className="alert mt-3" role="alert">{error}</p> : null}
        <button className="btn btn-solid mt-4 w-full" disabled={pending}>{pending ? "Opening" : "Enter"}</button>
        {previewHint ? (
          <details className="mt-4 text-sm text-white/70">
            <summary className="cursor-pointer">Preview key</summary>
            <p className="mt-2">This sandbox still uses <strong>{previewHint}</strong>. Set <code>ADMIN_PASSWORD</code> on Vercel before you share the link — the hint disappears once the key is no longer the sample.</p>
          </details>
        ) : null}
      </form>
    </main>
  );
}

function Overview({ data }: { data: SiteData }) {
  const seats = data.rsvps.filter((rsvp) => rsvp.attending === "yes").reduce((sum, rsvp) => sum + rsvp.guests, 0);
  const declined = data.rsvps.filter((rsvp) => rsvp.attending === "no").length;
  const maybe = data.rsvps.filter((rsvp) => rsvp.attending === "maybe").length;
  return (
    <section>
      <p className="eyebrow">Overview</p>
      <h2 className="section-title">The evening, as it stands</h2>
      <p className="muted">{formatWeddingDate(data.settings.weddingDate)} · {data.settings.venueName}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Seats accepted" value={String(seats)} />
        <Stat label="Still arranging" value={String(maybe)} />
        <Stat label="Regrets" value={String(declined)} />
      </div>
      <p className="mt-6 max-w-xl text-sm leading-6 text-[#4d6156]">
        Change a name here and the invitation follows. Section backgrounds can be a flat color, a CSS gradient, or a photograph. On the invitation itself, a signed-in session also shows a Background control on each band.
      </p>
      {data.source === "fallback" ? (
        <p className="alert mt-4">The database is not connected, so you are seeing sample copy. Run <code>npx drizzle-kit push</code> against your Supabase URI, then reload.</p>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl bg-white/70 p-4">
      <p className="kicker-small">{label}</p>
      <p className="display text-5xl">{value}</p>
    </article>
  );
}

const GROUPS: Record<string, { key: keyof Settings; label: string; area?: boolean }[]> = {
  identity: [
    { key: "brideName", label: "Bride, short" },
    { key: "groomName", label: "Groom, short" },
    { key: "brideFull", label: "Bride, full" },
    { key: "groomFull", label: "Groom, full" },
    { key: "monogram", label: "Monogram" },
    { key: "hashtag", label: "Hashtag" },
    { key: "brideRole", label: "Bride’s role" },
    { key: "groomRole", label: "Groom’s role" },
    { key: "brideParents", label: "Bride’s family line" },
    { key: "groomParents", label: "Groom’s family line" },
    { key: "bridePortrait", label: "Bride portrait URL" },
    { key: "groomPortrait", label: "Groom portrait URL" },
    { key: "couplePortrait", label: "Couple portrait URL" },
    { key: "brideBio", label: "Bride’s note", area: true },
    { key: "groomBio", label: "Groom’s note", area: true },
  ],
  event: [
    { key: "weddingDate", label: "Date (YYYY-MM-DD)" },
    { key: "ceremonyTime", label: "Ceremony (HH:MM)" },
    { key: "receptionTime", label: "Dinner (HH:MM)" },
    { key: "endTime", label: "End (HH:MM)" },
    { key: "timezone", label: "Timezone" },
    { key: "rsvpDeadline", label: "RSVP deadline" },
    { key: "city", label: "City" },
    { key: "country", label: "Country" },
    { key: "venueName", label: "Venue" },
    { key: "venueRoom", label: "Room" },
    { key: "venueAddress", label: "Address", area: true },
    { key: "mapQuery", label: "Map search" },
    { key: "venueNote", label: "About the room", area: true },
    { key: "arrivalNote", label: "Getting there", area: true },
    { key: "mealOptions", label: "Meals, comma separated" },
  ],
  voice: [
    { key: "tagline", label: "Tagline", area: true },
    { key: "announcement", label: "Family line", area: true },
    { key: "quote", label: "Opening quote", area: true },
    { key: "dressCode", label: "Dress code" },
    { key: "dressNote", label: "Attire note", area: true },
    { key: "unpluggedNote", label: "Unplugged note", area: true },
    { key: "giftNote", label: "Gift note", area: true },
    { key: "footerNote", label: "Footer", area: true },
    { key: "livestreamUrl", label: "Livestream URL" },
    { key: "musicUrl", label: "Music URL (licensed mp3)" },
  ],
};

function SettingsForm({
  data,
  group,
  onSaved,
}: {
  data: SiteData;
  group: keyof typeof GROUPS;
  onSaved: (data: SiteData) => void;
}) {
  const [draft, setDraft] = useState(data.settings);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const payload = (await response.json()) as { ok: boolean; data?: SiteData; error?: string };
    setPending(false);
    if (!response.ok || !payload.data) {
      setError(payload.error || "Could not save.");
      return;
    }
    onSaved(payload.data);
  }

  return (
    <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
      {GROUPS[group].map((field) => (
        <label key={field.key} className={`label ${field.area ? "sm:col-span-2" : ""}`}>
          {field.label}
          {field.area ? (
            <textarea className="textarea" value={String(draft[field.key] ?? "")} onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })} />
          ) : (
            <input className="field" value={String(draft[field.key] ?? "")} onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })} />
          )}
        </label>
      ))}
      {error ? <p className="alert sm:col-span-2">{error}</p> : null}
      <button className="btn btn-emerald" disabled={pending}>{pending ? "Saving" : "Save"}</button>
    </form>
  );
}

function ThemeForm({ data, onSaved }: { data: SiteData; onSaved: (data: SiteData) => void }) {
  const [draft, setDraft] = useState(data.settings);
  const [palette, setPalette] = useState<PaletteSwatch[]>(parsePalette(data.settings.paletteJson, defaultPalette));
  const [pending, setPending] = useState(false);
  const colors: { key: keyof Settings; label: string }[] = [
    { key: "accent", label: "Emerald" },
    { key: "accentDeep", label: "Deep" },
    { key: "ink", label: "Ink" },
    { key: "ivory", label: "Ivory" },
    { key: "gold", label: "Gold" },
    { key: "sage", label: "Sage" },
  ];

  async function save(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, paletteJson: JSON.stringify(palette) }),
    });
    const payload = (await response.json()) as { data?: SiteData };
    setPending(false);
    if (payload.data) onSaved(payload.data);
  }

  return (
    <form onSubmit={save} className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {colors.map((color) => (
          <label key={color.key} className="label">
            {color.label}
            <input type="color" value={String(draft[color.key])} onChange={(event) => setDraft({ ...draft, [color.key]: event.target.value })} />
            <input className="field" value={String(draft[color.key])} onChange={(event) => setDraft({ ...draft, [color.key]: event.target.value })} />
          </label>
        ))}
      </div>
      <div className="grid gap-3">
        <h3 className="display text-3xl">Attire palette</h3>
        {palette.map((swatch, index) => (
          <div key={index} className="grid gap-2 rounded-2xl bg-white/70 p-3 sm:grid-cols-[120px_1fr]">
            <input type="color" value={swatch.hex} onChange={(event) => setPalette(palette.map((item, i) => i === index ? { ...item, hex: event.target.value } : item))} />
            <div className="grid gap-2">
              <input className="field" value={swatch.name} onChange={(event) => setPalette(palette.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} />
              <textarea className="textarea" value={swatch.note} onChange={(event) => setPalette(palette.map((item, i) => i === index ? { ...item, note: event.target.value } : item))} />
            </div>
          </div>
        ))}
      </div>
      <button className="btn btn-emerald" disabled={pending}>{pending ? "Saving" : "Save colors"}</button>
    </form>
  );
}

function BackgroundForm({ data, onSaved }: { data: SiteData; onSaved: (data: SiteData) => void }) {
  const [rows, setRows] = useState<Section[]>(data.sections);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  function move(index: number, direction: number) {
    const next = [...rows];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setRows(next.map((section, order) => ({ ...section, sortOrder: (order + 1) * 10 })));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch("/api/admin/sections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sections: rows }),
    });
    const payload = (await response.json()) as { ok: boolean; data?: SiteData; error?: string };
    setPending(false);
    if (!response.ok || !payload.data) {
      setError(payload.error || "Could not save backgrounds.");
      return;
    }
    onSaved(payload.data);
  }

  return (
    <form onSubmit={save} className="grid gap-4">
      <p className="muted">Every band can be a color, a gradient, or an image. Overlay keeps type readable. Ivory type suits dark fills; ink type suits light ones.</p>
      {rows.map((section, index) => (
        <article key={section.key} className="grid gap-3 rounded-2xl bg-white/75 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="display text-3xl">{section.label}</h3>
            <div className="cluster">
              <button type="button" className="btn btn-line" onClick={() => move(index, -1)}>Up</button>
              <button type="button" className="btn btn-line" onClick={() => move(index, 1)}>Down</button>
              <label className="text-sm">
                <input type="checkbox" checked={section.visible} onChange={(event) => setRows(rows.map((row) => row.key === section.key ? { ...row, visible: event.target.checked } : row))} /> Visible
              </label>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Field label="Eyebrow" value={section.eyebrow} onChange={(value) => setRows(rows.map((row) => row.key === section.key ? { ...row, eyebrow: value } : row))} />
            <Field label="Title" value={section.title} onChange={(value) => setRows(rows.map((row) => row.key === section.key ? { ...row, title: value } : row))} />
            <label className="label">
              Fill
              <select className="select" value={section.backgroundType} onChange={(event) => setRows(rows.map((row) => row.key === section.key ? { ...row, backgroundType: event.target.value as Section["backgroundType"] } : row))}>
                <option value="color">Color</option>
                <option value="gradient">Gradient</option>
                <option value="image">Image</option>
              </select>
            </label>
          </div>
          <Field label="Subtitle" value={section.subtitle} area onChange={(value) => setRows(rows.map((row) => row.key === section.key ? { ...row, subtitle: value } : row))} />
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="label">
              Color
              <input className="field" type="color" value={/^#[0-9a-f]{6}$/i.test(section.backgroundColor) ? section.backgroundColor : "#0c221b"} onChange={(event) => setRows(rows.map((row) => row.key === section.key ? { ...row, backgroundColor: event.target.value } : row))} />
            </label>
            <label className="label">
              Type color
              <select className="select" value={section.tone} onChange={(event) => setRows(rows.map((row) => row.key === section.key ? { ...row, tone: event.target.value as Section["tone"] } : row))}>
                <option value="light">Ivory type</option>
                <option value="dark">Ink type</option>
              </select>
            </label>
            <Field label="Gradient" value={section.backgroundGradient} onChange={(value) => setRows(rows.map((row) => row.key === section.key ? { ...row, backgroundGradient: value } : row))} />
            <Field label="Image URL" value={section.backgroundImage} onChange={(value) => setRows(rows.map((row) => row.key === section.key ? { ...row, backgroundImage: value } : row))} />
          </div>
          <label className="label">
            Overlay {section.overlay}%
            <input type="range" min={0} max={80} value={section.overlay} onChange={(event) => setRows(rows.map((row) => row.key === section.key ? { ...row, overlay: Number(event.target.value) } : row))} />
          </label>
          <div className="h-16 rounded-xl border border-black/10" style={{ background: previewBackground(section) }} />
        </article>
      ))}
      {error ? <p className="alert">{error}</p> : null}
      <button className="btn btn-emerald" disabled={pending}>{pending ? "Saving" : "Save backgrounds"}</button>
    </form>
  );
}

function previewBackground(section: Section) {
  if (section.backgroundType === "image" && section.backgroundImage) return `center / cover url("${section.backgroundImage}")`;
  if (section.backgroundType === "gradient") return section.backgroundGradient;
  return section.backgroundColor;
}

function Field({ label, value, onChange, area }: { label: string; value: string; onChange: (value: string) => void; area?: boolean }) {
  return (
    <label className="label">
      {label}
      {area ? <textarea className="textarea" value={value} onChange={(event) => onChange(event.target.value)} /> : <input className="field" value={value} onChange={(event) => onChange(event.target.value)} />}
    </label>
  );
}

type EditorField = { key: string; label: string; kind?: "text" | "textarea" | "select" | "checkbox"; options?: string[] };

function CollectionEditor({
  title,
  collection,
  items,
  fields,
  blank,
  onSaved,
}: {
  title: string;
  collection: string;
  items: Array<Record<string, unknown> & { id: number }>;
  fields: EditorField[];
  blank: () => Record<string, unknown>;
  onSaved: () => Promise<SiteData | null>;
}) {
  const [drafts, setDrafts] = useState(items);
  const [fresh, setFresh] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => setDrafts(items), [items]);

  async function send(action: "create" | "update" | "delete", item: Record<string, unknown>) {
    setError("");
    const response = await fetch("/api/admin/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collection, action, item }),
    });
    const payload = (await response.json()) as { ok: boolean; error?: string };
    if (!response.ok) {
      setError(payload.error || "Could not save.");
      return;
    }
    setFresh(null);
    await onSaved();
  }

  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="section-title text-4xl">{title}</h2>
        <button type="button" className="btn btn-line" onClick={() => setFresh(blank())}>Add</button>
      </div>
      {fresh ? <RecordCard fields={fields} item={fresh} onChange={setFresh} onSave={() => send("create", fresh)} onDelete={() => setFresh(null)} create /> : null}
      {drafts.map((item) => (
        <RecordCard
          key={item.id}
          fields={fields}
          item={item}
          onChange={(next) => setDrafts(drafts.map((row) => row.id === item.id ? next as typeof item : row))}
          onSave={() => send("update", drafts.find((row) => row.id === item.id) ?? item)}
          onDelete={() => send("delete", item)}
        />
      ))}
      {error ? <p className="alert">{error}</p> : null}
    </section>
  );
}

function RecordCard({
  fields,
  item,
  onChange,
  onSave,
  onDelete,
  create,
}: {
  fields: EditorField[];
  item: Record<string, unknown>;
  onChange: (item: Record<string, unknown>) => void;
  onSave: () => void;
  onDelete: () => void;
  create?: boolean;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <article className="grid gap-2 rounded-2xl bg-white/75 p-4">
      {fields.map((field) => (
        <label key={field.key} className="label">
          {field.label}
          {field.kind === "textarea" ? (
            <textarea className="textarea" value={String(item[field.key] ?? "")} onChange={(event) => onChange({ ...item, [field.key]: event.target.value })} />
          ) : field.kind === "select" ? (
            <select className="select" value={String(item[field.key] ?? "")} onChange={(event) => onChange({ ...item, [field.key]: event.target.value })}>
              {field.options?.map((option) => <option key={option}>{option}</option>)}
            </select>
          ) : field.kind === "checkbox" ? (
            <input type="checkbox" checked={Boolean(item[field.key])} onChange={(event) => onChange({ ...item, [field.key]: event.target.checked })} />
          ) : (
            <input className="field" value={String(item[field.key] ?? "")} onChange={(event) => onChange({ ...item, [field.key]: event.target.value })} />
          )}
        </label>
      ))}
      <div className="cluster">
        <button type="button" className="btn btn-emerald" onClick={onSave}>{create ? "Create" : "Save"}</button>
        {confirm ? (
          <button type="button" className="btn btn-line" onClick={onDelete}>Confirm remove</button>
        ) : (
          <button type="button" className="btn btn-line" onClick={() => setConfirm(true)}>{create ? "Cancel" : "Remove"}</button>
        )}
      </div>
    </article>
  );
}

function Replies({ data, onSaved }: { data: SiteData; onSaved: () => Promise<SiteData | null> }) {
  const [query, setQuery] = useState("");
  const rows = data.rsvps.filter((rsvp) => `${rsvp.name} ${rsvp.email}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title text-4xl">Replies</h2>
        <a className="btn btn-line" href="/api/admin/export">Download CSV</a>
      </div>
      <input className="field" placeholder="Search a name or email" value={query} onChange={(event) => setQuery(event.target.value)} />
      {rows.map((rsvp) => (
        <article key={rsvp.id} className="rounded-2xl bg-white/75 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="display text-3xl">{rsvp.name}</h3>
            <span className="kicker-small">{rsvp.attending} · {rsvp.guests} seats</span>
          </div>
          <p className="muted">{rsvp.email}{rsvp.relation ? ` · ${rsvp.relation}` : ""}</p>
          {rsvp.guestNames ? <p>With {rsvp.guestNames}</p> : null}
          {rsvp.meal ? <p>Meal · {rsvp.meal}</p> : null}
          {rsvp.dietary ? <p>Diet · {rsvp.dietary}</p> : null}
          {rsvp.song ? <p>Song · {rsvp.song}</p> : null}
          {rsvp.message ? <p>{rsvp.message}</p> : null}
          <button
            type="button"
            className="btn btn-line mt-2"
            onClick={async () => {
              await fetch("/api/admin/records", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ collection: "rsvp", action: "delete", item: { id: rsvp.id } }),
              });
              await onSaved();
            }}
          >
            Remove reply
          </button>
        </article>
      ))}
      {!rows.length ? <p className="muted">No replies yet.</p> : null}
    </section>
  );
}

function Wishes({ data, onSaved }: { data: SiteData; onSaved: () => Promise<SiteData | null> }) {
  return (
    <section className="grid gap-3">
      <h2 className="section-title text-4xl">Wishes</h2>
      {data.wishes.map((wish) => (
        <article key={wish.id} className="rounded-2xl bg-white/75 p-4">
          <p className="display text-2xl">“{wish.message}”</p>
          <p className="muted">{wish.name} · {wish.approved ? "Visible" : "Hidden"}</p>
          <div className="cluster mt-2">
            <button
              type="button"
              className="btn btn-line"
              onClick={async () => {
                await fetch("/api/admin/records", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ collection: "wish", action: "update", item: { ...wish, approved: !wish.approved } }),
                });
                await onSaved();
              }}
            >
              {wish.approved ? "Hide" : "Show"}
            </button>
            <button
              type="button"
              className="btn btn-line"
              onClick={async () => {
                await fetch("/api/admin/records", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ collection: "wish", action: "delete", item: { id: wish.id } }),
                });
                await onSaved();
              }}
            >
              Remove
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}

function Deploy({ source }: { source: string }) {
  return (
    <article className="grid max-w-2xl gap-4 text-[15px] leading-7">
      <h2 className="section-title text-4xl">GitHub, Vercel, Supabase</h2>
      <p>The invitation is a Next.js app. Drizzle talks to Postgres. Supabase is that Postgres, hosted. Vercel runs the app. GitHub is how the two stay in step.</p>
      <ol className="grid list-decimal gap-3 pl-5">
        <li>Push this project to a GitHub repository. <code>.env</code> is ignored — never commit the database password.</li>
        <li>Create a Supabase project. In Project Settings → Database, copy the Session pooler URI. It looks like <code>postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres</code>.</li>
        <li>On your laptop, with that URI exported as <code>DATABASE_URL</code>, run <code>npx drizzle-kit push</code>. This creates the tables. The first visit seeds the sample invitation.</li>
        <li>Import the GitHub repo in Vercel. Set <code>DATABASE_URL</code>, <code>ADMIN_PASSWORD</code>, and <code>ADMIN_SECRET</code> in the project environment. Redeploy.</li>
        <li>Optional: create a public Supabase Storage bucket for photographs. Paste each public URL into Gallery or a section background. Vercel’s filesystem is read-only, so new images should be URLs, not uploads into <code>public/</code>.</li>
        <li>Change the studio key before you send the invitation. The preview hint on the login screen disappears once <code>ADMIN_PASSWORD</code> is no longer the sample.</li>
      </ol>
      <p className="muted">Connection status right now: {source === "database" ? "this preview is reading Postgres." : "the database was not reachable, so the sample is showing."}</p>
      <p className="muted">The app enables SSL automatically when the host contains supabase.co. Keep the pool small on Vercel — that is already set in <code>src/db/index.ts</code>.</p>
    </article>
  );
}

const storyFields: EditorField[] = [
  { key: "year", label: "Year" },
  { key: "title", label: "Title" },
  { key: "body", label: "Story", kind: "textarea" },
  { key: "image", label: "Image URL" },
  { key: "sortOrder", label: "Order" },
];
const scheduleFields: EditorField[] = [
  { key: "time", label: "Time (HH:MM)" },
  { key: "title", label: "Title" },
  { key: "location", label: "Place" },
  { key: "detail", label: "Detail", kind: "textarea" },
  { key: "sortOrder", label: "Order" },
];
const galleryFields: EditorField[] = [
  { key: "src", label: "Image URL" },
  { key: "alt", label: "Alt text" },
  { key: "caption", label: "Caption" },
  { key: "category", label: "Category" },
  { key: "sortOrder", label: "Order" },
];
const partyFields: EditorField[] = [
  { key: "name", label: "Name" },
  { key: "role", label: "Role" },
  { key: "side", label: "Side", kind: "select", options: ["bride", "groom", "sponsor"] },
  { key: "bio", label: "Line", kind: "textarea" },
  { key: "image", label: "Image URL" },
  { key: "sortOrder", label: "Order" },
];
const stayFields: EditorField[] = [
  { key: "name", label: "Name" },
  { key: "area", label: "Area" },
  { key: "distance", label: "Distance" },
  { key: "note", label: "Note", kind: "textarea" },
  { key: "url", label: "Website" },
  { key: "featured", label: "Suggested", kind: "checkbox" },
  { key: "sortOrder", label: "Order" },
];
const giftFields: EditorField[] = [
  { key: "title", label: "Title" },
  { key: "detail", label: "Detail", kind: "textarea" },
  { key: "url", label: "Link" },
  { key: "sortOrder", label: "Order" },
];
const faqFields: EditorField[] = [
  { key: "question", label: "Question" },
  { key: "answer", label: "Answer", kind: "textarea" },
  { key: "sortOrder", label: "Order" },
];

function blankStory() { return { year: "2026", title: "", body: "", image: "", sortOrder: 9 }; }
function blankSchedule() { return { time: "16:00", title: "", detail: "", location: "", sortOrder: 9 }; }
function blankGallery() { return { src: "", alt: "", caption: "", category: "Notes", sortOrder: 9 }; }
function blankParty() { return { name: "", role: "", side: "bride", bio: "", image: "", sortOrder: 9 }; }
function blankStay() { return { name: "", area: "", note: "", url: "", distance: "", featured: false, sortOrder: 9 }; }
function blankGift() { return { title: "", detail: "", url: "", sortOrder: 9 }; }
function blankFaq() { return { question: "", answer: "", sortOrder: 9 }; }
