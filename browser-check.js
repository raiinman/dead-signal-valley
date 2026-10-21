// Run this function through the connected Playwright browser against the local preview.
async page => {
  await page.goto('http://127.0.0.1:8771/');
  await page.waitForFunction(()=>!!window.routeDebug?.world.root.getObjectByName('Meshy Copperlight Espresso'));
  return page.evaluate(async()=>{
    const {moveBody}=await import('./simulation.js'),d=window.routeDebug,w=d.world,failures=[];
    const check=(ok,message)=>{if(!ok)failures.push(message);};
    const traverse=(x,z,dz,count)=>{const b={x,z,feet:w.heightAt(x,z)||0};let max=b.feet;for(let i=0;i<count;i++){moveBody(b,0,dz,w.colliders,w.heightAt);b.feet=w.heightAt(b.x,b.z)||0;max=Math.max(max,b.feet);}return{...b,max};};
    const road=traverse(0,20,-.12,440),cafe=traverse(-13,16,-.12,75),hall=traverse(-8,-27.7,-.12,90),ramp=traverse(10,-32.5,-.1,65);
    check(road.z< -25&&road.max>=.54,'main route or bridge blocked');
    check(cafe.z<8,'café entrance blocked');check(hall.z< -37.3&&hall.feet===.6,'hall-to-platform blocked');check(ramp.z< -38&&ramp.feet===.6,'ramp blocked');
    const phases=[-20,-6,7.9,8,24,44].map(t=>w.update(t,'medium'));
    check(phases[1].phase==='At platform'&&phases[1].dwellRemaining===14&&phases[2].phase==='At platform'&&phases[3].phase==='Departing','train dwell or departure mismatch');
    const invalid=[];w.root.traverse(o=>{if(o.isMesh&&o.geometry.attributes.position.array.some(n=>!Number.isFinite(n)))invalid.push(o.name||o.uuid);});check(invalid.length===0,'non-finite vertices');
    check(document.documentElement.scrollWidth<=innerWidth,'horizontal overflow');
    const model=w.root.getObjectByName('Meshy Copperlight Espresso');let triangles=0;const maps=[];
    model.traverse(o=>{if(o.isMesh){triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;const m=o.material;maps.push([m.map.image.width,m.normalMap.image.width,m.roughnessMap.image.width]);check(m.metalness===1&&!!m.envMap,'espresso PBR response overridden');check(!o.receiveShadow,'coarse world shadow applied to espresso');}});
    check(triangles===485846&&maps.every(a=>a.every(size=>size===2048)),'espresso source geometry or 2K maps lost');
    check(!d.scene.environment&&!w.mats.copper.envMap,'espresso reflections leaked into the town');
    w.update(0,'low',new THREE.Vector3(-10.6,1.79,6.2));const detailedNearby=model.visible;
    w.update(0,'medium',new THREE.Vector3(-8,1.67,-27.7));const culledAtStation=!model.visible;
    check(detailedNearby&&culledAtStation,'espresso distance detail visibility mismatch');
    return{failures,road,cafe,hall,ramp,phases,espresso:{triangles,maps,detailedNearby,culledAtStation},stats:d.stats()};
  });
}
