import type {AppData, Session, SetLog, Workout, WorkoutExercise, WorkoutId} from '../types';

export type ProgramPhase = 'Adattamento'|'Progressione'|'Consolidamento'|'Scarico';
const strengthSequence: WorkoutId[] = ['a','b','c'];
const parseDate = (value:string) => new Date(`${value}T12:00:00`);
const dayDiff = (a:string,b:string) => Math.floor((parseDate(a).getTime()-parseDate(b).getTime())/86400000);
export const localIso = (date=new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const isCompleted = (status:Session['status']) => ['completato','recuperato'].includes(status);
export const isRecordedTraining = (status:Session['status']) => ['completato','recuperato','parziale'].includes(status);

export function getSuggestedWorkoutId(data:AppData): WorkoutId {
  const lastStrength = [...data.sessions].filter(session => isCompleted(session.status) && strengthSequence.includes(session.workoutId))
    .sort((a,b)=>(b.completedAt || 0)-(a.completedAt || 0) || b.date.localeCompare(a.date))[0];
  if (!lastStrength) return 'a';
  return strengthSequence[(strengthSequence.indexOf(lastStrength.workoutId)+1)%strengthSequence.length] || 'a';
}

export function getProgramInfo(data:AppData,date=localIso()) {
  const firstTraining=[...data.sessions].filter(session=>isRecordedTraining(session.status)).sort((a,b)=>a.date.localeCompare(b.date))[0];
  const startedAt=firstTraining?.date || date; const week=Math.max(1,Math.floor(dayDiff(date,startedAt)/7)+1); const cycleWeek=((week-1)%6)+1;
  const phase:ProgramPhase=week<=2?'Adattamento':cycleWeek===6?'Scarico':cycleWeek<=3?'Progressione':'Consolidamento';
  const rirTarget=phase==='Adattamento'?'3':phase==='Scarico'?'3–4':phase==='Progressione'?'2':'1–2';
  const objective=phase==='Adattamento'?'Impara tecnica e regolazioni mantenendo un ampio margine.':phase==='Progressione'?'Completa il range: con almeno 2 RIR valuta un aumento del 2,5–5%.':phase==='Consolidamento'?'Rendi stabili carichi e tecnica senza cercare il cedimento.':'Settimana leggera: riduci una serie per esercizio oppure il carico del 10–15%.';
  return {week,displayWeek:cycleWeek,phase,rirTarget,objective,startedAt:firstTraining?.date || null};
}

export const logKey = (item:WorkoutExercise) => item.instanceId || item.exerciseId;
export function sessionExerciseId(session:Pick<Session,'exercises'>,key:string) {
  return session.exercises?.find(item=>logKey(item)===key)?.exerciseId || key;
}
export function exerciseSets(session:Pick<Session,'exercises'|'logs'>,exerciseId:string):SetLog[] {
  const keys=(session.exercises || []).filter(item=>item.exerciseId===exerciseId).map(logKey);
  return (keys.length?keys:[exerciseId]).flatMap(key=>session.logs[key] || []);
}

export function sessionCompletion(session:Pick<Session,'logs'|'conditioning'>) {
  const sets=Object.values(session.logs).flat(); const conditioning=session.conditioning || []; const total=sets.length+conditioning.length;
  const done=sets.filter(set=>set.done).length+conditioning.filter(item=>item.done).length;
  return {done,total,percent:total?Math.round(done/total*100):0};
}
export function repRangeMax(value?:string) {const numbers=value?.match(/\d+/g)?.map(Number) || [];return numbers.length?Math.max(...numbers):null;}
export function canProgress(session:Session,exerciseId:string,data:AppData) {
  const workoutExercise=session.exercises?.find(item=>item.exerciseId===exerciseId) || data.workouts.find(workout=>workout.id===session.workoutId)?.exercises.find(item=>item.exerciseId===exerciseId);
  const max=repRangeMax(workoutExercise?.reps); const sets=exerciseSets(session,exerciseId).filter(set=>!set.warmup);
  return Boolean(max&&sets.length&&sets.every(set=>set.done&&set.reps!==null&&set.reps>=max&&set.rir!==null&&set.rir>=2));
}
export const setVolume=(weight:number|null,reps:number|null)=>weight!==null&&reps!==null?weight*reps:0;
export const sessionVolume=(session:Session)=>Object.values(session.logs).flat().reduce((sum,set)=>sum+(set.done&&!set.warmup?setVolume(set.weight,set.reps):0),0);

const secondsMax=(value?:string) => Math.max(...(value?.match(/\d+/g)?.map(Number) || [0]));
export function estimateWorkoutDuration(workout:Workout) {
  let low=0,high=0;
  workout.exercises.forEach(item=>{
    if (item.seconds) {const seconds=secondsMax(item.seconds); low+=seconds; high+=seconds;}
    else {low+=item.sets*35+Math.max(0,item.sets-1)*item.rest;high+=item.sets*50+Math.max(0,item.sets-1)*item.rest;}
    low+=35;high+=70;
  });
  const round=(seconds:number)=>Math.max(5,Math.round(seconds/300)*5);
  return `${round(low)}–${round(high)} min`;
}
