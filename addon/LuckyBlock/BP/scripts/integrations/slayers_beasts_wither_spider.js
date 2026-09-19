import * as mc from "@minecraft/server";

const STEP=10;
let combatTick=0;

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
  const bx=Math.floor(x),bz=Math.floor(z),top=Math.min(126,Math.floor(startY)+12),bottom=Math.max(2,Math.floor(startY)-18);
  for(let y=top;y>=bottom;y--){
    const ground=dimension.getBlock({x:bx,y,z:bz}),a1=dimension.getBlock({x:bx,y:y+1,z:bz}),a2=dimension.getBlock({x:bx,y:y+2,z:bz});
    if(!ground||!a1||!a2)continue;
    if(ground.typeId!=="minecraft:air"&&a1.typeId==="minecraft:air"&&a2.typeId==="minecraft:air")return{x:bx,y:y+1,z:bz,ground:ground.typeId};
  }
}
function trySpawnWitherSpider(){
  if(mc.world.getDynamicProperty("lb:post_dragon_unlocked")!==true)return;
  const dimension=mc.world.getDimension("nether");
  const allowed=new Set(["minecraft:netherrack","minecraft:soul_sand","minecraft:soul_soil","minecraft:basalt","minecraft:blackstone","minecraft:crimson_nylium","minecraft:warped_nylium"]);
  for(const player of mc.world.getAllPlayers()){
    if(player.dimension.id!==dimension.id)continue;
    if(dimension.getEntities({type:"lb:wither_spider",location:player.location,maxDistance:64}).length>=2||Math.random()>=0.22)continue;
    for(let attempt=0;attempt<6;attempt++){
      const angle=Math.random()*Math.PI*2,radius=18+Math.random()*14;
      const ground=groundAt(dimension,player.location.x+Math.cos(angle)*radius,player.location.y,player.location.z+Math.sin(angle)*radius);
      if(!ground||!allowed.has(ground.ground))continue;
      try{dimension.spawnEntity("lb:wither_spider",{x:ground.x+0.5,y:ground.y,z:ground.z+0.5});}catch{}
      break;
    }
  }
}
function telegraphVolley(spider,target){
  const dimension=spider.dimension;
  const center={x:target.location.x,y:target.location.y+0.12,z:target.location.z};
  for(const [dx,dz] of [[0,0],[2.2,0],[-2.2,0],[0,2.2],[0,-2.2]]){
    try{dimension.spawnParticle("lb:obsidilith_indicator",{x:center.x+dx,y:center.y,z:center.z+dz});}catch{}
  }
  mc.system.runTimeout(()=>{
    try{dimension.spawnParticle("lb:obsidilith_burst",{x:center.x,y:center.y+0.35,z:center.z});}catch{}
    for(const player of mc.world.getAllPlayers()){
      if(player.dimension.id!==dimension.id||distSq(player.location,center)>3.2*3.2)continue;
      try{player.applyDamage(14,{cause:mc.EntityDamageCause.magic,damagingEntity:spider});}catch{try{player.applyDamage(14);}catch{}}
      try{player.addEffect("minecraft:wither",100,{amplifier:0});}catch{}
    }
  },16);
}
function runCombat(){
  combatTick=mc.world.getAbsoluteTime();
  for(const dimensionId of ["overworld","nether","the_end"]){
    const dimension=mc.world.getDimension(dimensionId);
    for(const spider of dimension.getEntities({type:"lb:wither_spider"})){
      const target=nearestPlayer(spider,26);if(!target)continue;
      const next=Number(spider.getDynamicProperty("lb:wither_spider_next_volley")??0);
      if(target.distanceSq>=49&&target.distanceSq<=576&&combatTick>=next){
        telegraphVolley(spider,target.player);
        spider.setDynamicProperty("lb:wither_spider_next_volley",combatTick+100+Math.floor(Math.random()*60));
      }
    }
  }
}
mc.system.runInterval(runCombat,STEP);
mc.system.runInterval(trySpawnWitherSpider,600);
