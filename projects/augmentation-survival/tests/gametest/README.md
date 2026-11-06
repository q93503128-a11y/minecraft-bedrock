# Headless Bedrock engine tests

These tests run in a separate GameTest behavior pack and are excluded from the player `.mcaddon`. `@minecraft/server-gametest` is beta and the runner enables the required GameTest experiment only in its disposable test world. No Windows client worlds are read or changed.

## Run

```powershell
npm ci
npm run verify
npm run build:engine-tests
npm run test:engine
```

The first engine run downloads the official BDS selected in `bds-runner.json`. Results and server files live under `.bds/`; the checked-in command expects exactly twenty-five registered tests and writes its JSON summary there. `test:engine` covers core candidate gating and transactions, selected combat damage sources, the shared Bumper Crop/Seed Saver handler using deterministic crop permutations and rolls, `든든한 한 끼` by consuming cooked beef through the production BP handler at levels 1–3 plus a saturation-cap case, `물갈퀴` by exercising production swim-speed scaling at levels 1–3 plus out-of-water reset, `숨 고르기` by checking its 60-tick idle gate and exact 10/20/30% movement component scaling, additive Catch Breath/Webbed Feet swimming, a diagnostic vanilla fishing-rod API probe, and Extra Piece ore-drop tests covering deterministic chance boundaries and block/tool loot under Silk Touch and Fortune. A separate SimulatedPlayer break confirms live `playerBreakBlock` event delivery. The ground `moveRelative` velocity probe did not produce valid control/level-1 measurements, so it is excluded; client walking and an actual sprint-reset transition remain unverified. The water test measures the production handler's swim-speed ratios. The crop test uses the same handler source copied from BP but supplies a synthetic block-break event payload instead of triggering a real player break. Precise Aim uses a synthetic projectile-attributed `applyDamage` event with a spawned arrow entity; it does not test actual arrow flight or collision. A physical-arrow experiment failed to hit and is recorded as such in the API compatibility report. The live Extra Piece event test does not assert its random proc during ordinary survival mining. Live crop harvesting, the client-visible drop, mobile/controller navigation and multiplayer still need review.

The simulated-player test cannot provide trustworthy visual UI or a real form selection. Reconnect persistence, client import, mobile/controller navigation, multiplayer, and world restart are not verified by this suite. The runner resets only its own generated world on each run.

`tests/gametest/BP/structures/gametests/glass_cells.mcstructure` is included unchanged from Microsoft's [`minecraft-scripting-samples`](https://github.com/microsoft/minecraft-scripting-samples) under its [MIT License](https://github.com/microsoft/minecraft-scripting-samples/blob/main/LICENSE).
