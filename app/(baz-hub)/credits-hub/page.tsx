/** עומק כמו shell.mainBg ב־Hub — בלי לגעת ב-globals או ב-layout הסיידבר */
const ENGINE_DEPTH_BG =
  "radial-gradient(ellipse 100% 80% at 50% -10%, rgba(49, 46, 129, 0.35) 0%, #07070f 42%, #040406 100%)";

export default function CreditsHubPage() {
  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100%",
        background: ENGINE_DEPTH_BG,
        color: "#e2e8f0",
        padding: "28px 24px",
      }}
    >
      <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>Credits Hub</h1>
      <p style={{ margin: "10px 0 0", fontSize: "0.85rem", color: "#94a3b8", maxWidth: "560px", lineHeight: 1.55 }}>
        דף בסיס — הרחבה בהמשך. אין שינוי ב-CSS גלובלי או בסיידבר.
      </p>
    </div>
  );
}
