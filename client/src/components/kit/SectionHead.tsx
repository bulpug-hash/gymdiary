// Jednotná hlavička sekce: pořadové číslo, popisek, linka přes zbytek šířky.
import type { ReactNode } from 'react';

interface Props {
  n?: string;
  label: string;
  right?: ReactNode;
}

export default function SectionHead({ n, label, right }: Props) {
  return (
    <div className="gd-sechead">
      {n && <span className="gd-sechead__n">{n}</span>}
      <span className="gd-sechead__label">{label}</span>
      <span className="gd-sechead__rule" />
      {right && <span className="gd-sechead__right">{right}</span>}
    </div>
  );
}
