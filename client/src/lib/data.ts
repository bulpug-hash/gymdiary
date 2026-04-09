// ============================================================
// 16týdenní vědecky podložený silově-hypertrofický plán 2026 v4.0
// Fáze 1: Akumulace (W1–4) | Fáze 2: Síla (W5–8) | Fáze 3: Intenzifikace (W9–12) | Fáze 4: Peaking (W13–16)
// Cíle: Dřep 180→190 kg | Bench 120→130 kg | Deadlift 225→235 kg
// Zdroje: Israetel, Tuchscherer, Smith, Zatsiorsky, Horschig, Schumann, Viada
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
}

export interface TrainingRecord {
  id: string;
  date: string;
  sets: string;
  weight: string;
  reps: string;
  note: string;
  gym?: string;
  extraActivity?: string;
}

export type RecordsMap = Record<string, TrainingRecord[]>;

// ============================================================
// GOALS & MAXES
// ============================================================
export const GOALS = { bench: 130, squat: 190, deadlift: 235 };
export const STARTING_MAXES = { bench: 120, squat: 180, deadlift: 225 };
export const CURRENT_MAXES = { bench: 120, squat: 180, deadlift: 225 };
export const PLAN_START_DATE = '2026-04-14'; // W1 starts Monday April 14

// ============================================================
// WARM-UP PROTOCOL (shared across all strength days)
// ============================================================
export const WARMUP_PROTOCOL = `5 min rotoped → Dynamický strečink + mobilita (Horschig): banded ankles, thorakální extenze, 90/90 stretch → Aktivace: Lower = glute bridges 2×10 + band walks 2×12 | Upper = scapular push-ups 2×10 + band pull-aparts 2×15 → Rozehřívací série (Zatsiorsky): tyč → 40% → 60% → 75% → pracovní váha. Celkem ~12 min.`;

// ============================================================
// HELPERS
// ============================================================
function lowerDay(exercises: Exercise[], weekNum?: number): WorkoutDay {
  return {
    key: 'monday', label: 'Pondělí', labelShort: 'Po', type: 'lower',
    description: 'LOWER BODY – Squat focus. Dřep + slabinové variace. Core.',
    warmup: WARMUP_PROTOCOL,
    exercises,
  };
}
function upperDay(exercises: Exercise[]): WorkoutDay {
  return {
    key: 'tuesday', label: 'Úterý', labelShort: 'Út', type: 'upper',
    description: 'UPPER BODY – Bench focus. Bench + slabinové variace. Záda, prevence.',
    warmup: WARMUP_PROTOCOL,
    exercises,
  };
}
function wednesdayHiit(): WorkoutDay {
  return {
    key: 'wednesday', label: 'Středa', labelShort: 'St', type: 'hiit',
    description: 'HIIT – Silově-vytrvalostní kruhový trénink. Pevná lekce.',
    exercises: [{ id: 'hiit-wed', name: 'HIIT – Kruhový trénink', nameShort: 'HIIT', category: 'run', targetSets: '1', targetReps: '~60 min', note: 'Pevná lekce. Po: 40–60 g rychlých sacharidů okamžitě (AMPK/mTOR interference).' }],
  };
}
function thursdayRun(week: number, type: string, duration: string, zone: string): WorkoutDay {
  return {
    key: 'thursday', label: 'Čtvrtek', labelShort: 'Čt', type: 'run',
    description: `BĚH – ${type}. Min. 24h buffer před pátečním deadliftem (Viada).`,
    exercises: [{ id: 'run-thu', name: `Běh – ${type}`, nameShort: 'Běh', category: 'run', targetSets: '1', targetReps: duration, note: `${zone}. W${week}: ${type}` }],
  };
}
function fullBodyDay(exercises: Exercise[]): WorkoutDay {
  return {
    key: 'friday', label: 'Pátek', labelShort: 'Pá', type: 'fullbody',
    description: 'FULL BODY – Deadlift focus. Mrtvý tah + bench variace + squat variace.',
    warmup: WARMUP_PROTOCOL,
    exercises,
  };
}
function saturdayHiit(): WorkoutDay {
  return {
    key: 'saturday', label: 'Sobota', labelShort: 'So', type: 'hiit',
    description: 'HIIT – Silově-vytrvalostní kruhový trénink. Pevná lekce.',
    exercises: [{ id: 'hiit-sat', name: 'HIIT – Kruhový trénink', nameShort: 'HIIT', category: 'run', targetSets: '1', targetReps: '~60 min', note: 'Pevná lekce. Regenerace zadního řetězce po deadliftu.' }],
  };
}
const sundayRest: WorkoutDay = {
  key: 'sunday', label: 'Neděle', labelShort: 'Ne', type: 'rest',
  description: 'VOLNO – Kompletní regenerace. Pěnový válec, strečink, procházka. Spánek 8+ h.',
  exercises: [],
};

// ============================================================
// FÁZE 1: AKUMULACE (W1–4) – 14.4.–11.5.2026
// Intenzita 65–78% 1RM | 6–10 opak | RPE 7–8 | Vysoký objem
// Metoda opakovaného úsilí (Zatsiorsky). Double progression.
// ============================================================

const w1: Week = {
  number: 1, label: 'W1 – Akumulace', dateFrom: '2026-04-14', dateTo: '2026-04-20',
  phase: 'Fáze 1 – Akumulace', phaseKey: 'phase1',
  description: 'Vstup do akumulace. 65% 1RM, RPE 7. Technika a slabinové variace. Double progression: nejprve přidej rep (6→8→10), pak váhu.',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', targetSets: '4', targetReps: '10', targetWeight: '117.5 kg', rpe: '7', note: 'Hlavní cvik. Focus: hloubka, bracing, kontrolovaná excentrika.' },
      { id: 'tempo-squat', name: 'Tempo Squat (3-1-0)', nameShort: 'Tempo Squat', category: 'accessory', targetSets: '3', targetReps: '8', targetWeight: '100–107.5 kg', rpe: '7', note: '3s dolů, 1s pauza. Kontrola v díře.' },
      { id: 'leg-press', name: 'Leg Press (stroj)', nameShort: 'Leg Press', category: 'accessory', targetSets: '3', targetReps: '12', targetWeight: '180–215 kg', rpe: '7–8', note: 'Fatigue mgmt (Israetel): quad objem bez axiálního zatížení.' },
      { id: 'rdl', name: 'Romanian Deadlift (RDL)', nameShort: 'RDL', category: 'accessory', targetSets: '3', targetReps: '10–12', targetWeight: '85–100 kg', rpe: '7–8', note: 'Hip hinge, hamstringy. Straps OK.' },
      { id: 'bulgarian', name: 'Bulgarian Split Squat', nameShort: 'BSS', category: 'accessory', targetSets: '3', targetReps: '10/noha', targetWeight: '40–50 kg (2×DB)', rpe: '7–8', note: 'Unilaterální quad práce.' },
      { id: 'ghd', name: 'GHD Raise', category: 'core', targetSets: '3', targetReps: '8–10', note: 'BW. Superset A1 s Pallof Press.', isSuperset: true, supersetWith: 'Pallof Press' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '3', targetReps: '10/strana', note: 'Lehká. Superset A2 s GHD Raise.', isSuperset: true, supersetWith: 'GHD Raise' },
    ]),
    upperDay([
      { id: 'bench', name: 'Bench Press (Comp.)', nameShort: 'Bench Press', category: 'main', targetSets: '4', targetReps: '10', targetWeight: '80–85 kg', rpe: '7–8', note: 'Soutěžní setup: lopatky, arch, leg drive.' },
      { id: 'larsen', name: 'Larsen Press', nameShort: 'Larsen Press', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: '72.5–82.5 kg', rpe: '7–8', note: 'Nohy nahoře. Izoluje prsa bez leg drive – cílí tvou slabinu.' },
      { id: 'dips', name: 'Dips (weighted)', nameShort: 'Dips', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: 'BW+0–5 kg', rpe: '7–8', note: 'Hrudník + triceps. Předklon trupu → víc prsa.' },
      { id: 'pullup', name: 'Weighted Pull-up', nameShort: 'Pull-up', category: 'accessory', targetSets: '3', targetReps: '6–8', targetWeight: 'BW+0–5 kg', rpe: '7–8', note: 'Vertikální tah. Lats + biceps.' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15–20', note: 'Lehká. Prehab ramen (Horschig). Superset A1.', isSuperset: true, supersetWith: 'Bicep Curl' },
      { id: 'bicep-curl', name: 'Bicep Curl', category: 'isolation', targetSets: '3', targetReps: '10–12', note: 'Střední. Superset A2.', isSuperset: true, supersetWith: 'Face Pulls' },
      { id: 'ab-wheel', name: 'Ab Wheel / Hanging Leg Raise', nameShort: 'Core', category: 'core', targetSets: '3', targetReps: '10–12', note: 'BW. Core stabilita.' },
    ]),
    wednesdayHiit(),
    thursdayRun(1, 'Easy run', '25 min', 'Zóna 2 (60–70% max SF)'),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Deadlift', category: 'main', targetSets: '4', targetReps: '10', targetWeight: '137.5–142.5 kg', rpe: '7–8', note: 'Soutěžní setup. Důraz na techniku a pozici.' },
      { id: 'front-squat', name: 'Front Squat', nameShort: 'Front Squat', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: '95–107.5 kg', rpe: '7–8', note: 'Quad-dominantní variace. Vzpřímené torzo.' },
      { id: 'spoto', name: 'Spoto Press', nameShort: 'Spoto Press', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: '80–90 kg', rpe: '7–8', note: '2–3 cm nad hrudníkem. Cílí start z prsu.' },
      { id: 'barbell-row', name: 'Barbell Row', nameShort: 'BB Row', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: '75–90 kg', rpe: '7–8', note: 'Záda, lats. Silná záda = silný deadlift.' },
      { id: 'walking-lunges', name: 'Walking Lunges', nameShort: 'Lunges', category: 'accessory', targetSets: '3', targetReps: '10/noha', targetWeight: '30–40 kg (2×DB)', rpe: '7–8', note: 'Quad + hýždě unilaterálně.' },
      { id: 'nordic-curls', name: 'Nordic Curls', category: 'prevention', targetSets: '3', targetReps: '4–6', note: 'BW. Prevence hamstring. Superset A1.', isSuperset: true, supersetWith: 'Cop. Addukce' },
      { id: 'cop-adduction', name: 'Copenhagen Addukce', nameShort: 'Cop. Add.', category: 'prevention', targetSets: '2', targetReps: '8/strana', note: 'BW. Prevence třísla (Horschig). Superset A2.', isSuperset: true, supersetWith: 'Nordic Curls' },
    ]),
    saturdayHiit(),
    sundayRest,
  ],
};

const w2: Week = {
  number: 2, label: 'W2 – Akumulace', dateFrom: '2026-04-21', dateTo: '2026-04-27',
  phase: 'Fáze 1 – Akumulace', phaseKey: 'phase1',
  description: 'Progrese: +2.5–5 kg nebo +1–2 reps. Tempo squat → Pause squat přechod. RPE max 8.',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', targetSets: '4', targetReps: '8–10', targetWeight: '120–127.5 kg', rpe: '7–8', note: 'Hlavní cvik. Focus: hloubka, bracing, kontrolovaná excentrika.' },
      { id: 'tempo-squat', name: 'Tempo Squat (3-1-0)', nameShort: 'Tempo Squat', category: 'accessory', targetSets: '3', targetReps: '8', targetWeight: '107.5–117.5 kg', rpe: '7', note: '3s dolů, 1s pauza. Kontrola v díře.' },
      { id: 'leg-press', name: 'Leg Press (stroj)', nameShort: 'Leg Press', category: 'accessory', targetSets: '3', targetReps: '10', targetWeight: '197.5–235 kg', rpe: '7–8', note: 'Fatigue mgmt (Israetel): quad objem.' },
      { id: 'rdl', name: 'Romanian Deadlift (RDL)', nameShort: 'RDL', category: 'accessory', targetSets: '3', targetReps: '10–12', targetWeight: '100–117.5 kg', rpe: '7–8', note: 'Hip hinge, hamstringy.' },
      { id: 'bulgarian', name: 'Bulgarian Split Squat', nameShort: 'BSS', category: 'accessory', targetSets: '3', targetReps: '8–10/noha', targetWeight: '45–55 kg (2×DB)', rpe: '7–8', note: 'Unilaterální quad práce.' },
      { id: 'ghd', name: 'GHD Raise', category: 'core', targetSets: '3', targetReps: '8–10', note: 'BW–+10 kg. Superset A1.', isSuperset: true, supersetWith: 'Pallof Press' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '3', targetReps: '10/strana', note: 'Střední. Superset A2.', isSuperset: true, supersetWith: 'GHD Raise' },
    ]),
    upperDay([
      { id: 'bench', name: 'Bench Press (Comp.)', nameShort: 'Bench Press', category: 'main', targetSets: '4', targetReps: '8–10', targetWeight: '82.5–87.5 kg', rpe: '7–8', note: 'Soutěžní setup: lopatky, arch, leg drive.' },
      { id: 'larsen', name: 'Larsen Press', nameShort: 'Larsen Press', category: 'accessory', targetSets: '3', targetReps: '8', targetWeight: '77.5–90 kg', rpe: '7–8', note: 'Nohy nahoře. Izoluje prsa bez leg drive.' },
      { id: 'dips', name: 'Dips (weighted)', nameShort: 'Dips', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: 'BW+0–10 kg', rpe: '7–8', note: 'Hrudník + triceps.' },
      { id: 'pullup', name: 'Weighted Pull-up', nameShort: 'Pull-up', category: 'accessory', targetSets: '3', targetReps: '6–8', targetWeight: 'BW+0–5 kg', rpe: '7–8', note: 'Vertikální tah. Lats + biceps.' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15–20', note: 'Lehká. Prehab ramen. Superset A1.', isSuperset: true, supersetWith: 'Bicep Curl' },
      { id: 'bicep-curl', name: 'Bicep Curl', category: 'isolation', targetSets: '3', targetReps: '10–12', note: 'Střední. Superset A2.', isSuperset: true, supersetWith: 'Face Pulls' },
      { id: 'ab-wheel', name: 'Ab Wheel / Hanging Leg Raise', nameShort: 'Core', category: 'core', targetSets: '3', targetReps: '10–12', note: 'BW. Core stabilita.' },
    ]),
    wednesdayHiit(),
    thursdayRun(2, 'Easy run', '30 min', 'Zóna 2 (60–70% max SF)'),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Deadlift', category: 'main', targetSets: '4', targetReps: '8–10', targetWeight: '140–145 kg', rpe: '7–8', note: 'Soutěžní setup. Důraz na techniku.' },
      { id: 'front-squat', name: 'Front Squat', nameShort: 'Front Squat', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: '100–112.5 kg', rpe: '7–8', note: 'Quad-dominantní variace.' },
      { id: 'spoto', name: 'Spoto Press', nameShort: 'Spoto Press', category: 'accessory', targetSets: '3', targetReps: '8', targetWeight: '82.5–92.5 kg', rpe: '7–8', note: '2–3 cm nad hrudníkem. Cílí start z prsu.' },
      { id: 'barbell-row', name: 'Barbell Row', nameShort: 'BB Row', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: '80–95 kg', rpe: '7–8', note: 'Záda, lats.' },
      { id: 'walking-lunges', name: 'Walking Lunges', nameShort: 'Lunges', category: 'accessory', targetSets: '3', targetReps: '10/noha', targetWeight: '35–45 kg (2×DB)', rpe: '7–8', note: 'Quad + hýždě.' },
      { id: 'nordic-curls', name: 'Nordic Curls', category: 'prevention', targetSets: '3', targetReps: '4–6', note: 'BW. Superset A1.', isSuperset: true, supersetWith: 'Cop. Addukce' },
      { id: 'cop-adduction', name: 'Copenhagen Addukce', nameShort: 'Cop. Add.', category: 'prevention', targetSets: '2', targetReps: '8/strana', note: 'BW. Superset A2.', isSuperset: true, supersetWith: 'Nordic Curls' },
    ]),
    saturdayHiit(),
    sundayRest,
  ],
};

const w3: Week = {
  number: 3, label: 'W3 – Akumulace', dateFrom: '2026-04-28', dateTo: '2026-05-04',
  phase: 'Fáze 1 – Akumulace', phaseKey: 'phase1',
  description: 'Nejvyšší objem fáze. Reps klesají na 6, váha roste. Pause squat místo tempo squatu. Pokud RPE > 8.5 → sniž váhu o 5% (Tuchscherer).',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', targetSets: '4', targetReps: '6', targetWeight: '130–140 kg', rpe: '7–8', note: 'Hlavní cvik. Focus: hloubka, bracing.' },
      { id: 'pause-squat', name: 'Pause Squat (2s)', nameShort: 'Pause Squat', category: 'accessory', targetSets: '3', targetReps: '6', targetWeight: '112.5–125 kg', rpe: '7–8', note: '2s pauza dole. Klíčové pro slabinu (díra).' },
      { id: 'leg-press', name: 'Leg Press (stroj)', nameShort: 'Leg Press', category: 'accessory', targetSets: '3', targetReps: '8', targetWeight: '215–252.5 kg', rpe: '7–8', note: 'Fatigue mgmt: quad objem.' },
      { id: 'rdl', name: 'Romanian Deadlift (RDL)', nameShort: 'RDL', category: 'accessory', targetSets: '3', targetReps: '8', targetWeight: '100–117.5 kg', rpe: '7–8', note: 'Hip hinge, hamstringy.' },
      { id: 'bulgarian', name: 'Bulgarian Split Squat', nameShort: 'BSS', category: 'accessory', targetSets: '3', targetReps: '8–10/noha', targetWeight: '45–55 kg (2×DB)', rpe: '7–8', note: 'Unilaterální quad práce.' },
      { id: 'ghd', name: 'GHD Raise', category: 'core', targetSets: '3', targetReps: '8–10', note: 'BW–+10 kg. Superset A1.', isSuperset: true, supersetWith: 'Pallof Press' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '3', targetReps: '10/strana', note: 'Střední. Superset A2.', isSuperset: true, supersetWith: 'GHD Raise' },
    ]),
    upperDay([
      { id: 'bench', name: 'Bench Press (Comp.)', nameShort: 'Bench Press', category: 'main', targetSets: '4', targetReps: '6', targetWeight: '87.5–92.5 kg', rpe: '7–8', note: 'Soutěžní setup.' },
      { id: 'larsen', name: 'Larsen Press', nameShort: 'Larsen Press', category: 'accessory', targetSets: '3', targetReps: '8', targetWeight: '77.5–90 kg', rpe: '7–8', note: 'Nohy nahoře. Cílí slabinu.' },
      { id: 'dips', name: 'Dips (weighted)', nameShort: 'Dips', category: 'accessory', targetSets: '3', targetReps: '6–8', targetWeight: 'BW+0–10 kg', rpe: '7–8', note: 'Hrudník + triceps.' },
      { id: 'pullup', name: 'Weighted Pull-up', nameShort: 'Pull-up', category: 'accessory', targetSets: '3', targetReps: '6–8', targetWeight: 'BW+0–5 kg', rpe: '7–8', note: 'Vertikální tah.' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15–20', note: 'Lehká. Superset A1.', isSuperset: true, supersetWith: 'Bicep Curl' },
      { id: 'bicep-curl', name: 'Bicep Curl', category: 'isolation', targetSets: '3', targetReps: '10–12', note: 'Střední. Superset A2.', isSuperset: true, supersetWith: 'Face Pulls' },
      { id: 'ab-wheel', name: 'Ab Wheel / Hanging Leg Raise', nameShort: 'Core', category: 'core', targetSets: '3', targetReps: '10–12', note: 'BW. Core.' },
    ]),
    wednesdayHiit(),
    thursdayRun(3, 'Easy + strides', '30 min', 'Zóna 2 + 4×20s strides/40s klus'),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Deadlift', category: 'main', targetSets: '4', targetReps: '6', targetWeight: '150–155 kg', rpe: '7–8', note: 'Soutěžní setup. Důraz na techniku.' },
      { id: 'front-squat', name: 'Front Squat', nameShort: 'Front Squat', category: 'accessory', targetSets: '3', targetReps: '6', targetWeight: '100–112.5 kg', rpe: '7–8', note: 'Quad-dominantní variace.' },
      { id: 'spoto', name: 'Spoto Press', nameShort: 'Spoto Press', category: 'accessory', targetSets: '3', targetReps: '6', targetWeight: '82.5–92.5 kg', rpe: '7–8', note: '2–3 cm nad hrudníkem.' },
      { id: 'barbell-row', name: 'Barbell Row', nameShort: 'BB Row', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: '80–95 kg', rpe: '7–8', note: 'Záda, lats.' },
      { id: 'walking-lunges', name: 'Walking Lunges', nameShort: 'Lunges', category: 'accessory', targetSets: '3', targetReps: '10/noha', targetWeight: '35–45 kg (2×DB)', rpe: '7–8', note: 'Quad + hýždě.' },
      { id: 'nordic-curls', name: 'Nordic Curls', category: 'prevention', targetSets: '3', targetReps: '4–6', note: 'BW. Superset A1.', isSuperset: true, supersetWith: 'Cop. Addukce' },
      { id: 'cop-adduction', name: 'Copenhagen Addukce', nameShort: 'Cop. Add.', category: 'prevention', targetSets: '2', targetReps: '8/strana', note: 'BW. Superset A2.', isSuperset: true, supersetWith: 'Nordic Curls' },
    ]),
    saturdayHiit(),
    sundayRest,
  ],
};

const w4: Week = {
  number: 4, label: 'W4 – DELOAD', dateFrom: '2026-05-05', dateTo: '2026-05-11',
  phase: 'Fáze 1 – Deload', phaseKey: 'deload', isDeload: true,
  description: 'DELOAD TÝDEN. Objem −40%, intenzita ~65–68% (Israetel). Regenerace CNS. Zatsiorského dvou-faktorový model: únava odezní, fitness zůstane.',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', targetSets: '3', targetReps: '5', targetWeight: '117.5 kg', rpe: '6–7', note: 'DELOAD: −40% objemu (Israetel).', setType: 'deload' },
      { id: 'pause-squat', name: 'Pause Squat (2s)', nameShort: 'Pause Squat', category: 'accessory', targetSets: '2', targetReps: '5', targetWeight: '100 kg', rpe: '6', note: 'DELOAD: lehce.', setType: 'deload' },
      { id: 'leg-press', name: 'Leg Press (stroj)', nameShort: 'Leg Press', category: 'accessory', targetSets: '2', targetReps: '8', targetWeight: '180 kg', rpe: '6', note: 'DELOAD: udržovací.', setType: 'deload' },
      { id: 'ghd', name: 'GHD Raise', category: 'core', targetSets: '2', targetReps: '8', note: 'BW. DELOAD.', setType: 'deload' },
    ]),
    upperDay([
      { id: 'bench', name: 'Bench Press (Comp.)', nameShort: 'Bench Press', category: 'main', targetSets: '3', targetReps: '5', targetWeight: '82.5 kg', rpe: '6–7', note: 'DELOAD.', setType: 'deload' },
      { id: 'larsen', name: 'Larsen Press', nameShort: 'Larsen Press', category: 'accessory', targetSets: '2', targetReps: '6', targetWeight: '72.5 kg', rpe: '6', note: 'DELOAD.', setType: 'deload' },
      { id: 'pullup', name: 'Weighted Pull-up', nameShort: 'Pull-up', category: 'accessory', targetSets: '2', targetReps: '6', targetWeight: 'BW', rpe: '6', note: 'DELOAD.', setType: 'deload' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15', note: 'Lehká. Prehab (Horschig).', setType: 'deload' },
    ]),
    wednesdayHiit(),
    thursdayRun(4, 'Recovery jog', '20 min', 'Zóna 1–2 (velmi lehce)'),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Deadlift', category: 'main', targetSets: '2', targetReps: '4', targetWeight: '145 kg', rpe: '6–7', note: 'DELOAD.', setType: 'deload' },
      { id: 'front-squat', name: 'Front Squat', nameShort: 'Front Squat', category: 'accessory', targetSets: '2', targetReps: '5', targetWeight: '90 kg', rpe: '6', note: 'DELOAD.', setType: 'deload' },
      { id: 'barbell-row', name: 'Barbell Row', nameShort: 'BB Row', category: 'accessory', targetSets: '2', targetReps: '8', targetWeight: '67.5 kg', rpe: '6', note: 'DELOAD.', setType: 'deload' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15', note: 'Lehká. Prehab.', setType: 'deload' },
    ]),
    saturdayHiit(),
    sundayRest,
  ],
};

// ============================================================
// FÁZE 2: ROZVOJ SÍLY (W5–8) – 12.5.–8.6.2026
// Intenzita 78–88% 1RM | RPE 8–9 | PYRAMIDOVÁ STRUKTURA
// Ramp → Top Set → Back-off (Tuchscherer + Israetel)
// Strojové doplňky: fatigue management (Israetel s.134)
// ============================================================

const w5: Week = {
  number: 5, label: 'W5 – Síla', dateFrom: '2026-05-12', dateTo: '2026-05-18',
  phase: 'Fáze 2 – Rozvoj síly', phaseKey: 'phase2',
  description: 'Vstup do silové fáze. PYRAMIDA: 2 ramp série → top set → 2 back-off (Tuchscherer + Israetel). Pause squat a Spoto press jako sekundární variace.',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat – RAMP', nameShort: 'Squat RAMP', category: 'main', targetSets: '2', targetReps: '7', targetWeight: '125 kg', rpe: '7', note: 'Rampovací série ~70%. Objem.', setType: 'ramp' },
      { id: 'squat-top', name: 'Back Squat – TOP SET', nameShort: 'Squat TOP', category: 'main', targetSets: '1', targetReps: '5', targetWeight: '145 kg', rpe: '8–9', note: 'Hlavní pracovní set. Autoreguluj váhu (Tuchscherer)!', setType: 'topset' },
      { id: 'squat-bo', name: 'Back Squat – BACK-OFF', nameShort: 'Squat BO', category: 'main', targetSets: '2', targetReps: '6', targetWeight: '137.5 kg', rpe: '7–8', note: '−5% z top setu. Dodej objem po těžkém setu.', setType: 'backoff' },
      { id: 'pause-squat', name: 'Pause Squat (2s)', nameShort: 'Pause Squat', category: 'accessory', targetSets: '3', targetReps: '5', targetWeight: '117.5 kg', rpe: '8', note: '2s pauza dole. Klíčový cvik pro slabinu (díra)!' },
      { id: 'hack-squat', name: 'Hack Squat (stroj)', nameShort: 'Hack Squat', category: 'accessory', targetSets: '3', targetReps: '7', targetWeight: 'Střední', rpe: '7–8', note: 'Fatigue mgmt (Israetel s.134): quad objem po těžkém squatu.' },
      { id: 'ghd', name: 'GHD Raise', category: 'core', targetSets: '3', targetReps: '8–10', note: 'BW–+10 kg. Superset A1.', isSuperset: true, supersetWith: 'Pallof Press' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '2', targetReps: '10/strana', note: 'Střední. Superset A2.', isSuperset: true, supersetWith: 'GHD Raise' },
    ]),
    upperDay([
      { id: 'bench', name: 'Bench Press – RAMP', nameShort: 'Bench RAMP', category: 'main', targetSets: '2', targetReps: '7', targetWeight: '85 kg', rpe: '7', note: 'Rampovací série. Plný setup.', setType: 'ramp' },
      { id: 'bench-top', name: 'Bench Press – TOP SET', nameShort: 'Bench TOP', category: 'main', targetSets: '1', targetReps: '5', targetWeight: '95 kg', rpe: '8–9', note: 'Hlavní pracovní set. RPE 8–9.', setType: 'topset' },
      { id: 'bench-bo', name: 'Bench Press – BACK-OFF', nameShort: 'Bench BO', category: 'main', targetSets: '2', targetReps: '6', targetWeight: '90 kg', rpe: '7–8', note: '−5% z top setu.', setType: 'backoff' },
      { id: 'spoto', name: 'Spoto Press', nameShort: 'Spoto Press', category: 'accessory', targetSets: '3', targetReps: '6', targetWeight: '82.5 kg', rpe: '8', note: '2–3 cm nad hrudníkem. Cílí slabinu (start z prsu).' },
      { id: 'lat-pulldown', name: 'Lat Pulldown (stroj)', nameShort: 'Lat Pulldown', category: 'accessory', targetSets: '3', targetReps: '8–12', targetWeight: 'Střední–těžká', rpe: '7–8', note: 'Fatigue mgmt (Israetel s.92): strojový tah pro lats.' },
      { id: 'dips', name: 'Dips', category: 'accessory', targetSets: '3', targetReps: '7', targetWeight: '+5–10 kg', rpe: '7–8', note: 'Pressing hypertrofie. Superset A1.', isSuperset: true, supersetWith: 'Face Pulls' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15–20', note: 'Lehká. Prehab (Horschig). Superset A2.', isSuperset: true, supersetWith: 'Dips' },
    ]),
    wednesdayHiit(),
    thursdayRun(5, 'Tempo run', '30 min', '10 min easy + 10 min tempo + 10 min easy. Zóna 2–3'),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift – RAMP', nameShort: 'DL RAMP', category: 'main', targetSets: '2', targetReps: '7', targetWeight: '145 kg', rpe: '7', note: 'Rampovací série pro objem.', setType: 'ramp' },
      { id: 'deadlift-top', name: 'Deadlift – TOP SET', nameShort: 'DL TOP', category: 'main', targetSets: '1', targetReps: '5', targetWeight: '170 kg', rpe: '8–9', note: 'RPE 8–9. Autoreguluj (Tuchscherer)!', setType: 'topset' },
      { id: 'deadlift-bo', name: 'Deadlift – BACK-OFF', nameShort: 'DL BO', category: 'main', targetSets: '2', targetReps: '6', targetWeight: '162.5 kg', rpe: '7–8', note: '−5% z top setu.', setType: 'backoff' },
      { id: 'front-squat', name: 'Front Squat', nameShort: 'Front Squat', category: 'accessory', targetSets: '3', targetReps: '6', targetWeight: '100–112.5 kg', rpe: '7–8', note: 'Lehčí squat variace. Quady + core.' },
      { id: 'long-pause-bench', name: 'Long Pause Bench (3s)', nameShort: 'Pause Bench', category: 'accessory', targetSets: '3', targetReps: '6', targetWeight: '77.5 kg', rpe: '7–8', note: '3s pauza na hrudi. Buduje sílu z prsu.' },
      { id: 'cable-row', name: 'Cable Row (stroj)', nameShort: 'Cable Row', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: 'Střední', rpe: '8', note: 'Fatigue mgmt záda (Israetel). Superset A1.', isSuperset: true, supersetWith: 'Nordic Curls' },
      { id: 'nordic-curls', name: 'Nordic Curls', category: 'prevention', targetSets: '3', targetReps: '5', note: 'BW. Prevence (Horschig). Superset A2.', isSuperset: true, supersetWith: 'Cable Row' },
    ]),
    saturdayHiit(),
    sundayRest,
  ],
};

const w6: Week = {
  number: 6, label: 'W6 – Síla', dateFrom: '2026-05-19', dateTo: '2026-05-25',
  phase: 'Fáze 2 – Rozvoj síly', phaseKey: 'phase2',
  description: 'Progrese: +2.5–5 kg na top setech, reps klesají na 4. Ramp série stále ×6.',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat – RAMP', nameShort: 'Squat RAMP', category: 'main', targetSets: '2', targetReps: '6', targetWeight: '132.5 kg', rpe: '7', note: 'Rampovací série ~73%.', setType: 'ramp' },
      { id: 'squat-top', name: 'Back Squat – TOP SET', nameShort: 'Squat TOP', category: 'main', targetSets: '1', targetReps: '4', targetWeight: '150 kg', rpe: '8–9', note: 'Hlavní pracovní set. Autoreguluj!', setType: 'topset' },
      { id: 'squat-bo', name: 'Back Squat – BACK-OFF', nameShort: 'Squat BO', category: 'main', targetSets: '2', targetReps: '5', targetWeight: '142.5 kg', rpe: '7–8', note: '−5% z top setu.', setType: 'backoff' },
      { id: 'pause-squat', name: 'Pause Squat (2s)', nameShort: 'Pause Squat', category: 'accessory', targetSets: '3', targetReps: '4', targetWeight: '122.5 kg', rpe: '8', note: '2s pauza dole.' },
      { id: 'hack-squat', name: 'Hack Squat (stroj)', nameShort: 'Hack Squat', category: 'accessory', targetSets: '3', targetReps: '6', targetWeight: 'Střední', rpe: '7–8', note: 'Fatigue mgmt: quad objem.' },
      { id: 'ghd', name: 'GHD Raise', category: 'core', targetSets: '3', targetReps: '8–10', note: 'Superset A1.', isSuperset: true, supersetWith: 'Pallof Press' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '2', targetReps: '10/strana', note: 'Superset A2.', isSuperset: true, supersetWith: 'GHD Raise' },
    ]),
    upperDay([
      { id: 'bench', name: 'Bench Press – RAMP', nameShort: 'Bench RAMP', category: 'main', targetSets: '2', targetReps: '6', targetWeight: '87.5 kg', rpe: '7', note: 'Rampovací série.', setType: 'ramp' },
      { id: 'bench-top', name: 'Bench Press – TOP SET', nameShort: 'Bench TOP', category: 'main', targetSets: '1', targetReps: '4', targetWeight: '100 kg', rpe: '8–9', note: 'Hlavní pracovní set.', setType: 'topset' },
      { id: 'bench-bo', name: 'Bench Press – BACK-OFF', nameShort: 'Bench BO', category: 'main', targetSets: '2', targetReps: '5', targetWeight: '95 kg', rpe: '7–8', note: '−5% z top setu.', setType: 'backoff' },
      { id: 'spoto', name: 'Spoto Press', nameShort: 'Spoto Press', category: 'accessory', targetSets: '3', targetReps: '5', targetWeight: '85 kg', rpe: '8', note: '2–3 cm nad hrudníkem.' },
      { id: 'lat-pulldown', name: 'Lat Pulldown (stroj)', nameShort: 'Lat Pulldown', category: 'accessory', targetSets: '3', targetReps: '8–12', targetWeight: 'Střední–těžká', rpe: '7–8', note: 'Fatigue mgmt.' },
      { id: 'dips', name: 'Dips', category: 'accessory', targetSets: '3', targetReps: '6', targetWeight: '+5–10 kg', rpe: '7–8', note: 'Superset A1.', isSuperset: true, supersetWith: 'Face Pulls' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15–20', note: 'Superset A2.', isSuperset: true, supersetWith: 'Dips' },
    ]),
    wednesdayHiit(),
    thursdayRun(6, 'Tempo run', '32 min', '8 min easy + 15 min tempo + 9 min easy. Zóna 2–3'),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift – RAMP', nameShort: 'DL RAMP', category: 'main', targetSets: '2', targetReps: '6', targetWeight: '152.5 kg', rpe: '7', note: 'Rampovací série.', setType: 'ramp' },
      { id: 'deadlift-top', name: 'Deadlift – TOP SET', nameShort: 'DL TOP', category: 'main', targetSets: '1', targetReps: '4', targetWeight: '175 kg', rpe: '8–9', note: 'RPE 8–9. Autoreguluj!', setType: 'topset' },
      { id: 'deadlift-bo', name: 'Deadlift – BACK-OFF', nameShort: 'DL BO', category: 'main', targetSets: '2', targetReps: '5', targetWeight: '165 kg', rpe: '7–8', note: '−5% z top setu.', setType: 'backoff' },
      { id: 'front-squat', name: 'Front Squat', nameShort: 'Front Squat', category: 'accessory', targetSets: '3', targetReps: '5', targetWeight: '100–112.5 kg', rpe: '7–8', note: 'Quady + core.' },
      { id: 'long-pause-bench', name: 'Long Pause Bench (3s)', nameShort: 'Pause Bench', category: 'accessory', targetSets: '3', targetReps: '5', targetWeight: '80 kg', rpe: '7–8', note: '3s pauza na hrudi.' },
      { id: 'cable-row', name: 'Cable Row (stroj)', nameShort: 'Cable Row', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: 'Střední', rpe: '8', note: 'Superset A1.', isSuperset: true, supersetWith: 'Nordic Curls' },
      { id: 'nordic-curls', name: 'Nordic Curls', category: 'prevention', targetSets: '3', targetReps: '5', note: 'Superset A2.', isSuperset: true, supersetWith: 'Cable Row' },
    ]),
    saturdayHiit(),
    sundayRest,
  ],
};

const w7: Week = {
  number: 7, label: 'W7 – Síla', dateFrom: '2026-05-26', dateTo: '2026-06-01',
  phase: 'Fáze 2 – Rozvoj síly', phaseKey: 'phase2',
  description: 'Nejvyšší intenzita fáze. Triplety na top setu. Ramp série ×5 pro zachování objemu. Volitelně: řetězy na ramp sériích squatu (Zatsiorsky).',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat – RAMP', nameShort: 'Squat RAMP', category: 'main', targetSets: '2', targetReps: '5', targetWeight: '137.5 kg', rpe: '7', note: 'Rampovací série ~77%.', setType: 'ramp' },
      { id: 'squat-top', name: 'Back Squat – TOP SET', nameShort: 'Squat TOP', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '157.5 kg', rpe: '8–9', note: 'Hlavní pracovní set. Autoreguluj!', setType: 'topset' },
      { id: 'squat-bo', name: 'Back Squat – BACK-OFF', nameShort: 'Squat BO', category: 'main', targetSets: '2', targetReps: '4', targetWeight: '150 kg', rpe: '7–8', note: '−5% z top setu.', setType: 'backoff' },
      { id: 'pause-squat', name: 'Pause Squat (2s)', nameShort: 'Pause Squat', category: 'accessory', targetSets: '3', targetReps: '3', targetWeight: '127.5 kg', rpe: '8', note: '2s pauza dole.' },
      { id: 'hack-squat', name: 'Hack Squat (stroj)', nameShort: 'Hack Squat', category: 'accessory', targetSets: '3', targetReps: '5', targetWeight: 'Střední', rpe: '7–8', note: 'Fatigue mgmt.' },
      { id: 'ghd', name: 'GHD Raise', category: 'core', targetSets: '3', targetReps: '8–10', note: 'Superset A1.', isSuperset: true, supersetWith: 'Pallof Press' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '2', targetReps: '10/strana', note: 'Superset A2.', isSuperset: true, supersetWith: 'GHD Raise' },
    ]),
    upperDay([
      { id: 'bench', name: 'Bench Press – RAMP', nameShort: 'Bench RAMP', category: 'main', targetSets: '2', targetReps: '5', targetWeight: '92.5 kg', rpe: '7', note: 'Rampovací série.', setType: 'ramp' },
      { id: 'bench-top', name: 'Bench Press – TOP SET', nameShort: 'Bench TOP', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '105 kg', rpe: '8–9', note: 'Hlavní pracovní set.', setType: 'topset' },
      { id: 'bench-bo', name: 'Bench Press – BACK-OFF', nameShort: 'Bench BO', category: 'main', targetSets: '2', targetReps: '4', targetWeight: '100 kg', rpe: '7–8', note: '−5% z top setu.', setType: 'backoff' },
      { id: 'spoto', name: 'Spoto Press', nameShort: 'Spoto Press', category: 'accessory', targetSets: '3', targetReps: '4', targetWeight: '87.5 kg', rpe: '8', note: '2–3 cm nad hrudníkem.' },
      { id: 'lat-pulldown', name: 'Lat Pulldown (stroj)', nameShort: 'Lat Pulldown', category: 'accessory', targetSets: '3', targetReps: '8–12', targetWeight: 'Střední–těžká', rpe: '7–8', note: 'Fatigue mgmt.' },
      { id: 'dips', name: 'Dips', category: 'accessory', targetSets: '3', targetReps: '5', targetWeight: '+5–10 kg', rpe: '7–8', note: 'Superset A1.', isSuperset: true, supersetWith: 'Face Pulls' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15–20', note: 'Superset A2.', isSuperset: true, supersetWith: 'Dips' },
    ]),
    wednesdayHiit(),
    thursdayRun(7, 'Intervaly', '30 min', '10 min easy + 4×2 min hard/2 min easy + 6 min easy. Zóna 2–4'),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift – RAMP', nameShort: 'DL RAMP', category: 'main', targetSets: '2', targetReps: '5', targetWeight: '162.5 kg', rpe: '7', note: 'Rampovací série.', setType: 'ramp' },
      { id: 'deadlift-top', name: 'Deadlift – TOP SET', nameShort: 'DL TOP', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '185 kg', rpe: '8–9', note: 'RPE 8–9. Autoreguluj!', setType: 'topset' },
      { id: 'deadlift-bo', name: 'Deadlift – BACK-OFF', nameShort: 'DL BO', category: 'main', targetSets: '2', targetReps: '4', targetWeight: '175 kg', rpe: '7–8', note: '−5% z top setu.', setType: 'backoff' },
      { id: 'front-squat', name: 'Front Squat', nameShort: 'Front Squat', category: 'accessory', targetSets: '3', targetReps: '4', targetWeight: '100–112.5 kg', rpe: '7–8', note: 'Quady + core.' },
      { id: 'long-pause-bench', name: 'Long Pause Bench (3s)', nameShort: 'Pause Bench', category: 'accessory', targetSets: '3', targetReps: '4', targetWeight: '82.5 kg', rpe: '7–8', note: '3s pauza na hrudi.' },
      { id: 'cable-row', name: 'Cable Row (stroj)', nameShort: 'Cable Row', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: 'Střední', rpe: '8', note: 'Superset A1.', isSuperset: true, supersetWith: 'Nordic Curls' },
      { id: 'nordic-curls', name: 'Nordic Curls', category: 'prevention', targetSets: '3', targetReps: '5', note: 'Superset A2.', isSuperset: true, supersetWith: 'Cable Row' },
    ]),
    saturdayHiit(),
    sundayRest,
  ],
};

const w8: Week = {
  number: 8, label: 'W8 – DELOAD', dateFrom: '2026-06-02', dateTo: '2026-06-08',
  phase: 'Fáze 2 – Deload', phaseKey: 'deload', isDeload: true,
  description: 'DELOAD TÝDEN. Objem −50%, váhy ~78% (Israetel). Regenerace CNS před intenzifikací.',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat', nameShort: 'Back Squat', category: 'main', targetSets: '3', targetReps: '3', targetWeight: '140 kg', rpe: '6–7', note: 'DELOAD: lehké triplety.', setType: 'deload' },
      { id: 'pause-squat', name: 'Pause Squat (2s)', nameShort: 'Pause Squat', category: 'accessory', targetSets: '2', targetReps: '3', targetWeight: '122.5 kg', rpe: '6', note: 'DELOAD: udržovací.', setType: 'deload' },
      { id: 'leg-press', name: 'Leg Press (stroj)', nameShort: 'Leg Press', category: 'accessory', targetSets: '2', targetReps: '8', targetWeight: 'Střední', rpe: '6', note: 'DELOAD: strojový objem.', setType: 'deload' },
      { id: 'ghd', name: 'GHD Raise', category: 'core', targetSets: '2', targetReps: '8', note: 'BW. DELOAD.', setType: 'deload' },
    ]),
    upperDay([
      { id: 'bench', name: 'Bench Press', nameShort: 'Bench Press', category: 'main', targetSets: '3', targetReps: '3', targetWeight: '92.5 kg', rpe: '6–7', note: 'DELOAD.', setType: 'deload' },
      { id: 'spoto', name: 'Spoto Press', nameShort: 'Spoto Press', category: 'accessory', targetSets: '2', targetReps: '3', targetWeight: '85 kg', rpe: '6', note: 'DELOAD.', setType: 'deload' },
      { id: 'lat-pulldown', name: 'Lat Pulldown (stroj)', nameShort: 'Lat Pulldown', category: 'accessory', targetSets: '2', targetReps: '8', targetWeight: 'Lehká–střední', rpe: '6', note: 'DELOAD: udržovací.', setType: 'deload' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15', note: 'Lehká. Prehab.', setType: 'deload' },
    ]),
    wednesdayHiit(),
    thursdayRun(8, 'Recovery jog', '20 min', 'Zóna 1–2 (lehce)'),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift', nameShort: 'Deadlift', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '162.5 kg', rpe: '6–7', note: 'DELOAD.', setType: 'deload' },
      { id: 'front-squat', name: 'Front Squat', nameShort: 'Front Squat', category: 'accessory', targetSets: '2', targetReps: '4', targetWeight: '90 kg', rpe: '6', note: 'DELOAD.', setType: 'deload' },
      { id: 'barbell-row', name: 'Barbell Row', nameShort: 'BB Row', category: 'accessory', targetSets: '2', targetReps: '8', targetWeight: '67.5 kg', rpe: '6', note: 'DELOAD.', setType: 'deload' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15', note: 'Lehká. Prehab.', setType: 'deload' },
    ]),
    saturdayHiit(),
    sundayRest,
  ],
};

// ============================================================
// FÁZE 3: INTENZIFIKACE (W9–12) – 9.6.–6.7.2026
// Intenzita 85–95% 1RM | RPE 9 | Metoda maximálního úsilí
// Pyramida: ramp → top set → back-off (−8%)
// ============================================================

const w9: Week = {
  number: 9, label: 'W9 – Intenzifikace', dateFrom: '2026-06-09', dateTo: '2026-06-15',
  phase: 'Fáze 3 – Intenzifikace', phaseKey: 'phase3',
  description: 'Vstup do intenzifikace. 85% 1RM, RPE 8–9. Metoda maximálního úsilí (Zatsiorsky). Pyramida s back-off −8%.',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat – RAMP', nameShort: 'Squat RAMP', category: 'main', targetSets: '2', targetReps: '4', targetWeight: '145 kg', rpe: '7', note: 'Rampovací série ~80%.', setType: 'ramp' },
      { id: 'squat-top', name: 'Back Squat – TOP SET', nameShort: 'Squat TOP', category: 'main', targetSets: '1', targetReps: '2', targetWeight: '162.5 kg', rpe: '8–9', note: 'Double. Metoda max. úsilí (Zatsiorsky).', setType: 'topset' },
      { id: 'squat-bo', name: 'Back Squat – BACK-OFF', nameShort: 'Squat BO', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '150 kg', rpe: '7–8', note: '−8% z top setu.', setType: 'backoff' },
      { id: 'pause-squat', name: 'Pause Squat (2s)', nameShort: 'Pause Squat', category: 'accessory', targetSets: '3', targetReps: '3', targetWeight: '132.5 kg', rpe: '8–9', note: '2s pauza. Specifická síla.' },
      { id: 'hack-squat', name: 'Hack Squat (stroj)', nameShort: 'Hack Squat', category: 'accessory', targetSets: '2', targetReps: '6', targetWeight: 'Střední', rpe: '7', note: 'Fatigue mgmt: udržovací quad objem.' },
      { id: 'ghd', name: 'GHD Raise', category: 'core', targetSets: '2', targetReps: '8', note: 'Superset A1.', isSuperset: true, supersetWith: 'Pallof Press' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '2', targetReps: '8/strana', note: 'Lehká. Superset A2.', isSuperset: true, supersetWith: 'GHD Raise' },
    ]),
    upperDay([
      { id: 'bench', name: 'Bench Press – RAMP', nameShort: 'Bench RAMP', category: 'main', targetSets: '2', targetReps: '4', targetWeight: '95 kg', rpe: '7', note: 'Rampovací série ~80%.', setType: 'ramp' },
      { id: 'bench-top', name: 'Bench Press – TOP SET', nameShort: 'Bench TOP', category: 'main', targetSets: '1', targetReps: '2', targetWeight: '107.5 kg', rpe: '8–9', note: 'Double. Plný setup.', setType: 'topset' },
      { id: 'bench-bo', name: 'Bench Press – BACK-OFF', nameShort: 'Bench BO', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '100 kg', rpe: '7–8', note: '−8% z top setu.', setType: 'backoff' },
      { id: 'larsen', name: 'Larsen Press', nameShort: 'Larsen Press', category: 'accessory', targetSets: '3', targetReps: '4', targetWeight: '87.5 kg', rpe: '8', note: 'Specifická slabina.' },
      { id: 'lat-pulldown', name: 'Lat Pulldown (stroj)', nameShort: 'Lat Pulldown', category: 'accessory', targetSets: '2', targetReps: '8', targetWeight: 'Střední', rpe: '7', note: 'Fatigue mgmt.' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15', note: 'Lehká. Prehab.', setType: 'deload' },
    ]),
    wednesdayHiit(),
    thursdayRun(9, 'Tempo run', '35 min', '8 min easy + 18 min tempo + 9 min easy. Zóna 2–3'),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift – RAMP', nameShort: 'DL RAMP', category: 'main', targetSets: '2', targetReps: '4', targetWeight: '170 kg', rpe: '7', note: 'Rampovací série ~75%.', setType: 'ramp' },
      { id: 'deadlift-top', name: 'Deadlift – TOP SET', nameShort: 'DL TOP', category: 'main', targetSets: '1', targetReps: '2', targetWeight: '192.5 kg', rpe: '8–9', note: 'Double. RPE 8–9.', setType: 'topset' },
      { id: 'deadlift-bo', name: 'Deadlift – BACK-OFF', nameShort: 'DL BO', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '177.5 kg', rpe: '7–8', note: '−8% z top setu.', setType: 'backoff' },
      { id: 'front-squat', name: 'Front Squat', nameShort: 'Front Squat', category: 'accessory', targetSets: '3', targetReps: '4', targetWeight: '105–115 kg', rpe: '7–8', note: 'Quady + core.' },
      { id: 'long-pause-bench', name: 'Long Pause Bench (3s)', nameShort: 'Pause Bench', category: 'accessory', targetSets: '2', targetReps: '4', targetWeight: '85 kg', rpe: '7–8', note: '3s pauza.' },
      { id: 'cable-row', name: 'Cable Row (stroj)', nameShort: 'Cable Row', category: 'accessory', targetSets: '2', targetReps: '8', targetWeight: 'Střední', rpe: '7', note: 'Superset A1.', isSuperset: true, supersetWith: 'Nordic Curls' },
      { id: 'nordic-curls', name: 'Nordic Curls', category: 'prevention', targetSets: '2', targetReps: '5', note: 'Superset A2.', isSuperset: true, supersetWith: 'Cable Row' },
    ]),
    saturdayHiit(),
    sundayRest,
  ],
};

const w10: Week = {
  number: 10, label: 'W10 – Intenzifikace', dateFrom: '2026-06-16', dateTo: '2026-06-22',
  phase: 'Fáze 3 – Intenzifikace', phaseKey: 'phase3',
  description: 'Progrese: top set → singles s 90–92%. Ramp série ×3. Intenzita roste, objem klesá.',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat – RAMP', nameShort: 'Squat RAMP', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '150 kg', rpe: '7', note: 'Rampovací série ~83%.', setType: 'ramp' },
      { id: 'squat-top', name: 'Back Squat – TOP SET', nameShort: 'Squat TOP', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '167.5 kg', rpe: '8–9', note: 'Single. Metoda max. úsilí!', setType: 'topset' },
      { id: 'squat-bo', name: 'Back Squat – BACK-OFF', nameShort: 'Squat BO', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '155 kg', rpe: '7–8', note: '−8% z top setu.', setType: 'backoff' },
      { id: 'pause-squat', name: 'Pause Squat (2s)', nameShort: 'Pause Squat', category: 'accessory', targetSets: '2', targetReps: '3', targetWeight: '137.5 kg', rpe: '8', note: '2s pauza.' },
      { id: 'hack-squat', name: 'Hack Squat (stroj)', nameShort: 'Hack Squat', category: 'accessory', targetSets: '2', targetReps: '5', targetWeight: 'Střední', rpe: '7', note: 'Fatigue mgmt.' },
      { id: 'ghd', name: 'GHD Raise', category: 'core', targetSets: '2', targetReps: '8', note: 'Superset A1.', isSuperset: true, supersetWith: 'Pallof Press' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '2', targetReps: '8/strana', note: 'Superset A2.', isSuperset: true, supersetWith: 'GHD Raise' },
    ]),
    upperDay([
      { id: 'bench', name: 'Bench Press – RAMP', nameShort: 'Bench RAMP', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '97.5 kg', rpe: '7', note: 'Rampovací série.', setType: 'ramp' },
      { id: 'bench-top', name: 'Bench Press – TOP SET', nameShort: 'Bench TOP', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '110 kg', rpe: '8–9', note: 'Single. Plný setup.', setType: 'topset' },
      { id: 'bench-bo', name: 'Bench Press – BACK-OFF', nameShort: 'Bench BO', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '102.5 kg', rpe: '7–8', note: '−8% z top setu.', setType: 'backoff' },
      { id: 'larsen', name: 'Larsen Press', nameShort: 'Larsen Press', category: 'accessory', targetSets: '2', targetReps: '4', targetWeight: '90 kg', rpe: '8', note: 'Specifická slabina.' },
      { id: 'lat-pulldown', name: 'Lat Pulldown (stroj)', nameShort: 'Lat Pulldown', category: 'accessory', targetSets: '2', targetReps: '8', targetWeight: 'Střední', rpe: '7', note: 'Fatigue mgmt.' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15', note: 'Lehká. Prehab.' },
    ]),
    wednesdayHiit(),
    thursdayRun(10, 'Intervaly', '32 min', '10 min easy + 5×2 min hard/90s easy + 6 min easy. Zóna 2–4'),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift – RAMP', nameShort: 'DL RAMP', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '177.5 kg', rpe: '7', note: 'Rampovací série.', setType: 'ramp' },
      { id: 'deadlift-top', name: 'Deadlift – TOP SET', nameShort: 'DL TOP', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '200 kg', rpe: '8–9', note: 'Single. RPE 8–9.', setType: 'topset' },
      { id: 'deadlift-bo', name: 'Deadlift – BACK-OFF', nameShort: 'DL BO', category: 'main', targetSets: '2', targetReps: '2', targetWeight: '185 kg', rpe: '7–8', note: '−8% z top setu.', setType: 'backoff' },
      { id: 'front-squat', name: 'Front Squat', nameShort: 'Front Squat', category: 'accessory', targetSets: '2', targetReps: '4', targetWeight: '107.5–117.5 kg', rpe: '7–8', note: 'Quady + core.' },
      { id: 'long-pause-bench', name: 'Long Pause Bench (3s)', nameShort: 'Pause Bench', category: 'accessory', targetSets: '2', targetReps: '3', targetWeight: '87.5 kg', rpe: '7–8', note: '3s pauza.' },
      { id: 'cable-row', name: 'Cable Row (stroj)', nameShort: 'Cable Row', category: 'accessory', targetSets: '2', targetReps: '8', targetWeight: 'Střední', rpe: '7', note: 'Superset A1.', isSuperset: true, supersetWith: 'Nordic Curls' },
      { id: 'nordic-curls', name: 'Nordic Curls', category: 'prevention', targetSets: '2', targetReps: '5', note: 'Superset A2.', isSuperset: true, supersetWith: 'Cable Row' },
    ]),
    saturdayHiit(),
    sundayRest,
  ],
};

const w11: Week = {
  number: 11, label: 'W11 – Intenzifikace', dateFrom: '2026-06-23', dateTo: '2026-06-29',
  phase: 'Fáze 3 – Intenzifikace', phaseKey: 'phase3',
  description: 'Nejtěžší týden intenzifikace. Singles na 92–95%. Minimální doplňkový objem.',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat – RAMP', nameShort: 'Squat RAMP', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '152.5 kg', rpe: '7', note: 'Rampovací série ~85%.', setType: 'ramp' },
      { id: 'squat-top', name: 'Back Squat – TOP SET', nameShort: 'Squat TOP', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '172.5 kg', rpe: '9', note: 'Heavy single ~96%. Pokud RPE > 9.5 → zastav!', setType: 'topset' },
      { id: 'squat-bo', name: 'Back Squat – BACK-OFF', nameShort: 'Squat BO', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '157.5 kg', rpe: '7–8', note: '−8% z top setu.', setType: 'backoff' },
      { id: 'pause-squat', name: 'Pause Squat (2s)', nameShort: 'Pause Squat', category: 'accessory', targetSets: '2', targetReps: '2', targetWeight: '142.5 kg', rpe: '8', note: '2s pauza.' },
      { id: 'ghd', name: 'GHD Raise', category: 'core', targetSets: '2', targetReps: '8', note: 'BW. Superset A1.', isSuperset: true, supersetWith: 'Pallof Press' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '2', targetReps: '8/strana', note: 'Lehká. Superset A2.', isSuperset: true, supersetWith: 'GHD Raise' },
    ]),
    upperDay([
      { id: 'bench', name: 'Bench Press – RAMP', nameShort: 'Bench RAMP', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '100 kg', rpe: '7', note: 'Rampovací série.', setType: 'ramp' },
      { id: 'bench-top', name: 'Bench Press – TOP SET', nameShort: 'Bench TOP', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '112.5 kg', rpe: '9', note: 'Heavy single ~94%. Plný setup!', setType: 'topset' },
      { id: 'bench-bo', name: 'Bench Press – BACK-OFF', nameShort: 'Bench BO', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '105 kg', rpe: '7–8', note: '−8% z top setu.', setType: 'backoff' },
      { id: 'larsen', name: 'Larsen Press', nameShort: 'Larsen Press', category: 'accessory', targetSets: '2', targetReps: '3', targetWeight: '92.5 kg', rpe: '8', note: 'Specifická slabina.' },
      { id: 'lat-pulldown', name: 'Lat Pulldown (stroj)', nameShort: 'Lat Pulldown', category: 'accessory', targetSets: '2', targetReps: '8', targetWeight: 'Lehká–střední', rpe: '7', note: 'Fatigue mgmt.' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15', note: 'Lehká. Prehab.' },
    ]),
    wednesdayHiit(),
    thursdayRun(11, 'Tempo + intervaly', '35 min', '10 min easy + 10 min tempo + 3×1 min sprint/2 min + 5 min easy. Zóna 2–5'),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift – RAMP', nameShort: 'DL RAMP', category: 'main', targetSets: '2', targetReps: '2', targetWeight: '182.5 kg', rpe: '7', note: 'Rampovací série.', setType: 'ramp' },
      { id: 'deadlift-top', name: 'Deadlift – TOP SET', nameShort: 'DL TOP', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '207.5 kg', rpe: '9', note: 'Heavy single ~92%. RPE 9.', setType: 'topset' },
      { id: 'deadlift-bo', name: 'Deadlift – BACK-OFF', nameShort: 'DL BO', category: 'main', targetSets: '1', targetReps: '2', targetWeight: '190 kg', rpe: '7–8', note: '−8% z top setu.', setType: 'backoff' },
      { id: 'front-squat', name: 'Front Squat', nameShort: 'Front Squat', category: 'accessory', targetSets: '2', targetReps: '3', targetWeight: '110–120 kg', rpe: '7–8', note: 'Quady + core.' },
      { id: 'cable-row', name: 'Cable Row (stroj)', nameShort: 'Cable Row', category: 'accessory', targetSets: '2', targetReps: '8', targetWeight: 'Střední', rpe: '7', note: 'Záda – udržovací.' },
    ]),
    saturdayHiit(),
    sundayRest,
  ],
};

const w12: Week = {
  number: 12, label: 'W12 – Mini-deload', dateFrom: '2026-06-30', dateTo: '2026-07-06',
  phase: 'Fáze 3 – Mini-deload', phaseKey: 'deload', isDeload: true,
  description: 'MINI-DELOAD před peakingem. Objem −30%, intenzita zachována. Regenerace před finální fází.',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat – RAMP', nameShort: 'Squat RAMP', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '145 kg', rpe: '7', note: 'Lehká příprava.', setType: 'ramp' },
      { id: 'squat-top', name: 'Back Squat – HEAVY', nameShort: 'Squat HEAVY', category: 'main', targetSets: '1', targetReps: '2+1+1', targetWeight: '160/165/167.5 kg', rpe: '8/8.5', note: 'Double s 160, pak 2 singles s 165/167.5.', setType: 'topset' },
      { id: 'squat-bo', name: 'Back Squat – BACK-OFF', nameShort: 'Squat BO', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '150 kg', rpe: '7', note: 'Lehké triplety.', setType: 'backoff' },
      { id: 'ghd', name: 'GHD Raise', category: 'core', targetSets: '2', targetReps: '8', note: 'BW. Udržovací.', setType: 'deload' },
    ]),
    upperDay([
      { id: 'bench', name: 'Bench Press – RAMP', nameShort: 'Bench RAMP', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '92.5 kg', rpe: '7', note: 'Lehká příprava.', setType: 'ramp' },
      { id: 'bench-top', name: 'Bench Press – HEAVY', nameShort: 'Bench HEAVY', category: 'main', targetSets: '1', targetReps: '2+1+1', targetWeight: '105/110 kg', rpe: '8/8.5', note: 'Double s 105, pak 2 singles s 110.', setType: 'topset' },
      { id: 'bench-bo', name: 'Bench Press – BACK-OFF', nameShort: 'Bench BO', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '97.5 kg', rpe: '7', note: 'Lehké triplety.', setType: 'backoff' },
      { id: 'lat-pulldown', name: 'Lat Pulldown (stroj)', nameShort: 'Lat Pulldown', category: 'accessory', targetSets: '2', targetReps: '8', targetWeight: 'Lehká–střední', rpe: '7', note: 'Fatigue mgmt: udržovací.', setType: 'deload' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15', note: 'Lehká. Prehab.', setType: 'deload' },
    ]),
    wednesdayHiit(),
    thursdayRun(12, 'Easy run', '25 min', 'Zóna 2 (mini-deload – lehce)'),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift – RAMP', nameShort: 'DL RAMP', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '170 kg', rpe: '7', note: 'Lehká příprava.', setType: 'ramp' },
      { id: 'deadlift-top', name: 'Deadlift – HEAVY', nameShort: 'DL HEAVY', category: 'main', targetSets: '1', targetReps: '2+1+1', targetWeight: '190/202.5 kg', rpe: '8/8.5', note: 'Double s 190, pak 2 singles s 202.5.', setType: 'topset' },
      { id: 'deadlift-bo', name: 'Deadlift – BACK-OFF', nameShort: 'DL BO', category: 'main', targetSets: '2', targetReps: '2', targetWeight: '180 kg', rpe: '7', note: 'Lehké doubly.', setType: 'backoff' },
      { id: 'barbell-row', name: 'Barbell Row', nameShort: 'BB Row', category: 'accessory', targetSets: '2', targetReps: '6', targetWeight: '67.5 kg', rpe: '7', note: 'Udržovací.', setType: 'deload' },
    ]),
    saturdayHiit(),
    sundayRest,
  ],
};

// ============================================================
// FÁZE 4: PEAKING (W13–16) – 7.7.–3.8.2026
// Intenzita 90–100% 1RM | Metoda max. úsilí | Taper
// Zatsiorského dvou-faktorový model: únava odezní, fitness zůstane
// ============================================================

const w13: Week = {
  number: 13, label: 'W13 – Peaking', dateFrom: '2026-07-07', dateTo: '2026-07-13',
  phase: 'Fáze 4 – Peaking', phaseKey: 'phase4',
  description: 'Vstup do peakingu. Singles na 90–92%. Minimální doplňkový objem. Šetři energii na maxima.',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat – RAMP', nameShort: 'Squat RAMP', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '145 kg', rpe: '7', note: 'Přípravné triplety.', setType: 'ramp' },
      { id: 'squat-top', name: 'Back Squat – HEAVY', nameShort: 'Squat HEAVY', category: 'main', targetSets: '3', targetReps: '1', targetWeight: '162.5/167.5/170 kg', rpe: '8.5–9.5', note: 'Progresivní singles. Pokud 3. = RPE 10 → zastav!', setType: 'topset' },
      { id: 'squat-bo', name: 'Back Squat – BACK-OFF', nameShort: 'Squat BO', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '150 kg', rpe: '7', note: 'Jeden lehký triplet.', setType: 'backoff' },
    ]),
    upperDay([
      { id: 'bench', name: 'Bench Press – RAMP', nameShort: 'Bench RAMP', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '95 kg', rpe: '7', note: 'Přípravné triplety.', setType: 'ramp' },
      { id: 'bench-top', name: 'Bench Press – HEAVY', nameShort: 'Bench HEAVY', category: 'main', targetSets: '3', targetReps: '1', targetWeight: '112.5/115/117.5 kg', rpe: '8.5–9.5', note: 'Progresivní singles. Plný setup.', setType: 'topset' },
      { id: 'bench-bo', name: 'Bench Press – BACK-OFF', nameShort: 'Bench BO', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '102.5 kg', rpe: '7', note: 'Lehký triplet.', setType: 'backoff' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15', note: 'Lehká. Prehab.' },
    ]),
    wednesdayHiit(),
    thursdayRun(13, 'Easy run', '25 min', 'Zóna 2 (šetři energii)'),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift – RAMP', nameShort: 'DL RAMP', category: 'main', targetSets: '2', targetReps: '2', targetWeight: '180 kg', rpe: '7', note: 'Přípravné doubly.', setType: 'ramp' },
      { id: 'deadlift-top', name: 'Deadlift – HEAVY', nameShort: 'DL HEAVY', category: 'main', targetSets: '3', targetReps: '1', targetWeight: '202.5/210/215 kg', rpe: '8.5–9.5', note: 'Progresivní singles. Poslední těžký DL trénink!', setType: 'topset' },
      { id: 'deadlift-bo', name: 'Deadlift – BACK-OFF', nameShort: 'DL BO', category: 'main', targetSets: '1', targetReps: '2', targetWeight: '185 kg', rpe: '7', note: 'Lehký double.', setType: 'backoff' },
    ]),
    saturdayHiit(),
    sundayRest,
  ],
};

const w14: Week = {
  number: 14, label: 'W14 – Peaking', dateFrom: '2026-07-14', dateTo: '2026-07-20',
  phase: 'Fáze 4 – Peaking', phaseKey: 'phase4',
  description: 'Nejtěžší peaking týden. Přiblížení k maximům – 93–97%. Singles s ramp přípravou. Metoda max. úsilí (Zatsiorsky s.81).',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat – RAMP', nameShort: 'Squat RAMP', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '145 kg', rpe: '7', note: 'Přípravné triplety.', setType: 'ramp' },
      { id: 'squat-top', name: 'Back Squat – HEAVY', nameShort: 'Squat HEAVY', category: 'main', targetSets: '3', targetReps: '1', targetWeight: '167.5/170/175 kg', rpe: '8.5–9.5', note: 'Progresivní singles. Pokud 3. = RPE 10 → zastav!', setType: 'topset' },
      { id: 'squat-bo', name: 'Back Squat – BACK-OFF', nameShort: 'Squat BO', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '152.5 kg', rpe: '7', note: 'Jeden lehký triplet.', setType: 'backoff' },
    ]),
    upperDay([
      { id: 'bench', name: 'Bench Press – RAMP', nameShort: 'Bench RAMP', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '95 kg', rpe: '7', note: 'Přípravné triplety.', setType: 'ramp' },
      { id: 'bench-top', name: 'Bench Press – HEAVY', nameShort: 'Bench HEAVY', category: 'main', targetSets: '3', targetReps: '1', targetWeight: '112.5/115/117.5 kg', rpe: '8.5–9.5', note: 'Progresivní singles. Plný setup.', setType: 'topset' },
      { id: 'bench-bo', name: 'Bench Press – BACK-OFF', nameShort: 'Bench BO', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '102.5 kg', rpe: '7', note: 'Lehký triplet.', setType: 'backoff' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15', note: 'Lehká. Prehab.' },
    ]),
    wednesdayHiit(),
    thursdayRun(14, 'Easy run', '20 min', 'Zóna 1–2 (velmi lehce)'),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift – RAMP', nameShort: 'DL RAMP', category: 'main', targetSets: '2', targetReps: '2', targetWeight: '180 kg', rpe: '7', note: 'Přípravné doubly.', setType: 'ramp' },
      { id: 'deadlift-top', name: 'Deadlift – HEAVY', nameShort: 'DL HEAVY', category: 'main', targetSets: '3', targetReps: '1', targetWeight: '202.5/210/215 kg', rpe: '8.5–9.5', note: 'Progresivní singles. Poslední těžký DL trénink!', setType: 'topset' },
      { id: 'deadlift-bo', name: 'Deadlift – BACK-OFF', nameShort: 'DL BO', category: 'main', targetSets: '1', targetReps: '2', targetWeight: '185 kg', rpe: '7', note: 'Lehký double.', setType: 'backoff' },
    ]),
    saturdayHiit(),
    sundayRest,
  ],
};

const w15: Week = {
  number: 15, label: 'W15 – TAPER', dateFrom: '2026-07-21', dateTo: '2026-07-27',
  phase: 'Fáze 4 – Taper', phaseKey: 'phase4', isDeload: true,
  description: 'TAPER. Drastické snížení objemu – Zatsiorského dvou-faktorový model: únava odezní, fitness zůstane → supercompensace. Žádný běh (Viada). Spánek 8–9 h.',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat – RAMP', nameShort: 'Squat RAMP', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '130 kg', rpe: '6', note: 'Lehká příprava.', setType: 'ramp' },
      { id: 'squat-top', name: 'Back Squat – OPENER', nameShort: 'Squat OPENER', category: 'main', targetSets: '2', targetReps: '2', targetWeight: '147.5 kg', rpe: '6–7', note: 'Opener váha. Lehce, rychle.', setType: 'topset' },
    ]),
    upperDay([
      { id: 'bench', name: 'Bench Press – RAMP', nameShort: 'Bench RAMP', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '87.5 kg', rpe: '6', note: 'Lehká příprava.', setType: 'ramp' },
      { id: 'bench-top', name: 'Bench Press – OPENER', nameShort: 'Bench OPENER', category: 'main', targetSets: '2', targetReps: '2', targetWeight: '97.5 kg', rpe: '6–7', note: 'Opener váha.', setType: 'topset' },
      { id: 'face-pulls', name: 'Face Pulls', category: 'prevention', targetSets: '2', targetReps: '15', note: 'Lehká. Prehab.' },
    ]),
    wednesdayHiit(),
    { key: 'thursday', label: 'Čtvrtek', labelShort: 'Čt', type: 'rest', description: 'VOLNO – Žádný běh (Viada). Energie do peakingu.', exercises: [] },
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift – RAMP', nameShort: 'DL RAMP', category: 'main', targetSets: '2', targetReps: '2', targetWeight: '157.5 kg', rpe: '6', note: 'Lehká příprava.', setType: 'ramp' },
      { id: 'deadlift-top', name: 'Deadlift – OPENER', nameShort: 'DL OPENER', category: 'main', targetSets: '2', targetReps: '1', targetWeight: '185 kg', rpe: '6–7', note: 'Opener váha.', setType: 'topset' },
    ]),
    saturdayHiit(),
    sundayRest,
  ],
};

const w16: Week = {
  number: 16, label: 'W16 – TEST MAXIM', dateFrom: '2026-07-28', dateTo: '2026-08-03',
  phase: 'Fáze 4 – Test maxim', phaseKey: 'phase4',
  description: 'TESTOVACÍ TÝDEN. Po: Squat max (cíl 190 kg). St: Bench max (cíl 130 kg). Pá: Deadlift max (cíl 235 kg). Warm-up dle Zatsiorského: tyč→30%→50%→65%→78%→87%→opener→second→MAX. Min. 3 min pauza mezi pokusy.',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat – WARM-UP 1', nameShort: 'Squat WU1', category: 'main', targetSets: '1', targetReps: '8', targetWeight: '55 kg', rpe: '–', note: '~30% – Rozehřátí.', setType: 'ramp' },
      { id: 'squat-wu2', name: 'Back Squat – WARM-UP 2', nameShort: 'Squat WU2', category: 'main', targetSets: '1', targetReps: '5', targetWeight: '90 kg', rpe: '–', note: '~50% – Aktivace.', setType: 'ramp' },
      { id: 'squat-wu3', name: 'Back Squat – WARM-UP 3', nameShort: 'Squat WU3', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '117.5 kg', rpe: '–', note: '~65% – Groove.', setType: 'ramp' },
      { id: 'squat-wu4', name: 'Back Squat – WARM-UP 4', nameShort: 'Squat WU4', category: 'main', targetSets: '1', targetReps: '2', targetWeight: '140 kg', rpe: '–', note: '~78% – CNS ready.', setType: 'ramp' },
      { id: 'squat-wu5', name: 'Back Squat – WARM-UP 5', nameShort: 'Squat WU5', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '157.5 kg', rpe: '–', note: '~87% – Poslední single.', setType: 'ramp' },
      { id: 'squat-top', name: 'Back Squat – OPENER', nameShort: 'Squat OPENER', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '162.5 kg', rpe: '~7', note: 'Jistota. ~90%.', setType: 'topset' },
      { id: 'squat-2nd', name: 'Back Squat – 2. POKUS', nameShort: 'Squat 2nd', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '170 kg', rpe: '~8.5', note: 'Solidní single. ~95%. Pokud letí → max.', setType: 'topset' },
      { id: 'squat-max', name: 'Back Squat – MAX', nameShort: 'Squat MAX', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '190 kg', rpe: 'MAX', note: '🎯 CÍL: 190 kg! Pokud 2. pokus RPE 9.5+ → 187.5 kg.', setType: 'topset' },
    ]),
    { key: 'tuesday', label: 'Úterý', labelShort: 'Út', type: 'rest', description: 'VOLNO – Regenerace. Lehká procházka, pěnový válec, kvalitní jídlo, spánek.', exercises: [] },
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
        { id: 'bench-2nd', name: 'Bench Press – 2. POKUS', nameShort: 'Bench 2nd', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '115 kg', rpe: '~8.5', note: '~95%. Pokud letí → max.', setType: 'topset' },
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
        { id: 'deadlift-2nd', name: 'Deadlift – 2. POKUS', nameShort: 'DL 2nd', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '215 kg', rpe: '~8.5', note: '~95%. Pokud hladký → max.', setType: 'topset' },
        { id: 'deadlift-max', name: 'Deadlift – MAX', nameShort: 'DL MAX', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '235 kg', rpe: 'MAX', note: '🎯 CÍL: 235 kg! Pokud 2. pokus těžký → 232.5 kg.', setType: 'topset' },
      ],
    },
    saturdayHiit(),
    sundayRest,
  ],
};

// ============================================================
// FULL PLAN EXPORT
// ============================================================
export const PHASE3_WEEKS: Week[] = [w1, w2, w3, w4, w5, w6, w7, w8, w9, w10, w11, w12, w13, w14, w15, w16];

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
  { week: 1, type: 'Easy run', duration: '25 min', zone: 'Z2', description: 'Lehký klus. Konverzační tempo.' },
  { week: 2, type: 'Easy run', duration: '30 min', zone: 'Z2', description: 'Lehký klus. +5 min oproti W1.' },
  { week: 3, type: 'Easy + strides', duration: '30 min', zone: 'Z2+Z4', description: '25 min easy + 4×20s strides / 40s klus.' },
  { week: 4, type: 'Recovery jog', duration: '20 min', zone: 'Z1–Z2', description: 'DELOAD: velmi lehce.' },
  { week: 5, type: 'Tempo run', duration: '30 min', zone: 'Z2–Z3', description: '10 min easy + 10 min tempo + 10 min easy.' },
  { week: 6, type: 'Tempo run', duration: '32 min', zone: 'Z2–Z3', description: '8 min easy + 15 min tempo + 9 min easy.' },
  { week: 7, type: 'Intervaly', duration: '30 min', zone: 'Z2–Z4', description: '10 min easy + 4×2 min hard / 2 min easy + 6 min easy.' },
  { week: 8, type: 'Recovery jog', duration: '20 min', zone: 'Z1–Z2', description: 'DELOAD: lehce.' },
  { week: 9, type: 'Tempo run', duration: '35 min', zone: 'Z2–Z3', description: '8 min easy + 18 min tempo + 9 min easy.' },
  { week: 10, type: 'Intervaly', duration: '32 min', zone: 'Z2–Z4', description: '10 min easy + 5×2 min hard / 90s easy + 6 min easy.' },
  { week: 11, type: 'Tempo + intervaly', duration: '35 min', zone: 'Z2–Z5', description: '10 min easy + 10 min tempo + 3×1 min sprint / 2 min + 5 min easy.' },
  { week: 12, type: 'Easy run', duration: '25 min', zone: 'Z2', description: 'MINI-DELOAD: lehce.' },
  { week: 13, type: 'Easy run', duration: '25 min', zone: 'Z2', description: 'Lehce. Šetři energii.' },
  { week: 14, type: 'Easy run', duration: '20 min', zone: 'Z1–Z2', description: 'Velmi lehce.' },
  { week: 15, type: 'VYNECHAT', duration: '–', zone: '–', description: 'Žádný běh. Energie do peakingu (Viada).' },
  { week: 16, type: 'VYNECHAT', duration: '–', zone: '–', description: 'TEST TÝDEN. Žádný běh.' },
];

// ============================================================
// DEFAULT RECORDS (historical data from CSV + app records)
// ============================================================
export const DEFAULT_RECORDS: RecordsMap = {
  'bench': [
    { id: nanoid(), date: '2026-01-26', sets: '4', weight: '95', reps: '8', note: 'Fáze 1 start' },
    { id: nanoid(), date: '2026-02-02', sets: '4', weight: '97.5', reps: '8', note: '' },
    { id: nanoid(), date: '2026-02-09', sets: '4', weight: '100', reps: '8', note: '' },
    { id: nanoid(), date: '2026-02-16', sets: '4', weight: '100', reps: '8', note: '' },
    { id: nanoid(), date: '2026-02-23', sets: '4', weight: '102.5', reps: '8', note: '' },
    { id: nanoid(), date: '2026-03-02', sets: '4', weight: '105', reps: '8', note: '' },
    { id: nanoid(), date: '2026-03-09', sets: '4', weight: '105', reps: '8', note: '' },
    { id: nanoid(), date: '2026-03-17', sets: '4', weight: '105', reps: '8', note: 'Poslední záznam Fáze 2' },
  ],
  'squat': [
    { id: nanoid(), date: '2026-01-26', sets: '4', weight: '140', reps: '5', note: 'Fáze 1 start' },
    { id: nanoid(), date: '2026-02-02', sets: '4', weight: '145', reps: '5', note: '' },
    { id: nanoid(), date: '2026-02-09', sets: '4', weight: '150', reps: '5', note: '' },
    { id: nanoid(), date: '2026-02-16', sets: '4', weight: '150', reps: '5', note: '' },
    { id: nanoid(), date: '2026-02-23', sets: '4', weight: '155', reps: '5', note: '' },
    { id: nanoid(), date: '2026-03-02', sets: '4', weight: '160', reps: '1', note: 'Nové max!' },
    { id: nanoid(), date: '2026-03-09', sets: '4', weight: '157.5', reps: '3', note: '' },
    { id: nanoid(), date: '2026-03-17', sets: '4', weight: '160', reps: '3', note: 'Poslední záznam Fáze 2' },
  ],
  'deadlift': [
    { id: nanoid(), date: '2026-01-26', sets: '3', weight: '185', reps: '5', note: 'Fáze 1 start' },
    { id: nanoid(), date: '2026-02-02', sets: '3', weight: '190', reps: '5', note: '' },
    { id: nanoid(), date: '2026-02-09', sets: '3', weight: '195', reps: '5', note: '' },
    { id: nanoid(), date: '2026-02-16', sets: '3', weight: '200', reps: '5', note: '' },
    { id: nanoid(), date: '2026-02-23', sets: '3', weight: '205', reps: '3', note: '' },
    { id: nanoid(), date: '2026-03-02', sets: '3', weight: '220', reps: '2', note: 'Nové max!' },
    { id: nanoid(), date: '2026-03-09', sets: '3', weight: '215', reps: '3', note: '' },
    { id: nanoid(), date: '2026-03-17', sets: '3', weight: '230', reps: '2', note: 'Poslední záznam Fáze 2' },
  ],
  'rdl': [
    { id: nanoid(), date: '2026-01-26', sets: '3', weight: '60', reps: '12', note: '' },
    { id: nanoid(), date: '2026-02-09', sets: '3', weight: '65', reps: '12', note: '' },
    { id: nanoid(), date: '2026-02-23', sets: '3', weight: '70', reps: '12', note: '' },
    { id: nanoid(), date: '2026-03-02', sets: '3', weight: '70', reps: '12', note: '' },
    { id: nanoid(), date: '2026-03-17', sets: '3', weight: '70', reps: '12', note: '' },
  ],
  'leg-press': [
    { id: nanoid(), date: '2026-01-26', sets: '3', weight: '180', reps: '12', note: '' },
    { id: nanoid(), date: '2026-02-09', sets: '3', weight: '200', reps: '12', note: '' },
    { id: nanoid(), date: '2026-02-23', sets: '3', weight: '210', reps: '12', note: '' },
    { id: nanoid(), date: '2026-03-02', sets: '3', weight: '220', reps: '12', note: '' },
    { id: nanoid(), date: '2026-03-17', sets: '3', weight: '220', reps: '12', note: '' },
  ],
  'pullup': [
    { id: nanoid(), date: '2026-01-26', sets: '3', weight: '0', reps: '8', note: 'BW' },
    { id: nanoid(), date: '2026-02-09', sets: '3', weight: '5', reps: '6', note: '+5 kg' },
    { id: nanoid(), date: '2026-02-23', sets: '3', weight: '5', reps: '8', note: '' },
    { id: nanoid(), date: '2026-03-09', sets: '3', weight: '10', reps: '6', note: '+10 kg' },
    { id: nanoid(), date: '2026-03-17', sets: '3', weight: '10', reps: '8', note: '' },
  ],
  'front-squat': [
    { id: nanoid(), date: '2026-01-26', sets: '3', weight: '90', reps: '8', note: '' },
    { id: nanoid(), date: '2026-02-09', sets: '3', weight: '95', reps: '8', note: '' },
    { id: nanoid(), date: '2026-02-16', sets: '3', weight: '100', reps: '8', note: '' },
    { id: nanoid(), date: '2026-02-23', sets: '3', weight: '105', reps: '8', note: '' },
    { id: nanoid(), date: '2026-03-02', sets: '3', weight: '105', reps: '8', note: '' },
    { id: nanoid(), date: '2026-03-17', sets: '3', weight: '105', reps: '8', note: '' },
  ],
  'pause-squat': [
    { id: nanoid(), date: '2026-02-09', sets: '3', weight: '100', reps: '5', note: '2s pauza' },
    { id: nanoid(), date: '2026-02-23', sets: '3', weight: '105', reps: '5', note: '' },
    { id: nanoid(), date: '2026-03-09', sets: '3', weight: '107.5', reps: '5', note: '' },
    { id: nanoid(), date: '2026-03-17', sets: '3', weight: '110', reps: '5', note: '' },
  ],
  'spoto': [
    { id: nanoid(), date: '2026-02-09', sets: '3', weight: '75', reps: '8', note: '2-3 cm nad hrudníkem' },
    { id: nanoid(), date: '2026-02-23', sets: '3', weight: '80', reps: '8', note: '' },
    { id: nanoid(), date: '2026-03-09', sets: '3', weight: '82.5', reps: '8', note: '' },
    { id: nanoid(), date: '2026-03-17', sets: '3', weight: '85', reps: '6', note: '' },
  ],
  'barbell-row': [
    { id: nanoid(), date: '2026-01-26', sets: '3', weight: '70', reps: '10', note: '' },
    { id: nanoid(), date: '2026-02-09', sets: '3', weight: '75', reps: '10', note: '' },
    { id: nanoid(), date: '2026-02-23', sets: '3', weight: '80', reps: '10', note: '' },
    { id: nanoid(), date: '2026-03-09', sets: '3', weight: '85', reps: '8', note: '' },
    { id: nanoid(), date: '2026-03-17', sets: '3', weight: '87.5', reps: '8', note: '' },
  ],
  'dips': [
    { id: nanoid(), date: '2026-01-26', sets: '3', weight: '0', reps: '10', note: 'BW' },
    { id: nanoid(), date: '2026-02-09', sets: '3', weight: '5', reps: '10', note: '+5 kg' },
    { id: nanoid(), date: '2026-02-23', sets: '3', weight: '10', reps: '8', note: '' },
    { id: nanoid(), date: '2026-03-09', sets: '3', weight: '10', reps: '10', note: '' },
    { id: nanoid(), date: '2026-03-17', sets: '3', weight: '15', reps: '8', note: '' },
  ],
  'bulgarian': [
    { id: nanoid(), date: '2026-02-02', sets: '3', weight: '30', reps: '10', note: '2×DB' },
    { id: nanoid(), date: '2026-02-16', sets: '3', weight: '35', reps: '10', note: '' },
    { id: nanoid(), date: '2026-03-02', sets: '3', weight: '40', reps: '10', note: '' },
    { id: nanoid(), date: '2026-03-17', sets: '3', weight: '40', reps: '10', note: '' },
  ],
  'larsen': [
    { id: nanoid(), date: '2026-02-02', sets: '3', weight: '70', reps: '10', note: 'Nohy nahoře' },
    { id: nanoid(), date: '2026-02-16', sets: '3', weight: '75', reps: '8', note: '' },
    { id: nanoid(), date: '2026-03-02', sets: '3', weight: '77.5', reps: '8', note: '' },
    { id: nanoid(), date: '2026-03-17', sets: '3', weight: '80', reps: '8', note: '' },
  ],
  'run-thu': [
    { id: nanoid(), date: '2026-02-05', sets: '1', weight: '0', reps: '20 min', note: 'Easy run Z2' },
    { id: nanoid(), date: '2026-02-12', sets: '1', weight: '0', reps: '25 min', note: 'Easy run Z2' },
    { id: nanoid(), date: '2026-02-19', sets: '1', weight: '0', reps: '25 min', note: 'Easy run Z2' },
    { id: nanoid(), date: '2026-03-05', sets: '1', weight: '0', reps: '30 min', note: 'Easy run Z2' },
    { id: nanoid(), date: '2026-03-19', sets: '1', weight: '0', reps: '30 min', note: 'Easy run Z2' },
  ],
  'ghd': [],
  'pallof': [],
  'face-pulls': [],
  'nordic-curls': [],
  'cop-adduction': [],
  'ab-wheel': [],
  'bicep-curl': [],
  'tempo-squat': [],
  'hack-squat': [],
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
  return Math.max(1, Math.min(16, diff + 1));
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
