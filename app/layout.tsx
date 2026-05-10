import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BAZ OS",
  description: "BAZ AI Factory",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body style={{ background: "#0a0f1e", margin: 0, minHeight: "100vh" }}>
        {children}
      </body>
    </html>
  );
}
