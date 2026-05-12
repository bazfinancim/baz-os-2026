"use client";

import type { ReactNode } from "react";
import { HubBazCompaniesProvider } from "@/src/components/HubBazCompaniesProvider";
import { HubLanguageProvider } from "@/src/components/HubLanguageProvider";
import { HubLayout } from "@/src/components/HubLayout";
import { GeminiVoiceButton } from "@/src/components/GeminiVoiceButton";

export default function BazHubLayout({ children }: { children: ReactNode }) {
  return (
    <HubLanguageProvider>
      <HubBazCompaniesProvider>
        <HubLayout>
          <>
            {children}
            <GeminiVoiceButton />
          </>
        </HubLayout>
      </HubBazCompaniesProvider>
    </HubLanguageProvider>
  );
}
