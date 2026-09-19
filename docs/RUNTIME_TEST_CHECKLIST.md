# Lucky Block Bedrock Runtime Test Checklist

Target: 0.38.0 Core Loop Recovery test candidate

This checklist begins only after `tools/preflight.mjs` passes and `LuckyBlock_0.37.0_TEST.mcaddon` is produced. Static success is not a gameplay-pass claim.

## Import gate
- Import the .mcaddon into current stable Minecraft Bedrock.
- Confirm both Lucky Block Behavior and Resource packs appear and activate together.
- Create one new test world with no other add-ons.
- Re-open the world after saving once.
- Content Log: zero pack JSON/script/model/texture/sound errors.
- No missing/purple-black textures, invisible production entities or broken held-item models.

## Core visibility / recipe gate
- In Creative **All Items**, searching "럭키" (or "Lucky") must show all 5 Lucky Fragments and all 5 Lucky Blocks as explicit inventory items.
- `/give @s lb:common_fragment` and `/give @s lb:common_lucky_block` must both resolve.
- Placing each Lucky Block inventory item must create the corresponding tier block and interacting with it must consume/open that placed block.
- The recipe book must show all 5 six-fragment crafting recipes and all 4 upward-fusion recipes without requiring a hidden discovery trigger.
- Survival sanity: 12 common ores without a random common-fragment hit must still produce one by pity; 20 eligible hostile kills likewise must not remain completely dry.
- Verify fragments are inventory currency items, not placeable public blocks.

## Core progression smoke test
- Obtain/open Common, Rare, Epic, Legendary and Mythic Lucky Blocks.
- Verify acquisition from at least mining, logging, farming, fishing, normal combat and chest/exploration.
- Verify fusion upward once at every tier boundary.
- Confirm first Ender Dragon kill persists the post-dragon unlock after save/reload.
- Before that unlock, post-dragon direct/spawn content must not appear.

## 0.34–0.36 regression focus
- Fortune Gallery: Gallery Slugs score; vanilla snowballs are neither consumed nor cleaned.
- Cave Dweller: body/eyes render correctly; stare/freeze/chase/flee and vertical crawl pressure work.
- Flashbang: held model, throw, fuse, enemy control and multiplayer PvP safeguard.
- Smoke Grenade: held/thrown model, persistent smoke zone, concealment/control and cleanup after reload.
- Lucky Guitar: repeated use respects cooldown and does not affect unintended distant players.
- Rift Burrower: burrow/invisibility relocation/emergence work without teleporting into blocks.
- Recall Gravestone: death record persists; same-dimension and cross-dimension safe recall work; failed recall does not consume it.
- Fortune Mirror: no-debuff interaction does not consume; supported debuffs convert correctly.
- Lucky Air Conditioner: fire/soul fire cleanup, entity extinguish and Fire Resistance work.
- Lich: 161-bone visual renders at sane scale; missile/comet telegraphs are readable; Phantom cap/owner cleanup works; teleport is safe; rage triggers below 45%; Lich does not globally change world time.

## Major encounter smoke test
- Void Garden / Void Blossom roots and vulnerability.
- Gauntlet shield anchors and vulnerability windows.
- Rift Arsenal stage progression.
- Rift Reliquary key → minefield → rune → mixed final encounter.
- Lucky Rain and Rift Siege complete without leaving permanent stale state.
- Save/quit/reload during at least one persistent/chained event and resume it.

## Multiplayer gate
Test with at least two players in the same world.
- Simultaneous Lucky opening does not mix opener ownership or rewards.
- Shared events accept both players without duplicate stage completion.
- One player leaving/rejoining does not softlock the other.
- Smoke, Flashbang, Gallery, Lich minions and persistent event state behave independently/correctly per player.
- Cross-event global caps/distance guards prevent overlapping permanent structures.
- Death/recall records do not cross between players.

## Balance sampling
- Pre-dragon Epic rewards do not trivialize the Ender Dragon.
- Post-dragon normal/elite enemies feel stronger than vanilla endgame without becoming HP-only fights.
- Legendary Lich, Bogre, Cave Dweller, Spitter, Charger and Burrower have visibly different counterplay.
- Mythic outcomes feel like content packages rather than one oversized stat reward.

## Pass condition
A runtime release candidate can be called complete only when:
1. import/content-log gate passes;
2. all critical regressions above pass;
3. multiplayer gate passes;
4. no progression softlock or item duplication exploit is found;
5. fixes are re-packaged and the checklist is rerun on the changed areas.
