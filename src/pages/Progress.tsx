import {useMemo,useState} from 'react';
import {Bar,BarChart,CartesianGrid,Line,LineChart,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';
import {Activity,Award,Clock3,Dumbbell,Footprints,Gauge,Timer,Weight} from 'lucide-react';
import {useApp} from '../hooks/useApp';
import {exerciseLibrary,getExercise} from '../data/exercises';
import {exerciseSets,localIso,sessionExerciseId,sessionVolume} from '../utils/trainingPlan';

type Period='30'|'60'|'90'|'180'|'all';
type Tab='forza'|'sedute'|'conditioning';
type Metric='peso'|'ripetizioni'|'volume';
type SessionMetric='volume'|'durata';
const periodLabels:Record<Period,string>={'30':'30 giorni','60':'60 giorni','90':'90 giorni','180':'6 mesi','all':'Tutto'};
const metricLabels:Record<Metric,string>={peso:'Peso',ripetizioni:'Ripetizioni',volume:'Volume'};

export default function Progress(){
  const {data}=useApp();
  const [period,setPeriod]=useState<Period>('60');
  const [tab,setTab]=useState<Tab>('forza');
  const [metric,setMetric]=useState<Metric>('peso');
  const [sessionMetric,setSessionMetric]=useState<SessionMetric>('volume');
  const strengthExercises=useMemo(()=>exerciseLibrary(data.customExercises).filter(exercise=>exercise.kind==='strength'),[data.customExercises]);
  const groups=useMemo(()=>['Tutti',...Array.from(new Set(strengthExercises.map(exercise=>exercise.group))).sort()],[strengthExercises]);
  const [group,setGroup]=useState('Tutti');
  const filteredExercises=useMemo(()=>strengthExercises.filter(exercise=>group==='Tutti'||exercise.group===group),[strengthExercises,group]);
  const [exerciseId,setExerciseId]=useState(strengthExercises[0]?.id||'chest-press');
  const selectedExercise=filteredExercises.some(exercise=>exercise.id===exerciseId)?exerciseId:(filteredExercises[0]?.id||exerciseId);
  const cutoff=useMemo(()=>{if(period==='all')return '0000-00-00';const date=new Date();date.setDate(date.getDate()-Number(period));return localIso(date)},[period]);
  const sessions=useMemo(()=>data.sessions.filter(session=>session.date>=cutoff&&session.date<=localIso()).sort((a,b)=>a.date.localeCompare(b.date)),[data.sessions,cutoff]);
  const recorded=useMemo(()=>sessions.filter(session=>['completato','recuperato','parziale'].includes(session.status)),[sessions]);

  const exerciseHistory=useMemo(()=>recorded.flatMap(session=>{
    const sets=exerciseSets(session,selectedExercise).filter(set=>set.done&&!set.warmup);
    if(!sets.length)return[];
    return[{date:session.date,label:session.date.slice(5),peso:Math.max(...sets.map(set=>set.weight||0)),ripetizioni:Math.max(...sets.map(set=>set.reps||0)),volume:Math.round(sets.reduce((sum,set)=>sum+(set.weight||0)*(set.reps||0),0))}];
  }),[recorded,selectedExercise]);

  const summary=useMemo(()=>{
    const conditioning=recorded.flatMap(session=>session.conditioning).filter(item=>item.done);
    const completed=recorded.filter(session=>['completato','recuperato'].includes(session.status)).length;
    const strength=recorded.filter(session=>session.workoutId!=='e').length;
    const volume=Math.round(recorded.reduce((sum,session)=>sum+sessionVolume(session),0));
    const minutes=recorded.reduce((sum,session)=>sum+session.duration,0);
    const average=recorded.length?Math.round(minutes/recorded.length):0;
    const conditioningMinutes=conditioning.reduce((sum,item)=>sum+(item.minutes||0),0);
    return{completed,strength,volume,minutes,average,conditioningMinutes};
  },[recorded]);

  const trends=useMemo(()=>recorded.map(session=>({date:session.date.slice(5),nome:session.workoutShort||session.workoutId.toUpperCase(),volume:Math.round(sessionVolume(session)),durata:session.duration})).filter(row=>row.volume||row.durata),[recorded]);
  const groupVolumes=useMemo(()=>{
    const totals:Record<string,number>={};
    recorded.forEach(session=>Object.entries(session.logs).forEach(([key,sets])=>{const exercise=getExercise(sessionExerciseId(session,key),data.customExercises);if(!exercise)return;totals[exercise.group]=(totals[exercise.group]||0)+sets.filter(set=>set.done&&!set.warmup).reduce((sum,set)=>sum+(set.weight||0)*(set.reps||0),0)}));
    return Object.entries(totals).map(([gruppo,volume])=>({gruppo,volume:Math.round(volume)})).filter(row=>row.volume).sort((a,b)=>b.volume-a.volume);
  },[recorded,data.customExercises]);
  const conditioningByActivity=useMemo(()=>{
    const totals:Record<string,number>={};
    recorded.flatMap(session=>session.conditioning).filter(item=>item.done).forEach(item=>{totals[item.activity]=(totals[item.activity]||0)+(item.minutes||0)});
    return Object.entries(totals).map(([attivita,minuti])=>({attivita,minuti})).sort((a,b)=>b.minuti-a.minuti);
  },[recorded]);

  const maxWeight=exerciseHistory.length?Math.max(...exerciseHistory.map(row=>row.peso)):0;
  const maxReps=exerciseHistory.length?Math.max(...exerciseHistory.map(row=>row.ripetizioni)):0;
  const maxVolume=exerciseHistory.length?Math.max(...exerciseHistory.map(row=>row.volume)):0;
  const best=[...exerciseHistory].sort((a,b)=>b.volume-a.volume)[0];
  const chartUnit=metric==='peso'?'kg':metric==='ripetizioni'?'rip.':'kg';

  return <>
    <header><span className="eyebrow">Dati reali, facili da leggere</span><h1>Progressi</h1><p className="lede">Esplora forza, andamento delle sedute e conditioning. Tocca i filtri e i grafici per concentrarti su ciò che vuoi migliorare.</p><div className="filter-row"><label>Periodo<select value={period} onChange={event=>setPeriod(event.target.value as Period)}>{Object.entries(periodLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label></div></header>

    <section className="progress-overview">
      <article><Dumbbell/><b>{summary.completed||'—'}</b><span>Sedute completate</span></article>
      <article><Timer/><b>{summary.minutes||'—'}</b><span>Minuti totali</span></article>
      <article><Weight/><b>{summary.volume?`${summary.volume} kg`:'—'}</b><span>Volume sollevato</span></article>
      <article><Clock3/><b>{summary.average||'—'}</b><span>Minuti medi</span></article>
    </section>

    <nav className="progress-tabs" aria-label="Sezioni progressi">
      <button className={tab==='forza'?'active':''} onClick={()=>setTab('forza')}><Gauge/> Forza</button>
      <button className={tab==='sedute'?'active':''} onClick={()=>setTab('sedute')}><Activity/> Sedute</button>
      <button className={tab==='conditioning'?'active':''} onClick={()=>setTab('conditioning')}><Footprints/> Conditioning</button>
    </nav>

    {tab==='forza'&&<>
      <section className="card progress-controls"><label>Gruppo muscolare<select value={group} onChange={event=>{setGroup(event.target.value);const first=strengthExercises.find(exercise=>event.target.value==='Tutti'||exercise.group===event.target.value);if(first)setExerciseId(first.id)}}>{groups.map(value=><option key={value}>{value}</option>)}</select></label><label>Esercizio<select value={selectedExercise} onChange={event=>setExerciseId(event.target.value)}>{filteredExercises.map(exercise=><option value={exercise.id} key={exercise.id}>{exercise.name}</option>)}</select></label></section>
      <section className="record-grid"><article className="card"><Weight/><small>Peso massimo</small><b>{maxWeight?`${maxWeight} kg`:'—'}</b></article><article className="card"><Gauge/><small>Più ripetizioni</small><b>{maxReps||'—'}</b></article><article className="card"><Award/><small>Volume migliore</small><b>{maxVolume?`${maxVolume} kg`:'—'}</b></article><article className="card"><Activity/><small>Data migliore</small><b>{best?.date||'—'}</b></article></section>
      <section className="card chart interactive-chart"><div className="chart-head"><div><span className="eyebrow">Andamento esercizio</span><h2>{getExercise(selectedExercise,data.customExercises)?.name}</h2></div><div className="metric-toggle">{(Object.keys(metricLabels) as Metric[]).map(value=><button key={value} className={metric===value?'active':''} onClick={()=>setMetric(value)}>{metricLabels[value]}</button>)}</div></div>{exerciseHistory.length?<ResponsiveContainer width="100%" height={260}><LineChart data={exerciseHistory} margin={{top:12,right:12,left:-12,bottom:0}}><CartesianGrid strokeDasharray="4 4"/><XAxis dataKey="label"/><YAxis/><Tooltip formatter={(value)=>[`${value} ${chartUnit}`,metricLabels[metric]]} labelFormatter={(label)=>`Data ${label}`}/><Line type="monotone" dataKey={metric} stroke="var(--accent)" strokeWidth={4} dot={{r:5}} activeDot={{r:8}}/></LineChart></ResponsiveContainer>:<p className="empty">Registra le serie di questo esercizio per vedere la progressione.</p>}</section>
      <section className="card exercise-table"><div className="section-title"><h2>Storico dettagliato</h2><span>{exerciseHistory.length} rilevazioni</span></div>{exerciseHistory.length?<div className="table-scroll"><table><thead><tr><th>Data</th><th>Peso</th><th>Ripetizioni</th><th>Volume</th></tr></thead><tbody>{[...exerciseHistory].reverse().map((row,index)=><tr key={`${row.date}-${index}`}><td>{row.date}</td><td>{row.peso?`${row.peso} kg`:'—'}</td><td>{row.ripetizioni||'—'}</td><td>{row.volume?`${row.volume} kg`:'—'}</td></tr>)}</tbody></table></div>:<p className="empty">Nessun dato registrato.</p>}</section>
    </>}

    {tab==='sedute'&&<>
      <section className="card chart interactive-chart"><div className="chart-head"><div><span className="eyebrow">Andamento generale</span><h2>{sessionMetric==='volume'?'Volume per seduta':'Durata per seduta'}</h2></div><div className="metric-toggle"><button className={sessionMetric==='volume'?'active':''} onClick={()=>setSessionMetric('volume')}>Volume</button><button className={sessionMetric==='durata'?'active':''} onClick={()=>setSessionMetric('durata')}>Durata</button></div></div>{trends.length?<ResponsiveContainer width="100%" height={270}><BarChart data={trends} margin={{top:12,right:12,left:-12,bottom:0}}><CartesianGrid strokeDasharray="4 4"/><XAxis dataKey="date"/><YAxis/><Tooltip formatter={(value)=>[`${value} ${sessionMetric==='volume'?'kg':'min'}`,sessionMetric==='volume'?'Volume':'Durata']}/><Bar dataKey={sessionMetric} fill="var(--accent)" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer>:<p className="empty">Nessuna seduta registrata nel periodo.</p>}</section>
      <section className="card chart"><div className="section-title"><h2>Volume per gruppo muscolare</h2><span>{summary.strength} sedute forza</span></div>{groupVolumes.length?<ResponsiveContainer width="100%" height={Math.max(240,groupVolumes.length*42)}><BarChart data={groupVolumes} layout="vertical" margin={{left:12,right:18}}><XAxis type="number"/><YAxis type="category" dataKey="gruppo" width={105}/><Tooltip formatter={(value)=>[`${value} kg`,'Volume']}/><Bar dataKey="volume" fill="#6391ec" radius={[0,8,8,0]}/></BarChart></ResponsiveContainer>:<p className="empty">Nessun volume registrato.</p>}</section>
      <section className="card recent-sessions"><div className="section-title"><h2>Ultime sedute</h2><span>{recorded.length}</span></div>{recorded.length?[...recorded].reverse().slice(0,8).map(session=><article key={session.id}><b>{session.workoutShort||session.workoutId.toUpperCase()} · {session.workoutName}</b><span>{session.date} · {session.duration} min · {Math.round(sessionVolume(session))} kg</span><span className={`pill ${session.status}`}>{session.status}</span></article>):<p className="empty">Nessuna seduta registrata.</p>}</section>
    </>}

    {tab==='conditioning'&&<>
      <section className="conditioning-summary"><article className="card"><Timer/><small>Minuti totali</small><b>{summary.conditioningMinutes||'—'}</b></article><article className="card"><Footprints/><small>Attività diverse</small><b>{conditioningByActivity.length||'—'}</b></article></section>
      <section className="card chart interactive-chart"><div className="section-title"><h2>Minuti per attività</h2><span>Solo attività completate</span></div>{conditioningByActivity.length?<ResponsiveContainer width="100%" height={270}><BarChart data={conditioningByActivity} margin={{top:12,right:12,left:-12,bottom:0}}><CartesianGrid strokeDasharray="4 4"/><XAxis dataKey="attivita"/><YAxis/><Tooltip formatter={(value)=>[`${value} min`,'Tempo']}/><Bar dataKey="minuti" fill="var(--accent)" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer>:<p className="empty">Completa una sessione E per vedere qui il conditioning.</p>}</section>
    </>}
  </>;
}
