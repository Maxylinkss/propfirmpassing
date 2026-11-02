const http=require('http'), fs=require('fs'), path=require('path');
const root=path.join(__dirname,'docs');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.xml':'application/xml','.txt':'text/plain'};
http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split('?')[0]);
  if(p==='/')p='/index.html';
  let f=path.join(root,p);
  // /vps/ is a directory with an index.html; resolve it the way Netlify does.
  if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
  if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404,{'content-type':'text/html'});return res.end(fs.readFileSync(path.join(root,'404.html')));}
  res.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});
  res.end(fs.readFileSync(f));
}).listen(8099,()=>console.log('tracker preview on http://localhost:8099'));
