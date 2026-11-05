# External Gameplay & UX References — Initial Review (2026-11-05)

This is preliminary **official descriptive evidence**, not a claim that gameplay videos/screens were directly tested. Before building individual UI/monster animations, developers must inspect actual gameplay footage/screens and update the observation notes.

| Game | Verified source | Useful design lesson | Do not copy / caveat |
| --- | --- | --- | --- |
| **Cuisineer** | https://marvelousgames.com/games/cuisineer | Official pitch connects monsters → ingredients → restaurant; ingredient sourcing creates a compelling adventure-to-service loop. | Avoid replacing vanilla Minecraft with instanced dungeon roguelite + mandatory high-speed restaurant management. |
| **DAVE THE DIVER** | https://pressmintrocket.oopy.io/dave_the_diver | Official pitch links catching creatures with restaurant funding; two play rhythms provide variety. | Don't turn survival into rigid dive/day/night sessions. |
| **Travellers Rest** | https://travellers-rest.itch.io/travellers-rest | Farming/cooking/tavern furnishing are part of a cohesive place-making loop. | Its tech-tree scope is too broad for a lightweight-feeling Minecraft survival extension. |
| **Battle Chef Brigade** | https://store.steampowered.com/app/452570/Battle_Chef_Brigade | Hunting ingredients and producing a dish are distinct satisfying moments. | Do not demand a match-3 cooking minigame or a combat combo system for each recipe. |

## Actual design decisions derived (proposal)

- **Hunt reward** should be obvious without codex consultation; occasional optional bonus for readable behavior.
- **Cook reward** must have in-world presentation and immediate useful outcome (eat, sell, discover).
- **Restaurant** is opt-in and compatible with self-built houses and villages, with distinct staff roles.
- **Guide** shows source → use and brief next action. It should not act as a development change log.

## Additional mandatory research before implementation

For each new major user-facing system or UX design, compare relevant games beyond these four where helpful. Record date, primary screenshot/video URLs, specific UI affordances, input count, feedback timing and what is adopted/rejected; prioritize official and direct-play sources. Do not claim that a visual/audio interaction was inspected if only marketing text was reviewed.

This file records development evidence only; **never expose it as an in-game tutorial/debug screen**.
