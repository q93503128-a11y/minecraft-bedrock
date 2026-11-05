# API compatibility investigation — 2026-11-05

## Scope and result

This checkpoint tested two canonical movement effects against the installed stable Script API and official BDS 1.26.62.1. The authoritative Java values are:

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
