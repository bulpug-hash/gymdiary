// Tools Tab – Gold Performance Design
// GymDiary visual system: preserve the dark, compact, yellow-accented training diary layout.
// Features: RPE kalkulačka, tělesná váha tracker, odpočinkový timer, export XLSX, zdrojové dokumenty
import { useState, useEffect, useRef, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { nanoid, formatDate, PHASE3_WEEKS } from '@/lib/data';
import { RECOVERED_HIIT_RECORDS, RECOVERED_RUN_RECORDS } from '@/lib/recoveryData';
import type { WorkoutDataHook } from '@/lib/types';
import * as XLSX from 'xlsx';
import { tint, formatWeight } from '@/lib/tint';
import { useRestTimer, startRest, pauseRest, resumeRest, resetRest, setRestDuration } from '@/lib/restTimer';
import { loadSnapshots, markDownloaded, daysSinceDownload, formatStamp, REMIND_AFTER_DAYS } from '@/lib/backup';
import { plural } from '@/lib/czech';
import { Hero, Marquee } from '@/components/kit';

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
// RPE -> % 1RM podle referenční tabulky pod kalkulačkou (RPE 10 = 100 %, každý stupeň -4 %).
// Mezistupně (8.5, 9.5) se dopočítají lineárně.
function rpeToPercent(rpe: number): number {
  const clamped = Math.min(10, Math.max(6, rpe));
  return (100 - (10 - clamped) * 4) / 100;
}

// Meze vstupu drzime na jednom miste, aby se popisky pod vysledkem shodovaly
// s tim, s cim se opravdu pocitalo. Driv label vypisoval syrovy vstup
// ("99 opakovani") u vysledku spocitaneho z oriznute hodnoty.
export const clampReps = (r: number) => Math.min(20, Math.max(1, Math.round(r) || 1));
export const clampRpe = (r: number) => Math.min(10, Math.max(6, r || 8));
export const clampRM = (v: number) => Math.min(500, Math.max(1, v || 0));

function calcWeightFromRPE(oneRM: number, reps: number, rpe: number): number {
  if (!Number.isFinite(oneRM) || !Number.isFinite(reps) || !Number.isFinite(rpe)) return 0;
  const r = clampReps(reps);
  const ceiling = oneRM * rpeToPercent(rpe);
  // Na jedno opakovani je strop primo ta vaha – Epleyho delitel plati az od dvou.
  const weight = r === 1 ? ceiling : ceiling / (1 + r / 30);
  return Math.round(weight * 2) / 2; // zaokrouhleno na 0,5 kg
}

function calc1RMFromWeight(weight: number, reps: number): number {
  const r = clampReps(reps);
  // Shodne s estimate1RM v lib/data.ts – jedno opakovani UZ je 1RM.
  if (r === 1) return Math.round(weight);
  return Math.round(weight * (1 + r / 30));
}

// ============================================================
// Main Tools Component
// ============================================================
export default function Tools({ workoutData }: Props) {
  const [section, setSection] = useState<'rpe' | 'bodyweight' | 'timer' | 'export' | 'nutrition' | 'autoregulation' | 'documents'>('rpe');

  const sectionBtnStyle = (active: boolean) => ({
    flex: 1,
    padding: '8px 4px',
    background: active ? 'color-mix(in srgb, var(--gd-accent) 10%, transparent)' : 'transparent',
    border: active ? '1px solid color-mix(in srgb, var(--gd-accent) 30%, transparent)' : '1px solid var(--gd-line)',
    borderRadius: 0,
    color: active ? 'var(--gd-accent)' : 'var(--gd-text-4)',
    fontSize: 10,
    fontWeight: active ? 700 : 400,
    letterSpacing: '0.05em',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    textAlign: 'center' as const,
  });

  const SECTION_TITLE: Record<string, string> = {
    rpe: 'RPE kalkulačka', bodyweight: 'Tělesná váha', timer: 'Timer',
    export: 'Export dat', nutrition: 'Výživa', autoregulation: 'Autoregulace',
    documents: 'Dokumenty',
  };

  return (
    <div>
      <Hero
        plate="tools"
        ghost="06"
        kicker="Nástroje"
        title={<>Fitness<br />nástroje</>}
        meta={
          <>
            <b>{SECTION_TITLE[section]}</b>
            <span>·</span>
            <span>RPE · Váha · Timer · Export · Výživa · Autoregulace · Docs</span>
          </>
        }
      />

      <Marquee items={['RPE → váha', 'Váha → 1RM', 'Export do XLS', 'Plán ke stažení', 'Autoregulace podle dne']} />

      <div className="gd-body">
      {/* Section tabs */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--gd-line)' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: 'rpe', label: 'RPE' },
            { key: 'bodyweight', label: 'Váha' },
            { key: 'timer', label: 'Timer' },
            { key: 'export', label: 'Export' },
            { key: 'nutrition', label: 'Výživa' },
            { key: 'autoregulation', label: 'Auto' },
            { key: 'documents', label: 'Docs' },
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

  // Hodnoty po oriznuti drzime zvlast, aby se s nimi vypsal i popisek pod vysledkem.
  const usedReps = clampReps(parseInt(reps));
  const usedRpe = clampRpe(parseFloat(rpe));
  const usedRepsForRM = clampReps(parseInt(repsForRM));

  const suggestedWeight = oneRM && reps && rpe
    ? calcWeightFromRPE(clampRM(parseFloat(oneRM)), usedReps, usedRpe)
    : null;

  const estimated1RM = weight && repsForRM
    ? calc1RMFromWeight(clampRM(parseFloat(weight)), usedRepsForRM)
    : null;

  const inputStyle = {
    background: 'var(--gd-surface)',
    border: '1px solid var(--gd-line)',
    borderRadius: 0,
    color: 'var(--gd-text)',
    padding: '10px 12px',
    fontSize: 14,
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    fontSize: 11,
    color: 'var(--gd-text-3)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    marginBottom: 4,
    display: 'block',
  };

  return (
    <div>
      <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 18, fontWeight: 800, color: 'var(--gd-accent)', marginBottom: 4 }}>
        RPE Kalkulačka
      </div>
      <p style={{ fontSize: 12, color: 'var(--gd-text-4)', marginBottom: 16 }}>
        RPE 10 = absolutní maximum. RPE 8 = 2 opakování v zásobě.
      </p>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => setMode('rpe2weight')}
          style={{
            flex: 1, padding: '8px', borderRadius: 0, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: mode === 'rpe2weight' ? 'var(--gd-accent)' : 'transparent',
            border: mode === 'rpe2weight' ? 'none' : '1px solid var(--gd-line)',
            color: mode === 'rpe2weight' ? 'var(--gd-ink)' : 'var(--gd-text-3)',
          }}
        >RPE → Váha</button>
        <button
          onClick={() => setMode('weight2rm')}
          style={{
            flex: 1, padding: '8px', borderRadius: 0, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: mode === 'weight2rm' ? 'var(--gd-accent)' : 'transparent',
            border: mode === 'weight2rm' ? 'none' : '1px solid var(--gd-line)',
            color: mode === 'weight2rm' ? 'var(--gd-ink)' : 'var(--gd-text-3)',
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
              background: 'color-mix(in srgb, var(--gd-accent) 8%, transparent)',
              border: '1px solid color-mix(in srgb, var(--gd-accent) 20%, transparent)',
              borderRadius: 0,
              padding: '16px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: 'var(--gd-text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Doporučená váha</div>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 48, fontWeight: 900, color: 'var(--gd-accent)', lineHeight: 1 }}>
                {formatWeight(String(suggestedWeight))}
              </div>
              <div style={{ fontSize: 14, color: 'var(--gd-text-3)', marginTop: 4 }}>kg · {usedReps} opakování @ RPE {usedRpe}</div>
            </div>
          )}

          {/* RPE reference table */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10, color: 'var(--gd-text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>RPE Referenční tabulka</div>
            {[
              { rpe: 10, desc: 'Absolutní maximum, 0 reps v zásobě', pct: '100%' },
              { rpe: 9, desc: '1 opakování v zásobě', pct: '96%' },
              { rpe: 8, desc: '2 opakování v zásobě', pct: '92%' },
              { rpe: 7, desc: '3 opakování v zásobě', pct: '88%' },
              { rpe: 6, desc: '4+ opakování v zásobě', pct: '84%' },
            ].map(row => (
              <div key={row.rpe} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--gd-surface)' }}>
                <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 18, fontWeight: 800, color: 'var(--gd-accent)', width: 28 }}>{row.rpe}</div>
                <div style={{ flex: 1, fontSize: 12, color: 'var(--gd-text-3)' }}>{row.desc}</div>
                <div style={{ fontSize: 12, color: 'var(--gd-text-4)', fontWeight: 600 }}>{row.pct}</div>
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
              background: 'color-mix(in srgb, var(--gd-accent) 8%, transparent)',
              border: '1px solid color-mix(in srgb, var(--gd-accent) 20%, transparent)',
              borderRadius: 0,
              padding: '16px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: 'var(--gd-text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Odhadované 1RM</div>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 48, fontWeight: 900, color: 'var(--gd-accent)', lineHeight: 1 }}>
                {estimated1RM}
              </div>
              <div style={{ fontSize: 14, color: 'var(--gd-text-3)', marginTop: 4 }}>kg (Epley formula)</div>
            </div>
          )}

          {/* Quick reference for common %1RM */}
          {estimated1RM && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 10, color: 'var(--gd-text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Procentuální tabulka</div>
              {[100, 95, 90, 85, 80, 75, 70].map(pct => (
                <div key={pct} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', borderBottom: '1px solid var(--gd-surface)' }}>
                  <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 16, fontWeight: 700, color: 'var(--gd-accent)', width: 40 }}>{pct}%</div>
                  <div style={{ flex: 1, fontSize: 12, color: 'var(--gd-text-3)' }}>
                    {pct === 100 ? '1 rep' : pct >= 90 ? '2-3 reps' : pct >= 85 ? '4-5 reps' : pct >= 80 ? '5-6 reps' : pct >= 75 ? '8-10 reps' : '12-15 reps'}
                  </div>
                  <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 18, fontWeight: 800, color: 'var(--gd-text)' }}>
                    {formatWeight(String(Math.round(estimated1RM * pct / 100 * 2) / 2))} kg
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
    background: 'var(--gd-surface)',
    border: '1px solid var(--gd-line)',
    borderRadius: 0,
    color: 'var(--gd-text)',
    padding: '10px 12px',
    fontSize: 14,
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    fontSize: 11,
    color: 'var(--gd-text-3)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    marginBottom: 4,
    display: 'block',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 18, fontWeight: 800, color: 'var(--gd-accent)' }}>
            Tělesná váha
          </div>
          {latest && (
            <div style={{ fontSize: 12, color: 'var(--gd-text-3)', marginTop: 2 }}>
              Poslední: {formatWeight(String(latest.weight))} kg · {formatDate(latest.date)}
              {change !== null && (
                <span style={{ color: change < 0 ? 'var(--gd-fern)' : 'var(--gd-danger)', marginLeft: 8, fontWeight: 600 }}>
                  {change > 0 ? '+' : ''}{change.toFixed(1)} kg
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: 'var(--gd-accent)', border: 'none', borderRadius: 0,
            color: 'var(--gd-ink)', fontSize: 12, fontWeight: 700, padding: '8px 14px',
            cursor: 'pointer',
          }}
        >+ Přidat</button>
      </div>

      {showForm && (
        <div style={{
          background: 'var(--gd-surface)',
          border: '1px solid color-mix(in srgb, var(--gd-accent) 20%, transparent)',
          borderRadius: 0,
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
            <button onClick={addEntry} style={{ flex: 1, background: 'var(--gd-accent)', border: 'none', borderRadius: 0, color: 'var(--gd-ink)', fontSize: 13, fontWeight: 700, padding: '9px', cursor: 'pointer' }}>
              Uložit
            </button>
            <button onClick={() => setShowForm(false)} style={{ padding: '9px 14px', background: 'transparent', border: '1px solid var(--gd-line)', borderRadius: 0, color: 'var(--gd-text-3)', fontSize: 13, cursor: 'pointer' }}>
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
              <XAxis dataKey="date" tick={{ fill: 'var(--gd-text-4)', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--gd-text-4)', fontSize: 9 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ background: 'var(--gd-surface)', border: '1px solid var(--gd-line)', borderRadius: 0, fontSize: 12 }}
                labelStyle={{ color: 'var(--gd-text-3)' }}
                itemStyle={{ color: 'var(--gd-accent)' }}
                formatter={(v: number) => [`${v} kg`, 'Váha']}
              />
              <Line type="monotone" dataKey="weight" stroke="var(--gd-accent)" strokeWidth={2} dot={{ fill: 'var(--gd-accent)', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Entries list */}
      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--gd-text-4)' }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.24em', marginBottom: 10, color: 'var(--gd-text-4)' }}>VÁHA</div>
          <div style={{ fontSize: 13 }}>Žádné záznamy. Přidej první měření!</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 10, color: 'var(--gd-text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>ZÁZNAMY</div>
          {[...sorted].reverse().slice(0, 10).map((entry, idx) => (
            <div
              key={entry.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px',
                background: idx === 0 ? 'color-mix(in srgb, var(--gd-accent) 5%, transparent)' : 'color-mix(in srgb, var(--gd-text) 2%, transparent)',
                border: idx === 0 ? '1px solid color-mix(in srgb, var(--gd-accent) 15%, transparent)' : '1px solid var(--gd-line)',
                borderRadius: 0,
                marginBottom: 6,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--gd-text-3)' }}>{formatDate(entry.date)}</div>
                {entry.note && <div style={{ fontSize: 11, color: 'var(--gd-text-4)', marginTop: 1 }}>{entry.note}</div>}
              </div>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 20, fontWeight: 800, color: 'var(--gd-accent)' }}>
                {formatWeight(String(entry.weight))} kg
              </div>
              <button
                onClick={() => deleteEntry(entry.id)}
                style={{ background: 'none', border: 'none', color: 'var(--gd-line)', fontSize: 14, cursor: 'pointer', padding: 4 }}
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
  // Stav timeru je sdileny (lib/restTimer) - stejny odpocet vidis i v plovouci
  // liste nad navigaci a prezije prepnuti zalozky.
  const { running, remaining, duration } = useRestTimer();

  const presets = [60, 90, 120, 180, 240, 300];

  const startStop = useCallback(() => {
    if (running) pauseRest();
    else if (remaining > 0) resumeRest();
    else startRest(duration, 'ručně');
  }, [running, remaining, duration]);

  const reset = useCallback(() => resetRest(duration), [duration]);
  const setDuration = useCallback((s: number) => setRestDuration(s), []);

  const pct = duration > 0 ? remaining / duration : 0;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const circumference = 2 * Math.PI * 54;

  return (
    <div>
      <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 18, fontWeight: 800, color: 'var(--gd-accent)', marginBottom: 4 }}>
        Odpočinkový timer
      </div>
      <p style={{ fontSize: 12, color: 'var(--gd-text-4)', marginBottom: 20 }}>
        Nastav délku odpočinku a spusť timer po sérii.
      </p>

      {/* Circular timer */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <div style={{ position: 'relative', width: 140, height: 140 }}>
          <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="70" cy="70" r="54" fill="none" stroke="var(--gd-line)" strokeWidth="8" />
            <circle
              cx="70" cy="70" r="54"
              fill="none"
              stroke={pct > 0.3 ? 'var(--gd-accent)' : 'var(--gd-danger)'}
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
            <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 32, fontWeight: 900, color: 'var(--gd-text)', lineHeight: 1 }}>
              {mins}:{secs.toString().padStart(2, '0')}
            </div>
            <div style={{ fontSize: 10, color: 'var(--gd-text-4)', marginTop: 2 }}>{running ? 'BĚŽÍ' : 'STOP'}</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button
          onClick={startStop}
          style={{
            flex: 2,
            background: running ? 'color-mix(in srgb, var(--gd-danger) 15%, transparent)' : 'var(--gd-accent)',
            border: running ? '1px solid color-mix(in srgb, var(--gd-danger) 30%, transparent)' : 'none',
            borderRadius: 0,
            color: running ? 'var(--gd-danger)' : 'var(--gd-ink)',
            fontSize: 16,
            fontWeight: 800,
            padding: '14px',
            cursor: 'pointer',
            fontFamily: 'Archivo, sans-serif', fontStretch: '118%',
            letterSpacing: '0.05em',
          }}
        >
          {running ? 'PAUZA' : remaining > 0 && remaining < duration ? 'POKRAČOVAT' : 'START'}
        </button>
        <button
          onClick={reset}
          style={{
            flex: 1,
            background: 'color-mix(in srgb, var(--gd-text) 4%, transparent)',
            border: '1px solid var(--gd-line)',
            borderRadius: 0,
            color: 'var(--gd-text-3)',
            fontSize: 14,
            fontWeight: 600,
            padding: '14px',
            cursor: 'pointer',
          }}
        >Reset</button>
      </div>

      {/* Presets */}
      <div style={{ fontSize: 10, color: 'var(--gd-text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>RYCHLÉ NASTAVENÍ</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {presets.map(s => (
          <button
            key={s}
            onClick={() => setDuration(s)}
            style={{
              padding: '7px 12px',
              background: duration === s ? 'color-mix(in srgb, var(--gd-accent) 15%, transparent)' : 'color-mix(in srgb, var(--gd-text) 3%, transparent)',
              border: duration === s ? '1px solid color-mix(in srgb, var(--gd-accent) 30%, transparent)' : '1px solid var(--gd-line)',
              borderRadius: 0,
              color: duration === s ? 'var(--gd-accent)' : 'var(--gd-text-4)',
              fontSize: 12,
              fontWeight: duration === s ? 700 : 400,
              cursor: 'pointer',
            }}
          >
            {s >= 60 ? `${String(s / 60).replace('.', ',')} min` : `${s} s`}
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
    // revokeObjectURL až po tiku – na iOS Safari může okamžité zrušení
    // přerušit stahování.
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    markDownloaded();
    toast.success('JSON záloha stažena');
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

  const snapshots = loadSnapshots();
  const sinceDownload = daysSinceDownload();
  const stale = sinceDownload === null || sinceDownload >= REMIND_AFTER_DAYS;

  const restoreSnapshot = (index: number) => {
    const snap = snapshots[index];
    if (!snap) return;
    try {
      localStorage.setItem('gymdiary_records_v3', JSON.stringify(snap.records));
      toast.success('Záloha obnovena. Aplikace se načte znovu.');
      setTimeout(() => window.location.reload(), 900);
    } catch {
      toast.error('Obnovení se nepovedlo');
    }
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
      ['Název plánu', 'Tréninkový plán Podzim 2026 v5.2'],
      ['Začátek plánu', '31. 8. 2026'],
      ['Konec plánu', '29. 11. 2026'],
      ['Počet týdnů', '13'],
      ['Fáze 1', 'Akumulace W1–4 (31.8.–27.9.2026)'],
      ['Fáze 2', 'Síla W5–8 (28.9.–25.10.2026)'],
      ['Fáze 3', 'Intenzifikace W9–11 (26.10.–15.11.2026)'],
      ['Fáze 4', 'Taper+Test W12–13 (16.–29.11.2026)'],
      ['Cíl Squat', '190 kg (1RM)'],
      ['Cíl Bench Press', '130 kg (1RM)'],
      ['Cíl Deadlift', '230 kg (1RM)'],
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
      <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 18, fontWeight: 800, color: 'var(--gd-accent)', marginBottom: 4 }}>
        Export dat
      </div>
      <p style={{ fontSize: 12, color: 'var(--gd-text-4)', marginBottom: 20 }}>
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
            flex: 1, background: 'color-mix(in srgb, var(--gd-text) 2%, transparent)', border: '1px solid var(--gd-line)',
            borderRadius: 0, padding: '10px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 24, fontWeight: 800, color: 'var(--gd-accent)' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--gd-text-4)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Automatická záloha */}
      <div style={{ marginBottom: 18, border: `1px solid ${stale ? 'color-mix(in srgb, var(--gd-danger) 35%, transparent)' : 'var(--gd-line)'}`, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
          <span className="gd-tag" style={{ flex: 1 }}>Automatická záloha</span>
          <span style={{ fontSize: 10, color: 'var(--gd-text-4)' }}>
            {snapshots.length} {plural(snapshots.length, 'otisk', 'otisky', 'otisků')}
          </span>
        </div>
        <p style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--gd-text-3)', margin: '0 0 10px' }}>
          Appka si sama jednou denně ukládá otisk záznamů do prohlížeče. Je to pojistka
          proti překlepu, ne proti vyčištění dat — na to si stáhni zálohu do souboru.
        </p>
        {snapshots.map((snap, i) => (
          <div key={snap.ts} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: '1px solid var(--gd-line)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: 'var(--gd-text-2)' }}>{formatStamp(snap.ts)}</div>
              <div style={{ fontSize: 10, color: 'var(--gd-text-4)' }}>
                {snap.count} {plural(snap.count, 'záznam', 'záznamy', 'záznamů')}
              </div>
            </div>
            <button
              onClick={() => restoreSnapshot(i)}
              style={{
                background: 'transparent', border: '1px solid var(--gd-line)', borderRadius: 0,
                color: 'var(--gd-text-3)', fontSize: 9, fontWeight: 700, letterSpacing: '0.16em',
                textTransform: 'uppercase', padding: '9px 11px', cursor: 'pointer',
              }}
            >Obnovit</button>
          </div>
        ))}
        {stale && (
          <div style={{ marginTop: 10, paddingLeft: 10, borderLeft: '2px solid var(--gd-danger)', fontSize: 11, lineHeight: 1.6, color: 'var(--gd-danger)' }}>
            {sinceDownload === null
              ? 'Zálohu do souboru sis ještě nikdy nestáhl.'
              : `Poslední stažená záloha je ${sinceDownload} ${plural(sinceDownload, 'den', 'dny', 'dní')} stará.`}
          </div>
        )}
      </div>

      {/* Export buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={exportXLSX}
          style={{
            background: 'color-mix(in srgb, var(--gd-accent) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--gd-accent) 20%, transparent)',
            borderRadius: 0,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            textAlign: 'left',
            width: '100%',
          }}
        >
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--gd-accent)' }}>XLS</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 16, fontWeight: 700, color: 'var(--gd-accent)' }}>Export tréninků (XLSX)</div>
            <div style={{ fontSize: 11, color: 'var(--gd-text-3)', marginTop: 2 }}>{totalRecords} záznamů · 4 listy: Záznamy, Souhrn cviků, Souhrn týdnů, Metadata</div>
          </div>
          <div style={{ color: 'var(--gd-accent)', fontSize: 16 }}>↓</div>
        </button>

        <button
          onClick={exportBodyWeight}
          style={{
            background: 'color-mix(in srgb, var(--gd-fern) 6%, transparent)',
            border: '1px solid color-mix(in srgb, var(--gd-fern) 15%, transparent)',
            borderRadius: 0,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            textAlign: 'left',
            width: '100%',
          }}
        >
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--gd-fern)' }}>KG</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 16, fontWeight: 700, color: 'var(--gd-fern)' }}>Export tělesné váhy (XLSX)</div>
            <div style={{ fontSize: 11, color: 'var(--gd-text-3)', marginTop: 2 }}>{bwCount} záznamů · 1 list</div>
          </div>
          <div style={{ color: 'var(--gd-fern)', fontSize: 16 }}>↓</div>
        </button>

        <button
          onClick={exportBackup}
          style={{ background: 'color-mix(in srgb, var(--gd-text-2) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--gd-text-2) 18%, transparent)', borderRadius: 0, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left', width: '100%' }}
        >
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--gd-text-2)' }}>JSON</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 16, fontWeight: 700, color: 'var(--gd-text-2)' }}>Kompletní záloha (JSON)</div>
            <div style={{ fontSize: 11, color: 'var(--gd-text-3)', marginTop: 2 }}>Cviky, běhy, HIIT i tělesná váha · soubor lze později načíst zpět</div>
          </div>
          <div style={{ color: 'var(--gd-text-2)', fontSize: 16 }}>↓</div>
        </button>

        <input ref={backupInputRef} type="file" accept="application/json,.json" onChange={importBackup} style={{ display: 'none' }} />
        <button
          onClick={() => backupInputRef.current?.click()}
          style={{ background: 'transparent', border: '1px dashed color-mix(in srgb, var(--gd-text-2) 28%, transparent)', borderRadius: 0, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left', width: '100%' }}
        >
          <span style={{ fontSize: 20 }}>↑</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 15, fontWeight: 700, color: 'var(--gd-text-2)' }}>Načíst zálohu (JSON)</div>
            <div style={{ fontSize: 11, color: 'var(--gd-text-3)', marginTop: 2 }}>Obnoví data do tohoto prohlížeče a aplikace se znovu načte</div>
          </div>
        </button>
      </div>

      <div style={{ marginTop: 16, padding: '10px 12px', background: 'color-mix(in srgb, var(--gd-accent) 4%, transparent)', border: '1px solid color-mix(in srgb, var(--gd-accent) 15%, transparent)', borderRadius: 0 }}>
        <div style={{ fontSize: 10, color: 'var(--gd-accent)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>XLSX STRUKTURA (identická se starým deníkem)</div>
        <div style={{ fontSize: 11, color: 'var(--gd-text-3)', lineHeight: 1.6 }}>
          <b style={{color:'var(--gd-text-2)'}}>Záznamy</b> – všechny zápisy s datem, cvikem, váhou, objemem<br/>
          <b style={{color:'var(--gd-text-2)'}}>Souhrn cviků</b> – max váha, trend, celkový objem<br/>
          <b style={{color:'var(--gd-text-2)'}}>Souhrn týdnů</b> – objem a počet záznamů po týdních<br/>
          <b style={{color:'var(--gd-text-2)'}}>Metadata</b> – informace o plánu a exportu
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
    borderRadius: 0,
    border: 'none',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    background: active ? 'var(--gd-accent)' : 'color-mix(in srgb, var(--gd-text) 4%, transparent)',
    color: active ? 'var(--gd-ink)' : 'var(--gd-text-3)',
    transition: 'all 0.2s',
  });

  const cardStyle = {
    background: 'color-mix(in srgb, var(--gd-text) 3%, transparent)',
    border: '1px solid var(--gd-line)',
    borderRadius: 0,
    padding: '14px 16px',
    marginBottom: 10,
  };

  const labelStyle = { fontSize: 10, color: 'var(--gd-text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 4 };
  const valueStyle = { fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 22, fontWeight: 700, color: 'var(--gd-accent)' };
  const subStyle = { fontSize: 12, color: 'var(--gd-text-3)', marginTop: 2 };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 20, fontWeight: 700, color: 'var(--gd-text)', marginBottom: 4 }}>
          Výživa & Suplementace
        </div>
        <div style={{ fontSize: 12, color: 'var(--gd-text-3)' }}>Protokol z vědecky podloženého plánu 2026 v4</div>
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
          <div style={{ ...cardStyle, borderColor: 'color-mix(in srgb, var(--gd-accent) 20%, transparent)', background: 'color-mix(in srgb, var(--gd-accent) 4%, transparent)' }}>
            <div style={labelStyle}>Cíl – Rekomposice těla</div>
            <div style={{ fontSize: 13, color: 'var(--gd-text-2)', lineHeight: 1.6 }}>
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
            <div style={{ ...cardStyle, borderColor: 'color-mix(in srgb, var(--gd-danger) 20%, transparent)', background: 'color-mix(in srgb, var(--gd-danger) 4%, transparent)' }}>
              <div style={labelStyle}>Bílkoviny</div>
              <div style={{ ...valueStyle, color: 'var(--gd-danger)' }}>180–200g</div>
              <div style={subStyle}>2,2–2,5 g/kg</div>
            </div>
            <div style={{ ...cardStyle, borderColor: 'color-mix(in srgb, var(--gd-text-2) 20%, transparent)', background: 'color-mix(in srgb, var(--gd-text-2) 4%, transparent)' }}>
              <div style={labelStyle}>Sacharidy</div>
              <div style={{ ...valueStyle, color: 'var(--gd-text-2)' }}>280–350g</div>
              <div style={subStyle}>3,5–4,5 g/kg</div>
            </div>
            <div style={{ ...cardStyle, borderColor: 'color-mix(in srgb, var(--gd-accent) 20%, transparent)', background: 'color-mix(in srgb, var(--gd-accent) 4%, transparent)' }}>
              <div style={labelStyle}>Tuky</div>
              <div style={{ ...valueStyle, color: 'var(--gd-accent)' }}>70–90g</div>
              <div style={subStyle}>0,9–1,1 g/kg</div>
            </div>
          </div>

          <div style={{ ...cardStyle, marginTop: 10 }}>
            <div style={labelStyle}>Hydratace</div>
            <div style={{ fontSize: 13, color: 'var(--gd-text-2)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--gd-accent)' }}>3–4 litry vody denně.</strong> V tréninkový den +500 ml navíc. Elektrolyty (sodík, draslík) při tréninku delším než 60 min.
            </div>
          </div>
        </div>
      )}

      {tab === 'timing' && (
        <div>
          {[
            {
              time: '07:00 – Ráno',
              icon: 'AM',
              color: 'var(--gd-accent)',
              items: [
                '300–400 kcal · sacharidy + bílkoviny',
                'Ovesná kaše + protein shake nebo vejce',
                'Kreatin 5g + multivitamin',
              ],
            },
            {
              time: 'Pre-workout (60–90 min před)',
              icon: 'PRE',
              color: 'var(--gd-accent)',
              items: [
                '40–60g sacharidů (rýže, banán, ovesné vločky)',
                '20–30g bílkovin (kuřecí, tvaroh, protein shake)',
                'Kofein 150–200 mg (volitelně) · Kreatin (pokud ráno nevzat)',
              ],
            },
            {
              time: 'Intra-workout',
              icon: 'INT',
              color: 'var(--gd-text-2)',
              items: [
                'Voda 500–750 ml',
                'Při tréninku >75 min: 30–40g rychlých sacharidů (sportovní nápoj, banán)',
                'BCAA/EAA (volitelně)',
              ],
            },
            {
              time: 'Post-workout (do 30–60 min)',
              icon: 'PST',
              color: 'var(--gd-fern)',
              items: [
                '40–60g sacharidů (rýže, brambory, ovoce)',
                '30–40g bílkovin (protein shake, kuřecí, tvaroh)',
                'Kreatin 5g (pokud nebyl vzat ráno)',
              ],
            },
            {
              time: 'Večeře (2–3h před spaním)',
              icon: 'PM',
              color: 'var(--gd-text-2)',
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
                <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 15, fontWeight: 700, color: 'var(--gd-text)' }}>{meal.time}</div>
              </div>
              {meal.items.map((item, j) => (
                <div key={j} style={{ fontSize: 12, color: 'var(--gd-text-2)', marginBottom: 3, paddingLeft: 4 }}>
                  · {item}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === 'supplements' && (
        <div>
          <div style={{ ...cardStyle, borderColor: 'color-mix(in srgb, var(--gd-accent) 20%, transparent)', background: 'color-mix(in srgb, var(--gd-accent) 4%, transparent)', marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--gd-text-3)' }}>
              Suplementy jsou doplněk, ne náhrada. Priorita: jídlo, spánek, konzistence.
            </div>
          </div>

          {[
            { name: 'Kreatin monohydrát', dose: '5g / den', timing: 'Ráno nebo post-workout', priority: 'ZÁKLAD', color: 'var(--gd-accent)', note: 'Nejlépe vědecky podložený suplement. Zvyšuje sílu o 5–15%, svalovou hmotu, kognitivní funkce. Saturace za 3–4 týdny.' },
            { name: 'Protein (syrovátkový)', dose: '25–40g / dávka', timing: 'Post-workout nebo mezi jídly', priority: 'ZÁKLAD', color: 'var(--gd-accent)', note: 'Pouze pokud nedosáhneš 180–200g bílkovin z jídla. Whey isolate = nejrychlejší vstřebávání.' },
            { name: 'Kofein', dose: '150–200 mg', timing: '45–60 min před tréninkem', priority: 'VÝKON', color: 'var(--gd-accent)', note: 'Zvyšuje sílu, výdrž, fokus. Cykluj – 5 dní on / 2 dny off. Nepij po 14:00 (narušuje spánek).' },
            { name: 'Omega-3 (rybí olej)', dose: '2–3g EPA+DHA / den', timing: 'S jídlem', priority: 'ZDRAVÍ', color: 'var(--gd-text-2)', note: 'Protizánětlivé, podpora kloubů, kardiovaskulárního zdraví. Důležité při vysokém objemu tréninku.' },
            { name: 'Vitamín D3 + K2', dose: '2 000–4 000 IU D3 + 100 mcg K2', timing: 'Ráno s jídlem', priority: 'ZDRAVÍ', color: 'var(--gd-text-2)', note: 'Testosteron, imunita, kosti. Většina populace má deficit. K2 zajišťuje správné ukládání vápníku.' },
            { name: 'Magnesium', dose: '300–400 mg', timing: 'Večer před spaním', priority: 'REGENERACE', color: 'var(--gd-fern)', note: 'Kvalita spánku, svalová relaxace, redukce křečí. Preferuj glycinát nebo malát (lepší vstřebávání než oxid).' },
            { name: 'Zinek', dose: '15–25 mg', timing: 'Večer', priority: 'REGENERACE', color: 'var(--gd-fern)', note: 'Testosteron, imunita, hojení. Nekombinuj s vápníkem (snižuje vstřebávání).' },
            { name: 'Beta-alanin', dose: '3,2–6,4g / den', timing: 'Pre-workout nebo s jídlem', priority: 'VOLITELNÉ', color: 'var(--gd-text-2)', note: 'Snižuje únavu při opakovaných sériích (8–15 opakování). Způsobuje brnění (parestézie) – normální.' },
          ].map((s, i) => (
            <div key={i} style={{ ...cardStyle, borderLeft: `3px solid ${s.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 16, fontWeight: 700, color: 'var(--gd-text)' }}>{s.name}</div>
                <span style={{ fontSize: 10, fontWeight: 700, color: s.color, background: `${tint(s.color, 9)}`, padding: '2px 8px', borderRadius: 0 }}>
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
                  <div style={{ fontSize: 13, color: 'var(--gd-text-2)' }}>{s.timing}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--gd-text-3)', lineHeight: 1.5 }}>{s.note}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'rules' && (
        <div>
          {[
            {
              title: '80/20 pravidlo',
              icon: '80/20',
              color: 'var(--gd-accent)',
              text: '80% jídla z celých, minimálně zpracovaných potravin. 20% flexibilita – pizza, dezert, restaurace. Perfekcionismus vede k selhání.',
            },
            {
              title: 'Bílkoviny jako základ',
              icon: 'BÍL',
              color: 'var(--gd-danger)',
              text: 'Každé jídlo = zdroj bílkovin. Kuřecí, hovězí, vejce, tvaroh, ryby, luštěniny. Cíl: 180–200g denně. Bez dostatku bílkovin nerostou svaly.',
            },
            {
              title: 'Sacharidy = palivo',
              icon: 'SAC',
              color: 'var(--gd-text-2)',
              text: 'Nejvíce sacharidů kolem tréninku (pre + post). Rýže, brambory, ovesné vločky, ovoce. Snižuj sacharidy ve dnech odpočinku.',
            },
            {
              title: 'Spánek = suplement #1',
              icon: 'SPÁ',
              color: 'var(--gd-text-2)',
              text: '7–9 hodin denně. Bez spánku nefunguje žádný trénink ani výživa. GH se vylučuje primárně v noci. Prioritizuj spánek nad vším ostatním.',
            },
            {
              title: 'Konzistence > Perfekce',
              icon: 'KON',
              color: 'var(--gd-fern)',
              text: '1 špatný den nezničí výsledky. 1 měsíc špatných návyků ano. Zaměř se na průměr za týden, ne na každý den zvlášť.',
            },
            {
              title: 'Deload = jez stejně',
              icon: 'DL',
              color: 'var(--gd-accent)',
              text: 'V deload týdnu (W4, W8, W12, W16) nesniž příjem kalorií. Tělo potřebuje živiny pro regeneraci a superkompenzaci.',
            },
          ].map((rule, i) => (
            <div key={i} style={{ ...cardStyle, borderLeft: `3px solid ${rule.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 20 }}>{rule.icon}</span>
                <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 16, fontWeight: 700, color: 'var(--gd-text)' }}>{rule.title}</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--gd-text-2)', lineHeight: 1.6 }}>{rule.text}</div>
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
      icon: 'RPE',
      color: 'var(--gd-accent)',
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
      icon: 'DP',
      color: 'var(--gd-fern)',
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
      icon: 'RMP',
      color: 'var(--gd-text-2)',
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
      icon: 'FTG',
      color: 'var(--gd-danger)',
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
      icon: 'RUN',
      color: 'var(--gd-text-2)',
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
      icon: 'SPÁ',
      color: 'var(--gd-fern)',
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
    background: 'color-mix(in srgb, var(--gd-text) 2%, transparent)',
    border: '1px solid var(--gd-line)',
    borderRadius: 0,
    marginBottom: 8,
    overflow: 'hidden' as const,
  };

  return (
    <div>
      <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 18, fontWeight: 800, color: 'var(--gd-accent)', marginBottom: 4 }}>
        Autoregulace & Vědecké principy
      </div>
      <p style={{ fontSize: 12, color: 'var(--gd-text-4)', marginBottom: 16, lineHeight: 1.6 }}>
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
            <div style={{ width: 32, height: 32, borderRadius: 0, background: `${tint(sec.color, 8)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
              {sec.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: sec.color }}>{sec.title}</div>
              <div style={{ fontSize: 11, color: 'var(--gd-text-4)', marginTop: 2, lineHeight: 1.4 }}>{sec.summary}</div>
            </div>
            <div style={{ color: 'var(--gd-line)', fontSize: 12, transition: 'transform 0.2s', transform: openSection === sec.id ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>▼</div>
          </button>

          {openSection === sec.id && (
            <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${tint(sec.color, 13)}` }}>
              {sec.content.map((item, i) => (
                <div key={i} style={{ paddingTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: sec.color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gd-text-3)', lineHeight: 1.6 }}>{item.text}</div>
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
      icon: 'DOC',
      title: 'Tréninkový plán Podzim 2026 v5.2',
      subtitle: 'Zdrojový dokument · 13týdenní peaking plán · 31. 8. – 29. 11. 2026',
      type: 'DOCX',
      color: 'var(--gd-accent)',
      url: './docs/treninkovy-plan-podzim-2026-v5.2.docx',
      filename: 'Treninkovy_plan_Podzim_2026_v5.2.docx',
    },
    {
      icon: 'RUN',
      title: 'Strava profil',
      subtitle: 'Běžecké a kardio aktivity · Strava.com',
      type: 'LINK',
      color: 'var(--gd-fern)',
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
      <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 18, fontWeight: 800, color: 'var(--gd-accent)', marginBottom: 4 }}>
        Zdrojové dokumenty
      </div>
      <p style={{ fontSize: 12, color: 'var(--gd-text-4)', marginBottom: 20, lineHeight: 1.5 }}>
        Originální dokumenty plánu a předchozího deníku. Vždy dostupné ke stažení.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {docs.map(doc => (
          <button
            key={doc.title}
            onClick={() => handleDownload(doc)}
            style={{
              background: `rgba(${doc.color === 'var(--gd-accent)' ? '245,200,66' : doc.color === 'var(--gd-fern)' ? '110,231,183' : '252,76,2'},0.06)`,
              border: `1px solid ${tint(doc.color, 19)}`,
              borderRadius: 0,
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
              width: 44, height: 44, borderRadius: 0,
              background: `${tint(doc.color, 8)}`,
              border: `1px solid ${tint(doc.color, 19)}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
            }}>
              {doc.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 15, fontWeight: 700, color: 'var(--gd-text)' }}>{doc.title}</div>
              <div style={{ fontSize: 11, color: 'var(--gd-text-3)', marginTop: 2 }}>{doc.subtitle}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                color: doc.color, background: `${tint(doc.color, 8)}`,
                border: `1px solid ${tint(doc.color, 19)}`,
                borderRadius: 0, padding: '2px 6px',
              }}>
                {doc.type}
              </div>
              <div style={{ color: doc.color, fontSize: 16 }}>{doc.type === 'LINK' ? '↗' : '↓'}</div>
            </div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 20, padding: '12px 14px', background: 'color-mix(in srgb, var(--gd-text) 2%, transparent)', border: '1px solid var(--gd-line)', borderRadius: 0 }}>
        <div style={{ fontSize: 10, color: 'var(--gd-text-4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>O DOKUMENTECH</div>
        <div style={{ fontSize: 11, color: 'var(--gd-text-4)', lineHeight: 1.6 }}>
          Soubory jsou trvale uloženy na CDN a jsou dostupné i po reinstalaci aplikace. Slouží jako záloha a referenční materiál.
        </div>
      </div>
    </div>
  );
}
