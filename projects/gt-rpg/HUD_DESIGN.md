# GT RPG — HUD / 전투 정보 표시 설계

2026-11-24. 사용자 요청에 따른 RPG HUD 목표 및 기술 후보. **아직 화면 제작/실기 검증 없음.**

## 1. 핵심 UX
- 생존 게임의 기존 핫바·크로스헤어·이동/점프/공격/사용/인벤토리 조작은 유지. PC/터치/컨트롤러에서 화면 크기, GUI scale, safe area, UI profile에 맞춰 재배치. 개발용 문구 노출 금지.
- 주 상태 영역: 직업명·RPG 레벨, 현재/최대 RPG HP(빨강), 배고픔(주황, 바닐라 hunger 값 유지), 방어력(숫자 또는 기존 방어 아이콘 대체), 필요 시 상태효과. 좌상단 또는 핫바 근처의 컴팩트 영역 후보; **실제 외부 화면·작은 폰 해상도 비교 후 확정**.
- 보호막: 체력바와 구분되는 청색 게이지와 남은 흡수량, 양수일 때 표시, 소진/만료 시 제거. 바닐라 흡수 체력과 RPG 보호막의 실제 값/우선순위는 서로 중복 계산하지 않고 기술 검증 후 표시. RPG HP 최대치가 높은 경우도 화면 여러 줄의 하트 대신 고정 길이 비율 표시.
- 경험치: 직업 XP / 다음 레벨 필요 XP + 직업 레벨을 보여 주는 RPG 경험치바, **바닐라 인챈트 XP/레벨은 별개로 보존 및 식별 가능하게 표시**. 실제 엔진 XP를 RPG XP로 강제로 덮어쓰지 않는다.
- 액티브 1종의 아이콘/남은 CD 또는 준비 완료. 직업 전직 후 같은 슬롯 갱신. 독립 터치 버튼을 이 문서에서 보장하지 않는다.
- 소환 직업: 골렘 HP/생존, 네크로맨서 현재 군단 수/최대 수, 드루이드 소환 남은 시간 등 필요한 직업 상태만 짧게 표시. 24개 개별 HP 바를 HUD에 펼치지 않는다.
- 상태효과: 기존 포션 등 생존 정보(공기, 탈것 HP, 장비/효과 등)를 잃지 않도록 테스트. RPG 주요 버프/디버프는 소수 아이콘+남은 시간. 중첩이나 패시브 준비 등 꼭 필요한 피드백만 표시.
- 적 레벨/HP: 바라보거나 최근 타격한 적에 표시(후보), 화면에 모든 몹 HP를 계속 표시하지 않는다. 보스는 교전 중 상단 이름/HP 비율, 종료 시 제거. 아군/소환수/적 구별. 피해·치유 수치도 제한적으로 표시, 네크로맨서 24기 타격 숫자 도배 금지.
- 색만으로 체력/보호막/경험치를 구별하지 않고 라벨/아이콘/숫자도 사용. 중요 정보가 숨겨지거나 터치 버튼과 겹치지 않게 한다.
- HUD 디자인은 외부 실제 게임·베드락 사례를 참고하고 이미지 생성·임의 코드 도형만으로 아트를 최종 확정하지 않는다. 본 문서는 기능 명세이며 레퍼런스의 저작물을 복제하지 않는다.

### 시야 확보 우선 (사용자 재확인)
- **최소 HUD를 기본값으로** 한다. 마인크래프트의 채굴·건축·탐험·전투 시야가 RPG 정보보다 우선. 중앙과 터치 조작 영역은 비워 둔다. 큰 직업명 배너, 지속 피해 숫자, 세계 위협도 상시 패널, 상시 상세 DEF/스탯 숫자는 기본 HUD에 넣지 않는다.
- **RPG XP/레벨과 바닐라 XP/레벨은 저장·획득·소비·표시에서 분리**. 인챈트·수선은 바닐라 규칙 유지. RPG 레벨은 직업별 영구 저장. 바닐라 경험치는 기본 핫바 위의 기존 바와 숫자를 유지하고, RPG XP는 직업 레벨 옆 작은 얇은 바만 표시하는 배치 후보. 정확한 두 XP 수치와 상세 능력치는 모험가의 서에서 확인. 두 경험치바를 크게 중복 배치하지 않는다.
- HP/배고픔은 작은 고정 길이 게이지. 보호막은 양수일 때만 HP 영역 내 얇은 청색 게이지/표시. 적/보스·액티브 CD·버프·소환수 상태는 교전/활성 상태에서만 필요 최소한 표시, 종료 시 제거. 기본 공기/탈것/생존 정보는 조건에 맞게 보존.
- 실제 PC/모바일에서 기존 바닐라 HUD와 같은 화면을 비교하고 화면 점유/중앙 가림/조작 겹침을 검수. 표시 방식은 후보이며 실기 확인 전 확정하지 않는다.

## 2. 베드락에서 확인한 범위
| 항목 | 확인된 지원/후보 | 별도 시험 필요 |
| --- | --- | --- |
| 기존 HUD의 숨김 | 공식 ScreenDisplay.setHudVisibility, HudElement | Health/Hunger/XP 등 각 요소와 프로필별 정확한 범위, HUD 복구 |
| 커스텀 HUD | RP JSON UI의 hud_screen.json 및 root_panel modification으로 새 표시 요소 추가 가능 | 데이터 바인딩의 실제 안정성, 모바일/GUI scale 및 최신 버전 |
| 동적 RPG HP/XP/보호막/CD | BP Script API + RP JSON UI, 기존 title/actionbar 채널을 통한 데이터 전달 후보 | 직접 임의 HUD 바인딩을 공식 API가 제공한다고 가정하지 않음. 파싱, 갱신, 경쟁, title/actionbar 메시지 보존 |
| 기본 생존 상태 | EntityAttributeComponent의 currentValue/effectiveMax/setCurrentValue, Hunger 컴포넌트 및 기존 HUD 바인딩 후보 | 최대 HP 자체를 원하는 값으로 무제한 설정할 수 있다고 단정 금지; 바닐라 피해/회복 및 흡수 체력 연동 |
| 추가 HUD 버튼 | 표시 가능성과 실제 독립 입력 감지는 다른 문제 | 안정 Script API/터치 입력 시험. 이미 거절된 웅크리기 두 번으로 회귀하지 않음 |

## 3. 상태 동기화와 실패 경로
- 서버가 권위 있는 RPG HP/최대 HP/흡수량/직업 XP/쿨타임을 관리; UI는 실제 수치를 읽는 표시 계층. 화면 수치 자체가 스킬 피해/회복 처리에 영향을 주지 않음.
- RPG 체력 값이 엔진의 actual health와 일치하거나 정확하게 환산되게 설계하고, 죽음/리스폰, 낙하, 화염, 질식, 독, 음식 회복, 포션, 토템, 흡수, 갑옷, PvP 및 보스 스킬에서 검증. 실제 엔진 최대 HP가 제한될 경우 논리 HP 변환은 별도 최소 실험이 선행되어야 한다. UI만 바꾸고 실제 피해가 바뀌었다고 보고 금지.
- JSON UI 패치는 가능하면 기존 root_panel 수정으로 제한. actionbar/title 브리지 후보는 전용 접두어·단일 발행자·일반 메시지 분리·재접속 초기화, 값 변경 중심 및 초기 5~10Hz 상한 시험. 전 플레이어·전 몹 매 틱 순회 금지. 24개 소환수는 집계 표시.
- RP 미적용/버전 불일치/채널 충돌/표시 실패 시 바닐라 HUD가 다시 사용 가능하도록 폴백과 사용자 안내를 마련. 안전한 표시 확인 이전에 생존 필수 요소를 무조건 숨기지 않는다.
- 수치 표시: 체력/보호막은 동시 변화에서도 순서와 일치, 숫자가 0인데 막대가 남는 오류 금지. 큰 숫자 축약 시 상세 상태창에서 정확한 값 확인.
- 검증: PC/Android 실제 캡처, 다양한 화면 비율과 GUI scale, 포켓/클래식 UI, 터치 3가지 조작 모드 후보, 전투·수영·승마·인벤·폼·사망·관전·월드 재접속, 다른 HUD RP 충돌, 서버 2~4명 및 다수 군단. **NOT_RUN**.

## 4. 확인한 외부 자료
- [Microsoft ScreenDisplay](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/screendisplay?view=minecraft-bedrock-stable), [HudElement](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/hudelement?view=minecraft-bedrock-stable), [EntityAttributeComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityattributecomponent?view=minecraft-bedrock-stable), [JSON UI](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/jsonuireference/examples/jsonuicomponents/ui_screen?view=minecraft-bedrock-stable).
- [Bedrock Wiki: Adding HUD Elements](https://wiki.bedrock.dev/json-ui/add-hud-elements), [Best Practices](https://wiki.bedrock.dev/json-ui/best-practices): root_panel에 요소를 삽입/수정하는 사례. 공식 API 문서와 커뮤니티 기술을 구분.
- [aceofnawa RPG HUD](https://mcpedl.com/aceofnawas-rpg-hud/): 체력·방어·배고픔 게이지 및 물속/탈것 상태를 지원한다고 소개. 생존 상태를 잃지 않는 방식 참고.
- [Ultimate Status System](https://www.curseforge.com/minecraft-bedrock/addons/ultimate-status-system): BP 데이터→RP HUD, 적 HP 및 변화량 표시; 다른 hud_screen.json 리소스와 충돌 가능성 명시. 물/갈증 시스템 및 미니맵은 현 GT RPG에 도입하지 않는다. 라이선스 All Rights Reserved, 소스 무단 복제 금지.
- [Bosya PlayerStats HUD](https://www.curseforge.com/minecraft-bedrock/texture-packs/bosya-playerstats-hud-rpg-inspired-ui): HP/방어/배고픔/XP를 모은 상태 패널 사례.
- 상기 자료는 공개 설명/문서 검토 결과이며 직접 설치·플레이·갤러리 전수 검증은 하지 않았다. 구현 전 실제 게임 화면 비교와 대상 버전 시험이 필요.

## 5. 흡수 체력 및 보호막 겹침 (2026-11-24 추가)
- 사용자 요구: **바닐라 흡수 체력(황금 사과 등)은 체력바 위 노란색 오버레이**로 표현. 보호막과 함께 표시해도 시야를 덜 가리고 현재 HP가 식별되어야 함.
- 초기 배치 가안: 고정 길이의 얇은 막대형 HP바. 빨간 기본 HP, 위쪽 일부 높이에 금색 흡수량 오버레이, 아래쪽 얇은 파란 테두리/부분 게이지에 RPG 보호막. 두 임시 보호 계층이 빨간 HP를 완전히 덮지 않으며 각각 0이면 숨김. 최대 HP 대비 양을 표시하고 100% 초과는 잘못된 값처럼 보이지 않도록 숫자/초과 표시로 표현하는 후보. 기본 HUD에서는 상세 숫자를 남발하지 않음. 최종 크기/색/아이콘은 실제 화면 검토 후.
- [Aceofnawa RPG HUD](https://www.curseforge.com/minecraft-bedrock/addons/aceofnawas-rpg-hud)는 금색 흡수 오버레이를 구현했으나 제작자가 **흡수량 추정**이라고 명시. 정확한 엔진 흡수 잔여값을 직접 읽을 수 있는 안정 API가 확인되지 않았으므로 추정치를 확정값으로 표시하지 않는다. [EntityComponentTypes](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitycomponenttypes?view=minecraft-bedrock-stable) 및 목표 버전 확인. 흡수의 정상 소모를 추적할 수 없으면 정확한 흡수 수치 대신 원본 표시 유지 등 폴백을 시험.
- [EntityHurtBeforeEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityhurtbeforeevent?view=minecraft-bedrock-stable)와 WorldBeforeEvents.entityHurt는 안정 문서에서 damage 변경/cancel 및 이벤트 노출을 확인했다. RPG 쉴드와 불멸의 맹세 구현에 유력하지만 바닐라 흡수/갑옷/토템/환경피해 전후의 이벤트 순서 및 실제 소모량을 검증해야 한다. 두 계층 모두 같은 피해를 중복 흡수하지 않도록 처리 순서 확정 후 표시. 현재 NOT_RUN.

## 6. 사용자 추가 디자인 요구
UI/UX/HUD 모두 복잡하지 않고 가독성 있게, 무난하게 예쁘면서 Minecraft 분위기에 맞출 것. 바닐라 슬롯/테두리·픽셀 아이콘과 절제된 희귀도 강조, Minecraft Dungeons의 장비 정보 계층 참고 후보. 실제 플레이 화면 기반 최종 디자인 필요. 기존 최소 HUD, 금색 흡수/청색 보호막, 생존 조작 유지. SYSTEMS 3절 연계. NOT_RUN.
