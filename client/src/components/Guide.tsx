// Průvodce – detailní rozpis a vysvětlení ke každému týdnu plánu
import { useState } from 'react';
import { WEEK_GUIDE } from '@/lib/weekGuide';
import { getCurrentWeek } from '@/lib/data';

const MODE_COLOR: Record<string, string> = {
  'objemový': '#6FA8DC', 'silový': '#F5C842', 'deload': '#8f8f8f', 'taper': '#7FCB8F', 'test': '#E8A87C',
};

export default function Guide() {
  const current = getCurrentWeek();
  const [sel, setSel] = useState(() => Math.min(Math.max(current, 1), WEEK_GUIDE.length) - 1);
  const g = WEEK_GUIDE[sel];
  const color = MODE_COLOR[g.mode] || '#F5C842';

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.02)', border: '1px solid #1c1c1c',
    borderRadius: 12, padding: 14, marginBottom: 12,
  };
  const label: React.CSSProperties = {
    fontSize: 10, letterSpacing: '0.18em', color: '#666', fontWeight: 700, marginBottom: 8,
  };

  return (
    <div style={{ padding: '20px 16px 24px' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.25em', color: '#F5C842', fontWeight: 600, marginBottom: 4 }}>
        PRŮVODCE PLÁNEM
      </div>
      <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 24, fontWeight: 800, margin: 0, color: '#f0f0f0' }}>
        Detailní rozpis týdne
      </h2>
      <p style={{ color: '#666', fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
        Ke každému týdnu: co se trénuje, proč, jaké RPE a co rotuje. Vychází z dokumentu Podzim 2026 v5.2.
      </p>

      {/* výběr týdne */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '12px 0 14px', WebkitOverflowScrolling: 'touch' }}>
        {WEEK_GUIDE.map((w, i) => {
          const active = i === sel;
          const c = MODE_COLOR[w.mode] || '#F5C842';
          return (
            <button key={w.wk} onClick={() => setSel(i)} style={{
              flexShrink: 0, minWidth: 46, padding: '7px 9px', borderRadius: 8, cursor: 'pointer',
              background: active ? `${c}22` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${active ? c : '#222'}`,
              color: active ? c : '#777', fontWeight: active ? 800 : 500, fontSize: 12,
            }}>
              T{w.wk}{w.wk === current ? ' •' : ''}
            </button>
          );
        })}
      </div>

      {/* hlavička týdne */}
      <div style={{ ...card, borderLeft: `3px solid ${color}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
          <span style={{ fontSize: 11, letterSpacing: '0.1em', color, fontWeight: 700 }}>{g.title.toUpperCase()}</span>
          <span style={{ fontSize: 9, background: `${color}20`, color, border: `1px solid ${color}40`, borderRadius: 4, padding: '2px 6px', fontWeight: 700 }}>
            {g.mode.toUpperCase()}
          </span>
          {g.wk === current && (
            <span style={{ fontSize: 9, background: 'rgba(127,203,143,0.15)', color: '#7FCB8F', borderRadius: 4, padding: '2px 6px', fontWeight: 700 }}>AKTUÁLNÍ</span>
          )}
        </div>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 22, fontWeight: 800, color: '#f0f0f0' }}>
          Týden {g.wk}
        </div>
        <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{g.dates}</div>
        <div style={{ fontSize: 13, color: '#c8c8c8', marginTop: 10, lineHeight: 1.55 }}>{g.focus}</div>
      </div>

      {/* proč */}
      <div style={card}>
        <div style={label}>PROČ TENHLE TÝDEN VYPADÁ TAKHLE</div>
        <div style={{ fontSize: 13, color: '#c0c0c0', lineHeight: 1.6 }}>{g.why}</div>
      </div>

      {/* hlavní cviky */}
      <div style={card}>
        <div style={label}>HLAVNÍ CVIKY – ROZPIS SÉRIÍ</div>
        {g.main.map((m, i) => (
          <div key={i} style={{ marginBottom: i < g.main.length - 1 ? 10 : 0 }}>
            <div style={{ fontSize: 12, color: '#F5C842', fontWeight: 700, marginBottom: 3 }}>{m.lift}</div>
            <div style={{ fontSize: 12, color: '#b0b0b0', lineHeight: 1.5 }}>{m.text}</div>
          </div>
        ))}
      </div>

      {/* na co dát pozor */}
      <div style={card}>
        <div style={label}>NA CO DÁT POZOR</div>
        {g.points.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <span style={{ color: '#F5C842', fontSize: 12 }}>•</span>
            <span style={{ fontSize: 12.5, color: '#b8b8b8', lineHeight: 1.5 }}>{p}</span>
          </div>
        ))}
      </div>

      {/* RPE */}
      <div style={{ ...card, background: 'rgba(245,200,66,0.05)', border: '1px solid rgba(245,200,66,0.18)' }}>
        <div style={{ ...label, color: '#8a7a4a' }}>RPE PRO TENTO TÝDEN</div>
        <div style={{ fontSize: 13, color: '#d8d8d8', lineHeight: 1.55 }}>{g.rpe}</div>
      </div>

      {/* rotace cviků */}
      <div style={card}>
        <div style={label}>ROTACE CVIKŮ ({g.block})</div>
        {g.rotation.map((r, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', gap: 10,
            padding: '6px 0', borderBottom: i < g.rotation.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
          }}>
            <span style={{ fontSize: 12, color: '#777' }}>{r.slot}</span>
            <span style={{ fontSize: 12, color: '#d0d0d0', fontWeight: 600, textAlign: 'right' }}>{r.value}</span>
          </div>
        ))}
      </div>

      {/* kardio */}
      <div style={card}>
        <div style={label}>HIIT A BĚH</div>
        <div style={{ fontSize: 12.5, color: '#b8b8b8', lineHeight: 1.55 }}>{g.cardio}</div>
      </div>

      <div style={{ fontSize: 10.5, color: '#444', textAlign: 'center', marginTop: 4, lineHeight: 1.5 }}>
        Zdroj: Tréninkový plán Podzim 2026 v5.2 · Israetel · Tuchscherer · Smith · Zatsiorsky · Viada
      </div>
    </div>
  );
}
