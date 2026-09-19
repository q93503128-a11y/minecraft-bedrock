import * as mc from "@minecraft/server";

const TYPE="lb:cave_dweller";
const POST_DRAGON_KEY="lb:post_dragon_unlocked";
const STEP=5;

function distSq(a,b){const dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z;return dx*dx+dy*dy+dz*dz;}
function nearestPlayer(entity,maxDistance=48){
  let best,bestSq=maxDistance*maxDistance;
  for(const p of mc.world.getAllPlayers()){
    if(p.dimension.id!==entity.dimension.id)continue;
    const d=distSq(p.location,entity.location);
    if(d<bestSq){best=p;bestSq=d;}
  }
  return best?{player:best,distanceSq:bestSq}:undefined;
}
function isLookingAt(player,entity,maxDistance=36){
  const dx=entity.location.x-player.location.x;
  const dy=(entity.location.y+1.8)-(player.location.y+1.55);
  const dz=entity.location.z-player.location.z;
  const len=Math.hypot(dx,dy,dz);
  if(len<=0.001||len>maxDistance)return false;
  const view=player.getViewDirection();
  return (view.x*dx+view.y*dy+view.z*dz)/len>0.965;
}
function play(entity,id,volume=1,pitch=1){try{entity.dimension.playSound(id,entity.location,{volume,pitch});}catch{}}
function setMode(entity,mode){
  entity.setDynamicProperty("lb:dweller_mode",mode);
  entity.setDynamicProperty("lb:dweller_mode_ticks",0);
  try{entity.triggerEvent("lb:"+mode);}catch{}
  if(mode==="spotted")play(entity,"lb.cave_dweller.spotted",1.25,1);
  else if(mode==="flee")play(entity,"lb.cave_dweller.flee",1.1,1);
  else if(mode==="chase")play(entity,"lb.cave_dweller.chase",1.15,.96);
}
function ensureState(entity){
  let mode=entity.getDynamicProperty("lb:dweller_mode");
  if(typeof mode!=="string"){
    mode="stalk";
    entity.setDynamicProperty("lb:dweller_stares",0);
    entity.setDynamicProperty("lb:dweller_stare_threshold",3+Math.floor(Math.random()*3));
    entity.setDynamicProperty("lb:dweller_no_target_ticks",0);
    setMode(entity,mode);
  }
  return mode;
}
function disappear(entity){
  play(entity,"lb.cave_dweller.disappear",1.25,1);
  try{entity.remove();}catch{}
}
function fleeImpulse(entity,player){
  const dx=entity.location.x-player.location.x,dz=entity.location.z-player.location.z;
  const len=Math.max(.001,Math.hypot(dx,dz));
  try{entity.applyImpulse({x:dx/len*.22,y:.03,z:dz/len*.22});}catch{}
}
function tickDweller(entity){
  const mode=ensureState(entity);
  const target=nearestPlayer(entity,48);
  if(!target){
    const idle=Number(entity.getDynamicProperty("lb:dweller_no_target_ticks")??0)+STEP;
    entity.setDynamicProperty("lb:dweller_no_target_ticks",idle);
    if(idle>=400)disappear(entity);
    return;
  }
  entity.setDynamicProperty("lb:dweller_no_target_ticks",0);
  const player=target.player;
  const looking=isLookingAt(player,entity);
  let ticks=Number(entity.getDynamicProperty("lb:dweller_mode_ticks")??0)+STEP;
  entity.setDynamicProperty("lb:dweller_mode_ticks",ticks);

  if(mode==="stalk"){
    if(looking&&target.distanceSq<=32*32){
      entity.setDynamicProperty("lb:dweller_stares",Number(entity.getDynamicProperty("lb:dweller_stares")??0)+1);
      setMode(entity,"spotted");
      return;
    }
    if(ticks>=240&&target.distanceSq<=18*18&&Math.random()<.20){
      setMode(entity,"chase");
    }
    return;
  }

  if(mode==="spotted"){
    if(looking){
      entity.setDynamicProperty("lb:dweller_mode_ticks",0);
      return;
    }
    if(ticks<15)return;
    const stares=Number(entity.getDynamicProperty("lb:dweller_stares")??0);
    const threshold=Number(entity.getDynamicProperty("lb:dweller_stare_threshold")??4);
    if(stares>=threshold){
      setMode(entity,Math.random()<.72?"chase":"flee");
      return;
    }
    setMode(entity,"stalk");
    return;
  }

  if(mode==="chase"){
    if(ticks%60===0)play(entity,"lb.cave_dweller.chase",.9,.92+Math.random()*.12);
    if(ticks>=240){
      if(!looking&&target.distanceSq>18*18){disappear(entity);return;}
      entity.setDynamicProperty("lb:dweller_stares",0);
      entity.setDynamicProperty("lb:dweller_stare_threshold",3+Math.floor(Math.random()*3));
      setMode(entity,"stalk");
    }
    return;
  }

  if(mode==="flee"){
    fleeImpulse(entity,player);
    if(ticks>=100&&(!looking||target.distanceSq>24*24)){disappear(entity);return;}
    if(ticks>=180)disappear(entity);
  }
}
function caveGroundAt(dimension,x,startY,z){
  const bx=Math.floor(x),bz=Math.floor(z),top=Math.min(52,Math.floor(startY)+5),bottom=Math.max(-55,Math.floor(startY)-14);
  for(let y=top;y>=bottom;y--){
    const g=dimension.getBlock({x:bx,y,z:bz});
    const a=dimension.getBlock({x:bx,y:y+1,z:bz});
    const a2=dimension.getBlock({x:bx,y:y+2,z:bz});
    if(!g||!a||!a2)continue;
    if(g.typeId!=="minecraft:air"&&a.typeId==="minecraft:air"&&a2.typeId==="minecraft:air")return{x:bx,y:y+1,z:bz};
  }
}
function tryNaturalSpawn(){
  if(mc.world.getDynamicProperty(POST_DRAGON_KEY)!==true)return;
  let dimension;try{dimension=mc.world.getDimension("overworld");}catch{return;}
  for(const player of mc.world.getAllPlayers()){
    if(player.dimension.id!==dimension.id||player.location.y>50||Math.random()>=.12)continue;
    if(dimension.getEntities({type:TYPE,location:player.location,maxDistance:96}).length>=1)continue;
    for(let attempt=0;attempt<8;attempt++){
      const a=Math.random()*Math.PI*2,r=16+Math.random()*14;
      const g=caveGroundAt(dimension,player.location.x+Math.cos(a)*r,player.location.y,player.location.z+Math.sin(a)*r);
      if(!g)continue;
      try{
        const e=dimension.spawnEntity(TYPE,{x:g.x+.5,y:g.y,z:g.z+.5});
        e.nameTag="Cave Dweller";
        setMode(e,"stalk");
      }catch{}
      break;
    }
  }
}
function drop(dimension,pos,id,count){try{dimension.spawnItem(new mc.ItemStack(id,count),{x:pos.x,y:pos.y+.6,z:pos.z});}catch{}}

mc.world.afterEvents.entityHurt.subscribe(event=>{
  const e=event.hurtEntity;if(e?.typeId!==TYPE||Math.random()>.28)return;
  play(e,"lb.cave_dweller.hurt",.9,.95+Math.random()*.1);
});
mc.world.afterEvents.entityDie.subscribe(event=>{
  const e=event.deadEntity;if(e?.typeId!==TYPE)return;
  play(e,"lb.cave_dweller.death",1.1,.96);
  if(Math.random()<.55)drop(e.dimension,e.location,"lb:epic_fragment",1+Math.floor(Math.random()*2));
  if(Math.random()<.16)drop(e.dimension,e.location,"lb:legendary_fragment",1);
});
mc.system.runInterval(()=>{
  for(const id of ["overworld","nether","the_end"]){
    let d;try{d=mc.world.getDimension(id);}catch{continue;}
    for(const e of d.getEntities({type:TYPE})){try{tickDweller(e);}catch{}}
  }
},STEP);
mc.system.runInterval(tryNaturalSpawn,900);
