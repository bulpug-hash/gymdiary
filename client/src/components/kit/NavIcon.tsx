// Ikony spodní lišty.
//
// Jazyk je vzatý z jejich vlastní grafiky (Noble Knight, Fallen Angel):
// PLNÉ SILUETY, vysoký kontrast, monumentální — ne tenké obrysy. Má to dva
// důvody: sedí to k značce a solidní tvar přežije zmenšení na 26 px, kdežto
// vlásková linka se rozpadne.
//
// Rytiny z knihovny se sem nedaly použít — ověřeno dvakrát, jednou přímo
// a jednou přes prahování na siluetu. Jsou to kresby čarou, ne masa, takže
// v téhle velikosti z nich zbude šum.
//
// Motivy drží jeden svět: helm, korouhev, kodex, brk, křídlo, kladiva.
import type { ReactNode } from 'react';

export type NavIconKey = 'overview' | 'plan' | 'guide' | 'diary' | 'progress' | 'tools';

const PATHS: Record<NavIconKey, ReactNode> = {
  // Helm — motiv Noble Knight
  overview: (
    <path
      fillRule="evenodd"
      d="M12 2.2c-4.3 0-7.1 2.7-7.1 6.7v7.4c0 2.9 3.1 5.7 7.1 5.7s7.1-2.8 7.1-5.7V8.9c0-4-2.8-6.7-7.1-6.7zM6.6 9.6h10.8v2.6H6.6V9.6zm2 5.2h1.9v2.9H8.6v-2.9zm4.9 0h1.9v2.9h-1.9v-2.9z"
    />
  ),
  // Korouhev
  plan: (
    <>
      <path d="M4.4 2h2.1v20H4.4z" />
      <path d="M6.9 3.1h12.7l-2.9 4.3 2.9 4.3H6.9z" />
    </>
  ),
  // Kodex
  guide: (
    <>
      <path d="M11.1 7.2C8.7 5.7 5.9 5.3 2.6 5.9v12.4c3.3-.6 6.1-.2 8.5 1.3z" />
      <path d="M12.9 7.2c2.4-1.5 5.2-1.9 8.5-1.3v12.4c-3.3-.6-6.1-.2-8.5 1.3z" />
    </>
  ),
  // Brk
  diary: (
    <>
      <path d="M21 2.4C13.2 4 7.6 9.2 6.2 16.5l3.4-.7C16 14 21.4 9.6 21 2.4z" />
      <path d="M7.4 15.1 3 21.6l1.6 1.1 4.4-6.4z" />
    </>
  ),
  // Křídlo vzhůru — motiv Fallen Angel. Méně, ale výraznějších per,
  // ať to v 26 px nezůstane jako beztvarý flek.
  progress: (
    <path d="M21.6 2.4C13.4 3.6 7.2 8.4 3.6 16.9l2.9-1.1-.6 3.4 3.4-2.7.2 3.3 3.2-3.4 1 2.9 2.6-4.2 2 1.6c2.4-4.2 3.6-8.9 3.3-14.3z" />
  ),
  // Zkřížená kladiva
  tools: (
    <>
      <path d="M6.9 19.6 16.4 5.9l1.8 1.2L8.7 20.8z" transform="rotate(0)" />
      <path d="M17.1 19.6 7.6 5.9 5.8 7.1l9.5 13.7z" />
      <path d="M13.6 2.6h6.3v3.9h-6.3z" transform="rotate(34 16.7 4.5)" />
      <path d="M4.1 2.6h6.3v3.9H4.1z" transform="rotate(-34 7.2 4.5)" />
    </>
  ),
};

interface Props {
  name: NavIconKey;
  active: boolean;
}

export default function NavIcon({ name, active }: Props) {
  return (
    <svg
      className="gd-navicon"
      viewBox="0 0 24 24"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      {active && (
        <g className="gd-navicon__ticks">
          <path d="M0.6 1.2h4M0.6 1.2v4" />
          <path d="M23.4 1.2h-4M23.4 1.2v4" />
          <path d="M0.6 22.8h4M0.6 22.8v-4" />
          <path d="M23.4 22.8h-4M23.4 22.8v-4" />
        </g>
      )}
      <g className="gd-navicon__art">{PATHS[name]}</g>
    </svg>
  );
}
