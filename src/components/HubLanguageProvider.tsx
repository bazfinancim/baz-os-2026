"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { HubLang } from "@/src/lib/hub-messages";
import { hubT, type HubMessageKey } from "@/src/lib/hub-messages";

const STORAGE_KEY = "baz-hub-lang";

type Ctx = {
  lang: HubLang;
  setLang: (l: HubLang) => void;
  t: (key: HubMessageKey) => string;
  dir: "rtl" | "ltr";
};

const HubLangContext = createContext<Ctx | null>(null);

function readInitialLang(): HubLang {
  if (typeof window === "undefined") return "he";
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "en" || v === "he") return v;
  } catch {
    /* ignore */
  }
  return "he";
}

export function HubLanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<HubLang>("he");

  useEffect(() => {
    setLangState(readInitialLang());
  }, []);

  const setLang = useCallback((l: HubLang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback((key: HubMessageKey) => hubT(lang, key), [lang]);
  const dir: "rtl" | "ltr" = lang === "he" ? "rtl" : "ltr";

  const value = useMemo(() => ({ lang, setLang, t, dir }), [lang, setLang, t, dir]);

  return <HubLangContext.Provider value={value}>{children}</HubLangContext.Provider>;
}

export function useHubLang(): Ctx {
  const c = useContext(HubLangContext);
  if (!c) throw new Error("useHubLang must be used inside HubLanguageProvider");
  return c;
}
