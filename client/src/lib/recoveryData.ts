// GymDiary recovery data: deterministic reconstruction for the user's lost 2026 log.
// Data rules: W1–W14 strength records are restored from the approved plan;
// run and HIIT records are transcribed only from visible supplied screenshots.

import {
  LEGACY_PLAN_WEEKS,
  type HIITRecord,
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
];
