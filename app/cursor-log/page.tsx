type CursorEvent = {
  id: string;
  createdAt: string;
  source: string;
  project: string;
  payload: unknown;
};

type CursorEventsResponse = {
  ok: boolean;
  count?: number;
  events?: CursorEvent[];
  error?: string;
};

async function getCursorEvents(): Promise<CursorEventsResponse> {
  try {
    const response = await fetch("http://localhost:3000/api/cursor-events", {
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `בקשת היומן נכשלה: ${response.status}`,
      };
    }

    return (await response.json()) as CursorEventsResponse;
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "שגיאה לא ידועה בקריאת יומן Cursor",
    };
  }
}

function formatPayload(payload: unknown): string {
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return "לא ניתן להציג את תוכן האירוע";
  }
}

export default async function CursorLogPage() {
  const data = await getCursorEvents();
  const events = data.events ?? [];

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-950 px-6 py-10 text-right text-white"
    >
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-blue-950/30">
          <p className="mb-3 text-sm font-semibold text-blue-300">
            BAZ OS / Cursor
          </p>
          <h1 className="text-4xl font-bold tracking-tight">יומן Cursor</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            כאן רואים את הפעולות שנלכדו מהעבודה עם הסוכן: פקודות, עריכות,
            תגובות וקריאות API.
          </p>
        </div>

        {!data.ok ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-950/40 p-5 text-red-100">
            {data.error}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5 text-slate-300">
            עדיין אין אירועים להצגה. הרץ פעולה דרך Cursor או בדיקת Hook ידנית.
          </div>
        ) : (
          <div className="grid gap-4">
            {events.map((event) => (
              <article
                key={event.id}
                className="rounded-2xl border border-white/10 bg-slate-900 p-5"
              >
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <h2 className="text-xl font-bold">{event.source}</h2>
                  <time className="text-sm text-slate-400">
                    {new Date(event.createdAt).toLocaleString("he-IL")}
                  </time>
                </div>
                <p className="mb-3 text-sm text-slate-400">
                  פרויקט: {event.project}
                </p>
                <pre
                  dir="ltr"
                  className="overflow-auto rounded-xl bg-slate-950 p-4 text-left text-sm text-slate-200"
                >
                  {formatPayload(event.payload)}
                </pre>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
