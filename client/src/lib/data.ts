// Gold Performance Design
// 16týdenní vědecky podložený silově-hypertrofický plán 2026 v2.0
// Fáze 1: Akumulace (W1–4) | Fáze 2: Síla (W5–8) | Fáze 3: Intenzifikace (W9–12) | Fáze 4: Peaking (W13–16)
// Cíle: Dřep 180→190 kg | Bench 120→130 kg | Deadlift 225→235 kg
// ============================================================

export type ExerciseCategory = 'main' | 'accessory' | 'isolation' | 'prevention' | 'core' | 'run';

export interface Exercise {
  id: string;
  name: string;
  nameShort?: string;
  category: ExerciseCategory;
  targetSets: string;
  targetReps: string;
  targetWeight?: string;
  note?: string;
  isDropset?: boolean;
}

export interface WorkoutDay {
  key: string;
  label: string;
  labelShort: string;
  type: 'lower' | 'upper' | 'fullbody' | 'hiit' | 'run' | 'rest';
  description: string;
  exercises: Exercise[];
}

export interface Week {
  number: number;
  label: string;
  dateFrom: string;
  dateTo: string;
  phase: string;
  phaseKey: 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'deload1' | 'deload2';
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
// GOALS & MAXES – aktualizováno dle nového plánu v2.0
// ============================================================
export const GOALS = {
  bench: 130,
  squat: 190,
  deadlift: 235,
};

export const STARTING_MAXES = {
  bench: 120,
  squat: 180,
  deadlift: 225,
};

export const CURRENT_MAXES = {
  bench: 120,
  squat: 180,
  deadlift: 225,
};

// ============================================================
// HELPERS – day builders
// ============================================================

function lowerDay(exercises: Exercise[]): WorkoutDay {
  return {
    key: 'monday', label: 'Pondělí', labelShort: 'Po', type: 'lower',
    description: 'LOWER BODY – Squat focus. Dřep + slabinové variace (pauza, pin, SSB). Core.',
    exercises,
  };
}
function upperDay(exercises: Exercise[]): WorkoutDay {
  return {
    key: 'tuesday', label: 'Úterý', labelShort: 'Út', type: 'upper',
    description: 'UPPER BODY – Bench focus. Bench + slabinové variace (spoto, larsen). Záda, prevence.',
    exercises,
  };
}
function wednesdayHiit(): WorkoutDay {
  return {
    key: 'wednesday', label: 'Středa', labelShort: 'St', type: 'hiit',
    description: 'HIIT – Silově-vytrvalostní kruhový trénink. Pevná lekce.',
    exercises: [{ id: 'hiit-wed', name: 'HIIT – Kruhový trénink', nameShort: 'HIIT', category: 'run', targetSets: '1', targetReps: '~60 min', note: 'Pevná lekce. Silově-vytrvalostní. Okamžitě po: 40–60 g rychlých sacharidů.' }],
  };
}
function thursdayRun(week: number, type: string, duration: string, zone: string): WorkoutDay {
  return {
    key: 'thursday', label: 'Čtvrtek', labelShort: 'Čt', type: 'run',
    description: `BĚH – ${type}. Minimálně 24h buffer před pátečním deadliftem.`,
    exercises: [{ id: 'run-thu', name: `Běh – ${type}`, nameShort: 'Běh', category: 'run', targetSets: '1', targetReps: duration, note: `${zone}. W${week}: ${type}` }],
  };
}
function fullBodyDay(exercises: Exercise[]): WorkoutDay {
  return {
    key: 'friday', label: 'Pátek', labelShort: 'Pá', type: 'fullbody',
    description: 'FULL BODY – Deadlift focus. Mrtvý tah + bench variace + squat variace. Nordic curls.',
    exercises,
  };
}
function saturdayHiit(): WorkoutDay {
  return {
    key: 'saturday', label: 'Sobota', labelShort: 'So', type: 'hiit',
    description: 'HIIT – Silově-vytrvalostní kruhový trénink. Pevná lekce.',
    exercises: [{ id: 'hiit-sat', name: 'HIIT – Kruhový trénink', nameShort: 'HIIT', category: 'run', targetSets: '1', targetReps: '~60 min', note: 'Pevná lekce. Po pátečním deadliftu – regenerace zadního řetězce.' }],
  };
}
const sundayRest: WorkoutDay = {
  key: 'sunday', label: 'Neděle', labelShort: 'Ne', type: 'rest',
  description: 'VOLNO – Kompletní regenerace. Pěnový válec, strečink, procházka. Spánek 8+ h.',
  exercises: [],
};

// ============================================================
// FÁZE 1: AKUMULACE (W1–4) – 13.4.–10.5.2026
// Intenzita 65–78 % 1RM | 6–10 opak | RPE 7–8 | Vysoký objem
// Hlavní slabiny: SSB squat, Tempo squat, Larsen press, Deficit DL
// ============================================================

const w1: Week = {
  number: 1, label: 'W1 – Akumulace', dateFrom: '2026-04-13', dateTo: '2026-04-19',
  phase: 'Fáze 1 – Akumulace', phaseKey: 'phase1',
  description: 'Vstup do akumulace. 65% 1RM, RPE 7. Technika a slabinové variace. Double progression: nejprve přidej rep (6→8→10), pak váhu.',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', targetSets: '3', targetReps: '8', targetWeight: '117 kg', note: '65% 1RM, RPE 7. Soutěžní technika.' },
      { id: 'tempo-squat', name: 'Tempo Squat (3-1-0)', nameShort: 'Tempo Squat', category: 'accessory', targetSets: '3', targetReps: '6–8', targetWeight: '117 kg', note: '3s excentrika, 1s pauza dole. 65% 1RM. Cílí díru.' },
      { id: 'ghd', name: 'GHD Raise', category: 'accessory', targetSets: '3', targetReps: '8–10', note: 'BW nebo +5 kg. Hamstringy a hýždě.' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '3', targetReps: '8/strana', note: 'Střední odpor. Core stabilita.' },
    ]),
    upperDay([
      { id: 'bench', name: 'Bench Press (Competition)', nameShort: 'Bench Press', category: 'main', targetSets: '3', targetReps: '8', targetWeight: '78 kg', note: '65% 1RM, RPE 7. Plný soutěžní setup.' },
      { id: 'larsen-press', name: 'Larsen Press', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: '65 kg', note: 'Nohy nahoře. Izolace prsu bez leg drive. Cílí start z prsu.', isDropset: false },
      { id: 'pull-up', name: 'Weighted Pull-Up', nameShort: 'Shyby', category: 'accessory', targetSets: '3', targetReps: '6–8', targetWeight: '+10 kg', note: 'RPE 7–8. Plný ROM.' },
      { id: 'face-pull', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15–20', note: 'Lehká váha. PREHAB – každý upper body den!' },
      { id: 'band-pull', name: 'Band Pull-Aparts', category: 'prevention', targetSets: '2', targetReps: '15', note: 'Před benchem jako aktivace.' },
      { id: 'core-upper', name: 'Ab Wheel / Dead Bugs', nameShort: 'Core', category: 'core', targetSets: '3', targetReps: '10', note: 'Core v každém tréninku.' },
    ]),
    wednesdayHiit(),
    thursdayRun(1, 'Easy run', '25 min', 'Zóna 2 – konverzační tempo'),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Mrtvý tah', category: 'main', targetSets: '3', targetReps: '6–8', targetWeight: '146 kg', note: '65% 1RM, RPE 7. Vertikální dráha tyče.' },
      { id: 'deficit-dl', name: 'Deficit Deadlift (5 cm)', nameShort: 'Deficit DL', category: 'accessory', targetSets: '3', targetReps: '5–8', targetWeight: '124 kg', note: '55% 1RM. Stoj na 5cm podložce. Síla odtržení.' },
      { id: 'ssb-squat', name: 'SSB Squat', category: 'accessory', targetSets: '3', targetReps: '6–8', targetWeight: '100 kg', note: 'Safety Squat Bar. Quady + vzpřimovače. Cílí díru.' },
      { id: 'barbell-row', name: 'Barbell Row', nameShort: 'Řady', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: '80 kg', note: 'Předklon 45°. Silná záda = silný deadlift.' },
      { id: 'nordic', name: 'Nordic Curls', category: 'prevention', targetSets: '3', targetReps: '5', note: 'BW. Prevence hamstringů. 1×/týden.' },
    ]),
    saturdayHiit(),
    sundayRest,
  ],
};

const w2: Week = {
  number: 2, label: 'W2 – Akumulace', dateFrom: '2026-04-20', dateTo: '2026-04-26',
  phase: 'Fáze 1 – Akumulace', phaseKey: 'phase1',
  description: '+2,5 kg na hlavních liftech. Double progression pokračuje. RPE 7–8.',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', targetSets: '4', targetReps: '8', targetWeight: '117–122 kg', note: 'RPE 7–8. Přidej sérii oproti W1.' },
      { id: 'tempo-squat', name: 'Tempo Squat (3-1-0)', nameShort: 'Tempo Squat', category: 'accessory', targetSets: '3', targetReps: '6–8', targetWeight: '120 kg', note: '3s excentrika. Cílí díru.' },
      { id: 'ghd', name: 'GHD Raise', category: 'accessory', targetSets: '3', targetReps: '8–10', note: 'BW nebo +5–10 kg.' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '3', targetReps: '8/strana', note: 'Střední odpor.' },
    ]),
    upperDay([
      { id: 'bench', name: 'Bench Press (Competition)', nameShort: 'Bench Press', category: 'main', targetSets: '4', targetReps: '8', targetWeight: '80 kg', note: 'RPE 7–8. +2 kg oproti W1.' },
      { id: 'larsen-press', name: 'Larsen Press', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: '67.5 kg', note: 'Nohy nahoře. Cílí start z prsu.' },
      { id: 'pull-up', name: 'Weighted Pull-Up', nameShort: 'Shyby', category: 'accessory', targetSets: '4', targetReps: '6–8', targetWeight: '+12 kg', note: 'RPE 7–8.' },
      { id: 'face-pull', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15–20', note: 'Prehab.' },
      { id: 'band-pull', name: 'Band Pull-Aparts', category: 'prevention', targetSets: '2', targetReps: '15', note: 'Aktivace před benchem.' },
      { id: 'core-upper', name: 'Ab Wheel / Dead Bugs', nameShort: 'Core', category: 'core', targetSets: '3', targetReps: '10', note: 'Core.' },
    ]),
    wednesdayHiit(),
    thursdayRun(2, 'Easy run', '30 min', 'Zóna 2 – +5 min oproti W1'),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Mrtvý tah', category: 'main', targetSets: '4', targetReps: '6–8', targetWeight: '148.5 kg', note: 'RPE 7–8. +2,5 kg oproti W1.' },
      { id: 'deficit-dl', name: 'Deficit Deadlift (5 cm)', nameShort: 'Deficit DL', category: 'accessory', targetSets: '3', targetReps: '5–8', targetWeight: '126 kg', note: '5 cm podložka. Síla odtržení.' },
      { id: 'ssb-squat', name: 'SSB Squat', category: 'accessory', targetSets: '3', targetReps: '6–8', targetWeight: '102.5 kg', note: 'SSB. Quady + vzpřimovače.' },
      { id: 'barbell-row', name: 'Barbell Row', nameShort: 'Řady', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: '82.5 kg', note: 'Silná záda.' },
      { id: 'nordic', name: 'Nordic Curls', category: 'prevention', targetSets: '3', targetReps: '5', note: 'BW. Prevence.' },
    ]),
    saturdayHiit(),
    sundayRest,
  ],
};

const w3: Week = {
  number: 3, label: 'W3 – Akumulace', dateFrom: '2026-04-27', dateTo: '2026-05-03',
  phase: 'Fáze 1 – Akumulace', phaseKey: 'phase1',
  description: 'Vrchol akumulačního objemu. +2,5–5 kg. RPE 8. Nejvyšší objem celé Fáze 1.',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', targetSets: '4', targetReps: '8–10', targetWeight: '122–127 kg', note: 'RPE 8. Vrchol objemu.' },
      { id: 'tempo-squat', name: 'Tempo Squat (3-1-0)', nameShort: 'Tempo Squat', category: 'accessory', targetSets: '3', targetReps: '6–8', targetWeight: '122 kg', note: '3s excentrika. Cílí díru.' },
      { id: 'ghd', name: 'GHD Raise', category: 'accessory', targetSets: '3', targetReps: '8–12', note: 'BW nebo +10 kg.' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '3', targetReps: '10/strana', note: 'Střední odpor.' },
    ]),
    upperDay([
      { id: 'bench', name: 'Bench Press (Competition)', nameShort: 'Bench Press', category: 'main', targetSets: '4', targetReps: '8–10', targetWeight: '82.5 kg', note: 'RPE 8. Vrchol objemu.' },
      { id: 'larsen-press', name: 'Larsen Press', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: '70 kg', note: 'Nohy nahoře. Cílí start z prsu.' },
      { id: 'pull-up', name: 'Weighted Pull-Up', nameShort: 'Shyby', category: 'accessory', targetSets: '4', targetReps: '6–8', targetWeight: '+15 kg', note: 'RPE 8.' },
      { id: 'face-pull', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15–20', note: 'Prehab.' },
      { id: 'band-pull', name: 'Band Pull-Aparts', category: 'prevention', targetSets: '2', targetReps: '15', note: 'Aktivace.' },
      { id: 'core-upper', name: 'Ab Wheel / Dead Bugs', nameShort: 'Core', category: 'core', targetSets: '3', targetReps: '10–12', note: 'Core.' },
    ]),
    wednesdayHiit(),
    thursdayRun(3, 'Easy + strides', '30 min', 'Zóna 2 + 4× 20s strides / 40s klus'),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Mrtvý tah', category: 'main', targetSets: '4', targetReps: '6–8', targetWeight: '151 kg', note: 'RPE 8. Vrchol objemu.' },
      { id: 'deficit-dl', name: 'Deficit Deadlift (5 cm)', nameShort: 'Deficit DL', category: 'accessory', targetSets: '3', targetReps: '5–8', targetWeight: '128 kg', note: '5 cm podložka.' },
      { id: 'ssb-squat', name: 'SSB Squat', category: 'accessory', targetSets: '3', targetReps: '6–8', targetWeight: '105 kg', note: 'SSB. Quady.' },
      { id: 'barbell-row', name: 'Barbell Row', nameShort: 'Řady', category: 'accessory', targetSets: '3', targetReps: '8–10', targetWeight: '85 kg', note: 'Silná záda.' },
      { id: 'nordic', name: 'Nordic Curls', category: 'prevention', targetSets: '3', targetReps: '5', note: 'BW. Prevence.' },
    ]),
    saturdayHiit(),
    sundayRest,
  ],
};

const w4: Week = {
  number: 4, label: 'W4 – Deload', dateFrom: '2026-05-04', dateTo: '2026-05-10',
  phase: 'Fáze 1 – Deload', phaseKey: 'deload1',
  isDeload: true,
  description: 'DELOAD: Objem -50%, intenzita zachována na 80%. Regenerace před Fází 2. Běh: recovery jog 20 min.',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', targetSets: '2', targetReps: '5', targetWeight: '117 kg', note: 'RPE 6–7. Technicky čistě. Deload.' },
      { id: 'ghd', name: 'GHD Raise', category: 'accessory', targetSets: '2', targetReps: '8', note: 'BW. Lehce.' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '2', targetReps: '8/strana', note: 'Lehká váha.' },
    ]),
    upperDay([
      { id: 'bench', name: 'Bench Press (Competition)', nameShort: 'Bench Press', category: 'main', targetSets: '2', targetReps: '5', targetWeight: '78 kg', note: 'RPE 6–7. Deload. Setup drill.' },
      { id: 'pull-up', name: 'Weighted Pull-Up', nameShort: 'Shyby', category: 'accessory', targetSets: '2', targetReps: '5', targetWeight: '+10 kg', note: 'Lehce.' },
      { id: 'face-pull', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15', note: 'Prehab.' },
    ]),
    wednesdayHiit(),
    thursdayRun(4, 'Recovery jog', '20 min', 'Zóna 1–2 – velmi lehký klus. Deload.'),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Mrtvý tah', category: 'main', targetSets: '2', targetReps: '4', targetWeight: '146 kg', note: 'RPE 6–7. Deload. Technika.' },
      { id: 'barbell-row', name: 'Barbell Row', nameShort: 'Řady', category: 'accessory', targetSets: '2', targetReps: '6', targetWeight: '75 kg', note: 'Lehce.' },
      { id: 'nordic', name: 'Nordic Curls', category: 'prevention', targetSets: '2', targetReps: '5', note: 'BW.' },
    ]),
    saturdayHiit(),
    sundayRest,
  ],
};

// ============================================================
// FÁZE 2: SÍLA (W5–8) – 11.5.–7.6.2026
// Intenzita 78–88 % 1RM | 3–6 opak | RPE 8–9
// Top set + back-off série (-5%). Slabinové variace jako sekundární.
// Řetězy a gumy na dynamic effort dny.
// ============================================================

const w5: Week = {
  number: 5, label: 'W5 – Síla', dateFrom: '2026-05-11', dateTo: '2026-05-17',
  phase: 'Fáze 2 – Síla', phaseKey: 'phase2',
  description: 'Vstup do silové fáze. 78% 1RM, RPE 8. Top set + back-off série -5%. Pause squat místo tempo squatu. Spoto press místo larsen press.',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', targetSets: '1+3', targetReps: '5 (top) + 5 (BO)', targetWeight: '140 kg / 133 kg', note: 'Top set @ RPE 8, back-off -5%. 78% 1RM.' },
      { id: 'pause-squat', name: 'Pause Squat (2s)', nameShort: 'Pause Squat', category: 'accessory', targetSets: '3', targetReps: '3–5', targetWeight: '119 kg', note: '2s pauza dole. Eliminuje stretch reflex. Cílí díru. 66% 1RM.' },
      { id: 'ghd', name: 'GHD Raise', category: 'accessory', targetSets: '3', targetReps: '8', note: 'BW nebo +10 kg.' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '3', targetReps: '8/strana', note: 'Core.' },
    ]),
    upperDay([
      { id: 'bench', name: 'Bench Press (Competition)', nameShort: 'Bench Press', category: 'main', targetSets: '1+3', targetReps: '5 (top) + 5 (BO)', targetWeight: '93.5 kg / 89 kg', note: 'Top set @ RPE 8, back-off -5%. 78% 1RM.' },
      { id: 'spoto-press', name: 'Spoto Press (2 cm nad hrudníkem)', nameShort: 'Spoto Press', category: 'accessory', targetSets: '3', targetReps: '3–5', targetWeight: '84 kg', note: '2 cm nad hrudníkem, 1s hold. Cílí start z prsu. 70% 1RM.' },
      { id: 'pull-up', name: 'Weighted Pull-Up', nameShort: 'Shyby', category: 'accessory', targetSets: '3', targetReps: '4–6', targetWeight: '+15 kg', note: 'RPE 8.' },
      { id: 'face-pull', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15', note: 'Prehab.' },
      { id: 'band-pull', name: 'Band Pull-Aparts', category: 'prevention', targetSets: '2', targetReps: '15', note: 'Aktivace.' },
    ]),
    wednesdayHiit(),
    thursdayRun(5, 'Tempo run', '30 min', 'Zóna 2–3: 10 min easy + 10 min tempo + 10 min easy'),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Mrtvý tah', category: 'main', targetSets: '1+3', targetReps: '5 (top) + 5 (BO)', targetWeight: '175.5 kg / 167 kg', note: 'Top set @ RPE 8, back-off -5%. 78% 1RM.' },
      { id: 'paused-dl', name: 'Paused Deadlift (pauza na koleních)', nameShort: 'Paused DL', category: 'accessory', targetSets: '3', targetReps: '3–5', targetWeight: '146 kg', note: '2s pauza na koleních. Kontrola pozice.' },
      { id: 'ssb-squat', name: 'SSB Squat', category: 'accessory', targetSets: '2', targetReps: '6–8', targetWeight: '107.5 kg', note: 'SSB. Udržovací objem.' },
      { id: 'barbell-row', name: 'Barbell Row', nameShort: 'Řady', category: 'accessory', targetSets: '2', targetReps: '6–8', targetWeight: '90 kg', note: 'Silná záda.' },
      { id: 'nordic', name: 'Nordic Curls', category: 'prevention', targetSets: '3', targetReps: '5', note: 'BW. Prevence.' },
    ]),
    saturdayHiit(),
    sundayRest,
  ],
};

const w6: Week = {
  number: 6, label: 'W6 – Síla', dateFrom: '2026-05-18', dateTo: '2026-05-24',
  phase: 'Fáze 2 – Síla', phaseKey: 'phase2',
  description: '+2,5–5 kg. RPE 8–9. Top set + back-off -5%. Intenzita roste.',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', targetSets: '1+3', targetReps: '4 (top) + 5 (BO)', targetWeight: '145 kg / 137.5 kg', note: 'Top set @ RPE 8–9, back-off -5%.' },
      { id: 'pause-squat', name: 'Pause Squat (2s)', nameShort: 'Pause Squat', category: 'accessory', targetSets: '3', targetReps: '3–5', targetWeight: '122 kg', note: '2s pauza. Cílí díru.' },
      { id: 'ghd', name: 'GHD Raise', category: 'accessory', targetSets: '3', targetReps: '8', note: 'BW nebo +10 kg.' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '3', targetReps: '8/strana', note: 'Core.' },
    ]),
    upperDay([
      { id: 'bench', name: 'Bench Press (Competition)', nameShort: 'Bench Press', category: 'main', targetSets: '1+3', targetReps: '4 (top) + 5 (BO)', targetWeight: '96 kg / 91 kg', note: 'Top set @ RPE 8–9, back-off -5%.' },
      { id: 'spoto-press', name: 'Spoto Press (2 cm nad hrudníkem)', nameShort: 'Spoto Press', category: 'accessory', targetSets: '3', targetReps: '3–5', targetWeight: '86.5 kg', note: '2 cm nad hrudníkem. Cílí start z prsu.' },
      { id: 'pull-up', name: 'Weighted Pull-Up', nameShort: 'Shyby', category: 'accessory', targetSets: '3', targetReps: '4–6', targetWeight: '+17.5 kg', note: 'RPE 8.' },
      { id: 'face-pull', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15', note: 'Prehab.' },
      { id: 'band-pull', name: 'Band Pull-Aparts', category: 'prevention', targetSets: '2', targetReps: '15', note: 'Aktivace.' },
    ]),
    wednesdayHiit(),
    thursdayRun(6, 'Tempo run', '32 min', 'Zóna 2–3: 8 min easy + 15 min tempo + 9 min easy'),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Mrtvý tah', category: 'main', targetSets: '1+3', targetReps: '4 (top) + 5 (BO)', targetWeight: '180 kg / 171 kg', note: 'Top set @ RPE 8–9, back-off -5%.' },
      { id: 'paused-dl', name: 'Paused Deadlift (pauza na koleních)', nameShort: 'Paused DL', category: 'accessory', targetSets: '3', targetReps: '3–5', targetWeight: '148.5 kg', note: '2s pauza na koleních.' },
      { id: 'ssb-squat', name: 'SSB Squat', category: 'accessory', targetSets: '2', targetReps: '6–8', targetWeight: '110 kg', note: 'SSB.' },
      { id: 'barbell-row', name: 'Barbell Row', nameShort: 'Řady', category: 'accessory', targetSets: '2', targetReps: '6–8', targetWeight: '92.5 kg', note: 'Silná záda.' },
      { id: 'nordic', name: 'Nordic Curls', category: 'prevention', targetSets: '3', targetReps: '5', note: 'BW.' },
    ]),
    saturdayHiit(),
    sundayRest,
  ],
};

const w7: Week = {
  number: 7, label: 'W7 – Síla', dateFrom: '2026-05-25', dateTo: '2026-05-31',
  phase: 'Fáze 2 – Síla', phaseKey: 'phase2',
  description: 'Nejtěžší týden Fáze 2. 85–88% 1RM. RPE 8–9. Řetězy na dynamic effort.',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', targetSets: '1+3', targetReps: '3 (top) + 4 (BO)', targetWeight: '152.5 kg / 145 kg', note: 'Top set @ RPE 9, back-off -5%. 85% 1RM.' },
      { id: 'pause-squat', name: 'Pause Squat (2s)', nameShort: 'Pause Squat', category: 'accessory', targetSets: '3', targetReps: '3', targetWeight: '126 kg', note: '2s pauza. Cílí díru. RPE 8.' },
      { id: 'pin-squat', name: 'Pin Squat', category: 'accessory', targetSets: '2', targetReps: '3–5', targetWeight: '117 kg', note: 'Piny na hloubku dřepu. Koncentrická síla z díry.' },
      { id: 'ghd', name: 'GHD Raise', category: 'accessory', targetSets: '2', targetReps: '8', note: 'BW nebo +10 kg. Udržovací.' },
    ]),
    upperDay([
      { id: 'bench', name: 'Bench Press (Competition)', nameShort: 'Bench Press', category: 'main', targetSets: '1+3', targetReps: '3 (top) + 4 (BO)', targetWeight: '100.5 kg / 95.5 kg', note: 'Top set @ RPE 9, back-off -5%. 84% 1RM.' },
      { id: 'spoto-press', name: 'Spoto Press (2 cm nad hrudníkem)', nameShort: 'Spoto Press', category: 'accessory', targetSets: '3', targetReps: '3', targetWeight: '90 kg', note: '2 cm nad hrudníkem. RPE 8.' },
      { id: 'long-pause-bench', name: 'Long Pause Bench (3s pauza)', nameShort: 'Long Pause Bench', category: 'accessory', targetSets: '2', targetReps: '3', targetWeight: '96 kg', note: '3s pauza na hrudi. Izometrická síla z prsu.' },
      { id: 'pull-up', name: 'Weighted Pull-Up', nameShort: 'Shyby', category: 'accessory', targetSets: '3', targetReps: '4–5', targetWeight: '+20 kg', note: 'RPE 8.' },
      { id: 'face-pull', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15', note: 'Prehab.' },
    ]),
    wednesdayHiit(),
    thursdayRun(7, 'Intervaly', '30 min', 'Zóna 2–4: 10 min easy + 4× 2 min hard / 2 min easy + 6 min easy'),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Mrtvý tah', category: 'main', targetSets: '1+3', targetReps: '3 (top) + 4 (BO)', targetWeight: '187.5 kg / 178 kg', note: 'Top set @ RPE 9, back-off -5%. 83% 1RM.' },
      { id: 'paused-dl', name: 'Paused Deadlift (pauza na koleních)', nameShort: 'Paused DL', category: 'accessory', targetSets: '2', targetReps: '3', targetWeight: '151 kg', note: '2s pauza na koleních.' },
      { id: 'barbell-row', name: 'Barbell Row', nameShort: 'Řady', category: 'accessory', targetSets: '2', targetReps: '6–8', targetWeight: '95 kg', note: 'Silná záda.' },
      { id: 'nordic', name: 'Nordic Curls', category: 'prevention', targetSets: '3', targetReps: '5', note: 'BW.' },
    ]),
    saturdayHiit(),
    sundayRest,
  ],
};

const w8: Week = {
  number: 8, label: 'W8 – Deload', dateFrom: '2026-06-01', dateTo: '2026-06-07',
  phase: 'Fáze 2 – Deload', phaseKey: 'deload2',
  isDeload: true,
  description: 'DELOAD: Objem -50%, intenzita zachována na 80%. Příprava na Fázi 3 – Intenzifikaci. Běh: recovery jog 20 min.',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '144 kg', note: 'RPE 7. 80% 1RM. Deload.' },
      { id: 'pause-squat', name: 'Pause Squat (2s)', nameShort: 'Pause Squat', category: 'accessory', targetSets: '2', targetReps: '2', targetWeight: '117 kg', note: 'Lehce. Připomenutí slabiny.' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '2', targetReps: '8/strana', note: 'Lehká.' },
    ]),
    upperDay([
      { id: 'bench', name: 'Bench Press (Competition)', nameShort: 'Bench Press', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '96 kg', note: 'RPE 7. 80% 1RM. Deload. Setup drill.' },
      { id: 'spoto-press', name: 'Spoto Press', nameShort: 'Spoto Press', category: 'accessory', targetSets: '2', targetReps: '3', targetWeight: '84 kg', note: 'Lehce. Udržovací.' },
      { id: 'face-pull', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15', note: 'Prehab.' },
    ]),
    wednesdayHiit(),
    thursdayRun(8, 'Recovery jog', '20 min', 'Zóna 1–2 – lehký klus. Deload.'),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Mrtvý tah', category: 'main', targetSets: '2', targetReps: '2', targetWeight: '180 kg', note: 'RPE 7. 80% 1RM. Deload.' },
      { id: 'barbell-row', name: 'Barbell Row', nameShort: 'Řady', category: 'accessory', targetSets: '2', targetReps: '6', targetWeight: '80 kg', note: 'Udržovací.' },
      { id: 'nordic', name: 'Nordic Curls', category: 'prevention', targetSets: '2', targetReps: '5', note: 'BW.' },
    ]),
    saturdayHiit(),
    sundayRest,
  ],
};

// ============================================================
// FÁZE 3: INTENZIFIKACE (W9–12) – 8.6.–5.7.2026
// Intenzita 85–95 % 1RM | 1–4 opak | RPE 8,5–9,5
// Top set @ RPE 9 + back-off -6–8%. Minimální doplňky.
// Pin squats, Floor press. Běh: lehké tempo.
// ============================================================

const w9: Week = {
  number: 9, label: 'W9 – Intenzifikace', dateFrom: '2026-06-08', dateTo: '2026-06-14',
  phase: 'Fáze 3 – Intenzifikace', phaseKey: 'phase3',
  description: 'Vstup do intenzifikace. Top set triples @ RPE 9 + back-off -6%. Pin squats místo pause squats. Floor press místo larsen press.',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', targetSets: '1+3', targetReps: '3 (top) + 4 (BO)', targetWeight: '157.5 kg / 147.5 kg', note: 'Top set @ RPE 9, back-off -6%. Autoreguluj!' },
      { id: 'pin-squat', name: 'Pin Squat', category: 'accessory', targetSets: '2', targetReps: '3', targetWeight: '125 kg', note: 'Piny na hloubku dřepu. Koncentrická síla z díry.' },
      { id: 'ghd', name: 'GHD Raise', category: 'accessory', targetSets: '2', targetReps: '8', note: 'BW nebo +10 kg. Udržovací.' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '2', targetReps: '8/strana', note: 'Core.' },
    ]),
    upperDay([
      { id: 'bench', name: 'Bench Press (Competition)', nameShort: 'Bench Press', category: 'main', targetSets: '1+3', targetReps: '3 (top) + 4 (BO)', targetWeight: '105 kg / 97.5 kg', note: 'Top set @ RPE 9, back-off -6%.' },
      { id: 'spoto-press', name: 'Spoto Press (2 cm nad hrudníkem)', nameShort: 'Spoto Press', category: 'accessory', targetSets: '2', targetReps: '4', targetWeight: '92.5 kg', note: '2 cm nad hrudníkem, 1s hold. Klíčové pro slabinu.' },
      { id: 'pull-up', name: 'Weighted Pull-Up', nameShort: 'Shyby', category: 'accessory', targetSets: '2', targetReps: '4–5', targetWeight: '+20–25 kg', note: 'RPE 8.' },
      { id: 'face-pull', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15', note: 'Prehab.' },
    ]),
    wednesdayHiit(),
    thursdayRun(9, 'Tempo run', '35 min', 'Zóna 2–3: 8 min easy + 18 min tempo + 9 min easy. Lehčí intenzita.'),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Mrtvý tah', category: 'main', targetSets: '1+2', targetReps: '3 (top) + 4 (BO)', targetWeight: '187.5 kg / 175 kg', note: 'Top set @ RPE 9, back-off -6%.' },
      { id: 'paused-dl', name: 'Paused Deadlift (pauza na koleních)', nameShort: 'Paused DL', category: 'accessory', targetSets: '2', targetReps: '4', targetWeight: '152.5 kg', note: '2s pauza na koleních. Kontrola pozice.' },
      { id: 'floor-press', name: 'Floor Press', category: 'accessory', targetSets: '2', targetReps: '4', targetWeight: '95 kg', note: 'Omezený ROM. Cílí dolní polovinu benche.' },
      { id: 'barbell-row', name: 'Barbell Row', nameShort: 'Řady', category: 'accessory', targetSets: '2', targetReps: '6–8', targetWeight: '95–105 kg', note: 'Udržovací.' },
      { id: 'nordic', name: 'Nordic Curls', category: 'prevention', targetSets: '3', targetReps: '5', note: 'BW. Prevence.' },
    ]),
    saturdayHiit(),
    sundayRest,
  ],
};

const w10: Week = {
  number: 10, label: 'W10 – Intenzifikace', dateFrom: '2026-06-15', dateTo: '2026-06-21',
  phase: 'Fáze 3 – Intenzifikace', phaseKey: 'phase3',
  description: 'Doubles na hlavních cvicích. Top set @ RPE 9. Autoreguluj – pokud RPE přeskočí na 9,5+, sniž o 2,5 kg.',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', targetSets: '1+3', targetReps: '2 (top) + 3 (BO)', targetWeight: '162.5 kg / 152.5 kg', note: 'Top set @ RPE 9, back-off -6%.' },
      { id: 'pin-squat', name: 'Pin Squat', category: 'accessory', targetSets: '2', targetReps: '2', targetWeight: '130 kg', note: 'Piny na hloubku dřepu. Koncentrická síla.' },
      { id: 'ghd', name: 'GHD Raise', category: 'accessory', targetSets: '2', targetReps: '8', note: 'BW nebo +10 kg.' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '2', targetReps: '8/strana', note: 'Core.' },
    ]),
    upperDay([
      { id: 'bench', name: 'Bench Press (Competition)', nameShort: 'Bench Press', category: 'main', targetSets: '1+3', targetReps: '2 (top) + 3 (BO)', targetWeight: '107.5 kg / 100 kg', note: 'Top set @ RPE 9, back-off -6%.' },
      { id: 'spoto-press', name: 'Spoto Press (2 cm nad hrudníkem)', nameShort: 'Spoto Press', category: 'accessory', targetSets: '2', targetReps: '3', targetWeight: '95 kg', note: '2 cm nad hrudníkem. Klíčové pro slabinu.' },
      { id: 'pull-up', name: 'Weighted Pull-Up', nameShort: 'Shyby', category: 'accessory', targetSets: '2', targetReps: '4–5', targetWeight: '+20–25 kg', note: 'RPE 8.' },
      { id: 'face-pull', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15', note: 'Prehab.' },
    ]),
    wednesdayHiit(),
    thursdayRun(10, 'Intervaly', '32 min', 'Zóna 2–4: 10 min easy + 5× 2 min hard / 90s easy + 6 min easy'),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Mrtvý tah', category: 'main', targetSets: '1+2', targetReps: '2 (top) + 3 (BO)', targetWeight: '195 kg / 182.5 kg', note: 'Top set @ RPE 9, back-off -6%.' },
      { id: 'paused-dl', name: 'Paused Deadlift (pauza na koleních)', nameShort: 'Paused DL', category: 'accessory', targetSets: '2', targetReps: '3', targetWeight: '160 kg', note: '2s pauza na koleních.' },
      { id: 'floor-press', name: 'Floor Press', category: 'accessory', targetSets: '2', targetReps: '3', targetWeight: '97.5 kg', note: 'Omezený ROM.' },
      { id: 'barbell-row', name: 'Barbell Row', nameShort: 'Řady', category: 'accessory', targetSets: '2', targetReps: '6–8', targetWeight: '95–105 kg', note: 'Udržovací.' },
      { id: 'nordic', name: 'Nordic Curls', category: 'prevention', targetSets: '3', targetReps: '5', note: 'BW.' },
    ]),
    saturdayHiit(),
    sundayRest,
  ],
};

const w11: Week = {
  number: 11, label: 'W11 – Intenzifikace', dateFrom: '2026-06-22', dateTo: '2026-06-28',
  phase: 'Fáze 3 – Intenzifikace', phaseKey: 'phase3',
  description: 'Nejtěžší týden celého cyklu. Doubles s 93% 1RM. Pokud RPE dosáhne 10 → STOP, nedělej back-offy.',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', targetSets: '1+3', targetReps: '2 (top) + 3 (BO)', targetWeight: '167.5 kg / 155 kg', note: 'Top set @ RPE 9, back-off -7%. 93% 1RM!' },
      { id: 'pin-squat', name: 'Pin Squat', category: 'accessory', targetSets: '2', targetReps: '2', targetWeight: '135 kg', note: 'Piny na hloubku. Koncentrická síla.' },
      { id: 'ghd', name: 'GHD Raise', category: 'accessory', targetSets: '2', targetReps: '8', note: 'BW nebo +10 kg.' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '2', targetReps: '8/strana', note: 'Core.' },
    ]),
    upperDay([
      { id: 'bench', name: 'Bench Press (Competition)', nameShort: 'Bench Press', category: 'main', targetSets: '1+3', targetReps: '2 (top) + 3 (BO)', targetWeight: '112.5 kg / 105 kg', note: 'Top set @ RPE 9, back-off -7%. 94% 1RM!' },
      { id: 'spoto-press', name: 'Spoto Press (2 cm nad hrudníkem)', nameShort: 'Spoto Press', category: 'accessory', targetSets: '2', targetReps: '3', targetWeight: '97.5 kg', note: '2 cm nad hrudníkem. Klíčové.' },
      { id: 'pull-up', name: 'Weighted Pull-Up', nameShort: 'Shyby', category: 'accessory', targetSets: '2', targetReps: '4–5', targetWeight: '+20–25 kg', note: 'RPE 8.' },
      { id: 'face-pull', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15', note: 'Prehab.' },
    ]),
    wednesdayHiit(),
    thursdayRun(11, 'Tempo + intervaly', '35 min', 'Zóna 2–5: 10 min easy + 10 min tempo + 3× 1 min sprint / 2 min + 5 min easy'),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Mrtvý tah', category: 'main', targetSets: '1+2', targetReps: '2 (top) + 3 (BO)', targetWeight: '202.5 kg / 187.5 kg', note: 'Top set @ RPE 9, back-off -7%. 90% 1RM!' },
      { id: 'paused-dl', name: 'Paused Deadlift (pauza na koleních)', nameShort: 'Paused DL', category: 'accessory', targetSets: '2', targetReps: '3', targetWeight: '165 kg', note: '2s pauza na koleních.' },
      { id: 'floor-press', name: 'Floor Press', category: 'accessory', targetSets: '2', targetReps: '3', targetWeight: '100 kg', note: 'Omezený ROM.' },
      { id: 'barbell-row', name: 'Barbell Row', nameShort: 'Řady', category: 'accessory', targetSets: '2', targetReps: '6–8', targetWeight: '95–105 kg', note: 'Udržovací.' },
      { id: 'nordic', name: 'Nordic Curls', category: 'prevention', targetSets: '3', targetReps: '5', note: 'BW.' },
    ]),
    saturdayHiit(),
    sundayRest,
  ],
};

const w12: Week = {
  number: 12, label: 'W12 – Mini-deload', dateFrom: '2026-06-29', dateTo: '2026-07-05',
  phase: 'Fáze 3 – Mini-deload', phaseKey: 'phase3',
  isDeload: true,
  description: 'MINI-DELOAD: Objem -30%, intenzita na 85%. Příprava na peaking. Běh: lehkých 20 min zóna 2.',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '152.5 kg', note: 'RPE 7–8. Technicky čistě. Mini-deload.' },
      { id: 'pause-squat', name: 'Pause Squat (2s)', nameShort: 'Pause Squat', category: 'accessory', targetSets: '2', targetReps: '2', targetWeight: '140 kg', note: 'Lehce. Připomenutí slabiny.' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '2', targetReps: '8/strana', note: 'Lehká.' },
    ]),
    upperDay([
      { id: 'bench', name: 'Bench Press (Competition)', nameShort: 'Bench Press', category: 'main', targetSets: '2', targetReps: '3', targetWeight: '102.5 kg', note: 'RPE 7–8. Setup drill. Plný soutěžní setup.' },
      { id: 'spoto-press', name: 'Spoto Press', nameShort: 'Spoto Press', category: 'accessory', targetSets: '2', targetReps: '3', targetWeight: '92.5 kg', note: 'Lehce. Udržovací.' },
      { id: 'face-pull', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15', note: 'Prehab.' },
    ]),
    wednesdayHiit(),
    thursdayRun(12, 'Easy run', '25 min', 'Zóna 2 – lehký klus. Mini-deload. Příprava na peaking.'),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Mrtvý tah', category: 'main', targetSets: '2', targetReps: '2', targetWeight: '190 kg', note: 'RPE 7–8. Lehké doubly. Technická kontrola.' },
      { id: 'barbell-row', name: 'Barbell Row', nameShort: 'Řady', category: 'accessory', targetSets: '2', targetReps: '6', targetWeight: '85 kg', note: 'Udržovací.' },
      { id: 'nordic', name: 'Nordic Curls', category: 'prevention', targetSets: '2', targetReps: '5', note: 'BW.' },
    ]),
    saturdayHiit(),
    sundayRest,
  ],
};

// ============================================================
// FÁZE 4: PEAKING A TEST MAXIM (W13–16) – 6.7.–2.8.2026
// Intenzita 90–102% 1RM | Singles a doubles | RPE 9–10
// W13–14: openers a second attempts. W15: taper. W16: TEST MAXIM.
// Běh: vynechat od W15. HIIT: volnější přístup.
// ============================================================

const w13: Week = {
  number: 13, label: 'W13 – Peaking', dateFrom: '2026-07-06', dateTo: '2026-07-12',
  phase: 'Fáze 4 – Peaking', phaseKey: 'phase4',
  description: 'Openers a second attempts. 88–93% 1RM. Cíl: zvyknout si na těžké váhy, trénovat singles.',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', targetSets: '1+2+2', targetReps: '1×2 + 2×1 (BO: 2×3)', targetWeight: '157.5 kg / 165 kg (BO: 147.5 kg)', note: 'Double s 157.5, pak 2 singles s 165. RPE 8–8,5.' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '2', targetReps: '8/strana', note: 'Lehká. Core.' },
    ]),
    upperDay([
      { id: 'bench', name: 'Bench Press (Competition)', nameShort: 'Bench Press', category: 'main', targetSets: '1+2+2', targetReps: '1×2 + 2×1 (BO: 2×3)', targetWeight: '105 kg / 110 kg (BO: 97.5 kg)', note: 'Double s 105, pak 2 singles s 110. RPE 8–8,5.' },
      { id: 'face-pull', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15', note: 'Prehab.' },
    ]),
    wednesdayHiit(),
    thursdayRun(13, 'Easy run', '25 min', 'Zóna 2 – lehký klus. Šetři energii pro železo.'),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Mrtvý tah', category: 'main', targetSets: '1+2+2', targetReps: '1×2 + 2×1 (BO: 2×2)', targetWeight: '190 kg / 202.5 kg (BO: 180 kg)', note: 'Double s 190, pak 2 singles s 202.5. RPE 8–8,5.' },
      { id: 'barbell-row', name: 'Barbell Row', nameShort: 'Řady', category: 'accessory', targetSets: '2', targetReps: '6', targetWeight: '80 kg', note: 'Udržovací.' },
    ]),
    saturdayHiit(),
    sundayRest,
  ],
};

const w14: Week = {
  number: 14, label: 'W14 – Peaking', dateFrom: '2026-07-13', dateTo: '2026-07-19',
  phase: 'Fáze 4 – Peaking', phaseKey: 'phase4',
  description: 'Nejtěžší peaking týden. 93–97% 1RM. Progresivní singles. Pokud se váha hýbe dobře → signál pro test.',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat (Low Bar)', nameShort: 'Back Squat', category: 'main', targetSets: '3+1', targetReps: '3×1 (BO: 1×3)', targetWeight: '167.5 / 170 / 175 kg (BO: 152.5 kg)', note: 'Progresivní singles. Pokud 3. single = RPE 10, zastav!' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '1', targetReps: '8/strana', note: 'Lehká.' },
    ]),
    upperDay([
      { id: 'bench', name: 'Bench Press (Competition)', nameShort: 'Bench Press', category: 'main', targetSets: '3+1', targetReps: '3×1 (BO: 1×3)', targetWeight: '112.5 / 115 / 117.5 kg (BO: 102.5 kg)', note: 'Progresivní singles. Plný soutěžní setup.' },
      { id: 'face-pull', name: 'Face Pulls', category: 'prevention', targetSets: '3', targetReps: '15', note: 'Prehab.' },
    ]),
    wednesdayHiit(),
    thursdayRun(14, 'Easy run', '20 min', 'Zóna 1–2 – velmi lehký. Posledních pár dní před taperem.'),
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift (Konvenční)', nameShort: 'Mrtvý tah', category: 'main', targetSets: '3+1', targetReps: '3×1 (BO: 1×2)', targetWeight: '202.5 / 210 / 215 kg (BO: 185 kg)', note: 'Progresivní singles. Poslední těžký deadlift trénink!' },
    ]),
    saturdayHiit(),
    sundayRest,
  ],
};

const w15: Week = {
  number: 15, label: 'W15 – Taper', dateFrom: '2026-07-20', dateTo: '2026-07-26',
  phase: 'Fáze 4 – Taper', phaseKey: 'phase4',
  isDeload: true,
  description: 'TAPER TÝDEN. Drastické snížení objemu. Pouze lehké openers pro zachování CNS dráhy. Žádné těžké sety! Žádný běh. Spánek 8–9 h.',
  days: [
    lowerDay([
      { id: 'squat', name: 'Back Squat (Low Bar) – Opener drill', nameShort: 'Back Squat', category: 'main', targetSets: '2', targetReps: '2', targetWeight: '147.5 kg', note: 'RPE 6–7. Opener váha. Lehce, rychle, technicky čistě.' },
      { id: 'pallof', name: 'Pallof Press', category: 'core', targetSets: '2', targetReps: '8/strana', note: 'Lehká. Core – udržovací.' },
    ]),
    upperDay([
      { id: 'bench', name: 'Bench Press (Competition) – Opener drill', nameShort: 'Bench Press', category: 'main', targetSets: '2', targetReps: '2', targetWeight: '97.5 kg', note: 'RPE 6–7. Opener váha. Plný setup. Kontrola dráhy tyče.' },
      { id: 'face-pull', name: 'Face Pulls', category: 'prevention', targetSets: '2', targetReps: '15', note: 'Prehab.' },
    ]),
    wednesdayHiit(),
    {
      key: 'thursday', label: 'Čtvrtek', labelShort: 'Čt', type: 'rest',
      description: 'VOLNO – Žádný běh v taper týdnu. Veškerá energie do peakingu.',
      exercises: [],
    },
    fullBodyDay([
      { id: 'deadlift', name: 'Deadlift (Konvenční) – Opener drill', nameShort: 'Mrtvý tah', category: 'main', targetSets: '2', targetReps: '1', targetWeight: '185 kg', note: 'RPE 6–7. Opener váha. Lehké singles. Setup, bracing, hotovo.' },
    ]),
    saturdayHiit(),
    sundayRest,
  ],
};

const w16: Week = {
  number: 16, label: 'W16 – TEST MAXIM', dateFrom: '2026-07-27', dateTo: '2026-08-02',
  phase: 'Fáze 4 – Test maxim', phaseKey: 'phase4',
  description: 'FINÁLNÍ TÝDEN – TEST MAXIM! Po: Back Squat max (cíl 190 kg). St: Bench Press max (cíl 130 kg). Pá: Deadlift max (cíl 235 kg). Minimálně 3 min pauza mezi pokusy, 5+ min před max pokusem.',
  days: [
    {
      key: 'monday', label: 'Pondělí 27.7.', labelShort: 'Po', type: 'lower',
      description: 'BACK SQUAT MAX TEST – Cíl: 190 kg!',
      exercises: [
        { id: 'squat-wu1', name: 'Warm-up 1', category: 'main', targetSets: '1', targetReps: '8', targetWeight: '55 kg', note: '~30% – Rozehřátí.' },
        { id: 'squat-wu2', name: 'Warm-up 2', category: 'main', targetSets: '1', targetReps: '5', targetWeight: '90 kg', note: '~50% – Aktivace.' },
        { id: 'squat-wu3', name: 'Warm-up 3', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '117.5 kg', note: '~65% – Najetí do groove.' },
        { id: 'squat-wu4', name: 'Warm-up 4', category: 'main', targetSets: '1', targetReps: '2', targetWeight: '140 kg', note: '~78% – Nervový systém ready.' },
        { id: 'squat-wu5', name: 'Warm-up 5', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '157.5 kg', note: '~87% – Poslední single před testem.' },
        { id: 'squat-op', name: 'OPENER (1. pokus)', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '162.5 kg', note: '~90% – Váha, kterou dáš i v nejhorší den. JISTOTA!' },
        { id: 'squat-2nd', name: '2. POKUS', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '170 kg', note: '~95% – Solidní single. Pokud letí → jdi na max.' },
        { id: 'squat-max', name: '3. POKUS – MAX', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '190 kg', note: '🏆 CÍL: 190 kg! Pokud 2. pokus byl RPE 9+ → max = 187.5 kg.' },
      ],
    },
    {
      key: 'tuesday', label: 'Úterý 28.7.', labelShort: 'Út', type: 'rest',
      description: 'VOLNO – Kompletní regenerace. Lehká procházka, pěnový válec, kvalitní jídlo, spánek.',
      exercises: [],
    },
    {
      key: 'wednesday', label: 'Středa 29.7.', labelShort: 'St', type: 'upper',
      description: 'BENCH PRESS MAX TEST – Cíl: 130 kg!',
      exercises: [
        { id: 'bench-wu1', name: 'Warm-up 1', category: 'main', targetSets: '1', targetReps: '10', targetWeight: '35 kg', note: '~30% – Rozehřátí ramen.' },
        { id: 'bench-wu2', name: 'Warm-up 2', category: 'main', targetSets: '1', targetReps: '5', targetWeight: '60 kg', note: '~50% – Aktivace.' },
        { id: 'bench-wu3', name: 'Warm-up 3', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '82.5 kg', note: '~68% – Setup drill.' },
        { id: 'bench-wu4', name: 'Warm-up 4', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '95 kg', note: '~80% – Nervový systém.' },
        { id: 'bench-wu5', name: 'Warm-up 5', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '105 kg', note: '~88% – Poslední single.' },
        { id: 'bench-op', name: 'OPENER (1. pokus)', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '107.5 kg', note: '~90% – JISTOTA. Plný soutěžní setup.' },
        { id: 'bench-2nd', name: '2. POKUS', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '115 kg', note: '~95% – Solidní single. Pokud letí → max.' },
        { id: 'bench-max', name: '3. POKUS – MAX', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '130 kg', note: '🏆 CÍL: 130 kg! Pokud 2. pokus byl těžký → 127.5 kg.' },
      ],
    },
    {
      key: 'thursday', label: 'Čtvrtek 30.7.', labelShort: 'Čt', type: 'rest',
      description: 'VOLNO – Regenerace. Příprava na deadlift.',
      exercises: [],
    },
    {
      key: 'friday', label: 'Pátek 31.7.', labelShort: 'Pá', type: 'fullbody',
      description: 'DEADLIFT MAX TEST – Cíl: 235 kg!',
      exercises: [
        { id: 'dl-wu1', name: 'Warm-up 1', category: 'main', targetSets: '1', targetReps: '8', targetWeight: '55 kg', note: '~25% – Rozehřátí.' },
        { id: 'dl-wu2', name: 'Warm-up 2', category: 'main', targetSets: '1', targetReps: '5', targetWeight: '100 kg', note: '~45% – Aktivace.' },
        { id: 'dl-wu3', name: 'Warm-up 3', category: 'main', targetSets: '1', targetReps: '3', targetWeight: '135 kg', note: '~60% – Groove.' },
        { id: 'dl-wu4', name: 'Warm-up 4', category: 'main', targetSets: '1', targetReps: '2', targetWeight: '170 kg', note: '~75% – Nervový systém.' },
        { id: 'dl-wu5', name: 'Warm-up 5', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '190 kg', note: '~85% – Poslední single.' },
        { id: 'dl-op', name: 'OPENER (1. pokus)', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '202.5 kg', note: '~90% – JISTOTA. Setup, bracing, pull.' },
        { id: 'dl-2nd', name: '2. POKUS', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '215 kg', note: '~95% – Solidní single. Pokud hladký → max.' },
        { id: 'dl-max', name: '3. POKUS – MAX', category: 'main', targetSets: '1', targetReps: '1', targetWeight: '235 kg', note: '🏆 CÍL: 235 kg! Pokud 2. pokus těžký → 232.5 kg.' },
      ],
    },
    {
      key: 'saturday', label: 'Sobota 1.8.', labelShort: 'So', type: 'rest',
      description: 'VOLNO – Oslavuj! Regenerace po testu maxim.',
      exercises: [],
    },
    sundayRest,
  ],
};

// ============================================================
// UTILITY FUNCTIONS & HELPERS
// ============================================================

export function nanoid(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

export function formatDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y.slice(2)}`;
}

export function formatDateFull(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function getTodayDayKey(): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
}

export function getCurrentWeek(): number {
  const today = new Date();
  for (const w of PHASE3_WEEKS) {
    const from = new Date(w.dateFrom);
    const to = new Date(w.dateTo);
    to.setHours(23, 59, 59);
    if (today >= from && today <= to) return w.number;
  }
  // If before plan start, return 1; if after, return last week
  const first = new Date(PHASE3_WEEKS[0].dateFrom);
  if (today < first) return 1;
  return PHASE3_WEEKS[PHASE3_WEEKS.length - 1].number;
}

export function getCategoryColor(cat: ExerciseCategory): string {
  switch (cat) {
    case 'main': return '#D4AF37';
    case 'accessory': return '#A0845C';
    case 'isolation': return '#8B6914';
    case 'prevention': return '#4A9B8E';
    case 'core': return '#6B8FA3';
    case 'run': return '#7B9E6B';
    default: return '#888';
  }
}

export function getCategoryLabel(cat: ExerciseCategory): string {
  switch (cat) {
    case 'main': return 'Hlavní';
    case 'accessory': return 'Doplňkový';
    case 'isolation': return 'Izolace';
    case 'prevention': return 'Prevence';
    case 'core': return 'Core';
    case 'run': return 'Kardio';
    default: return cat;
  }
}

export function estimate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps <= 0) return 0;
  // Epley formula
  return Math.round(weight * (1 + reps / 30));
}

// ============================================================
// EXPORT – KOMPLETNÍ 16TÝDENNÍ PLÁN
// ============================================================

export const PHASE3_WEEKS: Week[] = [
  w1, w2, w3, w4,   // Fáze 1: Akumulace
  w5, w6, w7, w8,   // Fáze 2: Síla
  w9, w10, w11, w12, // Fáze 3: Intenzifikace
  w13, w14, w15, w16, // Fáze 4: Peaking
];

// ============================================================
// HISTORICAL DATA – Záznamy z předchozích tréninků
// ============================================================

export const DEFAULT_RECORDS: RecordsMap = {
  'Low-Bar Back Squat': [
    { id: 'sq1', date: '2026-03-02', sets: '4', weight: '160', reps: '1', note: 'Nové PR! Technika dobrá.' },
    { id: 'sq2', date: '2026-02-23', sets: '4', weight: '155', reps: '2', note: 'RPE 9.' },
    { id: 'sq3', date: '2026-02-16', sets: '4', weight: '150', reps: '3', note: 'RPE 8–9.' },
    { id: 'sq4', date: '2026-02-09', sets: '4', weight: '145', reps: '3', note: 'RPE 8.' },
    { id: 'sq5', date: '2026-02-02', sets: '4', weight: '140', reps: '4', note: 'RPE 8.' },
  ],
  'Front Squat': [
    { id: 'fsq1', date: '2026-02-16', sets: '3', weight: '105', reps: '8', note: 'RPE 7.' },
    { id: 'fsq2', date: '2026-02-09', sets: '3', weight: '102.5', reps: '8', note: 'RPE 7.' },
    { id: 'fsq3', date: '2026-02-02', sets: '3', weight: '100', reps: '8', note: 'RPE 7.' },
    { id: 'fsq4', date: '2026-01-26', sets: '3', weight: '97.5', reps: '8', note: 'RPE 7.' },
  ],
  'Romanian Deadlift (RDL)': [
    { id: 'rdl1', date: '2026-03-02', sets: '3', weight: '70', reps: '12', note: 'RPE 7.' },
    { id: 'rdl2', date: '2026-02-23', sets: '3', weight: '67.5', reps: '12', note: 'RPE 7.' },
    { id: 'rdl3', date: '2026-02-16', sets: '3', weight: '65', reps: '12', note: 'RPE 7.' },
    { id: 'rdl4', date: '2026-02-09', sets: '3', weight: '62.5', reps: '12', note: 'RPE 7.' },
    { id: 'rdl5', date: '2026-02-02', sets: '3', weight: '60', reps: '12', note: 'RPE 7.' },
  ],
  'Leg Press': [
    { id: 'lp1', date: '2026-03-02', sets: '3', weight: '220', reps: '12', note: 'RPE 7.' },
    { id: 'lp2', date: '2026-02-23', sets: '3', weight: '210', reps: '12', note: 'RPE 7.' },
    { id: 'lp3', date: '2026-02-16', sets: '3', weight: '200', reps: '12', note: 'RPE 7.' },
    { id: 'lp4', date: '2026-02-09', sets: '3', weight: '190', reps: '12', note: 'RPE 7.' },
    { id: 'lp5', date: '2026-02-02', sets: '3', weight: '180', reps: '12', note: 'RPE 7.' },
  ],
  'Seated Calf Raise': [
    { id: 'cr1', date: '2026-03-02', sets: '4', weight: '60', reps: '12', note: 'RPE 7.' },
    { id: 'cr2', date: '2026-02-23', sets: '4', weight: '57.5', reps: '12', note: '' },
    { id: 'cr3', date: '2026-02-16', sets: '4', weight: '55', reps: '12', note: '' },
    { id: 'cr4', date: '2026-02-09', sets: '4', weight: '52.5', reps: '12', note: '' },
    { id: 'cr5', date: '2026-02-02', sets: '4', weight: '50', reps: '12', note: '' },
  ],
  'Hanging Leg Raise': [
    { id: 'hlr1', date: '2026-03-02', sets: '3', weight: '0', reps: '15', note: 'BW.' },
    { id: 'hlr2', date: '2026-02-23', sets: '3', weight: '0', reps: '15', note: 'BW.' },
    { id: 'hlr3', date: '2026-02-16', sets: '3', weight: '0', reps: '15', note: 'BW.' },
    { id: 'hlr4', date: '2026-02-09', sets: '3', weight: '0', reps: '15', note: 'BW.' },
  ],
  'Barbell Bench Press': [
    { id: 'bp1', date: '2026-03-17', sets: '4', weight: '105', reps: '8', note: 'RPE 8. Nové PR na 8 rep!' },
    { id: 'bp2', date: '2026-03-10', sets: '4', weight: '102.5', reps: '8', note: 'RPE 8.' },
    { id: 'bp3', date: '2026-03-03', sets: '4', weight: '100', reps: '8', note: 'RPE 8.' },
    { id: 'bp4', date: '2026-02-24', sets: '4', weight: '97.5', reps: '8', note: 'RPE 7–8.' },
    { id: 'bp5', date: '2026-02-17', sets: '4', weight: '95', reps: '8', note: 'RPE 7.' },
    { id: 'bp6', date: '2026-02-10', sets: '4', weight: '92.5', reps: '8', note: 'RPE 7.' },
    { id: 'bp7', date: '2026-02-03', sets: '4', weight: '90', reps: '8', note: 'RPE 7.' },
    { id: 'bp8', date: '2026-01-27', sets: '4', weight: '87.5', reps: '8', note: 'RPE 7.' },
  ],
  'Close-Grip Bench Press': [
    { id: 'cgb1', date: '2026-03-17', sets: '3', weight: '85', reps: '8', note: 'RPE 7.' },
    { id: 'cgb2', date: '2026-03-10', sets: '3', weight: '82.5', reps: '8', note: '' },
    { id: 'cgb3', date: '2026-03-03', sets: '3', weight: '80', reps: '8', note: '' },
  ],
  'Incline Dumbbell Press': [
    { id: 'idp1', date: '2026-03-17', sets: '3', weight: '32', reps: '10', note: 'RPE 7.' },
    { id: 'idp2', date: '2026-03-10', sets: '3', weight: '30', reps: '10', note: '' },
    { id: 'idp3', date: '2026-03-03', sets: '3', weight: '28', reps: '10', note: '' },
  ],
  'Weighted Pull-Up': [
    { id: 'wpu1', date: '2026-03-17', sets: '4', weight: '15', reps: '6', note: 'RPE 8.' },
    { id: 'wpu2', date: '2026-03-10', sets: '4', weight: '12.5', reps: '6', note: '' },
    { id: 'wpu3', date: '2026-03-03', sets: '4', weight: '10', reps: '6', note: '' },
    { id: 'wpu4', date: '2026-02-24', sets: '4', weight: '10', reps: '6', note: '' },
  ],
  'Conventional Deadlift': [
    { id: 'dl1', date: '2026-03-06', sets: '3', weight: '230', reps: '2', note: 'RPE 9. Nové PR!' },
    { id: 'dl2', date: '2026-02-27', sets: '3', weight: '225', reps: '2', note: 'RPE 9.' },
    { id: 'dl3', date: '2026-02-20', sets: '3', weight: '220', reps: '3', note: 'RPE 8–9.' },
    { id: 'dl4', date: '2026-02-13', sets: '3', weight: '215', reps: '3', note: 'RPE 8.' },
    { id: 'dl5', date: '2026-02-06', sets: '3', weight: '210', reps: '4', note: 'RPE 8.' },
    { id: 'dl6', date: '2026-01-30', sets: '3', weight: '205', reps: '4', note: 'RPE 7–8.' },
  ],
  'Pause Squat': [
    { id: 'psq1', date: '2026-03-02', sets: '3', weight: '130', reps: '3', note: '2s pauza. RPE 8.' },
    { id: 'psq2', date: '2026-02-16', sets: '3', weight: '125', reps: '3', note: '2s pauza.' },
    { id: 'psq3', date: '2026-02-02', sets: '3', weight: '120', reps: '3', note: '2s pauza.' },
  ],
  'GHD Raise': [
    { id: 'ghd1', date: '2026-03-02', sets: '3', weight: '0', reps: '10', note: 'BW.' },
    { id: 'ghd2', date: '2026-02-16', sets: '3', weight: '0', reps: '8', note: 'BW.' },
    { id: 'ghd3', date: '2026-02-02', sets: '3', weight: '0', reps: '8', note: 'BW.' },
  ],
  'Face Pull': [
    { id: 'fp1', date: '2026-03-17', sets: '3', weight: '25', reps: '20', note: 'Prehab.' },
    { id: 'fp2', date: '2026-03-10', sets: '3', weight: '25', reps: '20', note: '' },
    { id: 'fp3', date: '2026-03-03', sets: '3', weight: '22.5', reps: '20', note: '' },
  ],
  'Barbell Row': [
    { id: 'br1', date: '2026-03-06', sets: '3', weight: '90', reps: '8', note: 'RPE 7.' },
    { id: 'br2', date: '2026-02-27', sets: '3', weight: '87.5', reps: '8', note: '' },
    { id: 'br3', date: '2026-02-20', sets: '3', weight: '85', reps: '8', note: '' },
    { id: 'br4', date: '2026-02-13', sets: '3', weight: '82.5', reps: '8', note: '' },
  ],
};
