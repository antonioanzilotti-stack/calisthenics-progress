import{useState}from'react';
import{ChevronLeft,ChevronRight,TrendingUp}from'lucide-react';
import{useApp}from'../hooks/useApp';
import{getExercise}from'../data/exercises';
import{getPlanDay,plannedStatus,planSummary,PLAN_END,PLAN_START}from'../utils/trainingPlan';

const iso=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;

export default function Calendar(){
  const{data}=useApp();
  const[month,setMonth]=useState(new Date());
  const[selected,setSelected]=useState(iso(new Date()));
  const y=month.getFullYear(),m=month.getMonth(),first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
  const cells=[...Array((first+6)%7).fill(null),...Array.from({length:days},(_,i)=>i+1)];
  const key=(d:number)=>`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const sel=data.sessions.find(s=>s.date===selected);const plan=getPlanDay(selected,data);const workout=data.workouts.find(w=>w.id===(sel?.workoutId||plan?.workoutId));const summary=planSummary(data);
  const canPrev=new Date(y,m-1,1)>=new Date(2026,6,1);const canNext=new Date(y,m+1,1)<=new Date(2026,8,1);
  return <>
    <header><span className="eyebrow">Pianificazione adattiva</span><h1>Calendario</h1><p className="lede">Programma completo dal 6 luglio al 30 settembre.</p></header>
    <section className="plan-banner card"><TrendingUp/><div><b>{summary.weeks} settimane · {summary.sessions} sessioni</b><p>Tre settimane di crescita e una di scarico. Il carico si adatta a completamento e difficoltà percepita.</p></div></section>
    <div className="month-tabs">{['Luglio','Agosto','Settembre'].map((label,index)=><button className={m===index+6?'active':''} onClick={()=>setMonth(new Date(2026,index+6,1))} key={label}>{label}</button>)}</div>
    <section className="calendar card">
      <div className="month"><button className="icon" disabled={!canPrev} onClick={()=>setMonth(new Date(y,m-1))}><ChevronLeft/></button><h2>{new Intl.DateTimeFormat('it-IT',{month:'long',year:'numeric'}).format(month)}</h2><button className="icon" disabled={!canNext} onClick={()=>setMonth(new Date(y,m+1))}><ChevronRight/></button></div>
      <div className="week">{['L','M','M','G','V','S','D'].map((x,i)=><b key={i}>{x}</b>)}</div>
      <div className="days">{cells.map((d,i)=>d?<button key={i} onClick={()=>setSelected(key(d))} className={selected===key(d)?'selected':''}><span>{d}</span>{(getPlanDay(key(d),data)||data.sessions.some(s=>s.date===key(d)))&&<i className={plannedStatus(key(d),data)}/>}</button>:<i key={i}/>)}</div>
      <div className="legend"><span><i className="completato"/>Completato</span><span><i className="saltato"/>Saltato</span><span><i className="parziale"/>Parziale</span><span><i className="programmato"/>Programmato</span></div>
    </section>
    <section className="card day-detail">
      <span className="eyebrow">{new Date(selected+'T12:00').toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'})}</span>
      {workout?<><div className="day-title"><div><h2>{workout.name}</h2><span className={`pill ${plannedStatus(selected,data)}`}>{plannedStatus(selected,data)}</span></div>{plan&&<b>Settimana {plan.week}</b>}</div>
        {plan&&<div className={`phase ${plan.mode}`}><b>{plan.phase} · ciclo {plan.cycle}</b><p>{plan.reason}</p></div>}
        {sel&&<p>{sel.duration} minuti · Intensità {sel.rpe||'—'}/10 {sel.reason&&`· ${sel.reason}`}</p>}
        {plan&&<div className="plan-exercises">{plan.exercises.map(e=><div key={e.exerciseId}><span>{getExercise(e.exerciseId).name}</span><b>{e.sets}× {e.reps?`${e.reps} rip.`:`${e.seconds} sec.`}</b></div>)}</div>}
        {sel?.notes&&<p>{sel.notes}</p>}
      </>:<><h2>Riposo e recupero</h2><p>Mobilità leggera o passeggiata facoltativa. Nessuna sessione programmata.</p></>}
    </section>
    <small className="plan-range">Piano attivo: {new Date(PLAN_START+'T12:00').toLocaleDateString('it-IT')} – {new Date(PLAN_END+'T12:00').toLocaleDateString('it-IT')}</small>
  </>;
}
