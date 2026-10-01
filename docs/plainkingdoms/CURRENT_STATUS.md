# PlainKingdoms 리메이크 현재 상태

기준일: 2026-10-01  
기준 원본: 사용자 제공 `PlainKingdoms_v1.1.5.mcaddon`  
현재 로컬 개발 빌드: `1.8.0 Remake Alpha 7`

## 저장소 역할

이 GitHub 저장소는 Minecraft Bedrock 프로젝트의 기획/설계/감사 문서 정본이다. PlainKingdoms 실제 BP/RP 수정과 `.mcaddon` 패키징은 작업 환경에서 수행하며, GitHub에는 설계 정본·진척·런타임 테스트 기준·외부 출처 기록을 유지한다.

## 리메이크 진행 요약

### Alpha 1 — 장거리 지휘 / 선제 전략 전환
- 허공 ray 실패 시 장거리 지면 투영/보정
- 군령 깃발 허공 사용 = 장거리 명령
- 웅크리기+사용 = 군단 메뉴
- 44/56블록 hysteresis 기반 proactive virtualization

### Alpha 2 — World/Nation StrategicArmyState
- 국가별 world shard가 군단 정본
- player roster는 호환 mirror
- owner offline 중에도 월드가 실행되면 전략 행군
- missing actor recovery / generation stale-copy 방지
- 다른 플레이어 접근 시 materialization

### Alpha 3 — Recruitment Queue / RallyPoint / 3도구 UI
- 즉시 땅 소환 → 병영 생산 Queue
- 병영별 병렬/순차 생산
- 자원·인구·군단 한도 예약
- 취소 환불
- 병영별 RallyPoint
- 모집 완료 → StrategicArmyState 생성
- 핫바 시스템 도구 6개 → 3개

### Alpha 4 — 건설 UX
- 건설 카테고리
- 실제 90° 건물 회전
- 출입구 방향
- building shard v3 rotation 저장 + v2 호환
- 연속 배치
- 두 점 터치 도로/성벽
- 회전 footprint / upgrade / RallyPoint / 근무 위치 연결

### Alpha 5 — 외부 CC0 기반 혼성 군단 표현
- Kenney Blocky Characters CC0 기반 Bedrock cuboid retarget
- 1군단=1 Entity 유지
- 최대 6명의 대표 병사
- 혼성 composition에 따라 서로 다른 무기/장비 silhouette
- HP에 따라 대표 병사 6→1 감소
- idle/walk/sprint/melee/ranged/hit/brace animation bridge
- 공격 피해를 애니메이션 hit frame과 동기화
- 외부 출처 정본: `docs/plainkingdoms/EXTERNAL_ASSET_PROVENANCE.md`

### Alpha 6 — SquadBrain
- target stability
- 병종 상성/위협/집중도 기반 target scoring
- 창병 brace
- 기사 charge → recover → 재집결
- 궁/석궁 kite/fireline
- 공성 후방 reposition
- 중장/근위 anchor
- 명시적 Move/Rally/Retreat가 자동 전술보다 우선

## Alpha 7 — 전장 대형 / 역할 슬롯 / 그룹 이동 분산

### 1. StrategicArmyState에 formation preference 저장

각 군단 row에:
- `formation: auto | block | line | column | wedge | loose`

를 저장한다.

기존 1.7 이하 row는 로드 시 자동으로 `auto`가 된다.

물리 actor에도:
- `pk_formation_pref`
- `pk_formation_active`

를 유지하며, virtualization → strategic march → materialization을 거쳐도 선호 대형을 복원한다.

### 2. Client-synced formation property

9개 친군 BP entity 모두:
- `plainkingdoms:formation`
- int 0..4
- client_sync=true

를 추가했다.

매핑:
- 0 Block
- 1 Line
- 2 Column
- 3 Wedge
- 4 Loose

RP의 9개 친군 client entity 모두 항상 실행되는:
- `animation.plainkingdoms.squad_formation`

을 연결했다.

### 3. 대표 병사 6명의 실제 위치가 대형에 따라 변경

기존 Alpha 5의 6인 rig를 그대로 한 모양으로 쓰지 않는다.

`s1_root ... s6_root` 위치를 formation property로 이동시킨다.

- Block: 3명 전열 + 3명 후열 중심의 안정 배치
- Line: 좌우로 넓은 횡대
- Column: 2열 종대
- Wedge: 선두 1명 → 중간 2명 → 후방 확장
- Loose: 대표 병사 간격을 크게 벌린 산개

각 대형에서 6개 시각 slot은 모두 서로 다른 좌표를 가진다.

### 4. 병종별 역할 슬롯 정렬

composition에서 뽑은 대표 역할을 무작위/수량순으로만 놓지 않는다.

기본 우선:
- 왕실근위 / 중장 / 창 / 검 / 민병 → 전열 우선
- 기사 → 전열/측면
- 궁 / 석궁 / 공성 → 후열 우선

Wedge에서는 기사 role을 선두 쪽으로 우선한다.

따라서 `검10 + 창10 + 궁10` 같은 혼성군은 같은 6명 표현을 쓰면서도 전열/후열 관계가 시각적으로 더 명확해진다.

### 5. Auto formation

대형 선호 `auto`가 기본이다.

초기 규칙:
- 일반 이동 / 집결 / 후퇴 → Column
- 창병 brace → Line
- 기사 charge → Wedge
- ranged fireline → Line
- recover / kite / siege reposition → Loose
- 중장/근위 anchor / 일반 근접 → Block

자동 대형은 SquadBrain state를 읽어 즉시 client formation으로 변환한다.

### 6. Manual formation

군령 → 빠른 군단 지휘 → 대형/자동 전술에서:
- 자동
- 방진
- 횡대
- 종대
- 쐐기
- 산개

를 선택할 수 있다.

선택 대상이 전군이면 전군에, 개별 군단이면 해당 군단에 적용된다.

수동 대형은 SquadBrain 전투 중에도 유지된다.

### 7. 여러 군단 그룹 이동 목적지 분리

이전에는 단순 제곱형 offset 하나만 사용했다.

Alpha 7은 선택 군단 수 1~16에 대해:
- Block
- Line
- Column
- Wedge
- Loose

별 group destination layout을 계산한다.

Auto group layout:
- Attack Move → Line
- Move / Rally / Retreat → Column
- 나머지 → Block

목표점 하나를 찍어도 각 군단은 서로 다른 targetX/targetZ를 받는다.

그룹의 현재 중심 → 목적지 방향을 기준 forward로 잡고, local formation offset을 world X/Z로 회전시킨다.

### 8. 같은 국가 군단 근거리 separation

목표 좌표가 달라도 이동 중 통로에서 actor가 겹칠 수 있으므로:
- 가까운 동일 국가 물리 군단을 spatial cache에서 찾고
- 원래 이동 방향을 유지하면서
- 약한 local repulsion vector를 steering 단계에 합성

한다.

A*의 최종 목표 자체를 계속 바꾸지 않고 steering만 보정해서 route cache churn을 줄인다.

### 9. 대형의 작은 전투 차이

Alpha 7에서 대형은 시각 효과만은 아니다.

초기 소폭 보정:
- Wedge + charge → 돌격 피해 상승
- Line + ranged → 원거리 화력 소폭 상승
- Block + brace/anchor → 방어 보정
- Line은 정면 charge에 조금 더 취약

대형만으로 병종 상성을 뒤집을 정도로 수치를 크게 두지 않는다.

### 10. 중요한 한계

여전히:
- 전략 군단 1개 = 물리 Entity 1개

다.

대표 병사 6명은 실제 개별 pathfinding entity가 아니다.

Alpha 7에서 “실제 대형”이란:
1. 대표 병사 bone 위치가 formation별로 실제 변경되고,
2. role이 전열/후열 slot에 배치되며,
3. 복수 군단의 실제 target 좌표도 formation별로 분리되고,
4. 같은 국가 물리 군단끼리 steering separation을 가진다는 뜻이다.

개별 대표 병사마다 독립 충돌/피격/길찾기를 주는 구조는 성능상 목표가 아니다.

## Alpha 7 정적/패키지 검사

최종 패키지 기준:
- JavaScript syntax PASS
- JSON 58개 parse PASS
- named function 445 / duplicate 0
- BP/RP/module 1.8.0 정합
- BP→RP dependency 정합
- formation client property 9/9
- formation RP mapping 9/9
- 6개 representative root formation animation 확인
- StrategicArmyState formation persistence 코드 경로 확인
- multi-army destination layout 코드 경로 확인
- same-nation separation 코드 경로 확인
- Auto formation resolver 코드 경로 확인
- 실제 추출 함수 기반 1~16군단 group destination uniqueness 테스트 PASS
- Source ZIP / mcaddon CRC PASS
- Source ZIP / mcaddon byte-identical
- archive payload 86 files
- SHA-256: `3a9f06915f18013e164b1a59d3e6d9dab051ebe4c6cea9b11d5c2cc07653b309`

## 아직 남은 큰 리메이크

### R8
- 전략 군단 간 encounter detection
- 플레이어가 없을 때 abstract combat
- 플레이어 접근 중 전략↔실전투 reconciliation
- 전략 전투 로그 / duration / reinforcement join

### R9
- War / Truce / Neutral / Alliance 정리
- MilitaryAccess / ResourceAid / SharedVision / Reinforcement / SharedCommand treaty flag
- 동맹 지원군 순간이동 중심 → Strategic Reinforce march

### 전투 표현 후속
- 실제 보이는 arrow/bolt/siege projectile
- siege setup/fire/impact
- charge/brace/ranged role-specific animation 추가 확장
- death/corpse 표현

### 지휘/UX 후속
- tactical camera
- strategic map 재설계
- context command UI 추가 정리
- mobile/controller 전수 UX

### Marketplace 마감
- 온보딩
- 접근성
- 번역/문구
- 멀티 권한/악용 검사
- 성능 전수검사
- 라이선스 최종 감사

## 검증 정책

현재도 사용자 실플레이 테스트 단계가 아니다.

Alpha 7까지 전투/대형 기반이 연결됐지만, R8 전략 전투와 R9 외교/지원군 흐름을 더 연결한 뒤 내부 회귀감사를 하고 실제 Bedrock 통합 테스트를 요청한다.

정적 검사는 Minecraft 런타임 정상 판정을 대신하지 않는다.
