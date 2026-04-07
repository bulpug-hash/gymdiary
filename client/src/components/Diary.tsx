// Diary – Deník tab
// Gold Performance Design
// BUG FIX: editace záznamu správně předává date, sets, weight, reps, note
import { useState, useCallback } from 'react';
import { PHASE3_WEEKS, getCategoryColor, formatDate, formatDateFull, getTodayISO, nanoid } from '@/lib/data';
import type { WorkoutDataHook } from '@/lib/types';
import type { Exercise, TrainingRecord } from '@/lib/data';
import { toast } from 'sonner';

interface Props {
  workoutData: WorkoutDataHook;
}

type ViewMode = 'exercises' | 'records';

export default function Diary({ workoutData }: Props) {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TrainingRecord | null>(null);

  // Flatten all exercises from all days (unique by id)
  const allExercises: Exercise[] = [];
  const seen = new Set<string>();
  for (const week of PHASE3_WEEKS.slice(0, 1)) {
    for (const day of week.days) {
      for (const ex of day.exercises) {
        if (!seen.has(ex.id)) {
          seen.add(ex.id);
          allExercises.push(ex);
        }
      }
    }
  }

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
        <p style={{ color: '#666', fontSize: 12, marginTop: 6 }}>Klikni na cvik pro zobrazení a přidání záznamů.</p>
      </div>

      {/* Exercise list */}
      <div style={{ padding: '14px 20px' }}>
        {allExercises.map(ex => {
          const latest = workoutData.getLatestRecord(ex.id);
          const records = workoutData.getRecords(ex.id);
          return (
            <button
              key={ex.id}
              onClick={() => setSelectedExercise(ex)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid #1c1c1c',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ width: 4, height: 40, background: getCategoryColor(ex.category), borderRadius: 2, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#e0e0e0' }}>{ex.name}</div>
                <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
                  {records.length} záznamů
                  {latest ? ` · poslední: ${formatDate(latest.date)}` : ''}
                </div>
              </div>
              {latest && (
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: '#F5C842' }}>
                    {latest.weight !== '0' ? `${latest.weight} kg` : latest.reps + ' min'}
                  </div>
                  <div style={{ fontSize: 10, color: '#444' }}>{latest.sets}×{latest.reps}</div>
                </div>
              )}
              <div style={{ color: '#333', fontSize: 16 }}>›</div>
            </button>
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
            {exercise.category}
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
      margin: '0 20px 16px',
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
function RecordRow({ record, isLatest, onEdit, onDelete }: {
  record: TrainingRecord;
  isLatest: boolean;
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
