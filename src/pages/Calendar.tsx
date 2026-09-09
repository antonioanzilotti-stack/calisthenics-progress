import {useMemo, useState} from 'react';
import {ChevronLeft, ChevronRight, CalendarCheck} from 'lucide-react';
import {useApp} from '../hooks/useApp';
import {getExercise} from '../data/exercises';
import {calendarStatus, getProgramInfo, getSuggestedWorkoutId, localIso} from '../utils/trainingPlan';
import type {CalendarStatus, Workout} from '../types';

const statuses: CalendarStatus[] = ['suggerito','selezionato','in-corso','completato','parziale','saltato','riposo'];
const statusLabels: Record<CalendarStatus, string> = {
  suggerito:'Suggerito', selezionato:'Selezionato', 'in-corso':'In corso', completato:'Completato',
  parziale:'Parziale', saltato:'Saltato', riposo:'Riposo', neutro:'Neutro',
};

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
  const active = data.activeSession?.date === selected ? data.activeSession : null;
  const hasSelection = Object.prototype.hasOwnProperty.call(data.plannedDates, selected);
  const explicitSelection = hasSelection ? data.plannedDates[selected] : '';
  const suggestedId = getSuggestedWorkoutId(data);
  const state = calendarStatus(selected, data);
  const showSuggestion = selected === localIso() && state === 'neutro';
  const selectedWorkoutId = active?.workoutId || selectedSession?.workoutId
    || (explicitSelection && explicitSelection !== 'riposo' ? explicitSelection : showSuggestion ? suggestedId : undefined);
  const selectedWorkout = data.workouts.find(workout => workout.id === selectedWorkoutId);
  const info = getProgramInfo(data, selected);

  const monthStats = useMemo(() => {
    const states = Array.from({length: days}, (_, index) => calendarStatus(dateKey(index + 1), data));
    return {
      completed: states.filter(value => value === 'completato').length,
      selected: states.filter(value => ['selezionato','in-corso'].includes(value)).length,
      skipped: states.filter(value => value === 'saltato').length,
    };
  }, [data, days, year, monthIndex]);

  const setPlan = (value: string) => setData(current => {
    const plannedDates = {...current.plannedDates};
    if (!value) delete plannedDates[selected];
    else plannedDates[selected] = value as Workout['id'] | 'riposo';
    const sessions = current.sessions.filter(session => session.date !== selected || !['programmato','saltato'].includes(session.status));
    return {...current, plannedDates, sessions};
  });

  return <>
    <header><span className="eyebrow">Storico reale, nessun giorno fisso</span><h1>Calendario</h1><p className="lede">I giorni restano neutri finché non scegli un allenamento o Riposo. Solo una scelta non eseguita può diventare “Saltato”.</p></header>
    <section className="plan-banner card"><CalendarCheck/><div><b>Settimana {info.displayWeek} di 6 · {info.phase}</b><p>{info.objective} RIR target {info.rirTarget}.</p></div></section>
    <section className="calendar-summary"><span><b>{monthStats.completed}</b> completati</span><span><b>{monthStats.selected}</b> selezionati</span><span><b>{monthStats.skipped}</b> saltati</span></section>
    <section className="calendar card">
      <div className="month"><button className="icon" onClick={() => setMonth(new Date(year,monthIndex-1,1))}><ChevronLeft/></button><h2>{new Intl.DateTimeFormat('it-IT',{month:'long',year:'numeric'}).format(month)}</h2><button className="icon" onClick={() => setMonth(new Date(year,monthIndex+1,1))}><ChevronRight/></button></div>
      <div className="week">{['L','M','M','G','V','S','D'].map((label,index) => <b key={index}>{label}</b>)}</div>
      <div className="days">{cells.map((day,index) => {
        if (!day) return <i key={index}/>;
        const date = dateKey(day); const cellState = calendarStatus(date,data);
        return <button key={index} onClick={() => setSelected(date)} className={selected===date?'selected':''}><span>{day}</span>{cellState !== 'neutro' && <i className={cellState}/>}</button>;
      })}</div>
      <div className="legend">{statuses.map(value => <span key={value}><i className={value}/>{statusLabels[value]}</span>)}</div>
    </section>
    <section className="card day-detail">
      <span className="eyebrow">{new Date(selected+'T12:00').toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</span>
      <div className="calendar-edit-grid"><label>Scelta del giorno<select value={explicitSelection} disabled={Boolean(active || selectedSession && ['completato','parziale','recuperato'].includes(selectedSession.status))} onChange={event => setPlan(event.target.value)}><option value="">Nessuna scelta</option>{data.workouts.map(workout => <option key={workout.id} value={workout.id}>{workout.short} — {workout.name}</option>)}<option value="riposo">Riposo</option></select></label><div><small>Stato automatico</small><span className={`pill ${state}`}>{statusLabels[state]}</span></div></div>
      {selectedWorkout ? <><div className="day-title"><div><h2>{selectedWorkout.short} · {selectedWorkout.name}</h2>{showSuggestion && <p><span className="pill suggerito">Suggerito</span> È il prossimo allenamento consigliato, ma il giorno resta neutro finché non scegli.</p>}</div><b>{selectedWorkout.duration}</b></div><p>{selectedWorkout.focus}</p>
        {active && <p>Sessione iniziata e attualmente in corso.</p>}
        {selectedSession && <p>{selectedSession.duration} minuti reali · RPE {selectedSession.rpe ?? '—'}/10 {selectedSession.reason ? `· ${selectedSession.reason}` : ''}</p>}
        <div className="plan-exercises">{(selectedSession?.exercises || selectedWorkout.exercises).map((item, index) => <div key={`${item.exerciseId}-${index}`}><span>{getExercise(item.exerciseId)?.name || item.exerciseId}</span><b>{item.sets}× {item.reps ? `${item.reps} rip.` : `${item.seconds} sec.`}</b></div>)}</div>
        {selectedSession?.notes && <p className="session-calendar-note">{selectedSession.notes}</p>}
      </> : explicitSelection === 'riposo' ? <><h2>Riposo</h2><p>Scelta registrata. Non conta come allenamento saltato e non riduce l’aderenza.</p></> : <><h2>Giorno neutro</h2><p>Nessun allenamento selezionato: il giorno non influisce sull’aderenza e non verrà segnato come saltato.</p></>}
    </section>
  </>;
}
