// Gold Performance Design – Diary Tab
// GymDiary visual system: preserve the dark, compact, yellow-accented training diary layout.
// BUG FIX: editace záznamu správně předává date, sets, weight, reps, note
// NOVÉ: cviky rozděleny podle tréninkových dnů (Po/Út/Čt/Pá/So)
import { useState, useEffect } from 'react';
import { PHASE3_WEEKS, LEGACY_PLAN_WEEKS, getCategoryColor, getCategoryLabel, formatDate, formatDateFull, getTodayISO, RUN_LOG_KEY, HIIT_LOG_KEY } from '@/lib/data';
import { RECOVERED_HIIT_RECORDS, RECOVERED_RUN_RECORDS } from '@/lib/recoveryData';
import type { WorkoutDataHook } from '@/lib/types';
import type { Exercise, TrainingRecord, WorkoutDay, RunRecord, HIITRecord } from '@/lib/data';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { tint, normalizeDecimal, formatWeight } from '@/lib/tint';
import { undoToast } from '@/lib/undo';
import { plural } from '@/lib/czech';
import { Hero, QuoteBar, SectionHead, Watermark } from '@/components/kit';

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
  lower: 'var(--gd-accent)',
  upper: 'var(--gd-fern)',
  fullbody: 'var(--gd-text-2)',
  hiit: 'var(--gd-danger)',
  run: 'var(--gd-text-2)',
  rest: 'var(--gd-text-4)',
};

// Tréninkové dny se sjednocenou nabídkou cviků.
//
// Dřív se bralo jen PHASE3_WEEKS[0], takže cviky, které rotují až v blocích B a C
// (týdny 5–13), nešlo přes Deník zapsat vůbec a jejich historie byla nedostupná.
// Teď se pro každý den sesbírá sjednocení cviků ze VŠECH 13 týdnů, v pořadí,
// v jakém se poprvé objeví.
function getTrainingDays(): WorkoutDay[] {
  const byKey = new Map<string, WorkoutDay>();

  for (const week of PHASE3_WEEKS) {
    for (const day of week.days) {
      if (day.type === 'rest' || day.exercises.length === 0) continue;
      const existing = byKey.get(day.key);
      if (!existing) {
        byKey.set(day.key, { ...day, exercises: [...day.exercises] });
        continue;
      }
      const seen = new Set(existing.exercises.map(e => e.id));
      for (const ex of day.exercises) {
        if (!seen.has(ex.id)) {
          existing.exercises.push(ex);
          seen.add(ex.id);
        }
      }
    }
  }

  // Zachovej pořadí dnů podle prvního týdne.
  const order = PHASE3_WEEKS[0].days.map(d => d.key);
  return Array.from(byKey.values())
    .sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
}

/** Cviky, ke kterým existují záznamy, ale v aktuálním plánu už nejsou. */
function getLegacyExercises(records: Record<string, TrainingRecord[]>): Exercise[] {
  const inPlan = new Set<string>();
  for (const week of PHASE3_WEEKS) {
    for (const day of week.days) for (const ex of day.exercises) inPlan.add(ex.id);
  }

  const known = new Map<string, Exercise>();
  for (const week of LEGACY_PLAN_WEEKS) {
    for (const day of week.days) for (const ex of day.exercises) {
      if (!known.has(ex.id)) known.set(ex.id, ex);
    }
  }

  const out: Exercise[] = [];
  for (const id of Object.keys(records)) {
    if (inPlan.has(id)) continue;
    const real = (records[id] ?? []).filter(r => !r.planned);
    if (real.length === 0) continue;
    out.push(known.get(id) ?? {
      id,
      name: id,
      category: 'accessory',
      targetSets: '3',
      targetReps: '8',
    } as Exercise);
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, 'cs'));
}

export default function Diary({ workoutData }: Props) {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TrainingRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'exercises' | 'runs' | 'hiit'>('exercises');

  const trainingDays = getTrainingDays();
  const legacyExercises = getLegacyExercises(workoutData.records);
  const [showLegacy, setShowLegacy] = useState(false);
  const [hledani, setHledani] = useState('');

  // Cviků je přes šedesát a jsou schované ve dnech. Apple dává vyhledávání nad
  // každý seznam delší než pár desítek položek – rozbalovat pět dnů a hledat
  // očima je zbytečná práce. Hledání skládá hierarchii naplocho.
  // Bez skládání diakritiky by „drep" nenašel „dřep" – a na telefonu se háčky
  // píšou nerady. NFD rozloží písmeno na základ + diakritické znaménko a to
  // se pak zahodí.
  const bezDiakritiky = (t: string) =>
    t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const dotaz = bezDiakritiky(hledani.trim());
  const nalezene = dotaz
    ? (() => {
        const videno = new Set<string>();
        const out: { ex: Exercise; kde: string }[] = [];
        for (const den of trainingDays) {
          for (const ex of den.exercises) {
            if (videno.has(ex.id)) continue;
            if (!bezDiakritiky(`${ex.name} ${ex.nameShort ?? ''}`).includes(dotaz)) continue;
            videno.add(ex.id);
            out.push({ ex, kde: den.label });
          }
        }
        for (const ex of legacyExercises) {
          if (videno.has(ex.id)) continue;
          if (!bezDiakritiky(`${ex.name} ${ex.nameShort ?? ''}`).includes(dotaz)) continue;
          videno.add(ex.id);
          out.push({ ex, kde: 'Mimo aktuální plán' });
        }
        return out;
      })()
    : [];

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

  const heroTitle = activeTab === 'exercises'
    ? <>Záznamy<br />cviků</>
    : activeTab === 'runs' ? <>Běžecký<br />log</> : <>HIIT<br />log</>;

  return (
    <div>
      <Hero
        plate="diary"
        ghost="04"
        kicker="Tréninkový deník"
        title={heroTitle}
        meta={
          activeTab === 'exercises'
            ? <><b>Vyber den a cvik</b><span>·</span><span>Historie, PR, přidání záznamu</span></>
            : activeTab === 'runs'
              ? <><b>Běhy</b><span>·</span><span>Čas, vzdálenost, tepová zóna</span></>
              : <><b>HIIT</b><span>·</span><span>Tabata · Circuit · AMRAP · EMOM</span></>
        }
      />

      <QuoteBar />


      <div className="gd-body">
      {/* Tab switcher */}
      <div style={{ display: 'flex', padding: '18px 20px 14px', gap: 8, borderBottom: '1px solid var(--gd-line)' }}>
        {([
          { key: 'exercises', label: 'Cviky' },
          { key: 'runs', label: 'Běhy' },
          { key: 'hiit', label: 'HIIT' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: '8px', borderRadius: 0,
              border: activeTab === tab.key ? '1px solid color-mix(in srgb, var(--gd-accent) 40%, transparent)' : '1px solid var(--gd-line)',
              background: activeTab === tab.key ? 'color-mix(in srgb, var(--gd-accent) 10%, transparent)' : 'transparent',
              color: activeTab === tab.key ? 'var(--gd-accent)' : 'var(--gd-text-4)',
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
      {activeTab === 'exercises' && <div className="gd-wmhost" style={{ padding: '0 20px 36px' }}>
        <Watermark name="helm" position="104% 12%" size="auto 46%" opacity={0.07} />

        {/* Hledání cviku napříč všemi dny i historií. */}
        <div style={{ position: 'relative', margin: '18px 0 4px' }}>
          <input
            type="text"
            value={hledani}
            onChange={e => setHledani(e.target.value)}
            placeholder="Hledat cvik"
            aria-label="Hledat cvik"
            enterKeyHint="search"
            autoCapitalize="none"
            autoCorrect="off"
            style={{ paddingRight: hledani ? 40 : undefined }}
          />
          {hledani && (
            <button
              onClick={() => setHledani('')}
              aria-label="Zrušit hledání"
              style={{
                position: 'absolute', right: 0, top: 0, height: '100%', width: 40,
                background: 'none', border: 'none', color: 'var(--gd-text-3)',
                fontSize: 18, lineHeight: 1, cursor: 'pointer',
              }}
            >×</button>
          )}
        </div>

        {dotaz && (
          <div style={{ marginBottom: 28 }}>
            <div className="gd-tag" style={{ display: 'block', margin: '12px 0 8px', color: 'var(--gd-text-3)' }}>
              {nalezene.length === 0
                ? 'Nic nenalezeno'
                : `${nalezene.length} ${plural(nalezene.length, 'nález', 'nálezy', 'nálezů')}`}
            </div>
            {nalezene.map(({ ex, kde }) => {
              const pocet = workoutData.getRecords(ex.id).filter(r => !r.planned).length;
              return (
                <button
                  key={ex.id}
                  onClick={() => setSelectedExercise(ex)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', marginBottom: 6, textAlign: 'left', cursor: 'pointer',
                    background: 'color-mix(in srgb, var(--gd-text) 2%, transparent)',
                    border: '1px solid var(--gd-line)', borderRadius: 0,
                  }}
                >
                  <div style={{ width: 3, alignSelf: 'stretch', minHeight: 30, background: getCategoryColor(ex.category), flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gd-text)' }}>{ex.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--gd-text-3)', marginTop: 2 }}>
                      {kde} · {pocet} {plural(pocet, 'záznam', 'záznamy', 'záznamů')}
                    </div>
                  </div>
                  <span style={{ color: 'var(--gd-line)', fontSize: 15, flexShrink: 0 }}>›</span>
                </button>
              );
            })}
          </div>
        )}

        {!dotaz && <>
        <SectionHead n="01" label="Tréninkové dny" right="Po · Út · St · Pá · So" />
        {trainingDays.map(day => {
          const isOpen = selectedDay === day.key;
          const typeColor = DAY_TYPE_COLOR[day.type] || 'var(--gd-accent)';
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
                  background: isOpen ? 'color-mix(in srgb, var(--gd-accent) 6%, transparent)' : 'color-mix(in srgb, var(--gd-text) 2%, transparent)',
                  border: isOpen ? `1px solid color-mix(in srgb, var(--gd-accent) 25%, transparent)` : '1px solid var(--gd-line)',
                  borderRadius: 0,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ width: 4, height: 44, background: typeColor, borderRadius: 0, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gd-text)', fontFamily: 'Archivo, sans-serif', fontStretch: '118%', letterSpacing: '-0.01em' }}>
                    {day.label}
                  </div>
                  <div style={{ fontSize: 11, color: typeColor, fontWeight: 600, letterSpacing: '0.08em', marginTop: 2 }}>
                    {typeLabel}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12, color: 'var(--gd-text-4)' }}>{day.exercises.length} {day.exercises.length === 1 ? 'cvik' : day.exercises.length <= 4 ? 'cviky' : 'cviků'}</div>
                  <div style={{ fontSize: 11, color: 'var(--gd-text-4)', marginTop: 2 }}>{totalRecords} záznamů</div>
                </div>
                <div style={{ color: isOpen ? 'var(--gd-accent)' : 'var(--gd-line)', fontSize: 18, transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'none' }}>›</div>
              </button>

              {/* Exercises list for this day */}
              {isOpen && (
                <div style={{
                  background: 'color-mix(in srgb, var(--gd-text) 1%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--gd-accent) 15%, transparent)',
                  borderTop: 'none',
                  borderRadius: '0',
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
                          borderTop: idx > 0 ? '1px solid var(--gd-surface)' : 'none',
                          padding: '11px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.1s ease',
                        }}
                      >
                        <div style={{ width: 3, height: 32, background: exColor, borderRadius: 0, flexShrink: 0, opacity: 0.7 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gd-text)' }}>{ex.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--gd-text-4)', marginTop: 1 }}>
                            {records.length > 0 ? `${records.length} záznamů · poslední: ${formatDate(workoutData.getLatestRecord(ex.id)?.date || '')}` : 'Žádné záznamy'}
                          </div>
                        </div>
                        {latest && (
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 16, fontWeight: 800, color: 'var(--gd-accent)' }}>
                              {latest.weight !== '0' ? `${formatWeight(latest.weight)} kg` : latest.reps + ' min'}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--gd-text-4)' }}>{latest.sets}×{latest.reps}</div>
                          </div>
                        )}
                        <div style={{ color: 'var(--gd-line)', fontSize: 14 }}>›</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Cviky mimo aktuální plán – historie ze starého plánu */}
        {legacyExercises.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <button
              onClick={() => setShowLegacy(!showLegacy)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '13px 14px', background: 'transparent',
                border: '1px solid var(--gd-line)', borderRadius: 0, cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span className="gd-tag" style={{ flex: 1 }}>Mimo aktuální plán</span>
              <span style={{ fontSize: 11, color: 'var(--gd-text-4)' }}>
                {legacyExercises.length} {plural(legacyExercises.length, 'cvik', 'cviky', 'cviků')}
              </span>
              <span style={{ color: 'var(--gd-text-4)', fontSize: 11, transform: showLegacy ? 'rotate(180deg)' : 'none' }}>▼</span>
            </button>
            {showLegacy && (
              <div style={{ border: '1px solid var(--gd-line)', borderTop: 'none' }}>
                {legacyExercises.map(ex => {
                  const n = workoutData.getRecords(ex.id).filter(r => !r.planned).length;
                  return (
                    <button
                      key={ex.id}
                      onClick={() => setSelectedExercise(ex)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '12px 14px', background: 'transparent', border: 'none',
                        borderTop: '1px solid var(--gd-line)', cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      <span style={{ flex: 1, fontSize: 13, color: 'var(--gd-text-2)', minWidth: 0 }}>{ex.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--gd-text-4)', flexShrink: 0 }}>
                        {n} {plural(n, 'záznam', 'záznamy', 'záznamů')}
                      </span>
                      <span style={{ color: 'var(--gd-line)', fontSize: 13 }}>›</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        </>}
      </div>}
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
    const removed = workoutData.deleteRecord(exercise.id, recordId);
    if (!removed) return;
    undoToast('Záznam smazán', () => workoutData.restoreRecord(exercise.id, removed));
  };

  return (
    <div style={{ padding: '0 0 16px' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gd-line)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'var(--gd-accent)', fontSize: 20, cursor: 'pointer', padding: 0, lineHeight: 1 }}
        >‹</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: color, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {getCategoryLabel(exercise.category)}
          </div>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 20, fontWeight: 800, color: 'var(--gd-text)', letterSpacing: '-0.02em' }}>
            {exercise.name}
          </div>
        </div>
        <button
          onClick={() => { setShowAddForm(true); setEditingRecord(null); }}
          style={{
            background: 'var(--gd-accent)', border: 'none', borderRadius: 0,
            color: 'var(--gd-ink)', fontSize: 12, fontWeight: 700, padding: '8px 14px',
            cursor: 'pointer',
          }}
        >+ Přidat</button>
      </div>

      {/* Target prescription */}
      {exercise.targetSets && (
        <div style={{ margin: '10px 20px 0', padding: '10px 14px', background: 'color-mix(in srgb, var(--gd-accent) 4%, transparent)', border: '1px solid color-mix(in srgb, var(--gd-accent) 10%, transparent)', borderRadius: 0 }}>
          <div style={{ fontSize: 10, color: 'var(--gd-text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Cíl Fáze 3</div>
          <div style={{ fontSize: 13, color: 'var(--gd-text-2)' }}>
            {exercise.targetSets}×{exercise.targetReps}
            {exercise.targetWeight ? ` · ${exercise.targetWeight}` : ''}
            {exercise.note ? ` · ${exercise.note}` : ''}
          </div>
        </div>
      )}

      {/* Add / Edit Form */}
      {(showAddForm || editingRecord) && (
        <RecordForm
          // Bez key se formulář při přepnutí na jiný záznam nepřemountuje,
          // useState initializery se znovu nespustí a Uložit změny přepíše
          // cílový záznam hodnotami toho předchozího.
          key={editingRecord ? editingRecord.id : 'new'}
          exercise={exercise}
          workoutData={workoutData}
          editingRecord={editingRecord}
          onClose={() => { setShowAddForm(false); setEditingRecord(null); }}
        />
      )}

      {/* Records list */}
      <div style={{ padding: '14px 20px' }}>
        {records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gd-text-4)' }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.24em', marginBottom: 10, color: 'var(--gd-text-4)' }}>DENÍK</div>
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

    // Váhu i série ukládáme kanonicky s tečkou – viz normalizeDecimal.
    const w = normalizeDecimal(weight) || '0';
    const st = normalizeDecimal(sets);

    if (editingRecord) {
      workoutData.updateRecord(exercise.id, editingRecord.id, date, st, w, reps, note);
      toast.success('Záznam upraven');
    } else {
      workoutData.addRecord(exercise.id, date, st, w, reps, note);
      toast.success('Záznam přidán');
    }
    onClose();
  };

  const inputStyle = {
    background: 'var(--gd-surface)',
    border: '1px solid var(--gd-line)',
    borderRadius: 0,
    color: 'var(--gd-text)',
    padding: '10px 12px',
    fontSize: 16,
    width: '100%',
    outline: 'none',
    fontFamily: 'inherit',
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
    <div style={{
      margin: '12px 20px 16px',
      background: 'var(--gd-surface)',
      border: '1px solid color-mix(in srgb, var(--gd-accent) 20%, transparent)',
      borderRadius: 0,
      padding: '16px',
    }}>
      <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 16, fontWeight: 700, color: 'var(--gd-accent)', marginBottom: 14 }}>
        {editingRecord ? 'Upravit záznam' : '+ Nový záznam'}
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
            inputMode="decimal"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            placeholder="0"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Opakování / min</label>
          {/* Zůstává text, protože sem patří i „8-10" nebo „8/6". inputMode ale
              musí být numeric, jinak iOS nabídne písmenkovou klávesnici. */}
          <input
            type="text"
            inputMode="numeric"
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
            flex: 1, background: 'var(--gd-accent)', border: 'none', borderRadius: 0,
            color: 'var(--gd-ink)', fontSize: 14, fontWeight: 700, padding: '10px',
            cursor: 'pointer',
          }}
        >
          {editingRecord ? 'Uložit změny' : 'Přidat záznam'}
        </button>
        <button
          onClick={onClose}
          style={{
            padding: '10px 16px', background: 'transparent', border: '1px solid var(--gd-line)',
            borderRadius: 0, color: 'var(--gd-text-3)', fontSize: 14, cursor: 'pointer',
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
        background: isLatest ? 'color-mix(in srgb, var(--gd-accent) 5%, transparent)' : 'color-mix(in srgb, var(--gd-text) 2%, transparent)',
        border: isLatest ? '1px solid color-mix(in srgb, var(--gd-accent) 15%, transparent)' : '1px solid var(--gd-line)',
        borderRadius: 0,
        padding: '10px 12px',
        marginBottom: 6,
        cursor: 'pointer',
      }}
      onClick={() => setShowActions(!showActions)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--gd-text-3)' }}>{formatDateFull(record.date)}</span>
            {record.planned && (
              <span style={{ fontSize: 9, background: 'color-mix(in srgb, var(--gd-text-2) 15%, transparent)', color: 'var(--gd-text-2)', padding: '2px 6px', borderRadius: 0, fontWeight: 700, border: '1px solid color-mix(in srgb, var(--gd-text-2) 30%, transparent)' }}>
                PLÁN
              </span>
            )}
            {isLatest && !record.planned && (
              <span style={{ fontSize: 9, background: 'color-mix(in srgb, var(--gd-accent) 15%, transparent)', color: 'var(--gd-accent)', padding: '2px 6px', borderRadius: 0, fontWeight: 700 }}>
                POSLEDNÍ
              </span>
            )}
            {isPR && !record.planned && (
              <span style={{ fontSize: 9, background: 'color-mix(in srgb, var(--gd-accent) 20%, transparent)', color: 'var(--gd-accent)', padding: '2px 6px', borderRadius: 0, fontWeight: 800, border: '1px solid color-mix(in srgb, var(--gd-accent) 40%, transparent)' }}>
                ALL-TIME PR
              </span>
            )}
          </div>
          {record.note && (
            <div style={{ fontSize: 11, color: 'var(--gd-text-4)', marginTop: 2 }}>{record.note}</div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 18, fontWeight: 800, color: 'var(--gd-accent)' }}>
            {record.weight !== '0' ? `${formatWeight(record.weight)} kg` : '–'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--gd-text-4)' }}>{record.sets}×{record.reps}</div>
        </div>
      </div>

      {showActions && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--gd-line)' }}>
          <button
            onClick={e => { e.stopPropagation(); onEdit(); setShowActions(false); }}
            style={{
              flex: 1, background: 'color-mix(in srgb, var(--gd-accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--gd-accent) 20%, transparent)',
              borderRadius: 0, color: 'var(--gd-accent)', fontSize: 12, fontWeight: 600, padding: '7px',
              cursor: 'pointer',
            }}
          >Upravit</button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{
              flex: 1,
              background: 'color-mix(in srgb, var(--gd-danger) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--gd-danger) 20%, transparent)',
              borderRadius: 0,
              color: 'var(--gd-danger)',
              fontSize: 12, fontWeight: 600, padding: '7px',
              cursor: 'pointer',
            }}
          >Smazat</button>
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
  'Zóna 1 (recovery)': 'var(--gd-fern)',
  'Zóna 2 (aerobní)': 'var(--gd-fern)',
  'Zóna 3 (tempo)': 'var(--gd-accent)',
  'Zóna 4 (laktátový práh)': 'var(--gd-danger)',
  'Zóna 5 (sprint/VO2max)': 'var(--gd-danger)',
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
    const previous = runs;
    save(runs.filter(r => r.id !== id));
    undoToast('Běh smazán', () => save(previous));
  };

  return (
    <div style={{ padding: '14px 20px' }}>
      {/* Add button */}
      <button
        onClick={() => { setShowForm(true); setEditingRun(null); }}
        style={{
          width: '100%', padding: '12px', borderRadius: 0,
          background: 'color-mix(in srgb, var(--gd-accent) 10%, transparent)', border: '1px dashed color-mix(in srgb, var(--gd-accent) 30%, transparent)',
          color: 'var(--gd-accent)', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 14,
        }}
      >
        + Přidat běh
      </button>

      {/* Form */}
      {(showForm || editingRun) && (
        <RunForm
          key={editingRun ? editingRun.id : 'new'}
          editingRun={editingRun}
          onClose={() => { setShowForm(false); setEditingRun(null); }}
          onSave={(run) => {
            if (editingRun) {
              save(runs.map(r => r.id === editingRun.id ? run : r));
              toast.success('Běh upraven');
            } else {
              save([...runs, run]);
              toast.success('Běh přidán');
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
            <div key={stat.label} style={{ background: 'color-mix(in srgb, var(--gd-text) 3%, transparent)', border: '1px solid var(--gd-line)', borderRadius: 0, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 20, fontWeight: 800, color: 'var(--gd-accent)' }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: 'var(--gd-text-4)', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Run list */}
      {runs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gd-text-4)' }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.24em', marginBottom: 10, color: 'var(--gd-text-4)' }}>BĚHY</div>
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
    background: 'var(--gd-surface)', border: '1px solid var(--gd-line)', borderRadius: 0,
    color: 'var(--gd-text)', padding: '10px 12px', fontSize: 16, width: '100%',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const,
  };
  const labelStyle = {
    fontSize: 11, color: 'var(--gd-text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' as const,
    marginBottom: 4, display: 'block',
  };

  return (
    <div style={{ background: 'var(--gd-surface)', border: '1px solid color-mix(in srgb, var(--gd-fern) 25%, transparent)', borderRadius: 0, padding: '16px', marginBottom: 14 }}>
      <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 16, fontWeight: 700, color: 'var(--gd-fern)', marginBottom: 14 }}>
        {editingRun ? 'Upravit běh' : 'Nový běh'}
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
          style={{ flex: 1, background: 'var(--gd-fern)', border: 'none', borderRadius: 0, color: 'var(--gd-ink)', fontSize: 14, fontWeight: 700, padding: '10px', cursor: 'pointer' }}
        >
          {editingRun ? 'Uložit změny' : 'Přidat běh'}
        </button>
        <button
          onClick={onClose}
          style={{ padding: '10px 16px', background: 'transparent', border: '1px solid var(--gd-line)', borderRadius: 0, color: 'var(--gd-text-3)', fontSize: 14, cursor: 'pointer' }}
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
  const zoneColor = ZONE_COLORS[run.zone] || 'var(--gd-fern)';

  return (
    <div
      style={{
        background: isLatest ? 'color-mix(in srgb, var(--gd-fern) 5%, transparent)' : 'color-mix(in srgb, var(--gd-text) 2%, transparent)',
        border: isLatest ? '1px solid color-mix(in srgb, var(--gd-fern) 20%, transparent)' : '1px solid var(--gd-line)',
        borderRadius: 0, padding: '12px 14px', marginBottom: 8, cursor: 'pointer',
      }}
      onClick={() => setShowActions(!showActions)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 3, height: 40, background: zoneColor, borderRadius: 0, flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--gd-text-3)' }}>{formatDateFull(run.date)}</span>
            <span style={{ fontSize: 9, background: `${tint(zoneColor, 13)}`, color: zoneColor, padding: '2px 6px', borderRadius: 0, fontWeight: 700 }}>
              {run.zone.split(' ')[0]} {run.zone.split(' ')[1]}
            </span>
            {isLatest && (
              <span style={{ fontSize: 9, background: 'color-mix(in srgb, var(--gd-fern) 15%, transparent)', color: 'var(--gd-fern)', padding: '2px 6px', borderRadius: 0, fontWeight: 700 }}>POSLEDNÍ</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 6, flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 18, fontWeight: 800, color: 'var(--gd-fern)' }}>{run.duration}</span>
              <span style={{ fontSize: 11, color: 'var(--gd-text-4)', marginLeft: 3 }}>min</span>
            </div>
            {run.distance && (
              <div>
                <span style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 18, fontWeight: 800, color: 'var(--gd-text)' }}>{run.distance}</span>
                <span style={{ fontSize: 11, color: 'var(--gd-text-4)', marginLeft: 3 }}>km</span>
              </div>
            )}
            {run.avgPace && (
              <div>
                <span style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 16, fontWeight: 700, color: 'var(--gd-text-3)' }}>{run.avgPace}</span>
              </div>
            )}
            {run.avgHr && (
              <div>
                <span style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 16, fontWeight: 700, color: 'var(--gd-danger)' }}>{run.avgHr}</span>
                <span style={{ fontSize: 11, color: 'var(--gd-text-4)', marginLeft: 3 }}>bpm</span>
              </div>
            )}
          </div>
          {run.note && <div style={{ fontSize: 11, color: 'var(--gd-text-4)', marginTop: 4 }}>{run.note}</div>}
        </div>
      </div>

      {showActions && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--gd-line)' }}>
          <button
            onClick={e => { e.stopPropagation(); onEdit(); setShowActions(false); }}
            style={{ flex: 1, background: 'color-mix(in srgb, var(--gd-fern) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--gd-fern) 20%, transparent)', borderRadius: 0, color: 'var(--gd-fern)', fontSize: 12, fontWeight: 600, padding: '7px', cursor: 'pointer' }}
          >Upravit</button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{ flex: 1, background: 'color-mix(in srgb, var(--gd-danger) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--gd-danger) 20%, transparent)', borderRadius: 0, color: 'var(--gd-danger)', fontSize: 12, fontWeight: 600, padding: '7px', cursor: 'pointer' }}
          >Smazat</button>
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
  { key: 'tabata', label: 'Tabata', desc: '20s práce / 10s odpočinek × 8 kol', color: 'var(--gd-danger)' },
  { key: 'circuit', label: 'Circuit', desc: 'Okruhový trénink, postupně cviky', color: 'var(--gd-danger)' },
  { key: 'amrap', label: 'AMRAP', desc: 'As Many Rounds As Possible', color: 'var(--gd-accent)' },
  { key: 'emom', label: 'EMOM', desc: 'Every Minute On the Minute', color: 'var(--gd-fern)' },
  { key: 'other', label: 'Jiný', desc: 'Vlastní formát', color: 'var(--gd-text-2)' },
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
      toast.success('HIIT záznam upraven');
    } else {
      updated = [{ ...form, id: nanoid() }, ...records];
      toast.success('HIIT trénink uložen');
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
    const previous = records;
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    saveHIITRecords(updated);
    undoToast('HIIT záznam smazán', () => { setRecords(previous); saveHIITRecords(previous); });
  };

  // Jedno klepnutí: vezme parametry z posledního HIITu, dá dnešní datum
  // a rovnou uloží. Tepovka a kalorie se nekopírují – ty jsou pokaždé jiné.
  const quickAdd = () => {
    const last = records[0];
    if (!last) return;
    const previous = records;
    const fresh: HIITRecord = {
      ...last,
      id: nanoid(),
      date: getTodayISO(),
      avgHr: '', maxHr: '', calories: '', stravaUrl: '',
      note: '',
    };
    const updated = [fresh, ...records].sort((a, b) => b.date.localeCompare(a.date));
    setRecords(updated);
    saveHIITRecords(updated);
    undoToast(`HIIT zapsán · ${fresh.type} ${fresh.duration} min`, () => {
      setRecords(previous);
      saveHIITRecords(previous);
    });
  };

  // Stats
  const totalSessions = records.length;
  const totalMinutes = records.reduce((s, r) => s + (parseInt(r.duration) || 0), 0);
  const totalCalories = records.reduce((s, r) => s + (parseInt(r.calories || '0') || 0), 0);
  const avgHrAll = records.filter(r => r.avgHr).map(r => parseInt(r.avgHr!));
  const avgHrMean = avgHrAll.length > 0 ? Math.round(avgHrAll.reduce((a, b) => a + b, 0) / avgHrAll.length) : 0;

  const inputStyle = {
    width: '100%', background: 'color-mix(in srgb, var(--gd-text) 4%, transparent)', border: '1px solid var(--gd-line)',
    borderRadius: 0, padding: '9px 12px', color: 'var(--gd-text)', fontSize: 16,
    outline: 'none', boxSizing: 'border-box' as const,
  };
  const labelStyle = { fontSize: 10, color: 'var(--gd-text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 4, display: 'block' };
  const fieldStyle = { marginBottom: 12 };

  const typeInfo = HIIT_TYPES.find(t => t.key === form.type) || HIIT_TYPES[0];

  return (
    <div style={{ padding: '14px 20px' }}>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Tréninků', value: totalSessions, color: 'var(--gd-danger)' },
          { label: 'Minut', value: totalMinutes, color: 'var(--gd-accent)' },
          { label: 'kcal', value: totalCalories > 0 ? totalCalories : '–', color: 'var(--gd-fern)' },
          { label: 'Avg TF', value: avgHrMean > 0 ? `${avgHrMean} bpm` : '–', color: 'var(--gd-text-2)' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, background: 'color-mix(in srgb, var(--gd-text) 2%, transparent)', border: '1px solid var(--gd-line)',
            borderRadius: 0, padding: '8px 6px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 9, color: 'var(--gd-text-4)', marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add button */}
      {!showForm && (
        <div style={{ marginBottom: 16 }}>
          {/* Rychlý zápis – středa a sobota jsou pevná skupinová lekce,
              takže se dá vyjít z minulého záznamu a uložit hned. */}
          {records.length > 0 && (
            <button
              onClick={quickAdd}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                background: 'var(--gd-accent)', color: 'var(--gd-accent-ink)',
                border: 'none', borderRadius: 0, padding: '15px 16px',
                cursor: 'pointer', marginBottom: 8, textAlign: 'left',
              }}
            >
              <span style={{ flex: 1, fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                Zapsat jako minule
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.72 }}>
                {records[0].type} · {records[0].duration} min
              </span>
            </button>
          )}
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            style={{
              width: '100%', background: 'transparent', border: '1px solid var(--gd-line)',
              borderRadius: 0, padding: '13px', color: 'var(--gd-text-3)',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Vyplnit podrobně
          </button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div style={{
          background: 'color-mix(in srgb, var(--gd-text) 2%, transparent)', border: `1px solid ${tint(typeInfo.color, 19)}`,
          borderRadius: 0, padding: '16px', marginBottom: 16,
        }}>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 16, fontWeight: 700, color: typeInfo.color, marginBottom: 14 }}>
            {editingId ? 'Upravit HIIT záznam' : 'Nový HIIT trénink'}
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
                    padding: '6px 12px', borderRadius: 0, border: `1px solid ${form.type === t.key ? t.color : 'var(--gd-line)'}`,
                    background: form.type === t.key ? `${tint(t.color, 8)}` : 'transparent',
                    color: form.type === t.key ? t.color : 'var(--gd-text-3)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {typeInfo && <div style={{ fontSize: 11, color: 'var(--gd-text-4)', marginTop: 6 }}>{typeInfo.desc}</div>}
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
            <span style={labelStyle}>Strava odkaz (volitelné)</span>
            <input
              type="url"
              placeholder="https://www.strava.com/activities/..."
              value={form.stravaUrl}
              onChange={e => setForm(f => ({ ...f, stravaUrl: e.target.value }))}
              style={{ ...inputStyle, borderColor: form.stravaUrl ? 'color-mix(in srgb, var(--gd-danger) 40%, transparent)' : 'var(--gd-line)' }}
            />
            {form.stravaUrl && (
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--gd-danger)' }}>Strava aktivita propojená</span>
                <a href={form.stravaUrl} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 10, color: 'var(--gd-danger)', textDecoration: 'underline' }}>
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
                flex: 1, background: typeInfo.color, border: 'none', borderRadius: 0,
                padding: '10px', color: 'var(--gd-ink)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {editingId ? 'Uložit změny' : 'Uložit HIIT'}
            </button>
            <button
              onClick={() => { setShowForm(false); resetForm(); }}
              style={{
                padding: '10px 16px', background: 'transparent', border: '1px solid var(--gd-line)',
                borderRadius: 0, color: 'var(--gd-text-3)', fontSize: 13, cursor: 'pointer',
              }}
            >
              Zrušit
            </button>
          </div>
        </div>
      )}

      {/* Records list */}
      {records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--gd-line)' }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.24em', marginBottom: 12, color: 'var(--gd-text-4)' }}>HIIT</div>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontStretch: '118%', fontSize: 18, fontWeight: 700, color: 'var(--gd-text-4)' }}>Žádné HIIT záznamy</div>
          <div style={{ fontSize: 12, color: 'var(--gd-line)', marginTop: 4 }}>Přidej svůj první HIIT trénink výše.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {records.map(r => {
            const typeInfo = HIIT_TYPES.find(t => t.key === r.type) || HIIT_TYPES[0];
            return (
              <div key={r.id} style={{
                background: 'color-mix(in srgb, var(--gd-text) 2%, transparent)', border: `1px solid ${tint(typeInfo.color, 13)}`,
                borderRadius: 0, padding: '14px 16px',
              }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{
                    background: `${tint(typeInfo.color, 8)}`, border: `1px solid ${tint(typeInfo.color, 19)}`,
                    borderRadius: 0, padding: '4px 10px',
                    fontSize: 11, fontWeight: 700, color: typeInfo.color, letterSpacing: '0.05em',
                  }}>
                    {typeInfo.label.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gd-text-3)' }}>{formatDateFull(r.date)}</div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                    <button onClick={() => handleEdit(r)} style={{ background: 'transparent', border: '1px solid var(--gd-line)', borderRadius: 0, padding: '4px 8px', color: 'var(--gd-text-3)', fontSize: 11, cursor: 'pointer' }}>Upravit</button>
                    <button onClick={() => handleDelete(r.id)} style={{ background: 'transparent', border: '1px solid var(--gd-line)', borderRadius: 0, padding: '4px 8px', color: 'var(--gd-danger)', fontSize: 11, cursor: 'pointer' }}>Smazat</button>
                  </div>
                </div>

                {/* Stats chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: r.exercises || r.note || r.stravaUrl ? 10 : 0 }}>
                  <span style={{ fontSize: 12, color: 'var(--gd-text-2)', background: 'color-mix(in srgb, var(--gd-text) 5%, transparent)', borderRadius: 0, padding: '3px 8px' }}>
                    ⏱ {r.duration} min
                  </span>
                  {r.rounds && (
                    <span style={{ fontSize: 12, color: 'var(--gd-text-2)', background: 'color-mix(in srgb, var(--gd-text) 5%, transparent)', borderRadius: 0, padding: '3px 8px' }}>
                      {r.rounds} kol
                    </span>
                  )}
                  {r.workInterval && r.restInterval && (
                    <span style={{ fontSize: 12, color: 'var(--gd-text-2)', background: 'color-mix(in srgb, var(--gd-text) 5%, transparent)', borderRadius: 0, padding: '3px 8px' }}>
                      {r.workInterval}s/{r.restInterval}s
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: 'var(--gd-text-2)', background: 'color-mix(in srgb, var(--gd-text-2) 8%, transparent)', borderRadius: 0, padding: '3px 8px' }}>
                    {r.zone.split(' ')[0]} {r.zone.split(' ')[1]}
                  </span>
                  {r.avgHr && (
                    <span style={{ fontSize: 12, color: 'var(--gd-danger)', background: 'color-mix(in srgb, var(--gd-danger) 8%, transparent)', borderRadius: 0, padding: '3px 8px' }}>
                      avg {r.avgHr} bpm
                    </span>
                  )}
                  {r.maxHr && (
                    <span style={{ fontSize: 12, color: 'var(--gd-danger)', background: 'color-mix(in srgb, var(--gd-danger) 8%, transparent)', borderRadius: 0, padding: '3px 8px' }}>
                      max {r.maxHr} bpm
                    </span>
                  )}
                  {r.calories && (
                    <span style={{ fontSize: 12, color: 'var(--gd-accent)', background: 'color-mix(in srgb, var(--gd-accent) 8%, transparent)', borderRadius: 0, padding: '3px 8px' }}>
                      {r.calories} kcal
                    </span>
                  )}
                </div>

                {/* Exercises */}
                {r.exercises && (
                  <div style={{ fontSize: 11, color: 'var(--gd-text-3)', marginBottom: 6 }}>
                    <span style={{ color: 'var(--gd-text-4)' }}>Cviky: </span>{r.exercises}
                  </div>
                )}

                {/* Note */}
                {r.note && (
                  <div style={{ fontSize: 11, color: 'var(--gd-text-3)', fontStyle: 'italic', marginBottom: r.stravaUrl ? 8 : 0 }}>
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
                      background: 'color-mix(in srgb, var(--gd-danger) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--gd-danger) 25%, transparent)',
                      borderRadius: 0, padding: '6px 12px',
                      color: 'var(--gd-danger)', fontSize: 11, fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--gd-danger)">
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
