import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
export const dynamic = 'force-dynamic';
export async function GET() {
  var toolsCount = 0;
  var companiesCount = 0;
  try { var arr = JSON.parse(readFileSync(join(process.cwd(),'src','data','discovered_tools.json'),'utf-8')); toolsCount = Array.isArray(arr)?arr.length:0; } catch(e){}
  try { var arr2 = JSON.parse(readFileSync(join(process.cwd(),'src','data','baz_companies.json'),'utf-8')); companiesCount = Array.isArray(arr2)?arr2.length:0; } catch(e){}
  var n8nPing = process.env.N8N_COMPANY_PING_WEBHOOK || 'NOT SET';
  var n8nSync = process.env.N8N_GLOBAL_SYNC_WEBHOOK || 'NOT SET';
  return NextResponse.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    panel: 'BAZ EMPIRE COMMANDER',
    version: 'empire-full',
    lights: {
      panel: { status: 'green', message: 'Panel running' },
      hunter: { status: toolsCount >= 88 ? 'green' : 'yellow', message: toolsCount + ' tools loaded' },
      companies: { status: companiesCount >= 48 ? 'green' : 'yellow', message: companiesCount + ' companies' },
      n8n_ping: { status: n8nPing !== 'NOT SET' ? 'green' : 'red', message: n8nPing },
      n8n_sync: { status: n8nSync !== 'NOT SET' ? 'green' : 'red', message: n8nSync }
    }
  });
}