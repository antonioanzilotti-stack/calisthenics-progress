import type {ActiveSession, AppData, Session, Workout, WorkoutExercise} from '../types';
import {initialData, workouts} from '../data/defaults';

export const STORAGE_KEY = 'calisthenics-progress-gym-v4';
export const MIGRATION_KEY = 'calisthenics-progress-migration';
const V3_STORAGE_KEY = 'calisthenics-progress-gym-v3';
const LEGACY_KEYS = ['calisthenics-progress', 'calisthenics-progress-v1', 'calisthenics-progress-v2'];

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const isWorkoutId = (value: unknown): value is Workout['id'] => ['a', 'b', 'c', 'd'].includes(String(value));

export function isCompatibleBackup(value: unknown) {
  return isObject(value) && [3, 4].includes(Number(value.schemaVersion)) && Array.isArray(value.sessions)
    && Array.isArray(value.bodyRecords) && Array.isArray(value.workouts) && isObject(value.preferences);
}

function normalizePlans(value: unknown): AppData['plannedDates'] {
  if (!isObject(value)) return {};
  const plans: AppData['plannedDates'] = {};
  Object.entries(value).forEach(([date, selection]) => {
    if (isWorkoutId(selection)) plans[date] = selection;
    else if (selection === null || selection === 'riposo') plans[date] = 'riposo';
  });
  return plans;
}

function normalizeActive(raw: Record<string, unknown>, rawWorkouts: Workout[]): ActiveSession | null {
  if (!isObject(raw.activeSession) || !isWorkoutId(raw.activeSession.workoutId)) return null;
  const active = raw.activeSession as unknown as Omit<ActiveSession, 'exercises'> & {exercises?: WorkoutExercise[]};
  const previousWorkout = rawWorkouts.find(workout => workout.id === active.workoutId);
  const currentWorkout = workouts.find(workout => workout.id === active.workoutId);
  const exercises = Array.isArray(active.exercises) ? active.exercises : previousWorkout?.exercises || currentWorkout?.exercises || [];
  return {...active, exercises};
}

function normalize(value: unknown): AppData {
  const fallback = initialData();
  if (!isObject(value)) return fallback;
  const rawWorkouts = Array.isArray(value.workouts) ? value.workouts as Workout[] : [];
  const preferences = isObject(value.preferences) ? value.preferences as unknown as AppData['preferences'] : fallback.preferences;
  return {
    ...fallback,
    schemaVersion: 4,
    workouts,
    schedule: {},
    sessions: Array.isArray(value.sessions) ? value.sessions as Session[] : [],
    bodyRecords: Array.isArray(value.bodyRecords) ? value.bodyRecords as AppData['bodyRecords'] : [],
    plannedDates: normalizePlans(value.plannedDates),
    preferredSubstitutions: isObject(value.preferredSubstitutions) ? value.preferredSubstitutions as Record<string, string> : {},
    activeSession: normalizeActive(value, rawWorkouts),
    preferences: {...fallback.preferences, ...preferences},
  };
}

export function normalizeBackup(value: unknown): AppData | null {
  return isCompatibleBackup(value) ? normalize(value) : null;
}

export function load(): AppData {
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (isCompatibleBackup(current)) return normalize(current);

    const previous = JSON.parse(localStorage.getItem(V3_STORAGE_KEY) || 'null');
    if (isCompatibleBackup(previous)) {
      const migrated = normalize(previous);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      localStorage.setItem(MIGRATION_KEY, JSON.stringify({to: 4, migratedAt: new Date().toISOString(), action: 'gym-v3-preserved'}));
      return migrated;
    }

    const hadLegacyData = LEGACY_KEYS.some(key => localStorage.getItem(key) !== null);
    LEGACY_KEYS.forEach(key => localStorage.removeItem(key));
    localStorage.setItem(MIGRATION_KEY, JSON.stringify({to: 4, migratedAt: new Date().toISOString(), action: hadLegacyData ? 'legacy-data-removed' : 'fresh-install'}));
    return initialData();
  } catch {
    return initialData();
  }
}

export const save = (data: AppData) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

export function download(name: string, text: string, type: string) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([text], {type}));
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}

const csv = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export function exportCsv(data: AppData) {
  const rows: unknown[][] = [['tipo','data','sessione','stato','esercizio_attivita','serie','peso_kg','ripetizioni','rir','minuti','distanza','calorie','intensita','volume','note']];
  data.sessions.forEach(session => {
    Object.entries(session.logs).forEach(([exerciseId, sets]) => sets.forEach((set, index) => rows.push([
      'serie', session.date, session.workoutId.toUpperCase(), session.status, exerciseId, index + 1, set.weight, set.reps,
      set.rir, '', '', '', '', set.done && set.weight !== null && set.reps !== null ? set.weight * set.reps : 0, set.notes,
    ])));
    session.conditioning.forEach(item => rows.push([
      'conditioning', session.date, session.workoutId.toUpperCase(), session.status, item.activity, '', '', '', '',
      item.minutes, item.distance, item.calories, item.intensity, '', item.notes,
    ]));
  });
  data.bodyRecords.forEach(record => rows.push([
    'corpo', record.date, '', '', 'peso/misure', '', record.weight, '', '', '', '', '', '', '',
    `vita:${record.waist ?? ''};torace:${record.chest ?? ''};braccio:${record.arm ?? ''};coscia:${record.thigh ?? ''}`,
  ]));
  return rows.map(row => row.map(csv).join(',')).join('\n');
}
