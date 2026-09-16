// Přehled — první obrazovka. Odpovídá na jednu otázku: co dnes a s jakou vahou.
// Kit 247: celoplošný hero s fotkou, pod ním hustá typografická data.
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  PHASE3_WEEKS, getTodayDayKey, getTodayISO, getCurrentWeek, runSessionFor, jeDvojitaStreda,
  GOALS,
} from '@/lib/data';
import type { Week } from '@/lib/data';
import type { WorkoutDataHook, Tab } from '@/lib/types';
import { Hero, QuoteBar, Reveal, SectionHead, Watermark } from '@/components/kit';
import WarmupTable from '@/components/WarmupTable';
import RunBlock from '@/components/RunBlock';
import LessonLogger from '@/components/LessonLogger';
import { ulozenyMode, nastavMode, presunyTydne, nastavPresun, maOdchylky, obnovTyden, type DayMode } from '@/lib/dayMode';
import SetLogger from '@/components/SetLogger';
import { weekProgress, dateForDay, daySummary } from '@/lib/planLink';
import { getCurrentMaxes } from '@/lib/maxes';
import { plural } from '@/lib/czech';
import { tap, ulozeno } from '@/lib/haptics';

interface Props {
  workoutData: WorkoutDataHook;
  onNavigate: (tab: Tab) => void;
}

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABEL: Record<string, string> = {
  monday: 'Pondělí', tuesday: 'Úterý', wednesday: 'Středa', thursday: 'Čtvrtek',
  friday: 'Pátek', saturday: 'Sobota', sunday: 'Neděle',
};
/** „přesunuto ze středy" — předložka i pád se liší den od dne. */
const DAY_ZE: Record<string, string> = {
  monday: 'z pondělí', tuesday: 'z úterý', wednesday: 'ze středy', thursday: 'ze čtvrtka',
  friday: 'z pátku', saturday: 'ze soboty', sunday: 'z neděle',
};
/** Přídavná jména se v češtině netvoří příponou — musí být vypsaná. */
const DAY_ADJ: Record<string, string> = {
  monday: 'pondělní', tuesday: 'úterní', wednesday: 'středeční', thursday: 'čtvrteční',
  friday: 'páteční', saturday: 'sobotní', sunday: 'nedělní',
};
const DAY_SHORT = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

const TYPE_LABEL: Record<string, string> = {
  lower: 'LOWER', upper: 'UPPER', fullbody: 'FULL', hiit: 'HIIT', run: 'RUN', rest: 'VOL',
};

type SetPlanRow = { label: string; weight: string; reps: string; rpe?: string };

// Hlavní série dne – to jediné číslo, kvůli kterému se dnes jde do posilovny
function heroSet(day: { exercises: { category?: string; setPlan?: SetPlanRow[] }[] } | null | undefined): SetPlanRow | null {
  if (!day) return null;
  for (const ex of day.exercises) {
    if (ex.category !== 'main' || !ex.setPlan || ex.setPlan.length === 0) continue;
    const hot = ex.setPlan.find(sp => /OVERLOAD|TOP|CÍL|PR/i.test(sp.label));
    const pick = hot || ex.setPlan.reduce((a, b) => (parseFloat(b.weight) > parseFloat(a.weight) ? b : a));
    return pick;
  }
  return null;
}

const dm = (iso: string) => iso.split('-').slice(1).reverse().join('.');

export default function Overview({ workoutData, onNavigate }: Props) {
  const todayKey = getTodayDayKey();
  const todayISO = getTodayISO();
  const currentWeekNum = getCurrentWeek();

  // Odškrtnout jde i jiný den než dnešek. Když se trénink přesune nebo se
  // zapomene odškrtnout, musí se to dát dohnat – jinak ty série zůstanou
  // „předepsané“ navždy a týdenní procento lže.
  const [weekNum, setWeekNum] = useState(currentWeekNum);
  // Přepnutí HIIT×běh musí překreslit sekci 03.
  const [modeTik, setModeTik] = useState(0);
  const [presunTik, setPresunTik] = useState(0);
  // Přidržení prstu na dni → tažení doleva/doprava na jiný den.
  const [drzeny, setDrzeny] = useState<string | null>(null);
  const [cilovy, setCilovy] = useState<string | null>(null);
  const drzTimer = useRef<number | null>(null);
  const pruhRef = useRef<HTMLDivElement | null>(null);
  void modeTik; // jen spouštěč překreslení po přepnutí HIIT×běh
  const [pickedDay, setPickedDay] = useState<string | null>(null);

  const currentWeek: Week = PHASE3_WEEKS.find(w => w.number === weekNum) || PHASE3_WEEKS[0];
  const isThisWeek = weekNum === currentWeekNum;
  const activeKey = pickedDay ?? (isThisWeek ? todayKey : 'monday');

  // Přesuny tréninků v rámci týdne. `activeKey` je KALENDÁŘNÍ den, na který
  // se dívá; trénink na něm může být přesunutý z jiného dne.
  // Přesun je vždycky VÝMĚNA dvou dnů — jinak by na jednom dni skončily dva
  // tréninky a na druhém žádný.
  /** Který den leží pod prstem. Počítá se z pozic dlaždic, ne z indexu —
   *  dlaždice jsou pružné a při jiné šířce by index nesouhlasil. */
  const denPodPrstem = (x: number): string | null => {
    const pruh = pruhRef.current;
    if (!pruh) return null;
    for (const el of Array.from(pruh.children)) {
      const r = (el as HTMLElement).getBoundingClientRect();
      if (x >= r.left && x <= r.right) return (el as HTMLElement).dataset.den ?? null;
    }
    return null;
  };

  const zrusDrzeni = () => {
    if (drzTimer.current !== null) { clearTimeout(drzTimer.current); drzTimer.current = null; }
  };

  const naStisk = (key: string) => (e: React.PointerEvent<HTMLButtonElement>) => {
    zrusDrzeni();
    const cil = e.currentTarget;
    drzTimer.current = window.setTimeout(() => {
      setDrzeny(key);
      setCilovy(key);
      tap();
      // Bez zachycení ukazatele by tažení skončilo, jakmile prst opustí dlaždici.
      try { cil.setPointerCapture(e.pointerId); } catch { /* nepodstatné */ }
    }, 450);
  };

  const naTah = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!drzeny) return;
    e.preventDefault();
    const d = denPodPrstem(e.clientX);
    if (d) setCilovy(d);
  };

  const naPusteni = () => {
    zrusDrzeni();
    if (drzeny && cilovy && cilovy !== drzeny) {
      // Výměna: co bylo na A jde na B a naopak.
      const aPuv = trenkyNaDni[drzeny]?.key ?? drzeny;
      const bPuv = trenkyNaDni[cilovy]?.key ?? cilovy;
      nastavPresun(weekNum, aPuv, cilovy);
      nastavPresun(weekNum, bPuv, drzeny);
      setPresunTik(t => t + 1);
      setPickedDay(cilovy);
      ulozeno();
    }
    setDrzeny(null);
    setCilovy(null);
  };

  const presuny = presunyTydne(weekNum);
  void presunTik; // překreslení po přesunu
  const trenkyNaDni: Record<string, typeof currentWeek.days[number]> = {};
  for (const d of currentWeek.days) trenkyNaDni[presuny[d.key] ?? d.key] = d;

  const activeDay = trenkyNaDni[activeKey];
  // Datum se bere podle KALENDÁŘNÍHO dne, ne podle dne v plánu — přesně proto,
  // aby v deníku bylo vidět, kdy trénink doopravdy proběhl.
  const activeISO = dateForDay(currentWeek, activeKey);
  /** Den v plánu — drží se ho id předepsaných záznamů, nesmí se měnit. */
  const planDayKey = activeDay?.key ?? activeKey;
  const jePresunuty = !!activeDay && activeDay.key !== activeKey;
  const isToday = isThisWeek && activeKey === todayKey && !pickedDay;
  // Hero musí říkat, co se dnes OPRAVDU dělá: po prohození dnů jiný trénink
  // a u lekce to, co si vybral (běh × HIIT). Dřív hlásil „SOBOTA HIIT",
  // i když byl zvolený běh.
  const todayDay = trenkyNaDni[todayKey];
  const isTraining = !!todayDay && todayDay.type !== 'rest';
  // Výchozí je vždycky HIIT — běh už lekci nenahrazuje. Středa s ranním
  // během je dvojitá (běh + HIIT) a přepínač nemá.
  const dnesDvojita = !!todayDay && jeDvojitaStreda(weekNum, todayDay.key);
  const dnesRezim: DayMode | null = todayDay?.type === 'hiit' && !dnesDvojita
    ? (ulozenyMode(weekNum, todayDay.key) ?? 'hiit')
    : null;
  const dnesBeh = todayDay && (dnesDvojita || dnesRezim === 'run') ? runSessionFor(weekNum, todayDay.key) : null;
  const activeTraining = !!activeDay && activeDay.type !== 'rest' && activeDay.exercises.length > 0;
  const top = isTraining ? heroSet(todayDay) : null;

  // Potvrzená 1RM maxima – z dokumentu, nebo vyšší, které si uživatel
  // potvrdil v Progresu. Nikdy ne pracovní váha z deníku.
  const maxes = getCurrentMaxes();
  const goals = [
    { name: 'Bench Press', short: 'BENCH', current: maxes.bench, goal: GOALS.bench },
    { name: 'Back Squat', short: 'DŘEP', current: maxes.squat, goal: GOALS.squat },
    { name: 'Mrtvý tah', short: 'TAH', current: maxes.deadlift, goal: GOALS.deadlift },
  ];

  const kalendarniDnes = DAY_LABEL[todayKey] ?? todayDay?.label ?? '';
  const heroTitle = isTraining && todayDay
    ? <>{kalendarniDnes.toUpperCase()}<br />{
        dnesDvojita ? 'BĚH + HIIT'
        : dnesRezim === 'run' ? 'BĚH'
        : dnesRezim === 'hiit' ? 'HIIT'
        : todayDay.description.split('–')[0].trim().toUpperCase()
      }</>
    : <>Dnes<br />volno</>;

  return (
    <div>
      <Hero
        plate="overview"
        size="lg"
        poster
        ghost={String(currentWeek.number).padStart(2, '0')}
        kicker="Tréninkový deník"
        title={heroTitle}
        lead={
          isTraining && todayDay
            ? dnesDvojita && dnesBeh
              ? <>Ráno {dnesBeh.type} · {String(dnesBeh.km).replace('.', ',')} km · večer HIIT lekce</>
              : dnesRezim === 'run'
              ? <>Běh místo HIIT{dnesBeh ? <> · {String(dnesBeh.km).replace('.', ',')} km · {dnesBeh.zone}</> : null}</>
              : dnesRezim === 'hiit'
                ? <>HIIT lekce · ~45–60 min</>
                : <>{todayDay.description.split('–')[0].trim()} · {todayDay.exercises.length} {plural(todayDay.exercises.length, 'cvik', 'cviky', 'cviků')}{todayDay.key !== todayKey ? <> · přesunuto {DAY_ZE[todayDay.key] ?? ''}</> : null}</>
            : <>Aktivní regenerace · strečink · sauna</>
        }
        specs={[
          ...(top ? [{ label: 'Top série', value: `${top.weight.replace('.', ',')} kg × ${top.reps}` }] : []),
          { label: 'Týden', value: `${String(currentWeek.number).padStart(2, '0')} / 13` },
          { label: 'Blok', value: currentWeek.label },
          { label: 'Termín', value: `${dm(currentWeek.dateFrom)} — ${dm(currentWeek.dateTo)}` },
        ]}
      />

      <QuoteBar />


      <div className="gd-body">
        {/* Týdenní rozvrh */}
        <Reveal>
          <SectionHead
            n="01"
            label="Týdenní rozvrh"
            right={`T${String(currentWeek.number).padStart(2, '0')} · ${dm(currentWeek.dateFrom)} — ${dm(currentWeek.dateTo)}`}
          />
          {/* Postup po dnech — hotový den se prošrafuje, ale zůstane čitelný. */}
          {(() => {
            const postup = weekProgress(currentWeek, workoutData.records);
            return (
              <div ref={pruhRef} style={{ display: 'flex', gap: 4, padding: '0 20px 10px', touchAction: drzeny ? 'none' : 'pan-y' }}>
                {DAY_KEYS.map((key, i) => {
                  const day = trenkyNaDni[key];
                  const presunutySem = !!day && day.key !== key;
                  const sel = key === activeKey;
                  const isTodayCell = isThisWeek && key === todayKey;
                  const isRest = day?.type === 'rest';
                  // Postup se hledá podle dne v PLÁNU, ne podle kalendářního —
                  // po přesunu by se ty dva rozešly.
                  const dp = postup.dny.find(d => d.key === (day?.key ?? key));
                  const hotovo = !!dp && dp.celkem > 0 && dp.hotovo >= dp.celkem;
                  const rozdelano = !!dp && dp.hotovo > 0 && !hotovo;
                  const pct = dp && dp.celkem > 0 ? Math.round((dp.hotovo / dp.celkem) * 100) : 0;
                  return (
                    <button
                      key={key}
                      data-den={key}
                      onClick={() => { if (!drzeny) setPickedDay(key); }}
                      onPointerDown={naStisk(key)}
                      onPointerMove={naTah}
                      onPointerUp={naPusteni}
                      onPointerCancel={() => { zrusDrzeni(); setDrzeny(null); setCilovy(null); }}
                      onContextMenu={e => e.preventDefault()}
                      aria-pressed={sel}
                      aria-label={`${day?.label ?? key}${hotovo ? ', hotovo' : rozdelano ? `, rozděláno ${pct} %` : ''}`}
                      className={hotovo && !sel ? 'gd-daycell gd-daycell--done' : 'gd-daycell'}
                      style={{
                        flex: 1, textAlign: 'center', padding: '10px 0 9px', cursor: 'pointer',
                        position: 'relative', minWidth: 0,
                        background: drzeny === key ? 'color-mix(in srgb, var(--gd-accent) 30%, transparent)'
                          : cilovy === key && drzeny ? 'color-mix(in srgb, var(--gd-accent) 14%, transparent)'
                          : sel ? 'var(--gd-accent)' : 'transparent',
                        border: drzeny === key || (cilovy === key && drzeny)
                          ? '1px dashed var(--gd-accent)'
                          : sel ? '1px solid var(--gd-accent)'
                          : hotovo ? '1px solid color-mix(in srgb, var(--gd-accent) 55%, transparent)'
                          : isTodayCell ? '1px solid var(--gd-text-3)' : '1px solid var(--gd-line)',
                        borderRadius: 0,
                        userSelect: 'none', WebkitUserSelect: 'none',
                        transform: drzeny === key ? 'scale(1.06)' : 'none',
                        transition: 'transform .12s ease',
                      }}
                    >
                      <div style={{
                        fontSize: 11, fontWeight: 800, letterSpacing: '0.04em',
                        color: sel ? 'var(--gd-accent-ink)' : hotovo ? 'var(--gd-accent)' : 'var(--gd-text-2)',
                      }}>{DAY_SHORT[i]}</div>
                      <div style={{
                        fontSize: 8, marginTop: 3, fontWeight: 700, letterSpacing: '0.1em',
                        color: sel ? 'color-mix(in srgb, var(--gd-accent-ink) 65%, transparent)'
                             : hotovo ? 'color-mix(in srgb, var(--gd-accent) 70%, transparent)' : 'var(--gd-text-4)',
                      }}>
                        {/* U dne s lekcí se ukazuje, co si VYBRAL, ne co je v plánu —
                            jinak po přepnutí na běh svítí dál „HIIT". */}
                        {isRest ? '–'
                          : !day ? '?'
                          : jeDvojitaStreda(weekNum, day.key) ? 'B+HIIT'
                          : day.type === 'hiit'
                            ? ((ulozenyMode(weekNum, day.key) ?? 'hiit') === 'run' ? 'BĚH' : 'HIIT')
                            : (TYPE_LABEL[day.type] || '?')}
                      </div>

                      {/* Hotovo: značka v rohu. Rozděláno: proužek podle procent. */}
                      {hotovo && (
                        <span aria-hidden="true" style={{
                          position: 'absolute', top: 2, right: 3, lineHeight: 1,
                          fontSize: 9, fontWeight: 800,
                          color: sel ? 'var(--gd-accent-ink)' : 'var(--gd-accent)',
                        }}>✓</span>
                      )}
                      {rozdelano && (
                        <span aria-hidden="true" style={{
                          position: 'absolute', left: 0, bottom: 0, height: 2, width: `${pct}%`,
                          background: sel ? 'var(--gd-accent-ink)' : 'var(--gd-accent)',
                        }} />
                      )}
                      {presunutySem && (
                        <span aria-hidden="true" title="přesunuto z jiného dne" style={{
                          position: 'absolute', top: 2, left: 3, lineHeight: 1, fontSize: 9,
                          color: sel ? 'var(--gd-accent-ink)' : 'var(--gd-text-3)',
                        }}>⇄</span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })()}
          <div style={{ padding: '0 20px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ flex: 1, fontSize: 10, color: 'var(--gd-text-4)', letterSpacing: '0.04em' }}>
              {drzeny ? 'Táhni na den, se kterým to chceš prohodit.' : 'Přidrž den a táhni — prohodíš tréninky mezi dny.'}
            </span>
            {!drzeny && maOdchylky(weekNum) && (
              <button
                onClick={() => {
                  // Zapsané tréninky zůstávají — vrací se jen rozvrh.
                  obnovTyden(weekNum);
                  setPresunTik(t => t + 1);
                  setModeTik(t => t + 1);
                  setPickedDay(null);
                  toast('Rozvrh týdne vrácen podle plánu');
                }}
                style={{
                  flexShrink: 0, padding: '6px 10px', borderRadius: 0, cursor: 'pointer',
                  background: 'transparent', border: '1px solid var(--gd-line)',
                  color: 'var(--gd-text-2)', fontSize: 9, fontWeight: 800,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                }}
              >Obnovit plán týdne</button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, padding: '0 20px 20px' }}>
            <button
              onClick={() => { setWeekNum(w => Math.max(1, w - 1)); setPickedDay(null); }}
              disabled={weekNum <= 1}
              style={{
                flex: 1, padding: '11px', background: 'transparent',
                border: '1px solid var(--gd-line)', borderRadius: 0,
                color: weekNum <= 1 ? 'var(--gd-text-4)' : 'var(--gd-text-3)',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase',
                cursor: weekNum <= 1 ? 'default' : 'pointer',
              }}
            >← Předchozí týden</button>
            {/* Dopředu se dřív jít nedalo vůbec — byla tu jen šipka zpět.
                Z aktuálního týdne tak nešlo nahlédnout na žádný další. */}
            <button
              onClick={() => { setWeekNum(w => Math.min(PHASE3_WEEKS.length, w + 1)); setPickedDay(null); }}
              disabled={weekNum >= PHASE3_WEEKS.length}
              style={{
                flex: 1, padding: '11px', background: 'transparent',
                border: '1px solid var(--gd-line)', borderRadius: 0,
                color: weekNum >= PHASE3_WEEKS.length ? 'var(--gd-text-4)' : 'var(--gd-text-3)',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase',
                cursor: weekNum >= PHASE3_WEEKS.length ? 'default' : 'pointer',
              }}
            >Další týden →</button>
            {(!isThisWeek || pickedDay) && (
              <button
                onClick={() => { setWeekNum(currentWeekNum); setPickedDay(null); }}
                style={{
                  flex: 1, padding: '11px', background: 'var(--gd-accent)',
                  border: 'none', borderRadius: 0, color: 'var(--gd-accent-ink)',
                  fontSize: 9, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >Zpět na dnešek</button>
            )}
          </div>
        </Reveal>

        {/* Splnění týdne */}
        {(() => {
          const wp = weekProgress(currentWeek, workoutData.records);
          if (wp.celkem === 0) return null;
          const pct = Math.round((wp.hotovo / wp.celkem) * 100);
          return (
            <Reveal>
              <SectionHead
                n="02"
                label="Splnění týdne"
                right={`${wp.hotovo} / ${wp.celkem} ${plural(wp.celkem, 'série', 'série', 'sérií')}`}
              />
              <div className="gd-wmhost" style={{ padding: '0 20px 22px' }}>
                <Watermark name="warrior" position="102% 40%" size="auto 165%" opacity={0.08} />
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 12 }}>
                  <span className="gd-display" style={{ fontSize: 34, color: pct === 100 ? 'var(--gd-fern)' : 'var(--gd-text)' }}>
                    {pct}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: 'var(--gd-text-3)', paddingBottom: 6 }}>%</span>
                </div>
                {wp.dny
                  // Řádky podle dne, kdy se trénink OPRAVDU dělá. Po prohození by
                  // jinak svítilo „NEDĚLE 22/22", i když se cvičilo ve středu.
                  .map(d => ({ ...d, kal: presuny[d.key] ?? d.key }))
                  .sort((a, b) => DAY_KEYS.indexOf(a.kal) - DAY_KEYS.indexOf(b.kal))
                  .map(d => (
                  <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: '1px solid var(--gd-line)' }}>
                    <span className="gd-tag" style={{ width: 62, flexShrink: 0, lineHeight: 1.25 }}>
                      {DAY_LABEL[d.kal] ?? d.label}
                      {d.kal !== d.key && (
                        <span style={{ display: 'block', fontSize: 8, letterSpacing: '0.08em', color: 'var(--gd-text-4)' }}>
                          {DAY_ADJ[d.key]}
                        </span>
                      )}
                    </span>
                    <span style={{ flex: 1, display: 'flex', gap: 3, minWidth: 0 }}>
                      {Array.from({ length: d.celkem }).map((_, i) => (
                        <span key={i} style={{
                          flex: 1, height: 8, minWidth: 3,
                          background: i < d.hotovo ? 'var(--gd-accent)' : 'var(--gd-line)',
                        }} />
                      ))}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gd-text-4)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                      {d.hotovo}/{d.celkem}
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>
          );
        })()}

        <div className="gd-cols gd-cols--2">
          {/* Dnešní trénink */}
          <Reveal>
            <SectionHead
              n="03"
              label={
                !activeTraining ? 'Volno'
                // Po přesunu musí být vidět OBOJE: co se cvičí a kdy.
                : jePresunuty ? `${activeDay!.label} → ${DAY_LABEL[activeKey] ?? activeKey}`
                : isToday ? 'Dnešní trénink'
                : `${activeDay!.label} · T${currentWeek.number}`
              }
              right={activeTraining && activeDay ? `${activeDay.exercises.length} ${plural(activeDay.exercises.length, 'cvik', 'cviky', 'cviků')}` : dm(activeISO)}
            />
            {!isToday && (
              <div style={{ margin: '0 20px 12px', padding: '10px 12px', border: '1px solid var(--gd-line)', fontSize: 11, lineHeight: 1.5, color: 'var(--gd-text-3)' }}>
                Zapisuješ do <b style={{ color: 'var(--gd-text)' }}>{DAY_LABEL[activeKey] ?? activeKey} {dm(activeISO)}</b>, ne do dneška.
                {jePresunuty && activeDay && <> Je to <b style={{ color: 'var(--gd-text)' }}>{DAY_ADJ[activeDay.key] ?? activeDay.label}</b> trénink, přesunutý sem.</>}
              </div>
            )}
            {activeTraining && activeDay ? (
              <div className="gd-wmhost" style={{ padding: '0 20px 20px' }}>
                {/* Atlet krotici lva (Caylus, 18. stol.) — sedi presne tam, kde
                    se odskrtavaji serie. Blok je vysoky, takze rytina drzi
                    u horniho okraje a nemusi se roztahovat pres celou vysku. */}
                <Watermark name="athlete" position="103% 4%" size="auto 52%" opacity={0.075} />
                {/* Rozehřátí patří k tréninku, ne do vlastní sekce na konci
                    stránky — je vidět rovnou a řídí se VYBRANÝM dnem a týdnem,
                    stejně jako série pod ním. */}
                {(() => {
                  // Dny s lekcí (St/So) jde přepnout mezi HIIT a během — často
                  // to střídá podle toho, jak mu vyjde týden. Volba je override
                  // nad plánem, plán samotný se nemění.
                  const jeLekce = activeDay.type === 'hiit';
                  // Středa s ranním během nemá co přepínat: dělá obojí.
                  if (!jeLekce || jeDvojitaStreda(weekNum, activeDay.key)) return null;
                  const rezim: DayMode = ulozenyMode(weekNum, activeDay.key) ?? 'hiit';
                  const prepni = (m: DayMode) => { nastavMode(weekNum, activeDay.key, m); setModeTik(t => t + 1); };
                  const btn = (m: DayMode, txt: string) => (
                    <button
                      onClick={() => prepni(m)}
                      aria-pressed={rezim === m}
                      style={{
                        flex: 1, padding: '10px 8px', borderRadius: 0, cursor: 'pointer',
                        fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase',
                        background: rezim === m ? 'var(--gd-accent)' : 'transparent',
                        color: rezim === m ? 'var(--gd-accent-ink)' : 'var(--gd-text-3)',
                        border: `1px solid ${rezim === m ? 'var(--gd-accent)' : 'var(--gd-line)'}`,
                      }}
                    >{txt}</button>
                  );
                  return (
                    <div style={{ marginBottom: 16 }}>
                      <span className="gd-tag" style={{ display: 'block', marginBottom: 6, color: 'var(--gd-text-3)' }}>
                        Co jsi dnes dělal
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>{btn('hiit', 'HIIT lekce')}{btn('run', 'Běh')}</div>
                    </div>
                  );
                })()}
                <RunBlock
                  week={weekNum}
                  dayKey={activeDay.key}
                  vynutit={activeDay.type === 'hiit' && (ulozenyMode(weekNum, activeDay.key) ?? 'hiit') === 'run'}
                />
                <WarmupTable dayType={activeDay.type} weekNumber={weekNum} />
                {activeDay.type === 'hiit' ? (() => {
                  // Den s lekcí se nezapisuje jako „série", ale jako běh / HIIT
                  // s km, časem a tepem — rovnou do deníku běhů a do exportu.
                  const bp = runSessionFor(weekNum, activeDay.key);
                  // Středa s ranním během: dva samostatné zápisy pod run-wed
                  // a hiit-wed. Id se nemíchají, weekProgress počítá oba.
                  if (jeDvojitaStreda(weekNum, activeDay.key)) {
                    const podnadpis = (t: string) => (
                      <span className="gd-tag" style={{ display: 'block', marginBottom: 6, color: 'var(--gd-text-3)' }}>{t}</span>
                    );
                    return (
                      <>
                        {podnadpis('Ráno · běh')}
                        <LessonLogger
                          key={`${weekNum}-${activeDay.key}-run`}
                          week={currentWeek.number}
                          planDayKey={planDayKey}
                          date={activeISO}
                          mode="run"
                          workoutData={workoutData}
                          planKm={bp?.km}
                          planZone={bp?.zone}
                        />
                        {podnadpis('Večer · HIIT lekce')}
                        <LessonLogger
                          key={`${weekNum}-${activeDay.key}-hiit`}
                          week={currentWeek.number}
                          planDayKey={planDayKey}
                          date={activeISO}
                          mode="hiit"
                          workoutData={workoutData}
                        />
                      </>
                    );
                  }
                  const rezim: DayMode = ulozenyMode(weekNum, activeDay.key) ?? 'hiit';
                  return (
                    <LessonLogger
                      key={`${weekNum}-${activeDay.key}-${rezim}`}
                      week={currentWeek.number}
                      planDayKey={planDayKey}
                      date={activeISO}
                      mode={rezim}
                      workoutData={workoutData}
                      planKm={rezim === 'run' ? bp?.km : undefined}
                      planZone={rezim === 'run' ? bp?.zone : undefined}
                    />
                  );
                })() : activeDay.exercises.map((ex, i) => (
                  <div key={ex.id} style={{ marginBottom: 18 }}>
                    <div style={{
                      display: 'flex', alignItems: 'baseline', gap: 10,
                      paddingTop: i === 0 ? 0 : 6,
                    }}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--gd-text-4)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span style={{ flex: 1, fontSize: 14, color: 'var(--gd-text)', minWidth: 0 }}>
                        {ex.nameShort || ex.name}
                      </span>
                    </div>
                    <SetLogger
                      exercise={ex}
                      week={currentWeek.number}
                      dayKey={planDayKey}
                      date={activeISO}
                      workoutData={workoutData}
                    />
                  </div>
                ))}
                {/* Souhrn dne – ukáže se, jakmile je něco odškrtnuté. */}
                {(() => {
                  // Tonáž nemá u běhu/HIIT smysl. A hledá se podle dne v PLÁNU —
                  // podle kalendářního by po prohození ukázala cizí trénink.
                  if (activeDay.type === 'hiit') return null;
                  const sum = daySummary(currentWeek, planDayKey, workoutData.records);
                  if (sum.hotovo === 0) return null;
                  const prevWeek = PHASE3_WEEKS.find(w => w.number === currentWeek.number - 1);
                  const prev = prevWeek ? daySummary(prevWeek, planDayKey, workoutData.records) : null;
                  const diff = prev && prev.tonaz > 0 ? sum.tonaz - prev.tonaz : null;
                  const complete = sum.hotovo === sum.celkem;
                  return (
                    <div style={{
                      marginTop: 18, padding: '14px 16px',
                      border: `1px solid ${complete ? 'var(--gd-accent)' : 'var(--gd-line)'}`,
                      background: complete ? 'color-mix(in srgb, var(--gd-accent) 8%, transparent)' : 'transparent',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
                        <span className="gd-tag" style={{ flex: 1, color: complete ? 'var(--gd-accent)' : 'var(--gd-text-3)' }}>
                          {complete ? 'Trénink hotov' : 'Rozpracováno'}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gd-text-4)', fontVariantNumeric: 'tabular-nums' }}>
                          {sum.hotovo}/{sum.celkem} {plural(sum.celkem, 'série', 'série', 'sérií')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                        <span className="gd-display" style={{ fontSize: 30, color: 'var(--gd-text)' }}>
                          {sum.tonaz.toLocaleString('cs-CZ')}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', color: 'var(--gd-text-3)', paddingBottom: 5 }}>KG TONÁŽ</span>
                      </div>
                      {diff !== null && (
                        <div style={{ fontSize: 11, marginTop: 6, color: diff >= 0 ? 'var(--gd-fern)' : 'var(--gd-danger)', fontWeight: 700 }}>
                          {diff >= 0 ? '+' : ''}{diff.toLocaleString('cs-CZ')} kg proti T{prevWeek!.number}
                        </div>
                      )}
                      {sum.top && (
                        <div style={{ fontSize: 11, marginTop: 8, color: 'var(--gd-text-3)', lineHeight: 1.5 }}>
                          Top série: <b style={{ color: 'var(--gd-text)' }}>{sum.top.weight.replace('.', ',')} × {sum.top.reps}</b> · {sum.top.exercise}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {activeDay.type !== 'hiit' && (
                <button
                  onClick={() => onNavigate('plan')}
                  style={{
                    marginTop: 16, width: '100%', padding: '13px 16px',
                    background: 'transparent', color: 'var(--gd-text)',
                    border: '1px solid var(--gd-line)', borderRadius: 0, cursor: 'pointer',
                    fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <span>Otevřít rozpis sérií</span><span>→</span>
                </button>
                )}
              </div>
            ) : (
              <div style={{ padding: '0 20px 20px' }}>
                <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--gd-text-3)', margin: 0 }}>
                  Dnes se netrénuje. Aktivní regenerace, strečink, mobilita.
                  Další jednotku najdeš v Plánu.
                </p>
                <button
                  onClick={() => onNavigate('plan')}
                  style={{
                    marginTop: 16, width: '100%', padding: '13px 16px',
                    background: 'transparent', color: 'var(--gd-text)',
                    border: '1px solid var(--gd-line)', borderRadius: 0, cursor: 'pointer',
                    fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <span>Zobrazit plán týdne</span><span>→</span>
                </button>
              </div>
            )}
          </Reveal>

          {/* Maxima */}
          <Reveal delay={60}>
            <SectionHead n="04" label="Maxima → cíl" right="1RM" />
            <div className="gd-wmhost" style={{ padding: '0 20px 20px' }}>
              <Watermark name="victory" position="104% 50%" size="auto 150%" opacity={0.07} />
              {goals.map(({ name, short, current, goal }) => {
                const pct = Math.min(100, Math.round((current / goal) * 100));
                const done = current >= goal;
                return (
                  <div key={name} style={{ padding: '12px 0', borderTop: '1px solid var(--gd-line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                      <span className="gd-tag" style={{ color: 'var(--gd-text-3)' }}>{short}</span>
                      <span style={{ fontSize: 11, color: 'var(--gd-text-4)', letterSpacing: '0.05em' }}>{name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 6 }}>
                      <span className="gd-display" style={{ fontSize: 32, color: done ? 'var(--gd-fern)' : 'var(--gd-text)' }}>
                        {current}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--gd-text-3)', paddingBottom: 5 }}>KG</span>
                      <span style={{ flex: 1 }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gd-text-4)', paddingBottom: 5, fontVariantNumeric: 'tabular-nums' }}>
                        → {goal} kg · {pct} %
                      </span>
                    </div>
                    <div style={{ height: 2, background: 'var(--gd-line)', marginTop: 8 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: done ? 'var(--gd-fern)' : 'var(--gd-accent)', transition: 'width 0.9s cubic-bezier(0.22,0.61,0.36,1)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>

        {/* Fáze */}
        <Reveal>
          <SectionHead n="05" label="Aktuální fáze" right={currentWeek.phase} />
          <div className="gd-wmhost" style={{ padding: '0 20px 34px' }}>
            <Watermark name="knight" position="104% 30%" size="auto 118%" opacity={0.065} />
            <p className="gd-serif" style={{ fontSize: 16, lineHeight: 1.65, color: 'var(--gd-text-2)', margin: '0 0 18px', maxWidth: '58ch' }}>
              {currentWeek.description}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid var(--gd-line)' }}>
              {[['W1–4', 'Akumulace'], ['W5–8', 'Síla'], ['W9–11', 'Intenzif.'], ['W12–13', 'Taper / Test']].map(([w, label], i) => {
                const on = currentWeek.number <= 4 ? i === 0 : currentWeek.number <= 8 ? i === 1 : currentWeek.number <= 11 ? i === 2 : i === 3;
                return (
                  <div key={w} style={{
                    padding: '12px 8px 14px',
                    borderRight: i < 3 ? '1px solid var(--gd-line)' : 'none',
                    borderTop: on ? '2px solid var(--gd-accent)' : '2px solid transparent',
                    marginTop: -1,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: on ? 'var(--gd-accent)' : 'var(--gd-text-3)', fontVariantNumeric: 'tabular-nums' }}>{w}</div>
                    <div style={{ fontSize: 10, color: 'var(--gd-text-4)', marginTop: 4, letterSpacing: '0.06em' }}>{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
