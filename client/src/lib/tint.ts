// Průhlednost barvy z tokenu. `var(--gd-accent)15` je neplatné CSS – hexový
// alfa suffix funguje jen na hex literálu, ne na custom property, takže
// prohlížeč celou deklaraci zahodí. color-mix() funguje na obojí.
export function tint(color: string, pct: number): string {
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
}

// Uživatel píše česky, takže do váhy zadá "152,5". parseFloat("152,5") vrátí 152
// a desetiny tiše zmizí ze všech výpočtů (objem, odhad 1RM, PR). Ukládáme proto
// vždy kanonicky s tečkou. Nečíselné hodnoty ("8/3/6/6", "10–12") nechá být.
export function normalizeDecimal(value: string): string {
  const t = value.trim();
  if (!t) return t;
  if (/^-?\d+(?:[.,]\d+)?$/.test(t)) return t.replace(',', '.');
  return t;
}

// Opačný směr — na displeji se váhy píšou s čárkou.
export function formatWeight(value: string): string {
  return value.replace('.', ',');
}
