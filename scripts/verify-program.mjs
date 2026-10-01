import {existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import assert from 'node:assert/strict';

const root=process.cwd();
const read=path=>readFileSync(join(root,path),'utf8');
const defaults=read('src/data/defaults.ts');
const exercises=read('src/data/exercises.ts');
const store=read('src/storage/store.ts');
const today=read('src/pages/Today.tsx');
const nav=read('src/components/Nav.tsx');
const progress=read('src/pages/Progress.tsx');
const training=read('src/utils/trainingPlan.ts');

for(const id of ['a','b','c','e'])assert(defaults.includes(`id:'${id}'`),`Scheda ${id.toUpperCase()} mancante`);
assert(!defaults.includes("id:'d'"),'La quarta seduta di forza non deve essere nel programma');
assert(defaults.includes("name:'Upper Body 1 · Spinta'"),'Nome o struttura della scheda A errati');
assert(defaults.includes("name:'Lower Body + Core'"),'Nome o struttura della scheda B errati');
assert(defaults.includes("name:'Upper Body 2 · Tirata'"),'Nome o struttura della scheda C errati');
for(const id of ['chest-press','seated-row','shoulder-press','lat-machine','lateral-cable','triceps-pushdown','leg-press','seated-leg-curl','leg-extension','glute-drive-machine','calf-machine','front-plank','incline-chest-press','iso-lateral-row-machine','neutral-grip-pulldown','converging-chest-press','reverse-pec-deck','curl-cable'])assert(defaults.includes(`row('${id}'`),`Esercizio di base mancante: ${id}`);
assert(!defaults.includes("row('pendulum-squat-machine'"),'La scheda C contiene ancora un esercizio gambe');
assert(!defaults.includes("row('lying-leg-curl'"),'La scheda C contiene ancora un esercizio femorali');
assert(!defaults.includes('supersetPosition'),'Il nuovo programma non deve contenere superserie');
assert(!/row\([^\n]*barbell|row\([^\n]*bilanciere/i.test(defaults),'Il programma contiene un esercizio obbligatorio con bilanciere');

assert(store.includes('calisthenics-progress-gym-v8'),'Chiave dati v8 mancante');
assert(store.includes("'calisthenics-progress-gym-v7'"),'Migrazione v7 mancante');
assert(today.includes('replacementPools'),'Sostituzioni curate mancanti');
assert(today.includes('aumento del 2,5–5%'),'Suggerimento di doppia progressione mancante');
assert(training.includes('set.rir>=2'),'La progressione non verifica almeno 2 RIR');
assert(training.includes("cycleWeek===6?'Scarico'"),'Settimana di scarico mancante');
assert(today.includes('Timer automatico dopo ogni serie'),'Timer serie mancante');
assert(!today.includes('renderSuperset'),'La UI contiene ancora blocchi superserie');
assert(!nav.includes('calendar'),'Il calendario è ancora nella navigazione');
assert(!existsSync(join(root,'src/pages/Calendar.tsx')),'La pagina Calendario esiste ancora');
for(const view of ['forza','sedute','conditioning'])assert(progress.includes(`tab==='${view}'`),`Vista progressi ${view} mancante`);

const exerciseLines=exercises.split(/\r?\n/).filter(line=>line.trim().startsWith("{id:'"));
for(const line of exerciseLines){
  const id=line.match(/id:'([^']+)'/)?.[1];
  if(!id||line.includes('visualVerified:false'))continue;
  for(const pose of [0,1])assert(existsSync(join(root,`public/illustrations-v3/${id}-${pose}.webp`)),`Illustrazione mancante: ${id}-${pose}`);
}

console.log('Upper/Lower/Upper, progressione, migrazione, PWA e illustrazioni: OK');
