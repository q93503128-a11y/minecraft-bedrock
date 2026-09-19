import * as mc from "@minecraft/server";

const STEP=5;
let clock=0;
const GAUNTLET="lb:gauntlet";
const ANCHOR="lb:gauntlet_blackstone";

function distSq(a,b){const dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z;return dx*dx+dy*dy+dz*dz;}
function playersNear(entity,r=48){const rr=r*r;return mc.world.getAllPlayers().filter(p=>p.dimension.id===entity.dimension.id&&distSq(p.location,entity.location)<=rr);}
function nearestPlayer(entity,r=48){
 let best,bestSq=r*r;
 for(const p of mc.world.getAllPlayers()){
  if(p.dimension.id!==entity.dimension.id)continue;
  const d=distSq(p.location,entity.location);if(d<bestSq){best=p;bestSq=d;}
 }
 return best?{player:best,distanceSq:bestSq}:undefined;
}
function msg(entity,text){for(const p of playersNear(entity,56)){try{p.sendMessage(text);}catch{}}}
function anim(entity,id){try{entity.playAnimation("animation.lb.gauntlet."+id,{blendOutTime:0.12});}catch{}}
function sound(entity,id,volume=1,pitch=1){try{entity.dimension.playSound(id,entity.location,{volume,pitch});}catch{}}
function particle(dimension,id,pos){try{dimension.spawnParticle(id,pos);}catch{}}
function ring(dimension,center,radius,id,count=14){
 for(let i=0;i<count;i++){const a=Math.PI*2*i/count;particle(dimension,id,{x:center.x+Math.cos(a)*radius,y:center.y+.15,z:center.z+Math.sin(a)*radius});}
}
function damagePlayer(source,player,amount){
 try{return player.applyDamage(Math.round(amount),{cause:mc.EntityDamageCause.entityAttack,damagingEntity:source});}
 catch{try{return player.applyDamage(Math.round(amount));}catch{return false;}}
}
function groundAt(dimension,x,startY,z){
 const bx=Math.floor(x),bz=Math.floor(z),top=Math.min(250,Math.floor(startY)+8),bottom=Math.max(-60,Math.floor(startY)-20);
 for(let y=top;y>=bottom;y--){
  try{
   const b=dimension.getBlock({x:bx,y,z:bz}),a=dimension.getBlock({x:bx,y:y+1,z:bz});
   if(b&&a&&b.typeId!=="minecraft:air"&&a.typeId==="minecraft:air")return{x:bx,y:y+1,z:bz};
  }catch{}
 }
}
function anchorList(g){
 const raw=g.getDynamicProperty("lb:gauntlet_anchors");
 if(typeof raw!=="string"||!raw)return[];
 try{const x=JSON.parse(raw);return Array.isArray(x)?x:[];}catch{return[];}
}
function clearAnchors(g){
 for(const p of anchorList(g)){try{const b=g.dimension.getBlock(p);if(b?.typeId===ANCHOR)b.setPermutation(mc.BlockPermutation.resolve("minecraft:air"));}catch{}}
 try{g.setDynamicProperty("lb:gauntlet_anchors","[]");}catch{}
}
function liveAnchors(g){
 return anchorList(g).filter(p=>{try{return g.dimension.getBlock(p)?.typeId===ANCHOR;}catch{return false;}});
}
function expose(g,ticks=50,label=true){
 if(!g?.isValid)return;
 try{g.triggerEvent("lb:expose");}catch{}
 g.setDynamicProperty("lb:gauntlet_shield_active",false);
 g.setDynamicProperty("lb:gauntlet_exposed_until",clock+ticks);
 if(label)msg(g,"§e[Gauntlet] 방어 회로 붕괴 — 잠시 받는 피해가 증가합니다!");
 sound(g,"lb.gauntlet.energy_shield",1.0,1.25);
}
function startShield(g,stage){
 clearAnchors(g);
 const offsets=stage===1?[[5,0],[-2.5,4.5],[-2.5,-4.5]]:[[6,0],[-3,5.2],[-3,-5.2]];
 const placed=[];
 for(const [dx,dz] of offsets){
  const p=groundAt(g.dimension,g.location.x+dx,g.location.y,g.location.z+dz);if(!p)continue;
  try{
   const b=g.dimension.getBlock(p);if(!b||b.typeId!=="minecraft:air")continue;
   b.setPermutation(mc.BlockPermutation.resolve(ANCHOR));placed.push(p);
   particle(g.dimension,"lb:obsidilith_indicator",{x:p.x+.5,y:p.y+1,z:p.z+.5});
  }catch{}
 }
 g.setDynamicProperty("lb:gauntlet_anchors",JSON.stringify(placed));
 g.setDynamicProperty("lb:gauntlet_shield_active",true);
 g.setDynamicProperty("lb:gauntlet_shield_stage",stage);
 try{g.triggerEvent("lb:shield_on");}catch{}
 anim(g,"cast");sound(g,"lb.gauntlet.energy_shield",1.2,stage===2?.82:.95);
 msg(g,"§c[Gauntlet] 에너지 실드 "+stage+"단계 — 주변 Gauntlet Blackstone "+placed.length+"개를 파괴하세요!");
 if(!placed.length)mc.system.runTimeout(()=>{if(g.isValid)expose(g,45);},20);
}
function updateShield(g){
 const active=g.getDynamicProperty("lb:gauntlet_shield_active")===true;
 const hp=g.getComponent("minecraft:health");if(!hp)return;
 const ratio=hp.currentValue/Math.max(1,hp.effectiveMax);
 const stage=Number(g.getDynamicProperty("lb:gauntlet_shield_stage")??0);
 if(active){
  const left=liveAnchors(g);g.setDynamicProperty("lb:gauntlet_anchors",JSON.stringify(left));
  if(!left.length){clearAnchors(g);expose(g,55);}
  else if(clock%40===0)msg(g,"§c[Gauntlet] 남은 실드 앵커: "+left.length);
  return;
 }
 if(stage===0&&ratio<=.65){startShield(g,1);return;}
 if(stage===1&&ratio<=.30){startShield(g,2);}
}
function finishExposure(g){
 const until=Number(g.getDynamicProperty("lb:gauntlet_exposed_until")??0);
 if(until>0&&clock>=until){
  try{g.triggerEvent("lb:shield_off");}catch{}
  g.setDynamicProperty("lb:gauntlet_exposed_until",0);
 }
}
function tracer(g,from,to){
 const dx=to.x-from.x,dy=to.y-from.y,dz=to.z-from.z;
 for(let i=1;i<=12;i++){const t=i/12;particle(g.dimension,"lb:slasher_spark_particle",{x:from.x+dx*t,y:from.y+dy*t,z:from.z+dz*t});}
}
function fireLaser(g,point,phase){
 if(!g.isValid)return;
 const origin={x:g.location.x,y:g.location.y+2.7,z:g.location.z};
 const dir0={x:point.x-origin.x,y:point.y-origin.y,z:point.z-origin.z};
 const mag=Math.max(.001,Math.hypot(dir0.x,dir0.y,dir0.z)),dir={x:dir0.x/mag,y:dir0.y/mag,z:dir0.z/mag};
 let range=30;
 try{
  const hit=g.dimension.getBlockFromRay(origin,dir,{maxDistance:30,includeLiquidBlocks:false,includePassableBlocks:false});
  if(hit){const p={x:hit.block.location.x+hit.faceLocation.x,y:hit.block.location.y+hit.faceLocation.y,z:hit.block.location.z+hit.faceLocation.z};range=Math.min(range,Math.sqrt(distSq(origin,p)));}
 }catch{}
 const end={x:origin.x+dir.x*range,y:origin.y+dir.y*range,z:origin.z+dir.z*range};tracer(g,origin,end);
 let hits=[];try{hits=g.dimension.getEntitiesFromRay(origin,dir,{maxDistance:range});}catch{}
 const seen=new Set();
 for(const h of hits){
  const p=h.entity;if(!(p instanceof mc.Player)||seen.has(p.id)||p.dimension.id!==g.dimension.id)continue;
  seen.add(p.id);damagePlayer(g,p,12+phase*3);
  try{p.applyImpulse({x:dir.x*.22,y:.08,z:dir.z*.22});}catch{}
 }
}
function beginLaser(g,target,phase){
 g.setDynamicProperty("lb:gauntlet_busy_until",clock+82);
 anim(g,"laser_eye_start");sound(g,"lb.gauntlet.laser_charge",1.25,.92);
 msg(g,"§c[Gauntlet] 레이저 충전 — 붉은 조준선은 8틱 늦게 따라옵니다!");
 mc.system.runTimeout(()=>{if(g.isValid)anim(g,"laser_eye_loop");},25);
 for(let i=0;i<6;i++){
  const captureDelay=25+i*8;
  mc.system.runTimeout(()=>{
   if(!g.isValid||!target.isValid)return;
   const locked={x:target.location.x,y:target.location.y+.9,z:target.location.z};
   mc.system.runTimeout(()=>{if(g.isValid)fireLaser(g,locked,phase);},8);
  },captureDelay);
 }
 mc.system.runTimeout(()=>{if(g.isValid){anim(g,"laser_eye_stop");expose(g,28,false);}},76);
}
function beginPunch(g,target,phase){
 g.setDynamicProperty("lb:gauntlet_busy_until",clock+48);
 const locked={x:target.location.x,y:target.location.y+.4,z:target.location.z};
 anim(g,"punch_start");msg(g,"§6[Gauntlet] 돌진 펀치 — 옆으로 크게 피하면 빈틈이 생깁니다!");
 mc.system.runTimeout(()=>{
  if(!g.isValid)return;anim(g,"punch_loop");
  const dx=locked.x-g.location.x,dy=locked.y-g.location.y,dz=locked.z-g.location.z,mag=Math.max(.001,Math.hypot(dx,dy,dz));
  try{g.clearVelocity();g.applyImpulse({x:dx/mag*(1.25+phase*.14),y:Math.max(-.15,Math.min(.42,dy/mag*.5+.18)),z:dz/mag*(1.25+phase*.14)});}catch{}
 },16);
 mc.system.runTimeout(()=>{
  if(!g.isValid)return;
  let hit=false;
  for(const p of playersNear(g,4.1)){
   hit=true;damagePlayer(g,p,28+phase*8);
   const dx=p.location.x-g.location.x,dz=p.location.z-g.location.z,mag=Math.max(.001,Math.hypot(dx,dz));
   try{p.applyImpulse({x:dx/mag*.85,y:.28,z:dz/mag*.85});}catch{}
  }
  ring(g.dimension,g.location,3.4,"lb:obsidilith_burst",10);
  if(!hit)expose(g,42);
 },28);
 mc.system.runTimeout(()=>{if(g.isValid){try{g.clearVelocity();}catch{}anim(g,"punch_stop");}},40);
}
function beginSwirl(g,phase){
 g.setDynamicProperty("lb:gauntlet_busy_until",clock+72);
 anim(g,"swirl_punch");sound(g,"lb.gauntlet.spin_punch",1.2,.88);
 msg(g,"§6[Gauntlet] 회전 펀치 — 세 번 퍼지는 충격파 사이를 벗어나세요!");
 for(const delay of [18,34,50])mc.system.runTimeout(()=>{
  if(!g.isValid)return;ring(g.dimension,g.location,5.5,"lb:obsidilith_indicator",18);
  for(const p of playersNear(g,5.7)){
   damagePlayer(g,p,14+phase*3);
   const dx=p.location.x-g.location.x,dz=p.location.z-g.location.z,mag=Math.max(.001,Math.hypot(dx,dz));
   try{p.applyImpulse({x:dx/mag*.72,y:.22,z:dz/mag*.72});}catch{}
  }
 },delay);
}
function beginBlind(g,phase){
 g.setDynamicProperty("lb:gauntlet_busy_until",clock+50);
 anim(g,"cast");sound(g,"lb.gauntlet.cast",1.1,phase===3?.86:1);
 msg(g,"§5[Gauntlet] 시야 교란 주문 — 거리를 벌리거나 Threat Sunglasses로 상쇄할 수 있습니다!");
 for(const p of playersNear(g,18))ring(g.dimension,p.location,1.3,"lb:obsidilith_indicator",6);
 mc.system.runTimeout(()=>{
  if(!g.isValid)return;
  for(const p of playersNear(g,18)){
   try{p.addEffect("minecraft:blindness",80+phase*20,{amplifier:0,showParticles:false});}catch{}
  }
 },20);
}
function phaseOf(g){
 const h=g.getComponent("minecraft:health");if(!h)return 1;
 const r=h.currentValue/Math.max(1,h.effectiveMax);return r<=.30?3:r<=.65?2:1;
}
function tickGauntlet(g){
 try{g.removeEffect("minecraft:poison");}catch{}
 try{g.removeEffect("minecraft:wither");}catch{}
 finishExposure(g);updateShield(g);
 const busy=Number(g.getDynamicProperty("lb:gauntlet_busy_until")??0);if(clock<busy)return;
 const next=Number(g.getDynamicProperty("lb:gauntlet_next_action")??0);if(clock<next)return;
 const target=nearestPlayer(g,42);if(!target)return;
 const phase=phaseOf(g),d=Math.sqrt(target.distanceSq);
 const roll=Math.random();
 g.setDynamicProperty("lb:gauntlet_next_action",clock+(phase===3?58:phase===2?70:82)+Math.floor(Math.random()*24));
 if(phase>=2&&roll<.22){beginSwirl(g,phase);return;}
 if(roll<.44&&d<=22){beginPunch(g,target.player,phase);return;}
 if(roll<.76&&d>=7){beginLaser(g,target.player,phase);return;}
 beginBlind(g,phase);
}
function deathRewards(g){
 clearAnchors(g);
 try{sound(g,"lb.gauntlet.death",1.4,.9);}catch{}
 const pos={x:g.location.x,y:g.location.y+1,z:g.location.z};
 try{g.dimension.spawnItem(new mc.ItemStack("lb:mythic_fragment",8+Math.floor(Math.random()*5)),pos);}catch{}
 try{g.dimension.spawnItem(new mc.ItemStack("lb:legendary_fragment",4+Math.floor(Math.random()*4)),pos);}catch{}
 try{g.dimension.spawnItem(new mc.ItemStack("lb:fortune_tonic",4),pos);}catch{}
 try{g.dimension.spawnItem(new mc.ItemStack("lb:legendary_lucky_block",1),pos);}catch{}
}
mc.world.afterEvents.entityDie.subscribe(event=>{
 const g=event.deadEntity;if(g?.typeId!==GAUNTLET)return;
 try{deathRewards(g);}catch{}
});
mc.world.afterEvents.entityHurt.subscribe(event=>{
 const g=event.hurtEntity;if(g?.typeId!==GAUNTLET)return;
 const ready=Number(g.getDynamicProperty("lb:gauntlet_hurt_sound")??0);if(clock<ready)return;
 g.setDynamicProperty("lb:gauntlet_hurt_sound",clock+24);sound(g,"lb.gauntlet.hurt",.7,.96+Math.random()*.08);
});
mc.system.runInterval(()=>{
 clock=mc.world.getAbsoluteTime();
 for(const id of ["overworld","nether","the_end"]){
  let dimension;try{dimension=mc.world.getDimension(id);}catch{continue;}
  for(const g of dimension.getEntities({type:GAUNTLET})){try{tickGauntlet(g);}catch{}}
 }
},STEP);
