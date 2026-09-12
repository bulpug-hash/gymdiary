// Zápis běhu nebo HIIT lekce z Přehledu.
//
// Dřív se den s lekcí zapisoval přes SetLogger jako „série": formulář nabízel
// Váha 0 / Opak. 65 / RPE, po odškrtnutí naskočil odpočinkový timer a běh se
// NEDOSTAL do Deníku → Běhy ani do exportu. Navíc odškrtnutí nešlo vrátit —
// resetToPlanned nemá u lekce žádnou šablonu, takže appka napsala „Série
// vrácena" a nestalo se nic.
//
// Teď jeden zápis dělá dvě věci naráz:
//  1) záznam do logu běhů / HIIT (to, co vidí Deník a XLSX)
//  2) tréninkový záznam s plan-id (podle něj weekProgress označí den hotový)
// Obojí sdílí stejné id, takže zrušení zápisu smaže oboje.
import { useState } from 'react';
import { toast } from 'sonner';
import type { WorkoutDataHook } from '@/lib/types';
import type { RunRecord, HIITRecord } from '@/lib/data';
import { plannedId } from '@/lib/planLink';
import { cvikProMode, type DayMode } from '@/lib/dayMode';
import {
  loadRunRecords, loadHIITRecords, upsertRun, upsertHIIT, removeRun, removeHIIT,
  naSekundy, zSekund, tempo,
} from '@/lib/activityLog';
import { normalizeDecimal } from '@/lib/tint';
import { ulozeno, tap } from '@/lib/haptics';
import { undoToast } from '@/lib/undo';
import { Tick } from '@/components/kit';

interface Props {
  week: number;
  /** Den v PLÁNU — drží se ho id. */
  planDayKey: string;
  /** Kalendářní datum, kdy se to doopravdy odcvičilo. */
  date: string;
  mode: DayMode;
  workoutData: WorkoutDataHook;
  /** Předepsaná vzdálenost, jen jako nápověda do pole. */
  planKm?: number;
  planZone?: string;
}

const cz = (n: number) => String(n).replace('.', ',');

export default function LessonLogger({ week, planDayKey, date, mode, workoutData, planKm, planZone }: Props) {
  const exId = cvikProMode(planDayKey, mode);
  const id = plannedId(week, planDayKey, exId);
  const [, setTik] = useState(0);
  const obnov = () => setTik(t => t + 1);

  const beh: RunRecord | undefined = mode === 'run' ? loadRunRecords().find(r => r.id === id) : undefined;
  const lekce: HIITRecord | undefined = mode === 'hiit' ? loadHIITRecords().find(r => r.id === id) : undefined;
  const zapsano = beh ?? lekce;

  const [upravuji, setUpravuji] = useState(false);
  const [km, setKm] = useState('');
  const [cas, setCas] = useState('');
  const [tep, setTep] = useState('');
  const [kcal, setKcal] = useState('');
  const [chyba, setChyba] = useState<string | null>(null);

  const otevriUpravu = () => {
    setKm(beh ? cz(parseFloat(beh.distance)) : '');
    setCas(zapsano?.duration ?? '');
    setTep(zapsano?.avgHr ?? '');
    setKcal(lekce?.calories ?? '');
    setChyba(null);
    setUpravuji(true);
  };

  const zapisTreninkovyZaznam = (reps: string, note: string) => {
    const existuje = workoutData.getRecords(exId).find(r => r.id === id);
    if (existuje) {
      workoutData.updateRecord(exId, id, date, '1', '0', reps, note);
    } else {
      // restoreRecord zároveň smaže případný náhrobek z dřívějšího zrušení —
      // bez toho by opakovaný zápis po reloadu zmizel.
      workoutData.restoreRecord(exId, { id, date, sets: '1', weight: '0', reps, note });
    }
  };

  const uloz = () => {
    const sekundy = naSekundy(cas);
    if (!sekundy || sekundy < 60) { setChyba('Zadej čas, třeba 40:17 nebo 1:05:00.'); return; }
    const tepCislo = tep.trim() ? parseInt(tep, 10) : null;
    if (tep.trim() && (!tepCislo || tepCislo < 60 || tepCislo > 230)) { setChyba('Tep mimo rozumné meze (60–230).'); return; }

    const duration = zSekund(sekundy);
    if (mode === 'run') {
      const vzdalenost = parseFloat(normalizeDecimal(km));
      if (!(vzdalenost > 0) || vzdalenost > 100) { setChyba('Zadej vzdálenost v km, třeba 6,4.'); return; }
      upsertRun({
        id, date, duration,
        distance: String(Math.round(vzdalenost * 100) / 100),
        zone: planZone ?? '—',
        avgPace: tempo(vzdalenost, sekundy) ?? undefined,
        avgHr: tepCislo ? String(tepCislo) : undefined,
        note: `Zapsáno z Přehledu · T${week}`,
      });
      zapisTreninkovyZaznam(duration, `BĚH · T${week} · ${cz(vzdalenost)} km`);
    } else {
      upsertHIIT({
        id, date, type: 'other', duration,
        zone: '—',
        avgHr: tepCislo ? String(tepCislo) : undefined,
        calories: kcal.trim() ? String(parseInt(kcal, 10) || '') : undefined,
        exercises: 'HIIT lekce',
        note: `Zapsáno z Přehledu · T${week}`,
      });
      zapisTreninkovyZaznam(duration, `HIIT · T${week}`);
    }
    // Žádný odpočinkový timer — po běhu ani po lekci nedává smysl.
    ulozeno();
    setUpravuji(false);
    obnov();
  };

  const zrus = () => {
    tap();
    const zaloha = zapsano;
    const trenink = workoutData.getRecords(exId).find(r => r.id === id);
    if (mode === 'run') removeRun(id); else removeHIIT(id);
    if (trenink) workoutData.deleteRecord(exId, id);
    obnov();
    undoToast(mode === 'run' ? 'Zápis běhu zrušen' : 'Zápis HIIT zrušen', () => {
      if (zaloha) { if (mode === 'run') upsertRun(zaloha as RunRecord); else upsertHIIT(zaloha as HIITRecord); }
      if (trenink) workoutData.restoreRecord(exId, trenink);
      obnov();
    });
  };

  const pole = { width: '100%' } as const;
  const stitek = (t: string) => <span className="gd-tag" style={{ display: 'block', marginBottom: 5, color: 'var(--gd-text-3)' }}>{t}</span>;

  /* ---------- zapsáno ---------- */
  if (zapsano && !upravuji) {
    const tempoTxt = beh?.avgPace;
    return (
      <div style={{
        padding: '14px 14px 12px', marginBottom: 18,
        border: '1px solid color-mix(in srgb, var(--gd-accent) 55%, transparent)',
        background: 'color-mix(in srgb, var(--gd-accent) 7%, transparent)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 26, height: 26, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--gd-accent)', color: 'var(--gd-accent-ink)', flexShrink: 0,
          }}><Tick /></span>
          <span className="gd-tag" style={{ flex: 1, color: 'var(--gd-accent)' }}>
            {mode === 'run' ? 'Běh zapsán' : 'HIIT zapsán'}
          </span>
        </div>
        <div style={{ marginTop: 10, fontSize: 15, fontWeight: 700, color: 'var(--gd-text)', lineHeight: 1.4 }}>
          {beh && <>{cz(parseFloat(beh.distance))} km · </>}
          {zapsano.duration}
          {tempoTxt && <> · {tempoTxt}</>}
          {zapsano.avgHr && <> · {zapsano.avgHr} bpm</>}
          {lekce?.calories && <> · {lekce.calories} kcal</>}
        </div>
        <div style={{ fontSize: 11, color: 'var(--gd-text-4)', marginTop: 4 }}>
          Je v Deníku → {mode === 'run' ? 'Běhy' : 'HIIT'} i v exportu.
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={otevriUpravu} style={tlacitko(false)}>Upravit</button>
          <button onClick={zrus} style={tlacitko(false, true)}>Zrušit zápis</button>
        </div>
      </div>
    );
  }

  /* ---------- formulář ---------- */
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: mode === 'run' ? '1fr 1fr 1fr' : '1fr 1fr 1fr', gap: 8 }}>
        {mode === 'run' && (
          <label>
            {stitek('Km')}
            <input value={km} onChange={e => setKm(e.target.value)} inputMode="decimal"
              placeholder={planKm ? cz(planKm) : '6,4'} aria-label="Vzdálenost v km" style={pole} />
          </label>
        )}
        <label>
          {stitek('Čas')}
          <input value={cas} onChange={e => setCas(e.target.value)} inputMode="numeric"
            placeholder={mode === 'run' ? '40:17' : '25:57'} aria-label="Čas" style={pole} />
        </label>
        <label>
          {stitek('Tep ⌀')}
          <input value={tep} onChange={e => setTep(e.target.value)} inputMode="numeric"
            placeholder="150" aria-label="Průměrný tep" style={pole} />
        </label>
        {mode === 'hiit' && (
          <label>
            {stitek('Kcal')}
            <input value={kcal} onChange={e => setKcal(e.target.value)} inputMode="numeric"
              placeholder="417" aria-label="Kalorie" style={pole} />
          </label>
        )}
      </div>
      {chyba && <div className="gd-set__warn" style={{ marginTop: 8 }}>{chyba}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button className="gd-set__save" onClick={uloz} style={{ flex: 1 }}>
          {mode === 'run' ? 'Zapsat běh' : 'Zapsat HIIT'}
        </button>
        {upravuji && <button onClick={() => setUpravuji(false)} style={tlacitko(false)}>Zrušit</button>}
      </div>
    </div>
  );
}

function tlacitko(hlavni: boolean, nebezpecne = false) {
  return {
    flex: 1, padding: '11px 10px', borderRadius: 0, cursor: 'pointer',
    fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase' as const,
    background: hlavni ? 'var(--gd-accent)' : 'transparent',
    color: nebezpecne ? 'var(--gd-danger)' : hlavni ? 'var(--gd-accent-ink)' : 'var(--gd-text-2)',
    border: `1px solid ${nebezpecne ? 'color-mix(in srgb, var(--gd-danger) 45%, transparent)' : 'var(--gd-line)'}`,
  };
}
