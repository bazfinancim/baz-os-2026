import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Serve tools from local JSON file (populated by sync:discovered)
// Falls back to empty array if file not ready
function getLocalTools() {
  try {
    const filePath = join(process.cwd(), 'src', 'data', 'discovered_tools.json');
    const raw = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') ?? '';
  const category = searchParams.get('category') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = parseInt(searchParams.get('limit') ?? '50');
  
  let tools = getLocalTools();
  
  // Filter
  if (search) {
    const q = search.toLowerCase();
    tools = tools.filter((t: any) => 
      (t.name ?? '').toLowerCase().includes(q) ||
      (t.company ?? '').toLowerCase().includes(q) ||
      (t.category ?? '').toLowerCase().includes(q)
    );
  }
  if (category && category !== 'all') {
    tools = tools.filter((t: any) => t.category === category);
  }
  
  const total = tools.length;
  const start = (page - 1) * limit;
  const paginated = tools.slice(start, start + limit);
  
  return NextResponse.json({
    tools: paginated,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit)
  });
}
