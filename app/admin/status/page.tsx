'use client';
import { useEffect, useState } from 'react';

type StatusLight = { status: string; message: string };
type StatusData = { status: string; timestamp: string; lights: Record<string, StatusLight> };

export default function AdminStatusPage() {
  const [data, setData] = useState<StatusData | null>(null);
  useEffect(() => { fetch('/api/admin/status').then(r=>r.json()).then(setData); }, []);
  if (!data) return <div style={{background:'#0a0a0a',color:'#fff',padding:40,fontFamily:'monospace',minHeight:'100vh'}}>Loading...</div>;
  const lights: Record<string, StatusLight> = data.lights || {};
  return (
    <div style={{background:'#0a0a0a',color:'#fff',padding:40,fontFamily:'monospace',minHeight:'100vh'}}>
      <h1 style={{color:'#00ff88',fontSize:28,marginBottom:8}}>&#9889; BAZ EMPIRE STATUS</h1>
      <p style={{color:'#555',marginBottom:30}}>{data.timestamp}</p>
      {Object.entries(lights).map(([k,v]) => (
        <div key={k} style={{marginBottom:10,padding:12,background:'#111',borderRadius:8,
          border:'1px solid '+(v.status==='green'?'#00ff88':v.status==='yellow'?'#ffaa00':'#ff4444')}}>
          <span style={{marginRight:10}}>{v.status==='green'?'🟢':v.status==='yellow'?'🟡':'🔴'}</span>
          <strong style={{color:'#ddd'}}>{k}:</strong>
          <span style={{color:'#aaa',marginLeft:8,wordBreak:'break-all'}}>{v.message}</span>
        </div>
      ))}
    </div>
  );
}