// Záloha tréninkového deníku do jednoho JSON souboru.
//
// Spouští se: pnpm zaloha
// Uloží se na dvě místa:
//   1) zalohy/ v repu  → pushne se na GitHub = online, verzované, dohledatelné
//   2) ~/Desktop/GymDiary_zalohy/ → po ruce na Macu
//
// ⚠️ Co tahle záloha OBSAHUJE: kanonická data z repa (data.ts + recoveryData.ts),
// ze kterých se appka plní. To je celá historie tréninků, běhů i HIIT.
// ⚠️ Co NEOBSAHUJE: to, co si zapsal na telefonu a ještě to není v repu —
// ta data leží jen v localStorage prohlížeče. Na ně slouží v appce
// Nástroje → Export → „Kompletní záloha (JSON)"; ten soubor si ulož
// do stejné složky na ploše, ať je všechno pohromadě.
import { writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const REPO = path.resolve(import.meta.dirname, '..');
const { DEFAULT_RECORDS, PLANNED_RECORDS, PHASE3_WEEKS, LEGACY_PLAN_WEEKS,
        NUTRITION, RUNNING_PROGRAM, GOALS, CURRENT_MAXES } =
  await import(path.join(REPO, 'client/src/lib/data.ts'));
const { RECOVERED_WORKOUT_RECORDS, RECOVERED_RUN_RECORDS, RECOVERED_HIIT_RECORDS } =
  await import(path.join(REPO, 'client/src/lib/recoveryData.ts'));

/** Sloučí historii z data.ts a recoveryData.ts stejně, jako to dělá appka. */
function slucZaznamy() {
  const out = {};
  for (const src of [DEFAULT_RECORDS, RECOVERED_WORKOUT_RECORDS]) {
    for (const [ex, arr] of Object.entries(src)) {
      const mam = new Set((out[ex] ?? []).map(r => r.id));
      out[ex] = [...(out[ex] ?? []), ...arr.filter(r => !mam.has(r.id))]
        .sort((a, b) => a.date.localeCompare(b.date));
    }
  }
  return out;
}

const zaznamy = slucZaznamy();
const vsechny = Object.values(zaznamy).flat();
const realne = vsechny.filter(r => !r.planned);

const dnes = new Date().toISOString().slice(0, 10);
const zaloha = {
  format: 'gymdiary-zaloha',
  verze: 1,
  vytvoreno: new Date().toISOString(),
  zdroj: 'repo (data.ts + recoveryData.ts)',
  souhrn: {
    cviku: Object.keys(zaznamy).length,
    zaznamuCelkem: vsechny.length,
    odcvicenych: realne.length,
    predepsanych: Object.values(PLANNED_RECORDS).flat().length,
    behu: RECOVERED_RUN_RECORDS.length,
    hiit: RECOVERED_HIIT_RECORDS.length,
    tydnuVPlanu: PHASE3_WEEKS.length,
    prvniZaznam: realne.map(r => r.date).sort()[0],
    posledniZaznam: realne.map(r => r.date).sort().pop(),
  },
  cile: GOALS,
  maxima: CURRENT_MAXES,
  vyziva: NUTRITION,
  bezeckyProgram: RUNNING_PROGRAM,
  zaznamy,
  predepsane: PLANNED_RECORDS,
  behy: RECOVERED_RUN_RECORDS,
  hiit: RECOVERED_HIIT_RECORDS,
  planTydny: PHASE3_WEEKS,
  staryPlan: LEGACY_PLAN_WEEKS,
};

const jmeno = `gymdiary-zaloha-${dnes}.json`;
const vRepu = path.join(REPO, 'zalohy');
mkdirSync(vRepu, { recursive: true });
writeFileSync(path.join(vRepu, jmeno), JSON.stringify(zaloha, null, 2), 'utf-8');

const naPlose = path.join(homedir(), 'Desktop', 'GymDiary_zalohy');
mkdirSync(naPlose, { recursive: true });
cpSync(path.join(vRepu, jmeno), path.join(naPlose, jmeno));

console.log('Záloha hotová:', jmeno);
console.log('  v repu :', path.join('zalohy', jmeno));
console.log('  na ploše:', path.join(naPlose, jmeno));
console.log('  souhrn :', JSON.stringify(zaloha.souhrn));
