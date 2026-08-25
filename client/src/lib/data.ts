// ============================================================
// TRÉNINKOVÝ PLÁN PODZIM 2026 v5.2 – 13týdenní peaking blok
// Split: Po Dřep | Út Bench | St HIIT | Čt Volno | Pá Mrtvý tah | So HIIT | Ne Volno
// Blok A Akumulace (W1–4) | Blok B Síla (W5–8) | Blok C Intenzifikace (W9–11) | Taper (W12) | Test (W13)
// Cíle: Dřep 185→190 kg | Bench 127→130 kg | Mrtvý tah 230 (z 220×3) | bez Hack Squatu
// Vlnění (objem→overload→back-off), rotace doplňků po blocích, dipy vyřazeny.
// Historie W1–W14 zachována přes LEGACY_PLAN_WEEKS (recoveryData). Zdroje: Israetel, Tuchscherer, Smith, Zatsiorsky, Horschig, Schumann, Viada
// ============================================================

import { nanoid } from 'nanoid';

export type ExerciseCategory = 'main' | 'accessory' | 'isolation' | 'prevention' | 'core' | 'run' | 'superset';

export interface Exercise {
  id: string;
  name: string;
  nameShort?: string;
  category: ExerciseCategory;
  targetSets: string;
  targetReps: string;
  targetWeight?: string;
  rpe?: string;
  note?: string;
  isDropset?: boolean;
  isSuperset?: boolean;
  supersetWith?: string;
  setType?: 'ramp' | 'topset' | 'backoff' | 'normal' | 'deload';
  /** Rozpis jednotlivých pracovních sérií (přehledná tabulka v Plánu) */
  setPlan?: { label: string; weight: string; reps: string; rpe?: string }[];
  description?: string;
  execution?: string;
  whyInPlan?: string;
}

export interface WorkoutDay {
  key: string;
  label: string;
  labelShort: string;
  type: 'lower' | 'upper' | 'fullbody' | 'hiit' | 'run' | 'rest';
  description: string;
  warmup?: string;
  exercises: Exercise[];
}

export interface Week {
  number: number;
  label: string;
  dateFrom: string;
  dateTo: string;
  phase: string;
  phaseKey: 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'deload';
  isDeload?: boolean;
  description: string;
  days: WorkoutDay[];
  warmupSeries?: WarmupSeries;
}

export interface TrainingRecord {
  id: string;
  date: string;
  sets: string;
  weight: string;
  reps: string;
  note: string;
  /** true = jen předvyplněný návrh z plánu (ne skutečně odcvičeno) */
  planned?: boolean;
  gym?: string;
  extraActivity?: string;
}

export type RecordsMap = Record<string, TrainingRecord[]>;

export interface RunRecord {
  id: string;
  date: string;
  duration: string;    // e.g. "35"
  distance: string;   // km, e.g. "5.2"
  zone: string;       // e.g. "Zóna 2"
  avgPace?: string;   // e.g. "5:30/km"
  avgHr?: string;     // bpm
  note: string;
}

export const RUN_LOG_KEY = '__run_log__';
export type RunRecordsStore = RunRecord[];

export interface HIITRecord {
  id: string;
  date: string;
  type: 'tabata' | 'circuit' | 'amrap' | 'emom' | 'other'; // typ HIIT
  duration: string;      // celková délka v minutách, e.g. "25"
  rounds?: string;       // počet kol, e.g. "8"
  workInterval?: string; // pracovní interval v sekundách, e.g. "20"
  restInterval?: string; // odpočinkový interval v sekundách, e.g. "10"
  zone: string;          // tepová zóna, e.g. "Zóna 4"
  avgHr?: string;        // průměrný TF v bpm, e.g. "165"
  maxHr?: string;        // max TF v bpm, e.g. "185"
  calories?: string;     // spálené kalorie, e.g. "320"
  stravaUrl?: string;    // odkaz na Strava aktivitu
  exercises?: string;    // seznam cviků, e.g. "Burpees, Box jumps, KB swings"
  note: string;
}

export const HIIT_LOG_KEY = '__hiit_log__';
export type HIITRecordsStore = HIITRecord[];

// ============================================================
// WARM-UP SERIES TYPE
// ============================================================
export interface WarmupSet {
  weight: number;  // kg (20 = tyč)
  reps: number;
  note?: string;
}

export interface WarmupSeries {
  squat: WarmupSet[];
  bench: WarmupSet[];
  deadlift: WarmupSet[];
}

// ============================================================
// GOALS & MAXES
// ============================================================
export const GOALS = { bench: 130, squat: 190, deadlift: 230 };
export const STARTING_MAXES = { bench: 127, squat: 185, deadlift: 230 };
export const CURRENT_MAXES = { bench: 127, squat: 185, deadlift: 230 };
export const PLAN_START_DATE = '2026-08-18'; // W1 starts Monday 18 Aug 2026 (Podzim 2026 plán v5.2)

// ============================================================
// WARM-UP PROTOCOL (shared across all strength days)
// ============================================================
export const WARMUP_PROTOCOL = `5 min rotoped → Dynamický strečink + mobilita (Horschig): banded ankles, thorakální extenze, 90/90 stretch → Aktivace: Lower = glute bridges 2×10 + band walks 2×12 | Upper = scapular push-ups 2×10 + band pull-aparts 2×15 → Rozehřívací série (Zatsiorsky): tyč → 40% → 60% → 75% → pracovní váha. Celkem ~12 min.`;

// ============================================================
// HELPERS
// ============================================================
// NEW SCHEDULE (v4 updated):
// Po = Bench (Upper/Prsa) | Út = Volno | St = HIIT | Čt = Squat (Lower/Nohy)
// Pá = Běh | So = HIIT | Ne = Deadlift (Full Body/Záda)
function upperDay(exercises: Exercise[]): WorkoutDay {
  return {
    key: 'monday', label: 'Pondělí', labelShort: 'Po', type: 'upper',
    description: 'UPPER BODY – Bench focus. Bench + variace + záda, prevence. 80 min.',
    warmup: WARMUP_PROTOCOL,
    exercises,
  };
}
const tuesdayRest: WorkoutDay = {
  key: 'tuesday', label: 'Úterý', labelShort: 'Út', type: 'rest',
  description: 'VOLNO – Regenerace. Spánek, výživa, mobilita.',
  exercises: [],
};
function wednesdayHiit(): WorkoutDay {
  return {
    key: 'wednesday', label: 'Středa', labelShort: 'St', type: 'hiit',
    description: 'HIIT – Skupinová lekce. Pevná lekce — plán nepředepisuje.',
    exercises: [{ id: 'hiit-wed', name: 'HIIT – Skupinová lekce', nameShort: 'HIIT', category: 'run', targetSets: '1', targetReps: '~60 min', note: 'Pevná lekce. Po: 40–60 g rychlých sacharidů okamžitě (AMPK/mTOR interference).' }],
  };
}
function lowerDay(exercises: Exercise[], weekNum?: number): WorkoutDay {
  return {
    key: 'thursday', label: 'Čtvrtek', labelShort: 'Čt', type: 'lower',
    description: 'LOWER BODY – Squat focus. Dřep + variace + doplňky. 80 min.',
    warmup: WARMUP_PROTOCOL,
    exercises,
  };
}
function fridayRun(week: number, type: string, duration: string, zone: string): WorkoutDay {
  return {
    key: 'friday', label: 'Pátek', labelShort: 'Pá', type: 'run',
    description: `BĚH – ${type}. Aerobní kapacita. Zóna 2, progresivní program.`,
    exercises: [{ id: 'run-fri', name: `Běh – ${type}`, nameShort: 'Běh', category: 'run', targetSets: '1', targetReps: duration, note: `${zone}. W${week}: ${type}` }],
  };
}
function saturdayHiit(): WorkoutDay {
  return {
    key: 'saturday', label: 'Sobota', labelShort: 'So', type: 'hiit',
    description: 'HIIT – Skupinová lekce. Pevná lekce.',
    exercises: [{ id: 'hiit-sat', name: 'HIIT – Skupinová lekce', nameShort: 'HIIT', category: 'run', targetSets: '1', targetReps: '~60 min', note: 'Pevná lekce. Regenerace zadního řetězce po squatu.' }],
  };
}
function fullBodyDay(exercises: Exercise[]): WorkoutDay {
  return {
    key: 'sunday', label: 'Neděle', labelShort: 'Ne', type: 'fullbody',
    description: 'FULL BODY – Deadlift focus. Mrtvý tah + bench variace + squat variace. 80 min.',
    warmup: WARMUP_PROTOCOL,
    exercises,
  };
}

// ============================================================
// FÁZE 1: AKUMULACE (W1–4) – 14.4.–11.5.2026
// Intenzita 65–78% 1RM | 6–10 opak | RPE 7–8 | Vysoký objem
// Metoda opakovaného úsilí (Zatsiorsky). Double progression.
// ============================================================

const w1: Week = {
  number: 1, label: 'W1 – Akumulace', dateFrom: '2026-04-20', dateTo: '2026-04-26',
  phase: 'Fáze 1 – Akumulace', phaseKey: 'phase1',
  description: 'W1: Startovní váhy odpovídají RPE 7–8 (Tuchscherer). SQ 78 % 1RM, BP 75 %, DL 84 %. Double progression: nejprve přidej rep, pak váhu.',
  days: [
    upperDay([
      { id: 'bench', name: 'Bench Press (Comp.)', nameShort: 'Bench Press', category: 'main', targetSets: '4', targetReps: '8', targetWeight: '90 kg (75 % 1RM)', rpe: '7–8', note: 'Soutěžní setup: lopatky, arch, leg drive.' },
      { id: 'paused-bench', name: 'Paused Bench Press (2s)', nameShort: 'Paused Bench', category: 'accessory', targetSets: '3', targetReps: '8', targetWeight: '77.5–80 kg', rpe: '7–8', note: '2s pauza na hrudi. Eliminuje bounce. Cílí slabinu (start z prsu).' },
      { id: 'dips', name: 'Dips (weighted)', nameShort: 'Dips', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: 'BW+0–10 kg', rpe: '7–8', note: 'Hrudník + triceps. Předklon trupu → víc prsa.' },
      { id: 'pullup', name: 'Weighted Pull-up', nameShort: 'Pull-up', category: 'accessory', targetSets: '3', targetReps: '6–8', targetWeight: 'BW+0–5 kg', rpe: '7–8', note: 'Vertikální tah. Lats + biceps.' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15–20', note: 'Lehká. Prehab ramen (Horschig). Superset A1.', isSuperset: true, supersetWith: 'Bicep Curl' },
      { id: 'bicep-curl', name: 'Bicep Curl', category: 'isolation', targetSets: '3', targetReps: '10–12', note: 'Střední. Superset A2.', isSuperset: true, supersetWith: 'Face Pulls' },
      { id: 'ab-wheel', name: 'Ab Wheel / Hanging Leg Raise', nameShort: 'Core', category: 'core', targetSets: '3', targetReps: '10–12', note: 'BW. Core stabilita.' },
    ]),
    tuesdayRest,
    wednesdayHiit(),
    lowerDay([
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', targetSets: '4', targetReps: '8', targetWeight: '140 kg (78 % 1RM)', rpe: '7–8', note: 'Rovné série. Focus: hloubka, bracing, kontrolovaná excentrika.' },
      { id: 'tempo-squat', name: 'Tempo Squat (3-1-0)', nameShort: 'Tempo Squat', category: 'accessory', targetSets: '3', targetReps: '8', targetWeight: '100 kg', rpe: '7', note: '3s excentrika, 1s pauza. Kontrola v díře.' },
      { id: 'rdl', name: 'Romanian Deadlift (RDL)', nameShort: 'RDL', category: 'accessory', targetSets: '3', targetReps: '10', targetWeight: '120 kg (60 kg/ruka)', rpe: '7–8', note: 'Hip hinge, hamstringy. Straps OK.' },
      { id: 'bulgarian', name: 'Bulgarian Split Squat', nameShort: 'BSS', category: 'accessory', targetSets: '3', targetReps: '10/noha', targetWeight: '30 kg', rpe: '7–8', note: 'Unilaterální quad práce.' },
      { id: 'ghd', name: 'GHD Raise', category: 'core', targetSets: '3', targetReps: '8–10', note: 'BW. Superset A1 s Pallof Press.', isSuperset: true, supersetWith: 'Pallof Press' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '3', targetReps: '10/strana', note: 'Lehká. Superset A2 s GHD Raise.', isSuperset: true, supersetWith: 'GHD Raise' },
    ]),
    fridayRun(1, 'Easy run', '25–35 min', 'Zóna 2 (<75% max TF). Buduje aerobní základ.'),
    saturdayHiit(),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift (Konventní)', nameShort: 'Deadlift', category: 'main', targetSets: '3', targetReps: '8', targetWeight: '190 kg (84 % 1RM)', rpe: '7–8', note: 'Soutěžní setup. Důraz na techniku a bracing.' },
      { id: 'floor-press-db', name: 'Floor Press s jednoroučkami (DB)', nameShort: 'Floor Press DB', category: 'accessory', targetSets: '3', targetReps: '8', targetWeight: '30–35 kg/ruka', rpe: '7–8', note: 'Jednorubní floor press. Bez odrazu — čistá síla z hrudi.' },
      { id: 'barbell-row', name: 'Barbell Row', nameShort: 'BB Row', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: '80–100 kg', rpe: '7–8', note: 'Záda, lats. Silná záda = silný deadlift.' },
      { id: 'walking-lunges', name: 'Walking Lunges', nameShort: 'Lunges', category: 'accessory', targetSets: '3', targetReps: '10/noha', targetWeight: '35–45 kg (2×DB)', rpe: '7–8', note: 'Quad + hýždě unilaterálně.' },
      { id: 'nordic-curls', name: 'Nordic Curls', category: 'prevention', targetSets: '3', targetReps: '4–6', note: 'BW. Prevence hamstring. Superset A1.', isSuperset: true, supersetWith: 'Cop. Addukce' },
      { id: 'cop-adduction', name: 'Copenhagen Addukce', nameShort: 'Cop. Add.', category: 'prevention', targetSets: '2', targetReps: '8/strana', note: 'BW. Prevence třísla (Horschig). Superset A2.', isSuperset: true, supersetWith: 'Nordic Curls' },
      { id: 'ab-wheel-dl', name: 'Ab Wheel / Hanging Leg Raise', nameShort: 'Core', category: 'core', targetSets: '3', targetReps: '10–12', note: 'BW. Core / břícho.' },
    ]),
  ],
};

const w2: Week = {
  number: 2, label: 'W2 – Akumulace', dateFrom: '2026-04-27', dateTo: '2026-05-03',
  phase: 'Fáze 1 – Akumulace', phaseKey: 'phase1',
  description: 'W2: Progrese +5 kg SQ, +2.5 BP. DL: reps klesají na 6 (váha roste na 195 kg = 87 % 1RM). Pokud RPE>9 → sniž o 5 % (Tuchscherer).',
  days: [
    upperDay([
      { id: 'bench', name: 'Bench Press (Comp.)', nameShort: 'Bench Press', category: 'main', targetSets: '4', targetReps: '8', targetWeight: '92.5 kg (77 % 1RM)', rpe: '7–8', note: 'Soutěžní setup: lopatky, arch, leg drive.' },
      { id: 'paused-bench', name: 'Paused Bench Press (2s)', nameShort: 'Paused Bench', category: 'accessory', targetSets: '3', targetReps: '8', targetWeight: '80–85 kg', rpe: '7–8', note: '2s pauza na hrudi. Eliminuje bounce. Cílí slabinu (start z prsu).' },
      { id: 'dips', name: 'Dips (weighted)', nameShort: 'Dips', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: 'BW+0–10 kg', rpe: '7–8', note: 'Hrudník + triceps.' },
      { id: 'pullup', name: 'Weighted Pull-up', nameShort: 'Pull-up', category: 'accessory', targetSets: '3', targetReps: '6–8', targetWeight: 'BW+0–5 kg', rpe: '7–8', note: 'Vertikální tah. Lats + biceps.' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15–20', note: 'Lehká. Prehab ramen. Superset A1.', isSuperset: true, supersetWith: 'Bicep Curl' },
      { id: 'bicep-curl', name: 'Bicep Curl', category: 'isolation', targetSets: '3', targetReps: '10–12', note: 'Střední. Superset A2.', isSuperset: true, supersetWith: 'Face Pulls' },
      { id: 'ab-wheel', name: 'Ab Wheel / Hanging Leg Raise', nameShort: 'Core', category: 'core', targetSets: '3', targetReps: '10–12', note: 'BW. Core stabilita.' },
    ]),
    tuesdayRest,
    wednesdayHiit(),
    lowerDay([
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', targetSets: '4', targetReps: '8', targetWeight: '145 kg (81 % 1RM)', rpe: '7–8', note: 'Rovné série. Focus: hloubka, bracing, kontrolovaná excentrika.' },
      { id: 'tempo-squat', name: 'Tempo Squat (3-1-0)', nameShort: 'Tempo Squat', category: 'accessory', targetSets: '3', targetReps: '8', targetWeight: '102.5 kg', rpe: '7–8', note: '3s excentrika, 1s pauza. Kontrola v díře.' },
      { id: 'rdl', name: 'Romanian Deadlift (RDL)', nameShort: 'RDL', category: 'accessory', targetSets: '3', targetReps: '10', targetWeight: '130–150 kg', rpe: '7–8', note: 'Hip hinge, hamstringy. Straps OK.' },
      { id: 'bulgarian', name: 'Bulgarian Split Squat', nameShort: 'BSS', category: 'accessory', targetSets: '3', targetReps: '8–10/noha', targetWeight: '30–37.5 kg', rpe: '7–8', note: 'Unilaterální quad práce.' },
      { id: 'ghd', name: 'GHD Raise', category: 'core', targetSets: '3', targetReps: '8–10', note: 'BW–+10 kg. Superset A1.', isSuperset: true, supersetWith: 'Pallof Press' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '3', targetReps: '10/strana', note: 'Střední. Superset A2.', isSuperset: true, supersetWith: 'GHD Raise' },
    ]),
    fridayRun(2, 'Easy run', '25–35 min', 'Zóna 2 (<75% max TF). Nezvyšuj tempo.'),
    saturdayHiit(),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Deadlift', category: 'main', targetSets: '3', targetReps: '6', targetWeight: '195 kg (87 % 1RM)', rpe: '7–8', note: 'Soutěžní setup. Důraz na techniku a bracing.' },
      { id: 'floor-press-db', name: 'Floor Press s jednoroučkami (DB)', nameShort: 'Floor Press DB', category: 'accessory', targetSets: '3', targetReps: '8', targetWeight: '32.5–37.5 kg/ruka', rpe: '7–8', note: 'Jednorubní floor press. Bez odrazu — čistá síla z hrudi.' },
      { id: 'barbell-row', name: 'Barbell Row', nameShort: 'BB Row', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: '80–100 kg', rpe: '7–8', note: 'Záda, lats. Silná záda = silný deadlift.' },
      { id: 'walking-lunges', name: 'Walking Lunges', nameShort: 'Lunges', category: 'accessory', targetSets: '3', targetReps: '10/noha', targetWeight: '35–45 kg (2×DB)', rpe: '7–8', note: 'Quad + hýždě.' },
      { id: 'nordic-curls', name: 'Nordic Curls', category: 'prevention', targetSets: '3', targetReps: '4–6', note: 'BW. Superset A1.', isSuperset: true, supersetWith: 'Cop. Addukce' },
      { id: 'cop-adduction', name: 'Copenhagen Addukce', nameShort: 'Cop. Add.', category: 'prevention', targetSets: '2', targetReps: '8/strana', note: 'BW. Superset A2.', isSuperset: true, supersetWith: 'Nordic Curls' },
      { id: 'ab-wheel-dl', name: 'Ab Wheel / Hanging Leg Raise', nameShort: 'Core', category: 'core', targetSets: '3', targetReps: '10–12', note: 'BW. Core / břícho.' },
    ]),
  ],
};

const w3: Week = {
  number: 3, label: 'W3 – Akumulace', dateFrom: '2026-05-04', dateTo: '2026-05-10',
  phase: 'Fáze 1 – Akumulace', phaseKey: 'phase1',
  description: 'W3: Nejvyšší objem fáze. Reps klesají na 6, váha roste. SQ 83 % 1RM, BP 79 %, DL 89 %. Pokud RPE > 8.5 → sniž váhu o 5% (Tuchscherer).',
  days: [
    upperDay([
      { id: 'bench', name: 'Bench Press (Comp.)', nameShort: 'Bench Press', category: 'main', targetSets: '4', targetReps: '6', targetWeight: '95 kg (79 % 1RM)', rpe: '7–8', note: 'Soutěžní setup: lopatky, arch, leg drive.' },
      { id: 'paused-bench', name: 'Paused Bench Press (2s)', nameShort: 'Paused Bench', category: 'accessory', targetSets: '3', targetReps: '6', targetWeight: '82.5–87.5 kg', rpe: '7–8', note: '2s pauza na hrudi. Eliminuje bounce. Cílí slabinu (start z prsu).' },
      { id: 'dips', name: 'Dips (weighted)', nameShort: 'Dips', category: 'accessory', targetSets: '3', targetReps: '6–8', targetWeight: 'BW+0–10 kg', rpe: '7–8', note: 'Hrudník + triceps.' },
      { id: 'pullup', name: 'Weighted Pull-up', nameShort: 'Pull-up', category: 'accessory', targetSets: '3', targetReps: '6–8', targetWeight: 'BW+0–5 kg', rpe: '7–8', note: 'Vertikální tah.' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15–20', note: 'Lehká. Superset A1.', isSuperset: true, supersetWith: 'Bicep Curl' },
      { id: 'bicep-curl', name: 'Bicep Curl', category: 'isolation', targetSets: '3', targetReps: '10–12', note: 'Střední. Superset A2.', isSuperset: true, supersetWith: 'Face Pulls' },
      { id: 'ab-wheel', name: 'Ab Wheel / Hanging Leg Raise', nameShort: 'Core', category: 'core', targetSets: '3', targetReps: '10–12', note: 'BW. Core.' },
    ]),
    tuesdayRest,
    wednesdayHiit(),
    lowerDay([
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', targetSets: '4', targetReps: '6', targetWeight: '150 kg (83 % 1RM)', rpe: '7–8', note: 'Rovné série. Focus: hloubka, bracing, kontrolovaná excentrika.' },
      { id: 'pause-squat', name: 'Pause Squat (2s)', nameShort: 'Pause Squat', category: 'accessory', targetSets: '3', targetReps: '6', targetWeight: '107.5 kg', rpe: '7–8', note: '2s pauza dole. Cílí slabinu (díra).' },
      { id: 'rdl', name: 'Romanian Deadlift (RDL)', nameShort: 'RDL', category: 'accessory', targetSets: '3', targetReps: '8', targetWeight: '130–150 kg', rpe: '7–8', note: 'Hip hinge, hamstringy. Straps OK.' },
      { id: 'bulgarian', name: 'Bulgarian Split Squat', nameShort: 'BSS', category: 'accessory', targetSets: '3', targetReps: '8–10/noha', targetWeight: '30–37.5 kg', rpe: '7–8', note: 'Unilaterální quad práce.' },
      { id: 'ghd', name: 'GHD Raise', category: 'core', targetSets: '3', targetReps: '8–10', note: 'BW–+10 kg. Superset A1.', isSuperset: true, supersetWith: 'Pallof Press' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '3', targetReps: '10/strana', note: 'Lehká. Superset A2.', isSuperset: true, supersetWith: 'GHD Raise' },
    ]),
    fridayRun(3, 'Easy run', '25–35 min', 'Zóna 2 (<75% max TF). Nezvyšuj tempo.'),
    saturdayHiit(),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Deadlift', category: 'main', targetSets: '3', targetReps: '5', targetWeight: '200 kg (89 % 1RM)', rpe: '7–8', note: 'Soutěžní setup. Důraz na techniku a bracing.' },
      { id: 'floor-press-db', name: 'Floor Press s jednoroučkami (DB)', nameShort: 'Floor Press DB', category: 'accessory', targetSets: '3', targetReps: '8', targetWeight: '35–40 kg/ruka', rpe: '7–8', note: 'Jednorubní floor press. Bez odrazu — čistá síla z hrudi.' },
      { id: 'barbell-row', name: 'Barbell Row', nameShort: 'BB Row', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: '80–100 kg', rpe: '7–8', note: 'Záda, lats. Silná záda = silný deadlift.' },
      { id: 'walking-lunges', name: 'Walking Lunges', nameShort: 'Lunges', category: 'accessory', targetSets: '3', targetReps: '10/noha', targetWeight: '35–45 kg (2×DB)', rpe: '7–8', note: 'Quad + hýždě.' },
      { id: 'nordic-curls', name: 'Nordic Curls', category: 'prevention', targetSets: '3', targetReps: '4–6', note: 'BW. Superset A1.', isSuperset: true, supersetWith: 'Cop. Addukce' },
      { id: 'cop-adduction', name: 'Copenhagen Addukce', nameShort: 'Cop. Add.', category: 'prevention', targetSets: '2', targetReps: '8/strana', note: 'BW. Superset A2.', isSuperset: true, supersetWith: 'Nordic Curls' },
      { id: 'ab-wheel-dl', name: 'Ab Wheel / Hanging Leg Raise', nameShort: 'Core', category: 'core', targetSets: '3', targetReps: '10–12', note: 'BW. Core / břícho.' },
    ]),
  ],
};

const w4: Week = {
  number: 4, label: 'W4 – DELOAD', dateFrom: '2026-05-11', dateTo: '2026-05-17',
  phase: 'Fáze 1 – Deload', phaseKey: 'deload', isDeload: true,
  description: 'W4: DELOAD TÝDEN. Objem −40%, intenzita ~69% (Israetel). SQ 69 % 1RM, BP 69 %, DL 73 %. Regenerace CNS. Zatsiorského dvou-faktorový model: únava odezní, fitness zůstane.',
  days: [
    upperDay([
      { id: 'bench', name: 'Bench Press (Comp.)', nameShort: 'Bench Press', category: 'main', targetSets: '3', targetReps: '5', targetWeight: '82.5 kg (69 % 1RM)', rpe: '6–7', note: 'DELOAD.', setType: 'deload' },
      { id: 'paused-bench', name: 'Paused Bench Press (2s)', nameShort: 'Paused Bench', category: 'accessory', targetSets: '2', targetReps: '5', targetWeight: '72.5 kg', rpe: '6', note: 'DELOAD: lehce.', setType: 'deload' },
      { id: 'pullup', name: 'Weighted Pull-up', nameShort: 'Pull-up', category: 'accessory', targetSets: '2', targetReps: '6', targetWeight: 'BW', rpe: '6', note: 'DELOAD.', setType: 'deload' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15', note: 'Lehká. Prehab (Horschig).', setType: 'deload' },
    ]),
    tuesdayRest,
    wednesdayHiit(),
    lowerDay([
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', targetSets: '3', targetReps: '5', targetWeight: '125 kg (69 % 1RM)', rpe: '6–7', note: 'DELOAD: −40% objemu (Israetel).', setType: 'deload' },
      { id: 'pause-squat', name: 'Pause Squat (2s)', nameShort: 'Pause Squat', category: 'accessory', targetSets: '2', targetReps: '5', targetWeight: '87.5 kg', rpe: '6', note: 'DELOAD: lehce.', setType: 'deload' },
      { id: 'ghd', name: 'GHD Raise', category: 'core', targetSets: '2', targetReps: '8', note: 'BW. DELOAD.', setType: 'deload' },
    ]),
    fridayRun(4, 'Recovery jog', '20 min', 'Zóna 1–2 (velmi lehce). DELOAD.'),
    saturdayHiit(),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Deadlift', category: 'main', targetSets: '2', targetReps: '5', targetWeight: '165 kg (73 % 1RM)', rpe: '6–7', note: 'DELOAD.', setType: 'deload' },
      { id: 'barbell-row', name: 'Barbell Row', nameShort: 'BB Row', category: 'accessory', targetSets: '2', targetReps: '8', targetWeight: '72.5 kg', rpe: '6', note: 'DELOAD.', setType: 'deload' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15', note: 'Lehká. Prehab (Horschig).', setType: 'deload' },
      { id: 'ab-wheel-dl', name: 'Ab Wheel', nameShort: 'Core', category: 'core', targetSets: '2', targetReps: '10', note: 'BW. Břícho. DELOAD.', setType: 'deload' },
    ]),
  ],
};

// ============================================================
// FÁZE 2: ROZVOJ SÍLY (W5–8) – 12.5.–8.6.2026
// Intenzita 78–88% 1RM | RPE 8–9 | PYRAMIDOVÁ STRUKTURA
// Ramp → Top Set → Back-off (Tuchscherer + Israetel)
// Strojové doplňky: fatigue management (Israetel s.134)
// ============================================================

const w5: Week = {
  number: 5, label: 'W5 – Síla', dateFrom: '2026-05-18', dateTo: '2026-05-24',
  phase: 'Fáze 2 – Rozvoj síly', phaseKey: 'phase2',
  description: 'W5: Vstup do silové fáze. NÁJEZDNÁ 1 → NÁJEZDNÁ 2 → TOP SET → 2×BACK-OFF (Tuchscherer + Israetel). SQ 85 % 1RM, BP 81 %, DL 88 %.',
  days: [
    upperDay([
      { id: 'bench-ramp1', name: 'Bench Press – NÁJEZDNÁ 1', nameShort: 'Bench N1', category: 'main', targetSets: '1', targetReps: '7', targetWeight: '87.5 kg (73 %)', rpe: '7', note: 'Ramp. 73 % 1RM.', setType: 'ramp' },
      { id: 'bench-ramp2', name: 'Bench Press – NÁJEZDNÁ 2', nameShort: 'Bench N2', category: 'main', targetSets: '1', targetReps: '6', targetWeight: '92.5 kg (77 %)', rpe: '7–8', note: 'Ramp. 77 % 1RM.', setType: 'ramp' },
      { id: 'bench-top', name: 'Bench Press – TOP SET', nameShort: 'Bench TOP', category: 'main', targetSets: '1', targetReps: '5', targetWeight: '97.5 kg (81 %)', rpe: '8–9', note: 'VRCHOLNÁ SÉRIE.', setType: 'topset' },
      { id: 'bench-bo', name: 'Bench Press – BACK-OFF', nameShort: 'Bench BO', category: 'main', targetSets: '2', targetReps: '6', targetWeight: '90 kg (−7 %)', rpe: '7–8', note: 'Sestupné série.', setType: 'backoff' },
      { id: 'spoto', name: 'Spoto Press (2–3 cm)', nameShort: 'Spoto Press', category: 'accessory', targetSets: '3', targetReps: '6', targetWeight: '85 kg', rpe: '8', note: 'Cílí start z prsu. 2–3 cm nad hrudníkem.' },
      { id: 'lat-pulldown', name: 'Lat Pulldown (stroj)', nameShort: 'Lat Pulldown', category: 'accessory', targetSets: '3', targetReps: '8–12', targetWeight: 'Střední–těžká', rpe: '7–8', note: 'Fatigue mgmt lats (Israetel s. 92).' },
      { id: 'dips', name: 'Weighted Dips', nameShort: 'Dips', category: 'accessory', targetSets: '3', targetReps: '6', targetWeight: '+5–10 kg', rpe: '7–8', note: 'Press hypertrofie. Superset A1.', isSuperset: true, supersetWith: 'Face Pulls' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15–20', note: 'Lehká. Prehab (Horschig). Superset A2.', isSuperset: true, supersetWith: 'Dips' },
    ]),
    tuesdayRest,
    wednesdayHiit(),
    lowerDay([
      { id: 'squat-ramp1', name: 'Back Squat – NÁJEZDNÁ 1', nameShort: 'Squat N1', category: 'main', targetSets: '1', targetReps: '7', targetWeight: '135 kg (75 %)', rpe: '7', note: 'Ramp. 75 % 1RM. Objem.', setType: 'ramp' },
      { id: 'squat-ramp2', name: 'Back Squat – NÁJEZDNÁ 2', nameShort: 'Squat N2', category: 'main', targetSets: '1', targetReps: '6', targetWeight: '145 kg (81 %)', rpe: '7–8', note: 'Ramp. 81 % 1RM.', setType: 'ramp' },
      { id: 'squat-top', name: 'Back Squat – TOP SET', nameShort: 'Squat TOP', category: 'main', targetSets: '1', targetReps: '5', targetWeight: '152.5 kg (85 %)', rpe: '8–9', note: 'VRCHOLNÁ SÉRIE. Autoreguluj! (Tuchscherer)', setType: 'topset' },
      { id: 'squat-bo', name: 'Back Squat – BACK-OFF', nameShort: 'Squat BO', category: 'main', targetSets: '2', targetReps: '6', targetWeight: '142.5 kg (−7 %)', rpe: '7–8', note: 'Sestupné série. Dodej objem po top setu.', setType: 'backoff' },
      { id: 'pause-squat', name: 'Pause Squat (2s)', nameShort: 'Pause Squat', category: 'accessory', targetSets: '3', targetReps: '5', targetWeight: '107.5 kg', rpe: '8', note: '2s pauza dole. Cílí sticking point (díra).' },
      { id: 'ghd', name: 'GHD Raise', category: 'core', targetSets: '3', targetReps: '8–10', note: 'BW. Superset A1.', isSuperset: true, supersetWith: 'Pallof Press' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '2', targetReps: '10/strana', note: 'Střední. Superset A2.', isSuperset: true, supersetWith: 'GHD Raise' },
    ]),
    fridayRun(5, 'Tempo run', '30 min', '10 min easy + 10 min tempo + 10 min easy. Zóna 2–3'),
    saturdayHiit(),
    fullBodyDay([
      { id: 'deadlift-ramp1', name: 'Deadlift – NÁJEZDNÁ 1', nameShort: 'DL N1', category: 'main', targetSets: '1', targetReps: '7', targetWeight: '177.5 kg (79 %)', rpe: '7', note: 'Ramp. 79 % 1RM.', setType: 'ramp' },
      { id: 'deadlift-ramp2', name: 'Deadlift – NÁJEZDNÁ 2', nameShort: 'DL N2', category: 'main', targetSets: '1', targetReps: '6', targetWeight: '187.5 kg (83 %)', rpe: '7–8', note: 'Ramp. 83 % 1RM.', setType: 'ramp' },
      { id: 'deadlift-top', name: 'Deadlift – TOP SET', nameShort: 'DL TOP', category: 'main', targetSets: '1', targetReps: '5', targetWeight: '197.5 kg (88 %)', rpe: '8–9', note: 'VRCHOLNÁ SÉRIE.', setType: 'topset' },
      { id: 'deadlift-bo', name: 'Deadlift – BACK-OFF', nameShort: 'DL BO', category: 'main', targetSets: '2', targetReps: '6', targetWeight: '185 kg (−7 %)', rpe: '7–8', note: 'Sestupné série.', setType: 'backoff' },
      { id: 'floor-press-db', name: 'Floor Press s jednoroučkami (DB)', nameShort: 'Floor Press DB', category: 'accessory', targetSets: '3', targetReps: '6', targetWeight: '32.5–37.5 kg/ruka', rpe: '7–8', note: 'Jednorubní floor press — čistá síla z hrudi.' },
      { id: 'cable-row', name: 'Cable Row (stroj)', nameShort: 'Cable Row', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: 'Střední', rpe: '8', note: 'Superset A1.', isSuperset: true, supersetWith: 'Nordic Curls' },
      { id: 'nordic-curls', name: 'Nordic Curls', category: 'prevention', targetSets: '3', targetReps: '5', note: 'BW. Prevence (Horschig). Superset A2.', isSuperset: true, supersetWith: 'Cable Row' },
      { id: 'ab-wheel-dl', name: 'Ab Wheel / Hanging Leg Raise', nameShort: 'Core', category: 'core', targetSets: '3', targetReps: '10–12', note: 'BW. Core / břícho.' },
    ]),
  ],
};

const w6: Week = {
  number: 6, label: 'W6 – Síla', dateFrom: '2026-05-25', dateTo: '2026-05-31',
  phase: 'Fáze 2 – Rozvoj síly', phaseKey: 'phase2',
  description: 'W6: Progrese +5 kg SQ, +2.5 BP, +5 DL. SQ 88 % 1RM, BP 83 %, DL 90 %. Reps klesá na 4 na top setu.',
  days: [
    upperDay([
      { id: 'bench-ramp1', name: 'Bench Press – NÁJEZDNÁ 1', nameShort: 'Bench N1', category: 'main', targetSets: '1', targetReps: '6', targetWeight: '90 kg (75 %)', rpe: '7', note: 'Ramp. 75 % 1RM.', setType: 'ramp' },
      { id: 'bench-ramp2', name: 'Bench Press – NÁJEZDNÁ 2', nameShort: 'Bench N2', category: 'main', targetSets: '1', targetReps: '5', targetWeight: '95 kg (79 %)', rpe: '7–8', note: 'Ramp. 79 % 1RM.', setType: 'ramp' },
      { id: 'bench-top', name: 'Bench Press – TOP SET', nameShort: 'Bench TOP', category: 'main', targetSets: '1', targetReps: '4', targetWeight: '100 kg (83 %)', rpe: '8–9', note: 'VRCHOLNÁ SÉRIE.', setType: 'topset' },
      { id: 'bench-bo', name: 'Bench Press – BACK-OFF', nameShort: 'Bench BO', category: 'main', targetSets: '2', targetReps: '5', targetWeight: '92.5 kg (−7 %)', rpe: '7–8', note: 'Sestupné série.', setType: 'backoff' },
      { id: 'spoto', name: 'Spoto Press (2–3 cm)', nameShort: 'Spoto Press', category: 'accessory', targetSets: '3', targetReps: '5', targetWeight: '87.5 kg', rpe: '8', note: 'Cílí start z prsu. 2–3 cm nad hrudníkem.' },
      { id: 'lat-pulldown', name: 'Lat Pulldown (stroj)', nameShort: 'Lat Pulldown', category: 'accessory', targetSets: '3', targetReps: '8–12', targetWeight: 'Střední–těžká', rpe: '7–8', note: 'Fatigue mgmt lats (Israetel s. 92).' },
      { id: 'dips', name: 'Weighted Dips', nameShort: 'Dips', category: 'accessory', targetSets: '3', targetReps: '5', targetWeight: '+5–10 kg', rpe: '7–8', note: 'Press hypertrofie. Superset A1.', isSuperset: true, supersetWith: 'Face Pulls' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15–20', note: 'Lehká. Prehab (Horschig). Superset A2.', isSuperset: true, supersetWith: 'Dips' },
    ]),
    tuesdayRest,
    wednesdayHiit(),
    lowerDay([
      { id: 'squat-ramp1', name: 'Back Squat – NÁJEZDNÁ 1', nameShort: 'Squat N1', category: 'main', targetSets: '1', targetReps: '6', targetWeight: '142.5 kg (79 %)', rpe: '7', note: 'Ramp. 79 % 1RM. Objem.', setType: 'ramp' },
      { id: 'squat-ramp2', name: 'Back Squat – NÁJEZDNÁ 2', nameShort: 'Squat N2', category: 'main', targetSets: '1', targetReps: '5', targetWeight: '150 kg (83 %)', rpe: '7–8', note: 'Ramp. 83 % 1RM.', setType: 'ramp' },
      { id: 'squat-top', name: 'Back Squat – TOP SET', nameShort: 'Squat TOP', category: 'main', targetSets: '1', targetReps: '4', targetWeight: '157.5 kg (88 %)', rpe: '8–9', note: 'VRCHOLNÁ SÉRIE. Autoreguluj! (Tuchscherer)', setType: 'topset' },
      { id: 'squat-bo', name: 'Back Squat – BACK-OFF', nameShort: 'Squat BO', category: 'main', targetSets: '2', targetReps: '5', targetWeight: '147.5 kg (−7 %)', rpe: '7–8', note: 'Sestupné série.', setType: 'backoff' },
      { id: 'pause-squat', name: 'Pause Squat (2s)', nameShort: 'Pause Squat', category: 'accessory', targetSets: '3', targetReps: '4', targetWeight: '112.5 kg', rpe: '8', note: '2s pauza dole. Cílí sticking point (díra).' },
      { id: 'ghd', name: 'GHD Raise', category: 'core', targetSets: '3', targetReps: '8–10', note: 'BW. Superset A1.', isSuperset: true, supersetWith: 'Pallof Press' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '2', targetReps: '10/strana', note: 'Střední. Superset A2.', isSuperset: true, supersetWith: 'GHD Raise' },
    ]),
    fridayRun(6, 'Tempo run', '32 min', '8 min easy + 15 min tempo + 9 min easy. Zóna 2–3'),
    saturdayHiit(),
    fullBodyDay([
      { id: 'deadlift-ramp1', name: 'Deadlift – NÁJEZDNÁ 1', nameShort: 'DL N1', category: 'main', targetSets: '1', targetReps: '6', targetWeight: '182.5 kg (81 %)', rpe: '7', note: 'Ramp. 81 % 1RM.', setType: 'ramp' },
      { id: 'deadlift-ramp2', name: 'Deadlift – NÁJEZDNÁ 2', nameShort: 'DL N2', category: 'main', targetSets: '1', targetReps: '5', targetWeight: '192.5 kg (86 %)', rpe: '7–8', note: 'Ramp. 86 % 1RM.', setType: 'ramp' },
      { id: 'deadlift-top', name: 'Deadlift – TOP SET', nameShort: 'DL TOP', category: 'main', targetSets: '1', targetReps: '4', targetWeight: '202.5 kg (90 %)', rpe: '8–9', note: 'VRCHOLNÁ SÉRIE.', setType: 'topset' },
      { id: 'deadlift-bo', name: 'Deadlift – BACK-OFF', nameShort: 'DL BO', category: 'main', targetSets: '2', targetReps: '5', targetWeight: '190 kg (−7 %)', rpe: '7–8', note: 'Sestupné série.', setType: 'backoff' },
      { id: 'floor-press-db', name: 'Floor Press s jednoroučkami (DB)', nameShort: 'Floor Press DB', category: 'accessory', targetSets: '3', targetReps: '5', targetWeight: '35–40 kg/ruka', rpe: '7–8', note: 'Jednorubní floor press — čistá síla z hrudi.' },
      { id: 'cable-row', name: 'Cable Row (stroj)', nameShort: 'Cable Row', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: 'Střední', rpe: '8', note: 'Superset A1.', isSuperset: true, supersetWith: 'Nordic Curls' },
      { id: 'nordic-curls', name: 'Nordic Curls', category: 'prevention', targetSets: '3', targetReps: '5', note: 'BW. Prevence (Horschig). Superset A2.', isSuperset: true, supersetWith: 'Cable Row' },
      { id: 'ab-wheel-dl', name: 'Ab Wheel / Hanging Leg Raise', nameShort: 'Core', category: 'core', targetSets: '3', targetReps: '10–12', note: 'BW. Core / břícho.' },
    ]),
  ],
};

const w7: Week = {
  number: 7, label: 'W7 – Síla', dateFrom: '2026-06-01', dateTo: '2026-06-07',
  phase: 'Fáze 2 – Rozvoj síly', phaseKey: 'phase2',
  description: 'W7: Nejvyšší intenzita fáze. Triplety na top setu. SQ 90 % 1RM, BP 88 %, DL 92 %. Volitelně: řetězy na nájezdných sériích squatu (Zatsiorsky).',
  days: [
    upperDay([
      { id: 'bench-ramp1', name: 'Bench Press – NÁJEZDNÁ 1', nameShort: 'Bench N1', category: 'main', targetSets: '1', targetReps: '5', targetWeight: '95 kg (79 %)', rpe: '7', note: 'Ramp. 79 % 1RM.', setType: 'ramp' },
      { id: 'bench-ramp2', name: 'Bench Press – NÁJEZDNÁ 2', nameShort: 'Bench N2', category: 'main', targetSets: '1', targetReps: '4', targetWeight: '100 kg (83 %)', rpe: '7–8', note: 'Ramp. 83 % 1RM.', setType: 'ramp' },
      { id: 'bench-top', name: 'Bench Press – TOP SET', nameShort: 'Bench TOP', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '105 kg (88 %)', rpe: '8–9', note: 'VRCHOLNÁ SÉRIE.', setType: 'topset' },
      { id: 'bench-bo', name: 'Bench Press – BACK-OFF', nameShort: 'Bench BO', category: 'main', targetSets: '2', targetReps: '4', targetWeight: '97.5 kg (−7 %)', rpe: '7–8', note: 'Sestupné série.', setType: 'backoff' },
      { id: 'spoto', name: 'Spoto Press (2–3 cm)', nameShort: 'Spoto Press', category: 'accessory', targetSets: '3', targetReps: '4', targetWeight: '92.5 kg', rpe: '8', note: 'Cílí start z prsu. 2–3 cm nad hrudníkem.' },
      { id: 'lat-pulldown', name: 'Lat Pulldown (stroj)', nameShort: 'Lat Pulldown', category: 'accessory', targetSets: '3', targetReps: '8–12', targetWeight: 'Střední–těžká', rpe: '7–8', note: 'Fatigue mgmt lats (Israetel s. 92).' },
      { id: 'dips', name: 'Weighted Dips', nameShort: 'Dips', category: 'accessory', targetSets: '3', targetReps: '4', targetWeight: '+5–10 kg', rpe: '7–8', note: 'Press hypertrofie. Superset A1.', isSuperset: true, supersetWith: 'Face Pulls' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15–20', note: 'Lehká. Prehab (Horschig). Superset A2.', isSuperset: true, supersetWith: 'Dips' },
    ]),
    tuesdayRest,
    wednesdayHiit(),
    lowerDay([
      { id: 'squat-ramp1', name: 'Back Squat – NÁJEZDNÁ 1', nameShort: 'Squat N1', category: 'main', targetSets: '1', targetReps: '5', targetWeight: '147.5 kg (82 %)', rpe: '7', note: 'Ramp. 82 % 1RM. Objem.', setType: 'ramp' },
      { id: 'squat-ramp2', name: 'Back Squat – NÁJEZDNÁ 2', nameShort: 'Squat N2', category: 'main', targetSets: '1', targetReps: '4', targetWeight: '155 kg (86 %)', rpe: '7–8', note: 'Ramp. 86 % 1RM.', setType: 'ramp' },
      { id: 'squat-top', name: 'Back Squat – TOP SET', nameShort: 'Squat TOP', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '162.5 kg (90 %)', rpe: '8–9', note: 'VRCHOLNÁ SÉRIE. Autoreguluj! (Tuchscherer)', setType: 'topset' },
      { id: 'squat-bo', name: 'Back Squat – BACK-OFF', nameShort: 'Squat BO', category: 'main', targetSets: '2', targetReps: '4', targetWeight: '152.5 kg (−7 %)', rpe: '7–8', note: 'Sestupné série.', setType: 'backoff' },
      { id: 'pause-squat', name: 'Pause Squat (2s)', nameShort: 'Pause Squat', category: 'accessory', targetSets: '3', targetReps: '3', targetWeight: '115 kg', rpe: '8', note: '2s pauza dole. Cílí sticking point (díra).' },
      { id: 'ghd', name: 'GHD Raise', category: 'core', targetSets: '3', targetReps: '8–10', note: 'BW. Superset A1.', isSuperset: true, supersetWith: 'Pallof Press' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '2', targetReps: '10/strana', note: 'Střední. Superset A2.', isSuperset: true, supersetWith: 'GHD Raise' },
    ]),
    fridayRun(7, 'Intervaly', '30 min', '10 min easy + 4×2 min hard/2 min easy + 6 min easy. Zóna 2–4'),
    saturdayHiit(),
    fullBodyDay([
      { id: 'deadlift-ramp1', name: 'Deadlift – NÁJEZDNÁ 1', nameShort: 'DL N1', category: 'main', targetSets: '1', targetReps: '5', targetWeight: '187.5 kg (83 %)', rpe: '7', note: 'Ramp. 83 % 1RM.', setType: 'ramp' },
      { id: 'deadlift-ramp2', name: 'Deadlift – NÁJEZDNÁ 2', nameShort: 'DL N2', category: 'main', targetSets: '1', targetReps: '4', targetWeight: '197.5 kg (88 %)', rpe: '7–8', note: 'Ramp. 88 % 1RM.', setType: 'ramp' },
      { id: 'deadlift-top', name: 'Deadlift – TOP SET', nameShort: 'DL TOP', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '207.5 kg (92 %)', rpe: '8–9', note: 'VRCHOLNÁ SÉRIE.', setType: 'topset' },
      { id: 'deadlift-bo', name: 'Deadlift – BACK-OFF', nameShort: 'DL BO', category: 'main', targetSets: '2', targetReps: '4', targetWeight: '195 kg (−7 %)', rpe: '7–8', note: 'Sestupné série.', setType: 'backoff' },
      { id: 'floor-press-db', name: 'Floor Press s jednoroučkami (DB)', nameShort: 'Floor Press DB', category: 'accessory', targetSets: '3', targetReps: '4', targetWeight: '37.5–42.5 kg/ruka', rpe: '7–8', note: 'Jednorubní floor press — čistá síla z hrudi.' },
      { id: 'cable-row', name: 'Cable Row (stroj)', nameShort: 'Cable Row', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: 'Střední', rpe: '8', note: 'Superset A1.', isSuperset: true, supersetWith: 'Nordic Curls' },
      { id: 'nordic-curls', name: 'Nordic Curls', category: 'prevention', targetSets: '3', targetReps: '5', note: 'BW. Prevence (Horschig). Superset A2.', isSuperset: true, supersetWith: 'Cable Row' },
      { id: 'ab-wheel-dl', name: 'Ab Wheel / Hanging Leg Raise', nameShort: 'Core', category: 'core', targetSets: '3', targetReps: '10–12', note: 'BW. Core / břícho.' },
    ]),
  ],
};

const w8: Week = {
  number: 8, label: 'W8 – DELOAD', dateFrom: '2026-06-08', dateTo: '2026-06-14',
  phase: 'Fáze 2 – Deload', phaseKey: 'deload', isDeload: true,
  description: 'W8: DELOAD TÝDEN. Objem −50%, váhy ~74–82 % (Israetel). SQ 82 % 1RM, BP 77 %, DL 81 %. Regenerace CNS před intenzifikací.',
  days: [
    upperDay([
      { id: 'bench-ramp1', name: 'Bench Press – NÁJEZDNÁ 1', nameShort: 'Bench N1', category: 'main', targetSets: '1', targetReps: '5', targetWeight: '82.5 kg (69 %)', rpe: '7', note: 'DELOAD ramp.', setType: 'ramp' },
      { id: 'bench-ramp2', name: 'Bench Press – NÁJEZDNÁ 2', nameShort: 'Bench N2', category: 'main', targetSets: '1', targetReps: '4', targetWeight: '87.5 kg (73 %)', rpe: '7–8', note: 'DELOAD ramp.', setType: 'ramp' },
      { id: 'bench-top', name: 'Bench Press – TOP SET', nameShort: 'Bench TOP', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '92.5 kg (77 %)', rpe: '8–9', note: 'DELOAD top set.', setType: 'topset' },
      { id: 'bench-bo', name: 'Bench Press', nameShort: 'Bench BO', category: 'main', targetSets: '3', targetReps: '3', targetWeight: '77.5 kg', rpe: '6–7', note: 'DELOAD.', setType: 'deload' },
      { id: 'spoto', name: 'Spoto Press (2–3 cm)', nameShort: 'Spoto Press', category: 'accessory', targetSets: '2', targetReps: '3', targetWeight: '72.5 kg', rpe: '6', note: 'DELOAD.', setType: 'deload' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15', note: 'Lehká. Prehab.', setType: 'deload' },
    ]),
    tuesdayRest,
    wednesdayHiit(),
    lowerDay([
      { id: 'squat-ramp1', name: 'Back Squat – NÁJEZDNÁ 1', nameShort: 'Squat N1', category: 'main', targetSets: '1', targetReps: '5', targetWeight: '132.5 kg (74 %)', rpe: '7', note: 'DELOAD ramp. 74 % 1RM.', setType: 'ramp' },
      { id: 'squat-ramp2', name: 'Back Squat – NÁJEZDNÁ 2', nameShort: 'Squat N2', category: 'main', targetSets: '1', targetReps: '4', targetWeight: '140 kg (78 %)', rpe: '7–8', note: 'DELOAD ramp. 78 % 1RM.', setType: 'ramp' },
      { id: 'squat-top', name: 'Back Squat – TOP SET', nameShort: 'Squat TOP', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '147.5 kg (82 %)', rpe: '8–9', note: 'DELOAD top set. Autoreguluj! (Tuchscherer)', setType: 'topset' },
      { id: 'squat-bo', name: 'Back Squat', nameShort: 'Squat BO', category: 'main', targetSets: '3', targetReps: '3', targetWeight: '125 kg', rpe: '6–7', note: 'DELOAD: lehké triplety.', setType: 'deload' },
      { id: 'pause-squat', name: 'Pause Squat (2s)', nameShort: 'Pause Squat', category: 'accessory', targetSets: '2', targetReps: '3', targetWeight: '92.5 kg', rpe: '6', note: 'DELOAD.', setType: 'deload' },
    ]),
    fridayRun(8, 'Recovery jog', '20 min', 'Zóna 1–2 (lehce). DELOAD.'),
    saturdayHiit(),
    fullBodyDay([
      { id: 'deadlift-ramp1', name: 'Deadlift – NÁJEZDNÁ 1', nameShort: 'DL N1', category: 'main', targetSets: '1', targetReps: '5', targetWeight: '165 kg (73 %)', rpe: '7', note: 'DELOAD ramp.', setType: 'ramp' },
      { id: 'deadlift-ramp2', name: 'Deadlift – NÁJEZDNÁ 2', nameShort: 'DL N2', category: 'main', targetSets: '1', targetReps: '4', targetWeight: '172.5 kg (77 %)', rpe: '7–8', note: 'DELOAD ramp.', setType: 'ramp' },
      { id: 'deadlift-top', name: 'Deadlift – TOP SET', nameShort: 'DL TOP', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '182.5 kg (81 %)', rpe: '8–9', note: 'DELOAD top set.', setType: 'topset' },
      { id: 'deadlift-bo', name: 'Deadlift', nameShort: 'DL BO', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '150 kg', rpe: '6–7', note: 'DELOAD.', setType: 'deload' },
      { id: 'barbell-row', name: 'Barbell Row', nameShort: 'BB Row', category: 'accessory', targetSets: '2', targetReps: '8', targetWeight: '72.5 kg', rpe: '6', note: 'DELOAD.', setType: 'deload' },
    ]),
  ],
};

// ============================================================
// FÁZE 3: INTENZIFIKACE (W9–12) – 9.6.–6.7.2026
// Intenzita 85–95% 1RM | RPE 9 | Metoda maximálního úsilí
// Pyramida: ramp → top set → back-off (−8%)
// ============================================================

const w9: Week = {
  number: 9, label: 'W9 – Intenzifikace', dateFrom: '2026-06-15', dateTo: '2026-06-21',
  phase: 'Fáze 3 – Intenzifikace', phaseKey: 'phase3',
  description: 'W9: Vstup do intenzifikace. RAMP 1 → RAMP 2 → TOP SET → 2×BACK-OFF. SQ 90 % 1RM, BP 88 %, DL 92 %. Metoda max. úsílí (Zatsiorsky). Back-off −93 % top setu.',
  days: [
    upperDay([
      { id: 'bench-ramp1', name: 'Bench Press – RAMP 1', nameShort: 'Bench R1', category: 'main', targetSets: '1', targetReps: '4', targetWeight: '97.5 kg (81 %)', rpe: '7–8', note: 'Ramp.', setType: 'ramp' },
      { id: 'bench-ramp2', name: 'Bench Press – RAMP 2', nameShort: 'Bench R2', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '102.5 kg (85 %)', rpe: '8', note: 'Ramp.', setType: 'ramp' },
      { id: 'bench-top', name: 'Bench Press – TOP SET', nameShort: 'Bench TOP', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '105 kg (88 %)', rpe: '9', note: 'VRCHOLNÁ SÉRIE.', setType: 'topset' },
      { id: 'bench-bo', name: 'Bench Press – BACK-OFF', nameShort: 'Bench BO', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '97.5 kg (81 %)', rpe: '8', note: 'Back-off ~93 %.', setType: 'backoff' },
      { id: 'spoto', name: 'Spoto Press (2–3 cm)', nameShort: 'Spoto Press', category: 'accessory', targetSets: '3', targetReps: '3', targetWeight: '92.5 kg', rpe: '8–9', note: 'Cílí start z prsu.' },
      { id: 'cable-row', name: 'Cable Row (kladka vsedě)', nameShort: 'Cable Row', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: 'Střední–těžká', rpe: '8', note: 'Záda, lats. Fatigue mgmt (Israetel s. 134).' },
      { id: 'tricep-pushdown', name: 'Tricep Pushdown', nameShort: 'Tricep', category: 'accessory', targetSets: '3', targetReps: '6', targetWeight: 'Střední', rpe: '7', note: 'Superset A1.', isSuperset: true, supersetWith: 'Face Pulls' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15–20', note: 'Lehká. Prehab. Superset A2.', isSuperset: true, supersetWith: 'Tricep Pushdown' },
    ]),
    tuesdayRest,
    wednesdayHiit(),
    lowerDay([
      { id: 'squat-ramp1', name: 'Back Squat – RAMP 1', nameShort: 'Squat R1', category: 'main', targetSets: '1', targetReps: '4', targetWeight: '150 kg (83 %)', rpe: '7–8', note: 'Rampovací série.', setType: 'ramp' },
      { id: 'squat-ramp2', name: 'Back Squat – RAMP 2', nameShort: 'Squat R2', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '157.5 kg (88 %)', rpe: '8', note: 'Rampovací série.', setType: 'ramp' },
      { id: 'squat-top', name: 'Back Squat – TOP SET', nameShort: 'Squat TOP', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '162.5 kg (90 %)', rpe: '9', note: 'VRCHOLNÁ SÉRIE. RPE 9 (1 RIR).', setType: 'topset' },
      { id: 'squat-bo', name: 'Back Squat – BACK-OFF', nameShort: 'Squat BO', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '152.5 kg (85 %)', rpe: '8', note: 'Back-off ~93 % top setu.', setType: 'backoff' },
      { id: 'pause-squat', name: 'Pause Squat (2s)', nameShort: 'Pause Squat', category: 'accessory', targetSets: '3', targetReps: '3', targetWeight: '120 kg', rpe: '8', note: 'Variace pro cílení slabin.' },
      { id: 'leg-press', name: 'Leg Press (stroj)', nameShort: 'Leg Press', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: 'Stroj — těžká', rpe: '7–8', note: 'Fatigue mgmt (Israetel s. 92): quad objem po těžkém squatu.' },
      { id: 'ghd', name: 'GHD Raise', category: 'core', targetSets: '3', targetReps: '6–8', note: 'BW+. Superset A1.', isSuperset: true, supersetWith: 'Pallof Press' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '2', targetReps: '10/strana', note: 'Střední. Superset A2.', isSuperset: true, supersetWith: 'GHD Raise' },
    ]),
    fridayRun(9, 'Tempo run', '35 min', '8 min easy + 18 min tempo + 9 min easy. Zóna 2–3'),
    saturdayHiit(),
    fullBodyDay([
      { id: 'deadlift-ramp1', name: 'Deadlift – RAMP 1', nameShort: 'DL R1', category: 'main', targetSets: '1', targetReps: '4', targetWeight: '195 kg (87 %)', rpe: '7–8', note: 'Ramp.', setType: 'ramp' },
      { id: 'deadlift-ramp2', name: 'Deadlift – RAMP 2', nameShort: 'DL R2', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '202.5 kg (90 %)', rpe: '8', note: 'Ramp.', setType: 'ramp' },
      { id: 'deadlift-top', name: 'Deadlift – TOP SET', nameShort: 'DL TOP', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '207.5 kg (92 %)', rpe: '9', note: 'VRCHOLNÁ SÉRIE.', setType: 'topset' },
      { id: 'deadlift-bo', name: 'Deadlift – BACK-OFF', nameShort: 'DL BO', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '195 kg (87 %)', rpe: '8', note: 'Back-off ~93 %.', setType: 'backoff' },
      { id: 'pause-squat', name: 'Pause Squat (2s)', nameShort: 'Pause Squat', category: 'accessory', targetSets: '3', targetReps: '3', targetWeight: '120 kg', rpe: '8', note: 'Squat variace na deadlift den.' },
      { id: 'floor-press-db', name: 'Floor Press s jednoroučkami (DB)', nameShort: 'Floor Press DB', category: 'accessory', targetSets: '3', targetReps: '3', targetWeight: '40–45 kg/ruka', rpe: '8', note: 'Jednorubní floor press — čistá síla z hrudi.' },
      { id: 'barbell-row', name: 'Barbell Row', nameShort: 'BB Row', category: 'accessory', targetSets: '3', targetReps: '5', targetWeight: '90–107.5 kg', rpe: '7–8', note: 'Záda, lats.' },
      { id: 'ab-wheel-dl', name: 'Ab Wheel / Hanging Leg Raise', nameShort: 'Core', category: 'core', targetSets: '3', targetReps: '10–12', note: 'BW. Core / břícho.' },
    ]),
  ],
};

const w10: Week = {
  number: 10, label: 'W10 – Intenzifikace', dateFrom: '2026-06-22', dateTo: '2026-06-28',
  phase: 'Fáze 3 – Intenzifikace', phaseKey: 'phase3',
  description: 'W10: Progrese +5 kg SQ, +2.5 BP, +7.5 DL. SQ 93 % 1RM, BP 92 %, DL 96 %. Doubles na top setu. Back-off ~93 % top setu.',
  days: [
    upperDay([
      { id: 'bench-ramp1', name: 'Bench Press – RAMP 1', nameShort: 'Bench R1', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '100 kg (83 %)', rpe: '7–8', note: 'Ramp.', setType: 'ramp' },
      { id: 'bench-ramp2', name: 'Bench Press – RAMP 2', nameShort: 'Bench R2', category: 'main', targetSets: '1', targetReps: '2', targetWeight: '105 kg (88 %)', rpe: '8', note: 'Ramp.', setType: 'ramp' },
      { id: 'bench-top', name: 'Bench Press – TOP SET', nameShort: 'Bench TOP', category: 'main', targetSets: '1', targetReps: '2', targetWeight: '107.5 kg (90 %)', rpe: '9', note: 'VRCHOLNÁ SÉRIE.', setType: 'topset' },
      { id: 'bench-bo', name: 'Bench Press – BACK-OFF', nameShort: 'Bench BO', category: 'main', targetSets: '2', targetReps: '2', targetWeight: '102.5 kg (85 %)', rpe: '8', note: 'Back-off ~93 %.', setType: 'backoff' },
      { id: 'pin-press', name: 'Pin Press', nameShort: 'Pin Press', category: 'accessory', targetSets: '3', targetReps: '2', targetWeight: '95 kg', rpe: '8–9', note: 'Cílí start z prsu.' },
      { id: 'cable-row', name: 'Cable Row (kladka vsedě)', nameShort: 'Cable Row', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: 'Střední–těžká', rpe: '8', note: 'Záda, lats. Fatigue mgmt (Israetel s. 134).' },
      { id: 'tricep-pushdown', name: 'Tricep Pushdown', nameShort: 'Tricep', category: 'accessory', targetSets: '3', targetReps: '5', targetWeight: 'Střední', rpe: '7', note: 'Superset A1.', isSuperset: true, supersetWith: 'Face Pulls' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15–20', note: 'Lehká. Prehab. Superset A2.', isSuperset: true, supersetWith: 'Tricep Pushdown' },
    ]),
    tuesdayRest,
    wednesdayHiit(),
    lowerDay([
      { id: 'squat-ramp1', name: 'Back Squat – RAMP 1', nameShort: 'Squat R1', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '152.5 kg (85 %)', rpe: '7–8', note: 'Rampovací série.', setType: 'ramp' },
      { id: 'squat-ramp2', name: 'Back Squat – RAMP 2', nameShort: 'Squat R2', category: 'main', targetSets: '1', targetReps: '2', targetWeight: '160 kg (89 %)', rpe: '8', note: 'Rampovací série.', setType: 'ramp' },
      { id: 'squat-top', name: 'Back Squat – TOP SET', nameShort: 'Squat TOP', category: 'main', targetSets: '1', targetReps: '2', targetWeight: '165 kg (92 %)', rpe: '9', note: 'VRCHOLNÁ SÉRIE. RPE 9 (1 RIR).', setType: 'topset' },
      { id: 'squat-bo', name: 'Back Squat – BACK-OFF', nameShort: 'Squat BO', category: 'main', targetSets: '2', targetReps: '2', targetWeight: '157.5 kg (88 %)', rpe: '8', note: 'Back-off ~93 % top setu.', setType: 'backoff' },
      { id: 'close-stance-squat', name: 'Close Stance Squat', nameShort: 'Close Squat', category: 'accessory', targetSets: '3', targetReps: '2', targetWeight: '120 kg',rpe: '8', note: 'Variace pro cílení slabin.' },
      { id: 'leg-press', name: 'Leg Press (stroj)', nameShort: 'Leg Press', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: 'Stroj — těžká', rpe: '7–8', note: 'Fatigue mgmt (Israetel s. 92): quad objem po těžkém squatu.' },
      { id: 'ghd', name: 'GHD Raise', category: 'core', targetSets: '3', targetReps: '6–8', note: 'BW+. Superset A1.', isSuperset: true, supersetWith: 'Pallof Press' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '2', targetReps: '10/strana', note: 'Střední. Superset A2.', isSuperset: true, supersetWith: 'GHD Raise' },
    ]),
    fridayRun(10, 'Intervaly', '32 min', '10 min easy + 5×2 min hard/90s easy + 6 min easy. Zóna 2–4'),
    saturdayHiit(),
    fullBodyDay([
      { id: 'deadlift-ramp1', name: 'Deadlift – RAMP 1', nameShort: 'DL R1', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '197.5 kg (88 %)', rpe: '7–8', note: 'Ramp.', setType: 'ramp' },
      { id: 'deadlift-ramp2', name: 'Deadlift – RAMP 2', nameShort: 'DL R2', category: 'main', targetSets: '1', targetReps: '2', targetWeight: '205 kg (91 %)', rpe: '8', note: 'Ramp.', setType: 'ramp' },
      { id: 'deadlift-top', name: 'Deadlift – TOP SET', nameShort: 'DL TOP', category: 'main', targetSets: '1', targetReps: '2', targetWeight: '210 kg (93 %)', rpe: '9', note: 'VRCHOLNÁ SÉRIE.', setType: 'topset' },
      { id: 'deadlift-bo', name: 'Deadlift – BACK-OFF', nameShort: 'DL BO', category: 'main', targetSets: '2', targetReps: '2', targetWeight: '202.5 kg (90 %)', rpe: '8', note: 'Back-off ~93 %.', setType: 'backoff' },
      { id: 'pause-squat', name: 'Pause Squat (2s)', nameShort: 'Pause Squat', category: 'accessory', targetSets: '3', targetReps: '2', targetWeight: '120 kg', rpe: '8', note: 'Squat variace na deadlift den.' },
      { id: 'floor-press-db', name: 'Floor Press s jednoroučkami (DB)', nameShort: 'Floor Press DB', category: 'accessory', targetSets: '3', targetReps: '2', targetWeight: '42.5–47.5 kg/ruka', rpe: '8', note: 'Jednorubní floor press — čistá síla z hrudi.' },
      { id: 'barbell-row', name: 'Barbell Row', nameShort: 'BB Row', category: 'accessory', targetSets: '3', targetReps: '4', targetWeight: '90–107.5 kg', rpe: '7–8', note: 'Záda, lats.' },
      { id: 'ab-wheel-dl', name: 'Ab Wheel / Hanging Leg Raise', nameShort: 'Core', category: 'core', targetSets: '3', targetReps: '10–12', note: 'BW. Core / břícho.' },
    ]),
  ],
};

const w11: Week = {
  number: 11, label: 'W11 – Intenzifikace', dateFrom: '2026-06-29', dateTo: '2026-07-05',
  phase: 'Fáze 3 – Intenzifikace', phaseKey: 'phase3',
  description: 'W11: DELOAD + mini-peak. SQ 86 % 1RM, BP 85 %, DL 88 %. Back-off ~93 % top setu. Regenerace před W12 peakingem.',
  days: [
    upperDay([
      { id: 'bench-ramp1', name: 'Bench Press – RAMP 1', nameShort: 'Bench R1', category: 'main', targetSets: '1', targetReps: '4', targetWeight: '102.5 kg (85 %)', rpe: '7–8', note: 'Ramp.', setType: 'ramp' },
      { id: 'bench-ramp2', name: 'Bench Press – RAMP 2', nameShort: 'Bench R2', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '107.5 kg (90 %)', rpe: '8', note: 'Ramp.', setType: 'ramp' },
      { id: 'bench-top', name: 'Bench Press – TOP SET', nameShort: 'Bench TOP', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '110 kg (92 %)', rpe: '9', note: 'VRCHOLNÁ SÉRIE.', setType: 'topset' },
      { id: 'bench-bo', name: 'Bench Press – BACK-OFF', nameShort: 'Bench BO', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '102.5 kg (85 %)', rpe: '8', note: 'Back-off ~93 %.', setType: 'backoff' },
      { id: 'pin-press', name: 'Pin Press', nameShort: 'Pin Press', category: 'accessory', targetSets: '3', targetReps: '3', targetWeight: '97.5 kg', rpe: '8–9', note: 'Cílí start z prsu.' },
      { id: 'cable-row', name: 'Cable Row (kladka vsedě)', nameShort: 'Cable Row', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: 'Střední–těžká', rpe: '8', note: 'Záda, lats. Fatigue mgmt (Israetel s. 134).' },
      { id: 'tricep-pushdown', name: 'Tricep Pushdown', nameShort: 'Tricep', category: 'accessory', targetSets: '3', targetReps: '6', targetWeight: 'Střední', rpe: '7', note: 'Superset A1.', isSuperset: true, supersetWith: 'Face Pulls' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15–20', note: 'Lehká. Prehab. Superset A2.', isSuperset: true, supersetWith: 'Tricep Pushdown' },
    ]),
    tuesdayRest,
    wednesdayHiit(),
    lowerDay([
      { id: 'squat-ramp1', name: 'Back Squat – RAMP 1', nameShort: 'Squat R1', category: 'main', targetSets: '1', targetReps: '4', targetWeight: '155 kg (86 %)', rpe: '7–8', note: 'Rampovací série.', setType: 'ramp' },
      { id: 'squat-ramp2', name: 'Back Squat – RAMP 2', nameShort: 'Squat R2', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '162.5 kg (90 %)', rpe: '8', note: 'Rampovací série.', setType: 'ramp' },
      { id: 'squat-top', name: 'Back Squat – TOP SET', nameShort: 'Squat TOP', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '167.5 kg (93 %)', rpe: '9', note: 'VRCHOLNÁ SÉRIE. RPE 9 (1 RIR).', setType: 'topset' },
      { id: 'squat-bo', name: 'Back Squat – BACK-OFF', nameShort: 'Squat BO', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '157.5 kg (88 %)', rpe: '8', note: 'Back-off ~93 % top setu.', setType: 'backoff' },
      { id: 'pause-squat', name: 'Pause Squat (2s)', nameShort: 'Pause Squat', category: 'accessory', targetSets: '3', targetReps: '3', targetWeight: '112.5 kg', rpe: '8', note: 'Variace pro cílení slabin.' },
      { id: 'leg-press', name: 'Leg Press (stroj)', nameShort: 'Leg Press', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: 'Stroj — těžká', rpe: '7–8', note: 'Fatigue mgmt (Israetel s. 92): quad objem po těžkém squatu.' },
      { id: 'ghd', name: 'GHD Raise', category: 'core', targetSets: '3', targetReps: '6–8', note: 'BW+. Superset A1.', isSuperset: true, supersetWith: 'Pallof Press' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '2', targetReps: '10/strana', note: 'Střední. Superset A2.', isSuperset: true, supersetWith: 'GHD Raise' },
    ]),
    fridayRun(11, 'Tempo + intervaly', '35 min', '10 min easy + 10 min tempo + 3×1 min sprint/2 min + 5 min easy. Zóna 2–5'),
    saturdayHiit(),
    fullBodyDay([
      { id: 'deadlift-ramp1', name: 'Deadlift – RAMP 1', nameShort: 'DL R1', category: 'main', targetSets: '1', targetReps: '4', targetWeight: '202.5 kg (90 %)', rpe: '7–8', note: 'Ramp.', setType: 'ramp' },
      { id: 'deadlift-ramp2', name: 'Deadlift – RAMP 2', nameShort: 'DL R2', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '210 kg (93 %)', rpe: '8', note: 'Ramp.', setType: 'ramp' },
      { id: 'deadlift-top', name: 'Deadlift – TOP SET', nameShort: 'DL TOP', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '215 kg (96 %)', rpe: '9', note: 'VRCHOLNÁ SÉRIE.', setType: 'topset' },
      { id: 'deadlift-bo', name: 'Deadlift – BACK-OFF', nameShort: 'DL BO', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '202.5 kg (90 %)', rpe: '8', note: 'Back-off ~93 %.', setType: 'backoff' },
       { id: 'pause-squat', name: 'Pause Squat (2s)', nameShort: 'Pause Squat', category: 'accessory', targetSets: '3', targetReps: '2', targetWeight: '120 kg', rpe: '8', note: 'Squat variace na deadlift den.' },
      { id: 'floor-press-db', name: 'Floor Press s jednoroučkami (DB)', nameShort: 'Floor Press DB', category: 'accessory', targetSets: '3', targetReps: '2', targetWeight: '45–47.5 kg/ruka', rpe: '8', note: 'Jednorubní floor press — čistá síla z hrudi.' },
      { id: 'barbell-row', name: 'Barbell Row', nameShort: 'BB Row', category: 'accessory', targetSets: '3', targetReps: '4', targetWeight: '90–107.5 kg', rpe: '7–8', note: 'Záda, lats.' },
      { id: 'ab-wheel-dl', name: 'Ab Wheel / Hanging Leg Raise', nameShort: 'Core', category: 'core', targetSets: '3', targetReps: '10–12', note: 'BW. Core / břícho.' },
    ]),
  ],
};

const w12: Week = {
  number: 12, label: 'W12 – Mini-deload', dateFrom: '2026-07-06', dateTo: '2026-07-12',
  phase: 'Fáze 3 – Mini-deload', phaseKey: 'deload', isDeload: true,
  description: 'W12: MINI-DELOAD před peakingem. SQ 86 % 1RM, BP 85 %, DL 88 %. Back-off ~93 % top setu. Regenerace před finální fází.',
  days: [
    upperDay([
      { id: 'bench-ramp1', name: 'Bench Press – RAMP 1', nameShort: 'Bench R1', category: 'main', targetSets: '1', targetReps: '4', targetWeight: '102.5 kg (85 %)', rpe: '7–8', note: 'Ramp.', setType: 'ramp' },
      { id: 'bench-ramp2', name: 'Bench Press – RAMP 2', nameShort: 'Bench R2', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '107.5 kg (90 %)', rpe: '8', note: 'Ramp.', setType: 'ramp' },
      { id: 'bench-top', name: 'Bench Press – TOP SET', nameShort: 'Bench TOP', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '110 kg (92 %)', rpe: '9', note: 'VRCHOLNÁ SÉRIE.', setType: 'topset' },
      { id: 'bench-bo', name: 'Bench Press – BACK-OFF', nameShort: 'Bench BO', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '102.5 kg (85 %)', rpe: '8', note: 'Back-off ~93 %.', setType: 'backoff' },
      { id: 'pin-press', name: 'Pin Press', nameShort: 'Pin Press', category: 'accessory', targetSets: '3', targetReps: '3', targetWeight: '97.5 kg', rpe: '8–9', note: 'Cílí start z prsu.' },
      { id: 'cable-row', name: 'Cable Row (kladka vsedě)', nameShort: 'Cable Row', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: 'Střední–těžká', rpe: '8', note: 'Záda, lats. Fatigue mgmt (Israetel s. 134).' },
      { id: 'tricep-pushdown', name: 'Tricep Pushdown', nameShort: 'Tricep', category: 'accessory', targetSets: '3', targetReps: '6', targetWeight: 'Střední', rpe: '7', note: 'Superset A1.', isSuperset: true, supersetWith: 'Face Pulls' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15–20', note: 'Lehká. Prehab. Superset A2.', isSuperset: true, supersetWith: 'Tricep Pushdown' },
    ]),
    tuesdayRest,
    wednesdayHiit(),
    lowerDay([
      { id: 'squat-ramp1', name: 'Back Squat – RAMP 1', nameShort: 'Squat R1', category: 'main', targetSets: '1', targetReps: '4', targetWeight: '155 kg (86 %)', rpe: '7–8', note: 'Rampovací série.', setType: 'ramp' },
      { id: 'squat-ramp2', name: 'Back Squat – RAMP 2', nameShort: 'Squat R2', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '162.5 kg (90 %)', rpe: '8', note: 'Rampovací série.', setType: 'ramp' },
      { id: 'squat-top', name: 'Back Squat – TOP SET', nameShort: 'Squat TOP', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '167.5 kg (93 %)', rpe: '9', note: 'VRCHOLNÁ SÉRIE. RPE 9 (1 RIR).', setType: 'topset' },
      { id: 'squat-bo', name: 'Back Squat – BACK-OFF', nameShort: 'Squat BO', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '157.5 kg (88 %)', rpe: '8', note: 'Back-off ~93 % top setu.', setType: 'backoff' },
      { id: 'pause-squat', name: 'Pause Squat (2s)', nameShort: 'Pause Squat', category: 'accessory', targetSets: '3', targetReps: '3', targetWeight: '112.5 kg', rpe: '8', note: 'Variace pro cílení slabin.' },
      { id: 'leg-press', name: 'Leg Press (stroj)', nameShort: 'Leg Press', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: 'Stroj — těžká', rpe: '7–8', note: 'Fatigue mgmt (Israetel s. 92): quad objem po těžkém squatu.' },
      { id: 'ghd', name: 'GHD Raise', category: 'core', targetSets: '3', targetReps: '6–8', note: 'BW+. Superset A1.', isSuperset: true, supersetWith: 'Pallof Press' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '2', targetReps: '10/strana', note: 'Střední. Superset A2.', isSuperset: true, supersetWith: 'GHD Raise' },
    ]),
    fridayRun(12, 'Easy run', '25 min', 'Zóna 2 (mini-deload – lehce)'),
    saturdayHiit(),
    fullBodyDay([
      { id: 'deadlift-ramp1', name: 'Deadlift – RAMP 1', nameShort: 'DL R1', category: 'main', targetSets: '1', targetReps: '4', targetWeight: '202.5 kg (90 %)', rpe: '7–8', note: 'Ramp.', setType: 'ramp' },
      { id: 'deadlift-ramp2', name: 'Deadlift – RAMP 2', nameShort: 'DL R2', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '210 kg (93 %)', rpe: '8', note: 'Ramp.', setType: 'ramp' },
      { id: 'deadlift-top', name: 'Deadlift – TOP SET', nameShort: 'DL TOP', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '215 kg (96 %)', rpe: '9', note: 'VRCHOLNÁ SÉRIE.', setType: 'topset' },
      { id: 'deadlift-bo', name: 'Deadlift – BACK-OFF', nameShort: 'DL BO', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '202.5 kg (90 %)', rpe: '8', note: 'Back-off ~93 %.', setType: 'backoff' },
      { id: 'pause-squat', name: 'Pause Squat (2s)', nameShort: 'Pause Squat', category: 'accessory', targetSets: '3', targetReps: '3', targetWeight: '112.5 kg', rpe: '8', note: 'Squat variace na deadlift den.' },
      { id: 'floor-press-db', name: 'Floor Press s jednoroučkami (DB)', nameShort: 'Floor Press DB', category: 'accessory', targetSets: '3', targetReps: '3', targetWeight: '30–35 kg/ruka', rpe: '7–8', note: 'Jednorubní floor press — čistá síla z hrudi.' },
      { id: 'barbell-row', name: 'Barbell Row', nameShort: 'BB Row', category: 'accessory', targetSets: '3', targetReps: '5', targetWeight: '90–107.5 kg', rpe: '7–8', note: 'Záda, lats.' },
      { id: 'ab-wheel-dl', name: 'Ab Wheel', nameShort: 'Core', category: 'core', targetSets: '2', targetReps: '10', note: 'BW. Břícho.' },
    ]),
  ],
};

// ============================================================
// FÁZE 4: PEAKING (W13–16) – 7.7.–3.8.2026
// Intenzita 90–100% 1RM | Metoda max. úsilí | Taper
// Zatsiorského dvou-faktorový model: únava odezní, fitness zůstane
// ============================================================

const w13: Week = {
  number: 13, label: 'W13 – Peaking', dateFrom: '2026-07-13', dateTo: '2026-07-19',
  phase: 'Fáze 4 – Peaking', phaseKey: 'phase4',
  description: 'W13: Vstup do peakingu. Singles na 87.5–94.5 % 1RM. SQ 157.5/165/170 kg, BP 105/110/112.5 kg, DL 200/207.5/212.5 kg. Minimální doplňkový objem.',
  days: [
    upperDay([
      { id: 'bench-set1', name: 'Bench Press – SET 1', nameShort: 'Bench S1', category: 'main', targetSets: '1', targetReps: '2', targetWeight: '105 kg (87.5 %)', rpe: '7–8', note: 'Rozc vičení.', setType: 'ramp' },
      { id: 'bench-set2', name: 'Bench Press – SET 2', nameShort: 'Bench S2', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '110 kg (91.5 %)', rpe: '8', note: 'Těžký singl.', setType: 'topset' },
      { id: 'bench-set3', name: 'Bench Press – SET 3', nameShort: 'Bench S3', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '112.5 kg (93.8 %)', rpe: '8–9', note: 'Finální singl.', setType: 'topset' },
      { id: 'spoto', name: 'Spoto Press (2–3 cm)', nameShort: 'Spoto Press', category: 'accessory', targetSets: '3', targetReps: '3', targetWeight: '97.5 kg', rpe: '8', note: 'Cílí start z prsu.' },
      { id: 'lat-pulldown', name: 'Lat Pulldown (stroj)', nameShort: 'Lat Pulldown', category: 'accessory', targetSets: '3', targetReps: '8', targetWeight: 'Těžká', rpe: '7–8', note: 'Lats.' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15', note: 'Lehká. Prehab.' },
    ]),
    tuesdayRest,
    wednesdayHiit(),
    lowerDay([
      { id: 'squat-set1', name: 'Back Squat – SET 1', nameShort: 'Squat S1', category: 'main', targetSets: '1', targetReps: '2', targetWeight: '157.5 kg (87.5 %)', rpe: '7–8', note: 'Rozc vičení na těžké váhy.', setType: 'ramp' },
      { id: 'squat-set2', name: 'Back Squat – SET 2', nameShort: 'Squat S2', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '165 kg (91.5 %)', rpe: '8', note: 'Těžký singl.', setType: 'topset' },
      { id: 'squat-set3', name: 'Back Squat – SET 3', nameShort: 'Squat S3', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '170 kg (94.5 %)', rpe: '8–9', note: 'Finální singl. Stop zde.', setType: 'topset' },
      { id: 'pause-squat', name: 'Pause Squat (2s)', nameShort: 'Pause Squat', category: 'accessory', targetSets: '3', targetReps: '3', targetWeight: '120 kg', rpe: '7–8', note: 'Technická práce.' },
      { id: 'leg-press', name: 'Leg Press (stroj)', nameShort: 'Leg Press', category: 'accessory', targetSets: '3', targetReps: '10', targetWeight: 'Těžká', rpe: '7–8', note: 'Objemová pojistka.' },
      { id: 'ghd', name: 'GHD Raise', category: 'core', targetSets: '3', targetReps: '8', note: 'BW. Hamstringy.' },
    ]),
    fridayRun(13, 'Easy run', '25 min', 'Zóna 2 (šetři energii)'),
    saturdayHiit(),
    fullBodyDay([
      { id: 'deadlift-set1', name: 'Deadlift – SET 1', nameShort: 'DL S1', category: 'main', targetSets: '1', targetReps: '2', targetWeight: '200 kg (88.9 %)', rpe: '7–8', note: 'Rozc vičení.', setType: 'ramp' },
      { id: 'deadlift-set2', name: 'Deadlift – SET 2', nameShort: 'DL S2', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '207.5 kg (92.2 %)', rpe: '8', note: 'Těžký singl.', setType: 'topset' },
      { id: 'deadlift-set3', name: 'Deadlift – SET 3', nameShort: 'DL S3', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '212.5 kg (94.4 %)', rpe: '8–9', note: 'Finální singl.', setType: 'topset' },
      { id: 'floor-press-db', name: 'Floor Press s jednoroučkami (DB)', nameShort: 'Floor Press DB', category: 'accessory', targetSets: '3', targetReps: '3', targetWeight: '30–35 kg/ruka', rpe: '7–8', note: 'Jednorubní floor press — čistá síla z hrudi.' },
      { id: 'barbell-row', name: 'Barbell Row', nameShort: 'BB Row', category: 'accessory', targetSets: '3', targetReps: '6', targetWeight: '90–100 kg', rpe: '7–8', note: 'Záda.' },
      { id: 'nordic-curls', name: 'Nordic Curls', category: 'prevention', targetSets: '3', targetReps: '5', note: 'BW. Prehab.' },
      { id: 'ab-wheel-dl', name: 'Ab Wheel', nameShort: 'Core', category: 'core', targetSets: '3', targetReps: '10', note: 'BW. Břícho.' },
    ]),
  ],
};

const w14: Week = {
  number: 14, label: 'W14 – Peaking', dateFrom: '2026-07-20', dateTo: '2026-07-26',
  phase: 'Fáze 4 – Peaking', phaseKey: 'phase4',
  description: 'W14: Near-max týden. SQ 177.5 kg (98.6 %), BP 117.5 kg (97.9 %), DL 222.5 kg (98.9 %). Progresivní singles. Metoda max. úsílí (Zatsiorsky s.81).',
  days: [
    upperDay([
      { id: 'bench-set1', name: 'Bench Press – SET 1', nameShort: 'Bench S1', category: 'main', targetSets: '1', targetReps: '2', targetWeight: '110 kg (91.7 %)', rpe: '7–8', note: 'Rozc vičení.', setType: 'ramp' },
      { id: 'bench-set2', name: 'Bench Press – SET 2', nameShort: 'Bench S2', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '115 kg (95.8 %)', rpe: '8', note: 'Těžký singl.', setType: 'topset' },
      { id: 'bench-set3', name: 'Bench Press – SET 3 / Near-max', nameShort: 'Bench NM', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '117.5 kg (97.9 %)', rpe: '8–9', note: 'Near-max singl. Plný setup!', setType: 'topset' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15', note: 'Lehká. Prehab.' },
    ]),
    tuesdayRest,
    wednesdayHiit(),
    lowerDay([
      { id: 'squat-set1', name: 'Back Squat – SET 1', nameShort: 'Squat S1', category: 'main', targetSets: '1', targetReps: '2', targetWeight: '157.5 kg (87.5 %)', rpe: '7–8', note: 'Rozc vičení na těžké váhy.', setType: 'ramp' },
      { id: 'squat-set2', name: 'Back Squat – SET 2', nameShort: 'Squat S2', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '170 kg (94.5 %)', rpe: '8', note: 'Těžký singl.', setType: 'topset' },
      { id: 'squat-set3', name: 'Back Squat – SET 3 / Near-max', nameShort: 'Squat NM', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '177.5 kg (98.6 %)', rpe: '8–9', note: 'Near-max singl. Pokud RPE 9.5+ → zastav!', setType: 'topset' },
      { id: 'pause-squat', name: 'Pause Squat (2s)', nameShort: 'Pause Squat', category: 'accessory', targetSets: '2', targetReps: '3', targetWeight: '122.5 kg', rpe: '7–8', note: 'Technická práce.' },
      { id: 'leg-press', name: 'Leg Press (stroj)', nameShort: 'Leg Press', category: 'accessory', targetSets: '2', targetReps: '8', targetWeight: 'Střední–těžká', rpe: '7–8', note: 'Objemová pojišťka.' },
      { id: 'ab-wheel-dl', name: 'Ab Wheel', nameShort: 'Core', category: 'core', targetSets: '2', targetReps: '10', note: 'BW. Břícho.' },
    ]),
    fridayRun(14, 'Easy run', '20 min', 'Zóna 1–2 (velmi lehce)'),
    saturdayHiit(),
    fullBodyDay([
      { id: 'deadlift-set1', name: 'Deadlift – SET 1', nameShort: 'DL S1', category: 'main', targetSets: '1', targetReps: '2', targetWeight: '210 kg (93.3 %)', rpe: '7–8', note: 'Rozc vičení.', setType: 'ramp' },
      { id: 'deadlift-set2', name: 'Deadlift – SET 2', nameShort: 'DL S2', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '217.5 kg (96.7 %)', rpe: '8', note: 'Těžký singl.', setType: 'topset' },
      { id: 'deadlift-set3', name: 'Deadlift – SET 3 / Near-max', nameShort: 'DL NM', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '222.5 kg (98.9 %)', rpe: '8–9', note: 'Near-max singl. Poslední těžký DL trénink!', setType: 'topset' },
      { id: 'barbell-row', name: 'Barbell Row', nameShort: 'BB Row', category: 'accessory', targetSets: '2', targetReps: '6', targetWeight: '95 kg', rpe: '7–8', note: 'Záda.' },
      { id: 'nordic-curls', name: 'Nordic Curls', category: 'prevention', targetSets: '2', targetReps: '5', note: 'BW. Prehab.' },
      { id: 'ab-wheel-dl', name: 'Ab Wheel', nameShort: 'Core', category: 'core', targetSets: '2', targetReps: '10', note: 'BW. Břícho.' },
    ]),
  ],
};

const w15: Week = {
  number: 15, label: 'W15 – TAPER', dateFrom: '2026-07-27', dateTo: '2026-08-02',
  phase: 'Fáze 4 – Taper', phaseKey: 'phase4', isDeload: true,
  description: 'TAPER. Drastické snížení objemu – Zatsiorského dvou-faktorový model: únava odezní, fitness zůstane → supercompensace. Žádný běh (Viada). Spánek 8–9 h.',
  days: [
    upperDay([
      { id: 'bench', name: 'Bench Press – RAMP', nameShort: 'Bench RAMP', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '87.5 kg', rpe: '6', note: 'Lehká příprava.', setType: 'ramp' },
      { id: 'bench-top', name: 'Bench Press – OPENER', nameShort: 'Bench OPENER', category: 'main', targetSets: '2', targetReps: '2', targetWeight: '97.5 kg', rpe: '6–7', note: 'Opener váha.', setType: 'topset' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '2', targetReps: '15', note: 'Lehká. Prehab.' },
    ]),
    tuesdayRest,
    wednesdayHiit(),
    { key: 'thursday', label: 'Čtvrtek', labelShort: 'Čt', type: 'rest', description: 'VOLNO – Žádný běh (Viada). Energie do peakingu.', exercises: [] },
    saturdayHiit(),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift – RAMP', nameShort: 'DL RAMP', category: 'main', targetSets: '2', targetReps: '2', targetWeight: '157.5 kg', rpe: '6', note: 'Lehká příprava.', setType: 'ramp' },
      { id: 'deadlift-top', name: 'Deadlift – OPENER', nameShort: 'DL OPENER', category: 'main', targetSets: '2', targetReps: '1', targetWeight: '185 kg', rpe: '6–7', note: 'Opener váha.', setType: 'topset' },
    ]),
  ],
};

const w16: Week = {
  number: 16, label: 'W16 – TEST MAXIM', dateFrom: '2026-08-03', dateTo: '2026-08-09',
  phase: 'Fáze 4 – Test maxim', phaseKey: 'phase4',
  description: 'TESTOVACÍ TÝDEN. Po: Squat max (cíl 190 kg). St: Bench max (cíl 130 kg). Pá: Deadlift max (cíl 235 kg). Warm-up dle Zatsiorského: tyč→30%→50%→65%→78%→87%→opener→second→MAX. Min. 3 min pauza mezi pokusy.',
  days: [
    tuesdayRest,
    {
      key: 'wednesday', label: 'Středa', labelShort: 'St', type: 'upper',
      description: 'BENCH PRESS MAX TEST – Horschig aktivace → progresivní série dle Zatsiorského.',
      warmup: 'Scapular push-ups 2×10 + band pull-aparts 2×15 → tyč→30%→50%→68%→80%→88%→opener→second→MAX',
      exercises: [
        { id: 'bench', name: 'Bench Press – WARM-UP 1', nameShort: 'Bench WU1', category: 'main', targetSets: '1', targetReps: '10', targetWeight: '35 kg', rpe: '–', note: '~30% – Rozehřátí ramen.', setType: 'ramp' },
        { id: 'bench-wu2', name: 'Bench Press – WARM-UP 2', nameShort: 'Bench WU2', category: 'main', targetSets: '1', targetReps: '5', targetWeight: '60 kg', rpe: '–', note: '~50% – Aktivace.', setType: 'ramp' },
        { id: 'bench-wu3', name: 'Bench Press – WARM-UP 3', nameShort: 'Bench WU3', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '82.5 kg', rpe: '–', note: '~68% – Setup drill.', setType: 'ramp' },
        { id: 'bench-wu4', name: 'Bench Press – WARM-UP 4', nameShort: 'Bench WU4', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '95 kg', rpe: '–', note: '~80% – CNS.', setType: 'ramp' },
        { id: 'bench-wu5', name: 'Bench Press – WARM-UP 5', nameShort: 'Bench WU5', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '105 kg', rpe: '–', note: '~88% – Poslední single.', setType: 'ramp' },
        { id: 'bench-top', name: 'Bench Press – OPENER', nameShort: 'Bench OPENER', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '107.5 kg', rpe: '~7', note: 'Jistota. ~90%.', setType: 'topset' },
        { id: 'bench-2nd', name: 'Bench Press – 2. POKUS', nameShort: 'Bench 2nd', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '120 kg', rpe: '~8.5', note: '~95%. Pokud letí → max.', setType: 'topset' },
        { id: 'bench-max', name: 'Bench Press – MAX', nameShort: 'Bench MAX', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '130 kg', rpe: 'MAX', note: '🎯 CÍL: 130 kg! Pokud 2. pokus těžký → 127.5 kg.', setType: 'topset' },
      ],
    },
    { key: 'thursday', label: 'Čtvrtek', labelShort: 'Čt', type: 'rest', description: 'VOLNO – Regenerace před deadliftem.', exercises: [] },
    {
      key: 'friday', label: 'Pátek', labelShort: 'Pá', type: 'fullbody',
      description: 'DEADLIFT MAX TEST – Horschig aktivace → progresivní série dle Zatsiorského.',
      warmup: 'Glute bridges 2×10 + band walks 2×12 → tyč→25%→45%→60%→75%→85%→opener→second→MAX',
      exercises: [
        { id: 'deadlift', name: 'Deadlift – WARM-UP 1', nameShort: 'DL WU1', category: 'main', targetSets: '1', targetReps: '8', targetWeight: '55 kg', rpe: '–', note: '~25% – Rozehřátí.', setType: 'ramp' },
        { id: 'deadlift-wu2', name: 'Deadlift – WARM-UP 2', nameShort: 'DL WU2', category: 'main', targetSets: '1', targetReps: '5', targetWeight: '100 kg', rpe: '–', note: '~45% – Aktivace.', setType: 'ramp' },
        { id: 'deadlift-wu3', name: 'Deadlift – WARM-UP 3', nameShort: 'DL WU3', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '135 kg', rpe: '–', note: '~60% – Groove.', setType: 'ramp' },
        { id: 'deadlift-wu4', name: 'Deadlift – WARM-UP 4', nameShort: 'DL WU4', category: 'main', targetSets: '1', targetReps: '2', targetWeight: '170 kg', rpe: '–', note: '~75% – CNS.', setType: 'ramp' },
        { id: 'deadlift-wu5', name: 'Deadlift – WARM-UP 5', nameShort: 'DL WU5', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '190 kg', rpe: '–', note: '~85% – Poslední single.', setType: 'ramp' },
        { id: 'deadlift-top', name: 'Deadlift – OPENER', nameShort: 'DL OPENER', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '202.5 kg', rpe: '~7', note: 'Jistota. ~90%.', setType: 'topset' },
        { id: 'deadlift-2nd', name: 'Deadlift – 2. POKUS', nameShort: 'DL 2nd', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '217.5 kg', rpe: '~8.5', note: '~95%. Pokud hladký → max.', setType: 'topset' },
        { id: 'deadlift-max', name: 'Deadlift – MAX', nameShort: 'DL MAX', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '235 kg', rpe: 'MAX', note: '🎯 CÍL: 235 kg! Pokud 2. pokus těžký → 232.5 kg.', setType: 'topset' },
      ],
    },
    saturdayHiit(),
  ],
};

// ============================================================
// FULL PLAN EXPORT
// ============================================================
// LEGACY (starý 16týdenní v4 plán) – ponecháno POUZE pro odvození historie W1–W14 v recoveryData.ts
export const LEGACY_PLAN_WEEKS: Week[] = [w1, w2, w3, w4, w5, w6, w7, w8, w9, w10, w11, w12, w13, w14, w15, w16];

// ============================================================

// NOVÝ PLÁN – PODZIM 2026 (v5.2) | 13 týdnů | Po dřep · Út bench · Pá mrtvý tah

// Split: Po Lower(dřep) · Út Upper(bench) · St HIIT · Čt Volno · Pá Deadlift · So HIIT · Ne Volno(± běh)

// ============================================================

function npStrength(dm: [string,string,string,'lower'|'upper'|'fullbody',string], exercises: Exercise[]): WorkoutDay {
  return { key: dm[0], label: dm[1], labelShort: dm[2], type: dm[3], description: dm[4], warmup: WARMUP_PROTOCOL, exercises };
}
const NP_MON: [string,string,string,'lower'|'upper'|'fullbody',string] = ['monday','Pondělí','Po','lower','DŘEP – nohy, silový důraz. Dřep vlnou + sekundární dřep + rotující leg cvik + core. Fresh nohy (2 dny po So HIIT).'];
const NP_TUE: [string,string,string,'lower'|'upper'|'fullbody',string] = ['tuesday','Úterý','Út','upper','BENCH – tlak. Bench vlnou + variace na prsa + triceps (bez dipů) + pull-up (biceps) + biceps + core.'];
const NP_FRI: [string,string,string,'lower'|'upper'|'fullbody',string] = ['friday','Pátek','Pá','fullbody','MRTVÝ TAH – tah/posterior. Tah vlnou + veslování + pull-up (záda) + biceps + hamstringy + core. Fresh (2 dny po St HIIT).'];
const npWedHiit = (): WorkoutDay => ({ key: 'wednesday', label: 'Středa', labelShort: 'St', type: 'hiit', description: 'HIIT – skupinová lekce (běh). Pevná lekce. 2 dny před tahem.', exercises: [{ id: 'hiit-wed', name: 'HIIT – Skupinová lekce', nameShort: 'HIIT', category: 'run', targetSets: '1', targetReps: '~45–60 min', note: 'Po: rychlé sacharidy okamžitě (AMPK/mTOR interference).' }] });
const npSatHiit = (): WorkoutDay => ({ key: 'saturday', label: 'Sobota', labelShort: 'So', type: 'hiit', description: 'HIIT – skupinová lekce (běh). Pevná lekce. Den po tahu (HIIT po síle = OK).', exercises: [{ id: 'hiit-sat', name: 'HIIT – Skupinová lekce', nameShort: 'HIIT', category: 'run', targetSets: '1', targetReps: '~45–60 min', note: 'Regenerace zadního řetězce.' }] });
const npThuRest = (): WorkoutDay => ({ key: 'thursday', label: 'Čtvrtek', labelShort: 'Čt', type: 'rest', description: 'VOLNO – plná regenerace. Spánek, výživa, mobilita. Nohy + CNS se čistí před tahem.', exercises: [] });
const npSunRest = (): WorkoutDay => ({ key: 'sunday', label: 'Neděle', labelShort: 'Ne', type: 'rest', description: 'VOLNO (± volitelný lehký běh Z2 ≤5 km). Jinak odpočinek.', exercises: [] });

const np1: Week = {
  number: 1, label: 'W1 – Akumulace', dateFrom: '2026-08-18', dateTo: '2026-08-24',
  phase: 'Blok A — Akumulace', phaseKey: 'phase1',
  description: 'Reacklimatizace, znovunastavení vah po restartu. Objem 8/6 op., jedna těžká overload expozice.',
  days: [
    npStrength(NP_MON, [
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', setPlan: [{ label: 'Objemová', weight: '145', reps: '8', rpe: '7-8' }, { label: 'OVERLOAD', weight: '162.5', reps: '3', rpe: '8' }, { label: 'Back-off', weight: '152.5', reps: '6', rpe: '7-8' }, { label: 'Back-off', weight: '152.5', reps: '6', rpe: '7-8' }], targetSets: '4', targetReps: '8/3/6/6', targetWeight: '145/162.5/152.5/152.5 kg', rpe: '7-8', note: 'Vlna (zapiš top/overload sérii): Objemová 145×8 → OVERLOAD 162.5×3 → Back-off 152.5×6 → Back-off 152.5×6' },
      { id: 'pause-squat', name: 'Pauzový dřep (2 s) — variace (na díru (2 s pauza dole))', category: 'accessory', targetSets: '3', targetReps: '5', targetWeight: '132.5', note: 'Tvá 5.–7. „hlavní“ série na dřep. Sticking point.' },
      { id: 'bulgarian', name: 'Bulharský dřep (činky)', category: 'accessory', targetSets: '3', targetReps: '8–10/nohu', targetWeight: '2× činka střední', note: 'unilaterální quad + hýždě. Rotuje po blocích. Nízký–střední objem – nohy šetříme; když je readiness nízký, tenhle slot ubereš první.' },
      { id: 'ab-wheel', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Břicho.' },
      { id: 'pallof', name: 'Pallof press (anti-rotace)', category: 'core', targetSets: '2', targetReps: '10/str.', targetWeight: 'lehká', note: 'Core stabilita, nízká únava.' },
    ]),
    npStrength(NP_TUE, [
      { id: 'bench', name: 'Bench Press (Comp.)', nameShort: 'Bench Press', category: 'main', setPlan: [{ label: 'Objemová', weight: '100', reps: '8', rpe: '7-8' }, { label: 'OVERLOAD', weight: '112.5', reps: '3', rpe: '8' }, { label: 'Back-off', weight: '105', reps: '6', rpe: '7-8' }, { label: 'Back-off', weight: '105', reps: '6', rpe: '7-8' }], targetSets: '4', targetReps: '8/3/6/6', targetWeight: '100/112.5/105/105 kg', rpe: '7-8', note: 'Vlna (zapiš top/overload sérii): Objemová 100×8 → OVERLOAD 112.5×3 → Back-off 105×6 → Back-off 105×6' },
      { id: 'spoto', name: 'Spoto press (2–3 cm nad hrudí) — variace na start z prsu', category: 'accessory', targetSets: '3', targetReps: '6', targetWeight: '100', note: 'Cílí slabinu (tlak z prsu). Bez odrazu. Rotuje po blocích.' },
      { id: 'triceps-pushdown', name: 'Triceps pushdown (kladka)', category: 'isolation', targetSets: '3', targetReps: '10–12', targetWeight: 'střední', note: 'Náhrada dipů – loketní izolace, šetří ramena. Rotuje po blocích.' },
      { id: 'pullup', name: 'Weighted pull-up (podhmat úzko – BICEPS)', category: 'accessory', targetSets: '3', targetReps: '8', note: 'Tvůj pull-up #1 – biceps varianta. Každý push den. Úchop rotuje.' },
      { id: 'bicep-curl', name: 'Bicepsový zdvih (jednoručky (supinace))', category: 'isolation', targetSets: '3', targetReps: '10–12', targetWeight: 'střední', note: 'Biceps. Varianta rotuje.' },
      { id: 'face-pulls', name: 'Face pull (jen objemový týden)', category: 'prevention', targetSets: '3', targetReps: '15–20', targetWeight: 'lehká', note: 'Zdraví ramen – nahrazuje objem, co dřív dělaly dipy.' },
      { id: 'ab-wheel', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Břicho.' },
    ]),
    npWedHiit(),
    npThuRest(),
    npStrength(NP_FRI, [
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Deadlift', category: 'main', setPlan: [{ label: 'Objemová', weight: '180', reps: '8', rpe: '7-8' }, { label: 'OVERLOAD', weight: '202.5', reps: '3', rpe: '8' }, { label: 'Back-off', weight: '190', reps: '6', rpe: '7-8' }], targetSets: '3', targetReps: '8/3/6', targetWeight: '180/202.5/190 kg', rpe: '7-8', note: 'Vlna (zapiš top/overload sérii): Objemová 180×8 → OVERLOAD 202.5×3 → Back-off 190×6' },
      { id: 'barbell-row', name: 'Barbell row (v předklonu) — silná záda = silný tah', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: '82.5', note: 'Hlavní stavitel zad. Rotuje po blocích, střídá síla/objem.' },
      { id: 'pullup-back', name: 'Weighted pull-up (nadhmat široko – ZÁDA)', category: 'accessory', targetSets: '3', targetReps: '8', note: 'Tvůj pull-up #2 – zádová varianta. Každý pull den. Úchop rotuje.' },
      { id: 'bicep-curl-2', name: 'Bicepsový zdvih (kladívkový (hammer)) — 2. expozice', category: 'isolation', targetSets: '3', targetReps: '8–10', targetWeight: 'střední', note: 'Biceps podruhé v týdnu. Varianta rotuje.' },
      { id: 'ab-wheel-dl', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Břicho.' },
    ]),
    npSatHiit(),
    npSunRest(),
  ],
};

const np2: Week = {
  number: 2, label: 'W2 – Akumulace', dateFrom: '2026-08-25', dateTo: '2026-08-31',
  phase: 'Blok A — Akumulace', phaseKey: 'phase1',
  description: 'Double progression – přidat opakování/váhu. Overload dvojka.',
  days: [
    npStrength(NP_MON, [
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', setPlan: [{ label: 'Objemová', weight: '147.5', reps: '8', rpe: '8' }, { label: 'OVERLOAD', weight: '167.5', reps: '2', rpe: '8' }, { label: 'Back-off', weight: '152.5', reps: '6', rpe: '8' }, { label: 'Back-off', weight: '152.5', reps: '5', rpe: '8' }], targetSets: '4', targetReps: '8/2/6/5', targetWeight: '147.5/167.5/152.5/152.5 kg', rpe: '8', note: 'Vlna (zapiš top/overload sérii): Objemová 147.5×8 → OVERLOAD 167.5×2 → Back-off 152.5×6 → Back-off 152.5×5' },
      { id: 'pause-squat', name: 'Pauzový dřep (2 s) — variace (na díru (2 s pauza dole))', category: 'accessory', targetSets: '3', targetReps: '5', targetWeight: '132.5', note: 'Tvá 5.–7. „hlavní“ série na dřep. Sticking point.' },
      { id: 'bulgarian', name: 'Bulharský dřep (činky)', category: 'accessory', targetSets: '3', targetReps: '8–10/nohu', targetWeight: '2× činka střední', note: 'unilaterální quad + hýždě. Rotuje po blocích. Nízký–střední objem – nohy šetříme; když je readiness nízký, tenhle slot ubereš první.' },
      { id: 'ab-wheel', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Břicho.' },
      { id: 'pallof', name: 'Pallof press (anti-rotace)', category: 'core', targetSets: '2', targetReps: '10/str.', targetWeight: 'lehká', note: 'Core stabilita, nízká únava.' },
    ]),
    npStrength(NP_TUE, [
      { id: 'bench', name: 'Bench Press (Comp.)', nameShort: 'Bench Press', category: 'main', setPlan: [{ label: 'Objemová', weight: '102.5', reps: '8', rpe: '8' }, { label: 'OVERLOAD', weight: '115', reps: '2', rpe: '8' }, { label: 'Back-off', weight: '107.5', reps: '6', rpe: '8' }, { label: 'Back-off', weight: '107.5', reps: '5', rpe: '8' }], targetSets: '4', targetReps: '8/2/6/5', targetWeight: '102.5/115/107.5/107.5 kg', rpe: '8', note: 'Vlna (zapiš top/overload sérii): Objemová 102.5×8 → OVERLOAD 115×2 → Back-off 107.5×6 → Back-off 107.5×5' },
      { id: 'spoto', name: 'Spoto press (2–3 cm nad hrudí) — variace na start z prsu', category: 'accessory', targetSets: '3', targetReps: '6', targetWeight: '100', note: 'Cílí slabinu (tlak z prsu). Bez odrazu. Rotuje po blocích.' },
      { id: 'triceps-pushdown', name: 'Triceps pushdown (kladka)', category: 'isolation', targetSets: '3', targetReps: '10–12', targetWeight: 'střední', note: 'Náhrada dipů – loketní izolace, šetří ramena. Rotuje po blocích.' },
      { id: 'pullup', name: 'Weighted pull-up (podhmat úzko – BICEPS)', category: 'accessory', targetSets: '3', targetReps: '8', note: 'Tvůj pull-up #1 – biceps varianta. Každý push den. Úchop rotuje.' },
      { id: 'bicep-curl', name: 'Bicepsový zdvih (jednoručky (supinace))', category: 'isolation', targetSets: '3', targetReps: '10–12', targetWeight: 'střední', note: 'Biceps. Varianta rotuje.' },
      { id: 'face-pulls', name: 'Face pull (jen objemový týden)', category: 'prevention', targetSets: '3', targetReps: '15–20', targetWeight: 'lehká', note: 'Zdraví ramen – nahrazuje objem, co dřív dělaly dipy.' },
      { id: 'ab-wheel', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Břicho.' },
    ]),
    npWedHiit(),
    npThuRest(),
    npStrength(NP_FRI, [
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Deadlift', category: 'main', setPlan: [{ label: 'Objemová', weight: '185', reps: '8', rpe: '8' }, { label: 'OVERLOAD', weight: '207.5', reps: '2', rpe: '8' }, { label: 'Back-off', weight: '195', reps: '6', rpe: '8' }], targetSets: '3', targetReps: '8/2/6', targetWeight: '185/207.5/195 kg', rpe: '8', note: 'Vlna (zapiš top/overload sérii): Objemová 185×8 → OVERLOAD 207.5×2 → Back-off 195×6' },
      { id: 'barbell-row', name: 'Barbell row (v předklonu) — silná záda = silný tah', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: '82.5', note: 'Hlavní stavitel zad. Rotuje po blocích, střídá síla/objem.' },
      { id: 'pullup-back', name: 'Weighted pull-up (nadhmat široko – ZÁDA)', category: 'accessory', targetSets: '3', targetReps: '8', note: 'Tvůj pull-up #2 – zádová varianta. Každý pull den. Úchop rotuje.' },
      { id: 'bicep-curl-2', name: 'Bicepsový zdvih (kladívkový (hammer)) — 2. expozice', category: 'isolation', targetSets: '3', targetReps: '8–10', targetWeight: 'střední', note: 'Biceps podruhé v týdnu. Varianta rotuje.' },
      { id: 'ab-wheel-dl', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Břicho.' },
    ]),
    npSatHiit(),
    npSunRest(),
  ],
};

const np3: Week = {
  number: 3, label: 'W3 – Akumulace', dateFrom: '2026-09-01', dateTo: '2026-09-07',
  phase: 'Blok A — Akumulace', phaseKey: 'phase1',
  description: 'Vrchol akumulace (tvůj oblíbený „týden 3“ styl). Nejvyšší objem bloku.',
  days: [
    npStrength(NP_MON, [
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', setPlan: [{ label: 'Objemová', weight: '152.5', reps: '6', rpe: '8' }, { label: 'OVERLOAD', weight: '170', reps: '2', rpe: '8-9' }, { label: 'Back-off', weight: '155', reps: '6', rpe: '8' }, { label: 'Back-off', weight: '155', reps: '5', rpe: '8' }], targetSets: '4', targetReps: '6/2/6/5', targetWeight: '152.5/170/155/155 kg', rpe: '8', note: 'Vlna (zapiš top/overload sérii): Objemová 152.5×6 → OVERLOAD 170×2 → Back-off 155×6 → Back-off 155×5' },
      { id: 'pause-squat', name: 'Pauzový dřep (2 s) — variace (na díru (2 s pauza dole))', category: 'accessory', targetSets: '3', targetReps: '3', targetWeight: '145', note: 'Tvá 5.–7. „hlavní“ série na dřep. Sticking point.' },
      { id: 'bulgarian', name: 'Bulharský dřep (činky)', category: 'accessory', targetSets: '3', targetReps: '6/nohu', targetWeight: '2× činka střední', note: 'unilaterální quad + hýždě. Rotuje po blocích. Nízký–střední objem – nohy šetříme; když je readiness nízký, tenhle slot ubereš první.' },
      { id: 'ab-wheel', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Břicho.' },
      { id: 'pallof', name: 'Pallof press (anti-rotace)', category: 'core', targetSets: '2', targetReps: '10/str.', targetWeight: 'lehká', note: 'Core stabilita, nízká únava.' },
    ]),
    npStrength(NP_TUE, [
      { id: 'bench', name: 'Bench Press (Comp.)', nameShort: 'Bench Press', category: 'main', setPlan: [{ label: 'Objemová', weight: '105', reps: '6', rpe: '8' }, { label: 'OVERLOAD', weight: '117.5', reps: '2', rpe: '8-9' }, { label: 'Back-off', weight: '110', reps: '6', rpe: '8' }, { label: 'Back-off', weight: '110', reps: '5', rpe: '8' }], targetSets: '4', targetReps: '6/2/6/5', targetWeight: '105/117.5/110/110 kg', rpe: '8', note: 'Vlna (zapiš top/overload sérii): Objemová 105×6 → OVERLOAD 117.5×2 → Back-off 110×6 → Back-off 110×5' },
      { id: 'paused-bench', name: 'Pauzový bench (2 s) — variace na start z prsu', category: 'accessory', targetSets: '3', targetReps: '4', targetWeight: '105', note: 'Cílí slabinu (tlak z prsu). Bez odrazu. Rotuje po blocích.' },
      { id: 'triceps-pushdown', name: 'Triceps pushdown (kladka)', category: 'isolation', targetSets: '3', targetReps: '8–10', targetWeight: 'střední', note: 'Náhrada dipů – loketní izolace, šetří ramena. Rotuje po blocích.' },
      { id: 'pullup', name: 'Weighted pull-up (podhmat úzko – BICEPS)', category: 'accessory', targetSets: '3', targetReps: '5', targetWeight: '+5–10 kg', note: 'Tvůj pull-up #1 – biceps varianta. Každý push den. Úchop rotuje.' },
      { id: 'bicep-curl', name: 'Bicepsový zdvih (jednoručky (supinace))', category: 'isolation', targetSets: '3', targetReps: '6–8', targetWeight: 'střední', note: 'Biceps. Varianta rotuje.' },
      { id: 'ab-wheel', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Břicho.' },
    ]),
    npWedHiit(),
    npThuRest(),
    npStrength(NP_FRI, [
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Deadlift', category: 'main', setPlan: [{ label: 'Objemová', weight: '187.5', reps: '6', rpe: '8' }, { label: 'OVERLOAD', weight: '212.5', reps: '2', rpe: '8-9' }, { label: 'Back-off', weight: '197.5', reps: '6', rpe: '8' }], targetSets: '3', targetReps: '6/2/6', targetWeight: '187.5/212.5/197.5 kg', rpe: '8', note: 'Vlna (zapiš top/overload sérii): Objemová 187.5×6 → OVERLOAD 212.5×2 → Back-off 197.5×6' },
      { id: 'barbell-row', name: 'Barbell row (v předklonu) — silná záda = silný tah', category: 'accessory', targetSets: '4', targetReps: '5', targetWeight: '97.5', note: 'Hlavní stavitel zad. Rotuje po blocích, střídá síla/objem.' },
      { id: 'pullup-back', name: 'Weighted pull-up (nadhmat široko – ZÁDA)', category: 'accessory', targetSets: '3', targetReps: '5', targetWeight: '+5–10 kg', note: 'Tvůj pull-up #2 – zádová varianta. Každý pull den. Úchop rotuje.' },
      { id: 'bicep-curl-2', name: 'Bicepsový zdvih (kladívkový (hammer)) — 2. expozice', category: 'isolation', targetSets: '3', targetReps: '8–10', targetWeight: 'střední', note: 'Biceps podruhé v týdnu. Varianta rotuje.' },
      { id: 'nordic-curls', name: 'Nordic curl (jen silový týden)', category: 'prevention', targetSets: '3', targetReps: '4–6', note: 'Prevence hamstringů, rotuje. V objemovém týdnu vynech – nohy fried před sobotním HIIT.' },
      { id: 'ab-wheel-dl', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Břicho.' },
    ]),
    npSatHiit(),
    npSunRest(),
  ],
};

const np4: Week = {
  number: 4, label: 'W4 – Deload', dateFrom: '2026-09-08', dateTo: '2026-09-14',
  phase: 'Deload', phaseKey: 'deload', isDeload: true,
  description: 'Deload −40 % objemu. Aktivní regenerace, technika. HRV/readiness zpět nahoru.',
  days: [
    npStrength(NP_MON, [
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', setPlan: [{ label: 'Deload', weight: '130', reps: '5', rpe: '6' }, { label: 'Deload', weight: '130', reps: '5', rpe: '6' }, { label: 'Deload', weight: '132.5', reps: '5', rpe: '6-7' }], targetSets: '3', targetReps: '5/5/5', targetWeight: '130/130/132.5 kg', rpe: '6', note: 'Vlna (zapiš top/overload sérii): Deload 130×5 → Deload 130×5 → Deload 132.5×5' },
      { id: 'pause-squat', name: 'Pauzový dřep (2 s)', category: 'accessory', targetSets: '2', targetReps: '5', targetWeight: '115', note: 'Lehce, technika v díře.' },
      { id: 'ab-wheel', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '2', targetReps: '10', note: 'Břicho – každý trénink.' },
    ]),
    npStrength(NP_TUE, [
      { id: 'bench', name: 'Bench Press (Comp.)', nameShort: 'Bench Press', category: 'main', setPlan: [{ label: 'Deload', weight: '90', reps: '5', rpe: '6' }, { label: 'Deload', weight: '90', reps: '5', rpe: '6' }, { label: 'Deload', weight: '92.5', reps: '5', rpe: '6-7' }], targetSets: '3', targetReps: '5/5/5', targetWeight: '90/90/92.5 kg', rpe: '6', note: 'Vlna (zapiš top/overload sérii): Deload 90×5 → Deload 90×5 → Deload 92.5×5' },
      { id: 'pullup', name: 'Weighted pull-up (podhmat úzko – biceps)', category: 'accessory', targetSets: '2', targetReps: '6', note: 'Lehce.' },
      { id: 'face-pulls', name: 'Face pulls', category: 'prevention', targetSets: '3', targetReps: '15', targetWeight: 'lehká', note: 'Prehab ramen.' },
      { id: 'ab-wheel', name: 'Ab wheel', category: 'core', targetSets: '2', targetReps: '10', note: 'Břicho.' },
    ]),
    npWedHiit(),
    npThuRest(),
    npStrength(NP_FRI, [
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Deadlift', category: 'main', setPlan: [{ label: 'Deload', weight: '160', reps: '5', rpe: '6' }, { label: 'Deload', weight: '160', reps: '5', rpe: '6' }, { label: 'Deload', weight: '165', reps: '5', rpe: '6-7' }], targetSets: '3', targetReps: '5/5/5', targetWeight: '160/160/165 kg', rpe: '6', note: 'Vlna (zapiš top/overload sérii): Deload 160×5 → Deload 160×5 → Deload 165×5' },
      { id: 'barbell-row', name: 'Barbell row (v předklonu)', category: 'accessory', targetSets: '2', targetReps: '8', targetWeight: '72.5', note: 'Lehce, záda.' },
      { id: 'pullup-back', name: 'Weighted pull-up (nadhmat široko – záda)', category: 'accessory', targetSets: '2', targetReps: '6', note: 'Lehce.' },
      { id: 'ab-wheel-dl', name: 'Ab wheel', category: 'core', targetSets: '2', targetReps: '10', note: 'Břicho.' },
    ]),
    npSatHiit(),
    npSunRest(),
  ],
};

const np5: Week = {
  number: 5, label: 'W5 – Síla', dateFrom: '2026-09-15', dateTo: '2026-09-21',
  phase: 'Blok B — Síla', phaseKey: 'phase2',
  description: 'Vstup do síly. Zavádíme pětky/trojky. Ramp → top → overload → back-off.',
  days: [
    npStrength(NP_MON, [
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', setPlan: [{ label: 'TOP', weight: '157.5', reps: '5', rpe: '8' }, { label: 'OVERLOAD', weight: '165', reps: '3', rpe: '8-9' }, { label: 'Back-off', weight: '152.5', reps: '5', rpe: '8' }, { label: 'Back-off', weight: '152.5', reps: '5', rpe: '8' }], targetSets: '4', targetReps: '5/3/5/5', targetWeight: '157.5/165/152.5/152.5 kg', rpe: '8', note: 'Vlna (zapiš top/overload sérii): TOP 157.5×5 → OVERLOAD 165×3 → Back-off 152.5×5 → Back-off 152.5×5' },
      { id: 'pin-squat', name: 'Pin dřep (z kolíků) — variace (z mrtvého bodu)', category: 'accessory', targetSets: '3', targetReps: '3', targetWeight: '145', note: 'Tvá 5.–7. „hlavní“ série na dřep. Sticking point.' },
      { id: 'walking-lunges', name: 'Chodící výpady (činky)', category: 'accessory', targetSets: '3', targetReps: '8/nohu', targetWeight: '2× činka lehká–stř.', note: 'unilaterální, quad + hýždě, mobilita kyčle. Rotuje po blocích. Nízký–střední objem – nohy šetříme; když je readiness nízký, tenhle slot ubereš první.' },
      { id: 'ab-wheel', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Břicho.' },
      { id: 'pallof', name: 'Pallof press (anti-rotace)', category: 'core', targetSets: '2', targetReps: '10/str.', targetWeight: 'lehká', note: 'Core stabilita, nízká únava.' },
    ]),
    npStrength(NP_TUE, [
      { id: 'bench', name: 'Bench Press (Comp.)', nameShort: 'Bench Press', category: 'main', setPlan: [{ label: 'TOP', weight: '107.5', reps: '5', rpe: '8' }, { label: 'OVERLOAD', weight: '112.5', reps: '3', rpe: '8-9' }, { label: 'Back-off', weight: '105', reps: '5', rpe: '8' }, { label: 'Back-off', weight: '105', reps: '5', rpe: '8' }], targetSets: '4', targetReps: '5/3/5/5', targetWeight: '107.5/112.5/105/105 kg', rpe: '8', note: 'Vlna (zapiš top/overload sérii): TOP 107.5×5 → OVERLOAD 112.5×3 → Back-off 105×5 → Back-off 105×5' },
      { id: 'long-pause-bench', name: 'Dlouhý pauzový bench (3 s) — variace na start z prsu', category: 'accessory', targetSets: '3', targetReps: '4', targetWeight: '102.5', note: 'Cílí slabinu (tlak z prsu). Bez odrazu. Rotuje po blocích.' },
      { id: 'triceps-overhead', name: 'Overhead extension s lanem', category: 'isolation', targetSets: '3', targetReps: '8–10', targetWeight: 'střední', note: 'Náhrada dipů – protažený triceps, šetří ramena. Rotuje po blocích.' },
      { id: 'pullup', name: 'Weighted pull-up (neutrální úchop – BICEPS)', category: 'accessory', targetSets: '3', targetReps: '5', targetWeight: '+5–10 kg', note: 'Tvůj pull-up #1 – biceps varianta. Každý push den. Úchop rotuje.' },
      { id: 'bicep-curl', name: 'Bicepsový zdvih (na šikmé lavici)', category: 'isolation', targetSets: '3', targetReps: '6–8', targetWeight: 'střední', note: 'Biceps. Varianta rotuje.' },
      { id: 'ab-wheel', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Břicho.' },
    ]),
    npWedHiit(),
    npThuRest(),
    npStrength(NP_FRI, [
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Deadlift', category: 'main', setPlan: [{ label: 'TOP', weight: '195', reps: '5', rpe: '8' }, { label: 'OVERLOAD', weight: '205', reps: '3', rpe: '8-9' }, { label: 'Back-off', weight: '187.5', reps: '5', rpe: '8' }], targetSets: '3', targetReps: '5/3/5', targetWeight: '195/205/187.5 kg', rpe: '8', note: 'Vlna (zapiš top/overload sérii): TOP 195×5 → OVERLOAD 205×3 → Back-off 187.5×5' },
      { id: 'chest-supported-row', name: 'Chest-supported row (na lavici/stroji) — silná záda = silný tah', category: 'accessory', targetSets: '4', targetReps: '5', targetWeight: 'stroj těžká', note: 'Hlavní stavitel zad. Rotuje po blocích, střídá síla/objem.' },
      { id: 'pullup-back', name: 'Weighted pull-up (nadhmat střední – ZÁDA)', category: 'accessory', targetSets: '3', targetReps: '5', targetWeight: '+5–10 kg', note: 'Tvůj pull-up #2 – zádová varianta. Každý pull den. Úchop rotuje.' },
      { id: 'bicep-curl-2', name: 'Bicepsový zdvih (jednoručky) — 2. expozice', category: 'isolation', targetSets: '3', targetReps: '8–10', targetWeight: 'střední', note: 'Biceps podruhé v týdnu. Varianta rotuje.' },
      { id: 'ghd', name: 'GHD raise (jen silový týden)', category: 'prevention', targetSets: '3', targetReps: '4–6', note: 'Prevence hamstringů, rotuje. V objemovém týdnu vynech – nohy fried před sobotním HIIT.' },
      { id: 'ab-wheel-dl', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Břicho.' },
    ]),
    npSatHiit(),
    npSunRest(),
  ],
};

const np6: Week = {
  number: 6, label: 'W6 – Síla', dateFrom: '2026-09-22', dateTo: '2026-09-28',
  phase: 'Blok B — Síla', phaseKey: 'phase2',
  description: 'Progrese, čtyřky na top setu. Objem doplňků nahoru (objemový týden).',
  days: [
    npStrength(NP_MON, [
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', setPlan: [{ label: 'TOP', weight: '160', reps: '4', rpe: '8' }, { label: 'OVERLOAD', weight: '167.5', reps: '2', rpe: '9' }, { label: 'Back-off', weight: '155', reps: '5', rpe: '8' }, { label: 'Back-off', weight: '155', reps: '4', rpe: '8' }], targetSets: '4', targetReps: '4/2/5/4', targetWeight: '160/167.5/155/155 kg', rpe: '8', note: 'Vlna (zapiš top/overload sérii): TOP 160×4 → OVERLOAD 167.5×2 → Back-off 155×5 → Back-off 155×4' },
      { id: 'pin-squat', name: 'Pin dřep (z kolíků) — variace (z mrtvého bodu)', category: 'accessory', targetSets: '3', targetReps: '5', targetWeight: '132.5', note: 'Tvá 5.–7. „hlavní“ série na dřep. Sticking point.' },
      { id: 'walking-lunges', name: 'Chodící výpady (činky)', category: 'accessory', targetSets: '3', targetReps: '10/nohu', targetWeight: '2× činka lehká–stř.', note: 'unilaterální, quad + hýždě, mobilita kyčle. Rotuje po blocích. Nízký–střední objem – nohy šetříme; když je readiness nízký, tenhle slot ubereš první.' },
      { id: 'ab-wheel', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Břicho.' },
      { id: 'pallof', name: 'Pallof press (anti-rotace)', category: 'core', targetSets: '2', targetReps: '10/str.', targetWeight: 'lehká', note: 'Core stabilita, nízká únava.' },
    ]),
    npStrength(NP_TUE, [
      { id: 'bench', name: 'Bench Press (Comp.)', nameShort: 'Bench Press', category: 'main', setPlan: [{ label: 'TOP', weight: '110', reps: '4', rpe: '8' }, { label: 'OVERLOAD', weight: '115', reps: '2', rpe: '9' }, { label: 'Back-off', weight: '107.5', reps: '5', rpe: '8' }, { label: 'Back-off', weight: '107.5', reps: '4', rpe: '8' }], targetSets: '4', targetReps: '4/2/5/4', targetWeight: '110/115/107.5/107.5 kg', rpe: '8', note: 'Vlna (zapiš top/overload sérii): TOP 110×4 → OVERLOAD 115×2 → Back-off 107.5×5 → Back-off 107.5×4' },
      { id: 'spoto', name: 'Spoto press (2–3 cm nad hrudí) — variace na start z prsu', category: 'accessory', targetSets: '3', targetReps: '6', targetWeight: '100', note: 'Cílí slabinu (tlak z prsu). Bez odrazu. Rotuje po blocích.' },
      { id: 'triceps-overhead', name: 'Overhead extension s lanem', category: 'isolation', targetSets: '3', targetReps: '10–12', targetWeight: 'střední', note: 'Náhrada dipů – protažený triceps, šetří ramena. Rotuje po blocích.' },
      { id: 'pullup', name: 'Weighted pull-up (neutrální úchop – BICEPS)', category: 'accessory', targetSets: '3', targetReps: '8', note: 'Tvůj pull-up #1 – biceps varianta. Každý push den. Úchop rotuje.' },
      { id: 'bicep-curl', name: 'Bicepsový zdvih (na šikmé lavici)', category: 'isolation', targetSets: '3', targetReps: '10–12', targetWeight: 'střední', note: 'Biceps. Varianta rotuje.' },
      { id: 'face-pulls', name: 'Face pull (jen objemový týden)', category: 'prevention', targetSets: '3', targetReps: '15–20', targetWeight: 'lehká', note: 'Zdraví ramen – nahrazuje objem, co dřív dělaly dipy.' },
      { id: 'ab-wheel', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Břicho.' },
    ]),
    npWedHiit(),
    npThuRest(),
    npStrength(NP_FRI, [
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Deadlift', category: 'main', setPlan: [{ label: 'TOP', weight: '200', reps: '4', rpe: '8' }, { label: 'OVERLOAD', weight: '210', reps: '2', rpe: '9' }, { label: 'Back-off', weight: '192.5', reps: '5', rpe: '8' }], targetSets: '3', targetReps: '4/2/5', targetWeight: '200/210/192.5 kg', rpe: '8', note: 'Vlna (zapiš top/overload sérii): TOP 200×4 → OVERLOAD 210×2 → Back-off 192.5×5' },
      { id: 'chest-supported-row', name: 'Chest-supported row (na lavici/stroji) — silná záda = silný tah', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: 'stroj střední', note: 'Hlavní stavitel zad. Rotuje po blocích, střídá síla/objem.' },
      { id: 'pullup-back', name: 'Weighted pull-up (nadhmat střední – ZÁDA)', category: 'accessory', targetSets: '3', targetReps: '8', note: 'Tvůj pull-up #2 – zádová varianta. Každý pull den. Úchop rotuje.' },
      { id: 'bicep-curl-2', name: 'Bicepsový zdvih (jednoručky) — 2. expozice', category: 'isolation', targetSets: '3', targetReps: '8–10', targetWeight: 'střední', note: 'Biceps podruhé v týdnu. Varianta rotuje.' },
      { id: 'ab-wheel-dl', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Břicho.' },
    ]),
    npSatHiit(),
    npSunRest(),
  ],
};

const np7: Week = {
  number: 7, label: 'W7 – Síla', dateFrom: '2026-09-29', dateTo: '2026-10-05',
  phase: 'Blok B — Síla', phaseKey: 'phase2',
  description: 'Nejvyšší intenzita bloku B – trojky/dvojky. Silové doplňky.',
  days: [
    npStrength(NP_MON, [
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', setPlan: [{ label: 'TOP', weight: '167.5', reps: '3', rpe: '8-9' }, { label: 'OVERLOAD', weight: '172.5', reps: '2', rpe: '9' }, { label: 'Back-off', weight: '157.5', reps: '4', rpe: '8' }, { label: 'Back-off', weight: '157.5', reps: '4', rpe: '8' }], targetSets: '4', targetReps: '3/2/4/4', targetWeight: '167.5/172.5/157.5/157.5 kg', rpe: '8-9', note: 'Vlna (zapiš top/overload sérii): TOP 167.5×3 → OVERLOAD 172.5×2 → Back-off 157.5×4 → Back-off 157.5×4' },
      { id: 'pin-squat', name: 'Pin dřep (z kolíků) — variace (z mrtvého bodu)', category: 'accessory', targetSets: '3', targetReps: '3', targetWeight: '145', note: 'Tvá 5.–7. „hlavní“ série na dřep. Sticking point.' },
      { id: 'walking-lunges', name: 'Chodící výpady (činky)', category: 'accessory', targetSets: '3', targetReps: '8/nohu', targetWeight: '2× činka lehká–stř.', note: 'unilaterální, quad + hýždě, mobilita kyčle. Rotuje po blocích. Nízký–střední objem – nohy šetříme; když je readiness nízký, tenhle slot ubereš první.' },
      { id: 'ab-wheel', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Břicho.' },
      { id: 'pallof', name: 'Pallof press (anti-rotace)', category: 'core', targetSets: '2', targetReps: '10/str.', targetWeight: 'lehká', note: 'Core stabilita, nízká únava.' },
    ]),
    npStrength(NP_TUE, [
      { id: 'bench', name: 'Bench Press (Comp.)', nameShort: 'Bench Press', category: 'main', setPlan: [{ label: 'TOP', weight: '115', reps: '3', rpe: '8-9' }, { label: 'OVERLOAD', weight: '117.5', reps: '2', rpe: '9' }, { label: 'Back-off', weight: '107.5', reps: '4', rpe: '8' }, { label: 'Back-off', weight: '107.5', reps: '4', rpe: '8' }], targetSets: '4', targetReps: '3/2/4/4', targetWeight: '115/117.5/107.5/107.5 kg', rpe: '8-9', note: 'Vlna (zapiš top/overload sérii): TOP 115×3 → OVERLOAD 117.5×2 → Back-off 107.5×4 → Back-off 107.5×4' },
      { id: 'long-pause-bench', name: 'Dlouhý pauzový bench (3 s) — variace na start z prsu', category: 'accessory', targetSets: '3', targetReps: '4', targetWeight: '102.5', note: 'Cílí slabinu (tlak z prsu). Bez odrazu. Rotuje po blocích.' },
      { id: 'triceps-overhead', name: 'Overhead extension s lanem', category: 'isolation', targetSets: '3', targetReps: '8–10', targetWeight: 'střední', note: 'Náhrada dipů – protažený triceps, šetří ramena. Rotuje po blocích.' },
      { id: 'pullup', name: 'Weighted pull-up (neutrální úchop – BICEPS)', category: 'accessory', targetSets: '3', targetReps: '5', targetWeight: '+5–10 kg', note: 'Tvůj pull-up #1 – biceps varianta. Každý push den. Úchop rotuje.' },
      { id: 'bicep-curl', name: 'Bicepsový zdvih (na šikmé lavici)', category: 'isolation', targetSets: '3', targetReps: '6–8', targetWeight: 'střední', note: 'Biceps. Varianta rotuje.' },
      { id: 'ab-wheel', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Břicho.' },
    ]),
    npWedHiit(),
    npThuRest(),
    npStrength(NP_FRI, [
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Deadlift', category: 'main', setPlan: [{ label: 'TOP', weight: '207.5', reps: '3', rpe: '8-9' }, { label: 'OVERLOAD', weight: '215', reps: '2', rpe: '9' }, { label: 'Back-off', weight: '195', reps: '4', rpe: '8' }], targetSets: '3', targetReps: '3/2/4', targetWeight: '207.5/215/195 kg', rpe: '8-9', note: 'Vlna (zapiš top/overload sérii): TOP 207.5×3 → OVERLOAD 215×2 → Back-off 195×4' },
      { id: 'chest-supported-row', name: 'Chest-supported row (na lavici/stroji) — silná záda = silný tah', category: 'accessory', targetSets: '4', targetReps: '5', targetWeight: 'stroj těžká', note: 'Hlavní stavitel zad. Rotuje po blocích, střídá síla/objem.' },
      { id: 'pullup-back', name: 'Weighted pull-up (nadhmat střední – ZÁDA)', category: 'accessory', targetSets: '3', targetReps: '5', targetWeight: '+5–10 kg', note: 'Tvůj pull-up #2 – zádová varianta. Každý pull den. Úchop rotuje.' },
      { id: 'bicep-curl-2', name: 'Bicepsový zdvih (jednoručky) — 2. expozice', category: 'isolation', targetSets: '3', targetReps: '8–10', targetWeight: 'střední', note: 'Biceps podruhé v týdnu. Varianta rotuje.' },
      { id: 'ghd', name: 'GHD raise (jen silový týden)', category: 'prevention', targetSets: '3', targetReps: '4–6', note: 'Prevence hamstringů, rotuje. V objemovém týdnu vynech – nohy fried před sobotním HIIT.' },
      { id: 'ab-wheel-dl', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Břicho.' },
    ]),
    npSatHiit(),
    npSunRest(),
  ],
};

const np8: Week = {
  number: 8, label: 'W8 – Deload', dateFrom: '2026-10-06', dateTo: '2026-10-12',
  phase: 'Deload', phaseKey: 'deload', isDeload: true,
  description: 'Deload −50 %. Před intenzifikací plně zregenerovat.',
  days: [
    npStrength(NP_MON, [
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', setPlan: [{ label: 'Deload', weight: '140', reps: '3', rpe: '6-7' }, { label: 'Deload', weight: '140', reps: '3', rpe: '6-7' }, { label: 'Deload', weight: '142.5', reps: '3', rpe: '7' }], targetSets: '3', targetReps: '3/3/3', targetWeight: '140/140/142.5 kg', rpe: '6-7', note: 'Vlna (zapiš top/overload sérii): Deload 140×3 → Deload 140×3 → Deload 142.5×3' },
      { id: 'pause-squat', name: 'Pauzový dřep (2 s)', category: 'accessory', targetSets: '2', targetReps: '3', targetWeight: '125', note: 'Lehce, technika v díře.' },
      { id: 'ab-wheel', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '2', targetReps: '10', note: 'Břicho – každý trénink.' },
    ]),
    npStrength(NP_TUE, [
      { id: 'bench', name: 'Bench Press (Comp.)', nameShort: 'Bench Press', category: 'main', setPlan: [{ label: 'Deload', weight: '95', reps: '3', rpe: '6-7' }, { label: 'Deload', weight: '95', reps: '3', rpe: '6-7' }, { label: 'Deload', weight: '97.5', reps: '3', rpe: '7' }], targetSets: '3', targetReps: '3/3/3', targetWeight: '95/95/97.5 kg', rpe: '6-7', note: 'Vlna (zapiš top/overload sérii): Deload 95×3 → Deload 95×3 → Deload 97.5×3' },
      { id: 'pullup', name: 'Weighted pull-up (neutrální úchop – biceps)', category: 'accessory', targetSets: '2', targetReps: '6', note: 'Lehce.' },
      { id: 'face-pulls', name: 'Face pulls', category: 'prevention', targetSets: '3', targetReps: '15', targetWeight: 'lehká', note: 'Prehab ramen.' },
      { id: 'ab-wheel', name: 'Ab wheel', category: 'core', targetSets: '2', targetReps: '10', note: 'Břicho.' },
    ]),
    npWedHiit(),
    npThuRest(),
    npStrength(NP_FRI, [
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Deadlift', category: 'main', setPlan: [{ label: 'Deload', weight: '172.5', reps: '3', rpe: '6-7' }, { label: 'Deload', weight: '172.5', reps: '3', rpe: '6-7' }, { label: 'Deload', weight: '177.5', reps: '3', rpe: '7' }], targetSets: '3', targetReps: '3/3/3', targetWeight: '172.5/172.5/177.5 kg', rpe: '6-7', note: 'Vlna (zapiš top/overload sérii): Deload 172.5×3 → Deload 172.5×3 → Deload 177.5×3' },
      { id: 'chest-supported-row', name: 'Chest-supported row (na lavici/stroji)', category: 'accessory', targetSets: '2', targetReps: '8', targetWeight: 'stroj lehká', note: 'Lehce, záda.' },
      { id: 'pullup-back', name: 'Weighted pull-up (nadhmat střední – záda)', category: 'accessory', targetSets: '2', targetReps: '6', note: 'Lehce.' },
      { id: 'ab-wheel-dl', name: 'Ab wheel', category: 'core', targetSets: '2', targetReps: '10', note: 'Břicho.' },
    ]),
    npSatHiit(),
    npSunRest(),
  ],
};

const np9: Week = {
  number: 9, label: 'W9 – Intenzifikace', dateFrom: '2026-10-13', dateTo: '2026-10-19',
  phase: 'Blok C — Intenzifikace', phaseKey: 'phase3',
  description: 'Vstup do intenzifikace – tvůj „pozdní“ vlnový systém: dvojka na top, pak objemové back-offy. 120 na benchi má být LEHKÝCH.',
  days: [
    npStrength(NP_MON, [
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', setPlan: [{ label: 'Nájezd', weight: '162.5', reps: '3', rpe: '8' }, { label: 'TOP', weight: '172.5', reps: '2', rpe: '9' }, { label: 'Back-off', weight: '157.5', reps: '5', rpe: '8' }, { label: 'Back-off', weight: '157.5', reps: '5', rpe: '8' }], targetSets: '4', targetReps: '3/2/5/5', targetWeight: '162.5/172.5/157.5/157.5 kg', rpe: '8', note: 'Vlna (zapiš top/overload sérii): Nájezd 162.5×3 → TOP 172.5×2 → Back-off 157.5×5 → Back-off 157.5×5' },
      { id: 'pause-squat', name: 'Pauzový dřep (2 s) — variace (na díru — ostří techniku k testu)', category: 'accessory', targetSets: '3', targetReps: '3', targetWeight: '147.5', note: 'Tvá 5.–7. „hlavní“ série na dřep. Sticking point.' },
      { id: 'leg-press', name: 'Leg press (stroj)', category: 'accessory', targetSets: '4', targetReps: '6–8', targetWeight: 'stroj střední–těžká, RPE 8', note: 'quad bez axiálního zatížení — fatigue mgmt (Israetel s. 93). Rotuje po blocích. Nízký–střední objem – nohy šetříme; když je readiness nízký, tenhle slot ubereš první.' },
      { id: 'ab-wheel', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Břicho.' },
      { id: 'pallof', name: 'Pallof press (anti-rotace)', category: 'core', targetSets: '2', targetReps: '10/str.', targetWeight: 'lehká', note: 'Core stabilita, nízká únava.' },
    ]),
    npStrength(NP_TUE, [
      { id: 'bench', name: 'Bench Press (Comp.)', nameShort: 'Bench Press', category: 'main', setPlan: [{ label: 'Nájezd', weight: '112.5', reps: '3', rpe: '8' }, { label: 'TOP', weight: '117.5', reps: '2', rpe: '9' }, { label: 'Back-off', weight: '107.5', reps: '5', rpe: '8' }, { label: 'Back-off', weight: '107.5', reps: '5', rpe: '8' }], targetSets: '4', targetReps: '3/2/5/5', targetWeight: '112.5/117.5/107.5/107.5 kg', rpe: '8', note: 'Vlna (zapiš top/overload sérii): Nájezd 112.5×3 → TOP 117.5×2 → Back-off 107.5×5 → Back-off 107.5×5' },
      { id: 'pin-press', name: 'Pin press (z kolíků z prsu) — variace na start z prsu', category: 'accessory', targetSets: '3', targetReps: '4', targetWeight: '107.5', note: 'Cílí slabinu (tlak z prsu). Bez odrazu. Rotuje po blocích.' },
      { id: 'triceps-skull', name: 'Skull crusher / JM press', category: 'isolation', targetSets: '3', targetReps: '8–10', targetWeight: 'střední', note: 'Náhrada dipů – triceps na lockout, šetří ramena. Rotuje po blocích.' },
      { id: 'pullup', name: 'Weighted pull-up (podhmat úzko – BICEPS)', category: 'accessory', targetSets: '3', targetReps: '5', targetWeight: '+5–10 kg', note: 'Tvůj pull-up #1 – biceps varianta. Každý push den. Úchop rotuje.' },
      { id: 'bicep-curl', name: 'Bicepsový zdvih (EZ osa)', category: 'isolation', targetSets: '3', targetReps: '6–8', targetWeight: 'střední', note: 'Biceps. Varianta rotuje.' },
      { id: 'ab-wheel', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Břicho.' },
    ]),
    npWedHiit(),
    npThuRest(),
    npStrength(NP_FRI, [
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Deadlift', category: 'main', setPlan: [{ label: 'Nájezd', weight: '202.5', reps: '3', rpe: '8' }, { label: 'TOP', weight: '215', reps: '2', rpe: '9' }, { label: 'Back-off', weight: '195', reps: '5', rpe: '8' }], targetSets: '3', targetReps: '3/2/5', targetWeight: '202.5/215/195 kg', rpe: '8', note: 'Vlna (zapiš top/overload sérii): Nájezd 202.5×3 → TOP 215×2 → Back-off 195×5' },
      { id: 'pendlay-row', name: 'Pendlay row (z podlahy) — silná záda = silný tah', category: 'accessory', targetSets: '4', targetReps: '5', targetWeight: '97.5', note: 'Hlavní stavitel zad. Rotuje po blocích, střídá síla/objem.' },
      { id: 'pullup-back', name: 'Weighted pull-up (nadhmat široko – ZÁDA)', category: 'accessory', targetSets: '3', targetReps: '5', targetWeight: '+5–10 kg', note: 'Tvůj pull-up #2 – zádová varianta. Každý pull den. Úchop rotuje.' },
      { id: 'bicep-curl-2', name: 'Bicepsový zdvih (kladívkový (hammer)) — 2. expozice', category: 'isolation', targetSets: '3', targetReps: '8–10', targetWeight: 'střední', note: 'Biceps podruhé v týdnu. Varianta rotuje.' },
      { id: 'nordic-curls', name: 'Nordic curl (jen silový týden)', category: 'prevention', targetSets: '3', targetReps: '4–6', note: 'Prevence hamstringů, rotuje. V objemovém týdnu vynech – nohy fried před sobotním HIIT.' },
      { id: 'ab-wheel-dl', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Břicho.' },
    ]),
    npSatHiit(),
    npSunRest(),
  ],
};

const np10: Week = {
  number: 10, label: 'W10 – Intenzifikace', dateFrom: '2026-10-20', dateTo: '2026-10-26',
  phase: 'Blok C — Intenzifikace', phaseKey: 'phase3',
  description: 'První top singly (95 %). 120 kg bench lehce, 125 se objevuje.',
  days: [
    npStrength(NP_MON, [
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', setPlan: [{ label: 'Nájezd', weight: '167.5', reps: '2', rpe: '8' }, { label: 'TOP single', weight: '175', reps: '1', rpe: '9' }, { label: 'Back-off', weight: '160', reps: '4', rpe: '8' }, { label: 'Back-off', weight: '160', reps: '3', rpe: '8' }], targetSets: '4', targetReps: '2/1/4/3', targetWeight: '167.5/175/160/160 kg', rpe: '8', note: 'Vlna (zapiš top/overload sérii): Nájezd 167.5×2 → TOP single 175×1 → Back-off 160×4 → Back-off 160×3' },
      { id: 'pause-squat', name: 'Pauzový dřep (2 s) — variace (na díru — ostří techniku k testu)', category: 'accessory', targetSets: '3', targetReps: '5', targetWeight: '137.5', note: 'Tvá 5.–7. „hlavní“ série na dřep. Sticking point.' },
      { id: 'leg-press', name: 'Leg press (stroj)', category: 'accessory', targetSets: '3', targetReps: '10–12', targetWeight: 'stroj střední–těžká, RPE 8', note: 'quad bez axiálního zatížení — fatigue mgmt (Israetel s. 93). Rotuje po blocích. Nízký–střední objem – nohy šetříme; když je readiness nízký, tenhle slot ubereš první.' },
      { id: 'ab-wheel', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Břicho.' },
      { id: 'pallof', name: 'Pallof press (anti-rotace)', category: 'core', targetSets: '2', targetReps: '10/str.', targetWeight: 'lehká', note: 'Core stabilita, nízká únava.' },
    ]),
    npStrength(NP_TUE, [
      { id: 'bench', name: 'Bench Press (Comp.)', nameShort: 'Bench Press', category: 'main', setPlan: [{ label: 'Nájezd', weight: '115', reps: '2', rpe: '8' }, { label: 'TOP single', weight: '120', reps: '1', rpe: '9' }, { label: 'Back-off', weight: '110', reps: '4', rpe: '8' }, { label: 'Back-off', weight: '110', reps: '3', rpe: '8' }], targetSets: '4', targetReps: '2/1/4/3', targetWeight: '115/120/110/110 kg', rpe: '8', note: 'Vlna (zapiš top/overload sérii): Nájezd 115×2 → TOP single 120×1 → Back-off 110×4 → Back-off 110×3' },
      { id: 'spoto', name: 'Spoto press (2–3 cm nad hrudí) — variace na start z prsu', category: 'accessory', targetSets: '3', targetReps: '6', targetWeight: '102.5', note: 'Cílí slabinu (tlak z prsu). Bez odrazu. Rotuje po blocích.' },
      { id: 'triceps-skull', name: 'Skull crusher / JM press', category: 'isolation', targetSets: '3', targetReps: '10–12', targetWeight: 'střední', note: 'Náhrada dipů – triceps na lockout, šetří ramena. Rotuje po blocích.' },
      { id: 'pullup', name: 'Weighted pull-up (podhmat úzko – BICEPS)', category: 'accessory', targetSets: '3', targetReps: '8', note: 'Tvůj pull-up #1 – biceps varianta. Každý push den. Úchop rotuje.' },
      { id: 'bicep-curl', name: 'Bicepsový zdvih (EZ osa)', category: 'isolation', targetSets: '3', targetReps: '10–12', targetWeight: 'střední', note: 'Biceps. Varianta rotuje.' },
      { id: 'face-pulls', name: 'Face pull (jen objemový týden)', category: 'prevention', targetSets: '3', targetReps: '15–20', targetWeight: 'lehká', note: 'Zdraví ramen – nahrazuje objem, co dřív dělaly dipy.' },
      { id: 'ab-wheel', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Břicho.' },
    ]),
    npWedHiit(),
    npThuRest(),
    npStrength(NP_FRI, [
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Deadlift', category: 'main', setPlan: [{ label: 'Nájezd', weight: '207.5', reps: '2', rpe: '8' }, { label: 'TOP single', weight: '217.5', reps: '1', rpe: '9' }, { label: 'Back-off', weight: '200', reps: '4', rpe: '8' }], targetSets: '3', targetReps: '2/1/4', targetWeight: '207.5/217.5/200 kg', rpe: '8', note: 'Vlna (zapiš top/overload sérii): Nájezd 207.5×2 → TOP single 217.5×1 → Back-off 200×4' },
      { id: 'pendlay-row', name: 'Pendlay row (z podlahy) — silná záda = silný tah', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: '82.5', note: 'Hlavní stavitel zad. Rotuje po blocích, střídá síla/objem.' },
      { id: 'pullup-back', name: 'Weighted pull-up (nadhmat široko – ZÁDA)', category: 'accessory', targetSets: '3', targetReps: '8', note: 'Tvůj pull-up #2 – zádová varianta. Každý pull den. Úchop rotuje.' },
      { id: 'bicep-curl-2', name: 'Bicepsový zdvih (kladívkový (hammer)) — 2. expozice', category: 'isolation', targetSets: '3', targetReps: '8–10', targetWeight: 'střední', note: 'Biceps podruhé v týdnu. Varianta rotuje.' },
      { id: 'ab-wheel-dl', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Břicho.' },
    ]),
    npSatHiit(),
    npSunRest(),
  ],
};

const np11: Week = {
  number: 11, label: 'W11 – Intenzifikace', dateFrom: '2026-10-27', dateTo: '2026-11-02',
  phase: 'Blok C — Intenzifikace', phaseKey: 'phase3',
  description: 'Nejtěžší tréninkový týden – singly 97 %. 125 kg jako těžší top single.',
  days: [
    npStrength(NP_MON, [
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', setPlan: [{ label: 'Nájezd', weight: '170', reps: '2', rpe: '8-9' }, { label: 'TOP single', weight: '180', reps: '1', rpe: '9' }, { label: 'Back-off', weight: '162.5', reps: '3', rpe: '8' }, { label: 'Back-off', weight: '162.5', reps: '3', rpe: '8' }], targetSets: '4', targetReps: '2/1/3/3', targetWeight: '170/180/162.5/162.5 kg', rpe: '8-9', note: 'Vlna (zapiš top/overload sérii): Nájezd 170×2 → TOP single 180×1 → Back-off 162.5×3 → Back-off 162.5×3' },
      { id: 'pause-squat', name: 'Pauzový dřep (2 s) — variace (na díru — ostří techniku k testu)', category: 'accessory', targetSets: '3', targetReps: '3', targetWeight: '147.5', note: 'Tvá 5.–7. „hlavní“ série na dřep. Sticking point.' },
      { id: 'leg-press', name: 'Leg press (stroj)', category: 'accessory', targetSets: '4', targetReps: '6–8', targetWeight: 'stroj střední–těžká, RPE 8', note: 'quad bez axiálního zatížení — fatigue mgmt (Israetel s. 93). Rotuje po blocích. Nízký–střední objem – nohy šetříme; když je readiness nízký, tenhle slot ubereš první.' },
      { id: 'ab-wheel', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Břicho.' },
      { id: 'pallof', name: 'Pallof press (anti-rotace)', category: 'core', targetSets: '2', targetReps: '10/str.', targetWeight: 'lehká', note: 'Core stabilita, nízká únava.' },
    ]),
    npStrength(NP_TUE, [
      { id: 'bench', name: 'Bench Press (Comp.)', nameShort: 'Bench Press', category: 'main', setPlan: [{ label: 'Nájezd', weight: '117.5', reps: '2', rpe: '8-9' }, { label: 'TOP single', weight: '122.5', reps: '1', rpe: '9' }, { label: 'Back-off', weight: '112.5', reps: '3', rpe: '8' }, { label: 'Back-off', weight: '112.5', reps: '3', rpe: '8' }], targetSets: '4', targetReps: '2/1/3/3', targetWeight: '117.5/122.5/112.5/112.5 kg', rpe: '8-9', note: 'Vlna (zapiš top/overload sérii): Nájezd 117.5×2 → TOP single 122.5×1 → Back-off 112.5×3 → Back-off 112.5×3' },
      { id: 'pin-press', name: 'Pin press (z kolíků z prsu) — variace na start z prsu', category: 'accessory', targetSets: '3', targetReps: '4', targetWeight: '107.5', note: 'Cílí slabinu (tlak z prsu). Bez odrazu. Rotuje po blocích.' },
      { id: 'triceps-skull', name: 'Skull crusher / JM press', category: 'isolation', targetSets: '3', targetReps: '8–10', targetWeight: 'střední', note: 'Náhrada dipů – triceps na lockout, šetří ramena. Rotuje po blocích.' },
      { id: 'pullup', name: 'Weighted pull-up (podhmat úzko – BICEPS)', category: 'accessory', targetSets: '3', targetReps: '5', targetWeight: '+5–10 kg', note: 'Tvůj pull-up #1 – biceps varianta. Každý push den. Úchop rotuje.' },
      { id: 'bicep-curl', name: 'Bicepsový zdvih (EZ osa)', category: 'isolation', targetSets: '3', targetReps: '6–8', targetWeight: 'střední', note: 'Biceps. Varianta rotuje.' },
      { id: 'ab-wheel', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Břicho.' },
    ]),
    npWedHiit(),
    npThuRest(),
    npStrength(NP_FRI, [
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Deadlift', category: 'main', setPlan: [{ label: 'Nájezd', weight: '212.5', reps: '2', rpe: '8-9' }, { label: 'TOP single', weight: '222.5', reps: '1', rpe: '9' }, { label: 'Back-off', weight: '202.5', reps: '3', rpe: '8' }], targetSets: '3', targetReps: '2/1/3', targetWeight: '212.5/222.5/202.5 kg', rpe: '8-9', note: 'Vlna (zapiš top/overload sérii): Nájezd 212.5×2 → TOP single 222.5×1 → Back-off 202.5×3' },
      { id: 'pendlay-row', name: 'Pendlay row (z podlahy) — silná záda = silný tah', category: 'accessory', targetSets: '4', targetReps: '5', targetWeight: '97.5', note: 'Hlavní stavitel zad. Rotuje po blocích, střídá síla/objem.' },
      { id: 'pullup-back', name: 'Weighted pull-up (nadhmat široko – ZÁDA)', category: 'accessory', targetSets: '3', targetReps: '5', targetWeight: '+5–10 kg', note: 'Tvůj pull-up #2 – zádová varianta. Každý pull den. Úchop rotuje.' },
      { id: 'bicep-curl-2', name: 'Bicepsový zdvih (kladívkový (hammer)) — 2. expozice', category: 'isolation', targetSets: '3', targetReps: '8–10', targetWeight: 'střední', note: 'Biceps podruhé v týdnu. Varianta rotuje.' },
      { id: 'nordic-curls', name: 'Nordic curl (jen silový týden)', category: 'prevention', targetSets: '3', targetReps: '4–6', note: 'Prevence hamstringů, rotuje. V objemovém týdnu vynech – nohy fried před sobotním HIIT.' },
      { id: 'ab-wheel-dl', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Břicho.' },
    ]),
    npSatHiit(),
    npSunRest(),
  ],
};

const np12: Week = {
  number: 12, label: 'W12 – Taper', dateFrom: '2026-11-03', dateTo: '2026-11-09',
  phase: 'Taper', phaseKey: 'phase4',
  description: 'Taper −60 % objemu, intenzita zachována. Nácvik openerů. Únava odchází.',
  days: [
    npStrength(NP_MON, [
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', setPlan: [{ label: 'Opener', weight: '167.5', reps: '1', rpe: '7' }, { label: 'Druhá', weight: '157.5', reps: '2', rpe: '7' }, { label: 'Objem', weight: '147.5', reps: '3', rpe: '7' }], targetSets: '3', targetReps: '1/2/3', targetWeight: '167.5/157.5/147.5 kg', rpe: '7', note: 'Vlna (zapiš top/overload sérii): Opener 167.5×1 → Druhá 157.5×2 → Objem 147.5×3' },
      { id: 'pause-squat', name: 'Pauzový dřep (2 s) — variace (na díru — ostří techniku k testu)', category: 'accessory', targetSets: '3', targetReps: '3', targetWeight: '147.5', note: 'Tvá 5.–7. „hlavní“ série na dřep. Sticking point.' },
      { id: 'leg-press', name: 'Leg press (stroj)', category: 'accessory', targetSets: '3', targetReps: '10–12', targetWeight: 'stroj střední–těžká, RPE 8', note: 'quad bez axiálního zatížení — fatigue mgmt (Israetel s. 93). Rotuje po blocích. Nízký–střední objem – nohy šetříme; když je readiness nízký, tenhle slot ubereš první.' },
      { id: 'ab-wheel', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Břicho.' },
      { id: 'pallof', name: 'Pallof press (anti-rotace)', category: 'core', targetSets: '2', targetReps: '10/str.', targetWeight: 'lehká', note: 'Core stabilita, nízká únava.' },
    ]),
    npStrength(NP_TUE, [
      { id: 'bench', name: 'Bench Press (Comp.)', nameShort: 'Bench Press', category: 'main', setPlan: [{ label: 'Opener', weight: '115', reps: '1', rpe: '7' }, { label: 'Druhá', weight: '107.5', reps: '2', rpe: '7' }, { label: 'Objem', weight: '102.5', reps: '3', rpe: '7' }], targetSets: '3', targetReps: '1/2/3', targetWeight: '115/107.5/102.5 kg', rpe: '7', note: 'Vlna (zapiš top/overload sérii): Opener 115×1 → Druhá 107.5×2 → Objem 102.5×3' },
      { id: 'spoto', name: 'Spoto press (2–3 cm nad hrudí) — variace na start z prsu', category: 'accessory', targetSets: '3', targetReps: '6', targetWeight: '102.5', note: 'Cílí slabinu (tlak z prsu). Bez odrazu. Rotuje po blocích.' },
      { id: 'triceps-skull', name: 'Skull crusher / JM press', category: 'isolation', targetSets: '3', targetReps: '10–12', targetWeight: 'střední', note: 'Náhrada dipů – triceps na lockout, šetří ramena. Rotuje po blocích.' },
      { id: 'pullup', name: 'Weighted pull-up (podhmat úzko – BICEPS)', category: 'accessory', targetSets: '3', targetReps: '8', note: 'Tvůj pull-up #1 – biceps varianta. Každý push den. Úchop rotuje.' },
      { id: 'bicep-curl', name: 'Bicepsový zdvih (EZ osa)', category: 'isolation', targetSets: '3', targetReps: '10–12', targetWeight: 'střední', note: 'Biceps. Varianta rotuje.' },
      { id: 'face-pulls', name: 'Face pull (jen objemový týden)', category: 'prevention', targetSets: '3', targetReps: '15–20', targetWeight: 'lehká', note: 'V silovém týdnu vynech.' },
      { id: 'ab-wheel', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Břicho.' },
    ]),
    npWedHiit(),
    npThuRest(),
    npStrength(NP_FRI, [
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Deadlift', category: 'main', setPlan: [{ label: 'Opener', weight: '207.5', reps: '1', rpe: '7' }, { label: 'Druhá', weight: '195', reps: '2', rpe: '7' }, { label: 'Objem', weight: '185', reps: '3', rpe: '7' }], targetSets: '3', targetReps: '1/2/3', targetWeight: '207.5/195/185 kg', rpe: '7', note: 'Vlna (zapiš top/overload sérii): Opener 207.5×1 → Druhá 195×2 → Objem 185×3' },
      { id: 'pendlay-row', name: 'Pendlay row (z podlahy) — silná záda = silný tah', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: '82.5', note: 'Hlavní stavitel zad. Rotuje po blocích, střídá síla/objem.' },
      { id: 'pullup-back', name: 'Weighted pull-up (nadhmat široko – ZÁDA)', category: 'accessory', targetSets: '3', targetReps: '8', note: 'Tvůj pull-up #2 – zádová varianta. Každý pull den. Úchop rotuje.' },
      { id: 'bicep-curl-2', name: 'Bicepsový zdvih (kladívkový (hammer)) — 2. expozice', category: 'isolation', targetSets: '3', targetReps: '8–10', targetWeight: 'střední', note: 'Biceps podruhé v týdnu. Varianta rotuje.' },
      { id: 'ab-wheel-dl', name: 'Ab wheel / hanging leg raise', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Břicho.' },
    ]),
    npSatHiit(),
    npSunRest(),
  ],
};

const np13: Week = {
  number: 13, label: 'W13 – TEST MAXIM', dateFrom: '2026-11-10', dateTo: '2026-11-16',
  phase: 'TEST MAXIM', phaseKey: 'phase4',
  description: 'Test maxim. Dvou-faktorový model: únava pryč, fitness zůstala → výkon vyskočí. Cíle: bench 130, dřep 190, mrtvý tah 230+.',
  days: [
    npStrength(NP_MON, [
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', setPlan: [{ label: 'Rozjezd', weight: '150', reps: '1' }, { label: 'Rozjezd', weight: '170', reps: '1' }, { label: 'CÍL', weight: '190', reps: '1' }, { label: 'PR (volitelně)', weight: '195', reps: '1' }], targetSets: '1', targetReps: '1', targetWeight: '190 kg (CÍL)', rpe: 'MAX', note: 'TEST. Postup: 150×1 (Rozjezd) → 170×1 (Rozjezd) → 190×1 (CÍL) → 195×1 (PR (volitelně))' },
    ]),
    npStrength(NP_TUE, [
      { id: 'bench', name: 'Bench Press (Comp.)', nameShort: 'Bench Press', category: 'main', setPlan: [{ label: 'Rozjezd', weight: '100', reps: '1' }, { label: 'Rozjezd', weight: '115', reps: '1' }, { label: 'Rozjezd', weight: '125', reps: '1' }, { label: 'CÍL', weight: '130', reps: '1' }, { label: 'PR (volitelně)', weight: '132.5', reps: '1' }], targetSets: '1', targetReps: '1', targetWeight: '130 kg (CÍL)', rpe: 'MAX', note: 'TEST. Postup: 100×1 (Rozjezd) → 115×1 (Rozjezd) → 125×1 (Rozjezd) → 130×1 (CÍL) → 132.5×1 (PR (volitelně))' },
    ]),
    npWedHiit(),
    npThuRest(),
    npStrength(NP_FRI, [
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Deadlift', category: 'main', setPlan: [{ label: 'Rozjezd', weight: '180', reps: '1' }, { label: 'Rozjezd', weight: '207.5', reps: '1' }, { label: 'CÍL', weight: '230', reps: '1' }, { label: 'PR pokus', weight: '235', reps: '1' }], targetSets: '1', targetReps: '1', targetWeight: '230 kg (CÍL)', rpe: 'MAX', note: 'TEST. Postup: 180×1 (Rozjezd) → 207.5×1 (Rozjezd) → 230×1 (CÍL) → 235×1 (PR pokus)' },
    ]),
    npSatHiit(),
    npSunRest(),
  ],
};

export const PHASE3_WEEKS: Week[] = [np1, np2, np3, np4, np5, np6, np7, np8, np9, np10, np11, np12, np13];


// ============================================================
// NUTRITION DATA (Schumann & Rønnestad)
// ============================================================
export const NUTRITION = {
  calories: 3600,
  protein: { g: 160, gPerKg: 1.7, source: 'Schumann s.233' },
  carbs: { g: 517, gPerKg: 5.5, source: 'Schumann s.215' },
  fat: { g: 99, source: 'Dopočet' },
  timing: {
    preworkout: '20–30 g bílkovin + 60–80 g sacharidů, 1–2 h před tréninkem',
    postStrength: '20 g bílkovin + ~94 g sacharidů (1 g/kg) do 4 h po tréninku',
    postHiit: 'Sacharidy okamžitě po HIIT – minimalizuje AMPK/mTOR interferenci (Schumann s.234)',
  },
  supplements: [
    { name: 'Kreatin monohydrát', dose: '5 g/den maintenance (loading: 20–30 g/den × 5–7 dní)', source: 'Schumann s.238' },
    { name: 'Omega-3 (n-3 PUFA)', dose: '3–6 g EPA + 0.6 g DHA denně', source: 'Schumann s.237' },
    { name: 'HMB', dose: '3 g/den', source: 'Schumann s.236' },
    { name: 'Vitamin D3 + Magnézium', dose: 'Dle obecných doporučení', source: 'Obecná doporučení' },
  ],
};

// ============================================================
// RUNNING PROGRAM (Viada – concurrent scheduling)
// ============================================================
export const RUNNING_PROGRAM = [
  { week: 1, type: 'Volitelný Z2 běh', duration: '≤30 min', zone: 'Z2', description: 'Neděle, konverzační tempo, ≤5 km. Nepovinné – chrání nohy.' },
  { week: 2, type: 'Volitelný Z2 běh', duration: '≤30 min', zone: 'Z2', description: 'Neděle, konverzační tempo, ≤5 km. Nepovinné – chrání nohy.' },
  { week: 3, type: 'Volitelný Z2 běh', duration: '≤30 min', zone: 'Z2', description: 'Neděle, konverzační tempo, ≤5 km. Nepovinné – chrání nohy.' },
  { week: 4, type: 'Volitelný Z2 běh', duration: '≤30 min', zone: 'Z2', description: 'Neděle, konverzační tempo, ≤5 km. Nepovinné – chrání nohy.' },
  { week: 5, type: 'Volitelný Z2 běh', duration: '≤30 min', zone: 'Z2', description: 'Neděle, konverzační tempo, ≤5 km. Nepovinné – chrání nohy.' },
  { week: 6, type: 'Volitelný Z2 běh', duration: '≤30 min', zone: 'Z2', description: 'Neděle, konverzační tempo, ≤5 km. Nepovinné – chrání nohy.' },
  { week: 7, type: 'Volitelný Z2 běh', duration: '≤30 min', zone: 'Z2', description: 'Neděle, konverzační tempo, ≤5 km. Nepovinné – chrání nohy.' },
  { week: 8, type: 'Volitelný Z2 běh', duration: '≤30 min', zone: 'Z2', description: 'Neděle, konverzační tempo, ≤5 km. Nepovinné – chrání nohy.' },
  { week: 9, type: 'Volitelný Z2 běh', duration: '≤30 min', zone: 'Z2', description: 'Neděle, konverzační tempo, ≤5 km. Nepovinné – chrání nohy.' },
  { week: 10, type: 'Volitelný Z2 běh', duration: '≤30 min', zone: 'Z2', description: 'Neděle, konverzační tempo, ≤5 km. Nepovinné – chrání nohy.' },
  { week: 11, type: 'Volitelný Z2 běh', duration: '≤30 min', zone: 'Z2', description: 'Neděle, konverzační tempo, ≤5 km. Nepovinné – chrání nohy.' },
  { week: 12, type: 'VYNECHAT', duration: '–', zone: '–', description: 'Taper/test – žádný běh (Viada).' },
  { week: 13, type: 'VYNECHAT', duration: '–', zone: '–', description: 'Taper/test – žádný běh (Viada).' },
];

// ============================================================
// DEFAULT RECORDS (historical data from CSV + app records)
// ============================================================
export const DEFAULT_RECORDS: RecordsMap = {
  'bench': [
    { id: nanoid(), date: '2026-02-01', sets: '4', weight: '95', reps: '8', note: 'Fáze 1 start' },
    { id: nanoid(), date: '2026-02-08', sets: '4', weight: '97.5', reps: '8', note: '' },
    { id: nanoid(), date: '2026-02-15', sets: '4', weight: '100', reps: '8', note: '' },
    { id: nanoid(), date: '2026-02-22', sets: '4', weight: '100', reps: '8', note: '' },
    { id: nanoid(), date: '2026-03-01', sets: '4', weight: '102.5', reps: '8', note: '' },
    { id: nanoid(), date: '2026-03-08', sets: '4', weight: '105', reps: '8', note: '' },
    { id: nanoid(), date: '2026-03-15', sets: '4', weight: '105', reps: '8', note: '' },
    { id: nanoid(), date: '2026-03-23', sets: '4', weight: '105', reps: '8', note: 'Poslední záznam Fáze 2' },
  ],
  'squat': [
    { id: nanoid(), date: '2026-02-01', sets: '4', weight: '140', reps: '5', note: 'Fáze 1 start' },
    { id: nanoid(), date: '2026-02-08', sets: '4', weight: '145', reps: '5', note: '' },
    { id: nanoid(), date: '2026-02-15', sets: '4', weight: '150', reps: '5', note: '' },
    { id: nanoid(), date: '2026-02-22', sets: '4', weight: '150', reps: '5', note: '' },
    { id: nanoid(), date: '2026-03-01', sets: '4', weight: '155', reps: '5', note: '' },
    { id: nanoid(), date: '2026-03-08', sets: '4', weight: '160', reps: '1', note: 'Nové max!' },
    { id: nanoid(), date: '2026-03-15', sets: '4', weight: '157.5', reps: '3', note: '' },
    { id: nanoid(), date: '2026-03-23', sets: '4', weight: '160', reps: '3', note: 'Poslední záznam Fáze 2' },
  ],
  'deadlift': [
    { id: nanoid(), date: '2026-02-01', sets: '3', weight: '185', reps: '5', note: 'Fáze 1 start' },
    { id: nanoid(), date: '2026-02-08', sets: '3', weight: '190', reps: '5', note: '' },
    { id: nanoid(), date: '2026-02-15', sets: '3', weight: '195', reps: '5', note: '' },
    { id: nanoid(), date: '2026-02-22', sets: '3', weight: '200', reps: '5', note: '' },
    { id: nanoid(), date: '2026-03-01', sets: '3', weight: '205', reps: '3', note: '' },
    { id: nanoid(), date: '2026-03-08', sets: '3', weight: '220', reps: '2', note: 'Nové max!' },
    { id: nanoid(), date: '2026-03-15', sets: '3', weight: '215', reps: '3', note: '' },
    { id: nanoid(), date: '2026-03-23', sets: '3', weight: '230', reps: '2', note: 'Poslední záznam Fáze 2' },
  ],
  'rdl': [
    { id: nanoid(), date: '2026-02-01', sets: '3', weight: '60', reps: '12', note: '' },
    { id: nanoid(), date: '2026-02-15', sets: '3', weight: '65', reps: '12', note: '' },
    { id: nanoid(), date: '2026-03-01', sets: '3', weight: '70', reps: '12', note: '' },
    { id: nanoid(), date: '2026-03-08', sets: '3', weight: '70', reps: '12', note: '' },
    { id: nanoid(), date: '2026-03-23', sets: '3', weight: '70', reps: '12', note: '' },
  ],
  'leg-press': [
    { id: nanoid(), date: '2026-02-01', sets: '3', weight: '180', reps: '12', note: '' },
    { id: nanoid(), date: '2026-02-15', sets: '3', weight: '200', reps: '12', note: '' },
    { id: nanoid(), date: '2026-03-01', sets: '3', weight: '210', reps: '12', note: '' },
    { id: nanoid(), date: '2026-03-08', sets: '3', weight: '220', reps: '12', note: '' },
    { id: nanoid(), date: '2026-03-23', sets: '3', weight: '220', reps: '12', note: '' },
  ],
  'pullup': [
    { id: nanoid(), date: '2026-02-01', sets: '3', weight: '0', reps: '8', note: 'BW' },
    { id: nanoid(), date: '2026-02-15', sets: '3', weight: '5', reps: '6', note: '+5 kg' },
    { id: nanoid(), date: '2026-03-01', sets: '3', weight: '5', reps: '8', note: '' },
    { id: nanoid(), date: '2026-03-15', sets: '3', weight: '10', reps: '6', note: '+10 kg' },
    { id: nanoid(), date: '2026-03-23', sets: '3', weight: '10', reps: '8', note: '' },
  ],
  'front-squat': [
    { id: nanoid(), date: '2026-02-01', sets: '3', weight: '90', reps: '8', note: '' },
    { id: nanoid(), date: '2026-02-15', sets: '3', weight: '95', reps: '8', note: '' },
    { id: nanoid(), date: '2026-02-22', sets: '3', weight: '100', reps: '8', note: '' },
    { id: nanoid(), date: '2026-03-01', sets: '3', weight: '105', reps: '8', note: '' },
    { id: nanoid(), date: '2026-03-08', sets: '3', weight: '105', reps: '8', note: '' },
    { id: nanoid(), date: '2026-03-23', sets: '3', weight: '105', reps: '8', note: '' },
  ],
  'pause-squat': [
    { id: nanoid(), date: '2026-02-15', sets: '3', weight: '100', reps: '5', note: '2s pauza' },
    { id: nanoid(), date: '2026-03-01', sets: '3', weight: '105', reps: '5', note: '' },
    { id: nanoid(), date: '2026-03-15', sets: '3', weight: '107.5', reps: '5', note: '' },
    { id: nanoid(), date: '2026-03-23', sets: '3', weight: '110', reps: '5', note: '' },
  ],
  'spoto': [
    { id: nanoid(), date: '2026-02-15', sets: '3', weight: '75', reps: '8', note: '2-3 cm nad hrudníkem' },
    { id: nanoid(), date: '2026-03-01', sets: '3', weight: '80', reps: '8', note: '' },
    { id: nanoid(), date: '2026-03-15', sets: '3', weight: '82.5', reps: '8', note: '' },
    { id: nanoid(), date: '2026-03-23', sets: '3', weight: '85', reps: '6', note: '' },
  ],
  'barbell-row': [
    { id: nanoid(), date: '2026-02-01', sets: '3', weight: '70', reps: '10', note: '' },
    { id: nanoid(), date: '2026-02-15', sets: '3', weight: '75', reps: '10', note: '' },
    { id: nanoid(), date: '2026-03-01', sets: '3', weight: '80', reps: '10', note: '' },
    { id: nanoid(), date: '2026-03-15', sets: '3', weight: '85', reps: '8', note: '' },
    { id: nanoid(), date: '2026-03-23', sets: '3', weight: '87.5', reps: '8', note: '' },
  ],
  'dips': [
    { id: nanoid(), date: '2026-02-01', sets: '3', weight: '0', reps: '10', note: 'BW' },
    { id: nanoid(), date: '2026-02-15', sets: '3', weight: '5', reps: '10', note: '+5 kg' },
    { id: nanoid(), date: '2026-03-01', sets: '3', weight: '10', reps: '8', note: '' },
    { id: nanoid(), date: '2026-03-15', sets: '3', weight: '10', reps: '10', note: '' },
    { id: nanoid(), date: '2026-03-23', sets: '3', weight: '15', reps: '8', note: '' },
  ],
  'bulgarian': [
    { id: nanoid(), date: '2026-02-08', sets: '3', weight: '30', reps: '10', note: '2×DB' },
    { id: nanoid(), date: '2026-02-22', sets: '3', weight: '35', reps: '10', note: '' },
    { id: nanoid(), date: '2026-03-08', sets: '3', weight: '40', reps: '10', note: '' },
    { id: nanoid(), date: '2026-03-23', sets: '3', weight: '40', reps: '10', note: '' },
  ],
  'larsen': [
    { id: nanoid(), date: '2026-02-08', sets: '3', weight: '70', reps: '10', note: 'Nohy nahoře' },
    { id: nanoid(), date: '2026-02-22', sets: '3', weight: '75', reps: '8', note: '' },
    { id: nanoid(), date: '2026-03-08', sets: '3', weight: '77.5', reps: '8', note: '' },
    { id: nanoid(), date: '2026-03-23', sets: '3', weight: '80', reps: '8', note: '' },
  ],
  'run-thu': [
    { id: nanoid(), date: '2026-02-11', sets: '1', weight: '0', reps: '20 min', note: 'Easy run Z2' },
    { id: nanoid(), date: '2026-02-18', sets: '1', weight: '0', reps: '25 min', note: 'Easy run Z2' },
    { id: nanoid(), date: '2026-02-25', sets: '1', weight: '0', reps: '25 min', note: 'Easy run Z2' },
    { id: nanoid(), date: '2026-03-11', sets: '1', weight: '0', reps: '30 min', note: 'Easy run Z2' },
    { id: nanoid(), date: '2026-03-25', sets: '1', weight: '0', reps: '30 min', note: 'Easy run Z2' },
  ],
  'ghd': [],
  'pallof': [],
  'face-pulls': [],
  'nordic-curls': [],
  'cop-adduction': [],
  'ab-wheel': [],
  'bicep-curl': [],
  'tempo-squat': [],
  'lat-pulldown': [],
  'walking-lunges': [],
  'long-pause-bench': [],
  'cable-row': [],
  'hiit-wed': [],
  'hiit-sat': [],
};

// ============================================================
// HELPERS
// ============================================================
export { nanoid };
export function nanoidFn() { return nanoid(); }
export function formatDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' });
}
export function formatDateFull(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
}
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}
export function getTodayDayKey(): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
}
export function getCurrentWeek(): number {
  const start = new Date(PLAN_START_DATE + 'T00:00:00');
  const now = new Date();
  const diff = Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, Math.min(13, diff + 1));
}
export function getCategoryColor(category: ExerciseCategory): string {
  switch (category) {
    case 'main': return 'text-yellow-400';
    case 'accessory': return 'text-orange-400';
    case 'isolation': return 'text-blue-400';
    case 'prevention': return 'text-green-400';
    case 'core': return 'text-purple-400';
    case 'run': return 'text-cyan-400';
    case 'superset': return 'text-pink-400';
    default: return 'text-gray-400';
  }
}
export function getCategoryLabel(category: ExerciseCategory): string {
  switch (category) {
    case 'main': return 'Hlavní';
    case 'accessory': return 'Doplňkový';
    case 'isolation': return 'Izolace';
    case 'prevention': return 'Prevence';
    case 'core': return 'Core';
    case 'run': return 'Kardio';
    case 'superset': return 'Superset';
    default: return category;
  }
}
export function estimate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

// ============================================================
// WARM-UP SERIES BY WEEK (Zatsiorsky protocol, s. 94)
// Přesně rozpočítáno z dokumentu v4 pro každý týden a každý hlavní lift
// Struktura: tyč (20 kg)×8 → ~40% → ~60% → ~75% → pracovní váha
// DO DENÍKU SE ZAPISUJÍ JEN PRACOVNÍ SÉRIE
// ============================================================
export const WARMUP_SERIES_BY_WEEK: Record<number, WarmupSeries> = {
  1: { squat: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 65, reps: 5, note: '~40%' }, { weight: 97.5, reps: 3, note: '~60%' }, { weight: 122.5, reps: 2, note: '~75%' } ], bench: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 45, reps: 5, note: '~40%' }, { weight: 67.5, reps: 3, note: '~60%' }, { weight: 85, reps: 2, note: '~75%' } ], deadlift: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 80, reps: 5, note: '~40%' }, { weight: 122.5, reps: 3, note: '~60%' }, { weight: 152.5, reps: 2, note: '~75%' } ] },
  2: { squat: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 67.5, reps: 5, note: '~40%' }, { weight: 100, reps: 3, note: '~60%' }, { weight: 125, reps: 2, note: '~75%' } ], bench: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 45, reps: 5, note: '~40%' }, { weight: 70, reps: 3, note: '~60%' }, { weight: 85, reps: 2, note: '~75%' } ], deadlift: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 82.5, reps: 5, note: '~40%' }, { weight: 125, reps: 3, note: '~60%' }, { weight: 155, reps: 2, note: '~75%' } ] },
  3: { squat: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 67.5, reps: 5, note: '~40%' }, { weight: 102.5, reps: 3, note: '~60%' }, { weight: 127.5, reps: 2, note: '~75%' } ], bench: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 47.5, reps: 5, note: '~40%' }, { weight: 70, reps: 3, note: '~60%' }, { weight: 87.5, reps: 2, note: '~75%' } ], deadlift: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 85, reps: 5, note: '~40%' }, { weight: 127.5, reps: 3, note: '~60%' }, { weight: 160, reps: 2, note: '~75%' } ] },
  4: { squat: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 52.5, reps: 5, note: '~40%' }, { weight: 80, reps: 3, note: '~60%' }, { weight: 100, reps: 2, note: '~75%' } ], bench: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 37.5, reps: 5, note: '~40%' }, { weight: 55, reps: 3, note: '~60%' }, { weight: 70, reps: 2, note: '~75%' } ], deadlift: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 65, reps: 5, note: '~40%' }, { weight: 100, reps: 3, note: '~60%' }, { weight: 125, reps: 2, note: '~75%' } ] },
  5: { squat: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 65, reps: 5, note: '~40%' }, { weight: 100, reps: 3, note: '~60%' }, { weight: 125, reps: 2, note: '~75%' } ], bench: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 45, reps: 5, note: '~40%' }, { weight: 67.5, reps: 3, note: '~60%' }, { weight: 85, reps: 2, note: '~75%' } ], deadlift: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 82.5, reps: 5, note: '~40%' }, { weight: 122.5, reps: 3, note: '~60%' }, { weight: 155, reps: 2, note: '~75%' } ] },
  6: { squat: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 67.5, reps: 5, note: '~40%' }, { weight: 100, reps: 3, note: '~60%' }, { weight: 125, reps: 2, note: '~75%' } ], bench: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 45, reps: 5, note: '~40%' }, { weight: 70, reps: 3, note: '~60%' }, { weight: 85, reps: 2, note: '~75%' } ], deadlift: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 85, reps: 5, note: '~40%' }, { weight: 125, reps: 3, note: '~60%' }, { weight: 157.5, reps: 2, note: '~75%' } ] },
  7: { squat: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 70, reps: 5, note: '~40%' }, { weight: 102.5, reps: 3, note: '~60%' }, { weight: 130, reps: 2, note: '~75%' } ], bench: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 47.5, reps: 5, note: '~40%' }, { weight: 70, reps: 3, note: '~60%' }, { weight: 87.5, reps: 2, note: '~75%' } ], deadlift: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 85, reps: 5, note: '~40%' }, { weight: 130, reps: 3, note: '~60%' }, { weight: 160, reps: 2, note: '~75%' } ] },
  8: { squat: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 57.5, reps: 5, note: '~40%' }, { weight: 85, reps: 3, note: '~60%' }, { weight: 107.5, reps: 2, note: '~75%' } ], bench: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 40, reps: 5, note: '~40%' }, { weight: 57.5, reps: 3, note: '~60%' }, { weight: 72.5, reps: 2, note: '~75%' } ], deadlift: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 70, reps: 5, note: '~40%' }, { weight: 107.5, reps: 3, note: '~60%' }, { weight: 132.5, reps: 2, note: '~75%' } ] },
  9: { squat: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 70, reps: 5, note: '~40%' }, { weight: 102.5, reps: 3, note: '~60%' }, { weight: 130, reps: 2, note: '~75%' } ], bench: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 47.5, reps: 5, note: '~40%' }, { weight: 70, reps: 3, note: '~60%' }, { weight: 87.5, reps: 2, note: '~75%' } ], deadlift: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 85, reps: 5, note: '~40%' }, { weight: 130, reps: 3, note: '~60%' }, { weight: 160, reps: 2, note: '~75%' } ] },
  10: { squat: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 70, reps: 5, note: '~40%' }, { weight: 105, reps: 3, note: '~60%' }, { weight: 130, reps: 2, note: '~75%' } ], bench: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 47.5, reps: 5, note: '~40%' }, { weight: 72.5, reps: 3, note: '~60%' }, { weight: 90, reps: 2, note: '~75%' } ], deadlift: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 87.5, reps: 5, note: '~40%' }, { weight: 130, reps: 3, note: '~60%' }, { weight: 162.5, reps: 2, note: '~75%' } ] },
  11: { squat: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 72.5, reps: 5, note: '~40%' }, { weight: 107.5, reps: 3, note: '~60%' }, { weight: 135, reps: 2, note: '~75%' } ], bench: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 50, reps: 5, note: '~40%' }, { weight: 72.5, reps: 3, note: '~60%' }, { weight: 92.5, reps: 2, note: '~75%' } ], deadlift: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 90, reps: 5, note: '~40%' }, { weight: 132.5, reps: 3, note: '~60%' }, { weight: 167.5, reps: 2, note: '~75%' } ] },
  12: { squat: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 67.5, reps: 5, note: '~40%' }, { weight: 100, reps: 3, note: '~60%' }, { weight: 125, reps: 2, note: '~75%' } ], bench: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 45, reps: 5, note: '~40%' }, { weight: 70, reps: 3, note: '~60%' }, { weight: 85, reps: 2, note: '~75%' } ], deadlift: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 82.5, reps: 5, note: '~40%' }, { weight: 125, reps: 3, note: '~60%' }, { weight: 155, reps: 2, note: '~75%' } ] },
  13: { squat: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 77.5, reps: 5, note: '~40%' }, { weight: 117.5, reps: 3, note: '~60%' }, { weight: 145, reps: 2, note: '~75%' } ], bench: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 52.5, reps: 5, note: '~40%' }, { weight: 80, reps: 3, note: '~60%' }, { weight: 100, reps: 2, note: '~75%' } ], deadlift: [ { weight: 20, reps: 8, note: 'Tyč' }, { weight: 95, reps: 5, note: '~40%' }, { weight: 140, reps: 3, note: '~60%' }, { weight: 175, reps: 2, note: '~75%' } ] },
};

// ============================================================
// PŘEDVYPLNĚNÝ DENÍK – všechny plánované série (13 týdnů)
// planned: true = jen návrh z plánu. Uprav váhu/opakování a záznam se stane skutečným.
// ============================================================
export const PLANNED_RECORDS: RecordsMap = {
  'ab-wheel': [
    { id: 'plan-w1-po-ab-wheel', date: '2026-08-18', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T1 · 3 × 10–12 · vlastní', planned: true },
    { id: 'plan-w1-ut-ab-wheel', date: '2026-08-19', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T1 · 3 × 10–12 · vlastní', planned: true },
    { id: 'plan-w2-po-ab-wheel', date: '2026-08-25', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T2 · 3 × 10–12 · vlastní', planned: true },
    { id: 'plan-w2-ut-ab-wheel', date: '2026-08-26', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T2 · 3 × 10–12 · vlastní', planned: true },
    { id: 'plan-w3-po-ab-wheel', date: '2026-09-01', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T3 · 3 × 10–12 · vlastní', planned: true },
    { id: 'plan-w3-ut-ab-wheel', date: '2026-09-02', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T3 · 3 × 10–12 · vlastní', planned: true },
    { id: 'plan-w4-po-ab-wheel', date: '2026-09-08', sets: '2', weight: '0', reps: '10', note: '📋 Plán T4 · 2 × 10 · vlastní', planned: true },
    { id: 'plan-w4-ut-ab-wheel', date: '2026-09-09', sets: '2', weight: '0', reps: '10', note: '📋 Plán T4 · 2 × 10 · vlastní', planned: true },
    { id: 'plan-w5-po-ab-wheel', date: '2026-09-15', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T5 · 3 × 10–12 · vlastní', planned: true },
    { id: 'plan-w5-ut-ab-wheel', date: '2026-09-16', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T5 · 3 × 10–12 · vlastní', planned: true },
    { id: 'plan-w6-po-ab-wheel', date: '2026-09-22', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T6 · 3 × 10–12 · vlastní', planned: true },
    { id: 'plan-w6-ut-ab-wheel', date: '2026-09-23', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T6 · 3 × 10–12 · vlastní', planned: true },
    { id: 'plan-w7-po-ab-wheel', date: '2026-09-29', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T7 · 3 × 10–12 · vlastní', planned: true },
    { id: 'plan-w7-ut-ab-wheel', date: '2026-09-30', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T7 · 3 × 10–12 · vlastní', planned: true },
    { id: 'plan-w8-po-ab-wheel', date: '2026-10-06', sets: '2', weight: '0', reps: '10', note: '📋 Plán T8 · 2 × 10 · vlastní', planned: true },
    { id: 'plan-w8-ut-ab-wheel', date: '2026-10-07', sets: '2', weight: '0', reps: '10', note: '📋 Plán T8 · 2 × 10 · vlastní', planned: true },
    { id: 'plan-w9-po-ab-wheel', date: '2026-10-13', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T9 · 3 × 10–12 · vlastní', planned: true },
    { id: 'plan-w9-ut-ab-wheel', date: '2026-10-14', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T9 · 3 × 10–12 · vlastní', planned: true },
    { id: 'plan-w10-po-ab-wheel', date: '2026-10-20', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T10 · 3 × 10–12 · vlastní', planned: true },
    { id: 'plan-w10-ut-ab-wheel', date: '2026-10-21', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T10 · 3 × 10–12 · vlastní', planned: true },
    { id: 'plan-w11-po-ab-wheel', date: '2026-10-27', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T11 · 3 × 10–12 · vlastní', planned: true },
    { id: 'plan-w11-ut-ab-wheel', date: '2026-10-28', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T11 · 3 × 10–12 · vlastní', planned: true },
    { id: 'plan-w12-po-ab-wheel', date: '2026-11-03', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T12 · 3 × 10–12 · vlastní', planned: true },
    { id: 'plan-w12-ut-ab-wheel', date: '2026-11-04', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T12 · 3 × 10–12 · vlastní', planned: true },
  ],
  'ab-wheel-dl': [
    { id: 'plan-w1-pa-ab-wheel-dl', date: '2026-08-22', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T1 · 3 × 10–12 · vlastní', planned: true },
    { id: 'plan-w2-pa-ab-wheel-dl', date: '2026-08-29', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T2 · 3 × 10–12 · vlastní', planned: true },
    { id: 'plan-w3-pa-ab-wheel-dl', date: '2026-09-05', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T3 · 3 × 10–12 · vlastní', planned: true },
    { id: 'plan-w4-pa-ab-wheel-dl', date: '2026-09-12', sets: '2', weight: '0', reps: '10', note: '📋 Plán T4 · 2 × 10 · vlastní', planned: true },
    { id: 'plan-w5-pa-ab-wheel-dl', date: '2026-09-19', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T5 · 3 × 10–12 · vlastní', planned: true },
    { id: 'plan-w6-pa-ab-wheel-dl', date: '2026-09-26', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T6 · 3 × 10–12 · vlastní', planned: true },
    { id: 'plan-w7-pa-ab-wheel-dl', date: '2026-10-03', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T7 · 3 × 10–12 · vlastní', planned: true },
    { id: 'plan-w8-pa-ab-wheel-dl', date: '2026-10-10', sets: '2', weight: '0', reps: '10', note: '📋 Plán T8 · 2 × 10 · vlastní', planned: true },
    { id: 'plan-w9-pa-ab-wheel-dl', date: '2026-10-17', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T9 · 3 × 10–12 · vlastní', planned: true },
    { id: 'plan-w10-pa-ab-wheel-dl', date: '2026-10-24', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T10 · 3 × 10–12 · vlastní', planned: true },
    { id: 'plan-w11-pa-ab-wheel-dl', date: '2026-10-31', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T11 · 3 × 10–12 · vlastní', planned: true },
    { id: 'plan-w12-pa-ab-wheel-dl', date: '2026-11-07', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T12 · 3 × 10–12 · vlastní', planned: true },
  ],
  'barbell-row': [
    { id: 'plan-w1-pa-barbell-row', date: '2026-08-22', sets: '3', weight: '82.5', reps: '8–10', note: '📋 Plán T1 · 3 × 8–10', planned: true },
    { id: 'plan-w2-pa-barbell-row', date: '2026-08-29', sets: '3', weight: '82.5', reps: '8–10', note: '📋 Plán T2 · 3 × 8–10', planned: true },
    { id: 'plan-w3-pa-barbell-row', date: '2026-09-05', sets: '4', weight: '97.5', reps: '5', note: '📋 Plán T3 · 4 × 5', planned: true },
    { id: 'plan-w4-pa-barbell-row', date: '2026-09-12', sets: '2', weight: '72.5', reps: '8', note: '📋 Plán T4 · 2 × 8', planned: true },
  ],
  'bench': [
    { id: 'plan-w1-ut-bench-0', date: '2026-08-19', sets: '1', weight: '100', reps: '8', note: '📋 Plán T1 · Objemová · RPE 7-8', planned: true },
    { id: 'plan-w1-ut-bench-1', date: '2026-08-19', sets: '1', weight: '112.5', reps: '3', note: '📋 Plán T1 · OVERLOAD · RPE 8', planned: true },
    { id: 'plan-w1-ut-bench-2', date: '2026-08-19', sets: '1', weight: '105', reps: '6', note: '📋 Plán T1 · Back-off · RPE 7-8', planned: true },
    { id: 'plan-w1-ut-bench-3', date: '2026-08-19', sets: '1', weight: '105', reps: '6', note: '📋 Plán T1 · Back-off · RPE 7-8', planned: true },
    { id: 'plan-w2-ut-bench-0', date: '2026-08-26', sets: '1', weight: '102.5', reps: '8', note: '📋 Plán T2 · Objemová · RPE 8', planned: true },
    { id: 'plan-w2-ut-bench-1', date: '2026-08-26', sets: '1', weight: '115', reps: '2', note: '📋 Plán T2 · OVERLOAD · RPE 8', planned: true },
    { id: 'plan-w2-ut-bench-2', date: '2026-08-26', sets: '1', weight: '107.5', reps: '6', note: '📋 Plán T2 · Back-off · RPE 8', planned: true },
    { id: 'plan-w2-ut-bench-3', date: '2026-08-26', sets: '1', weight: '107.5', reps: '5', note: '📋 Plán T2 · Back-off · RPE 8', planned: true },
    { id: 'plan-w3-ut-bench-0', date: '2026-09-02', sets: '1', weight: '105', reps: '6', note: '📋 Plán T3 · Objemová · RPE 8', planned: true },
    { id: 'plan-w3-ut-bench-1', date: '2026-09-02', sets: '1', weight: '117.5', reps: '2', note: '📋 Plán T3 · OVERLOAD · RPE 8-9', planned: true },
    { id: 'plan-w3-ut-bench-2', date: '2026-09-02', sets: '1', weight: '110', reps: '6', note: '📋 Plán T3 · Back-off · RPE 8', planned: true },
    { id: 'plan-w3-ut-bench-3', date: '2026-09-02', sets: '1', weight: '110', reps: '5', note: '📋 Plán T3 · Back-off · RPE 8', planned: true },
    { id: 'plan-w4-ut-bench-0', date: '2026-09-09', sets: '1', weight: '90', reps: '5', note: '📋 Plán T4 · Deload · RPE 6', planned: true },
    { id: 'plan-w4-ut-bench-1', date: '2026-09-09', sets: '1', weight: '90', reps: '5', note: '📋 Plán T4 · Deload · RPE 6', planned: true },
    { id: 'plan-w4-ut-bench-2', date: '2026-09-09', sets: '1', weight: '92.5', reps: '5', note: '📋 Plán T4 · Deload · RPE 6-7', planned: true },
    { id: 'plan-w5-ut-bench-0', date: '2026-09-16', sets: '1', weight: '107.5', reps: '5', note: '📋 Plán T5 · TOP · RPE 8', planned: true },
    { id: 'plan-w5-ut-bench-1', date: '2026-09-16', sets: '1', weight: '112.5', reps: '3', note: '📋 Plán T5 · OVERLOAD · RPE 8-9', planned: true },
    { id: 'plan-w5-ut-bench-2', date: '2026-09-16', sets: '1', weight: '105', reps: '5', note: '📋 Plán T5 · Back-off · RPE 8', planned: true },
    { id: 'plan-w5-ut-bench-3', date: '2026-09-16', sets: '1', weight: '105', reps: '5', note: '📋 Plán T5 · Back-off · RPE 8', planned: true },
    { id: 'plan-w6-ut-bench-0', date: '2026-09-23', sets: '1', weight: '110', reps: '4', note: '📋 Plán T6 · TOP · RPE 8', planned: true },
    { id: 'plan-w6-ut-bench-1', date: '2026-09-23', sets: '1', weight: '115', reps: '2', note: '📋 Plán T6 · OVERLOAD · RPE 9', planned: true },
    { id: 'plan-w6-ut-bench-2', date: '2026-09-23', sets: '1', weight: '107.5', reps: '5', note: '📋 Plán T6 · Back-off · RPE 8', planned: true },
    { id: 'plan-w6-ut-bench-3', date: '2026-09-23', sets: '1', weight: '107.5', reps: '4', note: '📋 Plán T6 · Back-off · RPE 8', planned: true },
    { id: 'plan-w7-ut-bench-0', date: '2026-09-30', sets: '1', weight: '115', reps: '3', note: '📋 Plán T7 · TOP · RPE 8-9', planned: true },
    { id: 'plan-w7-ut-bench-1', date: '2026-09-30', sets: '1', weight: '117.5', reps: '2', note: '📋 Plán T7 · OVERLOAD · RPE 9', planned: true },
    { id: 'plan-w7-ut-bench-2', date: '2026-09-30', sets: '1', weight: '107.5', reps: '4', note: '📋 Plán T7 · Back-off · RPE 8', planned: true },
    { id: 'plan-w7-ut-bench-3', date: '2026-09-30', sets: '1', weight: '107.5', reps: '4', note: '📋 Plán T7 · Back-off · RPE 8', planned: true },
    { id: 'plan-w8-ut-bench-0', date: '2026-10-07', sets: '1', weight: '95', reps: '3', note: '📋 Plán T8 · Deload · RPE 6-7', planned: true },
    { id: 'plan-w8-ut-bench-1', date: '2026-10-07', sets: '1', weight: '95', reps: '3', note: '📋 Plán T8 · Deload · RPE 6-7', planned: true },
    { id: 'plan-w8-ut-bench-2', date: '2026-10-07', sets: '1', weight: '97.5', reps: '3', note: '📋 Plán T8 · Deload · RPE 7', planned: true },
    { id: 'plan-w9-ut-bench-0', date: '2026-10-14', sets: '1', weight: '112.5', reps: '3', note: '📋 Plán T9 · Nájezd · RPE 8', planned: true },
    { id: 'plan-w9-ut-bench-1', date: '2026-10-14', sets: '1', weight: '117.5', reps: '2', note: '📋 Plán T9 · TOP · RPE 9', planned: true },
    { id: 'plan-w9-ut-bench-2', date: '2026-10-14', sets: '1', weight: '107.5', reps: '5', note: '📋 Plán T9 · Back-off · RPE 8', planned: true },
    { id: 'plan-w9-ut-bench-3', date: '2026-10-14', sets: '1', weight: '107.5', reps: '5', note: '📋 Plán T9 · Back-off · RPE 8', planned: true },
    { id: 'plan-w10-ut-bench-0', date: '2026-10-21', sets: '1', weight: '115', reps: '2', note: '📋 Plán T10 · Nájezd · RPE 8', planned: true },
    { id: 'plan-w10-ut-bench-1', date: '2026-10-21', sets: '1', weight: '120', reps: '1', note: '📋 Plán T10 · TOP single · RPE 9', planned: true },
    { id: 'plan-w10-ut-bench-2', date: '2026-10-21', sets: '1', weight: '110', reps: '4', note: '📋 Plán T10 · Back-off · RPE 8', planned: true },
    { id: 'plan-w10-ut-bench-3', date: '2026-10-21', sets: '1', weight: '110', reps: '3', note: '📋 Plán T10 · Back-off · RPE 8', planned: true },
    { id: 'plan-w11-ut-bench-0', date: '2026-10-28', sets: '1', weight: '117.5', reps: '2', note: '📋 Plán T11 · Nájezd · RPE 8-9', planned: true },
    { id: 'plan-w11-ut-bench-1', date: '2026-10-28', sets: '1', weight: '122.5', reps: '1', note: '📋 Plán T11 · TOP single · RPE 9', planned: true },
    { id: 'plan-w11-ut-bench-2', date: '2026-10-28', sets: '1', weight: '112.5', reps: '3', note: '📋 Plán T11 · Back-off · RPE 8', planned: true },
    { id: 'plan-w11-ut-bench-3', date: '2026-10-28', sets: '1', weight: '112.5', reps: '3', note: '📋 Plán T11 · Back-off · RPE 8', planned: true },
    { id: 'plan-w12-ut-bench-0', date: '2026-11-04', sets: '1', weight: '115', reps: '1', note: '📋 Plán T12 · Opener · RPE 7', planned: true },
    { id: 'plan-w12-ut-bench-1', date: '2026-11-04', sets: '1', weight: '107.5', reps: '2', note: '📋 Plán T12 · Druhá · RPE 7', planned: true },
    { id: 'plan-w12-ut-bench-2', date: '2026-11-04', sets: '1', weight: '102.5', reps: '3', note: '📋 Plán T12 · Objem · RPE 7', planned: true },
    { id: 'plan-w13-ut-bench-0', date: '2026-11-11', sets: '1', weight: '100', reps: '1', note: '📋 Plán T13 · Rozjezd', planned: true },
    { id: 'plan-w13-ut-bench-1', date: '2026-11-11', sets: '1', weight: '115', reps: '1', note: '📋 Plán T13 · Rozjezd', planned: true },
    { id: 'plan-w13-ut-bench-2', date: '2026-11-11', sets: '1', weight: '125', reps: '1', note: '📋 Plán T13 · Rozjezd', planned: true },
    { id: 'plan-w13-ut-bench-3', date: '2026-11-11', sets: '1', weight: '130', reps: '1', note: '📋 Plán T13 · CÍL', planned: true },
    { id: 'plan-w13-ut-bench-4', date: '2026-11-11', sets: '1', weight: '132.5', reps: '1', note: '📋 Plán T13 · PR (volitelně)', planned: true },
  ],
  'bicep-curl': [
    { id: 'plan-w1-ut-bicep-curl', date: '2026-08-19', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T1 · 3 × 10–12 · střední', planned: true },
    { id: 'plan-w2-ut-bicep-curl', date: '2026-08-26', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T2 · 3 × 10–12 · střední', planned: true },
    { id: 'plan-w3-ut-bicep-curl', date: '2026-09-02', sets: '3', weight: '0', reps: '6–8', note: '📋 Plán T3 · 3 × 6–8 · střední', planned: true },
    { id: 'plan-w5-ut-bicep-curl', date: '2026-09-16', sets: '3', weight: '0', reps: '6–8', note: '📋 Plán T5 · 3 × 6–8 · střední', planned: true },
    { id: 'plan-w6-ut-bicep-curl', date: '2026-09-23', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T6 · 3 × 10–12 · střední', planned: true },
    { id: 'plan-w7-ut-bicep-curl', date: '2026-09-30', sets: '3', weight: '0', reps: '6–8', note: '📋 Plán T7 · 3 × 6–8 · střední', planned: true },
    { id: 'plan-w9-ut-bicep-curl', date: '2026-10-14', sets: '3', weight: '0', reps: '6–8', note: '📋 Plán T9 · 3 × 6–8 · střední', planned: true },
    { id: 'plan-w10-ut-bicep-curl', date: '2026-10-21', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T10 · 3 × 10–12 · střední', planned: true },
    { id: 'plan-w11-ut-bicep-curl', date: '2026-10-28', sets: '3', weight: '0', reps: '6–8', note: '📋 Plán T11 · 3 × 6–8 · střední', planned: true },
    { id: 'plan-w12-ut-bicep-curl', date: '2026-11-04', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T12 · 3 × 10–12 · střední', planned: true },
  ],
  'bicep-curl-2': [
    { id: 'plan-w1-pa-bicep-curl-2', date: '2026-08-22', sets: '3', weight: '0', reps: '8–10', note: '📋 Plán T1 · 3 × 8–10 · střední', planned: true },
    { id: 'plan-w2-pa-bicep-curl-2', date: '2026-08-29', sets: '3', weight: '0', reps: '8–10', note: '📋 Plán T2 · 3 × 8–10 · střední', planned: true },
    { id: 'plan-w3-pa-bicep-curl-2', date: '2026-09-05', sets: '3', weight: '0', reps: '8–10', note: '📋 Plán T3 · 3 × 8–10 · střední', planned: true },
    { id: 'plan-w5-pa-bicep-curl-2', date: '2026-09-19', sets: '3', weight: '0', reps: '8–10', note: '📋 Plán T5 · 3 × 8–10 · střední', planned: true },
    { id: 'plan-w6-pa-bicep-curl-2', date: '2026-09-26', sets: '3', weight: '0', reps: '8–10', note: '📋 Plán T6 · 3 × 8–10 · střední', planned: true },
    { id: 'plan-w7-pa-bicep-curl-2', date: '2026-10-03', sets: '3', weight: '0', reps: '8–10', note: '📋 Plán T7 · 3 × 8–10 · střední', planned: true },
    { id: 'plan-w9-pa-bicep-curl-2', date: '2026-10-17', sets: '3', weight: '0', reps: '8–10', note: '📋 Plán T9 · 3 × 8–10 · střední', planned: true },
    { id: 'plan-w10-pa-bicep-curl-2', date: '2026-10-24', sets: '3', weight: '0', reps: '8–10', note: '📋 Plán T10 · 3 × 8–10 · střední', planned: true },
    { id: 'plan-w11-pa-bicep-curl-2', date: '2026-10-31', sets: '3', weight: '0', reps: '8–10', note: '📋 Plán T11 · 3 × 8–10 · střední', planned: true },
    { id: 'plan-w12-pa-bicep-curl-2', date: '2026-11-07', sets: '3', weight: '0', reps: '8–10', note: '📋 Plán T12 · 3 × 8–10 · střední', planned: true },
  ],
  'bulgarian': [
    { id: 'plan-w1-po-bulgarian', date: '2026-08-18', sets: '3', weight: '0', reps: '8–10/nohu', note: '📋 Plán T1 · 3 × 8–10/nohu · 2× činka střední', planned: true },
    { id: 'plan-w2-po-bulgarian', date: '2026-08-25', sets: '3', weight: '0', reps: '8–10/nohu', note: '📋 Plán T2 · 3 × 8–10/nohu · 2× činka střední', planned: true },
    { id: 'plan-w3-po-bulgarian', date: '2026-09-01', sets: '3', weight: '0', reps: '6/nohu', note: '📋 Plán T3 · 3 × 6/nohu · 2× činka střední', planned: true },
  ],
  'chest-supported-row': [
    { id: 'plan-w5-pa-chest-supported-row', date: '2026-09-19', sets: '4', weight: '0', reps: '5', note: '📋 Plán T5 · 4 × 5 · stroj těžká', planned: true },
    { id: 'plan-w6-pa-chest-supported-row', date: '2026-09-26', sets: '3', weight: '0', reps: '8–10', note: '📋 Plán T6 · 3 × 8–10 · stroj střední', planned: true },
    { id: 'plan-w7-pa-chest-supported-row', date: '2026-10-03', sets: '4', weight: '0', reps: '5', note: '📋 Plán T7 · 4 × 5 · stroj těžká', planned: true },
    { id: 'plan-w8-pa-chest-supported-row', date: '2026-10-10', sets: '2', weight: '0', reps: '8', note: '📋 Plán T8 · 2 × 8 · stroj lehká', planned: true },
  ],
  'deadlift': [
    { id: 'plan-w1-pa-deadlift-0', date: '2026-08-22', sets: '1', weight: '180', reps: '8', note: '📋 Plán T1 · Objemová · RPE 7-8', planned: true },
    { id: 'plan-w1-pa-deadlift-1', date: '2026-08-22', sets: '1', weight: '202.5', reps: '3', note: '📋 Plán T1 · OVERLOAD · RPE 8', planned: true },
    { id: 'plan-w1-pa-deadlift-2', date: '2026-08-22', sets: '1', weight: '190', reps: '6', note: '📋 Plán T1 · Back-off · RPE 7-8', planned: true },
    { id: 'plan-w2-pa-deadlift-0', date: '2026-08-29', sets: '1', weight: '185', reps: '8', note: '📋 Plán T2 · Objemová · RPE 8', planned: true },
    { id: 'plan-w2-pa-deadlift-1', date: '2026-08-29', sets: '1', weight: '207.5', reps: '2', note: '📋 Plán T2 · OVERLOAD · RPE 8', planned: true },
    { id: 'plan-w2-pa-deadlift-2', date: '2026-08-29', sets: '1', weight: '195', reps: '6', note: '📋 Plán T2 · Back-off · RPE 8', planned: true },
    { id: 'plan-w3-pa-deadlift-0', date: '2026-09-05', sets: '1', weight: '187.5', reps: '6', note: '📋 Plán T3 · Objemová · RPE 8', planned: true },
    { id: 'plan-w3-pa-deadlift-1', date: '2026-09-05', sets: '1', weight: '212.5', reps: '2', note: '📋 Plán T3 · OVERLOAD · RPE 8-9', planned: true },
    { id: 'plan-w3-pa-deadlift-2', date: '2026-09-05', sets: '1', weight: '197.5', reps: '6', note: '📋 Plán T3 · Back-off · RPE 8', planned: true },
    { id: 'plan-w4-pa-deadlift-0', date: '2026-09-12', sets: '1', weight: '160', reps: '5', note: '📋 Plán T4 · Deload · RPE 6', planned: true },
    { id: 'plan-w4-pa-deadlift-1', date: '2026-09-12', sets: '1', weight: '160', reps: '5', note: '📋 Plán T4 · Deload · RPE 6', planned: true },
    { id: 'plan-w4-pa-deadlift-2', date: '2026-09-12', sets: '1', weight: '165', reps: '5', note: '📋 Plán T4 · Deload · RPE 6-7', planned: true },
    { id: 'plan-w5-pa-deadlift-0', date: '2026-09-19', sets: '1', weight: '195', reps: '5', note: '📋 Plán T5 · TOP · RPE 8', planned: true },
    { id: 'plan-w5-pa-deadlift-1', date: '2026-09-19', sets: '1', weight: '205', reps: '3', note: '📋 Plán T5 · OVERLOAD · RPE 8-9', planned: true },
    { id: 'plan-w5-pa-deadlift-2', date: '2026-09-19', sets: '1', weight: '187.5', reps: '5', note: '📋 Plán T5 · Back-off · RPE 8', planned: true },
    { id: 'plan-w6-pa-deadlift-0', date: '2026-09-26', sets: '1', weight: '200', reps: '4', note: '📋 Plán T6 · TOP · RPE 8', planned: true },
    { id: 'plan-w6-pa-deadlift-1', date: '2026-09-26', sets: '1', weight: '210', reps: '2', note: '📋 Plán T6 · OVERLOAD · RPE 9', planned: true },
    { id: 'plan-w6-pa-deadlift-2', date: '2026-09-26', sets: '1', weight: '192.5', reps: '5', note: '📋 Plán T6 · Back-off · RPE 8', planned: true },
    { id: 'plan-w7-pa-deadlift-0', date: '2026-10-03', sets: '1', weight: '207.5', reps: '3', note: '📋 Plán T7 · TOP · RPE 8-9', planned: true },
    { id: 'plan-w7-pa-deadlift-1', date: '2026-10-03', sets: '1', weight: '215', reps: '2', note: '📋 Plán T7 · OVERLOAD · RPE 9', planned: true },
    { id: 'plan-w7-pa-deadlift-2', date: '2026-10-03', sets: '1', weight: '195', reps: '4', note: '📋 Plán T7 · Back-off · RPE 8', planned: true },
    { id: 'plan-w8-pa-deadlift-0', date: '2026-10-10', sets: '1', weight: '172.5', reps: '3', note: '📋 Plán T8 · Deload · RPE 6-7', planned: true },
    { id: 'plan-w8-pa-deadlift-1', date: '2026-10-10', sets: '1', weight: '172.5', reps: '3', note: '📋 Plán T8 · Deload · RPE 6-7', planned: true },
    { id: 'plan-w8-pa-deadlift-2', date: '2026-10-10', sets: '1', weight: '177.5', reps: '3', note: '📋 Plán T8 · Deload · RPE 7', planned: true },
    { id: 'plan-w9-pa-deadlift-0', date: '2026-10-17', sets: '1', weight: '202.5', reps: '3', note: '📋 Plán T9 · Nájezd · RPE 8', planned: true },
    { id: 'plan-w9-pa-deadlift-1', date: '2026-10-17', sets: '1', weight: '215', reps: '2', note: '📋 Plán T9 · TOP · RPE 9', planned: true },
    { id: 'plan-w9-pa-deadlift-2', date: '2026-10-17', sets: '1', weight: '195', reps: '5', note: '📋 Plán T9 · Back-off · RPE 8', planned: true },
    { id: 'plan-w10-pa-deadlift-0', date: '2026-10-24', sets: '1', weight: '207.5', reps: '2', note: '📋 Plán T10 · Nájezd · RPE 8', planned: true },
    { id: 'plan-w10-pa-deadlift-1', date: '2026-10-24', sets: '1', weight: '217.5', reps: '1', note: '📋 Plán T10 · TOP single · RPE 9', planned: true },
    { id: 'plan-w10-pa-deadlift-2', date: '2026-10-24', sets: '1', weight: '200', reps: '4', note: '📋 Plán T10 · Back-off · RPE 8', planned: true },
    { id: 'plan-w11-pa-deadlift-0', date: '2026-10-31', sets: '1', weight: '212.5', reps: '2', note: '📋 Plán T11 · Nájezd · RPE 8-9', planned: true },
    { id: 'plan-w11-pa-deadlift-1', date: '2026-10-31', sets: '1', weight: '222.5', reps: '1', note: '📋 Plán T11 · TOP single · RPE 9', planned: true },
    { id: 'plan-w11-pa-deadlift-2', date: '2026-10-31', sets: '1', weight: '202.5', reps: '3', note: '📋 Plán T11 · Back-off · RPE 8', planned: true },
    { id: 'plan-w12-pa-deadlift-0', date: '2026-11-07', sets: '1', weight: '207.5', reps: '1', note: '📋 Plán T12 · Opener · RPE 7', planned: true },
    { id: 'plan-w12-pa-deadlift-1', date: '2026-11-07', sets: '1', weight: '195', reps: '2', note: '📋 Plán T12 · Druhá · RPE 7', planned: true },
    { id: 'plan-w12-pa-deadlift-2', date: '2026-11-07', sets: '1', weight: '185', reps: '3', note: '📋 Plán T12 · Objem · RPE 7', planned: true },
    { id: 'plan-w13-pa-deadlift-0', date: '2026-11-14', sets: '1', weight: '180', reps: '1', note: '📋 Plán T13 · Rozjezd', planned: true },
    { id: 'plan-w13-pa-deadlift-1', date: '2026-11-14', sets: '1', weight: '207.5', reps: '1', note: '📋 Plán T13 · Rozjezd', planned: true },
    { id: 'plan-w13-pa-deadlift-2', date: '2026-11-14', sets: '1', weight: '230', reps: '1', note: '📋 Plán T13 · CÍL', planned: true },
    { id: 'plan-w13-pa-deadlift-3', date: '2026-11-14', sets: '1', weight: '235', reps: '1', note: '📋 Plán T13 · PR pokus', planned: true },
  ],
  'face-pulls': [
    { id: 'plan-w1-ut-face-pulls', date: '2026-08-19', sets: '3', weight: '0', reps: '15–20', note: '📋 Plán T1 · 3 × 15–20 · lehká', planned: true },
    { id: 'plan-w2-ut-face-pulls', date: '2026-08-26', sets: '3', weight: '0', reps: '15–20', note: '📋 Plán T2 · 3 × 15–20 · lehká', planned: true },
    { id: 'plan-w4-ut-face-pulls', date: '2026-09-09', sets: '3', weight: '0', reps: '15', note: '📋 Plán T4 · 3 × 15 · lehká', planned: true },
    { id: 'plan-w6-ut-face-pulls', date: '2026-09-23', sets: '3', weight: '0', reps: '15–20', note: '📋 Plán T6 · 3 × 15–20 · lehká', planned: true },
    { id: 'plan-w8-ut-face-pulls', date: '2026-10-07', sets: '3', weight: '0', reps: '15', note: '📋 Plán T8 · 3 × 15 · lehká', planned: true },
    { id: 'plan-w10-ut-face-pulls', date: '2026-10-21', sets: '3', weight: '0', reps: '15–20', note: '📋 Plán T10 · 3 × 15–20 · lehká', planned: true },
    { id: 'plan-w12-ut-face-pulls', date: '2026-11-04', sets: '3', weight: '0', reps: '15–20', note: '📋 Plán T12 · 3 × 15–20 · lehká', planned: true },
  ],
  'ghd': [
    { id: 'plan-w5-pa-ghd', date: '2026-09-19', sets: '3', weight: '0', reps: '4–6', note: '📋 Plán T5 · 3 × 4–6 · vlastní', planned: true },
    { id: 'plan-w7-pa-ghd', date: '2026-10-03', sets: '3', weight: '0', reps: '4–6', note: '📋 Plán T7 · 3 × 4–6 · vlastní', planned: true },
  ],
  'leg-press': [
    { id: 'plan-w9-po-leg-press', date: '2026-10-13', sets: '4', weight: '0', reps: '6–8', note: '📋 Plán T9 · 4 × 6–8 · stroj střední–těžká, RPE 8', planned: true },
    { id: 'plan-w10-po-leg-press', date: '2026-10-20', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T10 · 3 × 10–12 · stroj střední–těžká, RPE 8', planned: true },
    { id: 'plan-w11-po-leg-press', date: '2026-10-27', sets: '4', weight: '0', reps: '6–8', note: '📋 Plán T11 · 4 × 6–8 · stroj střední–těžká, RPE 8', planned: true },
    { id: 'plan-w12-po-leg-press', date: '2026-11-03', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T12 · 3 × 10–12 · stroj střední–těžká, RPE 8', planned: true },
  ],
  'long-pause-bench': [
    { id: 'plan-w5-ut-long-pause-bench', date: '2026-09-16', sets: '3', weight: '102.5', reps: '4', note: '📋 Plán T5 · 3 × 4', planned: true },
    { id: 'plan-w7-ut-long-pause-bench', date: '2026-09-30', sets: '3', weight: '102.5', reps: '4', note: '📋 Plán T7 · 3 × 4', planned: true },
  ],
  'nordic-curls': [
    { id: 'plan-w3-pa-nordic-curls', date: '2026-09-05', sets: '3', weight: '0', reps: '4–6', note: '📋 Plán T3 · 3 × 4–6 · vlastní', planned: true },
    { id: 'plan-w9-pa-nordic-curls', date: '2026-10-17', sets: '3', weight: '0', reps: '4–6', note: '📋 Plán T9 · 3 × 4–6 · vlastní', planned: true },
    { id: 'plan-w11-pa-nordic-curls', date: '2026-10-31', sets: '3', weight: '0', reps: '4–6', note: '📋 Plán T11 · 3 × 4–6 · vlastní', planned: true },
  ],
  'pallof': [
    { id: 'plan-w1-po-pallof', date: '2026-08-18', sets: '2', weight: '0', reps: '10/str.', note: '📋 Plán T1 · 2 × 10/str. · lehká', planned: true },
    { id: 'plan-w2-po-pallof', date: '2026-08-25', sets: '2', weight: '0', reps: '10/str.', note: '📋 Plán T2 · 2 × 10/str. · lehká', planned: true },
    { id: 'plan-w3-po-pallof', date: '2026-09-01', sets: '2', weight: '0', reps: '10/str.', note: '📋 Plán T3 · 2 × 10/str. · lehká', planned: true },
    { id: 'plan-w5-po-pallof', date: '2026-09-15', sets: '2', weight: '0', reps: '10/str.', note: '📋 Plán T5 · 2 × 10/str. · lehká', planned: true },
    { id: 'plan-w6-po-pallof', date: '2026-09-22', sets: '2', weight: '0', reps: '10/str.', note: '📋 Plán T6 · 2 × 10/str. · lehká', planned: true },
    { id: 'plan-w7-po-pallof', date: '2026-09-29', sets: '2', weight: '0', reps: '10/str.', note: '📋 Plán T7 · 2 × 10/str. · lehká', planned: true },
    { id: 'plan-w9-po-pallof', date: '2026-10-13', sets: '2', weight: '0', reps: '10/str.', note: '📋 Plán T9 · 2 × 10/str. · lehká', planned: true },
    { id: 'plan-w10-po-pallof', date: '2026-10-20', sets: '2', weight: '0', reps: '10/str.', note: '📋 Plán T10 · 2 × 10/str. · lehká', planned: true },
    { id: 'plan-w11-po-pallof', date: '2026-10-27', sets: '2', weight: '0', reps: '10/str.', note: '📋 Plán T11 · 2 × 10/str. · lehká', planned: true },
    { id: 'plan-w12-po-pallof', date: '2026-11-03', sets: '2', weight: '0', reps: '10/str.', note: '📋 Plán T12 · 2 × 10/str. · lehká', planned: true },
  ],
  'pause-squat': [
    { id: 'plan-w1-po-pause-squat', date: '2026-08-18', sets: '3', weight: '132.5', reps: '5', note: '📋 Plán T1 · 3 × 5', planned: true },
    { id: 'plan-w2-po-pause-squat', date: '2026-08-25', sets: '3', weight: '132.5', reps: '5', note: '📋 Plán T2 · 3 × 5', planned: true },
    { id: 'plan-w3-po-pause-squat', date: '2026-09-01', sets: '3', weight: '145', reps: '3', note: '📋 Plán T3 · 3 × 3', planned: true },
    { id: 'plan-w4-po-pause-squat', date: '2026-09-08', sets: '2', weight: '115', reps: '5', note: '📋 Plán T4 · 2 × 5', planned: true },
    { id: 'plan-w8-po-pause-squat', date: '2026-10-06', sets: '2', weight: '125', reps: '3', note: '📋 Plán T8 · 2 × 3', planned: true },
    { id: 'plan-w9-po-pause-squat', date: '2026-10-13', sets: '3', weight: '147.5', reps: '3', note: '📋 Plán T9 · 3 × 3', planned: true },
    { id: 'plan-w10-po-pause-squat', date: '2026-10-20', sets: '3', weight: '137.5', reps: '5', note: '📋 Plán T10 · 3 × 5', planned: true },
    { id: 'plan-w11-po-pause-squat', date: '2026-10-27', sets: '3', weight: '147.5', reps: '3', note: '📋 Plán T11 · 3 × 3', planned: true },
    { id: 'plan-w12-po-pause-squat', date: '2026-11-03', sets: '3', weight: '147.5', reps: '3', note: '📋 Plán T12 · 3 × 3', planned: true },
  ],
  'paused-bench': [
    { id: 'plan-w3-ut-paused-bench', date: '2026-09-02', sets: '3', weight: '105', reps: '4', note: '📋 Plán T3 · 3 × 4', planned: true },
  ],
  'pendlay-row': [
    { id: 'plan-w9-pa-pendlay-row', date: '2026-10-17', sets: '4', weight: '97.5', reps: '5', note: '📋 Plán T9 · 4 × 5', planned: true },
    { id: 'plan-w10-pa-pendlay-row', date: '2026-10-24', sets: '3', weight: '82.5', reps: '8–10', note: '📋 Plán T10 · 3 × 8–10', planned: true },
    { id: 'plan-w11-pa-pendlay-row', date: '2026-10-31', sets: '4', weight: '97.5', reps: '5', note: '📋 Plán T11 · 4 × 5', planned: true },
    { id: 'plan-w12-pa-pendlay-row', date: '2026-11-07', sets: '3', weight: '82.5', reps: '8–10', note: '📋 Plán T12 · 3 × 8–10', planned: true },
  ],
  'pin-press': [
    { id: 'plan-w9-ut-pin-press', date: '2026-10-14', sets: '3', weight: '107.5', reps: '4', note: '📋 Plán T9 · 3 × 4', planned: true },
    { id: 'plan-w11-ut-pin-press', date: '2026-10-28', sets: '3', weight: '107.5', reps: '4', note: '📋 Plán T11 · 3 × 4', planned: true },
  ],
  'pin-squat': [
    { id: 'plan-w5-po-pin-squat', date: '2026-09-15', sets: '3', weight: '145', reps: '3', note: '📋 Plán T5 · 3 × 3', planned: true },
    { id: 'plan-w6-po-pin-squat', date: '2026-09-22', sets: '3', weight: '132.5', reps: '5', note: '📋 Plán T6 · 3 × 5', planned: true },
    { id: 'plan-w7-po-pin-squat', date: '2026-09-29', sets: '3', weight: '145', reps: '3', note: '📋 Plán T7 · 3 × 3', planned: true },
  ],
  'pullup': [
    { id: 'plan-w1-ut-pullup', date: '2026-08-19', sets: '3', weight: '0', reps: '8', note: '📋 Plán T1 · 3 × 8 · vlastní', planned: true },
    { id: 'plan-w2-ut-pullup', date: '2026-08-26', sets: '3', weight: '0', reps: '8', note: '📋 Plán T2 · 3 × 8 · vlastní', planned: true },
    { id: 'plan-w3-ut-pullup', date: '2026-09-02', sets: '3', weight: '0', reps: '5', note: '📋 Plán T3 · 3 × 5 · +5–10 kg', planned: true },
    { id: 'plan-w4-ut-pullup', date: '2026-09-09', sets: '2', weight: '0', reps: '6', note: '📋 Plán T4 · 2 × 6 · vlastní', planned: true },
    { id: 'plan-w5-ut-pullup', date: '2026-09-16', sets: '3', weight: '0', reps: '5', note: '📋 Plán T5 · 3 × 5 · +5–10 kg', planned: true },
    { id: 'plan-w6-ut-pullup', date: '2026-09-23', sets: '3', weight: '0', reps: '8', note: '📋 Plán T6 · 3 × 8 · vlastní', planned: true },
    { id: 'plan-w7-ut-pullup', date: '2026-09-30', sets: '3', weight: '0', reps: '5', note: '📋 Plán T7 · 3 × 5 · +5–10 kg', planned: true },
    { id: 'plan-w8-ut-pullup', date: '2026-10-07', sets: '2', weight: '0', reps: '6', note: '📋 Plán T8 · 2 × 6 · vlastní', planned: true },
    { id: 'plan-w9-ut-pullup', date: '2026-10-14', sets: '3', weight: '0', reps: '5', note: '📋 Plán T9 · 3 × 5 · +5–10 kg', planned: true },
    { id: 'plan-w10-ut-pullup', date: '2026-10-21', sets: '3', weight: '0', reps: '8', note: '📋 Plán T10 · 3 × 8 · vlastní', planned: true },
    { id: 'plan-w11-ut-pullup', date: '2026-10-28', sets: '3', weight: '0', reps: '5', note: '📋 Plán T11 · 3 × 5 · +5–10 kg', planned: true },
    { id: 'plan-w12-ut-pullup', date: '2026-11-04', sets: '3', weight: '0', reps: '8', note: '📋 Plán T12 · 3 × 8 · vlastní', planned: true },
  ],
  'pullup-back': [
    { id: 'plan-w1-pa-pullup-back', date: '2026-08-22', sets: '3', weight: '0', reps: '8', note: '📋 Plán T1 · 3 × 8 · vlastní', planned: true },
    { id: 'plan-w2-pa-pullup-back', date: '2026-08-29', sets: '3', weight: '0', reps: '8', note: '📋 Plán T2 · 3 × 8 · vlastní', planned: true },
    { id: 'plan-w3-pa-pullup-back', date: '2026-09-05', sets: '3', weight: '0', reps: '5', note: '📋 Plán T3 · 3 × 5 · +5–10 kg', planned: true },
    { id: 'plan-w4-pa-pullup-back', date: '2026-09-12', sets: '2', weight: '0', reps: '6', note: '📋 Plán T4 · 2 × 6 · vlastní', planned: true },
    { id: 'plan-w5-pa-pullup-back', date: '2026-09-19', sets: '3', weight: '0', reps: '5', note: '📋 Plán T5 · 3 × 5 · +5–10 kg', planned: true },
    { id: 'plan-w6-pa-pullup-back', date: '2026-09-26', sets: '3', weight: '0', reps: '8', note: '📋 Plán T6 · 3 × 8 · vlastní', planned: true },
    { id: 'plan-w7-pa-pullup-back', date: '2026-10-03', sets: '3', weight: '0', reps: '5', note: '📋 Plán T7 · 3 × 5 · +5–10 kg', planned: true },
    { id: 'plan-w8-pa-pullup-back', date: '2026-10-10', sets: '2', weight: '0', reps: '6', note: '📋 Plán T8 · 2 × 6 · vlastní', planned: true },
    { id: 'plan-w9-pa-pullup-back', date: '2026-10-17', sets: '3', weight: '0', reps: '5', note: '📋 Plán T9 · 3 × 5 · +5–10 kg', planned: true },
    { id: 'plan-w10-pa-pullup-back', date: '2026-10-24', sets: '3', weight: '0', reps: '8', note: '📋 Plán T10 · 3 × 8 · vlastní', planned: true },
    { id: 'plan-w11-pa-pullup-back', date: '2026-10-31', sets: '3', weight: '0', reps: '5', note: '📋 Plán T11 · 3 × 5 · +5–10 kg', planned: true },
    { id: 'plan-w12-pa-pullup-back', date: '2026-11-07', sets: '3', weight: '0', reps: '8', note: '📋 Plán T12 · 3 × 8 · vlastní', planned: true },
  ],
  'spoto': [
    { id: 'plan-w1-ut-spoto', date: '2026-08-19', sets: '3', weight: '100', reps: '6', note: '📋 Plán T1 · 3 × 6', planned: true },
    { id: 'plan-w2-ut-spoto', date: '2026-08-26', sets: '3', weight: '100', reps: '6', note: '📋 Plán T2 · 3 × 6', planned: true },
    { id: 'plan-w6-ut-spoto', date: '2026-09-23', sets: '3', weight: '100', reps: '6', note: '📋 Plán T6 · 3 × 6', planned: true },
    { id: 'plan-w10-ut-spoto', date: '2026-10-21', sets: '3', weight: '102.5', reps: '6', note: '📋 Plán T10 · 3 × 6', planned: true },
    { id: 'plan-w12-ut-spoto', date: '2026-11-04', sets: '3', weight: '102.5', reps: '6', note: '📋 Plán T12 · 3 × 6', planned: true },
  ],
  'squat': [
    { id: 'plan-w1-po-squat-0', date: '2026-08-18', sets: '1', weight: '145', reps: '8', note: '📋 Plán T1 · Objemová · RPE 7-8', planned: true },
    { id: 'plan-w1-po-squat-1', date: '2026-08-18', sets: '1', weight: '162.5', reps: '3', note: '📋 Plán T1 · OVERLOAD · RPE 8', planned: true },
    { id: 'plan-w1-po-squat-2', date: '2026-08-18', sets: '1', weight: '152.5', reps: '6', note: '📋 Plán T1 · Back-off · RPE 7-8', planned: true },
    { id: 'plan-w1-po-squat-3', date: '2026-08-18', sets: '1', weight: '152.5', reps: '6', note: '📋 Plán T1 · Back-off · RPE 7-8', planned: true },
    { id: 'plan-w2-po-squat-0', date: '2026-08-25', sets: '1', weight: '147.5', reps: '8', note: '📋 Plán T2 · Objemová · RPE 8', planned: true },
    { id: 'plan-w2-po-squat-1', date: '2026-08-25', sets: '1', weight: '167.5', reps: '2', note: '📋 Plán T2 · OVERLOAD · RPE 8', planned: true },
    { id: 'plan-w2-po-squat-2', date: '2026-08-25', sets: '1', weight: '152.5', reps: '6', note: '📋 Plán T2 · Back-off · RPE 8', planned: true },
    { id: 'plan-w2-po-squat-3', date: '2026-08-25', sets: '1', weight: '152.5', reps: '5', note: '📋 Plán T2 · Back-off · RPE 8', planned: true },
    { id: 'plan-w3-po-squat-0', date: '2026-09-01', sets: '1', weight: '152.5', reps: '6', note: '📋 Plán T3 · Objemová · RPE 8', planned: true },
    { id: 'plan-w3-po-squat-1', date: '2026-09-01', sets: '1', weight: '170', reps: '2', note: '📋 Plán T3 · OVERLOAD · RPE 8-9', planned: true },
    { id: 'plan-w3-po-squat-2', date: '2026-09-01', sets: '1', weight: '155', reps: '6', note: '📋 Plán T3 · Back-off · RPE 8', planned: true },
    { id: 'plan-w3-po-squat-3', date: '2026-09-01', sets: '1', weight: '155', reps: '5', note: '📋 Plán T3 · Back-off · RPE 8', planned: true },
    { id: 'plan-w4-po-squat-0', date: '2026-09-08', sets: '1', weight: '130', reps: '5', note: '📋 Plán T4 · Deload · RPE 6', planned: true },
    { id: 'plan-w4-po-squat-1', date: '2026-09-08', sets: '1', weight: '130', reps: '5', note: '📋 Plán T4 · Deload · RPE 6', planned: true },
    { id: 'plan-w4-po-squat-2', date: '2026-09-08', sets: '1', weight: '132.5', reps: '5', note: '📋 Plán T4 · Deload · RPE 6-7', planned: true },
    { id: 'plan-w5-po-squat-0', date: '2026-09-15', sets: '1', weight: '157.5', reps: '5', note: '📋 Plán T5 · TOP · RPE 8', planned: true },
    { id: 'plan-w5-po-squat-1', date: '2026-09-15', sets: '1', weight: '165', reps: '3', note: '📋 Plán T5 · OVERLOAD · RPE 8-9', planned: true },
    { id: 'plan-w5-po-squat-2', date: '2026-09-15', sets: '1', weight: '152.5', reps: '5', note: '📋 Plán T5 · Back-off · RPE 8', planned: true },
    { id: 'plan-w5-po-squat-3', date: '2026-09-15', sets: '1', weight: '152.5', reps: '5', note: '📋 Plán T5 · Back-off · RPE 8', planned: true },
    { id: 'plan-w6-po-squat-0', date: '2026-09-22', sets: '1', weight: '160', reps: '4', note: '📋 Plán T6 · TOP · RPE 8', planned: true },
    { id: 'plan-w6-po-squat-1', date: '2026-09-22', sets: '1', weight: '167.5', reps: '2', note: '📋 Plán T6 · OVERLOAD · RPE 9', planned: true },
    { id: 'plan-w6-po-squat-2', date: '2026-09-22', sets: '1', weight: '155', reps: '5', note: '📋 Plán T6 · Back-off · RPE 8', planned: true },
    { id: 'plan-w6-po-squat-3', date: '2026-09-22', sets: '1', weight: '155', reps: '4', note: '📋 Plán T6 · Back-off · RPE 8', planned: true },
    { id: 'plan-w7-po-squat-0', date: '2026-09-29', sets: '1', weight: '167.5', reps: '3', note: '📋 Plán T7 · TOP · RPE 8-9', planned: true },
    { id: 'plan-w7-po-squat-1', date: '2026-09-29', sets: '1', weight: '172.5', reps: '2', note: '📋 Plán T7 · OVERLOAD · RPE 9', planned: true },
    { id: 'plan-w7-po-squat-2', date: '2026-09-29', sets: '1', weight: '157.5', reps: '4', note: '📋 Plán T7 · Back-off · RPE 8', planned: true },
    { id: 'plan-w7-po-squat-3', date: '2026-09-29', sets: '1', weight: '157.5', reps: '4', note: '📋 Plán T7 · Back-off · RPE 8', planned: true },
    { id: 'plan-w8-po-squat-0', date: '2026-10-06', sets: '1', weight: '140', reps: '3', note: '📋 Plán T8 · Deload · RPE 6-7', planned: true },
    { id: 'plan-w8-po-squat-1', date: '2026-10-06', sets: '1', weight: '140', reps: '3', note: '📋 Plán T8 · Deload · RPE 6-7', planned: true },
    { id: 'plan-w8-po-squat-2', date: '2026-10-06', sets: '1', weight: '142.5', reps: '3', note: '📋 Plán T8 · Deload · RPE 7', planned: true },
    { id: 'plan-w9-po-squat-0', date: '2026-10-13', sets: '1', weight: '162.5', reps: '3', note: '📋 Plán T9 · Nájezd · RPE 8', planned: true },
    { id: 'plan-w9-po-squat-1', date: '2026-10-13', sets: '1', weight: '172.5', reps: '2', note: '📋 Plán T9 · TOP · RPE 9', planned: true },
    { id: 'plan-w9-po-squat-2', date: '2026-10-13', sets: '1', weight: '157.5', reps: '5', note: '📋 Plán T9 · Back-off · RPE 8', planned: true },
    { id: 'plan-w9-po-squat-3', date: '2026-10-13', sets: '1', weight: '157.5', reps: '5', note: '📋 Plán T9 · Back-off · RPE 8', planned: true },
    { id: 'plan-w10-po-squat-0', date: '2026-10-20', sets: '1', weight: '167.5', reps: '2', note: '📋 Plán T10 · Nájezd · RPE 8', planned: true },
    { id: 'plan-w10-po-squat-1', date: '2026-10-20', sets: '1', weight: '175', reps: '1', note: '📋 Plán T10 · TOP single · RPE 9', planned: true },
    { id: 'plan-w10-po-squat-2', date: '2026-10-20', sets: '1', weight: '160', reps: '4', note: '📋 Plán T10 · Back-off · RPE 8', planned: true },
    { id: 'plan-w10-po-squat-3', date: '2026-10-20', sets: '1', weight: '160', reps: '3', note: '📋 Plán T10 · Back-off · RPE 8', planned: true },
    { id: 'plan-w11-po-squat-0', date: '2026-10-27', sets: '1', weight: '170', reps: '2', note: '📋 Plán T11 · Nájezd · RPE 8-9', planned: true },
    { id: 'plan-w11-po-squat-1', date: '2026-10-27', sets: '1', weight: '180', reps: '1', note: '📋 Plán T11 · TOP single · RPE 9', planned: true },
    { id: 'plan-w11-po-squat-2', date: '2026-10-27', sets: '1', weight: '162.5', reps: '3', note: '📋 Plán T11 · Back-off · RPE 8', planned: true },
    { id: 'plan-w11-po-squat-3', date: '2026-10-27', sets: '1', weight: '162.5', reps: '3', note: '📋 Plán T11 · Back-off · RPE 8', planned: true },
    { id: 'plan-w12-po-squat-0', date: '2026-11-03', sets: '1', weight: '167.5', reps: '1', note: '📋 Plán T12 · Opener · RPE 7', planned: true },
    { id: 'plan-w12-po-squat-1', date: '2026-11-03', sets: '1', weight: '157.5', reps: '2', note: '📋 Plán T12 · Druhá · RPE 7', planned: true },
    { id: 'plan-w12-po-squat-2', date: '2026-11-03', sets: '1', weight: '147.5', reps: '3', note: '📋 Plán T12 · Objem · RPE 7', planned: true },
    { id: 'plan-w13-po-squat-0', date: '2026-11-10', sets: '1', weight: '150', reps: '1', note: '📋 Plán T13 · Rozjezd', planned: true },
    { id: 'plan-w13-po-squat-1', date: '2026-11-10', sets: '1', weight: '170', reps: '1', note: '📋 Plán T13 · Rozjezd', planned: true },
    { id: 'plan-w13-po-squat-2', date: '2026-11-10', sets: '1', weight: '190', reps: '1', note: '📋 Plán T13 · CÍL', planned: true },
    { id: 'plan-w13-po-squat-3', date: '2026-11-10', sets: '1', weight: '195', reps: '1', note: '📋 Plán T13 · PR (volitelně)', planned: true },
  ],
  'triceps-overhead': [
    { id: 'plan-w5-ut-triceps-overhead', date: '2026-09-16', sets: '3', weight: '0', reps: '8–10', note: '📋 Plán T5 · 3 × 8–10 · střední', planned: true },
    { id: 'plan-w6-ut-triceps-overhead', date: '2026-09-23', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T6 · 3 × 10–12 · střední', planned: true },
    { id: 'plan-w7-ut-triceps-overhead', date: '2026-09-30', sets: '3', weight: '0', reps: '8–10', note: '📋 Plán T7 · 3 × 8–10 · střední', planned: true },
  ],
  'triceps-pushdown': [
    { id: 'plan-w1-ut-triceps-pushdown', date: '2026-08-19', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T1 · 3 × 10–12 · střední', planned: true },
    { id: 'plan-w2-ut-triceps-pushdown', date: '2026-08-26', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T2 · 3 × 10–12 · střední', planned: true },
    { id: 'plan-w3-ut-triceps-pushdown', date: '2026-09-02', sets: '3', weight: '0', reps: '8–10', note: '📋 Plán T3 · 3 × 8–10 · střední', planned: true },
  ],
  'triceps-skull': [
    { id: 'plan-w9-ut-triceps-skull', date: '2026-10-14', sets: '3', weight: '0', reps: '8–10', note: '📋 Plán T9 · 3 × 8–10 · střední', planned: true },
    { id: 'plan-w10-ut-triceps-skull', date: '2026-10-21', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T10 · 3 × 10–12 · střední', planned: true },
    { id: 'plan-w11-ut-triceps-skull', date: '2026-10-28', sets: '3', weight: '0', reps: '8–10', note: '📋 Plán T11 · 3 × 8–10 · střední', planned: true },
    { id: 'plan-w12-ut-triceps-skull', date: '2026-11-04', sets: '3', weight: '0', reps: '10–12', note: '📋 Plán T12 · 3 × 10–12 · střední', planned: true },
  ],
  'walking-lunges': [
    { id: 'plan-w5-po-walking-lunges', date: '2026-09-15', sets: '3', weight: '0', reps: '8/nohu', note: '📋 Plán T5 · 3 × 8/nohu · 2× činka lehká–stř.', planned: true },
    { id: 'plan-w6-po-walking-lunges', date: '2026-09-22', sets: '3', weight: '0', reps: '10/nohu', note: '📋 Plán T6 · 3 × 10/nohu · 2× činka lehká–stř.', planned: true },
    { id: 'plan-w7-po-walking-lunges', date: '2026-09-29', sets: '3', weight: '0', reps: '8/nohu', note: '📋 Plán T7 · 3 × 8/nohu · 2× činka lehká–stř.', planned: true },
  ],
};
