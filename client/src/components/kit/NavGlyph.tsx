// Číslice do spodní lišty. Stejný jazyk jako duch číslice na desce hero:
// obtah místo výplně, kolem aktivní registrační značky jako na tiskovém archu.
interface Props {
  n: string;
  active: boolean;
}

export default function NavGlyph({ n, active }: Props) {
  return (
    <svg
      className="gd-navglyph"
      viewBox="0 0 44 28"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      {active && (
        <g className="gd-navglyph__ticks">
          <path d="M1.5 2 h6 M1.5 2 v5" />
          <path d="M42.5 2 h-6 M42.5 2 v5" />
          <path d="M1.5 26 h6 M1.5 26 v-5" />
          <path d="M42.5 26 h-6 M42.5 26 v-5" />
        </g>
      )}
      <text x="22" y="22" textAnchor="middle" className="gd-navglyph__n">
        {n}
      </text>
    </svg>
  );
}
