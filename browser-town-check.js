async page => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8771/');await page.waitForFunction(()=>window.routeDebug);
  const result=await page.evaluate(async()=>{
    const {destinations,isBlocked,moveBody}=await import('./simulation.js'),w=routeDebug.world,failures=[];
    const check=(v,m)=>{if(!v)failures.push(m);};
    check(w.premises.filter(p=>p.kind==='shop').length===15,'exactly 15 shops');
    check(w.premises.filter(p=>p.landmark).length===7,'seven landmark premises');
    check(w.premises.length===19,'19 unique premises');check(new Set(w.premises.map(p=>p.id)).size===19,'unique premises IDs');
    check(w.residents.length>=20,'20 or more residents');
    // Flood the actual collision/height field from the café, including ramps.
    const step=.5,minX=-58,minZ=-40,width=233,height=269,seen=new Set(),queue=[];
    const at=(i,j)=>({x:minX+i*step,z:minZ+j*step});
    const startI=Math.round((-13-minX)/step),startJ=Math.round((16-minZ)/step),key=(i,j)=>j*width+i;
    seen.add(key(startI,startJ));queue.push([startI,startJ]);
    for(let cursor=0;cursor<queue.length;cursor++) {
      const [i,j]=queue[cursor],p=at(i,j),ground=w.heightAt(p.x,p.z);
      for(const [di,dj]of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const ni=i+di,nj=j+dj,k=key(ni,nj);if(ni<0||nj<0||ni>=width||nj>=height||seen.has(k))continue;
        const n=at(ni,nj),feet=w.heightAt(n.x,n.z);if(feet===null||feet-ground>.38||isBlocked(n.x,n.z,feet,w.colliders))continue;
        // Also check the midpoint to keep thin colliders from being skipped.
        const mx=(p.x+n.x)/2,mz=(p.z+n.z)/2,mh=w.heightAt(mx,mz);if(mh===null||isBlocked(mx,mz,mh,w.colliders))continue;
        seen.add(k);queue.push([ni,nj]);
      }
    }
    const reachable=(x,z,r=.8)=>queue.some(([i,j])=>{const p=at(i,j);return Math.hypot(p.x-x,p.z-z)<r;});
    const places={};for(const [id,d]of Object.entries(destinations)){places[id]={visit:reachable(d.x,d.z),signal:reachable(d.point[0],d.point[2],1.9)};check(places[id].visit,`${id} teleport reachable by walking`);check(places[id].signal,`${id} signal reachable by walking`);check(!isBlocked(d.x,d.z,w.heightAt(d.x,d.z),w.colliders),`${id} teleport clear`);}
    const rooms={};for(const [id,x,z]of [['cafe',-13,16],['workshop',-28,48],['arcade',28,48]]){const b={x,z,feet:w.heightAt(x,z)||0};for(let i=0;i<70;i++){moveBody(b,0,-.1,w.colliders,w.heightAt);b.feet=w.heightAt(b.x,b.z)||0;}rooms[id]=b;check(b.z<z-5,`${id} door admits visitor`);}
    for(const p of w.premises.filter(p=>p.kind==='shop')){const x=p.x,z=p.z;check(reachable(x,z+((p.d||6)/2)+1.4,3)||reachable(x+((p.w||6)/2)+1.4,z,3)||reachable(x-((p.w||6)/2)-1.4,z,3),`${p.id} display frontage accessible`);}
    const invalid=[];w.root.traverse(o=>{if(o.isMesh&&o.geometry.attributes.position.array.some(n=>!Number.isFinite(n)))invalid.push(o.name||o.uuid);});check(!invalid.length,'finite scene geometry');
    return {failures,places,rooms,reachableCells:seen.size,shops:15,landmarks:7,residents:w.residents.length};
  });
  await page.getByRole('button',{name:'All places',exact:true}).click();
  const menuCount=await page.locator('#place-list button').count();
  await page.locator('#place-list [data-place=workshop]').click();
  result.menuVisitsWorkshop=await page.evaluate(()=>Math.abs(routeDebug.body.x+28)<.1);
  await page.setViewportSize({width:390,height:844});
  result.mobileOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  await page.getByRole('button',{name:'All places',exact:true}).click();
  await page.screenshot({path:'C:/Users/mikea/OneDrive/Documents/ChatGPT/Dead Signal Valley/work/dead-signal-valley-route/evidence/town-mobile-places.png'});
  await page.locator('#place-list [data-place=arcade]').click();
  result.mobileVisitsArcade=await page.evaluate(()=>Math.abs(routeDebug.body.x-28)<.1);
  result.menuCount=menuCount;result.errors=errors;
  if(menuCount!==10||!result.menuVisitsWorkshop||!result.mobileVisitsArcade||result.mobileOverflow||errors.length)result.failures.push('navigation/mobile/runtime regression');
  return result;
}
