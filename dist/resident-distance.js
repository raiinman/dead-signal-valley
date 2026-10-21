// Keep the articulated residents close to the visitor. The rest of the town
// shares five instanced silhouettes, instead of drawing every rig separately.
export function createResidentDistance(THREE,mats,residents,root) {
  const count=residents.length,proxies=new THREE.Group();proxies.name='Distant valley residents';root.add(proxies);
  const combined=(parts)=>{
    const vertices=parts.reduce((sum,p)=>sum+p.attributes.position.count,0);
    const positions=new Float32Array(vertices*3),normals=new Float32Array(vertices*3),uvs=new Float32Array(vertices*2);
    let offset=0;
    for(const part of parts){positions.set(part.attributes.position.array,offset*3);normals.set(part.attributes.normal.array,offset*3);uvs.set(part.attributes.uv.array,offset*2);offset+=part.attributes.position.count;part.dispose();}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.BufferAttribute(uvs,2));geometry.computeBoundingSphere();return geometry;
  };
  const limb=(radius,height,x,y)=>{const source=new THREE.CylinderGeometry(radius,radius*.8,height,5),geometry=source.toNonIndexed();source.dispose();return geometry.translate(x,y,0);};
  const shirt=mats.shirt.clone();shirt.name='Distant resident shirt';shirt.color.setHex(0xffffff);
  const geometries=[
    new THREE.CylinderGeometry(.19,.14,.46,7).translate(0,1.04,0),
    new THREE.SphereGeometry(.16,8,6).translate(0,1.48,0),
    new THREE.SphereGeometry(.17,8,5,0,Math.PI*2,0,1.7).translate(0,1.51,-.018),
    combined([-1,1].map(side=>limb(.065,.74,side*.09,.43))),
    combined([-1,1].map(side=>limb(.052,.49,side*.23,.995)))
  ];
  const materials=[shirt,mats.skin,mats.hair,mats.trouser,shirt];
  const meshes=geometries.map((geometry,index)=>{
    const mesh=new THREE.InstancedMesh(geometry,materials[index],count);mesh.name=['Resident shirts','Resident faces','Resident hair','Resident legs','Resident arms'][index];
    mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=true;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);proxies.add(mesh);return mesh;
  });
  const color=new THREE.Color(),fallback={barista:0xf1e6cf,gardener:0x698279,mechanic:0x65847d,student:0x7f8599,artist:0xb88864,astronomer:0x7e90a1,traveler:0xbba36d,walker:0x718b7a};
  residents.forEach((resident,index)=>{
    // The first direct mesh is the torso; use its actual authored clothing tint.
    const torso=resident.group.children.find(child=>child.isMesh&&child.material?.color);
    if(torso)color.copy(torso.material.color);else color.setHex(fallback[resident.role]||fallback.walker);
    meshes[0].setColorAt(index,color);meshes[4].setColorAt(index,color);
  });
  for(const index of [0,4])if(meshes[index].instanceColor)meshes[index].instanceColor.needsUpdate=true;
  const hidden=new THREE.Matrix4().makeScale(0,0,0),matrix=new THREE.Matrix4();
  const thresholds={high:[45,120],medium:[30,100],low:[20,80]};
  function update(cameraPosition,quality='medium') {
    const [near,far]=thresholds[quality]||thresholds.medium,nearSquared=near*near,farSquared=far*far;
    let visibleCount=0;
    residents.forEach((resident,index)=>{
      const group=resident.group;
      const distanceSquared=cameraPosition?group.position.distanceToSquared(cameraPosition):0;
      const detailed=distanceSquared<=nearSquared,visible=!detailed&&distanceSquared<=farSquared;
      group.visible=detailed;
      if(visible){matrix.compose(group.position,group.quaternion,group.scale);visibleCount++;}
      for(const mesh of meshes)mesh.setMatrixAt(index,visible?matrix:hidden);
    });
    proxies.visible=visibleCount>0;
    for(const mesh of meshes)mesh.instanceMatrix.needsUpdate=true;
  }
  // Initialize before the first renderer traversal, so no instance appears at
  // the origin while the app is setting up its first camera position.
  update(null,'medium');
  return {update};
}
