import * as mc from "@minecraft/server";
import { shootFastAtkBeam, shootChargedAtkBeam } from "./slasher/beam.js";

const TYPE="lb:slasher";
const FAST_COOLDOWN=7;
const SPECIAL_COOLDOWN=36;
const EXTRA_MELEE=20;
let tick=0;
const nextFast=new Map();
const nextSpecial=new Map();
const swingSide=new Map();
mc.system.runInterval(()=>{tick++;},1);

function held(player){try{return player.getComponent("equippable")?.getEquipmentSlot(mc.EquipmentSlot.Mainhand)?.getItem();}catch{return undefined;}}
function canDamage(source,target){
  if(!target?.isValid||target===source)return false;
  if(target.typeId==="minecraft:item"||target.typeId==="minecraft:xp_orb")return false;
  if(target instanceof mc.Player){
    if(mc.world.gameRules.pvp!==true)return false;
    try{const gm=target.getGameMode();if(gm===mc.GameMode.Creative||gm===mc.GameMode.Spectator)return false;}catch{}
  }
  return true;
}
function actionbar(player,text){try{player.onScreenDisplay.setActionBar(text);}catch{}}
function feedback(player,special=false){
  try{player.dimension.playSound(special?"slasher.charged_atk":"slasher.fast_atk",player.getHeadLocation(),{volume:special?1.1:.85,pitch:special?0.95:1.02});}catch{}
  try{
    if(special)player.playAnimation("animation.slasher.tp.charged_atk_start");
    else{const side=(swingSide.get(player.id)??0)^1;swingSide.set(player.id,side);player.playAnimation(side?"animation.slasher.tp.fast_atk_1":"animation.slasher.tp.fast_atk_2");}
  }catch{}
}
function damageDurability(player,amount=1){
  try{
    if(player.getGameMode()===mc.GameMode.Creative)return;
    const slot=player.getComponent("equippable")?.getEquipmentSlot(mc.EquipmentSlot.Mainhand);
    const item=slot?.getItem();if(!slot||item?.typeId!==TYPE)return;
    const d=item.getComponent("durability");if(!d)return;
    d.damage=Math.min(d.maxDurability,d.damage+amount);
    if(d.damage>=d.maxDurability){slot.setItem(undefined);player.playSound("random.break",{volume:.8,pitch:.9});}
    else slot.setItem(item);
  }catch{}
}

mc.world.afterEvents.entityHitEntity.subscribe(event=>{
  const player=event.damagingEntity,target=event.hitEntity;
  if(!(player instanceof mc.Player)||held(player)?.typeId!==TYPE||!canDamage(player,target))return;
  if((nextFast.get(player.id)??0)>tick)return;
  nextFast.set(player.id,tick+FAST_COOLDOWN);
  feedback(player,false);
  try{target.applyDamage(EXTRA_MELEE,{cause:mc.EntityDamageCause.entityAttack,damagingEntity:player});}catch{}
  try{shootFastAtkBeam(player);}catch{}
  damageDurability(player,1);
});

mc.world.afterEvents.itemStartUse.subscribe(event=>{
  const player=event.source;
  if(!(player instanceof mc.Player)||event.itemStack?.typeId!==TYPE)return;
  const ready=nextSpecial.get(player.id)??0;
  if(ready>tick){actionbar(player,"§cSlasher §8— §7Charged beam "+((ready-tick)/20).toFixed(1)+"s");return;}
  nextSpecial.set(player.id,tick+SPECIAL_COOLDOWN);
  feedback(player,true);
  try{shootChargedAtkBeam(player);}catch{}
  damageDurability(player,2);
  actionbar(player,"§cSlasher §8— §fCharged beam");
});

mc.world.beforeEvents.playerLeave.subscribe(event=>{
  const id=event.player?.id;if(!id)return;
  nextFast.delete(id);nextSpecial.delete(id);swingSide.delete(id);
});
