// Progress – Progres tab
// Gold Performance Design
// Shows: progress charts for main lifts, estimated 1RM over time, body weight trend
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { estimate1RM, formatDate, GOALS, CURRENT_MAXES, PLAN_START_DATE } from '@/lib/data';
import type { WorkoutDataHook } from '@/lib/types';

interface Props {
  workoutData: WorkoutDataHook;
}

type LiftKey = 'bench' | 'squat' | 'deadlift';

const LIFTS: { key: LiftKey; exerciseId: string; label: string; goal: number; color: string }[] = [
  { key: 'bench', exerciseId: 'bench', label: 'Bench Press', goal: GOALS.bench, color: '#F5C842' },
  { key: 'squat', exerciseId: 'squat', label: 'Back Squat', goal: GOALS.squat, color: '#E8E8E8' },
  { key: 'deadlift', exerciseId: 'deadlift', label: 'Mrtvý tah', goal: GOALS.deadlift, color: '#6EE7B7' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8,
        padding: '8px 12px', fontSize: 12,
      }}>
        <div style={{ color: '#888', marginBottom: 4 }}>{label}</div>
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

  return (
    <div style={{ padding: '0 0 16px' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #1c1c1c' }}>
        <div style={{ color: '#F5C842', fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
          PROGRES
        </div>
        <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#f0f0f0' }}>
          Výkonnostní přehled
        </h2>
      </div>

      {/* Summary stats */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #1c1c1c' }}>
        <div style={{ color: '#444', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>AKTUÁLNÍ MAXIMA</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {allStats.map(s => (
            <button
              key={s.key}
              onClick={() => setSelectedLift(s.key)}
              style={{
                flex: 1,
                background: selectedLift === s.key ? `${s.color}15` : 'rgba(255,255,255,0.02)',
                border: selectedLift === s.key ? `1px solid ${s.color}40` : '1px solid #1c1c1c',
                borderRadius: 12,
                padding: '10px 8px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontSize: 10, color: '#555', marginBottom: 3 }}>{s.label.split(' ')[0]}</div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>
                {s.realWeight > 0 ? s.realWeight : '–'}
              </div>
              <div style={{ fontSize: 9, color: '#444', marginTop: 1 }}>{s.lastSetsReps || 'kg'}</div>
              <div style={{ fontSize: 9, color: '#333', marginTop: 2 }}>1RM~{s.est1RM} · {s.pct}%</div>
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #1c1c1c' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ color: '#444', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            {lift.label} – odh. 1RM
          </div>
          {improvement > 0 && (
            <div style={{ fontSize: 12, color: '#6EE7B7', fontWeight: 700 }}>+{improvement} kg ↑</div>
          )}
        </div>

        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <XAxis
                dataKey="date"
                tick={{ fill: '#555', fontSize: 10 }}
                axisLine={{ stroke: '#1c1c1c' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#555', fontSize: 10 }}
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
                label={{ value: `Cíl ${lift.goal}`, fill: lift.color, fontSize: 10, position: 'right' }}
              />
              <Line
                type="monotone"
                dataKey="est1RM"
                stroke={lift.color}
                strokeWidth={2}
                dot={{ fill: lift.color, r: 3, strokeWidth: 0 }}
                activeDot={{ fill: lift.color, r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: 13 }}>
            Přidej alespoň 2 záznamy pro zobrazení grafu
          </div>
        )}

        {/* Progress to goal */}
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 12, color: '#666' }}>Progres k cíli {lift.goal} kg</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: lift.color }}>{pctToGoal}%</span>
          </div>
          <div style={{ height: 4, background: '#1c1c1c', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${pctToGoal}%`,
              background: `linear-gradient(90deg, ${lift.color}88, ${lift.color})`,
              borderRadius: 2,
              transition: 'width 0.8s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Weekly Volume Section */}
      <WeeklyVolumeSection workoutData={workoutData} />

      {/* Recent records table */}
      <div style={{ padding: '14px 20px' }}>
        <div style={{ color: '#444', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
          POSLEDNÍ ZÁZNAMY – {lift.label.toUpperCase()}
        </div>
        {chartData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#444', fontSize: 13 }}>
            Žádné záznamy
          </div>
        ) : (
          [...chartData].reverse().slice(0, 8).map((d, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid #1a1a1a',
            }}>
              <div>
                <span style={{ fontSize: 12, color: '#888' }}>{d.date}</span>
                {d.note && <span style={{ fontSize: 11, color: '#444', marginLeft: 8 }}>{d.note.slice(0, 30)}{d.note.length > 30 ? '…' : ''}</span>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 700, color: lift.color }}>
                  {d.weight} kg
                </span>
                <span style={{ fontSize: 11, color: '#555', marginLeft: 8 }}>{d.sets}×{d.reps}</span>
                <span style={{ fontSize: 10, color: '#444', marginLeft: 6 }}>≈{d.est1RM}kg</span>
              </div>
            </div>
          ))
        )}
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
    <div style={{ padding: '14px 20px', borderBottom: '1px solid #1c1c1c' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ color: '#444', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase' }}>TÝDENNÍ OBJEM (kg)</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: volChange >= 0 ? '#6EE7B7' : '#F87171' }}>
          {currentWeekVol.toLocaleString()} kg{volChange !== 0 ? (volChange > 0 ? ` +${volChange.toLocaleString()}` : ` ${volChange.toLocaleString()}`) : ''}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
        {weeks.map((w, i) => {
          const isCurrentWeek = i === weeks.length - 1;
          const barHeight = maxVol > 0 ? Math.max(4, (w.volume / maxVol) * 72) : 4;
          return (
            <div key={w.startDate} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: '100%', height: barHeight, background: isCurrentWeek ? '#F5C842' : w.volume > 0 ? 'rgba(245,200,66,0.3)' : '#1c1c1c', borderRadius: '3px 3px 0 0', alignSelf: 'flex-end' }} />
              <div style={{ fontSize: 8, color: isCurrentWeek ? '#F5C842' : '#444', whiteSpace: 'nowrap' }}>{w.label}</div>
            </div>
          );
        })}
      </div>
      {prevWeekVol > 0 && (
        <div style={{ marginTop: 10, fontSize: 11, color: '#555', textAlign: 'center' }}>
          Minulý týden: {prevWeekVol.toLocaleString()} kg
          <span style={{ color: volChange > 0 ? '#6EE7B7' : volChange < 0 ? '#F87171' : '#555', marginLeft: 6, fontWeight: 700 }}>
            {volChange > 0 ? `+${volChange.toLocaleString()}` : volChange < 0 ? `${volChange.toLocaleString()}` : '='} kg
          </span>
        </div>
      )}
    </div>
  );
}
