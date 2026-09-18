import * as mc from "@minecraft/server";

const WEAPON="lb:amethyst_repeater";
const AMMO="lb:amethyst_charge";
const SHOTS=3;
const RANGE=32;
const SHOT_DAMAGE=12;
const SHOT_SPACING=4;
const COOLDOWN=24;
let tick=0;
const readyAt=new Map();
mc.system.runInterval(()=>{tick++;},1);

function actionbar(player,text){try{player.onScreenDisplay.setActionBar(text);}catch{}}
function canDamage(source,entity){
  if(!entity?.isValid||entity===source)return false;
  if(entity.typeId==="minecraft:item"||entity.typeId==="minecraft:xp_orb")return false;
  if(entity instanceof mc.Player){
    if(!mc.world.gameRules.pvp)return false;
    try{const mode=entity.getGameMode();if(mode===mc.GameMode.Creative||mode===mc.GameMode.Spectator)return false;}catch{}
  }
  return true;
}
function inventory(player){try{return player.getComponent("minecraft:inventory")?.container;}catch{return undefined;}}
function hasAmmo(player){
  try{if(player.getGameMode()===mc.GameMode.Creative)return true;}catch{}
  const inv=inventory(player);if(!inv)return false;
  for(let i=0;i<inv.size;i++)if(inv.getItem(i)?.typeId===AMMO)return true;
  return false;
}
function consumeAmmo(player){
  try{if(player.getGameMode()===mc.GameMode.Creative)return true;}catch{}
  const inv=inventory(player);if(!inv)return false;
  for(let i=0;i<inv.size;i++){
    const item=inv.getItem(i);if(item?.typeId!==AMMO)continue;
    if(item.amount<=1)inv.setItem(i,undefined);else{item.amount-=1;inv.setItem(i,item);}
    return true;
  }
  return false;
}
function damageWeapon(player){
  try{
    const slot=player.getComponent("equippable")?.getEquipmentSlot(mc.EquipmentSlot.Mainhand);
    const item=slot?.getItem();if(!slot||item?.typeId!==WEAPON)return;
    const d=item.getComponent("durability");if(!d)return;
    d.damage=Math.min(d.maxDurability,d.damage+1);
    if(d.damage>=d.maxDurability){slot.setItem(undefined);player.playSound("random.break",{volume:0.8,pitch:1.1});}
    else slot.setItem(item);
  }catch{}
}
function blockDistance(player,origin,dir){
  try{
    const hit=player.dimension.getBlockFromRay(origin,dir,{maxDistance:RANGE,includePassableBlocks:false,includeLiquidBlocks:false});
    if(!hit)return RANGE;
    const p={x:hit.block.location.x+hit.faceLocation.x,y:hit.block.location.y+hit.faceLocation.y,z:hit.block.location.z+hit.faceLocation.z};
    const dx=p.x-origin.x,dy=p.y-origin.y,dz=p.z-origin.z;
    return Math.min(RANGE,Math.sqrt(dx*dx+dy*dy+dz*dz));
  }catch{return RANGE;}
}
function firstTarget(player,origin,dir,maxDistance){
  try{
    const hits=player.dimension.getEntitiesFromRay(origin,dir,{maxDistance,ignoreBlockCollision:false,includePassableBlocks:false,includeLiquidBlocks:false});
    hits.sort((a,b)=>a.distance-b.distance);
    for(const hit of hits)if(canDamage(player,hit.entity))return hit;
  }catch{}
}
function trail(dimension,origin,dir,distance){
  for(let d=2;d<distance;d+=4){
    try{dimension.spawnParticle("lb:obsidilith_indicator",{x:origin.x+dir.x*d,y:origin.y+dir.y*d,z:origin.z+dir.z*d});}catch{}
  }
}
function fireShot(player,shotIndex){
  if(!player?.isValid)return false;
  let held;try{held=player.getComponent("equippable")?.getEquipmentSlot(mc.EquipmentSlot.Mainhand)?.getItem();}catch{}
  if(held?.typeId!==WEAPON)return false;
  if(!consumeAmmo(player)){actionbar(player,"§5Amethyst Repeater §8— §cNo Amethyst Charge");return false;}
  const origin=player.getHeadLocation(),dir=player.getViewDirection();
  const wall=blockDistance(player,origin,dir);
  const hit=firstTarget(player,origin,dir,wall+0.05);
  const distance=hit?Math.min(wall,hit.distance):wall;
  trail(player.dimension,origin,dir,distance);
  if(hit){
    try{hit.entity.applyDamage(SHOT_DAMAGE,{cause:mc.EntityDamageCause.magic,damagingEntity:player});}catch{try{hit.entity.applyDamage(SHOT_DAMAGE);}catch{}}
    try{player.dimension.spawnParticle("lb:obsidilith_burst",hit.entity.location);}catch{}
  }else{
    const end={x:origin.x+dir.x*distance,y:origin.y+dir.y*distance,z:origin.z+dir.z*distance};
    try{player.dimension.spawnParticle("lb:obsidilith_burst",end);}catch{}
  }
  try{player.dimension.playSound("break.amethyst_cluster",player.location,{volume:0.55,pitch:1.10+shotIndex*0.08});}catch{}
  return true;
}
mc.world.afterEvents.itemStartUse.subscribe(event=>{
  if(event.itemStack.typeId!==WEAPON)return;
  const player=event.source;if(!(player instanceof mc.Player))return;
  const next=readyAt.get(player.id)??0;
  if(tick<next){actionbar(player,"§5Amethyst Repeater §8— §d"+((next-tick)/20).toFixed(1)+"s");return;}
  if(!hasAmmo(player)){actionbar(player,"§5Amethyst Repeater §8— §cCraft Amethyst Charges");return;}
  readyAt.set(player.id,tick+COOLDOWN);
  const state={fired:false};
  for(let i=0;i<SHOTS;i++)mc.system.runTimeout(()=>{if(fireShot(player,i))state.fired=true;},i*SHOT_SPACING);
  mc.system.runTimeout(()=>{if(state.fired)damageWeapon(player);},SHOT_SPACING*(SHOTS-1)+1);
});
