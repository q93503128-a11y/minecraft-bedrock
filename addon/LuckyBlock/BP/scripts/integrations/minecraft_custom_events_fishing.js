import { system, world } from "@minecraft/server";

// Adapted from yuki2825624/MinecraftCustomEvents player fish event (MIT),
// pinned in vendor/ASSET_REGISTRY.json. The original event pairs a fishing
// hook lifecycle with its player and confirms a catch by finding the spawned
// item at hook removal. This port keeps that event-based contract, removes
// the upstream custom EventSignal dependency/deprecated isValid() polling,
// and hardens same-tick ordering + multiplayer cast matching.

const pendingCasts = [];
const unclaimedHooks = [];
const hooks = new Map();
const recentItems = [];
const subscribers = new Set();

let tick = 0;

function distanceSq(a,b){
  const dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z;
  return dx*dx+dy*dy+dz*dz;
}

function cleanupQueues(){
  while(pendingCasts.length && pendingCasts[0].expires < tick) pendingCasts.shift();
  while(unclaimedHooks.length && unclaimedHooks[0].expires < tick) unclaimedHooks.shift();
  while(recentItems.length && recentItems[0].expires < tick) recentItems.shift();
}

function rememberCast(player){
  pendingCasts.push({
    player,
    dimensionId:player.dimension.id,
    location:{...player.location},
    expires:tick+3
  });
}

function rememberHook(entity){
  unclaimedHooks.push({
    entity,
    dimensionId:entity.dimension.id,
    location:{...entity.location},
    expires:tick+3
  });
}

function matchCastsAndHooks(){
  cleanupQueues();
  for(let hi=unclaimedHooks.length-1;hi>=0;hi--){
    const hookRec=unclaimedHooks[hi];
    let bestIndex=-1,bestDistance=64;
    for(let ci=0;ci<pendingCasts.length;ci++){
      const cast=pendingCasts[ci];
      if(cast.dimensionId!==hookRec.dimensionId) continue;
      const d=distanceSq(cast.location,hookRec.location);
      if(d<bestDistance){bestDistance=d;bestIndex=ci;}
    }
    if(bestIndex<0) continue;
    const cast=pendingCasts.splice(bestIndex,1)[0];
    unclaimedHooks.splice(hi,1);
    hooks.set(hookRec.entity.id,{
      hook:hookRec.entity,
      player:cast.player,
      wet:false
    });
  }
}

function itemStackOf(entity){
  try{
    return entity.getComponent("minecraft:item")?.itemStack;
  }catch{
    return undefined;
  }
}

function emitCatch(player,dimension,location,itemEntity,itemStack){
  for(const subscriber of subscribers){
    try{subscriber({player,dimension,location,itemEntity,itemStack});}catch{}
  }
}

function recentCaughtItem(dimension,location){
  let best,bestSq=9;
  for(const rec of recentItems){
    if(rec.dimensionId!==dimension.id) continue;
    const d=distanceSq(rec.location,location);
    if(d<bestSq){best=rec;bestSq=d;}
  }
  return best;
}

world.afterEvents.itemUse.subscribe(event=>{
  if(event.itemStack?.typeId!=="minecraft:fishing_rod") return;
  if(event.source?.typeId!=="minecraft:player") return;
  rememberCast(event.source);
  matchCastsAndHooks();
});

world.afterEvents.entitySpawn.subscribe(event=>{
  const entity=event.entity;
  if(entity.typeId==="minecraft:fishing_hook"){
    rememberHook(entity);
    matchCastsAndHooks();
    return;
  }
  if(entity.typeId!=="minecraft:item") return;
  const stack=itemStackOf(entity);
  if(!stack) return;
  recentItems.push({
    entity,
    itemStack:stack,
    dimensionId:entity.dimension.id,
    location:{...entity.location},
    expires:tick+4
  });
});

world.beforeEvents.entityRemove.subscribe(event=>{
  const entity=event.removedEntity;
  if(entity.typeId!=="minecraft:fishing_hook") return;
  const tracked=hooks.get(entity.id);
  if(!tracked) return;
  hooks.delete(entity.id);
  if(!tracked.wet) return;

  const dimension=entity.dimension;
  const location={...entity.location};
  const immediate=recentCaughtItem(dimension,location);
  if(immediate){
    emitCatch(tracked.player,dimension,location,immediate.entity,immediate.itemStack);
    return;
  }

  // Some engine builds create the fished item one tick after the hook remove
  // signal. Check once after the current event without treating a bare reel-in
  // as a catch.
  system.run(()=>{
    const delayed=recentCaughtItem(dimension,location);
    if(delayed) emitCatch(tracked.player,dimension,location,delayed.entity,delayed.itemStack);
  });
});

system.runInterval(()=>{
  tick++;
  cleanupQueues();
  matchCastsAndHooks();

  for(const [id,tracked] of hooks){
    try{
      if(tracked.hook.isInWater) tracked.wet=true;
    }catch{
      hooks.delete(id);
    }
  }
},1);

export function subscribeFishingCatch(callback){
  subscribers.add(callback);
  return ()=>subscribers.delete(callback);
}
