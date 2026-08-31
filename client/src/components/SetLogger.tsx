// Odškrtávání sérií jedním palcem.
//
// Každá série z rozpisu (Exercise.setPlan) má v deníku vlastní předepsaný
// záznam s id plan-w{týden}-{den}-{cvik}-{index}. Ťuknutí ten záznam přepíše
// na skutečný (planned: false) – proto se objem nikdy nezapočítá dvakrát
// a odškrtnutí jde vrátit.
//
// Úprava jde přes steppery, ne přes klávesnici: mezi sériemi, jednou rukou
// a s magnéziem na prstech je vyvolání numerické klávesnice nejpomalejší
// operace v celé appce a navíc překryje potvrzovací tlačítko.
import { useState } from 'react';
import { toast } from 'sonner';
import type { Exercise, TrainingRecord } from '@/lib/data';
import type { WorkoutDataHook } from '@/lib/types';
import { plannedId, labelFromNote, plannedTemplate, exerciseHistory } from '@/lib/planLink';
import { formatWeight, normalizeDecimal } from '@/lib/tint';
import { startRest, restForCategory } from '@/lib/restTimer';
import { ulozeno, tap } from '@/lib/haptics';
import { pauzaOdPosledni, oznacSeriiHotovou, formatPauzu } from '@/lib/setClock';
import { loadPlates, formatPerSideShort } from '@/lib/plates';
import { Tick } from '@/components/kit';

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
  summaryIndex?: number;
  label: string;
  weight: string;
  reps: string;
  sets: string;
  rpe?: string;
}

const RPE_CHOICES = ['6', '7', '8', '9', '10'];

/** Odskok od předepsané váhy, u kterého má smysl se ptát. */
function deviationNote(planned: string, entered: string): string | null {
  const p = parseFloat(planned);
  const e = parseFloat(entered);
  if (!isFinite(p) || !isFinite(e) || p <= 0 || e <= 0) return null;
  const ratio = e / p;
  if (ratio >= 8) return 'Nezmizela ti desetinná čárka?';
  if (ratio <= 0.15) return 'Není to o řád míň?';
  const diff = Math.round((ratio - 1) * 100);
  if (Math.abs(diff) >= 15) return `${diff > 0 ? '+' : ''}${diff} % oproti plánu — schválně?`;
  return null;
}

/** Krok váhy: u benche jemnější, protože se tam pracuje s mikrokotouči. */
function weightStep(exerciseId: string): number {
  return exerciseId === 'bench' ? 1.25 : 2.5;
}

export default function SetLogger({ exercise, week, dayKey, date, workoutData }: Props) {
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [draftW, setDraftW] = useState(0);
  const [draftR, setDraftR] = useState(0);
  const [draftRpe, setDraftRpe] = useState<string>('');

  const records = workoutData.getRecords(exercise.id);
  const byId = (id: string): TrainingRecord | undefined => records.find(r => r.id === id);
  const history = exerciseHistory(exercise.id, workoutData.records, 3, date);

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

  const rowKey = (row: Row) => `${row.id}#${row.summaryIndex ?? row.index ?? 0}`;

  const write = (row: Row, weight: string, reps: string, rpe?: string) => {
    const rec = byId(row.id);
    const note = rec?.note ?? `PLÁN · T${week} · ${row.label}`;
    const w = normalizeDecimal(weight);
    // Skutečná pauza od minulé odškrtnuté série. Čte se PŘED zapsáním nové
    // značky, jinak by vyšla nula.
    const pauza = pauzaOdPosledni();
    if (!rec) {
      workoutData.addRecord(exercise.id, date, row.sets, w, reps, note, rpe, pauza ?? undefined);
    } else {
      workoutData.updateRecord(exercise.id, row.id, date, row.sets, w, reps, note, rpe, pauza ?? undefined);
    }
    oznacSeriiHotovou();
    ulozeno();
    setOpenRow(null);
    startRest(restForCategory(exercise.category), exercise.nameShort || exercise.name);
  };

  const undoSet = (row: Row) => {
    tap();
    if (row.summaryIndex !== undefined && row.summaryIndex > 0) {
      const rec = byId(row.id);
      if (rec) {
        workoutData.updateRecord(exercise.id, row.id, rec.date, String(row.summaryIndex), rec.weight, rec.reps, rec.note ?? '', rec.rpe);
        return;
      }
    }
    workoutData.resetToPlanned(exercise.id, row.id);
    toast('Série vrácena mezi předepsané');
  };

  const step = weightStep(exercise.id);

  return (
    <div className="gd-sets">
      {history.length > 0 && (
        <div className="gd-sets__hist">
          <span className="gd-tag">Posledně</span>
          {history.map(h => (
            <span key={h.date} className="gd-sets__histitem">
              {formatWeight(h.weight)}×{h.reps}
              {h.rpe && <i>@{h.rpe}</i>}
            </span>
          ))}
        </div>
      )}

      {rows.map(row => {
        const key = rowKey(row);
        const rec = byId(row.id);
        const doneSets = rec && !rec.planned ? (parseInt(rec.sets, 10) || 0) : 0;
        const done = row.summaryIndex !== undefined
          ? row.summaryIndex < doneSets
          : !!rec && !rec.planned;
        const shownW = rec && !rec.planned ? rec.weight : row.weight;
        const shownR = rec && !rec.planned ? rec.reps : row.reps;
        const isOpen = openRow === key;
        const warn = isOpen ? deviationNote(row.weight, String(draftW)) : null;
        const plates = isOpen && draftW > 0 ? loadPlates(draftW) : null;

        return (
          <div key={key} className={`gd-set ${done ? 'is-done' : ''}`}>
            <button
              className="gd-set__main"
              onClick={() => (done ? undoSet(row) : write(row, row.weight, row.reps))}
              aria-pressed={done}
              aria-label={`${row.label}, ${shownW} kilogramů, ${shownR} opakování${done ? ', hotovo' : ''}`}
            >
              <span className="gd-set__tick" aria-hidden="true">{done && <Tick />}</span>
              <span className="gd-set__lbl">
                {row.index !== undefined ? (labelFromNote(rec?.note) ?? row.label) : row.label}
                {done && (rec?.rpe || rec?.gapSec) && (
                  <span className="gd-set__prev">
                    {rec.rpe && `zapsáno na RPE ${rec.rpe}`}
                    {rec.rpe && rec.gapSec ? ' · ' : ''}
                    {/* Naměřená pauza, ne předpis z RestBaru. */}
                    {rec.gapSec ? `pauza ${formatPauzu(rec.gapSec)}` : ''}
                  </span>
                )}
              </span>
              <span className="gd-set__num">
                {row.weight !== '0' ? `${formatWeight(shownW)} × ${shownR}` : `${row.sets} × ${shownR}`}
                {row.rpe && !done && <span className="gd-set__rpe">RPE {row.rpe}</span>}
              </span>
            </button>

            <button
              className="gd-set__edit"
              onClick={() => {
                if (isOpen) { setOpenRow(null); return; }
                setOpenRow(key);
                setDraftW(parseFloat(normalizeDecimal(shownW)) || 0);
                setDraftR(parseInt(shownR, 10) || 0);
                setDraftRpe(rec?.rpe ?? '');
              }}
              aria-label="Upravit váhu, opakování a RPE"
            >{isOpen ? '×' : '···'}</button>

            {isOpen && (
              <div className="gd-set__form">
                <div className="gd-step">
                  <span className="gd-tag gd-step__lbl">Váha</span>
                  <button className="gd-step__btn" onClick={() => setDraftW(w => Math.max(0, +(w - step).toFixed(2)))} aria-label={`O ${step} kg míň`}>−</button>
                  <span className="gd-display gd-step__val">{formatWeight(String(draftW))}</span>
                  <button className="gd-step__btn" onClick={() => setDraftW(w => +(w + step).toFixed(2))} aria-label={`O ${step} kg víc`}>+</button>
                </div>

                <div className="gd-step">
                  <span className="gd-tag gd-step__lbl">Opak.</span>
                  <button className="gd-step__btn" onClick={() => setDraftR(r => Math.max(0, r - 1))} aria-label="O jedno opakování míň">−</button>
                  <span className="gd-display gd-step__val">{draftR}</span>
                  <button className="gd-step__btn" onClick={() => setDraftR(r => r + 1)} aria-label="O jedno opakování víc">+</button>
                </div>

                <div className="gd-rpe">
                  <span className="gd-tag gd-rpe__lbl">RPE</span>
                  {RPE_CHOICES.map(v => (
                    <button
                      key={v}
                      className={`gd-rpe__chip ${draftRpe === v ? 'is-on' : ''}`}
                      onClick={() => setDraftRpe(draftRpe === v ? '' : v)}
                      aria-pressed={draftRpe === v}
                    >{v}</button>
                  ))}
                </div>

                {plates && !plates.belowBar && (
                  <div className="gd-set__plates">
                    Na stranu: <b>{formatPerSideShort(plates.perSide)}</b>
                    {plates.off !== 0 && <span> · přesně nejde, vyjde {formatWeight(String(plates.achieved))} kg</span>}
                  </div>
                )}

                {warn && <div className="gd-set__warn">{warn}</div>}

                <button
                  className="gd-set__save"
                  onClick={() => write(row, String(draftW), String(draftR), draftRpe || undefined)}
                >Zapsat sérii</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
