// Eight working shop windows along the market lanes. Every display has a room
// behind it; static geometry joins the world's material/chunk batches.
export function buildMarket(ctx) {
  const {THREE,mats}=ctx;
  const group=new THREE.Group();group.name='Copperlight market lanes';
  const premises=[];
  const fruitRed=new THREE.MeshStandardMaterial({color:'#be6d4d',roughness:.46,metalness:0});
  const shops=[
    {id:'grocer',name:'ROOT & RIND',sub:'Seasonal provisions',type:'grocer',x:-13,z:26,ry:Math.PI/2,roof:'hip',paint:'cream'},
    {id:'bicycle',name:'SPOKE & SPAR',sub:'Cycles & careful repairs',type:'bicycle',x:13,z:26,ry:-Math.PI/2,roof:'gable',paint:'brick'},
    {id:'apothecary',name:'STILL LEAF',sub:'Valley apothecary',type:'apothecary',x:-13,z:38,ry:Math.PI/2,roof:'parapet',paint:'plaster'},
    {id:'tailor',name:'THREAD WEATHER',sub:'Clothes made to last',type:'tailor',x:13,z:38,ry:-Math.PI/2,roof:'hip',paint:'cream'},
    {id:'records',name:'SOFT FREQUENCY',sub:'Records for the evening',type:'records',x:-13,z:60,ry:Math.PI/2,roof:'parapet',paint:'brick'},
    {id:'toy-hobby',name:'POCKET ORBIT',sub:'Small wonders & model kits',type:'toy',x:13,z:60,ry:-Math.PI/2,roof:'gable',paint:'plaster'},
    {id:'tea',name:'MIST & MEASURE',sub:'Loose tea & quiet company',type:'tea',x:-27,z:19,ry:0,w:7,d:6,roof:'hip',paint:'plaster'},
    {id:'restaurant',name:'HEARTH & HOLLOW',sub:'Soup, supper & valley fare',type:'restaurant',x:27,z:19,ry:0,w:7,d:6,roof:'gable',paint:'cream'}
  ];
  const worldRotation=new THREE.Matrix4(),localRotation=new THREE.Matrix4(),orientation=new THREE.Quaternion();
  for(let shopIndex=0;shopIndex<shops.length;shopIndex++) {
    const shop=shops[shopIndex],{x,z,ry,type,name,sub,paint}=shop;
    const w=shop.w||6.5,d=shop.d||7,front=d/2,back=-d/2;
    const cosine=Math.cos(ry),sine=Math.sin(ry);
    const point=(px,py,pz)=>[x+px*cosine+pz*sine,py,z-px*sine+pz*cosine];
    function add(geometry,material,px,py,pz,rx=0,localY=0,rz=0) {
      // Rotate geometry before batching so the shop can face either street.
      orientation.setFromEuler(new THREE.Euler(rx,localY,rz));
      localRotation.makeRotationFromQuaternion(orientation);worldRotation.makeRotationY(ry);
      geometry.applyMatrix4(worldRotation.multiply(localRotation));
      ctx.add(geometry,material,...point(px,py,pz));
    }
    function box(px,py,pz,width,height,depth,material,rx=0,localY=0,rz=0) {
      const geometry=new THREE.BoxGeometry(width,height,depth),p=geometry.attributes.position,n=geometry.attributes.normal,uv=geometry.attributes.uv;
      for(let i=0;i<p.count;i++)uv.setXY(i,Math.abs(n.getX(i))>.5?p.getZ(i):p.getX(i),Math.abs(n.getY(i))>.5?p.getZ(i):p.getY(i));
      add(geometry,material,px,py,pz,rx,localY,rz);
    }
    const cyl=(px,py,pz,r,h,material,rt=r,segments=12,rx=0,rz=0)=>add(new THREE.CylinderGeometry(rt,r,h,segments),material,px,py,pz,rx,0,rz);
    const sphere=(px,py,pz,r,material,sx=1,sy=1,sz=1)=>{const geo=new THREE.SphereGeometry(r,10,7);geo.scale(sx,sy,sz);add(geo,material,px,py,pz);};
    const beam=(a,b,r,material)=>ctx.beam(point(...a),point(...b),r,material);
    const sign=(text,px,py,pz,width,height,bg='#315c55',localY=0)=>ctx.sign(text,...point(px,py,pz),width,height,bg,ry+localY);
    function collider(px,pz,width,depth,minY=0,maxY=7) {
      const p=point(px,0,pz),quarterTurn=Math.abs(sine)>.5;
      ctx.collider(p[0],p[2],quarterTurn?depth:width,quarterTurn?width:depth,minY,maxY);
    }
    function frame(px,py,pz,width,height,glass=true) {
      if(glass)box(px,py,pz,width,height,.025,'glass');
      for(const side of [-1,1])box(px+side*width/2,py,pz+.035,.07,height+.12,.1,'timberDark');
      for(const side of [-1,1])box(px,py+side*height/2,pz+.035,width+.12,.075,.1,'timberDark');
      box(px,py,pz+.045,.045,height,.09,'timberDark');
    }
    function shelf(px,pz,width=2.2,rows=3) {
      box(px,1.05,pz,width,2.05,.15,'timberDark');
      for(let row=0;row<rows;row++)box(px,.4+row*.57,pz+.21,width,.065,.58,'timber');
      for(const side of [-1,1])box(px+side*(width/2-.04),1.02,pz+.12,.075,2.05,.5,'timber');
    }
    function crate(px,py,pz,width=.8) {
      box(px,py+.04,pz,width,.08,.7,'timberDark');
      for(const side of [-1,1])for(let row=0;row<3;row++)box(px,py+.11+row*.105,pz+side*.33,width,.075,.045,'timber');
      for(const side of [-1,1])box(px+side*(width/2-.025),py+.2,pz,.05,.37,.7,'timber');
    }
    function teaSet(px,py,pz) {
      cyl(px,py,pz,.18,.16,'ceramic',.13,14);sphere(px,py+.11,pz,.14,'ceramic',1,.35,1);
      beam([px+.12,py+.04,pz],[px+.3,py+.14,pz],.04,'ceramic');
      for(const side of [-1,1])cyl(px+side*.37,py-.035,pz+.12,.075,.1,'ceramic',.09);
    }
    function bicycle(px,py,pz,scale=1) {
      const p=(a,b,c)=>[px+a*scale,py+b*scale,pz+c*scale];
      for(const wheelX of [-.59,.59]) {
        add(new THREE.TorusGeometry(.36*scale,.035*scale,6,20),'iron',...p(wheelX,.4,0));
        add(new THREE.TorusGeometry(.3*scale,.012*scale,4,20),'brass',...p(wheelX,.4,.005));
        for(let i=0;i<8;i++) {const a=i*Math.PI/4;beam(p(wheelX,.4,0),p(wheelX+Math.cos(a)*.3,.4+Math.sin(a)*.3,0),.007*scale,'iron');}
      }
      for(const [a,b] of [ [[-.59,.4,0],[-.12,.45,0]], [[-.59,.4,0],[-.28,.94,0]], [[-.28,.94,0],[-.12,.45,0]], [[-.28,.94,0],[.38,.95,0]], [[-.12,.45,0],[.38,.95,0]], [[.38,.95,0],[.59,.4,0]] ])beam(p(...a),p(...b),.035*scale,'teal');
      beam(p(-.28,.94,0),p(-.28,1.1,0),.025*scale,'iron');
      box(...p(-.28,1.1,0),.35*scale,.07*scale,.2*scale,'timberDark');
      beam(p(.38,.95,0),p(.31,1.19,0),.025*scale,'iron');beam(p(.31,1.19,-.22),p(.31,1.19,.22),.025*scale,'iron');
      beam(p(-.12,.45,-.13),p(-.12,.45,.13),.025*scale,'iron');
    }
    function record(px,py,pz,r=.25) {
      cyl(px,py,pz,r,.025,'iron',r,20,Math.PI/2);cyl(px,py,pz+.02,r*.27,.012,'roofLight',r*.27,12,Math.PI/2);
    }

    // A continuous room shell gives views through to the rear shelving, with
    // a genuinely recessed floor and ceiling rather than a flat window card.
    const upperHeight=type==='records'?1.8:type==='bicycle'?2:2.25,upperCenter=3.45+upperHeight/2;
    box(0,.07,0,w,.14,d,'timber');box(0,1.57,back,w,3.14,.23,paint);
    for(const side of [-1,1])box(side*w/2,1.57,0,.23,3.14,d,paint);
    box(0,3.15,0,w,.16,d,'timberDark');
    box(0,.37,front,w,.6,.2,type==='apothecary'?'teal':'timber');
    box(0,2.92,front,w,.62,.23,paint);
    // Large clear panes leave the contents legible from the street.
    frame(0,1.64,front+.015,w-.44,1.97);
    collider(0,0,w,d,0,7.8);
    box(0,3.38,0,w+.2,.18,d+.2,'stone');
    box(0,upperCenter,0,w,upperHeight,d,paint);
    for(const px of [-w*.26,w*.26]) {
      box(px,upperCenter,front+.035,1.35,1.38,.035,'timberDark');
      box(px,upperCenter,front+.06,1.14,1.2,.028,'glow');
      frame(px,upperCenter,front+.085,1.18,1.23);
      for(const side of [-1,1])box(px+side*.78,upperCenter,front+.09,.26,1.48,.1,shopIndex%2?'teal':'timber');
    }
    const eaves=3.45+upperHeight;
    if(shop.roof==='parapet') {
      box(0,eaves+.03,0,w+.25,.18,d+.25,'copper');
      for(const side of [-1,1])box(side*w/2,eaves+.32,0,.2,.65,d+.2,paint);
      for(const side of [-1,1])box(0,eaves+.32,side*d/2,w,.65,.2,paint);
      box(0,eaves+.69,front,w+.35,.16,.35,'stone');
      box(0,eaves+.97,front,2.3,.45,.18,paint);box(0,eaves+1.22,front,2.5,.12,.3,'stone');
      box(-1.7,eaves+.45,-1.5,.9,.6,.7,'teal');
    } else {
      const rise=shop.roof==='gable'?1.4:1.05,halfW=w/2+.38,halfD=d/2+.38;
      const ridgeX=shop.roof==='gable'?halfW:halfW*.48;
      const vertices=[[-halfW,0,-halfD],[halfW,0,-halfD],[halfW,0,halfD],[-halfW,0,halfD],[-ridgeX,rise,0],[ridgeX,rise,0]];
      const triangles=[[0,5,1],[0,4,5],[1,5,2],[2,4,3],[2,5,4],[3,4,0]];
      const positions=[],uv=[];
      for(const triangle of triangles)for(const index of triangle){const p=vertices[index];positions.push(...p);uv.push(p[0],p[2]);}
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();add(geometry,'roof',0,eaves+.1,0);
      box(0,eaves+.03,0,w+.65,.17,d+.65,'timberDark');
      for(const side of [-1,1])for(let row=0;row<6;row++) {
        const t=(row+.5)/6,span=shop.roof==='gable'?w+.7:(w+.7)*(1-.48*t);
        box(0,eaves+.13+rise*t,side*halfD*(1-t),span,.065,.21,row%3?'roof':'roofLight',side*Math.atan2(rise,halfD));
      }
      box(0,eaves+rise+.13,0,ridgeX*2+.15,.13,.22,'roofLight');
      box(-w*.32,eaves+.7,back+1,.55,1.5,.55,'brick');box(-w*.32,eaves+1.48,back+1,.75,.13,.75,'stone');
    }
    // Each storefront has its own restrained canopy and supported signboard.
    const canopyMat=type==='grocer'?'leafDark':type==='records'?'roof':'teal';
    if(type==='bicycle'||type==='records') {
      box(0,2.82,front+.5,w+.3,.16,1.12,'copper');
      for(const side of [-1,1])beam([side*(w/2-.3),2.1,front+.08],[side*(w/2-.3),2.74,front+.96],.035,'iron');
    } else {
      const stripeWidth=(w+.3)/12;
      for(let i=0;i<12;i++) {
        const px=-(w+.3)/2+(i+.5)*stripeWidth,material=i%2?'fabric':canopyMat;
        box(px,2.78,front+.52,stripeWidth,.04,1.1,material,-.12);
        box(px,2.61,front+1.06,stripeWidth,.28,.035,material);
        const shape=new THREE.Shape();shape.moveTo(-stripeWidth/2,0);shape.lineTo(stripeWidth/2,0);shape.absarc(0,0,stripeWidth/2,0,Math.PI,true);shape.closePath();add(new THREE.ShapeGeometry(shape),material,px,2.47,front+1.08);
      }
      for(const side of [-1,1])beam([side*(w/2-.15),2.8,front],[side*(w/2-.15),2.6,front+.98],.025,'iron');
    }
    box(0,3.14,front+.17,w-.16,.72,.16,'timberDark');
    sign(`${name}\n${sub} · 0147 221 ${310+shopIndex}`,0,3.17,front+.263,w-.36,.59,type==='records'?'#674c42':type==='toy'?'#67694c':'#315c55');
    shelf(-w*.23,back+.26,w*.4);shelf(w*.23,back+.26,w*.4);
    box(0,.82,front-1.65,w-1.1,.12,1.02,'timber');
    for(const px of [-w*.33,w*.33])box(px,.42,front-1.65,.11,.82,.8,'timberDark');
    // A warm pendant shines onto the actual room's shelves and counter.
    beam([0,3.02,.25],[0,2.48,.25],.012,'iron');cyl(0,2.44,.25,.23,.16,'copper',.09);cyl(0,2.35,.25,.18,.025,'glow');
    ctx.addLight(...point(0,2.3,.4),.7,7.5);
    box(w/2-.42,1.58,front+.14,.08,2.65,.16,'timberDark');

    if(type==='grocer') {
      for(let row=0;row<3;row++)for(let col=0;col<10;col++) {
        const px=-w/2+.45+col*(w-.9)/10,py=.65+row*.57;
        cyl(px,py,back+.64,.12,.3,col%3?'ceramic':'leafDark',.1);
      }
      for(const px of [-1.65,0,1.65]) {
        crate(px,.9,front-1.65,1.35);crate(px,.08,front+.64,1.3);
        for(let j=0;j<8;j++) {
          sphere(px-.4+(j%4)*.27,1.28,front-1.83+Math.floor(j/4)*.29,.13,j%2?fruitRed:'leaf');
          sphere(px-.4+(j%4)*.27,.48,front+.48+Math.floor(j/4)*.29,.13,j%2?'pastry':'leaf');
        }
        collider(px,front+.64,1.35,.73,0,.65);
      }
      sign('FROM THE HILLS\nPears · Squash · Fresh herbs',0,2,back+.14,3,.75,'#46654a');
    } else if(type==='bicycle') {
      bicycle(-1.35,.89,front-1.65,.9);bicycle(1.48,0,.15,.9);bicycle(-1.1,0,front+.7,.92);
      collider(-1.1,front+.7,2,.62,0,1.3);
      for(let i=0;i<5;i++){const px=-1.5+i*.7;beam([px,1.65,back+.55],[px+.15,1.97,back+.55],.035,'iron');box(px,1.64,back+.55,.18,.08,.08,'brass');}
      box(1.9,.4,front+.66,1.05,.8,.65,'teal');sign('TYRES\nAIR & ADVICE',1.9,.57,front+1, .83,.5);
      collider(1.9,front+.66,1.05,.65,0,.85);
    } else if(type==='apothecary') {
      for(let row=0;row<3;row++)for(let i=0;i<12;i++) {
        const px=-2.5+i*.45,py=.58+row*.57;cyl(px,py,back+.64,.1,.26,i%3?'ceramic':'teal',.085);
        cyl(px,py+.16,back+.64,.085,.065,'timberDark');box(px,py,back+.745,.1,.1,.012,'ivory');
      }
      for(const px of [-1.6,0,1.6]){cyl(px,1.06,front-1.65,.21,.32,'ceramic',.25);beam([px,1.2,front-1.65],[px+.12,1.56,front-1.65],.045,'timberDark');}
      box(-2,.37,front+.63,1.3,.74,.7,'teal');sign('GARDEN SALVES\nSmall batches',-2,.63,front+1,.98,.47);
      collider(-2,front+.63,1.3,.7,0,.8);
      for(const px of [1.1,1.8]){cyl(px,.27,front+.64,.26,.47,'ceramic',.32);for(let i=0;i<5;i++)beam([px,.5,front+.64],[px+(i-2)*.1,1+(i%2)*.16,front+.64],.025,'leafDark');}
      collider(1.45,front+.64,1.2,.7,0,1.2);
    } else if(type==='tailor') {
      for(const side of [-1,1]) {
        const px=side*1.65;cyl(px,.33,.8,.025,.55,'iron');cyl(px,.05,.8,.3,.055,'iron');
        add(new THREE.CylinderGeometry(.24,.31,.78,10),side<0?'fabric':'teal',px,1.08,.8);
        sphere(px,1.6,.8,.15,'timber');beam([px-.38,1.4,.8],[px+.38,1.4,.8],.04,'timber');
      }
      for(let row=0;row<3;row++)for(let i=0;i<8;i++)box(-2.3+i*.65,.51+row*.57,back+.62,.48,.14,.4,['fabric','teal','roofLight'][i%3]);
      box(0,1.04,front-1.65,.7,.32,.38,'iron');box(0,.91,front-1.65,.85,.07,.48,'iron');
      box(-1.8,.3,front+.63,1,.6,.62,'timber');for(let i=0;i<4;i++)box(-1.8,.65+i*.09,front+.63,.9,.085,.55,i%2?'fabric':'teal');collider(-1.8,front+.63,1,.65,0,1.1);
      beam([1.1,.05,front+.65],[1.1,1.38,front+.65],.03,'iron');beam([.7,1.25,front+.65],[1.5,1.25,front+.65],.03,'iron');box(1.1,.98,front+.65,.63,.6,.09,'fabric');collider(1.1,front+.65,.9,.4,0,1.5);
    } else if(type==='records') {
      for(let row=0;row<3;row++)for(let i=0;i<8;i++)record(-2.5+i*.7,.72+row*.57,back+.62,.21);
      for(const side of [-1,1]){box(side*2.25,.93,1.1,.65,1.55,.65,'timberDark');for(const py of [.63,1.3])record(side*2.25,py,1.45,.22);}
      box(0,.94,front-1.65,1.1,.14,.7,'teal');cyl(0,1.04,front-1.65,.28,.035,'iron',.28,24);
      for(const px of [-1.45,1.2]){crate(px,.48,front+.65,1.4);for(let i=0;i<7;i++)box(px-.54+i*.17,.98,front+.65,.035,.58,.49,i%3?'teal':'roofLight');collider(px,front+.65,1.45,.75,0,1.3);}
      sign('LISTENING HOUR\nFriday, after the bell',0,2.2,back+.14,3.4,.65,'#6e5143');
    } else if(type==='toy') {
      for(let row=0;row<3;row++)for(let i=0;i<8;i++) {
        const px=-2.5+i*.7,py=.58+row*.57;box(px,py,back+.65,.44,.3,.34,['teal','roof','ivory'][i%3]);box(px,py,back+.83,.2,.14,.012,'brass');
      }
      // A miniature railway on the counter makes the shop's purpose readable.
      for(const offset of [-.22,.22])box(0,.92,front-1.65+offset,4,.035,.025,'iron');
      for(let i=0;i<14;i++)box(-1.85+i*.28,.89,front-1.65,.055,.035,.65,'timberDark');
      for(let i=0;i<3;i++){box(-.65+i*.65,1.08,front-1.65,.55,.28,.35,i?'ivory':'teal');for(const side of [-1,1])for(const dx of [-.16,.16])cyl(-.65+i*.65+dx,.98,front-1.65+side*.19,.07,.035,'iron',.07,8,Math.PI/2);}
      box(0,.38,front+.63,2.4,.76,.75,'teal');for(let i=0;i<3;i++){box(-.8+i*.8,1.04,front+.63,.36,.5,.25,i%2?'roofLight':'ivory');sphere(-.8+i*.8,1.44,front+.63,.19,'brass');}collider(0,front+.63,2.4,.78,0,1.7);
    } else if(type==='tea') {
      for(let row=0;row<3;row++)for(let i=0;i<11;i++){const px=-2.8+i*.55,py=.6+row*.57;cyl(px,py,back+.64,.13,.28,i%2?'teal':'ceramic',.13);box(px,py,back+.78,.14,.11,.01,'ivory');}
      for(const px of [-1.8,0,1.8])teaSet(px,1.03,front-1.65);
      box(-1.7,.4,front+.65,1.55,.8,.7,'timber');teaSet(-1.7,.97,front+.65);collider(-1.7,front+.65,1.6,.75,0,1.2);
      sign('THIS WEEK\nMountain oolong · Roasted barley',1.6,1.05,front+1,1.5,.9,'#5d6d50');
      for(const px of [.9,2.3])beam([px,.05,front+.75],[px,1.6,front+.75],.035,'timberDark');collider(1.6,front+.8,1.6,.4,0,1.6);
    } else {
      for(let row=0;row<3;row++)for(let i=0;i<10;i++)cyl(-2.6+i*.58,.5+row*.57,back+.64,.18,.1,'ceramic',.18,14);
      for(const px of [-1.85,0,1.85]){cyl(px,.93,front-1.65,.34,.06,'ceramic',.34,20);cyl(px,1.04,front-1.65,.22,.19,'ceramic',.28,16);cyl(px,1.145,front-1.65,.24,.012,'pastry',.24,16);}
      sign('FROM OUR HEARTH\nSquash soup · Mushroom rice · Pear crumble',0,2.18,back+.15,4.8,.8,'#534c3b');
      box(-1.75,.45,front+.65,1.65,.9,.72,'timber');box(-1.75,1.06,front+.65,1.65,.32,.72,'glass');
      for(const px of [-2.2,-1.75,-1.3]){cyl(px,.97,front+.65,.17,.04,'ceramic',.17);cyl(px,1.03,front+.65,.13,.1,'pastry',.1);}collider(-1.75,front+.65,1.65,.75,0,1.3);
      sign('SUPPER AT SIX\nA seat near the window',1.65,1.05,front+1,1.5,.9,'#725741');for(const px of [1,2.3])beam([px,.05,front+.7],[px,1.6,front+.7],.035,'timberDark');collider(1.65,front+.75,1.6,.4,0,1.6);
    }
    const quarterTurn=Math.abs(sine)>.5;
    premises.push({id:shop.id,kind:'shop',landmark:false,name,x,z,w:quarterTurn?d:w,d:quarterTurn?w:d,interior:'visible',shopType:type});
  }
  return {group,premises};
}
