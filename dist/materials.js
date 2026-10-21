// Procedural Copperlight surfaces. One UV tile represents about one metre.
export function createMaterials(THREE) {
  const size = 256;
  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  const fract = v => v - Math.floor(v);
  const smooth = v => v * v * (3 - 2 * v);
  const hash = (x, y, seed) => {
    let h = Math.imul(x ^ seed, 374761393) ^ Math.imul(y, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  };
  // Integer periods make the multiscale noise and its derived normals tile.
  function noise(u, v, period, seed) {
    const x = fract(u) * period, y = fract(v) * period;
    const ix = Math.floor(x), iy = Math.floor(y), a = smooth(fract(x)), b = smooth(fract(y));
    const sample = (dx, dy) => hash((ix + dx) % period, (iy + dy) % period, seed);
    return (sample(0, 0) * (1 - a) + sample(1, 0) * a) * (1 - b)
      + (sample(0, 1) * (1 - a) + sample(1, 1) * a) * b;
  }
  function texture(canvas, color) {
    const map = new THREE.CanvasTexture(canvas);
    map.encoding = color ? THREE.sRGBEncoding : THREE.LinearEncoding;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(1, 1);
    map.anisotropy = 4;
    return map;
  }
  function canvasImage() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const context = canvas.getContext('2d');
    return { canvas, context, pixels: context.createImageData(size, size) };
  }
  function mapped(name, hex, kind, roughness = 0.85, relief = 0.35) {
    const rgb = [hex >> 16 & 255, hex >> 8 & 255, hex & 255];
    const color = canvasImage(), normal = canvasImage(), rough = canvasImage();
    const heights = new Float32Array(size * size);
    const roughnesses = new Float32Array(size * size);
    const tau = Math.PI * 2;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size, i = y * size + x;
      const broad = noise(u, v, 4, 71), fine = noise(u, v, 48, 39);
      const medium = noise(u, v, 16, 17);
      let h = 0.4 + medium * 0.12 + fine * 0.05;
      let shade = 0.94 + broad * 0.075 + fine * 0.025;
      let r = roughness + (medium - 0.5) * 0.12;
      let tint = 0;
      if (kind === 'wood') {
        const warp = Math.sin(v * tau * 2) * 0.025 + Math.sin(v * tau * 5) * 0.008;
        const grain = Math.pow(0.5 + 0.5 * Math.sin(tau * (u * 29 + warp)), 8);
        const longGrain = noise(u * 8, v, 8, 93);
        const seam = Math.min(fract(u * 4), 1 - fract(u * 4));
        h = 0.55 + grain * 0.045 + longGrain * 0.045 - (seam < 0.025 ? 0.18 : 0);
        shade = 0.87 + grain * 0.08 + longGrain * 0.1 + broad * 0.06;
        if (seam < 0.025) shade *= 0.68;
        r = 0.65 + (1 - grain) * 0.18;
      } else if (kind === 'paving' || kind === 'brick' || kind === 'roof') {
        const rows = kind === 'brick' ? 6 : kind === 'roof' ? 8 : 4;
        const columns = kind === 'brick' ? 3 : kind === 'roof' ? 5 : 4;
        const row = Math.floor(v * rows);
        const offset = kind === 'paving' ? 0 : row % 2 * 0.5;
        const sx = fract(u * columns + offset), sy = fract(v * rows);
        const edge = Math.min(sx, 1 - sx, sy, 1 - sy);
        const inset = smooth(clamp(edge / 0.045));
        const tile = hash(Math.floor(u * columns + offset) % columns, row, 61);
        h = 0.16 + inset * 0.45 + fine * 0.025;
        if (kind === 'roof') h += Math.sin(sx * Math.PI) * 0.12;
        shade = (0.83 + tile * 0.15 + fine * 0.025) * (0.71 + inset * 0.29);
        r = roughness + (1 - inset) * 0.12 + (tile - 0.5) * 0.08;
      } else if (kind === 'stone') {
        const veins = Math.abs(Math.sin(tau * (u * 2 + v * 3) + broad * 5));
        h = 0.4 + broad * 0.08 + medium * 0.09 + fine * 0.035;
        shade = 0.88 + broad * 0.09 + veins * 0.04;
      } else if (kind === 'copper') {
        const oxide = smooth(clamp((broad + medium * 0.22 - 0.46) * 3));
        h = 0.45 + medium * 0.035 + fine * 0.015;
        shade = 0.83 + oxide * 0.13 + fine * 0.035;
        tint = oxide;
        r = 0.54 + oxide * 0.31;
      } else if (kind === 'grass' || kind === 'soil' || kind === 'sand') {
        h = broad * 0.14 + medium * 0.11 + fine * (kind === 'sand' ? 0.028 : 0.08);
        shade = 0.82 + broad * 0.13 + medium * 0.08;
        if (kind === 'grass') {
          const blades = Math.pow(0.5 + 0.5 * Math.sin(tau * (u * 58 + v * 7)), 12);
          h += blades * 0.035;
          shade += blades * 0.05;
        }
      } else if (kind === 'gravel') {
        let nearest = 10, next = 10, pebble = 0;
        const cells = 24, cx = Math.floor(u * cells), cy = Math.floor(v * cells);
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
          const ix = cx + ox, iy = cy + oy;
          const px = ix + hash((ix + cells) % cells, (iy + cells) % cells, 45);
          const py = iy + hash((ix + cells) % cells, (iy + cells) % cells, 64);
          const d = Math.hypot(u * cells - px, v * cells - py);
          if (d < nearest) { next = nearest; nearest = d; pebble = hash((ix + cells) % cells, (iy + cells) % cells, 32); }
          else next = Math.min(next, d);
        }
        const border = smooth(clamp((next - nearest) * 7));
        h = border * (0.35 + pebble * 0.16) + fine * 0.02;
        shade = (0.8 + pebble * 0.18) * (0.62 + border * 0.38);
      } else if (kind === 'water') {
        h = 0.5 + Math.sin(tau * (u * 3 + v * 2)) * 0.06
          + Math.sin(tau * (u * 7 - v * 5)) * 0.025;
        shade = 0.94 + broad * 0.06;
        r = 0.3 + medium * 0.06;
      } else if (kind === 'fabric' || kind === 'awning') {
        const weave = Math.sin(u * tau * 96) * Math.sin(v * tau * 96);
        h = 0.5 + weave * 0.025;
        shade = 0.94 + weave * 0.025 + broad * 0.035;
        if (kind === 'awning') tint = Math.floor(u * 8) % 2;
      }
      heights[i] = h;
      roughnesses[i] = clamp(r, 0.05, 1);
      const p = i * 4;
      for (let c = 0; c < 3; c++) {
        const patina = kind === 'copper' ? [88, 145, 132][c]
          : kind === 'awning' ? [234, 221, 190][c] : rgb[c];
        color.pixels.data[p + c] = clamp((rgb[c] * (1 - tint) + patina * tint) * shade, 0, 255);
      }
      color.pixels.data[p + 3] = 255;
    }
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const i = y * size + x, p = i * 4;
      const left = heights[y * size + (x + size - 1) % size];
      const right = heights[y * size + (x + 1) % size];
      const up = heights[((y + size - 1) % size) * size + x];
      const down = heights[((y + 1) % size) * size + x];
      // Canvas rows point downward; tangent-space positive Y points upward.
      const nx = (left - right) * 4, ny = (down - up) * 4;
      const len = Math.hypot(nx, ny, 1);
      normal.pixels.data[p] = (nx / len * 0.5 + 0.5) * 255;
      normal.pixels.data[p + 1] = (ny / len * 0.5 + 0.5) * 255;
      normal.pixels.data[p + 2] = (1 / len * 0.5 + 0.5) * 255;
      normal.pixels.data[p + 3] = 255;
      for (let c = 0; c < 3; c++) rough.pixels.data[p + c] = roughnesses[i] * 255;
      rough.pixels.data[p + 3] = 255;
    }
    for (const layer of [color, normal, rough]) layer.context.putImageData(layer.pixels, 0, 0);
    const material = new THREE.MeshStandardMaterial({
      map: texture(color.canvas, true), normalMap: texture(normal.canvas, false),
      roughnessMap: texture(rough.canvas, false), roughness: 1, metalness: 0,
      normalScale: new THREE.Vector2(relief, relief)
    });
    material.name = name;
    material.userData.tileMeters = 1;
    return material;
  }
  const flat = (name, color, roughness = 0.8, extra = {}) => {
    const material = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, ...extra });
    material.name = name;
    return material;
  };
  const variant = (source, name, color, extra = {}) => {
    const material = source.clone();
    material.name = name;
    material.color.setHex(color);
    Object.assign(material, extra);
    return material;
  };
  const plaster = mapped('Warm lime plaster', 0xe6d3b0, 'plaster', 0.92, 0.22);
  const timber = mapped('Oiled honey timber', 0xa97848, 'wood', 0.72, 0.4);
  const roof = mapped('Terracotta roof tiles', 0xad6347, 'roof', 0.83, 0.55);
  const copper = mapped('Weathered copper patina', 0x9c8162, 'copper', 0.75, 0.22);
  copper.metalness = 0.22;
  const stone = mapped('Warm limestone', 0xa6a18f, 'stone', 0.9, 0.36);
  const water = mapped('Turquoise river water', 0x3e9a9a, 'water', 0.33, 0.36);
  water.transparent = true;
  water.opacity = 0.77;
  water.depthWrite = false;
  const fabric = mapped('Woven cream canvas', 0xd0bea0, 'fabric', 0.95, 0.15);
  return {
    plaster,
    cream: variant(plaster, 'Cream painted plaster', 0xfff5df),
    timber,
    timberDark: variant(timber, 'Dark stained timber', 0x705440),
    roof,
    roofLight: variant(roof, 'Pale terracotta tiles', 0xffd7ac),
    stone,
    paving: mapped('Plaza limestone paving', 0xb6ad96, 'paving', 0.88, 0.5),
    brick: mapped('Handmade terracotta brick', 0xb17a5e, 'brick', 0.88, 0.55),
    copper,
    teal: flat('Muted teal painted metal', 0x477d79, 0.57, { metalness: 0.08 }),
    iron: flat('Charcoal iron', 0x3c4948, 0.7, { metalness: 0.18 }),
    grass: mapped('Soft valley grass', 0x7f9560, 'grass', 0.98, 0.3),
    soil: mapped('Warm garden soil', 0x776048, 'soil', 0.98, 0.45),
    gravel: mapped('River gravel', 0xa39d86, 'gravel', 0.92, 0.65),
    sand: mapped('Pale riverbank sand', 0xc2b691, 'sand', 0.94, 0.2),
    water,
    glass: flat('Clear blue window glass', 0x99c8c7, 0.2, { transparent: true, opacity: 0.15, depthWrite: false, side: THREE.DoubleSide }),
    leaf: flat('Willow green foliage', 0x748957, 0.95),
    leafLight: flat('Sunlit sage foliage', 0x9ca971, 0.96),
    leafDark: flat('Shaded olive foliage', 0x526a4c, 0.96),
    blossom: flat('Pale cherry petals', 0xecc6c1, 0.94, { side: THREE.DoubleSide }),
    fabric,
    awning: mapped('Teal and cream awning canvas', 0x4f807a, 'awning', 0.94, 0.18),
    ivory: flat('Warm ivory enamel', 0xe7dcc4, 0.62),
    skin: flat('Warm skin', 0xcba285, 0.88),
    hair: flat('Dark brown hair', 0x51443b, 0.84),
    trouser: flat('Indigo work trousers', 0x465d65, 0.93),
    shirt: variant(fabric, 'Muted teal shirt', 0x8eb4ab),
    brass: flat('Brushed aged brass', 0xaf9155, 0.53, { metalness: 0.28 }),
    ceramic: flat('Warm glazed ceramic', 0xe9d6b4, 0.28),
    pastry: flat('Golden baked pastry', 0xc58b4f, 0.86),
    glow: flat('Amber window and lantern glow', 0xffcc7a, 0.6, { emissive: 0xffb85c, emissiveIntensity: 0.7 })
  };
}
