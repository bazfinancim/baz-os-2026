"use client";
import { useEffect, useState } from "react";

interface Company { id: string; name: string; status: string; online: boolean; }
interface HubStatus {
  hub_active: boolean; hub_live: boolean;
  companies: Company[]; total_active: number; checked_at: string;
}

export function HubStatusPanel() {
  const [data, setData] = useState<HubStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const r = await fetch("/api/hub-status", { cache: "no-store" });
      setData(await r.json() as HubStatus);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  if (loading) return (
    <div style={{padding:20,textAlign:"center",color:"#22d3ee",fontSize:13}}>
      ⏳ בודק Hub...
    </div>
  );
  if (!data) return null;

  const allGreen = data.total_active === 15;

  return (
    <div style={{
      background:"rgba(4,8,20,0.92)",
      border:`1px solid ${allGreen ? "#22c55e" : "#f59e0b"}44`,
      borderRadius:16, padding:16,
      direction:"rtl",
    }}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <span style={{fontSize:18}}>🏭</span>
        <span style={{color:"#f1f5f9",fontWeight:700,fontSize:14}}>BAZ Master Hub</span>
        <div style={{marginLeft:"auto",display:"flex",gap:6,alignItems:"center"}}>
          <span style={{
            width:9,height:9,borderRadius:"50%",display:"inline-block",
            background: data.hub_live ? "#22c55e" : "#f59e0b",
            boxShadow: data.hub_live ? "0 0 8px #22c55e" : "0 0 8px #f59e0b",
          }}/>
          <span style={{color: data.hub_live ? "#22c55e" : "#f59e0b",fontSize:12}}>
            {data.hub_live ? "LIVE" : "STANDBY"}
          </span>
        </div>
      </div>

      {/* Counter */}
      <div style={{
        textAlign:"center",padding:"10px 0",
        fontSize:36,fontWeight:900,
        color: allGreen ? "#22c55e" : "#f59e0b",
        textShadow: `0 0 30px ${allGreen ? "#22c55e" : "#f59e0b"}66`,
      }}>
        {data.total_active} / 15
        <div style={{fontSize:11,color:"#64748b",fontWeight:400,marginTop:2}}>חברות פעילות</div>
      </div>

      {/* Grid */}
      <div style={{
        display:"grid",gridTemplateColumns:"repeat(5,1fr)",
        gap:6,marginTop:12,
      }}>
        {data.companies.map(c => (
          <div key={c.id} title={c.name} style={{
            background: c.online ? "rgba(34,197,94,0.08)" : "rgba(245,158,11,0.08)",
            border:`1px solid ${c.online ? "#22c55e" : "#f59e0b"}33`,
            borderRadius:8,padding:"6px 4px",
            textAlign:"center",cursor:"default",
            transition:"all 0.3s",
          }}>
            <div style={{
              width:8,height:8,borderRadius:"50%",margin:"0 auto 4px",
              background: c.online ? "#22c55e" : "#f59e0b",
              boxShadow: c.online ? "0 0 6px #22c55e" : "none",
            }}/>
            <div style={{
              fontSize:9,color: c.online ? "#86efac" : "#fcd34d",
              lineHeight:1.2,overflow:"hidden",
              whiteSpace:"nowrap",textOverflow:"ellipsis",
            }}>{c.name.replace("Baz ","")}</div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop:10,fontSize:10,color:"#1e293b",textAlign:"center",
      }}>
        עדכון אחרון: {data.checked_at ? new Date(data.checked_at).toLocaleTimeString("he-IL") : "-"}
        <button onClick={load} style={{
          marginRight:8,color:"#334155",background:"none",border:"none",cursor:"pointer",fontSize:10
        }}>↻ רענן</button>
      </div>
    </div>
  );
}
