"use client";

import React, { createContext, useContext, useMemo, type ReactNode } from "react";
import COMPANIES_RAW from "@/src/data/baz_companies.json";
import type { BazCompany } from "@/src/types/baz-company";

const HubCompaniesContext = createContext<BazCompany[] | null>(null);

export function HubBazCompaniesProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => COMPANIES_RAW as BazCompany[], []);
  return <HubCompaniesContext.Provider value={value}>{children}</HubCompaniesContext.Provider>;
}

export function useBazCompanies(): BazCompany[] {
  const v = useContext(HubCompaniesContext);
  if (!v) {
    throw new Error("useBazCompanies must be used within HubBazCompaniesProvider");
  }
  return v;
}

/** לשימוש אופציונלי כשאין Provider (למשל מחוץ ל-Hub) */
export function useBazCompaniesOptional(): BazCompany[] | null {
  return useContext(HubCompaniesContext);
}
