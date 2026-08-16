import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';
import { DEFAULT_RECORDS, PHASE3_WEEKS } from '../client/src/lib/data.ts';
import {
  RECOVERED_HIIT_RECORDS,
  RECOVERED_RUN_RECORDS,
  RECOVERED_WORKOUT_RECORDS,
} from '../client/src/lib/recoveryData.ts';

const outputDir = '/home/ubuntu/gymdiary-recovery-exports';
const dateStamp = '2026-08-16';
fs.mkdirSync(outputDir, { recursive: true });

function mergeRecords(base, additions) {
  const merged = Object.fromEntries(Object.entries(base).map(([key, value]) => [key, [...value]]));
  for (const [exerciseId, recovered] of Object.entries(additions)) {
    const existing = merged[exerciseId] ?? [];
    const ids = new Set(existing.map((record) => record.id));
    merged[exerciseId] = [...existing, ...recovered.filter((record) => !ids.has(record.id))]
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  return merged;
}

const workoutRecords = mergeRecords(DEFAULT_RECORDS, RECOVERED_WORKOUT_RECORDS);
const backup = {
  format: 'gymdiary-backup',
  version: 1,
  createdAt: new Date().toISOString(),
  restorationScope: 'W1–W14 completed according to plan; W15 empty; only confirmed W16 performances included.',
  workoutRecords,
  runRecords: RECOVERED_RUN_RECORDS,
  hiitRecords: RECOVERED_HIIT_RECORDS,
  bodyWeightRecords: [],
};

const jsonPath = path.join(outputDir, `gymdiary-zaloha-obnovena-${dateStamp}.json`);
fs.writeFileSync(jsonPath, JSON.stringify(backup, null, 2), 'utf8');

const exerciseIndex = new Map();
for (const week of PHASE3_WEEKS) {
  for (const day of week.days) {
    for (const exercise of day.exercises) {
      if (!exerciseIndex.has(exercise.id)) {
        exerciseIndex.set(exercise.id, { name: exercise.name, day: day.label, category: exercise.category });
      }
    }
  }
}

const workoutRows = [['Datum', 'Cvik', 'ID cviku', 'Den', 'Série', 'Váha (kg)', 'Opakování', 'Poznámka']];
for (const [exerciseId, records] of Object.entries(workoutRecords)) {
  const info = exerciseIndex.get(exerciseId) ?? { name: exerciseId, day: 'Historie', category: '–' };
  for (const record of records) {
    workoutRows.push([record.date, info.name, exerciseId, info.day, record.sets, record.weight, record.reps, record.note]);
  }
}
workoutRows.splice(1, workoutRows.length - 1, ...workoutRows.slice(1).sort((a, b) => String(a[0]).localeCompare(String(b[0]))));

const runRows = [['Datum', 'Délka', 'Vzdálenost (km)', 'Tempo', 'Průměrný TF', 'Zóna', 'Poznámka'], ...RECOVERED_RUN_RECORDS.map((run) => [run.date, run.duration, run.distance, run.avgPace ?? '', run.avgHr ?? '', run.zone, run.note])];
const hiitRows = [['Datum', 'Typ', 'Délka', 'Průměrný TF', 'Kalorie', 'Poznámka'], ...RECOVERED_HIIT_RECORDS.map((record) => [record.date, record.type, record.duration, record.avgHr ?? '', record.calories ?? '', record.note])];
const metadataRows = [
  ['Parametr', 'Hodnota'],
  ['Formát zálohy', 'gymdiary-backup v1'],
  ['Obnovené silové záznamy', String(Object.values(RECOVERED_WORKOUT_RECORDS).reduce((sum, records) => sum + records.length, 0))],
  ['Přepsané běhy ze screenshotů', String(RECOVERED_RUN_RECORDS.length)],
  ['Přepsané HIIT záznamy ze screenshotů', String(RECOVERED_HIIT_RECORDS.length)],
  ['W1–W14', 'Splněno dle potvrzeného plánu'],
  ['W15', 'Bez záznamu'],
  ['W16', 'Pouze Bench 125×1, Squat 170×1, Deadlift 220×4×1'],
  ['Vytvořeno', new Date().toISOString()],
];

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(workoutRows), 'Záznamy cviků');
XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(runRows), 'Běhy ze screenshotů');
XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(hiitRows), 'HIIT ze screenshotů');
XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(metadataRows), 'Metadata obnovy');

const xlsxPath = path.join(outputDir, `gymdiary-export-obnoveno-${dateStamp}.xlsx`);
XLSX.writeFile(workbook, xlsxPath);

console.log(JSON.stringify({ jsonPath, xlsxPath, workoutRecordCount: workoutRows.length - 1, runCount: RECOVERED_RUN_RECORDS.length, hiitCount: RECOVERED_HIIT_RECORDS.length }, null, 2));
