import * as mc from "@minecraft/server";

const TYPE="lb:rift_charger_ant";
const POST_DRAGON_KEY="lb:post_dragon_unlocked";
const STEP=10;
let tick=0;

function distSq(a,b){const dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z;return dx*dx+dy*dy+dz*dz;}
function particle(d,id,p){try{d.spawnParticle(id,p);}catch{}}
function nearestPlayer(entity,maxDistance=36){
  let best,bestSq=maxDistance*maxDistance;
  for(const p of mc.world.getAllPlayers()){
    if(p.dimension.id!==entity.dimension.id)continue;
    const d=distSq(p.location,entity.location);
    if(d<bestSq){best=p;bestSq=d;}
  }
  return best?{player:best,distanceSq:bestSq}:undefined;
}
function telegraphLine(ant,target){
  const dx=target.x-ant.location.x,dz=target.z-ant.location.z;
  const len=Math.max(0.001,Math.hypot(dx,dz)),ux=dx/len,uz=dz/len;
  const steps=Math.max(5,Math.min(12,Math.floor(len/1.6)));
  for(let i=1;i<=steps;i++){
    particle(ant.dimension,"lb:obsidilith_indicator",{
      x:ant.location.x+ux*(len*i/steps),y:ant.location.y+0.12,z:ant.location.z+uz*(len*i/steps)
    });
  }
}
function startCharge(ant,target){
  const snapshot={x:target.location.x,z:target.location.z};
  const dx=snapshot.x-ant.location.x,dz=snapshot.z-ant.location.z;
  const len=Math.max(0.001,Math.hypot(dx,dz)),ux=dx/len,uz=dz/len;
  ant.setDynamicProperty("lb:charger_busy_until",tick+55);
  ant.setDynamicProperty("lb:charger_next_charge",tick+120+Math.floor(Math.random()*45));
  try{ant.addEffect("slowness",30,{amplifier:4,showParticles:false});}catch{}
  try{ant.dimension.playSound("lb.obsidilith.spike_indicator",ant.location,{volume:0.78,pitch:0.82});}catch{}
  telegraphLine(ant,snapshot);
  mc.system.runTimeout(()=>{
    if(!ant.isValid)return;
    particle(ant.dimension,"lb:obsidilith_burst",{x:ant.location.x,y:ant.location.y+0.35,z:ant.location.z});
    try{ant.applyImpulse({x:ux*1.85,y:0.10,z:uz*1.85});}catch{}
    mc.system.runTimeout(()=>{
      if(!ant.isValid)return;
      let hit=false;
      for(const p of mc.world.getAllPlayers()){
        if(p.dimension.id!==ant.dimension.id||distSq(p.location,ant.location)>2.8*2.8)continue;
        hit=true;
        try{p.applyDamage(30,{cause:mc.EntityDamageCause.entityAttack,damagingEntity:ant});}catch{try{p.applyDamage(30);}catch{}}
        const kx=p.location.x-ant.location.x,kz=p.location.z-ant.location.z,kl=Math.max(0.001,Math.hypot(kx,kz));
        try{p.applyImpulse({x:kx/kl*0.72,y:0.28,z:kz/kl*0.72});}catch{}
      }
      if(hit){
        try{ant.dimension.playSound("mob.irongolem.throw",ant.location,{volume:0.72,pitch:1.15});}catch{}
        return;
      }
      try{ant.triggerEvent("lb:charger_vulnerable_on");}catch{}
      try{ant.addEffect("slowness",50,{amplifier:2,showParticles:false});}catch{}
      try{ant.dimension.playSound("random.anvil_land",ant.location,{volume:0.62,pitch:1.38});}catch{}
      mc.system.runTimeout(()=>{if(ant.isValid)try{ant.triggerEvent("lb:charger_vulnerable_off");}catch{}},50);
    },10);
  },24);
}
function combat(ant){
  const target=nearestPlayer(ant,36);if(!target)return;
  if(tick<Number(ant.getDynamicProperty("lb:charger_busy_until")??0))return;
  if(target.distanceSq<7*7||target.distanceSq>24*24)return;
  if(tick<Number(ant.getDynamicProperty("lb:charger_next_charge")??0))return;
  startCharge(ant,target.player);
}
function groundAt(dimension,x,startY,z){
  const bx=Math.floor(x),bz=Math.floor(z),top=Math.min(250,Math.floor(startY)+12),bottom=Math.max(-60,Math.floor(startY)-24);
  for(let y=top;y>=bottom;y--){
    const g=dimension.getBlock({x:bx,y,z:bz}),a=dimension.getBlock({x:bx,y:y+1,z:bz}),a2=dimension.getBlock({x:bx,y:y+2,z:bz});
    if(!g||!a||!a2)continue;
    if(g.typeId!=="minecraft:air"&&a.typeId==="minecraft:air"&&a2.typeId==="minecraft:air")return{x:bx,y:y+1,z:bz,ground:g.typeId};
  }
}
function trySpawn(){
  if(mc.world.getDynamicProperty(POST_DRAGON_KEY)!==true)return;
  let dimension;try{dimension=mc.world.getDimension("overworld");}catch{return;}
  const validGround=new Set(["minecraft:grass_block","minecraft:stone","minecraft:andesite","minecraft:tuff","minecraft:gravel","minecraft:coarse_dirt"]);
  for(const player of mc.world.getAllPlayers()){
    if(player.dimension.id!==dimension.id||Math.random()>=0.14)continue;
    if(dimension.getEntities({type:TYPE,location:player.location,maxDistance:96}).length>=1)continue;
    for(let attempt=0;attempt<6;attempt++){
      const a=Math.random()*Math.PI*2,r=24+Math.random()*18;
      const g=groundAt(dimension,player.location.x+Math.cos(a)*r,player.location.y,player.location.z+Math.sin(a)*r);
      if(!g||!validGround.has(g.ground))continue;
      try{const ant=dimension.spawnEntity(TYPE,{x:g.x+0.5,y:g.y,z:g.z+0.5});ant.nameTag="Rift Charger Ant";}catch{}
      break;
    }
  }
}
function drop(dimension,pos,id,count){try{dimension.spawnItem(new mc.ItemStack(id,count),{x:pos.x,y:pos.y+0.5,z:pos.z});}catch{}}

mc.world.afterEvents.entityDie.subscribe(event=>{
  const e=event.deadEntity;if(e?.typeId!==TYPE)return;
  const p=e.location,d=e.dimension;
  if(Math.random()<0.65)drop(d,p,"lb:epic_fragment",1+Math.floor(Math.random()*2));
  if(Math.random()<0.18)drop(d,p,"lb:legendary_fragment",1);
});
mc.system.runInterval(()=>{
  tick+=STEP;
  for(const id of ["overworld","nether","the_end"]){
    let d;try{d=mc.world.getDimension(id);}catch{continue;}
    for(const ant of d.getEntities({type:TYPE})){try{combat(ant);}catch{}}
  }
},STEP);
mc.system.runInterval(trySpawn,900);
