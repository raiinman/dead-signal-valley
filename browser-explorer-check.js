async (browserPage, options = {}) => {
  const evidence = options.evidenceDir || 'evidence';
  const browser = browserPage.context().browser();
  const context = await browser.newContext({viewport:{width:1440,height:1000}, deviceScaleFactor:1});
  const page = await context.newPage();
  const report = {checks:[],errors:[],failed:[],screenshots:[],notes:['Touch checks use Chromium mobile emulation, not a physical phone.']};
  const check = (label, condition, data) => { report.checks.push({label,pass:!!condition,data}); if (!condition) throw new Error(label + ': ' + JSON.stringify(data)); };
  const observe = target => { target.on('pageerror',error=>report.errors.push(error.message)); target.on('requestfailed',request=>report.failed.push({url:request.url(),error:request.failure()?.errorText})); };
  const shot = async (target,name) => { await target.screenshot({path:`${evidence}/${name}`}); report.screenshots.push(name); };
  observe(page);
  try {
    await page.goto(options.url || 'http://127.0.0.1:8771/?qa=explorer');
    await page.waitForFunction(()=>window.routeDebug?.world.cafeStatus().loaded,null,{timeout:90000});
    const cafe = await page.evaluate(()=>routeDebug.world.cafeStatus());
    check('All 15 individually generated café asset types load',cafe.records.length===15&&cafe.records.every(r=>r.status==='loaded'));
    check('Original espresso preserved',cafe.records.find(r=>r.id==='espresso-machine').triangles===485846);
    await shot(page,'explorer-desktop-welcome.png');
    await page.locator('#welcome-directory-btn').click();
    const counts = {};
    for (const [filter,total] of [['all',22],['shop',15],['landmark',10],['enterable',3]]) {
      await page.locator(`[data-filter="${filter}"]`).click();
      counts[filter]=await page.locator('#place-list .dir-card').count();
      check('Directory filter '+filter,counts[filter]===total,counts[filter]);
    }
    await page.locator('[data-filter="all"]').click();
    const beforeSearch=await page.evaluate(()=>({...routeDebug.body}));
    await page.locator('#place-search').fill('cafe');
    await page.locator('#place-search').press('w');
    await page.locator('#place-search').press('n');
    await page.waitForTimeout(200);
    check('Search typing does not move player or cycle lighting',await page.evaluate(b=>Math.hypot(routeDebug.body.x-b.x,routeDebug.body.z-b.z)<.01&&routeDebug.stats().time==='afternoon',beforeSearch));
    await page.locator('#place-search').fill('pastries');
    check('Directory searches useful shop details',await page.locator('#place-list .dir-card').count()===1);
    await page.keyboard.press('Escape');
    check('Escape closes focused search',await page.locator('#places').isHidden());
    await page.keyboard.press('p'); await page.locator('#place-search').fill('');
    await page.waitForFunction(()=>document.querySelectorAll('#place-list .dir-visit-btn').length===22);
    const names=await page.locator('#place-list .dir-visit-btn').evaluateAll(buttons=>buttons.map(b=>b.getAttribute('aria-label')));
    const visits=[];
    for (const name of names) {
      if(await page.locator('#places').isHidden())await page.locator('#places-open').click();
      await page.getByRole('button',{name,exact:true}).click();
      const arrival=await page.evaluate(async()=>{const {isBlocked}=await import('./simulation.js');const b=routeDebug.body;return {...b,ground:routeDebug.world.heightAt(b.x,b.z),blocked:isBlocked(b.x,b.z,b.feet,routeDebug.world.colliders)};});
      visits.push({name,...arrival});
      check('Safe actual UI visit '+name,Number.isFinite(arrival.ground)&&!arrival.blocked,arrival);
    }
    report.visits=visits;
    await page.locator('[data-place="cafe"]').click();
    await page.evaluate(()=>document.activeElement?.blur());
    await page.keyboard.down('w');try{await page.waitForFunction(()=>routeDebug.body.z<10.5,null,{timeout:10000});}finally{await page.keyboard.up('w');}
    report.cafeEntry=await page.evaluate(()=>({...routeDebug.body}));
    await shot(page,'explorer-cafe-interior.png');
    await page.keyboard.down('s');try{await page.waitForFunction(()=>routeDebug.body.z>15,null,{timeout:10000});}finally{await page.keyboard.up('s');}
    report.cafeExit=await page.evaluate(()=>({...routeDebug.body}));
    check('Actual keyboard café entrance and exit',report.cafeEntry.z<10.5&&report.cafeExit.z>15);
    await page.keyboard.press('n');
    const dusk=await page.evaluate(()=>({time:routeDebug.stats().time,fog:routeDebug.scene.fog.color.getHexString()}));
    await page.keyboard.press('n');
    const night=await page.evaluate(()=>({time:routeDebug.stats().time,fog:routeDebug.scene.fog.color.getHexString()}));
    check('N switches actual 3D lighting',dusk.time==='dusk'&&night.time==='night'&&dusk.fog!==night.fog,{dusk,night});
    await shot(page,'explorer-cafe-night.png');
    await page.locator('#settings-open').click();
    for(const quality of ['low','medium','high']){await page.locator('#quality').selectOption(quality);check('Quality '+quality,await page.evaluate(q=>routeDebug.stats().quality===q,quality));}
    await page.locator('#time').selectOption('afternoon'); await page.keyboard.press('Escape');
    await page.keyboard.press('r');
    check('Community 24 original names',await page.locator('#resident-list .dir-card').count()===24&&await page.locator('#resident-list h3').first().textContent()==='Mara');
    const residentBefore=await page.locator('#resident-list').textContent();
    await page.waitForTimeout(1400);
    const residentAfter=await page.locator('#resident-list').textContent();
    check('Live community positions and player distance',residentBefore!==residentAfter&&/m away/.test(residentAfter));
    await shot(page,'explorer-community.png');
    await page.locator('#guild-open').click();
    await page.locator('[data-gtab="signal-hunt"]').click();
    await page.locator('#hunt-start-btn').click();
    await page.locator('.hunt-target').first().click();
    const clickScore=+(await page.locator('#hunt-score').textContent());
    await page.waitForSelector('.hunt-target');
    await page.locator('.hunt-target').first().focus(); await page.keyboard.press('Enter');
    const keyboardScore=+(await page.locator('#hunt-score').textContent());
    check('Signal Hunt works after Community, with click and keyboard scoring',clickScore>0&&keyboardScore>clickScore,{clickScore,keyboardScore});
    await shot(page,'explorer-signal-hunt.png');
    await page.locator('[data-close="guild"]').click();
    await page.waitForTimeout(1500); await page.locator('#guild-open').click();
    check('Hunt close stops targets and timers',await page.locator('.hunt-target').count()===0&&await page.locator('#hunt-overlay').isVisible());
    await page.locator('#hunt-start-btn').click(); check('Hunt restarts once',await page.locator('.hunt-target').count()===1);
    await page.locator('[data-gtab="relay-tool"]').click();
    await page.locator('#relay-send-btn').click();await page.waitForTimeout(600);
    const relay=await page.locator('#relay-ev-out').textContent();check('Relay clearly reports demonstration only',/Demo only/.test(relay)&&/No geometry/.test(relay));
    await page.locator('[data-gtab="esports"]').click();
    await page.locator('#practice-slider').focus();await page.keyboard.press('End');
    const practice=await page.locator('.rhythm-card strong').allTextContents();
    check('Practice durations add to actual slider total',practice.map(x=>parseInt(x)).reduce((a,b)=>a+b,0)===120,practice);
    await page.keyboard.press('Escape');
    await page.evaluate(()=>routeDebug.setPosition(-13,16,0));
    const map=await page.locator('#minimap-canvas').boundingBox();
    const pin=await page.evaluate(async()=>{const {mapPoint}=await import('./town-explorer.js');const c=document.getElementById('minimap-canvas');return mapPoint(-8,-31.8,c.width,c.height);});
    const cw=await page.locator('#minimap-canvas').getAttribute('width'),ch=await page.locator('#minimap-canvas').getAttribute('height');
    await page.mouse.click(map.x+map.width*pin.x/+cw,map.y+map.height*pin.y/+ch);
    const mapped=await page.evaluate(()=>({...routeDebug.body}));
    check('Minimap station pin fast travel',mapped.z< -25,mapped);
    await page.mouse.click(map.x+2,map.y+2);
    check('Minimap empty click does not teleport',await page.evaluate(b=>Math.hypot(routeDebug.body.x-b.x,routeDebug.body.z-b.z)<.01,mapped));
    // Position only sets up proximity; collection uses the real visible Listen button.
    const signals=await page.evaluate(async()=>Object.entries((await import('./simulation.js')).destinations).map(([id,d])=>({id,point:d.point})));
    for(const signal of signals){await page.evaluate(s=>routeDebug.setPosition(s.point[0],s.point[2]),signal);await page.waitForSelector('#interact:visible');await page.locator('#interact').click();await page.keyboard.press('Escape');}
    check('All ten journal signals collected',await page.locator('#found-count').textContent()==='10/10');
    await page.reload();await page.waitForFunction(()=>!!window.routeDebug);
    check('Journal persists after reload',await page.locator('#found-count').textContent()==='10/10');
    await shot(page,'explorer-desktop-final.png');
    await context.close();
    for(const viewport of [{width:390,height:844},{width:320,height:740},{width:844,height:390}]){
      const mobileContext=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:true,hasTouch:true});const mobile=await mobileContext.newPage();observe(mobile);
      await mobile.goto(options.url||'http://127.0.0.1:8771/?qa=explorer-mobile');await mobile.waitForFunction(()=>!!window.routeDebug);
      await shot(mobile,`explorer-mobile-${viewport.width}-welcome.png`);
      const layout=await mobile.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,card:document.getElementById('welcome').getBoundingClientRect().toJSON()}));
      check('No horizontal overflow '+viewport.width,layout.scroll<=layout.width,layout);
      await mobile.locator('#start').click();await mobile.locator('#places-open').click();await shot(mobile,`explorer-mobile-${viewport.width}-directory.png`);await mobile.keyboard.press('Escape');
      if(viewport.width===390){
        const session=await mobileContext.newCDPSession(mobile);const stick=await mobile.locator('#stick').boundingBox();
        const before=await mobile.evaluate(()=>({body:{...routeDebug.body},camera:routeDebug.camera.rotation.y}));
        const x=stick.x+stick.width/2,y=stick.y+stick.height/2;
        await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x,y}]});
        await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x,y:y-30}]});await mobile.waitForTimeout(900);
        await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        const moved=await mobile.evaluate(()=>({...routeDebug.body}));
        await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:2,x:330,y:380}]});
        await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:2,x:280,y:400}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        const after=await mobile.evaluate(()=>({body:{...routeDebug.body},camera:routeDebug.camera.rotation.y}));
        check('Mobile left touch moves and right touch looks',Math.hypot(moved.x-before.body.x,moved.z-before.body.z)>.2&&Math.abs(after.camera-before.camera)>.1,{before,moved,after});
      }
      await mobileContext.close();
    }
    check('No uncaught JavaScript errors',report.errors.length===0,report.errors);
    check('No failed resources',report.failed.length===0,report.failed);
    report.pass=true;
  } catch(error) { report.pass=false;report.failure=error.stack; try{await shot(page,'explorer-failure.png');}catch{} }
  finally { try{await context.close();}catch{}  }
  return report;
}
