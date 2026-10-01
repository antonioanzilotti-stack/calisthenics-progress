import type {ActiveSession, AppData, Exercise, Session, Workout, WorkoutExercise, WorkoutId} from '../types';
import {initialData, workouts} from '../data/defaults';

export const STORAGE_KEY = 'calisthenics-progress-gym-v8';
export const MIGRATION_KEY = 'calisthenics-progress-migration';
const PREVIOUS_KEYS = ['calisthenics-progress-gym-v7','calisthenics-progress-gym-v6','calisthenics-progress-gym-v5','calisthenics-progress-gym-v4','calisthenics-progress-gym-v3'];
const LEGACY_KEYS = ['calisthenics-progress','calisthenics-progress-v1','calisthenics-progress-v2'];

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const isWorkoutId = (value: unknown): value is WorkoutId => ['a','b','c','d','e'].includes(String(value));
const asNumber = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;

export function isCompatibleBackup(value: unknown) {
  return isObject(value) && [3,4,5,6,7,8].includes(Number(value.schemaVersion)) && Array.isArray(value.sessions)
    && Array.isArray(value.bodyRecords) && Array.isArray(value.workouts) && isObject(value.preferences);
}

function mappedWorkoutId(value: unknown, legacy: boolean, rawWorkout?: Workout): WorkoutId {
  if (legacy && value === 'd' && rawWorkout?.name.toLowerCase().includes('conditioning')) return 'e';
  return isWorkoutId(value) ? value : 'a';
}

function normalizePlans(value: unknown, legacy: boolean, rawWorkouts: Workout[]): AppData['plannedDates'] {
  if (!isObject(value)) return {};
  const plans: AppData['plannedDates'] = {};
  Object.entries(value).forEach(([date, selection]) => {
    if (selection === null || selection === 'riposo') plans[date] = 'riposo';
    else if (isWorkoutId(selection)) {
      const rawWorkout = rawWorkouts.find(workout => workout.id === selection);
      const mapped = mappedWorkoutId(selection, legacy, rawWorkout);
      plans[date] = mapped === 'd' ? 'c' : mapped;
    }
  });
  return plans;
}

function normalizeExerciseRows(rows: WorkoutExercise[], logs: Session['logs']): WorkoutExercise[] {
  return rows.map((item,index) => ({...item, instanceId:item.instanceId || (logs[item.exerciseId] ? item.exerciseId : `legacy-${item.exerciseId}-${index}`)}));
}

function normalizeSessions(raw: Record<string, unknown>, rawWorkouts: Workout[], legacy: boolean): Session[] {
  if (!Array.isArray(raw.sessions)) return [];
  return raw.sessions.filter(isObject).map((value,index) => {
    const rawSession = value as unknown as Session;
    const oldWorkout = rawWorkouts.find(workout => workout.id === rawSession.workoutId);
    const workoutId = mappedWorkoutId(rawSession.workoutId, legacy, oldWorkout);
    const currentWorkout = workouts.find(workout => workout.id === workoutId);
    const logs = isObject(rawSession.logs) ? rawSession.logs : {};
    const sourceRows = Array.isArray(rawSession.exercises) && rawSession.exercises.length
      ? rawSession.exercises : oldWorkout?.exercises || currentWorkout?.exercises || [];
    const date = typeof rawSession.date === 'string' ? rawSession.date : new Date().toISOString().slice(0,10);
    return {
      ...rawSession,
      id: typeof rawSession.id === 'string' && rawSession.id ? rawSession.id : `migrated-${date}-${index}-${crypto.randomUUID()}`,
      date,
      workoutId,
      workoutName: rawSession.workoutName || oldWorkout?.name || currentWorkout?.name || 'Allenamento storico',
      workoutShort: rawSession.workoutShort || oldWorkout?.short || currentWorkout?.short || workoutId.toUpperCase(),
      duration: asNumber(rawSession.duration,0),
      notes: typeof rawSession.notes === 'string' ? rawSession.notes : '',
      rpe: typeof rawSession.rpe === 'number' ? rawSession.rpe : null,
      logs: logs as Session['logs'],
      conditioning: Array.isArray(rawSession.conditioning) ? rawSession.conditioning : [],
      exercises: normalizeExerciseRows(sourceRows, logs as Session['logs']),
      startedAt: asNumber(rawSession.startedAt, new Date(`${date}T12:00:00`).getTime()),
      completedAt: asNumber(rawSession.completedAt, new Date(`${date}T13:00:00`).getTime()),
      records: Array.isArray(rawSession.records) ? rawSession.records : [],
    };
  });
}

function normalizeActive(raw: Record<string, unknown>, rawWorkouts: Workout[], legacy: boolean): ActiveSession | null {
  if (!isObject(raw.activeSession)) return null;
  const source = raw.activeSession as unknown as ActiveSession;
  const oldWorkout = rawWorkouts.find(workout => workout.id === source.workoutId);
  const mappedId = mappedWorkoutId(source.workoutId, legacy, oldWorkout);
  const workoutId = mappedId === 'd' ? 'c' : mappedId;
  const currentWorkout = workouts.find(workout => workout.id === workoutId);
  const logs = isObject(source.logs) ? source.logs : {};
  const rows = Array.isArray(source.exercises) && source.exercises.length ? source.exercises : oldWorkout?.exercises || currentWorkout?.exercises || [];
  return {...source,id:source.id || crypto.randomUUID(),workoutId,exercises:normalizeExerciseRows(rows,logs),logs,
    separatedSupersets:Array.isArray(source.separatedSupersets) ? source.separatedSupersets : [],
    conditioning:Array.isArray(source.conditioning)?source.conditioning:[],notes:source.notes || '',rpe:source.rpe ?? null};
}

function normalize(value: unknown): AppData {
  const fallback = initialData();
  if (!isObject(value)) return fallback;
  const version = Number(value.schemaVersion);
  const legacy = version < 5;
  const rawWorkouts = Array.isArray(value.workouts) ? value.workouts as Workout[] : [];
  const preferences = isObject(value.preferences) ? value.preferences as unknown as AppData['preferences'] : fallback.preferences;
  return {
    ...fallback,
    schemaVersion:8,
    workouts:version < 8 ? workouts : rawWorkouts.length ? rawWorkouts : workouts,
    sessions:normalizeSessions(value,rawWorkouts,legacy),
    bodyRecords:Array.isArray(value.bodyRecords) ? value.bodyRecords as AppData['bodyRecords'] : [],
    plannedDates:normalizePlans(value.plannedDates,legacy,rawWorkouts),
    preferredSubstitutions:isObject(value.preferredSubstitutions) ? value.preferredSubstitutions as Record<string,string> : {},
    customExercises:Array.isArray(value.customExercises) ? value.customExercises as Exercise[] : [],
    activeSession:normalizeActive(value,rawWorkouts,legacy),
    preferences:{...fallback.preferences,...preferences},
  };
}

export function normalizeBackup(value: unknown): AppData | null {
  return isCompatibleBackup(value) ? normalize(value) : null;
}

export function load(): AppData {
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (isCompatibleBackup(current)) return normalize(current);
    for (const key of PREVIOUS_KEYS) {
      const previous = JSON.parse(localStorage.getItem(key) || 'null');
      if (isCompatibleBackup(previous)) {
        const migrated = normalize(previous);
        localStorage.setItem(STORAGE_KEY,JSON.stringify(migrated));
        localStorage.setItem(MIGRATION_KEY,JSON.stringify({to:8,migratedAt:new Date().toISOString(),action:'upper-lower-upper-history-preserved'}));
        return migrated;
      }
    }
    const hadLegacyData = LEGACY_KEYS.some(key => localStorage.getItem(key) !== null);
    LEGACY_KEYS.forEach(key => localStorage.removeItem(key));
    localStorage.setItem(MIGRATION_KEY,JSON.stringify({to:8,migratedAt:new Date().toISOString(),action:hadLegacyData?'legacy-data-removed':'fresh-install'}));
    return fallbackAndSave();
  } catch { return initialData(); }
}

function fallbackAndSave() {
  const data = initialData(); localStorage.setItem(STORAGE_KEY,JSON.stringify(data)); return data;
}

export const save = (data: AppData) => localStorage.setItem(STORAGE_KEY,JSON.stringify(data));

export function download(name: string, text: string, type: string) {
  const link = document.createElement('a');
  const url = URL.createObjectURL(new Blob([text],{type}));
  link.href=url; link.download=name; link.hidden=true; document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}

const csv = (value: unknown) => `"${String(value ?? '').replace(/"/g,'""')}"`;
export function exportCsv(data: AppData) {
  const rows: unknown[][] = [['tipo','sessione_id','data_ora','scheda','stato','esercizio_attivita','serie','riscaldamento','peso_kg','ripetizioni','rir','minuti','distanza','calorie','intensita','volume','note']];
  data.sessions.forEach(session => {
    const exerciseByKey = Object.fromEntries((session.exercises || []).map(item => [item.instanceId || item.exerciseId,item.exerciseId]));
    Object.entries(session.logs).forEach(([key,sets]) => sets.forEach((set,index) => rows.push(['serie',session.id,new Date(session.startedAt || `${session.date}T12:00:00`).toISOString(),session.workoutName || session.workoutId.toUpperCase(),session.status,exerciseByKey[key] || key,index+1,set.warmup?'sì':'no',set.weight,set.reps,set.rir,'','','','',set.done&&set.weight!==null&&set.reps!==null?set.weight*set.reps:0,set.notes])));
    session.conditioning.forEach(item => rows.push(['conditioning',session.id,new Date(session.startedAt || `${session.date}T12:00:00`).toISOString(),session.workoutName || session.workoutId.toUpperCase(),session.status,item.activity,'','','','','',item.minutes,item.distance,item.calories,item.intensity,'',item.notes]));
  });
  data.bodyRecords.forEach(record => rows.push(['corpo','',record.date,'','','peso/misure','', '',record.weight,'','','','','','','',`vita:${record.waist??''};torace:${record.chest??''};braccio:${record.arm??''};coscia:${record.thigh??''}`]));
  return rows.map(row => row.map(csv).join(',')).join('\n');
}
