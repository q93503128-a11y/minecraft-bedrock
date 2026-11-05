# Player-facing UX & Wording Contract

## One-sentence rule

**Show the useful fact at the moment the player needs it.** Never show a development explanation instead of gameplay information.

### Good/Bad examples (design specimens only, not implemented text)

| Situation | Write | Never write |
| --- | --- | --- |
| New ingredient | `버섯 멧돼지에게서 얻을 수 있습니다.` | `신규 드롭 테이블이 구현되었습니다.` |
| Optional hunting tip | `돌진한 뒤 잠시 빈틈이 생깁니다.` | `약점 프레임에서 공격 시 드롭 배율 적용` |
| Recipe missing item | `소금 1개가 더 필요합니다.` | `recipe validation failed: salt_count` |
| Cook finished | `버섯 스테이크 완성!` | `조리 시스템 처리 성공` |
| Restaurant closed | `영업을 시작하면 손님이 찾아옵니다.` | `상점 AI 상태가 idle입니다.` |
| No customer | `아직 기다리는 손님이 없습니다.` | `NPC 스폰 검사 대기 중` |

- Avoid repeated obvious tutorial text, filler adjectives, developer jokes, TMI or fictional notes masquerading as guidance.
- Keep on-screen information short; more details on one guide page, not in repeated overlays.
- Keyboard/mouse, controller and touch are equally legitimate input paths.
- Verify long Korean strings, readable typography, back/cancel/empty state and actual Minecraft screen results.
- Prior to implementing a new guide/menu, investigate multiple actual shipped-game UI screens, not just AI mockups.

## Guide organization

1. 몬스터: 서식지 / 얻는 재료 / 사냥 팁
2. 요리: 재료 / 조리 도구 / 효과
3. 재료: 어디서 구함 / 어느 요리에 씀
4. 식당: 지금 필요한 행동 / 직원 업무 / 운영 상황

No duplicated lore/research/progression UI. These four pages are information categories, not four parallel leveling systems.
