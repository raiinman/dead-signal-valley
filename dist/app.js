import {createWorld} from './world.js';
import {destinations,moveBody,loadJournal} from './simulation.js';
import {createCafeReflections} from './asset-lighting.js';

const $=id=>document.getElementById(id),THREE=window.THREE;
let renderer,scene,camera,world,started=false,overview=true,hidden=false,fly=false;
let cafeReflectionTarget;
let elapsed=0,quality='medium',time='afternoon',yaw=.1,pitch=0,vy=0,grounded=true,nearest=null;
let last=performance.now(),lastLight=0,lastBird=0,toastTimer;
const body={x:-13,z:16,feet:0},keys=new Set(),move={x:0,y:0};
const journal=loadJournal({getItem:key=>localStorage.getItem(key)}),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const overviewTarget=THREE?new THREE.Vector3(0,0,24):null;let orbit=.48,orbitHeight=64,orbitRadius=110;
const pointers=new Map();let stickId=null,lookId=null,drag=null;
let audio=null,sound=false,master=null,trainGain=null,windGain=null,volume=.4;

function toast(message) {clearTimeout(toastTimer);$('toast').hidden=false;$('toast').textContent=message;$('toast').classList.add('visible');toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),5200);}
function releaseMouse(){if(document.pointerLockElement)document.exitPointerLock();} function requestLookLock(){try{const pending=renderer.domElement.requestPointerLock?.();pending?.catch(()=>toast('Drag the view to look around. Mouse capture is unavailable here.'));}catch{toast('Drag the view to look around.');}}
function panel(id,open){releaseMouse();$(id).hidden=!open;$(id+'-open')?.setAttribute('aria-expanded',String(open));if(open){$('guide').hidden=true;$('toast').classList.remove('visible');$('toast').hidden=true;for(const other of ['settings','journal','places'])if(other!==id){$(other).hidden=true;$(other+'-open').setAttribute('aria-expanded','false');}$(id).querySelector('button')?.focus();}}
function journalUI() {
  $('found-count').textContent=`${journal.size}/${Object.keys(destinations).length}`;$('notes').replaceChildren();
  for(const [id,d] of Object.entries(destinations)) {
    const li=document.createElement('li'),h=document.createElement('h3'),p=document.createElement('p'),button=document.createElement('button');
    h.textContent=journal.has(id)?d.title:d.name;p.textContent=journal.has(id)?d.text:'A signal is waiting here.';button.textContent='Visit this place';button.onclick=()=>{panel('journal',false);visit(id);};li.append(h,p,button);$('notes').append(li);
  }
}
function collect() {
  if(!nearest)return;
  const id=nearest,d=destinations[id];journal.add(id);journalUI();
  try{localStorage.setItem('dsv-river-route-v1',JSON.stringify([...journal]));}catch{$('save-note').textContent='Storage is unavailable. These notes will last for this visit.';}
  toast(`${d.title}. ${d.text}`);if(sound)bell(id==='plaza'?392:587.33);releaseMouse();panel('journal',true);
}
function visit(id) {
  const d=destinations[id];if(!d)return;panel('places',false);start(false);body.x=d.x;body.z=d.z;body.feet=world.heightAt(d.x,d.z)||0;vy=0;yaw=d.yaw;pitch=-.02;fly=false;overview=false;$('overview').setAttribute('aria-pressed','false');updateCamera();
}
function start(lock=true) {
  const first=!started;started=true;overview=false;document.body.classList.add('started');$('welcome').hidden=true;$('overview').setAttribute('aria-pressed','false');
  if(first){body.x=-13;body.z=16;body.feet=0;yaw=0;pitch=.035;toast('Welcome to the river road. Walk into the café, or follow the bell toward the bridge.');}
  if(lock&&!matchMedia('(pointer:coarse)').matches)requestLookLock();
  updateCamera();
}
function updateCamera() {
  scene.fog.near=overview?150:95;scene.fog.far=overview?350:240;
  if(overview){camera.position.set(overviewTarget.x+Math.sin(orbit)*orbitRadius,orbitHeight,overviewTarget.z+Math.cos(orbit)*orbitRadius);camera.lookAt(overviewTarget);}
  else {camera.position.set(body.x,body.feet+1.67,body.z);camera.rotation.set(pitch,yaw,0,'YXZ');}
}
function tone(frequency,duration,gain=.08,delay=0,type='sine') {
  if(!audio||!sound)return;const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+delay;
  o.type=type;o.frequency.setValueAtTime(frequency,t);g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(gain,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(master);o.start(t);o.stop(t+duration+.05);
}
function bell(f=392){[1,2.71,4.08].forEach((h,i)=>tone(f*h,2.8-i*.5,.08/(i+1),i*.01));}
async function toggleSound() {
  try {
    if(!audio){
      audio=new (window.AudioContext||window.webkitAudioContext)();master=audio.createGain();master.gain.value=0;master.connect(audio.destination);
      const buffer=audio.createBuffer(1,audio.sampleRate*4,audio.sampleRate),data=buffer.getChannelData(0);let previous=0;
      for(let i=0;i<data.length;i++){previous=(previous+(Math.random()*2-1)*.015)/1.015;data[i]=previous*3;}
      const noise=audio.createBufferSource();noise.buffer=buffer;noise.loop=true;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=800;windGain=audio.createGain();windGain.gain.value=.16;noise.connect(filter);filter.connect(windGain);windGain.connect(master);noise.start();
      const rumble=audio.createOscillator();rumble.type='triangle';rumble.frequency.value=51;trainGain=audio.createGain();trainGain.gain.value=0;rumble.connect(trainGain);trainGain.connect(master);rumble.start();
    }
    await audio.resume();sound=!sound;master.gain.setTargetAtTime(sound?volume:0,audio.currentTime,.2);$('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',sound?'Mute sound':'Enable sound');if(sound)tone(587.33,.6,.025);
  } catch {toast('Sound could not start. Try the Sound button again.');}
}
function setTime(value) {
  time=value;$('time').value=value;document.body.classList.toggle('night',time==='night');
  const presets={afternoon:{sky:'#93bcc5',horizon:'#e7e3c4',fog:'#b9c9bd',sun:'#ffe1ad',power:1.7,hemi:1.05,practical:.03,exposure:1.05},dusk:{sky:'#6b8799',horizon:'#e6b58e',fog:'#9daaa3',sun:'#ffc48b',power:1.25,hemi:.85,practical:.55,exposure:1.12},night:{sky:'#122b40',horizon:'#45626b',fog:'#253e49',sun:'#9ab4e0',power:.13,hemi:.25,practical:1,exposure:1.05}};
  const p=presets[value];scene.fog.color.set(p.fog);sky.material.uniforms.uTop.value.set(p.sky);sky.material.uniforms.uHorizon.value.set(p.horizon);sky.material.uniforms.uNight.value=value==='night'?1:0;
  sun.color.set(p.sun);sun.intensity=p.power;sun.position.set(value==='dusk'?55:-35,value==='dusk'?18:55,28);hemi.intensity=p.hemi;renderer.toneMappingExposure=p.exposure;
  world.mats.glow.emissiveIntensity=.4+p.practical*1.6;world.mats.glow.color.set(value==='afternoon'?'#eed5a4':'#ffc477');world.lights.forEach(l=>l.userData.factor=p.practical);lastLight=-99;
  world.configureCafeLighting({time:value});
}
function setQuality(value) {
  quality=value;$('quality').value=value;const p={high:{ratio:1.7,shadow:2048},medium:{ratio:1.25,shadow:1024},low:{ratio:1,shadow:512}}[value];
  renderer.setPixelRatio(Math.min(devicePixelRatio,p.ratio));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=value!=='low';sun.shadow.mapSize.set(p.shadow,p.shadow);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}sun.shadow.needsUpdate=true;lastLight=-99;
  world.configureCafeLighting({quality:value});
}
let sun,hemi,sky;
function makeSky() {
  const material=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{uTop:{value:new THREE.Color('#93bcc5')},uHorizon:{value:new THREE.Color('#e7e3c4')},uTime:{value:0},uNight:{value:0}},vertexShader:'varying vec3 vDirection; void main(){vDirection=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`
    uniform vec3 uTop;uniform vec3 uHorizon;uniform float uTime;uniform float uNight;varying vec3 vDirection;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
    void main(){vec3 d=normalize(vDirection);float h=max(d.y,0.);vec3 col=mix(uHorizon,uTop,pow(h,.45));vec2 p=d.xz/max(d.y+.25,.15)*2.+vec2(uTime*.003,0);float n=noise(p)*.55+noise(p*2.1)*.3+noise(p*4.2)*.15;float cloud=smoothstep(.54,.76,n)*smoothstep(.03,.2,h);col=mix(col,mix(vec3(.96,.94,.84),vec3(.39,.49,.54),uNight),cloud*.7);float star=step(.9983,hash(floor(d.xz*180.)))*smoothstep(.15,.45,h)*uNight;gl_FragColor=vec4(col+star*.4,1.);}`});
  sky=new THREE.Mesh(new THREE.SphereGeometry(280,24,12),material);sky.renderOrder=-10;scene.add(sky);
}

try {
  if(!THREE)throw new Error('Three.js could not load. Check your connection and reload.');
  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Valley view. Click to walk; WASD move; Escape releases mouse.');$('world').append(renderer.domElement);
  scene=new THREE.Scene();scene.fog=new THREE.Fog('#b9c9bd',95,240);camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.08,420);makeSky();
  hemi=new THREE.HemisphereLight('#c2d8e8','#9a8564',1.15);scene.add(hemi);
  sun=new THREE.DirectionalLight('#ffe1ad',2.3);sun.position.set(-35,55,28);sun.castShadow=true;sun.shadow.camera.left=-58;sun.shadow.camera.right=58;sun.shadow.camera.top=58;sun.shadow.camera.bottom=-58;sun.shadow.camera.near=1;sun.shadow.camera.far=145;sun.shadow.bias=-.00035;sun.shadow.normalBias=.035;sun.target.position.set(0,0,-12);scene.add(sun,sun.target);
  world=createWorld(THREE,scene);cafeReflectionTarget=createCafeReflections(THREE,renderer,.45);world.configureCafeLighting({environment:cafeReflectionTarget.texture});setQuality(matchMedia('(max-width:620px)').matches?'low':'medium');setTime('afternoon');updateCamera();journalUI();
  $('loading').hidden=true;
  // The loader is pinned to the same release as the renderer.
  const loader=document.createElement('script');loader.src='vendor/GLTFLoader.js';loader.onload=()=>{
    world.loadCafeAsset('./building-test/assets.json').catch(error=>console.warn('The café fallback remains available.',error));
  };document.head.append(loader);
  window.routeDebug={scene,world,renderer,camera,body,visit,setTime,setQuality,collect,start,stats:()=>({quality,time,started,overview,fly,position:{...body},journal:[...journal],train:world.update(elapsed,quality),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures}),setPosition:(x,z,yawValue=0)=>{start(false);body.x=x;body.z=z;body.feet=world.heightAt(x,z)||0;yaw=yawValue;pitch=0;updateCamera();},look:(y,p)=>{yaw=y;pitch=p;updateCamera();},setElapsed:t=>elapsed=t};
  requestAnimationFrame(frame);
} catch(error){console.error(error);$('loading').className='error';$('loading').textContent=`The valley could not open. ${error.message} Reload to try again.`;}

$('start').onclick=()=>start();$('brand-home').onclick=e=>{e.preventDefault();overview=true;$('overview').setAttribute('aria-pressed','true');releaseMouse();};
$('overview').onclick=()=>{overview=!overview;$('overview').setAttribute('aria-pressed',String(overview));releaseMouse();if(!overview&&!started)start(false);updateCamera();};
$('sound').onclick=toggleSound;$('time').onchange=e=>setTime(e.target.value);$('quality').onchange=e=>setQuality(e.target.value);$('volume').oninput=e=>{volume=+e.target.value/100;if(master)master.gain.setTargetAtTime(sound?volume:0,audio.currentTime,.1);};
$('journal-open').onclick=()=>panel('journal',$('journal').hidden);$('settings-open').onclick=()=>panel('settings',$('settings').hidden);document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>panel(b.dataset.close,false));
$('places-open').onclick=()=>panel('places',$('places').hidden);
Object.entries(destinations).forEach(([id,d],i)=>{const button=document.createElement('button');button.dataset.place=id;button.textContent=`${i===9?'0':i+1}  ${d.name}`;button.onclick=()=>visit(id);$('place-list').append(button);});
document.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>visit(b.dataset.place));$('recover').onclick=()=>{panel('settings',false);visit('cafe');toast('Back at the café. The kettle is still warm.');};
$('interact').onclick=collect;$('guide-toggle').onclick=$('show-help').onclick=()=>{releaseMouse();$('guide').hidden=!$('guide').hidden;$('guide-toggle').setAttribute('aria-expanded',String(!$('guide').hidden));};$('guide-close').onclick=()=>{$('guide').hidden=true;$('guide-toggle').setAttribute('aria-expanded','false');};
function toggleUI(){hidden=!hidden;document.body.classList.toggle('ui-hidden',hidden);$('restore-ui').hidden=!hidden;}$('restore-ui').onclick=toggleUI;
document.addEventListener('keydown',e=>{
  if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
  const k=e.key.toLowerCase();if(['w','a','s','d',' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){e.preventDefault();keys.add(k);}
  if(e.repeat)return;
  if(k===' '&&started&&!overview&&grounded&&!fly){vy=5;grounded=false;}
  if(k==='e')collect();if(k==='m')toggleSound();if(k==='h')toggleUI();if(k==='f'&&started){fly=!fly;vy=0;toast(fly?'Flight on. Space rises; Shift descends. F returns to walking.':'Walking again.');if(!fly){const g=world.heightAt(body.x,body.z);if(g===null)visit('cafe');else body.feet=g;}}
  if(k.length===1&&'1234567890'.includes(k))visit(Object.keys(destinations)[k==='0'?9:+k-1]);
  if(k==='escape'){$('guide').hidden=true;for(const id of ['journal','settings','places'])panel(id,false);keys.clear();}
});
document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();move.x=move.y=0;pointers.clear();drag=null;stickId=lookId=null;$('thumb').style.transform='';});
document.addEventListener('pointerlockchange',()=>{document.body.classList.toggle('locked',!!document.pointerLockElement);keys.clear();});
document.addEventListener('mousemove',e=>{if(document.pointerLockElement&&!overview){yaw-=e.movementX*.0021;pitch=Math.max(-1.35,Math.min(1.35,pitch-e.movementY*.0021));}});
$('world').addEventListener('pointerdown',e=>{
  if(e.target!==renderer?.domElement)return;
  if(!started){return;}
  drag={x:e.clientX,y:e.clientY};lookId=e.pointerId;renderer.domElement.setPointerCapture(e.pointerId);
  if(e.pointerType==='mouse'&&!overview&&!document.pointerLockElement)requestLookLock();
});
window.addEventListener('pointermove',e=>{
  if(e.pointerId===stickId){const r=$('stick').getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,len=Math.hypot(dx,dy),factor=Math.min(1,34/Math.max(len,1));move.x=dx*factor/34;move.y=dy*factor/34;$('thumb').style.transform=`translate(${dx*factor}px,${dy*factor}px)`;return;}
  if(e.pointerId===lookId&&drag&&!document.pointerLockElement){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(overview){orbit-=dx*.005;orbitHeight=Math.max(12,Math.min(100,orbitHeight+dy*.06));}else{yaw-=dx*.004;pitch=Math.max(-1.35,Math.min(1.35,pitch-dy*.004));}drag={x:e.clientX,y:e.clientY};}
});
function endPointer(e){if(e.pointerId===stickId){stickId=null;move.x=move.y=0;$('thumb').style.transform='';}if(e.pointerId===lookId){lookId=null;drag=null;}}
window.addEventListener('pointerup',endPointer);window.addEventListener('pointercancel',endPointer);
$('stick').addEventListener('pointerdown',e=>{e.preventDefault();stickId=e.pointerId;try{$('stick').setPointerCapture(e.pointerId);}catch{/* Synthetic test pointers have no native capture. */}});
$('touch-jump').onclick=()=>{if(grounded){vy=5;grounded=false;}};
$('world').addEventListener('wheel',e=>{if(overview){e.preventDefault();orbitRadius=Math.max(28,Math.min(145,orbitRadius+e.deltaY*.035));}},{passive:false});
window.addEventListener('resize',()=>{if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
document.addEventListener('visibilitychange',()=>{keys.clear();move.x=move.y=0;last=performance.now();if(audio){if(document.hidden)audio.suspend();else if(sound)audio.resume().catch(()=>{});}});
renderer?.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();toast('The graphics connection paused. Reload the page to reopen the valley.');});

function frame(now) {
  requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.045);last=now;if(document.hidden)return;elapsed+=dt;
  if(started&&!overview) {
    const forward=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0)-move.y;
    const strafe=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+move.x;
    const len=Math.max(1,Math.hypot(forward,strafe)),speed=(fly?8:keys.has('shift')?5.2:2.65)*dt;
    const dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*strafe)/len*speed,dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*strafe)/len*speed;
    if(fly){body.x=Math.max(-100,Math.min(100,body.x+dx));body.z=Math.max(-110,Math.min(115,body.z+dz));body.feet=Math.max(0,Math.min(80,body.feet+(keys.has(' ')?speed:0)-(keys.has('shift')?speed:0)));}
    else {moveBody(body,dx,dz,world.colliders,world.heightAt);const ground=world.heightAt(body.x,body.z)??0;vy-=12.8*dt;body.feet+=vy*dt;if(body.feet<=ground){body.feet=ground;vy=0;grounded=true;}}
  }
  updateCamera();const train=world.update(reduced?Math.floor(elapsed*10)/10:elapsed,quality,camera.position);sky.material.uniforms.uTime.value=reduced?0:elapsed;
  if(elapsed-lastLight>.5){lastLight=elapsed;const budget=quality==='high'?10:quality==='medium'?6:3;world.lights.sort((a,b)=>a.position.distanceToSquared(camera.position)*(a.userData.priority||1)-b.position.distanceToSquared(camera.position)*(b.userData.priority||1));world.lights.forEach((l,i)=>{l.visible=i<budget;l.intensity=l.visible?l.userData.base*Math.max(l.userData.factor||0,l.userData.minFactor||0):0;});}
  nearest=null;if(started&&!overview&&!fly){for(const [id,d] of Object.entries(destinations)){if(Math.hypot(body.x-d.point[0],body.z-d.point[2])<2.6){nearest=id;break;}}}
  $('interaction').style.display=nearest?'flex':'none';if(nearest){$('interaction-text').textContent=journal.has(nearest)?'Listen once more':`A signal at ${destinations[nearest].name}`;}
  const closest=Object.values(destinations).reduce((a,d)=>Math.hypot(body.x-d.x,body.z-d.z)<Math.hypot(body.x-a.x,body.z-a.z)?d:a);
  const frontage=world.premises.map(p=>({p,d:Math.hypot(Math.max(0,Math.abs(body.x-p.x)-p.w/2),Math.max(0,Math.abs(body.z-p.z)-p.d/2))})).sort((a,b)=>a.d-b.d)[0];
  const zone=frontage.d<3.2?frontage.p.name:Math.hypot(body.x-closest.x,body.z-closest.z)<10?closest.name:'Market street';$('location').textContent=zone;
  $('train-status').textContent=train.phase==='At platform'?`Valley line · departs in ${Math.ceil(train.dwellRemaining)}s`:`Valley line · ${train.phase.toLowerCase()}`;
  document.querySelectorAll('[data-place]').forEach(b=>b.setAttribute('aria-current',destinations[b.dataset.place].name===zone?'location':'false'));
  if(sound&&audio&&trainGain){const distance=Math.hypot(body.x-train.x,body.z+44);trainGain.gain.setTargetAtTime((train.phase==='Arriving'||train.phase==='Departing')?Math.max(0,1-distance/80)*.035:0,audio.currentTime,.2);windGain.gain.setTargetAtTime(body.z< -10&&body.z> -22?.24:.12,audio.currentTime,.5);if(elapsed-lastBird>8&&time!=='night'){lastBird=elapsed;tone(2400,.16,.015);tone(3100,.12,.009,.18);}}
  renderer.render(scene,camera);
}
