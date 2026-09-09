import {useMemo, useState} from 'react';
import {Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {Award, CalendarX, Footprints, Gauge, Timer, Weight} from 'lucide-react';
import {useApp} from '../hooks/useApp';
import {exercises, getExercise} from '../data/exercises';
import {calendarStatus, localIso, sessionVolume} from '../utils/trainingPlan';

type Period = '30'|'60'|'90'|'180'|'all';
const periodLabels: Record<Period,string> = {'30':'30 giorni','60':'60 giorni','90':'90 giorni','180':'6 mesi','all':'Tutto'};

export default function Progress() {
  const {data} = useApp();
  const [period, setPeriod] = useState<Period>('60');
  const strengthExercises = exercises.filter(exercise => exercise.kind === 'strength');
  const [exerciseId, setExerciseId] = useState(strengthExercises[0].id);
  const cutoff = useMemo(() => {
    if (period === 'all') return data.preferences.createdAt;
    const date = new Date(); date.setDate(date.getDate() - Number(period)); return localIso(date);
  }, [period, data.preferences.createdAt]);
  const sessions = useMemo(() => data.sessions.filter(session => session.date >= cutoff && session.date <= localIso()).sort((a,b) => a.date.localeCompare(b.date)), [data.sessions, cutoff]);

  const exerciseHistory = useMemo(() => sessions.flatMap(session => {
    const sets = (session.logs[exerciseId] || []).filter(set => set.done);
    if (!sets.length) return [];
    return [{date: session.date, label: session.date.slice(5), peso: Math.max(...sets.map(set => set.weight || 0)),
      ripetizioni: Math.max(...sets.map(set => set.reps || 0)), volume: sets.reduce((sum,set) => sum + (set.weight || 0) * (set.reps || 0),0)}];
  }), [sessions, exerciseId]);

  const adherenceDays = useMemo(() => {
    const dates = new Set([
      ...Object.entries(data.plannedDates).filter(([date, choice]) => date >= cutoff && date <= localIso() && choice !== 'riposo').map(([date]) => date),
      ...data.sessions.filter(session => session.date >= cutoff && session.date <= localIso() && session.status !== 'riposo').map(session => session.date),
    ]);
    return [...dates].sort().map(date => ({date,status:calendarStatus(date,data)}));
  }, [cutoff, data]);

  const summary = useMemo(() => {
    const completed = sessions.filter(session => ['completato','recuperato'].includes(session.status)).length;
    const skipped = adherenceDays.filter(day => day.status === 'saltato').length;
    const scheduled = adherenceDays.length;
    const conditioning = sessions.flatMap(session => session.conditioning).filter(item => item.done);
    const minutesBy = (names: string[]) => conditioning.filter(item => names.includes(item.activity)).reduce((sum,item) => sum + (item.minutes || 0),0);
    const lastDone = [...sessions].reverse().find(session => ['completato','recuperato','parziale'].includes(session.status));
    const daysWithout = lastDone ? Math.max(0,Math.floor((new Date(`${localIso()}T12:00:00`).getTime()-new Date(`${lastDone.date}T12:00:00`).getTime())/86400000)) : null;
    return {completed, skipped, scheduled, adherence: scheduled ? Math.round(completed/scheduled*100) : null,
      minutes: sessions.reduce((sum,session)=>sum+session.duration,0), volume: Math.round(sessions.reduce((sum,session)=>sum+sessionVolume(session),0)),
      recovered:sessions.filter(session=>session.status==='recuperato').length, daysWithout,
      conditioning:conditioning.reduce((sum,item)=>sum+(item.minutes||0),0), walk:minutesBy(['Camminata','Camminata inclinata']),
      rower:minutesBy(['Vogatore']), boxing:minutesBy(['Boxe']), rope:minutesBy(['Corda'])};
  }, [sessions, adherenceDays]);

  const trends = useMemo(() => sessions.map(session => ({date:session.date.slice(5),volume:Math.round(sessionVolume(session)),durata:session.duration})).filter(item=>item.volume||item.durata),[sessions]);
  const groupVolumes = useMemo(() => {
    const totals: Record<string,number> = {};
    sessions.forEach(session => Object.entries(session.logs).forEach(([id,sets]) => {
      const group = getExercise(id)?.group || 'Altro';
      totals[group] = (totals[group] || 0) + sets.filter(set=>set.done).reduce((sum,set)=>sum+(set.weight||0)*(set.reps||0),0);
    }));
    return Object.entries(totals).map(([gruppo,volume])=>({gruppo,volume:Math.round(volume)})).filter(item=>item.volume);
  },[sessions]);

  const adherenceTrend = useMemo(() => {
    const buckets: Record<string,{label:string;completed:number;decided:number;missed:number;monthly:string}> = {};
    adherenceDays.forEach(day => {
      const date = new Date(`${day.date}T12:00:00`); const monday = new Date(date); monday.setDate(date.getDate()-((date.getDay()+6)%7));
      const key=localIso(monday); const bucket=buckets[key] ||= {label:key.slice(5),completed:0,decided:0,missed:0,monthly:day.date.slice(0,7)};
      bucket.decided++; if(day.status==='completato') bucket.completed++; if(day.status==='saltato') bucket.missed++;
    });
    return Object.values(buckets).map(bucket=>({...bucket,aderenza:bucket.decided?Math.round(bucket.completed/bucket.decided*100):0}));
  },[adherenceDays]);

  const monthly = useMemo(() => {
    const map:Record<string,{mese:string;done:number;decided:number;missed:number}>={}; adherenceDays.forEach(day=>{const key=day.date.slice(0,7);const row=map[key]||={mese:key.slice(5),done:0,decided:0,missed:0};row.decided++;if(day.status==='completato')row.done++;if(day.status==='saltato')row.missed++});
    return Object.values(map).map(row=>({...row,aderenza:row.decided?Math.round(row.done/row.decided*100):0}));
  },[adherenceDays]);

  const conditioningChart = [{attivita:'Conditioning',minuti:summary.conditioning},{attivita:'Camminata',minuti:summary.walk},{attivita:'Vogatore',minuti:summary.rower},{attivita:'Boxe',minuti:summary.boxing},{attivita:'Corda',minuti:summary.rope}];
  const best = [...exerciseHistory].sort((a,b)=>b.volume-a.volume)[0];
  const maxWeight = exerciseHistory.length ? Math.max(...exerciseHistory.map(item=>item.peso)) : null;
  const maxReps = exerciseHistory.length ? Math.max(...exerciseHistory.map(item=>item.ripetizioni)) : null;
  const maxVolume = exerciseHistory.length ? Math.max(...exerciseHistory.map(item=>item.volume)) : null;
  const hasData = sessions.length > 0;

  return <>
    <header><span className="eyebrow">Solo dati realmente registrati</span><h1>Progressi</h1><div className="filter-row"><label>Periodo<select value={period} onChange={event=>setPeriod(event.target.value as Period)}>{Object.entries(periodLabels).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label><label>Esercizio<select value={exerciseId} onChange={event=>setExerciseId(event.target.value)}>{strengthExercises.map(exercise=><option value={exercise.id} key={exercise.id}>{exercise.name}</option>)}</select></label></div></header>
    <div className="stats stats-seven"><article><b>{summary.adherence===null?'—':`${summary.adherence}%`}</b><span>Aderenza sulle scelte</span></article><article><b>{summary.scheduled||'—'}</b><span>Allenamenti scelti</span></article><article><b>{summary.completed||'—'}</b><span>Completati</span></article><article><b>{summary.skipped||'—'}</b><span>Saltati</span></article><article><b>{summary.minutes||'—'}</b><span>Minuti</span></article><article><b>{summary.volume?`${summary.volume} kg`:'—'}</b><span>Volume</span></article><article><b>{summary.daysWithout??'—'}</b><span>Giorni senza allenamento</span></article></div>
    {!hasData && <p className="empty card">Nessun dato registrato.</p>}
    <section className="records"><div className="section-title"><h2>Record personali · {getExercise(exerciseId).name}</h2><span>Nessun valore fittizio</span></div><div className="record-grid"><article className="card"><Weight/><small>Peso massimo</small><b>{maxWeight ? `${maxWeight} kg` : '—'}</b></article><article className="card"><Gauge/><small>Più ripetizioni</small><b>{maxReps || '—'}</b></article><article className="card"><Award/><small>Volume massimo</small><b>{maxVolume ? `${maxVolume} kg` : '—'}</b></article><article className="card"><CalendarX/><small>Miglior sessione</small><b>{best ? best.date : '—'}</b></article></div></section>
    <section className="card chart"><h2>Peso utilizzato · {getExercise(exerciseId).name}</h2>{exerciseHistory.length?<ResponsiveContainer width="100%" height={210}><LineChart data={exerciseHistory}><CartesianGrid strokeDasharray="4 4"/><XAxis dataKey="label"/><YAxis/><Tooltip/><Line dataKey="peso" name="kg" stroke="var(--accent)" strokeWidth={3}/></LineChart></ResponsiveContainer>:<p className="empty">Nessun dato registrato.</p>}</section>
    <section className="card chart"><h2>Ripetizioni per esercizio</h2>{exerciseHistory.length?<ResponsiveContainer width="100%" height={190}><LineChart data={exerciseHistory}><XAxis dataKey="label"/><YAxis allowDecimals={false}/><Tooltip/><Line dataKey="ripetizioni" stroke="#6391ec" strokeWidth={3}/></LineChart></ResponsiveContainer>:<p className="empty">Nessun dato registrato.</p>}</section>
    <section className="card chart"><h2>Volume per sessione</h2>{trends.length?<ResponsiveContainer width="100%" height={210}><BarChart data={trends}><XAxis dataKey="date"/><YAxis/><Tooltip/><Bar dataKey="volume" fill="var(--accent)" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer>:<p className="empty">Nessun dato registrato.</p>}</section>
    <section className="card chart"><h2>Volume per gruppo muscolare</h2>{groupVolumes.length?<ResponsiveContainer width="100%" height={230}><BarChart data={groupVolumes} layout="vertical"><XAxis type="number"/><YAxis type="category" dataKey="gruppo" width={95}/><Tooltip/><Bar dataKey="volume" fill="#6391ec" radius={[0,6,6,0]}/></BarChart></ResponsiveContainer>:<p className="empty">Nessun dato registrato.</p>}</section>
    <section className="card chart"><h2>Durata allenamenti</h2>{trends.length?<ResponsiveContainer width="100%" height={190}><LineChart data={trends}><XAxis dataKey="date"/><YAxis/><Tooltip/><Line dataKey="durata" name="minuti" stroke="var(--amber)" strokeWidth={3}/></LineChart></ResponsiveContainer>:<p className="empty">Nessun dato registrato.</p>}</section>
    <section className="card chart"><h2>Aderenza settimanale</h2>{adherenceTrend.length?<ResponsiveContainer width="100%" height={210}><BarChart data={adherenceTrend}><XAxis dataKey="label"/><YAxis domain={[0,100]}/><Tooltip/><Bar dataKey="aderenza" fill="var(--accent)" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer>:<p className="empty">Nessun dato registrato.</p>}</section>
    <section className="card chart"><h2>Aderenza mensile</h2>{monthly.length?<ResponsiveContainer width="100%" height={190}><BarChart data={monthly}><XAxis dataKey="mese"/><YAxis domain={[0,100]}/><Tooltip/><Bar dataKey="aderenza" fill="#6391ec" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer>:<p className="empty">Nessun dato registrato.</p>}</section>
    <section className="card chart"><h2>Conditioning per attività</h2><div className="conditioning-totals"><span><Timer/> {summary.conditioning} min conditioning</span><span><Footprints/> {summary.walk} min camminata</span></div>{summary.conditioning?<ResponsiveContainer width="100%" height={210}><BarChart data={conditioningChart}><XAxis dataKey="attivita"/><YAxis/><Tooltip/><Bar dataKey="minuti" fill="var(--accent)" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer>:<p className="empty">Nessun dato registrato.</p>}</section>
    <section className="card exercise-table"><h2>Progressione · {getExercise(exerciseId).name}</h2>{exerciseHistory.length?<div className="table-scroll"><table><thead><tr><th>Data</th><th>Peso</th><th>Ripetizioni</th><th>Volume</th></tr></thead><tbody>{exerciseHistory.map(row=><tr key={row.date}><td>{row.date}</td><td>{row.peso||'—'} kg</td><td>{row.ripetizioni||'—'}</td><td>{row.volume||'—'} kg</td></tr>)}</tbody></table></div>:<p className="empty">Nessun dato registrato.</p>}</section>
    <section className="missed-summary card"><h2>Costanza</h2><p><b>{summary.scheduled}</b> scelti · <b>{summary.completed}</b> completati · <b>{summary.skipped}</b> saltati · <b>{summary.recovered}</b> recuperati · i giorni neutri non entrano nel calcolo</p></section>
  </>;
}
