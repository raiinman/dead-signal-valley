export const destinations = {
  cafe: { name:'Copper Kettle Café', x:-13, z:16, yaw:0, title:'A cup before the crossing', text:'The first kettle is always for the valley. On its copper side, a tiny inscription reads: leave a little warmth behind.', point:[-14,1.3,7.7] },
  plaza: { name:'Bell-tower plaza', x:1.5, z:4, yaw:-.7, title:'The quarter-hour bell', text:'Beneath the old bell is a frequency scratched into the timber: 104.7. For a moment, the quiet between the notes sounds like a voice.', point:[6,1.2,2] },
  bridge: { name:'River timber bridge', x:0, z:-10.7, yaw:0, title:'What the river keeps', text:'A small receiver on the bridge picks up water, birds and one faint whistle. Some signals take the long way home.', point:[1.7,1.2,-15.5] },
  station: { name:'Dead Signal Valley station', x:-8, z:-27.7, yaw:0, title:'The homeward line', text:'The timetable has one handwritten addition: there is always another train. Below it, someone has drawn a little copper bell.', point:[-8,1.5,-31.8] },
  workshop: {name:'Coppercoil Workshop',x:-28,z:48,yaw:0,title:'The patient invention',text:'On the workbench, a little copper receiver listens through a wheel of glass. Its maker has labelled the unfinished dial: tomorrow, perhaps.',point:[-24.4,1.4,43.1]},
  arcade: {name:'Afterglow Arcade',x:28,z:48,yaw:0,title:'One more credit',text:'The oldest cabinet has no score table. It saves the names of people who stayed to watch the mountain sunrise.',point:[28,1.5,42.2]},
  observatory: {name:'Cinderwatch Observatory',x:-43,z:34,yaw:0,title:'The quietest star',text:'The listening dish points toward a patch of ordinary sky. Beside it: a signal need not be loud to have travelled a long way.',point:[-43,2.3,31.5]},
  studio: {name:'Riverglass Studio',x:43,z:25,yaw:0,title:'A colour for the silence',text:'A painting of the valley has one copper line running between every window. The artist calls it the sound of people being home.',point:[43,1.4,24]},
  arena: {name:'Resonance Hall',x:0,z:64,yaw:Math.PI,title:'The room between songs',text:'A sound check drifts out of the open foyer. On tonight’s programme, the final act is simply called Everyone Who Made It Back.',point:[0,1.4,65]},
  garden: {name:'Cherry listening garden',x:24,z:-26.7,yaw:Math.PI,title:'A blossom between stations',text:'Petals settle on the listening bench. Between the river and the train, a faint voice says: you can rest here a while.',point:[24,1.4,-26.7]}
};

export function smoothstep(t) { const v=Math.max(0,Math.min(1,t)); return v*v*(3-2*v); }

export function bridgeHeight(x,z) {
  if(Math.abs(x)>2.45 || z> -10 || z< -22) return null;
  if(z> -11.5) return .55*(-10-z)/1.5;
  if(z< -20.5) return .55*(z+22)/1.5;
  return .55;
}

export function isBlocked(x,z,feet,colliders,radius=.28) {
  return colliders.some(c=>feet+1.55>c.minY && feet<c.maxY-.04 && x>c.x-c.w/2-radius && x<c.x+c.w/2+radius && z>c.z-c.d/2-radius && z<c.z+c.d/2+radius);
}

// Resolve axes separately so a wall hit slides instead of sticking at corners.
export function moveBody(body,dx,dz,colliders,heightAt) {
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.14));
  for(let i=0;i<steps;i++) {
    for(const axis of ['x','z']) {
      const x=body.x+(axis==='x'?dx/steps:0), z=body.z+(axis==='z'?dz/steps:0);
      const ground=heightAt(x,z);
      if(ground===null || ground-body.feet>.38 || isBlocked(x,z,Math.max(body.feet,ground),colliders)) continue;
      body[axis]=axis==='x'?x:z;
    }
  }
  return body;
}

export function loadJournal(storage,key='dsv-river-route-v1') {
  try { const raw=JSON.parse(storage.getItem(key)||'[]'); return new Set(Array.isArray(raw)?raw.filter(id=>Object.hasOwn(destinations,id)):[]); }
  catch { return new Set(); }
}
