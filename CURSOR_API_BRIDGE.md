# Cursor API Bridge

החיבור הזה לוכד אירועי עבודה של Cursor ושומר אותם כלוג מסודר.
אם מגדירים כתובת API, אותו אירוע גם נשלח החוצה.

## מה נתפס

- פתיחת סשן
- סיום סשן
- פקודות טרמינל אחרי ריצה
- עריכות קבצים
- קריאות MCP
- תגובות סוכן

## איפה רואים את הפלט

הלוג המקומי נשמר כאן:

```text
.cursor/logs/cursor-events.jsonl
```

כאשר משתמשים ב-endpoint המקומי של Next.js, הלוג נשמר גם כאן:

```text
.cursor/logs/cursor-events-api.jsonl
```

## איך מחברים API חיצוני

הגדר משתני סביבה לפני הפעלת Cursor או לפני בדיקת הסקריפט:

```powershell
$env:CURSOR_API_BRIDGE_URL="http://localhost:3000/api/cursor-events"
$env:CURSOR_API_BRIDGE_KEY="optional-secret"
```

אם מוגדר `CURSOR_EVENTS_API_KEY` בשרת Next.js, צריך להשתמש באותו ערך גם ב-`CURSOR_API_BRIDGE_KEY`.

## בדיקה ידנית

```powershell
'{"event":"manual-test","message":"hello from Cursor"}' | node --import tsx .cursor/hooks/cursor-api-bridge.ts
```

## תוכנית המשך

1. לחבר את `CURSOR_API_BRIDGE_URL` ל-N8N webhook.
2. להוסיף dashboard בעברית שמציג אירועים אחרונים.
3. להוסיף סינון אירועים כדי לשלוח רק פעולות חשובות.
