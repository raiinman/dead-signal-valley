// The shared public realm joins every district without crossing the railway.
export function buildPublicRealm(ctx) {
  const {THREE,box,cyl,beam,sign,collider,addLight,bench,planter}=ctx;
  const group=new THREE.Group();group.name='Market lanes and southern commons';
  // A continuous valley floor carries the scene into the distant haze.
  box(0,-.45,170,700,.2,360,'grass');box(0,-.45,-191,700,.2,338,'grass');
  box(0,-.18,75,154,.36,50,'grass');
  box(0,.018,43,12,.036,46,'paving');
  box(0,.02,49,91,.04,6,'paving');
  box(-43,.018,42,4,.035,14,'gravel');
  box(43,.018,35,4,.035,28,'gravel');
  box(0,.02,65,30,.04,6,'paving');
  for(const side of [-1,1]) {
    box(side*20,.018,25,28,.035,3,'gravel');
    box(side*19,.018,37,3,.035,26,'gravel');
    for(const z of [23,35,55,65]) {
      const x=side*5.15;
      cyl(x,1.8,z,.055,3.6,'iron');box(x,3.32,z,.34,.43,.34,'glow');cyl(x,3.67,z,.29,.22,'copper',0,4);
      addLight(x,3.1,z,2.2,10);collider(x,z,.3,.3,0,3.9);
      if(z!==65)sign('DEAD SIGNAL\nVALLEY',x+side*.3,2.7,z,.5,.65,'#315c55',side*Math.PI/2);
    }
    bench(side*18,49,side*Math.PI/2);planter(side*22,52,3,1.2);planter(side*37,49,1.3,3);
    bench(side*9,64);planter(side*14,65,2,1.2);
  }
  // Bounded stone edging and planted rain gardens, kept off the desire lines.
  for(const x of [-7.3,7.3])for(const z of [18,31,44,55]) {
    box(x,.09,z,1,.18,2.6,'stone');box(x,.18,z,.8,.1,2.4,'soil');
    for(let i=0;i<8;i++) {const zz=z-1+i*.28;beam([x,.23,zz],[x+.15*Math.sin(i),.55+(i%3)*.08,zz],.014,'leafDark');cyl(x,.56+(i%3)*.08,zz,.09,.06,i%3?'blossom':'pastry',.07,7);}
  }
  for(const [x,z,label] of [[-5,21,'MARKET STREET\nWorkshop · Arcade · Arena'],[-38,49,'CINDERWATCH OBSERVATORY\nFollow the terrace path'],[38,49,'RIVERGLASS STUDIO\nPaintings beside the river']]) {
    box(x,1.1,z,.12,2.2,.12,'timberDark');sign(label,x,1.75,z+.08,2.6,.7);sign(label,x,1.75,z-.08,2.6,.7,'#315c55',Math.PI);collider(x,z,.2,.2,0,2.2);
  }
  // Valley homes give the inhabited district a quieter edge.
  for(const side of [-1,1])for(const z of [58,72,86]) {
    const x=side*43;
    box(x,1.8,z,8,3.6,6,'plaster');ctx.roof(x,3.6,z,8.7,6.7,1.4);
    box(x,1,z+3.04,1,2,.1,'teal');ctx.windowFrame(x-2,1.85,z+3.08,1.4,1.5);ctx.windowFrame(x+2,1.85,z+3.08,1.4,1.5);
    collider(x,z,8,6,0,5);box(x,.015,z+5,2,.03,4,'gravel');
    planter(x+3.5,z+4,1.3,.8);
    addLight(x,2.3,z+3.5,1.2,7);
  }
  // The signal-listening garden keeps its original cherry tree and quiet bench.
  sign('THE LISTENING GARDEN\nLet the valley finish its sentence',25,1.35,-27,3,.8);
  return {group};
}
