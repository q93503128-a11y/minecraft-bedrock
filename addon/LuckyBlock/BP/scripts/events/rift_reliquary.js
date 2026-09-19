import * as mc from "@minecraft/server";

const STATE_KEY="lb:rift_reliquary_states_v1";
const COUNTER_KEY="lb:rift_reliquary_counter_v1";
const STEP=10;
const MAX_ACTIVE=2;
const RADIUS=96;

function dimKey(id){if(id.includes("nether"))return"nether";if(id.includes("end"))return"the_end";return"overworld";}
function distSq(a,b){const dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z;return dx*dx+dy*dy+dz*dz;}
function load(){const raw=mc.world.getDynamicProperty(STATE_KEY);if(typeof raw!=="string"||!raw)return[];try{const v=JSON.parse(raw);return Array.isArray(v)?v:[];}catch{return[];}}
function save(v){mc.world.setDynamicProperty(STATE_KEY,JSON.stringify(v));}
function nextId(){const n=Number(mc.world.getDynamicProperty(COUNTER_KEY)??0)+1;mc.world.setDynamicProperty(COUNTER_KEY,n);return n;}
function playersNear(d,c,r=RADIUS){const rr=r*r;return mc.world.getAllPlayers().filter(p=>p.dimension.id===d.id&&distSq(p.location,c)<=rr);}
function msg(d,c,t){for(const p of playersNear(d,c))try{p.sendMessage(t);}catch{}}
function particle(d,id,p){try{d.spawnParticle(id,p);}catch{}}
function sound(d,id,p,o){try{d.playSound(id,p,o);}catch{}}
function spawnItem(d,p,id,count){try{d.spawnItem(new mc.ItemStack(id,count),{x:p.x,y:p.y+0.7,z:p.z});}catch{}}
function tag(s){return"lb_reliquary_"+s.id;}
function enemies(s,d){try{return d.getEntities({tags:[tag(s)]});}catch{return[];}}
function cleanup(s,d){for(const e of enemies(s,d))try{e.remove();}catch{}}
function groundAt(d,x,startY,z){
  const bx=Math.floor(x),bz=Math.floor(z),top=Math.min(250,Math.floor(startY)+12),bottom=Math.max(-60,Math.floor(startY)-24);
  for(let y=top;y>=bottom;y--){
    const g=d.getBlock({x:bx,y,z:bz}),a=d.getBlock({x:bx,y:y+1,z:bz}),a2=d.getBlock({x:bx,y:y+2,z:bz});
    if(!g||!a||!a2)continue;
    if(g.typeId!=="minecraft:air"&&a.typeId==="minecraft:air"&&a2.typeId==="minecraft:air")return{x:bx,y:y+1,z:bz};
  }
}
function clearSite(d,c){
  const bx=Math.floor(c.x),by=Math.floor(c.y),bz=Math.floor(c.z);
  for(const [dx,dz] of [[-8,-14],[-8,14],[8,-14],[8,14],[0,0],[-8,0],[8,0],[0,-14],[0,14]]){
    const g=groundAt(d,bx+dx,by,bz+dz);if(!g||Math.abs(g.y-by)>1)return false;
  }
  for(let dx=-8;dx<=8;dx+=2)for(let dz=-14;dz<=14;dz+=2)for(let dy=0;dy<=5;dy++){
    try{if(d.getBlock({x:bx+dx,y:by+dy,z:bz+dz})?.typeId!=="minecraft:air")return false;}catch{return false;}
  }
  return true;
}
function findSite(d,c){
  for(const [dx,dz] of [[0,0],[36,0],[-36,0],[0,36],[0,-36],[36,36],[-36,36],[36,-36],[-36,-36],[52,0],[-52,0],[0,52],[0,-52]]){
    const g=groundAt(d,c.x+dx,c.y,c.z+dz);if(!g)continue;
    const p={x:g.x+0.5,y:g.y,z:g.z+0.5};if(clearSite(d,p))return p;
  }
}
function codexPoint(s,i){const q=[[-5,10],[0,10],[5,10]][i];return{x:Math.floor(s.center.x+q[0]),y:Math.floor(s.center.y),z:Math.floor(s.center.z+q[1])};}
function bombPoint(s,i){const q=[[-5,1],[0,1],[5,1],[-5,-2],[0,-2],[5,-2]][i];return{x:Math.floor(s.center.x+q[0]),y:Math.floor(s.center.y),z:Math.floor(s.center.z+q[1])};}
function runePoint(s,i){const q=[[-5,-10],[5,-10],[0,-8],[0,-12]][i];return{x:Math.floor(s.center.x+q[0]),y:Math.floor(s.center.y),z:Math.floor(s.center.z+q[1])};}
function gateBlocks(s,z){const out=[];for(let x=-1;x<=1;x++)for(let y=0;y<=2;y++)out.push({x:Math.floor(s.center.x+x),y:Math.floor(s.center.y+y),z:Math.floor(s.center.z+z)});return out;}
function setBlocks(d,points,id){const p=mc.BlockPermutation.resolve(id);for(const q of points)try{d.getBlock(q)?.setPermutation(p);}catch{}}
function gateClosed(s,d,z){setBlocks(d,gateBlocks(s,z),"minecraft:crying_obsidian");}
function gateOpen(s,d,z){setBlocks(d,gateBlocks(s,z),"minecraft:air");for(const q of gateBlocks(s,z))particle(d,"lb:obsidilith_burst",{x:q.x+0.5,y:q.y+0.5,z:q.z+0.5});}
function build(s,d){
  const bx=Math.floor(s.center.x),by=Math.floor(s.center.y),bz=Math.floor(s.center.z);
  const P={
    floor:mc.BlockPermutation.resolve("minecraft:deepslate_tiles"),trim:mc.BlockPermutation.resolve("minecraft:polished_blackstone_bricks"),
    rib:mc.BlockPermutation.resolve("minecraft:crying_obsidian"),light:mc.BlockPermutation.resolve("minecraft:sea_lantern"),
    codex:mc.BlockPermutation.resolve("lb:archive_codex"),bomb:mc.BlockPermutation.resolve("lb:fortune_bomb"),
    rune:mc.BlockPermutation.resolve("lb:obsidilith_rune"),gold:mc.BlockPermutation.resolve("minecraft:gold_block"),
    lapis:mc.BlockPermutation.resolve("minecraft:lapis_block"),emerald:mc.BlockPermutation.resolve("minecraft:emerald_block")
  };
  let placed=0;
  function put(dx,dy,dz,p){try{const b=d.getBlock({x:bx+dx,y:by+dy,z:bz+dz});if(!b)return;b.setPermutation(p);placed++;}catch{}}
  for(let x=-8;x<=8;x++)for(let z=-14;z<=14;z++)put(x,-1,z,(Math.abs(x)===8||Math.abs(z)===14)?P.trim:P.floor);
  for(let z=-14;z<=14;z++)for(const x of [-8,8])for(let y=0;y<=3;y++)put(x,y,z,P.trim);
  for(let x=-8;x<=8;x++)for(const z of [-14,14])for(let y=0;y<=3;y++){if(z===14&&Math.abs(x)<=1&&y<=2)continue;put(x,y,z,P.trim);}
  for(const z of [4,-5])for(let x=-8;x<=8;x++){if(Math.abs(x)<=1)continue;for(let y=0;y<=3;y++)put(x,y,z,P.rib);}
  for(const [x,z] of [[-7,13],[7,13],[-7,5],[7,5],[-7,-4],[7,-4],[-7,-13],[7,-13]]){for(let y=0;y<=3;y++)put(x,y,z,P.rib);put(x,4,z,P.light);}
  const ped=[P.gold,P.lapis,P.emerald];
  for(let i=0;i<3;i++){const q=[[-5,10],[0,10],[5,10]][i];put(q[0],-1,q[1],ped[i]);put(q[0],0,q[1],P.codex);}
  for(const q of [[-5,1],[0,1],[5,1],[-5,-2],[0,-2],[5,-2]])put(q[0],0,q[1],P.bomb);
  for(const q of [[-5,-10],[5,-10],[0,-8],[0,-12]]){put(q[0],-1,q[1],P.rib);put(q[0],0,q[1],P.rune);}
  put(0,-1,-10,P.light);
  gateClosed(s,d,4);gateClosed(s,d,-5);
  s.structureBuilt=placed>=760;return s.structureBuilt;
}
function restoreCodices(s,d){for(let i=0;i<3;i++){const q=codexPoint(s,i);try{if(d.getBlock(q)?.typeId!=="lb:archive_codex")d.getBlock(q)?.setPermutation(mc.BlockPermutation.resolve("lb:archive_codex"));}catch{}}}
function restoreBombs(s,d){for(let i=0;i<6;i++){if((Number(s.spentMask??0)&(1<<i))!==0)continue;const q=bombPoint(s,i);try{if(d.getBlock(q)?.typeId!=="lb:fortune_bomb")d.getBlock(q)?.setPermutation(mc.BlockPermutation.resolve("lb:fortune_bomb"));}catch{}}}
function restoreRunes(s,d){for(let i=0;i<4;i++){const q=runePoint(s,i);try{if(d.getBlock(q)?.typeId!=="lb:obsidilith_rune")d.getBlock(q)?.setPermutation(mc.BlockPermutation.resolve("lb:obsidilith_rune"));}catch{}}}
function pulse(d,q,id="lb:obsidilith_indicator"){particle(d,id,{x:q.x+0.5,y:q.y+0.45,z:q.z+0.5});}
function spawnTagged(s,d,id,p){try{const e=d.spawnEntity(id,p);e.addTag(tag(s));return e;}catch{}}
function spawnKeyGuard(s,d,index){
  const q=codexPoint(s,index),p={x:q.x+0.5,y:q.y,z:q.z-2.5};
  const ids=["lb:impaler","lb:rift_charger_ant","lb:rift_spitter_ant"];
  const e=spawnTagged(s,d,ids[index]??"lb:impaler",p);
  if(e)e.nameTag=["Reliquary Impaler","Reliquary Charger","Reliquary Spitter"][index]??"Reliquary Guard";
}
function armBombs(s,d){
  s.spentMask=0;s.disarms=0;s.bombDeadline=(s.elapsed??0)+100;
  for(let i=0;i<6;i++){const q=bombPoint(s,i);pulse(d,q);sound(d,"random.fuse",q,{volume:0.45,pitch:1.08+i*0.03});}
  msg(d,s.center,"§c[Rift Reliquary] 함정 회랑 활성화 — 5초 안에 폭탄을 해체하거나 폭발 반경을 벗어나세요!");
}
function detonate(s,d,i){
  const q=bombPoint(s,i),c={x:q.x+0.5,y:q.y+0.3,z:q.z+0.5};
  try{d.getBlock(q)?.setPermutation(mc.BlockPermutation.resolve("minecraft:air"));}catch{}
  s.spentMask=Number(s.spentMask??0)|(1<<i);
  particle(d,"lb:obsidilith_burst",c);sound(d,"random.explode",c,{volume:0.78,pitch:0.96});
  for(const p of playersNear(d,c,4.2)){
    const dd=Math.sqrt(distSq(p.location,c));if(dd>3.6)continue;
    const dmg=dd<=1.8?22:13;
    try{p.applyDamage(dmg,{cause:mc.EntityDamageCause.entityExplosion});}catch{try{p.applyDamage(dmg);}catch{}}
    const dx=p.location.x-c.x,dz=p.location.z-c.z,l=Math.max(0.001,Math.hypot(dx,dz));
    try{p.applyImpulse({x:dx/l*0.58,y:0.24,z:dz/l*0.58});}catch{}
  }
}
function startFinalWave(s,d){
  const c=s.center;
  for(const [id,dx,dz] of [["lb:rift_charger_ant",-4,-10],["lb:rift_charger_ant",4,-10],["lb:rift_spitter_ant",0,-12],["lb:wudu_binder",-5,-8],["lb:tyrachnid",5,-8]])spawnTagged(s,d,id,{x:c.x+dx,y:c.y,z:c.z+dz});
  sound(d,"lb.obsidilith.prepare",c,{volume:1.0,pitch:0.9});
  msg(d,c,"§5[Rift Reliquary] 최종 수호대 — 돌진, 원거리 포격, 지원/제압, 엘리트 압박을 동시에 돌파하세요.");
}
function complete(s,d){
  cleanup(s,d);
  spawnItem(d,s.center,"lb:mythic_fragment",9+Math.floor(Math.random()*4));
  spawnItem(d,s.center,"lb:legendary_lucky_block",1);
  spawnItem(d,s.center,"lb:fortune_tonic",2);
  if(Number(s.disarms??0)>=5)spawnItem(d,s.center,"lb:legendary_fragment",2);
  particle(d,"lb:obsidilith_wave",{x:s.center.x,y:s.center.y+1,z:s.center.z});
  sound(d,"lb.obsidilith.burst",s.center,{volume:1.0,pitch:1.04});
  msg(d,s.center,"§d[신화 럭키] Rift Reliquary 정복! 봉인 금고의 전리품이 개방되었습니다.");
}
function tickState(s,d){
  s.elapsed=(s.elapsed??0)+STEP;
  if(s.elapsed>30000){cleanup(s,d);msg(d,s.center,"§8[신화 럭키] Rift Reliquary의 균열이 닫혔습니다.");return true;}
  if(s.stage===0){
    if(!build(s,d)){spawnItem(d,s.center,"lb:mythic_fragment",4);return true;}
    s.stage=1;s.keyMask=0;s.spentMask=0;s.disarms=0;
    msg(d,s.center,"§6[Rift Reliquary] 입구 기록실의 세 Codex를 찾아 봉인 키를 깨우세요. 각 키에는 수호자가 붙어 있습니다.");
    return false;
  }
  if(s.stage===1){
    gateClosed(s,d,4);gateClosed(s,d,-5);restoreCodices(s,d);restoreBombs(s,d);restoreRunes(s,d);
    if(Number(s.keyMask??0)===7&&enemies(s,d).length===0){
      gateOpen(s,d,4);s.stage=2;armBombs(s,d);
      msg(d,s.center,"§b[Rift Reliquary] 세 봉인 키 확보 — 첫 관문이 열렸습니다.");
    }
    return false;
  }
  if(s.stage===2){
    gateOpen(s,d,4);gateClosed(s,d,-5);restoreRunes(s,d);
    for(let i=0;i<6;i++){
      const bit=1<<i;if((Number(s.spentMask??0)&bit)!==0)continue;
      const q=bombPoint(s,i);let present=false;try{present=d.getBlock(q)?.typeId==="lb:fortune_bomb";}catch{}
      if(!present){s.spentMask=Number(s.spentMask??0)|bit;s.disarms=Number(s.disarms??0)+1;msg(d,s.center,"§a[Rift Reliquary] 폭탄 해체 "+s.disarms+"/6");}
      else if((s.elapsed%20)===0)pulse(d,q);
    }
    if((s.elapsed??0)>=Number(s.bombDeadline??0)){
      for(let i=0;i<6;i++){const bit=1<<i;if((Number(s.spentMask??0)&bit)===0)detonate(s,d,i);}
    }
    if(Number(s.spentMask??0)===63){
      gateOpen(s,d,-5);s.stage=3;s.lastRuneCount=4;
      msg(d,s.center,"§5[Rift Reliquary] 함정 회랑 통과 — 최종실의 네 Obsidilith Rune을 파괴하세요.");
    }
    return false;
  }
  if(s.stage===3){
    gateOpen(s,d,4);gateOpen(s,d,-5);
    let count=0;for(let i=0;i<4;i++){const q=runePoint(s,i);try{if(d.getBlock(q)?.typeId==="lb:obsidilith_rune"){count++;if((s.elapsed%30)===0)pulse(d,q,"lb:obsidilith_burst");}}catch{}}
    if(count<Number(s.lastRuneCount??4)){msg(d,s.center,"§d[Rift Reliquary] 봉인 룬 "+count+"/4 잔존.");s.lastRuneCount=count;}
    if(count===0){s.stage=4;startFinalWave(s,d);}
    return false;
  }
  if(s.stage===4){
    gateOpen(s,d,4);gateOpen(s,d,-5);
    if(enemies(s,d).length===0){complete(s,d);return true;}
  }
  return false;
}
function stateForCodex(states,dimensionId,location){
  for(const s of states){
    if(s.stage!==1||!(dimensionId===s.dimension||dimensionId.endsWith(":"+s.dimension)))continue;
    for(let i=0;i<3;i++){const q=codexPoint(s,i);if(q.x===location.x&&q.y===location.y&&q.z===location.z)return{s,index:i};}
  }
}
mc.world.afterEvents.playerInteractWithBlock.subscribe(event=>{
  if(event.block?.typeId!=="lb:archive_codex"||event.isFirstEvent===false)return;
  const states=load(),found=stateForCodex(states,event.block.dimension.id,event.block.location);if(!found)return;
  const bit=1<<found.index;if((Number(found.s.keyMask??0)&bit)!==0)return;
  found.s.keyMask=Number(found.s.keyMask??0)|bit;
  pulse(event.block.dimension,event.block.location,"lb:obsidilith_burst");
  sound(event.block.dimension,"break.amethyst_cluster",event.block.location,{volume:0.75,pitch:1.0+found.index*0.1});
  spawnKeyGuard(found.s,event.block.dimension,found.index);
  const done=[1,2,4].filter(v=>(found.s.keyMask&v)!==0).length;
  msg(event.block.dimension,found.s.center,"§b[Rift Reliquary] 봉인 키 "+done+"/3 활성화.");
  save(states);
});

export function startRiftReliquaryEvent(dimension,center,type){
  if(type!=="rift_reliquary"||mc.world.getDynamicProperty("lb:post_dragon_unlocked")!==true)return false;
  const states=load();if(states.length>=MAX_ACTIVE)return false;
  const base={x:Math.floor(center.x)+0.5,y:Math.floor(center.y),z:Math.floor(center.z)+0.5};
  const site=findSite(dimension,base);if(!site)return false;
  for(const s of states)if(s.dimension===dimKey(dimension.id)&&distSq(s.center,site)<80*80)return false;
  const otherRaw=mc.world.getDynamicProperty("lb:mythic_event_states_v1");
  if(typeof otherRaw==="string"&&otherRaw)try{for(const s of JSON.parse(otherRaw)){if(s.dimension===dimKey(dimension.id)&&distSq(s.center,site)<80*80)return false;}}catch{}
  states.push({id:nextId(),type,dimension:dimKey(dimension.id),center:site,stage:0,elapsed:0,keyMask:0,spentMask:0,disarms:0});
  save(states);return true;
}
mc.system.runInterval(()=>{
  const states=load();if(!states.length)return;
  const next=[];
  for(const s of states){
    let d;try{d=mc.world.getDimension(s.dimension);}catch{continue;}
    if(playersNear(d,s.center,80).length===0){next.push(s);continue;}
    let done=false;try{done=tickState(s,d);}catch{done=false;}
    if(!done)next.push(s);
  }
  save(next);
},STEP);
