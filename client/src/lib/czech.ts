// Češtinské pomocníky sdílené napříč komponentami.

/** Plurálová shoda: 1 cvik / 2–4 cviky / 5+ cviků. */
export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}
