"use client";

// The invitation itself.
// Gate, navigation, countdown chrome, and ordered sections. Copy and photographs
// arrive from Postgres (or the sample, if the database is still being pushed).
// A signed-in couple also gets a background control on every band.

import { useEffect, useMemo, useState } from "react";
import { formatFilipinoDate } from "@/lib/format";
import { themeStyle } from "@/lib/style";
import type { SiteData } from "@/lib/types";
import { SiteProvider, useSite } from "@/components/wedding/site-context";
import { useReveals } from "@/components/wedding/chrome";
import { SECTION_VIEWS } from "@/components/wedding/sections";

const NAV = [
  ["couple", "Couple"],
  ["story", "Story"],
  ["schedule", "The day"],
  ["gallery", "Gallery"],
  ["travel", "Stay"],
] as const;

export function WeddingSite({ data }: { data: SiteData }) {
  const [opened, setOpened] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("verde-opened") === "1") setOpened(true);
    } catch {
      // Private mode can block storage. The gate still works.
    }
    fetch("/api/admin/login")
      .then((response) => response.json())
      .then((payload: { ok?: boolean }) => setIsAdmin(Boolean(payload.ok)))
      .catch(() => setIsAdmin(false));
  }, []);

  function openInvitation() {
    try {
      sessionStorage.setItem("verde-opened", "1");
    } catch {
      // Ignore storage failures; the gate can still close for this view.
    }
    document.documentElement.classList.add("opened-already");
    setOpened(true);
  }

  function replay() {
    try {
      sessionStorage.removeItem("verde-opened");
    } catch {
      // Same as above.
    }
    document.documentElement.classList.remove("opened-already");
    setOpened(false);
    window.scrollTo({ top: 0 });
  }

  return (
    <SiteProvider data={data} isAdmin={isAdmin} opened={opened}>
      <Invitation onOpen={openInvitation} onReplay={replay} />
    </SiteProvider>
  );
}

function Invitation({ onOpen, onReplay }: { onOpen: () => void; onReplay: () => void }) {
  const site = useSite();
  const { settings, sections, opened } = site;
  const [ready, setReady] = useState(false);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState("hero");
  const [playing, setPlaying] = useState(false);
  const hero = sections.find((section) => section.key === "hero");

  useReveals(opened);

  useEffect(() => setReady(true), []);

  useEffect(() => {
    const onScroll = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(window.scrollY > 24);
      setProgress(height > 0 ? window.scrollY / height : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll("[data-nav]"));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-40% 0px -45% 0px", threshold: [0.1, 0.3] },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [opened, sections]);

  useEffect(() => {
    document.body.style.overflow = menu || !opened ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu, opened]);

  useEffect(() => {
    if (opened) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Enter") onOpen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [opened, onOpen]);

  useEffect(() => {
    if (!menu) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  const links = NAV.filter(([key]) => sections.some((section) => section.key === key && section.visible));
  const ordered = useMemo(
    () => [...sections].filter((section) => section.visible).sort((a, b) => a.sortOrder - b.sortOrder),
    [sections],
  );
  const onLightHero = hero?.tone === "dark" && !scrolled;

  function toggleMusic() {
    const audio = document.querySelector("audio");
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }

  return (
    <div style={themeStyle(settings)}>
      <a className="skip-link" href="#content">Skip to invitation</a>
      <div className="progress" style={{ transform: `scaleX(${progress})` }} />
      <p className="spine">{formatFilipinoDate(settings.weddingDate)} · {settings.city}</p>
      {settings.musicUrl ? <audio src={settings.musicUrl} loop preload="none" /> : null}

      <header className={`nav ${scrolled ? "scrolled" : ""} ${onLightHero ? "on-light" : ""}`}>
        <div className="nav-inner">
          <a className="brand" href="#hero">
            <span className="monogram">{settings.monogram}</span>
            <span>{settings.brideName} & {settings.groomName}</span>
          </a>
          <nav className="nav-links" aria-label="Invitation">
            {links.map(([key, label]) => (
              <a key={key} className={`nav-link ${active === key ? "active" : ""}`} href={`#${key}`} aria-current={active === key ? "true" : undefined}>
                {label}
              </a>
            ))}
          </nav>
          <div className="nav-actions">
            {settings.musicUrl ? (
              <button type="button" className="icon-btn" aria-label={playing ? "Pause music" : "Play music"} aria-pressed={playing} onClick={toggleMusic}>
                {playing ? "II" : "♪"}
              </button>
            ) : null}
            <a className="btn btn-solid" href="#rsvp">RSVP</a>
            <button type="button" className="icon-btn menu-toggle" aria-label="Open menu" aria-expanded={menu} onClick={() => setMenu(true)}>
              <span aria-hidden="true">☰</span>
            </button>
          </div>
        </div>
      </header>

      <div className={`drawer ${menu ? "open" : ""}`} hidden={!menu}>
        <div className="drawer-top">
          <span>{settings.monogram}</span>
          <button type="button" className="icon-btn" aria-label="Close menu" onClick={() => setMenu(false)}>×</button>
        </div>
        {links.map(([key, label]) => (
          <a key={key} href={`#${key}`} onClick={() => setMenu(false)}>{label}</a>
        ))}
        <a href="#rsvp" onClick={() => setMenu(false)}>RSVP</a>
      </div>

      {/* inert is applied only after hydration so a no-JS guest can still read and reply. */}
      <main id="content" aria-hidden={ready && !opened ? true : undefined} inert={ready && !opened ? true : undefined}>
        {ordered.map((section) => {
          const View = SECTION_VIEWS[section.key as keyof typeof SECTION_VIEWS];
          return View ? <View key={section.key} /> : null;
        })}
        <footer className="site-footer">
          <div className="monogram">{settings.monogram}</div>
          <h2 className="display" style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)", margin: "0 0 0.4rem" }}>
            {settings.brideName} & {settings.groomName}
          </h2>
          <p>{formatFilipinoDate(settings.weddingDate)} · {settings.venueName}</p>
          <p>{settings.footerNote}</p>
          <p className="kicker-small">{settings.hashtag}</p>
          <div className="cluster" style={{ justifyContent: "center", marginTop: "1.2rem" }}>
            <button type="button" className="btn btn-ghost" onClick={onReplay}>Replay invitation</button>
            <a className="btn btn-ghost" href="/atelier">Atelier</a>
          </div>
        </footer>
      </main>

      {opened ? <a className="mobile-rsvp btn btn-solid" href="#rsvp">RSVP</a> : null}
      {!opened ? <Gate onOpen={onOpen} /> : null}
    </div>
  );
}

function Gate({ onOpen }: { onOpen: () => void }) {
  const { settings, sections } = useSite();
  const hero = sections.find((section) => section.key === "hero");
  const gifts = sections.find((section) => section.key === "gifts");
  const image = hero?.backgroundType === "image" && hero.backgroundImage ? hero.backgroundImage : "/images/emerald-silk.jpg";
  const thumb = gifts?.backgroundImage || "/images/still-life.jpg";

  return (
    <div className="gate" role="dialog" aria-modal="true" aria-label="Wedding invitation">
      <div className="gate-bg" style={{ backgroundImage: `url("${image}")` }} />
      <div className="gate-card">
        <img className="gate-still" src={thumb} alt="" />
        <p className="gate-kicker">A private invitation</p>
        <h1 className="gate-names">
          {settings.brideFull}
          <em>and</em>
          {settings.groomFull}
        </h1>
        <p className="gate-meta">
          {formatFilipinoDate(settings.weddingDate)}
          <br />
          {settings.venueRoom}
          <br />
          {settings.city}, {settings.country}
        </p>
        <button type="button" className="btn btn-solid seal" onClick={onOpen} autoFocus>
          Open the invitation
        </button>
        <p className="muted" style={{ marginTop: "0.8rem", color: "rgba(246,243,236,0.72)" }}>or press enter</p>
      </div>
    </div>
  );
}
