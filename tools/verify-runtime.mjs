import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const {files}=JSON.parse(await readFile(new URL('docs/runtime-manifest.json',root)));
for(const file of files){
  const bytes=await readFile(new URL(file.path,root));
  assert.equal(bytes.length,file.bytes,file.path);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256,file.path);
}
console.log(`PASS: ${files.length} runtime files match the publication manifest.`);
