import * as mc from "@minecraft/server";

const STATE_KEY = "lb:pre_dragon_event_states_v1";
const COUNTER_KEY = "lb:pre_dragon_event_counter_v1";
const STEP = 10;
const RADIUS = 64;
const MAX_ACTIVE = 4;

function loadStates(){
  const raw=mc.world.getDynamicProperty(STATE_KEY);
  if(typeof raw!=="string"||!raw)return[];
  try{const parsed=JSON.parse(raw);return Array.isArray(parsed)?parsed:[];}catch{return[];}
}
function saveStates(states){mc.world.setDynamicProperty(STATE_KEY,JSON.stringify(states));}
function nextId(){const cur=Number(mc.world.getDynamicProperty(COUNTER_KEY)??0);const next=Number.isFinite(cur)?cur+1:1;mc.world.setDynamicProperty(COUNTER_KEY,next);return next;}
function tagFor(id){return "lb_pre_event_"+id;}
function distSq(a,b){const dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z;return dx*dx+dy*dy+dz*dz;}
function playersNear(dimension,center,radius=RADIUS){const r2=radius*radius;return mc.world.getAllPlayers().filter(p=>p.dimension.id===dimension.id&&distSq(p.location,center)<=r2);}
function messageNear(dimension,center,msg){for(const p of playersNear(dimension,center)){try{p.sendMessage(msg);}catch{}}}
function groundAt(dimension,x,startY,z){
  const bx=Math.floor(x),bz=Math.floor(z),top=Math.min(250,Math.floor(startY)+8),bottom=Math.max(-60,Math.floor(startY)-18);
  for(let y=top;y>=bottom;y--){
    const ground=dimension.getBlock({x:bx,y,z:bz}),above=dimension.getBlock({x:bx,y:y+1,z:bz});
    if(!ground||!above)continue;
    if(ground.typeId!=="minecraft:air"&&above.typeId==="minecraft:air")return{x:bx,y:y+1,z:bz};
  }
}
function groveSiteClear(dimension,center){
  const bx=Math.floor(center.x),by=Math.floor(center.y),bz=Math.floor(center.z);
  for(const [dx,dz] of [[-6,-6],[-6,6],[6,-6],[6,6],[0,0]]){
    const g=groundAt(dimension,bx+dx,by,bz+dz);
    if(!g||Math.abs(g.y-by)>1)return false;
  }
  for(let dx=-6;dx<=6;dx+=2)for(let dz=-6;dz<=6;dz+=2)for(let dy=0;dy<=5;dy++){
    try{if(dimension.getBlock({x:bx+dx,y:by+dy,z:bz+dz})?.typeId!=="minecraft:air")return false;}catch{return false;}
  }
  return true;
}
function findGroveSite(dimension,center){
  for(const [dx,dz] of [[0,0],[16,0],[-16,0],[0,16],[0,-16],[16,16],[-16,16],[16,-16],[-16,-16],[24,0],[-24,0],[0,24],[0,-24]]){
    const g=groundAt(dimension,center.x+dx,center.y,center.z+dz);if(!g)continue;
    const c={x:g.x+0.5,y:g.y,z:g.z+0.5};if(groveSiteClear(dimension,c))return c;
  }
}

function relaySiteClear(dimension,center){
  const bx=Math.floor(center.x),by=Math.floor(center.y),bz=Math.floor(center.z);
  for(const [dx,dz] of [[-9,-9],[-9,9],[9,-9],[9,9],[0,0],[-9,0],[9,0],[0,-9],[0,9]]){
    const g=groundAt(dimension,bx+dx,by,bz+dz);
    if(!g||Math.abs(g.y-by)>1)return false;
  }
  for(let dx=-9;dx<=9;dx+=2)for(let dz=-9;dz<=9;dz+=2)for(let dy=0;dy<=4;dy++){
    try{if(dimension.getBlock({x:bx+dx,y:by+dy,z:bz+dz})?.typeId!=="minecraft:air")return false;}catch{return false;}
  }
  return true;
}
function findRelaySite(dimension,center){
  for(const [dx,dz] of [[0,0],[24,0],[-24,0],[0,24],[0,-24],[24,24],[-24,24],[24,-24],[-24,-24],[32,0],[-32,0],[0,32],[0,-32]]){
    const g=groundAt(dimension,center.x+dx,center.y,center.z+dz);if(!g)continue;
    const c={x:g.x+0.5,y:g.y,z:g.z+0.5};if(relaySiteClear(dimension,c))return c;
  }
}
function relayWallSet(){
  const walls=new Set();
  const add=(x,z)=>walls.add(x+","+z);
  for(let x=-9;x<=9;x++){
    for(const z of [-9,9])if(!(z===9&&x>=-1&&x<=1))add(x,z);
  }
  for(let z=-9;z<=9;z++){add(-9,z);add(9,z);}
  for(let z=-7;z<=6;z++)if(![-5,1,5].includes(z))add(-4,z);
  for(let z=-7;z<=6;z++)if(![-3,3].includes(z))add(4,z);
  for(let x=-7;x<=3;x++)if(![-6,-1,2].includes(x))add(x,-3);
  for(let x=-3;x<=7;x++)if(![0,5].includes(x))add(x,3);
  for(let x=-7;x<=-2;x++)if(x!==-5)add(x,5);
  for(let x=1;x<=7;x++)if(x!==6)add(x,-5);
  return walls;
}
function buildFortuneRelay(state,dimension){
  const bx=Math.floor(state.center.x),by=Math.floor(state.center.y),bz=Math.floor(state.center.z);
  const P={
    floor:mc.BlockPermutation.resolve("minecraft:polished_andesite"),
    wall:mc.BlockPermutation.resolve("minecraft:deepslate_tiles"),
    inner:mc.BlockPermutation.resolve("minecraft:deepslate_bricks"),
    copper:mc.BlockPermutation.resolve("minecraft:copper_block"),
    light:mc.BlockPermutation.resolve("minecraft:sea_lantern"),
    start:mc.BlockPermutation.resolve("minecraft:quartz_block"),
    gold:mc.BlockPermutation.resolve("minecraft:gold_block"),
    lapis:mc.BlockPermutation.resolve("minecraft:lapis_block"),
    emerald:mc.BlockPermutation.resolve("minecraft:emerald_block"),
    amethyst:mc.BlockPermutation.resolve("minecraft:amethyst_block"),
    finish:mc.BlockPermutation.resolve("minecraft:diamond_block")
  };
  let placed=0;
  function put(dx,dy,dz,p){try{const b=dimension.getBlock({x:bx+dx,y:by+dy,z:bz+dz});if(!b)return;b.setPermutation(p);placed++;}catch{}}
  for(let dx=-9;dx<=9;dx++)for(let dz=-9;dz<=9;dz++)put(dx,-1,dz,P.floor);
  const walls=relayWallSet();
  for(const key of walls){
    const [dx,dz]=key.split(",").map(Number);
    const outer=Math.abs(dx)===9||Math.abs(dz)===9;
    for(let y=0;y<=(outer?2:1);y++)put(dx,y,dz,outer?P.wall:P.inner);
  }
  for(const [dx,dz] of [[-9,-9],[-9,9],[9,-9],[9,9]]){
    for(let y=0;y<=3;y++)put(dx,y,dz,P.copper);
    put(dx,4,dz,P.light);
  }
  for(const [dx,dz] of [[0,-9],[-9,0],[9,0]])put(dx,2,dz,P.light);

  put(0,-1,8,P.start);
  const pads=[
    [6,-1,6,P.gold],
    [6,-1,-6,P.lapis],
    [-6,-1,-6,P.emerald],
    [-6,-1,6,P.amethyst],
    [0,-1,0,P.finish]
  ];
  for(const [dx,dy,dz,p] of pads){
    for(let ox=-1;ox<=1;ox++)for(let oz=-1;oz<=1;oz++)put(dx+ox,dy,dz+oz,p);
  }
  state.structureBuilt=placed>=650;
  return state.structureBuilt;
}
function relayPoint(state,[dx,dz]){return{x:state.center.x+dx,y:state.center.y,z:state.center.z+dz};}
function playerOnPoint(player,point,radius=1.45){
  const dx=player.location.x-point.x,dz=player.location.z-point.z;
  return dx*dx+dz*dz<=radius*radius&&Math.abs(player.location.y-point.y)<=2.25;
}
function pulseRelayTarget(dimension,point){
  try{dimension.spawnParticle("lb:obsidilith_indicator",{x:point.x,y:point.y+0.18,z:point.z});}catch{}
  for(const [dx,dz] of [[0.85,0],[-0.85,0],[0,0.85],[0,-0.85]]){
    try{dimension.spawnParticle("lb:slasher_spark_particle",{x:point.x+dx,y:point.y+0.3,z:point.z+dz});}catch{}
  }
}
function finishRelay(state,dimension){
  spawnItem(dimension,state.center,"lb:rare_fragment",3+Math.floor(Math.random()*3));
  spawnItem(dimension,state.center,"lb:common_lucky_block",1);
  if(Math.random()<0.35)spawnItem(dimension,state.center,"lb:epic_fragment",1);
  if(Math.random()<0.25)spawnItem(dimension,state.center,"lb:reward_camera",1);
  try{dimension.playSound("slasher.critical",state.center,{volume:0.72,pitch:1.08});}catch{}
  try{dimension.spawnParticle("lb:obsidilith_burst",{x:state.center.x,y:state.center.y+0.4,z:state.center.z});}catch{}
  messageNear(dimension,state.center,"§b[레어 럭키] 포춘 릴레이 완료! 금고 미로는 월드에 남습니다.");
}
function tickFortuneRelay(state,dimension){
  state.elapsed=(state.elapsed??0)+STEP;
  if(state.elapsed>18000){
    spawnItem(dimension,state.center,"lb:rare_fragment",2);
    messageNear(dimension,state.center,"§8[레어 럭키] 포춘 릴레이가 종료되었습니다. 레어 조각 2개를 남겼습니다.");
    return true;
  }
  if((state.stage??0)===0){
    if(!buildFortuneRelay(state,dimension)){
      spawnItem(dimension,state.center,"lb:rare_fragment",3);
      messageNear(dimension,state.center,"§8[레어 럭키] 금고 미로를 만들 공간이 없어 레어 조각 3개로 보상했습니다.");
      return true;
    }
    state.stage=1;state.running=false;state.progress=0;state.attempts=0;state.runTicks=0;
    messageNear(dimension,state.center,"§b[레어 럭키] 포춘 릴레이 — 남쪽 흰색 시작판을 밟고 50초 안에 5개 체크포인트를 순서대로 통과하세요.");
    return false;
  }

  const players=playersNear(dimension,state.center,32);
  const start=relayPoint(state,[0,8]);
  const sequence=[[6,6],[6,-6],[-6,-6],[-6,6],[0,0]];
  if(!state.running){
    if((state.elapsed%20)===0)pulseRelayTarget(dimension,start);
    if(players.some(p=>playerOnPoint(p,start,1.35))){
      state.running=true;state.progress=0;state.runTicks=0;state.attempts=(state.attempts??0)+1;
      try{dimension.playSound("break.amethyst_cluster",start,{volume:0.6,pitch:1.18});}catch{}
      messageNear(dimension,state.center,"§f[포춘 릴레이] 시작! §b1 → 2 → 3 → 4 → 중앙§f 순서로 달리세요.");
    }
    return false;
  }

  state.runTicks=(state.runTicks??0)+STEP;
  if(state.runTicks>1000){
    state.running=false;state.progress=0;state.runTicks=0;
    try{dimension.playSound("random.break",state.center,{volume:0.45,pitch:0.8});}catch{}
    messageNear(dimension,state.center,"§c[포춘 릴레이] 50초 초과. 남쪽 시작판에서 바로 다시 도전할 수 있습니다.");
    return false;
  }

  const target=relayPoint(state,sequence[state.progress]??sequence[sequence.length-1]);
  if((state.runTicks%20)===0)pulseRelayTarget(dimension,target);
  const runner=players.find(p=>playerOnPoint(p,target));
  if(!runner)return false;

  state.progress++;
  try{dimension.playSound("break.amethyst_cluster",target,{volume:0.7,pitch:1.0+state.progress*0.08});}catch{}
  try{dimension.spawnParticle("lb:obsidilith_burst",{x:target.x,y:target.y+0.3,z:target.z});}catch{}
  if(state.progress>=sequence.length){finishRelay(state,dimension);return true;}
  messageNear(dimension,state.center,"§b[포춘 릴레이] 체크포인트 "+state.progress+"/5 — 다음 표식으로!");
  return false;
}

function buildAwakenedGrove(state,dimension){
  const bx=Math.floor(state.center.x),by=Math.floor(state.center.y),bz=Math.floor(state.center.z);
  const P={moss:mc.BlockPermutation.resolve("minecraft:moss_block"),cobble:mc.BlockPermutation.resolve("minecraft:mossy_cobblestone"),root:mc.BlockPermutation.resolve("minecraft:rooted_dirt"),log:mc.BlockPermutation.resolve("minecraft:oak_log"),leaves:mc.BlockPermutation.resolve("minecraft:oak_leaves"),glow:mc.BlockPermutation.resolve("minecraft:glowstone")};
  let placed=0;
  function put(dx,dy,dz,p){try{const b=dimension.getBlock({x:bx+dx,y:by+dy,z:bz+dz});if(!b)return;b.setPermutation(p);placed++;}catch{}}
  for(let dx=-6;dx<=6;dx++)for(let dz=-6;dz<=6;dz++){
    const r=Math.max(Math.abs(dx),Math.abs(dz));let p=(r===6||((dx*dx+dz*dz)%7===0))?P.cobble:P.moss;
    if(Math.abs(dx)<=1&&Math.abs(dz)<=1)p=P.root;put(dx,-1,dz,p);
  }
  for(const [dx,dz] of [[-5,-5],[-5,5],[5,-5],[5,5]]){
    for(let y=0;y<=4;y++)put(dx,y,dz,P.log);
    for(let lx=-2;lx<=2;lx++)for(let lz=-2;lz<=2;lz++)for(let ly=3;ly<=5;ly++)if(Math.abs(lx)+Math.abs(lz)+(ly===5?1:0)<=3)put(dx+lx,ly,dz+lz,P.leaves);
  }
  for(const [dx,dz] of [[0,-5],[0,5],[-5,0],[5,0]]){put(dx,0,dz,P.cobble);put(dx,1,dz,P.glow);}
  for(const [dx,dz] of [[-2,-2],[-2,2],[2,-2],[2,2]])put(dx,0,dz,P.cobble);
  state.structureBuilt=placed>=250;return state.structureBuilt;
}
function spawnTagged(state,dimension,id,positions){
  const tag=tagFor(state.id);
  for(const [dx,dz] of positions){try{const e=dimension.spawnEntity(id,{x:state.center.x+dx,y:state.center.y+0.2,z:state.center.z+dz});e.addTag(tag);e.setDynamicProperty("lb:pre_event_id",state.id);}catch{}}
}
function enemies(state,dimension){
  try{return dimension.getEntities({location:state.center,maxDistance:RADIUS,excludeTypes:["minecraft:item","minecraft:xp_orb"]}).filter(e=>{try{return e.hasTag(tagFor(state.id));}catch{return false;}});}catch{return[];}
}
function spawnItem(dimension,center,id,count=1){try{dimension.spawnItem(new mc.ItemStack(id,count),{x:center.x,y:center.y+1,z:center.z});}catch{}}
function tickGrove(state,dimension){
  state.elapsed=(state.elapsed??0)+STEP;
  if(state.elapsed>18000){for(const e of enemies(state,dimension)){try{e.remove();}catch{}}messageNear(dimension,state.center,"§8[에픽 럭키] 깨어난 숲의 기운이 가라앉았습니다.");return true;}
  if((state.stage??0)===0){
    if(!buildAwakenedGrove(state,dimension)){spawnItem(dimension,state.center,"lb:epic_fragment",3);messageNear(dimension,state.center,"§8[에픽 럭키] 숲 제단을 만들 공간이 없어 에픽 조각 3개로 보상했습니다.");return true;}
    spawnTagged(state,dimension,"lb:impaler",[[-4,0],[4,0]]);state.stage=1;
    messageNear(dimension,state.center,"§2[에픽 럭키] 깨어난 숲 — 제단을 지키는 임페일러를 처치하세요.");return false;
  }
  if(enemies(state,dimension).length>0)return false;
  if(state.stage===1){
    spawnTagged(state,dimension,"lb:ent_guardian",[[0,0]]);state.stage=2;
    messageNear(dimension,state.center,"§a[에픽 럭키] 숲의 수호자 엔트가 깨어났습니다. 먼저 공격해야 전투가 시작됩니다.");return false;
  }
  if(state.stage===2){
    spawnItem(dimension,state.center,"lb:epic_fragment",4+Math.floor(Math.random()*3));
    spawnItem(dimension,state.center,"lb:rare_lucky_block",1);
    if(Math.random()<0.25)spawnItem(dimension,state.center,"lb:reward_easel",1);
    messageNear(dimension,state.center,"§a[에픽 럭키] 깨어난 숲 정화 완료! 제단은 월드에 남습니다.");return true;
  }
  return false;
}

function anthillSiteClear(dimension,center){
  const bx=Math.floor(center.x),by=Math.floor(center.y),bz=Math.floor(center.z);
  for(const [dx,dz] of [[-9,-9],[-9,9],[9,-9],[9,9],[0,0],[-9,0],[9,0],[0,-9],[0,9]]){
    const g=groundAt(dimension,bx+dx,by,bz+dz);
    if(!g||Math.abs(g.y-by)>1)return false;
  }
  for(let dx=-9;dx<=9;dx+=2)for(let dz=-9;dz<=9;dz+=2)for(let dy=0;dy<=4;dy++){
    try{if(dimension.getBlock({x:bx+dx,y:by+dy,z:bz+dz})?.typeId!=="minecraft:air")return false;}catch{return false;}
  }
  return true;
}
function findAnthillSite(dimension,center){
  for(const [dx,dz] of [[0,0],[24,0],[-24,0],[0,24],[0,-24],[24,24],[-24,24],[24,-24],[-24,-24],[32,0],[-32,0],[0,32],[0,-32]]){
    const g=groundAt(dimension,center.x+dx,center.y,center.z+dz);if(!g)continue;
    const c={x:g.x+0.5,y:g.y,z:g.z+0.5};if(anthillSiteClear(dimension,c))return c;
  }
}
function buildRoyalAnthill(state,dimension){
  const bx=Math.floor(state.center.x),by=Math.floor(state.center.y),bz=Math.floor(state.center.z);
  const P={
    floor:mc.BlockPermutation.resolve("minecraft:packed_mud"),
    wall:mc.BlockPermutation.resolve("minecraft:mud_bricks"),
    root:mc.BlockPermutation.resolve("minecraft:rooted_dirt"),
    brood:mc.BlockPermutation.resolve("minecraft:honeycomb_block"),
    dark:mc.BlockPermutation.resolve("minecraft:brown_mushroom_block"),
    light:mc.BlockPermutation.resolve("minecraft:shroomlight")
  };
  let placed=0;
  function put(dx,dy,dz,p){try{const b=dimension.getBlock({x:bx+dx,y:by+dy,z:bz+dz});if(!b)return;b.setPermutation(p);placed++;}catch{}}
  for(let dx=-9;dx<=9;dx++)for(let dz=-9;dz<=9;dz++){
    const rootPattern=((dx*dx+dz*dz)%11===0)||Math.abs(dx)+Math.abs(dz)<=2;
    put(dx,-1,dz,rootPattern?P.root:P.floor);
  }
  for(let v=-9;v<=9;v++){
    for(const side of [-9,9]){
      if(Math.abs(v)<=1)continue;
      for(let y=0;y<=2;y++){put(v,y,side,P.wall);put(side,y,v,P.wall);}
    }
  }
  for(const [dx,dz] of [[-9,-9],[-9,9],[9,-9],[9,9]]){
    for(let y=0;y<=4;y++)put(dx,y,dz,P.dark);
    put(dx,5,dz,P.light);
  }
  for(let dx=-5;dx<=5;dx++)for(let dz=-5;dz<=5;dz++){
    if(Math.max(Math.abs(dx),Math.abs(dz))!==5)continue;
    if((Math.abs(dx)<=1&&Math.abs(dz)===5)||(Math.abs(dz)<=1&&Math.abs(dx)===5))continue;
    for(let y=0;y<=1;y++)put(dx,y,dz,P.wall);
  }
  for(const [dx,dz] of [[-6,-6],[6,-6],[0,6]]){
    for(let ox=-1;ox<=1;ox++)for(let oz=-1;oz<=1;oz++)put(dx+ox,-1,dz+oz,P.brood);
    put(dx,0,dz,P.light);
  }
  for(let ox=-1;ox<=1;ox++)for(let oz=-1;oz<=1;oz++)put(ox,-1,oz,P.brood);
  state.structureBuilt=placed>=600;
  return state.structureBuilt;
}
function nearestEventPlayer(dimension,center,radius=32){
  const list=playersNear(dimension,center,radius);
  let best,bestSq=Infinity;
  for(const p of list){const d=distSq(p.location,center);if(d<bestSq){best=p;bestSq=d;}}
  return best;
}
function finishRoyalAnthill(state,dimension){
  spawnItem(dimension,state.center,"lb:epic_fragment",4+Math.floor(Math.random()*3));
  const winner=nearestEventPlayer(dimension,state.center,36);
  try{
    const mount=dimension.spawnEntity("lb:war_ant_mount",{x:state.center.x+2,y:state.center.y+0.2,z:state.center.z});
    if(winner){
      try{mount.getComponent("minecraft:tameable")?.tame(winner);}catch{}
      try{mount.triggerEvent("lb:on_tame");}catch{}
      mount.nameTag="Royal Brood War Ant";
    }
  }catch{}
  try{dimension.playSound("break.amethyst_cluster",state.center,{volume:0.85,pitch:0.82});}catch{}
  try{dimension.spawnParticle("lb:obsidilith_burst",{x:state.center.x,y:state.center.y+0.5,z:state.center.z});}catch{}
  messageNear(dimension,state.center,"§6[에픽 럭키] 로열 앤트힐 정복 완료! 여왕의 무리에서 워 앤트 한 마리가 합류했습니다.");
}
function tickRoyalAnthill(state,dimension){
  state.elapsed=(state.elapsed??0)+STEP;
  if(state.elapsed>18000){
    for(const e of enemies(state,dimension)){try{e.remove();}catch{}}
    spawnItem(dimension,state.center,"lb:epic_fragment",3);
    messageNear(dimension,state.center,"§8[에픽 럭키] 로열 앤트힐의 무리가 흩어졌습니다. 에픽 조각 3개를 남겼습니다.");
    return true;
  }
  if((state.stage??0)===0){
    if(!buildRoyalAnthill(state,dimension)){
      spawnItem(dimension,state.center,"lb:epic_fragment",3);
      messageNear(dimension,state.center,"§8[에픽 럭키] 앤트힐을 만들 공간이 없어 에픽 조각 3개로 보상했습니다.");
      return true;
    }
    state.sealMask=0;
    spawnTagged(state,dimension,"lb:ant_soldier_guard",[[-5,0],[5,0]]);
    state.stage=1;
    messageNear(dimension,state.center,"§6[에픽 럭키] 로열 앤트힐 — 입구 경비 개미를 처치하고 세 개의 빛나는 brood seal을 조사하세요.");
    return false;
  }
  if(state.stage===1){
    if(enemies(state,dimension).length>0)return false;
    state.stage=2;
    messageNear(dimension,state.center,"§e[로열 앤트힐] 경비선 붕괴. 세 brood seal 중 하나를 밟아 여왕의 방을 여세요.");
    return false;
  }
  if(state.stage===2){
    if(enemies(state,dimension).length>0)return false;
    const seals=[[-6,-6],[6,-6],[0,6]];
    const players=playersNear(dimension,state.center,28);
    for(let i=0;i<seals.length;i++){
      if((state.sealMask&(1<<i))!==0)continue;
      const point=relayPoint(state,seals[i]);
      if((state.elapsed%20)===0)pulseRelayTarget(dimension,point);
      const opener=players.find(p=>playerOnPoint(p,point,1.6));
      if(!opener)continue;
      state.sealMask|=(1<<i);
      try{dimension.playSound("break.amethyst_cluster",point,{volume:0.65,pitch:0.88+i*0.12});}catch{}
      try{dimension.spawnParticle("lb:obsidilith_burst",{x:point.x,y:point.y+0.25,z:point.z});}catch{}
      spawnTagged(state,dimension,"lb:ant_soldier_guard",[[seals[i][0]*0.72,seals[i][1]*0.72]]);
      const count=[1,2,4].filter(bit=>(state.sealMask&bit)!==0).length;
      messageNear(dimension,state.center,"§e[로열 앤트힐] brood seal "+count+"/3 활성화 — 경비를 쓰러뜨리고 다음 봉인으로 이동하세요.");
      return false;
    }
    if(state.sealMask===7){
      spawnTagged(state,dimension,"lb:ant_queen",[[0,0]]);
      state.stage=3;
      messageNear(dimension,state.center,"§6[로열 앤트힐] Royal Ant Queen이 깨어났습니다! 표시된 지면 공격을 피하고 증원 개미를 끊어내세요.");
    }
    return false;
  }
  if(state.stage===3){
    if(enemies(state,dimension).length>0)return false;
    finishRoyalAnthill(state,dimension);
    return true;
  }
  return false;
}


function bulwarkSiteClear(dimension,center){
  const bx=Math.floor(center.x),by=Math.floor(center.y),bz=Math.floor(center.z);
  for(const [dx,dz] of [[-7,-7],[-7,7],[7,-7],[7,7],[0,0],[-7,0],[7,0],[0,-7],[0,7]]){
    const g=groundAt(dimension,bx+dx,by,bz+dz);
    if(!g||Math.abs(g.y-by)>1)return false;
  }
  for(let dx=-7;dx<=7;dx+=2)for(let dz=-7;dz<=7;dz+=2)for(let dy=0;dy<=4;dy++){
    try{if(dimension.getBlock({x:bx+dx,y:by+dy,z:bz+dz})?.typeId!=="minecraft:air")return false;}catch{return false;}
  }
  return true;
}
function findBulwarkSite(dimension,center){
  for(const [dx,dz] of [[0,0],[20,0],[-20,0],[0,20],[0,-20],[20,20],[-20,20],[20,-20],[-20,-20],[28,0],[-28,0],[0,28],[0,-28]]){
    const g=groundAt(dimension,center.x+dx,center.y,center.z+dz);if(!g)continue;
    const c={x:g.x+0.5,y:g.y,z:g.z+0.5};if(bulwarkSiteClear(dimension,c))return c;
  }
}
function buildFortuneBulwark(state,dimension){
  const bx=Math.floor(state.center.x),by=Math.floor(state.center.y),bz=Math.floor(state.center.z);
  const P={
    floor:mc.BlockPermutation.resolve("minecraft:polished_tuff"),
    ring:mc.BlockPermutation.resolve("minecraft:copper_block"),
    wall:mc.BlockPermutation.resolve("minecraft:tuff_bricks"),
    signal:mc.BlockPermutation.resolve("minecraft:redstone_block"),
    light:mc.BlockPermutation.resolve("minecraft:sea_lantern")
  };
  let placed=0;
  function put(dx,dy,dz,p){try{const b=dimension.getBlock({x:bx+dx,y:by+dy,z:bz+dz});if(!b)return;b.setPermutation(p);placed++;}catch{}}
  for(let dx=-7;dx<=7;dx++)for(let dz=-7;dz<=7;dz++){
    const edge=Math.max(Math.abs(dx),Math.abs(dz))===7;
    const rail=Math.abs(dx)===4||Math.abs(dz)===4;
    put(dx,-1,dz,edge?P.ring:rail?P.wall:P.floor);
  }
  for(const [dx,dz] of [[-7,-7],[-7,7],[7,-7],[7,7]]){
    for(let y=0;y<=2;y++)put(dx,y,dz,P.wall);
    put(dx,3,dz,P.light);
  }
  for(const [dx,dz] of [[-3,0],[3,0]]){put(dx,-1,dz,P.signal);put(dx,0,dz,P.light);}
  for(const [dx,dz] of [[0,-7],[-7,0],[7,0],[0,7]])put(dx,0,dz,P.ring);
  state.structureBuilt=placed>=300;
  return state.structureBuilt;
}
function trialTurrets(state,dimension){
  const tag="lb_turret_trial_"+state.id;
  try{return dimension.getEntities({type:"lb:lucky_turret",location:state.center,maxDistance:32}).filter(e=>{try{return e.hasTag(tag);}catch{return false;}});}catch{return[];}
}
function spawnTrialTurrets(state,dimension){
  const tag="lb_turret_trial_"+state.id;
  for(const dx of [-3,3]){
    try{
      const turret=dimension.spawnEntity("lb:lucky_turret",{x:state.center.x+dx,y:state.center.y+0.05,z:state.center.z});
      turret.addTag(tag);
      turret.nameTag="Bulwark Trial Turret";
      turret.setDynamicProperty("lb:turret_ammo",128);
    }catch{}
  }
}
function cleanTrialTurrets(state,dimension){for(const e of trialTurrets(state,dimension)){try{e.remove();}catch{}}}
function failBulwark(state,dimension,msg){
  for(const e of enemies(state,dimension)){try{e.remove();}catch{}}
  cleanTrialTurrets(state,dimension);
  spawnItem(dimension,state.center,"lb:epic_fragment",3);
  messageNear(dimension,state.center,msg);
  return true;
}
function finishBulwark(state,dimension){
  cleanTrialTurrets(state,dimension);
  spawnItem(dimension,state.center,"lb:reward_turret",1);
  spawnItem(dimension,state.center,"lb:epic_fragment",3+Math.floor(Math.random()*3));
  if(Math.random()<0.35)spawnItem(dimension,state.center,"lb:rare_lucky_block",1);
  try{dimension.playSound("slasher.critical",state.center,{volume:0.72,pitch:1.05});}catch{}
  try{dimension.spawnParticle("lb:obsidilith_burst",{x:state.center.x,y:state.center.y+0.4,z:state.center.z});}catch{}
  messageNear(dimension,state.center,"§6[에픽 럭키] Fortune Bulwark 완료! 실전용 Lucky Auto-Turret을 획득했습니다.");
}
function tickFortuneBulwark(state,dimension){
  state.elapsed=(state.elapsed??0)+STEP;
  if(state.elapsed>18000)return failBulwark(state,dimension,"§8[에픽 럭키] 방벽 훈련이 시간 초과로 종료되었습니다. 에픽 조각 3개를 남겼습니다.");
  if((state.stage??0)===0){
    if(!buildFortuneBulwark(state,dimension)){
      spawnItem(dimension,state.center,"lb:epic_fragment",3);
      messageNear(dimension,state.center,"§8[에픽 럭키] 방벽 훈련장을 만들 공간이 없어 에픽 조각 3개로 보상했습니다.");
      return true;
    }
    spawnTrialTurrets(state,dimension);
    spawnTagged(state,dimension,"lb:ant_soldier_guard",[[-6,-4],[-6,4],[6,-4],[6,4]]);
    state.stage=1;
    messageNear(dimension,state.center,"§6[에픽 럭키] Fortune Bulwark — 자동 포탑 2기를 지키며 3개 공격파를 막으세요.");
    return false;
  }
  if(trialTurrets(state,dimension).length===0)return failBulwark(state,dimension,"§c[Fortune Bulwark] 포탑 2기가 모두 파괴되어 훈련에 실패했습니다. 에픽 조각 3개를 회수했습니다.");
  if(enemies(state,dimension).length>0)return false;
  if(state.stage===1){
    spawnTagged(state,dimension,"lb:impaler",[[-6,0],[6,0]]);
    spawnTagged(state,dimension,"lb:ant_soldier_guard",[[0,-6],[0,6]]);
    state.stage=2;
    messageNear(dimension,state.center,"§e[Fortune Bulwark] 2/3 — 임페일러가 측면으로 진입합니다.");
    return false;
  }
  if(state.stage===2){
    spawnTagged(state,dimension,"lb:impaler",[[-6,-3],[-6,3],[6,-3],[6,3]]);
    spawnTagged(state,dimension,"lb:ant_soldier_guard",[[0,-6],[0,6]]);
    state.stage=3;
    messageNear(dimension,state.center,"§c[Fortune Bulwark] 최종 공격파 — 포탑 사선을 유지하며 전부 정리하세요.");
    return false;
  }
  if(state.stage===3){finishBulwark(state,dimension);return true;}
  return false;
}

export function startPreDragonEvent(dimension,center,type){
  if(type!=="awakened_grove"&&type!=="fortune_relay"&&type!=="royal_anthill"&&type!=="fortune_bulwark")return false;
  if(!dimension.id.includes("overworld"))return false;
  const site=type==="awakened_grove"
    ?findGroveSite(dimension,center)
    :type==="fortune_relay"
      ?findRelaySite(dimension,center)
      :type==="royal_anthill"
        ?findAnthillSite(dimension,center)
        :findBulwarkSite(dimension,center);
  if(!site)return false;
  const states=loadStates();if(states.length>=MAX_ACTIVE)return false;
  const overlap=type==="fortune_relay"?56:type==="royal_anthill"?56:type==="fortune_bulwark"?52:48;
  for(const s of states)if(s.dimension==="overworld"&&distSq(s.center,site)<overlap*overlap)return false;
  states.push({id:nextId(),type,dimension:"overworld",center:site,stage:0,elapsed:0});saveStates(states);return true;
}
mc.system.runInterval(()=>{
  const states=loadStates();if(!states.length)return;const next=[];
  for(const state of states){
    let dimension;try{dimension=mc.world.getDimension(state.dimension);}catch{continue;}
    if(playersNear(dimension,state.center,56).length===0){next.push(state);continue;}
    let done=false;
    try{
      done=state.type==="awakened_grove"
        ?tickGrove(state,dimension)
        :state.type==="fortune_relay"
          ?tickFortuneRelay(state,dimension)
          :state.type==="royal_anthill"
            ?tickRoyalAnthill(state,dimension)
            :state.type==="fortune_bulwark"
              ?tickFortuneBulwark(state,dimension)
              :true;
    }catch{done=false;}
    if(!done)next.push(state);
  }
  saveStates(next);
},STEP);
