"use client";

// Shared invitation state. Server data is the starting point; Atelier edits
// and a signed-in background tool can update sections without a reload.

import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { Section, SiteData } from "@/lib/types";

type SiteContextValue = SiteData & {
  setSections: Dispatch<SetStateAction<Section[]>>;
  setWishes: Dispatch<SetStateAction<SiteData["wishes"]>>;
  isAdmin: boolean;
  opened: boolean;
};

const SiteContext = createContext<SiteContextValue | null>(null);

export function SiteProvider({
  data,
  isAdmin,
  opened,
  children,
}: {
  data: SiteData;
  isAdmin: boolean;
  opened: boolean;
  children: ReactNode;
}) {
  const [sections, setSections] = useState(data.sections);
  const [wishes, setWishes] = useState(data.wishes);

  return (
    <SiteContext.Provider value={{ ...data, sections, setSections, wishes, setWishes, isAdmin, opened }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const value = useContext(SiteContext);
  if (!value) throw new Error("useSite must be used within the invitation.");
  return value;
}

export function useSection(key: string) {
  return useSite().sections.find((section) => section.key === key) ?? null;
}
