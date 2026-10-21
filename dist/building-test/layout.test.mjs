import assert from 'node:assert/strict';
import fs from 'node:fs';
const manifest=JSON.parse(fs.readFileSync(new URL('./assets.json',import.meta.url))),wall=manifest.assets.find(a=>a.id==='wall-panel'),roof=manifest.assets.find(a=>a.id==='roof-panel');
const rectangles=wall.instances.filter(i=>!i.rotation).map(i=>({minX:i.position[0]-wall.targetSize[0]*i.scale[0]/2,maxX:i.position[0]+wall.targetSize[0]*i.scale[0]/2,minY:i.position[1],maxY:i.position[1]+wall.targetSize[1]*i.scale[1],z:i.position[2]}));
const covered=(x,y,z)=>rectangles.some(r=>Math.abs(r.z-z)<1e-6&&x>=r.minX-1e-8&&x<=r.maxX+1e-8&&y>=r.minY-1e-8&&y<=r.maxY+1e-8);
for(const x of [-1.15,0,1.15])for(const y of [.1,1.5,2.4])assert(!covered(x,y,3.5),'Widened front wall aperture remains open in wall placements.');
for(const x of [-2.5,2.5])for(const y of [1,1.7,2.4])assert(!covered(x,y,3.5),'Window openings remain open in wall placements.');
const [left,right]=roof.instances,theta=left.rotation[2],slope=Math.tan(theta),thickness=roof.targetSize[1],underside=x=>left.position[1]+slope*(4/2-Math.abs(x)),top=x=>underside(x)+thickness/Math.cos(theta);
assert(Math.abs(top(0)-4.7)<.002,'Ridge target stays near 4.7 m.');assert(Math.abs(top(4)-3.2)<.002,'Roof top meets the 3.2 m wall at its edge.');
const leftTopInnerX=left.position[0]+Math.cos(theta)*roof.targetSize[0]/2-Math.sin(theta)*thickness;
const rightTopInnerX=right.position[0]-Math.cos(theta)*roof.targetSize[0]/2+Math.sin(theta)*thickness;
assert(leftTopInnerX>rightTopInnerX,'Roof panels overlap at their upper ridge edges rather than leaving a seam gap.');
for(const z of [-3.5,3.5]){
  const strips=rectangles.filter(r=>r.z===z&&r.minY>=3.2);assert.equal(strips.length,12,'Each gable uses repeated original plaster-panel strips.');
  for(const strip of strips)assert(strip.maxY<=top(Math.max(Math.abs(strip.minX),Math.abs(strip.maxX)))+1e-8,'Stepped strips stay below the outer roof surface.');
  for(let x=-3.6;x<=3.6;x+=.12)for(let y=3.201;y<underside(x)-1e-5;y+=.03)assert(covered(x,y,z),'Stepped strips fill the space below the roof underside.');
}
assert.deepEqual(manifest.assets.find(a=>a.id==='wall-shelf').targetSize,[1.4,1,.3]);
if(manifest.validation.status==='passed')assert.equal(typeof manifest.nav,'string','Accepted walking needs a measured grid path.');
console.log('Assembly plan: gable coverage, ridge overlap, wall height, open doorway/windows and corrected shelf dimensions passed.');
