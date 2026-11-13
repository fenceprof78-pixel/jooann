"use client";

// Each band is its own interaction: chapters, the day, the palette, the gallery,
// the reply, the wishes. Backgrounds come from the database via <Band>.
// Guest text is rendered as React children, never as HTML.

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { eventInstant, formatFilipinoDate, formatTime, formatWeddingDate, initials, mealList } from "@/lib/format";
import { parsePalette } from "@/lib/guards";
import { defaultPalette } from "@/lib/defaults";
import type { GalleryItem, Rsvp, Wish } from "@/lib/types";
import { useSection, useSite } from "@/components/wedding/site-context";
import { Band, useCountdown } from "@/components/wedding/chrome";

function Photo({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <div className={className} style={{ background: "#d7e3db", minHeight: 180 }} />;
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}

export function HeroSection() {
  const { settings } = useSite();
  const section = useSection("hero");
  const target = useMemo(
    () => eventInstant(settings.weddingDate, settings.ceremonyTime, settings.timezone),
    [settings.weddingDate, settings.ceremonyTime, settings.timezone],
  );
  const count = useCountdown(target);
  if (!section) return null;

  return (
    <Band sectionKey="hero" className="hero">
      <div className="hero-grid">
        <div>
          <p className={`eyebrow ${section ? "rise delay-1" : ""}`}>
            {section.eyebrow} · {formatFilipinoDate(settings.weddingDate)}
          </p>
          <h1 className="hero-title rise delay-2">
            <span>{settings.brideName}</span>
            <em>&amp;</em>
            <span>{settings.groomName}</span>
          </h1>
          <p className="lede rise delay-3" style={{ marginTop: "1.2rem" }}>
            {section.subtitle}
          </p>
          <div className="countdown rise delay-3" aria-hidden="true">
            <CountdownBits count={count} />
          </div>
          <p className="sr-only">
            {count ? `${count.days} days until the wedding on ${formatWeddingDate(settings.weddingDate)}` : "Wedding date coming into view."}
          </p>
          <div className="cluster rise delay-4">
            <a className="btn btn-solid" href="#rsvp">Reply</a>
            <a className="btn btn-ghost" href="#schedule">The day</a>
            <a className="btn btn-ghost" href="/api/calendar">Calendar</a>
          </div>
          <a className="scroll-cue" href="#intro">
            <i /> Scroll
          </a>
        </div>
        <figure className="hero-portrait rise delay-3">
          <div className="frame frame-offset">
            <Photo src={settings.couplePortrait} alt={`${settings.brideFull} and ${settings.groomFull}, illustrated`} />
          </div>
          <figcaption className="caption">{settings.city}, {settings.country}</figcaption>
        </figure>
      </div>
    </Band>
  );
}

function CountdownBits({ count }: { count: ReturnType<typeof useCountdown> }) {
  const bits = count
    ? [
        [count.days, "Days"],
        [count.hours, "Hours"],
        [count.minutes, "Minutes"],
        [count.seconds, "Seconds"],
      ]
    : [
        ["—", "Days"],
        ["—", "Hours"],
        ["—", "Minutes"],
        ["—", "Seconds"],
      ];
  return bits.map(([value, label]) => (
    <div className="tick" key={String(label)}>
      <b>{String(value).padStart(typeof value === "number" ? 2 : 1, "0")}</b>
      <span>{label}</span>
    </div>
  ));
}

export function IntroSection() {
  const section = useSection("intro");
  const { settings } = useSite();
  if (!section) return null;
  const figure = section.backgroundImage || "/images/still-life.jpg";
  return (
    <Band sectionKey="intro">
      <div className="intro-grid reveal">
        <figure className="frame">
          <Photo src={figure} alt="A gold band, an emerald-cut stone, and a blank card" />
        </figure>
        <div className="quote-band">
          <p className="eyebrow">{section.eyebrow}</p>
          <blockquote>{settings.quote || section.subtitle}</blockquote>
          <hr className="rule" style={{ marginInline: "auto" }} />
          <p className="muted">{settings.announcement}</p>
        </div>
      </div>
    </Band>
  );
}

export function CoupleSection() {
  const { settings } = useSite();
  const section = useSection("couple");
  if (!section) return null;
  return (
    <Band sectionKey="couple">
      <header className="reveal">
        <p className="eyebrow">{section.eyebrow}</p>
        <h2 className="section-title">{section.title}</h2>
        <p className="lede muted">{section.subtitle}</p>
      </header>
      <div className="couple-grid" style={{ marginTop: "2.2rem" }}>
        <article className="reveal">
          <div className="frame">
            <Photo src={settings.bridePortrait} alt={`Illustrated portrait of ${settings.brideFull}`} className="" />
          </div>
          <h3 className="person-name">{settings.brideFull}</h3>
          <p className="kicker-small">{settings.brideRole}</p>
          <p>{settings.brideBio}</p>
          <p className="muted">{settings.brideParents}</p>
        </article>
        <article className="reveal" data-delay="2">
          <div className="frame">
            <Photo src={settings.couplePortrait} alt="" />
          </div>
        </article>
        <article className="reveal" data-delay="3">
          <div className="frame">
            <Photo src={settings.groomPortrait} alt={`Illustrated portrait of ${settings.groomFull}`} />
          </div>
          <h3 className="person-name">{settings.groomFull}</h3>
          <p className="kicker-small">{settings.groomRole}</p>
          <p>{settings.groomBio}</p>
          <p className="muted">{settings.groomParents}</p>
        </article>
      </div>
    </Band>
  );
}

export function StorySection() {
  const { stories } = useSite();
  const section = useSection("story");
  const [active, setActive] = useState(stories[0]?.id ?? 0);
  const current = stories.find((story) => story.id === active) ?? stories[0];
  if (!section || !current) return null;

  return (
    <Band sectionKey="story">
      <div className="story-layout">
        <header className="reveal">
          <p className="eyebrow">{section.eyebrow}</p>
          <h2 className="section-title">{section.title}</h2>
          <p className="lede muted">{section.subtitle}</p>
          <div className="story-tabs" style={{ marginTop: "1.4rem" }} role="tablist" aria-label="Story chapters">
            {stories.map((story) => (
              <button
                key={story.id}
                type="button"
                className={`story-tab ${story.id === current.id ? "active" : ""}`}
                role="tab"
                aria-selected={story.id === current.id}
                onClick={() => setActive(story.id)}
              >
                <span className="kicker-small">{story.year}</span>
                <strong>{story.title}</strong>
              </button>
            ))}
          </div>
        </header>
        <article className="story-panel reveal" role="tabpanel">
          {current.image ? <Photo src={current.image} alt="" /> : null}
          <div className="story-copy">
            <p className="eyebrow">{current.year}</p>
            <h3>{current.title}</h3>
            <p>{current.body}</p>
          </div>
        </article>
      </div>
    </Band>
  );
}

export function DetailsSection() {
  const { settings } = useSite();
  const section = useSection("details");
  const [copied, setCopied] = useState(false);
  if (!section) return null;

  const cards = [
    { time: settings.ceremonyTime, title: "Ceremony", detail: "Be seated a quarter-hour before. Phones rest until the kiss." },
    { time: settings.receptionTime, title: "Dinner", detail: "A seated meal, short speeches, and the first dance when the room is ready." },
    { time: settings.endTime, title: "Last light", detail: "A send-off before midnight. The avenue will still be awake." },
  ];

  async function share() {
    const url = window.location.href.split("#")[0];
    const title = `${settings.brideName} & ${settings.groomName}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: settings.tagline, url });
        return;
      } catch {
        return;
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Band sectionKey="details">
      <header className="reveal">
        <p className="eyebrow">{section.eyebrow}</p>
        <h2 className="section-title">{section.title}</h2>
        <p className="lede">{section.subtitle}</p>
      </header>
      <div className="detail-grid" style={{ marginTop: "1.8rem" }}>
        {cards.map((card) => (
          <article key={card.title} className="info-card reveal">
            <span className="time">{formatTime(card.time)}</span>
            <strong>{card.title}</strong>
            <p className="muted">{card.detail}</p>
          </article>
        ))}
      </div>
      <div className="cluster" style={{ marginTop: "1.4rem" }}>
        <a className="btn btn-solid" href="/api/calendar">Add to calendar</a>
        <a className="btn btn-ghost" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.mapQuery)}`} target="_blank" rel="noreferrer">
          Open in maps
        </a>
        <button type="button" className="btn btn-ghost" onClick={share}>{copied ? "Link copied" : "Share"}</button>
      </div>
      <p className="muted" style={{ marginTop: "1rem" }}>
        {formatWeddingDate(settings.weddingDate)} · {settings.venueRoom}, {settings.venueName}
      </p>
    </Band>
  );
}

export function ScheduleSection() {
  const { schedule } = useSite();
  const section = useSection("schedule");
  const [open, setOpen] = useState(schedule[0]?.id ?? 0);
  if (!section) return null;
  return (
    <Band sectionKey="schedule">
      <header className="reveal" style={{ marginBottom: "1.4rem" }}>
        <p className="eyebrow">{section.eyebrow}</p>
        <h2 className="section-title">{section.title}</h2>
        <p className="lede muted">{section.subtitle}</p>
      </header>
      <div className="day-list">
        {schedule.map((item) => {
          const expanded = item.id === open;
          return (
            <button
              key={item.id}
              type="button"
              className={`day-item ${expanded ? "open" : ""}`}
              aria-expanded={expanded}
              onClick={() => setOpen(expanded ? -1 : item.id)}
            >
              <span className="kicker-small">{formatTime(item.time)} · {item.location}</span>
              <strong>{item.title}</strong>
              {expanded ? <p style={{ margin: "0.7rem 0 0" }}>{item.detail}</p> : null}
            </button>
          );
        })}
      </div>
    </Band>
  );
}

export function VenueSection() {
  const { settings } = useSite();
  const section = useSection("venue");
  const [clock, setClock] = useState("");
  const [temp, setTemp] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      setClock(new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: settings.timezone || "Asia/Manila" }).format(new Date()));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    // Open-Meteo needs no key. Failure simply hides the temperature.
    fetch("https://api.open-meteo.com/v1/forecast?latitude=14.555&longitude=121.025&current=temperature_2m&timezone=Asia%2FManila")
      .then((response) => response.json())
      .then((data: { current?: { temperature_2m?: number } }) => {
        if (typeof data.current?.temperature_2m === "number") setTemp(Math.round(data.current.temperature_2m));
      })
      .catch(() => undefined);
    return () => window.clearInterval(id);
  }, [settings.timezone]);

  if (!section) return null;
  const map = `https://maps.google.com/maps?q=${encodeURIComponent(settings.mapQuery)}&z=16&output=embed`;

  return (
    <Band sectionKey="venue">
      <div className="venue-layout">
        <div className="reveal">
          <p className="eyebrow">{section.eyebrow}</p>
          <h2 className="section-title">{settings.venueRoom}</h2>
          <p className="lede">{settings.venueName}</p>
          <p>{settings.venueAddress}</p>
          <p>{settings.venueNote}</p>
          <p className="clock-pill" suppressHydrationWarning>
            <span>{clock || "Manila"}</span>
            {temp !== null ? <span>· {temp}°C</span> : null}
            <span>in {settings.city}</span>
          </p>
          <p style={{ whiteSpace: "pre-line" }}>{settings.arrivalNote}</p>
          <div className="cluster">
            <a className="btn btn-solid" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.mapQuery)}`} target="_blank" rel="noreferrer">
              Directions
            </a>
            <a className="btn btn-ghost" href="#travel">Where to stay</a>
          </div>
        </div>
        <div className="map-wrap reveal">
          <iframe title={`Map of ${settings.venueName}`} src={map} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
      </div>
    </Band>
  );
}

export function GallerySection() {
  const { gallery } = useSite();
  const section = useSection("gallery");
  const categories = useMemo(() => ["All", ...Array.from(new Set(gallery.map((item) => item.category)))], [gallery]);
  const [filter, setFilter] = useState("All");
  const [active, setActive] = useState<GalleryItem | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const visible = filter === "All" ? gallery : gallery.filter((item) => item.category === filter);
  const index = active ? visible.findIndex((item) => item.id === active.id) : -1;

  function step(direction: number) {
    if (!visible.length || index < 0) return;
    const next = visible[(index + direction + visible.length) % visible.length];
    setActive(next);
  }

  useEffect(() => {
    if (!active) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // step closes over the latest index via active.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, filter]);

  if (!section) return null;

  return (
    <Band sectionKey="gallery">
      <header className="reveal">
        <p className="eyebrow">{section.eyebrow}</p>
        <h2 className="section-title">{section.title}</h2>
        <p className="lede muted">{section.subtitle}</p>
        <div className="chip-row" style={{ marginTop: "1rem" }} role="tablist" aria-label="Gallery filters">
          {categories.map((category) => (
            <button key={category} type="button" className={`chip ${filter === category ? "active" : ""}`} onClick={() => setFilter(category)}>
              {category}
            </button>
          ))}
        </div>
      </header>
      <div className="masonry" style={{ marginTop: "1.4rem" }}>
        {visible.map((item) => (
          <button key={item.id} type="button" className="tile" onClick={() => setActive(item)}>
            <Photo src={item.src} alt={item.alt} />
            <span className="cap">{item.caption}</span>
          </button>
        ))}
      </div>
      {active ? (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={active.caption}
          onTouchStart={(event) => {
            (event.currentTarget as HTMLElement).dataset.x = String(event.changedTouches[0].clientX);
          }}
          onTouchEnd={(event) => {
            const start = Number((event.currentTarget as HTMLElement).dataset.x || 0);
            const delta = event.changedTouches[0].clientX - start;
            if (delta > 48) step(-1);
            if (delta < -48) step(1);
          }}
        >
          <div className="lightbox-bar">
            <span className="kicker-small">{active.category}</span>
            <button ref={closeRef} type="button" className="btn btn-ghost" onClick={() => setActive(null)}>Close</button>
          </div>
          <img src={active.src} alt={active.alt} />
          <div className="lightbox-foot">
            <button type="button" className="btn btn-ghost" onClick={() => step(-1)}>Previous</button>
            <p style={{ margin: 0 }}>{active.caption}</p>
            <button type="button" className="btn btn-ghost" onClick={() => step(1)}>Next</button>
          </div>
        </div>
      ) : null}
    </Band>
  );
}

export function AttireSection() {
  const { settings } = useSite();
  const section = useSection("attire");
  const swatches = parsePalette(settings.paletteJson, defaultPalette);
  const [active, setActive] = useState(0);
  const current = swatches[active] ?? swatches[0];
  if (!section || !current) return null;
  return (
    <Band sectionKey="attire">
      <div className="reveal">
        <p className="eyebrow">{section.eyebrow}</p>
        <h2 className="section-title">{section.title}</h2>
        <p className="lede">{settings.dressCode}. {section.subtitle}</p>
        <p>{settings.dressNote}</p>
        <div className="palette" role="list">
          {swatches.map((swatch, index) => (
            <button
              key={swatch.name}
              type="button"
              className={`swatch ${index === active ? "active" : ""}`}
              onClick={() => setActive(index)}
              aria-pressed={index === active}
            >
              <i style={{ background: swatch.hex }} />
              {swatch.name}
            </button>
          ))}
        </div>
        <p className="palette-note">{current.note}</p>
        <p className="muted">{settings.unpluggedNote}</p>
      </div>
    </Band>
  );
}

export function PartySection() {
  const { party, settings } = useSite();
  const section = useSection("party");
  const [side, setSide] = useState("all");
  const [open, setOpen] = useState<number | null>(null);
  if (!section) return null;
  const filters = [
    ["all", "All"],
    ["bride", settings.brideName],
    ["groom", settings.groomName],
    ["sponsor", "Sponsors"],
  ];
  const visible = side === "all" ? party : party.filter((person) => person.side === side);
  return (
    <Band sectionKey="party">
      <header className="reveal">
        <p className="eyebrow">{section.eyebrow}</p>
        <h2 className="section-title">{section.title}</h2>
        <p className="lede muted">{section.subtitle}</p>
        <div className="chip-row" style={{ margin: "1rem 0 1.3rem" }}>
          {filters.map(([id, label]) => (
            <button key={id} type="button" className={`chip ${side === id ? "active" : ""}`} onClick={() => setSide(id)}>
              {label}
            </button>
          ))}
        </div>
      </header>
      <div className="person-grid">
        {visible.map((person) => {
          const expanded = open === person.id;
          return (
            <button key={person.id} type="button" className="person" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : person.id)} style={{ textAlign: "left", color: "inherit", cursor: "pointer" }}>
              {person.image ? (
                <Photo src={person.image} alt="" />
              ) : (
                <span className="avatar" aria-hidden="true">{initials(person.name)}</span>
              )}
              <h3 className="person-name" style={{ fontSize: "2rem" }}>{person.name}</h3>
              <p className="kicker-small">{person.role}</p>
              {expanded ? <p>{person.bio}</p> : <p className="muted">Read a line</p>}
            </button>
          );
        })}
      </div>
    </Band>
  );
}

export function TravelSection() {
  const { stays } = useSite();
  const section = useSection("travel");
  if (!section) return null;
  return (
    <Band sectionKey="travel">
      <header className="reveal">
        <p className="eyebrow">{section.eyebrow}</p>
        <h2 className="section-title">{section.title}</h2>
        <p className="lede muted">{section.subtitle}</p>
      </header>
      <div className="stay-grid" style={{ marginTop: "1.4rem" }}>
        {stays.map((stay) => (
          <article key={stay.id} className={`stay reveal ${stay.featured ? "featured" : ""}`}>
            <p className="kicker-small">{stay.featured ? "Suggested · " : ""}{stay.distance}</p>
            <h3 className="person-name" style={{ fontSize: "2.2rem" }}>{stay.name}</h3>
            <p className="muted">{stay.area}</p>
            <p>{stay.note}</p>
            {stay.url ? (
              <a className="btn btn-line" href={stay.url} target="_blank" rel="noreferrer">Visit</a>
            ) : null}
          </article>
        ))}
      </div>
    </Band>
  );
}

export function GiftsSection() {
  const { gifts, settings } = useSite();
  const section = useSection("gifts");
  if (!section) return null;
  return (
    <Band sectionKey="gifts">
      <header className="reveal">
        <p className="eyebrow">{section.eyebrow}</p>
        <h2 className="section-title">{section.title}</h2>
        <p className="lede">{settings.giftNote}</p>
      </header>
      <div className="gift-grid" style={{ marginTop: "1.5rem" }}>
        {gifts.map((gift) => (
          <article key={gift.id} className="gift reveal">
            <h3 style={{ fontFamily: "var(--font-display), serif", fontSize: "1.8rem", margin: "0 0 0.4rem" }}>{gift.title}</h3>
            <p>{gift.detail}</p>
            {gift.url ? <a className="btn btn-ghost" href={gift.url} target="_blank" rel="noreferrer">Open</a> : null}
          </article>
        ))}
      </div>
    </Band>
  );
}

export function FaqSection() {
  const { faqs, settings } = useSite();
  const section = useSection("faq");
  const [open, setOpen] = useState<number | null>(faqs[0]?.id ?? null);
  if (!section) return null;
  return (
    <Band sectionKey="faq">
      <header className="reveal">
        <p className="eyebrow">{section.eyebrow}</p>
        <h2 className="section-title">{section.title}</h2>
        <p className="lede muted">{section.subtitle}</p>
        <p className="muted">Kindly reply by {formatWeddingDate(settings.rsvpDeadline)}.</p>
      </header>
      <div className="faq-list" style={{ marginTop: "1.2rem" }}>
        {faqs.map((faq) => {
          const expanded = open === faq.id;
          return (
            <button key={faq.id} type="button" className="faq-item" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : faq.id)}>
              <span className="q">
                {faq.question}
                <span aria-hidden="true">{expanded ? "–" : "+"}</span>
              </span>
              {expanded ? <p>{faq.answer}</p> : null}
            </button>
          );
        })}
      </div>
      {settings.livestreamUrl ? (
        <p style={{ marginTop: "1rem" }}><a className="btn btn-line" href={settings.livestreamUrl}>Private livestream</a></p>
      ) : null}
    </Band>
  );
}

const EMPTY_RSVP = {
  name: "",
  email: "",
  relation: "",
  attending: "yes",
  guests: 1,
  guestNames: "",
  meal: "",
  dietary: "",
  song: "",
  message: "",
  company: "",
};

export function RsvpSection() {
  const { settings } = useSite();
  const section = useSection("rsvp");
  const meals = mealList(settings);
  const [form, setForm] = useState({ ...EMPTY_RSVP, meal: meals[0] ?? "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState<Partial<Rsvp> | null>(null);

  if (!section) return null;

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function loadExisting() {
    setError("");
    setNotice("");
    const response = await fetch(`/api/rsvp?email=${encodeURIComponent(form.email)}`);
    const payload = (await response.json()) as { ok: boolean; error?: string; rsvp?: typeof EMPTY_RSVP };
    if (!response.ok || !payload.rsvp) {
      setNotice(payload.error || "No reply yet.");
      return;
    }
    setForm((current) => ({ ...current, ...payload.rsvp, company: "" }));
    setNotice("Your earlier reply is loaded. Send again to update it.");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as { ok: boolean; error?: string; rsvp?: Partial<Rsvp>; updated?: boolean };
      if (!response.ok || !payload.ok) {
        setError(payload.error || "Please try again.");
        return;
      }
      setSaved(payload.rsvp ?? null);
    } catch {
      setError("The reply could not be sent. Please try again in a moment.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Band sectionKey="rsvp">
      <div className="rsvp-layout">
        <header className="reveal">
          <p className="eyebrow">{section.eyebrow}</p>
          <h2 className="section-title">{section.title}</h2>
          <p className="lede">{section.subtitle}</p>
          <p className="muted">Please reply by {formatWeddingDate(settings.rsvpDeadline)}.</p>
        </header>
        <div className="form-card reveal">
          {saved ? (
            <div className="success-card">
              <div className="confetti" aria-hidden="true"><i /><i /><i /><i /></div>
              <p className="eyebrow">{saved.attending === "no" ? "Noted, with love" : "Your place is noted"}</p>
              <h3 className="person-name">{saved.name}</h3>
              <p>
                {saved.attending === "yes" && `We have you down for ${saved.guests} ${saved.guests === 1 ? "seat" : "seats"}.`}
                {saved.attending === "maybe" && "We will keep a chair in mind while you arrange the journey."}
                {saved.attending === "no" && "We will miss you at the table, and we are glad you told us."}
              </p>
              {saved.meal ? <p className="muted">Meal · {saved.meal}</p> : null}
              {saved.song ? <p className="muted">Song · {saved.song}</p> : null}
              <button type="button" className="btn btn-emerald" onClick={() => setSaved(null)}>Edit reply</button>
            </div>
          ) : (
            <form onSubmit={submit} className="form-grid two">
              <label className="label">
                Full name
                <input className="field" name="name" autoComplete="name" required value={form.name} onChange={(event) => set("name", event.target.value)} />
              </label>
              <label className="label">
                Email
                <input className="field" type="email" name="email" autoComplete="email" required value={form.email} onChange={(event) => set("email", event.target.value)} />
              </label>
              <label className="label">
                How you know us
                <input className="field" value={form.relation} onChange={(event) => set("relation", event.target.value)} placeholder="Cousin, studio, kitchen…" />
              </label>
              <div className="label">
                Seats
                <div className="stepper">
                  <button type="button" aria-label="Fewer seats" onClick={() => set("guests", Math.max(1, form.guests - 1))}>–</button>
                  <strong>{form.attending === "no" ? 0 : form.guests}</strong>
                  <button type="button" aria-label="More seats" onClick={() => set("guests", Math.min(8, form.guests + 1))}>+</button>
                </div>
              </div>
              <div className="label span-2">
                Will you come?
                <div className="segmented" role="radiogroup" aria-label="Attendance">
                  {[
                    ["yes", "Joyfully, yes"],
                    ["maybe", "Still arranging"],
                    ["no", "With regret, no"],
                  ].map(([value, label]) => (
                    <button key={value} type="button" className={`seg ${form.attending === value ? "active" : ""}`} aria-pressed={form.attending === value} onClick={() => set("attending", value)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {form.attending !== "no" ? (
                <>
                  <label className="label span-2">
                    Names sharing your seats
                    <input className="field" value={form.guestNames} onChange={(event) => set("guestNames", event.target.value)} />
                  </label>
                  <label className="label">
                    Meal
                    <select className="select" value={form.meal} onChange={(event) => set("meal", event.target.value)}>
                      {meals.map((meal) => <option key={meal}>{meal}</option>)}
                    </select>
                  </label>
                  <label className="label">
                    Song request
                    <input className="field" value={form.song} onChange={(event) => set("song", event.target.value)} />
                  </label>
                </>
              ) : null}
              <label className="label span-2">
                Dietary notes
                <input className="field" value={form.dietary} onChange={(event) => set("dietary", event.target.value)} />
              </label>
              <label className="label span-2">
                A note to the couple
                <textarea className="textarea" value={form.message} onChange={(event) => set("message", event.target.value)} />
              </label>
              <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.company} onChange={(event) => set("company", event.target.value)} />
              {error ? <p className="alert span-2" role="alert">{error}</p> : null}
              {notice ? <p className="muted span-2">{notice}</p> : null}
              <div className="cluster span-2">
                <button className="btn btn-emerald" type="submit" disabled={pending}>{pending ? "Sending" : "Send reply"}</button>
                <button className="btn btn-line" type="button" onClick={loadExisting}>Load my reply</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Band>
  );
}

export function WishesSection() {
  const { wishes, setWishes } = useSite();
  const section = useSection("wishes");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  if (!section) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message, company }),
      });
      const payload = (await response.json()) as { ok: boolean; error?: string; wish?: Wish };
      if (!response.ok || !payload.wish) {
        setError(payload.error || "Try once more.");
        return;
      }
      setWishes((current) => [payload.wish as Wish, ...current]);
      setName("");
      setMessage("");
    } catch {
      setError("The note could not be kept just now.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Band sectionKey="wishes">
      <div className="wish-layout">
        <div className="reveal">
          <p className="eyebrow">{section.eyebrow}</p>
          <h2 className="section-title">{section.title}</h2>
          <p className="lede">{section.subtitle}</p>
          <form onSubmit={submit} className="form-grid" style={{ marginTop: "1rem" }}>
            <label className="label">
              Your name
              <input className="field" required value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="label">
              A line for them
              <textarea className="textarea" required maxLength={500} value={message} onChange={(event) => setMessage(event.target.value)} />
            </label>
            <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={company} onChange={(event) => setCompany(event.target.value)} />
            <p className="muted">{message.length}/500</p>
            {error ? <p className="alert" role="alert">{error}</p> : null}
            <button className="btn btn-solid" disabled={pending} type="submit">{pending ? "Keeping" : "Leave the note"}</button>
          </form>
        </div>
        <div className="wish-grid">
          {wishes.map((wish) => (
            <article key={wish.id} className="wish-card reveal">
              <p>“{wish.message}”</p>
              <span className="kicker-small">{wish.name}</span>
            </article>
          ))}
        </div>
      </div>
    </Band>
  );
}

export const SECTION_VIEWS = {
  hero: HeroSection,
  intro: IntroSection,
  couple: CoupleSection,
  story: StorySection,
  details: DetailsSection,
  schedule: ScheduleSection,
  venue: VenueSection,
  gallery: GallerySection,
  attire: AttireSection,
  party: PartySection,
  travel: TravelSection,
  gifts: GiftsSection,
  faq: FaqSection,
  rsvp: RsvpSection,
  wishes: WishesSection,
} as const;
