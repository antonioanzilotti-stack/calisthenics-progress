import type{AppData}from'../types';import{initialData}from'../data/defaults';
const KEY='calisthenics-progress-v2';
export const load=():AppData=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')||initialData(false)}catch{return initialData(false)}};
export const save=(d:AppData)=>localStorage.setItem(KEY,JSON.stringify(d));
export const download=(name:string,text:string,type:string)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href)};
export const exportCsv=(d:AppData)=>['data,allenamento,stato,durata,rpe,note',...d.sessions.map(s=>[s.date,d.workouts.find(w=>w.id===s.workoutId)?.name,s.status,s.duration,s.rpe,JSON.stringify(s.notes)].join(','))].join('\n');
