import {useEffect, useMemo, useState} from 'react';
import {ArrowDown, ArrowUp, CircleCheck, Clock3, Pause, Play, Plus, Repeat2, RotateCcw, SkipForward, TrendingUp, X} from 'lucide-react';
import {useApp} from '../hooks/useApp';
import {conditioningActivities, defaultConditioning, emptyLogs, emptySet} from '../data/defaults';
import {exercises, getExercise} from '../data/exercises';
import {canProgress, getProgramInfo, getSuggestedWorkoutId, isCompleted, isRecordedTraining, localIso, sessionCompletion, sessionVolume} from '../utils/trainingPlan';
import ExerciseArt from '../components/ExerciseArt';
import ExerciseModal from '../components/ExerciseModal';
import type {ActiveSession, ConditioningActivity, Exercise, Session, SetLog, Workout, WorkoutExercise} from '../types';

const numberOrNull = (value: string) => value === '' ? null : Number(value);
const activityExerciseIds: Record<ConditioningActivity, string> = {
  'Camminata':'walk', 'Camminata inclinata':'incline-walk', 'Vogatore':'rower', 'Cyclette':'bike',
  'Ellittica':'elliptical', 'Stair Climber':'stair-climber', 'Boxe':'boxing', 'Corda':'jump-rope',
};

const compatibleExerciseIds: Record<string, string[]> = {
  bike: ['rower', 'walk'],
  'chest-press': ['cable-chest-fly', 'pec-deck'],
  'pec-deck': ['cable-chest-fly', 'chest-press'],
  'cable-chest-fly': ['chest-press', 'pec-deck'],
  'shoulder-press': ['lateral-raise', 'lateral-cable'],
  'lateral-raise': ['lateral-cable', 'shoulder-press'],
  'lateral-cable': ['lateral-raise', 'shoulder-press'],
  'triceps-pushdown': ['triceps-extension-machine', 'chest-press', 'shoulder-press'],
  'triceps-extension-machine': ['triceps-pushdown'],
  crunch: ['plank', 'dead-bug', 'bird-dog', 'pallof-press'],
  plank: ['dead-bug', 'bird-dog', 'crunch'],
  rower: ['bike', 'walk', 'incline-walk'],
  'lat-machine': ['assisted-pull-up', 'seated-row', 'pullover-cable'],
  'assisted-pull-up': ['lat-machine', 'pullover-cable'],
  'seated-row': ['assisted-pull-up', 'lat-machine', 'reverse-pec-deck'],
  'pullover-cable': ['assisted-pull-up', 'lat-machine', 'seated-row'],
  'reverse-pec-deck': ['seated-row', 'lateral-cable'],
  'curl-cable': ['curl-machine'],
  'bird-dog': ['dead-bug', 'plank', 'crunch'],
  'dead-bug': ['bird-dog', 'plank', 'crunch'],
  'leg-press': ['leg-extension', 'glute-machine'],
  'leg-curl': ['back-extension', 'hip-thrust'],
  'leg-extension': ['hack-squat', 'leg-press'],
  'hack-squat': ['leg-press', 'leg-extension'],
  woodchopper: ['pallof-press', 'crunch', 'bird-dog'],
};

function resolvedExercises(workout: Workout, substitutions: Record<string, string>): WorkoutExercise[] {
  return workout.exercises.map(item => {
    const replacement = substitutions[item.exerciseId];
    return {...item, baseExerciseId: item.exerciseId, exerciseId: replacement && exercises.some(exercise => exercise.id === replacement) ? replacement : item.exerciseId};
  });
}

export default function Today() {
  const {data, setData} = useApp();
  const today = localIso();
  const existing = data.sessions.find(session => session.date === today);
  const active = data.activeSession?.date === today ? data.activeSession : null;
  const explicitChoice = data.plannedDates[today];
  const suggestedId = getSuggestedWorkoutId(data);
  const recordedToday = Boolean(existing && isRecordedTraining(existing.status));
  const chosenId = active?.workoutId || (recordedToday ? existing?.workoutId : explicitChoice !== 'riposo' ? explicitChoice : undefined);
  const workout = data.workouts.find(item => item.id === chosenId);
  const suggestedWorkout = data.workouts.find(item => item.id === suggestedId)!;
  const [chooserOpen, setChooserOpen] = useState(!chosenId && explicitChoice !== 'riposo');
  const [detail, setDetail] = useState<Exercise>();
  const [replacement, setReplacement] = useState<{index:number;nextId:string;future:boolean} | null>(null);
  const [rest, setRest] = useState(0);
  const [restPaused, setRestPaused] = useState(false);
  const [, setTick] = useState(0);
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
    const completedDates = new Set(thisWeek.filter(session => isCompleted(session.status)).map(session => session.date));
    const decidedDates = new Set([
      ...Object.entries(data.plannedDates).filter(([date, choice]) => date >= weekStart && date <= today && choice !== 'riposo').map(([date]) => date),
      ...thisWeek.filter(session => session.status !== 'riposo').map(session => session.date),
    ]);
    const last = [...data.sessions].filter(session => isRecordedTraining(session.status)).sort((a, b) => b.date.localeCompare(a.date))[0];
    const body = [...data.bodyRecords].filter(item => item.weight !== null).sort((a, b) => b.date.localeCompare(a.date))[0];
    const improvements = data.sessions.filter(session => session.date >= weekStart).reduce((sum, session) =>
      sum + Object.keys(session.logs).filter(id => getExercise(id)?.loaded && canProgress(session, id, data)).length, 0);
    return {
      sessions: completedDates.size,
      adherence: decidedDates.size ? `${Math.round(completedDates.size / decidedDates.size * 100)}%` : '—',
      minutes: thisWeek.reduce((sum, session) => sum + session.duration, 0),
      volume: Math.round(thisWeek.reduce((sum, session) => sum + sessionVolume(session), 0)),
      last, body, improvements,
    };
  }, [data, today]);

  const updateActive = (update: (draft: ActiveSession) => ActiveSession) => setData(current =>
    current.activeSession ? {...current, activeSession: update(current.activeSession)} : current);

  const choose = (choice: Workout['id'] | 'riposo') => {
    if (active || recordedToday) return;
    setData(current => ({
      ...current,
      plannedDates: {...current.plannedDates, [today]: choice},
      sessions: current.sessions.filter(session => session.date !== today || !['programmato','saltato'].includes(session.status)),
    }));
    setChooserOpen(false);
  };

  const begin = () => {
    if (!workout) return;
    const fromExisting = existing?.workoutId === workout.id ? existing : undefined;
    const sessionExercises = fromExisting?.exercises?.length ? fromExisting.exercises : resolvedExercises(workout, data.preferredSubstitutions);
    setData(current => ({
      ...current,
      plannedDates: {...current.plannedDates, [today]: workout.id},
      activeSession: {
        date: today, workoutId: workout.id, startedAt: Date.now(), pausedAt: null, pausedMs: 0,
        exercises: sessionExercises,
        logs: workout.id === 'd' ? {} : (fromExisting && Object.keys(fromExisting.logs).length ? fromExisting.logs : emptyLogs(sessionExercises)),
        conditioning: workout.id === 'd' ? (fromExisting?.conditioning.length ? fromExisting.conditioning : defaultConditioning()) : [],
        notes: fromExisting?.notes || '', rpe: fromExisting?.rpe || null,
      },
    }));
  };

  const togglePause = () => updateActive(draft => draft.pausedAt
    ? {...draft, pausedMs: draft.pausedMs + Date.now() - draft.pausedAt, pausedAt: null}
    : {...draft, pausedAt: Date.now()});

  const changeSet = (exerciseId: string, index: number, change: Partial<SetLog>) => updateActive(draft => ({...draft,
    logs: {...draft.logs, [exerciseId]: (draft.logs[exerciseId] || []).map((set, setIndex) => setIndex === index ? {...set, ...change} : set)},
  }));

  const toggleSet = (exerciseId: string, index: number, restSeconds: number) => {
    const set = active?.logs[exerciseId]?.[index]; if (!set) return;
    changeSet(exerciseId, index, {done: !set.done});
    if (!set.done && data.preferences.autoRest && restSeconds) {setRest(restSeconds); setRestPaused(false);}
  };

  const applyReplacement = () => {
    if (!active || !replacement) return;
    setData(current => {
      const currentActive = current.activeSession;
      if (!currentActive) return current;
      const item = currentActive.exercises[replacement.index];
      if (!item || item.exerciseId === replacement.nextId) return current;
      const baseId = item.baseExerciseId || item.exerciseId;
      const exercisesForSession = currentActive.exercises.map((row, index) => index === replacement.index ? {...row, exerciseId: replacement.nextId, baseExerciseId: baseId} : row);
      const logs = {...currentActive.logs, [replacement.nextId]: currentActive.logs[replacement.nextId] || Array.from({length:item.sets}, emptySet)};
      if (!exercisesForSession.some((row, index) => index !== replacement.index && row.exerciseId === item.exerciseId)) delete logs[item.exerciseId];
      return {
        ...current,
        preferredSubstitutions: replacement.future ? {...current.preferredSubstitutions, [baseId]: replacement.nextId} : current.preferredSubstitutions,
        activeSession: {...currentActive, exercises: exercisesForSession, logs},
      };
    });
    setReplacement(null);
  };

  const finish = () => {
    if (!active) return;
    const completion = sessionCompletion(active);
    const session: Session = {
      id: existing?.id || crypto.randomUUID(), date: today, workoutId: active.workoutId,
      status: completion.percent === 100 ? 'completato' : 'parziale', duration: Math.max(1, Math.round(elapsedSeconds / 60)),
      notes: active.notes, rpe: active.rpe, logs: active.logs, conditioning: active.conditioning, exercises: active.exercises,
    };
    setData(current => ({...current, plannedDates:{...current.plannedDates,[today]:active.workoutId}, sessions: [...current.sessions.filter(item => item.date !== today), session], activeSession: null}));
  };

  const skip = () => {
    if (!workout) return;
    const reason = prompt('Motivo (tempo, stanchezza, dolore, lavoro, viaggio, altro):', 'mancanza di tempo');
    if (reason === null) return;
    const session: Session = {id: existing?.id || crypto.randomUUID(), date: today, workoutId: workout.id, status: 'saltato', duration: 0,
      notes: '', rpe: null, reason, logs: {}, conditioning: [], exercises: resolvedExercises(workout, data.preferredSubstitutions)};
    setData(current => ({...current, plannedDates:{...current.plannedDates,[today]:workout.id}, sessions: [...current.sessions.filter(item => item.date !== today), session], activeSession: null}));
  };

  const move = () => {
    if (!workout) return;
    const destination = prompt('Nuova data (AAAA-MM-GG):', localIso(new Date(Date.now() + 86400000)));
    if (!destination || !/^\d{4}-\d{2}-\d{2}$/.test(destination)) return;
    setData(current => {const plannedDates = {...current.plannedDates, [destination]: workout.id}; delete plannedDates[today]; return {...current, plannedDates};});
  };

  const updateConditioning = (id: string, field: string, value: string | boolean) => updateActive(draft => ({...draft,
    conditioning: draft.conditioning.map(item => item.id === id ? {...item, [field]: typeof value === 'boolean' ? value : field === 'activity' || field === 'notes' ? value : numberOrNull(value)} : item),
  }));

  const moveConditioning = (index: number, direction: -1 | 1) => updateActive(draft => {
    const destination = index + direction;
    if (destination < 0 || destination >= draft.conditioning.length) return draft;
    const conditioning = [...draft.conditioning];
    [conditioning[index], conditioning[destination]] = [conditioning[destination], conditioning[index]];
    return {...draft, conditioning};
  });

  const lastPerformance = (exerciseId: string) => {
    const previous = [...data.sessions].sort((a,b) => b.date.localeCompare(a.date)).find(session =>
      (session.logs[exerciseId] || []).some(set => set.done && set.weight !== null && set.reps !== null));
    if (!previous) return null;
    const best = (previous.logs[exerciseId] || []).filter(set => set.done && set.weight !== null && set.reps !== null).sort((a,b) => (b.weight || 0) - (a.weight || 0))[0];
    return best ? `Ultima volta: ${best.weight} kg × ${best.reps}` : null;
  };

  return <>
    <header><span className="eyebrow">{new Intl.DateTimeFormat('it-IT', {weekday:'long', day:'numeric', month:'long'}).format(new Date())}</span><h1>{active ? 'Allenamento in corso' : 'Oggi'}</h1><p className="lede">Forza, conditioning e costanza. Il suggerimento guida la sequenza, la scelta resta sempre tua.</p></header>

    {!active && <>
      <section className="phase-card card"><TrendingUp/><div><span className="eyebrow">Settimana {phase.displayWeek} di 6 · {phase.phase}</span><h3>RIR target {phase.rirTarget}</h3><p>{phase.objective}</p></div></section>
      <section className="dashboard-grid">
        <article><b>{dashboard.sessions || '—'}</b><span>Completati settimana</span></article>
        <article><b>{dashboard.adherence}</b><span>Aderenza sulle scelte</span></article>
        <article><b>{dashboard.minutes || '—'}</b><span>Minuti totali</span></article>
        <article><b>{dashboard.volume ? `${dashboard.volume} kg` : '—'}</b><span>Volume totale</span></article>
      </section>
      <section className="card dashboard-detail">
        <div><small>Ultima sessione reale</small><b>{dashboard.last ? `${data.workouts.find(item => item.id === dashboard.last?.workoutId)?.short} · ${dashboard.last.date}` : 'Nessun dato registrato.'}</b></div>
        <div><small>Prossimo suggerimento</small><b>{suggestedWorkout.short} · {suggestedWorkout.name}</b></div>
        <div><small>Ultimo peso corporeo</small><b>{dashboard.body ? `${dashboard.body.weight} kg` : 'Nessun dato registrato.'}</b></div>
        <div><small>Miglioramenti recenti</small><b>{dashboard.improvements ? `${dashboard.improvements} range completati` : 'Nessun dato registrato.'}</b></div>
      </section>
      <section className="suggested-workout card"><div><span className="eyebrow">Allenamento suggerito oggi</span><h2>{suggestedWorkout.short} — {suggestedWorkout.name}</h2><p>Deriva dall’ultimo allenamento completato. Non è un vincolo e non crea una voce nel calendario.</p></div><span className="pill suggerito">Consigliato</span></section>
      {!recordedToday && <button className="primary choose-workout" onClick={() => setChooserOpen(value => !value)}><Repeat2/> Scegli allenamento</button>}
      {chooserOpen && !recordedToday && <section className="workout-chooser card"><div className="section-title"><h2>Scegli liberamente</h2><button className="icon" onClick={() => setChooserOpen(false)} aria-label="Chiudi scelta"><X/></button></div><div className="workout-choice-grid">{data.workouts.map(item => <button key={item.id} onClick={() => choose(item.id)} className={item.id === suggestedId ? 'recommended' : ''}><b>{item.short}</b><span>{item.name}</span>{item.id === suggestedId && <small>Consigliato</small>}</button>)}<button className="rest-choice" onClick={() => choose('riposo')}><b>Riposo</b><span>Registra recupero</span></button></div></section>}

      {explicitChoice === 'riposo' && !recordedToday ? <section className="rest-day card"><span className="pill riposo">Riposo</span><h2>Oggi hai scelto Riposo</h2><p>È registrato nel calendario e non riduce l’aderenza.</p><button className="secondary" onClick={() => setChooserOpen(true)}>Cambia scelta</button></section> : workout ? <>
        <section className="hero card">
          <div><span className={`pill ${existing?.status || 'selezionato'}`}>{existing?.status || 'Selezionato'}</span><h2>Allenamento di oggi: {workout.short}</h2><p>{workout.name} · {workout.focus}</p></div>
          <strong>{workout.duration.split(' ')[0]}<small> min</small></strong>
          <div className="selection-context"><small>Allenamento suggerito</small><b>{suggestedWorkout.short} — {suggestedWorkout.name}</b></div>
          <div className="hero-actions"><button className="primary" onClick={begin}><Play/> {existing && isRecordedTraining(existing.status) ? 'Apri sessione' : 'Inizia allenamento'}</button>{!recordedToday && <><button className="secondary" onClick={() => setChooserOpen(true)}><Repeat2/> Cambia</button><button className="secondary" onClick={skip}><SkipForward/> Segna saltato</button><button className="secondary" onClick={move}><Clock3/> Sposta</button></>}</div>
        </section>
        <section><div className="section-title"><h2>La sessione</h2><span>{workout.exercises.length} esercizi</span></div>{workout.exercises.map((item,index) => {const exercise = getExercise(item.exerciseId);return <article className="exercise-row" key={`${exercise.id}-${index}`}><ExerciseArt id={exercise.id} name={exercise.name}/><div><h3>{exercise.name}</h3><p>{item.sets} serie · {item.reps ? `${item.reps} rip.` : `${item.seconds} sec.`} · recupero {item.rest || '—'}s</p><button className="text-btn" onClick={() => setDetail(exercise)}>Tecnica e regolazione</button></div></article>})}</section>
      </> : <section className="neutral-day card"><h2>Nessun allenamento selezionato</h2><p>Finché non scegli, oggi resta neutro: nessun “saltato” e nessun effetto sull’aderenza.</p></section>}
    </>}

    {active && workout && <>
      <section className="workout-head card"><div className="ring" style={{'--pct': `${progress.percent * 3.6}deg`} as React.CSSProperties}><b>{progress.percent}%</b></div><div><span className="eyebrow">{active.pausedAt ? 'In pausa' : 'Sessione attiva'}</span><h2>{workout.short} · {workout.name}</h2><p>{progress.done} di {progress.total} elementi · {Math.floor(elapsedSeconds/60)}:{String(elapsedSeconds%60).padStart(2,'0')}</p></div><button className="icon timer-pause" onClick={togglePause} aria-label={active.pausedAt ? 'Riprendi' : 'Pausa'}>{active.pausedAt ? <Play/> : <Pause/>}</button></section>
      {rest > 0 && <aside className="rest"><RotateCcw/><div><small>RECUPERO</small><b>{Math.floor(rest/60)}:{String(rest%60).padStart(2,'0')}</b></div><button className="icon" onClick={() => setRestPaused(value => !value)}>{restPaused ? <Play/> : <Pause/>}</button><button className="icon" onClick={() => setRest(0)}><X/></button></aside>}
      <div className="timer-controls"><div className="quick-rest"><span>Timer</span>{[30,45,60,75,90,120].map(seconds => <button onClick={() => {setRest(seconds);setRestPaused(false)}} key={seconds}>{seconds}s</button>)}</div><label className="auto-rest-toggle"><input type="checkbox" checked={data.preferences.autoRest} onChange={event => setData(current => ({...current,preferences:{...current.preferences,autoRest:event.target.checked}}))}/><span>Avvio automatico al completamento serie</span></label></div>

      {workout.id !== 'd' && active.exercises.map((item, itemIndex) => {const exercise = getExercise(item.exerciseId);const sets = active.logs[exercise.id] || [];const ready = canProgress({...active,id:'active',status:'parziale',duration:0} as Session, exercise.id, data);const previous = lastPerformance(exercise.id);const compatibleIds = compatibleExerciseIds[item.baseExerciseId || exercise.id] || compatibleExerciseIds[exercise.id] || [];const alternatives = compatibleIds.map(getExercise).filter(candidate => candidate && candidate.id !== exercise.id && !active.exercises.some((row,index) => index !== itemIndex && row.exerciseId === candidate.id));return <article className="set-card card" key={`${item.baseExerciseId || item.exerciseId}-${itemIndex}`}>
        <div className="session-exercise-head"><ExerciseArt id={exercise.id} name={exercise.name}/><div><span className="eyebrow">{exercise.group}</span><h2>{exercise.name}</h2><p>{item.reps ? `${item.reps} ripetizioni` : `${item.seconds} secondi`} · recupero {item.rest || '—'}s</p>{previous && <small className="last-performance">{previous}</small>}<div className="exercise-actions"><button className="text-btn" onClick={() => setDetail(exercise)}>Come si esegue</button><button className="text-btn" disabled={!alternatives.length} onClick={() => alternatives[0] && setReplacement({index:itemIndex,nextId:alternatives[0].id,future:false})}>Sostituisci</button></div></div></div>
        {replacement?.index === itemIndex && <div className="replacement-panel"><label>Alternativa compatibile<select value={replacement.nextId} onChange={event => setReplacement({...replacement,nextId:event.target.value})}>{alternatives.map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.name} · {candidate.equipment}</option>)}</select></label><label className="future-replacement"><input type="checkbox" checked={replacement.future} onChange={event => setReplacement({...replacement,future:event.target.checked})}/> Usa questa sostituzione anche in futuro</label><div><button className="primary" onClick={applyReplacement}>Applica</button><button className="secondary" onClick={() => setReplacement(null)}>Annulla</button></div></div>}
        <div className={`set-grid-head ${exercise.loaded ? 'has-weight' : 'no-weight'} ${exercise.kind === 'strength' ? 'has-rir' : 'no-rir'}`}><span>Serie</span>{exercise.loaded && <span>Peso kg</span>}<span>{item.seconds ? 'Secondi' : 'Ripet.'}</span>{exercise.kind === 'strength' && <span>RIR</span>}<span>Fatto</span></div>
        {sets.map((set, index) => <div className={`gym-set ${exercise.loaded ? 'has-weight' : 'no-weight'} ${exercise.kind === 'strength' ? 'has-rir' : 'no-rir'}`} key={index}><b>{index + 1}</b>
          {exercise.loaded && <input aria-label={`Peso serie ${index+1}`} inputMode="decimal" type="number" min="0" step="0.5" placeholder="—" value={set.weight ?? ''} onChange={event => changeSet(exercise.id,index,{weight:numberOrNull(event.target.value)})}/>}
          <input aria-label={`Valore serie ${index+1}`} inputMode="numeric" type="number" min="0" placeholder="—" value={(item.seconds ? set.seconds : set.reps) ?? ''} onChange={event => changeSet(exercise.id,index,item.seconds ? {seconds:numberOrNull(event.target.value)} : {reps:numberOrNull(event.target.value)})}/>
          {exercise.kind === 'strength' && <input aria-label={`RIR serie ${index+1}`} inputMode="numeric" type="number" min="0" max="10" placeholder="—" value={set.rir ?? ''} onChange={event => changeSet(exercise.id,index,{rir:numberOrNull(event.target.value)})}/>}
          <button className={set.done ? 'done' : 'check'} onClick={() => toggleSet(exercise.id,index,item.rest)} aria-label={`Completa serie ${index+1}`}><CircleCheck/></button>
          <input className="set-note" aria-label={`Note serie ${index+1}`} placeholder="Nota opzionale sulla serie" value={set.notes} onChange={event => changeSet(exercise.id,index,{notes:event.target.value})}/>
        </div>)}
        {ready && <p className="progression-tip"><TrendingUp/> Range completato. Valuta un piccolo aumento del carico nella prossima sessione.</p>}
      </article>})}

      {workout.id === 'd' && <section className="conditioning-list">
        {active.conditioning.map((item, index) => {const exercise = getExercise(activityExerciseIds[item.activity]);return <article className="conditioning-card card" key={item.id}><div className="conditioning-visual"><ExerciseArt id={exercise.id} name={exercise.name}/><div><span className="eyebrow">Attività {index + 1}</span><h2>{item.activity}</h2><button className="text-btn" onClick={() => setDetail(exercise)}>Come si esegue</button></div></div><div className="conditioning-title"><div className="reorder-buttons"><button className="icon" disabled={index===0} onClick={() => moveConditioning(index,-1)} aria-label={`Sposta ${item.activity} su`}><ArrowUp/></button><button className="icon" disabled={index===active.conditioning.length-1} onClick={() => moveConditioning(index,1)} aria-label={`Sposta ${item.activity} giù`}><ArrowDown/></button></div><select aria-label={`Attività ${index+1}`} value={item.activity} onChange={event => updateConditioning(item.id,'activity',event.target.value as ConditioningActivity)}>{conditioningActivities.map(activity => <option key={activity}>{activity}</option>)}</select><button aria-label={`Completa attività ${index+1}`} className={item.done ? 'done' : 'check'} onClick={() => updateConditioning(item.id,'done',!item.done)}><CircleCheck/></button></div>
          <div className="conditioning-fields"><label>Minuti<input type="number" inputMode="numeric" min="0" placeholder="—" value={item.minutes ?? ''} onChange={event => updateConditioning(item.id,'minutes',event.target.value)}/></label><label>Distanza km<input type="number" inputMode="decimal" min="0" step="0.01" placeholder="—" value={item.distance ?? ''} onChange={event => updateConditioning(item.id,'distance',event.target.value)}/></label><label>Calorie manuali<input type="number" inputMode="numeric" min="0" placeholder="—" value={item.calories ?? ''} onChange={event => updateConditioning(item.id,'calories',event.target.value)}/></label><label>Intensità 1–10<input type="number" inputMode="numeric" min="1" max="10" placeholder="—" value={item.intensity ?? ''} onChange={event => updateConditioning(item.id,'intensity',event.target.value)}/></label></div>
          <textarea placeholder="Note attività" value={item.notes} onChange={event => updateConditioning(item.id,'notes',event.target.value)}/><button className="remove-row" onClick={() => updateActive(draft => ({...draft,conditioning:draft.conditioning.filter(row => row.id !== item.id)}))}>Rimuovi attività</button>
        </article>})}
        <button className="secondary add-activity" onClick={() => updateActive(draft => ({...draft,conditioning:[...draft.conditioning,{id:crypto.randomUUID(),activity:'Cyclette',minutes:null,distance:null,calories:null,intensity:null,notes:'',done:false}]}))}><Plus/> Aggiungi attività</button>
      </section>}

      <section className="card session-notes"><label>RPE sessione (opzionale)<input inputMode="numeric" type="number" min="1" max="10" placeholder="—" value={active.rpe ?? ''} onChange={event => updateActive(draft => ({...draft,rpe:numberOrNull(event.target.value)}))}/></label><label>Note allenamento<textarea placeholder="Sensazioni, tecnica, fastidi…" value={active.notes} onChange={event => updateActive(draft => ({...draft,notes:event.target.value}))}/></label></section>
      <div className="finish"><button className="primary" onClick={finish}>Termina e salva allenamento</button><button className="secondary" onClick={togglePause}>{active.pausedAt ? 'Riprendi allenamento' : 'Metti in pausa'}</button></div>
    </>}
    {detail && <ExerciseModal e={detail} onClose={() => setDetail(undefined)}/>}
  </>;
}
