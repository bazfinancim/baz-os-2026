"use client";

import { useCallback, useEffect, useState } from "react";

type InvoiceItem = { description: string; quantity: number; unitPrice: number; total: number };
type Invoice = {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  items: InvoiceItem[];
  total: number;
  currency: "ILS" | "USD";
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  issuedAt: string;
  dueAt: string;
  paidAt?: string;
  paymentLink?: string;
  paymentGateway?: string;
  notes?: string;
};

type Stats = {
  total: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  totalRevenue: number;
};

const STATUS_STYLE: Record<Invoice["status"], string> = {
  draft: "text-slate-400 border-slate-500/40 bg-slate-500/10",
  sent: "text-blue-400 border-blue-500/40 bg-blue-500/10",
  paid: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  overdue: "text-red-400 border-red-500/40 bg-red-500/10",
  cancelled: "text-slate-600 border-slate-600/40 bg-slate-600/10",
};

const STATUS_HE: Record<Invoice["status"], string> = {
  draft: "טיוטה", sent: "נשלח", paid: "שולם", overdue: "פגה תוקף", cancelled: "בוטל",
};

const EMPTY_FORM = {
  clientName: "", clientEmail: "", currency: "ILS" as const,
  notes: "",
  items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }] as InvoiceItem[],
};

export function BillingPipeline() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, draft: 0, sent: 0, paid: 0, overdue: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [msg, setMsg] = useState<string | null>(null);
  const [stripeReady, setStripeReady] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing");
      const data = await res.json() as { ok: boolean; invoices: Invoice[]; stats: Stats };
      if (data.ok) { setInvoices(data.invoices); setStats(data.stats); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void fetchInvoices(); }, [fetchInvoices]);

  // Check Stripe config by calling /api/billing with a known bad request
  useEffect(() => {
    // We infer Stripe readiness from payment_gateway field on invoices
    setStripeReady(invoices.some((i) => i.paymentGateway === "stripe"));
  }, [invoices]);

  function updateItem(idx: number, field: keyof InvoiceItem, value: string | number) {
    setForm((prev) => {
      const items = [...prev.items];
      const item = { ...items[idx], [field]: field === "description" ? value : Number(value) };
      item.total = item.quantity * item.unitPrice;
      items[idx] = item;
      return { ...prev, items };
    });
  }

  async function createInvoice() {
    if (!form.clientName || !form.items[0].description) {
      setMsg("⛔ נדרש שם לקוח ופריט אחד לפחות");
      setTimeout(() => setMsg(null), 3000);
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { ok: boolean; invoice: Invoice };
      if (data.ok) {
        setMsg(`✅ חשבונית ${data.invoice.invoiceNumber} נוצרה`);
        setForm(EMPTY_FORM);
        void fetchInvoices();
      } else { setMsg("⛔ שגיאה ביצירת חשבונית"); }
    } finally {
      setCreating(false);
      setTimeout(() => setMsg(null), 4000);
    }
  }

  async function updateStatus(id: string, status: Invoice["status"]) {
    await fetch("/api/billing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    if (status === "paid") setStats((s) => ({ ...s, paid: s.paid + 1 }));
  }

  const total = form.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  return (
    <section dir="rtl" className="flex flex-col gap-6">
      {/* כותרת */}
      <div className="glass-industrial rounded-[2rem] border border-emerald-400/25 p-6 shadow-[0_0_42px_rgba(16,185,129,0.10)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">BILLING / INVOICING</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-4xl font-black text-[#f8f9fa]">Billing Pipeline</h2>
            <p className="mt-2 text-sm text-emerald-100">חשבוניות ותשלומים · {stripeReady ? "Stripe מחובר ✓" : "Stripe לא מחובר — נדרש STRIPE_SECRET_KEY"}</p>
          </div>
          <button onClick={() => void fetchInvoices()} disabled={loading}
            className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50">
            {loading ? "⟳ טוען..." : "⟳ רענן"}
          </button>
        </div>
        {!stripeReady && (
          <div className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-400">
            ⚠️ להוסיף STRIPE_SECRET_KEY ל-.env לחיבור Stripe · ניתן גם לחבר Cardcom ידנית
          </div>
        )}
      </div>

      {/* סטטיסטיקות */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "סה״כ חשבוניות", value: stats.total, color: "text-cyan-300" },
          { label: "נשלחו", value: stats.sent, color: "text-blue-400" },
          { label: "שולמו", value: stats.paid, color: "text-emerald-400" },
          { label: "הכנסה כוללת", value: `₪${stats.totalRevenue.toLocaleString("he-IL")}`, color: "text-yellow-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-slate-700/40 bg-slate-900/50 p-4">
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* יצירת חשבונית */}
      <div className="rounded-2xl border border-slate-700/40 bg-slate-900/50 p-5">
        <p className="mb-4 font-bold text-slate-200">+ חשבונית חדשה</p>
        {msg && (
          <div className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-300">{msg}</div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <input placeholder="שם לקוח *" value={form.clientName}
            onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
            className="rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-400/50"
            dir="rtl" />
          <input placeholder="אימייל לקוח" value={form.clientEmail}
            onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))}
            className="rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-400/50"
            dir="ltr" />
        </div>

        {/* פריטים */}
        <div className="mt-4 space-y-2">
          {form.items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2">
              <input placeholder="תיאור שירות"
                value={item.description}
                onChange={(e) => updateItem(idx, "description", e.target.value)}
                className="col-span-6 rounded-xl border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none"
                dir="rtl" />
              <input type="number" placeholder="כמות" min={1}
                value={item.quantity}
                onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                className="col-span-2 rounded-xl border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 outline-none" />
              <input type="number" placeholder="מחיר"
                value={item.unitPrice}
                onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                className="col-span-3 rounded-xl border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 outline-none" />
              <button onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))}
                className="col-span-1 rounded-xl border border-red-500/30 text-red-400 text-xs hover:bg-red-500/10">✕</button>
            </div>
          ))}
          <button onClick={() => setForm((f) => ({ ...f, items: [...f.items, { description: "", quantity: 1, unitPrice: 0, total: 0 }] }))}
            className="rounded-xl border border-slate-600/40 px-4 py-2 text-sm text-slate-400 transition hover:border-cyan-400/40 hover:text-cyan-300">
            + הוסף פריט
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="font-bold text-emerald-400">סה״כ: ₪{total.toLocaleString("he-IL")}</p>
          <button onClick={() => void createInvoice()} disabled={creating}
            className="rounded-xl bg-emerald-500 px-6 py-2 text-sm font-black text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50">
            {creating ? "יוצר..." : "צור חשבונית"}
          </button>
        </div>
      </div>

      {/* רשימת חשבוניות */}
      <div className="space-y-3">
        {invoices.map((inv) => (
          <div key={inv.id} className="glass-industrial rounded-2xl border border-slate-700/40 bg-slate-900/50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-slate-200">{inv.invoiceNumber} · {inv.clientName}</p>
                <p className="text-xs text-slate-500">{inv.clientEmail}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[inv.status]}`}>
                  {STATUS_HE[inv.status]}
                </span>
                <span className="text-sm font-black text-emerald-400">
                  {inv.currency === "ILS" ? "₪" : "$"}{inv.total.toLocaleString("he-IL")}
                </span>
              </div>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              הונפקה: {new Date(inv.issuedAt).toLocaleDateString("he-IL")} · לתשלום: {new Date(inv.dueAt).toLocaleDateString("he-IL")}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {inv.paymentLink && (
                <a href={inv.paymentLink} target="_blank" rel="noreferrer"
                  className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-400 transition hover:bg-emerald-500/20">
                  💳 לינק לתשלום
                </a>
              )}
              {inv.status === "draft" && (
                <button onClick={() => void updateStatus(inv.id, "sent")}
                  className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-bold text-blue-400 transition hover:bg-blue-500/20">
                  📤 סמן נשלח
                </button>
              )}
              {inv.status !== "paid" && inv.status !== "cancelled" && (
                <button onClick={() => void updateStatus(inv.id, "paid")}
                  className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-400 transition hover:bg-emerald-500/20">
                  ✓ סמן שולם
                </button>
              )}
            </div>
          </div>
        ))}
        {invoices.length === 0 && !loading && (
          <div className="rounded-2xl border border-slate-700/40 bg-slate-900/50 p-10 text-center">
            <p className="text-3xl">📄</p>
            <p className="mt-3 text-slate-400">אין חשבוניות עדיין · צור חשבונית ראשונה למעלה</p>
          </div>
        )}
      </div>
    </section>
  );
}
