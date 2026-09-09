import {Download, Upload, Trash2, RotateCcw, SunMoon, WifiOff, CalendarCheck, ShieldCheck} from 'lucide-react';
import {useRef} from 'react';
import {useApp} from '../hooks/useApp';
import {download, exportCsv, MIGRATION_KEY, normalizeBackup} from '../storage/store';
import type {AppData} from '../types';

export default function Settings() {
  const {data, setData, clearAll, resetProgram} = useApp();
  const file = useRef<HTMLInputElement>(null);
  const preference = <K extends keyof AppData['preferences']>(key: K, value: AppData['preferences'][K]) =>
    setData(current => ({...current, preferences: {...current.preferences, [key]: value}}));
  const importData = (selected?: File) => {
    if (!selected) return; const reader = new FileReader();
    reader.onload = () => {try {const parsed: unknown = JSON.parse(String(reader.result)); const migrated = normalizeBackup(parsed); if (!migrated) throw new Error(); setData(migrated); alert('Backup importato correttamente.');} catch {alert('Backup non valido o non compatibile con il programma palestra.')}};
    reader.readAsText(selected);
  };
  const deleteEverything = () => {
    if (!confirm('Prima conferma: cancellare allenamenti, carichi, corpo e impostazioni?')) return;
    if (!confirm('Seconda conferma: questa operazione non può essere annullata senza un backup. Continuare?')) return;
    clearAll();
  };
  const migration = localStorage.getItem(MIGRATION_KEY);
  let removedLegacy = false;
  try {removedLegacy = migration ? JSON.parse(migration).action === 'legacy-data-removed' : false;} catch {removedLegacy = false;}

  return <>
    <header><span className="eyebrow">Personalizza e proteggi i dati</span><h1>Impostazioni</h1></header>
    <section className="settings card">
      <label><span><SunMoon/>Tema</span><select value={data.preferences.theme} onChange={event=>preference('theme',event.target.value as 'light'|'dark')}><option value="light">Chiaro</option><option value="dark">Scuro</option></select></label>
      <label><span>Recupero predefinito</span><select value={data.preferences.rest} onChange={event=>preference('rest',Number(event.target.value))}>{[30,45,60,75,90,120].map(value=><option key={value} value={value}>{value} secondi</option>)}</select></label>
      <label><span>Timer automatico dopo la serie</span><input type="checkbox" checked={data.preferences.autoRest} onChange={event=>preference('autoRest',event.target.checked)}/></label>
      <label><span>Unità</span><select value={data.preferences.unit} onChange={event=>preference('unit',event.target.value as 'metrico'|'imperiale')}><option value="metrico">Metrico</option><option value="imperiale">Imperiale</option></select></label>
    </section>
    <section><div className="section-title"><h2>Sequenza flessibile</h2><span>Nessun giorno fisso</span></div><div className="schedule card"><p><CalendarCheck/> L’app suggerisce A → B → C → D in base all’ultimo allenamento completato. La scelta reale resta sempre tua e viene registrata nel calendario solo quando la confermi.</p></div></section>
    <section><h2>Dati e backup</h2><div className="action-list">
      <button onClick={()=>download('gym-strength-conditioning-backup.json',JSON.stringify(data,null,2),'application/json')}><Download/> Esporta backup JSON</button>
      <button onClick={()=>download('gym-strength-conditioning-dati.csv',exportCsv(data),'text/csv;charset=utf-8')}><Download/> Esporta dati CSV</button>
      <button onClick={()=>file.current?.click()}><Upload/> Importa backup JSON</button><input ref={file} hidden type="file" accept="application/json" onChange={event=>importData(event.target.files?.[0])}/>
      <button onClick={()=>{if(confirm('Reimpostare programma e calendario mantenendo storico, carichi e misure?'))resetProgram()}}><RotateCcw/> Reimposta solo programma</button>
      <button className="danger-action" onClick={deleteEverything}><Trash2/> Cancella tutti i dati</button>
    </div></section>
    <section className="migration card"><ShieldCheck/><div><h3>Schema palestra v4 attivo</h3><p>{removedLegacy ? 'La migrazione ha rimosso lo storico calisthenics incompatibile.' : 'Lo storico palestra compatibile è stato preservato.'} Gli aggiornamenti PWA non cancellano questo archivio.</p></div></section>
    <section className="offline card"><WifiOff/><div><h3>Pronta anche offline</h3><p>Dopo la prima visita, l’app resta disponibile senza connessione. I dati rimangono su questo dispositivo.</p></div></section>
    <section className="card"><h2>Installazione</h2><p>Android: menu del browser → <b>Installa app</b>. iPhone: Condividi → <b>Aggiungi alla schermata Home</b>.</p></section>
  </>;
}
