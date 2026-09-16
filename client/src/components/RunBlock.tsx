// Běh daného týdne, vykreslený na dni s lekcí, kam patří.
//
// Středa: ranní běh PŘED večerní HIIT lekcí. Běží se každý týden (kromě
// taperu a testu) a nic nenahrazuje — ukazuje se vždycky.
// Sobota: náhrada za HIIT, když lekce nevyjde. V Přehledu se ukáže až po
// přepnutí na běh (`vynutit`), v Plánu je vidět pořád jako alternativa.
// Pátek už druhý běh nenese — běhy se nepřidávají (zadání 16. 9. 2026).
import { runSessionFor } from '@/lib/data';

interface Props {
  week: number;
  dayKey: string;
  /** Sobota: uživatel si lekci přepnul na běh. */
  vynutit?: boolean;
  /** Plán: ukázat sobotní náhradu i bez přepnutí, jako alternativu. */
  alternativa?: boolean;
}

const cz = (n: number) => String(n).replace('.', ',');

export default function RunBlock({ week, dayKey, vynutit, alternativa }: Props) {
  const jeStreda = dayKey === 'wednesday';
  const jeSobota = dayKey === 'saturday';
  if (!jeStreda && !jeSobota) return null;
  if (jeSobota && !vynutit && !alternativa) return null;

  const s = runSessionFor(week, dayKey);

  const ram = {
    border: '1px solid color-mix(in srgb, var(--gd-fern) 35%, transparent)',
    background: 'color-mix(in srgb, var(--gd-fern) 6%, transparent)',
    padding: '12px 14px',
    marginBottom: 14,
  };
  const nadpis = jeStreda ? 'Ranní běh · před HIIT' : vynutit ? 'Běh místo HIIT' : 'Když nevyjde HIIT';

  if (!s) {
    // Taper a test maxim. Po přepnutí soboty na běh to musí říct nahlas,
    // jinak by blok prostě zmizel a vypadalo by to jako chyba.
    if (week < 12) return null;
    return (
      <div style={ram}>
        <span className="gd-tag" style={{ color: 'var(--gd-fern)' }}>{nadpis}</span>
        <div style={{ fontSize: 12, color: 'var(--gd-text-2)', marginTop: 6, lineHeight: 1.55 }}>
          {week === 12 ? 'Taper' : 'Týden testu maxim'} — tenhle týden se neběhá.
          Únava musí dolů kvůli čince, HIIT ber lehce.
        </div>
      </div>
    );
  }

  return (
    <div style={ram}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
        <span className="gd-tag" style={{ color: 'var(--gd-fern)', flexShrink: 0 }}>{nadpis}</span>
        <span style={{ fontSize: 11, color: 'var(--gd-text-3)', flex: 1, minWidth: 0 }}>{s.type}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <span className="gd-display" style={{ fontSize: 30, color: 'var(--gd-accent)', lineHeight: 0.95 }}>
          {cz(s.km)}
        </span>
        <span className="gd-tag" style={{ color: 'var(--gd-text-3)', paddingBottom: 4 }}>km</span>
        <span style={{ fontSize: 12, color: 'var(--gd-text-2)', paddingBottom: 3 }}>
          {s.duration} · {s.zone}
        </span>
      </div>

      <ol style={{ listStyle: 'none', margin: '10px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {s.kroky.map((k, i) => (
          <li key={i} style={{ display: 'grid', gridTemplateColumns: '16px 1fr', gap: 6, fontSize: 13, lineHeight: 1.45, color: 'var(--gd-text)' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--gd-text-4)', fontVariantNumeric: 'tabular-nums', paddingTop: 2 }}>
              {i + 1}
            </span>
            <span>{k}</span>
          </li>
        ))}
      </ol>

      <div style={{ fontSize: 12, color: 'var(--gd-text-2)', marginTop: 8, lineHeight: 1.55 }}>
        {s.description}
      </div>

      {s.skupina && (
        <div style={{ fontSize: 11, color: 'var(--gd-text-4)', marginTop: 6, lineHeight: 1.5 }}>
          Dlouhá míle, mílaři: {s.skupina}
        </div>
      )}
    </div>
  );
}
