import {useMemo, useState} from 'react';
import {ChevronLeft, ChevronRight, CalendarCheck} from 'lucide-react';
import {useApp} from '../hooks/useApp';
import {getExercise} from '../data/exercises';
import {getPlannedWorkoutId, getProgramInfo, localIso, plannedStatus} from '../utils/trainingPlan';
import type {Session, Status, Workout} from '../types';

const statuses: Status[] = ['programmato','completato','parziale','saltato','recuperato','riposo'];

export default function Calendar() {
  const {data, setData} = useApp();
  const [month, setMonth] = useState(() => {const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1)});
  const [selected, setSelected] = useState(localIso());
  const year = month.getFullYear(), monthIndex = month.getMonth();
  const first = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const days = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({length: days}, (_, index) => index + 1)];
  const dateKey = (day: number) => `${year}-${String(monthIndex + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const selectedSession = data.sessions.find(session => session.date === selected);
  const plannedId = getPlannedWorkoutId(selected, data);
  const selectedWorkout = data.workouts.find(workout => workout.id === (selectedSession?.workoutId || plannedId));
  const info = getProgramInfo(data, selected);

  const monthStats = useMemo(() => {
    const prefix = `${year}-${String(monthIndex + 1).padStart(2,'0')}`;
    const sessions = data.sessions.filter(session => session.date.startsWith(prefix));
    return {completed:sessions.filter(session => ['completato','recuperato'].includes(session.status)).length,
      skipped:sessions.filter(session => session.status === 'saltato').length,recovered:sessions.filter(session => session.status === 'recuperato').length};
  }, [data.sessions, year, monthIndex]);

  const setPlan = (value: string) => setData(current => ({...current,
    plannedDates: {...current.plannedDates, [selected]: value ? value as Workout['id'] : null},
  }));

  const setStatus = (status: Status) => setData(current => {
    if (status === 'programmato') return {...current, sessions: current.sessions.filter(item => item.date !== selected),
      plannedDates: {...current.plannedDates, [selected]: (selectedSession?.workoutId || plannedId || 'a') as Workout['id']}};
    if (status === 'riposo') return {...current, sessions: current.sessions.filter(item => item.date !== selected), plannedDates: {...current.plannedDates, [selected]: null}};
    const workoutId = (selectedSession?.workoutId || plannedId || 'a') as Workout['id'];
    const session: Session = selectedSession ? {...selectedSession, status, workoutId} : {
      id: crypto.randomUUID(), date: selected, workoutId, status, duration: 0, notes: '', rpe: null, logs: {}, conditioning: [],
    };
    return {...current, sessions: [...current.sessions.filter(item => item.date !== selected), session], plannedDates: {...current.plannedDates, [selected]: workoutId}};
  });

  return <>
    <header><span className="eyebrow">Pianificazione flessibile</span><h1>Calendario</h1><p className="lede">Scegli liberamente quando fare A, B, C e D. I giorni prima del primo utilizzo non diventano saltati.</p></header>
    <section className="plan-banner card"><CalendarCheck/><div><b>Settimana {info.displayWeek} di 6 · {info.phase}</b><p>{info.objective} RIR target {info.rirTarget}.</p></div></section>
    <section className="calendar-summary"><span><b>{monthStats.completed}</b> completati</span><span><b>{monthStats.skipped}</b> saltati</span><span><b>{monthStats.recovered}</b> recuperi</span></section>
    <section className="calendar card">
      <div className="month"><button className="icon" onClick={() => setMonth(new Date(year,monthIndex-1,1))}><ChevronLeft/></button><h2>{new Intl.DateTimeFormat('it-IT',{month:'long',year:'numeric'}).format(month)}</h2><button className="icon" onClick={() => setMonth(new Date(year,monthIndex+1,1))}><ChevronRight/></button></div>
      <div className="week">{['L','M','M','G','V','S','D'].map((label,index) => <b key={index}>{label}</b>)}</div>
      <div className="days">{cells.map((day,index) => day ? <button key={index} onClick={() => setSelected(dateKey(day))} className={selected===dateKey(day)?'selected':''}><span>{day}</span>{(getPlannedWorkoutId(dateKey(day),data)||data.sessions.some(session=>session.date===dateKey(day)))&&<i className={plannedStatus(dateKey(day),data)}/>}</button> : <i key={index}/>)}</div>
      <div className="legend">{statuses.map(status => <span key={status}><i className={status}/>{status}</span>)}</div>
    </section>
    <section className="card day-detail">
      <span className="eyebrow">{new Date(selected+'T12:00').toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</span>
      <div className="calendar-edit-grid"><label>Sessione<select value={selectedWorkout?.id || ''} onChange={event => setPlan(event.target.value)}><option value="">Riposo</option>{data.workouts.map(workout => <option key={workout.id} value={workout.id}>{workout.short} — {workout.name}</option>)}</select></label><label>Stato<select value={plannedStatus(selected,data)} onChange={event => setStatus(event.target.value as Status)}>{statuses.map(status => <option key={status}>{status}</option>)}</select></label></div>
      {selectedWorkout ? <><div className="day-title"><div><h2>{selectedWorkout.short} · {selectedWorkout.name}</h2><span className={`pill ${plannedStatus(selected,data)}`}>{plannedStatus(selected,data)}</span></div><b>{selectedWorkout.duration}</b></div><p>{selectedWorkout.focus}</p>
        {selectedSession && <p>{selectedSession.duration} minuti reali · RPE {selectedSession.rpe ?? '—'}/10 {selectedSession.reason ? `· ${selectedSession.reason}` : ''}</p>}
        <div className="plan-exercises">{selectedWorkout.exercises.map(item => <div key={item.exerciseId}><span>{getExercise(item.exerciseId).name}</span><b>{item.sets}× {item.reps ? `${item.reps} rip.` : `${item.seconds} sec.`}</b></div>)}</div>
        {selectedSession?.notes && <p className="session-calendar-note">{selectedSession.notes}</p>}
      </> : <><h2>Riposo</h2><p>Nessuna sessione programmata. Puoi assegnarne una dal menu qui sopra.</p></>}
    </section>
  </>;
}
