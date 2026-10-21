import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { assertFidelity, fidelityChecks, inspectGLB, root, runtimePath, sourcePath } from './test-espresso-fidelity.mjs';

// Keep the original export intact: simplification needs a separately validated bake.
const original = await inspectGLB(sourcePath);
await mkdir(dirname(runtimePath), { recursive: true });
await copyFile(sourcePath, runtimePath);
const [sourceAfterCopy, runtime, previousRuntime] = await Promise.all([
  inspectGLB(sourcePath),
  inspectGLB(runtimePath),
  inspectGLB(resolve(root, 'evidence/espresso-previous-22k.glb')),
]);
assertFidelity(original, sourceAfterCopy);
const checks = assertFidelity(original, runtime);
const audit = {
  source: { path: 'evidence/meshy-cafe-source.glb', ...original },
  runtime: { path: 'dist/assets/meshy-cafe/copperlight-espresso-faithful.glb', ...runtime },
  checks,
  previousRuntime: {
    path: 'evidence/espresso-previous-22k.glb',
    ...previousRuntime,
    checks: fidelityChecks(original, previousRuntime),
  },
  preparation: 'Byte-for-byte source copy; no decimation, image re-encoding, normal/tangent edits, material edits, or additional asset generation.',
};
await writeFile(resolve(root, 'evidence/espresso-fidelity-audit.json'), `${JSON.stringify(audit, null, 2)}\n`);
console.log(JSON.stringify({ path: runtimePath, bytes: runtime.bytes, sha256: runtime.sha256, triangleCount: runtime.triangleCount, vertexCount: runtime.vertexCount, checks }, null, 2));
