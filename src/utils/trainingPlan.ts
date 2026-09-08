import type {AppData, Session, Workout} from '../types';

export type ProgramPhase = 'Adattamento' | 'Progressione' | 'Consolidamento' | 'Mantenimento';

const parseDate = (value: string) => new Date(`${value}T12:00:00`);
const dayDiff = (a: string, b: string) => Math.floor((parseDate(a).getTime() - parseDate(b).getTime()) / 86400000);
export const localIso = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function getProgramInfo(data: AppData, date = localIso()) {
  const week = Math.max(1, Math.floor(dayDiff(date, data.preferences.programStartedAt) / 7) + 1);
  const phase: ProgramPhase = week <= 2 ? 'Adattamento' : week <= 4 ? 'Progressione' : week <= 6 ? 'Consolidamento' : 'Mantenimento';
  const rirTarget = week <= 2 ? '3' : week <= 4 ? '2' : week <= 6 ? '1–2' : '1–3';
  const objective = phase === 'Adattamento'
    ? 'Impara regolazioni e tecnica, mantenendo ampio margine.'
    : phase === 'Progressione'
      ? 'Completa il range e aumenta gradualmente solo quando sei pronto.'
      : phase === 'Consolidamento'
        ? 'Rendi stabili carichi, tecnica e costanza senza cercare il cedimento.'
        : 'Continua la doppia progressione ascoltando il recupero.';
  return {week, displayWeek: Math.min(week, 6), phase, rirTarget, objective};
}

export function getPlannedWorkoutId(date: string, data: AppData): Workout['id'] | undefined {
  if (Object.prototype.hasOwnProperty.call(data.plannedDates, date)) return data.plannedDates[date] || undefined;
  return data.schedule[parseDate(date).getDay()];
}

export function plannedStatus(date: string, data: AppData) {
  const session = data.sessions.find(item => item.date === date);
  if (session) return session.status === 'programmato' && date < localIso() ? 'saltato' : session.status;
  const workoutId = getPlannedWorkoutId(date, data);
  if (!workoutId || date < data.preferences.createdAt) return 'riposo';
  return date < localIso() ? 'saltato' : 'programmato';
}

export function sessionCompletion(session: Pick<Session, 'logs' | 'conditioning'>) {
  const sets = Object.values(session.logs).flat();
  const conditioning = session.conditioning || [];
  const total = sets.length + conditioning.length;
  const done = sets.filter(set => set.done).length + conditioning.filter(item => item.done).length;
  return {done, total, percent: total ? Math.round(done / total * 100) : 0};
}

export function repRangeMax(value?: string) {
  if (!value) return null;
  const numbers = value.match(/\d+/g)?.map(Number) || [];
  return numbers.length ? Math.max(...numbers) : null;
}

export function canProgress(session: Session, exerciseId: string, data: AppData) {
  const workoutExercise = data.workouts.find(workout => workout.id === session.workoutId)?.exercises.find(item => item.exerciseId === exerciseId);
  const max = repRangeMax(workoutExercise?.reps);
  const sets = session.logs[exerciseId] || [];
  return Boolean(max && sets.length && sets.every(set => set.done && set.reps !== null && set.reps >= max));
}

export function setVolume(weight: number | null, reps: number | null) {
  return weight !== null && reps !== null ? weight * reps : 0;
}

export function sessionVolume(session: Session) {
  return Object.values(session.logs).flat().reduce((sum, set) => sum + (set.done ? setVolume(set.weight, set.reps) : 0), 0);
}
