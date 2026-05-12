"use client";

import type { ReactNode } from "react";
import { HubLanguageProvider } from "@/src/components/HubLanguageProvider";
import { HubLayout } from "@/src/components/HubLayout";

export default function BazHubLayout({ children }: { children: ReactNode }) {
  return (
    <HubLanguageProvider>
      <HubLayout>{children}</HubLayout>
    </HubLanguageProvider>
  );
}
