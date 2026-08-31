// Rozehřívací série (Zatsiorsky) k hlavnímu cviku dne.
//
// Jeden zdroj pravdy pro Přehled i Plán — dřív to byly dvě různé tabulky
// a ta v Přehledu se navíc řídila DNEŠNÍM dnem, zatímco zápis sérií vedle ní
// běžel podle VYBRANÉHO dne. Při proklikání jiného dne nebo týdne pak
// rozcvička ukazovala váhy k úplně jinému tréninku.
//
// ⚠️ Rozehřívací série se do deníku NEZAPISUJÍ a nejdou odškrtnout.
// Není to opomenutí — objem by se tím nafoukl o série, které se nepočítají.
// Je to referenční tabulka, která má být vidět rovnou, bez rozklikávání.
import { WARMUP_SERIES_BY_WEEK, type WarmupSet } from '@/lib/data';

const LIFT: Record<string, { key: 'squat' | 'bench' | 'deadlift'; label: string }> = {
  lower: { key: 'squat', label: 'Squat' },
  upper: { key: 'bench', label: 'Bench press' },
  fullbody: { key: 'deadlift', label: 'Deadlift' },
};

export function warmupLiftLabel(dayType: string): string | null {
  return LIFT[dayType]?.label ?? null;
}

interface Props {
  dayType: string;
  weekNumber: number;
}

export default function WarmupTable({ dayType, weekNumber }: Props) {
  const lift = LIFT[dayType];
  if (!lift) return null;
  const series = WARMUP_SERIES_BY_WEEK[weekNumber]?.[lift.key];
  if (!series || series.length === 0) return null;

  const vaha = (w: number) => (w === 20 ? 'Tyč' : `${String(w).replace('.', ',')} kg`);
  const procenta = (note?: string) => note?.match(/(~?\d+%)/)?.[1] ?? '–';

  const bunka = {
    padding: '9px 0',
    borderTop: '1px solid var(--gd-line)',
    fontVariantNumeric: 'tabular-nums' as const,
    fontSize: 12,
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          display: 'flex', alignItems: 'baseline', gap: 8,
          paddingBottom: 8, marginBottom: 2,
        }}
      >
        <span className="gd-tag" style={{ color: 'var(--gd-fern)' }}>Rozehřátí</span>
        <span style={{ fontSize: 11, color: 'var(--gd-text-3)', flex: 1, minWidth: 0 }}>
          {lift.label} · Zatsiorsky
        </span>
        <span className="gd-tag" style={{ color: 'var(--gd-text-4)' }}>Nezapisuje se</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
        {['Série', 'Váha', 'Reps', '% 1RM'].map(h => (
          <div key={h} className="gd-tag" style={{ padding: '0 0 7px', color: 'var(--gd-text-4)' }}>{h}</div>
        ))}
        {series.map((row: WarmupSet, i: number) => (
          <div key={i} style={{ display: 'contents' }}>
            <div style={{ ...bunka, color: 'var(--gd-text-3)' }}>1×{row.reps}</div>
            <div style={{ ...bunka, color: 'var(--gd-text)', fontWeight: 700 }}>{vaha(row.weight)}</div>
            <div style={{ ...bunka, color: 'var(--gd-text-3)' }}>{row.reps}</div>
            <div style={{ ...bunka, color: 'var(--gd-fern)', fontWeight: 700 }}>{procenta(row.note)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
