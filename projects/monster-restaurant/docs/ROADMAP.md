# Development Roadmap (quality gates, not time estimates)

**Reality as of 2026-11-05:** Design v0.2 is documented, but BP/RP and packaged builds do not exist. The implementation contract is [M1_PLAYABLE_SLICE.md](M1_PLAYABLE_SLICE.md). Do not claim a task completed before actual Bedrock testing.

## M0 — API/bootstrap gate
- Confirm installed/target Bedrock release, stable Script API module versions, namespace, pack manifests and unique UUIDs.
- Review official custom component, persistent storage, forms, entity movement documentation and exact stable signatures; record pinning.
- Verify local Codex + Blockbench connection capability; produce a minimal model and validate actual export/render in Bedrock.
- Study actual game footage/UI scenes in addition to official screenshots (see [EXTERNAL_REFERENCES.md](EXTERNAL_REFERENCES.md)).
- Implement **one real block interaction + visible mob + persistent test data**, package with repeatable tooling and launch in Bedrock.
- Do not add placeholders to claim visual quality.

## M1 — Fully playable first loop
- Implement real world hunt → ingredient → fan/pot food → self-eating and counter sale → earnings → first server hire.
- Customer visibly approaches counter, order indicator readable; employee visibly serves stocked dishes.
- End-to-end test includes duplicate delivery, break, cancel, restart, chunk unload, closed restaurant and two-player permissions.
- Screenshot/record actual gameplay, small-window UI, mobile/controller (where available), state consistency.
- First balance hypotheses live in [ECONOMY_EXPERIMENT.md](ECONOMY_EXPERIMENT.md). Tune only from play tests.

## M2 — Cooking and guide polish
- Expand dishes/stations only if each has distinct use. Avoid required cooking-step chains.
- Unified cookbook/bestiary, brief source-to-use explanations and natural discoveries.
- Models, animation, cooking effects and SFX integrated and player-tested.

## M3 — Village, seating, staffing, economy
- Optional proximity to natural villages, custom built village options, visitors/traders.
- Customer pathfinding to actual seats, physical serving, limited clear staff roles, staff wages.
- Shop ownership, persistence, multiplayer payment and collision testing.

## M4 — Combat, exploration and world
- Wider monster ecology with selective optional bonus hunting, food combat buffs, useful vanilla mining and farming.
- Add special monsters/bosses only if normal hunting and food rewards already feel meaningful.

## M5 — Production and release gate
- Actual real-world balance, source reproduction, version migration, mobile/controller/server behavior, multiplayer and performance measurements.
- No final 'done' claim from JSON static checks or a successful `.mcaddon` archive alone.

Content counts are targets under evaluation, not quotas. The goal is polished gameplay, not factory complexity.
