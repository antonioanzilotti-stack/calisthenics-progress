import type {AppData, ConditioningActivity, ConditioningLog, SetLog, Workout, WorkoutExercise} from '../types';

const localIso = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const row = (exerciseId: string, sets: number, reps: string | undefined, seconds: string | undefined, rest: number): WorkoutExercise =>
  ({exerciseId, sets, reps, seconds, rest});

export const workouts: Workout[] = [
  {
    id:'a', short:'A', name:'Upper Body 1 · Spinta', duration:'50–60 min', focus:'Petto, spalle e tricipiti con tirate di equilibrio',
    exercises:[
      row('bike',1,undefined,'300',0),
      row('chest-press',3,'8–12',undefined,90),
      row('seated-row',3,'8–12',undefined,90),
      row('shoulder-press',3,'10–12',undefined,90),
      row('lat-machine',3,'10–12',undefined,90),
      row('lateral-cable',2,'12–15',undefined,60),
      row('triceps-pushdown',2,'10–15',undefined,60),
    ],
  },
  {
    id:'b', short:'B', name:'Lower Body + Core', duration:'50–60 min', focus:'Gambe complete, glutei, polpacci e stabilità',
    exercises:[
      row('bike',1,undefined,'300',0),
      row('leg-press',4,'8–12',undefined,120),
      row('seated-leg-curl',3,'10–12',undefined,90),
      row('leg-extension',3,'12–15',undefined,90),
      row('glute-drive-machine',3,'10–12',undefined,90),
      row('calf-machine',3,'12–15',undefined,75),
      row('front-plank',3,undefined,'30–45',60),
    ],
  },
  {
    id:'c', short:'C', name:'Upper Body 2 · Tirata', duration:'50–60 min', focus:'Dorso, bicipiti e deltoidi posteriori con richiamo del petto',
    exercises:[
      row('rower',1,undefined,'300',0),
      row('incline-chest-press',3,'8–12',undefined,90),
      row('iso-lateral-row-machine',3,'8–12',undefined,90),
      row('neutral-grip-pulldown',3,'10–12',undefined,90),
      row('converging-chest-press',3,'10–12',undefined,90),
      row('reverse-pec-deck',3,'12–15',undefined,60),
      row('curl-cable',2,'10–15',undefined,60),
    ],
  },
  {
    id:'e', short:'E', name:'Conditioning facoltativo', duration:'35–50 min', focus:'Condizionamento e capacità cardiovascolare, senza corsa',
    exercises:[row('walk',1,undefined,'300',0),row('rower',1,undefined,'600',0),row('incline-walk',1,undefined,'900–1200',0),row('boxing',1,undefined,'600–720',0)],
  },
];

export const conditioningActivities: ConditioningActivity[] = ['Camminata','Camminata inclinata','Vogatore','Boxe','Corda'];

export function emptySet(warmup = false): SetLog {
  return {done:false,weight:null,reps:null,seconds:null,rir:null,notes:'',warmup};
}

export function emptyLogs(source: Workout | WorkoutExercise[]): Record<string, SetLog[]> {
  const rows = Array.isArray(source) ? source : source.exercises;
  return Object.fromEntries(rows.map(item => [item.instanceId || item.exerciseId, Array.from({length:item.sets}, () => emptySet())]));
}

export function defaultConditioning(): ConditioningLog[] {
  const activity: ConditioningActivity[] = ['Camminata','Vogatore','Camminata inclinata','Boxe'];
  const minutes = [5,10,15,10];
  return activity.map((name,index) => ({id:crypto.randomUUID(),activity:name,minutes:minutes[index],distance:null,calories:null,intensity:null,
    notes:index===3?'Consiglio: 1 min lavoro / 1 min recupero per 5–6 round.':'',done:false}));
}

export function initialData(): AppData {
  const today = localIso();
  return {schemaVersion:8,sessions:[],workouts,schedule:{},plannedDates:{},preferredSubstitutions:{},customExercises:[],bodyRecords:[],activeSession:null,
    preferences:{theme:'light',rest:75,autoRest:true,unit:'metrico',createdAt:today,programStartedAt:today}};
}
