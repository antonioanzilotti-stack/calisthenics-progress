export type Status = 'programmato' | 'completato' | 'saltato' | 'parziale' | 'recuperato' | 'riposo';
export type CalendarStatus = 'suggerito' | 'selezionato' | 'in-corso' | 'completato' | 'parziale' | 'saltato' | 'riposo' | 'neutro';
export type WorkoutId = 'a' | 'b' | 'c' | 'd' | 'e';

export type SetLog = {
  done: boolean;
  weight: number | null;
  reps: number | null;
  seconds: number | null;
  rir: number | null;
  notes: string;
  warmup?: boolean;
};

export type ConditioningActivity =
  | 'Camminata'
  | 'Camminata inclinata'
  | 'Vogatore'
  | 'Cyclette'
  | 'Ellittica'
  | 'Stair Climber'
  | 'Boxe'
  | 'Corda';

export type ConditioningLog = {
  id: string;
  activity: ConditioningActivity;
  minutes: number | null;
  distance: number | null;
  calories: number | null;
  intensity: number | null;
  notes: string;
  done: boolean;
};

export type ExerciseKind = 'strength' | 'timed' | 'warmup' | 'conditioning';

export type Exercise = {
  id: string;
  name: string;
  group: string;
  level: string;
  equipment: string;
  kind: ExerciseKind;
  loaded: boolean;
  steps: string[];
  startPosition: string;
  endPosition: string;
  breathing: string;
  mistakes: string;
  muscles: string;
  machineSetup: string;
  safety: string;
  sets: number;
  reps?: string;
  seconds?: string;
  rest: number;
  visualVerified?: boolean;
  imageDataUrl?: string;
  custom?: boolean;
};

export type WorkoutExercise = {
  exerciseId: string;
  instanceId?: string;
  baseExerciseId?: string;
  sets: number;
  reps?: string;
  seconds?: string;
  rest: number;
  superset?: string;
};

export type Workout = {
  id: WorkoutId;
  name: string;
  short: string;
  duration: string;
  focus: string;
  exercises: WorkoutExercise[];
};

export type Session = {
  id: string;
  date: string;
  workoutId: Workout['id'];
  status: Status;
  duration: number;
  notes: string;
  rpe: number | null;
  reason?: string;
  recoveredFrom?: string;
  startedAt?: number;
  completedAt?: number;
  workoutName?: string;
  workoutShort?: string;
  records?: string[];
  logs: Record<string, SetLog[]>;
  conditioning: ConditioningLog[];
  exercises?: WorkoutExercise[];
};

export type ActiveSession = {
  id: string;
  date: string;
  workoutId: Workout['id'];
  startedAt: number;
  pausedAt: number | null;
  pausedMs: number;
  logs: Record<string, SetLog[]>;
  conditioning: ConditioningLog[];
  exercises: WorkoutExercise[];
  notes: string;
  rpe: number | null;
};

export type BodyRecord = {
  id: string;
  date: string;
  weight: number | null;
  waist: number | null;
  chest: number | null;
  arm: number | null;
  thigh: number | null;
};

export type Preferences = {
  theme: 'light' | 'dark';
  rest: number;
  autoRest: boolean;
  unit: 'metrico' | 'imperiale';
  createdAt: string;
  programStartedAt: string;
};

export type AppData = {
  schemaVersion: 5;
  sessions: Session[];
  workouts: Workout[];
  schedule: Partial<Record<number, Workout['id']>>;
  plannedDates: Record<string, Workout['id'] | 'riposo'>;
  preferredSubstitutions: Record<string, string>;
  customExercises: Exercise[];
  bodyRecords: BodyRecord[];
  activeSession: ActiveSession | null;
  preferences: Preferences;
};
