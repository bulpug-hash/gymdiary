// Gold Performance Design – Diary Tab
// GymDiary visual system: preserve the dark, compact, yellow-accented training diary layout.
// BUG FIX: editace záznamu správně předává date, sets, weight, reps, note
// NOVÉ: cviky rozděleny podle tréninkových dnů (Po/Út/Čt/Pá/So)
import { useState, useEffect } from 'react';
import { PHASE3_WEEKS, getCategoryColor, getCategoryLabel, formatDate, formatDateFull, getTodayISO, RUN_LOG_KEY, HIIT_LOG_KEY } from '@/lib/data';
import { RECOVERED_HIIT_RECORDS, RECOVERED_RUN_RECORDS } from '@/lib/recoveryData';
import type { WorkoutDataHook } from '@/lib/types';
import type { Exercise, TrainingRecord, WorkoutDay, RunRecord, HIITRecord } from '@/lib/data';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';

interface Props {
  workoutData: WorkoutDataHook;
}

const DAY_TYPE_LABEL: Record<string, string> = {
  lower: 'LOWER BODY',
  upper: 'UPPER BODY',
  fullbody: 'FULL BODY',
  hiit: 'HIIT / KARDIO',
  run: 'ZONE 2 RUN',
  rest: 'VOLNO',
};

const DAY_TYPE_COLOR: Record<string, string> = {
  lower: '#F5C842',
  upper: '#6EE7B7',
  fullbody: '#93C5FD',
  hiit: '#F87171',
  run: '#A78BFA',
  rest: '#555',
};

// Get unique training days from Phase 3 week 1 (excluding rest)
function getTrainingDays(): WorkoutDay[] {
  const week = PHASE3_WEEKS[0];
  return week.days.filter(d => d.type !== 'rest' && d.exercises.length > 0);
}

export default function Diary({ workoutData }: Props) {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TrainingRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'exercises' | 'runs' | 'hiit'>('exercises');

  const trainingDays = getTrainingDays();

  if (selectedExercise) {
    return (
      <ExerciseDetail
        exercise={selectedExercise}
        workoutData={workoutData}
        onBack={() => { setSelectedExercise(null); setShowAddForm(false); setEditingRecord(null); }}
        showAddForm={showAddForm}
        setShowAddForm={setShowAddForm}
        editingRecord={editingRecord}
        setEditingRecord={setEditingRecord}
      />
    );
  }

  return (
    <div style={{ padding: '0 0 16px' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #1c1c1c' }}>
        <div style={{ color: '#F5C842', fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
          TRÉNINKOVÝ DENÍK
        </div>
        <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#f0f0f0' }}>
          {activeTab === 'exercises' ? 'Záznamy cviků' : activeTab === 'runs' ? 'Běžecký log' : 'HIIT log'}
        </h2>
        <p style={{ color: '#666', fontSize: 12, marginTop: 6 }}>
          {activeTab === 'exercises' ? 'Vyber tréninkový den a cvik pro zobrazení a přidání záznamů.' : activeTab === 'runs' ? 'Záznamy běhů – čas, vzdálenost, tepová zóna.' : 'HIIT tréninky – Tabata, Circuit, AMRAP, EMOM. Tepovka, kalorie, Strava.'}
        </p>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', padding: '10px 20px', gap: 8, borderBottom: '1px solid #1c1c1c' }}>
        {([
          { key: 'exercises', label: '🏋️‍♂️ Cviky' },
          { key: 'runs', label: '🏃 Běhy' },
          { key: 'hiit', label: '🔥 HIIT' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: '8px', borderRadius: 8,
              border: activeTab === tab.key ? '1px solid rgba(245,200,66,0.4)' : '1px solid #1c1c1c',
              background: activeTab === tab.key ? 'rgba(245,200,66,0.1)' : 'transparent',
              color: activeTab === tab.key ? '#F5C842' : '#555',
              fontSize: 12, fontWeight: activeTab === tab.key ? 700 : 400, cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'runs' && <RunLog />}
      {activeTab === 'hiit' && <HIITLog />}

      {/* Training days grouped */}
      {activeTab === 'exercises' && <div style={{ padding: '14px 20px' }}>
        {trainingDays.map(day => {
          const isOpen = selectedDay === day.key;
          const typeColor = DAY_TYPE_COLOR[day.type] || '#F5C842';
          const typeLabel = DAY_TYPE_LABEL[day.type] || day.type.toUpperCase();

          // Count total records for this day
          const totalRecords = day.exercises.reduce((sum, ex) => {
            return sum + workoutData.getRecords(ex.id).length;
          }, 0);

          return (
            <div key={day.key} style={{ marginBottom: 10 }}>
              {/* Day header button */}
              <button
                onClick={() => setSelectedDay(isOpen ? null : day.key)}
                style={{
                  width: '100%',
                  background: isOpen ? 'rgba(245,200,66,0.06)' : 'rgba(255,255,255,0.02)',
                  border: isOpen ? `1px solid rgba(245,200,66,0.25)` : '1px solid #1c1c1c',
                  borderRadius: isOpen ? '12px 12px 0 0' : 12,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ width: 4, height: 44, background: typeColor, borderRadius: 2, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#e0e0e0', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '-0.01em' }}>
                    {day.label}
                  </div>
                  <div style={{ fontSize: 11, color: typeColor, fontWeight: 600, letterSpacing: '0.08em', marginTop: 2 }}>
                    {typeLabel}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12, color: '#555' }}>{day.exercises.length} cviků</div>
                  <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>{totalRecords} záznamů</div>
                </div>
                <div style={{ color: isOpen ? '#F5C842' : '#333', fontSize: 18, transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'none' }}>›</div>
              </button>

              {/* Exercises list for this day */}
              {isOpen && (
                <div style={{
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid rgba(245,200,66,0.15)',
                  borderTop: 'none',
                  borderRadius: '0 0 12px 12px',
                  overflow: 'hidden',
                }}>
                  {day.exercises.map((ex, idx) => {
                    const latest = workoutData.getLatestRecord(ex.id);
                    const records = workoutData.getRecords(ex.id);
                    const exColor = getCategoryColor(ex.category);
                    return (
                      <button
                        key={ex.id}
                        onClick={() => setSelectedExercise(ex)}
                        style={{
                          width: '100%',
                          background: 'transparent',
                          border: 'none',
                          borderTop: idx > 0 ? '1px solid #161616' : 'none',
                          padding: '11px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.1s ease',
                        }}
                      >
                        <div style={{ width: 3, height: 32, background: exColor, borderRadius: 2, flexShrink: 0, opacity: 0.7 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#d0d0d0' }}>{ex.name}</div>
                          <div style={{ fontSize: 11, color: '#555', marginTop: 1 }}>
                            {records.length > 0 ? `${records.length} záznamů · poslední: ${formatDate(workoutData.getLatestRecord(ex.id)?.date || '')}` : 'Žádné záznamy'}
                          </div>
                        </div>
                        {latest && (
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 800, color: '#F5C842' }}>
                              {latest.weight !== '0' ? `${latest.weight} kg` : latest.reps + ' min'}
                            </div>
                            <div style={{ fontSize: 10, color: '#444' }}>{latest.sets}×{latest.reps}</div>
                          </div>
                        )}
                        <div style={{ color: '#2a2a2a', fontSize: 14 }}>›</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>}
    </div>
  );
}

// ============================================================
// Exercise Detail with Add/Edit forms
// ============================================================
function ExerciseDetail({
  exercise, workoutData, onBack,
  showAddForm, setShowAddForm,
  editingRecord, setEditingRecord,
}: {
  exercise: Exercise;
  workoutData: WorkoutDataHook;
  onBack: () => void;
  showAddForm: boolean;
  setShowAddForm: (v: boolean) => void;
  editingRecord: TrainingRecord | null;
  setEditingRecord: (r: TrainingRecord | null) => void;
}) {
  const records = workoutData.getRecords(exercise.id);
  const color = getCategoryColor(exercise.category);
  const allTimePR = workoutData.getAllTimePR(exercise.id);

  const handleDelete = (recordId: string) => {
    workoutData.deleteRecord(exercise.id, recordId);
    toast.success('Záznam smazán');
  };

  return (
    <div style={{ padding: '0 0 16px' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #1c1c1c', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: '#F5C842', fontSize: 20, cursor: 'pointer', padding: 0, lineHeight: 1 }}
        >‹</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: color, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {getCategoryLabel(exercise.category)}
          </div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 20, fontWeight: 800, color: '#f0f0f0', letterSpacing: '-0.02em' }}>
            {exercise.name}
          </div>
        </div>
        <button
          onClick={() => { setShowAddForm(true); setEditingRecord(null); }}
          style={{
            background: '#F5C842', border: 'none', borderRadius: 8,
            color: '#0c0c0c', fontSize: 12, fontWeight: 700, padding: '8px 14px',
            cursor: 'pointer',
          }}
        >+ Přidat</button>
      </div>

      {/* Target prescription */}
      {exercise.targetSets && (
        <div style={{ margin: '10px 20px 0', padding: '10px 14px', background: 'rgba(245,200,66,0.04)', border: '1px solid rgba(245,200,66,0.1)', borderRadius: 10 }}>
          <div style={{ fontSize: 10, color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Cíl Fáze 3</div>
          <div style={{ fontSize: 13, color: '#aaa' }}>
            {exercise.targetSets}×{exercise.targetReps}
            {exercise.targetWeight ? ` · ${exercise.targetWeight}` : ''}
            {exercise.note ? ` · ${exercise.note}` : ''}
          </div>
        </div>
      )}

      {/* Add / Edit Form */}
      {(showAddForm || editingRecord) && (
        <RecordForm
          exercise={exercise}
          workoutData={workoutData}
          editingRecord={editingRecord}
          onClose={() => { setShowAddForm(false); setEditingRecord(null); }}
        />
      )}

      {/* Records list */}
      <div style={{ padding: '14px 20px' }}>
        {records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#444' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
            <div style={{ fontSize: 14 }}>Žádné záznamy. Přidej první!</div>
          </div>
        ) : (
          [...records].reverse().map((record, idx) => (
            <RecordRow
              key={record.id}
              record={record}
              isLatest={idx === 0}
              isPR={parseFloat(record.weight) > 0 && parseFloat(record.weight) >= allTimePR && allTimePR > 0}
              onEdit={() => { setEditingRecord(record); setShowAddForm(false); }}
              onDelete={() => handleDelete(record.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================
// Record Form – Add or Edit
// BUG FIX: all fields (date, sets, weight, reps, note) are correctly passed to updateRecord
// ============================================================
function RecordForm({
  exercise, workoutData, editingRecord, onClose,
}: {
  exercise: Exercise;
  workoutData: WorkoutDataHook;
  editingRecord: TrainingRecord | null;
  onClose: () => void;
}) {
  const [date, setDate] = useState(editingRecord?.date || getTodayISO());
  const [sets, setSets] = useState(editingRecord?.sets || exercise.targetSets || '3');
  const [weight, setWeight] = useState(editingRecord?.weight || '');
  const [reps, setReps] = useState(editingRecord?.reps || exercise.targetReps || '');
  const [note, setNote] = useState(editingRecord?.note || '');

  const handleSubmit = () => {
    if (!date || !reps) {
      toast.error('Vyplň datum a opakování');
      return;
    }

    if (editingRecord) {
      // BUG FIX: správně předáváme všechny parametry v správném pořadí
      workoutData.updateRecord(exercise.id, editingRecord.id, date, sets, weight || '0', reps, note);
      toast.success('Záznam upraven ✓');
    } else {
      workoutData.addRecord(exercise.id, date, sets, weight || '0', reps, note);
      toast.success('Záznam přidán ✓');
    }
    onClose();
  };

  const inputStyle = {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 8,
    color: '#e0e0e0',
    padding: '10px 12px',
    fontSize: 14,
    width: '100%',
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
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
    <div style={{
      margin: '12px 20px 16px',
      background: '#111',
      border: '1px solid rgba(245,200,66,0.2)',
      borderRadius: 14,
      padding: '16px',
    }}>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 700, color: '#F5C842', marginBottom: 14 }}>
        {editingRecord ? '✏️ Upravit záznam' : '+ Nový záznam'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={labelStyle}>Datum</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Série</label>
          <input
            type="number"
            value={sets}
            onChange={e => setSets(e.target.value)}
            placeholder="3"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Váha (kg)</label>
          <input
            type="text"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            placeholder="0"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Opakování / min</label>
          <input
            type="text"
            value={reps}
            onChange={e => setReps(e.target.value)}
            placeholder="8"
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Poznámka</label>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="RPE, pocit, varianta..."
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleSubmit}
          style={{
            flex: 1, background: '#F5C842', border: 'none', borderRadius: 8,
            color: '#0c0c0c', fontSize: 14, fontWeight: 700, padding: '10px',
            cursor: 'pointer',
          }}
        >
          {editingRecord ? 'Uložit změny' : 'Přidat záznam'}
        </button>
        <button
          onClick={onClose}
          style={{
            padding: '10px 16px', background: 'transparent', border: '1px solid #2a2a2a',
            borderRadius: 8, color: '#666', fontSize: 14, cursor: 'pointer',
          }}
        >Zrušit</button>
      </div>
    </div>
  );
}

// ============================================================
// Record Row
// ============================================================
function RecordRow({ record, isLatest, isPR, onEdit, onDelete }: {
  record: TrainingRecord;
  isLatest: boolean;
  isPR: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      style={{
        background: isLatest ? 'rgba(245,200,66,0.05)' : 'rgba(255,255,255,0.02)',
        border: isLatest ? '1px solid rgba(245,200,66,0.15)' : '1px solid #1c1c1c',
        borderRadius: 10,
        padding: '10px 12px',
        marginBottom: 6,
        cursor: 'pointer',
      }}
      onClick={() => setShowActions(!showActions)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#666' }}>{formatDateFull(record.date)}</span>
            {record.planned && (
              <span style={{ fontSize: 9, background: 'rgba(120,170,255,0.15)', color: '#7EA6FF', padding: '2px 6px', borderRadius: 4, fontWeight: 700, border: '1px solid rgba(120,170,255,0.3)' }}>
                📋 PLÁN
              </span>
            )}
            {isLatest && !record.planned && (
              <span style={{ fontSize: 9, background: 'rgba(245,200,66,0.15)', color: '#F5C842', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                POSLEDNÍ
              </span>
            )}
            {isPR && !record.planned && (
              <span style={{ fontSize: 9, background: 'rgba(255,215,0,0.2)', color: '#FFD700', padding: '2px 6px', borderRadius: 4, fontWeight: 800, border: '1px solid rgba(255,215,0,0.4)' }}>
                🏆 ALL-TIME PR
              </span>
            )}
          </div>
          {record.note && (
            <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{record.note}</div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: '#F5C842' }}>
            {record.weight !== '0' ? `${record.weight} kg` : '–'}
          </div>
          <div style={{ fontSize: 11, color: '#555' }}>{record.sets}×{record.reps}</div>
        </div>
      </div>

      {showActions && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid #1c1c1c' }}>
          <button
            onClick={e => { e.stopPropagation(); onEdit(); setShowActions(false); }}
            style={{
              flex: 1, background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.2)',
              borderRadius: 8, color: '#F5C842', fontSize: 12, fontWeight: 600, padding: '7px',
              cursor: 'pointer',
            }}
          >✏️ Upravit</button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{
              flex: 1, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)',
              borderRadius: 8, color: '#F87171', fontSize: 12, fontWeight: 600, padding: '7px',
              cursor: 'pointer',
            }}
          >🗑️ Smazat</button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// RunLog – Běžecký log
// ============================================================
const ZONES = ['Zóna 1 (recovery)', 'Zóna 2 (aerobní)', 'Zóna 3 (tempo)', 'Zóna 4 (laktátový práh)', 'Zóna 5 (sprint/VO2max)'];
const ZONE_COLORS: Record<string, string> = {
  'Zóna 1 (recovery)': '#6EE7B7',
  'Zóna 2 (aerobní)': '#34D399',
  'Zóna 3 (tempo)': '#F5C842',
  'Zóna 4 (laktátový práh)': '#F97316',
  'Zóna 5 (sprint/VO2max)': '#F87171',
};

function loadRunRecords(): RunRecord[] {
  try {
    const raw = localStorage.getItem(RUN_LOG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as RunRecord[];
      if (parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return RECOVERED_RUN_RECORDS;
}

function RunLog() {
  const [runs, setRuns] = useState<RunRecord[]>(loadRunRecords);
  const [showForm, setShowForm] = useState(false);
  const [editingRun, setEditingRun] = useState<RunRecord | null>(null);

  const save = (updated: RunRecord[]) => {
    setRuns(updated);
    localStorage.setItem(RUN_LOG_KEY, JSON.stringify(updated));
  };

  const handleDelete = (id: string) => {
    save(runs.filter(r => r.id !== id));
    toast.success('Běh smazán');
  };

  return (
    <div style={{ padding: '14px 20px' }}>
      {/* Add button */}
      <button
        onClick={() => { setShowForm(true); setEditingRun(null); }}
        style={{
          width: '100%', padding: '12px', borderRadius: 10,
          background: 'rgba(245,200,66,0.1)', border: '1px dashed rgba(245,200,66,0.3)',
          color: '#F5C842', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 14,
        }}
      >
        + Přidat běh
      </button>

      {/* Form */}
      {(showForm || editingRun) && (
        <RunForm
          editingRun={editingRun}
          onClose={() => { setShowForm(false); setEditingRun(null); }}
          onSave={(run) => {
            if (editingRun) {
              save(runs.map(r => r.id === editingRun.id ? run : r));
              toast.success('Běh upraven ✓');
            } else {
              save([...runs, run]);
              toast.success('Běh přidán ✓');
            }
            setShowForm(false);
            setEditingRun(null);
          }}
        />
      )}

      {/* Stats summary */}
      {runs.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          {[
            { label: 'Celkem běhů', value: runs.length.toString() },
            { label: 'Celkem km', value: runs.reduce((s, r) => s + parseFloat(r.distance || '0'), 0).toFixed(1) },
            { label: 'Celkem min', value: runs.reduce((s, r) => s + parseInt(r.duration || '0'), 0).toString() },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1c1c1c', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 20, fontWeight: 800, color: '#F5C842' }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Run list */}
      {runs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#444' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏃</div>
          <div style={{ fontSize: 14 }}>Žádné záznamy běhů. Přidej první!</div>
        </div>
      ) : (
        [...runs].reverse().map((run, idx) => (
          <RunRow
            key={run.id}
            run={run}
            isLatest={idx === 0}
            onEdit={() => { setEditingRun(run); setShowForm(false); }}
            onDelete={() => handleDelete(run.id)}
          />
        ))
      )}
    </div>
  );
}

function RunForm({ editingRun, onClose, onSave }: {
  editingRun: RunRecord | null;
  onClose: () => void;
  onSave: (run: RunRecord) => void;
}) {
  const [date, setDate] = useState(editingRun?.date || getTodayISO());
  const [duration, setDuration] = useState(editingRun?.duration || '');
  const [distance, setDistance] = useState(editingRun?.distance || '');
  const [zone, setZone] = useState(editingRun?.zone || 'Zóna 2 (aerobní)');
  const [avgPace, setAvgPace] = useState(editingRun?.avgPace || '');
  const [avgHr, setAvgHr] = useState(editingRun?.avgHr || '');
  const [note, setNote] = useState(editingRun?.note || '');

  const handleSubmit = () => {
    if (!date || !duration) {
      toast.error('Vyplň datum a čas');
      return;
    }
    onSave({ id: editingRun?.id || nanoid(), date, duration, distance, zone, avgPace, avgHr, note });
  };

  const inputStyle = {
    background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8,
    color: '#e0e0e0', padding: '10px 12px', fontSize: 14, width: '100%',
    outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' as const,
  };
  const labelStyle = {
    fontSize: 11, color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase' as const,
    marginBottom: 4, display: 'block',
  };

  return (
    <div style={{ background: '#111', border: '1px solid rgba(110,231,183,0.25)', borderRadius: 14, padding: '16px', marginBottom: 14 }}>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 700, color: '#6EE7B7', marginBottom: 14 }}>
        {editingRun ? '✏️ Upravit běh' : '🏃 Nový běh'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={labelStyle}>Datum</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Čas (min)</label>
          <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="35" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Vzdálenost (km)</label>
          <input type="text" value={distance} onChange={e => setDistance(e.target.value)} placeholder="5.2" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Průměrné tempo</label>
          <input type="text" value={avgPace} onChange={e => setAvgPace(e.target.value)} placeholder="5:30/km" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Průměrný TF (bpm)</label>
          <input type="text" value={avgHr} onChange={e => setAvgHr(e.target.value)} placeholder="145" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Tepová zóna</label>
          <select value={zone} onChange={e => setZone(e.target.value)} style={{ ...inputStyle, appearance: 'none' as any }}>
            {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Poznámka</label>
        <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Pocit, trasa, počasí..." style={inputStyle} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleSubmit}
          style={{ flex: 1, background: '#6EE7B7', border: 'none', borderRadius: 8, color: '#0c0c0c', fontSize: 14, fontWeight: 700, padding: '10px', cursor: 'pointer' }}
        >
          {editingRun ? 'Uložit změny' : 'Přidat běh'}
        </button>
        <button
          onClick={onClose}
          style={{ padding: '10px 16px', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 8, color: '#666', fontSize: 14, cursor: 'pointer' }}
        >Zrušit</button>
      </div>
    </div>
  );
}

function RunRow({ run, isLatest, onEdit, onDelete }: {
  run: RunRecord;
  isLatest: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const zoneColor = ZONE_COLORS[run.zone] || '#6EE7B7';

  return (
    <div
      style={{
        background: isLatest ? 'rgba(110,231,183,0.05)' : 'rgba(255,255,255,0.02)',
        border: isLatest ? '1px solid rgba(110,231,183,0.2)' : '1px solid #1c1c1c',
        borderRadius: 10, padding: '12px 14px', marginBottom: 8, cursor: 'pointer',
      }}
      onClick={() => setShowActions(!showActions)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 3, height: 40, background: zoneColor, borderRadius: 2, flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#888' }}>{formatDateFull(run.date)}</span>
            <span style={{ fontSize: 9, background: `${zoneColor}20`, color: zoneColor, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
              {run.zone.split(' ')[0]} {run.zone.split(' ')[1]}
            </span>
            {isLatest && (
              <span style={{ fontSize: 9, background: 'rgba(110,231,183,0.15)', color: '#6EE7B7', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>POSLEDNÍ</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 6, flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: '#6EE7B7' }}>{run.duration}</span>
              <span style={{ fontSize: 11, color: '#555', marginLeft: 3 }}>min</span>
            </div>
            {run.distance && (
              <div>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: '#d0d0d0' }}>{run.distance}</span>
                <span style={{ fontSize: 11, color: '#555', marginLeft: 3 }}>km</span>
              </div>
            )}
            {run.avgPace && (
              <div>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 700, color: '#888' }}>{run.avgPace}</span>
              </div>
            )}
            {run.avgHr && (
              <div>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 700, color: '#F87171' }}>{run.avgHr}</span>
                <span style={{ fontSize: 11, color: '#555', marginLeft: 3 }}>bpm</span>
              </div>
            )}
          </div>
          {run.note && <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>{run.note}</div>}
        </div>
      </div>

      {showActions && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid #1c1c1c' }}>
          <button
            onClick={e => { e.stopPropagation(); onEdit(); setShowActions(false); }}
            style={{ flex: 1, background: 'rgba(110,231,183,0.1)', border: '1px solid rgba(110,231,183,0.2)', borderRadius: 8, color: '#6EE7B7', fontSize: 12, fontWeight: 600, padding: '7px', cursor: 'pointer' }}
          >✏️ Upravit</button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{ flex: 1, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, color: '#F87171', fontSize: 12, fontWeight: 600, padding: '7px', cursor: 'pointer' }}
          >🗑️ Smazat</button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// HIIT Log Component
// ============================================================
function loadHIITRecords(): HIITRecord[] {
  try {
    const raw = localStorage.getItem(HIIT_LOG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as HIITRecord[];
      if (parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return RECOVERED_HIIT_RECORDS;
}

function saveHIITRecords(records: HIITRecord[]) {
  try {
    localStorage.setItem(HIIT_LOG_KEY, JSON.stringify(records));
  } catch { /* ignore */ }
}

const HIIT_TYPES = [
  { key: 'tabata', label: 'Tabata', desc: '20s práce / 10s odpočinek × 8 kol', color: '#F87171' },
  { key: 'circuit', label: 'Circuit', desc: 'Okruhový trénink, postupně cviky', color: '#FB923C' },
  { key: 'amrap', label: 'AMRAP', desc: 'As Many Rounds As Possible', color: '#FBBF24' },
  { key: 'emom', label: 'EMOM', desc: 'Every Minute On the Minute', color: '#34D399' },
  { key: 'other', label: 'Jiný', desc: 'Vlastní formát', color: '#A78BFA' },
];

const HR_ZONES = ['Zóna 1 (< 115 bpm)', 'Zóna 2 (115–135 bpm)', 'Zóna 3 (135–155 bpm)', 'Zóna 4 (155–175 bpm)', 'Zóna 5 (> 175 bpm)'];

function HIITLog() {
  const [records, setRecords] = useState<HIITRecord[]>(() => loadHIITRecords());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<Omit<HIITRecord, 'id'>>({
    date: getTodayISO(),
    type: 'tabata',
    duration: '',
    rounds: '',
    workInterval: '',
    restInterval: '',
    zone: 'Zóna 4 (155–175 bpm)',
    avgHr: '',
    maxHr: '',
    calories: '',
    stravaUrl: '',
    exercises: '',
    note: '',
  });

  const resetForm = () => {
    setForm({
      date: getTodayISO(), type: 'tabata', duration: '', rounds: '',
      workInterval: '', restInterval: '', zone: 'Zóna 4 (155–175 bpm)',
      avgHr: '', maxHr: '', calories: '', stravaUrl: '', exercises: '', note: '',
    });
    setEditingId(null);
  };

  const handleSave = () => {
    if (!form.duration) { toast.error('Vyplň délku tréninku'); return; }
    let updated: HIITRecord[];
    if (editingId) {
      updated = records.map(r => r.id === editingId ? { ...form, id: editingId } : r);
      toast.success('HIIT záznam upraven ✓');
    } else {
      updated = [{ ...form, id: nanoid() }, ...records];
      toast.success('HIIT trénink uložen 🔥');
    }
    updated.sort((a, b) => b.date.localeCompare(a.date));
    setRecords(updated);
    saveHIITRecords(updated);
    setShowForm(false);
    resetForm();
  };

  const handleEdit = (r: HIITRecord) => {
    setForm({ date: r.date, type: r.type, duration: r.duration, rounds: r.rounds || '',
      workInterval: r.workInterval || '', restInterval: r.restInterval || '',
      zone: r.zone, avgHr: r.avgHr || '', maxHr: r.maxHr || '',
      calories: r.calories || '', stravaUrl: r.stravaUrl || '',
      exercises: r.exercises || '', note: r.note });
    setEditingId(r.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    saveHIITRecords(updated);
    toast.success('Záznam smazán');
  };

  // Stats
  const totalSessions = records.length;
  const totalMinutes = records.reduce((s, r) => s + (parseInt(r.duration) || 0), 0);
  const totalCalories = records.reduce((s, r) => s + (parseInt(r.calories || '0') || 0), 0);
  const avgHrAll = records.filter(r => r.avgHr).map(r => parseInt(r.avgHr!));
  const avgHrMean = avgHrAll.length > 0 ? Math.round(avgHrAll.reduce((a, b) => a + b, 0) / avgHrAll.length) : 0;

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a2a',
    borderRadius: 8, padding: '9px 12px', color: '#e0e0e0', fontSize: 13,
    outline: 'none', boxSizing: 'border-box' as const,
  };
  const labelStyle = { fontSize: 10, color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 4, display: 'block' };
  const fieldStyle = { marginBottom: 12 };

  const typeInfo = HIIT_TYPES.find(t => t.key === form.type) || HIIT_TYPES[0];

  return (
    <div style={{ padding: '14px 20px' }}>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Tréninků', value: totalSessions, color: '#F87171' },
          { label: 'Minut', value: totalMinutes, color: '#FBBF24' },
          { label: 'kcal', value: totalCalories > 0 ? totalCalories : '–', color: '#34D399' },
          { label: 'Avg TF', value: avgHrMean > 0 ? `${avgHrMean} bpm` : '–', color: '#A78BFA' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid #1c1c1c',
            borderRadius: 10, padding: '8px 6px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 9, color: '#555', marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          style={{
            width: '100%', background: 'rgba(248,113,113,0.08)', border: '1px dashed rgba(248,113,113,0.3)',
            borderRadius: 10, padding: '12px', color: '#F87171', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', marginBottom: 16,
          }}
        >
          🔥 Přidat HIIT trénink
        </button>
      )}

      {/* Form */}
      {showForm && (
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: `1px solid ${typeInfo.color}30`,
          borderRadius: 12, padding: '16px', marginBottom: 16,
        }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 700, color: typeInfo.color, marginBottom: 14 }}>
            {editingId ? '✏️ Upravit HIIT záznam' : '🔥 Nový HIIT trénink'}
          </div>

          {/* Type selector */}
          <div style={fieldStyle}>
            <span style={labelStyle}>Typ HIIT</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {HIIT_TYPES.map(t => (
                <button
                  key={t.key}
                  onClick={() => setForm(f => ({ ...f, type: t.key as HIITRecord['type'] }))}
                  style={{
                    padding: '6px 12px', borderRadius: 8, border: `1px solid ${form.type === t.key ? t.color : '#2a2a2a'}`,
                    background: form.type === t.key ? `${t.color}15` : 'transparent',
                    color: form.type === t.key ? t.color : '#666',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {typeInfo && <div style={{ fontSize: 11, color: '#555', marginTop: 6 }}>{typeInfo.desc}</div>}
          </div>

          {/* Date + Duration */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <span style={labelStyle}>Datum</span>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <span style={labelStyle}>Délka (min) *</span>
              <input type="number" placeholder="25" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} style={inputStyle} />
            </div>
          </div>

          {/* Rounds + Intervals */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <span style={labelStyle}>Kola</span>
              <input type="number" placeholder="8" value={form.rounds} onChange={e => setForm(f => ({ ...f, rounds: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <span style={labelStyle}>Práce (s)</span>
              <input type="number" placeholder="20" value={form.workInterval} onChange={e => setForm(f => ({ ...f, workInterval: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <span style={labelStyle}>Odpočinek (s)</span>
              <input type="number" placeholder="10" value={form.restInterval} onChange={e => setForm(f => ({ ...f, restInterval: e.target.value }))} style={inputStyle} />
            </div>
          </div>

          {/* Heart rate */}
          <div style={fieldStyle}>
            <span style={labelStyle}>Tepová zóna</span>
            <select value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
              {HR_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <span style={labelStyle}>Avg TF (bpm)</span>
              <input type="number" placeholder="165" value={form.avgHr} onChange={e => setForm(f => ({ ...f, avgHr: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <span style={labelStyle}>Max TF (bpm)</span>
              <input type="number" placeholder="185" value={form.maxHr} onChange={e => setForm(f => ({ ...f, maxHr: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <span style={labelStyle}>Kalorie (kcal)</span>
              <input type="number" placeholder="320" value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} style={inputStyle} />
            </div>
          </div>

          {/* Exercises */}
          <div style={fieldStyle}>
            <span style={labelStyle}>Cviky (volitelné)</span>
            <input type="text" placeholder="Burpees, Box jumps, KB swings, Battle ropes..." value={form.exercises} onChange={e => setForm(f => ({ ...f, exercises: e.target.value }))} style={inputStyle} />
          </div>

          {/* Strava URL */}
          <div style={fieldStyle}>
            <span style={labelStyle}>🟠 Strava odkaz (volitelné)</span>
            <input
              type="url"
              placeholder="https://www.strava.com/activities/..."
              value={form.stravaUrl}
              onChange={e => setForm(f => ({ ...f, stravaUrl: e.target.value }))}
              style={{ ...inputStyle, borderColor: form.stravaUrl ? 'rgba(252,76,2,0.4)' : '#2a2a2a' }}
            />
            {form.stravaUrl && (
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: '#FC4C02' }}>✓ Strava aktivita propojená</span>
                <a href={form.stravaUrl} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 10, color: '#FC4C02', textDecoration: 'underline' }}>
                  Otevřít ↗
                </a>
              </div>
            )}
          </div>

          {/* Note */}
          <div style={fieldStyle}>
            <span style={labelStyle}>Poznámka</span>
            <textarea
              placeholder="Jak se cítil trénink, co šlo dobře, co příště zlepšit..."
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' as const }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSave}
              style={{
                flex: 1, background: typeInfo.color, border: 'none', borderRadius: 8,
                padding: '10px', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {editingId ? 'Uložit změny' : '🔥 Uložit HIIT'}
            </button>
            <button
              onClick={() => { setShowForm(false); resetForm(); }}
              style={{
                padding: '10px 16px', background: 'transparent', border: '1px solid #333',
                borderRadius: 8, color: '#666', fontSize: 13, cursor: 'pointer',
              }}
            >
              Zrušit
            </button>
          </div>
        </div>
      )}

      {/* Records list */}
      {records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#333' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔥</div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 700, color: '#444' }}>Žádné HIIT záznamy</div>
          <div style={{ fontSize: 12, color: '#333', marginTop: 4 }}>Přidej svůj první HIIT trénink výše.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {records.map(r => {
            const typeInfo = HIIT_TYPES.find(t => t.key === r.type) || HIIT_TYPES[0];
            return (
              <div key={r.id} style={{
                background: 'rgba(255,255,255,0.02)', border: `1px solid ${typeInfo.color}20`,
                borderRadius: 12, padding: '14px 16px',
              }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{
                    background: `${typeInfo.color}15`, border: `1px solid ${typeInfo.color}30`,
                    borderRadius: 8, padding: '4px 10px',
                    fontSize: 11, fontWeight: 700, color: typeInfo.color, letterSpacing: '0.05em',
                  }}>
                    {typeInfo.label.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 12, color: '#888' }}>{formatDateFull(r.date)}</div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                    <button onClick={() => handleEdit(r)} style={{ background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 6, padding: '4px 8px', color: '#666', fontSize: 11, cursor: 'pointer' }}>✏️</button>
                    <button onClick={() => handleDelete(r.id)} style={{ background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 6, padding: '4px 8px', color: '#F87171', fontSize: 11, cursor: 'pointer' }}>🗑️</button>
                  </div>
                </div>

                {/* Stats chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: r.exercises || r.note || r.stravaUrl ? 10 : 0 }}>
                  <span style={{ fontSize: 12, color: '#ccc', background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '3px 8px' }}>
                    ⏱ {r.duration} min
                  </span>
                  {r.rounds && (
                    <span style={{ fontSize: 12, color: '#ccc', background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '3px 8px' }}>
                      🔄 {r.rounds} kol
                    </span>
                  )}
                  {r.workInterval && r.restInterval && (
                    <span style={{ fontSize: 12, color: '#ccc', background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '3px 8px' }}>
                      {r.workInterval}s/{r.restInterval}s
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: '#A78BFA', background: 'rgba(167,139,250,0.08)', borderRadius: 6, padding: '3px 8px' }}>
                    ❤️ {r.zone.split(' ')[0]} {r.zone.split(' ')[1]}
                  </span>
                  {r.avgHr && (
                    <span style={{ fontSize: 12, color: '#F87171', background: 'rgba(248,113,113,0.08)', borderRadius: 6, padding: '3px 8px' }}>
                      avg {r.avgHr} bpm
                    </span>
                  )}
                  {r.maxHr && (
                    <span style={{ fontSize: 12, color: '#FB923C', background: 'rgba(251,146,60,0.08)', borderRadius: 6, padding: '3px 8px' }}>
                      max {r.maxHr} bpm
                    </span>
                  )}
                  {r.calories && (
                    <span style={{ fontSize: 12, color: '#FBBF24', background: 'rgba(251,191,36,0.08)', borderRadius: 6, padding: '3px 8px' }}>
                      🔥 {r.calories} kcal
                    </span>
                  )}
                </div>

                {/* Exercises */}
                {r.exercises && (
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>
                    <span style={{ color: '#444' }}>Cviky: </span>{r.exercises}
                  </div>
                )}

                {/* Note */}
                {r.note && (
                  <div style={{ fontSize: 11, color: '#666', fontStyle: 'italic', marginBottom: r.stravaUrl ? 8 : 0 }}>
                    {r.note}
                  </div>
                )}

                {/* Strava link */}
                {r.stravaUrl && (
                  <a
                    href={r.stravaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: 'rgba(252,76,2,0.08)', border: '1px solid rgba(252,76,2,0.25)',
                      borderRadius: 8, padding: '6px 12px',
                      color: '#FC4C02', fontSize: 11, fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#FC4C02">
                      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/>
                    </svg>
                    Zobrazit na Strava ↗
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
