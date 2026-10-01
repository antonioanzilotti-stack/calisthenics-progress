import {existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import assert from 'node:assert/strict';

const root=process.cwd();
const defaults=readFileSync(join(root,'src/data/defaults.ts'),'utf8');
const store=readFileSync(join(root,'src/storage/store.ts'),'utf8');
const today=readFileSync(join(root,'src/pages/Today.tsx'),'utf8');

const requiredPairs=[
  ['chest-press','seated-row'],['shoulder-press','lat-machine'],['lateral-cable','pullover-cable'],['triceps-pushdown','curl-cable'],
  ['leg-press','seated-leg-curl'],['leg-extension','glute-bridge'],['adductor-machine','calf-machine'],['front-plank','dead-bug'],
  ['lat-machine','incline-chest-press'],['machine-high-row','shoulder-press'],['reverse-pec-deck','pullover-cable'],['curl-cable','overhead-triceps-cable'],
  ['leg-press','lying-leg-curl'],['leg-extension','abductor-machine'],['glute-kickback-cable','calf-machine'],['front-plank','side-plank'],
];

for(const [first,second] of requiredPairs){
  assert(defaults.includes(`row('${first}'`),`Manca ${first}`);
  assert(defaults.includes(`row('${second}'`),`Manca ${second}`);
}
assert(!/row\([^\n]*barbell|row\([^\n]*bilanciere/i.test(defaults),'Il programma contiene un esercizio obbligatorio con bilanciere');
assert(!defaults.includes("row('walking-lunge'"),'Walking lunge non deve essere obbligatorio');
assert(!defaults.includes("row('assisted-split-squat'"),'Split squat assistito deve restare solo un’alternativa');
assert(defaults.includes("id:'e'"),'La scheda E facoltativa deve restare disponibile');
assert(store.includes("calisthenics-progress-gym-v6"),'Chiave dati v6 mancante');
assert(store.includes("'calisthenics-progress-gym-v5'"),'Migrazione v5 mancante');
assert(today.includes('separatedSupersets'),'Persistenza modalità separata mancante');
assert(today.includes('finishingSecond'),'Logica timer dopo il secondo esercizio mancante');
assert(today.includes('Completa giro'),'Comando di completamento giro mancante');

for(const id of ['machine-high-row','seated-leg-curl','lying-leg-curl','glute-bridge','glute-kickback-cable']){
  for(const pose of [0,1]) assert(existsSync(join(root,`public/illustrations-v3/${id}-${pose}.webp`)),`Illustrazione mancante: ${id}-${pose}`);
}

console.log('Programma superserie, migrazione, sicurezza e illustrazioni: OK');
