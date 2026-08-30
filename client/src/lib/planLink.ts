// Most mezi Plánem a Deníkem.
//
// Předepsané záznamy v PLANNED_RECORDS mají id ve tvaru
//   plan-w{týden}-{den}-{idCviku}          … cvik bez rozpisu (agregovaně, sets: '3')
//   plan-w{týden}-{den}-{idCviku}-{index}  … cvik se setPlan, jeden záznam na sérii
// Díky tomu jde každou sérii z rozpisu spárovat s konkrétním záznamem v deníku
// a odklepnout ji, aniž by se objem započítal dvakrát.
import { PHASE3_WEEKS, PLANNED_RECORDS } from '@/lib/data';
import type { TrainingRecord, Week, WorkoutDay, Exercise } from '@/lib/data';

export const DAY_CODE: Record<string, string> = {
  monday: 'po', tuesday: 'ut', wednesday: 'st',
  thursday: 'ct', friday: 'pa', saturday: 'so', sunday: 'ne',
};

export function plannedId(week: number, dayKey: string, exerciseId: string, setIndex?: number): string {
  const base = `plan-w${week}-${DAY_CODE[dayKey] ?? dayKey}-${exerciseId}`;
  return setIndex === undefined ? base : `${base}-${setIndex}`;
}

/**
 * Původní předpis ze data.ts. Počet sérií u cviků bez rozpisu se musí brát
 * odsud, ne z živého záznamu – ten po odškrtnutí drží počet HOTOVÝCH sérií.
 */
export function plannedTemplate(exerciseId: string, recordId: string): TrainingRecord | null {
  return (PLANNED_RECORDS[exerciseId] ?? []).find(r => r.id === recordId) ?? null;
}

/** Popisek série („Objemová“, „OVERLOAD“, „Back-off“) z poznámky předepsaného záznamu. */
export function labelFromNote(note?: string): string | null {
  if (!note) return null;
  const parts = note.split('·').map(s => s.trim());
  // PLÁN · T1 · Objemová · RPE 7-8
  return parts.length >= 3 ? parts[2] : null;
}

/** Série je odškrtnutá, když ji uživatel přepsal – tím z ní zmizí planned. */
export function isDone(rec: TrainingRecord | undefined): boolean {
  return !!rec && !rec.planned;
}

export interface WeekProgress {
  hotovo: number;
  celkem: number;
  /** Po dnech, v pořadí Po–Ne. */
  dny: { key: string; label: string; hotovo: number; celkem: number }[];
}

/**
 * Kolik předepsaných sérií daného týdne je odškrtnutých.
 * Jmenovatel bere jen silové dny – HIIT a volno se neodškrtávají.
 */
export function weekProgress(week: Week, records: Record<string, TrainingRecord[]>): WeekProgress {
  const dny: WeekProgress['dny'] = [];
  let hotovo = 0;
  let celkem = 0;

  for (const day of week.days) {
    if (day.type === 'rest' || day.type === 'hiit' || day.type === 'run') continue;
    let dHotovo = 0;
    let dCelkem = 0;

    for (const ex of day.exercises) {
      const list = records[ex.id] ?? [];

      if (ex.setPlan && ex.setPlan.length > 0) {
        // Hlavní cvik: jeden záznam na sérii.
        for (let i = 0; i < ex.setPlan.length; i++) {
          const id = plannedId(week.number, day.key, ex.id, i);
          const rec = list.find(r => r.id === id);
          if (!rec) continue;
          dCelkem++;
          if (isDone(rec)) dHotovo++;
        }
      } else {
        // Doplněk: jeden souhrnný záznam, počet hotových sérií je v `sets`.
        const id = plannedId(week.number, day.key, ex.id);
        const rec = list.find(r => r.id === id);
        if (!rec) continue;
        const tpl = plannedTemplate(ex.id, id);
        const total = parseInt(tpl?.sets ?? rec.sets, 10) || 1;
        dCelkem += total;
        if (isDone(rec)) {
          dHotovo += Math.min(total, parseInt(rec.sets, 10) || 0);
        }
      }
    }

    if (dCelkem > 0) {
      dny.push({ key: day.key, label: day.label, hotovo: dHotovo, celkem: dCelkem });
      hotovo += dHotovo;
      celkem += dCelkem;
    }
  }

  return { hotovo, celkem, dny };
}

/**
 * Stejná série z minulé expozice téhož cviku – tj. stejný index série
 * o týden zpět. Vrací nejbližší dřívější týden, kde záznam existuje a je odškrtnutý.
 */
export function previousExposure(
  currentWeek: number,
  dayKey: string,
  exerciseId: string,
  setIndex: number | undefined,
  records: Record<string, TrainingRecord[]>,
): TrainingRecord | null {
  const list = records[exerciseId] ?? [];
  for (let w = currentWeek - 1; w >= 1; w--) {
    const id = plannedId(w, dayKey, exerciseId, setIndex);
    const rec = list.find(r => r.id === id);
    if (rec && !rec.planned) return rec;
  }
  return null;
}

/** Den v plánu podle týdne a klíče dne. */
export function findDay(weekNumber: number, dayKey: string): { week: Week; day: WorkoutDay } | null {
  const week = PHASE3_WEEKS.find(w => w.number === weekNumber);
  if (!week) return null;
  const day = week.days.find(d => d.key === dayKey);
  return day ? { week, day } : null;
}

export type { Exercise };
