import type {AppData, ConditioningActivity, ConditioningLog, SetLog, Workout, WorkoutExercise} from '../types';

const localIso = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const row = (exerciseId: string, sets: number, reps: string | undefined, seconds: string | undefined, rest: number, superset?: string): WorkoutExercise =>
  ({exerciseId, sets, reps, seconds, rest, superset});

export const workouts: Workout[] = [
  {
    id:'a', short:'A', name:'Upper Body 1', duration:'55–65 min', focus:'Petto e schiena in equilibrio, spalle e braccia',
    exercises:[
      row('bike',1,undefined,'300',0), row('chest-press',3,'10–12',undefined,90,'Superserie opzionale 1'),
      row('seated-row',3,'10–12',undefined,90,'Superserie opzionale 1'), row('shoulder-press',3,'10–12',undefined,90,'Superserie opzionale 2'),
      row('lat-machine',3,'10–12',undefined,90,'Superserie opzionale 2'), row('lateral-cable',2,'12–15',undefined,60),
      row('pullover-cable',2,'12–15',undefined,75), row('triceps-pushdown',2,'10–12',undefined,75), row('curl-cable',2,'10–12',undefined,75),
    ],
  },
  {
    id:'b', short:'B', name:'Lower Body 1', duration:'45–55 min', focus:'Quadricipiti, femorali, adduttori e core',
    exercises:[
      row('bike',1,undefined,'300',0), row('leg-press',3,'10–12',undefined,120), row('leg-curl',3,'10–12',undefined,90),
      row('leg-extension',3,'12–15',undefined,90), row('walking-lunge',2,'10/gamba',undefined,90),
      row('adductor-machine',2,'12–15',undefined,75), row('front-plank',3,undefined,'30–45',60),
    ],
  },
  {
    id:'c', short:'C', name:'Upper Body 2', duration:'50–60 min', focus:'Dorso, petto alto, spalle posteriori e braccia',
    exercises:[
      row('rower',1,undefined,'300',0), row('lat-machine',3,'10–12',undefined,90), row('incline-chest-press',3,'10–12',undefined,90),
      row('seated-row',3,'10–12',undefined,90), row('shoulder-press',2,'10–12',undefined,90), row('reverse-pec-deck',3,'12–15',undefined,75),
      row('pullover-cable',2,'12–15',undefined,75), row('curl-cable',2,'10–12',undefined,75), row('overhead-triceps-cable',2,'10–12',undefined,75),
    ],
  },
  {
    id:'d', short:'D', name:'Lower Body 2', duration:'45–55 min', focus:'Gambe, anche e stabilità del core',
    exercises:[
      row('bike',1,undefined,'300',0), row('leg-press',3,'10–12',undefined,120), row('leg-curl',3,'10–12',undefined,90),
      row('leg-extension',2,'12–15',undefined,90), row('assisted-split-squat',2,'8–10/gamba',undefined,90),
      row('abductor-machine',2,'12–15',undefined,75), row('front-plank',3,undefined,'30',60), row('side-plank',2,undefined,'30/lato',60),
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
  return {schemaVersion:5,sessions:[],workouts,schedule:{},plannedDates:{},preferredSubstitutions:{},customExercises:[],bodyRecords:[],activeSession:null,
    preferences:{theme:'light',rest:75,autoRest:true,unit:'metrico',createdAt:today,programStartedAt:today}};
}
