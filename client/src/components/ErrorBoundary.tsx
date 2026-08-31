// Poslední záchytná síť. Musí fungovat i tehdy, když je rozbité všechno ostatní,
// takže tady schválně NEJSOU žádné importy z lib/ ani z ui/ – čte se přímo
// localStorage a styluje se inline přes tokeny.
//
// Původní verze nabízela jediné tlačítko „Reload Page“. To je u pádu způsobeného
// poškozeným úložištěm nekonečná smyčka: reload spustí přesně tentýž pád a data
// z appky nejde dostat ven. Proto je první a nejdůležitější akce STAŽENÍ dat.
import { Component, type ReactNode } from 'react';

const KEYS = [
  'gymdiary_records_v3',
  'gymdiary_backup_v1',
  'gymdiary_deleted_v1',
  'gymdiary_maxes_v1',
  'gymdiary_bodyweight_v1',
  '__run_log__',
  '__hiit_log__',
];

interface Props { children: ReactNode }
interface State { error: Error | null }

/** Posbírá všechno, co appka o uživateli drží – i když je to poškozené. */
function dumpStorage(): string {
  const out: Record<string, unknown> = {
    __dump__: new Date().toISOString(),
    __ua__: navigator.userAgent,
  };
  for (const k of KEYS) {
    const raw = localStorage.getItem(k);
    if (raw == null) continue;
    // Když je hodnota poškozená, ulož ji aspoň jako syrový text – pořád je
    // z ní víc k zachránění než z ničeho.
    try { out[k] = JSON.parse(raw); } catch { out[k] = { __raw__: raw }; }
  }
  return JSON.stringify(out, null, 2);
}

function countRecords(): number | null {
  try {
    const m = JSON.parse(localStorage.getItem('gymdiary_records_v3') || '{}');
    if (!m || typeof m !== 'object') return null;
    return Object.values(m).reduce<number>(
      (n, v) => n + (Array.isArray(v) ? v.filter((r: { planned?: boolean }) => !r.planned).length : 0),
      0,
    );
  } catch { return null; }
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  private stahni = () => {
    const blob = new Blob([dumpStorage()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gymdiary-zaloha-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  private obnovZeZalohy = () => {
    try {
      const snaps = JSON.parse(localStorage.getItem('gymdiary_backup_v1') || '[]');
      const snap = Array.isArray(snaps) ? snaps[0] : null;
      if (!snap?.records) {
        alert('Záloha v prohlížeči není. Stáhni si data do souboru a napiš mi.');
        return;
      }
      const kdy = new Date(snap.ts).toLocaleString('cs-CZ');
      if (!confirm(`Vrátit záznamy do stavu z ${kdy} (${snap.count} záznamů)?`)) return;
      localStorage.setItem('gymdiary_records_v3', JSON.stringify(snap.records));
      location.reload();
    } catch {
      alert('Zálohu se nepodařilo přečíst. Stáhni si data do souboru.');
    }
  };

  render() {
    if (!this.state.error) return this.props.children;

    const pocet = countRecords();
    const btn = (hlavni: boolean) => ({
      display: 'block', width: '100%', textAlign: 'left' as const,
      padding: '14px 16px', marginBottom: 8, borderRadius: 0, cursor: 'pointer',
      fontFamily: 'Archivo, sans-serif', fontSize: 13, fontWeight: 700,
      letterSpacing: '0.08em', textTransform: 'uppercase' as const,
      background: hlavni ? 'var(--gd-accent)' : 'transparent',
      color: hlavni ? 'var(--gd-accent-ink)' : 'var(--gd-text-2)',
      border: `1px solid ${hlavni ? 'var(--gd-accent)' : 'var(--gd-line)'}`,
    });

    return (
      <div style={{
        minHeight: '100dvh', background: 'var(--gd-ink)', color: 'var(--gd-text)',
        padding: '48px 20px', fontFamily: 'Archivo, sans-serif',
      }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.24em',
            textTransform: 'uppercase', color: 'var(--gd-danger)', marginBottom: 10,
          }}>
            247 · chyba
          </div>

          <h1 style={{
            fontSize: 34, fontWeight: 800, lineHeight: 0.92,
            textTransform: 'uppercase', margin: '0 0 14px',
          }}>
            Appka spadla
          </h1>

          <p style={{
            fontFamily: '"Source Serif 4", Georgia, serif', fontSize: 16,
            lineHeight: 1.5, color: 'var(--gd-text-2)', margin: '0 0 6px',
          }}>
            Tvoje záznamy jsou pořád v telefonu — tenhle pád je nesmazal.
            Než cokoli dalšího uděláš, stáhni si je do souboru.
          </p>

          {pocet !== null && (
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: 'var(--gd-accent)', margin: '0 0 22px',
            }}>
              V úložišti je {pocet} tvých záznamů
            </p>
          )}

          <div style={{ marginTop: 24 }}>
            <button style={btn(true)} onClick={this.stahni}>
              1 — Stáhnout data do souboru
            </button>
            <button style={btn(false)} onClick={this.obnovZeZalohy}>
              2 — Obnovit z poslední zálohy
            </button>
            <button style={btn(false)} onClick={() => location.reload()}>
              3 — Zkusit znovu spustit
            </button>
          </div>

          <details style={{ marginTop: 28 }}>
            <summary style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.24em',
              textTransform: 'uppercase', color: 'var(--gd-text-4)', cursor: 'pointer',
            }}>
              Technický detail
            </summary>
            <pre style={{
              marginTop: 10, padding: 12, background: 'var(--gd-surface)',
              border: '1px solid var(--gd-line)', fontSize: 11, lineHeight: 1.45,
              color: 'var(--gd-text-3)', whiteSpace: 'pre-wrap', overflowX: 'auto',
            }}>
              {this.state.error.stack || this.state.error.message}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
