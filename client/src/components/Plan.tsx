// Plan – Plán tab
// Gold Performance Design
// Shows: 13-week peaking plan v5.2, exercise details per day with dropset badges
import { useState } from 'react';
import { PHASE3_WEEKS, getCategoryColor, getCategoryLabel, WARMUP_PROTOCOL, WARMUP_SERIES_BY_WEEK } from '@/lib/data';
import type { WarmupSet } from '@/lib/data';
import { getExerciseInfo, CATEGORY_COLORS } from '@/lib/exerciseDescriptions';
import type { WorkoutDataHook } from '@/lib/types';
import type { WorkoutDay, Exercise } from '@/lib/data';

interface Props {
  workoutData: WorkoutDataHook;
}

const TYPE_COLORS: Record<string, string> = {
  lower: 'var(--gd-accent)', upper: 'var(--gd-text)', fullbody: 'var(--gd-accent)',
  hiit: 'var(--gd-fern)', run: 'var(--gd-fern)', rest: 'var(--gd-text-4)',
};

const TYPE_LABELS: Record<string, string> = {
  lower: 'LOWER BODY', upper: 'UPPER BODY', fullbody: 'FULL BODY',
  hiit: 'HIIT', run: 'ZONE 2 RUN', rest: 'VOLNO',
};

// Detect current week index based on today's date
function getCurrentWeekIndex(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const idx = PHASE3_WEEKS.findIndex(w => {
    const from = new Date(w.dateFrom + 'T00:00:00');
    const to = new Date(w.dateTo + 'T23:59:59');
    return today >= from && today <= to;
  });
  // If before plan start → show W1; if after plan end → show last week
  if (idx === -1) {
    const planStart = new Date(PHASE3_WEEKS[0].dateFrom + 'T00:00:00');
    return today < planStart ? 0 : PHASE3_WEEKS.length - 1;
  }
  return idx;
}

// Plan hasn't started yet (today is before W1)
function isBeforePlanStart(): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today < new Date(PHASE3_WEEKS[0].dateFrom + 'T00:00:00');
}

export default function Plan({ workoutData }: Props) {
  const [selectedWeek, setSelectedWeek] = useState(() => getCurrentWeekIndex());
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const currentWeekIndex = getCurrentWeekIndex();
  const notStarted = isBeforePlanStart();
  const week = PHASE3_WEEKS[selectedWeek];

  return (
    <div style={{ padding: '0 0 16px' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--gd-line)' }}>
        <div style={{ color: 'var(--gd-accent)', fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
          TRÉNINKOVÝ PLÁN
        </div>
        <h2 style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--gd-text)' }}>
          Tréninkový plán Podzim 2026 v5.2
        </h2>
        <p style={{ color: 'var(--gd-text-3)', fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>
          13týdenní peaking program · W1–4 Akumulace · W5–8 Síla · W9–11 Intenzifikace · W12 Taper · W13 Test
        </p>
        {selectedWeek !== currentWeekIndex && (
          <button
            onClick={() => setSelectedWeek(currentWeekIndex)}
            style={{
              marginTop: 14, padding: '9px 14px', borderRadius: 0, border: 'none',
              background: 'var(--gd-accent)', color: 'var(--gd-accent-ink)',
              fontSize: 10, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap',
              letterSpacing: '0.18em', textTransform: 'uppercase',
            }}
          >
            ← Zpět na T{PHASE3_WEEKS[currentWeekIndex].number}
          </button>
        )}
      </div>

      {/* Week ruler – všech 13 týdnů najednou, bez rolování */}
      <div style={{ borderBottom: '1px solid var(--gd-line)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {PHASE3_WEEKS.map((w, i) => {
            const isSelected = selectedWeek === i;
            const isCurrent = currentWeekIndex === i;
            return (
              <button
                key={w.number}
                onClick={() => setSelectedWeek(i)}
                style={{
                  padding: '11px 0 9px',
                  border: 'none',
                  borderRight: (i % 7 === 6 || i === PHASE3_WEEKS.length - 1) ? 'none' : '1px solid var(--gd-line)',
                  borderTop: i >= 7 ? '1px solid var(--gd-line)' : 'none',
                  background: isSelected ? 'var(--gd-accent)' : 'transparent',
                  color: isSelected
                    ? 'var(--gd-accent-ink)'
                    : isCurrent
                    ? 'var(--gd-text)'
                    : (w.isDeload ? 'var(--gd-text-4)' : 'var(--gd-text-3)'),
                  cursor: 'pointer',
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em', lineHeight: 1 }}>
                  {String(w.number).padStart(2, '0')}
                </div>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', marginTop: 4, opacity: isSelected ? 0.62 : 1, color: isSelected ? 'inherit' : (isCurrent ? 'var(--gd-fern)' : 'var(--gd-text-4)') }}>
                  {isCurrent ? 'TEĎ' : w.isDeload ? 'DL' : w.phase.includes('Taper') ? 'TAP' : w.phase.includes('TEST') ? 'TEST' : (w.phase.match(/Blok ([ABC])/)?.[1] ?? '·')}
                </div>
              </button>
            );
          })}
          {Array.from({ length: (7 - (PHASE3_WEEKS.length % 7)) % 7 }).map((_, i) => (
            <div key={`pad-${i}`} style={{ borderTop: '1px solid var(--gd-line)' }} />
          ))}
        </div>
      </div>

      {/* Selected week info */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--gd-line)' }}>
        <div style={{ borderLeft: `3px solid ${selectedWeek === currentWeekIndex ? 'var(--gd-fern)' : 'var(--gd-accent)'}`, paddingLeft: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ color: 'var(--gd-accent)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {week.phase}
            </div>
            {selectedWeek === currentWeekIndex && (
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                color: 'var(--gd-fern)', background: 'color-mix(in srgb, var(--gd-fern) 12%, transparent)',
                border: '1px solid color-mix(in srgb, var(--gd-fern) 40%, transparent)', borderRadius: 0,
                padding: '2px 6px', textTransform: 'uppercase',
              }}>
                {notStarted ? '● ZAČÍNÁ BRZY' : '● AKTUÁLNÍ TÝDEN'}
              </span>
            )}
          </div>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 20, fontWeight: 800, color: 'var(--gd-text)', marginTop: 2 }}>
            {week.label}
          </div>
          <div style={{ color: 'var(--gd-text-3)', fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>{week.description}</div>
          <div style={{ color: 'var(--gd-text-4)', fontSize: 11, marginTop: 6 }}>
            {week.dateFrom.split('-').reverse().join('.')} – {week.dateTo.split('-').reverse().join('.')}
            {selectedWeek === currentWeekIndex && (
              <span style={{ color: 'var(--gd-fern)', marginLeft: 8 }}>
                {notStarted ? `• Start ${week.dateFrom.split('-').reverse().join('.')}` : '• Právě probíhá'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Warm-up Protocol */}
      <WarmupSection />

      {/* Days */}
      <div style={{ padding: '14px 20px' }}>
        <div style={{ color: 'var(--gd-text-4)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>DENNÍ ROZVRH</div>
        {week.days.map(day => (
          <DayCard
            key={day.key}
            day={day}
            isExpanded={expandedDay === day.key}
            onToggle={() => setExpandedDay(expandedDay === day.key ? null : day.key)}
            workoutData={workoutData}
            weekNumber={week.number}
          />
        ))}
      </div>
    </div>
  );
}

function WarmupSection() {
  const [open, setOpen] = useState(false);

  const steps = [
    { label: '1. Rotoped', detail: '5 min · Lehká intenzita, rozhejbání kloubů' },
    { label: '2. Dynamický strečink + mobilita', detail: 'Banded ankles · Thorakální extenze · 90/90 stretch (Horschig)' },
    { label: '3. Aktivace', detail: 'LOWER: Glute bridges 2×10 + Band walks 2×12\nUPPER: Scapular push-ups 2×10 + Band pull-aparts 2×15' },
    { label: '4. Rozehřívací série (Zatsiorsky)', detail: 'Tyč (BW) → 40% 1RM → 60% 1RM → 75% 1RM → pracovní váha' },
  ];

  return (
    <div style={{ margin: '0 20px 12px', borderRadius: 0, border: '1px solid color-mix(in srgb, var(--gd-accent) 20%, transparent)', background: 'color-mix(in srgb, var(--gd-accent) 3%, transparent)', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
          background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{ width: 28, height: 28, borderRadius: 0, background: 'color-mix(in srgb, var(--gd-accent) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', flexShrink: 0 }}>WU</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gd-accent)', letterSpacing: '0.05em' }}>WARM-UP PROTOKOL</div>
          <div style={{ fontSize: 11, color: 'var(--gd-text-3)', marginTop: 1 }}>~12 min · Povinný před každým silovým tréninkem</div>
        </div>
        <div style={{ color: 'var(--gd-text-4)', fontSize: 12, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</div>
      </button>

      {open && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid color-mix(in srgb, var(--gd-accent) 10%, transparent)' }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, paddingTop: 12 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'color-mix(in srgb, var(--gd-accent) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--gd-accent) 30%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--gd-accent)', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gd-text)' }}>{step.label}</div>
                <div style={{ fontSize: 11, color: 'var(--gd-text-3)', marginTop: 2, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{step.detail}</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 14, padding: '8px 10px', background: 'color-mix(in srgb, var(--gd-shadow) 20%, transparent)', borderRadius: 0, borderLeft: '2px solid color-mix(in srgb, var(--gd-accent) 40%, transparent)' }}>
            <div style={{ fontSize: 10, color: 'var(--gd-accent)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 2 }}>WARM-UP BENCH – speciální série</div>
            <div style={{ fontSize: 11, color: 'var(--gd-text-3)', lineHeight: 1.6 }}>Tyč ×10 → 60 kg ×6 → 80 kg ×4 → 95 kg ×2 → pracovní váha</div>
          </div>
          <div style={{ marginTop: 8, padding: '8px 10px', background: 'color-mix(in srgb, var(--gd-shadow) 20%, transparent)', borderRadius: 0, borderLeft: '2px solid color-mix(in srgb, var(--gd-accent) 40%, transparent)' }}>
            <div style={{ fontSize: 10, color: 'var(--gd-accent)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 2 }}>WARM-UP SQUAT – speciální série</div>
            <div style={{ fontSize: 11, color: 'var(--gd-text-3)', lineHeight: 1.6 }}>Tyč ×10 → 80 kg ×6 → 100 kg ×4 → 120 kg ×2 → pracovní váha</div>
          </div>
          <div style={{ marginTop: 8, padding: '8px 10px', background: 'color-mix(in srgb, var(--gd-shadow) 20%, transparent)', borderRadius: 0, borderLeft: '2px solid color-mix(in srgb, var(--gd-accent) 40%, transparent)' }}>
            <div style={{ fontSize: 10, color: 'var(--gd-accent)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 2 }}>WARM-UP DEADLIFT – speciální série</div>
            <div style={{ fontSize: 11, color: 'var(--gd-text-3)', lineHeight: 1.6 }}>Tyč ×10 → 100 kg ×5 → 130 kg ×3 → 155 kg ×1 → pracovní váha</div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExerciseRow({ ex, idx, total, latest }: {
  ex: Exercise;
  idx: number;
  total: number;
  latest: any;
}) {
  const [expanded, setExpanded] = useState(false);
  const info = getExerciseInfo(ex.id);
  const catColor = info ? (CATEGORY_COLORS[info.category] || 'var(--gd-text-3)') : getCategoryColor(ex.category);

  return (
    <div style={{ borderBottom: idx < total - 1 ? '1px solid color-mix(in srgb, var(--gd-text) 4%, transparent)' : 'none' }}>
      {/* Exercise header row */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: info ? 'pointer' : 'default' }}
        onClick={() => info && setExpanded(!expanded)}
      >
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: catColor, flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13, color: 'var(--gd-text)', fontWeight: 500 }}>{ex.name}</div>
            {ex.isDropset && (
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--gd-accent)', background: 'color-mix(in srgb, var(--gd-accent) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--gd-accent) 30%, transparent)', borderRadius: 0, padding: '1px 5px', textTransform: 'uppercase' }}>DROP</span>
            )}
            {info && (
              <span style={{ fontSize: 9, color: catColor, background: `${catColor}15`, border: `1px solid ${catColor}30`, borderRadius: 0, padding: '1px 5px', letterSpacing: '0.05em' }}>{info.category}</span>
            )}
          </div>
          {ex.setPlan && ex.setPlan.length > 0 ? (
            <div style={{ fontSize: 11, color: 'var(--gd-text-3)', marginTop: 1 }}>
              {ex.setPlan.length} pracovních sérií · klikni pro detail
            </div>
          ) : (
            <div style={{ fontSize: 11, color: 'var(--gd-text-4)', marginTop: 1 }}>
              {ex.targetSets}×{ex.targetReps}
              {ex.targetWeight ? ` · ${ex.targetWeight}` : ''}
              {ex.note ? ` · ${ex.note}` : ''}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {latest && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontWeight: 700, color: 'var(--gd-accent)' }}>
                {latest.weight !== '0' ? `${latest.weight} kg` : '–'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--gd-text-4)' }}>poslední</div>
            </div>
          )}
          {info && (
            <div style={{ color: 'var(--gd-text-4)', fontSize: 12, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>ⓘ</div>
          )}
        </div>

      </div>

      {/* Přehledný rozpis pracovních sérií */}
      {ex.setPlan && ex.setPlan.length > 0 && (
        <div style={{ margin: '2px 0 8px 15px', border: '1px solid color-mix(in srgb, var(--gd-accent) 14%, transparent)', borderRadius: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', background: 'color-mix(in srgb, var(--gd-accent) 7%, transparent)', padding: '4px 8px', fontSize: 9, letterSpacing: '0.08em', color: 'var(--gd-text-3)', fontWeight: 700 }}>
            <div style={{ width: 26 }}>#</div>
            <div style={{ width: 74 }}>VÁHA</div>
            <div style={{ width: 52 }}>OPAK.</div>
            <div style={{ width: 42 }}>RPE</div>
            <div style={{ flex: 1 }}>TYP</div>
          </div>
          {ex.setPlan.map((sp, i) => {
            const hot = /OVERLOAD|TOP|CÍL|PR/.test(sp.label);
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', padding: '5px 8px', fontSize: 12,
                background: hot ? 'color-mix(in srgb, var(--gd-accent) 10%, transparent)' : (i % 2 ? 'color-mix(in srgb, var(--gd-text) 2%, transparent)' : 'transparent'),
                borderTop: '1px solid color-mix(in srgb, var(--gd-text) 4%, transparent)',
              }}>
                <div style={{ width: 26, color: 'var(--gd-text-3)', fontSize: 11 }}>{i + 1}.</div>
                <div style={{ width: 74, fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontWeight: 800, fontSize: 15, color: hot ? 'var(--gd-accent)' : 'var(--gd-text)' }}>{sp.weight} kg</div>
                <div style={{ width: 52, fontWeight: 700, color: 'var(--gd-text)' }}>× {sp.reps}</div>
                <div style={{ width: 42, color: 'var(--gd-text-3)', fontSize: 11 }}>{sp.rpe || '–'}</div>
                <div style={{ flex: 1, fontSize: 10, color: hot ? 'var(--gd-accent)' : 'var(--gd-text-3)', fontWeight: hot ? 700 : 400 }}>{sp.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expandable description */}
      {expanded && info && (
        <div style={{ margin: '0 0 10px 15px', padding: '12px 14px', background: 'color-mix(in srgb, var(--gd-shadow) 30%, transparent)', borderRadius: 0, border: `1px solid ${catColor}20` }}>
          {/* Why */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: catColor, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>PROČ JE V PLÁNU</div>
            <div style={{ fontSize: 12, color: 'var(--gd-text-2)', lineHeight: 1.6 }}>{info.why}</div>
          </div>
          {/* How */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: 'var(--gd-text-3)', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>JAK PROVÁDĚT</div>
            <div style={{ fontSize: 12, color: 'var(--gd-text-3)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{info.how}</div>
          </div>
          {/* Tip */}
          {info.tip && (
            <div style={{ padding: '8px 10px', background: 'color-mix(in srgb, var(--gd-accent) 6%, transparent)', borderRadius: 0, borderLeft: '2px solid var(--gd-accent)' }}>
              <div style={{ fontSize: 10, color: 'var(--gd-accent)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 2 }}>TIP</div>
              <div style={{ fontSize: 12, color: 'var(--gd-accent)', lineHeight: 1.5 }}>{info.tip}</div>
            </div>
          )}
          {/* Target muscles */}
          {info.targetMuscles && (
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--gd-text-4)' }}>{info.targetMuscles}</div>
          )}
        </div>
      )}
    </div>
  );
}

// Dynamic warm-up series block – uses WARMUP_SERIES_BY_WEEK from data.ts
function WarmupSeriesBlock({ dayType, weekNumber }: { dayType: string; weekNumber: number }) {
  const [open, setOpen] = useState(false);

  const weekData = WARMUP_SERIES_BY_WEEK[weekNumber];

  const lifts = dayType === 'lower'
    ? [{ key: 'squat' as const, label: 'SQUAT – Rozehřívací série', icon: 'SQ', series: weekData?.squat }]
    : dayType === 'upper'
    ? [{ key: 'bench' as const, label: 'BENCH PRESS – Rozehřívací série', icon: 'BP', series: weekData?.bench }]
    : [
        { key: 'deadlift' as const, label: 'DEADLIFT – Rozehřívací série', icon: 'DL', series: weekData?.deadlift },
      ];

  const formatWeight = (w: number) => w === 20 ? 'Tyč (20 kg)' : `${w} kg`;
  const extractPct = (note?: string) => {
    if (!note) return '–';
    const m = note.match(/(~?\d+%)/);
    return m ? m[1] : '–';
  };
  const extractNote = (note?: string) => {
    if (!note) return '–';
    return note.replace(/~?\d+%/, '').replace(/^\s*[–-]\s*/, '').trim() || '–';
  };

  return (
    <div style={{ marginBottom: 12, borderRadius: 0, border: '1px solid color-mix(in srgb, var(--gd-fern) 20%, transparent)', background: 'color-mix(in srgb, var(--gd-fern) 3%, transparent)', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--gd-fern)' }}>WU</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gd-fern)', letterSpacing: '0.08em' }}>ROZEHŘÍVACÍ SÉRIE (Zatsiorsky) – W{weekNumber}</div>
          <div style={{ fontSize: 10, color: 'var(--gd-text-4)', marginTop: 1 }}>Klikněte pro zobrazení · Zapisují se jen pracovní série</div>
        </div>
        <div style={{ color: 'var(--gd-text-4)', fontSize: 11, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</div>
      </button>

      {open && (
        <div style={{ padding: '0 12px 12px', borderTop: '1px solid color-mix(in srgb, var(--gd-fern) 10%, transparent)' }}>
          {lifts.map(lift => (
            <div key={lift.key} style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gd-fern)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>{lift.icon} {lift.label}</div>
              {lift.series && lift.series.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '50px 100px 40px 50px 1fr', gap: '4px 8px' }}>
                  <div style={{ fontSize: 9, color: 'var(--gd-text-4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>SÉRIE</div>
                  <div style={{ fontSize: 9, color: 'var(--gd-text-4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>VÁHA</div>
                  <div style={{ fontSize: 9, color: 'var(--gd-text-4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>REPS</div>
                  <div style={{ fontSize: 9, color: 'var(--gd-accent)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>% 1RM</div>
                  <div style={{ fontSize: 9, color: 'var(--gd-text-4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>POZNÁMKA</div>
                  {lift.series.map((row: WarmupSet, i: number) => (
                    <>
                      <div key={`s${i}`} style={{ fontSize: 11, color: 'var(--gd-text-2)', padding: '3px 0', borderTop: '1px solid color-mix(in srgb, var(--gd-text) 4%, transparent)' }}>1×{row.reps}</div>
                      <div key={`w${i}`} style={{ fontSize: 11, color: 'var(--gd-text)', fontWeight: 600, padding: '3px 0', borderTop: '1px solid color-mix(in srgb, var(--gd-text) 4%, transparent)' }}>{formatWeight(row.weight)}</div>
                      <div key={`r${i}`} style={{ fontSize: 11, color: 'var(--gd-fern)', padding: '3px 0', borderTop: '1px solid color-mix(in srgb, var(--gd-text) 4%, transparent)' }}>{row.reps}</div>
                      <div key={`p${i}`} style={{ fontSize: 11, color: 'var(--gd-accent)', fontWeight: 600, padding: '3px 0', borderTop: '1px solid color-mix(in srgb, var(--gd-text) 4%, transparent)' }}>{extractPct(row.note)}</div>
                      <div key={`n${i}`} style={{ fontSize: 10, color: 'var(--gd-text-3)', padding: '3px 0', borderTop: '1px solid color-mix(in srgb, var(--gd-text) 4%, transparent)', lineHeight: 1.4 }}>{extractNote(row.note) !== '–' ? extractNote(row.note) : (row.weight === 20 ? 'Pohybový vzorec' : '–')}</div>
                    </>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 11, color: 'var(--gd-text-4)' }}>Data pro tento týden nejsou k dispozici.</div>
              )}
            </div>
          ))}
          <div style={{ marginTop: 10, padding: '7px 10px', background: 'color-mix(in srgb, var(--gd-shadow) 20%, transparent)', borderRadius: 0, borderLeft: '2px solid color-mix(in srgb, var(--gd-fern) 40%, transparent)' }}>
            <div style={{ fontSize: 10, color: 'var(--gd-fern)', fontWeight: 700, marginBottom: 2 }}>⚠️ DO DENÍKU SE ZAPISUJÍ JEN PRACOVNÍ SÉRIE</div>
            <div style={{ fontSize: 10, color: 'var(--gd-text-4)', lineHeight: 1.5 }}>Rozehřívací série slouží jen jako příprava CNS a pohybového vzorce. Nepočítej je jako objem.</div>
          </div>
        </div>
      )}
    </div>
  );
}

function DayCard({ day, isExpanded, onToggle, workoutData, weekNumber }: {
  day: WorkoutDay;
  isExpanded: boolean;
  onToggle: () => void;
  workoutData: WorkoutDataHook;
  weekNumber: number;
}) {
  const color = TYPE_COLORS[day.type] || 'var(--gd-text-3)';
  const isRest = day.type === 'rest';

  return (
    <div style={{ marginBottom: 8 }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          background: isExpanded ? 'color-mix(in srgb, var(--gd-accent) 6%, transparent)' : 'color-mix(in srgb, var(--gd-text) 2%, transparent)',
          border: isExpanded ? '1px solid color-mix(in srgb, var(--gd-accent) 20%, transparent)' : '1px solid var(--gd-line)',
          borderRadius: 0,
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.15s ease',
        }}
      >
        <div style={{ width: 3, height: 36, background: color, borderRadius: 0, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gd-text)' }}>{day.label}</div>
          <div style={{ fontSize: 11, color: color, marginTop: 1 }}>{TYPE_LABELS[day.type] || day.type.toUpperCase()}</div>
        </div>
        {!isRest && (
          <div style={{ fontSize: 11, color: 'var(--gd-text-4)' }}>{day.exercises.length} {day.exercises.length === 1 ? 'cvik' : day.exercises.length <= 4 ? 'cviky' : 'cviků'}</div>
        )}
        <div style={{ color: 'var(--gd-text-4)', fontSize: 14, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▼</div>
      </button>

      {isExpanded && !isRest && (
        <div style={{
          background: 'color-mix(in srgb, var(--gd-accent) 3%, transparent)',
          border: '1px solid color-mix(in srgb, var(--gd-accent) 15%, transparent)',
          borderTop: 'none',
          borderRadius: '0',
          padding: '8px 14px 12px',
        }}>
          <div style={{ color: 'var(--gd-text-3)', fontSize: 11, marginBottom: 10, paddingTop: 6 }}>{day.description}</div>
          {/* Warm-up series for strength days */}
          {(day.type === 'lower' || day.type === 'upper' || day.type === 'fullbody') && (
            <WarmupSeriesBlock dayType={day.type} weekNumber={weekNumber} />
          )}
          {day.exercises.map((ex, idx) => {
            const latest = workoutData.getLatestRecord(ex.id);
            return (
              <ExerciseRow key={ex.id} ex={ex} idx={idx} total={day.exercises.length} latest={latest} />
            );
          })}
        </div>
      )}

      {isExpanded && isRest && (
        <div style={{
          background: 'color-mix(in srgb, var(--gd-text) 2%, transparent)',
          border: '1px solid var(--gd-line)',
          borderTop: 'none',
          borderRadius: '0',
          padding: '12px 14px',
          color: 'var(--gd-text-4)',
          fontSize: 12,
        }}>
          Aktivní regenerace: procházka, strečink, sauna, masáž. Žádný silový trénink.
        </div>
      )}
    </div>
  );
}
