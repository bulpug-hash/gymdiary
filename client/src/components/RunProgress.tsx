// Progres v běhu — záložka 05.
//
// Nahradila původní silový Progres (ten měřil 1RM na bench/dřep/tah).
// Důvod: silovky se vedou v Deníku a v Plánu, zatímco běh má data ze dvou
// zdrojů — vlastní log a metriky z hodinek COROS — a nikde se nepotkávala.
//
// Co je odkud:
//   · běhy            → loadRunRecords() (Strava/Oura historie + COROS)
//   · kondice, zóny,
//     zátěž, klidový tep → lib/corosData.ts (ruční snímek z t.coros.com)
//   · předepsané km   → RUNNING_PROGRAM v lib/data.ts
//
// Kolo ani turistika se sem záměrně nepočítají — 51 km na kole by rozhodilo
// objem i průměrné tempo. Jsou v Deníku → Ostatní.
import { useMemo, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceArea, ReferenceLine, ComposedChart, CartesianGrid,
} from 'recharts';
import { loadRunRecords } from '@/lib/activityLog';
import { PLAN_START_DATE, RUNNING_PROGRAM, formatDate } from '@/lib/data';
import {
  COROS_SNAPSHOT, RUN_FITNESS, COROS_THRESHOLDS, COROS_ZONES, COROS_DAYS, COROS_WEEKS,
} from '@/lib/corosData';
import { tint } from '@/lib/tint';
import { Hero, QuoteBar, SectionHead, Watermark } from '@/components/kit';

/* ---------------- převody ---------------- */

/** „47:12" / „1:04:44" → sekundy. */
function naSekundy(t: string): number {
  const c = t.split(':').map(Number);
  if (c.length === 3) return c[0] * 3600 + c[1] * 60 + c[2];
  if (c.length === 2) return c[0] * 60 + c[1];
  return c[0] || 0;
}

/** sekundy na km → „5:47". */
function tempoText(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.round(s % 60)).padStart(2, '0')}`;
}

const cz = (n: number, d = 1) => n.toFixed(d).replace('.', ',');

/* ---------------- graf: společné kusy ---------------- */

const OSA = { fontSize: 10, fill: 'var(--gd-text-4)' } as const;
const MRIZ = { stroke: 'var(--gd-line)', strokeDasharray: '2 4' } as const;

function Bublina({ active, payload, label, jednotka, prevod }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--gd-surface)', border: '1px solid var(--gd-line)', padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: 'var(--gd-text-3)', marginBottom: 4 }}>{label}</div>
      {payload.filter((p: any) => p.value != null).map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color || p.stroke || 'var(--gd-text)', fontWeight: 700 }}>
          {p.name}: {prevod ? prevod(p.value) : p.value}{jednotka ? ` ${jednotka}` : ''}
        </div>
      ))}
    </div>
  );
}

function Blok({ children, vyska = 190 }: { children: any; vyska?: number }) {
  return (
    <div style={{ height: vyska, margin: '12px 0 4px' }}>
      <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
    </div>
  );
}

function Popis({ children }: { children: any }) {
  return (
    <p className="gd-serif" style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--gd-text-2)', margin: '6px 0 0' }}>
      {children}
    </p>
  );
}

/* ---------------- komponenta ---------------- */

export default function RunProgress() {
  const [detailTydne, setDetailTydne] = useState<number | null>(null);

  const bezy = useMemo(
    () => loadRunRecords()
      .map(r => {
        const km = parseFloat(r.distance) || 0;
        const sek = naSekundy(r.duration);
        return {
          ...r,
          km,
          sek,
          tempoSek: km > 0 ? sek / km : 0,
          tep: r.avgHr ? parseInt(r.avgHr, 10) : null,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date)),
    [],
  );

  // Úseky pod 3 km jsou rozklusy, rovinky a zahřívačky před HIIT. V grafu tempa
  // a efektivity by dělaly jen šum — 0,4 km ve 3:43/km není běžecký výkon.
  const plneBezy = useMemo(() => bezy.filter(b => b.km >= 3), [bezy]);

  /* --- týdny plánu --- */
  const tydny = useMemo(() => {
    const start = new Date(PLAN_START_DATE + 'T00:00:00Z');
    return RUNNING_PROGRAM.map(p => {
      const od = new Date(start);
      od.setUTCDate(od.getUTCDate() + (p.week - 1) * 7);
      const doD = new Date(od);
      doD.setUTCDate(doD.getUTCDate() + 6);
      const odS = od.toISOString().slice(0, 10);
      const doS = doD.toISOString().slice(0, 10);
      const vTydnu = bezy.filter(b => b.date >= odS && b.date <= doS);
      const km = vTydnu.reduce((s, b) => s + b.km, 0);
      // Plán počítá JEDEN běh týdně (středa). Sobota je jen náhrada za HIIT,
      // takže se do předpisu nepřičítá — jinak by to vypadalo, že neplní.
      const planKm = p.streda?.km ?? 0;
      return {
        tyden: p.week,
        label: `T${p.week}`,
        od: odS,
        km: Math.round(km * 10) / 10,
        planKm,
        pocet: vTydnu.length,
        bezy: vTydnu,
      };
    }).filter(t => t.od <= new Date().toISOString().slice(0, 10));
  }, [bezy]);

  const odbehano = tydny.reduce((s, t) => s + t.km, 0);
  const predepsano = tydny.reduce((s, t) => s + t.planKm, 0);
  const plneni = predepsano > 0 ? Math.round((odbehano / predepsano) * 100) : 0;

  /* --- tempo a tep --- */
  const tempoData = plneBezy.map(b => ({
    d: formatDate(b.date),
    tempo: Math.round(b.tempoSek),
    tep: b.tep,
    km: Math.round(b.km * 10) / 10,
  }));

  /* --- aerobní efektivita: metry za minutu na jeden tep --- */
  // Klasický efficiency factor. Vyšší = za stejný tep uběhneš víc.
  const efData = plneBezy
    .filter(b => b.tep)
    .map(b => ({
      d: formatDate(b.date),
      ef: Math.round((b.km * 1000 / (b.sek / 60)) / b.tep! * 100) / 100,
    }));
  const efPrvni = efData.slice(0, 5).reduce((s, x) => s + x.ef, 0) / Math.max(1, efData.slice(0, 5).length);
  const efPosledni = efData.slice(-5).reduce((s, x) => s + x.ef, 0) / Math.max(1, efData.slice(-5).length);
  const efZmena = efPrvni > 0 ? Math.round(((efPosledni - efPrvni) / efPrvni) * 1000) / 10 : 0;

  /* --- kondice --- */
  const kondice = RUN_FITNESS.map(f => ({ d: formatDate(f.date), v: f.value }));
  const kondiceRust = RUN_FITNESS[RUN_FITNESS.length - 1].value - RUN_FITNESS[0].value;

  /* --- zátěž --- */
  const zatezData = COROS_WEEKS.map(w => ({
    d: formatDate(w.from),
    tl: w.tl,
    min: w.recMin,
    max: w.recMax,
    stav: w.recMin == null ? 'nehodnoceno' : w.tl > (w.recMax ?? 0) ? 'nad' : w.tl < w.recMin ? 'pod' : 'v pásmu',
  }));

  /* --- klidový tep --- */
  const rhrData = COROS_DAYS.filter(d => d.rhr != null).map(d => ({ d: formatDate(d.date), rhr: d.rhr }));
  const rhrPrum = Math.round(rhrData.reduce((s, x) => s + (x.rhr ?? 0), 0) / Math.max(1, rhrData.length));

  /* --- únava --- */
  const unavaData = COROS_DAYS.map(d => ({ d: formatDate(d.date), t7d: d.t7d, t28d: Math.round(d.t28d / 4) }));

  const detail = detailTydne != null ? tydny.find(t => t.tyden === detailTydne) : null;

  return (
    <div>
      <Hero
        plate="progress"
        ghost="05"
        kicker="Tréninkový deník"
        title={<>Progres<br />v běhu</>}
        meta={<><b>{plneBezy.length} běhů</b><span>·</span><span>{cz(odbehano, 0)} km v plánu</span><span>·</span><span>Data z COROSu {formatDate(COROS_SNAPSHOT)}</span></>}
      />

      <QuoteBar />

      <div className="gd-body gd-wmhost" style={{ padding: '0 20px 40px' }}>
        <Watermark name="helm" position="106% 8%" size="auto 40%" opacity={0.06} />

        {/* ---------- 01 KONDICE ---------- */}
        <SectionHead n="01" label="Běžecká kondice" right={`COROS · ${formatDate(COROS_SNAPSHOT)}`} />

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
          <span className="gd-display" style={{ fontSize: 64, color: 'var(--gd-accent)', lineHeight: 0.9 }}>
            {cz(RUN_FITNESS[RUN_FITNESS.length - 1].value)}
          </span>
          <div style={{ paddingBottom: 8 }}>
            <div className="gd-tag" style={{ color: 'var(--gd-fern)' }}>
              +{cz(kondiceRust)} za měsíc
            </div>
            <div style={{ fontSize: 11, color: 'var(--gd-text-4)', marginTop: 3 }}>
              od {formatDate(RUN_FITNESS[0].date)}
            </div>
          </div>
        </div>

        <Blok vyska={150}>
          <LineChart data={kondice} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid {...MRIZ} vertical={false} />
            <XAxis dataKey="d" tick={OSA} axisLine={false} tickLine={false} />
            <YAxis domain={['dataMin - 0.6', 'dataMax + 0.4']} tick={OSA} axisLine={false} tickLine={false} />
            <Tooltip content={<Bublina />} />
            <Line type="monotone" dataKey="v" name="Kondice" stroke="var(--gd-accent)" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </Blok>

        <Popis>
          Číslo si COROS počítá z tepu a tempa každého běhu — je to jeho odhad tvojí
          aerobní výkonnosti. Za měsíc +{cz(kondiceRust)}, což je na čtyři běhy slušné;
          roste hlavně proto, že běháš pravidelně, ne proto, že bys běhal rychle.
        </Popis>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 10, marginTop: 16 }}>
          {[
            { l: 'Prahové tempo', v: COROS_THRESHOLDS.thresholdPaceLabel },
            { l: 'Tep na prahu', v: `${COROS_THRESHOLDS.lthr}` },
            { l: 'Max. tep', v: `${COROS_THRESHOLDS.maxHr}` },
            { l: 'Klidový tep', v: `${rhrPrum}` },
          ].map(x => (
            <div key={x.l} style={{ border: '1px solid var(--gd-line)', padding: '10px 12px' }}>
              <div className="gd-tag" style={{ color: 'var(--gd-text-4)' }}>{x.l}</div>
              <div className="gd-display" style={{ fontSize: 22, color: 'var(--gd-text)', marginTop: 4 }}>{x.v}</div>
            </div>
          ))}
        </div>

        {/* ---------- 02 ZÓNY ---------- */}
        <div style={{ marginTop: 34 }}>
          <SectionHead n="02" label="Tvoje zóny" right="podle COROSu" />
        </div>
        <div style={{ marginTop: 12 }}>
          {COROS_ZONES.map(z => (
            <div key={z.label} style={{
              display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, alignItems: 'center',
              padding: '8px 10px', borderLeft: `2px solid ${z.color}`, background: tint(z.color, 5), marginBottom: 4,
            }}>
              <span style={{ fontSize: 12, color: 'var(--gd-text-2)' }}>{z.label}</span>
              <span style={{ fontSize: 12, color: 'var(--gd-text-3)', fontVariantNumeric: 'tabular-nums' }}>{z.hr} bpm</span>
              <span style={{ fontSize: 12, color: z.color, fontVariantNumeric: 'tabular-nums', minWidth: 78, textAlign: 'right' }}>{z.pace}</span>
            </div>
          ))}
        </div>
        <Popis>
          Pozor na rozpor: plán ti předepisuje úseky na 4:50–5:00/km, ale COROS tvoje
          anaerobní pásmo začíná až na 5:14/km. Ta tempa z plánu jsou od trenéra ze
          skupiny a počítají s tím, kam se chceš dostat — COROS počítá, kde jsi dnes.
          Ber proto plán jako cíl a zónu jako realitu; kdyby tě úseky dusily, běž je
          radši o 10 s/km pomaleji a dokonči všechny.
        </Popis>

        {/* ---------- 03 OBJEM ---------- */}
        <div style={{ marginTop: 34 }}>
          <SectionHead n="03" label="Objem po týdnech" right={`${plneni} % předpisu`} />
        </div>

        <Blok>
          <ComposedChart data={tydny} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
            onClick={(e: any) => setDetailTydne(e?.activePayload?.[0]?.payload?.tyden ?? null)}>
            <CartesianGrid {...MRIZ} vertical={false} />
            <XAxis dataKey="label" tick={OSA} axisLine={false} tickLine={false} />
            <YAxis tick={OSA} axisLine={false} tickLine={false} />
            <Tooltip content={<Bublina jednotka="km" />} />
            <Bar dataKey="km" name="Uběhnuto" fill="var(--gd-accent)" />
            <Line type="stepAfter" dataKey="planKm" name="Předpis" stroke="var(--gd-text-4)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
          </ComposedChart>
        </Blok>

        {detail && (
          <div style={{ border: '1px solid color-mix(in srgb, var(--gd-accent) 40%, transparent)', padding: '10px 12px', marginBottom: 10 }}>
            <div className="gd-tag" style={{ color: 'var(--gd-accent)' }}>
              T{detail.tyden} · {formatDate(detail.od)} · {detail.pocet} běhů
            </div>
            {detail.bezy.map(b => (
              <div key={b.id} style={{ fontSize: 12, color: 'var(--gd-text-2)', marginTop: 5 }}>
                {formatDate(b.date)} — {cz(b.km)} km · {b.duration} · {tempoText(b.tempoSek)}/km
                {b.tep ? ` · ${b.tep} bpm` : ''}
              </div>
            ))}
            {detail.bezy.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--gd-text-4)', marginTop: 5 }}>Žádný běh.</div>
            )}
          </div>
        )}

        <Popis>
          Celkem {cz(odbehano, 0)} km proti {cz(predepsano, 0)} km, co plán čekal, tedy {plneni} %.
          Klepni na sloupec a rozbalí se ti, co v tom týdnu bylo. Čárkovaná čára je
          jen středeční běh — sobota je náhrada za HIIT, takže se do předpisu nepočítá
          a každý sobotní běh je nad rámec.
        </Popis>

        {/* ---------- 04 TEMPO A TEP ---------- */}
        <div style={{ marginTop: 34 }}>
          <SectionHead n="04" label="Tempo a tep" right="běhy nad 3 km" />
        </div>

        <Blok>
          <ComposedChart data={tempoData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid {...MRIZ} vertical={false} />
            <XAxis dataKey="d" tick={OSA} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis yAxisId="t" reversed domain={['dataMin - 20', 'dataMax + 20']} tick={OSA} axisLine={false} tickLine={false}
              tickFormatter={(v: number) => tempoText(v)} />
            <YAxis yAxisId="h" orientation="right" domain={[120, 190]} hide />
            <Tooltip content={<Bublina prevod={(v: number) => (v > 100 ? `${tempoText(v)}/km` : `${v} bpm`)} />} />
            <ReferenceLine yAxisId="t" y={COROS_THRESHOLDS.thresholdPace} stroke="#E0A33E" strokeDasharray="3 3"
              label={{ value: 'práh', position: 'insideTopRight', fill: '#E0A33E', fontSize: 9 }} />
            <Line yAxisId="t" type="monotone" dataKey="tempo" name="Tempo" stroke="var(--gd-accent)" strokeWidth={2} dot={{ r: 2 }} />
            <Line yAxisId="h" type="monotone" dataKey="tep" name="Tep" stroke="var(--gd-danger)" strokeWidth={1.5} dot={false} />
          </ComposedChart>
        </Blok>

        <Popis>
          Osa tempa je otočená, takže <b>nahoru = rychleji</b>. Jarní běhy kolem 5:15/km
          byly rychlejší, ale krátké a na tep 177. Od srpna běháš déle a klidněji —
          to není zhoršení, to je přesun z anaerobní práce do vytrvalostní, přesně to,
          co půlmaraton potřebuje.
        </Popis>

        {/* ---------- 05 EFEKTIVITA ---------- */}
        <div style={{ marginTop: 34 }}>
          <SectionHead n="05" label="Aerobní efektivita" right={`${efZmena >= 0 ? '+' : ''}${cz(efZmena)} %`} />
        </div>

        <Blok vyska={170}>
          <LineChart data={efData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid {...MRIZ} vertical={false} />
            <XAxis dataKey="d" tick={OSA} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis domain={['dataMin - 0.05', 'dataMax + 0.05']} tick={OSA} axisLine={false} tickLine={false} />
            <Tooltip content={<Bublina />} />
            <Line type="monotone" dataKey="ef" name="m/min na tep" stroke="var(--gd-fern)" strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </Blok>

        <Popis>
          Kolik metrů za minutu uběhneš na jeden tep. Je to nejpoctivější míra
          vytrvalosti — na rozdíl od tempa ji neošálíš tím, že se do běhu položíš.
          Posun mezi prvními a posledními pěti běhy: <b>{efZmena >= 0 ? '+' : ''}{cz(efZmena)} %</b>.
        </Popis>

        {/* ---------- 06 ZÁTĚŽ ---------- */}
        <div style={{ marginTop: 34 }}>
          <SectionHead n="06" label="Týdenní zátěž" right="proti doporučení COROSu" />
        </div>

        <Blok>
          <ComposedChart data={zatezData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid {...MRIZ} vertical={false} />
            <XAxis dataKey="d" tick={OSA} axisLine={false} tickLine={false} />
            <YAxis tick={OSA} axisLine={false} tickLine={false} />
            <Tooltip content={<Bublina jednotka="TL" />} />
            <ReferenceArea y1={400} y2={710} fill="var(--gd-fern)" fillOpacity={0.1} />
            <Bar dataKey="tl" name="Zátěž" fill="var(--gd-accent)" />
            <Line type="monotone" dataKey="min" name="Doporučeno od" stroke="var(--gd-fern)" strokeWidth={1} dot={false} />
            <Line type="monotone" dataKey="max" name="Doporučeno do" stroke="var(--gd-fern)" strokeWidth={1} dot={false} />
          </ComposedChart>
        </Blok>

        <Popis>
          Tohle je zdaleka největší rezerva. Týden 28. 9. jsi dal <b>888 TL</b> při
          doporučení 392–706, hned další týden jen 456 při doporučení 511–664.
          Ta pila je horší než trvale vyšší objem: tělo nestíhá nadstavbu a únava
          z toho jen roste. Cíl není běhat víc, ale <b>držet se mezi 500 a 700 každý týden</b>.
        </Popis>

        {/* ---------- 07 ÚNAVA A KLIDOVÝ TEP ---------- */}
        <div style={{ marginTop: 34 }}>
          <SectionHead n="07" label="Akutní zátěž a klid" right={`klidový tep ⌀ ${rhrPrum}`} />
        </div>

        <Blok vyska={160}>
          <LineChart data={unavaData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid {...MRIZ} vertical={false} />
            <XAxis dataKey="d" tick={OSA} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={OSA} axisLine={false} tickLine={false} />
            <Tooltip content={<Bublina />} />
            <Line type="monotone" dataKey="t7d" name="Akutní (7 dní)" stroke="var(--gd-danger)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="t28d" name="Chronická (28 dní / 4)" stroke="var(--gd-text-4)" strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
          </LineChart>
        </Blok>

        <Blok vyska={150}>
          <LineChart data={rhrData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid {...MRIZ} vertical={false} />
            <XAxis dataKey="d" tick={OSA} axisLine={false} tickLine={false} interval={4} />
            <YAxis domain={[44, 72]} tick={OSA} axisLine={false} tickLine={false} />
            <Tooltip content={<Bublina jednotka="bpm" />} />
            <ReferenceLine y={rhrPrum} stroke="var(--gd-text-4)" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="rhr" name="Klidový tep" stroke="var(--gd-fern)" strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </Blok>

        <Popis>
          Klidový tep se drží kolem {rhrPrum} a v posledním týdnu klesl až na 47 —
          to je dobrá zpráva, regenerace stíhá. Kdyby ti vylezl o 5 tepů nad průměr
          dva dny po sobě, je to signál ubrat, ne přidat.
        </Popis>

        {/* ---------- 08 HODNOCENÍ ---------- */}
        <div style={{ marginTop: 34 }}>
          <SectionHead n="08" label="Co z toho plyne" right="k 14. 10. 2026" />
        </div>

        <div style={{ marginTop: 12 }}>
          {[
            {
              t: 'Funguje',
              c: 'var(--gd-fern)',
              items: [
                `Kondice +${cz(kondiceRust)} za měsíc a prahové tempo spadlo na ${COROS_THRESHOLDS.thresholdPaceLabel}.`,
                'Běháš pravidelně jednou týdně bez výpadku — to je jediný důvod, proč čísla rostou.',
                `Klidový tep ⌀ ${rhrPrum} s minimem 47 — regenerace zvládá i kombinaci běh + HIIT + činka.`,
              ],
            },
            {
              t: 'Rezerva',
              c: '#E0A33E',
              items: [
                'Týdenní zátěž skáče mezi 205 a 888 TL. Vyrovnat ji je teď cennější než jakýkoli rychlejší běh.',
                'Jeden běh týdně stačí na udržení, ne na půlmaraton. Až skončí silový blok, bude potřeba druhý klidný běh.',
                'Nejdelší letošní běh je 11,9 km z 18. 8. Na půlmaraton potřebuješ postupně dojít na 16–18 km.',
              ],
            },
            {
              t: 'Pozor',
              c: 'var(--gd-danger)',
              items: [
                'Sobota 4. 10.: 42 km na kole za 259 TL den po 51 km. Kolo se do běžeckého objemu nepočítá, ale do únavy ano.',
                'Tempa z plánu (4:50–5:00/km) jsou pod tvojí dnešní anaerobní hranicí. Když je nedáš, není to selhání — je to informace.',
              ],
            },
          ].map(blok => (
            <div key={blok.t} style={{ borderLeft: `2px solid ${blok.c}`, background: tint(blok.c, 5), padding: '10px 14px', marginBottom: 10 }}>
              <div className="gd-tag" style={{ color: blok.c }}>{blok.t}</div>
              <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {blok.items.map((i, n) => (
                  <li key={n} style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--gd-text-2)', display: 'grid', gridTemplateColumns: '10px 1fr', gap: 8 }}>
                    <span style={{ color: blok.c }}>·</span><span>{i}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11, color: 'var(--gd-text-4)', marginTop: 18, lineHeight: 1.6 }}>
          Metriky kondice, zátěže a klidového tepu jsou ruční snímek z COROS Training Hubu
          k {formatDate(COROS_SNAPSHOT)}. COROS nemá export do jiné appky, takže se obnovují
          přepisem — běhy, tempo a objem se počítají živě z tvého deníku.
        </div>
      </div>
    </div>
  );
}
