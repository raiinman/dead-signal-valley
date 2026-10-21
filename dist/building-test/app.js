import{createCafeReflections}from'./asset-lighting.js';
import{validateGrid,floorAt,standingHeight,move}from'./navigation.js';
import{validateManifest,loadAssets,drawnBounds}from'./assets.js';

const THREE=window.THREE,$=id=>document.getElementById(id),status=$('status');
let renderer,scene,camera,model,grid,config={},assetStats=[],mode='orbit',night=false,yaw=0,pitch=0,orbitYaw=.55,orbitPitch=.3,orbitDistance=14;
let orbitTarget,modelBounds,reflection,ready=false,lastFrame=0,joy={x:0,y:0},held=new Set(),drag=null;
const body={x:0,y:0,z:6},eyeHeight=1.65,interiorLights=[];
function message(text){status.textContent=text;}
function fail(error){message(`The modular café could not be loaded. ${error.message}`);console.error(error);}
function resize(){if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}
function setTime(value){
  night=value;document.body.classList.toggle('night',night);$('time').textContent=night?'Evening':'Daylight';$('time').setAttribute('aria-pressed',String(night));
  scene.background.set(night?0x192930:0xc8d7d7);scene.fog.color.copy(scene.background);
  scene.getObjectByName('skyFill').intensity=night?.15:.4;
  scene.getObjectByName('sun').intensity=night?.12:1.1;
  interiorLights.forEach(light=>light.intensity=light.userData.intensity*(night?1:.55));
  // Lighting changes; source material factors and texture settings stay untouched.
}
function orbit(){
  mode='orbit';document.body.classList.remove('walking');$('crosshair').hidden=true;$('exterior').setAttribute('aria-pressed','true');$('walk').setAttribute('aria-pressed','false');
  $('guide').textContent='Drag to orbit · Scroll to zoom';
  if(document.pointerLockElement)document.exitPointerLock();
  if(ready){const loaded=assetStats.filter(a=>a.status==='loaded').length;message(grid?`${loaded} individual Meshy asset types · Ready to explore. Walk through the doorway or choose Inside.`:`${loaded}/${config.assets.length} assets loaded. Inspection only · ${config.validation?.message||'Walking awaits the completed assembly and verified collision.'}`);}
}
function spawn(point,angle=0){
  if(!grid)return;
  const initialY=floorAt(grid,point[0],point[1]);
  if(initialY===null||standingHeight(grid,point[0],point[1],initialY)===null){message('This starting point has insufficient floor clearance. Walking remains disabled here.');return;}
  mode='walk';body.x=point[0];body.z=point[1];body.y=initialY;yaw=angle;pitch=0;
  document.body.classList.add('walking');$('crosshair').hidden=false;$('exterior').setAttribute('aria-pressed','false');$('walk').setAttribute('aria-pressed','true');
  $('guide').textContent=matchMedia('(pointer:coarse)').matches?'Left stick to walk · Drag on right to look':'WASD to walk · Drag to look · Shift to move faster · Esc to release';
  message('Walking on the assembled models’ verified floor. Measured walls and furniture block movement.');
}
function configureInput(){
  $('exterior').onclick=orbit;$('walk').onclick=()=>spawn(config.outside||[0,6],config.yaw||0);$('inside').onclick=()=>spawn(config.inside||[0,0],config.insideYaw||0);
  $('time').onclick=()=>setTime(!night);$('details').onclick=()=>{const open=$('audit').hidden;$('audit').hidden=!open;$('details').setAttribute('aria-expanded',String(open));};
  const canvas=renderer.domElement;
  canvas.addEventListener('pointerdown',event=>{if(event.button!==0)return;drag={id:event.pointerId,x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId);});
  canvas.addEventListener('pointermove',event=>{
    if(document.pointerLockElement===canvas&&mode==='walk'){yaw-=event.movementX*.003;pitch=Math.max(-1.35,Math.min(1.35,pitch-event.movementY*.003));return;}
    if(!drag||drag.id!==event.pointerId)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;drag.x=event.clientX;drag.y=event.clientY;
    if(mode==='orbit'){orbitYaw-=dx*.006;orbitPitch=Math.max(-.1,Math.min(1.25,orbitPitch+dy*.006));}
    else{yaw-=dx*.004;pitch=Math.max(-1.35,Math.min(1.35,pitch-dy*.004));}
  });
  for(const type of['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>{drag=null;});
  canvas.addEventListener('wheel',event=>{if(mode==='orbit'){orbitDistance=Math.max(2,Math.min(45,orbitDistance*Math.exp(event.deltaY*.001)));event.preventDefault();}},{passive:false});
  canvas.addEventListener('dblclick',()=>{if(mode==='walk'&&!matchMedia('(pointer:coarse)').matches)canvas.requestPointerLock?.();});
  window.addEventListener('keydown',event=>{if(/^(Key[WASD]|Arrow(Up|Down|Left|Right)|Shift(Left|Right))$/.test(event.code)){held.add(event.code);event.preventDefault();}});
  window.addEventListener('keyup',event=>held.delete(event.code));window.addEventListener('blur',()=>{held.clear();joy={x:0,y:0};});
  let joystickId=null;
  function stick(event){const rect=$('joystick').getBoundingClientRect();let x=(event.clientX-rect.left-rect.width/2)/35,y=(event.clientY-rect.top-rect.height/2)/35;const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}joy={x,y};$('stick').style.transform=`translate(${x*30}px,${y*30}px)`;}
  $('joystick').addEventListener('pointerdown',event=>{joystickId=event.pointerId;$('joystick').setPointerCapture(joystickId);stick(event);});
  $('joystick').addEventListener('pointermove',event=>{if(event.pointerId===joystickId)stick(event);});
  for(const type of['pointerup','pointercancel','lostpointercapture'])$('joystick').addEventListener(type,()=>{joystickId=null;joy={x:0,y:0};$('stick').style.transform='';});
}
function render(time){
  const dt=Math.min(.05,(time-lastFrame)/1000||0);lastFrame=time;
  if(mode==='walk'&&grid){
    let x=joy.x+(held.has('KeyD')||held.has('ArrowRight')?1:0)-(held.has('KeyA')||held.has('ArrowLeft')?1:0);
    let forward=-joy.y+(held.has('KeyW')||held.has('ArrowUp')?1:0)-(held.has('KeyS')||held.has('ArrowDown')?1:0);
    const length=Math.hypot(x,forward);if(length>1){x/=length;forward/=length;}
    const speed=(held.has('ShiftLeft')||held.has('ShiftRight')?3.4:1.9)*dt;
    move(grid,body,(Math.cos(yaw)*x-Math.sin(yaw)*forward)*speed,(-Math.sin(yaw)*x-Math.cos(yaw)*forward)*speed);
    camera.position.set(body.x,body.y+eyeHeight,body.z);camera.rotation.set(pitch,yaw,0,'YXZ');
  }else{
    camera.position.set(orbitTarget.x+Math.sin(orbitYaw)*Math.cos(orbitPitch)*orbitDistance,orbitTarget.y+Math.sin(orbitPitch)*orbitDistance,orbitTarget.z+Math.cos(orbitYaw)*Math.cos(orbitPitch)*orbitDistance);camera.lookAt(orbitTarget);
  }
  renderer.render(scene,camera);requestAnimationFrame(render);
}
async function loadConfig(){
  const response=await fetch('./assets.json',{cache:'no-cache'});
  if(!response.ok)throw new Error('assets.json could not be read.');
  return validateManifest(await response.json());
}
async function init(){
  if(!THREE||!THREE.GLTFLoader)throw new Error('Three.js r128 or its GLTF loader is unavailable.');
  config=await loadConfig();renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  $('viewport').appendChild(renderer.domElement);scene=new THREE.Scene();scene.background=new THREE.Color(0xc8d7d7);scene.fog=new THREE.Fog(scene.background,35,85);camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.06,100);orbitTarget=new THREE.Vector3(0,1.6,0);
  const fill=new THREE.HemisphereLight(0xe0ecff,0x9b7e5a,.65);fill.name='skyFill';scene.add(fill);
  const sun=new THREE.DirectionalLight(0xffebd3,2.1);sun.name='sun';sun.position.set(-7,12,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:.5,far:35});sun.shadow.normalBias=.018;sun.shadow.bias=-.0001;scene.add(sun);scene.add(sun.target);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(120,120),new THREE.MeshStandardMaterial({color:0x777568,roughness:1,metalness:0}));ground.name='Inspection ground';ground.rotation.x=-Math.PI/2;ground.position.y=-.025;ground.receiveShadow=true;scene.add(ground);
  reflection=createCafeReflections(THREE,renderer,.45);scene.environment=reflection.texture;
  const practicals=config.lights||[[0,2.5,0,1.4,7],[-2,2.3,-1,1,5],[2,2.3,1,1,5]];
  for(const [x,y,z,intensity,distance]of practicals){const light=new THREE.PointLight(0xffc47c,intensity,distance,2);light.position.set(x,y,z);light.userData.intensity=intensity;interiorLights.push(light);scene.add(light);}
  resize();window.addEventListener('resize',resize);configureInput();requestAnimationFrame(render);
  model=new THREE.Group();model.name='Individual Meshy café assets';scene.add(model);
  function updateInventory(records){
    $('inventory').replaceChildren(...records.map(asset=>{
      const item=document.createElement('li'),title=document.createElement('strong'),detail=document.createElement('span');
      title.textContent=asset.name;detail.textContent=`${asset.status} · ${asset.instances} instance${asset.instances===1?'':'s'}`;
      if(asset.status==='loaded')detail.textContent+=` · ${asset.triangles.toLocaleString()} source triangles · ${asset.textures.map(t=>`${t.width}×${t.height}`).join(', ')||'no maps'}`;
      if(asset.message)detail.textContent+=` · ${asset.message}`;
      item.dataset.status=asset.status;item.append(title,detail);return item;
    }));
  }
  assetStats=await loadAssets(THREE,config,model,updateInventory);
  model.getObjectByName('pastry-case')?.traverse(object=>{
    if(object.isMesh&&[object.material].flat().every(material=>material.transparent&&material.opacity<.5))object.castShadow=false;
  });
  // The 18 m sun map cannot resolve the espresso's submillimetre details.
  model.getObjectByName('espresso-machine')?.traverse(object=>{if(object.isMesh)object.receiveShadow=false;});
  modelBounds=drawnBounds(THREE,model);
  const size=modelBounds.isEmpty()?new THREE.Vector3(8,4.7,7):modelBounds.getSize(new THREE.Vector3());
  if(!modelBounds.isEmpty()){modelBounds.getCenter(orbitTarget);orbitDistance=Math.max(size.x,size.z,size.y)*1.8;}
  if(config.orbit){if(config.orbit.target)orbitTarget.fromArray(config.orbit.target);orbitDistance=config.orbit.distance??orbitDistance;orbitYaw=config.orbit.yaw??orbitYaw;orbitPitch=config.orbit.pitch??orbitPitch;}
  const loaded=assetStats.filter(a=>a.status==='loaded');
  const triangles=loaded.reduce((sum,a)=>sum+a.triangles*a.instances,0),meshes=loaded.reduce((sum,a)=>sum+a.meshes*a.instances,0);
  $('stats').textContent=`${loaded.length}/${config.assets.length} assets loaded · ${triangles.toLocaleString()} rendered triangles · ${meshes} meshes. Original PBR material factors preserved.`;
  try{
    if(loaded.length!==config.assets.length||!loaded.length)throw new Error('The individual asset assembly is incomplete.');
    if(!config.nav)throw new Error('No measured walk grid is available.');
    const response=await fetch(config.nav);if(!response.ok)throw new Error('Measured walk grid could not be loaded.');grid=validateGrid(await response.json());
    if(config.validation?.status!=='passed'){grid=null;throw new Error(config.validation?.message||'Doorway and interior validation is pending.');}
    for(const point of[config.outside||[0,6],config.inside||[0,0]]){const y=floorAt(grid,...point);if(y===null||standingHeight(grid,...point,y)===null)throw new Error('The measured grid does not support a clear spawn.');}
    $('walk').disabled=false;$('inside').disabled=false;$('validation').textContent=config.validation.message||'Doorway, interior floor and furniture clearance verified against the assembled meshes.';
  }catch(error){grid=null;$('validation').textContent=`Inspection only. ${error.message} Walk controls stay disabled until physical access is verified.`;}
  ready=true;setTime(false);orbit();
  window.modularCafe={scene,modelRoot:model,renderer,camera,body,config,grid,assetStats,inspect:id=>assetStats.find(asset=>asset.id===id),orbit,spawn,setTime,stats:()=>({triangles,meshes,loaded:loaded.length,expected:config.assets.length,mode,bounds:modelBounds.isEmpty()?null:{min:modelBounds.min.toArray(),max:modelBounds.max.toArray()},position:{...body}}),setView:(x,y,z,lookX,lookY,lookZ)=>{mode='manual';orbitTarget.set(lookX,lookY,lookZ);const delta=new THREE.Vector3(x,y,z).sub(orbitTarget);orbitDistance=delta.length();orbitYaw=Math.atan2(delta.x,delta.z);orbitPitch=Math.asin(delta.y/orbitDistance);},step:(dx,dz)=>grid&&move(grid,body,dx,dz)};
}
init().catch(fail);
