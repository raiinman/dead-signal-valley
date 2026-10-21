async(page)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const failed=[];page.on('requestfailed',request=>failed.push({url:request.url(),error:request.failure()?.errorText}));
  await page.goto('http://127.0.0.1:8771/');
  await page.waitForFunction(()=>window.routeDebug?.world.cafeStatus().loaded,null,{timeout:90000});
  const until=async(key,predicate)=>{await page.keyboard.down(key);try{await page.waitForFunction(predicate,null,{timeout:10000});}finally{await page.keyboard.up(key);}};
  await page.evaluate(()=>routeDebug.visit('cafe'));
  await until('w',()=>routeDebug.body.z<10.5);
  const entry=await page.evaluate(()=>({...routeDebug.body}));
  await page.evaluate(()=>routeDebug.setPosition(-13,10.95,0));
  await page.keyboard.down('d');try{await page.waitForTimeout(1600);}finally{await page.keyboard.up('d');}
  const furniture=await page.evaluate(()=>({...routeDebug.body}));
  if(furniture.x> -11.7)throw new Error('Measured furniture failed to block the town player.');
  await page.evaluate(()=>routeDebug.setPosition(-13,10.5,0));
  await until('s',()=>routeDebug.body.z>15);
  const exit=await page.evaluate(()=>({...routeDebug.body}));
  const presets=[];
  for(const quality of['low','medium','high'])for(const time of['afternoon','dusk','night']){
    presets.push(await page.evaluate(({quality,time})=>{routeDebug.setQuality(quality);routeDebug.setTime(time);routeDebug.world.update(60,quality,routeDebug.camera.position);const status=routeDebug.world.cafeStatus();return{quality,time,loaded:status.loaded,fallback:status.fallback,espressoInstances:routeDebug.scene.getObjectByName('espresso-machine').children.length};},{quality,time}));
  }
  if(presets.some(p=>!p.loaded||p.fallback||p.espressoInstances!==1))throw new Error('Café asset/fallback quality switching failed.');
  const destinations=await page.evaluate(()=>{const ids=['cafe','plaza','bridge','station','workshop','arcade','observatory','studio','arena','garden'];return ids.map(id=>{routeDebug.visit(id);return{id,...routeDebug.body,ground:routeDebug.world.heightAt(routeDebug.body.x,routeDebug.body.z)};});});
  if(destinations.some(d=>d.ground===null))throw new Error('An existing destination no longer has walkable ground.');
  const distant=await page.evaluate(()=>{routeDebug.setPosition(0,64);routeDebug.world.update(61,'medium',routeDebug.camera.position);return routeDebug.world.cafeStatus().fallback;});
  if(!distant)throw new Error('Distant café fallback was not used.');
  await page.evaluate(()=>{routeDebug.setQuality('medium');routeDebug.setTime('afternoon');routeDebug.setPosition(-13,20,0);});
  await page.screenshot({path:'C:/Users/mikea/OneDrive/Documents/ChatGPT/Dead Signal Valley/work/dead-signal-valley-route/evidence/modular-cafe-town-exterior.png'});
  await page.evaluate(()=>{routeDebug.setPosition(-13,9.9,0);routeDebug.look(.5,-.1);});
  await page.screenshot({path:'C:/Users/mikea/OneDrive/Documents/ChatGPT/Dead Signal Valley/work/dead-signal-valley-route/evidence/modular-cafe-town-interior.png'});
  await page.evaluate(()=>routeDebug.setTime('night'));
  await page.screenshot({path:'C:/Users/mikea/OneDrive/Documents/ChatGPT/Dead Signal Valley/work/dead-signal-valley-route/evidence/modular-cafe-town-night.png'});
  if(errors.length||failed.length)throw new Error(JSON.stringify({errors,failed}));
  return{entry,furniture,exit,presets,destinations,distantFallback:distant,errors,failed,stats:await page.evaluate(()=>routeDebug.stats())};
}
