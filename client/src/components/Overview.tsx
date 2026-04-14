// Overview – Přehled tab
// Gold Performance Design
// Shows: today's workout, week strip, goals progress, recent PRs
import { PHASE3_WEEKS, getTodayDayKey, getCurrentWeek, getCategoryColor, GOALS, CURRENT_MAXES, WARMUP_SERIES_BY_WEEK } from '@/lib/data';
import type { WarmupSet } from '@/lib/data';
import type { Week } from '@/lib/data';
import type { WorkoutDataHook, Tab } from '@/lib/types';

interface Props {
  workoutData: WorkoutDataHook;
  onNavigate: (tab: Tab) => void;
}

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_SHORT = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

const TYPE_LABEL: Record<string, string> = {
  lower: 'LOWER', upper: 'UPPER', fullbody: 'FULL', hiit: 'HIIT', run: 'RUN', rest: 'VOL',
};

export default function Overview({ workoutData, onNavigate }: Props) {
  const todayKey = getTodayDayKey();
  const currentWeekNum = getCurrentWeek();
  const currentWeek: Week = PHASE3_WEEKS.find(w => w.number === currentWeekNum) || PHASE3_WEEKS[0];
  const todayDay = currentWeek.days.find(d => d.key === todayKey);

  // Skutečná 1RM maxima z dokumentů – VŽDY zobrazujeme tato čísla, ne pracovní váhy z deníku
  const goals = [
    { name: 'Bench Press', current: CURRENT_MAXES.bench, goal: GOALS.bench, note: '1RM testováno' },
    { name: 'Back Squat', current: CURRENT_MAXES.squat, goal: GOALS.squat, note: '1RM testováno' },
    { name: 'Mrtvý tah', current: CURRENT_MAXES.deadlift, goal: GOALS.deadlift, note: '1RM testováno' },
  ];

  return (
    <div style={{ padding: '0 0 16px' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0', borderBottom: '1px solid #1c1c1c', paddingBottom: 16 }}>
        <div style={{ color: '#F5C842', fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
          TRÉNINKOVÝ DENÍK · 16T. PLÁN 2026
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{
              fontFamily: 'Barlow Condensed, Inter, sans-serif',
              fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em',
              lineHeight: 1.1, margin: 0, color: '#f0f0f0',
            }}>
              Vědecky podložený<br />plán 2026 v2.0
            </h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#555', marginBottom: 2 }}>Týden</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 28, fontWeight: 800, color: '#F5C842', lineHeight: 1 }}>
              {currentWeek.number}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#F5C842' }} />
          <span style={{ color: '#666', fontSize: 12 }}>
            {currentWeek.label} · {currentWeek.dateFrom.split('-').slice(1).reverse().join('.')} – {currentWeek.dateTo.split('-').slice(1).reverse().join('.')}
          </span>
        </div>
      </div>

      {/* Week strip */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #1c1c1c' }}>
        <div style={{ color: '#444', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>TÝDENNÍ ROZVRH</div>
        <div style={{ display: 'flex', gap: 5 }}>
          {DAY_KEYS.map((key, i) => {
            const day = currentWeek.days.find(d => d.key === key);
            const isToday = key === todayKey;
            const isRest = day?.type === 'rest';
            return (
              <div key={key} style={{
                flex: 1, textAlign: 'center', padding: '8px 0',
                borderRadius: 10,
                background: isToday ? '#F5C842' : 'rgba(255,255,255,0.03)',
                border: isToday ? 'none' : '1px solid #1c1c1c',
                transition: 'all 0.15s ease',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: isToday ? '#0c0c0c' : '#666' }}>{DAY_SHORT[i]}</div>
                <div style={{ fontSize: 8, color: isToday ? 'rgba(0,0,0,0.7)' : '#444', marginTop: 2, fontWeight: isToday ? 700 : 400 }}>
                  {isRest ? '–' : (day ? TYPE_LABEL[day.type] || '?' : '?')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's workout card */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #1c1c1c' }}>
        {todayDay && todayDay.type !== 'rest' ? (
          <div
            style={{
              background: 'rgba(245,200,66,0.06)',
              border: '1px solid rgba(245,200,66,0.2)',
              borderLeft: '3px solid #F5C842',
              borderRadius: 14,
              padding: '14px 16px',
              cursor: 'pointer',
            }}
            onClick={() => onNavigate('plan')}
          >
            <div style={{ color: '#F5C842', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>DNES TRÉNUJEŠ</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: '#f0f0f0' }}>
              {todayDay.label.toUpperCase()} – {todayDay.description.split('–')[0].trim().toUpperCase()}
            </div>
            <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
              {todayDay.exercises.length > 0 ? `${todayDay.exercises.length} cviků` : ''} · {todayDay.description.split('.')[0]}
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {todayDay.exercises.slice(0, 3).map(ex => (
                <span key={ex.id} style={{
                  fontSize: 11, padding: '3px 8px', borderRadius: 6,
                  background: 'rgba(245,200,66,0.1)',
                  color: getCategoryColor(ex.category),
                  border: `1px solid ${getCategoryColor(ex.category)}25`,
                }}>
                  {ex.nameShort || ex.name}
                </span>
              ))}
              {todayDay.exercises.length > 3 && (
                <span style={{ fontSize: 11, color: '#555', padding: '3px 0' }}>+{todayDay.exercises.length - 3} dalších</span>
              )}
            </div>
          </div>
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid #1c1c1c',
            borderRadius: 14,
            padding: '14px 16px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>🌙</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 700, color: '#888' }}>
              Dnes je volno
            </div>
            <div style={{ color: '#555', fontSize: 12, marginTop: 4 }}>Aktivní regenerace, strečink, sauna</div>
          </div>
        )}
      </div>

      {/* Today's warm-up series */}
      {todayDay && (todayDay.type === 'lower' || todayDay.type === 'upper' || todayDay.type === 'fullbody') && (() => {
        const weekData = WARMUP_SERIES_BY_WEEK[currentWeekNum];
        const liftKey = todayDay.type === 'lower' ? 'squat' : todayDay.type === 'upper' ? 'bench' : 'deadlift';
        const liftLabel = todayDay.type === 'lower' ? '🦵 SQUAT' : todayDay.type === 'upper' ? '💪 BENCH PRESS' : '🏋️ DEADLIFT';
        const series = weekData?.[liftKey];
        if (!series || series.length === 0) return null;
        const formatW = (w: number) => w === 20 ? 'Tyč' : `${w} kg`;
        const extractPct = (note?: string) => { if (!note) return ''; const m = note.match(/(~?\d+%)/); return m ? m[1] : ''; };
        return (
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #1c1c1c' }}>
            <div style={{ color: '#444', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>DNEŠNÍ ROZEHŘÍVACÍ SÉRIE</div>
            <div style={{ background: 'rgba(94,207,177,0.04)', border: '1px solid rgba(94,207,177,0.15)', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#5ECFB1', letterSpacing: '0.1em', marginBottom: 8 }}>{liftLabel} – W{currentWeekNum} (Zatsiorsky)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '45px 80px 35px 45px', gap: '3px 8px' }}>
                <div style={{ fontSize: 8, color: '#444', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>SÉRIE</div>
                <div style={{ fontSize: 8, color: '#444', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>VÁHA</div>
                <div style={{ fontSize: 8, color: '#444', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>REPS</div>
                <div style={{ fontSize: 8, color: '#f0a500', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>% 1RM</div>
                {series.map((row: WarmupSet, i: number) => (
                  <>
                    <div key={`s${i}`} style={{ fontSize: 11, color: '#aaa', padding: '2px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>1×{row.reps}</div>
                    <div key={`w${i}`} style={{ fontSize: 11, color: '#d0d0d0', fontWeight: 600, padding: '2px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>{formatW(row.weight)}</div>
                    <div key={`r${i}`} style={{ fontSize: 11, color: '#5ECFB1', padding: '2px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>{row.reps}</div>
                    <div key={`p${i}`} style={{ fontSize: 11, color: '#f0a500', fontWeight: 600, padding: '2px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>{extractPct(row.note) || '–'}</div>
                  </>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 10, color: '#444' }}>Zapisují se jen pracovní série · Více v záložce Plán</div>
            </div>
          </div>
        );
      })()}

      {/* Goals progress */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #1c1c1c' }}>
        <div style={{ color: '#444', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>AKTUÁLNÍ MAXIMA → CÍL FÁZE 3</div>
        {goals.map(({ name, current, goal, note }) => {
          const pct = Math.min(100, Math.round((current / goal) * 100));
          return (
            <div key={name} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 13, color: '#ccc' }}>{name}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                    <span style={{ color: '#F5C842' }}>{current} kg</span>
                    <span style={{ color: '#333' }}> → {goal} kg</span>
                  </div>
                  {note && <div style={{ fontSize: 10, color: '#555', marginTop: 1 }}>{note}</div>}
                </div>
              </div>
              <div style={{ height: 3, background: '#1c1c1c', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: pct >= 95 ? '#6EE7B7' : 'linear-gradient(90deg, #F5C842, #F59E0B)',
                  borderRadius: 2,
                  transition: 'width 0.8s ease',
                }} />
              </div>
              <div style={{ fontSize: 10, color: '#444', marginTop: 3, textAlign: 'right' }}>{pct}% cíle</div>
            </div>
          );
        })}
      </div>

      {/* Phase description */}
      <div style={{ padding: '14px 20px' }}>
          <div style={{ color: '#444', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>AKTUÁLNÍ FÁZE</div>
        <div style={{ background: '#111', border: '1px solid #1c1c1c', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ color: '#F5C842', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{currentWeek.phase}</div>
          <div style={{ color: '#888', fontSize: 12, lineHeight: 1.6 }}>
            {currentWeek.description}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            {[['W1–4', 'Akumulace'], ['W5–8', 'Síla'], ['W9–12', 'Intenzifikace'], ['W13–16', 'Peaking']].map(([weeks, label]) => (
              <div key={weeks} style={{ flex: 1, background: 'rgba(245,200,66,0.06)', borderRadius: 8, padding: '6px 4px', textAlign: 'center', border: '1px solid rgba(245,200,66,0.12)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#F5C842' }}>{weeks}</div>
                <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
