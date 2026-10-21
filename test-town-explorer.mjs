import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {destinations,isBlocked} from './dist/simulation.js';
import {cafeHeight} from './dist/modular-cafe.js';
import {buildTownDirectory,directoryCounts,filterDirectory,findSafeArrival,compassHeading,mapPoint,hitTestPin,residentSnapshot,RESIDENT_IDENTITIES} from './dist/town-explorer.js';

const shopIds=['cafe','books','florist','radio','bakery','workshop','arcade','grocer','bicycle','apothecary','tailor','records','toy-hobby','tea','restaurant'];
const fixtures=shopIds.map((id,i)=>({id,name:destinations[id]?.name || `Shop ${id}`,kind:'shop',landmark:['cafe','workshop','arcade'].includes(id),x:i*3-24,z:26,w:6,d:7}));
fixtures.push(...['station','observatory','studio','arena'].map(id=>({id,name:destinations[id].name,kind:'landmark',landmark:true,x:destinations[id].x,z:destinations[id].z,w:12,d:10})));
const world={premises:fixtures,colliders:[],heightAt:()=>0};
const entries=buildTownDirectory(world,destinations);
assert.deepEqual(directoryCounts(entries),{all:22,shop:15,landmark:10,enterable:3});
assert.equal(new Set(entries.map(e=>e.id)).size,22,'overlapping enterable shops are not duplicate directory entries');
assert.equal(filterDirectory(entries,'shop').length,15,'the shop category includes all three enterable shops');
assert.equal(filterDirectory(entries,'enterable').length,3);
assert.equal(filterDirectory(entries,'all','COPPER KETTLE').length,1,'search uses actual names and ignores case');
assert.equal(filterDirectory(entries,'all','no such shop').length,0);
const cafe=entries.find(e=>e.id==='cafe');
fixtures[0].x=-13;fixtures[0].z=9.5;
assert.equal(cafe.x,-13,'map centers stay attached to live premise dimensions after the café loads');
assert.equal(cafe.z,9.5);

for(const [yaw,label,degrees] of [[0,'N',0],[-Math.PI/2,'E',90],[Math.PI,'S',180],[Math.PI/2,'W',270]]) {
  const heading=compassHeading(yaw);assert.equal(heading.label,label);assert(Math.abs(heading.degrees-degrees)<1e-7);
}
assert.equal(compassHeading(4*Math.PI).label,'N','heading wraps for repeated mouse rotations');

const width=300,height=220,pin=mapPoint(cafe.x,cafe.z,width,height);
assert.equal(hitTestPin(entries,pin.x,pin.y,width,height).id,'cafe');
assert.equal(hitTestPin(entries,0,0,width,height),null,'empty map areas never become teleport destinations');
assert(mapPoint(0,-30,width,height).y<mapPoint(0,30,width,height).y,'map north is negative world Z');

const sideShop=entries.find(e=>e.id==='grocer');
const sideArrival=findSafeArrival(world,sideShop,destinations);
assert(sideArrival.x>sideShop.x,'west-side market frontage faces the actual main street');
assert.equal(sideArrival.z,sideShop.z);
assert.equal(findSafeArrival({...world,heightAt:()=>null},cafe,destinations),null,'water has no valid arrival');
assert.equal(findSafeArrival({...world,heightAt:()=>NaN},cafe,destinations),null,'invalid ground is rejected');
const wall={x:destinations.cafe.x,z:destinations.cafe.z,w:8,d:8,minY:0,maxY:10};
assert.equal(findSafeArrival({...world,colliders:[wall]},cafe,destinations),null,'blocked approach is refused rather than spawning inside the café');
const thinWall={x:destinations.cafe.x,z:destinations.cafe.z,w:.3,d:.3,minY:0,maxY:3};
const nearby=findSafeArrival({...world,colliders:[thinWall]},cafe,destinations);
assert(nearby&&!isBlocked(nearby.x,nearby.z,nearby.feet,[thinWall]),'nearby clear frontage replaces an obstructed arrival');

const manifestUrl=new URL('./dist/building-test/assets.json',import.meta.url),manifest=JSON.parse(await readFile(manifestUrl));
const grid=JSON.parse(await readFile(new URL(manifest.nav,manifestUrl)));
const measuredWorld={...world,heightAt:(x,z)=>{const h=cafeHeight(grid,x,z);return h===undefined?0:h;}};
const measuredArrival=findSafeArrival(measuredWorld,cafe,destinations);
assert(measuredArrival&&measuredArrival.z>13,'café arrival remains on the sidewalk outside its measured real doorway');
assert.equal(measuredArrival.feet,0);

const person={role:'barista',origin:[-14.8,6.5],route:null,group:{position:{x:-14.8,z:6.5}}};
let snapshot=residentSnapshot(person,0,entries);
assert.equal(snapshot.name,'Mara');assert.equal(snapshot.role,'Barista');
assert.equal(snapshot.routine,'Spending time here');
person.route=[[0,0],[2,2]];person.group.position={x:2,z:3};
snapshot=residentSnapshot(person,0,entries);
assert.equal(snapshot.routine,'Walking a local route');assert.equal(snapshot.x,2);assert.equal(snapshot.z,3,'roster follows live rendered positions');
assert.equal(RESIDENT_IDENTITIES.length,24);assert.equal(new Set(RESIDENT_IDENTITIES.map(r=>r[0])).size,24);
assert.notEqual(residentSnapshot({...person,role:'mechanic'},0,entries).name,'Mara','changed simulation roles do not silently inherit the wrong editorial identity');
assert.equal(residentSnapshot({...person,name:'Actual name'},0,entries).name,'Actual name','explicit simulation identities take priority');
// Build the actual town with its vendored Three.js and a drawing-only Canvas stub.
// This validates real premise dimensions and collision boxes without needing WebGL.
await import('./dist/vendor/three-r128.min.js');
const gradient={addColorStop(){}};
const context=new Proxy({
  measureText:text=>({width:String(text).length*20}),
  createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,
  createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),
  getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)})
},{get:(object,key)=>key in object?object[key]:()=>{},set:(object,key,value)=>(object[key]=value,true)});
globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>context})};
const {createWorld}=await import('./dist/world.js');
const actualWorld=createWorld(globalThis.THREE,new globalThis.THREE.Scene());
const actualEntries=buildTownDirectory(actualWorld,destinations);
assert.deepEqual(directoryCounts(actualEntries),{all:22,shop:15,landmark:10,enterable:3});
for(const entry of actualEntries) {
  const arrival=findSafeArrival(actualWorld,entry,destinations);
  assert(arrival,`${entry.name} has a valid measured arrival`);
  assert(!isBlocked(arrival.x,arrival.z,arrival.feet,actualWorld.colliders),`${entry.name} arrival clears actual town collision`);
}
console.log('PASS: accurate directory counts and search, live premise centers, compass orientation, pin-only map hits, collision/water-safe measured café arrivals, and 24 live resident identities.');
