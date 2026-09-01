// Běh daného týdne, vykreslený na tom dni, kde se opravdu poběží.
//
// Program nepřidává tréninky: běh NAHRAZUJE jednu HIIT lekci (střídavě St/So),
// takže se blok ukáže na té lekci, která ten týden odpadá. V pátek se ukáže
// jen tehdy, když má týden i nepovinný druhý běh.
import { runForWeek } from '@/lib/data';

interface Props {
  week: number;
  dayKey: string;
}

export default function RunBlock({ week, dayKey }: Props) {
  const plan = runForWeek(week);
  if (!plan) return null;

  const jeHlavni = plan.vymenit === dayKey;
  const jeDruhy = dayKey === 'friday' && !!plan.druhy;
  if (!jeHlavni && !jeDruhy) return null;

  const ram = {
    border: '1px solid color-mix(in srgb, var(--gd-fern) 35%, transparent)',
    background: 'color-mix(in srgb, var(--gd-fern) 6%, transparent)',
    padding: '12px 14px',
    marginBottom: 14,
  };

  if (jeDruhy) {
    return (
      <div style={ram}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <span className="gd-tag" style={{ color: 'var(--gd-fern)' }}>Druhý běh</span>
          <span className="gd-tag" style={{ color: 'var(--gd-text-4)' }}>Nepovinný</span>
        </div>
        <div style={{ fontSize: 14, color: 'var(--gd-text)', fontWeight: 600 }}>{plan.druhy}</div>
        <div style={{ fontSize: 11, color: 'var(--gd-text-3)', marginTop: 4, lineHeight: 1.5 }}>
          Rozloží zátěž, aby dlouhý běh nebyl 100 % týdenního objemu. Když tě něco
          bolí, tenhle vynech jako první.
        </div>
      </div>
    );
  }

  return (
    <div style={ram}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
        <span className="gd-tag" style={{ color: 'var(--gd-fern)' }}>Běh místo HIIT</span>
        <span style={{ fontSize: 11, color: 'var(--gd-text-3)', flex: 1, minWidth: 0 }}>{plan.type}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <span className="gd-display" style={{ fontSize: 30, color: 'var(--gd-accent)', lineHeight: 0.95 }}>
          {String(plan.km).replace('.', ',')}
        </span>
        <span className="gd-tag" style={{ color: 'var(--gd-text-3)', paddingBottom: 4 }}>km</span>
        <span style={{ fontSize: 12, color: 'var(--gd-text-2)', paddingBottom: 3 }}>
          {plan.duration} · {plan.zone}
        </span>
      </div>

      <div style={{ fontSize: 12, color: 'var(--gd-text-2)', marginTop: 8, lineHeight: 1.55 }}>
        {plan.description}
      </div>

      <div style={{ fontSize: 11, color: 'var(--gd-text-4)', marginTop: 8, lineHeight: 1.5 }}>
        Tuhle lekci ten týden vynech a běž místo ní. Příští týden odpadá ta druhá.
      </div>
    </div>
  );
}
