# Minecraft Bedrock Projects

Canonical planning/documentation repository for Minecraft Bedrock projects.

## Lucky Block Add-On

Active project: a five-tier Lucky Block Add-On with externally licensed real assets, varied rewards/events and a first-Ender-Dragon late-game gate.

Current source milestone:
- `0.8.0` — first native Bedrock 3D Legendary weapon integration

Latest packaged development build:
- `build/LuckyBlock_0.2.0.mcaddon`

0.8.0 source now contains:
- five Lucky Block tiers and five Lucky Fragment tiers;
- actual Microsoft MIT + CorvaeOboro CC0 production visuals;
- 15 CC0 Loy's Goodies 3D reward models with original embedded textures;
- distinct scripted functionality across those 15 rewards;
- Common/Rare/Epic weighted external reward pools;
- mining, logging, farming and combat acquisition;
- first-open natural chest/trapped-chest/barrel exploration acquisition with anti-abuse tracking;
- persistent first-Ender-Dragon late-game unlock.

Important:
- 0.4.0 is not the completed add-on.
- The latest downloadable package remains 0.2.0 until the next packaging checkpoint.
- No placeholder image/model/icon/sound is allowed.
- Fishing, true held combat equipment, pets/mounts, structures/events, post-dragon custom mobs/bosses and Mythic content packages remain under development.

Project documents:
- `docs/LUCKY_BLOCK_CANON.md`
- `docs/EXTERNAL_ASSET_CATALOG.md`
- `docs/LICENSE_NOTES.md`
- `docs/IMPLEMENTATION_ROADMAP.md`
- `docs/ACQUISITION_BALANCE.md`
- `addon/LuckyBlock/STATUS.md`
- `addon/LuckyBlock/THIRD_PARTY_NOTICES.md`

- external source revisions pinned in `addon/LuckyBlock/vendor/ASSET_REGISTRY.json`;
- source-specific integration modules under `BP/scripts/integrations/`;
- one-BP + one-RP cooperative packaging policy with RP world scope;

- four pinned external sources currently active in the vendor registry;
- FrenchKrab CC BY 4.0 cardboard sword/axe/shield integrated through a separate source adapter with attribution;
- 18 external reward IDs currently referenced by the reward registry.

- Inhabitants Impaler as an actual pre-dragon elite with original model/animation/texture/audio;
- Inhabitants Warped Clam as an actual post-dragon End enemy with persistent Dragon-gate spawning;
- Lucky-specific combat stats, special attacks and drops for both custom enemies.

- Inhabitants Bogre as a phased Lucky miniboss using its original model, 21 animations, texture and combat audio;
- jump-dodge shockwave mechanics and temporary vulnerability windows instead of HP-sponge-only difficulty;
- Bogre encounter outcomes in Epic/Legendary Lucky reward pools.

- Bogre rebalanced to a 1800-HP post-dragon Legendary encounter;
- Bosses of Mass Destruction Obsidilith integrated as a 9000-HP Mythic post-dragon boss;
- original Obsidilith rune, particle art and combat audio with rune-shield / exposed-window mechanics;
- no placeholder or assistant-drawn art in the new boss batch.

- LC Studios Slasher Sword Addon vendored as a native Bedrock held Legendary weapon with original icons, FP/TP models, animations, beams, particles, sounds and combat script;
- Slasher compatibility-ported from @minecraft/server 1.18.0 to 2.9.0 and gated behind first Ender Dragon kill;
- Slasher Blade repair drops integrated into Bogre and Obsidilith.


## PlainKingdoms Marketplace Remake

Planning baseline: uploaded Bedrock build `PlainKingdoms v1.1.5`.

Current local remake milestone: `1.9.0 Remake Alpha 8` — war-only strategic encounters, reinforcement joining, time-based abstract combat, HP-continuous physical battle materialization, and battle logging on top of the Alpha 7 formation/SquadBrain foundation.

PlainKingdoms is being remade as a Minecraft-first kingdom game with direct world play, tactical army command, and chunk-independent strategic simulation. GitHub is the canonical planning/documentation repository; runtime Bedrock source/build work is handled separately unless explicitly promoted here.

Canonical remake documents:
- `docs/plainkingdoms/REMAKE_CANON.md`
- `docs/plainkingdoms/RTS_REFERENCE_AND_UX.md`
- `docs/plainkingdoms/IMPLEMENTATION_ROADMAP.md`
- `docs/plainkingdoms/RUNTIME_TEST_MATRIX.md`
- `docs/plainkingdoms/CURRENT_STATUS.md`
- `docs/plainkingdoms/EXTERNAL_ASSET_PROVENANCE.md`

Current completed foundation:
- proactive physical/strategic army handoff;
- nation/world-authoritative StrategicArmyState;
- long-range terrain command fallback;
- barracks recruitment queue and RallyPoint;
- three primary system tools;
- categorized/rotatable construction and two-point infrastructure;
- Kenney CC0-derived mixed-composition six-representative squad presentation;
- animation-synchronized combat hit frames;
- SquadBrain role behavior;
- Auto/manual Block, Line, Column, Wedge and Loose formations;
- formation-aware multi-army targets and local separation;
- strategic War encounter detection;
- nearby strategic reinforcement merge;
- deterministic time-based abstract army combat;
- abstract -> physical -> abstract battle continuity using the same StrategicArmyState HP;
- battle log and pre-encounter route restoration.

Next major work:
- R9 diplomacy states/treaty permissions and strategic allied reinforcement march;
- campaign consequences / supply / siege expansion;
- visible ranged and siege projectile presentation;
- tactical camera and strategic-map command surface;
- Marketplace onboarding/accessibility/mobile/multiplayer validation.
