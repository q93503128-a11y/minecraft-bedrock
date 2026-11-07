# Armor Care Bedrock port — 2026-11-07

## Canonical behavior

Java's `AUGMENTS.md` defines `방어구 관리` (`augmentation_survival:armor_care`) as uncommon, maximum level 5: each equipped armor piece independently avoids its durability loss on a 5% chance per level (5%, 10%, 15%, 20%, 25%). The Java service checks the four equipped armor slots and cancels the whole positive durability event on a successful roll before vanilla Unbreaking. The `survival_modifier_contract.json` value is `armor_care.durability_avoid_per_level: 0.05`. No Armor Care-specific cross-augment rule appears in the reviewed interaction contract; armor and Java's `DataComponents.TOOL` route are separate branches.

Java source references:

- `SurvivalAugmentService.modifyDurabilityDamage`
- `SurvivalTuning.armorCareAvoidPerLevel`
- `ItemStackDurabilityAugmentMixin.hurtAndBreak` (HEAD cancellation)
- `DurabilityPassiveReadabilityMixin` (success readability cue)
- `survival_modifier_contract.json`

## Stable Bedrock route

The production BP subscribes to `world.beforeEvents.entityHurt` and `world.afterEvents.entityHurt`. Before damage, it snapshots the player's damageable helmet, chestplate, leggings, and boots with slot, item type, and current durability. After the event, it reads those same slots, and for each same-type armor item whose durability increased, it applies the independent Java chance (`0.05 × saved level`). On success it clones the post-hit stack, restores only the saved durability value, and writes the stack back through `EntityEquippableComponent.setEquipment`. Other stack data on the post-hit item is retained. Levels continue to use the shared, versioned player progression property.

The chance calculation is isolated in `BP/scripts/armor-care-rules.js`; the event/state route is in `BP/scripts/armor-care.js` and is loaded from `BP/scripts/main.js`. This passive needs no key binding or custom screen, so the interaction route works with touch, controller, and keyboard/mouse without requiring different input handling.

## API classification and differences

This is class **B**, `PARTIAL_BDS_VERIFIED`, and is enabled as an uncommon core candidate. The stable custom-item durability callback is for a custom item that is about to lose durability while hitting an entity; it does not observe vanilla armor losing durability while its wearer is hit. The supported player hurt events and equippable/durability components provide a measured after-hit rollback, but Bedrock exposes no per-armor durability event to cancel before native processing.

Consequently, restoration occurs after native armor damage rather than by cancelling Java's exact `hurtAndBreak` call. The route only edits an armor slot when the same item type is still equipped, preventing different-type replacements from being overwritten and avoiding return-item duplication when a slot is empty. A broken item or an empty/different-type slot cannot be restored. Stable API does not expose a unique identity for vanilla armor, so an identical same-type replacement during the event cannot be distinguished. Same-player repeated hurt events within one tick, other add-ons changing the same armor durability, combinations with Unbreaking, reconnect/world-restart behavior, and online multiplayer are not established by this test. Java's passive success readability cue and full client presentation are also not implemented. Armor Care's numeric rules are preserved; no substitute effect or new progression system was added.

Official stable API references:

- [ItemCustomComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemcustomcomponent?view=minecraft-bedrock-stable)
- [ItemComponentBeforeDurabilityDamageEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemcomponentbeforedurabilitydamageevent?view=minecraft-bedrock-stable)
- [EntityHurtBeforeEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityhurtbeforeevent?view=minecraft-bedrock-stable)
- [EntityHurtAfterEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityhurtafterevent?view=minecraft-bedrock-stable)
- [EntityEquippableComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityequippablecomponent?view=minecraft-bedrock-stable)
- [ItemDurabilityComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemdurabilitycomponent?view=minecraft-bedrock-stable)

## BDS verification

On BDS 1.26.62.1, an event-surface diagnostic confirmed that the before-hurt event sees no native armor durability change, while the after-hurt event observes all four diamond armor pieces gain 4 durability damage for the synthetic hit; at the break boundary it observed the native max-damage state. Production-handler tests seed level 5 in the production BP's own dynamic-property scope and run 20 ordinary hits and 20 hits at four pieces' `maxDurability - 4` boundary. The recorded run observed:

- Ordinary hits: 17 armor-piece durability saves and 63 spent outcomes across 80 piece-hit opportunities.
- Break boundary: 20 saves and 60 spent outcomes across 80 piece-hit opportunities.
- Unowned control: all four iron armor pieces retained their native 4 durability damage.
- Pure rules: levels 1–5 match exactly 5%–25%; the exclusive chance boundary fails, the just-below boundary succeeds, and values above level 5 cap at 25%.
- No armor item was found duplicated into the inventory after break-boundary trials.

The two production tests are part of the standard 52-test suite. The separate `armor_probe` run also passed its event-surface diagnostic (3/3 tests total, including both production tests). These are isolated BDS GameTests; they do not count as a real client or multiplayer test.
