import * as mc from "@minecraft/server";

const SPELLS = {
  "lb:tomemancy_meteor_tome": { key: "meteor", cooldown: 240, durability: 4 },
  "lb:tomemancy_gigavolt_tome": { key: "gigavolt", cooldown: 160, durability: 3 },
  "lb:tomemancy_dragon_fireball_tome": { key: "dragon", cooldown: 180, durability: 3 }
};

let clockTick = 0;
const cooldowns = new Map();
mc.system.runInterval(() => { clockTick++; }, 1);

function actionbar(player, text) {
  try { player.onScreenDisplay.setActionBar(text); } catch {}
}
function postDragonUnlocked() {
  return mc.world.getDynamicProperty("lb:post_dragon_unlocked") === true;
}
function cooldownKey(player, key) {
  return player.id + ":" + key;
}
function tryStartCooldown(player, spell) {
  const key = cooldownKey(player, spell.key);
  const readyAt = cooldowns.get(key) ?? 0;
  if (clockTick < readyAt) {
    actionbar(player, "§5Tomemancy §8— §d" + ((readyAt - clockTick) / 20).toFixed(1) + "s");
    return false;
  }
  cooldowns.set(key, clockTick + spell.cooldown);
  return true;
}
function refundCooldown(player, spell) {
  cooldowns.delete(cooldownKey(player, spell.key));
}
function heldSlot(player) {
  try {
    return player.getComponent("equippable")?.getEquipmentSlot(mc.EquipmentSlot.Mainhand);
  } catch {
    return undefined;
  }
}
function damageHeldTome(player, expectedType, amount) {
  const slot = heldSlot(player);
  const item = slot?.getItem();
  if (!slot || !item || item.typeId !== expectedType) return false;
  const durability = item.getComponent("durability");
  if (!durability) return true;
  if (durability.damage >= durability.maxDurability) {
    actionbar(player, "§cThe tome has no power left.");
    return false;
  }
  const nextDamage = Math.min(durability.maxDurability, durability.damage + amount);
  durability.damage = nextDamage;
  try {
    if (nextDamage >= durability.maxDurability) {
      slot.setItem(undefined);
      player.playSound("random.break", { volume: 0.8, pitch: 0.9 });
    } else {
      slot.setItem(item);
    }
  } catch {
    return false;
  }
  return true;
}
function staffFocus(player) {
  try {
    const offhand = player.getComponent("equippable")?.getEquipmentSlot(mc.EquipmentSlot.Offhand)?.getItem();
    return offhand?.typeId === "lb:tomemancy_diamond_staff" ? 1.20 : 1.0;
  } catch {
    return 1.0;
  }
}
function centerOf(entity) {
  try { return entity.getHeadLocation(); }
  catch { return { x: entity.location.x, y: entity.location.y + 0.8, z: entity.location.z }; }
}
function canDamage(source, entity) {
  if (!entity?.isValid || entity === source) return false;
  if (entity.typeId === "minecraft:item" || entity.typeId === "minecraft:xp_orb") return false;
  if (entity instanceof mc.Player) {
    if (!mc.world.gameRules.pvp) return false;
    try {
      const mode = entity.getGameMode();
      if (mode === mc.GameMode.Creative || mode === mc.GameMode.Spectator) return false;
    } catch {}
  }
  return true;
}
function deal(source, entity, amount) {
  if (!canDamage(source, entity)) return false;
  try {
    return entity.applyDamage(Math.max(1, Math.round(amount)), {
      cause: mc.EntityDamageCause.magic ?? mc.EntityDamageCause.override,
      damagingEntity: source
    });
  } catch {
    return false;
  }
}
function findAimTarget(player, maxDistance = 26) {
  const origin = player.getHeadLocation();
  const view = player.getViewDirection();
  let best;
  let bestScore = Infinity;
  for (const entity of player.dimension.getEntities({
    location: origin,
    maxDistance,
    excludeTypes: ["minecraft:item", "minecraft:xp_orb"]
  })) {
    if (!canDamage(player, entity)) continue;
    const c = centerOf(entity);
    const dx=c.x-origin.x, dy=c.y-origin.y, dz=c.z-origin.z;
    const distance=Math.max(0.001,Math.sqrt(dx*dx+dy*dy+dz*dz));
    const dot=(dx*view.x+dy*view.y+dz*view.z)/distance;
    if (dot < 0.86) continue;
    const score=distance+(1-dot)*55;
    if(score<bestScore){ best=entity; bestScore=score; }
  }
  return best;
}
function nearestChainTarget(source, from, excluded, radius) {
  let best;
  let bestDist=radius;
  const a=centerOf(from);
  for(const entity of source.dimension.getEntities({
    location:a,
    maxDistance:radius,
    excludeTypes:["minecraft:item","minecraft:xp_orb"]
  })){
    if(excluded.includes(entity)||!canDamage(source,entity))continue;
    const b=centerOf(entity);
    const d=Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2+(a.z-b.z)**2);
    if(d<bestDist){best=entity;bestDist=d;}
  }
  return best;
}
function lightningVisual(dimension, location) {
  try { dimension.spawnEntity("minecraft:lightning_bolt", location); } catch {}
}
function castMeteor(player, power) {
  const view=player.getViewDirection();
  const horizontal=Math.max(0.001,Math.sqrt(view.x*view.x+view.z*view.z));
  const hx=view.x/horizontal, hz=view.z/horizontal;
  const target={x:player.location.x+hx*10,y:player.location.y+0.2,z:player.location.z+hz*10};
  const origin={x:target.x,y:target.y+10,z:target.z};
  try{
    const meteor=player.dimension.spawnEntity("lb:tomemancy_meteor",origin);
    meteor.setDynamicProperty("lb:tomemancy_source",player.id);
    meteor.setDynamicProperty("lb:tomemancy_power",power);
    meteor.applyImpulse({x:hx*0.05,y:-0.72,z:hz*0.05});
    player.dimension.spawnParticle("lb:tomemancy_flame_summoning",origin);
    player.dimension.playSound("mob.blaze.shoot",player.location,{volume:1.1,pitch:0.65});
    actionbar(player,"§cMeteor");
    return true;
  }catch{return false;}
}
function meteorImpact(projectile) {
  if(!projectile?.isValid)return;
  const impact={...projectile.location};
  const sourceId=projectile.getDynamicProperty("lb:tomemancy_source");
  const power=Number(projectile.getDynamicProperty("lb:tomemancy_power")??1);
  const source=typeof sourceId==="string"?mc.world.getEntity(sourceId):undefined;
  try{projectile.dimension.spawnParticle("lb:tomemancy_flame_summoning",impact);}catch{}
  try{projectile.dimension.playSound("random.explode",impact,{volume:1.35,pitch:0.72});}catch{}
  for(const entity of projectile.dimension.getEntities({
    location:impact,maxDistance:6.2,excludeTypes:["minecraft:item","minecraft:xp_orb"]
  })){
    if(!(source instanceof mc.Player)||!canDamage(source,entity))continue;
    const c=centerOf(entity);
    const dx=c.x-impact.x,dy=c.y-impact.y,dz=c.z-impact.z;
    const d=Math.sqrt(dx*dx+dy*dy+dz*dz);
    const base=d<=2.2?650:460;
    if(deal(source,entity,base*power)){
      try{
        const len=Math.max(0.001,Math.sqrt(dx*dx+dz*dz));
        entity.applyImpulse({x:(dx/len)*0.55,y:0.55,z:(dz/len)*0.55});
      }catch{}
    }
  }
  try{projectile.remove();}catch{}
}
function castGigavolt(player,power){
  const primary=findAimTarget(player,26);
  if(!primary){
    const dir=player.getViewDirection(),p=player.getHeadLocation();
    lightningVisual(player.dimension,{x:p.x+dir.x*15,y:p.y+dir.y*15,z:p.z+dir.z*15});
    actionbar(player,"§eGigavolt");
    return true;
  }
  const targets=[primary];
  for(let i=0;i<3;i++){
    const next=nearestChainTarget(player,targets[targets.length-1],targets,8.5);
    if(!next)break;
    targets.push(next);
  }
  const damages=[420,300,220,160];
  for(let i=0;i<targets.length;i++){
    const target=targets[i];
    lightningVisual(player.dimension,target.location);
    deal(player,target,damages[i]*power);
    try{target.addEffect("slowness",50+i*10,{amplifier:1});}catch{}
  }
  try{player.dimension.playSound("ambient.weather.thunder",primary.location,{volume:0.9,pitch:1.15});}catch{}
  actionbar(player,"§eGigavolt §7x"+targets.length);
  return true;
}
function castDragonFireball(player,power){
  const view=player.getViewDirection(),head=player.getHeadLocation();
  const origin={x:head.x+view.x*1.4,y:head.y+view.y*1.4,z:head.z+view.z*1.4};
  try{
    const projectile=player.dimension.spawnEntity("minecraft:dragon_fireball",origin);
    projectile.setDynamicProperty("lb:tomemancy_source",player.id);
    projectile.setDynamicProperty("lb:tomemancy_power",power);
    projectile.setDynamicProperty("lb:tomemancy_dragon",true);
    projectile.applyImpulse({x:view.x*1.65,y:view.y*1.65,z:view.z*1.65});
    player.dimension.playSound("mob.enderdragon.growl",player.location,{volume:0.7,pitch:1.18});
    actionbar(player,"§dDragon Fireball");
    return true;
  }catch{
    const target=findAimTarget(player,24);
    if(!target)return false;
    deal(player,target,360*power);
    try{target.dimension.spawnParticle("lb:tomemancy_flame_summoning",target.location);}catch{}
    return true;
  }
}
function dragonImpact(projectile,directEntity){
  if(projectile.getDynamicProperty("lb:tomemancy_dragon")!==true)return;
  const sourceId=projectile.getDynamicProperty("lb:tomemancy_source");
  const source=typeof sourceId==="string"?mc.world.getEntity(sourceId):undefined;
  if(!(source instanceof mc.Player))return;
  const power=Number(projectile.getDynamicProperty("lb:tomemancy_power")??1);
  const impact=directEntity?.location??projectile.location;
  if(directEntity&&canDamage(source,directEntity))deal(source,directEntity,360*power);
  for(const entity of projectile.dimension.getEntities({
    location:impact,maxDistance:4.5,excludeTypes:["minecraft:item","minecraft:xp_orb"]
  })){
    if(entity===directEntity)continue;
    deal(source,entity,250*power);
  }
  try{projectile.dimension.spawnParticle("lb:tomemancy_flame_summoning",impact);}catch{}
}
mc.world.afterEvents.itemStartUse.subscribe((event)=>{
  const spell=SPELLS[event.itemStack.typeId];
  if(!spell)return;
  const player=event.source;
  if(!(player instanceof mc.Player))return;
  if(!postDragonUnlocked()){
    actionbar(player,"§5Tomemancy §8— §cDormant until the Ender Dragon is defeated.");
    return;
  }
  if(!tryStartCooldown(player,spell))return;
  if(!damageHeldTome(player,event.itemStack.typeId,spell.durability)){
    refundCooldown(player,spell);
    return;
  }
  const power=staffFocus(player);
  let cast=false;
  if(spell.key==="meteor")cast=castMeteor(player,power);
  else if(spell.key==="gigavolt")cast=castGigavolt(player,power);
  else if(spell.key==="dragon")cast=castDragonFireball(player,power);
  if(!cast){
    refundCooldown(player,spell);
    actionbar(player,"§cThe spell could not form.");
  }
});
mc.world.afterEvents.projectileHitEntity.subscribe((event)=>{
  if(event.projectile.typeId==="lb:tomemancy_meteor"){
    meteorImpact(event.projectile);
    return;
  }
  if(event.projectile.typeId==="minecraft:dragon_fireball"){
    let hit;
    try{hit=event.getEntityHit()?.entity;}catch{}
    dragonImpact(event.projectile,hit);
  }
});
mc.world.afterEvents.projectileHitBlock.subscribe((event)=>{
  if(event.projectile.typeId==="lb:tomemancy_meteor"){
    meteorImpact(event.projectile);
    return;
  }
  if(event.projectile.typeId==="minecraft:dragon_fireball"){
    dragonImpact(event.projectile,undefined);
  }
});
