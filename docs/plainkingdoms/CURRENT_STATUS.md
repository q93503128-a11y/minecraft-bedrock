# PlainKingdoms 리메이크 현재 상태

기준일: 2026-09-30  
기준 원본: 사용자 제공 `PlainKingdoms_v1.1.5.mcaddon`  
현재 로컬 개발 빌드: `1.7.0 Remake Alpha 6`

## 저장소 역할

이 GitHub 저장소는 Minecraft Bedrock 프로젝트의 기획/설계/감사 문서 정본이다. PlainKingdoms 실제 BP/RP 수정과 `.mcaddon` 패키징은 작업 환경에서 수행하며, GitHub에는 기획과 구현 상태/출처 기록을 유지한다.

## 지금까지 완료된 리메이크 기반

### Alpha 1 — 장거리 지휘 / 선제 전략 전환

- 허공 ray 실패 시 장거리 지면 투영/보정
- 군령 깃발 허공 사용 = 장거리 명령, 웅크리기+사용 = 군단 메뉴
- 엔진이 군단을 멈추기 전에 거리 기준으로 Strategic state 전환
- 44/56 블록 hysteresis

### Alpha 2 — World/Nation StrategicArmyState

- `pk_armies_slot_<nationSlot>` world shard가 군단 정본
- 기존 player roster는 호환 mirror
- 소유자 오프라인 중에도 월드가 실행 중이면 전략 행군
- missing actor 복구
- 다른 플레이어 접근 시 materialization
- generation으로 stale actor 부활 방지

### Alpha 3 — Recruitment Queue / RallyPoint / UI 1차 축소

- 즉시 땅 소환 → 병영 Recruitment Queue
- 병영별 병렬 생산 / 같은 병영 순차 생산
- 병영 레벨에 따른 훈련 시간
- 자원/인구/군단 한도 예약
- 취소 환불
- 병영별 RallyPoint
- 완료 시 StrategicArmyState 생성
- 강제 핫바 도구 6개 → 3개
- 중복 통합 메뉴 제거

### Alpha 4 — 건설 UX

- 건설 카테고리
- 실제 90° 방향/회전
- 입구 방향 미리보기
- building shard v3 rotation 저장 및 v2 호환
- 반복 배치
- 두 점 터치 도로/성벽
- 회전 footprint / 업그레이드 / 병영 RallyPoint / 주민 근무 위치 연결

## Alpha 5 — 외부 CC0 기반 혼성 군단 표현 / 전투 상태 기반

### 실제 외부 원본 선정

Alpha 5에서 실제로 통합한 외부 원본은 Kenney의 **Blocky Characters**다.

- 공식: https://kenney.nl/assets/blocky-characters
- 라이선스: CC0
- 실제 검사한 retrieval mirror: `Hidencod/tge-assets/packs/blocky-characters/character-a.glb`
- Git blob SHA: `1929813eb7229d3440f4e517b7e0055c3dfd0078`
- 검사한 원본 크기: 131,728 bytes
- 원본 GLB 자체는 Add-On에 포함하지 않음
- 원본의 blocky humanoid 비율/노드 구조와 일부 animation curve를 Bedrock cuboid rig로 retarget/adapt

실제 원본에서 확인한 clip에는 idle, walk, sprint, die, attack-melee-right/left, holding/shoot/interact 계열 등이 있다.

Quaternius Animated Knight / Universal Animation Library 2는 후속 brace/charge/bow/crossbow/reload 등 확장 후보로 조사했지만 **Alpha 5 통합으로 표시하지 않는다**.

정확한 출처/통합 경계는:
- `docs/plainkingdoms/EXTERNAL_ASSET_PROVENANCE.md`
- RP `provenance/external_assets.json`
- RP `THIRD_PARTY_ASSETS.md`

에 기록한다.

### 6명 대표 병사 군단

성능 원칙은 유지:
- 전략 군단 1개 = 물리 Entity 1개
- 30개 개별 Minecraft mob으로 분해하지 않음

새 물리 표현:
- `geometry.plainkingdoms.squad_v2`
- 한 Entity 내부에 최대 6명의 대표 병사
- Kenney Blocky Characters 비율을 Bedrock cuboid로 재해석
- 103 bones / 120 cubes after Alpha 5 mobile-oriented geometry reduction
- 9개 친군 군단 Entity가 공용 rig 사용

대표 병사 역할 코드:
- 민병
- 검병
- 창병
- 중장
- 궁병
- 석궁
- 기사
- 왕실근위
- 공성

편성이 `검10 + 창10 + 궁10`이면 더 이상 dominant type 하나만으로 장비가 결정되지 않는다. 6개 대표 슬롯에 실제 composition을 분배하여 서로 다른 무기/장비 silhouette를 표시한다.

### 전투 손실 시 시각 인원 감소

현재 군단 HP 비율에 따라 보이는 대표 병사 수를 줄인다.

초기 band:
- 84% 초과: 6명
- 67% 초과: 5명
- 50% 초과: 4명
- 34% 초과: 3명
- 17% 초과: 2명
- 그 이하: 1명

실제 병력 30명을 정확히 6명이 1:5로 나타낸다는 뜻은 아니며, 상태 전달용 대표 표현이다.

### Client-synced Entity Properties

각 친군 army entity에:
- `plainkingdoms:anim_state`
- `plainkingdoms:slot1_role ... slot6_role`
- `plainkingdoms:slot1_visible ... slot6_visible`

총 13개 client-synced property를 추가했다.

Script가 전략/전투 상태와 composition을 계산하고 RP가 해당 property를 읽어 실제 외형/animation을 표현한다.

### 외부 원본 기반 animation retarget

새 animation family:
- squad_idle
- squad_walk
- squad_sprint
- squad_melee
- squad_ranged
- squad_hit
- squad_die
- squad_visibility

Kenney 실제 source timing을 보존한 주요 retarget:
- idle 약 1.333s
- walk 약 0.667s
- sprint 약 0.500s
- melee 약 0.417s
- die 약 0.333s

현재 die clip은 리소스로 포함됐지만 Minecraft entity 제거 전에 확실히 재생시키는 corpse/death representation은 아직 후속 과제다.

### 공격 피해와 animation hit frame 연결

기존:
- 사거리 안
- cooldown 완료
- 바로 `applyDamage()`

Alpha 5:
1. 공격 상태 선택
2. melee/ranged animation 시작
3. animation lock
4. melee 약 5 tick / ranged 약 4 tick 후 hit frame
5. 공격자/대상 생존 및 관계 재검증
6. 사거리 재검증
7. authoritative damage 적용
8. 피격 군단 hit reaction 요청

공격 시작 시점에 숫자만 즉시 깎이는 구조를 제거했다.

### SquadBrain 기반 인터페이스

아직 최종 SquadBrain은 아니지만 다음 기반을 추가했다.

- `pk_brain_state`
- `pk_brain_target`
- idle / hold / move / approach / engage 상태 기록
- animation state와 combat 판단 분리
- 이동 중 walk
- 후퇴 이동 중 sprint
- 공격 중 locomotion이 one-shot attack을 덮어쓰지 않도록 animation lock

### 표적 선택 1차 개선

기존 nearest-only target selection을 scoring 방식으로 변경했다.

현재 반영:
- 거리
- 대상 남은 HP
- 창병 비율 → 기병 우선
- 기사 비율 → 궁/석궁 우선
- 공성 비율 → Ancient Colossus 우선
- 중장/근위 대상의 단순 우선도 조정

R6에서 위협도, 명령 목표, 집중화 penalty, ranged safety, formation/role reservation까지 확장한다.

## Alpha 5 정적 검사

최종 패키지 기준:
- JavaScript syntax PASS
- JSON 58개 parse PASS
- duplicate function declaration 0
- BP/RP/module 1.6.0 정합
- 9개 friendly client entity → squad_v2 연결 확인
- 9개 friendly BP entity → 13개 client-synced property 확인
- six representative soldier root 확인
- animation family 8종 확인
- Kenney provenance 확인
- 원본 GLB 미포함 확인
- delayed hit frame 경로 확인
- mixed composition slot sync 확인
- target scoring 실제 call path 확인
- source ZIP / mcaddon CRC PASS
- source ZIP / mcaddon byte-identical
- archive SHA-256: `8288f0ef76dedaae74f4e10348e4930c63e3e8a19ee4a41dcdce00794f8feb25`

## 아직 남은 큰 리메이크

- R6 완전한 SquadBrain
- Block / Line / Column / Wedge / Loose 실제 Formation
- 병종별 위치 reservation
- 창병 brace / 기사 charge-regroup
- 궁/석궁 거리 유지 및 실제 projectile 연출
- siege setup/fire/impact
- 전략 군단 간 추상 전투
- 외교 treaty permission
- 동맹 지원군 전략 행군
- 전술 카메라
- 전략 지도 재설계
- UI context command 추가 정리
- Marketplace 최종 온보딩/접근성/멀티/모바일 검사

## 검증 정책

현재도 사용자 실플레이 테스트 단계가 아니다.

Alpha 5는 정적/코드 단위 검사를 통과한 통합 개발 중간판이다. R6/R7 전투와 대형까지 결합하고 주요 전략/외교 흐름을 더 연결한 뒤 내부 회귀감사를 거쳐 사용자 런타임 테스트 단계로 넘긴다.


## Alpha 6 — SquadBrain 병종 전술 1차 본체

### 목표

Alpha 5의 `pk_brain_state`/target scoring/animation bridge를 실제 전투 의사결정에 사용한다.

### 구현

- 기존 target 유지 성향을 추가해 매 틱 가장 가까운 적만 갈아타는 현상을 완화
- target score에 거리, 잔여 HP, 병종 상성, 같은 아군의 집중 수, 자신을 노리는 위협도를 반영
- 창 비중 25% 이상 군단은 기병 접근 시 `brace`
- brace 상태의 창벽은 기사 charge 피해를 감소시키고 대기병 피해를 강화
- 기사 비중 27% 이상 군단은 적절한 중거리에서 ranged/취약 목표를 향해 `charge`
- spear wall 목표에는 charge를 억제
- charge 성공 뒤 `recover`로 전환해 뒤로 이탈한 뒤 cooldown 후 재돌격 가능
- 궁/석궁 비중이 높은 군단은 preferred range를 유지하고 너무 가까우면 `kite`
- 공성 비중이 높은 군단은 더 긴 후방 거리를 유지하고 `siege_reposition`
- 중장/왕실근위 비중이 높은 군단은 근접에서 `anchor`하여 과도한 추격을 억제
- 명시적 Move/Rally/Retreat는 자동 전술보다 우선하며 opportunistic attack을 하지 않음
- Hold는 추격하지 않지만 사거리 안의 적에게는 전투 가능
- Attack/Defend는 SquadBrain 전술 이동 사용

### 애니메이션

새 client-synced state:
- `anim_state = 6` → `squad_brace`

9개 아군 군단 BP/RP 모두 property range와 brace mapping을 동일하게 갱신했다.

### 중요한 한계

현재도 한 전략 군단은 한 물리 Entity다.
따라서 대표 병사 6명이 서로 독립된 충돌/길찾기 좌표를 갖는 것은 아니다.

R6은 "군단 전체의 전술 의사결정" 단계다.
실제 Block/Line/Column/Wedge/Loose 대표병사 슬롯 배치와 역할별 전열/후열 정렬은 R7에서 구현한다.

### Alpha 6 정적 검사

- JavaScript syntax PASS
- JSON 58개 parse PASS
- named function 430 / duplicate 0
- BP/RP 1.7.0 정합
- friendly BP anim_state 0..6: 9/9
- friendly RP brace mapping: 9/9
- ZIP CRC PASS
- source ZIP / mcaddon byte-identical
- SHA-256: `6931d7fee854dc9e54905bc95d789a5fdd164ad771d22fe17864eda0723cd16d`

현재도 사용자 실플레이 테스트 단계가 아니다.
