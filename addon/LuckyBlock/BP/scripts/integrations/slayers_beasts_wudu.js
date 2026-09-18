import * as mc from "@minecraft/server";

const STEP=10;
const SUPPORT_TYPES=new Set(["lb:impaler","lb:mantis","lb:tyrachnid"]);
let combatTick=0;

function distSq(a,b){const dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z;return dx*dx+dy*dy+dz*dz;}
function postDragon(){return mc.world.getDynamicProperty("lb:post_dragon_unlocked")===true;}
function nearestPlayer(entity,maxDistance){
  let best,bestSq=maxDistance*maxDistance;
  for(const player of mc.world.getAllPlayers()){
    if(player.dimension.id!==entity.dimension.id)continue;
    const d=distSq(player.location,entity.location);if(d<bestSq){best=player;bestSq=d;}
  }
  return best?{player:best,distanceSq:bestSq}:undefined;
}
function groundAt(dimension,x,startY,z){
  const bx=Math.floor(x),bz=Math.floor(z),top=Math.min(240,Math.floor(startY)+16),bottom=Math.max(-48,Math.floor(startY)-20);
  for(let y=top;y>=bottom;y--){
    const g=dimension.getBlock({x:bx,y,z:bz}),a1=dimension.getBlock({x:bx,y:y+1,z:bz}),a2=dimension.getBlock({x:bx,y:y+2,z:bz});
    if(g&&a1&&a2&&g.typeId!=="minecraft:air"&&a1.typeId==="minecraft:air"&&a2.typeId==="minecraft:air")return{x:bx,y:y+1,z:bz,ground:g.typeId};
  }
}
function wooded(dimension,point){
  let count=0;
  for(const [dx,dz] of [[-6,-6],[-6,0],[-6,6],[0,-6],[0,6],[6,-6],[6,0],[6,6]]){
    for(let dy=0;dy<=6;dy+=2){
      try{
        const id=dimension.getBlock({x:point.x+dx,y:point.y+dy,z:point.z+dz})?.typeId??"";
        if(id.includes("_log")||id.includes("_wood")||id.includes("_leaves")){count++;break;}
      }catch{}
    }
  }
  return count>=3;
}
function spawnPass(){
  if(!postDragon())return;
  const dimension=mc.world.getDimension("overworld");
  const allowed=new Set(["minecraft:grass_block","minecraft:podzol","minecraft:moss_block","minecraft:rooted_dirt","minecraft:dirt","minecraft:coarse_dirt"]);
  for(const player of mc.world.getAllPlayers()){
    if(player.dimension.id!==dimension.id)continue;
    if(dimension.getEntities({type:"lb:wudu_binder",location:player.location,maxDistance:96}).length>=1||Math.random()>=0.12)continue;
    for(let attempt=0;attempt<7;attempt++){
      const a=Math.random()*Math.PI*2,r=24+Math.random()*14;
      const g=groundAt(dimension,player.location.x+Math.cos(a)*r,player.location.y,player.location.z+Math.sin(a)*r);
      if(!g||g.y<48||!allowed.has(g.ground)||!wooded(dimension,g))continue;
      try{dimension.spawnEntity("lb:wudu_binder",{x:g.x+0.5,y:g.y,z:g.z+0.5});}catch{}
      break;
    }
  }
}
function supportAura(wudu){
  try{
    for(const e of wudu.dimension.getEntities({location:wudu.location,maxDistance:11})){
      if(e===wudu||!SUPPORT_TYPES.has(e.typeId))continue;
      try{e.addEffect("minecraft:resistance",60,{amplifier:0,showParticles:false});}catch{}
    }
  }catch{}
}
function grasp(wudu,target){
  const center={x:target.location.x,y:target.location.y+0.12,z:target.location.z},dimension=wudu.dimension;
  for(const [dx,dz] of [[0,0],[2.3,0],[-2.3,0],[0,2.3],[0,-2.3]])try{dimension.spawnParticle("lb:obsidilith_indicator",{x:center.x+dx,y:center.y,z:center.z+dz});}catch{}
  try{dimension.playSound("lb.obsidilith.spike_indicator",center,{volume:0.68,pitch:0.78});}catch{}
  mc.system.runTimeout(()=>{
    if(!wudu?.isValid||!target?.isValid||target.dimension.id!==dimension.id)return;
    try{dimension.spawnParticle("lb:obsidilith_burst",{x:center.x,y:center.y+0.35,z:center.z});}catch{}
    if(distSq(target.location,center)>3.25*3.25)return;
    try{target.applyDamage(18,{cause:mc.EntityDamageCause.magic,damagingEntity:wudu});}catch{try{target.applyDamage(18);}catch{}}
    try{target.addEffect("minecraft:slowness",70,{amplifier:1});}catch{}
    const dx=wudu.location.x-target.location.x,dz=wudu.location.z-target.location.z,len=Math.sqrt(dx*dx+dz*dz)||1;
    try{target.applyImpulse({x:dx/len*1.05,y:0.18,z:dz/len*1.05});}catch{}
  },18);
}
function combatPass(){
  combatTick+=STEP;if(!postDragon())return;
  for(const id of ["overworld","nether","the_end"]){
    const dimension=mc.world.getDimension(id);
    for(const wudu of dimension.getEntities({type:"lb:wudu_binder"})){
      if((combatTick%40)===0)supportAura(wudu);
      const target=nearestPlayer(wudu,28);if(!target)continue;
      const next=Number(wudu.getDynamicProperty("lb:wudu_next_grasp")??0);
      if(target.distanceSq>=64&&target.distanceSq<=24*24&&combatTick>=next){
        grasp(wudu,target.player);wudu.setDynamicProperty("lb:wudu_next_grasp",combatTick+120+Math.floor(Math.random()*70));
      }
    }
  }
}
mc.system.runInterval(combatPass,STEP);
mc.system.runInterval(spawnPass,800);
