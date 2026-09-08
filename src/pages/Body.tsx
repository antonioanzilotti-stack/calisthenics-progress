import {useMemo, useState} from 'react';
import {Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {Pencil, Plus, Trash2} from 'lucide-react';
import {useApp} from '../hooks/useApp';
import {localIso} from '../utils/trainingPlan';

type Form = {date: string; weight: string; waist: string; chest: string; arm: string; thigh: string};
const emptyForm = (): Form => ({date: localIso(), weight: '', waist: '', chest: '', arm: '', thigh: ''});
const numberOrNull = (value: string) => value.trim() === '' ? null : Number(value);

export default function Body() {
  const {data, setData} = useApp();
  const [form, setForm] = useState<Form>(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const records = useMemo(() => [...data.bodyRecords].sort((a, b) => b.date.localeCompare(a.date)), [data.bodyRecords]);
  const chart = [...records].reverse().filter(record => record.weight !== null).map(record => ({date: record.date.slice(5), peso: record.weight}));
  const update = (key: keyof Form, value: string) => setForm(current => ({...current, [key]: value}));
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const record = {
      id: editing || crypto.randomUUID(), date: form.date, weight: numberOrNull(form.weight), waist: numberOrNull(form.waist),
      chest: numberOrNull(form.chest), arm: numberOrNull(form.arm), thigh: numberOrNull(form.thigh),
    };
    if ([record.weight, record.waist, record.chest, record.arm, record.thigh].every(value => value === null)) {
      alert('Inserisci almeno un valore.'); return;
    }
    setData(current => ({...current, bodyRecords: [...current.bodyRecords.filter(item => item.id !== editing), record]}));
    setEditing(null); setForm(emptyForm());
  };
  const edit = (id: string) => {
    const record = data.bodyRecords.find(item => item.id === id); if (!record) return;
    setEditing(id); setForm({date: record.date, weight: record.weight?.toString() || '', waist: record.waist?.toString() || '',
      chest: record.chest?.toString() || '', arm: record.arm?.toString() || '', thigh: record.thigh?.toString() || ''});
    window.scrollTo({top: 0, behavior: 'smooth'});
  };
  const remove = (id: string) => {
    if (confirm('Eliminare questa rilevazione?')) setData(current => ({...current, bodyRecords: current.bodyRecords.filter(item => item.id !== id)}));
  };

  return <>
    <header><span className="eyebrow">Dati separati dai carichi</span><h1>Corpo</h1><p className="lede">Registra solo ciò che misuri davvero. Tutti i campi sono opzionali.</p></header>
    <form className="card body-form" onSubmit={submit}>
      <div className="section-title"><h2>{editing ? 'Modifica rilevazione' : 'Nuova rilevazione'}</h2><span>{form.date}</span></div>
      <label className="date-field">Data<input type="date" value={form.date} onChange={event => update('date', event.target.value)} required/></label>
      <label className="metric-main">Peso corporeo <span><input inputMode="decimal" type="number" min="20" max="400" step="0.1" value={form.weight} onChange={event => update('weight', event.target.value)} placeholder="—"/> kg</span></label>
      <h3>Misure opzionali</h3><div className="measurement-grid">
        {([['waist','Girovita'],['chest','Torace'],['arm','Braccio'],['thigh','Coscia']] as [keyof Form,string][]).map(([key,label]) => <label key={key}>{label}<span><input inputMode="decimal" type="number" min="10" max="300" step="0.1" value={form[key]} onChange={event => update(key, event.target.value)} placeholder="—"/> cm</span></label>)}
      </div>
      <button className="primary" type="submit"><Plus/> {editing ? 'Salva modifiche' : 'Aggiungi rilevazione'}</button>
      {editing && <button className="secondary" type="button" onClick={() => {setEditing(null);setForm(emptyForm())}}>Annulla</button>}
    </form>
    <section className="card chart body-chart"><h2>Peso nel tempo</h2>{chart.length ? <ResponsiveContainer width="100%" height={210}><LineChart data={chart}><XAxis dataKey="date"/><YAxis domain={['dataMin - 2','dataMax + 2']}/><Tooltip/><Line dataKey="peso" stroke="var(--accent)" strokeWidth={3}/></LineChart></ResponsiveContainer> : <p className="empty">Nessun dato registrato.</p>}</section>
    <section><div className="section-title"><h2>Storico misure</h2><span>{records.length} rilevazioni</span></div>
      {records.length ? <div className="body-history">{records.map(record => <article className="card body-record" key={record.id}><div><b>{new Date(record.date + 'T12:00').toLocaleDateString('it-IT')}</b><strong>{record.weight !== null ? `${record.weight} kg` : 'Peso non inserito'}</strong><small>Vita {record.waist ?? '—'} · Torace {record.chest ?? '—'} · Braccio {record.arm ?? '—'} · Coscia {record.thigh ?? '—'} cm</small></div><div><button className="icon" onClick={() => edit(record.id)} aria-label="Modifica"><Pencil/></button><button className="icon danger" onClick={() => remove(record.id)} aria-label="Elimina"><Trash2/></button></div></article>)}</div> : <p className="empty card">Nessun dato registrato.</p>}
    </section>
  </>;
}
