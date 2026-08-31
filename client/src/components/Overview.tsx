// Přehled — první obrazovka. Odpovídá na jednu otázku: co dnes a s jakou vahou.
// Kit 247: celoplošný hero s fotkou, pod ním hustá typografická data.
import { useState } from 'react';
import {
  PHASE3_WEEKS, getTodayDayKey, getTodayISO, getCurrentWeek,
  GOALS, WARMUP_SERIES_BY_WEEK,
} from '@/lib/data';
import type { WarmupSet, Week } from '@/lib/data';
import type { WorkoutDataHook, Tab } from '@/lib/types';
import { Hero, QuoteBar, Reveal, SectionHead, Watermark } from '@/components/kit';
import SetLogger from '@/components/SetLogger';
import { weekProgress, dateForDay, daySummary } from '@/lib/planLink';
import { getCurrentMaxes } from '@/lib/maxes';
import { plural } from '@/lib/czech';

interface Props {
  workoutData: WorkoutDataHook;
  onNavigate: (tab: Tab) => void;
}

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_SHORT = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

const TYPE_LABEL: Record<string, string> = {
  lower: 'LOWER', upper: 'UPPER', fullbody: 'FULL', hiit: 'HIIT', run: 'RUN', rest: 'VOL',
};

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
  const todayKey = getTodayDayKey();
  const todayISO = getTodayISO();
  const currentWeekNum = getCurrentWeek();

  // Odškrtnout jde i jiný den než dnešek. Když se trénink přesune nebo se
  // zapomene odškrtnout, musí se to dát dohnat – jinak ty série zůstanou
  // „předepsané“ navždy a týdenní procento lže.
  const [weekNum, setWeekNum] = useState(currentWeekNum);
  const [pickedDay, setPickedDay] = useState<string | null>(null);

  const currentWeek: Week = PHASE3_WEEKS.find(w => w.number === weekNum) || PHASE3_WEEKS[0];
  const isThisWeek = weekNum === currentWeekNum;
  const activeKey = pickedDay ?? (isThisWeek ? todayKey : 'monday');
  const activeDay = currentWeek.days.find(d => d.key === activeKey);
  const activeISO = dateForDay(currentWeek, activeKey);
  const isToday = isThisWeek && activeKey === todayKey && !pickedDay;
  const todayDay = currentWeek.days.find(d => d.key === todayKey);
  const isTraining = !!todayDay && todayDay.type !== 'rest';
  const activeTraining = !!activeDay && activeDay.type !== 'rest' && activeDay.exercises.length > 0;
  const top = isTraining ? heroSet(todayDay) : null;

  // Potvrzená 1RM maxima – z dokumentu, nebo vyšší, které si uživatel
  // potvrdil v Progresu. Nikdy ne pracovní váha z deníku.
  const maxes = getCurrentMaxes();
  const goals = [
    { name: 'Bench Press', short: 'BENCH', current: maxes.bench, goal: GOALS.bench },
    { name: 'Back Squat', short: 'DŘEP', current: maxes.squat, goal: GOALS.squat },
    { name: 'Mrtvý tah', short: 'TAH', current: maxes.deadlift, goal: GOALS.deadlift },
  ];

  const heroTitle = isTraining && todayDay
    ? <>{todayDay.label.toUpperCase()}<br />{todayDay.description.split('–')[0].trim().toUpperCase()}</>
    : <>Dnes<br />volno</>;

  return (
    <div>
      <Hero
        plate="overview"
        size="lg"
        poster
        ghost={String(currentWeek.number).padStart(2, '0')}
        kicker="Tréninkový deník"
        title={heroTitle}
        lead={
          isTraining && todayDay
            ? <>{todayDay.description.split('–')[0].trim()} · {todayDay.exercises.length} {plural(todayDay.exercises.length, 'cvik', 'cviky', 'cviků')}</>
            : <>Aktivní regenerace · strečink · sauna</>
        }
        specs={[
          ...(top ? [{ label: 'Top série', value: `${top.weight.replace('.', ',')} kg × ${top.reps}` }] : []),
          { label: 'Týden', value: `${String(currentWeek.number).padStart(2, '0')} / 13` },
          { label: 'Blok', value: currentWeek.label },
          { label: 'Termín', value: `${dm(currentWeek.dateFrom)} — ${dm(currentWeek.dateTo)}` },
        ]}
      />

      <QuoteBar />


      <div className="gd-body">
        {/* Týdenní rozvrh */}
        <Reveal>
          <SectionHead
            n="01"
            label="Týdenní rozvrh"
            right={`T${String(currentWeek.number).padStart(2, '0')} · ${dm(currentWeek.dateFrom)} — ${dm(currentWeek.dateTo)}`}
          />
          <div style={{ display: 'flex', gap: 4, padding: '0 20px 10px' }}>
            {DAY_KEYS.map((key, i) => {
              const day = currentWeek.days.find(d => d.key === key);
              const sel = key === activeKey;
              const isTodayCell = isThisWeek && key === todayKey;
              const isRest = day?.type === 'rest';
              return (
                <button
                  key={key}
                  onClick={() => setPickedDay(key)}
                  aria-pressed={sel}
                  style={{
                    flex: 1, textAlign: 'center', padding: '10px 0 9px', cursor: 'pointer',
                    background: sel ? 'var(--gd-accent)' : 'transparent',
                    border: sel
                      ? '1px solid var(--gd-accent)'
                      : isTodayCell ? '1px solid var(--gd-text-3)' : '1px solid var(--gd-line)',
                    borderRadius: 0,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.04em', color: sel ? 'var(--gd-accent-ink)' : 'var(--gd-text-2)' }}>{DAY_SHORT[i]}</div>
                  <div style={{
                    fontSize: 8, marginTop: 3, fontWeight: 700, letterSpacing: '0.1em',
                    color: sel ? 'color-mix(in srgb, var(--gd-accent-ink) 65%, transparent)' : 'var(--gd-text-4)',
                  }}>
                    {isRest ? '–' : (day ? TYPE_LABEL[day.type] || '?' : '?')}
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 8, padding: '0 20px 20px' }}>
            <button
              onClick={() => { setWeekNum(w => Math.max(1, w - 1)); setPickedDay(null); }}
              disabled={weekNum <= 1}
              style={{
                flex: 1, padding: '11px', background: 'transparent',
                border: '1px solid var(--gd-line)', borderRadius: 0,
                color: weekNum <= 1 ? 'var(--gd-text-4)' : 'var(--gd-text-3)',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase',
                cursor: weekNum <= 1 ? 'default' : 'pointer',
              }}
            >← Předchozí týden</button>
            {(!isThisWeek || pickedDay) && (
              <button
                onClick={() => { setWeekNum(currentWeekNum); setPickedDay(null); }}
                style={{
                  flex: 1, padding: '11px', background: 'var(--gd-accent)',
                  border: 'none', borderRadius: 0, color: 'var(--gd-accent-ink)',
                  fontSize: 9, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >Zpět na dnešek</button>
            )}
          </div>
        </Reveal>

        {/* Splnění týdne */}
        {(() => {
          const wp = weekProgress(currentWeek, workoutData.records);
          if (wp.celkem === 0) return null;
          const pct = Math.round((wp.hotovo / wp.celkem) * 100);
          return (
            <Reveal>
              <SectionHead
                n="02"
                label="Splnění týdne"
                right={`${wp.hotovo} / ${wp.celkem} ${plural(wp.celkem, 'série', 'série', 'sérií')}`}
              />
              <div className="gd-wmhost" style={{ padding: '0 20px 22px' }}>
                <Watermark name="warrior" position="102% 40%" size="auto 165%" opacity={0.08} />
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 12 }}>
                  <span className="gd-display" style={{ fontSize: 34, color: pct === 100 ? 'var(--gd-fern)' : 'var(--gd-text)' }}>
                    {pct}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: 'var(--gd-text-3)', paddingBottom: 6 }}>%</span>
                </div>
                {wp.dny.map(d => (
                  <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: '1px solid var(--gd-line)' }}>
                    <span className="gd-tag" style={{ width: 62, flexShrink: 0 }}>{d.label}</span>
                    <span style={{ flex: 1, display: 'flex', gap: 3, minWidth: 0 }}>
                      {Array.from({ length: d.celkem }).map((_, i) => (
                        <span key={i} style={{
                          flex: 1, height: 8, minWidth: 3,
                          background: i < d.hotovo ? 'var(--gd-accent)' : 'var(--gd-line)',
                        }} />
                      ))}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gd-text-4)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                      {d.hotovo}/{d.celkem}
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>
          );
        })()}

        <div className="gd-cols gd-cols--2">
          {/* Dnešní trénink */}
          <Reveal>
            <SectionHead
              n="03"
              label={activeTraining ? (isToday ? 'Dnešní trénink' : `${activeDay!.label} · T${currentWeek.number}`) : 'Volno'}
              right={activeTraining && activeDay ? `${activeDay.exercises.length} ${plural(activeDay.exercises.length, 'cvik', 'cviky', 'cviků')}` : dm(activeISO)}
            />
            {!isToday && (
              <div style={{ margin: '0 20px 12px', padding: '10px 12px', border: '1px solid var(--gd-line)', fontSize: 11, lineHeight: 1.5, color: 'var(--gd-text-3)' }}>
                Zapisuješ do <b style={{ color: 'var(--gd-text)' }}>{activeDay?.label ?? '—'} {dm(activeISO)}</b>, ne do dneška.
              </div>
            )}
            {activeTraining && activeDay ? (
              <div style={{ padding: '0 20px 20px' }}>
                {activeDay.exercises.map((ex, i) => (
                  <div key={ex.id} style={{ marginBottom: 18 }}>
                    <div style={{
                      display: 'flex', alignItems: 'baseline', gap: 10,
                      paddingTop: i === 0 ? 0 : 6,
                    }}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--gd-text-4)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span style={{ flex: 1, fontSize: 14, color: 'var(--gd-text)', minWidth: 0 }}>
                        {ex.nameShort || ex.name}
                      </span>
                    </div>
                    <SetLogger
                      exercise={ex}
                      week={currentWeek.number}
                      dayKey={activeKey}
                      date={activeISO}
                      workoutData={workoutData}
                    />
                  </div>
                ))}
                {/* Souhrn dne – ukáže se, jakmile je něco odškrtnuté. */}
                {(() => {
                  const sum = daySummary(currentWeek, activeKey, workoutData.records);
                  if (sum.hotovo === 0) return null;
                  const prevWeek = PHASE3_WEEKS.find(w => w.number === currentWeek.number - 1);
                  const prev = prevWeek ? daySummary(prevWeek, activeKey, workoutData.records) : null;
                  const diff = prev && prev.tonaz > 0 ? sum.tonaz - prev.tonaz : null;
                  const complete = sum.hotovo === sum.celkem;
                  return (
                    <div style={{
                      marginTop: 18, padding: '14px 16px',
                      border: `1px solid ${complete ? 'var(--gd-accent)' : 'var(--gd-line)'}`,
                      background: complete ? 'color-mix(in srgb, var(--gd-accent) 8%, transparent)' : 'transparent',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
                        <span className="gd-tag" style={{ flex: 1, color: complete ? 'var(--gd-accent)' : 'var(--gd-text-3)' }}>
                          {complete ? 'Trénink hotov' : 'Rozpracováno'}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gd-text-4)', fontVariantNumeric: 'tabular-nums' }}>
                          {sum.hotovo}/{sum.celkem} {plural(sum.celkem, 'série', 'série', 'sérií')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                        <span className="gd-display" style={{ fontSize: 30, color: 'var(--gd-text)' }}>
                          {sum.tonaz.toLocaleString('cs-CZ')}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', color: 'var(--gd-text-3)', paddingBottom: 5 }}>KG TONÁŽ</span>
                      </div>
                      {diff !== null && (
                        <div style={{ fontSize: 11, marginTop: 6, color: diff >= 0 ? 'var(--gd-fern)' : 'var(--gd-danger)', fontWeight: 700 }}>
                          {diff >= 0 ? '+' : ''}{diff.toLocaleString('cs-CZ')} kg proti T{prevWeek!.number}
                        </div>
                      )}
                      {sum.top && (
                        <div style={{ fontSize: 11, marginTop: 8, color: 'var(--gd-text-3)', lineHeight: 1.5 }}>
                          Top série: <b style={{ color: 'var(--gd-text)' }}>{sum.top.weight.replace('.', ',')} × {sum.top.reps}</b> · {sum.top.exercise}
                        </div>
                      )}
                    </div>
                  );
                })()}

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
            <SectionHead n="04" label="Maxima → cíl" right="1RM" />
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
              <SectionHead n="05" label="Rozehřátí" right={`${liftLabel} · Zatsiorsky`} />
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
          <SectionHead n="06" label="Aktuální fáze" right={currentWeek.phase} />
          <div style={{ padding: '0 20px 34px' }}>
            <p className="gd-serif" style={{ fontSize: 16, lineHeight: 1.65, color: 'var(--gd-text-2)', margin: '0 0 18px', maxWidth: '58ch' }}>
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
