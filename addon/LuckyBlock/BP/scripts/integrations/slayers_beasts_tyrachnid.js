import * as mc from "@minecraft/server";

const POST_DRAGON_KEY = "lb:post_dragon_unlocked";
const STEP = 10;
let tyraTick = 0;

function distSq(a,b){const dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z;return dx*dx+dy*dy+dz*dz;}

function nearestPlayer(entity,maxDistance){
  let best,bestSq=maxDistance*maxDistance;
  for(const player of mc.world.getAllPlayers()){
    if(player.dimension.id!==entity.dimension.id)continue;
    const d=distSq(player.location,entity.location);
    if(d<bestSq){best=player;bestSq=d;}
  }
  return best?{player:best,distanceSq:bestSq}:undefined;
}

function groundAt(dimension,x,startY,z){
  const bx=Math.floor(x),bz=Math.floor(z),top=Math.min(68,Math.floor(startY)+8),bottom=Math.max(-60,Math.floor(startY)-22);
  for(let y=top;y>=bottom;y--){
    const ground=dimension.getBlock({x:bx,y,z:bz});
    const a1=dimension.getBlock({x:bx,y:y+1,z:bz});
    const a2=dimension.getBlock({x:bx,y:y+2,z:bz});
    if(!ground||!a1||!a2)continue;
    if(ground.typeId!=="minecraft:air"&&a1.typeId==="minecraft:air"&&a2.typeId==="minecraft:air"){
      return{x:bx,y:y+1,z:bz,ground:ground.typeId};
    }
  }
}

function caveCeiling(dimension,pos){
  for(let dy=4;dy<=12;dy++){
    const block=dimension.getBlock({x:pos.x,y:pos.y+dy,z:pos.z});
    if(block&&block.typeId!=="minecraft:air")return true;
  }
  return false;
}

function trySpawnTyrachnid(){
  if(mc.world.getDynamicProperty(POST_DRAGON_KEY)!==true)return;
  const dimension=mc.world.getDimension("overworld");

  for(const player of mc.world.getAllPlayers()){
    if(player.dimension.id!==dimension.id||player.location.y>64)continue;
    if(dimension.getEntities({type:"lb:tyrachnid",location:player.location,maxDistance:96}).length>=1||Math.random()>=0.14)continue;

    for(let attempt=0;attempt<6;attempt++){
      const angle=Math.random()*Math.PI*2,radius=20+Math.random()*14;
      const ground=groundAt(dimension,player.location.x+Math.cos(angle)*radius,player.location.y,player.location.z+Math.sin(angle)*radius);
      if(!ground)continue;
      if(!["minecraft:stone","minecraft:deepslate","minecraft:tuff","minecraft:dripstone_block","minecraft:moss_block"].includes(ground.ground))continue;
      if(!caveCeiling(dimension,ground))continue;
      try{dimension.spawnEntity("lb:tyrachnid",{x:ground.x+0.5,y:ground.y,z:ground.z+0.5});}catch{}
      break;
    }
  }
}

function telegraphSnare(tyra,target){
  const dimension=tyra.dimension;
  const center={x:target.location.x,y:target.location.y+0.15,z:target.location.z};
  const offsets=[[0,0],[2.2,0],[-2.2,0],[0,2.2],[0,-2.2]];
  for(const [x,z] of offsets){
    try{dimension.spawnParticle("lb:obsidilith_indicator",{x:center.x+x,y:center.y,z:center.z+z});}catch{}
  }

  mc.system.runTimeout(()=>{
    try{dimension.spawnParticle("lb:obsidilith_burst",{x:center.x,y:center.y+0.45,z:center.z});}catch{}
    for(const player of mc.world.getAllPlayers()){
      if(player.dimension.id!==dimension.id||distSq(player.location,center)>4.5*4.5)continue;
      try{player.applyDamage(42);}catch{}
      try{player.addEffect("minecraft:slowness",80,{amplifier:2});}catch{}
    }
  },20);
}

function runTyrachnidCombat(){
  tyraTick=mc.world.getAbsoluteTime();
  for(const dimensionId of ["overworld","nether","the_end"]){
    const dimension=mc.world.getDimension(dimensionId);
    for(const tyra of dimension.getEntities({type:"lb:tyrachnid"})){
      const target=nearestPlayer(tyra,28);
      if(!target)continue;
      const next=Number(tyra.getDynamicProperty("lb:tyra_next_snare")??0);
      if(target.distanceSq>=36&&target.distanceSq<=324&&tyraTick>=next){
        telegraphSnare(tyra,target.player);
        tyra.setDynamicProperty("lb:tyra_next_snare",tyraTick+160+Math.floor(Math.random()*80));
      }
    }
  }
}

mc.world.afterEvents.entityHurt.subscribe(event=>{
  const source=event.damageSource.damagingEntity;
  if(source?.typeId!=="lb:tyrachnid")return;
  const victim=event.hurtEntity;
  const dx=victim.location.x-source.location.x,dz=victim.location.z-source.location.z;
  const len=Math.max(0.001,Math.sqrt(dx*dx+dz*dz));
  try{victim.applyImpulse({x:dx/len*0.95,y:0.28,z:dz/len*0.95});}catch{}
});

mc.system.runInterval(runTyrachnidCombat,STEP);
mc.system.runInterval(trySpawnTyrachnid,700);
