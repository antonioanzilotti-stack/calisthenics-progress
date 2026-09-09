import {useState} from 'react';

type Point = [number, number];

const floorIds = new Set(['plank', 'dead-bug', 'crunch', 'bird-dog']);
const standingIds = new Set(['lateral-raise','lateral-cable','triceps-pushdown','pullover-cable','curl-cable','woodchopper','glute-machine','calf-machine','pallof-press','elliptical','stair-climber','walk','incline-walk','boxing','jump-rope']);
const legIds = new Set(['leg-press','leg-curl','leg-extension','glute-machine','hip-thrust','calf-machine','bike','elliptical','stair-climber','walk','incline-walk']);

function armPoints(id: string, pose: number): [Point, Point, Point, Point] {
  if (id === 'shoulder-press') return pose ? [[82,70],[72,43],[78,18],[98,18]] : [[82,70],[66,77],[60,54],[100,54]];
  if (['pec-deck','reverse-pec-deck','lateral-raise'].includes(id)) return pose ? [[82,70],[48,66],[28,62],[98,70]] : [[82,70],[76,94],[70,105],[98,70]];
  if (['lat-machine','pullover'].includes(id)) return pose ? [[82,70],[68,86],[62,104],[98,70]] : [[82,70],[67,43],[58,21],[98,70]];
  if (['seated-row','curl-machine'].includes(id)) return pose ? [[82,70],[62,78],[76,88],[98,70]] : [[82,70],[52,77],[35,77],[98,70]];
  if (id === 'triceps-pushdown') return pose ? [[82,70],[76,94],[70,112],[98,70]] : [[82,70],[74,82],[78,66],[98,70]];
  if (id === 'pallof-press') return pose ? [[82,70],[116,76],[143,76],[98,70]] : [[82,70],[94,76],[102,76],[98,70]];
  if (id === 'boxing') return pose ? [[82,70],[112,62],[146,56],[98,70]] : [[82,70],[76,57],[82,46],[98,70]];
  if (id === 'jump-rope') return [[82,70],[65,88],[56,78],[98,70]];
  if (id === 'chest-press') return pose ? [[82,70],[108,75],[139,75],[98,70]] : [[82,70],[98,82],[104,70],[98,70]];
  return pose ? [[82,70],[64,92],[54,108],[98,70]] : [[82,70],[66,84],[58,98],[98,70]];
}

function legPoints(id: string, pose: number): [Point, Point, Point, Point] {
  if (id === 'leg-press') return pose ? [[90,111],[124,102],[153,91],[90,111]] : [[90,111],[115,128],[128,107],[90,111]];
  if (id === 'leg-extension') return pose ? [[90,111],[107,119],[144,119],[90,111]] : [[90,111],[110,116],[107,145],[90,111]];
  if (id === 'leg-curl') return pose ? [[90,111],[111,118],[98,94],[90,111]] : [[90,111],[112,119],[122,143],[90,111]];
  if (id === 'glute-machine') return pose ? [[90,111],[121,106],[151,96],[90,111]] : [[90,111],[109,122],[123,113],[90,111]];
  if (id === 'hip-thrust') return pose ? [[90,111],[119,110],[138,132],[90,111]] : [[90,124],[114,129],[138,143],[90,124]];
  if (['bike','elliptical'].includes(id)) return pose ? [[90,111],[116,124],[139,111],[90,111]] : [[90,111],[111,99],[132,118],[90,111]];
  if (['walk','incline-walk','stair-climber'].includes(id)) return pose ? [[90,111],[111,126],[137,139],[90,111]] : [[90,111],[72,130],[61,148],[90,111]];
  return pose ? [[90,111],[108,130],[115,151],[90,111]] : [[90,111],[78,132],[69,151],[90,111]];
}

const Line = ({a,b}:{a:Point;b:Point}) => <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}/>;

export default function ExerciseArt({id, name, pose = 0}: {id: string; name: string; pose?: number}) {
  const [imageFailed, setImageFailed] = useState(false);
  const floor = floorIds.has(id);
  const standing = standingIds.has(id);
  const seated = !floor && !standing;
  const arms = armPoints(id, pose);
  const legs = legPoints(id, pose);
  const cardio = ['rower','bike','elliptical','stair-climber','walk','incline-walk','boxing','jump-rope'].includes(id);

  const label = `${name}: ${pose ? 'posizione finale' : 'posizione iniziale'}`;

  return <figure className="exercise-art">
    {!imageFailed && <img src={`/illustrations-v3/${id}-${pose}.webp`} alt={label} loading="lazy" decoding="async" onError={() => setImageFailed(true)}/>}
    {imageFailed && <svg viewBox="0 0 240 180" role="img" aria-label={label}>
      <defs><marker id={`arrow-${id}-${pose}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" className="art-arrow"/></marker></defs>
      <rect className="art-bg" x="1" y="1" width="238" height="178" rx="18"/>
      {seated && <g className="equipment"><path d="M54 42v96M54 103h42v12H54M64 138h45"/><rect x="157" y="35" width="24" height="100" rx="4"/><path d="M169 45v80M145 75h24"/></g>}
      {id === 'rower' && <g className="equipment"><path d="M45 136h140M55 132l90-34M139 92h24v12h-24"/></g>}
      {id === 'bike' && <g className="equipment"><circle cx="75" cy="139" r="23"/><circle cx="145" cy="139" r="23"/><path d="M75 139l35-38 35 38H75l25-5 10-33 22-15M126 86h25"/></g>}
      {id === 'elliptical' && <g className="equipment"><path d="M56 146h105M75 136l71-11M145 125l14-83M159 44h19"/><ellipse cx="82" cy="134" rx="20" ry="6"/></g>}
      {id === 'stair-climber' && <g className="equipment"><path d="M45 150h125v-22h-28v-20h-28V88H86V68H58"/></g>}
      {['walk','incline-walk'].includes(id) && <g className="equipment"><path d={id==='incline-walk'?'M35 150L186 121':'M35 145h151'}/><circle cx="55" cy="149" r="5"/><circle cx="170" cy="126" r="5"/></g>}
      {id === 'jump-rope' && <path className="equipment rope" d="M57 78C20 105 33 160 90 159C145 159 158 106 124 80"/>}
      {floor ? <g className="figure">
        {id === 'plank' ? <><circle cx={pose?69:62} cy={pose?93:110} r="10"/><Line a={pose?[80,98]:[72,113]} b={pose?[125,113]:[110,126]}/><Line a={pose?[125,113]:[110,126]} b={pose?[170,123]:[146,146]}/><Line a={pose?[92,101]:[83,117]} b={pose?[75,128]:[72,143]}/></> : <><circle cx="61" cy="113" r="10"/><Line a={[72,116]} b={[117,123]}/><Line a={[84,118]} b={pose?[55,78]:[75,81]}/><Line a={[115,123]} b={pose?[157,103]:[136,87]}/><Line a={[115,123]} b={[139,145]}/></>}
      </g> : <g className="figure">
        <circle cx="90" cy="46" r="11"/><Line a={[90,57]} b={[90,111]}/>
        <Line a={arms[0]} b={arms[1]}/><Line a={arms[1]} b={arms[2]}/><Line a={arms[3]} b={[112,88]}/>
        <Line a={legs[0]} b={legs[1]}/><Line a={legs[1]} b={legs[2]}/><Line a={legs[3]} b={[70,145]}/>
      </g>}
      <path className="motion" markerEnd={`url(#arrow-${id}-${pose})`} d={legIds.has(id) ? 'M119 151 Q150 129 156 103' : 'M126 44 Q151 66 143 94'}/>
      <text x="204" y="24" className="pose-number">{pose ? '02' : '01'}</text>
      {cardio && <text x="190" y="162" className="cardio-mark">CARDIO</text>}
    </svg>}
    <figcaption>{pose ? 'Posizione finale' : 'Posizione iniziale'}</figcaption>
  </figure>;
}
