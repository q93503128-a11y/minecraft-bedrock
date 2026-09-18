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
export function startPreDragonEvent(dimension,center,type){
  if(type!=="awakened_grove")return false;
  if(!dimension.id.includes("overworld"))return false;
  const site=findGroveSite(dimension,center);if(!site)return false;
  const states=loadStates();if(states.length>=MAX_ACTIVE)return false;
  for(const s of states)if(s.dimension==="overworld"&&distSq(s.center,site)<48*48)return false;
  states.push({id:nextId(),type,dimension:"overworld",center:site,stage:0,elapsed:0});saveStates(states);return true;
}
mc.system.runInterval(()=>{
  const states=loadStates();if(!states.length)return;const next=[];
  for(const state of states){
    let dimension;try{dimension=mc.world.getDimension(state.dimension);}catch{continue;}
    if(playersNear(dimension,state.center,56).length===0){next.push(state);continue;}
    let done=false;try{done=state.type==="awakened_grove"?tickGrove(state,dimension):true;}catch{done=false;}
    if(!done)next.push(state);
  }
  saveStates(next);
},STEP);
