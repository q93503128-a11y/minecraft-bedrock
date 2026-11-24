# GT RPG — 참고 게임/애드온·자료 검토 상태

본 문서는 **이전 사용자 대화에서 논의된 후보와 그 활용 목적의 인덱스**다. 이 GitHub 기획 복원 작업에서 실제 외부 게임을 설치하거나 신규 영상·문서의 원문을 전수 검증한 것은 아니다. 구현 단계에서는 **공식 설명 + 실제 플레이 영상/화면 + 이용자 경험을 최소 2종 이상 비교**하고 채택/비채택 이유를 갱신해야 한다.

| 사례 | 기존 대화에서 다룬 요소 | GT RPG에 적용할 원리 / 피할 점 |
| --- | --- | --- |
| Minecraft Dungeons (Mojang) | 던전에서 상자 탐색, 고유 장비/희귀 아이템, 전투 중심 파밍 | **일반/희귀/보스 보물상자, 개인 보상, 장비 기대감** 참고. 원작 UI·이미지·리소스·코드 복제 금지. |
| ClassWorld — Bedrock 애드온 | 클래스별 네크로맨서 언데드·드루이드 동물·성기사 공격/회복 요소의 선례로 논의 | 직업 명확한 역할과 스킬 분화를 참고. 직접 구현 결과를 확인한 것은 아님. |
| RPG Adventure: Skill Tree — Bedrock 애드온 | 전사·궁수·마법사·암살자 차이의 선례로 논의 | 직업 정체성만 참고; **복잡한 스킬 트리는 GT RPG에 도입하지 않음**. |
| Epic Dungeons & More Structures / Dungeon Raiders — Bedrock 애드온 | 자연 생성 던전, 방/전리품 설계 선례로 논의 | 탐험형 던전 구조와 생성 빈도·보상 흐름 비교. 원본 구조물 복제 금지. |
| Lilium Backpacks / Expansive Inventory — Bedrock 애드온 | 기본 인벤을 보존한 별도 가방, 저장/카테고리 UI 방식 | **54칸 RPG 가방과 필터**의 UX 참고. 저장 안정성 직접 검증 필요. |
| Arcane Bow / NewBows — Bedrock 애드온 | 고유 모델 활, 당기기 모션, 원소/유도 화살·인챈트 대응 사례 | 커스텀 활 아트/기능과 베드락 기술 한계 비교. 부품/모델 그대로 전재 금지. |
| Epic Loot V2 — Bedrock 애드온 | 장비 레벨/등급/랜덤 옵션·전리품 | 레벨 기반 일반 장비와 고유 장비의 역할 분리 검토. |

문서 시작점:
- Minecraft Creator 문서: https://learn.microsoft.com/en-us/minecraft/creator/
- 공식 예제: https://github.com/microsoft/minecraft-samples
- 예시 애드온 소개: https://www.curseforge.com/minecraft-bedrock/addons/arcane-bow
- 예시 애드온 소개: https://www.curseforge.com/minecraft-bedrock/addons/new-bows-addon
- 예시 애드온 소개: https://www.curseforge.com/minecraft-bedrock/addons/epic-dungeons-more-structures
- 예시 애드온 소개: https://www.curseforge.com/minecraft-bedrock/addons/expansive-inventory

**구현 시작 전 필요한 조사:** 실제 UI 2종 이상(상태창·아이템 세부·전직·카테고리 가방), RPG 활 2종 이상(발사 모션·터치 입력), 소환/AI 2종 이상(군단 운영·모바일 성능), 던전 2종 이상(상자 위치·방 다양성·보스 텔레그래프). 조사에서 확인되지 않은 기능은 '검증 필요'로 남기고 테스트한다.

## 성장/난이도 수치 참고 추가
- [Minecraft Dungeons — Adjusting the Endgame](https://www.minecraft.net/en-us/article/dungeons-dev-blog---adjusting-endgame): 난이도 증가 완화와 보스 개방·특수장비 파밍 연결.
- [Diablo III — Greater Rifts Preview](https://news.blizzard.com/en-us/article/15317478/patch-2-1-0-preview-greater-rifts), [Patch 2.3.0](https://news.blizzard.com/en-gb/article/19859662/patch-2-3-0-now-live): 몬스터 난도에 맞춘 보상 및 고단 피해 조정. 설계 참고이며 원작 수치/상한은 복사하지 않음. 실제 플레이/영상 미검증.

## HUD 참고 추가 (2026-11-24)
[HUD_DESIGN.md](HUD_DESIGN.md) 4절에 공식 ScreenDisplay·HudElement·JSON UI와 Bedrock Wiki, aceofnawa RPG HUD, Ultimate Status System, Bosya PlayerStats HUD의 공개 자료 및 적용/비적용 원리를 기록. 설치 및 실제 화면/터치 검증은 아직 하지 않았다.

## 장비·각인 기획 참고 (2026-11-24)
- [Minecraft Dungeons September Update](https://www.minecraft.net/en-us/article/dungeons-september-dev-blog): 무기 유형별 공격 방식, 고유 장비·전투 행동을 바꾸는 인챈트. GT RPG의 무기 유형과 고유효과 차별화에 참고.
- [Diablo IV Loot Reborn](https://news.blizzard.com/en-us/article/24077223/galvanize-your-legend-in-season-4-loot-reborn), [Itemization & Systems Changes](https://news.blizzard.com/en-us/article/24243142/sanctuary-ignites-with-itemization-systems-changes): 장비 고유 효과/옵션, 선택 가능한 부여 효과 참고. GT RPG에는 하나의 간단한 각인만 적용하며 강화 단계/다중 재화/복잡한 제작 시스템은 도입하지 않음. 공식 설명 검토, 직접 플레이/영상 확인은 후속 작업.

## 무기 및 장신구 추가 조사
[EQUIPMENT.md](EQUIPMENT.md) 8절: 공식 cooldown/swing_duration/piercing_weapon/kinetic_weapon/EquipmentSlot/ItemStack/Container/Dimension 및 Lynx More Weapons, Sweep Impact, Java Combat Evolved, Novelty API, Easy Accessories 사례. [HUD_DESIGN.md](HUD_DESIGN.md) 5절: Aceofnawa의 추정 흡수 오버레이와 공식 피해 전 이벤트. 공개 문서/설명 확인이며 실제 설치/영상 분석은 후속.

## 몬스터·보스 레퍼런스
[MONSTERS.md](MONSTERS.md) 7절: Minecraft Dungeons/Jungle Awakens/Enchanted mobs, Mowzie's Mobs Bedrock, Mutant Creatures Bedrock 공식 소개 및 공개 설명. 지역별 생태/적 AI/애니메이션/공략 패턴을 참고하되 원본 자산을 복제하지 않음. 직접 플레이/영상 분석은 후속.

## 몬스터 수정 및 재도전 난도 참고
[Terraria 적 목록](https://terraria.wiki.gg/wiki/List_of_Enemies), [미믹](https://terraria.wiki.gg/wiki/Mimic), [Minecraft Dungeons Adjusting the Endgame](https://www.minecraft.net/en-us/article/dungeons-dev-blog---adjusting-endgame), [Diablo IV Season of Hatred Rising](https://news.blizzard.com/en-us/article/24140803/conquer-colossal-foes-in-season-of-hatred-rising). 익숙한 몹 명칭과 난도·보상 선택 구조 검토. 실제 설치/영상/모델 검증 없음. 원작 수치/아트 복제하지 않음.
