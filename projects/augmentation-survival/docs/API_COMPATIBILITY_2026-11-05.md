# API compatibility investigation — 2026-11-05

## Scope and result

This checkpoint records exploratory movement results and the `튼튼한 폐` damage path against the installed stable Script API and official BDS 1.26.62.1. The Java combat source applies `튼튼한 폐` after vanilla mitigation using the `IS_DROWNING` damage tag; its exact tuning is 15% per level, maximum level 3.

Classification: **A** means the stable API directly exposes the required event/state operation; **B** means an alternate stable event/state implementation is being used; **C** means a remaining behavior difference is confirmed; **D** means no workable route remains after alternatives are evaluated. A/B describe API routes, not completed ports. `UNASSESSED` means the alternatives or gameplay boundary have not been investigated enough to assign a class.

| Augment | Java contract | Bedrock route | Result |
| --- | --- | --- | --- |
| `날 선 감각` (`keen_edge`) | Root melee damage +4% per level, max 5 | **A, partial:** mutable stable before-event damage for root `entityAttack` | BDS test changes 10 synthetic root melee damage to 12 at level 5. Physical client melee and acquisition are unverified. |
| `튼튼한 폐` (`strong_lungs`) | Drowning damage × 0.85 / 0.70 / 0.55 at levels 1 / 2 / 3, after vanilla mitigation | **B, partial:** stable `EntityHurtBeforeEvent`, `EntityDamageCause.drowning`, server-owned saved level | BDS production handler reduces synthetic 10-damage events to 8.5 / 7 / 5.5. Bedrock changes the value before remaining mitigation, while Java applies the multiplier after vanilla mitigation. Armor/effect stacking and a naturally triggered underwater event remain unverified. |
| `강건함` (`sturdiness`) | Maximum health +2 per level, max 5 | **UNASSESSED:** current `health_boost` path grants +4 per level; exact alternative not yet tested | BDS confirms the current path mismatch. The mismatch alone does not establish class D; alternatives such as another player health route remain to be evaluated. |

The API exposes a mutable before-event `damage` field and the damage source, while the after-event damage field is read-only: [EntityHurtBeforeEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityhurtbeforeevent?view=minecraft-bedrock-stable), [EntityHurtAfterEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityhurtafterevent?view=minecraft-bedrock-stable), [EntityDamageCause](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitydamagecause?view=minecraft-bedrock-stable). Therefore the current stable event path can apply the server-authoritative scalar but does not reproduce Java's exact mitigation stage.

The authoritative Java values for the two exploratory movement effects are:

| Augment | Java contract | Attempted Bedrock route | Result |
| --- | --- | --- | --- |
| `빠른 발` (`quick_feet`) | `minecraft:movement` base × 1.03 / 1.06 / 1.09 / 1.12 / 1.15 | `EntityMovementComponent.setCurrentValue(defaultValue × multiplier)` | Immediate setting works, but a level 5 → 1 change was observed back at the default value (`0.10000000149`) on the following tick instead of the requested `0.10300000153`. Not ported. |
| `물갈퀴` (`webbed_feet`) | `minecraft:underwater_movement` base × 1.10 / 1.20 / 1.30 | `EntityUnderwaterMovementComponent.setCurrentValue(defaultValue × multiplier)` | Level 3 was correct after one tick. Level 1's immediate setter value was accepted, but the next-tick persistence assertion was not reached after Quick Feet failed. Not ported. |

Both component types inherit `EntityAttributeComponent`. The official reference describes `setCurrentValue` as setting the current value; it does not document persistence across later ticks. I infer that this omission leaves persistence unspecified, and the BDS measurements above are the direct runtime evidence: [EntityAttributeComponent stable API](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityattributecomponent?view=minecraft-bedrock-stable).

An every-tick reapplication attempt was also exercised in the isolated test world; the engine still reported the default player movement value after the tick. This does not establish that every alternative is impossible. The compatibility classification remains **unresolved**: do not label these `C` or `D` until input/velocity methods have been evaluated against actual movement, collision, and mobile controls. No movement code is shipped.

## Reproduction record

- BDS: 1.26.62.1 (`bds-runner.json`), stable production declarations `@minecraft/server` 2.11.0.
- Player attributes exposed both default values and accepted exact multiplied `setCurrentValue` values within the same call.
- First GameTest: Quick Feet level 5 and Webbed Feet level 3 matched their exact base multipliers after one idle tick. After changing both saved levels to 1, both direct values were accepted; after another tick Quick Feet read `0.10000000149011612` instead of `0.1030000015348196`. The test stopped at that assertion, before measuring Webbed Feet after the second tick.
- The experiment failed and was deliberately removed from the passing suite. The add-on does not include these effects, and both roster rows remain `NOT_PORTED`.

## Next compatibility checks

1. Evaluate stable player input vectors and velocity impulses without changing touch, controller, or keyboard semantics.
2. Measure movement in a real client on ground, in water, while sprinting, and while affected by knockback; a component read alone is not gameplay verification.
3. Keep exact Java percentages. Do not substitute potion Speed's discrete amplifier values for 3% increments.
