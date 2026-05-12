import type { ReactNode } from "react";
import { HubLayout } from "@/src/components/HubLayout";

export default function BazHubLayout({ children }: { children: ReactNode }) {
  return <HubLayout>{children}</HubLayout>;
}
