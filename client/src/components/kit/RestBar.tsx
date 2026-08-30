// Plovoucí lišta odpočinku nad spodní navigací. Vidíš zbývající čas, ať jsi
// kdekoli v appce – timer žije mimo React strom, takže přepnutí záložky ho nezruší.
import { useRestTimer, pauseRest, resumeRest, dismissRest, formatClock } from '@/lib/restTimer';

export default function RestBar() {
  const { running, remaining, duration, label } = useRestTimer();
  if (!running && remaining === 0) return null;

  const pct = duration > 0 ? Math.max(0, Math.min(1, remaining / duration)) : 0;
  const done = remaining === 0;

  return (
    <div className="gd-restbar" role="status" aria-live="polite">
      <div className="gd-restbar__fill" style={{ transform: `scaleX(${pct})` }} aria-hidden="true" />
      <div className="gd-restbar__row">
        <span className="gd-tag gd-restbar__lbl">
          {done ? 'Odpočinek hotov' : label ? `Odpočinek · ${label}` : 'Odpočinek'}
        </span>
        <span className="gd-display gd-restbar__clock">{formatClock(remaining)}</span>
        {!done && (
          <button
            className="gd-restbar__btn"
            onClick={running ? pauseRest : resumeRest}
            aria-label={running ? 'Pozastavit odpočinek' : 'Pokračovat v odpočinku'}
          >
            {running ? 'Pauza' : 'Start'}
          </button>
        )}
        <button className="gd-restbar__btn" onClick={dismissRest} aria-label="Zavřít odpočinek">
          Zavřít
        </button>
      </div>
    </div>
  );
}
