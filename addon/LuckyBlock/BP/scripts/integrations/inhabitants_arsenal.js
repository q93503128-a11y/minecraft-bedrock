import * as mc from "@minecraft/server";

const JAVELIN = "lb:javelin";
const THROWN = "lb:javelin_thrown";
const DRILL = "lb:spike_drill";
const HEAT_MAX = 120;
const RAMP_TICKS = 300;
const OVERHEAT_COOLDOWN = 40;
const javelinStarts = new Map();
const javelinCooldown = new Map();
const drillStates = new Map();
const drillCooldown = new Map();
const snowCoolCooldown = new Map();
const bounceCombos = new Map();
let tick = 0;

const FORBIDDEN_DRILL = new Set([
  "minecraft:air","minecraft:cave_air","minecraft:void_air","minecraft:water","minecraft:lava",
  "minecraft:bedrock","minecraft:barrier","minecraft:structure_void","minecraft:structure_block",
  "minecraft:jigsaw","minecraft:command_block","minecraft:chain_command_block","minecraft:repeating_command_block",
  "minecraft:end_portal","minecraft:end_gateway","minecraft:end_portal_frame","minecraft:reinforced_deepslate",
  "minecraft:obsidian","minecraft:crying_obsidian","minecraft:ancient_debris","minecraft:netherite_block",
  "minecraft:respawn_anchor",
  "minecraft:chest","minecraft:trapped_chest","minecraft:barrel","minecraft:hopper",
  "minecraft:dispenser","minecraft:dropper","minecraft:furnace","minecraft:blast_furnace","minecraft:smoker",
  "minecraft:brewing_stand","minecraft:decorated_pot","minecraft:chiseled_bookshelf",
  "minecraft:shulker_box","minecraft:white_shulker_box","minecraft:orange_shulker_box",
  "minecraft:magenta_shulker_box","minecraft:light_blue_shulker_box","minecraft:yellow_shulker_box",
  "minecraft:lime_shulker_box","minecraft:pink_shulker_box","minecraft:gray_shulker_box",
  "minecraft:light_gray_shulker_box","minecraft:cyan_shulker_box","minecraft:purple_shulker_box",
  "minecraft:blue_shulker_box","minecraft:brown_shulker_box","minecraft:green_shulker_box",
  "minecraft:red_shulker_box","minecraft:black_shulker_box"
]);

function actionbar(player,text){try{player.onScreenDisplay.setActionBar(text);}catch{}}
function eqSlot(player,slot){try{return player.getComponent("equippable")?.getEquipmentSlot(slot);}catch{return undefined;}}
function heldSlot(player){return eqSlot(player,mc.EquipmentSlot.Mainhand);}
function offhandSlot(player){return eqSlot(player,mc.EquipmentSlot.Offhand);}
function held(player){try{return heldSlot(player)?.getItem();}catch{return undefined;}}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function distSq(a,b){const dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z;return dx*dx+dy*dy+dz*dz;}
function normalize(v){const m=Math.sqrt(v.x*v.x+v.y*v.y+v.z*v.z)||1;return{x:v.x/m,y:v.y/m,z:v.z/m};}
function ownerById(id){if(typeof id!=="string")return undefined;return mc.world.getAllPlayers().find(p=>p.id===id);}
function canDamage(source,entity){
  if(!entity?.isValid||entity===source||entity.typeId===THROWN||entity.typeId==="minecraft:item"||entity.typeId==="minecraft:xp_orb")return false;
  if(entity instanceof mc.Player){
    if(!mc.world.gameRules.pvp)return false;
    try{const mode=entity.getGameMode();if(mode===mc.GameMode.Creative||mode===mc.GameMode.Spectator)return false;}catch{}
  }
  return true;
}
function consumeHeld(player,id,count=1){
  try{
    if(player.getGameMode()===mc.GameMode.Creative)return true;
    const slot=heldSlot(player),item=slot?.getItem();
    if(!slot||item?.typeId!==id||item.amount<count)return false;
    if(item.amount===count)slot.setItem(undefined);
    else{item.amount-=count;slot.setItem(item);}
    return true;
  }catch{return false;}
}
function addItem(player,id,count=1){
  try{
    const inv=player.getComponent("inventory")?.container;if(!inv)return false;
    const leftover=inv.addItem(new mc.ItemStack(id,count));
    if(leftover)player.dimension.spawnItem(leftover,{x:player.location.x,y:player.location.y+0.5,z:player.location.z});
    return true;
  }catch{return false;}
}
function play(dimension,id,location,volume=0.7,pitch=1){try{dimension.playSound(id,location,{volume,pitch});}catch{}}

function throwJavelin(player,draw){
  if((javelinCooldown.get(player.id)??0)>tick){actionbar(player,"§6Javelin §8— §7Ready soon");return;}
  if(draw<10){actionbar(player,"§6Javelin §8— §7Aim at least 0.5 s");return;}
  const charge=clamp(draw/60,0,1);
  if(!consumeHeld(player,JAVELIN,1))return;
  const dir=normalize(player.getViewDirection());
  const head=player.getHeadLocation();
  const pos={x:head.x+dir.x*1.15,y:head.y+dir.y*1.15-0.15,z:head.z+dir.z*1.15};
  try{
    const e=player.dimension.spawnEntity(THROWN,pos);
    e.setDynamicProperty("lb:javelin_owner",player.id);
    e.setDynamicProperty("lb:javelin_charge",charge);
    e.setDynamicProperty("lb:javelin_age",0);
    e.setDynamicProperty("lb:javelin_last_x",pos.x);
    e.setDynamicProperty("lb:javelin_last_y",pos.y);
    e.setDynamicProperty("lb:javelin_last_z",pos.z);
    e.setDynamicProperty("lb:javelin_stuck",false);
    const impulse=0.78+charge*2.65;
    e.applyImpulse({x:dir.x*impulse,y:dir.y*impulse+0.04,z:dir.z*impulse});
    try{
      const yaw=Math.atan2(-dir.x,dir.z)*180/Math.PI;
      const pitch=-Math.asin(clamp(dir.y,-1,1))*180/Math.PI;
      e.setRotation({x:pitch,y:yaw});
    }catch{}
    play(player.dimension,"lb.javelin.launch",pos,0.9,0.96+charge*0.1);
    javelinCooldown.set(player.id,tick+8);
    actionbar(player,"§6Javelin §8— §fCharge "+Math.round(charge*100)+"%");
  }catch{}
}
function stickJavelin(e,hit){
  try{
    e.clearVelocity();
    const loc={
      x:hit.block.location.x+hit.faceLocation.x,
      y:hit.block.location.y+hit.faceLocation.y,
      z:hit.block.location.z+hit.faceLocation.z
    };
    e.teleport(loc,{dimension:e.dimension});
    e.triggerEvent("lb:stick");
    e.setDynamicProperty("lb:javelin_stuck",true);
    e.setDynamicProperty("lb:javelin_block_x",hit.block.location.x);
    e.setDynamicProperty("lb:javelin_block_y",hit.block.location.y);
    e.setDynamicProperty("lb:javelin_block_z",hit.block.location.z);
    e.setDynamicProperty("lb:javelin_block_type",hit.block.typeId);
    e.setDynamicProperty("lb:javelin_bounce_cd",0);
    play(e.dimension,"lb.javelin.block_hit",loc,0.85,1);
  }catch{}
}
function tickStuckJavelin(e){
  let age=Number(e.getDynamicProperty("lb:javelin_age")??0)+1;e.setDynamicProperty("lb:javelin_age",age);
  let cd=Math.max(0,Number(e.getDynamicProperty("lb:javelin_bounce_cd")??0)-1);e.setDynamicProperty("lb:javelin_bounce_cd",cd);
  const bx=Number(e.getDynamicProperty("lb:javelin_block_x")),by=Number(e.getDynamicProperty("lb:javelin_block_y")),bz=Number(e.getDynamicProperty("lb:javelin_block_z"));
  const type=e.getDynamicProperty("lb:javelin_block_type");
  if(Number.isFinite(bx)&&Number.isFinite(by)&&Number.isFinite(bz)){
    try{
      const b=e.dimension.getBlock({x:bx,y:by,z:bz});
      if(!b||b.typeId==="minecraft:air"||(typeof type==="string"&&b.typeId!==type)){
        e.dimension.spawnItem(new mc.ItemStack(JAVELIN,1),e.location);e.remove();return;
      }
    }catch{}
  }
  const players=mc.world.getAllPlayers().filter(p=>p.dimension.id===e.dimension.id&&distSq(p.location,e.location)<=2.2*2.2);
  const picker=players.find(p=>p.isSneaking);
  if(picker){
    addItem(picker,JAVELIN,1);play(e.dimension,"random.pop",e.location,0.45,1.15);try{e.remove();}catch{};return;
  }
  if(cd<=0){
    const jumper=players.find(p=>!p.isSneaking&&Math.abs(p.location.y-e.location.y)<1.7);
    if(jumper){
      const prev=bounceCombos.get(jumper.id);
      const count=prev&&tick-prev.tick<=40?Math.min(5,prev.count+1):1;
      bounceCombos.set(jumper.id,{count,tick});
      try{jumper.applyImpulse({x:0,y:Math.min(1.15,0.55+(count-1)*0.13),z:0});}catch{}
      e.setDynamicProperty("lb:javelin_bounce_cd",10);
      play(e.dimension,"lb.javelin.bounce",e.location,0.85,0.95+count*0.04);
    }
  }
  if(age>2400){try{e.dimension.spawnItem(new mc.ItemStack(JAVELIN,1),e.location);e.remove();}catch{}}
}
function tickFlyingJavelin(e){
  let age=Number(e.getDynamicProperty("lb:javelin_age")??0)+1;e.setDynamicProperty("lb:javelin_age",age);
  if(age>1200){try{e.dimension.spawnItem(new mc.ItemStack(JAVELIN,1),e.location);e.remove();}catch{};return;}
  const cur=e.location;
  const last={
    x:Number(e.getDynamicProperty("lb:javelin_last_x")??cur.x),
    y:Number(e.getDynamicProperty("lb:javelin_last_y")??cur.y),
    z:Number(e.getDynamicProperty("lb:javelin_last_z")??cur.z)
  };
  const delta={x:cur.x-last.x,y:cur.y-last.y,z:cur.z-last.z};
  const distance=Math.sqrt(delta.x*delta.x+delta.y*delta.y+delta.z*delta.z);
  if(distance>0.015){
    const dir=normalize(delta);
    const owner=ownerById(e.getDynamicProperty("lb:javelin_owner"));
    let entityHit;
    try{
      const hits=e.dimension.getEntitiesFromRay(last,dir,{maxDistance:distance+0.55,ignoreBlockCollision:false,includeLiquidBlocks:false,includePassableBlocks:false});
      entityHit=hits.find(h=>canDamage(owner,h.entity)&&h.entity.id!==e.id);
    }catch{}
    if(entityHit){
      const charge=clamp(Number(e.getDynamicProperty("lb:javelin_charge")??0),0,1);
      const damage=Math.round(8+charge*10);
      try{entityHit.entity.applyDamage(damage,{cause:mc.EntityDamageCause.projectile,damagingEntity:owner??e});}catch{try{entityHit.entity.applyDamage(damage);}catch{}}
      try{entityHit.entity.applyImpulse({x:dir.x*(0.28+charge*0.24),y:0.1,z:dir.z*(0.28+charge*0.24)});}catch{}
      play(e.dimension,"lb.javelin.entity_hit",entityHit.entity.location,0.9,1);
      try{e.remove();}catch{};return;
    }
    let blockHit;
    try{blockHit=e.dimension.getBlockFromRay(last,dir,{maxDistance:distance+0.45,includePassableBlocks:false,includeLiquidBlocks:false});}catch{}
    if(blockHit){stickJavelin(e,blockHit);return;}
    try{
      const yaw=Math.atan2(-dir.x,dir.z)*180/Math.PI;
      const pitch=-Math.asin(clamp(dir.y,-1,1))*180/Math.PI;
      e.setRotation({x:pitch,y:yaw});
    }catch{}
  }
  e.setDynamicProperty("lb:javelin_last_x",cur.x);e.setDynamicProperty("lb:javelin_last_y",cur.y);e.setDynamicProperty("lb:javelin_last_z",cur.z);
}
function tickJavelins(){
  for(const key of ["overworld","nether","the_end"]){
    let dim;try{dim=mc.world.getDimension(key);}catch{continue;}
    let list=[];try{list=dim.getEntities({type:THROWN});}catch{}
    for(const e of list){
      try{
        if(e.getDynamicProperty("lb:javelin_stuck")===true)tickStuckJavelin(e);
        else tickFlyingJavelin(e);
      }catch{}
    }
  }
}

function drillHeat(item){return clamp(Number(item?.getDynamicProperty("lb:drill_heat")??0),0,HEAT_MAX);}
function setDrillHeat(item,value){try{item.setDynamicProperty("lb:drill_heat",clamp(Math.round(value),0,HEAT_MAX));}catch{}}
function canDrill(block){
  if(!block||FORBIDDEN_DRILL.has(block.typeId)||block.typeId.startsWith("lb:"))return false;
  try{if(block.getComponent("minecraft:inventory"))return false;}catch{}
  try{return !!block.getItemStack(1,true);}catch{return false;}
}
function damageDrill(player,item){
  try{
    const d=item.getComponent("durability");if(!d)return true;
    d.damage=Math.min(d.maxDurability,d.damage+1);
    if(d.damage>=d.maxDurability){
      heldSlot(player)?.setItem(undefined);play(player.dimension,"random.break",player.location,0.8,1);return false;
    }
    heldSlot(player)?.setItem(item);return true;
  }catch{return true;}
}
function stopDrill(player,reason){
  if(!drillStates.has(player.id))return;
  drillStates.delete(player.id);
  play(player.dimension,"lb.spike_drill.stop",player.location,0.55,1);
  if(reason)actionbar(player,reason);
}
function startDrill(player){
  if((drillCooldown.get(player.id)??0)>tick){actionbar(player,"§6Spike Drill §8— §cCooling down");return;}
  const item=held(player);if(item?.typeId!==DRILL)return;
  const heat=drillHeat(item);
  if(heat>=HEAT_MAX){drillCooldown.set(player.id,tick+OVERHEAT_COOLDOWN);try{player.applyDamage(2,{cause:mc.EntityDamageCause.fire});}catch{};play(player.dimension,"random.fizz",player.location,0.8,0.9);actionbar(player,"§cSpike Drill overheated");return;}
  drillStates.set(player.id,{start:tick,nextBreak:tick,miss:0,lastLoop:tick});
  item.setDynamicProperty("lb:drill_cool_delay",60);heldSlot(player)?.setItem(item);
  play(player.dimension,"lb.spike_drill.start",player.location,0.55,1);
}
function breakWithDrill(player,state){
  const item=held(player);if(item?.typeId!==DRILL){stopDrill(player);return;}
  let hit;try{hit=player.dimension.getBlockFromRay(player.getHeadLocation(),player.getViewDirection(),{maxDistance:5.25,includePassableBlocks:false,includeLiquidBlocks:false});}catch{}
  if(!hit||!canDrill(hit.block)){
    state.miss=(state.miss??0)+1;
    if(state.miss>5)stopDrill(player,"§6Spike Drill §8— §7No drillable block");
    return;
  }
  state.miss=0;
  const ramp=clamp((tick-state.start)/RAMP_TICKS,0,1);
  const interval=Math.max(3,Math.round(14-ramp*11));
  if(tick<state.nextBreak){
    if(tick%5===0)actionbar(player,"§6Spike Drill §8— §fHeat "+drillHeat(item)+"/120 §7| Momentum "+Math.round(ramp*100)+"%");
    return;
  }
  state.nextBreak=tick+interval;
  let drop;try{drop=hit.block.getItemStack(1,true);}catch{}
  if(!drop)return;
  const loc=hit.block.location;
  try{hit.block.setPermutation(mc.BlockPermutation.resolve("minecraft:air"));}catch{return;}
  try{player.dimension.spawnItem(drop,{x:loc.x+0.5,y:loc.y+0.6,z:loc.z+0.5});}catch{}
  const heat=drillHeat(item)+1;setDrillHeat(item,heat);item.setDynamicProperty("lb:drill_cool_delay",60);
  if(!damageDrill(player,item)){drillStates.delete(player.id);return;}
  play(player.dimension,"lb.spike_drill.dig",loc,0.62,0.9+Math.random()*0.16);
  try{player.dimension.spawnParticle("lb:slasher_spark_particle",{x:loc.x+0.5,y:loc.y+0.5,z:loc.z+0.5});}catch{}
  if(tick-state.lastLoop>=28){state.lastLoop=tick;play(player.dimension,"lb.spike_drill.loop",player.location,0.42,1);}
  actionbar(player,"§6Spike Drill §8— §fHeat "+heat+"/120 §7| Momentum "+Math.round(ramp*100)+"%");
  if(heat>=HEAT_MAX){
    drillStates.delete(player.id);drillCooldown.set(player.id,tick+OVERHEAT_COOLDOWN);
    try{player.applyDamage(2,{cause:mc.EntityDamageCause.fire});}catch{}
    play(player.dimension,"random.fizz",player.location,0.8,0.88);
    actionbar(player,"§cSpike Drill overheated §7— 2 s lockout");
  }
}
function coolInventoryDrills(){
  for(const player of mc.world.getAllPlayers()){
    if(drillStates.has(player.id))continue;
    let inv;try{inv=player.getComponent("inventory")?.container;}catch{}
    if(!inv)continue;
    for(let i=0;i<inv.size;i++){
      const item=inv.getItem(i);if(item?.typeId!==DRILL)continue;
      let heat=drillHeat(item);if(heat<=0)continue;
      let delay=Math.max(0,Number(item.getDynamicProperty("lb:drill_cool_delay")??0));
      if(delay>0){item.setDynamicProperty("lb:drill_cool_delay",Math.max(0,delay-20));inv.setItem(i,item);continue;}
      setDrillHeat(item,heat-1);inv.setItem(i,item);
    }
  }
}
function snowCool(){
  for(const player of mc.world.getAllPlayers()){
    if(!player.isSneaking||(snowCoolCooldown.get(player.id)??0)>tick)continue;
    const main=heldSlot(player),drill=main?.getItem(),off=offhandSlot(player),snow=off?.getItem();
    if(!main||drill?.typeId!==DRILL||snow?.typeId!=="minecraft:snowball"||drillHeat(drill)<=0)continue;
    stopDrill(player);
    setDrillHeat(drill,drillHeat(drill)-30);drill.setDynamicProperty("lb:drill_cool_delay",60);main.setItem(drill);
    try{if(player.getGameMode()!==mc.GameMode.Creative){if(snow.amount<=1)off.setItem(undefined);else{snow.amount-=1;off.setItem(snow);}}}catch{}
    snowCoolCooldown.set(player.id,tick+20);play(player.dimension,"random.fizz",player.location,0.75,1.05);
    actionbar(player,"§bSpike Drill quenched §8— §fHeat "+drillHeat(drill)+"/120");
  }
}

mc.world.afterEvents.itemStartUse.subscribe(event=>{
  const player=event.source;if(!(player instanceof mc.Player))return;
  if(event.itemStack.typeId===JAVELIN){
    if((javelinCooldown.get(player.id)??0)>tick)return;
    javelinStarts.set(player.id,tick);play(player.dimension,"lb.javelin.aiming",player.location,0.5,1);
  }else if(event.itemStack.typeId===DRILL){
    startDrill(player);
  }
});
mc.world.afterEvents.itemReleaseUse.subscribe(event=>{
  const player=event.source;if(!(player instanceof mc.Player))return;
  if(event.itemStack?.typeId===JAVELIN||held(player)?.typeId===JAVELIN){
    const start=javelinStarts.get(player.id);javelinStarts.delete(player.id);if(start!==undefined)throwJavelin(player,Math.max(0,tick-start));
  }
});
mc.world.afterEvents.itemStopUse.subscribe(event=>{
  const player=event.source;if(!(player instanceof mc.Player))return;
  javelinStarts.delete(player.id);
  if(event.itemStack?.typeId===DRILL||held(player)?.typeId===DRILL)stopDrill(player);
});

mc.system.runInterval(()=>{
  tick++;
  for(const [id,state] of [...drillStates.entries()]){
    const player=mc.world.getAllPlayers().find(p=>p.id===id);
    if(!player){drillStates.delete(id);continue;}
    breakWithDrill(player,state);
  }
  tickJavelins();
  if(tick%20===0){coolInventoryDrills();snowCool();}
},1);
