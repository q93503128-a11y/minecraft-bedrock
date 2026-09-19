import * as mc from "@minecraft/server";

const TYPE="lb:void_blossom";
const STEP=5;
let clock=0;

function distSq(a,b){const dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z;return dx*dx+dy*dy+dz*dz;}
function horizontalDistance(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}
function playersNear(entity,r=42){const rr=r*r;return mc.world.getAllPlayers().filter(p=>p.dimension.id===entity.dimension.id&&distSq(p.location,entity.location)<=rr);}
function nearestPlayer(entity,r=42){
 let best,bestSq=r*r;
 for(const p of mc.world.getAllPlayers()){
  if(p.dimension.id!==entity.dimension.id)continue;
  const d=distSq(p.location,entity.location);if(d<bestSq){best=p;bestSq=d;}
 }
 return best?{player:best,distanceSq:bestSq}:undefined;
}
function msg(entity,text){for(const p of playersNear(entity,50)){try{p.sendMessage(text);}catch{}}}
function anim(entity,name){try{entity.playAnimation("animation.lb.void_blossom."+name,{blendOutTime:0.12});}catch{}}
function sound(entity,id,volume=1,pitch=1){try{entity.dimension.playSound(id,entity.location,{volume,pitch});}catch{}}
function particle(dimension,id,pos){try{dimension.spawnParticle(id,pos);}catch{}}
function ring(dimension,center,radius,id,count=14){
 for(let i=0;i<count;i++){const a=Math.PI*2*i/count;particle(dimension,id,{x:center.x+Math.cos(a)*radius,y:center.y+.12,z:center.z+Math.sin(a)*radius});}
}
function damage(source,player,amount){
 try{return player.applyDamage(Math.round(amount),{cause:mc.EntityDamageCause.magic,damagingEntity:source});}
 catch{try{return player.applyDamage(Math.round(amount));}catch{return false;}}
}
function phaseOf(entity){
 const hp=entity.getComponent("minecraft:health");if(!hp)return 1;
 const r=hp.currentValue/Math.max(1,hp.effectiveMax);
 return r<=.25?4:r<=.50?3:r<=.75?2:1;
}
function rootPositions(entity){
 const raw=entity.getDynamicProperty("lb:void_blossom_roots");
 if(typeof raw!=="string"||!raw)return[];
 try{const p=JSON.parse(raw);return Array.isArray(p)?p:[];}catch{return[];}
}
function clearRoots(entity){
 for(const p of rootPositions(entity)){
  try{
   const b=entity.dimension.getBlock(p);
   if(b?.typeId==="minecraft:flowering_azalea")b.setPermutation(mc.BlockPermutation.resolve("minecraft:air"));
  }catch{}
 }
 try{entity.setDynamicProperty("lb:void_blossom_roots","[]");}catch{}
}
function liveRoots(entity){
 return rootPositions(entity).filter(p=>{try{return entity.dimension.getBlock(p)?.typeId==="minecraft:flowering_azalea";}catch{return false;}});
}
function expose(entity,ticks=50){
 if(!entity.isValid)return;
 clearRoots(entity);
 try{entity.triggerEvent("lb:expose");}catch{}
 entity.setDynamicProperty("lb:void_blossom_root_active",false);
 entity.setDynamicProperty("lb:void_blossom_exposed_until",clock+ticks);
 sound(entity,"lb.void_blossom.spore_impact",.75,1.18);
 msg(entity,"§d[Void Blossom] 뿌리 꽃이 모두 정화되었습니다 — 잠시 취약합니다!");
}
function startRootPhase(entity,stage){
 clearRoots(entity);
 const offsets=[[7,0],[-7,0],[0,7],[0,-7]];
 const placed=[];
 const y=Math.floor(entity.location.y);
 for(const [dx,dz] of offsets){
  const p={x:Math.floor(entity.location.x+dx),y,z:Math.floor(entity.location.z+dz)};
  try{
   const b=entity.dimension.getBlock(p),below=entity.dimension.getBlock({x:p.x,y:p.y-1,z:p.z});
   if(!b||!below||b.typeId!=="minecraft:air"||below.typeId==="minecraft:air")continue;
   b.setPermutation(mc.BlockPermutation.resolve("minecraft:flowering_azalea"));placed.push(p);
   particle(entity.dimension,"lb:obsidilith_burst",{x:p.x+.5,y:p.y+.4,z:p.z+.5});
  }catch{}
 }
 entity.setDynamicProperty("lb:void_blossom_roots",JSON.stringify(placed));
 entity.setDynamicProperty("lb:void_blossom_root_stage",stage);
 entity.setDynamicProperty("lb:void_blossom_root_active",true);
 try{entity.triggerEvent("lb:root_guard");}catch{}
 anim(entity,"blossom");
 sound(entity,"lb.void_blossom.petal_blade",.9,.78);
 msg(entity,"§5[Void Blossom] 생명 뿌리 "+placed.length+"개가 피어났습니다 — 먼저 꽃을 부수세요!");
 if(!placed.length)mc.system.runTimeout(()=>{if(entity.isValid)expose(entity,45);},10);
}
function updateRoots(entity){
 const hp=entity.getComponent("minecraft:health");if(!hp)return;
 const ratio=hp.currentValue/Math.max(1,hp.effectiveMax);
 const stage=Number(entity.getDynamicProperty("lb:void_blossom_root_stage")??0);
 const active=entity.getDynamicProperty("lb:void_blossom_root_active")===true;
 if(active){
  const left=liveRoots(entity);
  entity.setDynamicProperty("lb:void_blossom_roots",JSON.stringify(left));
  if(!left.length){expose(entity,50);return;}
  if(clock%20===0){
   try{hp.setCurrentValue(Math.min(hp.effectiveMax,hp.currentValue+2));}catch{}
   msg(entity,"§5[Void Blossom] 남은 생명 뿌리: "+left.length);
  }
  return;
 }
 const exposedUntil=Number(entity.getDynamicProperty("lb:void_blossom_exposed_until")??0);
 if(exposedUntil>0){
  if(clock<exposedUntil)return;
  try{entity.triggerEvent("lb:normal");}catch{}
  entity.setDynamicProperty("lb:void_blossom_exposed_until",0);
 }
 if(stage===0&&ratio<=.75){startRootPhase(entity,1);return;}
 if(stage===1&&ratio<=.50){startRootPhase(entity,2);return;}
 if(stage===2&&ratio<=.25){startRootPhase(entity,3);}
}
function telegraphPoint(entity,point,r=2.6){
 ring(entity.dimension,point,r,"lb:obsidilith_indicator",14);
 try{entity.dimension.playSound("lb.obsidilith.spike_indicator",point,{volume:.65,pitch:1.08});}catch{}
}
function spikeBurst(entity,target,phase){
 entity.setDynamicProperty("lb:void_blossom_busy_until",clock+115);
 anim(entity,"spike");sound(entity,"lb.void_blossom.burrow",1.0,.92);
 msg(entity,"§5[Void Blossom] 추적 가시 3연격 — 표시된 원에서 벗어나세요!");
 for(let i=0;i<3;i++){
  mc.system.runTimeout(()=>{
   if(!entity.isValid||!target.isValid)return;
   const point={x:target.location.x,y:target.location.y,z:target.location.z};
   telegraphPoint(entity,point,2.7);
   mc.system.runTimeout(()=>{
    if(!entity.isValid)return;
    sound(entity,"lb.void_blossom.spike",.8,1.0+i*.04);
    particle(entity.dimension,"lb:obsidilith_burst",{x:point.x,y:point.y+.3,z:point.z});
    for(const p of playersNear(entity,48))if(horizontalDistance(p.location,point)<=2.75&&Math.abs(p.location.y-point.y)<=3)damage(entity,p,8+phase*1.5);
   },18);
  },20+i*30);
 }
}
function spikeWave(entity,phase){
 entity.setDynamicProperty("lb:void_blossom_busy_until",clock+105);
 anim(entity,"spike_wave");
 msg(entity,"§5[Void Blossom] 확산 가시 — 안쪽부터 세 개의 고리가 퍼집니다!");
 const waves=[[4.5,12],[8.0,34],[11.5,56]];
 for(const [radius,delay] of waves){
  mc.system.runTimeout(()=>{
   if(!entity.isValid)return;
   ring(entity.dimension,entity.location,radius,"lb:obsidilith_indicator",Math.max(16,Math.round(radius*4)));
   try{entity.dimension.playSound("lb.obsidilith.wave_indicator",entity.location,{volume:.7,pitch:.9+radius*.015});}catch{}
   mc.system.runTimeout(()=>{
    if(!entity.isValid)return;
    sound(entity,"lb.void_blossom.spike",.75,.92+radius*.01);
    for(const p of playersNear(entity,18)){
     const d=horizontalDistance(p.location,entity.location);
     if(Math.abs(d-radius)<=1.45)damage(entity,p,9+phase*1.5);
    }
   },18);
  },delay);
 }
}
function sporeCloud(entity,target,phase){
 entity.setDynamicProperty("lb:void_blossom_busy_until",clock+80);
 anim(entity,"spore");sound(entity,"lb.void_blossom.spore_prepare",1.0,.92);
 msg(entity,"§2[Void Blossom] 포자낭 준비 — 보라빛 표식에서 벗어나세요!");
 mc.system.runTimeout(()=>{
  if(!entity.isValid||!target.isValid)return;
  const point={x:target.location.x,y:target.location.y,z:target.location.z};
  ring(entity.dimension,point,3.4,"lb:obsidilith_indicator",16);
  mc.system.runTimeout(()=>{
   if(!entity.isValid)return;
   try{entity.dimension.playSound("lb.void_blossom.spore_impact",point,{volume:.85,pitch:1});}catch{}
   for(let i=0;i<8;i++){const a=Math.PI*2*i/8;particle(entity.dimension,"lb:tomemancy_flame_summoning",{x:point.x+Math.cos(a)*2.4,y:point.y+.2,z:point.z+Math.sin(a)*2.4});}
   for(const p of playersNear(entity,48)){
    if(horizontalDistance(p.location,point)>3.5||Math.abs(p.location.y-point.y)>3)continue;
    damage(entity,p,4+phase);
    try{p.addEffect("minecraft:poison",60+phase*10,{amplifier:0,showParticles:true});}catch{}
    try{p.addEffect("minecraft:slowness",50,{amplifier:0,showParticles:false});}catch{}
   }
  },20);
 },24);
}
function pointLineDistance(p,a,b){
 const vx=b.x-a.x,vz=b.z-a.z,wx=p.x-a.x,wz=p.z-a.z;
 const vv=vx*vx+vz*vz;if(vv<=.0001)return Math.hypot(wx,wz);
 const t=Math.max(0,Math.min(1,(wx*vx+wz*vz)/vv)),cx=a.x+vx*t,cz=a.z+vz*t;
 return Math.hypot(p.x-cx,p.z-cz);
}
function telegraphLine(dimension,a,b){
 for(let i=0;i<=14;i++){const t=i/14;particle(dimension,"lb:slasher_spark_particle",{x:a.x+(b.x-a.x)*t,y:a.y+.25,z:a.z+(b.z-a.z)*t});}
}
function bladeLanes(entity,target,phase){
 entity.setDynamicProperty("lb:void_blossom_busy_until",clock+95);
 anim(entity,"leaf_blade");sound(entity,"lb.void_blossom.petal_blade",1.0,1);
 msg(entity,"§d[Void Blossom] 꽃잎 칼날 3회 — 빛나는 선에서 옆으로 피하세요!");
 for(let i=0;i<3;i++){
  mc.system.runTimeout(()=>{
   if(!entity.isValid||!target.isValid)return;
   const c={x:target.location.x,y:target.location.y,z:target.location.z};
   const base=Math.atan2(target.location.z-entity.location.z,target.location.x-entity.location.x);
   const angle=base+Math.PI/2+(i-1)*0.48;
   const dx=Math.cos(angle)*8,dz=Math.sin(angle)*8;
   const a={x:c.x-dx,y:c.y,z:c.z-dz},b={x:c.x+dx,y:c.y,z:c.z+dz};
   telegraphLine(entity.dimension,a,b);
   mc.system.runTimeout(()=>{
    if(!entity.isValid)return;
    sound(entity,"lb.void_blossom.petal_blade",.7,.9+i*.08);
    for(const p of playersNear(entity,48)){
     if(pointLineDistance(p.location,a,b)<=1.25&&Math.abs(p.location.y-c.y)<=3)damage(entity,p,7+phase*1.5);
    }
   },12);
  },18+i*24);
 }
}
function tickBlossom(entity){
 updateRoots(entity);
 const busy=Number(entity.getDynamicProperty("lb:void_blossom_busy_until")??0);if(clock<busy)return;
 const next=Number(entity.getDynamicProperty("lb:void_blossom_next_action")??0);if(clock<next)return;
 const target=nearestPlayer(entity,38);if(!target)return;
 const phase=phaseOf(entity),roll=Math.random();
 entity.setDynamicProperty("lb:void_blossom_next_action",clock+(phase>=3?58:phase===2?70:82)+Math.floor(Math.random()*24));
 if(roll<.28){spikeBurst(entity,target.player,phase);return;}
 if(roll<.52){spikeWave(entity,phase);return;}
 if(roll<.76){sporeCloud(entity,target.player,phase);return;}
 bladeLanes(entity,target.player,phase);
}

mc.world.afterEvents.entityDie.subscribe(event=>{
 const entity=event.deadEntity;if(entity?.typeId!==TYPE)return;
 try{clearRoots(entity);}catch{}
});
mc.system.runInterval(()=>{
 clock=mc.world.getAbsoluteTime();
 for(const id of ["overworld","nether","the_end"]){
  let dimension;try{dimension=mc.world.getDimension(id);}catch{continue;}
  for(const entity of dimension.getEntities({type:TYPE})){try{tickBlossom(entity);}catch{}}
 }
},STEP);
