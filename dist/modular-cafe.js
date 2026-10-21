import {validateManifest,loadAssets} from './building-test/assets.js';
import {validateGrid,floorAt,standingHeight} from './building-test/navigation.js';

export const cafePlacement={x:-13,y:.12,z:9.5};

export function cafeHeight(grid,x,z){
  x-=cafePlacement.x;z-=cafePlacement.z;
  if(Math.abs(x)>4.5||Math.abs(z)>4.2)return undefined;
  const floor=floorAt(grid,x,z);
  if(floor===null)return null;
  const height=standingHeight(grid,x,z,floor,.28);
  return height===null?null:height+cafePlacement.y;
}

export async function loadModularCafe(THREE,url,onUpdate=()=>{}){
  const response=await fetch(url);if(!response.ok)throw new Error('The café manifest is unavailable.');
  const config=validateManifest(await response.json()),baseUrl=new URL(url,location.href).href;
  if(config.validation?.status!=='passed')throw new Error('The café assembly has not passed walking review.');
  const navigation=await fetch(new URL(config.nav,baseUrl));if(!navigation.ok)throw new Error('The café walk grid is unavailable.');
  const grid=validateGrid(await navigation.json());
  const model=new THREE.Group();model.name='Copper Kettle, individually generated Meshy assets';
  const records=await loadAssets(THREE,config,model,onUpdate,baseUrl);
  if(records.length!==15||records.some(record=>record.status!=='loaded'))throw new Error('The café asset assembly is incomplete.');
  model.position.set(cafePlacement.x,cafePlacement.y,cafePlacement.z);
  model.traverse(object=>{if(object.isMesh)object.receiveShadow=false;});
  // The town's broad shadow map cannot resolve these small authored surface details.
  model.getObjectByName('pastry-case')?.traverse(object=>{if(object.isMesh&&[object.material].flat().every(material=>material.transparent&&material.opacity<.5))object.castShadow=false;});
  return {model,grid,records,config};
}
