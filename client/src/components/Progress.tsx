// Progress – Progres tab
// Gold Performance Design
// Shows: progress charts for main lifts, estimated 1RM over time, body weight trend
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { estimate1RM, formatDate, GOALS, CURRENT_MAXES, PLAN_START_DATE } from '@/lib/data';
import type { WorkoutDataHook } from '@/lib/types';
import { tint } from '@/lib/tint';
import { Hero, Marquee, SectionHead } from '@/components/kit';

interface Props {
  workoutData: WorkoutDataHook;
}

type LiftKey = 'bench' | 'squat' | 'deadlift';

const LIFTS: { key: LiftKey; exerciseId: string; label: string; goal: number; color: string }[] = [
  { key: 'bench', exerciseId: 'bench', label: 'Bench Press', goal: GOALS.bench, color: 'var(--gd-accent)' },
  { key: 'squat', exerciseId: 'squat', label: 'Back Squat', goal: GOALS.squat, color: 'var(--gd-text)' },
  { key: 'deadlift', exerciseId: 'deadlift', label: 'Mrtvý tah', goal: GOALS.deadlift, color: 'var(--gd-fern)' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--gd-surface)', border: '1px solid var(--gd-line)', borderRadius: 0,
        padding: '8px 12px', fontSize: 12,
      }}>
        <div style={{ color: 'var(--gd-text-3)', marginBottom: 4 }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.dataKey} style={{ color: p.color, fontWeight: 700 }}>
            {p.value} kg
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Progress({ workoutData }: Props) {
  const [selectedLift, setSelectedLift] = useState<LiftKey>('bench');
  const lift = LIFTS.find(l => l.key === selectedLift)!;

  const records = workoutData.getRecords(lift.exerciseId).filter(r => !r.planned);
  const chartData = records.map(r => ({
    date: formatDate(r.date),
    weight: parseFloat(r.weight) || 0,
    est1RM: estimate1RM(parseFloat(r.weight) || 0, parseInt(r.reps) || 1),
    reps: r.reps,
    sets: r.sets,
    note: r.note,
  })).filter(d => d.weight > 0);

  const latest = chartData[chartData.length - 1];
  const first = chartData[0];
  const improvement = latest && first ? latest.est1RM - first.est1RM : 0;
  const pctToGoal = latest ? Math.min(100, Math.round((latest.est1RM / lift.goal) * 100)) : 0;

  // Stats for all 3 lifts – zobrazujeme reálnou váhu + odhadované 1RM
  // Real 1RM maxes always from CURRENT_MAXES (document values), not last diary entry
  const realMaxes: Record<string, number> = {
    bench: CURRENT_MAXES.bench,
    squat: CURRENT_MAXES.squat,
    deadlift: CURRENT_MAXES.deadlift,
  };
  const allStats = LIFTS.map(l => {
    const recs = workoutData.getRecords(l.exerciseId);
    const latestRec = recs.length > 0 ? recs[recs.length - 1] : null;
    // realWeight = confirmed 1RM from documents, not working weight from diary
    const realWeight = realMaxes[l.key];
    // Estimate 1RM from best diary record (highest weight × reps)
    const bestRec = recs.reduce((best, r) => {
      const e = estimate1RM(parseFloat(r.weight) || 0, parseInt(r.reps) || 1);
      return e > best ? e : best;
    }, realWeight);
    const pct = Math.min(100, Math.round((realWeight / l.goal) * 100));
    return { ...l, realWeight, est1RM: bestRec, pct, lastSetsReps: latestRec ? `${latestRec.sets}×${latestRec.reps}` : '' };
  });

  const totalToGoal = Math.round(
    allStats.reduce((a, s) => a + s.pct, 0) / (allStats.length || 1),
  );

  return (
    <div>
      <Hero
        plate="progress"
        ghost="05"
        kicker="Progres"
        title={<>Výkonnostní<br />přehled</>}
        stat={{ label: 'Průměr k cíli', value: `${totalToGoal}%` }}
        meta={
          <>
            <b>Bench {CURRENT_MAXES.bench}</b>
            <span>·</span>
            <span>Dřep {CURRENT_MAXES.squat}</span>
            <span>·</span>
            <span>Tah {CURRENT_MAXES.deadlift}</span>
            <span>·</span>
            <span>Cíle {GOALS.bench} / {GOALS.squat} / {GOALS.deadlift} kg</span>
          </>
        }
      />

      <Marquee items={['Odhad 1RM', 'Týdenní objem', 'Trend tělesné váhy', 'Předepsané série se do grafů nepočítají']} />

      <div className="gd-body">
      {/* Summary stats */}
      <SectionHead n="01" label="Aktuální maxima" right="1RM testováno" />
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {allStats.map(s => (
            <button
              key={s.key}
              onClick={() => setSelectedLift(s.key)}
              style={{
                flex: 1,
                background: selectedLift === s.key ? `${tint(s.color, 8)}` : 'color-mix(in srgb, var(--gd-text) 2%, transparent)',
                border: selectedLift === s.key ? `1px solid ${tint(s.color, 25)}` : '1px solid var(--gd-line)',
                borderRadius: 0,
                padding: '10px 8px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontSize: 10, color: 'var(--gd-text-4)', marginBottom: 3 }}>{s.label.split(' ')[0]}</div>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>
                {s.realWeight > 0 ? s.realWeight : '–'}
              </div>
              <div style={{ fontSize: 9, color: 'var(--gd-text-4)', marginTop: 1 }}>{s.lastSetsReps || 'kg'}</div>
              <div style={{ fontSize: 9, color: 'var(--gd-line)', marginTop: 2 }}>1RM~{s.est1RM} · {s.pct}%</div>
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <SectionHead
        n="02"
        label={`${lift.label} — odh. 1RM`}
        right={improvement > 0 ? `+${improvement} kg ↑` : undefined}
      />
      <div style={{ padding: '0 20px 20px', borderBottom: '1px solid var(--gd-line)' }}>

        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--gd-text-4)', fontSize: 10 }}
                axisLine={{ stroke: 'var(--gd-line)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--gd-text-4)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={lift.goal}
                stroke={lift.color}
                strokeDasharray="4 4"
                strokeOpacity={0.4}
                // position 'right' vysazovalo popisek 11 px za pravý okraj
                // a na 390 px se ořízl – dovnitř grafu se vejde vždy.
                label={{ value: `Cíl ${lift.goal}`, fill: lift.color, fontSize: 10, position: 'insideTopRight' }}
              />
              <Line
                type="monotone"
                dataKey="est1RM"
                stroke={lift.color}
                strokeWidth={2}
                dot={{ fill: lift.color, r: 3, strokeWidth: 0 }}
                activeDot={{ fill: lift.color, r: 5, strokeWidth: 0 }}
                // Recharts kreslí čáru animací přes stroke-dasharray. Když se
                // graf připojí mimo obrazovku nebo je karta na pozadí, rAF se
                // uškrtí, animace se nedokončí a z čáry zůstane 1 px – graf
                // vypadá prázdný. Bez animace se vykreslí vždy a hned.
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gd-text-4)', fontSize: 13 }}>
            Přidej alespoň 2 záznamy pro zobrazení grafu
          </div>
        )}

        {/* Progress to goal */}
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 12, color: 'var(--gd-text-3)' }}>Progres k cíli {lift.goal} kg</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: lift.color }}>{pctToGoal}%</span>
          </div>
          <div style={{ height: 4, background: 'var(--gd-line)', borderRadius: 0, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${pctToGoal}%`,
              background: `linear-gradient(90deg, ${tint(lift.color, 53)}, ${lift.color})`,
              borderRadius: 0,
              transition: 'width 0.8s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Weekly Volume Section */}
      <WeeklyVolumeSection workoutData={workoutData} />

      {/* Recent records table */}
      <SectionHead n="04" label="Poslední záznamy" right={lift.label} />
      <div style={{ padding: '0 20px 36px' }}>
        {chartData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--gd-text-4)', fontSize: 13 }}>
            Žádné záznamy
          </div>
        ) : (
          [...chartData].reverse().slice(0, 8).map((d, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid var(--gd-surface)',
            }}>
              <div>
                <span style={{ fontSize: 12, color: 'var(--gd-text-3)' }}>{d.date}</span>
                {d.note && <span style={{ fontSize: 11, color: 'var(--gd-text-4)', marginLeft: 8 }}>{d.note.slice(0, 30)}{d.note.length > 30 ? '…' : ''}</span>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 16, fontWeight: 700, color: lift.color }}>
                  {d.weight} kg
                </span>
                <span style={{ fontSize: 11, color: 'var(--gd-text-4)', marginLeft: 8 }}>{d.sets}×{d.reps}</span>
                <span style={{ fontSize: 10, color: 'var(--gd-text-4)', marginLeft: 6 }}>≈{d.est1RM}kg</span>
              </div>
            </div>
          ))
        )}
      </div>
      </div>
    </div>
  );
}

// ============================================================
// Weekly Volume Section
// ============================================================
function WeeklyVolumeSection({ workoutData }: { workoutData: WorkoutDataHook }) {
  const today = new Date();
  const weeks: { label: string; startDate: string; volume: number }[] = [];
  const weekStart = new Date(today);
  const dayOfWeek = weekStart.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  weekStart.setDate(weekStart.getDate() - daysToMonday);
  for (let i = 7; i >= 0; i--) {
    const ws = new Date(weekStart);
    ws.setDate(ws.getDate() - i * 7);
    const wsISO = ws.toISOString().slice(0, 10);
    const vol = workoutData.getWeeklyVolume(wsISO);
    const label = `${ws.getDate()}.${ws.getMonth() + 1}`;
    weeks.push({ label, startDate: wsISO, volume: vol });
  }
  const maxVol = Math.max(...weeks.map(w => w.volume), 1);
  const currentWeekVol = weeks[weeks.length - 1]?.volume ?? 0;
  const prevWeekVol = weeks[weeks.length - 2]?.volume ?? 0;
  const volChange = currentWeekVol - prevWeekVol;
  return (
    <>
      <SectionHead
        n="03"
        label="Týdenní objem (kg)"
        right={`${currentWeekVol.toLocaleString()} kg${volChange !== 0 ? (volChange > 0 ? ` +${volChange.toLocaleString()}` : ` ${volChange.toLocaleString()}`) : ''}`}
      />
      <div style={{ padding: '0 20px 20px', borderBottom: '1px solid var(--gd-line)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
        {weeks.map((w, i) => {
          const isCurrentWeek = i === weeks.length - 1;
          const barHeight = maxVol > 0 ? Math.max(4, (w.volume / maxVol) * 72) : 4;
          return (
            <div key={w.startDate} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: '100%', height: barHeight, background: isCurrentWeek ? 'var(--gd-accent)' : w.volume > 0 ? 'color-mix(in srgb, var(--gd-accent) 30%, transparent)' : 'var(--gd-line)', borderRadius: '0', alignSelf: 'flex-end' }} />
              <div style={{ fontSize: 8, color: isCurrentWeek ? 'var(--gd-accent)' : 'var(--gd-text-4)', whiteSpace: 'nowrap' }}>{w.label}</div>
            </div>
          );
        })}
      </div>
      {prevWeekVol > 0 && (
        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--gd-text-4)', textAlign: 'center' }}>
          Minulý týden: {prevWeekVol.toLocaleString()} kg
          <span style={{ color: volChange > 0 ? 'var(--gd-fern)' : volChange < 0 ? 'var(--gd-danger)' : 'var(--gd-text-4)', marginLeft: 6, fontWeight: 700 }}>
            {volChange > 0 ? `+${volChange.toLocaleString()}` : volChange < 0 ? `${volChange.toLocaleString()}` : '='} kg
          </span>
        </div>
      )}
      </div>
    </>
  );
}
