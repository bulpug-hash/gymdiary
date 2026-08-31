// Ikony spodní lišty — varianta 42 „číslo · scanline“
// (247 Technical Numbers / NYC Subway).
//
// Číslo záložky vysazené Archivem 800 a vyplněné vodorovným rastrem přes masku.
// Rastr je 3 × 2,4 px s pruhem 1,5 px, takže v číslici zůstane ~6 linek — dost
// na to, aby to četlo jako rastr, a pořád dost hmoty, aby číslo drželo tvar.
//
// Předchozí verze byly plné siluety (helm, korouhev, kodex…). Tenhle vzor si
// vybral z padesáti a je konzistentnější se zbytkem kitu: čísla záložek
// 01–06 už stejně nese celá appka v hlavičkách sekcí.
//
// ⚠️ ID vzorku a masky MUSÍ být unikátní per instance. V předloze tři z šesti
// souborů sdílejí stejné id (sc42pr) — samostatně to nevadí, ale v jednom
// dokumentu se maskami přepíšou navzájem a zobrazí se špatná číslice.
// Proto useId().
import { useId } from 'react';

export type NavIconKey = 'overview' | 'plan' | 'guide' | 'diary' | 'progress' | 'tools';

const CISLA: Record<NavIconKey, string> = {
  overview: '01',
  plan: '02',
  guide: '03',
  diary: '04',
  progress: '05',
  tools: '06',
};

interface Props {
  name: NavIconKey;
  active: boolean;
}

export default function NavIcon({ name, active }: Props) {
  const uid = useId().replace(/:/g, '');
  const vzorek = `nv-p-${uid}`;
  const maska = `nv-m-${uid}`;

  return (
    <svg
      className="gd-navicon"
      viewBox="0 0 24 24"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern id={vzorek} width="3" height="2.4" patternUnits="userSpaceOnUse">
          <rect width="3" height="1.5" fill="currentColor" />
        </pattern>
        <mask id={maska}>
          <text
            x="12"
            y="17.4"
            textAnchor="middle"
            fontFamily="Archivo, Helvetica, sans-serif"
            fontSize="15"
            fontWeight="800"
            letterSpacing="-0.5"
            fill="#fff"
          >
            {CISLA[name]}
          </text>
        </mask>
      </defs>

      {/* Rohové zaměřovací značky u aktivní záložky – drží se z předchozí verze,
          je to jediné, co kromě barvy odlišuje aktivní stav. */}
      {active && (
        <g className="gd-navicon__ticks">
          <path d="M0.6 1.2h4M0.6 1.2v4" />
          <path d="M23.4 1.2h-4M23.4 1.2v4" />
          <path d="M0.6 22.8h4M0.6 22.8v-4" />
          <path d="M23.4 22.8h-4M23.4 22.8v-4" />
        </g>
      )}

      <rect width="24" height="24" fill={`url(#${vzorek})`} mask={`url(#${maska})`} />
    </svg>
  );
}
