// Valley Line station: static architecture uses the scene's material batches.
export function buildStation(ctx) {
  const { THREE, mats, box, cyl, beam, sign, collider, addLight } = ctx;
  const group = new THREE.Group();
  group.name = 'Valley Line station / moving train';
  const tau = Math.PI * 2;

  // Open hall, with separate wall pieces leaving real front and rear doorways.
  box(-10, .04, -33, 14.8, .16, 7.7, 'stone');
  for (const z of [-29.5, -36.5]) {
    for (const [left, right, windows] of [[-17, -9.1, [-13.5, -11]], [-6.9, -3, [-5]]]) {
      box((left + right) / 2, .67, z, right - left, 1.1, .25, 'plaster');
      box((left + right) / 2, 3.15, z, right - left, .58, .25, 'plaster');
      let edge = left;
      for (const x of windows) {
        const openingLeft = x - .84;
        if (openingLeft > edge) box((edge + openingLeft) / 2, 2.04, z, openingLeft - edge, 1.64, .25, 'plaster');
        edge = x + .84;
      }
      if (right > edge) box((edge + right) / 2, 2.04, z, right - edge, 1.64, .25, 'plaster');
    }
    box(-8, 3.2, z, 2.2, .48, .28, 'timberDark');
    for (const x of [-9.15, -6.85]) box(x, 1.5, z, .16, 2.76, .36, 'timberDark');
    for (const x of [-13.5, -11, -5]) {
      box(x, 2.05, z + (z > -33 ? .14 : -.14), 1.65, 1.52, .035, 'glass');
      for (const dx of [-.87, 0, .87]) box(x + dx, 2.05, z, .055, 1.65, .36, 'teal');
      box(x, 2.87, z, 1.8, .065, .36, 'teal');
      box(x, 1.23, z, 1.8, .09, .4, 'timber');
    }
  }
  for (const x of [-17, -3]) {
    box(x, 1.78, -33, .25, 3.32, 7, 'plaster');
    collider(x, -33, .38, 7.2, 0, 3.6);
  }
  for (const z of [-29.5, -36.5]) {
    collider(-13.05, z, 7.9, .34, 0, 3.5);
    collider(-5, z, 4, .34, 0, 3.5);
    box(-13.05, .4, z, 7.9, .45, .3, 'stone');
    box(-5, .4, z, 3.8, .45, .3, 'stone');
    box(-8, .14, z, 2.2, .04, .45, 'timber');
  }
  // Sloped terracotta roof, timber eaves and patinated rain gutters.
  for (const side of [-1, 1]) {
    box(-10, 4.05, -33 + side * 2.02, 15.8, .24, 4.46, 'roof', side * .32);
    box(-10, 3.38, -33 + side * 4.05, 16.1, .16, .17, 'timberDark');
    box(-10, 3.31, -33 + side * 4.16, 16.1, .12, .13, 'copper');
  }
  box(-10, 4.78, -33, 16, .2, .26, 'copper');
  for (const x of [-16, -12, -8, -4]) {
    beam([x, 3.34, -37], [x, 4.73, -33], .075, 'timber');
    beam([x, 4.73, -33], [x, 3.34, -29], .075, 'timber');
    beam([x, 3.34, -37], [x, 3.34, -29], .06, 'timberDark');
  }
  for (const x of [-16.7, -3.3]) cyl(x, 1.72, -29, .055, 3.4, 'copper');
  sign('VALLEY LINE\nDEAD SIGNAL VALLEY', -10.7, 3.12, -29.26, 6.2, .82);
  sign('TICKETS  ·  PLATFORM 1\nDepartures throughout the valley', -12.5, 2.55, -32.65, 3.3, .65);
  box(-13, .9, -33, 4, 1.55, .8, 'timber');
  box(-13, 1.69, -33, 4.2, .12, 1, 'teal');
  collider(-13, -33, 4.2, 1.05, 0, 1.75);
  box(-13.9, 2.02, -33, .8, .5, .3, 'iron');
  box(-13.9, 2.02, -32.83, .65, .34, .03, 'glow');
  sign('NEXT TRAIN\nValley local  /  Platform 1', -13.8, 2.95, -36.32, 3.5, .62, '#354b47');
  sign('PLATFORM 1  →', -8, 2.82, -36.3, 2.1, .35);
  addLight(-11.5, 2.9, -33, .8, 7);
  addLight(-6, 2.9, -33, .65, 7);

  // Platform, warning strip, open timber canopy and rail-side safety railing.
  box(0, .26, -39, 52, .68, 3.6, 'stone');
  box(0, .59, -39, 52, .02, 3.6, 'paving');
  box(0, .615, -40.42, 51.5, .025, .29, 'brass');
  for (let x = -25.5; x <= 25.5; x += .5) {
    for (let dz = 0; dz < 3; dz++) cyl(x, .64, -40.34 - dz * .075, .016, .018, 'brass', .016, 6);
  }
  for (let x = -24; x <= 24; x += 6) {
    cyl(x, 2.02, -38.25, .105, 2.84, 'teal');
    box(x, 3.46, -38.25, .26, .2, 4.7, 'timberDark');
    for (const side of [-1, 1]) beam([x, 2.85, -38.25], [x, 3.45, -38.25 + side * 1.25], .07, 'timber');
    box(x, .71, -38.25, .5, .2, .5, 'stone');
    collider(x, -38.25, .32, .32, .6, 3.6);
  }
  for (const side of [-1, 1]) box(0, 3.67, -38.25 + side * 1.19, 53, .16, 2.53, 'copper', side * .15);
  box(0, 3.88, -38.25, 53.1, .14, .22, 'teal');
  for (const x of [-21, -9, 3, 15]) addLight(x, 3.35, -38.25, .6, 6);
  sign('VALLEY LINE\nDEAD SIGNAL VALLEY', 5, 2.7, -39, 4.4, .82);
  sign('1  ·  VALLEY LOCAL\nMind the platform edge', -19, 2.7, -39, 3.6, .65);
  for (let x = -26; x <= 26; x += 2) {
    cyl(x, 1.18, -40.95, .035, 1.16, 'iron');
    if (x < 26) {
      beam([x, 1.72, -40.95], [x + 2, 1.72, -40.95], .027, 'iron');
      beam([x, 1.02, -40.95], [x + 2, 1.02, -40.95], .022, 'iron');
    }
  }
  collider(0, -41, 53, .2, .6, 2);
  for (const x of [-26.1, 26.1]) collider(x, -39, .2, 3.8, 0, 2);

  function bench(x, z, turn = 0) {
    box(x, 1.04, z, 2.5, .14, .6, 'timber', 0, turn);
    box(x, 1.4, z + .26, 2.5, .64, .1, 'timber', 0, turn);
    for (const dx of [-.9, .9]) {
      box(x + dx, .82, z, .1, .44, .5, 'iron');
      box(x + dx, 1.23, z, .075, .18, .65, 'iron');
    }
    collider(x, z, 2.5, .75, .6, 1.8);
  }
  bench(-15, -37.85); bench(16, -37.85);
  // Vending cabinet and a legible ticket map face toward the arrival path.
  box(22, 1.66, -37.8, 1.25, 2.12, .8, 'teal');
  box(21.76, 1.99, -37.375, .66, 1.02, .04, 'glass');
  box(21.76, 1.99, -37.41, .69, 1.05, .04, 'iron');
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
    cyl(21.54 + col * .22, 1.68 + row * .28, -37.34, .055, .17, col % 2 ? 'ceramic' : 'teal', .055, 8);
    box(21.54 + col * .22, 1.55 + row * .28, -37.32, .07, .035, .025, 'glow');
  }
  box(22.4, 1.84, -37.36, .12, .28, .03, 'iron');
  box(22, .92, -37.36, .65, .14, .04, 'iron');
  sign('RIVERFIZZ', 22, 2.86, -37.37, 1.18, .22);
  collider(22, -37.8, 1.4, .9, .6, 3);
  addLight(22, 2.3, -37.15, .35, 3);

  // Four shallow steps connect the back of the hall to the raised platform.
  for (let i = 0; i < 4; i++) {
    const h = .12 * (i + 2);
    box(-8, h / 2, -36.55 - i * .19, 2.1, h, .22, 'stone');
  }
  // Accessible ramp has a continuous top; walkHeight uses the same endpoints.
  const rampGeometry = new THREE.BufferGeometry();
  rampGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
    8, 0, -33, 12, .6, -37.2, 8, .6, -37.2,
    8, 0, -33, 12, 0, -33, 12, .6, -37.2
  ], 3));
  rampGeometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 4, 4.2, 0, 4.2, 0, 0, 4, 0, 4, 4.2], 2));
  rampGeometry.computeVertexNormals();
  const ramp = new THREE.Mesh(rampGeometry, mats.paving);
  ramp.receiveShadow = true;
  group.add(ramp);
  for (const x of [7.9, 12.1]) {
    beam([x, 1, -33], [x, 1.6, -37.2], .035, 'teal');
    for (let i = 0; i <= 4; i++) cyl(x, .5 + i * .075, -33 - i * 1.05, .033, 1 + i * .15, 'teal');
    collider(x, -35.1, .12, 4.2, 0, 1.8);
  }
  sign('PLATFORM 1\nStep-free access  ↗', 10, 1.8, -33.1, 2.2, .52);

  // Modest clock turret marks the hall without competing with the plaza tower.
  box(-14, 5, -33, 1.8, 1.8, 1.8, 'plaster');
  box(-14, 6, -33, 2.15, .2, 2.15, 'copper');
  const clockCanvas = document.createElement('canvas'); clockCanvas.width = clockCanvas.height = 256;
  const cc = clockCanvas.getContext('2d');
  cc.fillStyle = '#eee4c9'; cc.beginPath(); cc.arc(128, 128, 123, 0, tau); cc.fill();
  cc.strokeStyle = '#3b5954'; cc.lineWidth = 8; cc.stroke();
  for (let n = 0; n < 12; n++) {
    const a = n / 12 * tau;
    cc.beginPath(); cc.moveTo(128 + Math.sin(a) * 100, 128 - Math.cos(a) * 100);
    cc.lineTo(128 + Math.sin(a) * 111, 128 - Math.cos(a) * 111); cc.lineWidth = n % 3 ? 4 : 7; cc.stroke();
  }
  cc.lineCap = 'round'; cc.lineWidth = 8;
  cc.beginPath(); cc.moveTo(128, 128); cc.lineTo(89, 99); cc.stroke();
  cc.lineWidth = 5; cc.beginPath(); cc.moveTo(128, 128); cc.lineTo(183, 68); cc.stroke();
  const clockMap = new THREE.CanvasTexture(clockCanvas); clockMap.encoding = THREE.sRGBEncoding;
  const clock = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 1.45), new THREE.MeshStandardMaterial({ map: clockMap, roughness: .85, transparent: true }));
  clock.position.set(-14, 5.05, -32.085); group.add(clock);

  // Finished line with a small, isolated maintenance job east of the hall.
  for (const trackZ of [-44, -49]) {
    box(0, -.02, trackZ, 235, .2, 3.3, 'gravel');
    for (let x = -116; x <= 116; x += 1.1) box(x, .1, trackZ, .2, .16, 2.45, 'timberDark');
    for (const dz of [-.76, .76]) {
      box(0, .22, trackZ + dz, 235, .12, .09, 'iron');
      box(0, .15, trackZ + dz, 235, .05, .2, 'iron');
    }
  }
  for (const x of [-33, 32, 70]) {
    for (const z of [-42, -51]) cyl(x, 3.5, z, .09, 7, 'iron');
    beam([x, 6.8, -42], [x, 6.8, -51], .07, 'iron');
  }
  for (const z of [-44, -49]) beam([-110, 6.5, z], [110, 6.5, z], .018, 'iron');
  for (const z of [-31.5, -36]) {
    for (const x of [19, 21, 23, 25]) {
      cyl(x, .75, z, .05, 1.5, 'teal');
      if (x < 25) { beam([x, 1.4, z], [x + 2, 1.4, z], .035, 'teal'); beam([x, .4, z], [x + 2, .4, z], .03, 'teal'); }
    }
    collider(22, z, 6.2, .18, 0, 1.8);
  }
  for (const x of [19, 25]) {
    beam([x, 1.4, -31.5], [x, 1.4, -36], .035, 'teal');
    collider(x, -33.75, .18, 4.6, 0, 1.8);
  }
  sign('A LITTLE WORK, A LONGER JOURNEY\nPlatform garden coming soon', 22, 1.3, -31.4, 3.5, .64, '#9b6b42');
  for (let i = 0; i < 4; i++) box(21.8, .22 + i * .19, -34.6, 2.4, .15, .9, 'timber');
  for (let i = 0; i < 3; i++) box(23.6, .18 + i * .25, -33.3, .7, .25, .5, 'stone');

  const train = new THREE.Group(); train.position.z = -44; group.add(train);
  const trainBatches = new Map();
  function part(geometry, material, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z); mesh.rotation.set(rx, ry, rz); mesh.updateMatrix();
    const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    g.applyMatrix4(mesh.matrix);
    if (!trainBatches.has(material)) trainBatches.set(material, []);
    trainBatches.get(material).push(g); geometry.dispose();
  }
  const tb = (x, y, z, w, h, d, m, rx = 0, ry = 0, rz = 0) => part(new THREE.BoxGeometry(w, h, d), mats[m], x, y, z, rx, ry, rz);
  const wheels = [];
  for (const center of [-5.4, 5.4]) {
    tb(center, 1.23, 0, 10, .66, 2.7, 'ivory');
    tb(center, 1.73, 0, 10, .31, 2.74, 'teal');
    tb(center, .87, 0, 8.6, .2, 1.9, 'iron');
    tb(center, 3.35, 0, 10.1, .34, 2.78, 'copper');
    tb(center, 3.08, 0, 10, .24, 2.72, 'ivory');
    // Pane strips have actual openings between the columns, revealing the cabin.
    for (const side of [-1, 1]) {
      for (let j = 0; j < 7; j++) {
        const x = center - 4.1 + j * 1.37;
        tb(x, 2.42, side * 1.37, 1.14, 1.06, .025, 'glass');
        for (const dx of [-.59, .59]) tb(x + dx, 2.43, side * 1.37, .075, 1.18, .085, 'ivory');
        tb(x, 1.91, side * 1.38, 1.22, .07, .1, 'timber');
        tb(x, 2.98, side * 1.38, 1.22, .07, .1, 'ivory');
        // Upholstered inward-facing bench seats beneath every window.
        tb(x, 1.52, side * .89, .98, .16, .55, 'shirt');
        tb(x, 1.88, side * 1.12, .98, .66, .12, 'shirt');
        if (j < 6) {
          const ringX = x + .3;
          tb(ringX, 2.91, side * .62, .028, .32, .028, 'ivory');
          part(new THREE.TorusGeometry(.082, .014, 5, 10), mats.ivory, ringX, 2.71, side * .62);
        }
      }
      for (const offset of [-2.75, 2.75]) {
        tb(center + offset, 2.36, side * 1.4, .76, 1.36, .04, 'teal');
        tb(center + offset, 2.56, side * 1.43, .58, .72, .03, 'glass');
        tb(center + offset, 2.09, side * 1.44, .08, .025, .025, 'brass');
      }
      tb(center, 3.07, side * .63, 8.7, .035, .035, 'iron');
    }
    for (const end of [-1, 1]) {
      tb(center + end * 4.95, 1.94, 0, .1, .13, 2.7, 'ivory');
      tb(center + end * 4.95, 3, 0, .1, .14, 2.7, 'ivory');
      for (const z of [-1.14, 1.14]) tb(center + end * 4.95, 2.47, z, .1, .96, .42, 'ivory');
      tb(center + end * 4.97, 2.47, 0, .12, .96, .065, 'teal');
      tb(center + end * 5.01, 2.53, 0, .04, .78, 1.78, 'glass');
      for (const z of [-.97, .97]) tb(center + end * 5.04, 1.6, z, .045, .2, .3, end === 1 ? 'glow' : 'brass');
    }
    // Roof vents, bogies and wheels articulated separately from batched body.
    for (const offset of [-2.4, 2.4]) {
      tb(center + offset, 3.64, 0, 1.6, .27, 1.15, 'teal');
      tb(center + offset, .7, 0, 1.7, .3, 1.65, 'iron');
      for (const dx of [-.58, .58]) for (const side of [-1, 1]) {
        const wheel = new THREE.Group(); wheel.position.set(center + offset + dx, .57, side * .91);
        const tyre = new THREE.Mesh(new THREE.CylinderGeometry(.31, .31, .17, 14), mats.iron);
        tyre.rotation.x = Math.PI / 2; tyre.castShadow = true; wheel.add(tyre);
        const hub = new THREE.Mesh(new THREE.BoxGeometry(.045, .4, .18), mats.brass); wheel.add(hub);
        train.add(wheel); wheels.push(wheel);
      }
    }
  }
  tb(0, 1.97, 0, .6, 2.25, 1.7, 'iron');
  // Merge train body pieces by material so detailed windows and seats stay cheap.
  for (const [material, geometries] of trainBatches) {
    const merged = new THREE.BufferGeometry();
    for (const attr of ['position', 'normal', 'uv']) {
      const itemSize = geometries[0].getAttribute(attr).itemSize;
      const length = geometries.reduce((n, g) => n + g.getAttribute(attr).array.length, 0);
      const values = new Float32Array(length); let offset = 0;
      for (const geometry of geometries) { const a = geometry.getAttribute(attr).array; values.set(a, offset); offset += a.length; }
      merged.setAttribute(attr, new THREE.BufferAttribute(values, itemSize));
    }
    merged.computeBoundingSphere();
    const mesh = new THREE.Mesh(merged, material); mesh.castShadow = !material.transparent; mesh.receiveShadow = true;
    train.add(mesh); for (const g of geometries) g.dispose();
  }
  function update(seconds) {
    const t = ((seconds % 64) + 64) % 64;
    const ease = v => v * v * (3 - 2 * v);
    let phase, x;
    if (t < 14) { phase = 'Arriving'; x = -110 + 110 * ease(t / 14); }
    else if (t < 28) { phase = 'At platform'; x = 0; }
    else if (t < 44) { phase = 'Departing'; x = 110 * ease((t - 28) / 16); }
    else { phase = 'Along the valley'; x = 110; }
    train.position.x = x; train.visible = t < 44;
    for (const wheel of wheels) wheel.rotation.z = -x / .31;
    return { phase, dwellRemaining: t >= 14 && t < 28 ? Math.ceil(28 - t) : 0, x };
  }
  function walkHeight(x, z) {
    if (x >= 8 && x <= 12 && z <= -33 && z >= -37.2) return (-z - 33) / 4.2 * .6;
    if (x >= -26 && x <= 26 && z <= -37.2 && z >= -40.8) return .6;
    if (x >= -9.05 && x <= -6.95 && z < -36.44 && z >= -37.25) {
      return .12 * (Math.min(3, Math.floor((-z - 36.44) / .19)) + 2);
    }
    if (x >= -17.3 && x <= -2.7 && z <= -29.15 && z >= -36.52) return .12;
    return null;
  }
  update(20);
  return { group, update, walkHeight };
}
