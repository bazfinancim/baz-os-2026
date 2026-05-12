"use client";

import type { ReactNode } from "react";
import { HubBazCompaniesProvider } from "@/src/components/HubBazCompaniesProvider";
import { HubLanguageProvider } from "@/src/components/HubLanguageProvider";
import { HubLayout } from "@/src/components/HubLayout";

export default function BazHubLayout({ children }: { children: ReactNode }) {
  return (
    <HubLanguageProvider>
      <HubBazCompaniesProvider>
        <HubLayout>{children}</HubLayout>
      </HubBazCompaniesProvider>
    </HubLanguageProvider>
  );
}
