// Aktuální maxima.
//
// CURRENT_MAXES v data.ts je konstanta z dokumentu. Nic ji z 366 záznamů
// neaktualizuje, takže po testovacím týdnu T13 by dlaždice hlásily pořád
// stará čísla, dokud by někdo nesáhl do zdrojáku. Tenhle modul drží override,
// který si uživatel potvrdí sám.
import { CURRENT_MAXES, estimate1RM, type TrainingRecord, type RecordsMap } from '@/lib/data';

const KEY = 'gymdiary_maxes_v1';

export type LiftKey = 'bench' | 'squat' | 'deadlift';
export const LIFT_EXERCISE: Record<LiftKey, string> = {
  bench: 'bench', squat: 'squat', deadlift: 'deadlift',
};

export type MaxOverrides = Partial<Record<LiftKey, number>>;

export function loadOverrides(): MaxOverrides {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? (parsed as MaxOverrides) : {};
  } catch {
    return {};
  }
}

function saveOverrides(o: MaxOverrides) {
  try { localStorage.setItem(KEY, JSON.stringify(o)); } catch { /* ignore */ }
}

export function setMax(lift: LiftKey, value: number) {
  const o = loadOverrides();
  o[lift] = value;
  saveOverrides(o);
}

/** Potvrzené maximum: vyšší z dokumentu a z toho, co si uživatel potvrdil. */
export function getCurrentMaxes(): Record<LiftKey, number> {
  const o = loadOverrides();
  return {
    bench: Math.max(CURRENT_MAXES.bench, o.bench ?? 0),
    squat: Math.max(CURRENT_MAXES.squat, o.squat ?? 0),
    deadlift: Math.max(CURRENT_MAXES.deadlift, o.deadlift ?? 0),
  };
}

export interface Candidate {
  /** Nejlepší odhad 1RM z reálných sérií za sledované období. */
  est1RM: number;
  weight: number;
  reps: number;
  date: string;
  /** Série byla na RPE ≥ 9 – odhad je tedy blízko skutečnému maximu. */
  nearMax: boolean;
}

/**
 * Nejlepší výkon za posledních `weeks` týdnů. Bere jen reálné série
 * (předepsané se nepočítají) a vrací i to, jestli šlo o sérii na doraz.
 */
export function bestRecent(
  records: RecordsMap,
  lift: LiftKey,
  weeks = 6,
  now: Date = new Date(),
): Candidate | null {
  const list = (records[LIFT_EXERCISE[lift]] ?? []).filter((r: TrainingRecord) => !r.planned);
  const from = new Date(now);
  from.setDate(from.getDate() - weeks * 7);

  let best: Candidate | null = null;
  for (const r of list) {
    const d = new Date(r.date + 'T12:00:00');
    if (d < from || d > now) continue;
    const w = parseFloat(r.weight) || 0;
    const reps = parseInt(r.reps, 10) || 0;
    if (w <= 0 || reps <= 0) continue;
    const est = estimate1RM(w, reps);
    const rpe = parseFloat(r.rpe ?? '');
    if (!best || est > best.est1RM) {
      best = { est1RM: Math.round(est), weight: w, reps, date: r.date, nearMax: isFinite(rpe) && rpe >= 9 };
    }
  }
  return best;
}
