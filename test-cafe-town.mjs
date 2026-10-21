import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {cafeHeight,cafePlacement} from './dist/modular-cafe.js';
import {moveBody} from './dist/simulation.js';

const manifestUrl=new URL('./dist/building-test/assets.json',import.meta.url);
const manifest=JSON.parse(await readFile(manifestUrl)),grid=JSON.parse(await readFile(new URL(manifest.nav,manifestUrl)));
assert.equal(manifest.assets.length,15);
assert.equal(manifest.validation.status,'passed');
assert.equal(cafePlacement.z+3.5,13,'front door retains the existing sidewalk entrance');
// Baselines were captured directly from the accepted individual authoring exports.
const sourceHashes=JSON.parse(await readFile(new URL('./evidence/cafe-source-hashes.json',import.meta.url)));
assert.equal(Object.keys(sourceHashes).length,15);
for(const asset of manifest.assets){
  const candidate=await readFile(new URL(asset.model,manifestUrl));
  assert.equal(createHash('sha256').update(candidate).digest('hex'),sourceHashes[asset.id],`${asset.id} keeps original model and embedded textures`);
}
const height=(x,z)=>cafeHeight(grid,x,z)??(cafeHeight(grid,x,z)===null?null:0);
const body={x:-13,z:16,feet:0};
for(let i=0;i<75;i++){moveBody(body,0,-.08,[],height);body.feet=height(body.x,body.z)??body.feet;}
assert(body.z<10.5,'walk from the existing café destination through the real doorway');
const furniture={x:-13,z:10.95,feet:height(-13,10.95)};
for(let i=0;i<50;i++){moveBody(furniture,.08,0,[],height);furniture.feet=height(furniture.x,furniture.z)??furniture.feet;}
assert(furniture.x< -11.7,'measured chairs stop sideways movement');
for(let i=0;i<80;i++){moveBody(body,0,.08,[],height);body.feet=height(body.x,body.z)??body.feet;}
assert(body.z>15,'exit onto the existing sidewalk');
assert.equal(cafeHeight(grid,0,0),undefined,'café navigation leaves the town route alone');
assert.equal(cafeHeight(grid,-17,9.5),null,'measured side walls remain solid');
console.log('PASS: all 15 source GLB hashes, original front entrance, town-sized player entry, furniture collision, exit and outside navigation.');
