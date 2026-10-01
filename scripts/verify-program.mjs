import {existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import assert from 'node:assert/strict';

const root=process.cwd();
const defaults=readFileSync(join(root,'src/data/defaults.ts'),'utf8');
const store=readFileSync(join(root,'src/storage/store.ts'),'utf8');
const today=readFileSync(join(root,'src/pages/Today.tsx'),'utf8');
const nav=readFileSync(join(root,'src/components/Nav.tsx'),'utf8');
const progress=readFileSync(join(root,'src/pages/Progress.tsx'),'utf8');

for(const id of ['a','b','c','e'])assert(defaults.includes(`id:'${id}'`),`Scheda ${id.toUpperCase()} mancante`);
assert(!defaults.includes("id:'d'"),'La quarta seduta di forza non deve essere nel nuovo programma');
assert(!defaults.includes('supersetPosition'),'Il nuovo programma non deve contenere superserie');
assert(!/row\([^\n]*barbell|row\([^\n]*bilanciere/i.test(defaults),'Il programma contiene un esercizio obbligatorio con bilanciere');
for(const id of ['chest-press','seated-row','shoulder-press','lat-machine','leg-press','glute-drive-machine','iso-lateral-row-machine','pendulum-squat-machine'])assert(defaults.includes(`row('${id}'`),`Manca ${id}`);
assert(store.includes('calisthenics-progress-gym-v7'),'Chiave dati v7 mancante');
assert(store.includes("'calisthenics-progress-gym-v6'"),'Migrazione v6 mancante');
assert(today.includes('Timer automatico dopo ogni serie'),'Timer serie mancante');
assert(!today.includes('renderSuperset'),'La UI contiene ancora blocchi superserie');
assert(!nav.includes('calendar'),'Il calendario è ancora nella navigazione');
for(const view of ['forza','sedute','conditioning'])assert(progress.includes(`tab==='${view}'`),`Vista progressi ${view} mancante`);

for(const id of ['converging-chest-press','iso-lateral-row-machine','neutral-grip-pulldown','cable-front-raise','pendulum-squat-machine','single-leg-press','glute-drive-machine','kneeling-cable-crunch']){
  for(const pose of [0,1])assert(existsSync(join(root,`public/illustrations-v3/${id}-${pose}.webp`)),`Illustrazione mancante: ${id}-${pose}`);
}

console.log('Tre sedute, conditioning, progressi, migrazione e nuove illustrazioni: OK');
