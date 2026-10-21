// The valley landscape is authored in metres. All plants and surfaces are original,
// generated geometry; foliage is rendered in two instanced draw calls.
export function buildLandscape(ctx) {
  const { THREE, mats, box, cyl, beam, sign, collider } = ctx;
  const group = new THREE.Group();
  group.name = 'Copperlight river and gardens';
  let seed = 91237;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const range = (a, b) => a + random() * (b - a);
  const greenCards = [], blossomCards = [];
  const clock = { value: 0 };
  const dummy = new THREE.Object3D();
  const material = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.98, metalness: 0 });

  // Two continuous pieces leave a true lowered channel beneath the timber bridge.
  box(0, -0.7, 22.5, 150, 1.4, 65, mats.grass);
  box(0, -0.7, -58.5, 240, 1.4, 73, mats.grass);
  function bank(z1, y1, z2, y2) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([
      -350, y1, z1, 350, y1, z1, -350, y2, z2, 350, y2, z2
    ], 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 700, 0, 0, 2.5, 700, 2.5], 2));
    geometry.setIndex([0, 1, 2, 1, 3, 2]);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, mats.sand);
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  bank(-10, 0, -12, -0.85);
  bank(-20, -0.85, -22, 0);
  box(0, -1.05, -16, 700, 0.25, 8, mats.gravel);

  const waterGeometry = new THREE.PlaneGeometry(700, 8, 112, 4);
  waterGeometry.rotateX(-Math.PI / 2);
  const waterPosition = waterGeometry.attributes.position;
  // Keep a reference to the unmodified grid for the small river ripples.
  const waterBase = new Float32Array(waterPosition.array);
  const water = new THREE.Mesh(waterGeometry, mats.water);
  water.position.set(0, -0.55, -16);
  water.receiveShadow = true;
  group.add(water);

  // Broad continuous ridges, with a varied skyline rather than repeated cones.
  function ridge(z, width, baseHeight, amplitude, color, phase, depth) {
    const columns = 56, rows = 9;
    const vertices = [], colors = [], indices = [];
    const baseColor = new THREE.Color(color), tint = new THREE.Color();
    for (let row = 0; row <= rows; row++) {
      const t = row / rows;
      for (let column = 0; column <= columns; column++) {
        const x = (column / columns - 0.5) * width;
        const broad = Math.sin(column * 0.23 + phase) * 0.23
          + Math.sin(column * 0.59 + phase * 2) * 0.11
          + Math.cos(column * 0.115 - phase) * 0.3;
        const height = (baseHeight + amplitude * (0.6 + broad)) * Math.sin(t * Math.PI * 0.84) * .59;
        vertices.push(x, Math.max(-0.2, height), z - t * depth);
        tint.copy(baseColor).multiplyScalar(0.9 + t * 0.16 + broad * 0.08);
        colors.push(tint.r, tint.g, tint.b);
        if (row < rows && column < columns) {
          const i = row * (columns + 1) + column;
          indices.push(i, i + 1, i + columns + 1, i + 1, i + columns + 2, i + columns + 1);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
      color: 0xffffff, vertexColors: true, roughness: 1, metalness: 0
    }));
    group.add(mesh);
    return mesh;
  }
  ridge(-107, 340, 27, 38, 0x9aaea9, 3.3, 68);
  ridge(-85, 280, 14, 33, 0x82968d, 0.4, 48);
  ridge(-68, 250, 5, 24, 0x748a75, 1.5, 38);
  const leftRidge = ridge(-52, 170, 4, 24, 0x7c9275, 2.6, 50);
  leftRidge.rotation.y = Math.PI * 0.38;
  leftRidge.position.set(-97, 0, 20);
  const rightRidge = ridge(-52, 170, 4, 23, 0x83977a, 4.2, 50);
  rightRidge.rotation.y = -Math.PI * 0.38;
  rightRidge.position.set(97, 0, 20);

  function foliageTexture(cherry) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const g = canvas.getContext('2d');
    if (cherry) {
      // A very faint connected layer gives clusters depth without hard square edges.
      g.fillStyle = 'rgba(222,173,175,.15)';
      g.beginPath(); g.ellipse(64, 64, 44, 37, 0.3, 0, Math.PI * 2); g.fill();
      for (let f = 0; f < 11; f++) {
        const x = range(23, 106), y = range(21, 108), radius = range(10, 16);
        g.save(); g.translate(x, y); g.rotate(range(0, Math.PI));
        for (let p = 0; p < 5; p++) {
          g.rotate(Math.PI * 2 / 5);
          g.fillStyle = f % 3 === 0 ? '#f4dfd7' : '#efd0cb';
          g.beginPath(); g.moveTo(0, 1);
          g.bezierCurveTo(-radius * .7, -radius * .45, -radius * .55, -radius * 1.2, -1.6, -radius);
          g.lineTo(0, -radius * .8); g.lineTo(1.6, -radius);
          g.bezierCurveTo(radius * .55, -radius * 1.2, radius * .7, -radius * .45, 0, 1); g.fill();
        }
        g.fillStyle = '#bf868a'; g.beginPath(); g.arc(0, 0, 2.1, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#d2998c'; g.lineWidth = .6;
        for (let a = 0; a < 8; a++) {
          const angle = a * Math.PI / 4;
          g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(angle) * 4, Math.sin(angle) * 4); g.stroke();
        }
        g.restore();
      }
    } else {
      // Overlapping broad leaf sprays retain their edge detail at town scale.
      // The old single twig left large transparent holes in every canopy card.
      g.strokeStyle = '#657649'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(26, 110); g.quadraticCurveTo(60, 70, 95, 23); g.stroke();
      for (let leaf = 0; leaf < 44; leaf++) {
        const angle = range(0, Math.PI * 2), radius = Math.sqrt(random());
        const x = 64 + Math.cos(angle) * radius * 44, y = 68 + Math.sin(angle) * radius * 44;
        g.save(); g.translate(x, y); g.rotate(range(-Math.PI, Math.PI));
        g.fillStyle = ['#82965c', '#99a96b', '#738953', '#a6b477'][leaf % 4];
        g.beginPath(); g.moveTo(0, 0);
        g.bezierCurveTo(-13, -7, -14, -20, 0, -29);
        g.bezierCurveTo(13, -20, 12, -7, 0, 0); g.fill();
        g.restore();
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy = 4;
    return texture;
  }
  function foliageMaterial(cherry) {
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff, map: foliageTexture(cherry), alphaTest: 0.36,
      side: THREE.DoubleSide, roughness: 0.98, metalness: 0
    });
    mat.onBeforeCompile = shader => {
      shader.uniforms.valleyTime = clock;
      shader.vertexShader = 'uniform float valleyTime;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
        #include <begin_vertex>
        float phase = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.29;
        transformed.x += sin(valleyTime * 0.9 + phase) * 0.055 * (position.y + 0.7);
        transformed.z += cos(valleyTime * 0.72 + phase) * 0.035;
      `);
    };
    mat.customProgramCacheKey = () => 'valley-foliage-sway';
    return mat;
  }

  function tree(x, z, size = 1, cherry = false) {
    const trunkMat = mats.timberDark;
    const base = new THREE.Vector3(x, 0, z);
    const fork = base.clone().add(new THREE.Vector3(.08 * size, 1.35 * size, .02));
    beam(base.toArray(), fork.toArray(), .2 * size, trunkMat);
    collider(x, z, .62 * size, .62 * size, 0, 3.5 * size);
    const terminals = [], innerSites = [];
    const crownWidth = cherry ? 1 : range(.82, 1.2);
    const crownHeight = cherry ? 1 : range(.88, 1.22);
    function branch(start, angle, length, level, width) {
      const outward = length * (level === 0 ? .65 : .88) * crownWidth;
      const up = length * (level === 0 ? .82 : level === 1 ? .4 : .08) * crownHeight;
      const end = start.clone().add(new THREE.Vector3(Math.cos(angle) * outward, up, Math.sin(angle) * outward));
      beam(start.toArray(), end.toArray(), width, trunkMat);
      if (level === 1 || level === 2) innerSites.push({ end, angle });
      if (level < 3) {
        branch(end, angle - range(.36, .62), length * .69, level + 1, width * .56);
        branch(end, angle + range(.32, .68), length * .65, level + 1, width * .54);
      } else terminals.push({ end, angle });
    }
    const limbs = cherry ? 4 : (random() > .55 ? 4 : 3);
    for (let limb = 0; limb < limbs; limb++) {
      branch(fork, limb / limbs * Math.PI * 2 + range(-.2, .2), (cherry ? 2.05 : range(1.65, 2.05)) * size, 0, .15 * size);
    }
    // Upper terminal sprays overlap with smaller inner sprays. This gives trees
    // a continuous living crown while leaving lower trunks and main forks visible.
    const sites = cherry ? terminals : terminals.concat(innerSites);
    for (const { end, angle } of sites) {
      const isInner = !terminals.some(site => site.end === end);
      const count = cherry ? 34 : isInner ? 17 : 31;
      for (let i = 0; i < count; i++) {
        const a = range(0, Math.PI * 2), r = Math.sqrt(random()) * (cherry ? 1.05 : isInner ? .85 : 1.02) * size;
        const height = range(isInner ? -.05 : -.43, .75) * size;
        const position = end.clone().add(new THREE.Vector3(Math.cos(a) * r, height, Math.sin(a) * r));
        position.y -= Math.max(0, r - .5 * size) * .28;
        const shade = THREE.MathUtils.clamp(.86 + height / size * .16 + random() * .14, .78, 1.1);
        (cherry ? blossomCards : greenCards).push({
          position, rotation: [range(-1.25, 1.25), angle + range(-Math.PI, Math.PI), range(-Math.PI, Math.PI)],
          scale: range(cherry ? .55 : .8, cherry ? .9 : 1.27) * size,
          color: new THREE.Color(cherry ? 0xf1d3ce : 0xa9b582).multiplyScalar(shade)
        });
      }
    }
  }

  // Set back from storefronts, station entrances, and the central walking route.
  const treeLocations = [
    [-34, -8, 1.2], [-22, -7, 1], [20, -9, .95], [35, -8, 1.25],
    [-35, -24, 1.3], [-25, -24, 1], [37, -24, 1.1], [46, -23, 1.3],
    [-54, 19, 1.15], [33, 8, 1.2], [-52, 38, 1.4], [52, 35, 1.3],
    [-49, -39, 1.4], [41, -40, 1.2], [-58, -8, 1.5], [58, -25, 1.5],
    [-54,55,1.35],[-54,73,1.45],[-30,65,1.1],[-26,79,1.3],[-18,89,1.2],
    [20,89,1.3],[30,82,1.4],[55,85,1.5],[55,65,1.4],[29,57,1.05],
    [-29,57,1.1],[-37,6,1.2],[39,-1,1.2],[54,45,1.4]
  ];
  treeLocations.forEach(([x, z, size]) => tree(x, z, size));

  // The listening garden remains sheltered but visible from the bridge.
  const gardenGeometry = new THREE.CircleGeometry(6.7, 48);
  gardenGeometry.rotateX(-Math.PI / 2);
  const uv = gardenGeometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 13.4, uv.getY(i) * 13.4);
  const garden = new THREE.Mesh(gardenGeometry, mats.gravel);
  garden.position.set(24, .025, -26.7);
  garden.receiveShadow = true;
  group.add(garden);
  box(12, .035, -25.5, 15, .07, 2.1, mats.gravel);
  tree(23, -22.6, 1.3, true);
  sign('THE QUIET FREQUENCY\nListening garden · Please linger', 22.7, 1.4, -31.3, 3.1, .7, '#456b62', Math.PI);
  beam([21.4, 0, -31.3], [21.4, 1.4, -31.3], .065, mats.timberDark);
  beam([24, 0, -31.3], [24, 1.4, -31.3], .065, mats.timberDark);
  function bench(x, z, rotation = 0) {
    // Positions are transformed so every timber slat can join the static batches.
    const place = (dx, y, dz, w, h, d, mat) => {
      const xx = x + dx * Math.cos(rotation) + dz * Math.sin(rotation);
      const zz = z - dx * Math.sin(rotation) + dz * Math.cos(rotation);
      box(xx, y, zz, w, h, d, mat, 0, rotation);
    };
    for (let slat = 0; slat < 4; slat++) place(0, .48, -.27 + slat * .18, 2.3, .095, .14, mats.timber);
    for (let slat = 0; slat < 3; slat++) place(0, .77 + slat * .17, .35, 2.3, .12, .08, mats.timber);
    for (const end of [-.88, .88]) { place(end, .25, 0, .09, .5, .65, mats.iron); place(end, .77, .35, .07, .8, .07, mats.iron); }
    collider(x, z, 2.4, 1, 0, 1.3);
  }
  bench(27.8, -27.4, -.45);
  bench(-11, -9.7, Math.PI);
  bench(12, -9.7, Math.PI);

  // Irregular stones and individual reed stems give the banks an inhabited scale.
  const rockGeometry = new THREE.IcosahedronGeometry(1, 0);
  const rockCount = 125;
  const rocks = new THREE.InstancedMesh(rockGeometry, mats.stone, rockCount);
  for (let i = 0; i < rockCount; i++) {
    let x = range(-67, 67);
    if (Math.abs(x) < 4) x += x < 0 ? -5 : 5;
    const north = i % 2 === 0;
    dummy.position.set(x, -.53, north ? range(-20.6, -19.65) : range(-12.35, -11.4));
    dummy.rotation.set(range(-.6, .6), range(0, Math.PI), range(-.4, .4));
    dummy.scale.set(range(.17, .62), range(.1, .29), range(.14, .43));
    dummy.updateMatrix(); rocks.setMatrixAt(i, dummy.matrix);
  }
  rocks.receiveShadow = true;
  group.add(rocks);
  const reedMat = material(0x859163);
  for (let cluster = 0; cluster < 54; cluster++) {
    let x = range(-65, 65);
    if (Math.abs(x) < 6) x += x < 0 ? -7 : 7;
    const z = cluster % 2 ? range(-12.1, -11.7) : range(-20.3, -19.9);
    for (let stem = 0; stem < 5; stem++) {
      const px = x + range(-.22, .22), pz = z + range(-.2, .2), height = range(.35, .85);
      beam([px, -.52, pz], [px + range(-.1, .1), -.52 + height, pz + range(-.1, .1)], .012, reedMat);
    }
  }

  // Small planted drifts break up open grass without covering the route or shop
  // thresholds. They share the tree instances, so add no foliage draw calls.
  const plantingBeds = [
    [-39, -9.8, 12, 1.2], [40, -9.8, 13, 1.15],
    [-42, -23.3, 13, 1.35], [43, -23.4, 12, 1.4],
    [-32, 30, 7, 2], [30, 29, 9, 2.4], [-43, 12, 6, 3],
    [57, 11, 3, 2], [35, -37, 7, 2], [-40, -37, 7, 2],
    [27, -32, 4.5, .8], [30.1, -26.5, .8, 3.5]
  ];
  for (const [cx, cz, spreadX, spreadZ] of plantingBeds) {
    for (let cluster = 0; cluster < 7; cluster++) {
      const x = cx + range(-spreadX, spreadX), z = cz + range(-spreadZ, spreadZ);
      const height = range(.3, .68), width = range(.35, .8);
      const groundY = z < -10 && z > -12 ? (z + 10) * .425
        : z > -22 && z < -20 ? -(z + 22) * .425 : 0;
      for (let i = 0; i < 24; i++) {
        const angle = range(0, Math.PI * 2), radius = Math.sqrt(random()) * width;
        greenCards.push({
          position: new THREE.Vector3(x + Math.cos(angle) * radius, groundY + .12 + random() * height, z + Math.sin(angle) * radius),
          rotation: [range(-1.2, 1.2), range(0, Math.PI * 2), range(-1.5, 1.5)],
          scale: range(.37, .67),
          color: new THREE.Color(i % 7 === 0 ? 0xb5b788 : 0x94a56d).multiplyScalar(range(.73, .98))
        });
      }
    }
  }

  function instancedCards(cards, mat, name) {
    // Shuffling makes every tree retain the same density when quality is reduced.
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat, cards.length);
    mesh.name = name;
    cards.forEach((card, i) => {
      dummy.position.copy(card.position);
      dummy.rotation.set(...card.rotation);
      dummy.scale.setScalar(card.scale);
      dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); mesh.setColorAt(i, card.color);
    });
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.userData.fullCount = cards.length;
    group.add(mesh);
    return mesh;
  }
  const leaves = instancedCards(greenCards, foliageMaterial(false), 'Instanced riverbank leaves');
  const blossoms = instancedCards(blossomCards, foliageMaterial(true), 'Instanced pale cherry clusters');

  // A tiny animated petal field is deliberately limited to the signature tree.
  const petalGeometry = new THREE.PlaneGeometry(.055, .09);
  const petals = new THREE.InstancedMesh(petalGeometry, mats.blossom, 90);
  const petalSeeds = Array.from({ length: 90 }, () => [range(0, 1), range(0, Math.PI * 2), range(.7, 3.6)]);
  petals.frustumCulled = false;
  group.add(petals);
  const fallenPetals = new THREE.InstancedMesh(petalGeometry, mats.blossom, 260);
  for (let i = 0; i < fallenPetals.count; i++) {
    const angle = range(0, Math.PI * 2), radius = Math.sqrt(random()) * 4.5;
    const x = 23 + Math.cos(angle) * radius, z = -22.6 + Math.sin(angle) * radius;
    // Do not float ground petals over the river or the descending bank.
    dummy.position.set(x, z < -22 ? .049 : -.83, z);
    dummy.rotation.set(-Math.PI / 2, 0, angle);
    dummy.scale.setScalar(range(.55, 1.15)); dummy.updateMatrix();
    fallenPetals.setMatrixAt(i, dummy.matrix);
  }
  group.add(fallenPetals);
  let previousQuality;
  function update(seconds, quality = 'medium') {
    clock.value = seconds;
    if (quality !== previousQuality) {
      const density = quality === 'low' ? .4 : quality === 'high' ? 1 : .7;
      leaves.count = Math.floor(leaves.userData.fullCount * density);
      blossoms.count = Math.floor(blossoms.userData.fullCount * density);
      leaves.castShadow = blossoms.castShadow = quality === 'high';
      petals.visible = quality !== 'low';
      previousQuality = quality;
    }
    for (let i = 0; i < waterPosition.count; i++) {
      waterPosition.setY(i, Math.sin(waterBase[i * 3] * .9 + seconds * 1.1) * .018
        + Math.sin(waterBase[i * 3 + 2] * 2.5 - seconds * .8) * .009);
    }
    waterPosition.needsUpdate = true;
    if (mats.water.normalMap) mats.water.normalMap.offset.set(seconds * .012, seconds * .003);
    petalSeeds.forEach(([phase, angle, radius], i) => {
      const progress = (phase + seconds * .073) % 1;
      dummy.position.set(23 + Math.cos(angle + seconds * .12) * radius + progress * .8,
        .06 + (1 - progress) * 4.2, -22.6 + Math.sin(angle + seconds * .1) * radius);
      dummy.rotation.set(seconds * .7 + angle, angle + seconds * .4, seconds + phase * 6);
      dummy.scale.setScalar(.7 + phase * .7); dummy.updateMatrix(); petals.setMatrixAt(i, dummy.matrix);
    });
    petals.instanceMatrix.needsUpdate = true;
  }
  update(0);
  return { group, update };
}
