import * as mc from "@minecraft/server";

const TYPE="lb:rift_spitter_ant";
const POST_DRAGON_KEY="lb:post_dragon_unlocked";
const STEP=10;

function distSq(a,b){const dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z;return dx*dx+dy*dy+dz*dz;}
function nearestPlayer(entity,maxDistance=30){
 let best,bestSq=maxDistance*maxDistance;
 for(const p of mc.world.getAllPlayers()){
  if(p.dimension.id!==entity.dimension.id)continue;
  const d=distSq(p.location,entity.location);
  if(d<bestSq){best=p;bestSq=d;}
 }
 return best?{player:best,distanceSq:bestSq}:undefined;
}
function particle(d,id,p){try{d.spawnParticle(id,p);}catch{}}
function ring(d,c,r,id="lb:obsidilith_indicator",count=12){
 for(let i=0;i<count;i++){const a=Math.PI*2*i/count;particle(d,id,{x:c.x+Math.cos(a)*r,y:c.y+.12,z:c.z+Math.sin(a)*r});}
}
function hit(source,center,damage){
 const dim=source.dimension;
 particle(dim,"lb:obsidilith_burst",{x:center.x,y:center.y+.25,z:center.z});
 try{dim.playSound("mob.slime.attack",center,{volume:.7,pitch:.72});}catch{}
 for(const p of mc.world.getAllPlayers()){
  if(p.dimension.id!==dim.id||distSq(p.location,center)>3.0*3.0)continue;
  try{p.applyDamage(damage,{cause:mc.EntityDamageCause.magic,damagingEntity:source});}catch{try{p.applyDamage(damage);}catch{}}
  try{p.addEffect("poison",90,{amplifier:1,showParticles:true});}catch{}
  try{p.addEffect("slowness",35,{amplifier:0,showParticles:false});}catch{}
 }
}
function salvo(ant,target){
 try{ant.dimension.playSound("mob.spider.say",ant.location,{volume:.62,pitch:1.28});}catch{}
 for(let i=0;i<3;i++){
  mc.system.runTimeout(()=>{
   if(!ant.isValid||!target.isValid)return;
   const point={x:target.location.x,y:target.location.y,z:target.location.z};
   ring(ant.dimension,point,2.8,"lb:obsidilith_indicator",14);
   particle(ant.dimension,"lb:tomemancy_flame_summoning",{x:point.x,y:point.y+.2,z:point.z});
   mc.system.runTimeout(()=>{if(ant.isValid)hit(ant,point,14+i*2);},16);
  },i*22);
 }
}
function combat(ant){
 const retreatCd=Math.max(0,Number(ant.getDynamicProperty("lb:spitter_retreat_cooldown")??0)-STEP);
 const salvoCd=Math.max(0,Number(ant.getDynamicProperty("lb:spitter_salvo_cooldown")??0)-STEP);
 ant.setDynamicProperty("lb:spitter_retreat_cooldown",retreatCd);
 ant.setDynamicProperty("lb:spitter_salvo_cooldown",salvoCd);
 const target=nearestPlayer(ant,30);if(!target)return;
 if(target.distanceSq<36&&retreatCd<=0){
  const dx=ant.location.x-target.player.location.x,dz=ant.location.z-target.player.location.z,len=Math.max(.001,Math.hypot(dx,dz));
  try{ant.applyImpulse({x:dx/len*.62,y:.18,z:dz/len*.62});}catch{}
  ant.setDynamicProperty("lb:spitter_retreat_cooldown",35);
 }
 if(target.distanceSq<42||target.distanceSq>30*30||salvoCd>0)return;
 salvo(ant,target.player);
 ant.setDynamicProperty("lb:spitter_salvo_cooldown",95+Math.floor(Math.random()*40));
}
function groundAt(dimension,x,startY,z){
 const bx=Math.floor(x),bz=Math.floor(z),top=Math.min(250,Math.floor(startY)+10),bottom=Math.max(-60,Math.floor(startY)-20);
 for(let y=top;y>=bottom;y--){
  const g=dimension.getBlock({x:bx,y,z:bz}),a=dimension.getBlock({x:bx,y:y+1,z:bz}),a2=dimension.getBlock({x:bx,y:y+2,z:bz});
  if(!g||!a||!a2)continue;
  if(g.typeId!=="minecraft:air"&&a.typeId==="minecraft:air"&&a2.typeId==="minecraft:air")return{x:bx,y:y+1,z:bz,ground:g.typeId};
 }
}
function trySpawn(){
 if(mc.world.getDynamicProperty(POST_DRAGON_KEY)!==true)return;
 let dimension;try{dimension=mc.world.getDimension("overworld");}catch{return;}
 const validGround=new Set(["minecraft:grass_block","minecraft:dirt","minecraft:coarse_dirt","minecraft:podzol","minecraft:mud","minecraft:rooted_dirt"]);
 for(const player of mc.world.getAllPlayers()){
  if(player.dimension.id!==dimension.id||Math.random()>=.20)continue;
  if(dimension.getEntities({type:TYPE,location:player.location,maxDistance:72}).length>=2)continue;
  for(let attempt=0;attempt<5;attempt++){
   const a=Math.random()*Math.PI*2,r=20+Math.random()*16;
   const g=groundAt(dimension,player.location.x+Math.cos(a)*r,player.location.y,player.location.z+Math.sin(a)*r);
   if(!g||!validGround.has(g.ground))continue;
   try{
    const ant=dimension.spawnEntity(TYPE,{x:g.x+.5,y:g.y,z:g.z+.5});
    ant.nameTag="Rift Spitter Ant";
   }catch{}
   break;
  }
 }
}
function drop(dimension,pos,id,count){try{dimension.spawnItem(new mc.ItemStack(id,count),{x:pos.x,y:pos.y+.5,z:pos.z});}catch{}}

mc.world.afterEvents.entityDie.subscribe(event=>{
 const e=event.deadEntity;if(e?.typeId!==TYPE)return;
 const p=e.location,d=e.dimension;
 if(Math.random()<.50)drop(d,p,"lb:epic_fragment",1+Math.floor(Math.random()*2));
 if(Math.random()<.12)drop(d,p,"lb:legendary_fragment",1);
});
mc.system.runInterval(()=>{
 for(const id of ["overworld","nether","the_end"]){
  let d;try{d=mc.world.getDimension(id);}catch{continue;}
  for(const ant of d.getEntities({type:TYPE})){try{combat(ant);}catch{}}
 }
},STEP);
mc.system.runInterval(trySpawn,700);
