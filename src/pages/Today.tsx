import {useEffect, useMemo, useState} from 'react';
import {CircleCheck, Clock3, Pause, Play, Plus, RotateCcw, SkipForward, TrendingUp, X} from 'lucide-react';
import {useApp} from '../hooks/useApp';
import {conditioningActivities, defaultConditioning, emptyLogs} from '../data/defaults';
import {getExercise} from '../data/exercises';
import {canProgress, getPlannedWorkoutId, getProgramInfo, localIso, sessionCompletion, sessionVolume} from '../utils/trainingPlan';
import ExerciseArt from '../components/ExerciseArt';
import ExerciseModal from '../components/ExerciseModal';
import type {ActiveSession, ConditioningActivity, Exercise, Session, SetLog, Workout} from '../types';

const numberOrNull = (value: string) => value === '' ? null : Number(value);
const completedStatuses = new Set(['completato', 'recuperato']);

export default function Today() {
  const {data, setData} = useApp();
  const today = localIso();
  const existing = data.sessions.find(session => session.date === today);
  const plannedId = getPlannedWorkoutId(today, data) || 'a';
  const [selectedId, setSelectedId] = useState<Workout['id']>(existing?.workoutId || data.activeSession?.workoutId || plannedId);
  const [detail, setDetail] = useState<Exercise>();
  const [rest, setRest] = useState(0);
  const [restPaused, setRestPaused] = useState(false);
  const [, setTick] = useState(0);
  const active = data.activeSession?.date === today ? data.activeSession : null;
  const workoutId = active?.workoutId || selectedId;
  const workout = data.workouts.find(item => item.id === workoutId)!;
  const phase = getProgramInfo(data, today);

  useEffect(() => {
    if (!rest || restPaused) return;
    const timer = window.setTimeout(() => setRest(value => value - 1), 1000);
    if (rest === 1 && navigator.vibrate) navigator.vibrate([180, 80, 180]);
    return () => window.clearTimeout(timer);
  }, [rest, restPaused]);

  useEffect(() => {
    if (!active || active.pausedAt) return;
    const timer = window.setInterval(() => setTick(value => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [active?.startedAt, active?.pausedAt]);

  const elapsedSeconds = active ? Math.max(0, Math.floor(((active.pausedAt || Date.now()) - active.startedAt - active.pausedMs) / 1000)) : 0;
  const progress = active ? sessionCompletion(active) : {done: 0, total: 0, percent: 0};

  const dashboard = useMemo(() => {
    const start = new Date(`${today}T12:00:00`); start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const weekStart = localIso(start);
    const thisWeek = data.sessions.filter(session => session.date >= weekStart && session.date <= today);
    const done = thisWeek.filter(session => completedStatuses.has(session.status)).length;
    const skipped = thisWeek.filter(session => session.status === 'saltato').length;
    const relevant = done + skipped;
    const last = [...data.sessions].filter(session => session.status !== 'saltato').sort((a, b) => b.date.localeCompare(a.date))[0];
    let next: {date: string; id: Workout['id']} | null = null;
    for (let offset = 0; offset < 15; offset++) {
      const date = new Date(`${today}T12:00:00`); date.setDate(date.getDate() + offset);
      const iso = localIso(date); const id = getPlannedWorkoutId(iso, data);
      if (id && !data.sessions.some(session => session.date === iso && session.status !== 'programmato')) {next = {date: iso, id}; break;}
    }
    const body = [...data.bodyRecords].filter(item => item.weight !== null).sort((a, b) => b.date.localeCompare(a.date))[0];
    const improvements = data.sessions.filter(session => session.date >= weekStart).reduce((sum, session) =>
      sum + Object.keys(session.logs).filter(id => getExercise(id)?.loaded && canProgress(session, id, data)).length, 0);
    return {
      sessions: done, adherence: relevant ? `${Math.round(done / relevant * 100)}%` : '—',
      minutes: thisWeek.reduce((sum, session) => sum + session.duration, 0),
      volume: Math.round(thisWeek.reduce((sum, session) => sum + sessionVolume(session), 0)),
      last, next, body, improvements,
    };
  }, [data, today]);

  const updateActive = (update: (draft: ActiveSession) => ActiveSession) => setData(current =>
    current.activeSession ? {...current, activeSession: update(current.activeSession)} : current);

  const begin = () => {
    const fromExisting = existing?.workoutId === selectedId ? existing : undefined;
    setData(current => ({...current, activeSession: {
      date: today, workoutId: selectedId, startedAt: Date.now(), pausedAt: null, pausedMs: 0,
      logs: selectedId === 'd' ? {} : (fromExisting && Object.keys(fromExisting.logs).length ? fromExisting.logs : emptyLogs(workout)),
      conditioning: selectedId === 'd' ? (fromExisting?.conditioning.length ? fromExisting.conditioning : defaultConditioning()) : [],
      notes: fromExisting?.notes || '', rpe: fromExisting?.rpe || null,
    }}));
  };

  const togglePause = () => updateActive(draft => draft.pausedAt
    ? {...draft, pausedMs: draft.pausedMs + Date.now() - draft.pausedAt, pausedAt: null}
    : {...draft, pausedAt: Date.now()});

  const changeSet = (exerciseId: string, index: number, change: Partial<SetLog>) => updateActive(draft => ({...draft,
    logs: {...draft.logs, [exerciseId]: draft.logs[exerciseId].map((set, setIndex) => setIndex === index ? {...set, ...change} : set)},
  }));

  const toggleSet = (exerciseId: string, index: number, restSeconds: number) => {
    const set = active?.logs[exerciseId]?.[index]; if (!set) return;
    changeSet(exerciseId, index, {done: !set.done});
    if (!set.done && data.preferences.autoRest && restSeconds) {setRest(restSeconds); setRestPaused(false);}
  };

  const finish = () => {
    if (!active) return;
    const completion = sessionCompletion(active);
    const session: Session = {
      id: existing?.id || crypto.randomUUID(), date: today, workoutId: active.workoutId,
      status: completion.percent === 100 ? 'completato' : 'parziale', duration: Math.max(1, Math.round(elapsedSeconds / 60)),
      notes: active.notes, rpe: active.rpe, logs: active.logs, conditioning: active.conditioning,
    };
    setData(current => ({...current, sessions: [...current.sessions.filter(item => item.date !== today), session], activeSession: null}));
  };

  const skip = () => {
    const reason = prompt('Motivo (tempo, stanchezza, dolore, lavoro, viaggio, altro):', 'mancanza di tempo');
    if (reason === null) return;
    const session: Session = {id: existing?.id || crypto.randomUUID(), date: today, workoutId: selectedId, status: 'saltato', duration: 0,
      notes: '', rpe: null, reason, logs: {}, conditioning: []};
    setData(current => ({...current, sessions: [...current.sessions.filter(item => item.date !== today), session], activeSession: null}));
  };

  const move = () => {
    const destination = prompt('Nuova data (AAAA-MM-GG):', localIso(new Date(Date.now() + 86400000)));
    if (!destination || !/^\d{4}-\d{2}-\d{2}$/.test(destination)) return;
    setData(current => ({...current, plannedDates: {...current.plannedDates, [today]: null, [destination]: selectedId}, activeSession: null}));
  };

  const updateConditioning = (id: string, field: string, value: string | boolean) => updateActive(draft => ({...draft,
    conditioning: draft.conditioning.map(item => item.id === id ? {...item, [field]: typeof value === 'boolean' ? value : field === 'activity' || field === 'notes' ? value : numberOrNull(value)} : item),
  }));

  return <>
    <header><span className="eyebrow">{new Intl.DateTimeFormat('it-IT', {weekday:'long', day:'numeric', month:'long'}).format(new Date())}</span><h1>{active ? 'Allenamento in corso' : 'Oggi'}</h1><p className="lede">Forza, conditioning e costanza. Nessun carico viene deciso al posto tuo.</p></header>

    {!active && <>
      <section className="phase-card card"><TrendingUp/><div><span className="eyebrow">Settimana {phase.displayWeek} di 6 · {phase.phase}</span><h3>RIR target {phase.rirTarget}</h3><p>{phase.objective}</p></div></section>
      <section className="dashboard-grid">
        <article><b>{dashboard.sessions || '—'}</b><span>Allenamenti settimana</span></article>
        <article><b>{dashboard.adherence}</b><span>Aderenza</span></article>
        <article><b>{dashboard.minutes || '—'}</b><span>Minuti totali</span></article>
        <article><b>{dashboard.volume ? `${dashboard.volume} kg` : '—'}</b><span>Volume totale</span></article>
      </section>
      <section className="card dashboard-detail">
        <div><small>Ultima sessione</small><b>{dashboard.last ? `${data.workouts.find(item => item.id === dashboard.last?.workoutId)?.short} · ${dashboard.last.date}` : 'Nessun dato registrato.'}</b></div>
        <div><small>Prossimo allenamento</small><b>{dashboard.next ? `${dashboard.next.id.toUpperCase()} · ${new Date(dashboard.next.date+'T12:00').toLocaleDateString('it-IT')}` : 'Non programmato'}</b></div>
        <div><small>Ultimo peso corporeo</small><b>{dashboard.body ? `${dashboard.body.weight} kg` : 'Nessun dato registrato.'}</b></div>
        <div><small>Miglioramenti recenti</small><b>{dashboard.improvements ? `${dashboard.improvements} range completati` : 'Nessun dato registrato.'}</b></div>
      </section>
      <section className="hero card">
        <div><span className={`pill ${existing?.status || 'programmato'}`}>{existing?.status || 'programmato'}</span><h2>Allenamento {workout.short}</h2><p>{workout.name} · {workout.focus}</p></div>
        <strong>{workout.duration.split(' ')[0]}<small> min</small></strong>
        <label className="session-picker"><span>Cambia sessione</span><select value={selectedId} onChange={event => setSelectedId(event.target.value as Workout['id'])}>{data.workouts.map(item => <option key={item.id} value={item.id}>{item.short} — {item.name}</option>)}</select></label>
        <div className="hero-actions"><button className="primary" onClick={begin}><Play/> {existing ? 'Apri sessione' : 'Inizia'}</button><button className="secondary" onClick={skip}><SkipForward/> Salta</button><button className="secondary" onClick={move}><Clock3/> Sposta</button></div>
      </section>
      <section><div className="section-title"><h2>La sessione</h2><span>{workout.exercises.length} esercizi</span></div>{workout.exercises.map(item => {const exercise = getExercise(item.exerciseId);return <article className="exercise-row" key={exercise.id}><ExerciseArt id={exercise.id} name={exercise.name}/><div><h3>{exercise.name}</h3><p>{item.sets} serie · {item.reps ? `${item.reps} rip.` : `${item.seconds} sec.`} · recupero {item.rest || '—'}s</p><button className="text-btn" onClick={() => setDetail(exercise)}>Tecnica e regolazione</button></div></article>})}</section>
    </>}

    {active && <>
      <section className="workout-head card"><div className="ring" style={{'--pct': `${progress.percent * 3.6}deg`} as React.CSSProperties}><b>{progress.percent}%</b></div><div><span className="eyebrow">{active.pausedAt ? 'In pausa' : 'Sessione attiva'}</span><h2>{workout.name}</h2><p>{progress.done} di {progress.total} elementi · {Math.floor(elapsedSeconds/60)}:{String(elapsedSeconds%60).padStart(2,'0')}</p></div><button className="icon timer-pause" onClick={togglePause} aria-label={active.pausedAt ? 'Riprendi' : 'Pausa'}>{active.pausedAt ? <Play/> : <Pause/>}</button></section>
      {rest > 0 && <aside className="rest"><RotateCcw/><div><small>RECUPERO</small><b>{Math.floor(rest/60)}:{String(rest%60).padStart(2,'0')}</b></div><button className="icon" onClick={() => setRestPaused(value => !value)}>{restPaused ? <Play/> : <Pause/>}</button><button className="icon" onClick={() => setRest(0)}><X/></button></aside>}
      <div className="quick-rest"><span>Timer</span>{[30,45,60,75,90,120].map(seconds => <button onClick={() => {setRest(seconds);setRestPaused(false)}} key={seconds}>{seconds}s</button>)}</div>

      {workout.id !== 'd' && workout.exercises.map(item => {const exercise = getExercise(item.exerciseId);const sets = active.logs[exercise.id] || [];const max = Number(item.reps?.match(/\d+/g)?.at(-1));const ready = Boolean(exercise.loaded && max && sets.length && sets.every(set => set.done && (set.reps || 0) >= max));return <article className="set-card card" key={exercise.id}>
        <div className="set-title"><div><span className="eyebrow">{exercise.group}</span><h2>{exercise.name}</h2><p>{item.reps ? `${item.reps} ripetizioni` : `${item.seconds} secondi`} · recupero {item.rest || '—'}s</p></div><button className="text-btn" onClick={() => setDetail(exercise)}>Guida</button></div>
        <div className={`set-grid-head ${exercise.loaded ? 'has-weight' : 'no-weight'} ${exercise.kind === 'strength' ? 'has-rir' : 'no-rir'}`}><span>Serie</span>{exercise.loaded && <span>Peso kg</span>}<span>{item.seconds ? 'Secondi' : 'Ripet.'}</span>{exercise.kind === 'strength' && <span>RIR</span>}<span>Fatto</span></div>
        {sets.map((set, index) => <div className={`gym-set ${exercise.loaded ? 'has-weight' : 'no-weight'} ${exercise.kind === 'strength' ? 'has-rir' : 'no-rir'}`} key={index}><b>{index + 1}</b>
          {exercise.loaded && <input aria-label={`Peso serie ${index+1}`} inputMode="decimal" type="number" min="0" step="0.5" placeholder="—" value={set.weight ?? ''} onChange={event => changeSet(exercise.id,index,{weight:numberOrNull(event.target.value)})}/>}
          <input aria-label={`Valore serie ${index+1}`} inputMode="numeric" type="number" min="0" placeholder="—" value={(item.seconds ? set.seconds : set.reps) ?? ''} onChange={event => changeSet(exercise.id,index,item.seconds ? {seconds:numberOrNull(event.target.value)} : {reps:numberOrNull(event.target.value)})}/>
          {exercise.kind === 'strength' && <input aria-label={`RIR serie ${index+1}`} inputMode="numeric" type="number" min="0" max="10" placeholder="—" value={set.rir ?? ''} onChange={event => changeSet(exercise.id,index,{rir:numberOrNull(event.target.value)})}/>}
          <button className={set.done ? 'done' : 'check'} onClick={() => toggleSet(exercise.id,index,item.rest)} aria-label={`Completa serie ${index+1}`}><CircleCheck/></button>
          <input className="set-note" aria-label={`Note serie ${index+1}`} placeholder="Nota opzionale sulla serie" value={set.notes} onChange={event => changeSet(exercise.id,index,{notes:event.target.value})}/>
        </div>)}
        {ready && <p className="progression-tip"><TrendingUp/> Se la tecnica è rimasta corretta, puoi valutare un aumento del carico nella prossima seduta.</p>}
      </article>})}

      {workout.id === 'd' && <section className="conditioning-list">
        {active.conditioning.map((item, index) => <article className="conditioning-card card" key={item.id}><div className="conditioning-title"><b>{index + 1}</b><select aria-label={`Attività ${index+1}`} value={item.activity} onChange={event => updateConditioning(item.id,'activity',event.target.value as ConditioningActivity)}>{conditioningActivities.map(activity => <option key={activity}>{activity}</option>)}</select><button aria-label={`Completa attività ${index+1}`} className={item.done ? 'done' : 'check'} onClick={() => updateConditioning(item.id,'done',!item.done)}><CircleCheck/></button></div>
          <div className="conditioning-fields"><label>Minuti<input type="number" inputMode="numeric" min="0" placeholder="—" value={item.minutes ?? ''} onChange={event => updateConditioning(item.id,'minutes',event.target.value)}/></label><label>Distanza km<input type="number" inputMode="decimal" min="0" step="0.01" placeholder="—" value={item.distance ?? ''} onChange={event => updateConditioning(item.id,'distance',event.target.value)}/></label><label>Calorie manuali<input type="number" inputMode="numeric" min="0" placeholder="—" value={item.calories ?? ''} onChange={event => updateConditioning(item.id,'calories',event.target.value)}/></label><label>Intensità 1–10<input type="number" inputMode="numeric" min="1" max="10" placeholder="—" value={item.intensity ?? ''} onChange={event => updateConditioning(item.id,'intensity',event.target.value)}/></label></div>
          <textarea placeholder="Note attività" value={item.notes} onChange={event => updateConditioning(item.id,'notes',event.target.value)}/><button className="remove-row" onClick={() => updateActive(draft => ({...draft,conditioning:draft.conditioning.filter(row => row.id !== item.id)}))}>Rimuovi attività</button>
        </article>)}
        <button className="secondary add-activity" onClick={() => updateActive(draft => ({...draft,conditioning:[...draft.conditioning,{id:crypto.randomUUID(),activity:'Ellittica',minutes:null,distance:null,calories:null,intensity:null,notes:'',done:false}]}))}><Plus/> Aggiungi attività</button>
      </section>}

      <section className="card session-notes"><label>RPE sessione (opzionale)<input type="number" min="1" max="10" placeholder="—" value={active.rpe ?? ''} onChange={event => updateActive(draft => ({...draft,rpe:numberOrNull(event.target.value)}))}/></label><label>Note allenamento<textarea placeholder="Sensazioni, tecnica, fastidi…" value={active.notes} onChange={event => updateActive(draft => ({...draft,notes:event.target.value}))}/></label></section>
      <div className="finish"><button className="primary" onClick={finish}>Termina e salva allenamento</button><button className="secondary" onClick={togglePause}>{active.pausedAt ? 'Riprendi allenamento' : 'Metti in pausa'}</button></div>
    </>}
    {detail && <ExerciseModal e={detail} onClose={() => setDetail(undefined)}/>}
  </>;
}
