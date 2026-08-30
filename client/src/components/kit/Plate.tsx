// Grafická deska pod hero. Kreslená celá tady — halftone rastr, světelná
// louže, obří duch číslice a technické linky. Žádná bitmapa, takže se
// nenačítá nic navíc a na mobilu je to okamžité a ostré na retině.
export type PlateKey = 'overview' | 'plan' | 'guide' | 'diary' | 'progress' | 'tools';

interface Props {
  variant: PlateKey;
  /** Obří číslice na pozadí — týden, pořadí záložky, cokoli krátkého. */
  ghost?: string;
}

// Každá záložka má jinak posazené světlo, ať se hero neopakují.
const LIGHT: Record<PlateKey, string> = {
  overview: '78% 18%',
  plan: '18% 22%',
  guide: '50% 12%',
  diary: '86% 40%',
  progress: '24% 78%',
  tools: '62% 30%',
};

export default function Plate({ variant, ghost }: Props) {
  return (
    <div className="gd-plate" aria-hidden="true">
      {/* světelná louže — imituje studiový reflektor */}
      <div
        className="gd-plate__light"
        style={{ ['--pos' as string]: LIGHT[variant] }}
      />

      {/* halftone rastr, zeslabený maskou do ztracena */}
      <div className="gd-plate__halftone" />


      {/* technické linky + duch číslice */}
      <svg className="gd-plate__ink" viewBox="0 0 400 560" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="gd-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.015" />
          </linearGradient>
        </defs>

        {/* jemná mřížka */}
        <g stroke="#FFFFFF" strokeOpacity="0.055" strokeWidth="1">
          {[80, 160, 240, 320].map(x => <line key={`v${x}`} x1={x} y1="0" x2={x} y2="560" />)}
          {[140, 280, 420].map(y => <line key={`h${y}`} x1="0" y1={y} x2="400" y2={y} />)}
        </g>

        {/* diagonála přes celou desku */}
        <line x1="-40" y1="600" x2="440" y2="-40" stroke="#FFFFFF" strokeOpacity="0.08" strokeWidth="1" />

        {/* registrační značky v rozích */}
        <g stroke="#FFFFFF" strokeOpacity="0.22" strokeWidth="1">
          <path d="M16 16 h18 M16 16 v18" />
          <path d="M384 16 h-18 M384 16 v18" />
          <path d="M16 544 h18 M16 544 v-18" />
          <path d="M384 544 h-18 M384 544 v-18" />
        </g>

        {/* duch číslice — obtah, oříznutý rámem */}
        {ghost && (
          <text
            x="400" y="432"
            textAnchor="end"
            className="gd-plate__ghost"
            fill="none"
            stroke="url(#gd-fade)"
            strokeWidth="1.5"
          >
            {ghost}
          </text>
        )}
      </svg>

      {/* clona zdola – text hero pak leží na čisté černé, ne v kresbě */}
      <div className="gd-plate__scrim" />

      {/* filmové zrno – jen tady. Přes celou appku to přes mix-blend-mode
          viditelně sráželo kontrast dat, která se čtou mezi sériemi. */}
      <div className="gd-plate__grain" />
    </div>
  );
}
