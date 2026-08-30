// Odškrtávání sérií jedním palcem přímo z Přehledu.
//
// Každá série z rozpisu (Exercise.setPlan) má v deníku vlastní předepsaný záznam
// s id plan-w{týden}-{den}-{cvik}-{index}. Ťuknutí ten záznam přepíše na skutečný
// (planned: false) – proto se objem nikdy nezapočítá dvakrát a odškrtnutí jde vrátit.
import { useState } from 'react';
import { toast } from 'sonner';
import type { Exercise, TrainingRecord } from '@/lib/data';
import type { WorkoutDataHook } from '@/lib/types';
import { plannedId, labelFromNote, previousExposure, plannedTemplate } from '@/lib/planLink';
import { formatWeight, normalizeDecimal } from '@/lib/tint';
import { startRest, restForCategory } from '@/lib/restTimer';

interface Props {
  exercise: Exercise;
  week: number;
  dayKey: string;
  date: string;
  workoutData: WorkoutDataHook;
}

interface Row {
  id: string;
  index?: number;
  /** Pořadí série u souhrnného záznamu (cviky bez rozpisu). */
  summaryIndex?: number;
  label: string;
  weight: string;
  reps: string;
  sets: string;
  rpe?: string;
}

/** Odskok od předepsané váhy, u kterého má smysl se ptát. */
function deviationNote(planned: string, entered: string): string | null {
  const p = parseFloat(planned);
  const e = parseFloat(entered);
  if (!isFinite(p) || !isFinite(e) || p <= 0 || e <= 0) return null;
  const ratio = e / p;
  // Řád vedle – klasický překlep, když se ztratí desetinná čárka.
  if (ratio >= 8) return 'Nezmizela ti desetinná čárka?';
  if (ratio <= 0.15) return 'Není to o řád míň?';
  const diff = Math.round((ratio - 1) * 100);
  if (Math.abs(diff) >= 15) {
    return `${diff > 0 ? '+' : ''}${diff} % oproti plánu — schválně?`;
  }
  return null;
}

export default function SetLogger({ exercise, week, dayKey, date, workoutData }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draftW, setDraftW] = useState('');
  const [draftR, setDraftR] = useState('');

  const records = workoutData.getRecords(exercise.id);
  const byId = (id: string): TrainingRecord | undefined => records.find(r => r.id === id);

  // Hlavní cviky mají jeden záznam na sérii. Doplňky mají jeden souhrnný
  // záznam, u kterého se počet HOTOVÝCH sérií drží v poli `sets` – celkový
  // počet se proto musí brát ze šablony v data.ts, ne z živého záznamu.
  const summaryId = plannedId(week, dayKey, exercise.id);
  const template = plannedTemplate(exercise.id, summaryId);
  const totalSets = parseInt(template?.sets ?? exercise.targetSets, 10) || 1;

  const rows: Row[] = exercise.setPlan && exercise.setPlan.length > 0
    ? exercise.setPlan.map((sp, i) => ({
        id: plannedId(week, dayKey, exercise.id, i),
        index: i,
        label: sp.label,
        weight: sp.weight,
        reps: sp.reps,
        sets: '1',
        rpe: sp.rpe,
      }))
    : Array.from({ length: totalSets }, (_, i) => ({
        id: summaryId,
        summaryIndex: i,
        label: `Série ${i + 1}`,
        weight: template?.weight ?? '0',
        reps: template?.reps ?? exercise.targetReps,
        sets: String(i + 1),
        rpe: exercise.rpe,
      }));

  const logSet = (row: Row, weight: string, reps: string) => {
    const rec = byId(row.id);
    const note = rec?.note ?? `PLÁN · T${week} · ${row.label}`;
    if (!rec) {
      // Předepsaný řádek pro tenhle den v datech není – zapíšeme jako nový záznam.
      workoutData.addRecord(exercise.id, date, row.sets, normalizeDecimal(weight), reps, note);
    } else {
      workoutData.updateRecord(exercise.id, row.id, date, row.sets, normalizeDecimal(weight), reps, note);
    }
    setEditing(null);
    startRest(restForCategory(exercise.category), exercise.nameShort || exercise.name);
  };

  const undoSet = (row: Row) => {
    if (row.summaryIndex !== undefined && row.summaryIndex > 0) {
      // U souhrnného záznamu snížíme počet hotových sérií o tu odklepnutou.
      const rec = byId(row.id);
      if (rec) {
        workoutData.updateRecord(exercise.id, row.id, rec.date, String(row.summaryIndex), rec.weight, rec.reps, rec.note ?? '');
        return;
      }
    }
    workoutData.resetToPlanned(exercise.id, row.id);
    toast('Série vrácena mezi předepsané');
  };

  return (
    <div className="gd-sets">
      {rows.map(row => {
        const rec = byId(row.id);
        const doneSets = rec && !rec.planned ? (parseInt(rec.sets, 10) || 0) : 0;
        const done = row.summaryIndex !== undefined
          ? row.summaryIndex < doneSets
          : !!rec && !rec.planned;
        const shownW = rec && !rec.planned ? rec.weight : row.weight;
        const shownR = rec && !rec.planned ? rec.reps : row.reps;
        const prev = previousExposure(week, dayKey, exercise.id, row.index, workoutData.records);
        const isEditing = editing === row.id;
        const warn = isEditing ? deviationNote(row.weight, draftW) : null;

        return (
          <div key={row.id} className={`gd-set ${done ? 'is-done' : ''}`}>
            <button
              className="gd-set__main"
              onClick={() => (done ? undoSet(row) : logSet(row, row.weight, row.reps))}
              aria-pressed={done}
              aria-label={`${row.label}, ${shownW} kilogramů, ${shownR} opakování${done ? ', hotovo' : ''}`}
            >
              <span className="gd-set__tick" aria-hidden="true">{done ? '✓' : ''}</span>
              <span className="gd-set__lbl">
                {row.index !== undefined ? (labelFromNote(rec?.note) ?? row.label) : row.label}
                {prev && (
                  <span className="gd-set__prev">
                    posledně {formatWeight(prev.weight)} × {prev.reps}
                  </span>
                )}
              </span>
              <span className="gd-set__num">
                {row.weight !== '0' ? `${formatWeight(shownW)} × ${shownR}` : `${row.sets} × ${shownR}`}
                {row.rpe && <span className="gd-set__rpe">RPE {row.rpe}</span>}
              </span>
            </button>

            <button
              className="gd-set__edit"
              onClick={() => {
                setEditing(isEditing ? null : row.id);
                setDraftW(shownW);
                setDraftR(shownR);
              }}
              aria-label="Upravit váhu a opakování"
            >{isEditing ? '×' : '···'}</button>

            {isEditing && (
              <div className="gd-set__form">
                <label className="gd-tag" htmlFor={`w-${row.id}`}>Váha</label>
                <input
                  id={`w-${row.id}`}
                  type="text"
                  inputMode="decimal"
                  value={draftW}
                  onChange={e => setDraftW(e.target.value)}
                />
                <label className="gd-tag" htmlFor={`r-${row.id}`}>Opakování</label>
                <input
                  id={`r-${row.id}`}
                  type="text"
                  inputMode="numeric"
                  value={draftR}
                  onChange={e => setDraftR(e.target.value)}
                />
                <button className="gd-set__save" onClick={() => logSet(row, draftW, draftR)}>
                  Zapsat
                </button>
                {warn && <div className="gd-set__warn">{warn}</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
