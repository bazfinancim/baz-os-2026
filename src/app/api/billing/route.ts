import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

// ─── Types ───────────────────────────────────────────────────
export type Invoice = {
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
  paymentGateway?: "stripe" | "cardcom" | "manual";
  paymentLink?: string;
  notes?: string;
};

type InvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

// In-memory store (swap for DB/Supabase/Postgres)
declare global {
  // eslint-disable-next-line no-var
  var __invoices: Invoice[];
}
if (!globalThis.__invoices) globalThis.__invoices = [];

// ─── Invoice number generator ─────────────────────────────────
function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const seq = (globalThis.__invoices.length + 1).toString().padStart(4, "0");
  return `BAZ-${year}-${seq}`;
}

// ─── Payment link stub (Stripe when key is added) ────────────
async function createPaymentLink(invoice: Invoice): Promise<string | null> {
  const stripeKey = process.env.STRIPE_SECRET_KEY ?? "";
  if (!stripeKey) {
    // Cardcom / manual fallback placeholder
    return null;
  }

  try {
    const body = new URLSearchParams({
      "line_items[0][price_data][currency]": invoice.currency.toLowerCase(),
      "line_items[0][price_data][product_data][name]": `Invoice ${invoice.invoiceNumber}`,
      "line_items[0][price_data][unit_amount]": String(Math.round(invoice.total * 100)),
      "line_items[0][quantity]": "1",
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://baz-os.pages.dev"}/billing/success?inv=${invoice.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://baz-os.pages.dev"}/billing/cancel`,
      "customer_email": invoice.clientEmail,
    });

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (res.ok) {
      const session = await res.json() as { url: string };
      return session.url;
    }
  } catch (e) {
    console.error("[Billing] Stripe error:", e);
  }

  return null;
}

// ─── GET /api/billing — list invoices ────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const clientId = searchParams.get("clientId");

  let list = globalThis.__invoices;
  if (status) list = list.filter((i) => i.status === status);
  if (clientId) list = list.filter((i) => i.clientId === clientId);

  const stats = {
    total: globalThis.__invoices.length,
    draft: globalThis.__invoices.filter((i) => i.status === "draft").length,
    sent: globalThis.__invoices.filter((i) => i.status === "sent").length,
    paid: globalThis.__invoices.filter((i) => i.status === "paid").length,
    overdue: globalThis.__invoices.filter((i) => i.status === "overdue").length,
    totalRevenue: globalThis.__invoices
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + i.total, 0),
  };

  return NextResponse.json({ ok: true, invoices: list, stats });
}

// ─── POST /api/billing — create invoice ──────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<Invoice>;

    if (!body.clientName || !body.items?.length) {
      return NextResponse.json({ ok: false, error: "clientName and items required" }, { status: 400 });
    }

    const items: InvoiceItem[] = body.items.map((item) => ({
      ...item,
      total: item.quantity * item.unitPrice,
    }));

    const total = items.reduce((sum, i) => sum + i.total, 0);
    const now = new Date();
    const due = new Date(now);
    due.setDate(due.getDate() + 30);

    const invoice: Invoice = {
      id: randomUUID(),
      invoiceNumber: generateInvoiceNumber(),
      clientId: body.clientId ?? randomUUID(),
      clientName: body.clientName,
      clientEmail: body.clientEmail ?? "",
      items,
      total,
      currency: body.currency ?? "ILS",
      status: "draft",
      issuedAt: now.toISOString(),
      dueAt: due.toISOString(),
      notes: body.notes,
    };

    // Try to create payment link if Stripe key exists
    const paymentLink = await createPaymentLink(invoice);
    if (paymentLink) {
      invoice.paymentLink = paymentLink;
      invoice.paymentGateway = "stripe";
    }

    globalThis.__invoices.unshift(invoice);
    return NextResponse.json({ ok: true, invoice });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Invoice creation error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// ─── PATCH /api/billing — update invoice status ───────────────
export async function PATCH(req: NextRequest) {
  const { id, status, paidAt } = (await req.json()) as {
    id: string;
    status: Invoice["status"];
    paidAt?: string;
  };

  const invoice = globalThis.__invoices.find((i) => i.id === id);
  if (!invoice) {
    return NextResponse.json({ ok: false, error: "Invoice not found" }, { status: 404 });
  }

  invoice.status = status;
  if (status === "paid") invoice.paidAt = paidAt ?? new Date().toISOString();

  return NextResponse.json({ ok: true, invoice });
}
