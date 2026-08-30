// Kalkulačka kotoučů: co naložit na jednu stranu.
//
// Plán předepisuje 152,5 / 107,5 / 162,5 kg a rozehřívací tabulka přidá další
// čtyři váhy na trénink. Tohle to rozpočítá, ať se to nedělá v hlavě u stojanu.

/** Kotouče, co bývají v posilovně. Od nejtěžšího. */
export const DEFAULT_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
export const DEFAULT_BAR = 20;

export interface PlateResult {
  /** Kotouče na JEDNU stranu, od nejtěžšího. */
  perSide: number[];
  /** Váha, které se reálně dosáhne. */
  achieved: number;
  /** Rozdíl proti cíli — 0 znamená, že to jde naložit přesně. */
  off: number;
  /** Cíl je pod váhou samotné osy. */
  belowBar: boolean;
}

/**
 * Hladový rozklad. U standardní sady kotoučů dává optimální výsledek,
 * protože každý další kotouč se vejde do zbytku po tom předchozím.
 */
export function loadPlates(
  target: number,
  bar: number = DEFAULT_BAR,
  plates: number[] = DEFAULT_PLATES,
): PlateResult {
  if (!isFinite(target) || target <= 0) {
    return { perSide: [], achieved: bar, off: 0, belowBar: true };
  }
  if (target < bar) {
    return { perSide: [], achieved: bar, off: +(bar - target).toFixed(2), belowBar: true };
  }

  let perSideTarget = (target - bar) / 2;
  const perSide: number[] = [];
  const sorted = [...plates].sort((a, b) => b - a);

  for (const p of sorted) {
    // Malá tolerance kvůli plovoucí čárce (0,1 + 0,2 ≠ 0,3).
    while (perSideTarget + 1e-9 >= p) {
      perSide.push(p);
      perSideTarget = +(perSideTarget - p).toFixed(4);
    }
  }

  const loaded = perSide.reduce((a, b) => a + b, 0);
  const achieved = +(bar + loaded * 2).toFixed(2);
  return {
    perSide,
    achieved,
    off: +(target - achieved).toFixed(2),
    belowBar: false,
  };
}

/** „25 + 25 + 15 + 2,5" — na jednu stranu, s českou čárkou. */
export function formatPerSide(perSide: number[]): string {
  if (perSide.length === 0) return 'jen osa';
  return perSide.map(p => String(p).replace('.', ',')).join(' + ');
}

/** Zkrácený zápis se závorkou pro opakované kotouče: „2× 25 + 15". */
export function formatPerSideShort(perSide: number[]): string {
  if (perSide.length === 0) return 'jen osa';
  const out: string[] = [];
  let i = 0;
  while (i < perSide.length) {
    const p = perSide[i];
    let n = 0;
    while (i < perSide.length && perSide[i] === p) { n++; i++; }
    const w = String(p).replace('.', ',');
    out.push(n > 1 ? `${n}× ${w}` : w);
  }
  return out.join(' + ');
}
