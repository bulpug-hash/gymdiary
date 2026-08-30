// Průvodce – detailní rozpis a vysvětlení ke každému týdnu plánu
import { useState } from 'react';
import { WEEK_GUIDE } from '@/lib/weekGuide';
import { getCurrentWeek } from '@/lib/data';
import { Hero, Marquee, SectionHead } from '@/components/kit';
import { tint } from '@/lib/tint';

const MODE_COLOR: Record<string, string> = {
  'objemový': 'var(--gd-text-2)', 'silový': 'var(--gd-accent)', 'deload': 'var(--gd-text-3)', 'taper': 'var(--gd-fern)', 'test': 'var(--gd-danger)',
};

export default function Guide() {
  const current = getCurrentWeek();
  const [sel, setSel] = useState(() => Math.min(Math.max(current, 1), WEEK_GUIDE.length) - 1);
  const g = WEEK_GUIDE[sel];
  const color = MODE_COLOR[g.mode] || 'var(--gd-accent)';

  const card: React.CSSProperties = {
    background: 'color-mix(in srgb, var(--gd-text) 2%, transparent)', border: '1px solid var(--gd-line)',
    borderRadius: 0, padding: 14, marginBottom: 12,
  };
  const label: React.CSSProperties = {
    fontSize: 10, letterSpacing: '0.18em', color: 'var(--gd-text-3)', fontWeight: 700, marginBottom: 8,
  };

  return (
    <div>
      <Hero
        plate="guide"
        ghost={String(g.wk).padStart(2, '0')}
        kicker="Průvodce plánem"
        title={<>Detailní<br />rozpis týdne</>}
        stat={{ label: 'Týden', value: String(g.wk).padStart(2, '0') }}
        meta={
          <>
            <b>{g.title}</b>
            <span>·</span>
            <span>{g.mode}</span>
            <span>·</span>
            <span>{g.dates}</span>
          </>
        }
      />

      <Marquee items={['Co se trénuje', 'Proč právě takhle', 'Jaké RPE', 'Co rotuje', 'Podzim ’26 v5.2']} />

      <div className="gd-body">
      {/* výběr týdne – pravítko, všech 13 najednou */}
      <SectionHead n="01" label="Vyber týden" right="01 — 13" />
      <div style={{ margin: '0 20px 22px', borderTop: '1px solid var(--gd-line)', borderBottom: '1px solid var(--gd-line)' }}>
        <div className="gd-weekruler" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {WEEK_GUIDE.map((w, i) => {
            const active = i === sel;
            const isNow = w.wk === current;
            const code = w.mode === 'deload' ? 'DL'
              : w.mode === 'taper' ? 'TAP'
              : w.mode === 'test' ? 'TEST'
              : (w.block.match(/Blok ([ABC])/)?.[1] ?? '·');
            return (
              <button key={w.wk} onClick={() => setSel(i)} style={{
                padding: '11px 0 9px', border: 'none', cursor: 'pointer',
                borderRight: (i % 7 === 6 || i === WEEK_GUIDE.length - 1) ? 'none' : '1px solid var(--gd-line)',
                borderTop: i >= 7 ? '1px solid var(--gd-line)' : 'none',
                background: active ? 'var(--gd-accent)' : 'transparent',
                color: active ? 'var(--gd-accent-ink)' : isNow ? 'var(--gd-text)' : 'var(--gd-text-3)',
                transition: 'background 0.15s ease, color 0.15s ease',
              }}>
                <div style={{ fontSize: 12, fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                  {String(w.wk).padStart(2, '0')}
                </div>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', marginTop: 4,
                  opacity: active ? 0.62 : 1,
                  color: active ? 'inherit' : (isNow ? 'var(--gd-fern)' : 'var(--gd-text-4)') }}>
                  {isNow ? 'TEĎ' : code}
                </div>
              </button>
            );
          })}
          {Array.from({ length: (7 - (WEEK_GUIDE.length % 7)) % 7 }).map((_, i) => (
            <div key={`p${i}`} style={{ borderTop: '1px solid var(--gd-line)' }} />
          ))}
        </div>
      </div>

      {/* hlavička týdne */}
      <div style={{ padding: '0 20px' }}>
      <div style={{ ...card, borderLeft: `3px solid ${color}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
          <span style={{ fontSize: 11, letterSpacing: '0.1em', color, fontWeight: 700 }}>{g.title.toUpperCase()}</span>
          <span style={{ fontSize: 9, background: `${tint(color, 13)}`, color, border: `1px solid ${tint(color, 25)}`, borderRadius: 0, padding: '2px 6px', fontWeight: 700 }}>
            {g.mode.toUpperCase()}
          </span>
          {g.wk === current && (
            <span style={{ fontSize: 9, background: 'color-mix(in srgb, var(--gd-fern) 15%, transparent)', color: 'var(--gd-fern)', borderRadius: 0, padding: '2px 6px', fontWeight: 700 }}>AKTUÁLNÍ</span>
          )}
        </div>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 22, fontWeight: 800, color: 'var(--gd-text)' }}>
          Týden {g.wk}
        </div>
        <div style={{ fontSize: 11, color: 'var(--gd-text-3)', marginTop: 2 }}>{g.dates}</div>
        <div className="gd-serif" style={{ fontSize: 15, color: 'var(--gd-text-2)', marginTop: 10, lineHeight: 1.6 }}>{g.focus}</div>
      </div>

      </div>

      {/* Tiskový předěl – rytina přes celou šířku. Guide je nejdelší čtení
          v appce, tenhle pruh ho rozdělí a drží jazyk plakátů. */}
      <div className="gd-frieze" aria-hidden="true" />

      <div style={{ padding: '0 20px' }}>
      <div className="gd-masonry">
      {/* proč */}
      <div style={card}>
        <div style={label}>PROČ TENHLE TÝDEN VYPADÁ TAKHLE</div>
        <div className="gd-serif" style={{ fontSize: 15, color: 'var(--gd-text-2)', lineHeight: 1.65 }}>{g.why}</div>
      </div>

      {/* hlavní cviky */}
      <div style={card}>
        <div style={label}>HLAVNÍ CVIKY – ROZPIS SÉRIÍ</div>
        {g.main.map((m, i) => (
          <div key={i} style={{ marginBottom: i < g.main.length - 1 ? 10 : 0 }}>
            <div style={{ fontSize: 12, color: 'var(--gd-accent)', fontWeight: 700, marginBottom: 3 }}>{m.lift}</div>
            <div style={{ fontSize: 12, color: 'var(--gd-text-2)', lineHeight: 1.5 }}>{m.text}</div>
          </div>
        ))}
      </div>

      {/* na co dát pozor */}
      <div style={card}>
        <div style={label}>NA CO DÁT POZOR</div>
        {g.points.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <span style={{ color: 'var(--gd-accent)', fontSize: 12 }}>•</span>
            <span style={{ fontSize: 12.5, color: 'var(--gd-text-2)', lineHeight: 1.5 }}>{p}</span>
          </div>
        ))}
      </div>

      {/* RPE */}
      <div style={{ ...card, background: 'color-mix(in srgb, var(--gd-accent) 5%, transparent)', border: '1px solid color-mix(in srgb, var(--gd-accent) 18%, transparent)' }}>
        <div style={{ ...label, color: 'var(--gd-text-3)' }}>RPE PRO TENTO TÝDEN</div>
        <div style={{ fontSize: 13, color: 'var(--gd-text)', lineHeight: 1.55 }}>{g.rpe}</div>
      </div>

      {/* rotace cviků */}
      <div style={card}>
        <div style={label}>ROTACE CVIKŮ ({g.block})</div>
        {g.rotation.map((r, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', gap: 10,
            padding: '6px 0', borderBottom: i < g.rotation.length - 1 ? '1px solid color-mix(in srgb, var(--gd-text) 4%, transparent)' : 'none',
          }}>
            <span style={{ fontSize: 12, color: 'var(--gd-text-3)' }}>{r.slot}</span>
            <span style={{ fontSize: 12, color: 'var(--gd-text)', fontWeight: 600, textAlign: 'right' }}>{r.value}</span>
          </div>
        ))}
      </div>

      {/* kardio */}
      <div style={card}>
        <div style={label}>HIIT A BĚH</div>
        <div style={{ fontSize: 12.5, color: 'var(--gd-text-2)', lineHeight: 1.55 }}>{g.cardio}</div>
      </div>

      </div>

      <div style={{ fontSize: 10.5, color: 'var(--gd-text-4)', textAlign: 'center', margin: '4px 0 36px', lineHeight: 1.5 }}>
        Zdroj: Tréninkový plán Podzim 2026 v5.2 · Israetel · Tuchscherer · Smith · Zatsiorsky · Viada
      </div>
      </div>
      </div>
    </div>
  );
}
