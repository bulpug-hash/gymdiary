// Volba HIIT × běh pro daný den a přesun tréninku na jiný den v týdnu.
//
// Obojí je UŽIVATELSKÝ OVERRIDE nad plánem, ne změna plánu. Plán v data.ts
// zůstává zdrojem pravdy; tady se drží jen odchylky, které si udělal ručně.
// Proto se taky nic z toho neprojeví v PLANNED_RECORDS – ta zůstávají stejná.

const MODE_KEY = 'gymdiary_daymode_v1';
const MOVE_KEY = 'gymdiary_daymove_v1';

export type DayMode = 'hiit' | 'run';

function nacti<T>(klic: string): Record<string, T> {
  try {
    const raw = localStorage.getItem(klic);
    const o = raw ? JSON.parse(raw) : {};
    return o && typeof o === 'object' && !Array.isArray(o) ? o : {};
  } catch { return {}; }
}

function uloz(klic: string, data: unknown) {
  try { localStorage.setItem(klic, JSON.stringify(data)); } catch { /* kvóta */ }
}

const klic = (week: number, dayKey: string) => `w${week}:${dayKey}`;

/* ---------------- HIIT × běh ---------------- */

/** Uložená volba, nebo null když si ten den nic nevybral. */
export function ulozenyMode(week: number, dayKey: string): DayMode | null {
  const v = nacti<DayMode>(MODE_KEY)[klic(week, dayKey)];
  return v === 'hiit' || v === 'run' ? v : null;
}

export function nastavMode(week: number, dayKey: string, mode: DayMode) {
  const o = nacti<DayMode>(MODE_KEY);
  o[klic(week, dayKey)] = mode;
  uloz(MODE_KEY, o);
}

/** Id cviku, pod který se ten den zapisuje. Běh a HIIT se nemíchají. */
export function cvikProMode(dayKey: string, mode: DayMode): string {
  const den = dayKey === 'wednesday' ? 'wed' : dayKey === 'saturday' ? 'sat' : dayKey.slice(0, 3);
  return mode === 'run' ? `run-${den}` : `hiit-${den}`;
}

/* ---------------- přesun dne ---------------- */

/** Kam byl trénink z původního dne přesunutý. null = beze změny. */
export function presunutNa(week: number, dayKey: string): string | null {
  const v = nacti<string>(MOVE_KEY)[klic(week, dayKey)];
  return typeof v === 'string' && v ? v : null;
}

export function nastavPresun(week: number, dayKey: string, novyDen: string | null) {
  const o = nacti<string>(MOVE_KEY);
  if (!novyDen || novyDen === dayKey) delete o[klic(week, dayKey)];
  else o[klic(week, dayKey)] = novyDen;
  uloz(MOVE_KEY, o);
}

/** Všechny přesuny týdne: původní den → nový den. */
export function presunyTydne(week: number): Record<string, string> {
  const o = nacti<string>(MOVE_KEY);
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(o)) {
    const [w, d] = k.split(':');
    if (w === `w${week}` && d && v) out[d] = v;
  }
  return out;
}
