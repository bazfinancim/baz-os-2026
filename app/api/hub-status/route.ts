import { NextResponse } from "next/server";

const N8N_HUB_WEBHOOK = "https://n8n.baz-f.co.il/webhook/baz-master-hub";
const N8N_API = "https://n8n.baz-f.co.il/api/v1";
const N8N_KEY = process.env.N8N_API_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiMzFiYWJiMi0zYmM3LTQxMTUtYjliMy1kMTI1MzgxNmFjNTQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYWUzYmFmMjMtODY1MS00OTg4LWFmZmQtNTZhMTdlMjU1M2VlIiwiaWF0IjoxNzc4MDE0MTg3fQ.WJUr8neFsIql6UO6GuPxvgfigHNpvkjR0IW44OmsUhY";

const COMPANIES_15 = [
  {id:"61",name:"BAZ-F"},{id:"1",name:"Baz Brain"},{id:"2",name:"Baz Credits"},
  {id:"3",name:"Baz Arsenal"},{id:"4",name:"Baz QA"},{id:"5",name:"Baz Ops"},
  {id:"6",name:"Baz Sites"},{id:"7",name:"Baz Marketing"},{id:"8",name:"Baz Content"},
  {id:"9",name:"Baz Design"},{id:"10",name:"Baz Style"},{id:"11",name:"Baz Video"},
  {id:"12",name:"Baz 3D"},{id:"13",name:"Baz Studio"},{id:"14",name:"Baz Multi-Sites"},
];

export async function GET() {
  try {
    // בדוק שה-Hub פעיל ב-N8N
    const wfRes = await fetch(`${N8N_API}/workflows/3E8WuzEFQuXgwMf0`, {
      headers: { "X-N8N-API-KEY": N8N_KEY },
      cache: "no-store",
    });
    const wf = await wfRes.json() as { active?: boolean };
    const hubActive = wf.active === true;

    // בדוק live עם ping לחברה אחת
    let liveCheck = false;
    try {
      const ping = await fetch(N8N_HUB_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: "1", message: "ping", from: "system" }),
        signal: AbortSignal.timeout(4000),
      });
      liveCheck = ping.ok;
    } catch { liveCheck = false; }

    return NextResponse.json({
      hub_active: hubActive,
      hub_live: liveCheck,
      webhook_url: N8N_HUB_WEBHOOK,
      companies: COMPANIES_15.map(c => ({
        ...c,
        status: hubActive && liveCheck ? "green" : "yellow",
        online: hubActive && liveCheck,
      })),
      total_active: hubActive && liveCheck ? 15 : 0,
      checked_at: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e), hub_active: false, companies: [] }, { status: 500 });
  }
}
