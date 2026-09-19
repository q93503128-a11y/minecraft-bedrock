import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,"..");
const dist=path.join(root,"dist");
const pre=spawnSync(process.execPath,[path.join(here,"preflight.mjs")],{stdio:"inherit"});
if(pre.status!==0)process.exit(pre.status??1);

const manifest=JSON.parse(fs.readFileSync(path.join(root,"BP","manifest.json"),"utf8"));
const version=manifest.header.version.join(".");
fs.rmSync(dist,{recursive:true,force:true});
fs.mkdirSync(dist,{recursive:true});

const crcTable=Array.from({length:256},(_,n)=>{
  let c=n;
  for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;
  return c>>>0;
});
function crc32(buf){
  let c=0xffffffff;
  for(const b of buf)c=crcTable[(c^b)&255]^(c>>>8);
  return (c^0xffffffff)>>>0;
}
function collect(dir,prefix=""){
  const out=[];
  for(const ent of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
    const p=path.join(dir,ent.name),name=(prefix?prefix+"/":"")+ent.name;
    if(ent.isDirectory())out.push(...collect(p,name));
    else out.push({name:name.replaceAll("\\","/"),data:fs.readFileSync(p)});
  }
  return out;
}
function u16(n){const b=Buffer.alloc(2);b.writeUInt16LE(n);return b;}
function u32(n){const b=Buffer.alloc(4);b.writeUInt32LE(n>>>0);return b;}
function zip(entries){
  const locals=[],centrals=[];let offset=0;
  for(const e of entries){
    const name=Buffer.from(e.name,"utf8"),raw=e.data,def=zlib.deflateRawSync(raw,{level:9});
    const useDeflate=def.length<raw.length,body=useDeflate?def:raw,method=useDeflate?8:0,crc=crc32(raw);
    const local=Buffer.concat([
      u32(0x04034b50),u16(20),u16(0x0800),u16(method),u16(0),u16(33),
      u32(crc),u32(body.length),u32(raw.length),u16(name.length),u16(0),name,body
    ]);
    locals.push(local);
    const central=Buffer.concat([
      u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(method),u16(0),u16(33),
      u32(crc),u32(body.length),u32(raw.length),u16(name.length),u16(0),u16(0),
      u16(0),u16(0),u32(0),u32(offset),name
    ]);
    centrals.push(central);offset+=local.length;
  }
  const centralBuf=Buffer.concat(centrals),localBuf=Buffer.concat(locals);
  const end=Buffer.concat([u32(0x06054b50),u16(0),u16(0),u16(entries.length),u16(entries.length),u32(centralBuf.length),u32(localBuf.length),u16(0)]);
  return Buffer.concat([localBuf,centralBuf,end]);
}
function names(buf){
  const out=[];let i=0;
  while(i<=buf.length-46){
    if(buf.readUInt32LE(i)!==0x02014b50){i++;continue;}
    const nl=buf.readUInt16LE(i+28),el=buf.readUInt16LE(i+30),cl=buf.readUInt16LE(i+32);
    out.push(buf.subarray(i+46,i+46+nl).toString("utf8"));
    i+=46+nl+el+cl;
  }
  return out;
}
function packEntries(dir){
  return collect(dir).filter(e=>!/(^|\/)(Thumbs\.db|\.DS_Store)$/i.test(e.name));
}

const bpEntries=packEntries(path.join(root,"BP"));
bpEntries.push({name:"THIRD_PARTY_NOTICES.md",data:fs.readFileSync(path.join(root,"THIRD_PARTY_NOTICES.md"))});
for(const e of collect(path.join(root,"THIRD_PARTY_LICENSES"),"THIRD_PARTY_LICENSES"))bpEntries.push(e);
const rpEntries=packEntries(path.join(root,"RP"));

const bpPack=zip(bpEntries),rpPack=zip(rpEntries);
if(!names(bpPack).includes("manifest.json")||!names(rpPack).includes("manifest.json"))throw new Error("mcpack manifest verification failed");

const bpName=\`LuckyBlock_BP_\${version}.mcpack\`,rpName=\`LuckyBlock_RP_\${version}.mcpack\`;
const addonName=\`LuckyBlock_\${version}_TEST.mcaddon\`;
fs.writeFileSync(path.join(dist,bpName),bpPack);
fs.writeFileSync(path.join(dist,rpName),rpPack);
const addon=zip([{name:bpName,data:bpPack},{name:rpName,data:rpPack}]);
const top=names(addon);
if(top.length!==2||!top.includes(bpName)||!top.includes(rpName))throw new Error("mcaddon top-level verification failed");
fs.writeFileSync(path.join(dist,addonName),addon);
const sha=crypto.createHash("sha256").update(addon).digest("hex");
fs.writeFileSync(path.join(dist,addonName+".sha256"),sha+"  "+addonName+"\n");
const info=[
  "Lucky Block Bedrock test build",
  \`Version: \${version}\`,
  \`BP files: \${bpEntries.length}\`,
  \`RP files: \${rpEntries.length}\`,
  \`MCADDON: \${addonName}\`,
  \`SHA-256: \${sha}\`,
  "Status: static preflight passed; real Bedrock import/play/multiplayer QA still required."
].join("\n")+"\n";
fs.writeFileSync(path.join(dist,"TEST_BUILD_INFO.txt"),info);
console.log(info);
console.log("Output:",dist);
