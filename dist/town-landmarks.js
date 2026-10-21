// The valley's civic buildings share its materials, but each has its own silhouette.
// Static geometry is handed to the world's spatial material batches.
export function buildLandmarks(ctx) {
  const {THREE,mats,add,box,cyl,beam,sign,collider,addLight,bench,planter}=ctx;
  const group=new THREE.Group();group.name='Copperlight civic landmarks';
  const tau=Math.PI*2;
  function triangleSolid(vertices,faces,material,x=0,y=0,z=0) {
    const p=[],uv=[];
    for(const face of faces)for(const i of face){const v=vertices[i];p.push(...v);uv.push(v[0],v[2]);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();add(g,material,x,y,z);
  }
  function picture(x,y,z,w,h,seed=0,rotation=0) {
    // Original painted valley studies: physical canvas, frame and layered paint.
    const c=document.createElement('canvas');c.width=512;c.height=384;
    const p=c.getContext('2d');p.fillStyle=['#d1d9c9','#e7cba4','#b4c6c3'][seed%3];p.fillRect(0,0,512,384);
    for(let j=0;j<4;j++){
      p.fillStyle=['#adb99c','#8f9d83','#6d8b7b','#587b75'][j];p.beginPath();p.moveTo(0,384);
      for(let i=0;i<=12;i++)p.lineTo(i*43,135+j*49+Math.sin(i*.8+seed+j)*36);
      p.lineTo(512,384);p.closePath();p.fill();
    }
    p.fillStyle='#acd0c5';p.beginPath();p.moveTo(290,210);p.bezierCurveTo(135,270,440,304,220,384);p.lineTo(330,384);p.bezierCurveTo(472,300,190,265,307,210);p.fill();
    p.fillStyle='#edc98d';p.beginPath();p.arc(390,70,24,0,tau);p.fill();
    // A subtle canvas weave retains its character under nearby practical light.
    p.globalAlpha=.07;for(let i=0;i<512;i+=3){p.fillStyle=i%2?'#fff8dc':'#2d4e48';p.fillRect(i,0,1,384);}p.globalAlpha=1;
    const map=new THREE.CanvasTexture(c);map.encoding=THREE.sRGBEncoding;map.anisotropy=4;
    const material=new THREE.MeshStandardMaterial({map,roughness:.94,metalness:0});material.name='Original River Study '+seed;
    box(x,y,z,w+.12,h+.12,.075,'timberDark',0,rotation);
    add(new THREE.PlaneGeometry(w,h),material,x+Math.sin(rotation)*.045,y,z+Math.cos(rotation)*.045,0,rotation);
  }
  function lantern(x,y,z) {
    box(x,y,z,.28,.42,.28,'glow');box(x,y+.24,z,.4,.08,.4,'teal');box(x,y-.24,z,.35,.06,.35,'iron');
    addLight(x,y,z,.7,8);
  }

  // Cinderwatch Observatory: a public instrument room under a patinated dome.
  const ox=-43,oz=24,terrace=1.2;
  cyl(ox,.57,oz,8,1.14,'stone',8,48);cyl(ox,1.17,oz,8,.06,'paving',8,48);
  const rampW=4,rampNear=30,rampFar=36;
  triangleSolid([[-rampW/2,0,0],[rampW/2,0,0],[-rampW/2,1.2,-6],[rampW/2,1.2,-6],[-rampW/2,0,-6],[rampW/2,0,-6]],
    [[0,1,3],[0,3,2],[0,2,4],[1,5,3],[0,4,5],[0,5,1],[2,3,5],[2,5,4]],'paving',ox,0,rampFar);
  for(const side of [-1,1]){
    beam([ox+side*2.12,.85,36],[ox+side*2.12,2.05,30],.045,'teal');
    for(const z of [30.2,32.8,35.6]){const y=(36-z)*.2;box(ox+side*2.12,y+.42,z,.065,.84,.065,'iron');}
  }
  // Retaining edge, with a genuine opening for the accessible ramp.
  for(let i=0;i<32;i++){
    const a=(i+.5)*tau/32;if(Math.cos(a)>.90)continue;
    const x=ox+Math.sin(a)*7.85,z=oz+Math.cos(a)*7.85;
    box(x,1.42,z,1.56,.44,.18,'stone',0,a);collider(x,z,1.56,.24,.9,1.8);
  }
  cyl(ox,terrace+.05,oz,5.9,.1,'timber',5.9,48);
  for(let i=0;i<24;i++){
    const a=(i+.5)*tau/24,x=ox+Math.sin(a)*5.65,z=oz+Math.cos(a)*5.65;
    const front=Math.cos(a)>.87;
    if(front)continue;
    box(x,1.65,z,1.49,.9,.26,'cream',0,a);
    box(x,4.62,z,1.49,.6,.26,'cream',0,a);
    box(x,3.1,z,1.44,2.1,.04,'glass',0,a);
    // Curved wall segments have conservative compact bounds, avoiding phantom walls.
    collider(x,z,.54+Math.abs(Math.cos(a))*1.2,.54+Math.abs(Math.sin(a))*1.2,1.2,4.9);
    const edge=a-tau/48;box(ox+Math.sin(edge)*5.65,3.05,oz+Math.cos(edge)*5.65,.1,3.7,.1,'teal');
  }
  cyl(ox,4.98,oz,5.95,.24,'teal',5.95,48);
  const dome=new THREE.SphereGeometry(5.9,40,20,0,tau,0,Math.PI/2);dome.scale(1,.69,1);add(dome,'copper',ox,5.05,oz);
  // Radial standing seams make the dome legible from the town overview.
  for(let n=0;n<12;n++)for(let s=0;s<10;s++){
    const a=n*tau/12,b=s*Math.PI/20,c=(s+1)*Math.PI/20;
    beam([ox+5.93*Math.cos(b)*Math.sin(a),5.05+4.1*Math.sin(b),oz+5.93*Math.cos(b)*Math.cos(a)],
      [ox+5.93*Math.cos(c)*Math.sin(a),5.05+4.1*Math.sin(c),oz+5.93*Math.cos(c)*Math.cos(a)],.026,'teal');
  }
  cyl(ox,9.22,oz,.3,.22,'brass',.18,16);
  // Telescope, desk and star charts sit behind the deep window wall.
  cyl(ox,1.9,oz,.45,1.25,'iron',.3,16);cyl(ox,2.53,oz,.62,.16,'brass',.62,16);
  beam([ox,2.6,oz],[ox-1.6,3.6,oz-1.3],.3,'teal');
  beam([ox-1.65,3.63,oz-1.35],[ox-1.88,3.78,oz-1.54],.37,'iron');
  box(ox+3.5,1.97,oz,1.5,.12,2.3,'timber');
  for(const z of [oz-.85,oz+.85])box(ox+3.5,1.6,z,1.3,.65,.08,'iron');
  box(ox+3.5,2.05,oz,.95,.025,1.6,'ivory');
  for(let i=0;i<7;i++)cyl(ox+3.3+Math.sin(i*2)*.3,2.075,oz+Math.cos(i*3)*.5,.025,.01,'teal',.025,6);
  sign('CINDERWATCH\nPUBLIC OBSERVATORY',ox,4.45,29.72,4.8,.73);
  sign('LISTEN ABOVE THE NOISE\nEvening sky sessions · all welcome',ox-3.5,2.2,30.5,2.5,.8);
  bench(ox-6.4,34.4);lantern(ox-2.6,3.15,30);lantern(ox+2.6,3.15,30);
  // A small directional receiver gives the exterior signal a visible source.
  cyl(ox+3.4,1.9,29.7,.065,1.4,'iron');
  const dish=new THREE.SphereGeometry(.55,16,8,0,tau,0,.65);dish.rotateX(Math.PI*.5);add(dish,'brass',ox+3.4,2.63,29.7,-.35,0);
  beam([ox+3.4,2.6,29.7],[ox+3.4,2.7,30.2],.025,'iron');
  addLight(ox,3.4,oz,1.1,12);

  // Riverglass Studio: north-light roof teeth, deep atelier, original canvases.
  const sx=43,sz=17;
  box(sx,.08,sz,12,.16,10,'timber');box(sx,2.1,12,12,4.2,.28,'cream');
  for(const x of [37,49]){box(x,2.1,sz,.28,4.2,10,'plaster');collider(x,sz,.32,10,0,5.3);}
  collider(sx,12,12,.3,0,5.3);
  box(sx,.43,22,12,.7,.25,'brick');box(sx,3.75,22,12,.9,.25,'cream');
  box(sx,2.0,22,11.5,2.45,.04,'glass');collider(sx,22,12,.28,0,4.3);
  for(const x of [37.2,40,43,46,48.8])box(x,2.1,22.08,.11,4.1,.18,'teal');
  for(const y of [.82,3.25])box(sx,y,22.08,11.7,.09,.18,'teal');
  for(let tooth=0;tooth<3;tooth++){
    const z0=12+tooth*10/3,z1=z0+10/3;
    triangleSolid([[-6,0,0],[6,0,0],[-6,0,10/3],[6,0,10/3],[-6,1.35,10/3],[6,1.35,10/3]],
      [[0,2,4],[1,5,3],[0,5,1],[0,4,5],[0,3,2],[0,1,3]],'copper',sx,4.25,z0);
    // Glazing is mounted on the vertical face, with a timber back reveal.
    box(sx,4.925,z1+.012,11.75,1.3,.035,'glass');
    for(const x of [37,40,43,46,49])box(x,4.92,z1+.05,.06,1.26,.08,'teal');
    box(sx,4.28,z1,12,.09,.15,'teal');box(sx,5.6,z1,12.3,.12,.18,'teal');
  }
  box(sx,4.18,sz,12.3,.15,10.25,'timberDark');
  sign('RIVERGLASS STUDIO\nPaintings · open workroom',sx,3.78,22.18,8.4,.65);
  // Back-wall works are intentionally large enough to read through the glazing.
  for(let i=0;i<3;i++)picture(39.4+i*3.6,2.35,12.18,2.4,1.8,i);
  for(const x of [39.5,46.5]){
    for(const dx of [-.55,.55])beam([x+dx,.12,18.3],[x,2.6,17.6],.045,'timber');
    beam([x,.12,16.7],[x,2.6,17.6],.045,'timberDark');
    box(x,1.25,17.93,1.6,.07,.28,'timber');picture(x,2.0,17.8,1.3,1.0,x<43?3:4);
    collider(x,17.6,1.3,1.7,0,2.7);
  }
  box(sx,.88,15.3,2.7,.13,1.2,'timber');
  for(const x of [42,44])for(const z of [14.9,15.7])box(x,.45,z,.08,.86,.08,'timberDark');
  for(let i=0;i<8;i++)cyl(42+i*.23,1.02,15.3,.065,.12,['teal','roof','ivory','brass'][i%4],.07,10);
  for(const x of [38,48])planter(x,23.4,1.8,.65);
  bench(46.5,25.2);lantern(37.4,2.9,22.5);lantern(48.6,2.9,22.5);addLight(sx,3,17,1.1,11);

  // The Resonance Hall is the town arena: a civic oval with a lantern-lit foyer.
  const ax=0,az=76;
  const floor=new THREE.CylinderGeometry(1,1,.18,64);floor.scale(13,1,9);add(floor,'paving',ax,.09,az);
  for(let i=0;i<40;i++){
    const a=(i+.5)*tau/40,x=Math.sin(a)*12.55,z=az+Math.cos(a)*8.55;
    if(Math.cos(a)<-.85)continue; // Wide south-facing town entrance, towards -Z.
    const tangent=Math.atan2(8.55*Math.sin(a),12.55*Math.cos(a));
    box(x,1.55,z,1.85,3.1,.26,'cream',0,tangent);
    box(x,3.55,z,1.85,.75,.26,'teal',0,tangent);
    collider(x,z,.3+Math.abs(Math.cos(tangent))*1.8,.3+Math.abs(Math.sin(tangent))*1.8,0,5.2);
  }
  const hallDome=new THREE.SphereGeometry(1,48,20,0,tau,0,Math.PI/2);hallDome.scale(13.2,4.4,9.2);add(hallDome,'copper',ax,4.1,az);
  const rim=new THREE.CylinderGeometry(1,1,.18,64);rim.scale(13.3,1,9.3);add(rim,'teal',ax,4.1,az);
  // The closed shallow underside separates the foyer from the weather roof.
  const ceiling=new THREE.CylinderGeometry(1,1,.1,64);ceiling.scale(12.9,1,8.9);add(ceiling,'timberDark',ax,3.96,az);
  for(let n=0;n<16;n++){
    const a=n*tau/16;
    for(let s=0;s<9;s++){
      const b=s*Math.PI/18,c=(s+1)*Math.PI/18;
      beam([13.26*Math.cos(b)*Math.sin(a),4.17+4.42*Math.sin(b),az+9.26*Math.cos(b)*Math.cos(a)],
        [13.26*Math.cos(c)*Math.sin(a),4.17+4.42*Math.sin(c),az+9.26*Math.cos(c)*Math.cos(a)],.055,'teal');
    }
    const x=12.7*Math.sin(a),z=az+8.7*Math.cos(a);
    if(Math.cos(a)<-.86)continue;
    beam([x,.12,z],[x,4.1,z],.105,'timberDark');
  }
  // A low portico makes the entrance clear from the long shopping street.
  box(0,3.55,66.8,10.5,.26,3.2,'teal');
  for(const x of [-4.7,4.7]){box(x,1.8,66.2,.28,3.6,.28,'timberDark');collider(x,66.2,.35,.35,0,3.7);}
  sign('RESONANCE HALL\nTown arena · music · gathering',0,3.05,65.12,8.5,.8,'#315c55',Math.PI);
  // Interior terraced seating and a real stage are visible through the open foyer.
  for(let row=0;row<3;row++){
    const z=80+row*1.35;box(0,.35+row*.3,z,14,.7+row*.6,1.15,'timberDark');
    for(let seat=0;seat<14;seat++){const x=-6.4+seat*.98;box(x,.76+row*.3,z,.72,.12,.7,'teal');box(x,1.1+row*.3,z+.35,.72,.65,.1,'teal');}
    collider(0,z,14,1.2,0,2.3);
  }
  box(-7.6,.34,75,5.2,.68,5,'timber');collider(-7.6,75,5.2,5,0,.7);
  for(const x of [-9.5,-6]){cyl(x,1.1,76,.035,1.5,'iron');beam([x,1.85,76],[x+.55,1.95,76],.025,'iron');}
  sign('TONIGHT AT THE HALL\nThe Lantern Ensemble · 19:30',-7.6,2.55,77.95,4.3,1.3,'#566e61',Math.PI);
  for(const side of [-1,1]){
    box(side*6.7,1.3,68,2.1,2.6,.2,'timberDark');
    sign(side<0?'VALLEY MAKERS FAIR\nSaturday · inventions & stories':'OPEN HALL\nPractice · listen · take a seat',side*6.7,1.55,67.87,1.85,1.65,'#6b725b',Math.PI);
    collider(side*6.7,68,2.2,.3,0,2.7);lantern(side*4.7,2.7,65.7);
    bench(side*8.7,64.1,0);planter(side*11.2,65,1.8,1);
  }
  addLight(0,3.25,70,1.2,12);addLight(0,3.25,79,1.3,14);

  const premises=[
    {id:'observatory',kind:'landmark',landmark:true,name:'Cinderwatch Observatory',x:ox,z:oz,w:12,d:12,visit:{x:-43,z:32.5,yaw:0},point:[-43,1.7,31.5]},
    {id:'studio',kind:'landmark',landmark:true,name:'Riverglass Studio',x:sx,z:sz,w:12,d:10,visit:{x:43,z:25,yaw:0},point:[43,1.2,24]},
    {id:'arena',kind:'landmark',landmark:true,name:'Resonance Hall',x:ax,z:az,w:26,d:18,visit:{x:0,z:63.5,yaw:Math.PI},point:[0,1.2,64.5]}
  ];
  function walkHeight(x,z) {
    if(x>=-45&&x<=-41&&z>=rampNear&&z<=rampFar)return (rampFar-z)*.2;
    if(Math.hypot(x-ox,z-oz)<=8)return terrace;
    if((x/12.9)**2+((z-az)/8.9)**2<=1)return .18;
    return null;
  }
  return {group,premises,walkHeight,update(){}};
}
