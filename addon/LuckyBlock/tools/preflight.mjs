import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,"..");
const bpRoot=path.join(root,"BP");
const rpRoot=path.join(root,"RP");
const errors=[];
const warnings=[];

function walk(dir){
  const out=[];
  if(!fs.existsSync(dir))return out;
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,ent.name);
    if(ent.isDirectory())out.push(...walk(p));
    else out.push(p);
  }
  return out;
}
function rel(p){return path.relative(root,p).replaceAll("\\","/");}
function readJson(p){
  try{return JSON.parse(fs.readFileSync(p,"utf8"));}
  catch(e){errors.push(`JSON parse ${rel(p)}: ${e.message}`);return undefined;}
}
function existsAsset(base){
  return [".png",".tga",".ogg",".fsb"].some(ext=>fs.existsSync(path.join(rpRoot,base+ext)));
}
function assert(cond,msg){if(!cond)errors.push(msg);}
function sumBetween(s,a,b){
  const i=s.indexOf(a),j=s.indexOf(b,i+a.length);
  if(i<0||j<0)return NaN;
  return (s.slice(i,j).match(/weight:\s*(\d+)/g)||[]).reduce((n,x)=>n+Number(x.match(/\d+/)[0]),0);
}

const all=[...walk(bpRoot),...walk(rpRoot)];
const itemDefs=new Map();
for(const p of walk(path.join(bpRoot,"items")).filter(p=>p.endsWith(".json"))){
  const j=readJson(p),def=j?.["minecraft:item"];if(def?.description?.identifier)itemDefs.set(def.description.identifier,{p,j:def});
}
const blockDefs=new Map();
for(const p of walk(path.join(bpRoot,"blocks")).filter(p=>p.endsWith(".json"))){
  const j=readJson(p),def=j?.["minecraft:block"];if(def?.description?.identifier)blockDefs.set(def.description.identifier,{p,j:def});
}
const coreTiers=["common","rare","epic","legendary","mythic"];
const coreItemIds=coreTiers.flatMap(t=>[`lb:${t}_fragment`,`lb:${t}_lucky_block`]);
const placedLuckyIds=coreTiers.map(t=>`lb:${t}_lucky_block_placed`);
for(const id of coreItemIds)assert(itemDefs.has(id),`missing explicit core item ${id}`);
for(const id of placedLuckyIds)assert(blockDefs.has(id),`missing placed Lucky Block ${id}`);
for(const id of coreItemIds)assert(!blockDefs.has(id),`core item collides with block identifier ${id}`);
const itemAtlasPath=path.join(rpRoot,"textures","item_texture.json");
const itemAtlas=readJson(itemAtlasPath)?.texture_data??{};
for(const [id,{p,j}] of itemDefs){
  const placer=j.components?.["minecraft:block_placer"]?.block;
  if(placer)assert(blockDefs.has(placer),`${rel(p)} block_placer target missing: ${placer}`);
  const icon=j.components?.["minecraft:icon"]?.textures?.default;
  if(icon)assert(Boolean(itemAtlas[icon]),`${rel(p)} item icon key missing from item_texture.json: ${icon}`);
}

for(const p of all.filter(p=>p.endsWith(".json")))readJson(p);
for(const p of all.filter(p=>/\.(m?js)$/.test(p))){
  const r=spawnSync(process.execPath,["--check",p],{encoding:"utf8"});
  if(r.status!==0)errors.push(`JS syntax ${rel(p)}: ${(r.stderr||r.stdout||"syntax error").trim()}`);
}

const bp=readJson(path.join(bpRoot,"manifest.json"));
const rp=readJson(path.join(rpRoot,"manifest.json"));
if(bp&&rp){
  const bv=bp.header?.version?.join("."),rv=rp.header?.version?.join(".");
  assert(bv===rv,`manifest version mismatch BP=${bv} RP=${rv}`);
  for(const m of bp.modules??[])assert(m.version?.join(".")===bv,`BP module version mismatch: ${m.uuid}`);
  for(const m of rp.modules??[])assert(m.version?.join(".")===rv,`RP module version mismatch: ${m.uuid}`);
  const bpToRp=(bp.dependencies??[]).find(d=>d.uuid===rp.header?.uuid);
  const rpToBp=(rp.dependencies??[]).find(d=>d.uuid===bp.header?.uuid);
  assert(bpToRp?.version?.join(".")===rv,"BP->RP dependency version mismatch");
  assert(rpToBp?.version?.join(".")===bv,"RP->BP dependency version mismatch");
  const server=(bp.dependencies??[]).find(d=>d.module_name==="@minecraft/server");
  assert(server?.version==="2.9.0",`@minecraft/server expected 2.9.0, found ${server?.version}`);
  assert(rp.header?.pack_scope==="world",`RP pack_scope expected world, found ${rp.header?.pack_scope}`);
}

const registry=readJson(path.join(root,"vendor","ASSET_REGISTRY.json"));
if(registry){
  const ids=new Map(),owners=new Map();
  for(const [key,s] of Object.entries(registry.sources??{})){
    if(!s.url||!s.license||!s.reviewedCommit||!s.integrationMode)errors.push(`source ${key}: missing url/license/reviewedCommit/integrationMode`);
    if(s.licenseFile&&!fs.existsSync(path.join(root,s.licenseFile)))errors.push(`source ${key}: missing bundled license ${s.licenseFile}`);
  }
  for(const a of registry.assets??[]){
    if(!a.key||!a.source||!registry.sources?.[a.source]){errors.push(`asset ${a.key??"<unknown>"}: invalid source`);continue;}
    if(a.contentId){
      if(!a.contentId.startsWith("lb:"))errors.push(`non-lb contentId ${a.contentId}`);
      if(ids.has(a.contentId))errors.push(`duplicate contentId ${a.contentId}: ${ids.get(a.contentId)} / ${a.key}`);
      else ids.set(a.contentId,a.key);
    }
    for(const target of a.targets??[]){
      if(target.includes("*")||target.includes("{"))continue;
      if(owners.has(target))errors.push(`duplicate explicit target ${target}: ${owners.get(target)} / ${a.key}`);
      else owners.set(target,a.key);
      if(!fs.existsSync(path.join(root,target)))errors.push(`missing target ${a.key}: ${target}`);
    }
    if(registry.sources[a.source]?.integrationMode==="vendored"&&!(a.upstream?.length>0))errors.push(`vendored asset ${a.key}: no exact upstream path`);
  }
  console.log(`registry: ${Object.keys(registry.sources??{}).length} sources / ${registry.assets?.length??0} assets / ${ids.size} content IDs / ${owners.size} explicit targets`);
}

for(const p of walk(path.join(rpRoot,"textures"))){
  if(/(placeholder|dummy|temp|test)/i.test(path.basename(p)))errors.push(`placeholder-like production texture path: ${rel(p)}`);
}

for(const p of walk(path.join(bpRoot,"recipes")).filter(p=>p.endsWith(".json"))){
  const j=readJson(p),r=j?.["minecraft:recipe_shapeless"]??j?.["minecraft:recipe_shaped"];
  if(!r)continue;
  const refs=[];
  if(Array.isArray(r.ingredients))for(const x of r.ingredients)if(typeof x?.item==="string")refs.push(x.item);
  if(r.key)for(const x of Object.values(r.key))if(typeof x?.item==="string")refs.push(x.item);
  const results=Array.isArray(r.result)?r.result:[r.result];
  for(const x of results)if(typeof x?.item==="string")refs.push(x.item);
  for(const id of refs.filter(x=>x.startsWith("lb:")))assert(itemDefs.has(id)||blockDefs.has(id),`${rel(p)} unresolved lb item/block reference: ${id}`);
  if(/(lucky_block_from_fragments|fuse_.*_lucky_block)\.json$/.test(p)){
    assert(Array.isArray(r.unlock)&&r.unlock.some(x=>x?.context==="AlwaysUnlocked"),`${rel(p)} must be AlwaysUnlocked in recipe book`);
  }
}

const rewardPath=path.join(bpRoot,"scripts","reward_registry.js");
if(fs.existsSync(rewardPath)){
  const s=fs.readFileSync(rewardPath,"utf8");
  const sums={
    common:sumBetween(s,"common: [","  rare: ["),
    rare:sumBetween(s,"  rare: [","  epic: ["),
    epic:sumBetween(s,"  epic: [","\n  ]\n};"),
    legendary:sumBetween(s,"weightedPools.legendary = [","];\n\nweightedPools.mythic"),
    mythic:sumBetween(s,"weightedPools.mythic = [","]\n\nexport const tierFallbacks")
  };
  const exp={common:96,rare:100,epic:100,legendary:122,mythic:100};
  for(const [k,v] of Object.entries(exp))assert(sums[k]===v,`reward total ${k}: expected ${v}, got ${sums[k]}`);
  console.log("reward totals:",sums);
}

const mainPath=path.join(bpRoot,"scripts","main.js");
if(fs.existsSync(mainPath)){
  const s=fs.readFileSync(mainPath,"utf8");
  assert(!s.includes("\\\\nimport"),"main.js contains literal \\\\nimport");
  for(const m of s.matchAll(/^\s*import\s+(?:[^"']*from\s+)?["']([^"']+)["'];?/gm)){
    const spec=m[1];
    if(!spec.startsWith("."))continue;
    const p=path.resolve(path.dirname(mainPath),spec);
    assert(fs.existsSync(p),`main.js missing import target: ${spec}`);
  }
}

const geometryIds=new Set();
for(const p of walk(path.join(rpRoot,"models")).filter(p=>p.endsWith(".json"))){
  const j=readJson(p);if(!j)continue;
  for(const g of j["minecraft:geometry"]??[])if(g?.description?.identifier)geometryIds.add(g.description.identifier);
}
const animationIds=new Set();
for(const p of walk(path.join(rpRoot,"animations")).filter(p=>p.endsWith(".json"))){
  const j=readJson(p);if(!j)continue;
  for(const k of Object.keys(j.animations??{}))animationIds.add(k);
}
const vanillaTextureRefs=new Set(["textures/misc/enchanted_item_glint"]);
function checkClientDescription(p,j){
  const d=j?.["minecraft:client_entity"]?.description??j?.["minecraft:attachable"]?.description;
  if(!d)return;
  for(const g of Object.values(d.geometry??{}))if(typeof g==="string"&&g.startsWith("geometry.lb."))assert(geometryIds.has(g),`${rel(p)} missing geometry ${g}`);
  for(const a of Object.values(d.animations??{}))if(typeof a==="string"&&a.startsWith("animation.lb."))assert(animationIds.has(a),`${rel(p)} missing animation ${a}`);
  for(const t of Object.values(d.textures??{}))if(typeof t==="string"&&t.startsWith("textures/")&&!vanillaTextureRefs.has(t))assert(existsAsset(t),`${rel(p)} missing texture ${t}`);
}
for(const dir of ["entity","attachables"]){
  for(const p of walk(path.join(rpRoot,dir)).filter(p=>p.endsWith(".json"))){const j=readJson(p);if(j)checkClientDescription(p,j);}
}
for(const p of walk(path.join(bpRoot,"blocks")).filter(p=>p.endsWith(".json"))){
  const j=readJson(p),g=j?.["minecraft:block"]?.components?.["minecraft:geometry"];
  if(typeof g==="string"&&g.startsWith("geometry.lb."))assert(geometryIds.has(g),`${rel(p)} missing geometry ${g}`);
}

for(const atlasName of ["terrain_texture.json","item_texture.json"]){
  const p=path.join(rpRoot,"textures",atlasName);if(!fs.existsSync(p))continue;
  const j=readJson(p);
  for(const [key,val] of Object.entries(j?.texture_data??{})){
    const values=Array.isArray(val?.textures)?val.textures:[val?.textures];
    for(const t of values.flat().filter(x=>typeof x==="string"))assert(existsAsset(t),`${atlasName} ${key}: missing ${t}`);
  }
}
const soundPath=path.join(rpRoot,"sounds","sound_definitions.json");
if(fs.existsSync(soundPath)){
  const j=readJson(soundPath);
  for(const [id,def] of Object.entries(j?.sound_definitions??{})){
    for(const raw of def?.sounds??[]){
      const n=typeof raw==="string"?raw:raw?.name;
      if(typeof n==="string"&&n.startsWith("sounds/"))assert(fs.existsSync(path.join(rpRoot,n+".ogg"))||fs.existsSync(path.join(rpRoot,n+".fsb")),`sound ${id}: missing ${n}`);
    }
  }
}

function langMap(p){
  const m=new Map();if(!fs.existsSync(p))return m;
  for(const [i,line] of fs.readFileSync(p,"utf8").split(/\r?\n/).entries()){
    if(!line||line.startsWith("#")||!line.includes("="))continue;
    const k=line.slice(0,line.indexOf("="));
    if(m.has(k))errors.push(`duplicate lang key ${path.basename(p)}:${i+1} ${k}`);
    m.set(k,true);
  }
  return m;
}
const en=langMap(path.join(rpRoot,"texts","en_US.lang")),ko=langMap(path.join(rpRoot,"texts","ko_KR.lang"));
for(const k of en.keys())if(!ko.has(k))warnings.push(`ko_KR missing key present in en_US: ${k}`);
for(const k of ko.keys())if(!en.has(k))warnings.push(`en_US missing key present in ko_KR: ${k}`);

for(const required of ["THIRD_PARTY_NOTICES.md","THIRD_PARTY_LICENSES"])assert(fs.existsSync(path.join(root,required)),`missing legal bundle ${required}`);

if(warnings.length){
  console.log(`warnings: ${warnings.length}`);
  for(const w of warnings.slice(0,40))console.log("WARN",w);
  if(warnings.length>40)console.log(`... ${warnings.length-40} more warnings`);
}
if(errors.length){
  console.error(`Lucky Block preflight FAILED: ${errors.length} error(s)`);
  for(const e of errors)console.error("ERROR",e);
  process.exit(1);
}
console.log(`Lucky Block preflight OK — ${all.length} BP/RP files checked, ${geometryIds.size} geometry IDs, ${animationIds.size} animation IDs`);
