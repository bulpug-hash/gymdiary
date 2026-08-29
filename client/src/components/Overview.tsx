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

// Česká plurálová shoda: 1 cvik / 2–4 cviky / 5+ cviků
function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}

// Hlavní série dne – to jediné číslo, kvůli kterému se dnes jde do posilovny
function heroSet(day: { exercises: { category?: string; setPlan?: { label: string; weight: string; reps: string; rpe?: string }[] }[] } | null | undefined) {
  if (!day) return null;
  for (const ex of day.exercises) {
    if (ex.category !== 'main' || !ex.setPlan || ex.setPlan.length === 0) continue;
    const hot = ex.setPlan.find(sp => /OVERLOAD|TOP|CÍL|PR/i.test(sp.label));
    const pick = hot || ex.setPlan.reduce((a, b) => (parseFloat(b.weight) > parseFloat(a.weight) ? b : a));
    return pick;
  }
  return null;
}

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
      <div style={{ padding: '20px 20px 0', borderBottom: '1px solid var(--gd-line)', paddingBottom: 16 }}>
        {/* Lockup ve stylu 247: kód sezóny, verze, číslo týdne */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <span style={{
            background: 'var(--gd-text)', color: 'var(--gd-ink)',
            fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
            padding: '3px 7px', lineHeight: 1.1,
          }}>247</span>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--gd-text-3)' }}>
            Podzim ’26
          </span>
          <span style={{ flex: 1, height: 1, background: 'var(--gd-line)' }} />
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--gd-text-3)' }}>
            v5.2
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
          <h1 style={{
            fontFamily: 'Archivo, sans-serif', fontStretch: '118%',
            fontSize: 40, fontWeight: 800, letterSpacing: '-0.045em',
            lineHeight: 0.9, margin: 0, color: 'var(--gd-text)', textTransform: 'uppercase',
          }}>
            Tréninkový<br />deník
          </h1>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gd-text-4)', marginBottom: 4 }}>Týden</div>
            <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 40, fontWeight: 800, color: 'var(--gd-accent)', lineHeight: 0.85, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>
              {String(currentWeek.number).padStart(2, '0')}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gd-text-3)' }}>
          <span>{currentWeek.label}</span>
          <span style={{ color: 'var(--gd-text-4)' }}>/</span>
          <span>{currentWeek.dateFrom.split('-').slice(1).reverse().join('.')} – {currentWeek.dateTo.split('-').slice(1).reverse().join('.')}</span>
        </div>
      </div>

      {/* Week strip */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--gd-line)' }}>
        <div style={{ color: 'var(--gd-text-4)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>TÝDENNÍ ROZVRH</div>
        <div style={{ display: 'flex', gap: 5 }}>
          {DAY_KEYS.map((key, i) => {
            const day = currentWeek.days.find(d => d.key === key);
            const isToday = key === todayKey;
            const isRest = day?.type === 'rest';
            return (
              <div key={key} style={{
                flex: 1, textAlign: 'center', padding: '8px 0',
                borderRadius: 0,
                background: isToday ? 'var(--gd-accent)' : 'color-mix(in srgb, var(--gd-text) 3%, transparent)',
                border: isToday ? 'none' : '1px solid var(--gd-line)',
                transition: 'all 0.15s ease',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: isToday ? 'var(--gd-ink)' : 'var(--gd-text-3)' }}>{DAY_SHORT[i]}</div>
                <div style={{ fontSize: 8, color: isToday ? 'color-mix(in srgb, var(--gd-shadow) 70%, transparent)' : 'var(--gd-text-4)', marginTop: 2, fontWeight: isToday ? 700 : 400 }}>
                  {isRest ? '–' : (day ? TYPE_LABEL[day.type] || '?' : '?')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's workout card */}
      <div style={{ padding: '0 0 12px', borderBottom: '1px solid var(--gd-line)' }}>
        {todayDay && todayDay.type !== 'rest' ? (
          <div onClick={() => onNavigate('plan')} style={{ cursor: 'pointer' }}>
            <div style={{ background: 'var(--gd-accent)', color: 'var(--gd-accent-ink)', padding: '16px 20px 18px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', opacity: 0.6 }}>
                Dnes trénuješ
              </div>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, marginTop: 8 }}>
                {todayDay.label.toUpperCase()} – {todayDay.description.split('–')[0].trim().toUpperCase()}
              </div>
              {(() => {
                const hero = heroSet(todayDay);
                if (!hero) return null;
                return (
                  <div style={{ marginTop: 18, display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                    <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 76, fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 0.82, fontVariantNumeric: 'tabular-nums' }}>
                      {hero.weight.replace('.', ',')}
                    </div>
                    <div style={{ paddingBottom: 8, fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>kg</div>
                  </div>
                );
              })()}
              {(() => {
                const hero = heroSet(todayDay);
                if (!hero) return null;
                return (
                  <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.72 }}>
                    × {hero.reps} · {hero.label}{hero.rpe ? ` · RPE ${hero.rpe}` : ''}
                  </div>
                );
              })()}
            </div>
            <div style={{ padding: '12px 20px 2px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'baseline' }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gd-text-3)' }}>
                {todayDay.exercises.length} {plural(todayDay.exercises.length, 'cvik', 'cviky', 'cviků')}
              </span>
              {todayDay.exercises.slice(0, 3).map(ex => (
                <span key={ex.id} style={{ fontSize: 11, color: 'var(--gd-text-2)' }}>
                  · {ex.nameShort || ex.name}
                </span>
              ))}
              {todayDay.exercises.length > 3 && (
                <span style={{ fontSize: 11, color: 'var(--gd-text-4)' }}>+{todayDay.exercises.length - 3}</span>
              )}
            </div>
          </div>
        ) : (
          <div style={{ padding: '22px 20px', borderTop: '1px solid var(--gd-line)', borderBottom: '1px solid var(--gd-line)' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gd-text-4)' }}>Dnes</div>
            <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--gd-text-2)', marginTop: 6 }}>
              VOLNO
            </div>
            <div style={{ color: 'var(--gd-text-4)', fontSize: 12, marginTop: 6 }}>Aktivní regenerace, strečink, sauna</div>
          </div>
        )}
      </div>

      {/* Today's warm-up series */}
      {todayDay && (todayDay.type === 'lower' || todayDay.type === 'upper' || todayDay.type === 'fullbody') && (() => {
        const weekData = WARMUP_SERIES_BY_WEEK[currentWeekNum];
        const liftKey = todayDay.type === 'lower' ? 'squat' : todayDay.type === 'upper' ? 'bench' : 'deadlift';
        const liftLabel = todayDay.type === 'lower' ? 'SQUAT' : todayDay.type === 'upper' ? 'BENCH PRESS' : 'DEADLIFT';
        const series = weekData?.[liftKey];
        if (!series || series.length === 0) return null;
        const formatW = (w: number) => w === 20 ? 'Tyč' : `${w} kg`;
        const extractPct = (note?: string) => { if (!note) return ''; const m = note.match(/(~?\d+%)/); return m ? m[1] : ''; };
        return (
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--gd-line)' }}>
            <div style={{ color: 'var(--gd-text-4)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>DNEŠNÍ ROZEHŘÍVACÍ SÉRIE</div>
            <div style={{ background: 'color-mix(in srgb, var(--gd-fern) 4%, transparent)', border: '1px solid color-mix(in srgb, var(--gd-fern) 15%, transparent)', borderRadius: 0, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gd-fern)', letterSpacing: '0.1em', marginBottom: 8 }}>{liftLabel} – W{currentWeekNum} (Zatsiorsky)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '45px 80px 35px 45px', gap: '3px 8px' }}>
                <div style={{ fontSize: 8, color: 'var(--gd-text-4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>SÉRIE</div>
                <div style={{ fontSize: 8, color: 'var(--gd-text-4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>VÁHA</div>
                <div style={{ fontSize: 8, color: 'var(--gd-text-4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>REPS</div>
                <div style={{ fontSize: 8, color: 'var(--gd-accent)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>% 1RM</div>
                {series.map((row: WarmupSet, i: number) => (
                  <>
                    <div key={`s${i}`} style={{ fontSize: 11, color: 'var(--gd-text-2)', padding: '2px 0', borderTop: '1px solid color-mix(in srgb, var(--gd-text) 4%, transparent)' }}>1×{row.reps}</div>
                    <div key={`w${i}`} style={{ fontSize: 11, color: 'var(--gd-text)', fontWeight: 600, padding: '2px 0', borderTop: '1px solid color-mix(in srgb, var(--gd-text) 4%, transparent)' }}>{formatW(row.weight)}</div>
                    <div key={`r${i}`} style={{ fontSize: 11, color: 'var(--gd-fern)', padding: '2px 0', borderTop: '1px solid color-mix(in srgb, var(--gd-text) 4%, transparent)' }}>{row.reps}</div>
                    <div key={`p${i}`} style={{ fontSize: 11, color: 'var(--gd-accent)', fontWeight: 600, padding: '2px 0', borderTop: '1px solid color-mix(in srgb, var(--gd-text) 4%, transparent)' }}>{extractPct(row.note) || '–'}</div>
                  </>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 10, color: 'var(--gd-text-4)' }}>Zapisují se jen pracovní série · Více v záložce Plán</div>
            </div>
          </div>
        );
      })()}

      {/* Goals progress */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--gd-line)' }}>
        <div style={{ color: 'var(--gd-text-4)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>AKTUÁLNÍ MAXIMA → CÍL FÁZE 3</div>
        {goals.map(({ name, current, goal, note }) => {
          const pct = Math.min(100, Math.round((current / goal) * 100));
          return (
            <div key={name} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 13, color: 'var(--gd-text-2)' }}>{name}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontWeight: 700 }}>
                    <span style={{ color: 'var(--gd-accent)' }}>{current} kg</span>
                    <span style={{ color: 'var(--gd-line)' }}> → {goal} kg</span>
                  </div>
                  {note && <div style={{ fontSize: 10, color: 'var(--gd-text-4)', marginTop: 1 }}>{note}</div>}
                </div>
              </div>
              <div style={{ height: 3, background: 'var(--gd-line)', borderRadius: 0, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: pct >= 95 ? 'var(--gd-fern)' : 'linear-gradient(90deg, var(--gd-accent), var(--gd-accent))',
                  borderRadius: 0,
                  transition: 'width 0.8s ease',
                }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--gd-text-4)', marginTop: 3, textAlign: 'right' }}>{pct}% cíle</div>
            </div>
          );
        })}
      </div>

      {/* Phase description */}
      <div style={{ padding: '14px 20px' }}>
          <div style={{ color: 'var(--gd-text-4)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>AKTUÁLNÍ FÁZE</div>
        <div style={{ background: 'var(--gd-surface)', border: '1px solid var(--gd-line)', borderRadius: 0, padding: '14px 16px' }}>
          <div style={{ color: 'var(--gd-accent)', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{currentWeek.phase}</div>
          <div style={{ color: 'var(--gd-text-3)', fontSize: 12, lineHeight: 1.6 }}>
            {currentWeek.description}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            {[['W1–4', 'Akumulace'], ['W5–8', 'Síla'], ['W9–11', 'Intenzif.'], ['W12–13', 'Taper/Test']].map(([weeks, label]) => (
              <div key={weeks} style={{ flex: 1, background: 'color-mix(in srgb, var(--gd-accent) 6%, transparent)', borderRadius: 0, padding: '6px 4px', textAlign: 'center', border: '1px solid color-mix(in srgb, var(--gd-accent) 12%, transparent)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gd-accent)' }}>{weeks}</div>
                <div style={{ fontSize: 10, color: 'var(--gd-text-3)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
