# Monster Restaurant — Current Status

Updated: 2026-11-05

- **State: DESIGN v0.2 / NO REAL ADD-ON IMPLEMENTATION.**
- Repository layout and common developer/quality/build contracts are in place.
- Completed this cycle: first-play loop scope with monster/cooking/customer/staff/codex, economy model and MVP numeric hypotheses, persistence/idempotence rules, technical gate, expanded official gameplay screenshot reference audit.
- Design documents:
  - `GAME_DESIGN.md`: overarching design principles.
  - `docs/M1_PLAYABLE_SLICE.md`: end-to-end gameplay contract and acceptance tests.
  - `docs/ECONOMY_EXPERIMENT.md`: provisional currency/prices/paychecks and validation rules.
  - `docs/TECHNICAL_GATE.md`: API entry points, state machine, risks.
  - `docs/EXTERNAL_REFERENCES.md`: evidence levels, official screenshot-based UX analysis and further game footage research work.
- Names, item counts, recipe values, currency amounts, staff rates, gameplay timing and art remain **proposals, not locked final balance**.
- Exact Bedrock game/module version, pack UUIDs, namespace: NOT DECIDED.
- Actual BP/RP code/assets/models/animations: NOT CREATED.
- Static tests/packaging/Minecraft import/gameplay/visual tests: NOT_RUN.
- **Next action:** Codex M0 official version compatibility gate and actual plugin/tool capability inspection; then functional one-block/one-mob bootstrap and in-game observation before full M1.
