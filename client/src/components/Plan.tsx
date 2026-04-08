// Plan – Plán tab
// Gold Performance Design
// Shows: 16-week progressive plan v2.0, exercise details per day with dropset badges
import { useState } from 'react';
import { PHASE3_WEEKS, getCategoryColor, getCategoryLabel } from '@/lib/data';
import type { WorkoutDataHook } from '@/lib/types';
import type { WorkoutDay } from '@/lib/data';

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
          {day.exercises.map((ex, idx) => {
            const latest = workoutData.getLatestRecord(ex.id);
            return (
              <div key={ex.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 0',
                borderBottom: idx < day.exercises.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: getCategoryColor(ex.category), flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontSize: 13, color: '#d0d0d0', fontWeight: 500 }}>{ex.name}</div>
                    {ex.isDropset && (
                      <span style={{
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: '#F5C842',
                        background: 'rgba(245,200,66,0.15)',
                        border: '1px solid rgba(245,200,66,0.3)',
                        borderRadius: 4,
                        padding: '1px 5px',
                        textTransform: 'uppercase',
                      }}>DROP</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 1 }}>
                    {ex.targetSets}×{ex.targetReps}
                    {ex.targetWeight ? ` · ${ex.targetWeight}` : ''}
                    {ex.note ? ` · ${ex.note}` : ''}
                  </div>
                </div>
                {latest && (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, color: '#F5C842' }}>
                      {latest.weight !== '0' ? `${latest.weight} kg` : '–'}
                    </div>
                    <div style={{ fontSize: 10, color: '#444' }}>poslední</div>
                  </div>
                )}
              </div>
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
