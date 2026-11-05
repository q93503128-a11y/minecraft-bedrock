# External Games & UI References — Design Findings (2026-11-05)

## Verification scope

This revision uses **official publisher/operator screenshots and official descriptions** for visual references, plus documented reference pages for restaurant mechanics. It does not claim that ChatGPT has personally played these games or validated entire gameplay videos. Before final UI/art implementation, Codex must inspect real footage/actual running game at the specific interaction state and record observations.

### 1. Cuisineer — ingredients -> restaurant demand

Official game and media: https://marvelousgames.com/games/cuisineer
Official PlayStation screenshot (customer order UI): https://store.playstation.com/fr-fr/product/EP4492-PPSA20208_00-CUISINEER0000000

**Observed from official screenshot:** small customer order icons appear directly above diners in a busy restaurant; food stations and tables are recognizable world objects. **Direct relevance:** display each requested dish near the customer; keep the room itself more prominent than dashboard UI. **Reject:** copying ornate art or making every order frantic; no fixed instanced dungeon progression or forced rush.

### 2. DAVE THE DIVER — on-site service/feedback, menu/staff controls

Official anniversary edition screenshot: https://www.arcsystemworks.jp/dave_ae/ (About image 02)
Official game: https://mintrocketgames.com/en/DaveTheDiver

**Observed from official screenshot:** diners sitting at a counter have food bubbles and feedback text close to them, while bottom navigation contains compact Menu/Research/Staff controls. **Direct relevance:** actionable order feedback close to NPC, separate management options in counter/guide UI instead of permanent HUD. **Reject:** a permanently crowded on-screen task bar, duplicate currencies and mandatory evening-only scheduling.

### 3. Travellers Rest — optional tavern operation and paid helpers

Official game: https://www.isolatedgames.com/travellers-rest/
Specific staff and service reference: https://travellersrest.wiki.gg/wiki/Staff and https://travellers-rest.fandom.com/wiki/Tavern_Management

**Documented mechanics:** hospitality business has open/close control; staff specialize in service tasks; player still handles meaningful preparation. **Direct relevance:** player explicitly opens/closes shop and pays for labor, staff reduce chores. **Reject:** forcing play around time of day, rigid reputation level gating, employee micromanagement and offscreen debt.

### 4. Battle Chef Brigade — hunt & cook two different satisfactions

Official game product page: https://store.steampowered.com/app/452570/Battle_Chef_Brigade/
**Reference takeaway from description:** distinguish adventurous ingredient retrieval and meal creation. **Reject:** mandatory match-3 or combat minigame for every meal.

## Adopted design constraints

- Customer order is readable directly near character, with one concise icon/name.
- Restaurant admin remains compact, accessed at counter; vanilla HUD stays mostly untouched.
- Cooking interaction is short, but outcome gets visible food model/sound.
- Staff save repetitive delivery effort; they never manufacture food out of nothing.
- External games must be used to identify design solutions, not as asset/code copying sources.

## Current research limitations and implementation actions

- The official screenshots are visual references, **not running UI measurements**. Need in-game/footage study for input counts, target sizes, animation timing and hover/focus states.
- Before producing major UX/model files: collect actual footage/screens for each mechanic and annotate navigation, display, motion/sound, readability, control hints, mobile constraints.
- Verify license before downloading/integrating any third-party textures/models/audio. Documentation links alone do not grant asset redistribution rights.
- When implementing in Bedrock, honor vanilla presentation and controller/touch; a PC-only game UI pattern may need simplifying.

Record source, access date, observable scene/feature, applied choice, rejected choice, and unverified assumptions. Do not mislabel marketing descriptions as hands-on tests.
