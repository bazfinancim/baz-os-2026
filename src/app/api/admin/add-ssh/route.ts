import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const SECRET = 'baz-deploy-2026-secret';

export async function POST(req: Request) {
  const { secret, pubkey } = await req.json();
  if (secret !== SECRET) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  
  try {
    const key = pubkey || 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFMBslSMreCwCk7wNvsBw3YgCiiCAuZryDMNv3nc1fad github-actions@baz-f.co.il';
    await execAsync(`mkdir -p /root/.ssh && echo "${key}" >> /root/.ssh/authorized_keys && chmod 600 /root/.ssh/authorized_keys`);
    return NextResponse.json({ ok: true, msg: 'key added' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
