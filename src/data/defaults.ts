import type {AppData, ConditioningActivity, ConditioningLog, SetLog, Workout, WorkoutExercise} from '../types';

const localIso = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const row = (exerciseId: string, sets: number, reps: string | undefined, seconds: string | undefined, rest: number): WorkoutExercise =>
  ({exerciseId, sets, reps, seconds, rest});

export const workouts: Workout[] = [
  {
    id: 'a', short: 'A', name: 'Spinta + Core', duration: '45–55 min', focus: 'Petto, spalle, tricipiti e core',
    exercises: [
      row('bike', 1, undefined, '300', 0),
      row('chest-press', 3, '10–12', undefined, 90),
      row('pec-deck', 3, '12–15', undefined, 75),
      row('shoulder-press', 3, '10–12', undefined, 90),
      row('lateral-raise', 2, '12–15', undefined, 60),
      row('triceps-pushdown', 3, '10–12', undefined, 75),
      row('crunch', 3, '12–20', undefined, 60),
      row('plank', 2, undefined, '30–45', 60),
    ],
  },
  {
    id: 'b', short: 'B', name: 'Trazione + Core', duration: '45–55 min', focus: 'Dorso, bicipiti, catena posteriore e core',
    exercises: [
      row('rower', 1, undefined, '300', 0),
      row('lat-machine', 3, '10–12', undefined, 90),
      row('seated-row', 3, '10–12', undefined, 90),
      row('pullover-cable', 2, '12–15', undefined, 75),
      row('reverse-pec-deck', 3, '12–15', undefined, 60),
      row('curl-cable', 3, '10–12', undefined, 75),
      row('bird-dog', 3, '8–10/lato', undefined, 60),
      row('dead-bug', 3, '8–10/lato', undefined, 45),
    ],
  },
  {
    id: 'c', short: 'C', name: 'Gambe + Richiamo Upper', duration: '50–60 min', focus: 'Gambe e richiamo completo della parte alta',
    exercises: [
      row('bike', 1, undefined, '300', 0),
      row('leg-press', 3, '10–12', undefined, 120),
      row('leg-curl', 3, '10–12', undefined, 90),
      row('leg-extension', 3, '10–12', undefined, 90),
      row('chest-press', 3, '10–12', undefined, 90),
      row('lat-machine', 3, '10–12', undefined, 90),
      row('shoulder-press', 2, '10–12', undefined, 90),
      row('seated-row', 2, '10–12', undefined, 90),
      row('triceps-pushdown', 2, '12–15', undefined, 60),
      row('curl-cable', 2, '12–15', undefined, 60),
      row('woodchopper', 2, '10–12/lato', undefined, 60),
    ],
  },
  {
    id: 'd', short: 'D', name: 'Conditioning / Cardio libero', duration: '35–50 min', focus: 'Resistenza e consumo energetico, senza corsa',
    exercises: [
      row('walk', 1, undefined, '300', 0),
      row('rower', 1, undefined, '600', 0),
      row('incline-walk', 1, undefined, '900–1200', 0),
      row('boxing', 1, undefined, '480–720', 0),
    ],
  },
];

export const conditioningActivities: ConditioningActivity[] = [
  'Camminata', 'Camminata inclinata', 'Vogatore', 'Cyclette', 'Boxe', 'Corda',
];

export function emptySet(): SetLog {
  return {done: false, weight: null, reps: null, seconds: null, rir: null, notes: ''};
}

export function emptyLogs(source: Workout | WorkoutExercise[]): Record<string, SetLog[]> {
  const rows = Array.isArray(source) ? source : source.exercises;
  return Object.fromEntries(rows.map(item => [item.exerciseId, Array.from({length: item.sets}, emptySet)]));
}

export function defaultConditioning(): ConditioningLog[] {
  const activity: ConditioningActivity[] = ['Camminata', 'Vogatore', 'Camminata inclinata', 'Boxe'];
  const minutes = [5, 10, 15, 10];
  return activity.map((name, index) => ({
    id: crypto.randomUUID(), activity: name, minutes: minutes[index], distance: null, calories: null,
    intensity: null, notes: index === 3 ? 'Consiglio: 1 min lavoro / 1 min recupero.' : '', done: false,
  }));
}

export function initialData(): AppData {
  const today = localIso();
  return {
    schemaVersion: 4,
    sessions: [],
    workouts,
    schedule: {},
    plannedDates: {},
    preferredSubstitutions: {},
    bodyRecords: [],
    activeSession: null,
    preferences: {theme: 'light', rest: 75, autoRest: true, unit: 'metrico', createdAt: today, programStartedAt: today},
  };
}
