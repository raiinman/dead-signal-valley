import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const root = fileURLToPath(new URL('./', import.meta.url));
export const sourcePath = resolve(root, 'evidence/meshy-cafe-source.glb');
export const runtimePath = resolve(root, 'dist/assets/meshy-cafe/copperlight-espresso-faithful.glb');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

function imageSize(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  assert.equal(bytes.readUInt16BE(0), 0xffd8, 'Expected PNG or JPEG image');
  const frameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    assert.equal(bytes[offset++], 0xff, 'Malformed JPEG marker');
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === 0xda || marker === 0xd9) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const size = bytes.readUInt16BE(offset);
    assert.ok(size >= 2 && offset + size <= bytes.length, 'Malformed JPEG segment');
    if (frameMarkers.has(marker)) {
      return { width: bytes.readUInt16BE(offset + 5), height: bytes.readUInt16BE(offset + 3) };
    }
    offset += size;
  }
  throw new Error('JPEG has no frame dimensions');
}

export async function inspectGLB(path) {
  const bytes = await readFile(path);
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF', 'Invalid GLB magic');
  assert.equal(bytes.readUInt32LE(4), 2, 'Only GLB 2 is supported');
  assert.equal(bytes.readUInt32LE(8), bytes.length, 'Incorrect GLB length');
  let document, binary;
  for (let offset = 12; offset < bytes.length;) {
    const length = bytes.readUInt32LE(offset);
    const type = bytes.readUInt32LE(offset + 4);
    assert.ok(offset + 8 + length <= bytes.length, 'Truncated GLB chunk');
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === 0x4e4f534a) document = JSON.parse(data.toString('utf8'));
    if (type === 0x004e4942) binary = data;
    offset += 8 + length;
  }
  assert.ok(document && binary, 'Expected embedded JSON and BIN chunks');
  const viewBytes = index => {
    const view = document.bufferViews[index];
    assert.equal(view.buffer, 0, 'Expected embedded buffer');
    const start = view.byteOffset ?? 0;
    assert.ok(start + view.byteLength <= binary.length, 'Buffer view exceeds BIN chunk');
    return binary.subarray(start, start + view.byteLength);
  };
  let triangleCount = 0, vertexCount = 0;
  const primitives = document.meshes.flatMap(mesh => mesh.primitives.map(primitive => {
    const position = document.accessors[primitive.attributes.POSITION];
    const count = primitive.indices === undefined ? position.count : document.accessors[primitive.indices].count;
    const mode = primitive.mode ?? 4;
    assert.equal(mode, 4, 'Expected triangle primitives');
    triangleCount += count / 3;
    vertexCount += position.count;
    const attributes = Object.fromEntries(Object.entries(primitive.attributes).map(([name, index]) => {
      const accessor = document.accessors[index];
      assert.notEqual(accessor.bufferView, undefined, 'Expected non-sparse embedded attributes');
      return [name, { count: accessor.count, type: accessor.type, componentType: accessor.componentType, sha256: sha256(viewBytes(accessor.bufferView)) }];
    }));
    return { triangleCount: count / 3, vertexCount: position.count, normals: 'NORMAL' in attributes, tangents: 'TANGENT' in attributes, attributes };
  }));
  const images = (document.images ?? []).map(image => {
    assert.notEqual(image.bufferView, undefined, 'Expected embedded images');
    const data = viewBytes(image.bufferView);
    return { mimeType: image.mimeType, bytes: data.length, ...imageSize(data), sha256: sha256(data) };
  });
  return { bytes: bytes.length, sha256: sha256(bytes), triangleCount, vertexCount, primitives, images, materials: document.materials ?? [] };
}

export function fidelityChecks(source, runtime) {
  return {
    originalGeometry: JSON.stringify(source.primitives) === JSON.stringify(runtime.primitives),
    originalEmbeddedImages: JSON.stringify(source.images) === JSON.stringify(runtime.images),
    originalPBRMaterials: JSON.stringify(source.materials) === JSON.stringify(runtime.materials),
    byteForByteOriginal: source.sha256 === runtime.sha256 && source.bytes === runtime.bytes,
  };
}

export function assertFidelity(source, runtime) {
  const checks = fidelityChecks(source, runtime);
  assert.ok(Object.values(checks).every(Boolean), `Espresso fidelity regression: ${JSON.stringify(checks)}`);
  return checks;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const candidate = process.argv[2] ? resolve(process.argv[2]) : runtimePath;
  const [source, runtime] = await Promise.all([inspectGLB(sourcePath), inspectGLB(candidate)]);
  const checks = assertFidelity(source, runtime);
  console.log(JSON.stringify({ pass: true, candidate, checks, sha256: runtime.sha256, triangleCount: runtime.triangleCount, images: runtime.images.map(({ width, height }) => ({ width, height })) }, null, 2));
}
