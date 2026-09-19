import * as mc from "@minecraft/server";

const DEATH_KEY="lb:last_deaths_v1";
function center(block){return{x:block.location.x+.5,y:block.location.y+.7,z:block.location.z+.5};}
function consume(event){try{event.block.setPermutation(mc.BlockPermutation.resolve("minecraft:air"));}catch{}}
function register(registry,id,handlers){registry.registerCustomComponent(id,handlers);}
function loadDeaths(){try{const raw=mc.world.getDynamicProperty(DEATH_KEY);const x=typeof raw==="string"?JSON.parse(raw):{};return x&&typeof x==="object"?x:{};}catch{return{};}}
function saveDeaths(x){
 try{
  const entries=Object.entries(x).sort((a,b)=>Number(b[1]?.stamp??0)-Number(a[1]?.stamp??0)).slice(0,48);
  mc.world.setDynamicProperty(DEATH_KEY,JSON.stringify(Object.fromEntries(entries)));
 }catch{}
}
function safeDeathSpot(d,rec){
 const bx=Math.floor(rec.x),bz=Math.floor(rec.z),sy=Math.floor(rec.y);
 for(let r=0;r<=3;r++)for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++){
  if(r>0&&Math.abs(dx)!==r&&Math.abs(dz)!==r)continue;
  for(let dy=3;dy>=-4;dy--){
   const y=sy+dy;
   try{
    const ground=d.getBlock({x:bx+dx,y:y-1,z:bz+dz});
    const a=d.getBlock({x:bx+dx,y,z:bz+dz});
    const b=d.getBlock({x:bx+dx,y:y+1,z:bz+dz});
    if(ground?.typeId!=="minecraft:air"&&a?.typeId==="minecraft:air"&&b?.typeId==="minecraft:air")
      return{x:bx+dx+.5,y,z:bz+dz+.5};
   }catch{}
  }
 }
}
function reflect(event){
 const p=event.player;
 const map=[
  ["slowness","speed",0,260],
  ["weakness","strength",0,220],
  ["poison","regeneration",0,180],
  ["wither","regeneration",1,140],
  ["blindness","night_vision",0,500],
  ["darkness","night_vision",0,500],
  ["mining_fatigue","haste",1,260],
  ["nausea","resistance",0,220]
 ];
 let changed=0;
 for(const [bad,good,amp,dur] of map){
  let had=false;try{had=p.removeEffect(bad);}catch{}
  if(!had)continue;
  changed++;
  try{p.addEffect(good,dur,{amplifier:amp,showParticles:true});}catch{}
 }
 if(!changed){try{p.sendMessage("§b[포춘 거울] 반전할 부정 효과가 없습니다.");}catch{};return;}
 try{event.dimension.playSound("random.orb",center(event.block),{volume:.75,pitch:1.35});}catch{}
 for(let i=0;i<10;i++)try{event.dimension.spawnParticle("lb:slasher_spark_particle",{x:event.block.location.x+.5+(Math.random()-.5)*1.3,y:event.block.location.y+.3+Math.random()*1.7,z:event.block.location.z+.5+(Math.random()-.5)*1.3});}catch{}
 try{p.sendMessage("§d[포춘 거울] 부정 효과 "+changed+"개를 반전했습니다.");}catch{}
 consume(event);
}
function recall(event){
 const deaths=loadDeaths(),rec=deaths[event.player.id];
 if(!rec){try{event.player.sendMessage("§7[귀환 묘비] 기록된 사망 위치가 없습니다.");}catch{};return;}
 let d;try{d=mc.world.getDimension(String(rec.dimension).replace("minecraft:",""));}catch{return;}
 const pos=safeDeathSpot(d,rec);
 if(!pos){try{event.player.sendMessage("§c[귀환 묘비] 마지막 사망 지점 주변에서 안전한 귀환 위치를 찾지 못했습니다.");}catch{};return;}
 try{
  event.player.teleport(pos,{dimension:d});
  d.playSound("mob.endermen.portal",pos,{volume:.8,pitch:.9});
  event.player.sendMessage("§7[귀환 묘비] 마지막 사망 지점으로 돌아왔습니다.");
  delete deaths[event.player.id];saveDeaths(deaths);consume(event);
 }catch{}
}
function cool(event){
 const c=center(event.block);let fire=0,ext=0;
 for(let dx=-5;dx<=5;dx++)for(let dy=-3;dy<=4;dy++)for(let dz=-5;dz<=5;dz++){
  if(dx*dx+dy*dy+dz*dz>36)continue;
  try{
   const b=event.dimension.getBlock({x:event.block.location.x+dx,y:event.block.location.y+dy,z:event.block.location.z+dz});
   if(b&&(b.typeId==="minecraft:fire"||b.typeId==="minecraft:soul_fire")){b.setPermutation(mc.BlockPermutation.resolve("minecraft:air"));fire++;}
  }catch{}
 }
 for(const e of event.dimension.getEntities({location:c,maxDistance:8})){
  try{if(e.extinguishFire(true))ext++;}catch{}
  if(e instanceof mc.Player)try{e.addEffect("fire_resistance",600,{amplifier:0,showParticles:true});}catch{}
 }
 try{event.dimension.playSound("random.fizz",c,{volume:1,pitch:.85});}catch{}
 for(let i=0;i<12;i++)try{event.dimension.spawnParticle("minecraft:basic_smoke_particle",{x:c.x+(Math.random()-.5)*3,y:c.y+Math.random()*1.2,z:c.z+(Math.random()-.5)*3});}catch{}
 try{event.player.sendMessage("§b[럭키 에어컨] 화염 "+fire+"칸 제거 / 불붙은 개체 "+ext+"개 소화.");}catch{}
 consume(event);
}
mc.world.afterEvents.entityDie.subscribe(event=>{
 const p=event.deadEntity;if(!(p instanceof mc.Player))return;
 const deaths=loadDeaths(),q=p.location;
 deaths[p.id]={dimension:p.dimension.id,x:q.x,y:q.y,z:q.z,stamp:Date.now()};
 saveDeaths(deaths);
});
export function registerLoysOdditiesIntegration(registry){
 register(registry,"lb:fortune_mirror",{onPlayerInteract:reflect});
 register(registry,"lb:recall_gravestone",{onPlayerInteract:recall});
 register(registry,"lb:air_conditioner",{onPlayerInteract:cool});
}
