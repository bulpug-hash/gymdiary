// Jedna evidence běhů a HIIT pro celou appku.
//
// Dřív měl Deník vlastní načítání logu a Přehled zapisoval odškrtnutý běh jen
// jako „sérii" do tréninkových záznamů. Běh z Přehledu se tak nikdy nedostal
// do Deníku → Běhy ani do XLSX exportu. Teď oba čtou a píšou přes tenhle modul.
import { RUN_LOG_KEY, HIIT_LOG_KEY, type RunRecord, type HIITRecord } from '@/lib/data';
import { RECOVERED_RUN_RECORDS, RECOVERED_HIIT_RECORDS } from '@/lib/recoveryData';

export const RUN_TOMB_KEY = 'gymdiary_run_deleted_v1';
export const HIIT_TOMB_KEY = 'gymdiary_hiit_deleted_v1';

function nactiNahrobky(klic: string): Set<string> {
  try {
    const raw = localStorage.getItem(klic);
    const a = raw ? JSON.parse(raw) : [];
    return Array.isArray(a) ? new Set(a as string[]) : new Set();
  } catch { return new Set(); }
}

export function pridejNahrobek(klic: string, id: string) {
  const s = nactiNahrobky(klic);
  s.add(id);
  try { localStorage.setItem(klic, JSON.stringify(Array.from(s))); } catch { /* kvóta */ }
}

export function odeberNahrobek(klic: string, id: string) {
  const s = nactiNahrobky(klic);
  if (!s.delete(id)) return;
  try { localStorage.setItem(klic, JSON.stringify(Array.from(s))); } catch { /* kvóta */ }
}

/**
 * Sloučí uložený log se seedem podle id.
 * ⚠️ Seed se NESMÍ použít jen při prázdném logu — jakmile se jednou naplnil,
 * nové záznamy z recoveryData.ts by se k uživateli už nikdy nedostaly.
 */
function slucSeSeedem<T extends { id: string; date: string }>(ulozene: T[], seed: T[], tombKey: string): T[] {
  const tomb = nactiNahrobky(tombKey);
  const mam = new Set(ulozene.map(r => r.id));
  const doplnit = seed.filter(r => !mam.has(r.id));
  return [...ulozene, ...doplnit]
    .filter(r => !tomb.has(r.id))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function nacti<T extends { id: string; date: string }>(klic: string, seed: T[], tombKey: string): T[] {
  try {
    const raw = localStorage.getItem(klic);
    const parsed = raw ? JSON.parse(raw) : [];
    return slucSeSeedem(Array.isArray(parsed) ? parsed as T[] : [], seed, tombKey);
  } catch {
    return slucSeSeedem([], seed, tombKey);
  }
}

export const loadRunRecords = (): RunRecord[] => nacti(RUN_LOG_KEY, RECOVERED_RUN_RECORDS, RUN_TOMB_KEY);
export const loadHIITRecords = (): HIITRecord[] => nacti(HIIT_LOG_KEY, RECOVERED_HIIT_RECORDS, HIIT_TOMB_KEY);

export function saveRunRecords(r: RunRecord[]) {
  try { localStorage.setItem(RUN_LOG_KEY, JSON.stringify(r)); } catch { /* kvóta */ }
}
export function saveHIITRecords(r: HIITRecord[]) {
  try { localStorage.setItem(HIIT_LOG_KEY, JSON.stringify(r)); } catch { /* kvóta */ }
}

/** Vloží nebo nahradí záznam podle id. */
export function upsertRun(z: RunRecord) {
  odeberNahrobek(RUN_TOMB_KEY, z.id);
  saveRunRecords([...loadRunRecords().filter(r => r.id !== z.id), z].sort((a, b) => a.date.localeCompare(b.date)));
}
export function upsertHIIT(z: HIITRecord) {
  odeberNahrobek(HIIT_TOMB_KEY, z.id);
  saveHIITRecords([...loadHIITRecords().filter(r => r.id !== z.id), z].sort((a, b) => a.date.localeCompare(b.date)));
}

export function removeRun(id: string) {
  pridejNahrobek(RUN_TOMB_KEY, id);
  saveRunRecords(loadRunRecords().filter(r => r.id !== id));
}
export function removeHIIT(id: string) {
  pridejNahrobek(HIIT_TOMB_KEY, id);
  saveHIITRecords(loadHIITRecords().filter(r => r.id !== id));
}

/* ---------------- převody času ---------------- */

/** „1:04:44" / „25:57" / „42" → sekundy. null když to nejde přečíst. */
export function naSekundy(t: string | undefined): number | null {
  if (!t) return null;
  const casti = t.trim().replace(',', '.').split(':').map(Number);
  if (casti.length === 0 || casti.some(n => !Number.isFinite(n) || n < 0)) return null;
  if (casti.length === 3) return Math.round(casti[0] * 3600 + casti[1] * 60 + casti[2]);
  if (casti.length === 2) return Math.round(casti[0] * 60 + casti[1]);
  return Math.round(casti[0] * 60); // samotné číslo = minuty
}

/** sekundy → „40:17" nebo „1:12:49". */
export function zSekund(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.round(s % 60);
  const p = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${p(m)}:${p(sec)}` : `${m}:${p(sec)}`;
}

/** Tempo z km a sekund → „6:17/km". */
export function tempo(km: number, sekundy: number): string | null {
  if (!(km > 0) || !(sekundy > 0)) return null;
  return `${zSekund(Math.round(sekundy / km))}/km`;
}
