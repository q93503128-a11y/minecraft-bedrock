import { system, world, BlockPermutation } from "@minecraft/server";

let bossTick = 0;

function distSq(a,b){
  const dx=a.x-b.x, dy=a.y-b.y, dz=a.z-b.z;
  return dx*dx+dy*dy+dz*dz;
}

function playersNear(entity,maxDistance){
  const maxSq=maxDistance*maxDistance;
  return world.getAllPlayers().filter(p=>p.dimension.id===entity.dimension.id&&distSq(p.location,entity.location)<=maxSq);
}

function nearestPlayer(entity,maxDistance){
  let best; let bestSq=maxDistance*maxDistance;
  for(const p of world.getAllPlayers()){
    if(p.dimension.id!==entity.dimension.id) continue;
    const d=distSq(p.location,entity.location);
    if(d<bestSq){best=p;bestSq=d;}
  }
  return best;
}

function phaseFor(entity){
  const health=entity.getComponent("minecraft:health");
  if(!health) return 1;
  const r=health.currentValue/Math.max(1,health.effectiveMax);
  if(r<=0.25) return 4;
  if(r<=0.50) return 3;
  if(r<=0.75) return 2;
  return 1;
}

function sound(entity,id,volume=1,pitch=1){
  try{entity.dimension.playSound(id,entity.location,{volume,pitch});}catch{}
}
function particle(dimension,id,location){
  try{dimension.spawnParticle(id,location);}catch{}
}
function animate(entity,id){
  try{entity.playAnimation(id,{blendOutTime:0.1});}catch{}
}

function groundAt(dimension,x,startY,z){
  const top=Math.min(250,Math.floor(startY)+8);
  const bottom=Math.max(-60,Math.floor(startY)-18);
  for(let y=top;y>=bottom;y--){
    const block=dimension.getBlock({x,y,z});
    const above=dimension.getBlock({x,y:y+1,z});
    if(!block||!above) continue;
    if(block.typeId!=="minecraft:air"&&above.typeId==="minecraft:air") return {x,y:y+1,z};
  }
  return undefined;
}

function clearRunePositions(entity){
  const raw=entity.getDynamicProperty("lb:obsidilith_runes");
  if(typeof raw!=="string") return;
  try{
    for(const pos of JSON.parse(raw)){
      const block=entity.dimension.getBlock(pos);
      if(block?.typeId==="lb:obsidilith_rune") block.setPermutation(BlockPermutation.resolve("minecraft:air"));
    }
  }catch{}
  entity.setDynamicProperty("lb:obsidilith_runes","");
}

function startRuneShield(entity,phase){
  clearRunePositions(entity);
  const positions=[];
  const radius=phase===4?10:9;
  for(let i=0;i<4;i++){
    const a=(Math.PI*2*i)/4+phase*0.32;
    const x=Math.floor(entity.location.x+Math.cos(a)*radius);
    const z=Math.floor(entity.location.z+Math.sin(a)*radius);
    const pos=groundAt(entity.dimension,x,entity.location.y,z);
    if(!pos) continue;
    const block=entity.dimension.getBlock(pos);
    if(!block||block.typeId!=="minecraft:air") continue;
    try{
      block.setPermutation(BlockPermutation.resolve("lb:obsidilith_rune"));
      positions.push(pos);
      particle(entity.dimension,"lb:obsidilith_indicator",{x:pos.x+0.5,y:pos.y+1.2,z:pos.z+0.5});
    }catch{}
  }

  if(!positions.length) return;
  entity.setDynamicProperty("lb:obsidilith_runes",JSON.stringify(positions));
  entity.setDynamicProperty("lb:obsidilith_exposed_until",0);
  try{entity.triggerEvent("lb:shield_on");}catch{}
  animate(entity,"animation.lb.obsidilith.summon");
  sound(entity,"lb.obsidilith.prepare",1.35,0.82+phase*0.05);
  for(const p of playersNear(entity,48)){
    try{p.sendMessage("§5[Obsidilith] 룬 실드 활성화! 주변의 보라색 룬 4개를 파괴하세요.");}catch{}
  }
}

function updateRuneShield(entity){
  const raw=entity.getDynamicProperty("lb:obsidilith_runes");
  if(typeof raw!=="string"||!raw) return;
  let positions;
  try{positions=JSON.parse(raw);}catch{return;}
  let alive=0;
  for(const pos of positions){
    if(entity.dimension.getBlock(pos)?.typeId==="lb:obsidilith_rune") alive++;
  }
  entity.setDynamicProperty("lb:obsidilith_runes_left",alive);
  if(alive>0) return;

  entity.setDynamicProperty("lb:obsidilith_runes","");
  try{entity.triggerEvent("lb:expose");}catch{}
  entity.setDynamicProperty("lb:obsidilith_exposed_until",bossTick+80);
  sound(entity,"lb.obsidilith.burst",1.2,1.0);
  particle(entity.dimension,"lb:obsidilith_burst",{x:entity.location.x,y:entity.location.y+2,z:entity.location.z});
  for(const p of playersNear(entity,48)){
    try{p.sendMessage("§d[Obsidilith] 실드 붕괴! 4초 동안 받는 피해가 증가합니다.");}catch{}
  }
}

function closeExposure(entity){
  const until=Number(entity.getDynamicProperty("lb:obsidilith_exposed_until")??0);
  if(until>0&&bossTick>=until){
    try{entity.triggerEvent("lb:shield_off");}catch{}
    entity.setDynamicProperty("lb:obsidilith_exposed_until",0);
  }
}

function burstAttack(entity,phase){
  entity.setDynamicProperty("lb:obsidilith_busy_until",bossTick+34);
  sound(entity,"lb.obsidilith.prepare",1.3,0.72);
  const radius=phase>=4?10:phase>=3?9:8;
  for(let i=0;i<18;i++){
    const a=Math.PI*2*i/18;
    const p={x:entity.location.x+Math.cos(a)*radius,y:entity.location.y+0.2,z:entity.location.z+Math.sin(a)*radius};
    particle(entity.dimension,"lb:obsidilith_indicator",p);
  }
  system.runTimeout(()=>{
    if(!entity.isValid) return;
    sound(entity,"lb.obsidilith.burst",1.35,0.92);
    for(let i=0;i<18;i++){
      const a=Math.PI*2*i/18;
      const p={x:entity.location.x+Math.cos(a)*radius,y:entity.location.y+0.4,z:entity.location.z+Math.sin(a)*radius};
      particle(entity.dimension,"lb:obsidilith_burst",p);
    }
    for(const p of playersNear(entity,radius+1)){
      const dx=p.location.x-entity.location.x;
      const dz=p.location.z-entity.location.z;
      const horizontal=Math.sqrt(dx*dx+dz*dz);
      if(horizontal<radius-2.2||horizontal>radius+1.4) continue;
      try{p.applyDamage(phase>=4?28:24);}catch{}
      const len=Math.max(0.001,horizontal);
      try{p.applyImpulse({x:dx/len*0.4,y:0.9,z:dz/len*0.4});}catch{}
    }
  },28);
}

function spikeAttack(entity,target,phase){
  entity.setDynamicProperty("lb:obsidilith_busy_until",bossTick+48);
  sound(entity,"lb.obsidilith.prepare",1.25,1.18);
  const points=[];
  for(let i=0;i<3+(phase>=4?1:0);i++){
    const delay=i*10;
    const pos={x:target.location.x+(Math.random()-0.5)*2.4,y:target.location.y,z:target.location.z+(Math.random()-0.5)*2.4};
    points.push(pos);
    system.runTimeout(()=>{
      if(!entity.isValid) return;
      sound(entity,"lb.obsidilith.spike_indicator",0.85,1.0);
      particle(entity.dimension,"lb:obsidilith_indicator",{x:pos.x,y:pos.y+0.15,z:pos.z});
    },delay);
    system.runTimeout(()=>{
      if(!entity.isValid) return;
      sound(entity,"lb.obsidilith.spike",1.15,1.0);
      particle(entity.dimension,"lb:obsidilith_wave",{x:pos.x,y:pos.y+0.6,z:pos.z});
      for(const p of playersNear(entity,56)){
        const dx=p.location.x-pos.x, dz=p.location.z-pos.z;
        if(dx*dx+dz*dz>5.0) continue;
        try{p.applyDamage(phase>=4?32:27);}catch{}
        try{p.addEffect("slowness",100,{amplifier:2});}catch{}
      }
    },delay+20);
  }
}

function waveAttack(entity,target,phase){
  entity.setDynamicProperty("lb:obsidilith_busy_until",bossTick+42);
  sound(entity,"lb.obsidilith.wave_indicator",1.1,0.9);
  const dx=target.location.x-entity.location.x;
  const dz=target.location.z-entity.location.z;
  const len=Math.max(0.001,Math.sqrt(dx*dx+dz*dz));
  const ux=dx/len, uz=dz/len;
  const points=[];
  const count=phase>=4?7:6;
  for(let i=1;i<=count;i++){
    points.push({x:entity.location.x+ux*i*3.2,y:target.location.y,z:entity.location.z+uz*i*3.2});
  }
  for(let i=0;i<points.length;i++){
    const pos=points[i];
    system.runTimeout(()=>{
      if(!entity.isValid) return;
      particle(entity.dimension,"lb:obsidilith_indicator",{x:pos.x,y:pos.y+0.1,z:pos.z});
    },i*4);
    system.runTimeout(()=>{
      if(!entity.isValid) return;
      particle(entity.dimension,"lb:obsidilith_wave",{x:pos.x,y:pos.y+0.55,z:pos.z});
      for(const p of playersNear(entity,56)){
        const px=p.location.x-pos.x,pz=p.location.z-pos.z;
        if(px*px+pz*pz>6.25) continue;
        try{p.applyDamage(phase>=4?26:21);}catch{}
        try{p.applyImpulse({x:0,y:0.75,z:0});}catch{}
      }
    },20+i*4);
  }
}

function tickBoss(entity){
  const phase=phaseFor(entity);
  const previous=Number(entity.getDynamicProperty("lb:obsidilith_phase")??0);
  if(previous===0){
    entity.setDynamicProperty("lb:obsidilith_phase",1);
    animate(entity,"animation.lb.obsidilith.summon");
  }else if(phase>previous){
    entity.setDynamicProperty("lb:obsidilith_phase",phase);
    startRuneShield(entity,phase);
  }

  updateRuneShield(entity);
  closeExposure(entity);

  const busy=Number(entity.getDynamicProperty("lb:obsidilith_busy_until")??0);
  if(bossTick<busy) return;

  const next=Number(entity.getDynamicProperty("lb:obsidilith_next_action")??0);
  if(bossTick<next) return;
  const target=nearestPlayer(entity,48);
  if(!target) return;

  const cooldown=phase===4?48:phase===3?58:phase===2?68:82;
  entity.setDynamicProperty("lb:obsidilith_next_action",bossTick+cooldown+Math.floor(Math.random()*18));

  const roll=Math.random();
  if(roll<0.34) burstAttack(entity,phase);
  else if(roll<0.68) spikeAttack(entity,target,phase);
  else waveAttack(entity,target,phase);
}

system.runInterval(()=>{
  bossTick=world.getAbsoluteTime();
  for(const dimId of ["overworld","nether","the_end"]){
    const dimension=world.getDimension(dimId);
    for(const entity of dimension.getEntities({type:"lb:obsidilith"})){
      try{tickBoss(entity);}catch{}
    }
  }
},5);

world.afterEvents.entityDie.subscribe(event=>{
  if(event.deadEntity.typeId!=="lb:obsidilith") return;
  try{clearRunePositions(event.deadEntity);}catch{}
});
