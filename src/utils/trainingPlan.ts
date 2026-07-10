import type{AppData,Session,WorkoutExercise}from'../types';

export const PLAN_START='2026-07-06';
export const PLAN_END='2026-09-30';

export type PlanPhase='Fondamenta'|'Costruzione'|'Progressione'|'Scarico';
export type AdaptiveMode='progredisci'|'mantieni'|'consolida';
export type PlannedExercise=WorkoutExercise&{guidance:string};
export type PlanDay={date:string;week:number;phase:PlanPhase;cycle:number;workoutId:string;mode:AdaptiveMode;reason:string;exercises:PlannedExercise[]};

const parseDate=(value:string)=>new Date(`${value}T12:00:00`);
const dayDiff=(a:string,b:string)=>Math.floor((parseDate(a).getTime()-parseDate(b).getTime())/86400000);
const completion=(s:Session)=>{const sets=Object.values(s.logs).flat();return sets.length?sets.filter(x=>x.done).length/sets.length:0};

function adaptiveMode(workoutId:string,sessions:Session[],date:string):{mode:AdaptiveMode;reason:string;delta:number}{
  const recent=sessions.filter(s=>s.workoutId===workoutId&&s.date<date&&s.status!=='saltato').sort((a,b)=>b.date.localeCompare(a.date)).slice(0,2);
  if(!recent.length)return{mode:'mantieni',reason:'Prima esposizione: cura tecnica e controllo.',delta:0};
  if(recent.some(s=>s.status==='parziale'||s.rpe>=9||completion(s)<.7))return{mode:'consolida',reason:'Volume mantenuto: l’ultima sessione è stata impegnativa o parziale.',delta:-1};
  if(recent.length===2&&recent.every(s=>['completato','recuperato'].includes(s.status)&&s.rpe>0&&s.rpe<=7&&completion(s)>=.9))return{mode:'progredisci',reason:'Due sessioni solide: piccolo aumento sostenibile.',delta:1};
  return{mode:'mantieni',reason:'Consolida il volume prima del prossimo aumento.',delta:0};
}

function changeNumbers(value:string|undefined,delta:number,unit:'ripetizioni'|'secondi'){
  if(!value)return undefined;
  return value.replace(/\d+/g,n=>String(Math.max(1,Number(n)+(unit==='secondi'?delta*5:delta))));
}

export function getPlanDay(date:string,data:AppData):PlanDay|undefined{
  if(date<PLAN_START||date>PLAN_END)return undefined;
  const d=parseDate(date);const workoutId=data.schedule[d.getDay()];if(!workoutId)return undefined;
  const week=Math.floor(dayDiff(date,PLAN_START)/7)+1;const slot=(week-1)%4;const cycle=Math.floor((week-1)/4)+1;
  const phase:PlanPhase=(['Fondamenta','Costruzione','Progressione','Scarico']as PlanPhase[])[slot];
  const adaptive=adaptiveMode(workoutId,data.sessions,date);const phaseDelta=slot===1?1:slot===2?2:0;const cycleDelta=cycle-1;
  const delta=slot===3?0:Math.max(0,phaseDelta+cycleDelta+adaptive.delta);
  const workout=data.workouts.find(w=>w.id===workoutId);if(!workout)return undefined;
  const exercises=workout.exercises.map(e=>{const sets=slot===3?Math.max(1,e.sets-1):e.sets;const reps=changeNumbers(e.reps,delta,'ripetizioni');const seconds=changeNumbers(e.seconds,delta,'secondi');const guidance=slot===3?'Riduci il volume e mantieni una tecnica pulita.':delta>0?`Aumento graduale: +${delta} rip. oppure +${delta*5} sec. rispetto alla base.`:'Completa il volume base lasciando 2 ripetizioni di margine.';return{...e,sets,reps,seconds,guidance}});
  return{date,week,phase,cycle,workoutId,mode:adaptive.mode,reason:adaptive.reason,exercises};
}

export function plannedStatus(date:string,data:AppData){
  const session=data.sessions.find(s=>s.date===date);if(session)return session.status;
  const plan=getPlanDay(date,data);if(!plan)return'riposo';
  const today=new Date().toISOString().slice(0,10);const startedAt=data.preferences.createdAt||today;if(date<startedAt)return'riposo';return date<today?'saltato':'programmato';
}

export function planSummary(data:AppData){
  let sessions=0,deloads=0;for(let d=parseDate(PLAN_START);d<=parseDate(PLAN_END);d.setDate(d.getDate()+1)){const date=d.toISOString().slice(0,10);const p=getPlanDay(date,data);if(p){sessions++;if(p.phase==='Scarico')deloads++}}
  return{sessions,deloads,weeks:Math.ceil((dayDiff(PLAN_END,PLAN_START)+1)/7)};
}
