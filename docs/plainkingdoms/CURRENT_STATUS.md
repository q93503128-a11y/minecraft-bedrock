# PlainKingdoms 리메이크 현재 상태

기준일: 2026-10-01  
기준 원본: 사용자 제공 `PlainKingdoms_v1.1.5.mcaddon`  
현재 로컬 개발 빌드: `1.13.0 Remake Alpha 12`

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

### 캠페인 / 전쟁 후속
- 성벽 segment를 별도 전략 목표로 승격
- NPC 세력이 기지 밖으로 원정하는 독립 StrategicArmy 확장
- 포로 / 전쟁 종결 보상 / 다자전·동맹 공동전 확장
- 장기 보급선/보급 건물 연결

### 전투 표현 후속
- 세부 siege setup/fire/impact 애니메이션 고도화
- 역할별 melee/brace 후속 폴리싱
- death/corpse linger 표현

### 지휘/UX 후속
- 전략 지도 정보 밀도/시각 폴리싱
- touch/controller 실제 입력 전수검사
- 전술 카메라 실제 감도/거리 튜닝
- 컨텍스트 메뉴 문구/깊이 최종 정리

### Marketplace 마감
- 온보딩
- 접근성
- 번역/문구
- 멀티 권한/악용 검사
- 성능 전수검사
- 라이선스 최종 감사

## 검증 정책

현재도 사용자 실플레이 테스트 단계가 아니다.

Alpha 12까지 일반 NPC 세력의 청크 밖 전략전과 역할별 bow/crossbow/siege/charge 표현이 연결됐다. 다음 배치부터 R12 Marketplace 온보딩·접근성·모바일/컨트롤러·멀티 폴리싱으로 들어가며, 그 뒤 내부 전수감사 후 실제 Bedrock 통합 테스트를 요청한다.

정적 검사는 Minecraft 런타임 정상 판정을 대신하지 않는다.


## Alpha 8 — 전략 조우 / 추상 전투 / 실전 전환

### Strategic Encounter 정본

새 world state:
- `pk_strategic_encounters_v1`
- `pk_strategic_encounter_log_v1`

Encounter는:
- id
- 양측 nation slot
- 전투 중심 좌표
- abstract / physical 상태
- 참가 군단 목록
- 각 참가 군단의 전투 전 order / target
- startedAt / lastStepAt / round / deterministic seed

를 저장한다.

StrategicArmyState row에는:
- `encounterId`

가 추가됐다.

기존 row는 빈 encounterId로 자동 호환된다.

### 조우 감지

전쟁 관계인 두 국가의 virtual army만 전략 조우 후보가 된다.

초기 거리:
- 적군 조우: 12블록
- 같은 전투 지원군 합류: 18블록

24블록 spatial grid로 후보를 제한한다.

같은 양국의 군단이 같은 지역에 몰려 있으면 여러 1:1 전투를 마구 만드는 대신 기존 Encounter에 합류시키는 쪽을 우선한다.

한 pass에서 새 Encounter 생성은 최대 4개로 제한한다.

### 청크 밖 추상 전투

관측 플레이어가 없으면 1초 단위로 abstract round를 진행한다.

입력:
- 현재 StrategicArmyState HP / HP max
- 실제 composition
- 병종 상성
- HP 비율
- formation preference / Auto에서 추정한 대형
- deterministic seed / round

반영:
- 창병 → 기사 대기병 우세
- 기사 → 궁/석궁 압박
- 중장/근위의 방어
- Wedge 기병 공격 보정
- Line 원거리 공격 보정
- Block 전열 방어 보정

피해는 동시에 계산한다.

군단 HP가 0에 도달하면:
- world army shard에서 제거
- generation 증가
- 오프라인 owner 정산 기록
- Encounter 참가 목록에서 제거

한다.

### 전투 시간

추상 전투를 즉시 판정하지 않는다.

현재 순수 계산 smoke test 예:
- 창 30 vs 기사 30: 약 45초, 창 승
- 기사 30 vs 궁 30: 약 13초, 기사 승
- 검 30 vs 검 30: 약 69초 수준의 소모전
- 중장 30 vs 검 30: 약 70초, 중장 우세

이는 실게임 프레임/틱 검증이 아니라 현재 실제 Alpha 8 계산 함수를 추출해 돌린 코드 단위 smoke test다.

### 플레이어 접근 → 실제 전투

Encounter 중심에서 약 34블록 안에 플레이어가 접근하면:
- abstract damage 즉시 중단
- encounter state → physical
- surviving StrategicArmyState HP 유지
- 참가 군단 order를 전투용 attack으로 유지
- 기존 materialization 계층이 같은 HP/편성/대형으로 실제 Entity를 생성

한다.

전투 중 플레이어가 떠나고 참가 군단이 다시 모두 virtual 상태가 되면:
- encounter state → abstract
- 현재 남은 HP에서 추상 전투 재개

한다.

따라서 “청크 밖 계산 결과”와 “눈앞의 전투 결과”가 별도 복사본이 아니다.

### 전투 종료 후 원래 행군 재개

Encounter 생성 시 각 군단의:
- 이전 order
- 이전 targetX/Y/Z

를 저장한다.

승리/평화 종료 시 생존 군단은 encounterId를 지우고 이전 명령을 복원한다.

즉 원정 중 적군을 만나 승리한 군단은 원래 목적지를 향한 행군을 다시 이어간다.

### 플레이어 명령으로 교전 이탈

플레이어가 교전 중인 군단에:
- 새 이동/공격 이동
- 정지
- 긴급 수도 복구

같은 명령을 내리면 해당 군단은 Strategic Encounter 참가 목록에서 이탈한다.

물리 actor의 `pk_encounter_id`도 함께 지운다.

### 평화/동맹 관계 변경

두 국가의 관계가 더 이상 war가 아니게 되면 해당 양국의 진행 Encounter를 정리하고 생존 군단의 이전 명령을 복구한다.

### 전쟁 로그 UI

군령 → 전략 전투 / 전쟁 로그 추가.

표시:
- 진행 중 Encounter
- abstract / physical 여부
- 양국 이름
- 참가 군단 수
- 좌표
- 최근 전투 시작 / 지원군 / 전멸 / 실전 전환 / 종료 로그

진행 중 Encounter를 선택하면 지휘관을 전투 인근 상공으로 이동시킬 수 있다.

### 군단 호출기 연동

Encounter 중인 군단은:
- 전략 전투 교전
- 실전투 교전

상태를 군단 호출기에 표시한다.

### 성능 진단

성능 진단에:
- 진행 중 전략 전투 수
- physical 전환 전투 수
- 최근 전략/조우 루프 ms

를 추가했다.

Encounter가 없고 새 조우도 발생하지 않은 pass에서는 모든 군단 shard를 매초 다시 저장하지 않는다.

### Alpha 8 범위 밖

아직 이번 단계에 넣지 않음:
- NPC 월드 세력의 청크 밖 추상 전투
- 수도/성벽/건물 공성 resolution
- 3국 이상 다자전
- 동맹국이 한 Encounter의 제3측/공동측으로 들어오는 처리
- supply / morale / prisoner / loot campaign layer
- treaty permission
- strategic allied reinforcement command
- 실제 projectile / siege impact 연출

이 항목들은 R9 이후 캠페인/외교 계층과 함께 확장한다.

### Alpha 8 정적/코드 단위 검사

- JavaScript syntax PASS
- JSON 58개 parse PASS
- named function 480 / duplicate 0
- BP/RP/module 1.9.0 정합
- BP→RP dependency 1.9.0 정합
- encounter world keys / schema 확인
- strategic movement encounter pause 확인
- war-only encounter detection 확인
- 24블록 spatial grid 확인
- same-battle reinforcement merge 경로 확인
- abstract ↔ physical transition 경로 확인
- player command encounter detach 경로 확인
- peace relation encounter cancel 경로 확인
- army locator encounter status 확인
- performance diagnostic encounter metrics 확인
- 실제 Alpha 8 전략 피해 함수 추출 smoke test PASS
- Source ZIP / mcaddon CRC PASS
- Source ZIP / mcaddon byte-identical
- payload 86 files
- SHA-256: `1615047d9ac9e365e70dc029e537c3c90670f2bb49986039a6c53f6a31a89bb2`

## 검증 정책

현재도 사용자 실플레이 테스트 단계가 아니다.

R8은 코드/정적/순수 계산 smoke test 단계다. 실제 Bedrock에서 전쟁 국가 두 개를 구성해 500~2000블록 원정 중 조우, owner offline, 접근/이탈 전환, 지원군 합류, 승리 후 원래 목적지 재행군을 최종 통합 테스트에서 반드시 검증해야 한다.


## Alpha 9 — 외교 / 조약 권한 / 전략 지원군

### 관계 상태

외교 관계를 다음 네 단계로 정리했다.
- War
- Truce
- Neutral
- Alliance

기존 저장값 `ally`는 로드 시 `alliance`로 호환한다.

전쟁 중 평화 요청을 상대가 수락하면 즉시 Neutral이 아니라 Truce로 전환한다.
현재 휴전 시간은 5분이며, 휴전 중 재선전은 차단된다.
시간이 지나면 자동으로 Neutral로 전환한다.

### 조약 권한 분리

동맹 관계 자체와 별도로 다음 5개 권한을 world state `pk_treaties_v1`에 저장한다.

- MilitaryAccess / 군사 통행
- ResourceAid / 자원 지원
- SharedVision / 정보 공유
- Reinforcement / 지원군 파견
- SharedCommand / 공동 지휘

OFF → ON:
- 요청
- 상대 수락
- 활성화

ON → OFF:
- 어느 한쪽이 즉시 철회 가능

Alliance가 종료되면 활성 조약 권한도 함께 종료된다.

### MilitaryAccess

군사 통행은 UI 표기만이 아니라 이동 계층에 실제로 연결했다.

전략 군단:
- 목적지 명령 시 foreign territory 검사
- virtual march 중 매 이동 step 검사
- 권한이 없는 Neutral/Alliance 영토 경계에서 정지

물리 군단:
- local steering candidate마다 foreign territory 검사
- 권한이 없는 영토 진입을 차단

War 상태인 상대 영토에는 침공할 수 있다.
Alliance만으로 자동 통행되지는 않는다.

### ResourceAid

ResourceAid 조약이 활성화된 동맹에만 자원 지원 가능.

- 목재 / 석재 / 식량 / 철 25 단위
- 상대 접속 중: 즉시 지급
- 상대 오프라인: nation-slot pending reward로 저장 후 다음 접속 시 지급

### SharedVision

SharedVision은 다음 정보만 공유한다.
- 동맹 군단 위치
- 편성
- HP
- 현재 명령
- 전략/실전 교전 상태

정보 공유는 플레이어 순간이동이나 군단 명령 권한을 부여하지 않는다.

최종 감사 중 초기 구현이 SharedVision 군단 선택 시 `safeObserverTeleport`를 호출하던 문제를 발견해 제거했다.

### SharedCommand

SharedCommand 조약이 활성화되면:
- 동맹 전체 군단
- 특정 동맹 군단

중 하나를 공동 지휘 대상으로 선택할 수 있다.

공동 지휘 상태에서:
- 군령 깃발 Move
- Attack Move
- Hold
- 내 위치 집결

을 사용한다.

실제 이동은 그 군단 소유 국가의 MilitaryAccess 관계를 기준으로 검사한다.

조약 철회 또는 동맹 종료 시 현재 공동 지휘 context도 즉시 무효화한다.

최종 감사에서 공동 지휘 상태의 `내 위치 집결` 함수가 선언되지 않은 `ctx`를 참조하는 런타임 ReferenceError 가능성을 발견했고, 함수 내부에서 `sharedCommandContext(player)`를 명시적으로 해석하도록 수정했다.

### Reinforcement — 순간이동 제거

기존 동맹 지원군 순간이동을 정상 흐름에서 제거했다.

지원군 전략 파견 조건:
- Alliance
- Reinforcement treaty
- MilitaryAccess treaty

선택 군단/전군에:
- `order = reinforce`
- `supportForSlot = 동맹 국가 슬롯`
- 동맹 수도 인근의 서로 다른 그룹 destination

을 부여한다.

지원군은 기존 물리/virtual 이동 계층을 그대로 사용하므로:
- 가까우면 실제 이동
- 멀어지면 StrategicArmyState 행군
- 소유자가 따라가지 않아도 계속 이동
- 동맹 목적지 도착 시 Hold

로 전환된다.

새로운 일반 이동/공격/정지 명령을 내리면 `supportForSlot`은 해제된다.

### Alpha 9 정적/패키지 검사

최종 정본 기준:
- JavaScript syntax PASS
- JSON 58개 parse PASS
- named function 496 / duplicate 0
- BP/RP/module 1.10.0 정합
- BP→RP dependency 1.10.0 정합
- runtime VERSION `1.10.0-remake.9`
- 5 treaty flags wire 확인
- treaty request/accept/revoke 경로 확인
- Truce expiry 경로 확인
- MilitaryAccess strategic + physical path 확인
- ResourceAid offline pending reward path 확인
- SharedVision no-teleport invariant 확인
- SharedCommand ground/order path 확인
- shared-command gather ReferenceError 회귀검사 확인
- Strategic Reinforcement `reinforce/supportForSlot` 경로 확인
- legacy `ally` → `alliance` compatibility 확인
- Alpha 8 대비 payload 변경 파일 3개만 확인
- Source ZIP / mcaddon CRC PASS
- payload 86 files
- Source ZIP / mcaddon byte-identical
- SHA-256: `b2dbe716f2f0ba090769183503da4b6c02445975fbfba005268e3d0dc381a7d2`

현재도 사용자 실플레이 테스트 단계가 아니다.


## Alpha 10 — 전략 공성 / 캠페인 물류 / 가시 투사체

### Strategic Siege

새 world state:
- `pk_strategic_sieges_v1`
- `pk_campaign_state_v1`
- `pk_campaign_log_v1`

군령 → 공성 / 캠페인에서:
1. 전쟁 중인 국가 선택
2. 수도 또는 건물 선택
3. 현재 선택 군단/전군에 `order = siege`
4. 실제 물리/StrategicArmyState 행군
5. 목표 10블록 안에서 공성 시작

1~16개 군단은 공성 시작 반경 안에 유지되는 별도 집결 offset을 사용한다.

### 공성 대상 / 방어층

초기 전략 공성 대상:
- 수도
- 감시탑
- 병영
- 창고
- 대장간
- 사격장
- 마구간
- 시장
- 도서관
- 병원
- 농장
- 광산
- 제재소
- 주택

공성은:
- 도시 전체 fortification layer
- 개별 target HP

두 단계를 가진다.

수도 레벨과 작동 중인 감시탑이 fortification/defense를 높인다.

### 공성 결과

비수도 건물 돌파:
- 블록을 파괴해서 세이브 구조를 망가뜨리지 않음
- 3분간 해당 건물 기능 정지
- 생산/병영/감시탑 계산에서 제외

수도 돌파:
- 4분간 수도 전략 방어력 약화
- 공격국 전쟁점수/공성승/약탈 증가
- 방어국 전쟁점수/공성패 반영

공격국은 대상 종류/레벨에 따른 목재·석재·식량·철 약탈 보상을 받는다.

### 보급 / 사기

StrategicArmyState에:
- `supply` 0..100
- `morale` 0..100

을 유지한다.

보급:
- 자국 영토: 빠른 회복
- ResourceAid + MilitaryAccess 동맹 영토: 느린 회복
- 일반 야전: 감소
- 적 영토: 더 빠른 감소

낮은 보급/사기는:
- 전략 이동 속도
- 물리 이동 속도
- 전략 전투 피해
- 물리 전투 피해

를 함께 낮춘다.

전투/공성 피해는 사기도 낮추며, 승리한 전략 전투/공성은 생존군 사기를 일부 회복한다.

### 공성의 전략/물리 연속성

공성 중에도 같은 StrategicArmyState HP를 정본으로 사용한다.

플레이어가 접근한 관측 공성에서는:
- 참가 군단이 물리 actor로 보임
- 공성탄/화살/볼트 연출 표시
- 방어 피해로 바뀐 전략 HP를 물리 actor health에도 동기화

평화/휴전/동맹 전환 시 양국 사이의 진행 공성도 종료한다.

### 가시 투사체

새 cosmetic projectile entity:
- `plainkingdoms:visual_arrow`
- `plainkingdoms:visual_bolt`
- `plainkingdoms:visual_siege_shot`

Script가 `minecraft:projectile` component의 `shoot()`을 사용해 실제 궤적으로 발사한다.

중요:
- projectile 자체에는 impact_damage가 없음
- 실제 피해는 기존 animation hit-frame Script가 권위
- 따라서 가시 투사체 + Script 피해가 중복 적용되지 않음

일반 군단 원거리 전투와 관측 공성 양쪽에서 사용한다.

새 이미지 생성은 없으며 기존 PlainKingdoms 병종 텍스처를 투사체 렌더에 재사용한다.

### 호출기 / 성능 진단

군단 호출기:
- 보급
- 사기
- 전략/관측 공성
- siege id

를 표시한다.

성능 진단:
- 전략 공성 수
- 관측 공성 수
- 저보급 군단 수

를 추가했다.

### Alpha 10 정적/패키지 검사

- JavaScript syntax PASS
- JSON 65개 parse PASS
- named function 544 / duplicate 0
- BP/RP/module/dependency 1.11.0 정합
- runtime VERSION `1.11.0-remake.10`
- Strategic Siege / campaign world-state wire 확인
- peace/non-war 공성 취소 경로 확인
- strategic + physical logistics 성능 영향 확인
- temporary building disable / capital breach 경로 확인
- 공성 UI/명령 경로 확인
- 1~16군단 공성 집결 좌표 unique + 10블록 trigger 내부 확인
- cosmetic projectile 3종 BP/RP/geometry/texture 참조 확인
- projectile impact_damage 없음 확인
- 일반 ranged + 관측 siege projectile spawn 경로 확인
- Source ZIP / mcaddon CRC PASS
- payload 93 files
- Source ZIP / mcaddon byte-identical
- SHA-256: `26d884b1f8903f37e4848aba21eedff0c094cf57752baccd6abca6cb1a966402`

현재도 사용자 실플레이 테스트 단계가 아니다.


## Alpha 11 — 전술 카메라 / 전략 지도 / 컨텍스트 지휘

### 전술 카메라

새 Behavior Pack camera preset:
- `plainkingdoms:tactical`
- `inherit_from: minecraft:follow_orbit`
- `control_scheme: camera_relative`
- radius 18
- entity offset [0, 4, 0]
- view offset [0, 2.5]
- 시작 pitch 52°

목표는 완전한 별도 RTS 캐릭터 조작이 아니라 기존 Minecraft 플레이어를 지휘관으로 유지하면서 가까운 전투를 읽기 쉬운 높은 시점에서 보는 것이다.

전술 카메라는 session-only다.
- 토글 ON/OFF 가능
- 접속/초기화 경로에서 camera clear
- camera mode 자체를 세이브 정본으로 남기지 않음

전술 카메라 ON 동안 actionbar에:
- 현재 선택 군단/전군
- 선택 수
- 이동 중 수
- Encounter 수
- Siege 수
- 군령 메뉴 힌트

를 주기적으로 표시한다.

### 전략 지도

기존 세계 지도/관찰 이동 중심 UI를 실제 지휘 surface로 재구성했다.

메인:
- 내 군단 지도
- 전쟁 / 공성 지도
- 국가 / 거점 지도
- 좌표 직접 지휘
- 전술 카메라
- 지휘관 관찰 이동
- 군단 지휘 메뉴

관찰 이동은 지휘 기능과 분리해 명시적으로 선택할 때만 사용한다.

### 군단 지도

각 StrategicArmyState에 대해:
- 현재 좌표
- 목표 좌표
- ETA
- HP
- 현재 명령
- virtual / physical / encounter / siege 상태

를 표시한다.

군단 선택 후:
- 해당 군단 선택
- X/Z 직접 명령
- 대형 변경
- 수도 귀환
- 전술 카메라
- 관찰 이동

으로 이어진다.

### 좌표 직접 지휘

`ModalFormData`의 X/Z 입력을 사용한다.

숫자 검증 뒤:
- Move
- Attack Move

중 하나를 선택해 StrategicArmyState의 실제 목적지로 전달한다.

### 전쟁 / 공성 지도

현재 국가가 참가하는:
- Strategic Encounter
- Strategic Siege

를 한 화면에서 본다.

진행 중 전투/공성에:
- 선택 군단 현장 투입
- 관찰 이동

을 제공한다.

공격국의 기존 Siege 대상은 Alpha 10의 실제 `StrategicSiege` target record를 재사용한다.

### 국가 / 거점 지도

국가 수도와 월드 거점을 전략 목적지로 사용한다.

관계/조약에 따라:
- 자국 수도 집결
- 전쟁국 수도 공격/공성
- 동맹국 수도 이동
- Reinforcement 파견
- 외교 화면
- 월드 거점 Move / Attack Move

등의 컨텍스트 명령을 노출한다.

### 군단 직접 터치 컨텍스트

군령 깃발을 들고 실제 군단 Entity를 터치하면 바로 해당 군단 컨텍스트 메뉴를 연다.

자국 군단:
- 선택
- Attack Move 모드
- Hold
- Formation

SharedCommand 동맹 군단:
- 공동 지휘 대상으로 선택 가능

전쟁 상대:
- 현재 선택한 자국 군단을 적 위치로 Attack Move

SharedVision만 있는 동맹은:
- 상태 정보만 확인
- 지휘 권한이나 순간이동은 부여하지 않음

### Alpha 11의 지도 표현 범위

현재 전략 지도는 `server-ui` 기반의 정보/명령 surface다.

즉 아직 custom JSON UI로 그린 완전한 2D 미니맵 화면은 아니다.
일반 Add-On/Marketplace 호환성과 터치 안정성을 우선해:
- 상태
- ETA
- 좌표
- 관계
- 전투/공성
- 실제 명령

을 먼저 완성했다.

### Alpha 11 정적/패키지 검사

- JavaScript syntax PASS
- JSON 66개 parse PASS
- named function 564 / duplicate 0
- BP/RP/module/dependency 1.12.0 정합
- runtime VERSION `1.12.0-remake.11`
- tactical camera preset parse PASS
- follow_orbit / camera_relative wiring 확인
- setCamera / clear wiring 확인
- 전략 지도 5개 주요 command surface 함수 경로 확인
- ModalForm X/Z 명령 경로 확인
- Army Banner direct entity context event 확인
- 관찰 이동과 전략 명령 UI 분리 확인
- Alpha 10 → Alpha 11 payload 변경 파일 4개
- Source ZIP / mcaddon CRC PASS
- payload 94 files
- Source ZIP / mcaddon byte-identical
- SHA-256: `7c3a5688c0b4281dc2a9cc48b847f120e81317ad17f8504847948319825a33e3`

현재도 사용자 실플레이 테스트 단계가 아니다.


## Alpha 12 — NPC 전략전 / 역할별 전투 표현

### 일반 NPC 세력도 청크 밖에서 전투

기존 월드 세력 중 다음 faction site를 StrategicArmyState 군단이 플레이어 관측 없이 공격할 수 있다.

- 약탈자 야영지
- 고블린 정착지
- 언데드 묘역
- 적대화된 평원 중립 부족

전략 공격 명령 시 army row에 `siteTargetId`를 저장한다.

군단이 목표 12블록 안으로 들어오면:
- 플레이어가 118블록 안에 없을 때 abstract site battle 진행
- 플레이어가 접근하면 abstract 계산 중단
- 실제 site defender Entity가 남은 전략 수비력 비율로 materialize

한다.

### 물리 수비대 ↔ 전략 수비력 연속성

일반 faction site에는 strategic garrison HP를 유지한다.

멀리서 전투:
- garrison HP가 전략적으로 감소

플레이어 접근:
- 남은 garrison HP 비율을 실제 수비대 Entity health에 반영

플레이어 이탈:
- 142블록 밖에서 실제 수비대 HP를 다시 strategic garrison HP로 환산
- 실제 수비대 Entity 제거
- 청크/AI simulation 정지에 의존하지 않고 abstract 상태로 복귀

따라서 “멀리서 반쯤 잡았는데 가까이 가면 풀피로 리셋”되는 구조를 피한다.

### NPC 전략전 피해

공격군:
- 실제 composition
- 현재 HP
- formation
- supply/morale

을 사용한다.

NPC 기지:
- faction별 garrison HP
- faction별 반격 DPS
- 남은 garrison HP 비율

을 사용한다.

전략전 중 아군 HP/사기 손실도 같은 StrategicArmyState에 기록된다.

아군 군단 전멸은 기존 generation/world-shard 사망 정합성을 그대로 사용한다.

### 전략 제압 보상

전략전으로 faction site를 제압해도 기존 현장 전투와 같은 site reward 계층을 사용한다.

공동 참가 국가 슬롯을 `participants`에 기록하고 기존:
- 자원
- 유물
- 오프라인 pending reward

경로를 재사용한다.

전략/물리 어느 방식으로 제압하든 site는 `defeated` 정본 하나만 가진다.

### 공격 명령 정리

generic Move / Attack Move / SharedCommand 명령을 새로 내리면 이전 `siteTargetId`를 제거한다.

site가 제압되면:
- 남은 군단의 siteTargetId 제거
- 해당 site를 향한 Attack order를 Hold로 정리
- stale 공격 상태가 재실체화 후 살아나는 현상을 막음

### 역할별 공격 애니메이션

친군 9종의 client-synced `plainkingdoms:anim_state` 범위를 0..11로 확장했다.

새 state:
- 7: bow
- 8: crossbow
- 9: siege_fire
- 10: charge
- 11: die resource mapping

새 animation:
- `animation.plainkingdoms.squad_bow`
- `animation.plainkingdoms.squad_crossbow`
- `animation.plainkingdoms.squad_siege_fire`
- `animation.plainkingdoms.squad_charge`

각 animation은 6명 전체를 동일하게 움직이는 대신 role property를 읽어 해당 대표 병사 슬롯을 중심으로 움직인다.

기존 cosmetic:
- arrow
- bolt
- siege shot

과 hit-frame timing도 새 animation 길이에 맞춰 조정했다.

실제 피해 권위는 여전히 Script hit frame 하나뿐이다.

### Alpha 12 의도적 범위 밖

아직 abstract화하지 않음:
- 월드 보스
- 던전 wave
- NPC faction이 자기 기지를 떠나 원정하는 전략 군단
- corpse/death linger entity

`squad_die`와 die state mapping은 리소스에 존재하지만, 실제 entity death 후 충분히 보이는 corpse/death presentation은 R12/R13 폴리싱에서 별도 처리한다.

### Alpha 12 정적/패키지 검사

- JavaScript syntax PASS
- JSON 66개 parse PASS
- named function 576 / duplicate 0
- BP/RP/module/dependency 1.13.0 정합
- runtime VERSION `1.13.0-remake.12`
- friendly anim_state 0..11: 9/9
- bow/crossbow/siege_fire/charge/die client mapping: 9/9
- Strategic NPC site process world loop 연결 확인
- site physical→abstract HP sync 경로 확인
- abstract→physical garrison ratio spawn 경로 확인
- siteTargetId persistence/clear 경로 확인
- Source ZIP / mcaddon CRC PASS
- payload 94 files
- Source ZIP / mcaddon byte-identical
- SHA-256: `aa97ae304dd0c995fc6be9e5f1f06a938335ddbdd431dc603c1d80204a0def82`

현재도 사용자 실플레이 테스트 단계가 아니다.
