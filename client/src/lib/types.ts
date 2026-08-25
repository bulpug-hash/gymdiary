import type { useWorkoutData } from '@/hooks/useWorkoutData';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WorkoutDataHook = ReturnType<typeof useWorkoutData>;
export type Tab = 'overview' | 'plan' | 'guide' | 'diary' | 'progress' | 'tools';
