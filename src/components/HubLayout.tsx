"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { useHubLang } from "@/src/components/HubLanguageProvider";
import type { HubMessageKey } from "@/src/lib/hub-messages";

type NavItem = {
  href: string;
  labelKey: HubMessageKey;
  hintKey: HubMessageKey;
  icon: string;
  /** קישור חיצוני (פייסבוק, אינסטגרם וכו׳) */
  external?: boolean;
  /** לנתיב / בלבד — לא לסמן פעיל בכל דף */
  exactActive?: boolean;
};

type Section = { titleKey: HubMessageKey; items: NavItem[] };

const SOCIAL_EXTERNAL: NavItem[] = [
  {
    href: "https://business.facebook.com/",
    labelKey: "nav.facebook",
    hintKey: "nav.facebookHint",
    icon: "📘",
    external: true,
  },
  {
    href: "https://www.instagram.com/",
    labelKey: "nav.instagram",
    hintKey: "nav.instagramHint",
    icon: "📸",
    external: true,
  },
  {
    href: "https://www.linkedin.com/",
    labelKey: "nav.linkedin",
    hintKey: "nav.linkedinHint",
    icon: "💼",
    external: true,
  },
  {
    href: "https://www.tiktok.com/",
    labelKey: "nav.tiktok",
    hintKey: "nav.tiktokHint",
    icon: "🎵",
    external: true,
  },
  {
    href: "https://www.youtube.com/",
    labelKey: "nav.youtube",
    hintKey: "nav.youtubeHint",
    icon: "▶",
    external: true,
  },
];

function buildSections(): Section[] {
  return [
    {
      titleKey: "sectionCommand",
      items: [{ href: "/admin/status", labelKey: "nav.geminiEyes", hintKey: "nav.geminiEyesHint", icon: "◆" }],
    },
    {
      titleKey: "sectionGate",
      items: [{ href: "/", labelKey: "nav.home", hintKey: "nav.homeHint", icon: "⌂", exactActive: true }],
    },
    {
      titleKey: "sectionComm",
      items: [{ href: "/whatsapp", labelKey: "nav.whatsapp", hintKey: "nav.whatsappHint", icon: "💬" }],
    },
    {
      titleKey: "sectionSocial",
      items: SOCIAL_EXTERNAL,
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
      titleKey: "sectionVip",
      items: [
        { href: "/master-hub", labelKey: "nav.vipMaster", hintKey: "nav.vipMasterHint", icon: "⚡" },
        { href: "/base44", labelKey: "nav.base44", hintKey: "nav.base44Hint", icon: "🔷" },
        { href: "/cursor-log", labelKey: "nav.cursorLog", hintKey: "nav.cursorLogHint", icon: "📜" },
      ],
    },
    {
      titleKey: "sectionMore",
      items: [{ href: "/wip", labelKey: "nav.wip", hintKey: "nav.wipHint", icon: "🛠️" }],
    },
  ];
}

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

function NavRow({
  item,
  pathname,
  t,
  isCommandSection,
}: {
  item: NavItem;
  pathname: string | null;
  t: (k: HubMessageKey) => string;
  isCommandSection: boolean;
}) {
  const active =
    !item.external &&
    (item.exactActive ? pathname === item.href : pathname === item.href || pathname?.startsWith(`${item.href}/`));
  const baseStyle: CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: isCommandSection ? "10px 11px" : "9px 11px",
    borderRadius: "10px",
    textDecoration: "none",
    fontSize: "0.86rem",
    fontWeight: active ? 700 : 500,
    color: active ? shell.navActiveText : item.external ? shell.textMuted : shell.navIdle,
    background: active ? shell.navActiveBg : "transparent",
    border: active ? `1px solid ${shell.navActiveBorder}` : "1px solid transparent",
    transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
  };

  const hint = (
    <span
      style={{
        fontSize: "0.62rem",
        fontWeight: 400,
        color: active ? shell.navActiveText : shell.textDim,
        lineHeight: 1.2,
        opacity: 0.92,
      }}
    >
      {t(item.hintKey)}
    </span>
  );

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" style={baseStyle}>
        <span aria-hidden>{item.icon}</span>
        <span style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
          <span>{t(item.labelKey)}</span>
          {hint}
        </span>
      </a>
    );
  }

  return (
    <Link href={item.href} style={baseStyle}>
      <span aria-hidden>{item.icon}</span>
      <span style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
        <span>{t(item.labelKey)}</span>
        {hint}
      </span>
    </Link>
  );
}

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
          width: "260px",
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
            <p style={{ fontSize: "0.68rem", color: shell.textDim, marginBottom: "2px", letterSpacing: "0.06em" }}>
              {t("brandSubtitle")}
            </p>
            <p style={{ fontSize: "1.05rem", fontWeight: 800, color: shell.text, lineHeight: 1.25 }}>{t("brandTitle")}</p>
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

        <nav style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1, overflow: "auto" }}>
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
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    color: isCommand ? "rgba(250, 204, 21, 0.85)" : shell.textDim,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    margin: "0 8px 6px",
                  }}
                >
                  {t(sec.titleKey)}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  {sec.items.map((item) => (
                    <NavRow key={`${sec.titleKey}-${item.href}-${item.labelKey}`} item={item} pathname={pathname} t={t} isCommandSection={isCommand} />
                  ))}
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
