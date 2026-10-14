// GymDiary recovery data: deterministic reconstruction for the user's lost 2026 log.
// Data rules: W1–W14 strength records are restored from the approved plan;
// run and HIIT records are transcribed only from visible supplied screenshots.

import {
  LEGACY_PLAN_WEEKS,
  type HIITRecord,
  type OtherRecord,
  type RecordsMap,
  type RunRecord,
} from '@/lib/data';

const DAY_OFFSET: Record<string, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
};

function isoForDay(weekStart: string, dayKey: string) {
  const date = new Date(`${weekStart}T12:00:00`);
  date.setDate(date.getDate() + (DAY_OFFSET[dayKey] ?? 0));
  return date.toISOString().slice(0, 10);
}

function firstNumber(value?: string) {
  const match = value?.match(/\d+(?:[.,]\d+)?/);
  return match ? match[0].replace(',', '.') : '0';
}

function firstRepTarget(value: string) {
  const match = value.match(/\d+/);
  return match ? match[0] : '0';
}

/** Strength records restored as completed, exactly as approved by the user. */
export const RECOVERED_WORKOUT_RECORDS: RecordsMap = (() => {
  const records: RecordsMap = {};

  for (const week of LEGACY_PLAN_WEEKS.filter((item) => item.number <= 14)) {
    for (const day of week.days) {
      if (!['upper', 'lower', 'fullbody'].includes(day.type)) continue;
      const date = isoForDay(week.dateFrom, day.key);

      day.exercises.forEach((exercise, index) => {
        const record = {
          id: `recovered-w${week.number}-${day.key}-${index}-${exercise.id}`,
          date,
          sets: exercise.targetSets,
          weight: firstNumber(exercise.targetWeight),
          reps: firstRepTarget(exercise.targetReps),
          note: `Obnoveno z potvrzeného plánu W${week.number} · splněno dle plánu${exercise.targetWeight ? ` (${exercise.targetWeight})` : ' (BW / bez zátěže)'}.`,
        };
        records[exercise.id] = [...(records[exercise.id] ?? []), record];
      });
    }
  }

  // W15 zůstává prázdný. U W16 jsou obnoveny pouze uživatelem potvrzené výkony.
  const confirmedResults = [
    { id: 'recovered-w16-squat-170', exerciseId: 'squat', date: '2026-08-03', weight: '170', reps: '1', note: 'Úspěšný pokus 170 kg · uživatel potvrdil. W16 je jinak nehotový.' },
    { id: 'recovered-w16-bench-125', exerciseId: 'bench', date: '2026-08-05', weight: '125', reps: '1', note: 'Úspěšný pokus 125 kg · uživatel potvrdil. W16 je jinak nehotový.' },
    { id: 'recovered-w16-deadlift-220x4', exerciseId: 'deadlift', date: '2026-08-07', weight: '220', reps: '4', note: 'Úspěšná série 220 kg × 4 · 1 série · uživatel potvrdil. W16 je jinak nehotový.' },
  ];

  for (const result of confirmedResults) {
    records[result.exerciseId] = [
      ...(records[result.exerciseId] ?? []),
      { id: result.id, date: result.date, sets: '1', weight: result.weight, reps: result.reps, note: result.note },
    ];
  }

  return records;
})();

function run(id: string, date: string, duration: string, distance: string, avgPace: string, avgHr: string, note: string): RunRecord {
  return { id, date, duration, distance, zone: 'Dle Strava', avgPace, avgHr, note: `Přepsáno ze Strava screenshotu · ${note}` };
}

/** Běh přepsaný z COROS Training Hubu (trainingeu.coros.com). */
function coros(id: string, date: string, duration: string, distance: string, avgPace: string, avgHr: string, note: string): RunRecord {
  return { id, date, duration, distance, zone: 'Dle COROS', avgPace, avgHr, note: `Přepsáno z COROS · ${note}` };
}

/**
 * Běh z COROSu i s metrikami, které hodinky měří navíc.
 * `pace` se počítá z čistého času a vzdálenosti — `adjustedPace` je COROSovo
 * „tempo úsilí" přepočtené na rovinu, proto se u kopcovitého běhu liší.
 */
function corosRun(
  id: string, date: string, duration: string, distance: string, avgPace: string,
  avgHr: string, cadence: string, ascent: string, trainingLoad: string,
  calories: string, adjustedPace: string, note: string,
): RunRecord {
  return {
    id, date, duration, distance, zone: 'Dle COROS', avgPace, avgHr,
    cadence, ascent, trainingLoad, calories, adjustedPace,
    note: `Přepsáno z COROS · ${note}`,
  };
}

/** Kolo nebo turistika z COROSu. */
function corosOther(
  id: string, date: string, sport: 'bike' | 'hike', name: string, duration: string,
  distance: string, avgHr: string, avgSpeed: string, ascent: string,
  calories: string, trainingLoad: string, note: string,
): OtherRecord {
  return { id, date, sport, name, duration, distance, avgHr, avgSpeed, ascent, calories, trainingLoad, note };
}

/** HIIT přepsaný z COROSu. */
function corosHiit(id: string, date: string, duration: string, avgHr: string, calories: string, note: string): HIITRecord {
  return { id, date, type: 'other', duration, zone: 'Dle COROS', avgHr, calories, exercises: 'HIIT lekce', note: `Přepsáno z COROS · ${note}` };
}

/** All fully visible runs transcribed from the supplied Strava screenshots. */
export const RECOVERED_RUN_RECORDS: RunRecord[] = [
  run('run-2026-03-18', '2026-03-18', '28:15', '5.29', '5:20/km', '177', 'Wednesday Morning Run'),
  run('run-2026-04-04', '2026-04-04', '28:56', '5.47', '5:17/km', '177', 'Saturday Morning Run'),
  run('run-2026-04-06', '2026-04-06', '34:22', '6.58', '5:14/km', '169', 'Monday Evening Run'),
  run('run-2026-05-06', '2026-05-06', '40:37', '7.33', '5:32/km', '172', 'Wednesday Morning Run'),
  run('run-2026-05-07', '2026-05-07', '37:21', '6.35', '5:53/km', '', 'Thursday Morning Run; tep nebyl na screenshotu k dispozici'),
  run('run-2026-05-24-1', '2026-05-24', '22:56', '4.03', '5:41/km', '169', 'Sunday Morning Run'),
  run('run-2026-05-24-2', '2026-05-24', '1:53', '0.41', '4:33/km', '124', 'Sunday Morning Run'),
  run('run-2026-05-27', '2026-05-27', '35:24', '6.45', '5:30/km', '171', 'Wednesday Morning Run'),
  run('run-2026-05-29', '2026-05-29', '1:00:59', '9.98', '6:07/km', '160', 'Friday Afternoon Run'),
  run('run-2026-06-04-1', '2026-06-04', '3:52', '0.64', '6:04/km', '152', 'Thursday Evening Run'),
  run('run-2026-06-04-2', '2026-06-04', '7:25', '1.50', '4:57/km', '173', 'Thursday Evening Run'),
  run('run-2026-06-04-3', '2026-06-04', '1:44', '0.49', '3:34/km', '113', 'Thursday Evening Run'),
  run('run-2026-06-04-4', '2026-06-04', '16:06', '2.83', '5:41/km', '161', 'Thursday Evening Run'),
  run('run-2026-06-05', '2026-06-05', '51:44', '9.20', '5:37/km', '162', 'Friday Morning Run'),
  run('run-2026-06-06-1', '2026-06-06', '11:15', '2.29', '4:55/km', '169', 'Saturday Afternoon Run'),
  run('run-2026-06-06-2', '2026-06-06', '1:20', '0.50', '2:41/km', '113', 'Saturday Afternoon Run'),
  run('run-2026-06-17', '2026-06-17', '32:53', '5.83', '5:38/km', '167', 'Wednesday Afternoon Run'),
  run('run-2026-06-19', '2026-06-19', '35:03', '5.84', '6:00/km', '163', 'Friday Afternoon Run'),
  run('run-2026-07-01', '2026-07-01', '24:50', '4.27', '5:49/km', '154', 'Wednesday Morning Run'),
  run('run-2026-07-10-1', '2026-07-10', '1:19', '0.47', '2:49/km', '116', 'Friday Evening Run'),
  run('run-2026-07-10-2', '2026-07-10', '15:07', '2.44', '6:12/km', '158', 'Friday Evening Run'),
  run('run-2026-07-21', '2026-07-21', '47:32', '7.70', '6:11/km', '155', 'Tuesday Evening Run'),
  run('run-2026-07-25', '2026-07-25', '30:57', '5.24', '5:55/km', '160', 'Saturday Morning Run'),
  run('run-2026-07-29-1', '2026-07-29', '22:07', '3.71', '5:58/km', '', 'Wednesday Morning Run; tep na screenshotu nebyl k dispozici'),
  run('run-2026-07-29-2', '2026-07-29', '11:38', '2.05', '5:40/km', '173', 'Wednesday Morning Run'),
  run('run-2026-08-05-1', '2026-08-05', '13:02', '2.35', '5:33/km', '164', 'Wednesday Morning Run'),
  run('run-2026-08-05-2', '2026-08-05', '1:30', '0.40', '3:43/km', '162', 'Wednesday Morning Run'),
  run('run-2026-08-05-3', '2026-08-05', '1:25', '0.38', '3:44/km', '167', 'Wednesday Morning Run'),
  run('run-2026-08-05-4', '2026-08-05', '1:25', '0.41', '3:26/km', '167', 'Wednesday Morning Run'),
  run('run-2026-08-05-5', '2026-08-05', '13:14', '2.22', '5:57/km', '164', 'Wednesday Morning Run'),
  run('run-2026-08-06-1', '2026-08-06', '20:56', '3.46', '6:03/km', '160', 'Thursday Evening Run'),
  run('run-2026-08-06-2', '2026-08-06', '42:00', '6.85', '6:08/km', '162', 'Thursday Evening Run'),
  run('run-2026-08-06-3', '2026-08-06', '14:42', '2.41', '6:06/km', '165', 'Thursday Evening Run'),
  run('run-2026-08-12', '2026-08-12', '1:04:44', '10.54', '6:08/km', '159', 'Wednesday Morning Run'),
  // Doplněno 10. 9. 2026 ze screenshotů z Oury (Workouts). Časy z výpisu,
  // dva běhy 2. 9. a 8. 9. proto mají v id pořadí.
  run('run-2026-08-18', '2026-08-18', '1:12:49', '11.93', '6:06/km', '160', 'Tuesday Morning Run'),
  run('run-2026-08-21', '2026-08-21', '31:45', '5.26', '6:02/km', '161', 'Friday Morning Run'),
  run('run-2026-08-29', '2026-08-29', '49:40', '8.61', '5:46/km', '168', 'Saturday Afternoon Run'),
  run('run-2026-08-30', '2026-08-30', '2:54', '0.78', '3:43/km', '121', 'Sunday Evening Run'),
  run('run-2026-09-02-1', '2026-09-02', '39:39', '6.93', '5:44/km', '170', 'Wednesday Morning Run'),
  run('run-2026-09-02-2', '2026-09-02', '9:47', '0.17', '57:33/km', '87', 'Wednesday Evening Run — rozklus před HIIT lekcí'),
  run('run-2026-09-08-1', '2026-09-08', '40:17', '6.41', '6:17/km', '150', 'Tuesday Evening Run'),
  run('run-2026-09-08-2', '2026-09-08', '11:33', '1.97', '5:52/km', '152', 'Tuesday Evening Run — druhý, 1944 kroků'),
  // Doplněno 23. 9. 2026 z COROS Training Hubu.
  coros('run-2026-09-16', '2026-09-16', '46:28', '7.80', '5:58/km', '166', 'Praha Běh — středeční ranní běh před HIIT'),
  coros('run-2026-09-23', '2026-09-23', '38:35', '6.29', '6:08/km', '161', 'Praha Běh — středeční ranní běh, T4 osmička s finišem v1, zátěž 145'),
  // Doplněno 14. 10. 2026 z COROSu — od tohohle záznamu i s kadencí, převýšením a zátěží.
  corosRun('run-2026-10-02', '2026-10-02', '47:12', '8.16', '5:47/km', '163', '156', '45', '201', '798', '5:44/km', 'Praha Běh — nejrychlejší a nejdelší běh bloku'),
  corosRun('run-2026-10-07', '2026-10-07', '44:43', '7.16', '6:14/km', '162', '157', '111', '186', '748', '5:58/km', 'T6 ST · Osmička s finišem v2 — nejkopcovitější běh (111 m převýšení)'),
  corosRun('run-2026-10-13', '2026-10-13', '42:58', '6.78', '6:20/km', '158', '150', '32', '205', '697', '6:19/km', 'T5 ST · 400 m úseky — intervalový trénink, nejvyšší zátěž 205 TL'),
];

/** Kolo a turistika z COROSu. Nezapočítávají se do běžeckých statistik. */
export const RECOVERED_OTHER_RECORDS: OtherRecord[] = [
  corosOther('other-2026-09-20', '2026-09-20', 'hike', 'Mníšek pod Brdy Turistika', '2:10:51', '8.60', '96', '3,9 km/h', '211', '742', '16', 'Nedělní výšlap'),
  corosOther('other-2026-09-28', '2026-09-28', 'bike', 'Praha Silniční kolo', '1:31:29', '20.74', '113', '13,6 km/h', '44', '750', '49', 'Nedělní vyjížďka'),
  corosOther('other-2026-10-03', '2026-10-03', 'bike', 'Libiš Silniční kolo', '2:37:00', '50.99', '118', '19,5 km/h', '148', '1383', '105', 'Nejdelší vyjížďka — 51 km v Z1/Z2'),
  corosOther('other-2026-10-04', '2026-10-04', 'bike', 'Praha Silniční kolo', '1:42:34', '41.86', '153', '24,5 km/h', '105', '1380', '259', 'Nejtvrdší vyjížďka — 24,5 km/h, zátěž 259 TL'),
];

function hiit(id: string, date: string, duration: string, avgHr: string, calories: string): HIITRecord {
  return {
    id,
    date,
    type: 'other',
    duration,
    zone: 'Dle Strava',
    avgHr,
    calories,
    exercises: 'HIIT',
    note: `Přepsáno ze Strava screenshotu · délka ${duration} min.`,
  };
}

/** All fully visible HIIT entries transcribed from the supplied Strava screenshots. */
export const RECOVERED_HIIT_RECORDS: HIITRecord[] = [
  hiit('hiit-2026-02-11', '2026-02-11', '25:03', '169', '440'),
  hiit('hiit-2026-02-22', '2026-02-22', '30:26', '160', '496'),
  hiit('hiit-2026-02-25', '2026-02-25', '48:29', '154', '755'),
  hiit('hiit-2026-02-28-1', '2026-02-28', '23:31', '176', '423'),
  hiit('hiit-2026-02-28-2', '2026-02-28', '1:56', '146', '27'),
  hiit('hiit-2026-03-04-1', '2026-03-04', '3:30', '139', '47'),
  hiit('hiit-2026-03-04-2', '2026-03-04', '17:42', '150', '269'),
  hiit('hiit-2026-03-11', '2026-03-11', '34:36', '150', '545'),
  hiit('hiit-2026-03-14-1', '2026-03-14', '35:34', '151', '568'),
  hiit('hiit-2026-03-14-2', '2026-03-14', '3:58', '134', '53'),
  hiit('hiit-2026-03-21-1', '2026-03-21', '1:51', '140', '26'),
  hiit('hiit-2026-03-21-2', '2026-03-21', '33:42', '159', '576'),
  hiit('hiit-2026-03-21-3', '2026-03-21', '3:14', '135', '43'),
  hiit('hiit-2026-04-08-1', '2026-04-08', '3:41', '142', '50'),
  hiit('hiit-2026-04-08-2', '2026-04-08', '34:12', '148', '507'),
  hiit('hiit-2026-04-08-3', '2026-04-08', '2:15', '167', '36'),
  hiit('hiit-2026-04-25', '2026-04-25', '37:04', '164', '620'),
  hiit('hiit-2026-05-02', '2026-05-02', '37:45', '162', '624'),
  hiit('hiit-2026-05-16', '2026-05-16', '33:01', '158', '518'),
  hiit('hiit-2026-05-23-1', '2026-05-23', '6:10', '112', '62'),
  hiit('hiit-2026-05-23-2', '2026-05-23', '24:02', '156', '378'),
  hiit('hiit-2026-06-14', '2026-06-14', '40:27', '164', '690'),
  hiit('hiit-2026-07-01-1', '2026-07-01', '32:47', '150', '489'),
  hiit('hiit-2026-07-01-2', '2026-07-01', '4:29', '136', '58'),
  hiit('hiit-2026-07-11-1', '2026-07-11', '1:52', '149', '28'),
  hiit('hiit-2026-07-11-2', '2026-07-11', '40:34', '137', '600'),
  hiit('hiit-2026-07-18-1', '2026-07-18', '3:41', '122', '47'),
  hiit('hiit-2026-07-18-2', '2026-07-18', '36:00', '140', '541'),
  hiit('hiit-2026-07-26-1', '2026-07-26', '10:03', '129', '137'),
  hiit('hiit-2026-07-26-2', '2026-07-26', '33:58', '168', '636'),
  hiit('hiit-2026-07-26-3', '2026-07-26', '2:58', '151', '48'),
  hiit('hiit-2026-08-01-1', '2026-08-01', '8:57', '120', '112'),
  hiit('hiit-2026-08-01-2', '2026-08-01', '40:16', '142', '622'),
  // Doplněno 10. 9. 2026 ze screenshotu Oury.
  hiit('hiit-2026-09-02', '2026-09-02', '25:57', '150', '417'),
  // Doplněno 23. 9. 2026 z COROSu.
  corosHiit('hiit-2026-09-16', '2026-09-16', '52:05', '157', '557', 'Hybridní fitness trénink · zátěž 118'),
  // ⚠️ Sobota 19. 9. byla v COROSu ve TŘECH záznamech (2:59 + 36:14 + 1:56).
  // Je to JEDNA lekce — rozděluje si ji kvůli oddělené tepovce na rozcvičce
  // a finiši. Sloučeno: 41:09 celkem, vážený průměr tepu 157.
  corosHiit('hiit-2026-09-19', '2026-09-19', '41:09', '157', '475', 'Hybridní fitness trénink · 3 části sloučené (2:59 + 36:14 + 1:56), zátěž 105'),
  // Doplněno 14. 10. 2026 z COROSu.
  corosHiit('hiit-2026-09-23', '2026-09-23', '55:01', '150', '402', 'Hybridní fitness trénink · zátěž 72'),
  corosHiit('hiit-2026-09-26', '2026-09-26', '51:09', '135', '349', 'HIIT lekce · nejklidnější lekce bloku, zátěž 46'),
  // ⚠️ Neděle 28. 9. byla v COROSu ve dvou záznamech (39:23 + 3:56) — jedna lekce.
  corosHiit('hiit-2026-09-28', '2026-09-28', '43:19', '149', '541', 'Hybridní fitness trénink · 2 části sloučené, zátěž 97'),
  corosHiit('hiit-2026-09-30', '2026-09-30', '53:53', '162', '614', 'Hybridní fitness trénink · nejtvrdší lekce, zátěž 145'),
  corosHiit('hiit-2026-10-07', '2026-10-07', '50:26', '158', '543', 'HIIT lekce · zátěž 114'),
  corosHiit('hiit-2026-10-10', '2026-10-10', '45:38', '159', '476', 'Hybridní fitness trénink · zátěž 103'),
];
