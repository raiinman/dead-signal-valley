const triple=(value,label,positive=false)=>{
  if(!Array.isArray(value)||value.length!==3||!value.every(v=>Number.isFinite(v)&&(!positive||v>0)))throw new Error(`${label} must contain three ${positive?'positive ':''}numbers.`);
};
export function validateManifest(config){
  if(!config||!Array.isArray(config.assets))throw new Error('The manifest needs an assets array.');
  const ids=new Set();
  for(const asset of config.assets){
    if(!asset||typeof asset.id!=='string'||!asset.id.trim()||ids.has(asset.id))throw new Error('Asset IDs must be unique nonempty strings.');
    ids.add(asset.id);
    if(asset.model!==undefined&&(typeof asset.model!=='string'||!asset.model.trim()))throw new Error(`${asset.id}: model must be a nonempty path.`);
    if(asset.fit!==undefined&&!['uniform','axisScale'].includes(asset.fit))throw new Error(`${asset.id}: fit must be uniform or axisScale.`);
    if(asset.targetSize)triple(asset.targetSize,`${asset.id} targetSize`,true);
    if(asset.axisScale)triple(asset.axisScale,`${asset.id} axisScale`,true);
    if(asset.sourceRotation!==undefined)triple(asset.sourceRotation,`${asset.id} sourceRotation`);
    if(asset.fit==='axisScale'&&!asset.targetSize&&!asset.axisScale)throw new Error(`${asset.id}: axisScale requires targetSize or axisScale.`);
    if(!Array.isArray(asset.instances)||asset.instances.length===0)throw new Error(`${asset.id}: instances must be a nonempty array.`);
    for(const instance of asset.instances){
      if(!instance||typeof instance!=='object')throw new Error(`${asset.id}: invalid instance.`);
      for(const key of ['position','rotation','scale'])if(instance[key]!==undefined)triple(instance[key],`${asset.id} ${key}`,key==='scale');
    }
  }
  for(const key of ['outside','inside'])if(config[key]!==undefined&&(!Array.isArray(config[key])||config[key].length!==2||!config[key].every(Number.isFinite)))throw new Error(`${key} must be [x,z].`);
  return config;
}
export function inspectAsset(source){
  let triangles=0,meshes=0;const materials=new Set(),textures=new Map();
  source.traverse(object=>{
    if(!object.isMesh)return;meshes++;triangles+=(object.geometry.index?.count||object.geometry.attributes.position.count)/3;
    for(const material of(Array.isArray(object.material)?object.material:[object.material])){
      materials.add(material);
      for(const key of ['map','normalMap','roughnessMap','metalnessMap','aoMap','emissiveMap']){
        const texture=material[key];if(!texture)continue;
        let record=textures.get(texture.uuid);if(!record){record={width:texture.image?.width||0,height:texture.image?.height||0,roles:[]};textures.set(texture.uuid,record);}record.roles.push(key);
      }
    }
  });
  return {triangles,meshes,materials:[...materials].map(m=>({name:m.name,type:m.type,color:m.color?.toArray(),metalness:m.metalness,roughness:m.roughness,opacity:m.opacity,normalScale:m.normalScale?.toArray()})),textures:[...textures.values()]};
}
export function drawnBounds(THREE,source){
  source.updateMatrixWorld(true);const bounds=new THREE.Box3(),point=new THREE.Vector3();
  source.traverse(object=>{
    if(!object.isMesh)return;
    const geometry=object.geometry,position=geometry.attributes.position,index=geometry.index,total=index?.count??position.count;
    const start=geometry.drawRange.start,end=Math.min(total,start+geometry.drawRange.count),seen=index?new Uint8Array(position.count):null;
    for(let i=start;i<end;i++){
      const vertex=index?index.getX(i):i;if(seen?.[vertex])continue;if(seen)seen[vertex]=1;
      point.fromBufferAttribute(position,vertex).applyMatrix4(object.matrixWorld);bounds.expandByPoint(point);
    }
  });
  return bounds;
}
export function createInstances(THREE,source,asset){
  const oriented=new THREE.Group();oriented.rotation.fromArray([...(asset.sourceRotation||[0,0,0]),'XYZ']);oriented.add(source.clone(true));oriented.updateMatrixWorld(true);
  // Index-only cleanup retains unused original vertices; fit the faces actually drawn.
  const bounds=drawnBounds(THREE,oriented),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  if(size.toArray().some(v=>!Number.isFinite(v)||v<=0))throw new Error(`${asset.id}: model has an empty or flat bounding box.`);
  const factor=new THREE.Vector3(1,1,1);
  if(asset.targetSize){
    factor.fromArray(asset.targetSize).divide(size);
    if(asset.fit!=='axisScale')factor.setScalar(Math.min(factor.x,factor.y,factor.z));
  }
  if(asset.axisScale)factor.multiply(new THREE.Vector3().fromArray(asset.axisScale));
  const group=new THREE.Group();group.name=asset.id;
  for(const [index,instance]of asset.instances.entries()){
    const placement=new THREE.Group();placement.name=`${asset.id}:${index}`;
    placement.position.fromArray(instance.position||[0,0,0]);placement.rotation.fromArray([...(instance.rotation||[0,0,0]),'XYZ']);placement.scale.fromArray(instance.scale||[1,1,1]);
    const fit=new THREE.Group();fit.scale.copy(factor);
    const pivot=new THREE.Group();pivot.position.set(-center.x,-bounds.min.y,-center.z);
    pivot.add(oriented.clone(true));fit.add(pivot);placement.add(fit);group.add(placement);
  }
  return group;
}
export async function loadAssets(THREE,config,root,onUpdate=()=>{},baseUrl=location.href){
  const records=[],cache=new Map();
  const loader=new THREE.GLTFLoader();
  for(const asset of config.assets){
    const record={id:asset.id,name:asset.name||asset.id,status:'pending',instances:asset.instances.length};records.push(record);onUpdate(records);
    if(!asset.model){record.message='Waiting for an individual Meshy GLB.';onUpdate(records);continue;}
    record.status='loading';onUpdate(records);
    try{
      const url=new URL(asset.model,baseUrl).href;
      if(!cache.has(url))cache.set(url,new Promise((resolve,reject)=>loader.load(url,gltf=>resolve(gltf.scene),undefined,()=>reject(new Error('GLB unavailable or could not be decoded.')))));
      const source=await cache.get(url);Object.assign(record,inspectAsset(source));
      const instances=createInstances(THREE,source,asset);instances.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;}});
      root.add(instances);record.status='loaded';
    }catch(error){record.status='missing';record.message=error.message;}
    onUpdate(records);
  }
  return records;
}
