// ============================================================
// TRÉNINKOVÝ DENÍK 2026 – DATA
// Gold Performance Design
// Obsahuje: historická data Fáze 1+2, nový plán Fáze 3
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
  phaseKey: 'phase1' | 'phase2' | 'phase3' | 'deload1' | 'deload2' | 'deload3';
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
// GOALS
// ============================================================
export const GOALS = {
  bench: 130,
  squat: 190,
  frontSquat: 130,
  deadlift: 250,
};

// Aktuální reálná maxima (ne odhadovaná 1RM) – stav k 7.4.2026
export const STARTING_MAXES = {
  bench: 105,   // Bench Press – poslední trénink 105 kg 4×8
  squat: 160,   // Back Squat – 160 kg 4×1 (Fáze 2 T8)
  frontSquat: 105, // Front Squat – 105 kg 3×8
  deadlift: 230, // Conventional Deadlift – 230 kg 3×2
};

// Aktuální reálná maxima pro zobrazení v UI (skutečně zvednuté váhy)
export const CURRENT_MAXES = {
  bench: 105,
  squat: 160,
  frontSquat: 105,
  deadlift: 230,
};

// ============================================================
// WEEKLY STRUCTURE – Fáze 3 (T1 = 7.4.2026)
// ============================================================

const WEEK_DAYS_PHASE3: WorkoutDay[] = [
  {
    key: 'monday',
    label: 'Pondělí',
    labelShort: 'Po',
    type: 'lower',
    description: 'LOWER BODY – Squat focus. Kvadricepsy, hamstringy, core.',
    exercises: [
      { id: 'squat', name: 'Low-Bar Back Squat', nameShort: 'Back Squat', category: 'main', targetSets: '4', targetReps: '6–8', targetWeight: '117 kg', note: '65% 1RM, RPE 7' },
      { id: 'front-squat', name: 'Front Squat', category: 'accessory', targetSets: '3', targetReps: '8', targetWeight: '105 kg', note: 'RPE 7' },
      { id: 'rdl', name: 'Romanian Deadlift (RDL)', nameShort: 'RDL', category: 'accessory', targetSets: '4', targetReps: '10', targetWeight: '60–65 kg', note: 'RPE 7' },
      { id: 'hack-squat', name: 'Leg Press', nameShort: 'Leg Press', category: 'accessory', targetSets: '3', targetReps: '12', targetWeight: 'střední', note: 'RPE 7' },
      { id: 'pause-squat', name: 'Pause Squat', category: 'accessory', targetSets: '3', targetReps: '5', targetWeight: '108 kg', note: '60% 1RM, 2s pauza' },
      { id: 'calf-raise', name: 'Seated Calf Raise', nameShort: 'Lýtka', category: 'isolation', targetSets: '3', targetReps: '15', targetWeight: 'pracovní' },
      { id: 'leg-raise', name: 'Hanging Leg Raise', nameShort: 'Leg Raise', category: 'core', targetSets: '3', targetReps: '15' },
    ],
  },
  {
    key: 'tuesday',
    label: 'Úterý',
    labelShort: 'Út',
    type: 'upper',
    description: 'UPPER BODY – Bench focus. Hrudník, záda, ramena, paže.',
    exercises: [
      { id: 'bench', name: 'Barbell Bench Press', nameShort: 'Bench Press', category: 'main', targetSets: '4', targetReps: '6–8', targetWeight: '85 kg', note: '65% 1RM, RPE 7' },
      { id: 'close-grip-bench', name: 'Close-Grip Bench Press', nameShort: 'CG Bench', category: 'accessory', targetSets: '3', targetReps: '8', targetWeight: '72 kg', note: 'Tricepsový lockout' },
      { id: 'incline-db', name: 'Incline Dumbbell Press', nameShort: 'Incline DB', category: 'accessory', targetSets: '3', targetReps: '10', targetWeight: '30–32 kg DB', note: 'RPE 7' },
      { id: 'pull-up', name: 'Weighted Pull-Up', nameShort: 'Shyby', category: 'main', targetSets: '4', targetReps: '6', targetWeight: '+10–12 kg', note: 'RPE 7–8' },
      { id: 'chest-row', name: 'Chest-Supported Row', nameShort: 'Chest Row', category: 'accessory', targetSets: '3', targetReps: '10', targetWeight: '60–65 kg', note: 'RPE 7' },
      { id: 'face-pull', name: 'Face Pull', category: 'prevention', targetSets: '3', targetReps: '20', targetWeight: '25–30 kg', note: 'Prevence ramen' },
      { id: 'triceps-biceps', name: 'Tricep Pressdown + Bicep Curl', nameShort: 'Triceps + Biceps', category: 'isolation', targetSets: '3', targetReps: '15 / 12', targetWeight: '40 kg / 14–16 kg DB' },
      { id: 'pallof-press', name: 'Ab Wheel / Pallof Press', nameShort: 'Core', category: 'core', targetSets: '3', targetReps: '10–12' },
    ],
  },
  {
    key: 'wednesday',
    label: 'Středa',
    labelShort: 'St',
    type: 'hiit',
    description: 'HIIT / Tempo běh – 30–45 min, zóna 3.',
    exercises: [
      { id: 'hiit-wed', name: 'HIIT / Tempo běh', nameShort: 'HIIT', category: 'run', targetSets: '1', targetReps: '30–45 min', note: 'Zóna 3, tempo pace' },
    ],
  },
  {
    key: 'thursday',
    label: 'Čtvrtek',
    labelShort: 'Čt',
    type: 'run',
    description: 'Zone 2 běh – 30–40 min, 65% max TF. Lehká aerobní zátěž, minimální interference s pátečním DL.',
    exercises: [
      { id: 'zone2-run', name: 'Zone 2 běh (nový)', nameShort: 'Zone 2', category: 'run', targetSets: '1', targetReps: '30–40 min', note: '65% max TF ≈ 130–140 TF. Lehký, konverzační tempo.' },
    ],
  },
  {
    key: 'friday',
    label: 'Pátek',
    labelShort: 'Pá',
    type: 'fullbody',
    description: 'FULL BODY – Deadlift focus. Celotělový stimul, mrtvý tah jako priorita.',
    exercises: [
      { id: 'deadlift', name: 'Conventional Deadlift', nameShort: 'Mrtvý tah', category: 'main', targetSets: '4', targetReps: '6', targetWeight: '158 kg', note: '70% 1RM, RPE 7' },
      { id: 'deficit-dl', name: 'Deficit Deadlift (3 cm)', nameShort: 'Deficit DL', category: 'accessory', targetSets: '3', targetReps: '5', targetWeight: '146 kg', note: '65% 1RM, síla ze země' },
      { id: 'bulgarian', name: 'Bulgarian Split Squat', nameShort: 'Bulgarian', category: 'accessory', targetSets: '3', targetReps: '10', targetWeight: '25–30 kg jedn.', note: '10/10 každá noha' },
      { id: 'hip-thrust', name: 'Hip Thrust', category: 'accessory', targetSets: '3', targetReps: '10', targetWeight: '80–100 kg', note: 'Gluteální aktivace → DL' },
      { id: 'ohp', name: 'Overhead Press (stroj)', nameShort: 'OHP', category: 'accessory', targetSets: '3', targetReps: '10', targetWeight: '70–75 kg', note: 'Ramenní stabilita' },
      { id: 'lateral-raises', name: 'Lateral Raises', nameShort: 'Ramena', category: 'isolation', targetSets: '4', targetReps: '15', targetWeight: '14 kg' },
      { id: 'farmers-carry', name: "Farmer's Carry", nameShort: 'Farmers', category: 'core', targetSets: '3', targetReps: '30 m', targetWeight: '40 kg jedn.', note: 'Grip síla → DL nad 200 kg' },
    ],
  },
  {
    key: 'saturday',
    label: 'Sobota',
    labelShort: 'So',
    type: 'hiit',
    description: 'HIIT / Intervaly – 25–35 min, 30s/30s.',
    exercises: [
      { id: 'hiit-sat', name: 'HIIT / Intervaly', nameShort: 'HIIT', category: 'run', targetSets: '1', targetReps: '25–35 min', note: 'Intervaly 30s/30s' },
    ],
  },
  {
    key: 'sunday',
    label: 'Neděle',
    labelShort: 'Ne',
    type: 'rest',
    description: 'Volno / aktivní regenerace. Procházka, strečink, sauna.',
    exercises: [],
  },
];

// ============================================================
// PHASE 3 WEEKS (12 weeks from 7.4.2026)
// ============================================================
export const PHASE3_WEEKS: Week[] = [
  // BLOK 1: OBJEMOVÁ AKUMULACE (T1–T4)
  {
    number: 1, label: 'T1 – Restart', dateFrom: '2026-04-07', dateTo: '2026-04-13',
    phase: 'Fáze 3 – Akumulace', phaseKey: 'phase3',
    description: 'Restart. Lehký objem, technika, RPE 7. Startovní váhy 65% 1RM.',
    days: WEEK_DAYS_PHASE3,
  },
  {
    number: 2, label: 'T2 – Progrese objemu', dateFrom: '2026-04-14', dateTo: '2026-04-20',
    phase: 'Fáze 3 – Akumulace', phaseKey: 'phase3',
    description: '+2,5–5 kg na hlavních liftech, +1 série. Double progression.',
    days: WEEK_DAYS_PHASE3,
  },
  {
    number: 3, label: 'T3 – Vrchol objemu', dateFrom: '2026-04-21', dateTo: '2026-04-27',
    phase: 'Fáze 3 – Akumulace', phaseKey: 'phase3',
    description: 'Maximální objemový stimul, RPE 8, 5×8 na hlavní cviky.',
    days: WEEK_DAYS_PHASE3,
  },
  {
    number: 4, label: 'T4 – Deload', dateFrom: '2026-04-28', dateTo: '2026-05-04',
    phase: 'Fáze 3 – Deload', phaseKey: 'deload1', isDeload: true,
    description: 'Deload. Objem –50%, RPE max 6–7. Regenerace CNS.',
    days: WEEK_DAYS_PHASE3,
  },
  // BLOK 2: SILOVÁ TRANSMUTACE (T5–T8)
  {
    number: 5, label: 'T5 – Intenzifikace', dateFrom: '2026-05-05', dateTo: '2026-05-11',
    phase: 'Fáze 3 – Transmutace', phaseKey: 'phase3',
    description: 'Start intenzifikace. 5×5, 75% 1RM, RPE 8. Accessory –20%.',
    days: WEEK_DAYS_PHASE3,
  },
  {
    number: 6, label: 'T6 – Progrese intenzity', dateFrom: '2026-05-12', dateTo: '2026-05-18',
    phase: 'Fáze 3 – Transmutace', phaseKey: 'phase3',
    description: '4×4 + AMRAP set, 80% 1RM. Pokud AMRAP >7, přidej příští týden.',
    days: WEEK_DAYS_PHASE3,
  },
  {
    number: 7, label: 'T7 – Těžká intenzita', dateFrom: '2026-05-19', dateTo: '2026-05-25',
    phase: 'Fáze 3 – Transmutace', phaseKey: 'phase3',
    description: '4×3, 85% 1RM. První přiblížení k maximu. Zone 2 zkrátit na 25 min.',
    days: WEEK_DAYS_PHASE3,
  },
  {
    number: 8, label: 'T8 – Deload', dateFrom: '2026-05-26', dateTo: '2026-06-01',
    phase: 'Fáze 3 – Deload', phaseKey: 'deload2', isDeload: true,
    description: 'Deload před peakingem. Objem –50%, RPE max 6. Kompletní regenerace.',
    days: WEEK_DAYS_PHASE3,
  },
  // BLOK 3: PEAKING + TEST (T9–T12)
  {
    number: 9, label: 'T9 – Peaking 1', dateFrom: '2026-06-02', dateTo: '2026-06-08',
    phase: 'Fáze 3 – Peaking', phaseKey: 'phase3',
    description: '4×3, 87% 1RM. Doplňkové cviky: max 2 série, udržovací objem.',
    days: WEEK_DAYS_PHASE3,
  },
  {
    number: 10, label: 'T10 – Peaking 2', dateFrom: '2026-06-09', dateTo: '2026-06-15',
    phase: 'Fáze 3 – Peaking', phaseKey: 'phase3',
    description: '3×2, 90% 1RM. Accessory minimální – face pulls, ab wheel, lehké RDL.',
    days: WEEK_DAYS_PHASE3,
  },
  {
    number: 11, label: 'T11 – Těžké singls', dateFrom: '2026-06-16', dateTo: '2026-06-22',
    phase: 'Fáze 3 – Peaking', phaseKey: 'phase3',
    description: '3×1, 93–95% 1RM. Žádné accessory. Pouze warm-up série a pracovní singls.',
    days: WEEK_DAYS_PHASE3,
  },
  {
    number: 12, label: 'T12 – Testovací týden', dateFrom: '2026-06-23', dateTo: '2026-06-29',
    phase: 'Fáze 3 – Test', phaseKey: 'phase3',
    description: 'TAPER + TESTOVACÍ TÝDEN. Po: Back Squat 190 kg. St: Bench Press 130 kg. Pá: Mrtvý tah 235 kg.',
    days: WEEK_DAYS_PHASE3,
  },
];

// ============================================================
// HISTORICAL DEFAULT DATA (Fáze 1 + Fáze 2)
// ============================================================
export const DEFAULT_RECORDS: RecordsMap = {
  squat: [
    { id: 'sq1', date: '2026-01-26', sets: '3', weight: '120', reps: '6', note: 'Výchozí váha' },
    { id: 'sq2', date: '2026-02-02', sets: '3', weight: '120', reps: '8', note: '' },
    { id: 'sq3', date: '2026-02-09', sets: '3', weight: '130', reps: '6', note: '' },
    { id: 'sq4', date: '2026-02-16', sets: '3', weight: '135', reps: '6', note: '' },
    { id: 'sq5', date: '2026-03-02', sets: '4', weight: '160', reps: '1', note: '160 kg × 1 + 150 kg × 5 (Fáze 2 – T6)' },
  ],
  'front-squat': [
    { id: 'fs1', date: '2026-01-26', sets: '3', weight: '80', reps: '10', note: '' },
    { id: 'fs2', date: '2026-02-02', sets: '3', weight: '90', reps: '10', note: '' },
    { id: 'fs3', date: '2026-02-09', sets: '3', weight: '100', reps: '10', note: '' },
    { id: 'fs4', date: '2026-02-16', sets: '3', weight: '105', reps: '8', note: '' },
  ],
  rdl: [
    { id: 'rdl1', date: '2026-01-26', sets: '3', weight: '60', reps: '8', note: '= 120 kg na ose s páskem' },
    { id: 'rdl2', date: '2026-02-02', sets: '3', weight: '65', reps: '8', note: '= 130 kg na ose s páskem' },
    { id: 'rdl3', date: '2026-02-09', sets: '3', weight: '70', reps: '8', note: '= 140 kg na ose s páskem' },
    { id: 'rdl4', date: '2026-02-16', sets: '3', weight: '50', reps: '12', note: 'jednoručky bez pásku' },
    { id: 'rdl5', date: '2026-03-02', sets: '3', weight: '70', reps: '12', note: '= 140 kg na ose s páskem (Fáze 2 – T6)' },
  ],
  'hack-squat': [
    { id: 'hs1', date: '2026-01-26', sets: '3', weight: '120', reps: '12', note: 'Leg Press' },
    { id: 'hs2', date: '2026-02-02', sets: '3', weight: '180', reps: '12', note: 'Leg Press' },
    { id: 'hs3', date: '2026-02-09', sets: '0', weight: '0', reps: '0', note: 'Předkopy – unavená kolena' },
    { id: 'hs4', date: '2026-02-16', sets: '3', weight: '180', reps: '12', note: 'Leg Press' },
    { id: 'hs5', date: '2026-03-02', sets: '3', weight: '220', reps: '12', note: 'Leg Press (Fáze 2 – T6, plán byl 200×6)' },
  ],
  'calf-raise': [
    { id: 'cr1', date: '2026-01-26', sets: '4', weight: '50', reps: '15', note: 'MaxFitness' },
    { id: 'cr2', date: '2026-02-02', sets: '4', weight: '60', reps: '12', note: 'MaxFitness' },
    { id: 'cr3', date: '2026-02-09', sets: '4', weight: '50', reps: '15', note: 'Domyno' },
    { id: 'cr4', date: '2026-02-16', sets: '4', weight: '60', reps: '12', note: 'Eden' },
    { id: 'cr5', date: '2026-03-02', sets: '4', weight: '60', reps: '12', note: 'Fáze 2 – T6' },
  ],
  'leg-raise': [
    { id: 'lr1', date: '2026-01-26', sets: '3', weight: '0', reps: '15', note: '' },
    { id: 'lr2', date: '2026-02-02', sets: '3', weight: '0', reps: '15', note: '' },
    { id: 'lr3', date: '2026-02-09', sets: '3', weight: '0', reps: '15', note: '' },
    { id: 'lr4', date: '2026-03-02', sets: '3', weight: '0', reps: '15', note: 'Fáze 2 – T6' },
  ],
  bench: [
    { id: 'b1', date: '2026-01-27', sets: '3', weight: '100', reps: '8', note: 'Výchozí váha' },
    { id: 'b2', date: '2026-02-03', sets: '3', weight: '105', reps: '8', note: '' },
    { id: 'b3', date: '2026-02-10', sets: '3', weight: '100', reps: '8', note: '' },
    { id: 'b4', date: '2026-02-17', sets: '4', weight: '105', reps: '8', note: '8,7,6,6 op – blíží se limitu' },
    { id: 'b5', date: '2026-02-24', sets: '4', weight: '105', reps: '6', note: '6,6,5,5 op (Fáze 2 – T5)' },
    { id: 'b6', date: '2026-03-03', sets: '4', weight: '110', reps: '3', note: '3,3,3,3 op (Fáze 2 – T6) – Euforia' },
    { id: 'b7', date: '2026-03-10', sets: '4', weight: '110', reps: '4', note: '4,3,3,3 op (Fáze 2 – T7)' },
    { id: 'b8', date: '2026-03-17', sets: '4', weight: '105', reps: '8', note: '8,7,6,6 op (Fáze 2 – T8 deload pump)' },
  ],
  'close-grip-bench': [
    { id: 'cgb1', date: '2026-03-03', sets: '3', weight: '80', reps: '6', note: 'Nový cvik – Fáze 2 T6' },
    { id: 'cgb2', date: '2026-03-10', sets: '3', weight: '85', reps: '5', note: 'Fáze 2 – T7' },
  ],
  'incline-db': [
    { id: 'id1', date: '2026-01-27', sets: '3', weight: '28', reps: '10', note: 'DB' },
    { id: 'id2', date: '2026-02-03', sets: '3', weight: '30', reps: '10', note: 'DB' },
    { id: 'id3', date: '2026-02-10', sets: '3', weight: '32.5', reps: '10', note: 'DB' },
    { id: 'id4', date: '2026-02-17', sets: '3', weight: '34', reps: '10', note: 'DB' },
    { id: 'id5', date: '2026-02-24', sets: '3', weight: '34', reps: '10', note: 'DB (Fáze 2 – T5)' },
    { id: 'id6', date: '2026-03-03', sets: '3', weight: '34', reps: '10', note: 'DB (Fáze 2 – T6)' },
    { id: 'id7', date: '2026-03-10', sets: '3', weight: '36', reps: '8', note: 'DB (Fáze 2 – T7)' },
  ],
  'pull-up': [
    { id: 'pu1', date: '2026-01-27', sets: '3', weight: '+10', reps: '5', note: '4,5,5 – nadhmat' },
    { id: 'pu2', date: '2026-02-03', sets: '3', weight: '+10', reps: '5', note: '5,5,5 – podhmat' },
    { id: 'pu3', date: '2026-02-10', sets: '3', weight: '+10', reps: '5', note: '5,5,5 – podhmat' },
    { id: 'pu4', date: '2026-02-17', sets: '4', weight: '+12', reps: '5', note: '5,5,4,4 – nadhmat' },
    { id: 'pu5', date: '2026-02-24', sets: '4', weight: '+15', reps: '4', note: '4,4,4,3 (Fáze 2 – T5)' },
    { id: 'pu6', date: '2026-03-03', sets: '4', weight: '+15', reps: '4', note: '4,4,4,4 (Fáze 2 – T6)' },
    { id: 'pu7', date: '2026-03-10', sets: '4', weight: '+20', reps: '3', note: '3,3,3,2 (Fáze 2 – T7)' },
    { id: 'pu8', date: '2026-03-17', sets: '4', weight: '+25', reps: '3', note: '3,3,3,3 (Fáze 2 – T8) – PR!' },
  ],
  'chest-row': [
    { id: 'cr1', date: '2026-01-27', sets: '3', weight: '44', reps: '12', note: 'jednoručka' },
    { id: 'cr2', date: '2026-02-03', sets: '3', weight: '44', reps: '12', note: 'jednoručka' },
    { id: 'cr3', date: '2026-02-10', sets: '3', weight: '70', reps: '12', note: 'stroj' },
    { id: 'cr4', date: '2026-02-17', sets: '3', weight: '70', reps: '12', note: 'stroj' },
    { id: 'cr5', date: '2026-02-24', sets: '3', weight: '65', reps: '8', note: 'stroj (Fáze 2 – T5)' },
    { id: 'cr6', date: '2026-03-03', sets: '3', weight: '65', reps: '8', note: 'stroj (Fáze 2 – T6)' },
    { id: 'cr7', date: '2026-03-10', sets: '3', weight: '65', reps: '8', note: 'Bent-over (Fáze 2 – T7)' },
  ],
  'face-pull': [
    { id: 'fp1', date: '2026-01-30', sets: '3', weight: '25', reps: '20', note: '' },
    { id: 'fp2', date: '2026-02-06', sets: '3', weight: '30', reps: '12', note: '' },
    { id: 'fp3', date: '2026-02-13', sets: '3', weight: '30', reps: '15', note: '' },
    { id: 'fp4', date: '2026-02-20', sets: '3', weight: '30', reps: '15', note: '' },
    { id: 'fp5', date: '2026-02-27', sets: '3', weight: '30', reps: '15', note: 'Fáze 2 – T5' },
    { id: 'fp6', date: '2026-03-05', sets: '3', weight: '30', reps: '15', note: 'Fáze 2 – T6' },
  ],
  'triceps-biceps': [
    { id: 'tb1', date: '2026-01-27', sets: '3', weight: '40', reps: '15', note: 'Triceps 40 kg × 15 / Biceps 12 kg × 12' },
    { id: 'tb2', date: '2026-02-03', sets: '3', weight: '45', reps: '15', note: 'Triceps 45 kg × 15 / Biceps 16 kg × 12' },
    { id: 'tb3', date: '2026-02-10', sets: '3', weight: '45', reps: '15', note: 'Triceps 45 kg × 15 / Biceps 16 kg × 12' },
    { id: 'tb4', date: '2026-02-17', sets: '3', weight: '45', reps: '15', note: 'Triceps 45 kg × 15 / Biceps 16 kg × 12' },
    { id: 'tb5', date: '2026-02-24', sets: '3', weight: '0', reps: '12', note: 'Dips +0 kg × 12 / Curl 30 kg × 12 (Fáze 2 – T5)' },
    { id: 'tb6', date: '2026-03-03', sets: '3', weight: '+10', reps: '8', note: 'Dips +10 kg × 8 / Curl 35 kg (Fáze 2 – T6)' },
    { id: 'tb7', date: '2026-03-10', sets: '3', weight: '+15', reps: '6', note: 'Dips +15 kg × 6 / Curl 35 kg × 10 (Fáze 2 – T7)' },
    { id: 'tb8', date: '2026-03-17', sets: '3', weight: '0', reps: '15', note: 'lehké kladky 3×15 / lehký scott 3×15 (Fáze 2 – T8 deload pump)' },
  ],
  'pallof-press': [
    { id: 'pp1', date: '2026-01-27', sets: '3', weight: '20', reps: '10', note: '10/10 – těžké' },
    { id: 'pp2', date: '2026-02-03', sets: '3', weight: '25', reps: '10', note: '10/10 – těžké' },
    { id: 'pp3', date: '2026-02-10', sets: '3', weight: '25', reps: '10', note: '10/10 – těžké' },
    { id: 'pp4', date: '2026-02-17', sets: '3', weight: '25', reps: '10', note: '10/10 – těžké' },
    { id: 'pp5', date: '2026-02-24', sets: '3', weight: '0', reps: '12', note: 'Ab Wheel 3×12 z kolen (Fáze 2 – T5)' },
    { id: 'pp6', date: '2026-03-03', sets: '3', weight: '0', reps: '10', note: 'Ab Wheel 3×10 z kolen (Fáze 2 – T6)' },
    { id: 'pp7', date: '2026-03-10', sets: '3', weight: '0', reps: '12', note: 'Ab Wheel 12,12,10 z kolen (Fáze 2 – T7)' },
    { id: 'pp8', date: '2026-03-17', sets: '3', weight: '0', reps: '60', note: 'Plank 3×60 s (Fáze 2 – T8)' },
  ],
  deadlift: [
    { id: 'dl1', date: '2026-01-30', sets: '3', weight: '180', reps: '6', note: 'RPE 8 – lehké' },
    { id: 'dl2', date: '2026-02-06', sets: '3', weight: '200', reps: '8', note: 'bez lifterského pásku' },
    { id: 'dl3', date: '2026-02-13', sets: '3', weight: '200', reps: '8', note: 's lifterský páskem' },
    { id: 'dl4', date: '2026-02-20', sets: '3', weight: '200', reps: '8', note: 's lifterský páskem' },
    { id: 'dl5', date: '2026-02-27', sets: '3', weight: '210', reps: '3', note: '3,3,2 op (Fáze 2 – T5)' },
    { id: 'dl6', date: '2026-03-05', sets: '3', weight: '220', reps: '2', note: '2,2,2 op (Fáze 2 – T6)' },
    { id: 'dl7', date: '2026-03-12', sets: '3', weight: '220', reps: '4', note: '4 op v 1. sérii – PR! pak 2,2 (Fáze 2 – T7)' },
    { id: 'dl8', date: '2026-03-19', sets: '3', weight: '230', reps: '2', note: '2 op, pak jen 1×200 kg (Fáze 2 – T8)' },
  ],
  'deficit-dl': [],
  bulgarian: [
    { id: 'bs1', date: '2026-01-30', sets: '2', weight: '20', reps: '10', note: 'jednoručka, 10/10 – lehké' },
    { id: 'bs2', date: '2026-02-06', sets: '2', weight: '25', reps: '10', note: 'jednoručka, 10/10' },
    { id: 'bs3', date: '2026-02-13', sets: '2', weight: '30', reps: '10', note: 'jednoručka, 10/10' },
    { id: 'bs4', date: '2026-02-27', sets: '2', weight: '30', reps: '10', note: 'jednoručka, 10/10 (Fáze 2 – T5)' },
    { id: 'bs5', date: '2026-03-05', sets: '2', weight: '32', reps: '10', note: 'jednoručka, 10/10 (Fáze 2 – T6)' },
    { id: 'bs6', date: '2026-03-12', sets: '2', weight: '35', reps: '8', note: 'jednoručka, 8/8 (Fáze 2 – T7)' },
  ],
  'hip-thrust': [],
  ohp: [
    { id: 'ohp1', date: '2026-01-30', sets: '3', weight: '72.5', reps: '10', note: 'OHP – stroj' },
    { id: 'ohp2', date: '2026-02-06', sets: '3', weight: '80', reps: '10', note: 'OHP – stroj' },
    { id: 'ohp3', date: '2026-02-13', sets: '3', weight: '80', reps: '10', note: 'OHP – stroj' },
    { id: 'ohp4', date: '2026-02-20', sets: '3', weight: '80', reps: '10', note: 'OHP – stroj' },
    { id: 'ohp5', date: '2026-02-27', sets: '3', weight: '80', reps: '8', note: 'OHP stroj (Fáze 2 – T5)' },
    { id: 'ohp6', date: '2026-03-05', sets: '3', weight: '80', reps: '10', note: 'OHP stroj – PR! (Fáze 2 – T6)' },
    { id: 'ohp7', date: '2026-03-12', sets: '3', weight: '82.5', reps: '8', note: 'OHP stroj (Fáze 2 – T7)' },
  ],
  'lateral-raises': [
    { id: 'lr1', date: '2026-01-30', sets: '3', weight: '7.5', reps: '15', note: 'kladka, 4×15' },
    { id: 'lr2', date: '2026-02-06', sets: '4', weight: '14', reps: '15', note: 'kladka Domyno, 4×15' },
    { id: 'lr3', date: '2026-02-13', sets: '4', weight: '14', reps: '15', note: '' },
    { id: 'lr4', date: '2026-02-20', sets: '4', weight: '14', reps: '15', note: '' },
    { id: 'lr5', date: '2026-02-27', sets: '4', weight: '14', reps: '15', note: 'Fáze 2 – T5' },
    { id: 'lr6', date: '2026-03-05', sets: '4', weight: '14', reps: '15', note: 'Fáze 2 – T6' },
  ],
  'farmers-carry': [
    { id: 'fc1', date: '2026-02-06', sets: '3', weight: '0', reps: '0', note: 'alternativa: kolečko na břícho' },
    { id: 'fc2', date: '2026-03-05', sets: '3', weight: '35', reps: '30', note: '30 m, jednoručka (Fáze 2 – T6)' },
  ],
  'pause-squat': [],
  'hiit-wed': [
    { id: 'hw1', date: '2026-01-28', sets: '1', weight: '0', reps: '60', note: 'HIIT 60 min' },
    { id: 'hw2', date: '2026-02-04', sets: '1', weight: '0', reps: '60', note: 'HIIT 60 min' },
    { id: 'hw3', date: '2026-02-11', sets: '1', weight: '0', reps: '60', note: 'HIIT 60 min' },
    { id: 'hw4', date: '2026-02-18', sets: '1', weight: '0', reps: '60', note: 'HIIT 60 min' },
    { id: 'hw5', date: '2026-02-25', sets: '1', weight: '0', reps: '45', note: 'HIIT 45 min (Fáze 2)' },
    { id: 'hw6', date: '2026-03-04', sets: '1', weight: '0', reps: '45', note: 'HIIT 45 min (Fáze 2)' },
  ],
  'zone2-run': [],
  'hiit-sat': [
    { id: 'hs1', date: '2026-01-31', sets: '1', weight: '0', reps: '60', note: 'HIIT 60 min' },
    { id: 'hs2', date: '2026-02-07', sets: '1', weight: '0', reps: '60', note: 'HIIT 60 min' },
    { id: 'hs3', date: '2026-02-14', sets: '1', weight: '0', reps: '60', note: 'HIIT 60 min' },
    { id: 'hs4', date: '2026-02-21', sets: '1', weight: '0', reps: '60', note: 'HIIT 60 min' },
    { id: 'hs5', date: '2026-02-28', sets: '1', weight: '0', reps: '35', note: 'HIIT 35 min (Fáze 2)' },
    { id: 'hs6', date: '2026-03-07', sets: '1', weight: '0', reps: '35', note: 'HIIT 35 min (Fáze 2)' },
  ],
};

// ============================================================
// HELPERS
// ============================================================

export function getTodayDayKey(): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
}

export function getCurrentWeek(): Week {
  const today = new Date();
  const found = PHASE3_WEEKS.find(w => {
    const from = new Date(w.dateFrom);
    const to = new Date(w.dateTo);
    to.setHours(23, 59, 59);
    return today >= from && today <= to;
  });
  return found || PHASE3_WEEKS[0];
}

export function getCategoryColor(category: ExerciseCategory): string {
  const map: Record<ExerciseCategory, string> = {
    main: '#F5C842',
    accessory: '#E8E8E8',
    isolation: '#A0A0A0',
    prevention: '#5ECFB1',
    core: '#7A8BA0',
    run: '#6EE7B7',
  };
  return map[category];
}

export function getCategoryLabel(category: ExerciseCategory): string {
  const map: Record<ExerciseCategory, string> = {
    main: 'Hlavní cvik',
    accessory: 'Doplňkový',
    isolation: 'Izolace',
    prevention: 'Prevence',
    core: 'Core',
    run: 'Kardio / Běh',
  };
  return map[category];
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' });
}

export function formatDateFull(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function nanoid(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

// Epley 1RM estimate
export function estimate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}
