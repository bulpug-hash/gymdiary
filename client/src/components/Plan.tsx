// Plan – Plán tab
// Gold Performance Design
// Shows: 16-week progressive plan v2.0, exercise details per day with dropset badges
import { useState } from 'react';
import { PHASE3_WEEKS, getCategoryColor, getCategoryLabel, WARMUP_PROTOCOL } from '@/lib/data';
import { getExerciseInfo, CATEGORY_COLORS } from '@/lib/exerciseDescriptions';
import type { WorkoutDataHook } from '@/lib/types';
import type { WorkoutDay, Exercise } from '@/lib/data';

interface Props {
  workoutData: WorkoutDataHook;
}

const TYPE_COLORS: Record<string, string> = {
  lower: '#F5C842', upper: '#E8E8E8', fullbody: '#F5C842',
  hiit: '#6EE7B7', run: '#6EE7B7', rest: '#444',
};

const TYPE_LABELS: Record<string, string> = {
  lower: 'LOWER BODY', upper: 'UPPER BODY', fullbody: 'FULL BODY',
  hiit: 'HIIT', run: 'ZONE 2 RUN', rest: 'VOLNO',
};

export default function Plan({ workoutData }: Props) {
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const week = PHASE3_WEEKS[selectedWeek];

  return (
    <div style={{ padding: '0 0 16px' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #1c1c1c' }}>
        <div style={{ color: '#F5C842', fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
          TRÉNINKOVÝ PLÁN
        </div>
        <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#f0f0f0' }}>
          Vědecky podložený plán 2026 v2.0
        </h2>
        <p style={{ color: '#666', fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>
          16týdenní silově-hypertrofický program · W1–4 Akumulace · W5–8 Síla · W9–12 Intenzifikace · W13–16 Peaking
        </p>
      </div>

      {/* Week selector */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #1c1c1c', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 6, minWidth: 'max-content' }}>
          {PHASE3_WEEKS.map((w, i) => (
            <button
              key={w.number}
              onClick={() => setSelectedWeek(i)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: selectedWeek === i ? '1px solid #F5C842' : '1px solid #1c1c1c',
                background: selectedWeek === i ? 'rgba(245,200,66,0.12)' : 'transparent',
                color: selectedWeek === i ? '#F5C842' : (w.isDeload ? '#5ECFB1' : '#666'),
                fontSize: 11,
                fontWeight: selectedWeek === i ? 700 : 400,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              T{w.number}{w.isDeload ? ' 🔄' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Selected week info */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #1c1c1c' }}>
        <div style={{ borderLeft: '3px solid #F5C842', paddingLeft: 14 }}>
          <div style={{ color: '#F5C842', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {week.phase}
          </div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 20, fontWeight: 800, color: '#f0f0f0', marginTop: 2 }}>
            {week.label}
          </div>
          <div style={{ color: '#888', fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>{week.description}</div>
          <div style={{ color: '#555', fontSize: 11, marginTop: 6 }}>
            {week.dateFrom.split('-').reverse().join('.')} – {week.dateTo.split('-').reverse().join('.')}
          </div>
        </div>
      </div>

      {/* Warm-up Protocol */}
      <WarmupSection />

      {/* Days */}
      <div style={{ padding: '14px 20px' }}>
        <div style={{ color: '#444', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>DENNÍ ROZVRH</div>
        {week.days.map(day => (
          <DayCard
            key={day.key}
            day={day}
            isExpanded={expandedDay === day.key}
            onToggle={() => setExpandedDay(expandedDay === day.key ? null : day.key)}
            workoutData={workoutData}
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
    <div style={{ margin: '0 20px 12px', borderRadius: 12, border: '1px solid rgba(245,200,66,0.2)', background: 'rgba(245,200,66,0.03)', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
          background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(245,200,66,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🔥</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#F5C842', letterSpacing: '0.05em' }}>WARM-UP PROTOKOL</div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 1 }}>~12 min · Povinný před každým silovým tréninkem</div>
        </div>
        <div style={{ color: '#555', fontSize: 12, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</div>
      </button>

      {open && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(245,200,66,0.1)' }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, paddingTop: 12 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#F5C842', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#d0d0d0' }}>{step.label}</div>
                <div style={{ fontSize: 11, color: '#777', marginTop: 2, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{step.detail}</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 14, padding: '8px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, borderLeft: '2px solid rgba(245,200,66,0.4)' }}>
            <div style={{ fontSize: 10, color: '#F5C842', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 2 }}>WARM-UP BENCH – speciální série</div>
            <div style={{ fontSize: 11, color: '#888', lineHeight: 1.6 }}>Tyč ×10 → 60 kg ×6 → 80 kg ×4 → 95 kg ×2 → pracovní váha</div>
          </div>
          <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, borderLeft: '2px solid rgba(245,200,66,0.4)' }}>
            <div style={{ fontSize: 10, color: '#F5C842', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 2 }}>WARM-UP SQUAT – speciální série</div>
            <div style={{ fontSize: 11, color: '#888', lineHeight: 1.6 }}>Tyč ×10 → 80 kg ×6 → 100 kg ×4 → 120 kg ×2 → pracovní váha</div>
          </div>
          <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, borderLeft: '2px solid rgba(245,200,66,0.4)' }}>
            <div style={{ fontSize: 10, color: '#F5C842', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 2 }}>WARM-UP DEADLIFT – speciální série</div>
            <div style={{ fontSize: 11, color: '#888', lineHeight: 1.6 }}>Tyč ×10 → 100 kg ×5 → 130 kg ×3 → 155 kg ×1 → pracovní váha</div>
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
  const catColor = info ? (CATEGORY_COLORS[info.category] || '#888') : getCategoryColor(ex.category);

  return (
    <div style={{ borderBottom: idx < total - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
      {/* Exercise header row */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: info ? 'pointer' : 'default' }}
        onClick={() => info && setExpanded(!expanded)}
      >
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: catColor, flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13, color: '#d0d0d0', fontWeight: 500 }}>{ex.name}</div>
            {ex.isDropset && (
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: '#F5C842', background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.3)', borderRadius: 4, padding: '1px 5px', textTransform: 'uppercase' }}>DROP</span>
            )}
            {info && (
              <span style={{ fontSize: 9, color: catColor, background: `${catColor}15`, border: `1px solid ${catColor}30`, borderRadius: 4, padding: '1px 5px', letterSpacing: '0.05em' }}>{info.category}</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: '#555', marginTop: 1 }}>
            {ex.targetSets}×{ex.targetReps}
            {ex.targetWeight ? ` · ${ex.targetWeight}` : ''}
            {ex.note ? ` · ${ex.note}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {latest && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, color: '#F5C842' }}>
                {latest.weight !== '0' ? `${latest.weight} kg` : '–'}
              </div>
              <div style={{ fontSize: 10, color: '#444' }}>poslední</div>
            </div>
          )}
          {info && (
            <div style={{ color: '#444', fontSize: 12, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>ⓘ</div>
          )}
        </div>
      </div>

      {/* Expandable description */}
      {expanded && info && (
        <div style={{ margin: '0 0 10px 15px', padding: '12px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: 10, border: `1px solid ${catColor}20` }}>
          {/* Why */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: catColor, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>PROČ JE V PLÁNU</div>
            <div style={{ fontSize: 12, color: '#aaa', lineHeight: 1.6 }}>{info.why}</div>
          </div>
          {/* How */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: '#888', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>JAK PROVÁDĚT</div>
            <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{info.how}</div>
          </div>
          {/* Tip */}
          {info.tip && (
            <div style={{ padding: '8px 10px', background: 'rgba(245,200,66,0.06)', borderRadius: 8, borderLeft: '2px solid #F5C842' }}>
              <div style={{ fontSize: 10, color: '#F5C842', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 2 }}>💡 TIP</div>
              <div style={{ fontSize: 12, color: '#bba030', lineHeight: 1.5 }}>{info.tip}</div>
            </div>
          )}
          {/* Target muscles */}
          {info.targetMuscles && (
            <div style={{ marginTop: 8, fontSize: 11, color: '#555' }}>🎯 {info.targetMuscles}</div>
          )}
        </div>
      )}
    </div>
  );
}

function DayCard({ day, isExpanded, onToggle, workoutData }: {
  day: WorkoutDay;
  isExpanded: boolean;
  onToggle: () => void;
  workoutData: WorkoutDataHook;
}) {
  const color = TYPE_COLORS[day.type] || '#666';
  const isRest = day.type === 'rest';

  return (
    <div style={{ marginBottom: 8 }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          background: isExpanded ? 'rgba(245,200,66,0.06)' : 'rgba(255,255,255,0.02)',
          border: isExpanded ? '1px solid rgba(245,200,66,0.2)' : '1px solid #1c1c1c',
          borderRadius: isExpanded ? '12px 12px 0 0' : 12,
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.15s ease',
        }}
      >
        <div style={{ width: 3, height: 36, background: color, borderRadius: 2, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e0e0e0' }}>{day.label}</div>
          <div style={{ fontSize: 11, color: color, marginTop: 1 }}>{TYPE_LABELS[day.type] || day.type.toUpperCase()}</div>
        </div>
        {!isRest && (
          <div style={{ fontSize: 11, color: '#555' }}>{day.exercises.length} cviků</div>
        )}
        <div style={{ color: '#555', fontSize: 14, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▼</div>
      </button>

      {isExpanded && !isRest && (
        <div style={{
          background: 'rgba(245,200,66,0.03)',
          border: '1px solid rgba(245,200,66,0.15)',
          borderTop: 'none',
          borderRadius: '0 0 12px 12px',
          padding: '8px 14px 12px',
        }}>
          <div style={{ color: '#666', fontSize: 11, marginBottom: 10, paddingTop: 6 }}>{day.description}</div>
          {/* Warm-up reminder for strength days */}
          {(day.type === 'lower' || day.type === 'upper' || day.type === 'fullbody') && (
            <div style={{ marginBottom: 12, padding: '8px 10px', background: 'rgba(245,200,66,0.05)', borderRadius: 8, borderLeft: '2px solid rgba(245,200,66,0.4)' }}>
              <div style={{ fontSize: 9, color: '#F5C842', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 3 }}>WARM-UP · ~12 min</div>
              <div style={{ fontSize: 11, color: '#888', lineHeight: 1.5 }}>Rotoped → Dynamický strečink → Aktivace → Rozehřívací série (tyč → 40% → 60% → 75% → pracovní váha)</div>
            </div>
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
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid #1c1c1c',
          borderTop: 'none',
          borderRadius: '0 0 12px 12px',
          padding: '12px 14px',
          color: '#555',
          fontSize: 12,
        }}>
          Aktivní regenerace: procházka, strečink, sauna, masáž. Žádný silový trénink.
        </div>
      )}
    </div>
  );
}
