import * as mc from "@minecraft/server";

const TYPE="lb:rift_burrower_ant",POST_DRAGON_KEY="lb:post_dragon_unlocked",STEP=5;
function distSq(a,b){const dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z;return dx*dx+dy*dy+dz*dz;}
function particle(d,id,p){try{d.spawnParticle(id,p);}catch{}}
function nearestPlayer(e,max=34){let best,bestSq=max*max;for(const p of mc.world.getAllPlayers()){if(p.dimension.id!==e.dimension.id)continue;const ds=distSq(p.location,e.location);if(ds<bestSq){best=p;bestSq=ds;}}return best?{player:best,distanceSq:bestSq}:undefined;}
function safeSpot(d,target,angle,r=3.8){
 const x=Math.floor(target.x+Math.cos(angle)*r),z=Math.floor(target.z+Math.sin(angle)*r),sy=Math.floor(target.y);
 for(let y=sy+3;y>=sy-4;y--){
  try{const g=d.getBlock({x,y:y-1,z}),a=d.getBlock({x,y,z}),a2=d.getBlock({x,y:y+1,z});if(g?.typeId!=="minecraft:air"&&a?.typeId==="minecraft:air"&&a2?.typeId==="minecraft:air")return{x:x+.5,y,z:z+.5};}catch{}
 }
}
function phase(ant,target){
 ant.setDynamicProperty("lb:burrow_busy_ticks",45);
 ant.setDynamicProperty("lb:burrow_cooldown",130+Math.floor(Math.random()*70));
 try{ant.addEffect("slowness",20,{amplifier:4,showParticles:false});}catch{}
 for(let i=0;i<8;i++)particle(ant.dimension,"minecraft:basic_smoke_particle",{x:ant.location.x+(Math.random()-.5)*1.5,y:ant.location.y+.2,z:ant.location.z+(Math.random()-.5)*1.5});
 mc.system.runTimeout(()=>{
  if(!ant.isValid)return;
  try{ant.addEffect("invisibility",28,{amplifier:0,showParticles:false});}catch{}
  const view=target.getViewDirection(),base=Math.atan2(view.z,view.x)+Math.PI+(Math.random()-.5)*1.0;
  const spot=safeSpot(ant.dimension,target.location,base,3.6)||safeSpot(ant.dimension,target.location,base+Math.PI/2,3.2);
  if(spot)try{ant.teleport(spot,{dimension:ant.dimension});}catch{}
 },14);
 mc.system.runTimeout(()=>{
  if(!ant.isValid)return;
  const p=ant.location;
  for(let i=0;i<12;i++)particle(ant.dimension,"minecraft:basic_smoke_particle",{x:p.x+(Math.random()-.5)*2.5,y:p.y+.2+Math.random(),z:p.z+(Math.random()-.5)*2.5});
  try{ant.dimension.playSound("random.fizz",p,{volume:.8,pitch:.65});}catch{}
  for(const pl of mc.world.getAllPlayers()){
   if(pl.dimension.id!==ant.dimension.id||distSq(pl.location,p)>3.5*3.5)continue;
   try{pl.addEffect("slowness",45,{amplifier:1,showParticles:true});pl.applyDamage(12,{cause:mc.EntityDamageCause.entityAttack,damagingEntity:ant});}catch{}
  }
 },30);
}
function combat(ant){
 const busy=Math.max(0,Number(ant.getDynamicProperty("lb:burrow_busy_ticks")??0)-STEP),cd=Math.max(0,Number(ant.getDynamicProperty("lb:burrow_cooldown")??0)-STEP);
 ant.setDynamicProperty("lb:burrow_busy_ticks",busy);ant.setDynamicProperty("lb:burrow_cooldown",cd);
 if(busy>0||cd>0)return;
 const t=nearestPlayer(ant,34);if(!t||t.distanceSq<5*5||t.distanceSq>20*20)return;
 phase(ant,t.player);
}
function groundAt(d,x,startY,z){
 const bx=Math.floor(x),bz=Math.floor(z),top=Math.min(180,Math.floor(startY)+10),bottom=Math.max(-55,Math.floor(startY)-20);
 for(let y=top;y>=bottom;y--){try{const g=d.getBlock({x:bx,y,z:bz}),a=d.getBlock({x:bx,y:y+1,z:bz}),a2=d.getBlock({x:bx,y:y+2,z:bz});if(g?.typeId!=="minecraft:air"&&a?.typeId==="minecraft:air"&&a2?.typeId==="minecraft:air")return{x:bx,y:y+1,z:bz,ground:g.typeId};}catch{}}
}
function trySpawn(){
 if(mc.world.getDynamicProperty(POST_DRAGON_KEY)!==true)return;
 let d;try{d=mc.world.getDimension("overworld");}catch{return;}
 const ground=new Set(["minecraft:grass_block","minecraft:dirt","minecraft:coarse_dirt","minecraft:stone","minecraft:tuff","minecraft:gravel","minecraft:andesite"]);
 for(const p of mc.world.getAllPlayers()){
  if(p.dimension.id!==d.id||Math.random()>=.11)continue;
  if(d.getEntities({type:TYPE,location:p.location,maxDistance:72}).length>=2)continue;
  for(let n=0;n<6;n++){const a=Math.random()*Math.PI*2,r=20+Math.random()*20,g=groundAt(d,p.location.x+Math.cos(a)*r,p.location.y,p.location.z+Math.sin(a)*r);if(!g||!ground.has(g.ground))continue;try{const e=d.spawnEntity(TYPE,{x:g.x+.5,y:g.y,z:g.z+.5});e.nameTag="Rift Burrower Ant";}catch{}break;}
 }
}
function drop(d,p,id,count){try{d.spawnItem(new mc.ItemStack(id,count),{x:p.x,y:p.y+.5,z:p.z});}catch{}}
mc.world.afterEvents.entityDie.subscribe(event=>{const e=event.deadEntity;if(e?.typeId!==TYPE)return;if(Math.random()<.6)drop(e.dimension,e.location,"lb:epic_fragment",1+Math.floor(Math.random()*2));if(Math.random()<.14)drop(e.dimension,e.location,"lb:legendary_fragment",1);});
mc.system.runInterval(()=>{for(const id of ["overworld","nether","the_end"]){let d;try{d=mc.world.getDimension(id);}catch{continue;}for(const e of d.getEntities({type:TYPE}))try{combat(e);}catch{}}},STEP);
mc.system.runInterval(trySpawn,900);
