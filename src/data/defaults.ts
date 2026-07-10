import type{AppData,Session,Workout}from'../types';

const w=(id:string,name:string,short:string,duration:number,rows:[string,number,string?,string?][]):Workout=>({id,name,short,duration,exercises:rows.map(([exerciseId,sets,reps,seconds])=>({exerciseId,sets,reps,seconds}))});
export const workouts:Workout[]=[
  w('a','Spinta e core','A',25,[['corda',1,undefined,'180'],['push-handles',4,'8–15'],['pike',3,'6–10'],['diamond',3,'6–10'],['hollow',3,undefined,'20–30'],['plank',2,undefined,'45–60']]),
  w('b','Gambe e condizionamento','B',30,[['corda',1,undefined,'300'],['squat',4,'15'],['lunges',3,'10/gamba'],['bridge',3,'15'],['calf',3,'20'],['wallsit',2,undefined,'45–60']]),
  w('c','Mobilità e tecnica','C',20,[['wrists',1,undefined,'180'],['shoulders',1,undefined,'300'],['hips',1,undefined,'300'],['bear',3,undefined,'30'],['crab',3,undefined,'30'],['sideplank',2,undefined,'30/lato']]),
  w('bar','Sessione con sbarra','Sbarra',25,[['hang',3,undefined,'20–40'],['scapular',3,'8'],['pullup',4,'libere'],['negative',2,'5'],['hollow',3,undefined,'20']])
];

const localIso=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const logs=(wid:string,n:number)=>Object.fromEntries((workouts.find(w=>w.id===wid)?.exercises||[]).map(x=>[x.exerciseId,Array.from({length:x.sets},(_,i)=>({done:i<n,reps:i<n?8:0,seconds:i<n?30:0}))]));

function demoSessions(){
  const sessions:Session[]=[];
  for(let i=28;i>=1;i--){
    const d=new Date();d.setDate(d.getDate()-i);const wid=({1:'a',2:'b',4:'c',6:'a'}as Record<number,string>)[d.getDay()];if(!wid)continue;
    const r=i%7;const status=r===0?'saltato':r===3?'parziale':'completato';
    sessions.push({id:crypto.randomUUID(),date:localIso(d),workoutId:wid,status,duration:status==='completato'?22+i%8:status==='parziale'?12:0,notes:status==='saltato'?'':'Buone sensazioni',reason:status==='saltato'?(i%2?'lavoro':'stanchezza'):undefined,rpe:status==='saltato'?0:6+i%3,logs:logs(wid,status==='parziale'?1:99)});
  }
  return sessions;
}

export function initialData(includeDemo=false):AppData{
  const today=localIso();
  const goalSpecs=[
    ['push','20 push-up consecutivi','rip.',8,14,20],
    ['pike','10 pike push-up','rip.',4,7,10],
    ['hollow','Hollow hold','sec.',20,42,60],
    ['plank','Plank','sec.',45,72,90],
    ['rope','Corda senza pause','min.',3,7,10]
  ];
  return{
    sessions:includeDemo?demoSessions():[],workouts,schedule:{1:'a',2:'b',4:'c',6:'a'},
    goals:goalSpecs.map(([id,label,unit,demoStart,demoCurrent,target])=>{const start=includeDemo?Number(demoStart):0;const current=includeDemo?Number(demoCurrent):0;return{id:String(id),label:String(label),unit:String(unit),start,current,target:Number(target),updated:today,history:[{date:today,value:current}]}}),
    preferences:{theme:'light',rest:60,barEnabled:true,unit:'metrico',demo:includeDemo,createdAt:today}
  };
}
