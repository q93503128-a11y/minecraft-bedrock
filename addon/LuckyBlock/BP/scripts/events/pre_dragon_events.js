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


function playerOnGalleryStart(player,state){
  return Math.abs(player.location.x-state.center.x)<=8.6&&
    Math.abs(player.location.z-(state.center.z+8))<=1.25&&
    Math.abs(player.location.y-state.center.y)<=2.25;
}
function galleryTargetOffsets(){
  return [
    [-6,1,-4],[-2,1,-4],[2,1,-4],[6,1,-4],
    [-6,2,-7],[-2,2,-7],[2,2,-7],[6,2,-7],
    [-6,3,-10],[-2,3,-10],[2,3,-10],[6,3,-10]
  ];
}
function gallerySiteClear(dimension,center){
  const bx=Math.floor(center.x),by=Math.floor(center.y),bz=Math.floor(center.z);
  for(const [dx,dz] of [[-9,-11],[-9,9],[9,-11],[9,9],[0,0],[-9,0],[9,0],[0,-11],[0,9]]){
    const g=groundAt(dimension,bx+dx,by,bz+dz);
    if(!g||Math.abs(g.y-by)>1)return false;
  }
  for(let dx=-9;dx<=9;dx+=2)for(let dz=-11;dz<=9;dz+=2)for(let dy=0;dy<=6;dy++){
    try{if(dimension.getBlock({x:bx+dx,y:by+dy,z:bz+dz})?.typeId!=="minecraft:air")return false;}catch{return false;}
  }
  return true;
}
function findGallerySite(dimension,center){
  for(const [dx,dz] of [[0,0],[28,0],[-28,0],[0,28],[0,-28],[28,28],[-28,28],[28,-28],[-28,-28],[40,0],[-40,0],[0,40],[0,-40]]){
    const g=groundAt(dimension,center.x+dx,center.y,center.z+dz);if(!g)continue;
    const c={x:g.x+0.5,y:g.y,z:g.z+0.5};if(gallerySiteClear(dimension,c))return c;
  }
}
function galleryTargetLocation(state,index){
  const [dx,dy,dz]=galleryTargetOffsets()[index];
  return{x:Math.floor(state.center.x)+dx,y:Math.floor(state.center.y)+dy,z:Math.floor(state.center.z)+dz};
}
function galleryTargetIndex(state,location){
  const bx=Math.floor(state.center.x),by=Math.floor(state.center.y),bz=Math.floor(state.center.z);
  const x=Math.floor(location.x)-bx,y=Math.floor(location.y)-by,z=Math.floor(location.z)-bz;
  const targets=galleryTargetOffsets();
  for(let i=0;i<targets.length;i++){
    const [dx,dy,dz]=targets[i];
    if(x===dx&&y===dy&&z===dz)return i;
  }
  return -1;
}
function insideGallery(state,location){
  const bx=Math.floor(state.center.x),by=Math.floor(state.center.y),bz=Math.floor(state.center.z);
  const x=Math.floor(location.x)-bx,y=Math.floor(location.y)-by,z=Math.floor(location.z)-bz;
  return Math.abs(x)<=9&&z>=-11&&z<=9&&y>=-1&&y<=6;
}
function buildFortuneGallery(state,dimension){
  const bx=Math.floor(state.center.x),by=Math.floor(state.center.y),bz=Math.floor(state.center.z);
  const P={
    floor:mc.BlockPermutation.resolve("minecraft:smooth_stone"),
    lane:mc.BlockPermutation.resolve("minecraft:polished_andesite"),
    wall:mc.BlockPermutation.resolve("minecraft:deepslate_tiles"),
    copper:mc.BlockPermutation.resolve("minecraft:copper_block"),
    light:mc.BlockPermutation.resolve("minecraft:sea_lantern"),
    start:mc.BlockPermutation.resolve("minecraft:quartz_block"),
    target:mc.BlockPermutation.resolve("lb:reward_vase")
  };
  let placed=0;
  function put(dx,dy,dz,p){try{const b=dimension.getBlock({x:bx+dx,y:by+dy,z:bz+dz});if(!b)return;b.setPermutation(p);placed++;}catch{}}
  for(let dx=-9;dx<=9;dx++)for(let dz=-11;dz<=9;dz++)put(dx,-1,dz,Math.abs(dx)%4===0?P.lane:P.floor);
  for(let x=-9;x<=9;x++)for(let y=0;y<=5;y++)put(x,y,-11,P.wall);
  for(const side of [-9,9])for(let z=-11;z<=9;z++)for(let y=0;y<=1;y++)put(side,y,z,P.wall);
  for(const [dx,dz] of [[-9,-11],[9,-11],[-9,9],[9,9]]){
    for(let y=0;y<=5;y++)put(dx,y,dz,P.copper);
    put(dx,6,dz,P.light);
  }
  for(let x=-8;x<=8;x++)put(x,-1,8,P.start);
  for(const [dx,dy,dz] of galleryTargetOffsets()){
    put(dx,dy-1,dz,P.copper);
    put(dx,dy,dz,P.target);
    if(dy>1)for(let y=0;y<dy-1;y++)put(dx,y,dz,P.wall);
  }
  state.structureBuilt=placed>=500;
  return state.structureBuilt;
}
function restoreGalleryTargets(state,dimension){
  const target=mc.BlockPermutation.resolve("lb:reward_vase");
  const mask=state.hitMask??0;
  const targets=galleryTargetOffsets();
  for(let i=0;i<targets.length;i++){
    if((mask&(1<<i))!==0)continue;
    const loc=galleryTargetLocation(state,i);
    try{
      const block=dimension.getBlock(loc);
      if(block&&block.typeId!=="lb:reward_vase")block.setPermutation(target);
    }catch{}
  }
}
function pulseGalleryTargets(state,dimension){
  const mask=state.hitMask??0;
  for(let i=0;i<galleryTargetOffsets().length;i++){
    if((mask&(1<<i))!==0)continue;
    const loc=galleryTargetLocation(state,i);
    try{dimension.spawnParticle("lb:obsidilith_indicator",{x:loc.x+0.5,y:loc.y+1.05,z:loc.z+0.5});}catch{}
  }
}
function giveTrialSnowballs(player,count=24){
  try{
    const inv=player.getComponent("minecraft:inventory")?.container;
    if(!inv)return;
    const leftover=inv.addItem(new mc.ItemStack("minecraft:snowball",count));
    if(leftover)player.dimension.spawnItem(leftover,{x:player.location.x,y:player.location.y+0.5,z:player.location.z});
  }catch{}
}
function resetGalleryRun(state,dimension,msg){
  state.running=false;
  state.hitMask=0;
  state.hits=0;
  state.misses=0;
  state.runTicks=0;
  state.scoreByPlayer={};
  state.ammoGranted=[];
  state.completePending=false;
  restoreGalleryTargets(state,dimension);
  if(msg)messageNear(dimension,state.center,msg);
}
function finishGallery(state,dimension){
  const misses=state.misses??0;
  const time=state.runTicks??900;
  spawnItem(dimension,state.center,"lb:epic_fragment",4+Math.floor(Math.random()*2));
  spawnItem(dimension,state.center,"lb:rare_lucky_block",1);
  if(misses<=3)spawnItem(dimension,state.center,"minecraft:arrow",32);
  const precision=time<=500&&misses<=1;
  if(precision)spawnItem(dimension,state.center,"lb:storm_longbow",1);
  try{dimension.playSound("slasher.critical",state.center,{volume:0.82,pitch:1.12});}catch{}
  try{dimension.spawnParticle("lb:obsidilith_burst",{x:state.center.x,y:state.center.y+0.5,z:state.center.z});}catch{}
  const seconds=Math.ceil(time/20);
  const contributors=Object.keys(state.scoreByPlayer??{}).length;
  messageNear(dimension,state.center,"§b[Fortune Gallery] 완료! §f"+seconds+"초 / 빗나감 "+misses+" / 참가 "+contributors+"명"+(precision?" §6— Sharpshooter 보너스: Storm Longbow!":""));
}
function tickFortuneGallery(state,dimension){
  state.elapsed=(state.elapsed??0)+STEP;
  if(state.elapsed>18000){
    spawnItem(dimension,state.center,"lb:epic_fragment",3);
    messageNear(dimension,state.center,"§8[에픽 럭키] Fortune Gallery가 종료되었습니다. 에픽 조각 3개를 남겼습니다.");
    return true;
  }
  if((state.stage??0)===0){
    if(!buildFortuneGallery(state,dimension)){
      spawnItem(dimension,state.center,"lb:epic_fragment",3);
      messageNear(dimension,state.center,"§8[에픽 럭키] 사격장을 만들 공간이 없어 에픽 조각 3개로 보상했습니다.");
      return true;
    }
    state.stage=1;
    resetGalleryRun(state,dimension);
    messageNear(dimension,state.center,"§b[에픽 럭키] Fortune Gallery — 남쪽 흰색 사선에 서서 시작. 45초 안에 12개의 Lucky Vase를 눈덩이로 맞히세요.");
    return false;
  }
  if(state.completePending){
    finishGallery(state,dimension);
    return true;
  }
  restoreGalleryTargets(state,dimension);
  if(!state.running){
    if((state.elapsed%20)===0)pulseGalleryTargets(state,dimension);
    const start={x:state.center.x,y:state.center.y,z:state.center.z+8};
    const starters=playersNear(dimension,state.center,28).filter(p=>playerOnGalleryStart(p,state));
    if(starters.length){
      state.running=true;
      state.runTicks=0;
      state.hitMask=0;
      state.hits=0;
      state.misses=0;
      state.scoreByPlayer={};
      state.ammoGranted=[];
      state.attempts=(state.attempts??0)+1;
      for(const p of starters){giveTrialSnowballs(p,24);state.ammoGranted.push(p.id);}
      try{dimension.playSound("random.bow",start,{volume:0.7,pitch:1.15});}catch{}
      messageNear(dimension,state.center,"§f[Fortune Gallery] 시작! §b12개 표적§f을 45초 안에 전부 맞히세요. 중간 합류도 가능합니다.");
    }
    return false;
  }
  state.runTicks=(state.runTicks??0)+STEP;
  const nearby=playersNear(dimension,state.center,28);
  state.ammoGranted=Array.isArray(state.ammoGranted)?state.ammoGranted:[];
  for(const p of nearby){
    if(state.ammoGranted.includes(p.id))continue;
    giveTrialSnowballs(p,16);
    state.ammoGranted.push(p.id);
    try{p.sendMessage("§b[Fortune Gallery] 중간 합류 — 눈덩이 16개 지급.");}catch{}
  }
  if((state.runTicks%20)===0)pulseGalleryTargets(state,dimension);
  if(state.runTicks>900){
    resetGalleryRun(state,dimension,"§c[Fortune Gallery] 45초 초과. 표적이 복구되었습니다. 남쪽 사선에서 바로 재도전할 수 있습니다.");
    return false;
  }
  return false;
}
mc.world.afterEvents.projectileHitBlock.subscribe(event=>{
  const source=event.source;
  if(!(source instanceof mc.Player)||event.projectile?.typeId!=="minecraft:snowball")return;
  let hit;try{hit=event.getBlockHit()?.block;}catch{return;}
  if(!hit)return;
  const states=loadStates();
  let changed=false;
  for(const state of states){
    if(state.type!=="fortune_gallery"||!state.running||!(state.dimension===event.dimension.id||event.dimension.id.endsWith(":"+state.dimension)))continue;
    if(!insideGallery(state,hit.location))continue;
    const index=galleryTargetIndex(state,hit.location);
    if(index<0){
      state.misses=(state.misses??0)+1;
      changed=true;
      try{source.onScreenDisplay.setActionBar("§bFortune Gallery §8— §cMiss "+state.misses);}catch{}
      break;
    }
    const bit=1<<index;
    if(((state.hitMask??0)&bit)!==0)break;
    state.hitMask=(state.hitMask??0)|bit;
    state.hits=(state.hits??0)+1;
    state.scoreByPlayer=state.scoreByPlayer&&typeof state.scoreByPlayer==="object"?state.scoreByPlayer:{};
    state.scoreByPlayer[source.id]=(state.scoreByPlayer[source.id]??0)+1;
    try{hit.setPermutation(mc.BlockPermutation.resolve("minecraft:air"));}catch{}
    try{event.dimension.playSound("break.amethyst_cluster",hit.location,{volume:0.72,pitch:1.0+state.hits*0.025});}catch{}
    try{event.dimension.spawnParticle("lb:obsidilith_burst",{x:hit.location.x+0.5,y:hit.location.y+0.5,z:hit.location.z+0.5});}catch{}
    try{source.onScreenDisplay.setActionBar("§bFortune Gallery §8— §f"+state.hits+"/12 §7(내 적중 "+state.scoreByPlayer[source.id]+")");}catch{}
    if(state.hits>=galleryTargetOffsets().length)state.completePending=true;
    changed=true;
    break;
  }
  if(changed)saveStates(states);
});


function sanctuarySiteClear(dimension,center){
  const bx=Math.floor(center.x),by=Math.floor(center.y),bz=Math.floor(center.z);
  for(const [dx,dz] of [[-8,-8],[-8,8],[8,-8],[8,8],[0,0],[-8,0],[8,0],[0,-8],[0,8]]){
    const g=groundAt(dimension,bx+dx,by,bz+dz);
    if(!g||Math.abs(g.y-by)>1)return false;
  }
  for(let dx=-8;dx<=8;dx+=2)for(let dz=-8;dz<=8;dz+=2)for(let dy=0;dy<=6;dy++){
    try{if(dimension.getBlock({x:bx+dx,y:by+dy,z:bz+dz})?.typeId!=="minecraft:air")return false;}catch{return false;}
  }
  return true;
}
function findSanctuarySite(dimension,center){
  for(const [dx,dz] of [[0,0],[24,0],[-24,0],[0,24],[0,-24],[24,24],[-24,24],[24,-24],[-24,-24],[36,0],[-36,0],[0,36],[0,-36]]){
    const g=groundAt(dimension,center.x+dx,center.y,center.z+dz);if(!g)continue;
    const c={x:g.x+0.5,y:g.y,z:g.z+0.5};if(sanctuarySiteClear(dimension,c))return c;
  }
}
function sanctuaryStations(state){
  return [[6,0],[0,6],[-6,0],[0,-6]].map(([dx,dz])=>relayPoint(state,[dx,dz]));
}
function buildButterflySanctuary(state,dimension){
  const bx=Math.floor(state.center.x),by=Math.floor(state.center.y),bz=Math.floor(state.center.z);
  const P={
    moss:mc.BlockPermutation.resolve("minecraft:moss_block"),
    stone:mc.BlockPermutation.resolve("minecraft:mossy_cobblestone"),
    log:mc.BlockPermutation.resolve("minecraft:oak_log"),
    leaves:mc.BlockPermutation.resolve("minecraft:oak_leaves"),
    light:mc.BlockPermutation.resolve("minecraft:glowstone"),
    observe:mc.BlockPermutation.resolve("minecraft:smooth_stone"),
    gold:mc.BlockPermutation.resolve("minecraft:gold_block"),
    emerald:mc.BlockPermutation.resolve("minecraft:emerald_block"),
    lapis:mc.BlockPermutation.resolve("minecraft:lapis_block"),
    amethyst:mc.BlockPermutation.resolve("minecraft:amethyst_block")
  };
  let placed=0;
  function put(dx,dy,dz,p){try{const b=dimension.getBlock({x:bx+dx,y:by+dy,z:bz+dz});if(!b)return;b.setPermutation(p);placed++;}catch{}}
  for(let dx=-8;dx<=8;dx++)for(let dz=-8;dz<=8;dz++){
    const r=Math.sqrt(dx*dx+dz*dz);
    if(r<=8.4)put(dx,-1,dz,((dx*dx+dz*dz)%9===0)?P.stone:P.moss);
  }
  for(const [dx,dz] of [[-8,-8],[-8,8],[8,-8],[8,8]]){
    for(let y=0;y<=3;y++)put(dx,y,dz,P.log);
    for(let ox=-2;ox<=2;ox++)for(let oz=-2;oz<=2;oz++)if(Math.abs(ox)+Math.abs(oz)<=3)put(dx+ox,4,dz+oz,P.leaves);
    put(dx,5,dz,P.light);
  }
  const colors=[P.gold,P.emerald,P.lapis,P.amethyst];
  const offsets=[[6,0],[0,6],[-6,0],[0,-6]];
  for(let i=0;i<offsets.length;i++){
    const [dx,dz]=offsets[i];
    for(let ox=-1;ox<=1;ox++)for(let oz=-1;oz<=1;oz++)put(dx+ox,-1,dz+oz,P.observe);
    put(dx,-1,dz,colors[i]);
    for(const [fx,fz] of [[2,0],[-2,0],[0,2],[0,-2]])put(dx+fx,-1,dz+fz,P.moss);
  }
  for(const [dx,dz] of [[0,0],[3,3],[-3,3],[3,-3],[-3,-3]])put(dx,-1,dz,P.light);
  state.structureBuilt=placed>=300;
  return state.structureBuilt;
}
function sanctuaryButterflies(state,dimension){
  try{
    return dimension.getEntities({location:state.center,maxDistance:48,type:"lb:tortoiseshell_butterfly"}).filter(e=>{try{return e.hasTag(tagFor(state.id));}catch{return false;}});
  }catch{return[];}
}
function spawnSanctuaryButterflies(state,dimension,count=8){
  const tag=tagFor(state.id);
  const offsets=[[-4,-2],[-2,4],[3,3],[5,-2],[-5,3],[1,-5],[-1,1],[4,5]];
  let spawned=0;
  for(let i=0;i<count;i++){
    const [dx,dz]=offsets[i%offsets.length];
    try{
      const e=dimension.spawnEntity("lb:tortoiseshell_butterfly",{x:state.center.x+dx,y:state.center.y+2+(i%3)*0.45,z:state.center.z+dz});
      e.addTag(tag);
      e.setDynamicProperty("lb:pre_event_id",state.id);
      spawned++;
    }catch{}
  }
  return spawned;
}
function stabilizeSanctuaryButterflies(state,dimension){
  let list=sanctuaryButterflies(state,dimension);
  if(list.length<6){
    spawnSanctuaryButterflies(state,dimension,6-list.length);
    list=sanctuaryButterflies(state,dimension);
  }
  for(let i=0;i<list.length;i++){
    const e=list[i];
    const far=distSq(e.location,state.center)>13*13||e.location.y<state.center.y-1||e.location.y>state.center.y+8;
    if(!far)continue;
    const a=(Math.PI*2*i)/Math.max(1,list.length);
    try{e.teleport({x:state.center.x+Math.cos(a)*4,y:state.center.y+2+(i%2),z:state.center.z+Math.sin(a)*4},{dimension});}catch{}
  }
  return list;
}
function butterflyNearPoint(list,point,radius=5.5){
  const r2=radius*radius;
  return list.some(e=>{try{return distSq(e.location,point)<=r2;}catch{return false;}});
}
function releaseSanctuaryButterflies(state,dimension,keep=4){
  const list=sanctuaryButterflies(state,dimension);
  for(let i=0;i<list.length;i++){
    const e=list[i];
    if(i>=keep){try{e.remove();}catch{};continue;}
    try{e.removeTag(tagFor(state.id));}catch{}
    try{e.nameTag="Tortoiseshell Butterfly";}catch{}
  }
}
function finishButterflySanctuary(state,dimension){
  spawnItem(dimension,state.center,"lb:epic_fragment",4+Math.floor(Math.random()*3));
  spawnItem(dimension,state.center,"lb:reward_camera",1);
  if(Math.random()<0.30)spawnItem(dimension,state.center,"lb:rare_lucky_block",1);
  if(Math.random()<0.25){
    spawnItem(dimension,state.center,"lb:explorer_hat",1);
    spawnItem(dimension,state.center,"lb:explorer_pack",1);
  }
  releaseSanctuaryButterflies(state,dimension,4);
  try{dimension.playSound("break.amethyst_cluster",state.center,{volume:0.78,pitch:1.25});}catch{}
  try{dimension.spawnParticle("lb:obsidilith_burst",{x:state.center.x,y:state.center.y+0.7,z:state.center.z});}catch{}
  messageNear(dimension,state.center,"§d[에픽 럭키] Butterfly Sanctuary 조사 완료! 나비 네 마리가 보호구역에 남았습니다.");
}
function tickButterflySanctuary(state,dimension){
  state.elapsed=(state.elapsed??0)+STEP;
  if(state.elapsed>18000){
    releaseSanctuaryButterflies(state,dimension,0);
    spawnItem(dimension,state.center,"lb:epic_fragment",3);
    messageNear(dimension,state.center,"§8[에픽 럭키] Butterfly Sanctuary 조사가 종료되었습니다. 에픽 조각 3개를 남겼습니다.");
    return true;
  }
  if((state.stage??0)===0){
    if(!buildButterflySanctuary(state,dimension)){
      spawnItem(dimension,state.center,"lb:epic_fragment",3);
      messageNear(dimension,state.center,"§8[에픽 럭키] 보호구역을 만들 공간이 없어 에픽 조각 3개로 보상했습니다.");
      return true;
    }
    state.observeMask=0;
    state.observeHolds=[0,0,0,0];
    spawnSanctuaryButterflies(state,dimension,8);
    state.stage=1;
    messageNear(dimension,state.center,"§d[에픽 럭키] Butterfly Sanctuary — 네 관찰 지점에서 나비가 가까이 왔을 때 2초간 머물러 생태 조사를 완료하세요. 순서는 자유입니다.");
    return false;
  }
  const butterflies=stabilizeSanctuaryButterflies(state,dimension);
  const players=playersNear(dimension,state.center,28);
  const stations=sanctuaryStations(state);
  state.observeHolds=Array.isArray(state.observeHolds)&&state.observeHolds.length===4?state.observeHolds:[0,0,0,0];
  for(let i=0;i<stations.length;i++){
    const bit=1<<i;if(((state.observeMask??0)&bit)!==0)continue;
    const point=stations[i];
    if((state.elapsed%20)===0)pulseRelayTarget(dimension,point);
    const observer=players.find(p=>playerOnPoint(p,point,1.75));
    const valid=!!observer&&butterflyNearPoint(butterflies,point,5.5);
    state.observeHolds[i]=valid?state.observeHolds[i]+STEP:0;
    if(state.observeHolds[i]<40)continue;
    state.observeMask=(state.observeMask??0)|bit;
    state.observeHolds[i]=0;
    const done=[1,2,4,8].filter(b=>(state.observeMask&b)!==0).length;
    try{dimension.playSound("break.amethyst_cluster",point,{volume:0.64,pitch:0.96+done*0.08});}catch{}
    try{dimension.spawnParticle("lb:obsidilith_burst",{x:point.x,y:point.y+0.45,z:point.z});}catch{}
    messageNear(dimension,state.center,"§d[Butterfly Sanctuary] 관찰 기록 "+done+"/4 완료 — 남은 지점은 순서와 무관하게 조사할 수 있습니다.");
  }
  if((state.observeMask??0)===15){finishButterflySanctuary(state,dimension);return true;}
  return false;
}


function voidGardenSiteClear(dimension,center){
  const bx=Math.floor(center.x),by=Math.floor(center.y),bz=Math.floor(center.z);
  for(const [dx,dz] of [[-9,-9],[-9,9],[9,-9],[9,9],[0,0],[-9,0],[9,0],[0,-9],[0,9]]){
    const g=groundAt(dimension,bx+dx,by,bz+dz);
    if(!g||Math.abs(g.y-by)>1)return false;
  }
  for(let dx=-9;dx<=9;dx+=2)for(let dz=-9;dz<=9;dz+=2)for(let dy=0;dy<=10;dy++){
    try{if(dimension.getBlock({x:bx+dx,y:by+dy,z:bz+dz})?.typeId!=="minecraft:air")return false;}catch{return false;}
  }
  return true;
}
function findVoidGardenSite(dimension,center){
  for(const [dx,dz] of [[0,0],[26,0],[-26,0],[0,26],[0,-26],[26,26],[-26,26],[26,-26],[-26,-26],[38,0],[-38,0],[0,38],[0,-38]]){
    const g=groundAt(dimension,center.x+dx,center.y,center.z+dz);if(!g)continue;
    const p={x:g.x+0.5,y:g.y,z:g.z+0.5};if(voidGardenSiteClear(dimension,p))return p;
  }
}
function buildVoidGarden(state,dimension){
  const bx=Math.floor(state.center.x),by=Math.floor(state.center.y),bz=Math.floor(state.center.z);
  const P={
    moss:mc.BlockPermutation.resolve("minecraft:moss_block"),
    root:mc.BlockPermutation.resolve("minecraft:rooted_dirt"),
    stone:mc.BlockPermutation.resolve("minecraft:mossy_cobblestone"),
    dark:mc.BlockPermutation.resolve("minecraft:deepslate_tiles"),
    amethyst:mc.BlockPermutation.resolve("minecraft:amethyst_block"),
    light:mc.BlockPermutation.resolve("minecraft:glowstone"),
    leaves:mc.BlockPermutation.resolve("minecraft:azalea_leaves")
  };
  let placed=0;
  function put(dx,dy,dz,p){try{const b=dimension.getBlock({x:bx+dx,y:by+dy,z:bz+dz});if(!b)return;b.setPermutation(p);placed++;}catch{}}
  for(let dx=-9;dx<=9;dx++)for(let dz=-9;dz<=9;dz++){
    const r=Math.hypot(dx,dz);if(r>9.4)continue;
    let p=((dx*dx+dz*dz)%11===0)?P.stone:P.moss;
    if(Math.abs(dx)<=2&&Math.abs(dz)<=2)p=P.root;
    if(r>=8.25)p=P.dark;
    put(dx,-1,dz,p);
  }
  for(const [dx,dz] of [[-7,-7],[-7,7],[7,-7],[7,7]]){
    for(let y=0;y<=3;y++)put(dx,y,dz,P.stone);
    put(dx,4,dz,P.amethyst);put(dx,5,dz,P.light);
    for(const [ox,oz] of [[1,0],[-1,0],[0,1],[0,-1]])put(dx+ox,3,dz+oz,P.leaves);
  }
  for(const [dx,dz] of [[7,0],[-7,0],[0,7],[0,-7]]){put(dx,-1,dz,P.amethyst);put(dx-1,-1,dz,P.stone);put(dx+1,-1,dz,P.stone);}
  state.structureBuilt=placed>=320;
  return state.structureBuilt;
}
function gardenBoss(state,dimension){
  try{return dimension.getEntities({location:state.center,maxDistance:36,type:"lb:void_blossom"}).find(e=>{try{return e.hasTag(tagFor(state.id));}catch{return false;}});}catch{return undefined;}
}
function clearGardenRoots(state,dimension){
  for(const [dx,dz] of [[7,0],[-7,0],[0,7],[0,-7]]){
    const p={x:Math.floor(state.center.x+dx),y:Math.floor(state.center.y),z:Math.floor(state.center.z+dz)};
    try{const b=dimension.getBlock(p);if(b?.typeId==="minecraft:flowering_azalea")b.setPermutation(mc.BlockPermutation.resolve("minecraft:air"));}catch{}
  }
}
function finishVoidGarden(state,dimension){
  clearGardenRoots(state,dimension);
  spawnItem(dimension,state.center,"lb:epic_fragment",5+Math.floor(Math.random()*3));
  spawnItem(dimension,state.center,"lb:rare_lucky_block",1);
  spawnItem(dimension,state.center,"lb:fortune_tonic",2);
  if(Math.random()<0.30)spawnItem(dimension,state.center,"lb:threat_sunglasses",1);
  try{dimension.playSound("lb.void_blossom.spore_impact",state.center,{volume:.9,pitch:1.2});}catch{}
  try{dimension.spawnParticle("lb:obsidilith_burst",{x:state.center.x,y:state.center.y+.8,z:state.center.z});}catch{}
  messageNear(dimension,state.center,"§d[에픽 럭키] Void Garden 정화 완료! 뿌리 정원은 월드에 남습니다.");
}
function tickVoidGarden(state,dimension){
  state.elapsed=(state.elapsed??0)+STEP;
  if(state.elapsed>18000){
    const boss=gardenBoss(state,dimension);if(boss)try{boss.remove();}catch{}
    clearGardenRoots(state,dimension);
    spawnItem(dimension,state.center,"lb:epic_fragment",3);
    messageNear(dimension,state.center,"§8[에픽 럭키] Void Garden이 가라앉았습니다. 에픽 조각 3개를 남겼습니다.");
    return true;
  }
  if((state.stage??0)===0){
    if(!buildVoidGarden(state,dimension)){
      spawnItem(dimension,state.center,"lb:epic_fragment",3);
      messageNear(dimension,state.center,"§8[에픽 럭키] Void Garden을 만들 공간이 없어 에픽 조각 3개로 보상했습니다.");
      return true;
    }
    spawnTagged(state,dimension,"lb:void_blossom",[[0,0]]);
    const boss=gardenBoss(state,dimension);
    if(boss){try{boss.nameTag="Void Blossom";}catch{};try{boss.playAnimation("animation.lb.void_blossom.spawn");}catch{}}
    state.stage=1;
    messageNear(dimension,state.center,"§5[에픽 럭키] Void Garden — Void Blossom의 가시·포자·꽃잎 칼날을 피하고, 75/50/25%에 피어나는 생명 뿌리를 먼저 정화하세요.");
    return false;
  }
  if(gardenBoss(state,dimension))return false;
  finishVoidGarden(state,dimension);return true;
}

function archiveCodexOffsets(){return [[0,-5],[5,0],[0,5],[-5,0]];}
function archiveCodexPoint(state,index){
  const [dx,dz]=archiveCodexOffsets()[index]??[0,0];
  return{x:Math.floor(state.center.x+dx),y:Math.floor(state.center.y),z:Math.floor(state.center.z+dz)};
}
function archiveSiteClear(dimension,center){
  const bx=Math.floor(center.x),by=Math.floor(center.y),bz=Math.floor(center.z);
  for(const [dx,dz] of [[-8,-8],[-8,8],[8,-8],[8,8],[0,0],[-8,0],[8,0],[0,-8],[0,8]]){
    const g=groundAt(dimension,bx+dx,by,bz+dz);if(!g||Math.abs(g.y-by)>1)return false;
  }
  for(let dx=-8;dx<=8;dx+=2)for(let dz=-8;dz<=8;dz+=2)for(let dy=0;dy<=5;dy++){
    try{if(dimension.getBlock({x:bx+dx,y:by+dy,z:bz+dz})?.typeId!=="minecraft:air")return false;}catch{return false;}
  }
  return true;
}
function findArchiveSite(dimension,center){
  for(const [dx,dz] of [[0,0],[22,0],[-22,0],[0,22],[0,-22],[22,22],[-22,22],[22,-22],[-22,-22],[34,0],[-34,0],[0,34],[0,-34]]){
    const g=groundAt(dimension,center.x+dx,center.y,center.z+dz);if(!g)continue;
    const p={x:g.x+0.5,y:g.y,z:g.z+0.5};if(archiveSiteClear(dimension,p))return p;
  }
}
function buildFortuneArchive(state,dimension){
  const bx=Math.floor(state.center.x),by=Math.floor(state.center.y),bz=Math.floor(state.center.z);
  const P={
    floor:mc.BlockPermutation.resolve("minecraft:polished_tuff"),
    trim:mc.BlockPermutation.resolve("minecraft:tuff_bricks"),
    shelf:mc.BlockPermutation.resolve("minecraft:bookshelf"),
    wood:mc.BlockPermutation.resolve("minecraft:dark_oak_planks"),
    light:mc.BlockPermutation.resolve("minecraft:sea_lantern"),
    codex:mc.BlockPermutation.resolve("lb:archive_codex"),
    gold:mc.BlockPermutation.resolve("minecraft:gold_block"),
    lapis:mc.BlockPermutation.resolve("minecraft:lapis_block"),
    emerald:mc.BlockPermutation.resolve("minecraft:emerald_block"),
    amethyst:mc.BlockPermutation.resolve("minecraft:amethyst_block")
  };
  let placed=0;
  function put(dx,dy,dz,p){try{const b=dimension.getBlock({x:bx+dx,y:by+dy,z:bz+dz});if(!b)return;b.setPermutation(p);placed++;}catch{}}
  for(let dx=-8;dx<=8;dx++)for(let dz=-8;dz<=8;dz++)put(dx,-1,dz,(Math.abs(dx)===8||Math.abs(dz)===8)?P.trim:P.floor);
  for(let x=-8;x<=8;x++)for(const z of [-8,8])if(!(z===8&&Math.abs(x)<=1))for(let y=0;y<=2;y++)put(x,y,z,P.trim);
  for(let z=-7;z<=7;z++)for(const x of [-8,8])for(let y=0;y<=2;y++)put(x,y,z,P.trim);
  for(const [dx,dz] of [[-6,-6],[-6,6],[6,-6],[6,6]]){for(let y=0;y<=3;y++)put(dx,y,dz,P.shelf);put(dx,4,dz,P.light);}
  for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)if(Math.abs(dx)===2||Math.abs(dz)===2)put(dx,0,dz,P.wood);
  const ped=[P.gold,P.lapis,P.emerald,P.amethyst];
  const offsets=archiveCodexOffsets();
  for(let i=0;i<offsets.length;i++){
    const [dx,dz]=offsets[i];put(dx,-1,dz,ped[i]);put(dx,0,dz,P.codex);
    for(const [ox,oz] of [[1,0],[-1,0],[0,1],[0,-1]])put(dx+ox,-1,dz+oz,P.wood);
  }
  put(0,-1,0,P.light);
  state.structureBuilt=placed>=430;
  return state.structureBuilt;
}
function restoreArchiveCodices(state,dimension){
  for(let i=0;i<4;i++){
    const p=archiveCodexPoint(state,i);
    try{const b=dimension.getBlock(p);if(b?.typeId!=="lb:archive_codex")b?.setPermutation(mc.BlockPermutation.resolve("lb:archive_codex"));}catch{}
  }
}
function shuffledArchiveSequence(){
  const a=[0,1,2,3];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}
function pulseArchiveCodex(state,dimension,index){
  const p=archiveCodexPoint(state,index),c={x:p.x+.5,y:p.y+.45,z:p.z+.5};
  try{dimension.spawnParticle("lb:obsidilith_burst",c);}catch{}
  for(const [dx,dz] of [[.8,0],[-.8,0],[0,.8],[0,-.8]])try{dimension.spawnParticle("lb:slasher_spark_particle",{x:c.x+dx,y:c.y+.1,z:c.z+dz});}catch{}
  try{dimension.playSound("break.amethyst_cluster",c,{volume:.65,pitch:1.02+index*.08});}catch{}
}
function resetArchiveReveal(state,dimension,wrong=false){
  state.stage=1;state.revealTicks=0;state.revealIndex=0;state.progress=0;state.completePending=false;
  if(wrong)messageNear(dimension,state.center,"§c[Fortune Archive] 순서가 틀렸습니다. 기록을 다시 재생합니다.");
}
function finishFortuneArchive(state,dimension){
  spawnItem(dimension,state.center,"lb:rare_fragment",4+Math.floor(Math.random()*3));
  spawnItem(dimension,state.center,"lb:common_lucky_block",1);
  spawnItem(dimension,state.center,"lb:fortune_tonic",2);
  if(Math.random()<0.25)spawnItem(dimension,state.center,"lb:reward_camera",1);
  if(Math.random()<0.20)spawnItem(dimension,state.center,"lb:threat_sunglasses",1);
  try{dimension.playSound("slasher.critical",state.center,{volume:.72,pitch:1.12});}catch{}
  try{dimension.spawnParticle("lb:obsidilith_burst",{x:state.center.x,y:state.center.y+.4,z:state.center.z});}catch{}
  messageNear(dimension,state.center,"§b[레어 럭키] Fortune Archive 해독 완료! 서고는 월드에 남습니다.");
}
function tickFortuneArchive(state,dimension){
  state.elapsed=(state.elapsed??0)+STEP;
  if(state.elapsed>18000){
    spawnItem(dimension,state.center,"lb:rare_fragment",2);
    messageNear(dimension,state.center,"§8[레어 럭키] Fortune Archive가 잠겼습니다. 레어 조각 2개를 남겼습니다.");
    return true;
  }
  if((state.stage??0)===0){
    if(!buildFortuneArchive(state,dimension)){
      spawnItem(dimension,state.center,"lb:rare_fragment",3);
      messageNear(dimension,state.center,"§8[레어 럭키] 서고를 만들 공간이 없어 레어 조각 3개로 보상했습니다.");
      return true;
    }
    state.sequence=shuffledArchiveSequence();state.attempts=0;
    resetArchiveReveal(state,dimension,false);
    messageNear(dimension,state.center,"§b[레어 럭키] Fortune Archive — 네 권의 서고 기록이 빛나는 순서를 기억한 뒤 책을 같은 순서로 누르세요. 여러 명이 이어서 눌러도 됩니다.");
    return false;
  }
  restoreArchiveCodices(state,dimension);
  if(state.completePending){finishFortuneArchive(state,dimension);return true;}
  if(state.stage===1){
    state.revealTicks=(state.revealTicks??0)+STEP;
    if(state.revealTicks<20)return false;
    state.revealTicks=0;
    const sequence=Array.isArray(state.sequence)&&state.sequence.length===4?state.sequence:[0,1,2,3];
    const idx=sequence[state.revealIndex??0];
    if(Number.isInteger(idx))pulseArchiveCodex(state,dimension,idx);
    state.revealIndex=(state.revealIndex??0)+1;
    if(state.revealIndex>=4){
      state.stage=2;state.progress=0;
      messageNear(dimension,state.center,"§f[Fortune Archive] 기록 재생 완료 — 이제 §b같은 순서§f로 네 권의 책을 누르세요.");
    }
  }
  return false;
}
function archiveStateForBlock(states,dimensionId,location){
  for(const state of states){
    if(state.type!=="fortune_archive")continue;
    if(!(dimensionId===state.dimension||dimensionId.endsWith(":"+state.dimension)))continue;
    for(let i=0;i<4;i++){const p=archiveCodexPoint(state,i);if(p.x===location.x&&p.y===location.y&&p.z===location.z)return{state,index:i};}
  }
}
mc.world.afterEvents.playerInteractWithBlock.subscribe(event=>{
  if(event.block?.typeId!=="lb:archive_codex"||event.isFirstEvent===false)return;
  const states=loadStates(),found=archiveStateForBlock(states,event.block.dimension.id,event.block.location);if(!found)return;
  const state=found.state,dimension=event.block.dimension;
  if(state.stage!==2){
    try{event.player.sendMessage("§7[Fortune Archive] 기록 재생이 끝날 때까지 기다리세요.");}catch{}
    return;
  }
  const sequence=Array.isArray(state.sequence)&&state.sequence.length===4?state.sequence:[0,1,2,3];
  const progress=Number(state.progress??0),expected=sequence[progress];
  if(found.index!==expected){
    state.attempts=(state.attempts??0)+1;resetArchiveReveal(state,dimension,true);saveStates(states);return;
  }
  state.progress=progress+1;pulseArchiveCodex(state,dimension,found.index);
  try{event.player.onScreenDisplay.setActionBar("§bFortune Archive §8— §f"+state.progress+"/4");}catch{}
  if(state.progress>=4)state.completePending=true;
  saveStates(states);
});


function minefieldOffsets(){
  return [[-5,-5],[0,-5],[5,-5],[-5,0],[5,0],[-5,5],[0,5],[5,5],[-2,-2],[2,-2],[-2,2],[2,2]];
}
function minefieldSiteClear(dimension,center){
  const bx=Math.floor(center.x),by=Math.floor(center.y),bz=Math.floor(center.z);
  for(const [dx,dz] of [[-7,-7],[-7,7],[7,-7],[7,7],[0,0],[-7,0],[7,0],[0,-7],[0,7]]){
    const g=groundAt(dimension,bx+dx,by,bz+dz);if(!g||Math.abs(g.y-by)>1)return false;
  }
  for(let dx=-7;dx<=7;dx+=2)for(let dz=-7;dz<=7;dz+=2)for(let dy=0;dy<=4;dy++){
    try{if(dimension.getBlock({x:bx+dx,y:by+dy,z:bz+dz})?.typeId!=="minecraft:air")return false;}catch{return false;}
  }
  return true;
}
function findMinefieldSite(dimension,center){
  for(const [dx,dz] of [[0,0],[22,0],[-22,0],[0,22],[0,-22],[22,22],[-22,22],[22,-22],[-22,-22],[34,0],[-34,0],[0,34],[0,-34]]){
    const g=groundAt(dimension,center.x+dx,center.y,center.z+dz);if(!g)continue;
    const p={x:g.x+0.5,y:g.y,z:g.z+0.5};if(minefieldSiteClear(dimension,p))return p;
  }
}
function minefieldBombPoint(state,index){
  const [dx,dz]=minefieldOffsets()[index]??[0,0];
  return{x:Math.floor(state.center.x+dx),y:Math.floor(state.center.y),z:Math.floor(state.center.z+dz)};
}
function buildFortuneMinefield(state,dimension){
  const bx=Math.floor(state.center.x),by=Math.floor(state.center.y),bz=Math.floor(state.center.z);
  const P={
    floor:mc.BlockPermutation.resolve("minecraft:polished_deepslate"),
    trim:mc.BlockPermutation.resolve("minecraft:copper_block"),
    edge:mc.BlockPermutation.resolve("minecraft:deepslate_tiles"),
    light:mc.BlockPermutation.resolve("minecraft:sea_lantern"),
    bomb:mc.BlockPermutation.resolve("lb:fortune_bomb")
  };
  let placed=0;
  function put(dx,dy,dz,p){try{const b=dimension.getBlock({x:bx+dx,y:by+dy,z:bz+dz});if(!b)return;b.setPermutation(p);placed++;}catch{}}
  for(let dx=-7;dx<=7;dx++)for(let dz=-7;dz<=7;dz++)put(dx,-1,dz,(Math.abs(dx)===7||Math.abs(dz)===7)?P.edge:P.floor);
  for(const [dx,dz] of [[-7,-7],[-7,7],[7,-7],[7,7]]){for(let y=0;y<=2;y++)put(dx,y,dz,P.trim);put(dx,3,dz,P.light);}
  for(const [dx,dz] of minefieldOffsets())put(dx,0,dz,P.bomb);
  state.structureBuilt=placed>=245;return state.structureBuilt;
}
function minefieldActiveSet(state){return new Set(Array.isArray(state.activeBombs)?state.activeBombs:[]);}
function restoreInactiveBombs(state,dimension){
  const active=minefieldActiveSet(state),spent=Number(state.spentMask??0);
  for(let i=0;i<12;i++){
    if((spent&(1<<i))!==0||active.has(i))continue;
    const p=minefieldBombPoint(state,i);
    try{const b=dimension.getBlock(p);if(b?.typeId!=="lb:fortune_bomb")b?.setPermutation(mc.BlockPermutation.resolve("lb:fortune_bomb"));}catch{}
  }
}
function chooseMinefieldWave(state,dimension){
  const spent=Number(state.spentMask??0),pool=[];
  for(let i=0;i<12;i++){
    if((spent&(1<<i))!==0)continue;
    const p=minefieldBombPoint(state,i);
    try{if(dimension.getBlock(p)?.typeId==="lb:fortune_bomb")pool.push(i);}catch{}
  }
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  state.activeBombs=pool.slice(0,Math.min(3,pool.length));
  state.detonateAt=(state.elapsed??0)+30;
  state.wave=(state.wave??0)+1;
  if(state.activeBombs.length)messageNear(dimension,state.center,"§c[Fortune Minefield] "+state.wave+"차 기폭 — 빛나는 폭탄을 빨리 부수거나 폭발 반경에서 벗어나세요!");
}
function pulseMinefieldBomb(dimension,p){
  const c={x:p.x+.5,y:p.y+.45,z:p.z+.5};
  try{dimension.spawnParticle("lb:obsidilith_indicator",c);}catch{}
  for(const [dx,dz] of [[.7,0],[-.7,0],[0,.7],[0,-.7]])try{dimension.spawnParticle("lb:slasher_spark_particle",{x:c.x+dx,y:c.y+.05,z:c.z+dz});}catch{}
  try{dimension.playSound("random.fuse",c,{volume:.45,pitch:1.2});}catch{}
}
function detonateMinefieldBomb(state,dimension,index){
  const p=minefieldBombPoint(state,index),center={x:p.x+.5,y:p.y+.25,z:p.z+.5};
  try{dimension.getBlock(p)?.setPermutation(mc.BlockPermutation.resolve("minecraft:air"));}catch{}
  state.spentMask=(Number(state.spentMask??0)|(1<<index));
  try{dimension.spawnParticle("lb:obsidilith_burst",center);}catch{}
  try{dimension.playSound("random.explode",center,{volume:.72,pitch:1.08});}catch{}
  for(const player of playersNear(dimension,center,4.5)){
    const d2=distSq(player.location,center);if(d2>3.4*3.4)continue;
    try{player.applyDamage(d2<1.7*1.7?16:10,{cause:mc.EntityDamageCause.entityExplosion});}catch{try{player.applyDamage(d2<1.7*1.7?16:10);}catch{}}
    const dx=player.location.x-center.x,dz=player.location.z-center.z,len=Math.max(.001,Math.hypot(dx,dz));
    try{player.applyImpulse({x:dx/len*.72,y:.24,z:dz/len*.72});}catch{}
  }
}
function finishFortuneMinefield(state,dimension){
  spawnItem(dimension,state.center,"lb:rare_fragment",3+Math.floor(Math.random()*3));
  spawnItem(dimension,state.center,"lb:fortune_tonic",1);
  const disarmed=Number(state.disarmed??0);
  if(disarmed>=6)spawnItem(dimension,state.center,"lb:epic_fragment",1);
  if(disarmed>=9)spawnItem(dimension,state.center,"lb:rare_lucky_block",1);
  messageNear(dimension,state.center,"§6[레어 럭키] Fortune Minefield 생존 완료! 해체 "+disarmed+"/12.");
}
function cleanupMinefield(state,dimension){
  for(let i=0;i<12;i++){const p=minefieldBombPoint(state,i);try{const b=dimension.getBlock(p);if(b?.typeId==="lb:fortune_bomb")b.setPermutation(mc.BlockPermutation.resolve("minecraft:air"));}catch{}}
}
function tickFortuneMinefield(state,dimension){
  state.elapsed=(state.elapsed??0)+STEP;
  if(state.elapsed>18000){cleanupMinefield(state,dimension);spawnItem(dimension,state.center,"lb:rare_fragment",2);messageNear(dimension,state.center,"§8[레어 럭키] Fortune Minefield가 비활성화되었습니다.");return true;}
  if((state.stage??0)===0){
    if(!buildFortuneMinefield(state,dimension)){spawnItem(dimension,state.center,"lb:rare_fragment",3);messageNear(dimension,state.center,"§8[레어 럭키] 지뢰장을 만들 공간이 없어 레어 조각 3개로 보상했습니다.");return true;}
    state.stage=1;state.wave=0;state.spentMask=0;state.disarmed=0;state.activeBombs=[];state.nextWaveAt=state.elapsed+35;
    messageNear(dimension,state.center,"§6[레어 럭키] Fortune Minefield — 네 차례 기폭을 버티세요. 경고 중인 폭탄은 직접 부숴 해체할 수 있습니다.");
    return false;
  }
  restoreInactiveBombs(state,dimension);
  const active=Array.isArray(state.activeBombs)?state.activeBombs:[];
  if(active.length){
    const still=[];
    for(const i of active){
      const p=minefieldBombPoint(state,i),live=(()=>{try{return dimension.getBlock(p)?.typeId==="lb:fortune_bomb";}catch{return false;}})();
      if(!live){state.spentMask=(Number(state.spentMask??0)|(1<<i));state.disarmed=(state.disarmed??0)+1;continue;}
      if((state.elapsed%10)===0)pulseMinefieldBomb(dimension,p);
      still.push(i);
    }
    state.activeBombs=still;
    if((state.elapsed??0)>=(state.detonateAt??Infinity)){
      for(const i of still)detonateMinefieldBomb(state,dimension,i);
      state.activeBombs=[];state.nextWaveAt=state.elapsed+35;
    }
  }
  if(Number(state.spentMask??0)===4095&&(!state.activeBombs||state.activeBombs.length===0)){finishFortuneMinefield(state,dimension);return true;}
  if((!state.activeBombs||state.activeBombs.length===0)&&(state.elapsed??0)>=(state.nextWaveAt??0)){
    chooseMinefieldWave(state,dimension);
  }
  return false;
}

export function startPreDragonEvent(dimension,center,type){
  if(type!=="awakened_grove"&&type!=="fortune_relay"&&type!=="royal_anthill"&&type!=="fortune_bulwark"&&type!=="fortune_gallery"&&type!=="butterfly_sanctuary"&&type!=="void_garden"&&type!=="fortune_archive"&&type!=="fortune_minefield")return false;
  if(!dimension.id.includes("overworld"))return false;
  const site=type==="awakened_grove"
    ?findGroveSite(dimension,center)
    :type==="fortune_relay"
      ?findRelaySite(dimension,center)
      :type==="royal_anthill"
        ?findAnthillSite(dimension,center)
        :type==="fortune_bulwark"
          ?findBulwarkSite(dimension,center)
          :type==="fortune_gallery"
            ?findGallerySite(dimension,center)
            :type==="butterfly_sanctuary"
              ?findSanctuarySite(dimension,center)
              :type==="void_garden"
                ?findVoidGardenSite(dimension,center)
                :type==="fortune_archive"
                  ?findArchiveSite(dimension,center)
                  :findMinefieldSite(dimension,center);
  if(!site)return false;
  const states=loadStates();if(states.length>=MAX_ACTIVE)return false;
  const overlap=type==="fortune_relay"?56:type==="royal_anthill"?56:type==="fortune_bulwark"?52:type==="fortune_gallery"?58:type==="butterfly_sanctuary"?52:type==="void_garden"?58:type==="fortune_archive"?50:type==="fortune_minefield"?50:48;
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
              :state.type==="fortune_gallery"
                ?tickFortuneGallery(state,dimension)
                :state.type==="butterfly_sanctuary"
                  ?tickButterflySanctuary(state,dimension)
                  :state.type==="void_garden"
                    ?tickVoidGarden(state,dimension)
                    :state.type==="fortune_archive"
                      ?tickFortuneArchive(state,dimension)
                      :state.type==="fortune_minefield"
                        ?tickFortuneMinefield(state,dimension)
                        :true;
    }catch{done=false;}
    if(!done)next.push(state);
  }
  saveStates(next);
},STEP);
