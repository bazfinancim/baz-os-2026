"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useHubLang } from "@/src/components/HubLanguageProvider";
import type { HubMessageKey } from "@/src/lib/hub-messages";

type NavItem = { href: string; labelKey: HubMessageKey; hintKey: HubMessageKey; icon: string };

type Section = { titleKey: HubMessageKey; items: NavItem[] };

function buildSections(): Section[] {
  return [
    {
      titleKey: "sectionCommand",
      items: [{ href: "/admin/status", labelKey: "nav.geminiEyes", hintKey: "nav.geminiEyesHint", icon: "◆" }],
    },
    {
      titleKey: "sectionComm",
      items: [{ href: "/whatsapp", labelKey: "nav.whatsapp", hintKey: "nav.whatsappHint", icon: "💬" }],
    },
    {
      titleKey: "sectionCore",
      items: [
        { href: "/projects", labelKey: "nav.projects", hintKey: "nav.projectsHint", icon: "📁" },
        { href: "/clients", labelKey: "nav.clients", hintKey: "nav.clientsHint", icon: "👥" },
        { href: "/apps", labelKey: "nav.companies", hintKey: "nav.companiesHint", icon: "📱" },
      ],
    },
    {
      titleKey: "sectionFuel",
      items: [
        { href: "/hunter", labelKey: "nav.hunter", hintKey: "nav.hunterHint", icon: "🎯" },
        { href: "/credits-hub", labelKey: "nav.finance", hintKey: "nav.financeHint", icon: "💰" },
        { href: "/vault", labelKey: "nav.vault", hintKey: "nav.vaultHint", icon: "🔐" },
      ],
    },
    {
      titleKey: "sectionMore",
      items: [{ href: "/wip", labelKey: "nav.wip", hintKey: "nav.wipHint", icon: "🛠️" }],
    },
  ];
}

export function HubLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { lang, setLang, t, dir } = useHubLang();
  const sections = buildSections();

  const asideBorder = dir === "rtl" ? { borderLeft: "1px solid #e2e8f0" } : { borderRight: "1px solid #e2e8f0" };

  return (
    <div
      dir={dir}
      lang={lang === "he" ? "he" : "en"}
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "row",
        background: "#f8fafc",
        color: "#0f172a",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <aside
        style={{
          width: "248px",
          flexShrink: 0,
          background: "#ffffff",
          ...asideBorder,
          padding: "18px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <div style={{ marginBottom: "8px", padding: "0 6px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
          <div>
            <p style={{ fontSize: "0.68rem", color: "#64748b", marginBottom: "2px" }}>{t("brandSubtitle")}</p>
            <p style={{ fontSize: "1.02rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.25 }}>{t("brandTitle")}</p>
          </div>
          <div style={{ display: "flex", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
            <button
              type="button"
              onClick={() => setLang("he")}
              style={{
                border: "none",
                padding: "6px 10px",
                fontSize: "0.72rem",
                cursor: "pointer",
                background: lang === "he" ? "#1d4ed8" : "#fff",
                color: lang === "he" ? "#fff" : "#64748b",
                fontWeight: lang === "he" ? 700 : 500,
              }}
            >
              {t("langHe")}
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              style={{
                border: "none",
                borderRight: dir === "rtl" ? "1px solid #e2e8f0" : undefined,
                borderLeft: dir === "ltr" ? "1px solid #e2e8f0" : undefined,
                padding: "6px 10px",
                fontSize: "0.72rem",
                cursor: "pointer",
                background: lang === "en" ? "#1d4ed8" : "#fff",
                color: lang === "en" ? "#fff" : "#64748b",
                fontWeight: lang === "en" ? 700 : 500,
              }}
            >
              {t("langEn")}
            </button>
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "14px", flex: 1, overflow: "auto" }}>
          {sections.map((sec) => {
            const isCommand = sec.titleKey === "sectionCommand";
            return (
              <div
                key={sec.titleKey}
                style={
                  isCommand
                    ? {
                        background: "linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%)",
                        border: "1px solid #fcd34d",
                        borderRadius: "12px",
                        padding: "10px 8px 12px",
                        boxShadow: "0 1px 3px rgba(245, 158, 11, 0.12)",
                      }
                    : undefined
                }
              >
                <p
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: isCommand ? "#b45309" : "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    margin: "0 8px 6px",
                  }}
                >
                  {t(sec.titleKey)}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  {sec.items.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                          padding: isCommand ? "11px 12px" : "9px 11px",
                          borderRadius: "10px",
                          textDecoration: "none",
                          fontSize: isCommand ? "0.92rem" : "0.88rem",
                          fontWeight: active ? 800 : isCommand ? 600 : 500,
                          color: active ? "#1d4ed8" : "#475569",
                          background: active ? "#eff6ff" : isCommand ? "#ffffff" : "transparent",
                          border: active ? "1px solid #bfdbfe" : isCommand ? "1px solid #fde68a" : "1px solid transparent",
                        }}
                      >
                        <span aria-hidden>{item.icon}</span>
                        <span style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                          <span>{t(item.labelKey)}</span>
                          <span
                            style={{
                              fontSize: "0.62rem",
                              fontWeight: 400,
                              color: active ? "#3b82f6" : "#94a3b8",
                              lineHeight: 1.2,
                            }}
                          >
                            {t(item.hintKey)}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <p style={{ marginTop: "auto", fontSize: "0.62rem", color: "#94a3b8", padding: "6px 8px" }}>{t("footer")}</p>
      </aside>

      <main
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "auto",
          background: "#f8fafc",
        }}
      >
        {children}
      </main>
    </div>
  );
}
