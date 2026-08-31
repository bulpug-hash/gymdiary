// Měření skutečné pauzy mezi sériemi.
//
// Odpočet v RestBaru je PŘEDPIS (kolik si má odpočinout). Tohle je SKUTEČNOST:
// kolik času uplynulo od odškrtnutí jedné série do odškrtnutí další. Ta dvě
// čísla se běžně liší o desítky sekund a pro vyhodnocení tréninku je zajímavé
// to druhé.
//
// Značka se drží v localStorage, ne v paměti — mezi sériemi appka na telefonu
// běžně usne nebo se zavře a v paměti by čas nepřežil.

const KLIC = 'gymdiary_setclock_v1';

/** Pod tímhle je to překlep nebo oprava zápisu, ne pauza. */
const MIN_S = 15;
/** Nad tímhle už to není pauza mezi sériemi, ale přestávka nebo jiný den. */
const MAX_S = 30 * 60;

function nacti(): number | null {
  try {
    const raw = localStorage.getItem(KLIC);
    if (!raw) return null;
    const n = Number(JSON.parse(raw)?.at);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/**
 * Sekundy od poslední odškrtnuté série. `null`, když je to první série,
 * nebo když je odstup mimo věrohodné meze — radši nic než nesmysl v datech.
 */
export function pauzaOdPosledni(): number | null {
  const at = nacti();
  if (at === null) return null;
  const s = Math.round((Date.now() - at) / 1000);
  if (s < MIN_S || s > MAX_S) return null;
  return s;
}

/** Zapíše, že právě teď byla série hotová. */
export function oznacSeriiHotovou(): void {
  try {
    localStorage.setItem(KLIC, JSON.stringify({ at: Date.now() }));
  } catch {
    /* kvóta – měření pauzy není kritické */
  }
}

/** „2:45" nebo „48 s". */
export function formatPauzu(s: number): string {
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  const zb = s % 60;
  return `${m}:${String(zb).padStart(2, '0')}`;
}
