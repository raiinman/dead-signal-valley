import {readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),files=[];
async function walk(relative){
  const entries=await readdir(new URL(relative,root),{withFileTypes:true});
  for(const entry of entries.sort((a,b)=>a.name.localeCompare(b.name))){
    const path=relative+entry.name;
    if(entry.isDirectory())await walk(path+'/');
    else if(entry.isFile()){
      const bytes=await readFile(new URL(path,root));
      files.push({path,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
    }
  }
}
await walk('dist/');
await writeFile(new URL('docs/runtime-manifest.json',root),JSON.stringify({files},null,2)+'\n');
console.log(`Recorded ${files.length} runtime files.`);
