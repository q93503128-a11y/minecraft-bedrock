# Lucky Block Add-On source status

Milestone: 0.1.0 real-asset vertical slice

Implemented:
- Behavior Pack and Resource Pack manifests.
- Common Lucky Block using an actual Microsoft MIT sample geometry/texture base.
- Common Lucky Fragment using an actual CC0 animated crystal texture and a Bedrock conversion of the CC0 bipyramid geometry.
- Script API V2-style custom component registration via system.beforeEvents.startup.
- First actual Common outcome: Crystal Burst, yielding 2–5 Common Lucky Fragments.
- Six Common Fragments craft one Common Lucky Block.
- Korean and English display names.
- Source-specific licensing notes.
- Built `build/LuckyBlock_BP_0.1.0.mcpack`.
- Built `build/LuckyBlock_RP_0.1.0.mcpack`.
- Built `build/LuckyBlock_0.1.0.mcaddon`.
- Re-read the generated package: both nested mcpack archives and every contained entry pass CRC validation.
- Source reference audit passes for BP/RP UUID dependencies, geometry IDs, texture atlas keys, fragment flipbook, custom component registration and @minecraft/server dependency.

Still required before this slice can be called runtime-validated:
- Import the .mcaddon into Minecraft Bedrock and inspect the Content Log.
- Place/open the Common Lucky Block, verify fragment render animation/collision, and verify the 6-fragment recipe in-game.

Project work still outstanding:
- Rare/Epic/Legendary/Mythic blocks and fragment visuals.
- full Common reward library.
- acquisition hooks.
- external custom weapon/item rewards.
- mobs, structures and events.
- first-Ender-Dragon late-game gate.
- balance passes and full release QA.

There are intentionally no temporary images, dummy sounds, colored stand-in mobs or vanilla filler reward tables.
