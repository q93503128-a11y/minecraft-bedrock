import * as mc from "@minecraft/server";

const SET={
  [mc.EquipmentSlot.Head]:"lb:tomemancy_mystical_helmet",
  [mc.EquipmentSlot.Chest]:"lb:tomemancy_mystical_chestplate",
  [mc.EquipmentSlot.Legs]:"lb:tomemancy_mystical_leggings",
  [mc.EquipmentSlot.Feet]:"lb:tomemancy_mystical_boots"
};
const STEP=20;
const OUT_OF_COMBAT=120;
const RECHARGE=200;
const WARD_DURATION=160;
let tick=0;
const lastHurt=new Map();
const nextWard=new Map();

function itemAt(player,slot){
  try{return player.getComponent("equippable")?.getEquipmentSlot(slot)?.getItem();}catch{return undefined;}
}
function fullSet(player){
  for(const [slot,id] of Object.entries(SET)){
    const numeric=Number(slot);
    const actual=Number.isNaN(numeric)?slot:numeric;
    if(itemAt(player,actual)?.typeId!==id)return false;
  }
  return true;
}
function rechargeWard(player){
  try{
    player.addEffect("minecraft:absorption",WARD_DURATION,{amplifier:1,showParticles:false});
    player.playSound("break.amethyst_cluster",{volume:0.45,pitch:0.72});
    player.dimension.spawnParticle("lb:obsidilith_indicator",{x:player.location.x,y:player.location.y+1,z:player.location.z});
    player.onScreenDisplay.setActionBar("§dMystical Aegis §8— §fWard recharged");
  }catch{}
}
mc.world.afterEvents.entityHurt.subscribe(event=>{
  const player=event.hurtEntity;
  if(!(player instanceof mc.Player)||!fullSet(player))return;
  lastHurt.set(player.id,tick);
  nextWard.set(player.id,Math.max(nextWard.get(player.id)??0,tick+OUT_OF_COMBAT));
});
mc.system.runInterval(()=>{
  tick+=STEP;
  for(const player of mc.world.getAllPlayers()){
    if(!fullSet(player)){
      lastHurt.delete(player.id);
      nextWard.delete(player.id);
      continue;
    }
    const hurtAt=lastHurt.get(player.id)??-999999;
    const readyAt=nextWard.get(player.id)??0;
    if(tick-hurtAt<OUT_OF_COMBAT||tick<readyAt)continue;
    rechargeWard(player);
    nextWard.set(player.id,tick+RECHARGE);
  }
},STEP);
