import {X} from 'lucide-react';
import type {Exercise} from '../types';
import ExerciseArt from './ExerciseArt';

export default function ExerciseModal({e, onClose}: {e: Exercise; onClose: () => void}) {
  return <div className="modal-backdrop" onMouseDown={onClose}>
    <section className="modal" role="dialog" aria-modal="true" aria-label={e.name} onMouseDown={event => event.stopPropagation()}>
      <button className="icon close" onClick={onClose} aria-label="Chiudi"><X/></button>
      <span className="eyebrow">{e.group} · {e.equipment}</span><h2>{e.name}</h2>
      <div className="poses"><ExerciseArt id={e.id} name={e.name}/><ExerciseArt id={e.id} name={e.name} pose={1}/></div>
      <div className="position-notes"><p><b>01 · Posizione iniziale</b>{e.startPosition}</p><p><b>02 · Posizione finale</b>{e.endPosition}</p></div>
      <h3>Esecuzione</h3><ol>{e.steps.map((step, index) => <li key={`${e.id}-${index}`}>{step}</li>)}</ol>
      <div className="detail-grid">
        <div><b>Respirazione</b><p>{e.breathing}</p></div>
        <div><b>Errori comuni</b><p>{e.mistakes}</p></div>
        <div><b>Muscoli coinvolti</b><p>{e.muscles}</p></div>
        <div><b>Regolazione base</b><p>{e.machineSetup}</p></div>
      </div>
      <p className="warning"><b>Sicurezza</b><br/>{e.safety}</p>
      <small className="photo-credit">Schema tecnico locale in SVG · nessuna immagine o dipendenza esterna.</small>
    </section>
  </div>;
}
