import type {AppData} from '../types';
import {initialData, workouts} from '../data/defaults';

export const STORAGE_KEY = 'calisthenics-progress-gym-v3';
export const MIGRATION_KEY = 'calisthenics-progress-migration';
const LEGACY_KEYS = ['calisthenics-progress', 'calisthenics-progress-v1', 'calisthenics-progress-v2'];

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

export function isCompatibleBackup(value: unknown): value is AppData {
  return isObject(value) && value.schemaVersion === 3 && Array.isArray(value.sessions) && Array.isArray(value.bodyRecords)
    && Array.isArray(value.workouts) && isObject(value.preferences);
}

function normalize(data: AppData): AppData {
  const fallback = initialData();
  return {
    ...fallback,
    ...data,
    schemaVersion: 3,
    workouts,
    sessions: Array.isArray(data.sessions) ? data.sessions : [],
    bodyRecords: Array.isArray(data.bodyRecords) ? data.bodyRecords : [],
    plannedDates: isObject(data.plannedDates) ? data.plannedDates : {},
    schedule: isObject(data.schedule) ? data.schedule : fallback.schedule,
    activeSession: data.activeSession || null,
    preferences: {...fallback.preferences, ...data.preferences},
  };
}

export function load(): AppData {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (isCompatibleBackup(parsed)) return normalize(parsed);
    const hadLegacyData = LEGACY_KEYS.some(key => localStorage.getItem(key) !== null);
    LEGACY_KEYS.forEach(key => localStorage.removeItem(key));
    localStorage.setItem(MIGRATION_KEY, JSON.stringify({to: 3, migratedAt: new Date().toISOString(), action: hadLegacyData ? 'legacy-data-removed' : 'fresh-install'}));
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
