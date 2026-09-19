import * as mc from "@minecraft/server";

const WIZARD_HAT="lb:wizard_hat";
const SUNGLASSES="lb:threat_sunglasses";
const TONIC="lb:fortune_tonic";
const STEP=20;
let scanTick=0;

function headItem(player){
  try{return player.getComponent("equippable")?.getEquipmentSlot(mc.EquipmentSlot.Head)?.getItem();}
  catch{return undefined;}
}
function distSq(a,b){const dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z;return dx*dx+dy*dy+dz*dz;}
function actionbar(player,text){try{player.onScreenDisplay.setActionBar(text);}catch{}}

export function hasWizardHat(player){
  return headItem(player)?.typeId===WIZARD_HAT;
}

function refreshThreatLens(player){
  try{player.addEffect("minecraft:night_vision",120,{amplifier:0,showParticles:false});}catch{}
  try{player.removeEffect("minecraft:blindness");}catch{}
  try{player.removeEffect("minecraft:darkness");}catch{}
  if(scanTick%40!==0)return;
  let monsters=[];
  try{monsters=player.dimension.getEntities({location:player.location,maxDistance:24,families:["monster"]}).filter(e=>e.id!==player.id);}catch{}
  if(!monsters.length){actionbar(player,"§bThreat Lens §8— §aClear within 24m");return;}
  let nearest,nearestSq=Infinity;
  for(const entity of monsters){
    const d=distSq(entity.location,player.location);
    if(d<nearestSq){nearestSq=d;nearest=entity;}
  }
  actionbar(player,"§bThreat Lens §8— §c"+monsters.length+" hostile"+(monsters.length===1?"":"s")+" §7| nearest "+Math.round(Math.sqrt(nearestSq))+"m");
}

mc.system.runInterval(()=>{
  scanTick+=STEP;
  for(const player of mc.world.getAllPlayers()){
    if(headItem(player)?.typeId===SUNGLASSES)refreshThreatLens(player);
  }
},STEP);

mc.world.afterEvents.itemCompleteUse.subscribe(event=>{
  if(event.itemStack?.typeId!==TONIC)return;
  const player=event.source;
  if(!(player instanceof mc.Player))return;
  try{player.addEffect("minecraft:absorption",1200,{amplifier:0,showParticles:false});}catch{}
  try{player.addEffect("minecraft:resistance",160,{amplifier:0,showParticles:false});}catch{}
  try{player.addEffect("minecraft:regeneration",80,{amplifier:0,showParticles:false});}catch{}
  try{player.playSound("random.orb",{volume:0.45,pitch:1.18});}catch{}
  actionbar(player,"§bFortune Tonic §8— §eGuarded surge");
});
