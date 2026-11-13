"use client";

// Shared chrome for every band: readable background, reveal wrapper, and the
// in-page background editor that appears only for a signed-in studio session.
// Guests never see the editor. Colors, gradients, and image URLs are saved
// through the same API Atelier uses.

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { backgroundStyle } from "@/lib/style";
import type { Section } from "@/lib/types";
import { useSection, useSite } from "@/components/wedding/site-context";

export function useCountdown(target: Date | null) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!target || now === null) return null;
  const diff = Math.max(0, target.getTime() - now);
  const total = Math.floor(diff / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    done: diff === 0,
  };
}

export function useReveals(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodes = Array.from(document.querySelectorAll(".reveal"));
    if (reduced) {
      nodes.forEach((node) => node.classList.add("is-in"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [enabled]);
}

export function Band({
  sectionKey,
  className,
  children,
}: {
  sectionKey: string;
  className?: string;
  children: ReactNode;
}) {
  const section = useSection(sectionKey);
  const { isAdmin, opened, sections, setSections } = useSite();
  if (!section) return null;

  return (
    <section
      id={section.key}
      data-nav={section.key}
      className={`band tone-${section.tone} ${className ?? ""}`}
      style={backgroundStyle(section)}
    >
      {isAdmin && opened ? <BackgroundTools section={section} sections={sections} onChange={setSections} /> : null}
      <div className="band-inner">{children}</div>
    </section>
  );
}

function BackgroundTools({
  section,
  sections,
  onChange,
}: {
  section: Section;
  sections: Section[];
  onChange: (next: Section[]) => void;
}) {
  const [draft, setDraft] = useState(section);
  const [status, setStatus] = useState("");

  useEffect(() => setDraft(section), [section]);

  function patch(partial: Partial<Section>) {
    setDraft((current) => ({ ...current, ...partial }));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    const next = sections.map((item) => (item.key === draft.key ? draft : item));
    onChange(next);
    setStatus("Saving");
    const response = await fetch("/api/admin/sections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sections: next }),
    });
    setStatus(response.ok ? "Saved" : "Could not save");
  }

  return (
    <details className="bg-tools">
      <summary>Background</summary>
      <form className="bg-panel" onSubmit={save}>
        <label>
          Fill
          <select value={draft.backgroundType} onChange={(event) => patch({ backgroundType: event.target.value as Section["backgroundType"] })}>
            <option value="color">Color</option>
            <option value="gradient">Gradient</option>
            <option value="image">Image</option>
          </select>
        </label>
        <label>
          Color
          <input type="color" value={toPicker(draft.backgroundColor)} onChange={(event) => patch({ backgroundColor: event.target.value, backgroundType: "color" })} />
        </label>
        <label>
          Gradient
          <input value={draft.backgroundGradient} onChange={(event) => patch({ backgroundGradient: event.target.value, backgroundType: "gradient" })} />
        </label>
        <label>
          Image URL
          <input value={draft.backgroundImage} onChange={(event) => patch({ backgroundImage: event.target.value, backgroundType: "image" })} placeholder="/images/emerald-silk.jpg" />
        </label>
        <label>
          Overlay {draft.overlay}%
          <input type="range" min={0} max={80} value={draft.overlay} onChange={(event) => patch({ overlay: Number(event.target.value) })} />
        </label>
        <label>
          Type
          <select value={draft.tone} onChange={(event) => patch({ tone: event.target.value as Section["tone"] })}>
            <option value="light">Ivory type</option>
            <option value="dark">Ink type</option>
          </select>
        </label>
        <div className="chip-row">
          <button type="button" className="chip" onClick={() => patch({ backgroundType: "color", backgroundColor: "#0C221B", tone: "light", overlay: 0 })}>Deep</button>
          <button type="button" className="chip" onClick={() => patch({ backgroundType: "color", backgroundColor: "#F4F0E6", tone: "dark", overlay: 0 })}>Ivory</button>
          <button type="button" className="chip" onClick={() => patch({ backgroundType: "color", backgroundColor: "#E7F0EA", tone: "dark", overlay: 0 })}>Sage</button>
        </div>
        <button className="btn btn-emerald" type="submit">Save background</button>
        {status ? <p className="muted" style={{ margin: 0 }}>{status}</p> : null}
      </form>
    </details>
  );
}

function toPicker(color: string) {
  return /^#[0-9a-f]{6}$/i.test(color) ? color : "#0C221B";
}
