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

  // Get all-time PR (max weight) for an exercise
  const getAllTimePR = useCallback((exerciseId: string): number => {
    const list = getRecords(exerciseId);
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
        const d = new Date(r.date);
        if (d >= start && d <= end) {
          total += (parseFloat(r.weight) || 0) * (parseInt(r.reps as string) || 0) * (parseInt(r.sets as string) || 1);
        }
      }
    }
    return Math.round(total);
  }, [records]);

  return { records, addRecord, updateRecord, deleteRecord, getRecords, getLatestRecord, getAllTimePR, isNewPR, getWeeklyVolume };
}
