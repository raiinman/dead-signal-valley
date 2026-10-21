import {createMaterials} from './materials.js';
import {buildStation} from './station.js';
import {buildLandscape} from './landscape.js';
import {bridgeHeight} from './simulation.js';
import {buildEnterable} from './town-enterable.js';
import {buildLandmarks} from './town-landmarks.js';
import {buildMarket} from './town-market.js';
import {buildPublicRealm} from './town-public.js';
import {createResidentDistance} from './resident-distance.js';
import {loadModularCafe,cafeHeight,cafePlacement} from './modular-cafe.js';

export function createWorld(THREE,scene) {
  const mats=createMaterials(THREE), root=new THREE.Group();root.name='Copperlight river route';scene.add(root);
  const colliders=[],lights=[],batches=new Map(),residents=[],beacons=[];
  let cafeAsset=null,cafeGrid=null,cafeBuild=false,cafeRecords=[];
  const cafeFallback=new THREE.Group();cafeFallback.name='Distant café and loading fallback';root.add(cafeFallback);
  const cafeDetail=new THREE.Group();cafeDetail.name='Modular café signs';cafeDetail.visible=false;root.add(cafeDetail);
  const cafeLighting={environment:null,quality:'medium',time:'afternoon'};
  const q=new THREE.Quaternion(),v=new THREE.Vector3(),scale=new THREE.Vector3(1,1,1),matrix=new THREE.Matrix4();
  let seed=83531;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  function add(geometry,material,x,y,z,rx=0,ry=0,rz=0) {
    const source=geometry.index?geometry.toNonIndexed():geometry;
    matrix.compose(v.set(x,y,z),q.setFromEuler(new THREE.Euler(rx,ry,rz)),scale);source.applyMatrix4(matrix);
    const mat=typeof material==='string'?mats[material]:material;
    // This compact town is cheap in triangles; material batching avoids hundreds
    // of tiny chunk submissions, particularly in the whole-town overview.
    const key=(cafeBuild?`${cafeBuild}:`:'')+mat.uuid;
    if(!batches.has(key))batches.set(key,{mat,geos:[],cafe:cafeBuild});batches.get(key).geos.push(source);
    if(source!==geometry)geometry.dispose();
  }
  function box(x,y,z,w,h,d,mat,rx=0,ry=0,rz=0) {
    const g=new THREE.BoxGeometry(w,h,d),p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
    for(let i=0;i<p.count;i++) {
      const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i));
      uv.setXY(i,nx>.5?p.getZ(i):p.getX(i),ny>.5?p.getZ(i):p.getY(i));
    }
    add(g,mat,x,y,z,rx,ry,rz);
  }
  function cyl(x,y,z,r,h,mat,rTop=r,segments=12,rx=0,rz=0) {
    const g=new THREE.CylinderGeometry(rTop,r,h,segments),uv=g.attributes.uv;
    for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*2*Math.PI*r,uv.getY(i)*h);
    add(g,mat,x,y,z,rx,0,rz);
  }
  function beam(a,b,r,mat) {
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);
    const g=new THREE.CylinderGeometry(r,r,delta.length(),8);
    g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize())));
    const mid=start.add(end).multiplyScalar(.5);add(g,mat,mid.x,mid.y,mid.z);
  }
  function collider(x,z,w,d,minY=0,maxY=6) {colliders.push({x,z,w,d,minY,maxY,cafeFallback:cafeBuild});}
  function addLight(x,y,z,intensity=1,distance=8) {
    const light=new THREE.PointLight('#ffc77c',intensity,distance,1.65);light.position.set(x,y,z);light.userData.base=intensity;light.userData.cafeFallback=cafeBuild;root.add(light);lights.push(light);return light;
  }
  function sign(text,x,y,z,w,h=.5,background='#315c55',rotationY=0) {
    const c=document.createElement('canvas');c.width=1024;c.height=Math.max(128,Math.round(1024*h/w));
    const ctx=c.getContext('2d');ctx.fillStyle=background;ctx.fillRect(0,0,c.width,c.height);
    ctx.strokeStyle='#e8d9b5';ctx.lineWidth=3;ctx.strokeRect(12,10,1000,c.height-20);
    const lines=text.split('\n');ctx.textAlign='center';ctx.textBaseline='middle';
    lines.forEach((line,i)=>{ctx.fillStyle='#fff1d4';ctx.font=`${i?'400':'600'} ${Math.round(c.height/(lines.length+1)*(i?.63:.9))}px ${i?'sans-serif':'Georgia'}`;ctx.fillText(line,512,c.height*(i+.6)/(lines.length+.15),958);});
    const texture=new THREE.CanvasTexture(c);texture.encoding=THREE.sRGBEncoding;texture.anisotropy=4;
    const material=new THREE.MeshStandardMaterial({map:texture,roughness:.85,emissive:'#a28453',emissiveMap:texture,emissiveIntensity:.035});
    add(new THREE.PlaneGeometry(w,h),material,x,y,z,0,rotationY);return material;
  }
  function roof(x,y,z,w,d,rise=1.5) {
    // Closed hipped roof, with separately seated courses and ridge caps.
    const points=[[-w/2,0,-d/2],[w/2,0,-d/2],[w/2,0,d/2],[-w/2,0,d/2],[-w*.22,rise,0],[w*.22,rise,0]];
    const faces=[[0,1,5],[0,5,4],[1,2,5],[2,3,4],[2,4,5],[3,0,4]];
    const positions=[],uvs=[];for(const f of faces)for(const idx of [...f].reverse()){const p=points[idx];positions.push(...p);uvs.push(p[0],p[2]);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.computeVertexNormals();add(g,'roof',x,y,z);
    for(const side of [-1,1])for(let row=0;row<7;row++) {
      const t=(row+.5)/7,span=w*(1-.55*t);
      for(let col=0;col<Math.floor(span/.3);col++)box(x-span/2+.15+col*.3,y+rise*t+.06,z+side*d/2*(1-t),.28,.065,.33,row%3?'roof':'roofLight',side*Math.atan2(rise,d/2),0);
    }
    for(let i=0;i<w*.44/.25;i++)cyl(x-w*.22+i*.25,y+rise+.08,z,.13,.29,'roofLight',.13,10,0,Math.PI/2);
    box(x,y-.08,z,w+.05,.18,d+.05,'timberDark');
  }
  function windowFrame(x,y,z,w,h,glass=true) {
    if(glass)box(x,y,z,w,h,.045,'glass');
    for(const dx of [-w/2,0,w/2])box(x+dx,y,z+.045,.055,h+.1,.095,'timberDark');
    for(const dy of [-h/2,0,h/2])box(x,y+dy,z+.045,w+.1,.05,.095,'timberDark');
    box(x,y-h/2-.08,z+.08,w+.3,.12,.3,'stone');
  }
  function bench(x,z,rotation=0) {
    const c=Math.cos(rotation),s=Math.sin(rotation),p=(a,b)=>[x+a*c+b*s,z-a*s+b*c];
    for(let i=0;i<4;i++){const [px,pz]=p(0,-.22+i*.145);box(px,.49,pz,1.8,.065,.12,'timber',0,rotation);}
    for(let i=0;i<3;i++){const [px,pz]=p(0,-.28);box(px,.75+i*.14,pz,1.8,.1,.07,'timber',0,rotation);}
    for(const a of [-.66,.66]){const [px,pz]=p(a,0);box(px,.25,pz,.075,.5,.5,'iron',0,rotation);}
    collider(x,z,rotation? .65:1.9,rotation?1.9:.65,0,1.25);
  }
  function table(x,z,inside=false) {
    cyl(x,.78,z,.62,.085,'timber',.62,24);cyl(x,.39,z,.06,.72,'iron');cyl(x,.07,z,.29,.06,'iron',.29,12);
    collider(x,z,1.1,1.1,0,.85);
    for(const dz of [-.9,.9]) {box(x,.43,z+dz,.43,.065,.45,'timber');box(x,.73,z+dz+Math.sign(dz)*.2,.46,.58,.055,'timber');for(const dx of [-.17,.17])for(const zz of [-.17,.17])box(x+dx,.22,z+dz+zz,.045,.44,.045,'iron');collider(x,z+dz,.48,.5,0,1.1);}
    cyl(x+.12,.87,z,.085,.12,'ceramic',.1,16);cyl(x+.12,.935,z,.075,.008,'timberDark',.075,12);cyl(x-.22,.84,z+.12,.14,.025,'ceramic',.14,18);
    if(!inside){cyl(x,1.8,z,.025,1.95,'iron');cyl(x,2.75,z,1.3,.55,'fabric',.05,12);}
  }
  function planter(x,z,w=1.5,d=.6) {
    box(x,.2,z,w,.4,d,'timber');box(x,.42,z,w-.12,.035,d-.12,'soil');
    for(let i=0;i<9;i++){const px=x+(rand()-.5)*(w-.15),pz=z+(rand()-.5)*(d-.1);beam([px,.42,pz],[px+.06,.9+rand()*.2,pz],.015,'leafDark');cyl(px,.85+rand()*.2,pz,.09,.12,i%3?'leaf':'blossom',.02,5);}
    collider(x,z,w,d,0,.65);
  }
  function awning(x,z,w,y=2.9) {
    const n=Math.round(w/.45),sw=w/n;
    for(let i=0;i<n;i++) {
      const px=x-w/2+(i+.5)*sw,mat=i%2?'ivory':'teal';
      box(px,y,z+.72,sw,.055,1.6,mat,-.13);box(px,y-.17,z+1.52,sw,.25,.055,mat);
      const shape=new THREE.Shape();shape.moveTo(-sw/2,0);shape.lineTo(sw/2,0);shape.absarc(0,0,sw/2,0,Math.PI,true);shape.closePath();
      add(new THREE.ShapeGeometry(shape),mat,px,y-.29,z+1.55,0,0,0);
    }
    for(const dx of [-w/2+.1,w/2-.1])beam([x+dx,y-.06,z],[x+dx,y-.23,z+1.5],.025,'iron');
  }
  function shelf(x,y,z,w=2.2) {box(x,y+.6,z,w,1.4,.25,'timberDark');for(let i=0;i<4;i++)box(x,y+i*.36,z+.2,w,.05,.65,'timber');}
  function shop({x,z,w=6,d=5,name,sub,kind,paint='plaster'}) {
    const front=z+d/2,back=z-d/2;
    box(x,.07,z,w,.14,d,'paving');box(x,1.7,back,w,3.4,.25,paint);
    for(const side of [-1,1]){box(x+side*w/2,1.7,z,.25,3.4,d,paint);collider(x+side*w/2,z,.25,d,0,4.5);}
    collider(x,back,w,.25,0,4.5);box(x,3.45,z,w+.2,.18,d+.2,'cream');
    box(x,.39,front,w,.65,.18,'timber');box(x,2.95,front,w,1,.18,paint);windowFrame(x,1.7,front+.02,w-.35,1.9);
    collider(x,front,w,.16,0,3.5);shelf(x,0,back+.35,w-.6);
    for(let i=0;i<20;i++) {
      const px=x-w/2+.4+(i%10)*(w-.8)/10,py=.22+Math.floor(i/10)*.74;
      if(kind==='books'){box(px,py+.25,back+.7,.15+.05*(i%3),.42,.27,['teal','roof','ivory'][i%3]);}
      else if(kind==='flowers'){cyl(px,py+.15,back+.7,.15,.3,'ceramic',.2,10);beam([px,py+.3,back+.7],[px,py+.8,back+.7],.018,'leafDark');cyl(px,py+.82,back+.7,.16,.14,i%2?'blossom':'ivory',0,7);}
      else if(kind==='radio'){box(px,py+.23,back+.7,.38,.3,.2,'timber');cyl(px,py+.25,back+.83,.1,.025,'iron',.1,12,Math.PI/2);}
      else {cyl(px,py+.12,back+.7,.15,.2,'pastry',.18,12);}
    }
    box(x,3.22,front+.12,w-.25,.76,.18,'timberDark');sign(`${name}\n${sub} · 0147 ${Math.round((x+30)*19)} ${Math.round((z+30)*17)}`,x,3.24,front+.225,w-.45,.59);
    awning(x,front,w+.3,2.75);roof(x,3.65,z,w+.65,d+.7,1.4);
    for(const dx of [-w/2+.3,w/2-.3])box(x+dx,1.7,front+.13,.12,3.4,.2,'timberDark');
    box(x,4.55,back+1,.65,1.45,.6,'brick');box(x,5.3,back+1,.8,.15,.75,'stone');
    planter(x-w/2-.55,front+.5,.65,.65);addLight(x,2.4,z,.6,6);
  }

  // The café is a built room, not a hollow façade or an invisible teleport.
  cafeBuild=true;
  const cx=-13,cz=8;
  box(cx,.06,cz,10,.12,10,'timber');box(cx,1.85,3,10,3.7,.3,'plaster');collider(cx,3,10,.3,0,4);
  for(const x of [-18,-8]){box(x,1.85,8,.3,3.7,10,'plaster');collider(x,8,.3,10,0,4);}
  for(const side of [-1,1]) {
    const x=cx+side*3;
    box(x,.4,13,4,.8,.24,'timber');box(x,3.1,13,4,1.2,.24,'plaster');windowFrame(x,1.8,13.07,3.55,1.85);
    collider(x,13,4,.24,0,4);
  }
  box(cx,3.2,13,2,1,.24,'plaster');
  for(const x of [cx-1,cx+1])box(x,1.45,13,.12,2.9,.3,'teal');
  box(cx,.075,13.25,2,.15,.65,'stone');box(cx,3.7,8,10.3,.18,10.3,'timber');
  for(let i=0;i<6;i++)box(-17.5+i*1.8,3.47,8,.13,.32,9.8,'timberDark');
  roof(cx,3.9,8,10.8,10.9,1.85);box(-16,5.7,5,.7,1.8,.7,'brick');box(-16,6.65,5,.9,.18,.9,'stone');
  awning(cx,13.1,10.5,3.02);sign('COPPER KETTLE\nCoffee, bread & a little time · 0147 104 700',cx,3.4,13.23,7.3,.62);
  for(const x of [-17.75,-8.25]){box(x,1.68,13.26,.16,3.3,.16,'timberDark');beam([x,3.05,13.1],[x,2.6,14.65],.03,'iron');}
  // Counter, framed menu, pastries, shelves and practical pendant light.
  box(cx, .57,5.1,7.4,1.14,.85,'teal');box(cx,1.18,5.1,7.7,.12,1.1,'timber');collider(cx,5.1,7.7,1.1,0,1.3);
  box(-15.2,1.43,5.1,2.7,.48,.8,'glass');for(const x of [-16.6,-13.8])box(x,1.44,5.1,.035,.48,.83,'brass');box(-15.2,1.69,5.1,2.9,.04,.85,'brass');
  for(let i=0;i<12;i++){const x=-16.25+(i%6)*.42,z=4.95+Math.floor(i/6)*.32;cyl(x,1.31,z,.15,.13,'pastry',.1,12);}
  sign('TODAY AT THE KETTLE\nPear tart · Warm sourdough · Mountain coffee',-14.5,2.3,3.18,4.8,1.15,'#2d4139');
  shelf(-10.3,1.05,3.32,2.5);for(let i=0;i<8;i++)cyl(-11.3+i*.29,1.58,3.65,.075,.19,'ceramic',.09,12);
  table(-16,9,true);table(-10,9,true);
  for(const x of [-15.5,-10.5]){beam([x,3.5,8],[x,2.8,8],.015,'iron');cyl(x,2.7,8,.3,.22,'copper',.1,20);cyl(x,2.57,8,.22,.025,'glow',.22,16);addLight(x,2.53,8,.9,6);}
  sign('Come on in\nThe kettle is warm',-11.65,1.5,13.3,.8,.55,'#466a5a');
  // Handmade fallback also makes the counter complete while the authored asset loads.
  const espresso=new THREE.Group();espresso.position.set(-10.6,1.25,5.05);cafeFallback.add(espresso);
  const machine=(g,m,x,y,z)=>{const mesh=new THREE.Mesh(g,mats[m]);mesh.position.set(x,y,z);mesh.castShadow=true;espresso.add(mesh);return mesh;};
  machine(new THREE.BoxGeometry(1.05,.65,.6),'ivory',0,.4,0);machine(new THREE.CylinderGeometry(.24,.24,.8,20),'copper',0,.8,0).rotation.z=Math.PI/2;
  for(const x of [-.25,.25]){machine(new THREE.CylinderGeometry(.065,.065,.15,12),'brass',x,.2,.32);machine(new THREE.CylinderGeometry(.08,.065,.14,12),'ceramic',x,.09,.33);}
  cafeBuild=false;
  table(-17.1,16.3);table(-8.6,16.5);planter(-17,13.8,1.8,.5);planter(-9,13.8,1.8,.5);

  shop({x:-23,z:-.8,w:6,d:6,name:'MARGIN & MOSS',sub:'Books for unhurried days',kind:'books'});
  shop({x:14,z:6,w:7,d:6,name:'FERN & FIELD',sub:'Flowers from the valley',kind:'flowers'});
  shop({x:14,z:-5,w:7,d:6,name:'WAVELENGTH REPAIRS',sub:'Radios, clocks & curious things',kind:'radio',paint:'brick'});
  shop({x:-13,z:-5,w:7,d:5,name:'HILLSIDE OVEN',sub:'Bread before the first train',kind:'bread'});

  // Fitted avenue and plaza paving; discrete raised kerbs stay outside circulation.
  box(0,.015,6,12,.03,34,'paving');box(-.7,.025,.4,17,.05,12,'stone');box(0,.018,-26,12,.035,10,'paving');
  for(const x of [-6,6])for(let z=-9;z<24;z+=1.2){if(x===6&&z<3&&z>-3)continue;box(x,.09,z,.2,.18,1.18,'stone');}
  for(let z=-8;z<20;z+=.75)box(-3.6,.047,z,.34,.025,.52,'sand');
  // Signature tower: stone footing, timber belfry, copper roof and a real bell.
  box(6,.2,0,3.4,.4,3.4,'stone');box(6,1.6,0,2.7,2.8,2.7,'plaster');collider(6,0,3.4,3.4,0,8);
  for(const x of [4.68,7.32])for(const z of [-1.32,1.32])box(x,3.35,z,.2,6.3,.2,'timberDark');
  for(const y of [.45,3,4.6,6.1]){box(6,y,0,3.05,.18,3.05,'timber');}
  for(const z of [-1.35,1.35]){beam([4.7,4.8,z],[7.3,6,z],.055,'timber');beam([7.3,4.8,z],[4.7,6,z],.055,'timber');}
  const bellShape=[];for(let i=0;i<=16;i++){const t=i/16;bellShape.push(new THREE.Vector2(.2+.55*Math.pow(t,2.8),.95*(1-t)));}
  const bell=new THREE.Mesh(new THREE.LatheGeometry(bellShape,32),mats.brass);bell.position.set(6,4.85,0);bell.castShadow=true;root.add(bell);
  beam([6,6.05,0],[6,5.7,0],.055,'iron');cyl(6,4.8,0,.08,.45,'iron');roof(6,6.3,0,3.8,3.8,1.7);
  sign('THE VALLEY BELL\nLeave a little quiet for the next person',6,2.1,1.365,2.4,.8);
  for(const z of [-1.38,1.38])windowFrame(6,3.65,z,1.5,1.2,false);
  bench(-4,-3);bench(3,5);bench(9,-3,Math.PI/2);planter(-5,3,2.1,.9);
  // Notice board is attached to a supported frame.
  for(const x of [-3.1,-.9])box(x,1.05,-4.7,.12,2.1,.12,'timberDark');box(-2,1.5,-4.7,2.4,1.3,.14,'timber');sign('AROUND THE VALLEY\nBread at dawn · Music on Fridays · Last train at moonrise',-2,1.5,-4.61,2.2,1.05,'#eee0bd');

  // The bridge has joined planks, rails, diagonal braces and masonry abutments.
  for(const z of [-11,-21]){box(0,-.15,z,5.9,1.2,1.1,'stone');box(0,.48,z,5.9,.18,1.25,'stone');}
  for(const x of [-1.9,1.9])box(x,.25,-16,.32,.48,10.4,'timberDark');
  for(let i=0;i<46;i++)box(0,.5,-11.05-i*.218,5,.1,.205,'timber');
  for(const side of [-1,1]) {
    const x=side*2.34;
    for(let i=0;i<7;i++){const z=-11-i*1.67;box(x,1.09,z,.14,1.28,.14,'timberDark');box(x,1.78,z,.23,.12,.23,'copper');}
    for(const y of [.91,1.53])box(x,y,-16,.1,.12,10.2,'timber');
    for(let i=0;i<6;i++){beam([x,.84,-11.15-i*1.67],[x,1.5,-12.55-i*1.67],.04,'timber');}
    collider(x,-16,.16,10.4,.4,1.8);
  }
  for(const end of [-1,1]) {
    const z=end===-1?-21.25:-10.75,angle=end===-1?-.352:.352;
    box(0,.26,z,5,.1,1.6,'timber',angle);
  }
  // Real curb grates and lamps establish human scale along the path.
  for(const z of [18,6,-7,-25,-29])for(const x of [-4.9,4.9]) {
    if(x>0&&z===6)continue;
    cyl(x,1.8,z,.055,3.6,'iron');cyl(x,.15,z,.16,.3,'iron',.12,12);box(x,3.55,z,.38,.08,.38,'iron');box(x,3.3,z,.26,.42,.26,'glow');cyl(x,3.68,z,.28,.25,'copper',0,4);
    addLight(x,3.1,z,1.3,10);collider(x,z,.3,.3,0,3.9);
    if(z> -10){box(x,.05,z+1.1,.45,.035,.6,'iron');for(let i=0;i<5;i++)box(x,.071,z+.86+i*.1,.37,.012,.025,'stone');}
  }
  // A gentle festoon follows real supporting cables over the gathering space.
  for(let i=0;i<18;i++) {
    const x=-6+i*.75,y=4.4-.6*Math.sin(i/17*Math.PI);
    if(i)beam([x-.75,4.4-.6*Math.sin((i-1)/17*Math.PI),3],[x,y,3],.009,'iron');
    beam([x,y,3],[x,y-.22,3],.009,'iron');cyl(x,y-.3,3,.075,.1,'glow',.05,8);
  }
  for(const x of [-6,6.75]){box(x,2.2,3,.08,4.4,.08,'iron');}
  // A few shared practical lights illuminate surfaces beneath the festoon.
  for(const x of [-3,1.5,6]){const light=addLight(x,3.15,3,3.2,11);light.userData.priority=.35;}
  const towerLight=addLight(6,1.7,2.65,2.7,7);towerLight.userData.priority=.15;

  const ctx={THREE,mats,add,box,cyl,beam,sign,collider,addLight,roof,windowFrame,bench,planter,awning};
  const landscape=buildLandscape(ctx);root.add(landscape.group);
  const station=buildStation(ctx);root.add(station.group);
  const enterable=buildEnterable(ctx),landmarks=buildLandmarks(ctx),market=buildMarket(ctx),publicRealm=buildPublicRealm(ctx);
  for(const district of [enterable,landmarks,market,publicRealm])root.add(district.group);
  const premises=[
    {id:'cafe',name:'Copper Kettle Café',kind:'shop',landmark:true,x:-13,z:8,w:10,d:10},
    {id:'books',name:'Margin & Moss',kind:'shop',x:-23,z:-.8,w:6,d:6},
    {id:'florist',name:'Fern & Field',kind:'shop',x:14,z:6,w:7,d:6},
    {id:'radio',name:'Wavelength Repairs',kind:'shop',x:14,z:-5,w:7,d:6},
    {id:'bakery',name:'Hillside Oven',kind:'shop',x:-13,z:-5,w:7,d:5},
    {id:'station',name:'Dead Signal Valley station',kind:'landmark',landmark:true,x:-10,z:-33,w:17,d:7},
    ...enterable.premises,...landmarks.premises,...market.premises
  ];

  function person(x,z,role,route,color) {
    const group=new THREE.Group();group.position.set(x,0,z);root.add(group);
    const shirt=mats.shirt.clone();shirt.color.set(color);
    const mesh=(geo,mat,px,py,pz,parent=group)=>{const m=new THREE.Mesh(geo,typeof mat==='string'?mats[mat]:mat);m.position.set(px,py,pz);m.castShadow=true;parent.add(m);return m;};
    mesh(new THREE.CylinderGeometry(.19,.14,.46,8),shirt,0,1.04,0);
    mesh(new THREE.SphereGeometry(.16,12,10),'skin',0,1.48,0);
    const hair=mesh(new THREE.SphereGeometry(.17,12,8,0,Math.PI*2,0,1.7),'hair',0,1.51,-.018);
    if(role==='gardener')mesh(new THREE.CylinderGeometry(.3,.3,.04,16),'sand',0,1.65,0);
    else if(role==='barista'){mesh(new THREE.BoxGeometry(.25,.33,.025),'cream',0,1.02,.15);mesh(new THREE.CylinderGeometry(.17,.2,.1,12),'ivory',0,1.65,0);}
    else if(role==='traveler'){mesh(new THREE.BoxGeometry(.25,.35,.14),'timber',0,1.02,-.18);}
    else if(role==='mechanic'){mesh(new THREE.BoxGeometry(.28,.32,.035),'timberDark',0,1.02,.16);mesh(new THREE.BoxGeometry(.18,.07,.07),'brass',.3,.87,.05);}
    else if(role==='artist'){mesh(new THREE.CylinderGeometry(.2,.18,.07,12),'teal',0,1.65,0);mesh(new THREE.BoxGeometry(.2,.28,.035),'cream',-.28,.86,.08);}
    else if(role==='student'){mesh(new THREE.BoxGeometry(.27,.31,.12),'roof',0,1.07,-.18);mesh(new THREE.BoxGeometry(.07,.14,.025),'cream',0,1.16,.18);}
    else if(role==='astronomer'){mesh(new THREE.BoxGeometry(.26,.33,.07),'cream',-.3,.94,.07);mesh(new THREE.CylinderGeometry(.18,.18,.07,12),'trouser',0,1.65,0);}
    for(const sx of [-.058,.058])mesh(new THREE.SphereGeometry(.015,6,5),'iron',sx,1.5,.144);
    const limbs=[];
    for(const side of [-1,1]) {
      const hip=new THREE.Group();hip.position.set(side*.09,.82,0);group.add(hip);
      mesh(new THREE.CylinderGeometry(.07,.055,.37,7),'trouser',0,-.17,0,hip);
      const knee=new THREE.Group();knee.position.y=-.35;hip.add(knee);mesh(new THREE.CylinderGeometry(.055,.045,.34,7),'trouser',0,-.16,0,knee);mesh(new THREE.BoxGeometry(.12,.09,.23),'timberDark',0,-.34,.04,knee);
      const shoulder=new THREE.Group();shoulder.position.set(side*.23,1.23,0);group.add(shoulder);mesh(new THREE.CylinderGeometry(.055,.05,.27,7),shirt,0,-.11,0,shoulder);
      const elbow=new THREE.Group();elbow.position.y=-.25;shoulder.add(elbow);mesh(new THREE.CylinderGeometry(.045,.035,.24,7),'skin',0,-.1,0,elbow);
      limbs.push({hip,knee,shoulder,elbow,side});
    }
    residents.push({group,limbs,route,role,phase:rand()*Math.PI*2,origin:[x,z]});return group;
  }
  person(-13,4.1,'barista',null,'#f1e6cf');person(-4.1,7,'walker',[[-4.1,7],[-4.1,0]],'#718b7a');
  person(1.4,-6,'walker',[[1.4,-6],[1.4,-9.3]],'#b5795c');person(11,10,'gardener',null,'#698279');
  person(-2,-25,'traveler',[[-2,-25],[-8,-27.5]],'#bba36d');person(4,-38.3,'traveler',[[4,-38.3],[-3,-38.3]],'#6b7d8c');
  person(-31,40,'mechanic',null,'#bda57b');person(-25,47.6,'mechanic',null,'#65847d');
  person(24,42,'student',null,'#be8b70');person(30,44,'student',null,'#7f8599');
  person(40,24.5,'artist',null,'#b88864');person(39,26,'artist',[[39,26],[39,33]],'#b8b294');
  person(-46,30.5,'astronomer',null,'#7e90a1');person(-40,40,'traveler',[[-40,40],[-40,47]],'#8a755c');
  person(-3,25,'student',[[-3,25],[-3,43]],'#9a6f79');person(3,29,'walker',[[3,29],[3,44]],'#78917c');
  person(-2.5,52,'walker',[[-2.5,52],[-2.5,63]],'#a68266');person(3,61,'student',[[3,61],[3,52]],'#728aa0');
  person(-8,64,'traveler',null,'#c0a773');person(7,64,'student',null,'#9d7b88');
  person(25,-25.7,'gardener',null,'#8b9770');person(15,-25.4,'walker',[[15,-25.4],[19,-25.4]],'#b78970');
  person(-18,49,'walker',[[-18,49],[-8,49]],'#69887f');person(18,49,'student',[[18,49],[8,49]],'#a296b1');
  const residentDistance=createResidentDistance(THREE,mats,residents,root);

  function beacon(id,x,y,z) {
    const mesh=new THREE.Mesh(new THREE.TorusGeometry(.12,.017,6,24),mats.brass);mesh.position.set(x,y,z);root.add(mesh);beacons.push({id,mesh,baseY:y});
  }
  beacon('cafe',-14,1.55,7.7);beacon('plaza',6,1.35,1.65);beacon('bridge',1.7,1.1,-15.5);beacon('station',-8,1.55,-31.8);
  beacon('workshop',-24.4,1.4,43.1);beacon('arcade',28,1.5,42.2);beacon('observatory',-43,2.3,31.5);beacon('studio',43,1.4,24);beacon('arena',0,1.4,65);beacon('garden',24,1.4,-26.7);
  // Small receiver on the bridge's timber shelf.
  box(1.7,.93,-15.5,.7,.12,.5,'timberDark');box(1.7,1.15,-15.5,.5,.33,.23,'teal');cyl(1.59,1.17,-15.365,.085,.02,'iron',.085,12,Math.PI/2);beam([1.87,1.3,-15.5],[1.92,1.65,-15.5],.012,'brass');

  cafeBuild='detail';
  sign('COPPER KETTLE\nCoffee, bread & a little time · 0147 104 700',-13,2.99,13.15,7.1,.5);
  cafeBuild=false;

  for(const {mat,geos,cafe} of batches.values()) {
    const count=geos.reduce((n,g)=>n+g.attributes.position.count,0),positions=new Float32Array(count*3),normals=new Float32Array(count*3),uvs=new Float32Array(count*2);
    let offset=0;for(const g of geos){positions.set(g.attributes.position.array,offset*3);normals.set(g.attributes.normal.array,offset*3);if(g.attributes.uv)uvs.set(g.attributes.uv.array,offset*2);offset+=g.attributes.position.count;g.dispose();}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(positions,3));g.setAttribute('normal',new THREE.BufferAttribute(normals,3));g.setAttribute('uv',new THREE.BufferAttribute(uvs,2));g.computeBoundingSphere();
    const mesh=new THREE.Mesh(g,mat);mesh.castShadow=!mat.transparent;mesh.receiveShadow=true;(cafe==='detail'?cafeDetail:cafe?cafeFallback:root).add(mesh);
  }
  batches.clear();
  function heightAt(x,z) {
    if(cafeGrid){const height=cafeHeight(cafeGrid,x,z);if(height!==undefined)return height;}
    if(x< -58||x>58||z>94||z< -40.65)return null;
    const bridge=bridgeHeight(x,z);if(bridge!==null)return bridge;
    if(z< -11.8&&z> -20.2)return null;
    const sh=station.walkHeight(x,z);if(sh!==null&&sh!==undefined)return sh;
    for(const district of [enterable,landmarks]){const h=district.walkHeight?.(x,z);if(h!==null&&h!==undefined)return h;}
    if(!cafeGrid&&x> -17.9&&x< -8.1&&z>3&&z<13.6)return .12;
    return 0;
  }
  function update(t,quality,cameraPosition) {
    if(cafeAsset&&cameraPosition){const distance=cameraPosition.distanceTo(cafeAsset.position);cafeAsset.visible=distance<(quality==='low'?20:quality==='high'?40:30);cafeFallback.visible=!cafeAsset.visible;cafeDetail.visible=cafeAsset.visible;}
    landscape.update(t,quality);const train=station.update(t+20);
    enterable.update?.(t,quality);landmarks.update?.(t,quality);market.update?.(t,quality);
    residents.forEach((p,i)=>{
      if(p.route){const a=p.route[0],b=p.route[1],len=Math.hypot(b[0]-a[0],b[1]-a[1]),cycle=t*.65/len+i*.2,phase=cycle%2,progress=phase<1?phase:2-phase;p.group.position.x=a[0]+(b[0]-a[0])*progress;p.group.position.z=a[1]+(b[1]-a[1])*progress;p.group.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1])+(phase<1?0:Math.PI);}
      p.group.position.y=heightAt(p.group.position.x,p.group.position.z)||0;
      const dist=cameraPosition?cameraPosition.distanceTo(p.group.position):0;
      if(dist>(quality==='high'?65:quality==='medium'?40:24))return;
      p.limbs.forEach(l=>{const swing=p.route?Math.sin(t*4.8+p.phase)*.38*l.side:Math.sin(t*.8+p.phase)*.045;l.hip.rotation.x=swing;l.knee.rotation.x=Math.max(0,-swing)*.7;l.shoulder.rotation.x=-swing*.7;l.elbow.rotation.x=-.15-Math.max(0,swing)*.4;});
    });
    residentDistance.update(cameraPosition,quality);
    beacons.forEach((b,i)=>{b.mesh.rotation.y=t*.5;b.mesh.position.y=b.baseY+Math.sin(t*1.5+i)*.06;});
    return train;
  }
  async function loadCafeAsset(url='./building-test/assets.json') {
    const assembly=await loadModularCafe(THREE,url,records=>{cafeRecords=records;});
    root.add(assembly.model);cafeAsset=assembly.model;cafeGrid=assembly.grid;cafeRecords=assembly.records;
    for(let i=colliders.length-1;i>=0;i--)if(colliders[i].cafeFallback)colliders.splice(i,1);
    for(let i=lights.length-1;i>=0;i--)if(lights[i].userData.cafeFallback){root.remove(lights[i]);lights.splice(i,1);}
    for(const [x,y,z,intensity,distance]of assembly.config.lights){const light=addLight(x+cafePlacement.x,y+cafePlacement.y,z+cafePlacement.z,intensity,distance);light.userData.priority=.15;light.userData.minFactor=.55;light.userData.factor=cafeLighting.time==='night'?1:cafeLighting.time==='dusk'?.55:.03;}
    const barista=residents.find(person=>person.role==='barista');barista.group.position.set(-14.8,.12,6.5);barista.origin=[-14.8,6.5];
    Object.assign(premises.find(p=>p.id==='cafe'),{x:-13,z:9.5,w:8,d:7});
    cafeFallback.visible=false;cafeDetail.visible=true;configureCafeLighting({});
    return cafeAsset;
  }
  function configureCafeLighting(settings){
    Object.assign(cafeLighting,settings);
    cafeAsset?.traverse(object=>{
      if(!object.isMesh)return;
      for(const material of[object.material].flat()){
        material.envMap=cafeLighting.environment;material.envMapIntensity=cafeLighting.time==='night'?.75:.85;
        for(const map of[material.map,material.normalMap,material.roughnessMap,material.metalnessMap])if(map)map.anisotropy=cafeLighting.quality==='low'?2:8;
        material.needsUpdate=true;
      }
    });
  }
  return {root,mats,lights,colliders,residents,beacons,premises,heightAt,update,loadCafeAsset,configureCafeLighting,cafeStatus:()=>({loaded:!!cafeGrid,records:cafeRecords,placement:cafePlacement,fallback:cafeFallback.visible}),staticMeshCount:root.children.filter(c=>c.isMesh).length};
}
