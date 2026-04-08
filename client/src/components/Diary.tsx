// Gold Performance Design – Diary Tab
// BUG FIX: editace záznamu správně předává date, sets, weight, reps, note
// NOVÉ: cviky rozděleny podle tréninkových dnů (Po/Út/Čt/Pá/So)
import { useState } from 'react';
import { PHASE3_WEEKS, getCategoryColor, getCategoryLabel, formatDate, formatDateFull, getTodayISO } from '@/lib/data';
import type { WorkoutDataHook } from '@/lib/types';
import type { Exercise, TrainingRecord, WorkoutDay } from '@/lib/data';
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
          Záznamy cviků
        </h2>
        <p style={{ color: '#666', fontSize: 12, marginTop: 6 }}>Vyber tréninkový den a cvik pro zobrazení a přidání záznamů.</p>
      </div>

      {/* Training days grouped */}
      <div style={{ padding: '14px 20px' }}>
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
      </div>
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
            {isLatest && (
              <span style={{ fontSize: 9, background: 'rgba(245,200,66,0.15)', color: '#F5C842', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                POSLEDNÍ
              </span>
            )}
            {isPR && (
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
