// Dump every handbook chapter (display order) as JSON. Usage: node tools/list_chapters.js <handbook root> <out.json>
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=process.argv[2];
const ls=pre=>fs.readdirSync(path.join(root,'src')).filter(f=>f.startsWith(pre)&&f.endsWith('.js')).sort().map(f=>'src/'+f);
const files=['src/core.js','src/labs-a.js','src/labs-b.js','src/labs-c.js',...ls('labs-m'),'src/ch-intro.js','src/ch-a.js','src/ch-b.js','src/ch-c.js','src/ch-d.js',...ls('sub-m'),...ls('stage-')];
const stubEl={addEventListener(){},querySelector(){return null},querySelectorAll(){return []}};
const ctx={console,document:stubEl,window:{},location:{hash:''},localStorage:{getItem:()=>null,setItem(){}},getComputedStyle:()=>({getPropertyValue:()=>''}),unescape,encodeURIComponent,performance:{now:()=>0},setTimeout,clearTimeout,setInterval,clearInterval,matchMedia:()=>({addEventListener(){}})};
vm.createContext(ctx);
let src='';const fileOf={};
for(const f of files){const t=fs.readFileSync(path.join(root,f),'utf8');for(const m of t.matchAll(/id:\s*'([^']+)'/g)) fileOf[m[1]]=fileOf[m[1]]||f; src+=t+'\n;\n';}
src+=';sortCh();globalThis.__out=H.ch.map(c=>({opt:OPTIONAL[c.id]||"",id:c.id,code:c.code,mod:c.mod,modNo:c.modNo,sub:c.sub,title:c.title,nav:c.nav,level:c.level,lab:c.labs}));';
vm.runInContext(src,ctx);
const out=ctx.__out.filter(c=>c.mod);out.forEach(c=>c.file=fileOf[c.id]);
fs.writeFileSync(process.argv[3],JSON.stringify(out,null,1));
