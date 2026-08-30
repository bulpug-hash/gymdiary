// Ikony do spodní lišty.
//
// Rytiny z knihovny se sem nehodí — na 28 px se z nich stane kaše a griffina
// nerozeznáš od rytíře, takže by navigace přestala fungovat. Tyhle jsou
// kreslené ve stejném heraldickém jazyce (obtah, žádná výplň, jako duch
// číslice na desce hero), ale navržené pro tuhle velikost: tlusté tahy,
// minimum detailu.
import type { ReactNode } from 'react';

export type NavIconKey = 'overview' | 'plan' | 'guide' | 'diary' | 'progress' | 'tools';

const PATHS: Record<NavIconKey, ReactNode> = {
  // Vavřínový věnec – z rytiny „Hero Crowned by Victory"
  overview: (
    <>
      <path d="M12 21c-4.2-1.6-6.6-5.4-6.6-9.6 0-3 1.2-5.8 3-7.8" />
      <path d="M12 21c4.2-1.6 6.6-5.4 6.6-9.6 0-3-1.2-5.8-3-7.8" />
      <path d="M6.6 8.4 3.9 7.2M6 12H3.2M7.2 15.6l-2.4 1.2" />
      <path d="M17.4 8.4l2.7-1.2M18 12h2.8M16.8 15.6l2.4 1.2" />
    </>
  ),
  // Korouhev – plán jako tažení
  plan: (
    <>
      <path d="M6 2.5v19" />
      <path d="M6 4h12l-3 3.4L18 11H6z" />
    </>
  ),
  // Otevřená kniha
  guide: (
    <>
      <path d="M12 6.6C9.6 5.2 6.6 5 3.4 5.6v12.2c3.2-.6 6.2-.4 8.6 1" />
      <path d="M12 6.6c2.4-1.4 5.4-1.6 8.6-1v12.2c-3.2-.6-6.2-.4-8.6 1" />
      <path d="M12 6.6v13.2" />
    </>
  ),
  // Brk
  diary: (
    <>
      <path d="M20.4 3.6C13.8 4.8 8.4 9 6.6 15.6l-2.4 4.8" />
      <path d="M20.4 3.6c.9 6.3-2.1 11.7-7.5 13.5-2.1.7-4.2.4-5.7-.6" />
      <path d="M8.4 18.6H3.6" />
    </>
  ),
  // Šíp vzhůru – heraldický a nezaměnitelný
  progress: (
    <>
      <path d="M4 20 20 4" />
      <path d="M13.2 4H20v6.8" />
      <path d="M4 14.4v5.6h5.6" />
    </>
  ),
  // Zkřížená kladiva – tools bez zaměnitelnosti
  tools: (
    <>
      <path d="M6.6 20.4 15.6 6" />
      <path d="M17.4 20.4 8.4 6" />
      <path d="M13.2 3.2h6.2v4.4h-6.2z" transform="rotate(28 16.3 5.4)" />
      <path d="M4.6 3.2h6.2v4.4H4.6z" transform="rotate(-28 7.7 5.4)" />
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
          <path d="M0.8 1.4h4M0.8 1.4v4" />
          <path d="M23.2 1.4h-4M23.2 1.4v4" />
          <path d="M0.8 22.6h4M0.8 22.6v-4" />
          <path d="M23.2 22.6h-4M23.2 22.6v-4" />
        </g>
      )}
      <g className="gd-navicon__art">{PATHS[name]}</g>
    </svg>
  );
}
