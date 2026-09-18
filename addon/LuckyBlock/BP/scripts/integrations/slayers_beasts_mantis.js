import * as mc from "@minecraft/server";

const POST_DRAGON_KEY = "lb:post_dragon_unlocked";
let mantisTick = 0;

function distanceSq(a,b){const dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z;return dx*dx+dy*dy+dz*dz;}
function nearestPlayer(entity,maxDistance){
  let best,bestSq=maxDistance*maxDistance;
  for(const p of mc.world.getAllPlayers()){
    if(p.dimension.id!==entity.dimension.id)continue;
    const d=distanceSq(p.location,entity.location);
    if(d<bestSq){best=p;bestSq=d;}
  }
  return best?{player:best,distanceSq:bestSq}:undefined;
}
function groundAt(dimension,x,startY,z){
  const bx=Math.floor(x),bz=Math.floor(z),top=Math.min(250,Math.floor(startY)+10),bottom=Math.max(-60,Math.floor(startY)-22);
  for(let y=top;y>=bottom;y--){
    const ground=dimension.getBlock({x:bx,y,z:bz}),a1=dimension.getBlock({x:bx,y:y+1,z:bz}),a2=dimension.getBlock({x:bx,y:y+2,z:bz});
    if(!ground||!a1||!a2)continue;
    if(ground.typeId!=="minecraft:air"&&a1.typeId==="minecraft:air"&&a2.typeId==="minecraft:air")return{x:bx,y:y+1,z:bz,ground:ground.typeId};
  }
}
function habitatScore(dimension,base){
  let score=0;
  for(let dx=-3;dx<=3;dx+=2)for(let dz=-3;dz<=3;dz+=2)for(let dy=0;dy<=5;dy+=2){
    const id=dimension.getBlock({x:base.x+dx,y:base.y+dy,z:base.z+dz})?.typeId??"";
    if(id.endsWith("_leaves")||id==="minecraft:moss_block"||id==="minecraft:mangrove_roots"||id==="minecraft:muddy_mangrove_roots"||id==="minecraft:vine"||id==="minecraft:moss_carpet")score++;
  }
  return score;
}
function trySpawnMantis(){
  if(mc.world.getDynamicProperty(POST_DRAGON_KEY)!==true)return;
  const dimension=mc.world.getDimension("overworld");
  for(const player of mc.world.getAllPlayers()){
    if(player.dimension.id!==dimension.id)continue;
    if(dimension.getEntities({type:"lb:mantis",location:player.location,maxDistance:64}).length>=3||Math.random()>=0.28)continue;
    for(let attempt=0;attempt<5;attempt++){
      const angle=Math.random()*Math.PI*2,radius=18+Math.random()*14;
      const ground=groundAt(dimension,player.location.x+Math.cos(angle)*radius,player.location.y,player.location.z+Math.sin(angle)*radius);
      if(!ground)continue;
      if(!["minecraft:grass_block","minecraft:mud","minecraft:moss_block","minecraft:podzol","minecraft:dirt"].includes(ground.ground))continue;
      if(habitatScore(dimension,ground)<4)continue;
      try{
        const mantis=dimension.spawnEntity("lb:mantis",{x:ground.x+0.5,y:ground.y,z:ground.z+0.5});
        dimension.playSound("lb.mantis.ambient",mantis.location,{volume:0.9,pitch:0.92+Math.random()*0.12});
      }catch{}
      break;
    }
  }
}
function runMantisCombat(){
  mantisTick+=10;
  for(const dimId of ["overworld","nether","the_end"]){
    const dimension=mc.world.getDimension(dimId);
    for(const mantis of dimension.getEntities({type:"lb:mantis"})){
      const target=nearestPlayer(mantis,24);
      if(!target)continue;
      const nextLunge=Number(mantis.getDynamicProperty("lb:mantis_next_lunge")??0);
      if(target.distanceSq>=64&&target.distanceSq<=400&&mantisTick>=nextLunge){
        const dx=target.player.location.x-mantis.location.x,dz=target.player.location.z-mantis.location.z,len=Math.max(0.001,Math.sqrt(dx*dx+dz*dz));
        try{mantis.playAnimation("animation.lb.mantis.scuttle",{blendOutTime:0.08});}catch{}
        try{mantis.applyImpulse({x:dx/len*1.15,y:0.52,z:dz/len*1.15});}catch{}
        try{mantis.playAnimation("animation.lb.mantis.flap",{blendOutTime:0.1});}catch{}
        mantis.setDynamicProperty("lb:mantis_next_lunge",mantisTick+70+Math.floor(Math.random()*35));
      }
      if(target.distanceSq<=10){
        const nextStrike=Number(mantis.getDynamicProperty("lb:mantis_next_strike")??0);
        if(mantisTick>=nextStrike){
          try{mantis.playAnimation("animation.lb.mantis.strike",{blendOutTime:0.08});}catch{}
          mantis.setDynamicProperty("lb:mantis_next_strike",mantisTick+34);
        }
      }
      const nextSound=Number(mantis.getDynamicProperty("lb:mantis_next_sound")??0);
      if(mantisTick>=nextSound&&Math.random()<0.14){
        try{dimension.playSound("lb.mantis.ambient",mantis.location,{volume:0.7,pitch:0.9+Math.random()*0.18});}catch{}
        mantis.setDynamicProperty("lb:mantis_next_sound",mantisTick+140+Math.floor(Math.random()*120));
      }
    }
  }
}
mc.world.afterEvents.entityHurt.subscribe(event=>{
  const source=event.damageSource.damagingEntity;
  if(source?.typeId==="lb:mantis"){
    const victim=event.hurtEntity;
    if(victim.typeId==="minecraft:player"&&Math.random()<0.5){
      try{victim.addEffect("poison",70,{amplifier:1});}catch{}
    }
    try{source.playAnimation("animation.lb.mantis.strike",{blendOutTime:0.06});}catch{}
  }
  if(event.hurtEntity.typeId==="lb:mantis"){
    try{event.hurtEntity.dimension.playSound("lb.mantis.hurt",event.hurtEntity.location,{volume:0.8,pitch:0.96+Math.random()*0.08});}catch{}
  }
});
mc.world.afterEvents.entityDie.subscribe(event=>{
  if(event.deadEntity.typeId!=="lb:mantis")return;
  try{event.deadEntity.dimension.playSound("lb.mantis.death",event.deadEntity.location,{volume:1.0,pitch:0.95});}catch{}
});
mc.system.runInterval(runMantisCombat,10);
mc.system.runInterval(trySpawnMantis,500);
