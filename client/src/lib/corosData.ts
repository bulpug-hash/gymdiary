// Snímek metrik z COROS Training Hubu (t.coros.com).
//
// COROS počítá věci, které z holého logu běhů nedopočítáš — běžeckou kondici,
// prahové tempo, akutní a chronickou zátěž, klidový tep. Tahá se to ručně
// z API (viz reference_coros_api.md), protože COROS nemá veřejné API ani export
// do jiné appky. Datum snímku je v `COROS_SNAPSHOT`.
//
// Jak to obnovit: přihlásit se na t.coros.com, vytáhnout accessToken z XHR
// a zavolat `GET /analyse/query` (denní a týdenní řady) + opsat čísla
// z Dashboardu (kondice, zóny). Pak přepsat konstanty níž.

/** Kdy byla data naposledy stažená. */
export const COROS_SNAPSHOT = '2026-10-31';

/** Běžecká kondice (COROS „Running Fitness"), nejnovější hodnoty vlevo = nejstarší. */
export const RUN_FITNESS: { date: string; value: number }[] = [
  { date: '2026-09-14', value: 69.0 },
  { date: '2026-09-23', value: 70.2 },
  { date: '2026-09-30', value: 70.2 },
  { date: '2026-10-02', value: 70.3 },
  { date: '2026-10-07', value: 71.3 },
  { date: '2026-10-13', value: 71.6 },
  { date: '2026-10-31', value: 73.2 },
];

/** Prahové hodnoty, ze kterých COROS počítá zóny. */
export const COROS_THRESHOLDS = {
  /** Tepová frekvence laktátového prahu. */
  lthr: 170,
  maxHr: 192,
  restHr: 51,
  /** Prahové tempo v sekundách na km (5:12/km). */
  thresholdPace: 312,
  thresholdPaceLabel: "5:12/km",
};

export interface CorosZone {
  label: string;
  hr: string;
  pace: string;
  color: string;
}

/** Zóny přesně tak, jak je COROS ukazuje na Dashboardu. */
export const COROS_ZONES: CorosZone[] = [
  { label: 'Regenerace', hr: '< 136', pace: '> 7:28', color: 'var(--gd-text-4)' },
  { label: 'Aerobní vytrvalost', hr: '136–152', pace: '6:18–7:28', color: 'var(--gd-fern)' },
  { label: 'Aerobní výkon', hr: '153–161', pace: '5:40–6:17', color: 'var(--gd-accent)' },
  { label: 'Práh', hr: '162–172', pace: '5:06–5:39', color: '#E0A33E' },
  { label: 'Anaerobní vytrvalost', hr: '173–179', pace: '4:34–5:05', color: 'var(--gd-danger)' },
  { label: 'Anaerobní výkon', hr: '> 179', pace: '< 4:34', color: 'var(--gd-danger)' },
];

/** Denní řada z `/analyse/query` → `dayList`. */
export interface CorosDay {
  date: string;
  /** Tréninková zátěž toho dne. */
  tl: number;
  /** Akutní zátěž (7denní okno). */
  t7d: number;
  /** Chronická zátěž (28denní okno). */
  t28d: number;
  /** Klidový tep ráno. null = hodinky tu noc neměřily. */
  rhr: number | null;
  /** Míra únavy v procentech podle COROSu. */
  tired: number;
  /** Rovnováha intenzity: záporná = akutní zátěž přerůstá chronickou. */
  tib: number;
}

export const COROS_DAYS: CorosDay[] = [
  { date: '2026-09-14', tl: 12, t7d: 12, t28d: 12, rhr: 70, tired: 0, tib: 0 },
  { date: '2026-09-15', tl: 0, t7d: 12, t28d: 12, rhr: 59, tired: 0, tib: 0 },
  { date: '2026-09-16', tl: 270, t7d: 282, t28d: 282, rhr: 50, tired: 0, tib: 0 },
  { date: '2026-09-17', tl: 24, t7d: 306, t28d: 306, rhr: 57, tired: 0, tib: 0 },
  { date: '2026-09-18', tl: 0, t7d: 306, t28d: 306, rhr: 55, tired: 0, tib: 0 },
  { date: '2026-09-19', tl: 115, t7d: 421, t28d: 421, rhr: 50, tired: 0, tib: 0 },
  { date: '2026-09-20', tl: 69, t7d: 490, t28d: 490, rhr: 51, tired: 0, tib: 0 },
  { date: '2026-09-21', tl: 0, t7d: 478, t28d: 490, rhr: null, tired: 49, tib: -7 },
  { date: '2026-09-22', tl: 0, t7d: 478, t28d: 490, rhr: 54, tired: 48, tib: -5 },
  { date: '2026-09-23', tl: 217, t7d: 425, t28d: 707, rhr: 57, tired: 50, tib: -10 },
  { date: '2026-09-24', tl: 0, t7d: 401, t28d: 707, rhr: 53, tired: 48, tib: -6 },
  { date: '2026-09-25', tl: 28, t7d: 429, t28d: 735, rhr: 52, tired: 47, tib: -3 },
  { date: '2026-09-26', tl: 46, t7d: 360, t28d: 781, rhr: 63, tired: 44, tib: -1 },
  { date: '2026-09-27', tl: 6, t7d: 297, t28d: 787, rhr: 52, tired: 42, tib: 3 },
  { date: '2026-09-28', tl: 146, t7d: 443, t28d: 933, rhr: 55, tired: 48, tib: -4 },
  { date: '2026-09-29', tl: 0, t7d: 443, t28d: 933, rhr: 56, tired: 45, tib: 1 },
  { date: '2026-09-30', tl: 177, t7d: 403, t28d: 1110, rhr: 58, tired: 50, tib: -9 },
  { date: '2026-10-01', tl: 0, t7d: 258, t28d: 965, rhr: 50, tired: 41, tib: 8 },
  { date: '2026-10-02', tl: 201, t7d: 576, t28d: 1311, rhr: 55, tired: 49, tib: -7 },
  { date: '2026-10-03', tl: 105, t7d: 635, t28d: 1416, rhr: 60, tired: 50, tib: -10 },
  { date: '2026-10-04', tl: 259, t7d: 888, t28d: 1675, rhr: 61, tired: 67, tib: -27 },
  { date: '2026-10-05', tl: 0, t7d: 742, t28d: 1675, rhr: 56, tired: 53, tib: -17 },
  { date: '2026-10-06', tl: 0, t7d: 742, t28d: 1675, rhr: 59, tired: 49, tib: -7 },
  { date: '2026-10-07', tl: 300, t7d: 865, t28d: 1975, rhr: 56, tired: 57, tib: -30 },
  { date: '2026-10-08', tl: 0, t7d: 865, t28d: 1975, rhr: 49, tired: 53, tib: -18 },
  { date: '2026-10-09', tl: 0, t7d: 664, t28d: 1975, rhr: 56, tired: 49, tib: -8 },
  { date: '2026-10-10', tl: 103, t7d: 662, t28d: 2078, rhr: 49, tired: 50, tib: -10 },
  { date: '2026-10-11', tl: 53, t7d: 456, t28d: 2131, rhr: 51, tired: 45, tib: -6 },
  { date: '2026-10-12', tl: 0, t7d: 456, t28d: 2119, rhr: 47, tired: 43, tib: 2 },
  { date: '2026-10-13', tl: 205, t7d: 661, t28d: 2324, rhr: null, tired: 51, tib: -13 },
  { date: '2026-10-14', tl: 68, t7d: 429, t28d: 2122, rhr: 61, tired: 46, tib: -10 },
  { date: '2026-10-15', tl: 0, t7d: 361, t28d: 2030, rhr: 57, tired: 42, tib: 5 },
  { date: '2026-10-16', tl: 20, t7d: 449, t28d: 2118, rhr: 60, tired: 41, tib: 10 },
  { date: '2026-10-17', tl: 288, t7d: 634, t28d: 2291, rhr: 55, tired: 52, tib: -17 },
  { date: '2026-10-18', tl: 16, t7d: 597, t28d: 2238, rhr: 52, tired: 48, tib: -7 },
  { date: '2026-10-19', tl: 0, t7d: 597, t28d: 2238, rhr: 49, tired: 45, tib: 2 },
  { date: '2026-10-20', tl: 0, t7d: 392, t28d: 2238, rhr: 53, tired: 41, tib: 10 },
  { date: '2026-10-21', tl: 377, t7d: 701, t28d: 2398, rhr: 64, tired: 56, tib: -28 },
  { date: '2026-10-22', tl: 0, t7d: 701, t28d: 2398, rhr: 62, tired: 52, tib: -15 },
  { date: '2026-10-23', tl: 43, t7d: 724, t28d: 2413, rhr: 54, tired: 49, tib: -9 },
  { date: '2026-10-24', tl: 23, t7d: 459, t28d: 2390, rhr: 58, tired: 44, tib: -2 },
  { date: '2026-10-25', tl: 14, t7d: 457, t28d: 2398, rhr: 49, tired: 42, tib: 6 },
  { date: '2026-10-26', tl: 0, t7d: 457, t28d: 2252, rhr: 52, tired: 40, tib: 13 },
  { date: '2026-10-27', tl: 0, t7d: 457, t28d: 2252, rhr: null, tired: 34, tib: 19 },
  { date: '2026-10-28', tl: 57, t7d: 137, t28d: 2132, rhr: 55, tired: 35, tib: 18 },
  { date: '2026-10-29', tl: 254, t7d: 391, t28d: 2386, rhr: 56, tired: 45, tib: -7 },
  { date: '2026-10-30', tl: 107, t7d: 455, t28d: 2292, rhr: 64, tired: 46, tib: -11 },
  { date: '2026-10-31', tl: 0, t7d: 432, t28d: 2187, rhr: 55, tired: 43, tib: 0 },
];

/** Týdenní zátěž proti pásmu, které COROS doporučuje. */
export interface CorosWeek {
  /** Pondělí toho týdne. */
  from: string;
  tl: number;
  recMin: number | null;
  recMax: number | null;
}

export const COROS_WEEKS: CorosWeek[] = [
  { from: '2026-09-14', tl: 490, recMin: null, recMax: null },
  { from: '2026-09-21', tl: 297, recMin: 427, recMax: 641 },
  { from: '2026-09-28', tl: 888, recMin: 392, recMax: 706 },
  { from: '2026-10-05', tl: 456, recMin: 511, recMax: 664 },
  { from: '2026-10-12', tl: 597, recMin: 497, recMax: 746 },
  { from: '2026-10-19', tl: 457, recMin: 504, recMax: 756 },
  { from: '2026-10-26', tl: 418, recMin: 497, recMax: 746 },
];
