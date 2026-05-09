import { NextResponse } from 'next/server';
import { readDbWithRecovery } from '@/src/lib/db-manager';

type ProjectMemory = {
  id: string;
  name: string;
  context: string;
  platform: string;
  assignedTo: string;
  status: string;
};

type VaultAsset = {
  id: string;
  tool_name: string;
  api_key: string;
  expiry_date: string;
  credit_balance: number;
  status: string;
};

type FinanceLog = {
  id: string;
  type: 'revenue' | 'invoice';
  clientId: string;
  amount: number;
  status: 'collected' | 'pending';
  description: string;
};

type EmpireDb = {
  projects: ProjectMemory[];
  vault_assets: VaultAsset[];
  finance_logs: FinanceLog[];
};

async function readDb() {
  return readDbWithRecovery<EmpireDb>();
}

function formatProjects(projectList: ProjectMemory[]) {
  return projectList
    .map(
      (project) =>
        `${project.name} | אחראי: ${project.assignedTo} | פלטפורמה: ${project.platform} | סטטוס: ${project.status}`,
    )
    .join('\n');
}

function formatFinance(logs: FinanceLog[]) {
  const totalRevenue = logs
    .filter((log) => log.type === 'revenue' && log.status === 'collected')
    .reduce((sum, log) => sum + log.amount, 0);
  const pendingInvoices = logs.filter(
    (log) => log.type === 'invoice' && log.status === 'pending',
  );
  const pendingAmount = pendingInvoices.reduce((sum, log) => sum + log.amount, 0);

  return `BAZ AI Finance:\nהכנסות שנגבו: ₪${totalRevenue.toLocaleString('he-IL')}\nחשבוניות ממתינות: ${pendingInvoices.length}\nסכום פתוח: ₪${pendingAmount.toLocaleString('he-IL')}`;
}

function formatCredits(assets: VaultAsset[]) {
  return assets
    .map(
      (asset) =>
        `${asset.tool_name}: ${asset.credit_balance.toLocaleString('he-IL')} credits | expires ${asset.expiry_date} | ${asset.status}`,
    )
    .join('\n');
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const text = prompt.toLowerCase();
    const db = await readDb();
    const projectList = db.projects;
    const assignedToQuery = text.includes('איתי') ? 'Itay' : text.includes('אלון') ? 'Alon' : '';

    if (text.includes('money') || text.includes('finance') || text.includes('כסף') || text.includes('פיננס')) {
      return NextResponse.json({ reply: formatFinance(db.finance_logs) });
    }

    if (text.includes('credits') || text.includes('credit') || text.includes('קרדיט') || text.includes('vault')) {
      return NextResponse.json({
        reply: `BAZ AI Credits:\n${formatCredits(db.vault_assets)}`,
      });
    }

    if (assignedToQuery) {
      const matches = projectList.filter((project) => project.assignedTo === assignedToQuery);
      return NextResponse.json({
        reply: matches.length
          ? `BAZ AI: מצאתי פרויקטים תחת ${assignedToQuery}:\n${formatProjects(matches)}`
          : `BAZ AI: לא נמצאו פרויקטים תחת ${assignedToQuery}.`,
      });
    }
    
    if (text.includes('קמפיין')) {
      return NextResponse.json({ reply: 'BAZ AI: לקמפיין הבא כדאי לבנות הצעה ברורה, קהל יעד מדויק, קריאייטיב אחד חזק ומעקב יומי אחרי עלות לליד.' });
    }
    if (text.includes('שיווק')) {
      return NextResponse.json({ reply: 'BAZ AI: השיווק צריך להתמקד במסר חד, הוכחה חברתית, וזרימה מהמודעה לשיחת וואטסאפ או פגישת מכירה.' });
    }
    if (text.includes('בני')) {
      return NextResponse.json({ reply: 'BAZ AI: בני הוא השותף שלך. ביחד אתם מנהלים את קמפייני השיווק בפייסבוק ואת החברה.' });
    }
    if (text.includes('אבי')) {
      return NextResponse.json({ reply: 'BAZ AI: אבי, אתה מנהל האימפריה. אנחנו בונים כעת את חדר הישיבות (Consulting Hub) כדי לנהל את כל האופרציה.' });
    }
    
    return NextResponse.json({ reply: 'BAZ AI: המוח מחובר. איך אפשר לעזור עם השיווק או ניהול החברה?' });
  } catch {
    return NextResponse.json({ reply: 'שגיאת שרת פנימית.' }, { status: 500 });
  }
}
