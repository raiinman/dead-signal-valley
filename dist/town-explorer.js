import {isBlocked} from './simulation.js';

const ENTERABLE = new Set(['cafe', 'workshop', 'arcade']);
const SIDE_FRONT = new Set(['grocer', 'bicycle', 'apothecary', 'tailor', 'records', 'toy-hobby']);
const KEEPERS={cafe:'Mara',books:'Clara',florist:'Mina',radio:'Ivo',bakery:'Otis & Hal',workshop:'Soren',arcade:'Kael',grocer:'Vera',bicycle:'Dax',apothecary:'Pell',tailor:'Tess & Ewan',records:'Jun','toy-hobby':'Milo',tea:'Saffron',restaurant:'Garrick',station:'Bram & Ada',observatory:'Lyra',studio:'Nora',arena:'Jun',plaza:'Toma',bridge:'Glenn',garden:'Hana'};
// Editorial character identities, matched to the existing stable resident creation order.
// Roles and routines below continue to come from the actual simulation.
export const RESIDENT_IDENTITIES = [
  ['Mara','barista'],['Toma','walker'],['Glenn','walker'],['Hana','gardener'],
  ['Vera','traveler'],['Bram','traveler'],['Soren','mechanic'],['Ivo','mechanic'],
  ['Milo','student'],['Kael','student'],['Nora','artist'],['Clara','artist'],
  ['Lyra','astronomer'],['Ada','traveler'],['Jun','student'],['Dax','walker'],
  ['Garrick','walker'],['Ewan','student'],['Hal','traveler'],['Otis','student'],
  ['Pell','gardener'],['Mina','walker'],['Tess','walker'],['Saffron','student']
];
const SHOP_DETAILS = {
  cafe: 'Coffee, bread and a walkable furnished room.', books: 'Books and a recessed window display.',
  florist: 'Flowers and planting displayed in a room behind the glass.', radio: 'Radios and instruments in the repair-shop window.',
  bakery: 'Bread and pastries in a visible bakery interior.', grocer: 'Seasonal provisions and fruit crates.',
  bicycle: 'Cycles, tools and careful repairs.', apothecary: 'Valley apothecary and a stocked window interior.',
  tailor: 'Clothes made to last.', records: 'Records for the evening.', 'toy-hobby': 'Small wonders and model kits.',
  tea: 'Loose tea and quiet company.', restaurant: 'Soup, supper and valley fare.',
  workshop: 'Walk inside to inspect the inventions and workbenches.', arcade: 'Walk inside among the illuminated game cabinets.'
};

// Read dimensions directly from the same objects used by the rendered town.
export function buildTownDirectory(world, destinations) {
  const entries = world.premises.map(p => {
    const d = destinations[p.id];
    return {id:p.id, name:p.name, keeper:KEEPERS[p.id]||'Valley neighbors', premise:p, shop:p.kind === 'shop',
      landmark:!!p.landmark || p.kind === 'landmark', signal:!!d, enterable:ENTERABLE.has(p.id),
      get x(){return p.x;}, get z(){return p.z;},
      subtitle:d?.title || (p.interior === 'visible' ? 'Visible shop interior' : 'Market street'),
      description:SHOP_DETAILS[p.id] || (d ? 'Visit this valley landmark and find its nearby signal.' : 'A shop along the valley streets.')};
  });
  for (const [id,d] of Object.entries(destinations)) if (!entries.some(e => e.id === id)) {
    entries.push({id,name:d.name,keeper:KEEPERS[id]||'Valley neighbors',x:d.x,z:d.z,shop:false,landmark:true,signal:true,enterable:false,
      subtitle:d.title,description:'A valley gathering place with a nearby signal to discover.'});
  }
  return entries;
}

export function directoryCounts(entries) {
  return {all:entries.length, enterable:entries.filter(e=>e.enterable).length,
    landmark:entries.filter(e=>e.landmark).length, shop:entries.filter(e=>e.shop).length};
}

export function filterDirectory(entries, filter='all', query='') {
  const search=query.trim().toLocaleLowerCase();
  return entries.filter(e => (filter === 'all' || !!e[filter]) &&
    (!search || `${e.name} ${e.keeper} ${e.subtitle} ${e.description}`.toLocaleLowerCase().includes(search)));
}

export function compassHeading(yaw=0) {
  const degrees = ((-yaw * 180 / Math.PI) % 360 + 360) % 360;
  return {degrees, label:['N','NE','E','SE','S','SW','W','NW'][Math.round(degrees / 45) % 8]};
}

export function mapPoint(x,z,width,height) {
  const scale=Math.min((width-20)/116,(height-20)/135);
  return {x:width/2+x*scale, y:height/2+(z-26.5)*scale};
}

export function hitTestPin(entries,x,y,width,height,radius=9) {
  let nearest=null, distance=radius;
  for (const entry of entries) {
    const pin=mapPoint(entry.x,entry.z,width,height), d=Math.hypot(pin.x-x,pin.y-y);
    if(d <= distance){nearest=entry;distance=d;}
  }
  return nearest;
}

function arrivalSeed(entry, destinations) {
  const d=destinations[entry.id];
  if(d)return {x:d.x,z:d.z,yaw:d.yaw || 0};
  const p=entry.premise;
  if(!p)return null;
  if(p.visit)return p.visit;
  if(SIDE_FRONT.has(p.id))return {x:p.x-Math.sign(p.x)*(p.w/2+1),z:p.z,yaw:Math.sign(p.x)*Math.PI/2};
  return {x:p.x,z:p.z+p.d/2+1,yaw:0};
}

export function findSafeArrival(world, entry, destinations={}) {
  const seed=arrivalSeed(entry,destinations);
  if(!seed)return null;
  // Search only the frontage or known arrival area, never arbitrary map ground.
  const offsets=[[0,0]];
  for(const r of [.4,.8,1.2,1.6])for(let i=0;i<16;i++)offsets.push([Math.sin(i*Math.PI/8)*r,Math.cos(i*Math.PI/8)*r]);
  for(const [dx,dz] of offsets) {
    const x=seed.x+dx,z=seed.z+dz,feet=world.heightAt(x,z);
    if(!Number.isFinite(feet) || isBlocked(x,z,feet,world.colliders))continue;
    const stable=[[.24,0],[-.24,0],[0,.24],[0,-.24]].every(([ox,oz])=>{
      const h=world.heightAt(x+ox,z+oz);return Number.isFinite(h)&&Math.abs(h-feet)<=.38;
    });
    if(stable)return {x,z,feet,yaw:seed.yaw || 0};
  }
  return null;
}

export function residentSnapshot(resident,index,entries) {
  const position=resident.group.position;
  const nearby=entries.reduce((best,entry)=>!best || Math.hypot(entry.x-position.x,entry.z-position.z)<Math.hypot(best.x-position.x,best.z-position.z)?entry:best,null);
  const role=String(resident.role || 'resident').replace(/\b\w/g,c=>c.toUpperCase());
  const identity=RESIDENT_IDENTITIES[index], editorialName=identity?.[1]===resident.role?identity[0]:null;
  const guild=resident.role==='barista'?'Baristas & Bakers':['mechanic','gardener'].includes(resident.role)?'Trades & Crafts':['artist','student','astronomer'].includes(resident.role)?'Scholars & Artists':'Town Folk';
  return {id:`resident-${index+1}`,name:resident.name || resident.metadata?.name || editorialName || `${role} ${String(index+1).padStart(2,'0')}`,
    role,guild,routine:resident.route?'Walking a local route':'Spending time here',nearby:nearby?.name || 'Valley',x:position.x,z:position.z};
}

export function createTownExplorer({world,destinations,teleportTo,toast=()=>{},journal=new Set(),root=document}) {
  const $=id=>root.getElementById(id), entries=buildTownDirectory(world,destinations);
  const listeners=[], residentRows=[]; let filter='all',lastUpdate=-Infinity;
  const listen=(el,event,fn)=>{if(el){el.addEventListener(event,fn);listeners.push(()=>el.removeEventListener(event,fn));}};
  const element=(tag,className,text)=>{const e=root.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e;};
  const setText=(id,value)=>{const el=$(id);if(el&&el.textContent!==value)el.textContent=value;};
  function visitPlace(id) {
    const entry=entries.find(e=>e.id===id);if(!entry)return false;
    const arrival=findSafeArrival(world,entry,destinations);
    if(!arrival){toast('This arrival point is obstructed. Approach along the street.');return false;}
    teleportTo(arrival.x,arrival.z,arrival.yaw,entry.name);return true;
  }
  function refreshDirectory() {
    const list=$('place-list');if(!list)return;
    list.replaceChildren();
    const visible=filterDirectory(entries,filter,$('place-search')?.value || '');
    for(const e of visible) {
      const row=element('div','dir-card'),info=element('div','dir-card-info');row.setAttribute('role','listitem');
      const tags=[e.enterable?'Enterable room':e.shop?'Shop with visible interior':'Landmark',e.signal?'Discoverable signal':''];
      info.append(element('span','dir-meta',tags.filter(Boolean).join(' · ')),element('h3','',e.name),element('p','',e.description));
      info.append(element('p','dir-meta',`Keeper: ${e.keeper} · X ${e.x.toFixed(1)} · Z ${e.z.toFixed(1)}`));
      const button=element('button','dir-visit-btn','Visit');button.type='button';button.setAttribute('aria-label',`Visit ${e.name}`);
      button.addEventListener('click',()=>visitPlace(e.id));row.append(info,button);list.append(row);
    }
    if(!visible.length)list.append(element('p','empty-state','No places match your search.'));
  }
  function createResidents() {
    const list=$('resident-list');if(!list)return;
    list.replaceChildren();
    world.residents.forEach((r,i)=>{
      const data=residentSnapshot(r,i,entries),row=element('div','dir-card'),info=element('div','dir-card-info');row.setAttribute('role','listitem');
      const heading=element('h3','',data.name),meta=element('span','dir-meta',`${data.role} · ${data.guild}`),note=element('p');
      info.append(meta,heading,note);row.append(info);list.append(row);residentRows.push({note,resident:r,index:i});
    });
  }
  function drawMap(body,yaw,time) {
    const canvas=$('minimap-canvas');if(!canvas || canvas.hidden || canvas.closest('[hidden]'))return;
    const ctx=canvas.getContext('2d');if(!ctx)return;
    const w=canvas.width,h=canvas.height,night=time==='night',point=(x,z)=>mapPoint(x,z,w,h);
    ctx.fillStyle=night?'#142823':'#e3ebdd';ctx.fillRect(0,0,w,h);
    const path=(points,color,width=1,dash=[])=>{
      ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.beginPath();
      points.forEach(([x,z],i)=>{const p=point(x,z);if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.stroke();ctx.setLineDash([]);
    };
    path([[-58,-16],[58,-16]],night?'#315c66':'#83b3bc',8);
    path([[0,-11],[0,-21]],'#987e5e',4);
    path([[-40,-35],[40,-35]],'#788077',1,[3,3]);path([[-40,-38],[40,-38]],'#788077',1,[3,3]);
    path([[0,-10],[0,68]],night?'#415b4d':'#c8c5a9',5);
    for(const e of entries) {
      if(e.premise){const p=e.premise,a=point(p.x-p.w/2,p.z-p.d/2),b=point(p.x+p.w/2,p.z+p.d/2);ctx.fillStyle=night?'#31463c':'#c1cbb7';ctx.fillRect(a.x,a.y,b.x-a.x,b.y-a.y);}
      const p=point(e.x,e.z);ctx.fillStyle=e.enterable?'#b77b37':e.signal?(journal.has(e.id)?'#458477':'#b76047'):'#56796a';
      ctx.beginPath();ctx.arc(p.x,p.y,e.enterable?3.4:2.6,0,Math.PI*2);ctx.fill();
    }
    if(body) {
      const p=point(body.x,body.z);
      ctx.strokeStyle=night?'#8aac91':'#788f72';ctx.lineWidth=.7;ctx.globalAlpha=.4;
      for(const r of [13,26,39]){ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-yaw);ctx.fillStyle=night?'#fff0ca':'#203e34';ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(4,5);ctx.lineTo(0,3);ctx.lineTo(-4,5);ctx.closePath();ctx.fill();ctx.restore();
    }
  }
  const counts=directoryCounts(entries), chipNames={all:'All',enterable:'Enterable',landmark:'Landmarks & signals',shop:'Shops'};
  for(const chip of root.querySelectorAll('.filter-chip')) {
    const key=chip.dataset.filter;
    if(key in counts)chip.textContent=`${chipNames[key]} (${counts[key]})`;
    chip.setAttribute('aria-pressed',String(key===filter));
    listen(chip,'click',()=>{filter=key;for(const c of root.querySelectorAll('.filter-chip')){const active=c===chip;c.classList.toggle('active',active);c.setAttribute('aria-pressed',String(active));}refreshDirectory();});
  }
  listen($('place-search'),'input',refreshDirectory);
  const canvas=$('minimap-canvas');
  if(canvas){canvas.setAttribute('aria-label','Valley radar map. Select a place pin to visit. The Town Directory provides the same destinations with keyboard controls.');listen(canvas,'click',event=>{
    const rect=canvas.getBoundingClientRect(),entry=hitTestPin(entries,(event.clientX-rect.left)*canvas.width/rect.width,(event.clientY-rect.top)*canvas.height/rect.height,canvas.width,canvas.height);
    if(entry)visitPlace(entry.id);
  });}
  refreshDirectory();createResidents();
  return {entries,visitPlace,refreshDirectory,destroy:()=>listeners.forEach(remove=>remove()),
    update({body,yaw=0,time='afternoon',zone='',train,overview=false,now=performance.now()}) {
      if(now-lastUpdate<100)return;lastUpdate=now;
      const heading=compassHeading(yaw);setText('compass-heading',`${heading.label} ${Math.round(heading.degrees)%360}°`);
      setText('coord-readout',`X ${body.x.toFixed(1)} · Z ${body.z.toFixed(1)}`);
      const nearest=entries.filter(e=>e.shop).reduce((best,e)=>!best || Math.hypot(e.x-body.x,e.z-body.z)<Math.hypot(best.x-body.x,best.z-body.z)?e:best,null);
      if(nearest)setText('nearest-label',`${nearest.name} · ${Math.round(Math.hypot(nearest.x-body.x,nearest.z-body.z))} m`);
      setText('status-val',overview?'Valley overview':zone || 'Exploring the valley');
      const community=$('community');if(community&&!community.hidden)for(const row of residentRows){const r=residentSnapshot(row.resident,row.index,entries);row.note.textContent=`${r.routine} near ${r.nearby}. ${Math.round(Math.hypot(r.x-body.x,r.z-body.z))} m away · X ${r.x.toFixed(1)} · Z ${r.z.toFixed(1)}`;}
      drawMap(body,yaw,time);
    }
  };
}
