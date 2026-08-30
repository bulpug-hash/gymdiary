// useWorkoutData – centrální hook pro správu tréninkových záznamů
// BUG FIX: editace záznamu nyní správně předává všechny parametry (date, sets, weight, reps, note)
// Data jsou persistována v localStorage, výchozí data z data.ts

import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_RECORDS, PLANNED_RECORDS, nanoid, type TrainingRecord, type RecordsMap } from '@/lib/data';
import { RECOVERED_WORKOUT_RECORDS } from '@/lib/recoveryData';
import { maybeAutoBackup } from '@/lib/backup';

const STORAGE_KEY = 'gymdiary_records_v3';
// Náhrobky smazaných záznamů. Bez nich se smazaný předepsaný (plan-*) nebo
// obnovený (recovered-*) záznam po reloadu vždy vrátí, protože loadRecords
// je pokaždé znovu mergne z data.ts / recoveryData.ts.
const TOMBSTONE_KEY = 'gymdiary_deleted_v1';

function tombKey(exerciseId: string, recordId: string) {
  return `${exerciseId}::${recordId}`;
}

function loadTombstones(): Set<string> {
  try {
    const raw = localStorage.getItem(TOMBSTONE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveTombstones(set: Set<string>) {
  try {
    localStorage.setItem(TOMBSTONE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    /* kvóta – náhrobky nejsou kritické */
  }
}

function addTombstone(exerciseId: string, recordId: string) {
  const set = loadTombstones();
  set.add(tombKey(exerciseId, recordId));
  saveTombstones(set);
}

function removeTombstone(exerciseId: string, recordId: string) {
  const set = loadTombstones();
  set.delete(tombKey(exerciseId, recordId));
  saveTombstones(set);
}

function mergeUniqueRecords(base: RecordsMap, additions: RecordsMap): RecordsMap {
  const merged: RecordsMap = { ...base };
  for (const [exerciseId, recovered] of Object.entries(additions)) {
    const existing = merged[exerciseId] ?? [];
    const existingIds = new Set(existing.map((record) => record.id));
    merged[exerciseId] = [
      ...existing,
      ...recovered.filter((record) => !existingIds.has(record.id)),
    ].sort((a, b) => a.date.localeCompare(b.date));
  }
  return merged;
}

function loadRecords(): RecordsMap {
  let merged: RecordsMap = { ...DEFAULT_RECORDS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as RecordsMap;
      // Merge with defaults – add any new exercise keys that may have been added
      for (const key of Object.keys(parsed)) {
        merged[key] = parsed[key];
      }
    }
  } catch {
    // ignore
  }
  merged = mergeUniqueRecords(merged, RECOVERED_WORKOUT_RECORDS);
  // Předvyplněný plán se vždy synchronizuje s data.ts: neupravené záznamy
  // (planned: true) se zahodí a nahradí aktuální verzí, takže se projeví
  // i posun termínů plánu. Cokoli uživatel zapsal (planned: false) zůstává.
  for (const key of Object.keys(merged)) {
    merged[key] = (merged[key] ?? []).filter(r => !(r.planned === true && r.id.startsWith('plan-')));
  }
  // Předvyplněný plán – přidá se jen to, co uživatel ještě nemá (podle id)
  const withPlan = mergeUniqueRecords(merged, PLANNED_RECORDS);

  // Náhrobky se aplikují až úplně nakonec, po obou mergích – jinak by je
  // znovu vzkřísilo přidání z data.ts.
  const tombs = loadTombstones();
  if (tombs.size > 0) {
    for (const key of Object.keys(withPlan)) {
      withPlan[key] = (withPlan[key] ?? []).filter(r => !tombs.has(tombKey(key, r.id)));
    }
  }
  return withPlan;
}

function saveRecords(records: RecordsMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // ignore
  }
}

export function useWorkoutData() {
  const [records, setRecords] = useState<RecordsMap>(loadRecords);

  // Persist on every change
  useEffect(() => {
    saveRecords(records);
  }, [records]);

  // Tichá záloha nejvýš jednou denně – pojistka proti vyčištění dat prohlížeče.
  useEffect(() => {
    maybeAutoBackup(records);
    // Záměrně jen při prvním připojení; častěji to nemá smysl.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add a new record
  const addRecord = useCallback((
    exerciseId: string,
    date: string,
    sets: string,
    weight: string,
    reps: string,
    note: string,
    rpe?: string,
  ) => {
    const newRecord: TrainingRecord = {
      id: nanoid(),
      date,
      sets,
      weight,
      reps,
      note,
      ...(rpe ? { rpe } : {}),
    };
    setRecords(prev => ({
      ...prev,
      [exerciseId]: [...(prev[exerciseId] ?? []), newRecord],
    }));
  }, []);

  // Update existing record – BUG FIX: all 5 fields are correctly updated
  const updateRecord = useCallback((
    exerciseId: string,
    recordId: string,
    date: string,
    sets: string,
    weight: string,
    reps: string,
    note: string,
    rpe?: string,
  ) => {
    setRecords(prev => {
      const list = prev[exerciseId] ?? [];
      const updated = list.map(r =>
        r.id === recordId
          // rpe se nepředává vždy (např. hromadná editace v Deníku), takže
          // undefined nechá původní hodnotu být.
          ? { ...r, date, sets, weight, reps, note, planned: false, ...(rpe !== undefined ? { rpe } : {}) }
          : r
      );
      // Re-sort by date after update so list stays chronological
      updated.sort((a, b) => a.date.localeCompare(b.date));
      return { ...prev, [exerciseId]: updated };
    });
  }, []);

  // Delete a record. Vraci smazany zaznam, aby slo nabidnout "vratit zpet".
  const deleteRecord = useCallback((exerciseId: string, recordId: string): TrainingRecord | null => {
    let removed: TrainingRecord | null = null;
    setRecords(prev => {
      const list = prev[exerciseId] ?? [];
      removed = list.find(r => r.id === recordId) ?? null;
      return { ...prev, [exerciseId]: list.filter(r => r.id !== recordId) };
    });
    addTombstone(exerciseId, recordId);
    return removed;
  }, []);

  // Vrati zpet smazany zaznam (undo). Zachova puvodni id i priznak planned.
  const restoreRecord = useCallback((exerciseId: string, record: TrainingRecord) => {
    removeTombstone(exerciseId, record.id);
    setRecords(prev => {
      const list = prev[exerciseId] ?? [];
      if (list.some(r => r.id === record.id)) return prev;
      const updated = [...list, record].sort((a, b) => a.date.localeCompare(b.date));
      return { ...prev, [exerciseId]: updated };
    });
  }, []);

  // Odskrtnuti serie zpet na "predepsano" – vrati radek do puvodniho stavu z planu.
  const resetToPlanned = useCallback((exerciseId: string, recordId: string) => {
    const source = (PLANNED_RECORDS[exerciseId] ?? []).find(r => r.id === recordId);
    if (!source) return;
    setRecords(prev => {
      const list = prev[exerciseId] ?? [];
      const updated = list.map(r => (r.id === recordId ? { ...source } : r));
      updated.sort((a, b) => a.date.localeCompare(b.date));
      return { ...prev, [exerciseId]: updated };
    });
  }, []);

  // Get records for one exercise, sorted by date ascending
  const getRecords = useCallback((exerciseId: string): TrainingRecord[] => {
    const list = records[exerciseId] ?? [];
    return [...list].sort((a, b) => a.date.localeCompare(b.date));
  }, [records]);

  // Get latest record for an exercise
  const getLatestRecord = useCallback((exerciseId: string): TrainingRecord | null => {
    const list = getRecords(exerciseId).filter(r => !r.planned);
    return list.length > 0 ? list[list.length - 1] : null;
  }, [getRecords]);

  // Get all-time PR (max weight) for an exercise
  const getAllTimePR = useCallback((exerciseId: string): number => {
    const list = getRecords(exerciseId).filter(r => !r.planned);
    if (list.length === 0) return 0;
    return Math.max(...list.map(r => parseFloat(r.weight) || 0));
  }, [getRecords]);

  // Check if a given weight is a new all-time PR for an exercise
  // (considering only records BEFORE the given recordId)
  const isNewPR = useCallback((exerciseId: string, recordId: string, weight: number): boolean => {
    const list = getRecords(exerciseId);
    const idx = list.findIndex(r => r.id === recordId);
    if (idx <= 0) return false; // first record can't be a PR
    const prevMax = Math.max(...list.slice(0, idx).map(r => parseFloat(r.weight) || 0));
    return weight > prevMax;
  }, [getRecords]);

  // Get weekly volume (total kg × reps) for all exercises in a given ISO week
  const getWeeklyVolume = useCallback((weekStartDate: string): number => {
    const start = new Date(weekStartDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    let total = 0;
    for (const exerciseId of Object.keys(records)) {
      const list = records[exerciseId] ?? [];
      for (const r of list) {
        // Predepsane serie se do odtrenovaneho objemu nepocitaji - jinak graf
        // ukazuje tisice kg driv, nez uzivatel vejde do posilovny.
        if (r.planned) continue;
        const d = new Date(r.date);
        if (d >= start && d <= end) {
          total += (parseFloat(r.weight) || 0) * (parseInt(r.reps as string) || 0) * (parseInt(r.sets as string) || 1);
        }
      }
    }
    return Math.round(total);
  }, [records]);

  return { records, addRecord, updateRecord, deleteRecord, restoreRecord, resetToPlanned, getRecords, getLatestRecord, getAllTimePR, isNewPR, getWeeklyVolume };
}
