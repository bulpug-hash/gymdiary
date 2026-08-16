// Tools Tab – Gold Performance Design
// GymDiary visual system: preserve the dark, compact, yellow-accented training diary layout.
// Features: RPE kalkulačka, tělesná váha tracker, odpočinkový timer, export XLSX, zdrojové dokumenty
import { useState, useEffect, useRef, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';
import { nanoid, formatDate, PHASE3_WEEKS } from '@/lib/data';
import { RECOVERED_HIIT_RECORDS, RECOVERED_RUN_RECORDS } from '@/lib/recoveryData';
import type { WorkoutDataHook } from '@/lib/types';
import * as XLSX from 'xlsx';

interface Props {
  workoutData: WorkoutDataHook;
}

// ============================================================
// Body Weight Entry
// ============================================================
interface WeightEntry {
  id: string;
  date: string;
  weight: number;
  note?: string;
}

const BW_STORAGE_KEY = 'gymdiary_bodyweight_v1';

function loadBodyWeights(): WeightEntry[] {
  try {
    const raw = localStorage.getItem(BW_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as WeightEntry[];
  } catch { /* ignore */ }
  return [];
}

function saveBodyWeights(entries: WeightEntry[]) {
  try {
    localStorage.setItem(BW_STORAGE_KEY, JSON.stringify(entries));
  } catch { /* ignore */ }
}

// ============================================================
// RPE → Weight Calculator
// Epley formula: weight = 1RM / (1 + reps/30)
// ============================================================
function calcWeightFromRPE(oneRM: number, reps: number, rpe: number): number {
  // Adjust 1RM based on RPE (RPE 10 = true max)
  const adjustedRM = oneRM * (rpe / 10);
  const weight = adjustedRM / (1 + reps / 30);
  return Math.round(weight * 2) / 2; // round to nearest 0.5
}

function calc1RMFromWeight(weight: number, reps: number): number {
  return Math.round(weight * (1 + reps / 30));
}

// ============================================================
// Main Tools Component
// ============================================================
export default function Tools({ workoutData }: Props) {
  const [section, setSection] = useState<'rpe' | 'bodyweight' | 'timer' | 'export' | 'nutrition' | 'autoregulation' | 'documents'>('rpe');
  const { theme, toggleTheme, switchable } = useTheme();

  const sectionBtnStyle = (active: boolean) => ({
    flex: 1,
    padding: '8px 4px',
    background: active ? 'rgba(245,200,66,0.1)' : 'transparent',
    border: active ? '1px solid rgba(245,200,66,0.3)' : '1px solid #1c1c1c',
    borderRadius: 10,
    color: active ? '#F5C842' : '#555',
    fontSize: 10,
    fontWeight: active ? 700 : 400,
    letterSpacing: '0.05em',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    textAlign: 'center' as const,
  });

  return (
    <div style={{ padding: '0 0 16px' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #1c1c1c' }}>
        <div style={{ color: '#F5C842', fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
          NÁSTROJE
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: theme === 'dark' ? '#f0f0f0' : '#111' }}>
            Fitness nástroje
          </h2>
          {switchable && (
            <button
              onClick={toggleTheme}
              style={{
                background: 'rgba(245,200,66,0.1)',
                border: '1px solid rgba(245,200,66,0.2)',
                borderRadius: 20,
                padding: '6px 12px',
                color: '#F5C842',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {theme === 'dark' ? '☀️ Světlý' : '🌙 Tmavý'}
            </button>
          )}
        </div>
      </div>

      {/* Section tabs */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #1c1c1c' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: 'rpe', label: 'RPE' },
            { key: 'bodyweight', label: 'Váha' },
            { key: 'timer', label: 'Timer' },
            { key: 'export', label: 'Export' },
            { key: 'nutrition', label: '🥩 Výživa' },
            { key: 'autoregulation', label: '🧠 Auto' },
            { key: 'documents', label: '📁 Docs' },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setSection(s.key as typeof section)}
              style={sectionBtnStyle(section === s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section content */}
      <div style={{ padding: '16px 20px' }}>
        {section === 'rpe' && <RPECalculator />}
        {section === 'bodyweight' && <BodyWeightTracker />}
        {section === 'timer' && <RestTimer />}
        {section === 'export' && <ExportData workoutData={workoutData} />}
        {section === 'nutrition' && <NutritionGuide />}
        {section === 'autoregulation' && <AutoregulationGuide />}
        {section === 'documents' && <DocumentsSection />}
      </div>
    </div>
  );
}

// ============================================================
// RPE Calculator
// ============================================================
function RPECalculator() {
  const [mode, setMode] = useState<'rpe2weight' | 'weight2rm'>('rpe2weight');
  const [oneRM, setOneRM] = useState('');
  const [reps, setReps] = useState('5');
  const [rpe, setRpe] = useState('8');
  const [weight, setWeight] = useState('');
  const [repsForRM, setRepsForRM] = useState('5');

  const suggestedWeight = oneRM && reps && rpe
    ? calcWeightFromRPE(parseFloat(oneRM), parseInt(reps), parseFloat(rpe))
    : null;

  const estimated1RM = weight && repsForRM
    ? calc1RMFromWeight(parseFloat(weight), parseInt(repsForRM))
    : null;

  const inputStyle = {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 8,
    color: '#e0e0e0',
    padding: '10px 12px',
    fontSize: 14,
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    fontSize: 11,
    color: '#666',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    marginBottom: 4,
    display: 'block',
  };

  return (
    <div>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: '#F5C842', marginBottom: 4 }}>
        RPE Kalkulačka
      </div>
      <p style={{ fontSize: 12, color: '#555', marginBottom: 16 }}>
        RPE 10 = absolutní maximum. RPE 8 = 2 opakování v zásobě.
      </p>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => setMode('rpe2weight')}
          style={{
            flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: mode === 'rpe2weight' ? '#F5C842' : 'transparent',
            border: mode === 'rpe2weight' ? 'none' : '1px solid #2a2a2a',
            color: mode === 'rpe2weight' ? '#0c0c0c' : '#666',
          }}
        >RPE → Váha</button>
        <button
          onClick={() => setMode('weight2rm')}
          style={{
            flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: mode === 'weight2rm' ? '#F5C842' : 'transparent',
            border: mode === 'weight2rm' ? 'none' : '1px solid #2a2a2a',
            color: mode === 'weight2rm' ? '#0c0c0c' : '#666',
          }}
        >Váha → 1RM</button>
      </div>

      {mode === 'rpe2weight' ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>1RM (kg)</label>
              <input type="number" value={oneRM} onChange={e => setOneRM(e.target.value)} placeholder="130" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Opakování</label>
              <input type="number" value={reps} onChange={e => setReps(e.target.value)} placeholder="5" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>RPE</label>
              <input type="number" value={rpe} onChange={e => setRpe(e.target.value)} placeholder="8" min="1" max="10" step="0.5" style={inputStyle} />
            </div>
          </div>

          {suggestedWeight !== null && (
            <div style={{
              background: 'rgba(245,200,66,0.08)',
              border: '1px solid rgba(245,200,66,0.2)',
              borderRadius: 14,
              padding: '16px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Doporučená váha</div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 48, fontWeight: 900, color: '#F5C842', lineHeight: 1 }}>
                {suggestedWeight}
              </div>
              <div style={{ fontSize: 14, color: '#888', marginTop: 4 }}>kg · {reps} opakování @ RPE {rpe}</div>
            </div>
          )}

          {/* RPE reference table */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10, color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>RPE Referenční tabulka</div>
            {[
              { rpe: 10, desc: 'Absolutní maximum, 0 reps v zásobě', pct: '100%' },
              { rpe: 9, desc: '1 opakování v zásobě', pct: '96%' },
              { rpe: 8, desc: '2 opakování v zásobě', pct: '92%' },
              { rpe: 7, desc: '3 opakování v zásobě', pct: '88%' },
              { rpe: 6, desc: '4+ opakování v zásobě', pct: '84%' },
            ].map(row => (
              <div key={row.rpe} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #161616' }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: '#F5C842', width: 28 }}>{row.rpe}</div>
                <div style={{ flex: 1, fontSize: 12, color: '#666' }}>{row.desc}</div>
                <div style={{ fontSize: 12, color: '#444', fontWeight: 600 }}>{row.pct}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Váha (kg)</label>
              <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="105" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Opakování</label>
              <input type="number" value={repsForRM} onChange={e => setRepsForRM(e.target.value)} placeholder="5" style={inputStyle} />
            </div>
          </div>

          {estimated1RM !== null && (
            <div style={{
              background: 'rgba(245,200,66,0.08)',
              border: '1px solid rgba(245,200,66,0.2)',
              borderRadius: 14,
              padding: '16px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Odhadované 1RM</div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 48, fontWeight: 900, color: '#F5C842', lineHeight: 1 }}>
                {estimated1RM}
              </div>
              <div style={{ fontSize: 14, color: '#888', marginTop: 4 }}>kg (Epley formula)</div>
            </div>
          )}

          {/* Quick reference for common %1RM */}
          {estimated1RM && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 10, color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Procentuální tabulka</div>
              {[100, 95, 90, 85, 80, 75, 70].map(pct => (
                <div key={pct} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', borderBottom: '1px solid #161616' }}>
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 700, color: '#F5C842', width: 40 }}>{pct}%</div>
                  <div style={{ flex: 1, fontSize: 12, color: '#666' }}>
                    {pct === 100 ? '1 rep' : pct >= 90 ? '2-3 reps' : pct >= 85 ? '4-5 reps' : pct >= 80 ? '5-6 reps' : pct >= 75 ? '8-10 reps' : '12-15 reps'}
                  </div>
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: '#e0e0e0' }}>
                    {Math.round(estimated1RM * pct / 100 * 2) / 2} kg
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// Body Weight Tracker
// ============================================================
function BodyWeightTracker() {
  const [entries, setEntries] = useState<WeightEntry[]>(loadBodyWeights);
  const [newWeight, setNewWeight] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newNote, setNewNote] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    saveBodyWeights(entries);
  }, [entries]);

  const addEntry = () => {
    if (!newWeight || !newDate) {
      toast.error('Vyplň datum a váhu');
      return;
    }
    const entry: WeightEntry = {
      id: nanoid(),
      date: newDate,
      weight: parseFloat(newWeight),
      note: newNote,
    };
    const updated = [...entries, entry].sort((a, b) => a.date.localeCompare(b.date));
    setEntries(updated);
    setNewWeight('');
    setNewNote('');
    setShowForm(false);
    toast.success('Váha přidána ✓');
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    toast.success('Záznam smazán');
  };

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const first = sorted[0];
  const change = latest && first && sorted.length > 1 ? latest.weight - first.weight : null;

  const chartData = sorted.map(e => ({
    date: formatDate(e.date),
    weight: e.weight,
  }));

  const inputStyle = {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 8,
    color: '#e0e0e0',
    padding: '10px 12px',
    fontSize: 14,
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    fontSize: 11,
    color: '#666',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    marginBottom: 4,
    display: 'block',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: '#F5C842' }}>
            Tělesná váha
          </div>
          {latest && (
            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
              Poslední: {latest.weight} kg · {formatDate(latest.date)}
              {change !== null && (
                <span style={{ color: change < 0 ? '#6EE7B7' : '#F87171', marginLeft: 8, fontWeight: 600 }}>
                  {change > 0 ? '+' : ''}{change.toFixed(1)} kg
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: '#F5C842', border: 'none', borderRadius: 8,
            color: '#0c0c0c', fontSize: 12, fontWeight: 700, padding: '8px 14px',
            cursor: 'pointer',
          }}
        >+ Přidat</button>
      </div>

      {showForm && (
        <div style={{
          background: '#111',
          border: '1px solid rgba(245,200,66,0.2)',
          borderRadius: 14,
          padding: '14px',
          marginBottom: 16,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={labelStyle}>Datum</label>
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Váha (kg)</label>
              <input type="number" value={newWeight} onChange={e => setNewWeight(e.target.value)} placeholder="85.5" step="0.1" style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Poznámka</label>
            <input type="text" value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="ráno, nalačno..." style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addEntry} style={{ flex: 1, background: '#F5C842', border: 'none', borderRadius: 8, color: '#0c0c0c', fontSize: 13, fontWeight: 700, padding: '9px', cursor: 'pointer' }}>
              Uložit
            </button>
            <button onClick={() => setShowForm(false)} style={{ padding: '9px 14px', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 8, color: '#666', fontSize: 13, cursor: 'pointer' }}>
              Zrušit
            </button>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 1 && (
        <div style={{ marginBottom: 16 }}>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#555', fontSize: 9 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#888' }}
                itemStyle={{ color: '#F5C842' }}
                formatter={(v: number) => [`${v} kg`, 'Váha']}
              />
              <Line type="monotone" dataKey="weight" stroke="#F5C842" strokeWidth={2} dot={{ fill: '#F5C842', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Entries list */}
      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: '#444' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⚖️</div>
          <div style={{ fontSize: 13 }}>Žádné záznamy. Přidej první měření!</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 10, color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>ZÁZNAMY</div>
          {[...sorted].reverse().slice(0, 10).map((entry, idx) => (
            <div
              key={entry.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px',
                background: idx === 0 ? 'rgba(245,200,66,0.05)' : 'rgba(255,255,255,0.02)',
                border: idx === 0 ? '1px solid rgba(245,200,66,0.15)' : '1px solid #1c1c1c',
                borderRadius: 10,
                marginBottom: 6,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#666' }}>{formatDate(entry.date)}</div>
                {entry.note && <div style={{ fontSize: 11, color: '#444', marginTop: 1 }}>{entry.note}</div>}
              </div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 20, fontWeight: 800, color: '#F5C842' }}>
                {entry.weight} kg
              </div>
              <button
                onClick={() => deleteEntry(entry.id)}
                style={{ background: 'none', border: 'none', color: '#333', fontSize: 14, cursor: 'pointer', padding: 4 }}
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Rest Timer
// ============================================================
function RestTimer() {
  const [duration, setDuration] = useState(90); // seconds
  const [remaining, setRemaining] = useState(90);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const presets = [60, 90, 120, 180, 240, 300];

  const startStop = useCallback(() => {
    if (running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRunning(false);
    } else {
      setRunning(true);
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            toast.success('⏱️ Odpočinek dokončen! Jdi na to!', { duration: 4000 });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [running]);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setRemaining(duration);
  }, [duration]);

  useEffect(() => {
    setRemaining(duration);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
  }, [duration]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const pct = remaining / duration;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const circumference = 2 * Math.PI * 54;

  return (
    <div>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: '#F5C842', marginBottom: 4 }}>
        Odpočinkový timer
      </div>
      <p style={{ fontSize: 12, color: '#555', marginBottom: 20 }}>
        Nastav délku odpočinku a spusť timer po sérii.
      </p>

      {/* Circular timer */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <div style={{ position: 'relative', width: 140, height: 140 }}>
          <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="70" cy="70" r="54" fill="none" stroke="#1c1c1c" strokeWidth="8" />
            <circle
              cx="70" cy="70" r="54"
              fill="none"
              stroke={pct > 0.3 ? '#F5C842' : '#F87171'}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pct)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 32, fontWeight: 900, color: '#f0f0f0', lineHeight: 1 }}>
              {mins}:{secs.toString().padStart(2, '0')}
            </div>
            <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{running ? 'BĚŽÍ' : 'STOP'}</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button
          onClick={startStop}
          style={{
            flex: 2,
            background: running ? 'rgba(248,113,113,0.15)' : '#F5C842',
            border: running ? '1px solid rgba(248,113,113,0.3)' : 'none',
            borderRadius: 12,
            color: running ? '#F87171' : '#0c0c0c',
            fontSize: 16,
            fontWeight: 800,
            padding: '14px',
            cursor: 'pointer',
            fontFamily: 'Barlow Condensed, sans-serif',
            letterSpacing: '0.05em',
          }}
        >
          {running ? '⏸ PAUZA' : '▶ START'}
        </button>
        <button
          onClick={reset}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid #2a2a2a',
            borderRadius: 12,
            color: '#666',
            fontSize: 14,
            fontWeight: 600,
            padding: '14px',
            cursor: 'pointer',
          }}
        >↺ Reset</button>
      </div>

      {/* Presets */}
      <div style={{ fontSize: 10, color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>RYCHLÉ NASTAVENÍ</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {presets.map(s => (
          <button
            key={s}
            onClick={() => setDuration(s)}
            style={{
              padding: '7px 12px',
              background: duration === s ? 'rgba(245,200,66,0.15)' : 'rgba(255,255,255,0.03)',
              border: duration === s ? '1px solid rgba(245,200,66,0.3)' : '1px solid #1c1c1c',
              borderRadius: 8,
              color: duration === s ? '#F5C842' : '#555',
              fontSize: 12,
              fontWeight: duration === s ? 700 : 400,
              cursor: 'pointer',
            }}
          >
            {s >= 60 ? `${s / 60}min` : `${s}s`}
            {s === 90 && ' ⭐'}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Export Data – XLSX multi-sheet export (identický se starým deníkem)
// ============================================================
function ExportData({ workoutData }: { workoutData: WorkoutDataHook }) {
  const backupInputRef = useRef<HTMLInputElement>(null);

  const getStoredArray = <T,>(key: string, fallback: T[]): T[] => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as T[];
        if (parsed.length > 0) return parsed;
      }
    } catch { /* ignore */ }
    return fallback;
  };

  const exportBackup = () => {
    const today = new Date().toISOString().split('T')[0];
    const backup = {
      format: 'gymdiary-backup',
      version: 1,
      createdAt: new Date().toISOString(),
      workoutRecords: workoutData.records,
      runRecords: getStoredArray('__run_log__', RECOVERED_RUN_RECORDS),
      hiitRecords: getStoredArray('__hiit_log__', RECOVERED_HIIT_RECORDS),
      bodyWeightRecords: loadBodyWeights(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gymdiary-zaloha-${today}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('JSON záloha stažena ✓');
  };

  const importBackup = (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const backup = JSON.parse(String(reader.result));
        if (backup?.format !== 'gymdiary-backup' || !backup?.workoutRecords) throw new Error('Neplatný soubor');
        if (!window.confirm('Import nahradí současné záznamy v tomto prohlížeči. Pokračovat?')) return;
        localStorage.setItem('gymdiary_records_v3', JSON.stringify(backup.workoutRecords));
        localStorage.setItem('__run_log__', JSON.stringify(backup.runRecords ?? []));
        localStorage.setItem('__hiit_log__', JSON.stringify(backup.hiitRecords ?? []));
        localStorage.setItem(BW_STORAGE_KEY, JSON.stringify(backup.bodyWeightRecords ?? []));
        toast.success('Záloha načtena ✓ Aplikace se obnoví.');
        window.setTimeout(() => window.location.reload(), 700);
      } catch {
        toast.error('Soubor není platná záloha GymDiary');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Helper: find exercise name and day/week info from plan
  const getExerciseInfo = (exId: string) => {
    for (const week of PHASE3_WEEKS) {
      for (const day of week.days) {
        const ex = day.exercises.find(e => e.id === exId);
        if (ex) return { name: ex.name, dayLabel: day.label, dayType: day.type, weekNum: week.number, phase: week.phase, category: ex.category };
      }
    }
    return { name: exId, dayLabel: '–', dayType: '–', weekNum: 0, phase: '–', category: 'accessory' };
  };

  // Helper: get week for a date
  const getWeekForDate = (dateStr: string) => {
    const d = new Date(dateStr);
    for (const week of PHASE3_WEEKS) {
      const from = new Date(week.dateFrom);
      const to = new Date(week.dateTo);
      to.setHours(23,59,59,999);
      if (d >= from && d <= to) return week;
    }
    return null;
  };

  // Helper: format date CZ style
  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()}. ${d.getMonth()+1}. ${d.getFullYear()}`;
  };

  // Helper: day of week CZ
  const dayNames = ['neděle','pondělí','úterý','středa','čtvrtek','pátek','sobota'];
  const getDayName = (iso: string) => dayNames[new Date(iso).getDay()];

  // Category labels
  const catLabel: Record<string, string> = {
    main: 'Hlavní cvik', accessory: 'Doplňkový cvik', isolation: 'Izolační cvik',
    prevention: 'Prevence', core: 'Core', run: 'Běh', superset: 'Superset',
  };

  const exportXLSX = () => {
    const allExerciseIds = Object.keys(workoutData.records).filter(id => workoutData.getRecords(id).length > 0);
    const today = new Date().toISOString().split('T')[0];

    // ===== List 1: Záznamy =====
    const zaznamy: (string | number | null)[][] = [[
      'Datum', 'Den v týdnu', 'Trénink', 'Cvik', 'Kategorie',
      'Týden č.', 'Fáze', 'Plánovaná váha (kg)', 'Plánovaný záznam (celý)',
      'Skutečná váha (kg)', 'Skutečná opakování', 'Objem (kg × op)',
      '% splnění cíle váhy', 'Fitko', 'Extra aktivita', 'Poznámka'
    ]];

    for (const exId of allExerciseIds) {
      const records = workoutData.getRecords(exId);
      const info = getExerciseInfo(exId);
      for (const r of records) {
        const week = getWeekForDate(r.date);
        const plannedWeight = parseFloat(r.weight) || 0;
        const actualWeight = parseFloat(r.weight) || 0;
        const actualReps = parseInt(r.reps as string) || 0;
        const actualSets = parseInt(r.sets as string) || 1;
        const volume = actualWeight * actualReps * actualSets;
        const pctGoal = plannedWeight > 0 ? Math.round((actualWeight / plannedWeight) * 100) / 100 : null;
        zaznamy.push([
          fmtDate(r.date),
          getDayName(r.date),
          info.dayLabel + ' – ' + info.dayType.toUpperCase(),
          info.name,
          catLabel[info.category] || info.category,
          week ? week.number : null,
          week ? week.phase : '–',
          plannedWeight || null,
          `${r.weight} kg × ${r.reps} (${r.sets} sérií)`,
          actualWeight || null,
          actualReps || null,
          volume || null,
          pctGoal,
          r.gym || null,
          r.extraActivity || null,
          r.note || null,
        ]);
      }
    }

    // ===== List 2: Souhrn cviků =====
    const souhrn: (string | number | null)[][] = [[
      'Cvik', 'Trénink', 'Kategorie',
      'Výchozí váha', 'Max. dosažená váha (kg)', 'Datum maxima',
      'Poslední váha (kg)', 'Zlepšení celkem (kg)',
      'Celkový objem (kg × op)', 'Počet záznamů', 'Trend (první → poslední váha)'
    ]];

    for (const exId of allExerciseIds) {
      const records = workoutData.getRecords(exId);
      if (records.length === 0) continue;
      const info = getExerciseInfo(exId);
      const weights = records.map(r => parseFloat(r.weight) || 0);
      const maxW = Math.max(...weights);
      const maxIdx = weights.indexOf(maxW);
      const firstW = weights[0];
      const lastW = weights[weights.length - 1];
      const totalVol = records.reduce((s, r) => s + (parseFloat(r.weight)||0)*(parseInt(r.reps as string)||0)*(parseInt(r.sets as string)||1), 0);
      souhrn.push([
        info.name,
        info.dayLabel,
        catLabel[info.category] || info.category,
        firstW > 0 ? `${firstW} kg` : '–',
        maxW > 0 ? maxW : null,
        maxIdx >= 0 ? fmtDate(records[maxIdx].date) : '–',
        lastW > 0 ? lastW : null,
        lastW - firstW,
        Math.round(totalVol),
        records.length,
        `${firstW} kg → ${lastW} kg`,
      ]);
    }

    // ===== List 3: Souhrn týdnů =====
    const souhrntydnu: (string | number | null)[][] = [[
      'Týden č.', 'Fáze', 'Datum od', 'Datum do', 'Focus týdne',
      'Počet záznamů (setů)', 'Celkový objem (kg × op)', 'Poznámky'
    ]];

    for (const week of PHASE3_WEEKS) {
      const from = new Date(week.dateFrom);
      const to = new Date(week.dateTo);
      to.setHours(23,59,59,999);
      let weekRecords = 0;
      let weekVolume = 0;
      for (const exId of allExerciseIds) {
        const recs = workoutData.getRecords(exId).filter(r => {
          const d = new Date(r.date);
          return d >= from && d <= to;
        });
        weekRecords += recs.length;
        weekVolume += recs.reduce((s, r) => s + (parseFloat(r.weight)||0)*(parseInt(r.reps as string)||0)*(parseInt(r.sets as string)||1), 0);
      }
      souhrntydnu.push([
        week.number,
        week.phase,
        `${from.getDate()}. ${from.getMonth()+1}.`,
        `${to.getDate()}. ${to.getMonth()+1}.`,
        week.description.substring(0, 80),
        weekRecords > 0 ? weekRecords : null,
        weekVolume > 0 ? Math.round(weekVolume) : null,
        week.isDeload ? 'DELOAD / TAPER' : null,
      ]);
    }

    // ===== List 4: Metadata =====
    const metadata: (string | null)[][] = [
      ['METADATA TRÉNINKOVÉHO PLÁNU', null],
      ['Parametr', 'Hodnota'],
      ['Název plánu', 'Silově-hypertrofický plán 2026 v4'],
      ['Začátek plánu', '14. 4. 2026'],
      ['Konec plánu', '3. 8. 2026'],
      ['Počet týdnů', '16'],
      ['Fáze 1', 'Akumulace W1–4 (14.4.–11.5.2026)'],
      ['Fáze 2', 'Síla W5–8 (12.5.–8.6.2026)'],
      ['Fáze 3', 'Intenzifikace W9–12 (9.6.–6.7.2026)'],
      ['Fáze 4', 'Peaking W13–16 (7.7.–3.8.2026)'],
      ['Cíl Squat', '190 kg (1RM)'],
      ['Cíl Bench Press', '130 kg (1RM)'],
      ['Cíl Deadlift', '235 kg (1RM)'],
      ['Zdroje', 'Israetel, Tuchscherer, Smith, Zatsiorsky, Horschig, Schumann, Viada'],
      ['Export vytvořen', today],
      ['Počet exportovaných záznamů', String(zaznamy.length - 1)],
    ];

    // Build workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(zaznamy), 'Záznamy');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(souhrn), 'Souhrn cviků');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(souhrntydnu), 'Souhrn týdnů');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(metadata), 'Metadata');

    XLSX.writeFile(wb, `treninkovy-denik-${today}.xlsx`);
    toast.success('XLSX exportováno – 4 listy ✓');
  };

  const exportBodyWeight = () => {
    const entries = loadBodyWeights();
    if (entries.length === 0) { toast.error('Žádné záznamy tělesné váhy'); return; }
    const data = [['Datum', 'Váha (kg)', 'Poznámka'], ...entries.map(e => [e.date, e.weight, e.note || ''])];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), 'Tělesná váha');
    XLSX.writeFile(wb, `telesna-vaha-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Export tělesné váhy hotov ✓');
  };

  const totalRecords = Object.values(workoutData.records).reduce((sum, arr) => sum + arr.length, 0);
  const exerciseCount = Object.keys(workoutData.records).filter(id => workoutData.getRecords(id).length > 0).length;
  const bwCount = loadBodyWeights().length;

  return (
    <div>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: '#F5C842', marginBottom: 4 }}>
        Export dat
      </div>
      <p style={{ fontSize: 12, color: '#555', marginBottom: 20 }}>
        Stáhni svá data jako XLSX soubor – 4 listy identické se starým deníkem.
      </p>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Cviků', value: exerciseCount },
          { label: 'Záznamů', value: totalRecords },
          { label: 'Váha', value: bwCount },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid #1c1c1c',
            borderRadius: 10, padding: '10px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 24, fontWeight: 800, color: '#F5C842' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Export buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={exportXLSX}
          style={{
            background: 'rgba(245,200,66,0.08)',
            border: '1px solid rgba(245,200,66,0.2)',
            borderRadius: 12,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            textAlign: 'left',
            width: '100%',
          }}
        >
          <span style={{ fontSize: 24 }}>📊</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 700, color: '#F5C842' }}>Export tréninků (XLSX)</div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{totalRecords} záznamů · 4 listy: Záznamy, Souhrn cviků, Souhrn týdnů, Metadata</div>
          </div>
          <div style={{ color: '#F5C842', fontSize: 16 }}>↓</div>
        </button>

        <button
          onClick={exportBodyWeight}
          style={{
            background: 'rgba(110,231,183,0.06)',
            border: '1px solid rgba(110,231,183,0.15)',
            borderRadius: 12,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            textAlign: 'left',
            width: '100%',
          }}
        >
          <span style={{ fontSize: 24 }}>⚖️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 700, color: '#6EE7B7' }}>Export tělesné váhy (XLSX)</div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{bwCount} záznamů · 1 list</div>
          </div>
          <div style={{ color: '#6EE7B7', fontSize: 16 }}>↓</div>
        </button>

        <button
          onClick={exportBackup}
          style={{ background: 'rgba(147,197,253,0.06)', border: '1px solid rgba(147,197,253,0.18)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left', width: '100%' }}
        >
          <span style={{ fontSize: 24 }}>💾</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 700, color: '#93C5FD' }}>Kompletní záloha (JSON)</div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>Cviky, běhy, HIIT i tělesná váha · soubor lze později načíst zpět</div>
          </div>
          <div style={{ color: '#93C5FD', fontSize: 16 }}>↓</div>
        </button>

        <input ref={backupInputRef} type="file" accept="application/json,.json" onChange={importBackup} style={{ display: 'none' }} />
        <button
          onClick={() => backupInputRef.current?.click()}
          style={{ background: 'transparent', border: '1px dashed rgba(147,197,253,0.28)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left', width: '100%' }}
        >
          <span style={{ fontSize: 20 }}>↑</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 700, color: '#93C5FD' }}>Načíst zálohu (JSON)</div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>Obnoví data do tohoto prohlížeče a aplikace se znovu načte</div>
          </div>
        </button>
      </div>

      <div style={{ marginTop: 16, padding: '10px 12px', background: 'rgba(245,200,66,0.04)', border: '1px solid rgba(245,200,66,0.15)', borderRadius: 10 }}>
        <div style={{ fontSize: 10, color: '#F5C842', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>XLSX STRUKTURA (identická se starým deníkem)</div>
        <div style={{ fontSize: 11, color: '#666', lineHeight: 1.6 }}>
          📄 <b style={{color:'#aaa'}}>Záznamy</b> – všechny zápisy s datem, cvikem, váhou, objemem<br/>
          📄 <b style={{color:'#aaa'}}>Souhrn cviků</b> – max váha, trend, celkový objem<br/>
          📄 <b style={{color:'#aaa'}}>Souhrn týdnů</b> – objem a počet záznamů po týdních<br/>
          📄 <b style={{color:'#aaa'}}>Metadata</b> – informace o plánu a exportu
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Nutrition Guide - based on v4 training plan
// ============================================================
function NutritionGuide() {
  const [tab, setTab] = useState<'macros' | 'timing' | 'supplements' | 'rules'>('macros');

  const tabStyle = (active: boolean) => ({
    padding: '7px 14px',
    borderRadius: 8,
    border: 'none',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    background: active ? '#D4AF37' : 'rgba(255,255,255,0.04)',
    color: active ? '#000' : '#888',
    transition: 'all 0.2s',
  });

  const cardStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid #1c1c1c',
    borderRadius: 12,
    padding: '14px 16px',
    marginBottom: 10,
  };

  const labelStyle = { fontSize: 10, color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 4 };
  const valueStyle = { fontFamily: 'Barlow Condensed, sans-serif', fontSize: 22, fontWeight: 700, color: '#D4AF37' };
  const subStyle = { fontSize: 12, color: '#888', marginTop: 2 };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
          Výživa & Suplementace
        </div>
        <div style={{ fontSize: 12, color: '#666' }}>Protokol z vědecky podloženého plánu 2026 v4</div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { key: 'macros', label: 'Makra' },
          { key: 'timing', label: 'Načasování' },
          { key: 'supplements', label: 'Suplementy' },
          { key: 'rules', label: 'Pravidla' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)} style={tabStyle(tab === t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'macros' && (
        <div>
          <div style={{ ...cardStyle, borderColor: 'rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.04)' }}>
            <div style={labelStyle}>Cíl – Rekomposice těla</div>
            <div style={{ fontSize: 13, color: '#ccc', lineHeight: 1.6 }}>
              Mírný kalorický přebytek v tréninkové dny, udržovací příjem ve dnech odpočinku. Priorita: svalová hypertrofie + minimalizace tuku.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div style={cardStyle}>
              <div style={labelStyle}>Tréninkový den</div>
              <div style={valueStyle}>~2 800</div>
              <div style={subStyle}>kcal · +200 přebytek</div>
            </div>
            <div style={cardStyle}>
              <div style={labelStyle}>Odpočinkový den</div>
              <div style={valueStyle}>~2 400</div>
              <div style={subStyle}>kcal · udržovací</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div style={{ ...cardStyle, borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)' }}>
              <div style={labelStyle}>Bílkoviny</div>
              <div style={{ ...valueStyle, color: '#EF4444' }}>180–200g</div>
              <div style={subStyle}>2,2–2,5 g/kg</div>
            </div>
            <div style={{ ...cardStyle, borderColor: 'rgba(59,130,246,0.2)', background: 'rgba(59,130,246,0.04)' }}>
              <div style={labelStyle}>Sacharidy</div>
              <div style={{ ...valueStyle, color: '#3B82F6' }}>280–350g</div>
              <div style={subStyle}>3,5–4,5 g/kg</div>
            </div>
            <div style={{ ...cardStyle, borderColor: 'rgba(234,179,8,0.2)', background: 'rgba(234,179,8,0.04)' }}>
              <div style={labelStyle}>Tuky</div>
              <div style={{ ...valueStyle, color: '#EAB308' }}>70–90g</div>
              <div style={subStyle}>0,9–1,1 g/kg</div>
            </div>
          </div>

          <div style={{ ...cardStyle, marginTop: 10 }}>
            <div style={labelStyle}>Hydratace</div>
            <div style={{ fontSize: 13, color: '#ccc', lineHeight: 1.6 }}>
              <strong style={{ color: '#D4AF37' }}>3–4 litry vody denně.</strong> V tréninkový den +500 ml navíc. Elektrolyty (sodík, draslík) při tréninku delším než 60 min.
            </div>
          </div>
        </div>
      )}

      {tab === 'timing' && (
        <div>
          {[
            {
              time: '07:00 – Ráno',
              icon: '🌅',
              color: '#F59E0B',
              items: [
                '300–400 kcal · sacharidy + bílkoviny',
                'Ovesná kaše + protein shake nebo vejce',
                'Kreatin 5g + multivitamin',
              ],
            },
            {
              time: 'Pre-workout (60–90 min před)',
              icon: '⚡',
              color: '#D4AF37',
              items: [
                '40–60g sacharidů (rýže, banán, ovesné vločky)',
                '20–30g bílkovin (kuřecí, tvaroh, protein shake)',
                'Kofein 150–200 mg (volitelně) · Kreatin (pokud ráno nevzat)',
              ],
            },
            {
              time: 'Intra-workout',
              icon: '🏋️',
              color: '#3B82F6',
              items: [
                'Voda 500–750 ml',
                'Při tréninku >75 min: 30–40g rychlých sacharidů (sportovní nápoj, banán)',
                'BCAA/EAA (volitelně)',
              ],
            },
            {
              time: 'Post-workout (do 30–60 min)',
              icon: '🔄',
              color: '#10B981',
              items: [
                '40–60g sacharidů (rýže, brambory, ovoce)',
                '30–40g bílkovin (protein shake, kuřecí, tvaroh)',
                'Kreatin 5g (pokud nebyl vzat ráno)',
              ],
            },
            {
              time: 'Večeře (2–3h před spaním)',
              icon: '🌙',
              color: '#8B5CF6',
              items: [
                '30–40g bílkovin (kasein, tvaroh, vejce)',
                'Zelenina, zdravé tuky',
                'Minimalizovat rychlé sacharidy',
              ],
            },
          ].map((meal, i) => (
            <div key={i} style={{ ...cardStyle, borderLeft: `3px solid ${meal.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>{meal.icon}</span>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 700, color: '#fff' }}>{meal.time}</div>
              </div>
              {meal.items.map((item, j) => (
                <div key={j} style={{ fontSize: 12, color: '#aaa', marginBottom: 3, paddingLeft: 4 }}>
                  · {item}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === 'supplements' && (
        <div>
          <div style={{ ...cardStyle, borderColor: 'rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.04)', marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#888' }}>
              Suplementy jsou doplněk, ne náhrada. Priorita: jídlo, spánek, konzistence.
            </div>
          </div>

          {[
            { name: 'Kreatin monohydrát', dose: '5g / den', timing: 'Ráno nebo post-workout', priority: 'ZÁKLAD', color: '#D4AF37', note: 'Nejlépe vědecky podložený suplement. Zvyšuje sílu o 5–15%, svalovou hmotu, kognitivní funkce. Saturace za 3–4 týdny.' },
            { name: 'Protein (syrovátkový)', dose: '25–40g / dávka', timing: 'Post-workout nebo mezi jídly', priority: 'ZÁKLAD', color: '#D4AF37', note: 'Pouze pokud nedosáhneš 180–200g bílkovin z jídla. Whey isolate = nejrychlejší vstřebávání.' },
            { name: 'Kofein', dose: '150–200 mg', timing: '45–60 min před tréninkem', priority: 'VÝKON', color: '#F59E0B', note: 'Zvyšuje sílu, výdrž, fokus. Cykluj – 5 dní on / 2 dny off. Nepij po 14:00 (narušuje spánek).' },
            { name: 'Omega-3 (rybí olej)', dose: '2–3g EPA+DHA / den', timing: 'S jídlem', priority: 'ZDRAVÍ', color: '#3B82F6', note: 'Protizánětlivé, podpora kloubů, kardiovaskulárního zdraví. Důležité při vysokém objemu tréninku.' },
            { name: 'Vitamín D3 + K2', dose: '2 000–4 000 IU D3 + 100 mcg K2', timing: 'Ráno s jídlem', priority: 'ZDRAVÍ', color: '#3B82F6', note: 'Testosteron, imunita, kosti. Většina populace má deficit. K2 zajišťuje správné ukládání vápníku.' },
            { name: 'Magnesium', dose: '300–400 mg', timing: 'Večer před spaním', priority: 'REGENERACE', color: '#10B981', note: 'Kvalita spánku, svalová relaxace, redukce křečí. Preferuj glycinát nebo malát (lepší vstřebávání než oxid).' },
            { name: 'Zinek', dose: '15–25 mg', timing: 'Večer', priority: 'REGENERACE', color: '#10B981', note: 'Testosteron, imunita, hojení. Nekombinuj s vápníkem (snižuje vstřebávání).' },
            { name: 'Beta-alanin', dose: '3,2–6,4g / den', timing: 'Pre-workout nebo s jídlem', priority: 'VOLITELNÉ', color: '#8B5CF6', note: 'Snižuje únavu při opakovaných sériích (8–15 opakování). Způsobuje brnění (parestézie) – normální.' },
          ].map((s, i) => (
            <div key={i} style={{ ...cardStyle, borderLeft: `3px solid ${s.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 700, color: '#fff' }}>{s.name}</div>
                <span style={{ fontSize: 10, fontWeight: 700, color: s.color, background: `${s.color}18`, padding: '2px 8px', borderRadius: 4 }}>
                  {s.priority}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 6 }}>
                <div>
                  <div style={labelStyle}>Dávka</div>
                  <div style={{ fontSize: 13, color: s.color, fontWeight: 600 }}>{s.dose}</div>
                </div>
                <div>
                  <div style={labelStyle}>Načasování</div>
                  <div style={{ fontSize: 13, color: '#aaa' }}>{s.timing}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#666', lineHeight: 1.5 }}>{s.note}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'rules' && (
        <div>
          {[
            {
              title: '80/20 pravidlo',
              icon: '🎯',
              color: '#D4AF37',
              text: '80% jídla z celých, minimálně zpracovaných potravin. 20% flexibilita – pizza, dezert, restaurace. Perfekcionismus vede k selhání.',
            },
            {
              title: 'Bílkoviny jako základ',
              icon: '🥩',
              color: '#EF4444',
              text: 'Každé jídlo = zdroj bílkovin. Kuřecí, hovězí, vejce, tvaroh, ryby, luštěniny. Cíl: 180–200g denně. Bez dostatku bílkovin nerostou svaly.',
            },
            {
              title: 'Sacharidy = palivo',
              icon: '⚡',
              color: '#3B82F6',
              text: 'Nejvíce sacharidů kolem tréninku (pre + post). Rýže, brambory, ovesné vločky, ovoce. Snižuj sacharidy ve dnech odpočinku.',
            },
            {
              title: 'Spánek = suplement #1',
              icon: '😴',
              color: '#8B5CF6',
              text: '7–9 hodin denně. Bez spánku nefunguje žádný trénink ani výživa. GH se vylučuje primárně v noci. Prioritizuj spánek nad vším ostatním.',
            },
            {
              title: 'Konzistence > Perfekce',
              icon: '📅',
              color: '#10B981',
              text: '1 špatný den nezničí výsledky. 1 měsíc špatných návyků ano. Zaměř se na průměr za týden, ne na každý den zvlášť.',
            },
            {
              title: 'Deload = jez stejně',
              icon: '🔄',
              color: '#F59E0B',
              text: 'V deload týdnu (W4, W8, W12, W16) nesniž příjem kalorií. Tělo potřebuje živiny pro regeneraci a superkompenzaci.',
            },
          ].map((rule, i) => (
            <div key={i} style={{ ...cardStyle, borderLeft: `3px solid ${rule.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 20 }}>{rule.icon}</span>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 700, color: '#fff' }}>{rule.title}</div>
              </div>
              <div style={{ fontSize: 12, color: '#aaa', lineHeight: 1.6 }}>{rule.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Autoregulation Guide – Vědecké principy plánu v4
// ============================================================
function AutoregulationGuide() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const sections = [
    {
      id: 'rpe-autoregulation',
      title: 'RPE Autoregulace (Tuchscherer)',
      icon: '🎯',
      color: '#F5C842',
      summary: 'Pokud RPE > cílové o 1+ → sniž váhu o 5%. Pokud RPE < cílové o 1+ → přidej 2.5 kg.',
      content: [
        { label: 'Pravidlo 1', text: 'Každý trénink začínej s plánovanou váhou. Pokud první série má RPE o 1 vyšší než plán → sniž váhu o 5% pro zbývající série.' },
        { label: 'Pravidlo 2', text: 'Pokud RPE je o 1 nižší než plán → přidej 2.5 kg na další sérii (max +5 kg celkem).' },
        { label: 'Pravidlo 3', text: 'RPE > 9.5 na plánovaném RPE 8 = špatný den. Dokonči trénink s −10% váhou. Nezkoušej překonat únavu silou vůle.' },
        { label: 'Pravidlo 4', text: 'Deload (W4, W8, W12) = RPE 6–7 bez výjimky. Cíl: regenerace, ne výkon.' },
      ],
    },
    {
      id: 'double-progression',
      title: 'Double Progression (Fáze 1–2)',
      icon: '📈',
      color: '#6EE7B7',
      summary: 'Nejprve přidej rep (6→8→10), pak přidej váhu (+2.5 kg) a vrať se na 6 repů.',
      content: [
        { label: 'Jak funguje', text: 'Cíl: 4×6–10 @ RPE 7–8. Začni s 6 repy. Každý trénink přidej 1 rep dokud nedosáhneš 10. Pak přidej 2.5 kg a vrať se na 6 repů.' },
        { label: 'Proč to funguje', text: 'Kombináce volumové a intenzitní progrese. Tělo se adaptuje na objem (více repů) i intenzitu (více váhy). Zdroj: Israetel – Scientific Principles of Strength Training.' },
        { label: 'Kdy přestane fungovat', text: 'Kolem W4–5. Pak přecházíš na pyramidu RAMP/TOP SET/BACK-OFF (Fáze 2+).' },
      ],
    },
    {
      id: 'ramp-topset',
      title: 'RAMP / TOP SET / BACK-OFF (Fáze 2–4)',
      icon: '🏔️',
      color: '#93C5FD',
      summary: 'Ramp = příprava na top set. Top set = maximální úsilí. Back-off = −8% pro objem.',
      content: [
        { label: 'RAMP série', text: '2–3 série s 75–85% 1RM. Cíl: aktivace CNS, příprava kloubů, technická příprava. RPE 7.' },
        { label: 'TOP SET', text: '1 série s maximální plánovanou váhou. RPE 8–9. Metoda maximálního úsilí (Zatsiorsky s.81). Toto je hlavní stimul pro sílu.' },
        { label: 'BACK-OFF série', text: '2–3 série s −8% z top setu. RPE 7–8. Cíl: hypertrofický objem bez nadměrné únavy. Zdroj: Tuchscherer – Reactive Training Manual.' },
        { label: 'Příklad W9 Squat', text: 'RAMP: 2×4 @ 145 kg (RPE 7) → TOP SET: 1×2 @ 162.5 kg (RPE 8–9) → BACK-OFF: 2×3 @ 150 kg (RPE 7–8)' },
      ],
    },
    {
      id: 'fatigue-management',
      title: 'Fatigue Management (Israetel)',
      icon: '⚡',
      color: '#F87171',
      summary: 'Únava maskuje fitness. Deload odstraní únavu a odhalí skutečnou sílu.',
      content: [
        { label: 'Princip', text: 'Každý trénink přidává únavu. Únava dočasně snižuje výkon. Deload (W4, W8, W12) odstraní únavu → superkompenzace = nové maximum.' },
        { label: 'Zatsiorského dvou-faktorový model', text: 'Fitness (pozitivní adaptace) + Únava (negativní) = Výkon. Cíl: maximalizovat fitness, minimalizovat únavu. Deload sníží únavu, fitness zůstane.' },
        { label: 'Příznaky přetrénování', text: 'RPE trvale o 1+ vyšší než plán · Spánek zhoršený · Motivace nulová · Klouby bolí. → Přidej deload týden okamžitě.' },
        { label: 'Deload protokol', text: 'Objem −30–50%, intenzita zachována (75–80% 1RM). Žádné nové maxima. Cíl: aktivní regenerace.' },
      ],
    },
    {
      id: 'run-interference',
      title: 'Běh & Interference (Viada)',
      icon: '🏃',
      color: '#A78BFA',
      summary: 'Min. 24h buffer mezi během a deadliftem. HIIT ve středu/sobotu = optimální načasování.',
      content: [
        { label: 'Interference efekt', text: 'Vytrvalostní trénink aktivuje AMPK (katabolická dráha), silový trénink aktivuje mTOR (anabolická dráha). Souběžný trénink může snížit silové zisky o 20–30%. Zdroj: Viada – Hybrid Athlete.' },
        { label: 'Řešení: časový buffer', text: 'Min. 24h mezi během a deadliftem (Čtvrtek → Pátek). Ideálně 48h. Pokud nemožné → HIIT místo běhu v den před deadliftem.' },
        { label: 'HIIT vs. Zone 2', text: 'HIIT (středa/sobota): Silově-vytrvalostní. Kratší, intenzivnější. Méně interference. Zone 2 (čtvrtek): Aerobní základ. Nízká intenzita. Podporuje regeneraci.' },
        { label: 'Taper (W15–16)', text: 'Žádný běh v taperu! Energie musí jít do peakingu. Výjimka: lehká procházka pro aktivní regeneraci.' },
      ],
    },
    {
      id: 'sleep-nutrition',
      title: 'Spánek & Výživa pro sílu',
      icon: '😴',
      color: '#34D399',
      summary: '8+ h spánku. 2.2 g/kg bílkovin. Sacharidy kolem tréninku. Kreatin 5g/den.',
      content: [
        { label: 'Spánek', text: 'Cíl: 8–9 h. Spánek je nejsilnější anabolický stimulus. GH se vylučuje primárně v hlubokém spánku. Méně než 6h → −10–15% síly. Zdroj: Schumann – Strength Training.' },
        { label: 'Bílkoviny', text: '2.0–2.2 g/kg tělesné váhy. Rovnoměrně rozděleno do 4–5 jídel (25–40g/jídlo). Leucin threshold: min. 3g leucinu/jídlo pro maximální MPS.' },
        { label: 'Sacharidy kolem tréninku', text: 'Pre-workout: 40–60g sacharidů 60–90 min před. Post-workout: 40–60g rychlých sacharidů okamžitě po (AMPK/mTOR interference window). Celkový příjem: 4–6g/kg.' },
        { label: 'Suplementace', text: 'Kreatin monohydrát: 5g/den (bez loading). Kofein: 3–6 mg/kg 60 min před. Vitamin D: 2000–4000 IU/den. Omega-3: 2–3g EPA+DHA/den.' },
      ],
    },
  ];

  const cardStyle = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid #1c1c1c',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden' as const,
  };

  return (
    <div>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: '#F5C842', marginBottom: 4 }}>
        Autoregulace & Vědecké principy
      </div>
      <p style={{ fontSize: 12, color: '#555', marginBottom: 16, lineHeight: 1.6 }}>
        Klíčové principy plánu v4 – Israetel, Tuchscherer, Zatsiorsky, Viada, Schumann.
      </p>

      {sections.map(sec => (
        <div key={sec.id} style={cardStyle}>
          <button
            onClick={() => setOpenSection(openSection === sec.id ? null : sec.id)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
              background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${sec.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
              {sec.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: sec.color }}>{sec.title}</div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 2, lineHeight: 1.4 }}>{sec.summary}</div>
            </div>
            <div style={{ color: '#333', fontSize: 12, transition: 'transform 0.2s', transform: openSection === sec.id ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>▼</div>
          </button>

          {openSection === sec.id && (
            <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${sec.color}20` }}>
              {sec.content.map((item, i) => (
                <div key={i} style={{ paddingTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: sec.color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>{item.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Documents Section – Zdrojové dokumenty ke stažení
// ============================================================
function DocumentsSection() {
  const docs = [
    {
      icon: '📋',
      title: 'Tréninkový plán 2026 v4',
      subtitle: 'Zdrojový dokument · 16týdenní vědecky podložený plán',
      type: 'DOCX',
      color: '#F5C842',
      url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663392973146/MCSrHsYMzcpmCEqjyKDjDk/treninkovy-plan-2026-v4_720eaeb5.docx',
      filename: 'treninkovy-plan-2026-v4.docx',
    },
    {
      icon: '📊',
      title: 'Tréninkový deník – analýza 2026',
      subtitle: 'Předchozí období (leden–březen 2026) · Excel analýza',
      type: 'XLSX',
      color: '#6EE7B7',
      url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663392973146/MCSrHsYMzcpmCEqjyKDjDk/treninkovy-denik-analyza-2026-04-10_eb2fdc06.xlsx',
      filename: 'treninkovy-denik-analyza-2026-04-10.xlsx',
    },
    {
      icon: '🏃',
      title: 'Strava profil',
      subtitle: 'Běžecké a kardio aktivity · Strava.com',
      type: 'LINK',
      color: '#FC4C02',
      url: 'https://www.strava.com',
      filename: '',
    },
  ];

  const handleDownload = (doc: typeof docs[0]) => {
    if (doc.type === 'LINK') {
      window.open(doc.url, '_blank');
      return;
    }
    const a = document.createElement('a');
    a.href = doc.url;
    a.download = doc.filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`${doc.title} – stahování zahájeno ✓`);
  };

  return (
    <div>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: '#F5C842', marginBottom: 4 }}>
        Zdrojové dokumenty
      </div>
      <p style={{ fontSize: 12, color: '#555', marginBottom: 20, lineHeight: 1.5 }}>
        Originální dokumenty plánu a předchozího deníku. Vždy dostupné ke stažení.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {docs.map(doc => (
          <button
            key={doc.title}
            onClick={() => handleDownload(doc)}
            style={{
              background: `rgba(${doc.color === '#F5C842' ? '245,200,66' : doc.color === '#6EE7B7' ? '110,231,183' : '252,76,2'},0.06)`,
              border: `1px solid ${doc.color}30`,
              borderRadius: 12,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              width: '100%',
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: `${doc.color}15`,
              border: `1px solid ${doc.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
            }}>
              {doc.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 700, color: '#e0e0e0' }}>{doc.title}</div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{doc.subtitle}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                color: doc.color, background: `${doc.color}15`,
                border: `1px solid ${doc.color}30`,
                borderRadius: 4, padding: '2px 6px',
              }}>
                {doc.type}
              </div>
              <div style={{ color: doc.color, fontSize: 16 }}>{doc.type === 'LINK' ? '↗' : '↓'}</div>
            </div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 20, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid #1c1c1c', borderRadius: 10 }}>
        <div style={{ fontSize: 10, color: '#444', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>ℹ️ O DOKUMENTECH</div>
        <div style={{ fontSize: 11, color: '#555', lineHeight: 1.6 }}>
          Soubory jsou trvale uloženy na CDN a jsou dostupné i po reinstalaci aplikace. Slouží jako záloha a referenční materiál.
        </div>
      </div>
    </div>
  );
}
