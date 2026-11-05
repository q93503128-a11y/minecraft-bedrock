# Port decisions and evidence

Date: 2026-11-05

## Canon reconciliation

The Java project's declared authority order makes `AUGMENTS.md` the roster canon and the bundled catalog the runtime identity table. This import retains stable catalog IDs and tier order while sourcing displayed Korean name, maximum level, and effect from the canon table. Every catalog name/maximum-level difference remains in `catalog_discrepancy`; three differences were detected. Seven entries did not have a Java source file with a literal stable catalog ID, so source mapping is incomplete rather than inferred from filenames. The read-only Java checkout was fast-forward-inspected at `e4b2dd41e1564a4b713c722a004f87e76921c0da`; no changes in the target project directory were present between the first checkout and that latest `main`.

Original source files are preserved under `docs/java-canon/`. `docs/augment-roster.json` and `docs/PORT_MATRIX.csv` are generated with `tools/import_canon.py` and include exact canonical effect text, max level, tier, Java source-file hits, interaction-contract line references, and outstanding compatibility/test/port fields.

## Bedrock API classification (initial, conservative)

This is a family-level feasibility assessment. Per-entry compatibility is still marked `Not assessed` in the matrix until the effect's API surface and fallback are investigated.

| Java feature family | Initial class | Candidate Bedrock route | Limits / status |
| --- | --- | --- | --- |
| Core/item recipes, candidate form, owned-level state, 3:1 synthesis | B | Stable `world.afterEvents.itemUse`, `@minecraft/server-ui` forms, inventory container, player dynamic properties | Global item-use event avoids custom item components V2, which currently require Beta APIs. BDS exercises the shared server transaction for core consumption, level save, and max-level rejection; simulated players cannot validate the visible form. Loot-based core acquisition not ported. |
| Health boost (`강건함`) | A | Stable player effect API; reapply from persisted level after spawn and on a bounded interval | BDS GameTest confirms max-health scaling at levels 1 and 5. Awarding and saved-level restoration across reconnect remain untested. |
| Event-driven combat, drops, harvest, fishing, death, taming | B | `world.beforeEvents.entityHurt` can adjust incoming event damage; server after-events and tracked state cover other mechanics | `날 선 감각` has a source implementation for root melee scaling, but the BDS simulated-player hurt callback did not provide an event payload. Validate real-player event routing before counting it. Root/derived provenance remains to assess per feature. |
| Movement/flight, camera/outline, detailed projectile-segment provenance | C candidate | Server tick/state reconstruction, custom projectiles, equipment/item actions, client RP presentation where available | Some event ordering and client-presentation parity may differ. Not yet confirmed unavoidable for every feature. |
| Exact arbitrary-key binds and Java desktop screens | C (interface only) | Item-use entry points and static forms usable by touch, controller, and mouse | Java controls/screens are not copied. Mobile-friendly alternative preserves player action meaning. |
| Unimplementable with current stable API | D | None confirmed | No feature is assigned D solely because Java code cannot compile on Bedrock. Continue alternatives research before any D classification. |

These are candidate routes, not claims that all such effects are implemented. Damage order, attributes, projectile origin ownership, block/loot causes, entity AI control, storage, UI handling, and multiplayer race behavior require per-mechanic validation.

## Input and UI

The current UI uses built-in server forms and the stable global item-use event: the player uses the matching core for a tier offer, the basic device shows owned augments, and the advanced device handles synthesis. Custom item components V2 are experimental, so the global event preserves the action without that dependency. This avoids undocumented keybind APIs and a 10-key assumption. Forms and item use work through Bedrock's native interaction modes; no key presses are intercepted.

Reference review:

- *Vampire Survivors* presents a small set of upgrade options at a single level-up decision; its documented level-up flow offers three or four choices and upgrades an owned item when selected. We apply the compact multi-choice and upgrade clarity, while retaining the Java core/device economy and not copying its visual style or progression rules. [Level-up reference](https://vampire.survivors.wiki/w/Level_up).
- *Hades* presents three boon choices as a discrete reward decision. This supports showing effect descriptions before commitment. We apply the explicit choice moment, but not its controller-specific layout/art. The 3-choice and in-game description evidence is summarized in a university design analysis with screenshots. [Hades selection analysis (PDF)](https://uu.diva-portal.org/smash/get/diva2%3A1972814/FULLTEXT01.pdf).
- Microsoft's stable `ActionFormData` provides player forms with selectable buttons; `show(player)` returns a selection asynchronously. We use this supported action-form surface as the touch/controller-compatible interaction base. [ActionFormData](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/actionformdata?view=minecraft-bedrock-stable).

These are design-pattern references, not asset or UI copies. Actual client legibility and touch/controller navigation are NOT_RUN.

## External Java modpack dependencies

`MODPACK_BASELINE.md` includes Terralith, Repurposed Structures, Dungeons and Taverns, Friends&Foes, Illager Invasion, Naturalist, Farmer's Delight Refabricated, Better Combat, Chrono Dawn, World Bosses, and libraries. No Java mod implementation, third-party assets, or external mob/structure is copied. The Bedrock core loop and passive route use vanilla items/entities so it can work without those external contents. Equivalent Bedrock community add-ons can be integrated only after permission, source, and stable identifier contracts are checked.

## Documentation reviewed

- `PROJECT.md`, `AUGMENTS.md`, `GAME_DESIGN.md`, `AUGMENT_INTERACTION_CONTRACT_2026-10-24.md`, `CORE_ACQUISITION_DESIGN_2026-10-24.md`, `MODPACK_BASELINE.md`.
- Latest full audit and post-audit closure documents, plus `augment_catalog.json` and Java source references.
- Authority declared in Java `PROJECT.md` was followed. Historical implementation status snapshots were not treated as current runtime truth.

## Official engine sources

- Bedrock stable Script API documents world events, mutable `EntityHurtBeforeEvent.damage`, and damage source attribution: [World](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/world?view=minecraft-bedrock-stable), [WorldAfterEvents](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/worldafterevents?view=minecraft-bedrock-stable), [EntityHurtBeforeEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityhurtbeforeevent?view=minecraft-bedrock-stable), [EntityDamageSource](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitydamagesource?view=minecraft-bedrock-stable).
- The official versioned API module page lists stable `@minecraft/server` 2.11.0 and the 2.13.0 beta version separately. This project pins the latest stable module pair in the manifest and type-checks against those declarations: [Script API module](https://github.com/MicrosoftDocs/minecraft-creator/blob/main/creator/ScriptAPI/minecraft/server/minecraft-server.md).
- The installed Windows client version was read from the local app package. Official BDS 1.26.62.1 was executed using `@bedrock-core/bds-runner` 0.2.1. Both isolated GameTests passed; client import and play remain untested.
