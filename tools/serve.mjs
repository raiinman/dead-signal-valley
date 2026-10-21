import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {resolve, sep, extname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../dist/',import.meta.url));
const port=Number(process.env.PORT||8771);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.json':'application/json','.glb':'model/gltf-binary',
  '.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2'};
createServer(async(req,res)=>{
  try{
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    let path=resolve(root,'.'+pathname);
    if(path!==resolve(root)&&!path.startsWith(resolve(root)+sep)){res.writeHead(403);res.end();return;}
    if((await stat(path)).isDirectory())path=resolve(path,'index.html');
    const info=await stat(path);
    if(!info.isFile())throw new Error('Not a file');
    res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream',
      'Content-Length':info.size,'Cache-Control':'no-cache'});
    if(req.method==='HEAD')res.end();else createReadStream(path).pipe(res);
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Dead Signal Valley: http://127.0.0.1:${port}/`));
