import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BAZ OS",
  description: "BAZ AI Factory",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
