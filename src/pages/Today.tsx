import{useEffect,useMemo,useState}from'react';
import{CircleCheck,Pause,Play,RotateCcw,SkipForward,TrendingUp}from'lucide-react';
import{useApp}from'../hooks/useApp';
import{getExercise}from'../data/exercises';
import{getPlanDay}from'../utils/trainingPlan';
import ExerciseArt from'../components/ExerciseArt';
import ExerciseModal from'../components/ExerciseModal';
import type{Exercise,Session,SetLog,WorkoutExercise}from'../types';

const localIso=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const emptyLogs=(rows:WorkoutExercise[])=>Object.fromEntries(rows.map(x=>[x.exerciseId,Array.from({length:x.sets},()=>({done:false,reps:0,seconds:0}))]));

export default function Today(){
  const{data,setData}=useApp();const today=localIso();const plan=getPlanDay(today,data);const existing=data.sessions.find(s=>s.date===today);
  const scheduled=plan?.workoutId||data.schedule[new Date().getDay()]||'a';const[wid,setWid]=useState(existing?.workoutId||scheduled);const workout=data.workouts.find(w=>w.id===wid)!;
  const prescription=wid===plan?.workoutId?plan.exercises:workout.exercises;
  const[active,setActive]=useState(false);const[logs,setLogs]=useState<Record<string,SetLog[]>>(()=>existing?.logs||emptyLogs(prescription));const[detail,setDetail]=useState<Exercise>();const[rest,setRest]=useState(0);const[paused,setPaused]=useState(false);
  useEffect(()=>{if(!existing)setLogs(emptyLogs(prescription))},[wid]);
  useEffect(()=>{if(!rest||paused)return;const t=setTimeout(()=>setRest(v=>v-1),1000);if(rest===1&&navigator.vibrate)navigator.vibrate([180,80,180]);return()=>clearTimeout(t)},[rest,paused]);
  const progress=useMemo(()=>{const all=Object.values(logs).flat();const done=all.filter(x=>x.done).length;return{done,total:all.length,pct:Math.round(done/Math.max(1,all.length)*100)}},[logs]);
  const store=(status:Session['status'],reason?:string)=>{const session:Session={id:existing?.id||crypto.randomUUID(),date:today,workoutId:wid,status,duration:status==='saltato'?0:Math.max(1,Math.round(workout.duration*progress.pct/100)),notes:'',rpe:status==='completato'?7:0,reason,logs};setData(d=>({...d,sessions:[...d.sessions.filter(s=>s.date!==today),session]}));setActive(false)};
  const toggle=(id:string,i:number)=>setLogs(l=>({...l,[id]:l[id].map((x,n)=>n===i?{...x,done:!x.done}:x)}));
  return <>
    <header><span className="eyebrow">{new Intl.DateTimeFormat('it-IT',{weekday:'long',day:'numeric',month:'long'}).format(new Date())}</span><h1>{active?'Allenamento in corso':'Pronti a muoversi?'}</h1><p className="lede">Costanza, controllo, un passo alla volta.</p></header>
    {!active?<>
      {plan&&<section className={`phase-card card ${plan.mode}`}><TrendingUp/><div><span className="eyebrow">Settimana {plan.week} · {plan.phase}</span><h3>{plan.mode==='progredisci'?'Oggi puoi progredire':plan.mode==='consolida'?'Oggi consolidiamo':'Carico programmato'}</h3><p>{plan.reason}</p></div></section>}
      <section className="hero card"><div><span className="pill">{existing?.status||'Programmato'}</span><h2>Allenamento {workout.short}</h2><p>{workout.name}</p></div><strong>{workout.duration}<small> min</small></strong><div className="progress"><i style={{width:`${existing?100:0}%`}}/></div><button className="primary" onClick={()=>setActive(true)}><Play/> Inizia allenamento</button><button className="secondary" onClick={()=>{const reason=prompt('Motivo (tempo, stanchezza, dolore, lavoro, viaggio, dimenticato, altro):','mancanza di tempo');if(reason)store('saltato',reason)}}><SkipForward/> Segna come saltato</button></section>
      {data.preferences.barEnabled&&<button className="bar-option" onClick={()=>setWid(wid==='bar'?scheduled:'bar')}>▰ Oggi ho accesso alla sbarra <b>{wid==='bar'?'Attivo':'Sostituisci'}</b></button>}
      <section><div className="section-title"><h2>La sessione</h2><span>{prescription.length} esercizi</span></div>{prescription.map(x=>{const e=getExercise(x.exerciseId);return <article className="exercise-row" key={e.id}><ExerciseArt id={e.id} name={e.name}/><div><h3>{e.name}</h3><p>{x.sets} serie · {x.reps?`${x.reps} rip.`:`${x.seconds} sec.`}</p><button className="text-btn" onClick={()=>setDetail(e)}>Come si esegue</button></div></article>})}</section>
    </>:<>
      <section className="workout-head card"><div className="ring" style={{'--pct':`${progress.pct*3.6}deg`} as React.CSSProperties}><b>{progress.pct}%</b></div><div><h2>{workout.name}</h2><p>{progress.done} di {progress.total} serie completate</p></div></section>
      {rest>0&&<aside className="rest"><RotateCcw/><div><small>RECUPERO</small><b>{Math.floor(rest/60)}:{String(rest%60).padStart(2,'0')}</b></div><button className="icon" onClick={()=>setPaused(!paused)}>{paused?<Play/>:<Pause/>}</button></aside>}
      <div className="quick-rest">Recupero: {[30,60,90,120].map(n=><button onClick={()=>setRest(n)} key={n}>{n}s</button>)}</div>
      {prescription.map(x=>{const e=getExercise(x.exerciseId);return <article className="set-card card" key={e.id}><div className="set-title"><div><span className="eyebrow">{e.group}</span><h2>{e.name}</h2><p>{x.reps?`${x.reps} ripetizioni previste`:`${x.seconds} secondi previsti`}</p></div><button className="text-btn" onClick={()=>setDetail(e)}>Guida</button></div>{(logs[e.id]||[]).map((s,i)=><div className="set" key={i}><b>{i+1}</b><label><span className="sr-only">Valore serie {i+1}</span><input type="number" value={e.seconds?s.seconds:s.reps} onChange={ev=>setLogs(l=>({...l,[e.id]:l[e.id].map((v,n)=>n===i?{...v,[e.seconds?'seconds':'reps']:Number(ev.target.value)}:v)}))}/>{e.seconds?' sec':' rip.'}</label><button className={s.done?'done':'check'} onClick={()=>toggle(e.id,i)} aria-label="Completa serie"><CircleCheck/></button></div>)}<textarea placeholder="Note sull’esercizio" aria-label={`Note ${e.name}`}/></article>})}
      <div className="finish"><button className="primary" onClick={()=>store(progress.pct===100?'completato':'parziale')}>Termina allenamento</button><button className="secondary" onClick={()=>setActive(false)}>Pausa e torna più tardi</button></div>
    </>}
    {detail&&<ExerciseModal e={detail} onClose={()=>setDetail(undefined)}/>} 
  </>;
}
