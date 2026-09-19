import * as mc from "@minecraft/server";

const STEP = 5;
let combatTick = 0;
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
function pulse(dimension,id,pos){try{dimension.spawnParticle(id,pos);}catch{}}
function eventIdOf(queen){
  const raw=Number(queen.getDynamicProperty("lb:pre_event_id"));
  return Number.isFinite(raw)&&raw>0?raw:undefined;
}
function spawnGuards(queen,count){
  const eventId=eventIdOf(queen),center=queen.location;
  for(let i=0;i<count;i++){
    const a=Math.PI*2*i/Math.max(1,count)+(Math.random()*.5-.25),r=2.4+Math.random()*1.2;
    try{
      const guard=queen.dimension.spawnEntity("lb:ant_soldier_guard",{x:center.x+Math.cos(a)*r,y:center.y+.15,z:center.z+Math.sin(a)*r});
      if(eventId!==undefined){guard.addTag("lb_pre_event_"+eventId);guard.setDynamicProperty("lb:pre_event_id",eventId);}
    }catch{}
  }
  try{queen.dimension.playSound("mob.silverfish.say",center,{volume:.9,pitch:.65});}catch{}
  pulse(queen.dimension,"lb:obsidilith_burst",{x:center.x,y:center.y+.45,z:center.z});
}
function telegraphCrush(queen,target){
  let center;try{center={x:target.location.x,y:target.location.y+.1,z:target.location.z};}catch{return;}
  const dimension=queen.dimension;
  for(const [dx,dz] of [[0,0],[2.2,0],[-2.2,0],[0,2.2],[0,-2.2]])pulse(dimension,"lb:obsidilith_indicator",{x:center.x+dx,y:center.y,z:center.z+dz});
  try{dimension.playSound("break.amethyst_cluster",center,{volume:.58,pitch:.72});}catch{}
  mc.system.runTimeout(()=>{
    let qloc;try{qloc=queen.location;}catch{return;}
    pulse(dimension,"lb:obsidilith_burst",{x:center.x,y:center.y+.35,z:center.z});
    for(const player of mc.world.getAllPlayers()){
      if(player.dimension.id!==dimension.id||distSq(player.location,center)>3.2*3.2)continue;
      try{player.applyDamage(16,{cause:mc.EntityDamageCause.magic,damagingEntity:queen});}catch{try{player.applyDamage(16);}catch{}}
      try{player.addEffect("minecraft:slowness",40,{amplifier:0});}catch{}
      const dx=player.location.x-qloc.x,dz=player.location.z-qloc.z,len=Math.max(.001,Math.hypot(dx,dz));
      try{player.applyImpulse({x:dx/len*.7,y:.18,z:dz/len*.7});}catch{}
    }
  },16);
}
function tickQueen(queen){
  const hp=Number(queen.getComponent("minecraft:health")?.currentValue);
  if(Number.isFinite(hp)){
    let phase=Number(queen.getDynamicProperty("lb:ant_queen_phase")??0);
    if(hp<=182&&phase<1){queen.setDynamicProperty("lb:ant_queen_phase",1);spawnGuards(queen,2);phase=1;}
    if(hp<=91&&phase<2){queen.setDynamicProperty("lb:ant_queen_phase",2);spawnGuards(queen,2);}
  }
  const target=nearestPlayer(queen,24);
  if(!target||target.distanceSq<16||target.distanceSq>576)return;
  const next=Number(queen.getDynamicProperty("lb:ant_queen_next_crush")??0);
  if(combatTick<next)return;
  telegraphCrush(queen,target.player);
  queen.setDynamicProperty("lb:ant_queen_next_crush",combatTick+120+Math.floor(Math.random()*51));
}
mc.system.runInterval(()=>{
  combatTick=mc.world.getAbsoluteTime();
  for(const id of ["overworld","nether","the_end"]){
    let dimension;try{dimension=mc.world.getDimension(id);}catch{continue;}
    for(const queen of dimension.getEntities({type:"lb:ant_queen"})){try{tickQueen(queen);}catch{}}
  }
},STEP);
