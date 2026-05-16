"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useHubLang } from "@/src/components/HubLanguageProvider";
import type { HubMessageKey } from "@/src/lib/hub-messages";

/** מבנה Heritage מ־152b2f8 — קטגוריית מפקדה + רשתות (לינקים פנימיים) נוספו אחרי השחזור */
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
      titleKey: "sectionSocial",
      items: [
        { href: "/social/facebook", labelKey: "nav.facebook", hintKey: "nav.facebookHint", icon: "📘" },
        { href: "/social/instagram", labelKey: "nav.instagram", hintKey: "nav.instagramHint", icon: "📸" },
      ],
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
      items: [{ href: "/wip", labelKey: "nav.missions", hintKey: "nav.missionsHint", icon: "⚡" }],
    },
  ];
}

/** פאנל כהה — לא ערכת Apple לבנה (שמירה על מראה Baz OS) */
const shell = {
  pageBg: "#07070f",
  asideBg: "linear-gradient(180deg, #0a0a14 0%, #06060f 55%, #050508 100%)",
  asideBorder: "rgba(99, 102, 241, 0.22)",
  mainBg: "radial-gradient(ellipse 100% 80% at 50% -10%, rgba(49, 46, 129, 0.35) 0%, #07070f 42%, #040406 100%)",
  text: "#e2e8f0",
  textMuted: "#94a3b8",
  textDim: "#64748b",
  navIdle: "#cbd5e1",
  navActiveBg: "rgba(99, 102, 241, 0.18)",
  navActiveBorder: "rgba(129, 140, 248, 0.45)",
  navActiveText: "#a5b4fc",
  commandBg: "rgba(30, 27, 75, 0.42)",
  commandBorder: "rgba(250, 204, 21, 0.28)",
};

export function HubLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { lang, setLang, t, dir } = useHubLang();
  const sections = buildSections();

  const asideEdge =
    dir === "rtl"
      ? { borderLeft: `1px solid ${shell.asideBorder}` }
      : { borderRight: `1px solid ${shell.asideBorder}` };

  return (
    <div
      dir={dir}
      lang={lang === "he" ? "he" : "en"}
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "row",
        background: shell.pageBg,
        color: shell.text,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <aside
        style={{
          width: "248px",
          flexShrink: 0,
          background: shell.asideBg,
          ...asideEdge,
          padding: "18px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          boxShadow: "4px 0 24px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ marginBottom: "8px", padding: "0 6px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
          <div>
            <p style={{ fontSize: "0.68rem", color: shell.textDim, marginBottom: "2px" }}>{t("brandSubtitle")}</p>
            <p style={{ fontSize: "1.02rem", fontWeight: 800, color: shell.text, lineHeight: 1.25 }}>{t("brandTitle")}</p>
          </div>
          <div style={{ display: "flex", borderRadius: "8px", overflow: "hidden", border: `1px solid ${shell.asideBorder}` }}>
            <button
              type="button"
              onClick={() => setLang("he")}
              style={{
                border: "none",
                padding: "6px 10px",
                fontSize: "0.72rem",
                cursor: "pointer",
                background: lang === "he" ? "rgba(99,102,241,0.45)" : "transparent",
                color: lang === "he" ? "#fff" : shell.textMuted,
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
                borderRight: dir === "rtl" ? `1px solid ${shell.asideBorder}` : undefined,
                borderLeft: dir === "ltr" ? `1px solid ${shell.asideBorder}` : undefined,
                padding: "6px 10px",
                fontSize: "0.72rem",
                cursor: "pointer",
                background: lang === "en" ? "rgba(99,102,241,0.45)" : "transparent",
                color: lang === "en" ? "#fff" : shell.textMuted,
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
                        background: shell.commandBg,
                        border: `1px solid ${shell.commandBorder}`,
                        borderRadius: "12px",
                        padding: "8px 6px 10px",
                      }
                    : undefined
                }
              >
                <p
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: isCommand ? "rgba(250, 204, 21, 0.85)" : shell.textDim,
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
                          padding: "9px 11px",
                          borderRadius: "10px",
                          textDecoration: "none",
                          fontSize: "0.88rem",
                          fontWeight: active ? 700 : 500,
                          color: active ? shell.navActiveText : shell.navIdle,
                          background: active ? shell.navActiveBg : "transparent",
                          border: active ? `1px solid ${shell.navActiveBorder}` : "1px solid transparent",
                        }}
                      >
                        <span aria-hidden>{item.icon}</span>
                        <span style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                          <span>{t(item.labelKey)}</span>
                          <span
                            style={{
                              fontSize: "0.62rem",
                              fontWeight: 400,
                              color: active ? shell.navActiveText : shell.textDim,
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

        <p style={{ marginTop: "auto", fontSize: "0.62rem", color: shell.textDim, padding: "6px 8px" }}>{t("footer")}</p>
      </aside>

      <main
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "auto",
          background: shell.mainBg,
        }}
      >
        {children}
      </main>
    </div>
  );
}
