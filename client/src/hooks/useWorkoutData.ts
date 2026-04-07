// useWorkoutData – centrální hook pro správu tréninkových záznamů
// BUG FIX: editace záznamu nyní správně předává všechny parametry (date, sets, weight, reps, note)
// Data jsou persistována v localStorage, výchozí data z data.ts

import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_RECORDS, nanoid, type TrainingRecord, type RecordsMap } from '@/lib/data';

const STORAGE_KEY = 'gymdiary_records_v3';

function loadRecords(): RecordsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as RecordsMap;
      // Merge with defaults – add any new exercise keys that may have been added
      const merged: RecordsMap = { ...DEFAULT_RECORDS };
      for (const key of Object.keys(parsed)) {
        merged[key] = parsed[key];
      }
      return merged;
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_RECORDS };
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

  // Add a new record
  const addRecord = useCallback((
    exerciseId: string,
    date: string,
    sets: string,
    weight: string,
    reps: string,
    note: string,
  ) => {
    const newRecord: TrainingRecord = {
      id: nanoid(),
      date,
      sets,
      weight,
      reps,
      note,
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
  ) => {
    setRecords(prev => {
      const list = prev[exerciseId] ?? [];
      const updated = list.map(r =>
        r.id === recordId
          ? { ...r, date, sets, weight, reps, note }
          : r
      );
      // Re-sort by date after update so list stays chronological
      updated.sort((a, b) => a.date.localeCompare(b.date));
      return { ...prev, [exerciseId]: updated };
    });
  }, []);

  // Delete a record
  const deleteRecord = useCallback((exerciseId: string, recordId: string) => {
    setRecords(prev => ({
      ...prev,
      [exerciseId]: (prev[exerciseId] ?? []).filter(r => r.id !== recordId),
    }));
  }, []);

  // Get records for one exercise, sorted by date ascending
  const getRecords = useCallback((exerciseId: string): TrainingRecord[] => {
    const list = records[exerciseId] ?? [];
    return [...list].sort((a, b) => a.date.localeCompare(b.date));
  }, [records]);

  // Get latest record for an exercise
  const getLatestRecord = useCallback((exerciseId: string): TrainingRecord | null => {
    const list = getRecords(exerciseId);
    return list.length > 0 ? list[list.length - 1] : null;
  }, [getRecords]);

  return { records, addRecord, updateRecord, deleteRecord, getRecords, getLatestRecord };
}
