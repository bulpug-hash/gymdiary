// Průhlednost barvy z tokenu. `var(--gd-accent)15` je neplatné CSS – hexový
// alfa suffix funguje jen na hex literálu, ne na custom property, takže
// prohlížeč celou deklaraci zahodí. color-mix() funguje na obojí.
export function tint(color: string, pct: number): string {
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
}
