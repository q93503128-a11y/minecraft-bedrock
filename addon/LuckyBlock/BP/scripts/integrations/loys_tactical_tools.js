import * as mc from "@minecraft/server";

const FLASH="lb:flashbang",SMOKE="lb:smoke_grenade",GUITAR="lb:lucky_guitar";
const FLASH_ENTITY="lb:flashbang_projectile",SMOKE_ENTITY="lb:smoke_grenade_projectile";
const SMOKE_KEY="lb:smoke_zones_v1";
const STEP=5;
const guitarCooldown=new Map();
let tick=0;

function mainhandSlot(player){try{return player.getComponent("equippable")?.getEquipmentSlot(mc.EquipmentSlot.Mainhand);}catch{return undefined;}}
function consumeHeld(player,id){
 try{
  if(player.getGameMode()===mc.GameMode.Creative)return true;
  const slot=mainhandSlot(player),item=slot?.getItem();
  if(!slot||item?.typeId!==id)return false;
  if(item.amount<=1)slot.setItem(undefined);else{item.amount-=1;slot.setItem(item);}
  return true;
 }catch{return false;}
}
function play(d,id,p,v=.8,pi=1){try{d.playSound(id,p,{volume:v,pitch:pi});}catch{}}
function particle(d,id,p){try{d.spawnParticle(id,p);}catch{}}
function throwTool(player,id,type){
 if(!consumeHeld(player,id))return;
 const dir=player.getViewDirection(),head=player.getHeadLocation();
 const pos={x:head.x+dir.x*.8,y:head.y+dir.y*.8-.15,z:head.z+dir.z*.8};
 try{
  const e=player.dimension.spawnEntity(type,pos);
  e.setDynamicProperty("lb:tool_owner",player.id);
  e.setDynamicProperty("lb:tool_age",0);
  e.applyImpulse({x:dir.x*.72,y:dir.y*.72+.12,z:dir.z*.72});
  play(player.dimension,"random.bow",pos,.55,1.2);
 }catch{}
}
function loadSmoke(){try{const raw=mc.world.getDynamicProperty(SMOKE_KEY);return typeof raw==="string"?JSON.parse(raw):[];}catch{return[];}}
function saveSmoke(states){try{mc.world.setDynamicProperty(SMOKE_KEY,JSON.stringify(states.slice(-8)));}catch{}}
function addSmoke(dimension,pos,owner){
 const states=loadSmoke().filter(s=>s&&s.ticks>0);
 states.push({id:Date.now().toString(36)+"_"+Math.floor(Math.random()*1e6).toString(36),dimension:dimension.id,x:pos.x,y:pos.y,z:pos.z,ticks:180,owner});
 saveSmoke(states);
}
function flashDetonate(e){
 const d=e.dimension,p=e.location,owner=e.getDynamicProperty("lb:tool_owner");
 particle(d,"minecraft:huge_explosion_emitter",{x:p.x,y:p.y+.2,z:p.z});
 play(d,"random.explode",p,.8,1.35);
 for(const target of d.getEntities({location:p,maxDistance:9})){
  if(target.typeId===FLASH_ENTITY||target.typeId===SMOKE_ENTITY||target.typeId==="minecraft:item"||target.typeId==="minecraft:xp_orb")continue;
  if(target instanceof mc.Player){
   if(target.id!==owner&&mc.world.gameRules.pvp!==true)continue;
   try{target.addEffect("blindness",45,{amplifier:0,showParticles:false});target.addEffect("slowness",25,{amplifier:1,showParticles:false});}catch{}
  }else{
   try{target.addEffect("blindness",100,{amplifier:0,showParticles:false});target.addEffect("slowness",70,{amplifier:2,showParticles:false});target.addEffect("weakness",80,{amplifier:1,showParticles:false});}catch{}
  }
 }
 try{e.remove();}catch{}
}
function smokeDetonate(e){
 const p={...e.location},d=e.dimension,owner=e.getDynamicProperty("lb:tool_owner");
 for(let i=0;i<10;i++)particle(d,"minecraft:basic_smoke_particle",{x:p.x+(Math.random()-.5)*2,y:p.y+.2+Math.random()*1.2,z:p.z+(Math.random()-.5)*2});
 play(d,"random.fizz",p,.85,.75);
 addSmoke(d,p,owner);
 try{e.remove();}catch{}
}
function tickProjectiles(){
 for(const id of ["overworld","nether","the_end"]){
  let d;try{d=mc.world.getDimension(id);}catch{continue;}
  for(const e of d.getEntities({type:FLASH_ENTITY})){
   const age=Number(e.getDynamicProperty("lb:tool_age")??0)+STEP;e.setDynamicProperty("lb:tool_age",age);
   if(age>=35)flashDetonate(e);
  }
  for(const e of d.getEntities({type:SMOKE_ENTITY})){
   const age=Number(e.getDynamicProperty("lb:tool_age")??0)+STEP;e.setDynamicProperty("lb:tool_age",age);
   if(age>=25)smokeDetonate(e);
  }
 }
}
function tickSmoke(){
 const states=loadSmoke(),next=[];
 for(const s of states){
  if(!s||s.ticks<=0)continue;
  let d;try{d=mc.world.getDimension(String(s.dimension).replace("minecraft:",""));}catch{continue;}
  const p={x:Number(s.x),y:Number(s.y),z:Number(s.z)};
  for(let i=0;i<8;i++)particle(d,"minecraft:basic_smoke_particle",{x:p.x+(Math.random()-.5)*5.5,y:p.y+.2+Math.random()*2,z:p.z+(Math.random()-.5)*5.5});
  for(const target of d.getEntities({location:p,maxDistance:6})){
   if(target.typeId==="minecraft:item"||target.typeId==="minecraft:xp_orb"||target.typeId===FLASH_ENTITY||target.typeId===SMOKE_ENTITY)continue;
   if(target instanceof mc.Player){
    try{target.addEffect("invisibility",20,{amplifier:0,showParticles:false});}catch{}
   }else{
    try{target.addEffect("blindness",20,{amplifier:0,showParticles:false});target.addEffect("slowness",20,{amplifier:1,showParticles:false});}catch{}
   }
  }
  s.ticks-=STEP;if(s.ticks>0)next.push(s);
 }
 saveSmoke(next);
}
function strum(player){
 if((guitarCooldown.get(player.id)??0)>tick){try{player.onScreenDisplay.setActionBar("§6Lucky Guitar §8— §7Encore recharging");}catch{};return;}
 guitarCooldown.set(player.id,tick+300);
 const p=player.location,d=player.dimension;
 play(d,"random.levelup",p,.55,.75);
 mc.system.runTimeout(()=>play(d,"random.orb",p,.5,1.0),3);
 mc.system.runTimeout(()=>play(d,"random.pop",p,.45,1.35),6);
 for(let i=0;i<10;i++)particle(d,"lb:slasher_spark_particle",{x:p.x+(Math.random()-.5)*3,y:p.y+.5+Math.random()*2,z:p.z+(Math.random()-.5)*3});
 for(const ally of mc.world.getAllPlayers()){
  if(ally.dimension.id!==d.id)continue;
  const dx=ally.location.x-p.x,dy=ally.location.y-p.y,dz=ally.location.z-p.z;
  if(dx*dx+dy*dy+dz*dz>10*10)continue;
  try{ally.addEffect("regeneration",50,{amplifier:0,showParticles:true});ally.addEffect("speed",120,{amplifier:0,showParticles:true});ally.sendMessage("§6[Lucky Guitar] §fEncore!");}catch{}
 }
}
mc.world.afterEvents.itemStartUse.subscribe(event=>{
 const p=event.source;if(!(p instanceof mc.Player))return;
 if(event.itemStack?.typeId===FLASH)throwTool(p,FLASH,FLASH_ENTITY);
 else if(event.itemStack?.typeId===SMOKE)throwTool(p,SMOKE,SMOKE_ENTITY);
 else if(event.itemStack?.typeId===GUITAR)strum(p);
});
mc.system.runInterval(()=>{tick+=STEP;tickProjectiles();tickSmoke();},STEP);
