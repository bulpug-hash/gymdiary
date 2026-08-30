// Přehled — první obrazovka. Odpovídá na jednu otázku: co dnes a s jakou vahou.
// Kit 247: celoplošný hero s fotkou, pod ním hustá typografická data.
import {
  PHASE3_WEEKS, getTodayDayKey, getCurrentWeek,
  GOALS, CURRENT_MAXES, WARMUP_SERIES_BY_WEEK,
} from '@/lib/data';
import type { WarmupSet, Week } from '@/lib/data';
import type { WorkoutDataHook, Tab } from '@/lib/types';
import { Hero, Marquee, Reveal, SectionHead } from '@/components/kit';

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

type SetPlanRow = { label: string; weight: string; reps: string; rpe?: string };

// Hlavní série dne – to jediné číslo, kvůli kterému se dnes jde do posilovny
function heroSet(day: { exercises: { category?: string; setPlan?: SetPlanRow[] }[] } | null | undefined): SetPlanRow | null {
  if (!day) return null;
  for (const ex of day.exercises) {
    if (ex.category !== 'main' || !ex.setPlan || ex.setPlan.length === 0) continue;
    const hot = ex.setPlan.find(sp => /OVERLOAD|TOP|CÍL|PR/i.test(sp.label));
    const pick = hot || ex.setPlan.reduce((a, b) => (parseFloat(b.weight) > parseFloat(a.weight) ? b : a));
    return pick;
  }
  return null;
}

const dm = (iso: string) => iso.split('-').slice(1).reverse().join('.');

export default function Overview({ workoutData, onNavigate }: Props) {
  void workoutData;
  const todayKey = getTodayDayKey();
  const currentWeekNum = getCurrentWeek();
  const currentWeek: Week = PHASE3_WEEKS.find(w => w.number === currentWeekNum) || PHASE3_WEEKS[0];
  const todayDay = currentWeek.days.find(d => d.key === todayKey);
  const isTraining = !!todayDay && todayDay.type !== 'rest';
  const top = isTraining ? heroSet(todayDay) : null;

  // Skutečná 1RM maxima z dokumentů – VŽDY tato čísla, ne pracovní váhy z deníku
  const goals = [
    { name: 'Bench Press', short: 'BENCH', current: CURRENT_MAXES.bench, goal: GOALS.bench },
    { name: 'Back Squat', short: 'DŘEP', current: CURRENT_MAXES.squat, goal: GOALS.squat },
    { name: 'Mrtvý tah', short: 'TAH', current: CURRENT_MAXES.deadlift, goal: GOALS.deadlift },
  ];

  const heroTitle = isTraining && todayDay
    ? <>{todayDay.label.toUpperCase()}<br />{todayDay.description.split('–')[0].trim().toUpperCase()}</>
    : <>Dnes<br />volno</>;

  return (
    <div>
      <Hero
        plate="overview"
        size="lg"
        ghost={String(currentWeek.number).padStart(2, '0')}
        kicker="Tréninkový deník"
        title={heroTitle}
        stat={top ? { label: 'Top série', value: top.weight.replace('.', ','), unit: 'kg' } : undefined}
        meta={
          <>
            <b>T{String(currentWeek.number).padStart(2, '0')}</b>
            <span>·</span>
            <span>{currentWeek.label}</span>
            <span>·</span>
            <span>{dm(currentWeek.dateFrom)} – {dm(currentWeek.dateTo)}</span>
            {top && (<><span>·</span><span>× {top.reps} {top.label}{top.rpe ? ` · RPE ${top.rpe}` : ''}</span></>)}
            {!isTraining && (<><span>·</span><span>Regenerace, strečink, sauna</span></>)}
          </>
        }
      />

      <Marquee
        items={['Podzim ’26', 'Peaking 13 týdnů', 'Bench 130', 'Dřep 190', 'Mrtvý tah 230', 'Vlnové zatížení']}
      />

      <div className="gd-body">
        {/* Týdenní rozvrh */}
        <Reveal>
          <SectionHead n="01" label="Týdenní rozvrh" right="Po — Ne" />
          <div style={{ display: 'flex', gap: 4, padding: '0 20px 20px' }}>
            {DAY_KEYS.map((key, i) => {
              const day = currentWeek.days.find(d => d.key === key);
              const isToday = key === todayKey;
              const isRest = day?.type === 'rest';
              return (
                <div key={key} style={{
                  flex: 1, textAlign: 'center', padding: '10px 0 9px',
                  background: isToday ? 'var(--gd-accent)' : 'transparent',
                  border: isToday ? '1px solid var(--gd-accent)' : '1px solid var(--gd-line)',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.04em', color: isToday ? 'var(--gd-accent-ink)' : 'var(--gd-text-2)' }}>{DAY_SHORT[i]}</div>
                  <div style={{
                    fontSize: 8, marginTop: 3, fontWeight: 700, letterSpacing: '0.1em',
                    color: isToday ? 'color-mix(in srgb, var(--gd-accent-ink) 65%, transparent)' : 'var(--gd-text-4)',
                  }}>
                    {isRest ? '–' : (day ? TYPE_LABEL[day.type] || '?' : '?')}
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>

        <div className="gd-cols gd-cols--2">
          {/* Dnešní trénink */}
          <Reveal>
            <SectionHead
              n="02"
              label={isTraining ? 'Dnešní trénink' : 'Dnešní den'}
              right={isTraining && todayDay ? `${todayDay.exercises.length} ${plural(todayDay.exercises.length, 'cvik', 'cviky', 'cviků')}` : 'Volno'}
            />
            {isTraining && todayDay ? (
              <div style={{ padding: '0 20px 20px' }}>
                {todayDay.exercises.map((ex, i) => (
                  <div key={ex.id} style={{
                    display: 'flex', alignItems: 'baseline', gap: 12,
                    padding: '10px 0',
                    borderTop: i === 0 ? 'none' : '1px solid var(--gd-line)',
                  }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--gd-text-4)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span style={{ flex: 1, fontSize: 14, color: 'var(--gd-text)', minWidth: 0 }}>
                      {ex.nameShort || ex.name}
                    </span>
                    {ex.setPlan && ex.setPlan.length > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gd-text-3)', letterSpacing: '0.06em', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                        {ex.setPlan.length}× {ex.setPlan[0].reps}
                      </span>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => onNavigate('plan')}
                  style={{
                    marginTop: 16, width: '100%', padding: '13px 16px',
                    background: 'var(--gd-accent)', color: 'var(--gd-accent-ink)',
                    border: 'none', borderRadius: 0, cursor: 'pointer',
                    fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <span>Otevřít rozpis sérií</span><span>→</span>
                </button>
              </div>
            ) : (
              <div style={{ padding: '0 20px 20px' }}>
                <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--gd-text-3)', margin: 0 }}>
                  Dnes se netrénuje. Aktivní regenerace, strečink, případně lehký Z2 běh.
                  Zítřejší jednotku najdeš v Plánu.
                </p>
                <button
                  onClick={() => onNavigate('plan')}
                  style={{
                    marginTop: 16, width: '100%', padding: '13px 16px',
                    background: 'transparent', color: 'var(--gd-text)',
                    border: '1px solid var(--gd-line)', borderRadius: 0, cursor: 'pointer',
                    fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <span>Zobrazit plán týdne</span><span>→</span>
                </button>
              </div>
            )}
          </Reveal>

          {/* Maxima */}
          <Reveal delay={60}>
            <SectionHead n="03" label="Maxima → cíl" right="1RM" />
            <div style={{ padding: '0 20px 20px' }}>
              {goals.map(({ name, short, current, goal }) => {
                const pct = Math.min(100, Math.round((current / goal) * 100));
                const done = current >= goal;
                return (
                  <div key={name} style={{ padding: '12px 0', borderTop: '1px solid var(--gd-line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                      <span className="gd-tag" style={{ color: 'var(--gd-text-3)' }}>{short}</span>
                      <span style={{ fontSize: 11, color: 'var(--gd-text-4)', letterSpacing: '0.05em' }}>{name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 6 }}>
                      <span className="gd-display" style={{ fontSize: 32, color: done ? 'var(--gd-fern)' : 'var(--gd-text)' }}>
                        {current}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--gd-text-3)', paddingBottom: 5 }}>KG</span>
                      <span style={{ flex: 1 }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gd-text-4)', paddingBottom: 5, fontVariantNumeric: 'tabular-nums' }}>
                        → {goal} kg · {pct} %
                      </span>
                    </div>
                    <div style={{ height: 2, background: 'var(--gd-line)', marginTop: 8 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: done ? 'var(--gd-fern)' : 'var(--gd-accent)', transition: 'width 0.9s cubic-bezier(0.22,0.61,0.36,1)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>

        {/* Rozehřívací série */}
        {todayDay && (todayDay.type === 'lower' || todayDay.type === 'upper' || todayDay.type === 'fullbody') && (() => {
          const weekData = WARMUP_SERIES_BY_WEEK[currentWeekNum];
          const liftKey = todayDay.type === 'lower' ? 'squat' : todayDay.type === 'upper' ? 'bench' : 'deadlift';
          const liftLabel = todayDay.type === 'lower' ? 'Squat' : todayDay.type === 'upper' ? 'Bench press' : 'Deadlift';
          const series = weekData?.[liftKey];
          if (!series || series.length === 0) return null;
          const formatW = (w: number) => (w === 20 ? 'Tyč' : `${w} kg`);
          const pct = (note?: string) => (note?.match(/(~?\d+%)/)?.[1] ?? '–');
          return (
            <Reveal>
              <SectionHead n="04" label="Rozehřátí" right={`${liftLabel} · Zatsiorsky`} />
              <div style={{ padding: '0 20px 24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 0 }}>
                  {['Série', 'Váha', 'Reps', '% 1RM'].map(h => (
                    <div key={h} className="gd-tag" style={{ padding: '0 0 7px', color: 'var(--gd-text-4)' }}>{h}</div>
                  ))}
                  {series.map((row: WarmupSet, i: number) => (
                    <div key={`row-${i}`} style={{ display: 'contents' }}>
                      <div style={{ fontSize: 12, color: 'var(--gd-text-3)', padding: '9px 0', borderTop: '1px solid var(--gd-line)', fontVariantNumeric: 'tabular-nums' }}>1×{row.reps}</div>
                      <div style={{ fontSize: 12, color: 'var(--gd-text)', fontWeight: 700, padding: '9px 0', borderTop: '1px solid var(--gd-line)' }}>{formatW(row.weight)}</div>
                      <div style={{ fontSize: 12, color: 'var(--gd-text-3)', padding: '9px 0', borderTop: '1px solid var(--gd-line)', fontVariantNumeric: 'tabular-nums' }}>{row.reps}</div>
                      <div style={{ fontSize: 12, color: 'var(--gd-fern)', fontWeight: 700, padding: '9px 0', borderTop: '1px solid var(--gd-line)' }}>{pct(row.note)}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: 'var(--gd-text-4)' }}>
                  Do deníku se zapisují jen pracovní série.
                </div>
              </div>
            </Reveal>
          );
        })()}

        {/* Fáze */}
        <Reveal>
          <SectionHead n="05" label="Aktuální fáze" right={currentWeek.phase} />
          <div style={{ padding: '0 20px 34px' }}>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--gd-text-2)', margin: '0 0 18px', maxWidth: '58ch' }}>
              {currentWeek.description}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid var(--gd-line)' }}>
              {[['W1–4', 'Akumulace'], ['W5–8', 'Síla'], ['W9–11', 'Intenzif.'], ['W12–13', 'Taper / Test']].map(([w, label], i) => {
                const on = currentWeek.number <= 4 ? i === 0 : currentWeek.number <= 8 ? i === 1 : currentWeek.number <= 11 ? i === 2 : i === 3;
                return (
                  <div key={w} style={{
                    padding: '12px 8px 14px',
                    borderRight: i < 3 ? '1px solid var(--gd-line)' : 'none',
                    borderTop: on ? '2px solid var(--gd-accent)' : '2px solid transparent',
                    marginTop: -1,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: on ? 'var(--gd-accent)' : 'var(--gd-text-3)', fontVariantNumeric: 'tabular-nums' }}>{w}</div>
                    <div style={{ fontSize: 10, color: 'var(--gd-text-4)', marginTop: 4, letterSpacing: '0.06em' }}>{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
