# Research and design notes

## Bedrock UI route

The implementation targets the locally installed Minecraft Bedrock retail client, package version `1.26.6201.0` (1.26.62 family). The latest stable Script API declarations used by the repository on this client line are `@minecraft/server` 2.11.0 and `@minecraft/server-ui` 2.3.0. The Microsoft Learn API describes `CustomForm` as a data-driven form with buttons, labels, images, and observable values. This is the chosen stable route for live player data and in-form page changes.

`ActionFormData` is a simple choice dialog whose main content is a list of buttons. `CustomForm` supports a richer content sequence with images, headers, labels, dividers, reactive values, and callbacks while the form remains open. Arbitrary HTML custom UI is gated by the manifest capability `experimental_custom_ui`, so this project does not enable it.

## Commercial RPG references

### Diablo IV — character overview

Visual reference: [Diablo IV character profile screenshot (Inven)](https://upload3.inven.co.kr/upload/2023/11/07/bbs/i16879711222.png?MW=800) and its [context page](https://www.inven.co.kr/board/diablo4/6024/1356).

The screenshot groups the headline build values to the left, keeps the character model at the visual center, and places equipment slots around that figure. Attack, defense, health, and primary attributes are easy to scan before the denser item area. Duskveil borrows that priority order and the use of equipment-slot iconography. It does not copy the game's ornament, exact layout, icons, text, or art.

### Elden Ring — Status screen

Visual reference: [Elden Ring status screen screenshot (One Esports)](https://cdn.oneesports.gg/cdn-data/2024/06/Elden_Ring_best_DLC_stats.jpg) and its [context page](https://www.oneesports.gg/gaming/best-elden-ring-build-shadow-of-erdtree/).

The screenshot separates core attributes from derived values such as HP, stamina, equip load, attack power, and damage resistance. That separation helps players connect a build choice to its practical effect. Duskveil groups the sample RPG values into attack, defense, and movement, while labeling the live vanilla health and XP separately. The original Elden Ring fonts, color treatment, and table layout are not reused.

## Design decisions

- Put the player's name and live level at the top; keep current health and XP together immediately below.
- Use a dedicated combat section for attack, defense, and movement. These are sample RPG values, not Bedrock attributes.
- Put an illustrated six-slot gear board on a second page so the live vital bars stay readable without competing with seven equipment rows.
- Use a compact image banner, warm brass linework, restrained teal details, clear Korean labels, and native focusable buttons.
- Use the existing compass as the input shortcut. Its use is intercepted only to open the form; it does not gain a combat or inventory effect.
- Show the sample-data distinction in the UI and in this project documentation.
- Original portrait and icon assets are created specifically for this experiment. Commercial game art is not redistributed.
