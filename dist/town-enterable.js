// Two real rooms off the upper market lane. Architecture and furnishings join
// the shared static batches; only a small workshop rotor and one screen atlas move.
export function buildEnterable(ctx) {
  const {THREE,mats,add,box,cyl,beam,sign,collider,addLight,windowFrame,planter,bench}=ctx;
  const group=new THREE.Group();group.name='Enterable workshop and arcade';
  const workshop={id:'workshop',name:'Coppercoil Workshop',kind:'shop',landmark:true,x:-28,z:41,w:14,d:10};
  const arcade={id:'arcade',name:'Afterglow Arcade',kind:'shop',landmark:true,x:28,z:41,w:14,d:10};
  const premises=[workshop,arcade];
  function shell(p,paint) {
    const {x,z,w,d}=p,front=z+d/2,back=z-d/2;
    box(x,.06,z,w,.12,d,'timber');box(x,1.98,back,w,3.84,.28,paint);
    collider(x,back,w+.2,.35,0,5.8);
    for(const s of [-1,1]) {
      box(x+s*w/2,1.98,z,.28,3.84,d,paint);collider(x+s*w/2,z,.35,d+.3,0,5.8);
      const fx=x+s*4.13;
      // A 2.5 metre clear doorway; glazing occupies only the flanking bays.
      box(fx,.49,front,5.75,.74,.28,paint);box(fx,3.4,front,5.75,.96,.28,paint);
      windowFrame(fx,1.89,front+.04,5.25,2.05);
      collider(fx,front,5.75,.36,0,4);
      box(x+s*1.25,1.65,front,.12,3.06,.35,'teal');
    }
    box(x,3.4,front,2.5,.96,.28,paint);
    box(x,.09,front+.24,2.5,.18,.75,'stone');
    for(const dx of [-6.8,6.8])box(x+dx,2.02,front+.18,.2,3.8,.24,'timberDark');
    // Shallow veranda joins the lane, without obstructing either opening.
    box(x,.015,front+1.25,w+.8,.03,2.5,'paving');
    for(const sx of [-1,1])planter(x+sx*6.15,front+1.25,1.2,.7);
  }
  function pendant(x,z,y=3.05) {
    beam([x,3.75,z],[x,y+.18,z],.014,'iron');
    cyl(x,y,z,.32,.23,'copper',.11,20);cyl(x,y-.13,z,.24,.025,'glow',.24,16);
    const light=addLight(x,y-.18,z,1.8,8);light.userData.priority=.65;
  }
  function counter(x,z,w,d,mat='teal') {
    box(x,.61,z,w,1.0,d,mat);box(x,1.16,z,w+.14,.12,d+.15,'timber');
    box(x,.24,z,w+.08,.12,d+.08,'timberDark');collider(x,z,w+.18,d+.2,0,1.3);
  }
  function wallShelf(x,z,w) {
    for(const dx of [-w/2,w/2])box(x+dx,1.55,z,.07,2.6,.44,'iron');
    for(const y of [.42,1.05,1.7,2.35])box(x,y,z,w,.07,.63,'timber');
  }

  // COPPERCOIL WORKSHOP: a brick workshop with northlight sawtooth bays.
  shell(workshop,'brick');
  const northlightRoof=mats.copper.clone();northlightRoof.side=THREE.DoubleSide;
  const northlightGables=mats.brick.clone();northlightGables.side=THREE.DoubleSide;
  for(let i=0;i<3;i++) {
    const z=36.08+i*3.35;
    // Paired triangles form a closed-sided, sloping northlight roof.
    const g=new THREE.BufferGeometry(),positions=[];
    const verts=[[-7.3,0,-1.68],[7.3,0,-1.68],[-7.3,.9,1.68],[7.3,.9,1.68]];
    for(const f of [[0,2,1],[1,2,3]])for(const k of f)positions.push(...verts[k]);
    g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    const uvs=[];for(let k=0;k<positions.length;k+=3)uvs.push(positions[k],positions[k+2]);
    g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.computeVertexNormals();
    add(g,northlightRoof,-28,4.05,z+1.65);
    // Vertical clerestory glazing and visible steel ribs at each high edge.
    box(-28,4.5,z+3.33,14.5,.9,.055,'glass');
    for(const dx of [-7.22,-3.6,0,3.6,7.22])box(-28+dx,4.5,z+3.34,.065,.92,.1,'teal');
    box(-28,4.96,z+3.34,14.7,.1,.17,'teal');
    for(const s of [-1,1]) {
      const side=new THREE.BufferGeometry();
      side.setAttribute('position',new THREE.Float32BufferAttribute([0,0,-1.68,0,0,1.68,0,.9,1.68],3));
      side.computeVertexNormals();
      add(side,northlightGables,-28+s*7.13,4.05,z+1.65);
    }
    beam([-35,3.86,z+1.65],[-21,3.86,z+1.65],.075,'iron');
  }
  // Side flue, rain collection, and a projecting hoist make its purpose legible.
  box(-34.2,4.15,37,.7,2.45,.7,'brick');box(-34.2,5.43,37,.95,.14,.95,'stone');
  box(-28,3.83,46.8,9.3,.22,1.9,'copper',-.05);
  for(const x of [-33,-23])beam([x,3.7,46.1],[x,3.1,47.65],.045,'iron');
  sign('COPPERCOIL WORKSHOP\nRepairs · useful inventions · 0147 220 041',-28,3.47,46.24,10.9,.67,'#344c47');
  sign('WORKSHOP OPEN\nCome see what is taking shape',-26,1.69,46.26,1.0,.68,'#345b54');
  // Hoist is supported outside the right window; the central doorway stays clear.
  for(const x of [-23.4,-21.8])box(x,2.05,47,.12,4.1,.12,'iron');
  box(-22.6,4.1,47,2.25,.16,.2,'iron');beam([-22.7,4,47],[-22.7,2.85,47],.019,'iron');
  cyl(-22.7,2.74,47,.11,.2,'brass',.08,12);collider(-22.6,47,2.0,.32,0,4.3);
  // Tool wall and three-dimensional inventory in the back of the room.
  box(-28,2.16,36.2,7.6,2.3,.1,'timberDark');
  for(let i=0;i<12;i++) {
    const x=-31.3+(i%6)*1.28,y=1.63+Math.floor(i/6)*.82;
    beam([x,y,36.34],[x+.15,y+.42,36.34],.045,'brass');
    box(x+.16,y+.42,36.34,.34,.12,.09,'iron',0,0,i%2?.12:-.12);
    for(const dx of [-.08,.08])cyl(x+dx,y+.5,36.34,.065,.09,'iron',.065,8,Math.PI/2);
  }
  counter(-28,37.1,7.8,1.2,'timberDark');
  wallShelf(-33.95,40.4,1.45);
  for(let i=0;i<8;i++) {
    const y=.64+Math.floor(i/2)*.64,x=-34.38+(i%2)*.76;
    box(x,y,40.4,.55,.38,.44,i%3?'teal':'ivory');
    box(x,y+.02,40.64,.26,.12,.025,'brass');
  }
  collider(-33.95,40.4,1.7,.78,0,2.7);
  // Main invention bench sits to the left, leaving a wide central aisle.
  counter(-31.6,41.5,3.7,1.5);
  for(const x of [-32.8,-30.4]) {
    cyl(x,1.35,41.5,.24,.28,'brass',.24,16);
    beam([x,1.48,41.5],[x,1.96,41.5],.04,'iron');
  }
  box(-31.6,1.49,41.5,2.75,.11,.45,'copper');
  const rotor=new THREE.Group();rotor.position.set(-31.6,1.95,41.5);group.add(rotor);
  const rotorMesh=new THREE.Mesh(new THREE.TorusGeometry(.62,.035,6,32),mats.brass);rotor.add(rotorMesh);
  for(let i=0;i<6;i++) {
    const spoke=new THREE.Mesh(new THREE.BoxGeometry(.045,1.18,.045),mats.teal);
    spoke.rotation.z=i*Math.PI/3;rotor.add(spoke);
  }
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.18,16),mats.brass);hub.rotation.x=Math.PI/2;rotor.add(hub);
  sign('THE RAIN CLOCK\nA flywheel that remembers the weather',-31.6,1.55,42.3,2.8,.45,'#3f514b');
  // A listening apparatus on the opposite table is the discoverable signal.
  counter(-24.4,41.4,3.3,1.5,'timberDark');
  box(-24.4,1.5,41.4,1.7,.58,.7,'teal');box(-24.4,1.51,41.77,1.48,.4,.04,'iron');
  for(let i=0;i<3;i++)cyl(-24.85+i*.45,1.5,41.82,.095,.055,'brass',.095,16,Math.PI/2);
  for(let i=0;i<7;i++)box(-24.94+i*.18,1.72,41.815,.12,.025,.015,'glow');
  beam([-24,1.8,41.4],[-23.65,2.7,41.4],.016,'brass');
  sign('LISTENING COIL\nLeave the dial where you found it',-24.4,1.08,42.2,2.65,.5,'#345b54');
  // A small stock cart and task stool; neither blocks the doorway or signal aisle.
  box(-32.7,.55,44.4,1.45,.16,.9,'timber');
  for(const x of [-33.2,-32.2])for(const z of [44.1,44.7])cyl(x,.25,z,.15,.08,'iron',.15,12,Math.PI/2);
  box(-32.7,.95,44.4,.8,.65,.63,'ivory');collider(-32.7,44.4,1.55,1.0,0,1.35);
  pendant(-30,40,3.1);pendant(-25,43,3.1);
  bench(-34.8,48.6);sign('Making room for good ideas',-28,2.68,36.36,5,.58,'#365952');

  // AFTERGLOW ARCADE: a low copper roof and a stepped, illuminated cinema front.
  shell(arcade,'cream');
  box(28,3.97,41,14.4,.2,10.4,'timberDark');box(28,4.14,41,14.6,.16,10.6,'copper');
  for(const s of [-1,1]) {
    box(28+s*6.75,4.45,46.13,.45,1.02,.48,'teal');
    box(28+s*5.0,4.65,46.13,2.8,1.4,.45,'teal');
    box(28+s*5,5.37,46.13,2.9,.08,.52,'brass');
  }
  box(28,4.95,46.13,7.35,2,.45,'teal');
  box(28,6.0,46.13,7.5,.11,.56,'brass');
  sign('AFTERGLOW\nARCADE · 0147 320 041',28,5.03,46.38,6.85,1.25,'#305550');
  // Broad copper canopy with actual amber lamps aimed down at the threshold.
  box(28,3.25,46.8,10.7,.24,1.75,'copper');box(28,3.13,47.61,10.75,.15,.09,'brass');
  for(let i=0;i<20;i++)cyl(23.1+i*.515,3.11,47.58,.045,.05,'glow',.045,8);
  for(const x of [23.4,32.6]){box(x,2.75,46.4,.08,.8,.08,'brass');box(x,2.79,46.48,.15,.45,.13,'glow');}
  addLight(28,2.95,47,2.1,8).userData.priority=.55;
  sign('Walk in · play a while',28,2.77,46.32,2.15,.43,'#253f3c');
  // A single high-resolution atlas supplies four original illustrated games.
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
  const c=canvas.getContext('2d'),titles=['VALLEY RUNNER','MOON ORCHARD','COPPER CIRCUIT','LAST FREQUENCY'];
  function paintScreens(frame) {
    for(let k=0;k<4;k++) {
      const x=k*256;const bg=c.createLinearGradient(x,0,x,512);
      bg.addColorStop(0,['#0d292f','#24304a','#123d37','#2b253c'][k]);bg.addColorStop(1,'#13252a');
      c.fillStyle=bg;c.fillRect(x,0,256,512);
      c.fillStyle='#f3d69d';c.font='bold 20px Georgia';c.textAlign='center';c.fillText(titles[k],x+128,53,238);
      c.fillStyle='#92c3ad';c.font='13px monospace';c.fillText('DEAD SIGNAL VALLEY',x+128,78);
      if(k===0) {
        c.fillStyle='#477a70';c.beginPath();c.moveTo(x,230);for(let j=0;j<9;j++)c.lineTo(x+j*32,170+(j%3)*28);c.lineTo(x+256,350);c.lineTo(x,350);c.fill();
        c.strokeStyle='#dbad6a';c.lineWidth=5;c.beginPath();c.moveTo(x+65,400);c.lineTo(x+118,237);c.lineTo(x+148,237);c.lineTo(x+207,400);c.stroke();
        c.fillStyle='#e4b48b';c.fillRect(x+118,305+Math.sin(frame)*3,22,27);
      } else if(k===1) {
        c.fillStyle='#e8d8af';c.beginPath();c.arc(x+171,145,31,0,Math.PI*2);c.fill();
        for(let j=0;j<15;j++){const px=x+28+(j%5)*49,py=235+Math.floor(j/5)*55;c.fillStyle='#a4bc8a';c.beginPath();c.arc(px,py,15,0,Math.PI*2);c.fill();c.fillStyle='#dab49b';c.fillRect(px-2,py+10,4,20);}
      } else if(k===2) {
        c.strokeStyle='#4caa9c';c.lineWidth=5;for(let j=0;j<5;j++){c.beginPath();c.moveTo(x+24,155+j*46);c.lineTo(x+72+j*25,155+j*46);c.lineTo(x+72+j*25,350-j*27);c.lineTo(x+232,350-j*27);c.stroke();}
        for(let j=0;j<5;j++){c.fillStyle=j===frame%5?'#fff2bd':'#c39a61';c.beginPath();c.arc(x+72+j*25,155+j*46,8,0,Math.PI*2);c.fill();}
      } else {
        c.strokeStyle='#d9b57c';c.lineWidth=3;c.beginPath();for(let j=0;j<215;j++){const px=x+21+j,py=265+Math.sin(j*.07+frame*.25)*35*Math.sin(j*.025);j?c.lineTo(px,py):c.moveTo(px,py);}c.stroke();
        c.strokeStyle='#73a89a';c.lineWidth=1;for(let j=0;j<8;j++){c.beginPath();c.moveTo(x+26,145+j*28);c.lineTo(x+230,145+j*28);c.stroke();}
      }
      c.fillStyle='#f3d69d';c.font='16px monospace';c.fillText('PRESS START',x+128,447);
      c.fillStyle='#83b4a5';c.font='12px monospace';c.fillText('A LITTLE MORE TIME',x+128,478);
      c.fillStyle='rgba(6,22,23,.1)';for(let y=0;y<512;y+=4)c.fillRect(x,y,256,1);
    }
  }
  paintScreens(0);const atlas=new THREE.CanvasTexture(canvas);atlas.encoding=THREE.sRGBEncoding;atlas.anisotropy=4;
  const screens=new THREE.MeshStandardMaterial({map:atlas,emissiveMap:atlas,emissive:'#ffffff',emissiveIntensity:.7,roughness:.48,metalness:0});screens.name='Afterglow original game screens';
  function cabinet(x,z,rotation,game) {
    const co=Math.cos(rotation),si=Math.sin(rotation),point=(a,b)=>[x+a*co+b*si,z-a*si+b*co];
    const b=(a,y,b,w,h,d,mat,rx=0)=>{const p=point(a,b);box(p[0],y,p[1],w,h,d,mat,rx,rotation);};
    b(0,.58,0,.87,.9,.82,'teal');b(0,.18,0,.92,.12,.87,'iron');
    b(0,1.43,-.19,.87,.88,.4,'timberDark');b(0,1.94,-.09,.96,.22,.7,'copper');
    b(0,1.04,.3,.92,.14,.55,'iron',-.12);
    b(0,1.43,.035,.76,.67,.06,'iron');
    const screen=new THREE.PlaneGeometry(.68,.58),uv=screen.attributes.uv;
    for(let i=0;i<uv.count;i++)uv.setX(i,(game+uv.getX(i))/4);
    const p=point(0,.071);add(screen,screens,p[0],1.45,p[1],0,rotation);
    const titlePoint=point(0,.276);sign(titles[game],titlePoint[0],1.96,titlePoint[1],.82,.145,'#315852',rotation);
    for(const side of [-1,1])b(side*.43,1.35,.02,.07,1.1,.62,'teal');
    for(const [a,material] of [[-.21,'brass'],[.15,'roofLight'],[.29,'glow']]) {
      const p=point(a,.43);cyl(p[0],1.17,p[1],.047,.045,material,.047,10);
    }
    const stick=point(-.21,.43);cyl(stick[0],1.23,stick[1],.024,.12,'iron');cyl(stick[0],1.3,stick[1],.055,.065,'brass',.055,10);
    const coin=point(0,.425);box(coin[0],.69,coin[1],.12,.24,.03,'iron',0,rotation);
    collider(x,z,Math.abs(si)>.5?.96:.97,Math.abs(si)>.5?.97:.96,0,2.15);
  }
  // Machines face the room; the centre remains over six metres wide.
  for(let row=0;row<4;row++){cabinet(22.65,38.25+row*1.65,Math.PI/2,row);cabinet(33.35,38.25+row*1.65,-Math.PI/2,(row+2)%4);}
  counter(28,37.05,5.2,1.2,'teal');
  box(27.2,1.38,37.05,.55,.38,.45,'ivory');box(27.2,1.61,37.05,.3,.06,.28,'iron');
  for(let i=0;i<5;i++){cyl(28.2+i*.3,1.28,37.05,.095,.13,'brass',.095,12);}
  sign('TOKENS & TINY VICTORIES\nGames made here · Everyone welcome',28,2.48,36.24,6.5,1.12,'#2c4c48');
  // The signal console is a physically furnished alcove, reachable from the aisle.
  box(28,1.1,40.5,2.2,1.98,.82,'timberDark');box(28,1.48,40.94,1.75,.8,.06,'iron');
  const signalScreen=new THREE.PlaneGeometry(1.6,.7),suv=signalScreen.attributes.uv;
  for(let i=0;i<suv.count;i++)suv.setX(i,(3+suv.getX(i))/4);
  add(signalScreen,screens,28,1.5,40.98);box(28,.94,41.07,2.25,.12,.47,'teal');
  for(const x of [27.55,28.45])cyl(x,1.05,41.18,.075,.07,'brass',.075,12);
  sign('ONE SIGNAL LEFT\nListen between the games',28,2.22,40.97,2.3,.46,'#3b514a');
  collider(28,40.65,2.4,1.2,0,2.5);
  for(const x of [25,31])pendant(x,41.5,3.1);
  // Side seating permits a pause without crossing the playing or entry lanes.
  bench(24.1,44.7);bench(31.9,44.7);
  sign('A little light after the last train',28,3.52,36.25,8,.5,'#315852');

  let lastFrame=-1;
  return {
    group,premises,
    entries:{workshop:{x:-28,z:48.2,yaw:0,point:[-24.4,1.4,43.1]},arcade:{x:28,z:48.2,yaw:0,point:[28,1.5,42.2]}},
    walkHeight(x,z) {
      for(const p of premises)if(x>p.x-7&&x<p.x+7&&z>36&&z<46.12)return .12;
      for(const p of premises)if(Math.abs(x-p.x)<1.3&&z>=46&&z<46.62)return .18;
      return null;
    },
    update(t,quality) {
      rotor.rotation.z=t*.16;
      const frame=Math.floor(t*(quality==='low'?1:2));
      if(frame!==lastFrame){lastFrame=frame;paintScreens(frame);atlas.needsUpdate=true;}
    }
  };
}
