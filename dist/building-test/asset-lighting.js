// A local café reflection environment, applied only to the espresso material.
// Broad window and pendant shapes supply stable PBR highlights without an HDR download.
export function createCafeReflections(THREE,renderer,strength=1) {
  const room=new THREE.Scene();room.background=new THREE.Color(.18,.17,.15).multiplyScalar(strength);
  const geometry=new THREE.BoxGeometry(1,1,1),materials=[];
  function panel(x,y,z,w,h,d,r,g,b) {
    const material=new THREE.MeshBasicMaterial();material.color.setRGB(r*strength,g*strength,b*strength);materials.push(material);
    const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);room.add(mesh);
  }
  // Warm floor and neutral wall establish contrast around the bright window strips.
  panel(0,-2,0,12,.1,12,.21,.17,.12);
  panel(0,1,-5,12,7,.1,.28,.27,.24);
  panel(-4,1,0,.1,7,10,.13,.14,.13);
  panel(4,1,0,.1,7,10,.2,.2,.19);
  panel(-3.8,1.1,1.3,.12,2.8,1.35,6.5,6.2,5.6);
  panel(3.8,.9,.3,.12,2.2,1.1,3.2,3.35,3.5);
  panel(-1.15,1.2,4,1.2,2.7,.08,4.6,4.45,4.15);
  panel(1.3,1.2,4,1.2,2.7,.08,4.6,4.45,4.15);
  panel(0,3.6,0,2.4,.1,1.4,5.7,5.2,4.4);
  const generator=new THREE.PMREMGenerator(renderer);
  const target=generator.fromScene(room,.035,.1,30);target.texture.name='Copper Kettle café reflected windows';
  generator.dispose();geometry.dispose();materials.forEach(m=>m.dispose());
  return target;
}

export function applyCafeReflections(model,texture,quality='medium',time='afternoon') {
  const intensity=time==='night'?.68:time==='dusk'?.75:.85;
  model.traverse(object=>{
    if(!object.isMesh)return;
    object.castShadow=true;
    // The town's 116m sun map cannot resolve a 68cm prop; its own PBR detail is the close-up source.
    object.receiveShadow=false;
    for(const material of (Array.isArray(object.material)?object.material:[object.material])) {
      material.envMap=texture;material.envMapIntensity=intensity;
      for(const map of [material.map,material.normalMap,material.roughnessMap,material.metalnessMap])if(map)map.anisotropy=quality==='low'?2:8;
      material.needsUpdate=true;
    }
  });
}
