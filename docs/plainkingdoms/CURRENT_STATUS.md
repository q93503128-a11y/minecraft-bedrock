# PlainKingdoms 리메이크 현재 상태

기준일: 2026-09-30
기준 원본: 사용자 제공 `PlainKingdoms_v1.1.5.mcaddon`
현재 로컬 개발 빌드: `1.3.0 Remake Alpha 2`

## 저장소 역할

이 GitHub 저장소는 Bedrock 프로젝트의 기획/설계/감사 문서 정본이다.
PlainKingdoms 실제 Bedrock BP/RP 수정과 .mcaddon 패키징은 현재 작업 환경에서 수행한다.
GitHub Actions 통과 여부를 Bedrock 런타임 정상의 근거로 사용하지 않는다.

## 완료된 리메이크 기반 작업

### Alpha 1 — 장거리 지휘 / 선제 전략 전환

- 가까운 실제 블록 ray hit를 우선 사용
- ray가 허공으로 빠지면 시선 X/Z를 지형으로 보정
- 군령 깃발 허공 사용을 장거리 이동/공격이동으로 사용
- 웅크리기+사용은 군단 메뉴로 분리
- 모든 플레이어에게서 멀어진 물리 군단을 청크가 얼리기 전에 전략 상태로 능동 전환
- 44/56블록 hysteresis로 반복 생성/제거 방지

### Alpha 2 — StrategicArmyState 월드 정본화

v1.1.5/Alpha 1까지는 군단 위치 목록의 정본이 소유 Player의 `army_roster`에 있었다.
Alpha 2부터 국가 슬롯별 world dynamic property가 정본이다.

저장 형태:
- `pk_armies_slot_<nationSlot>`
- 국가별 최대 군단 수만 저장
- player `army_roster`는 기존 세이브/호환용 mirror

초기 접속 마이그레이션:
1. 해당 국가 world army shard가 이미 있으면 world 상태를 player mirror로 복사
2. shard가 없으면 기존 player `army_roster` + 실제 로드 군단을 병합
3. world shard 생성
4. 이후 world 상태를 정본으로 사용

### 소유자 오프라인 행군

전략 루프가 더 이상 `for each online player -> advanceVirtualArmies(player)`에 종속되지 않는다.

현재 루프:
1. world registry에 존재하는 국가별 군단 shard 확인
2. 실체라고 기록됐지만 실제 actor가 사라진 군단 복구
3. 플레이어와 충분히 멀어진 actor를 전략 상태로 전환
4. 모든 virtual StrategicArmyState 이동
5. 어느 플레이어든 가까워지면 해당 군단 실체화

따라서 소유 플레이어가 로그아웃해도 월드가 다른 플레이어 때문에 계속 실행 중이라면 해당 군단의 전략 행군이 계속된다.

### 빠른 청크 이탈 복구

56블록 선제 전환 전에 엔진이 actor를 query에서 제거하는 경우도 고려한다.

world row가:
- `virtual=false`
- 하지만 실제 actor가 없음

상태로 1.5초 이상 유지되면:
- generation 증가
- `virtual=true`
- strategic movement로 승격

정지 군단도 동일하게 virtual hold 상태로 보존되어 이후 접근 시 다시 실체화된다.

### 오프라인 소유자의 근거리 군단

소유자가 접속하지 않았더라도 다른 플레이어가 근처에 있어 군단이 물리 actor로 실체화된 경우:
- 기존 이동 명령을 계속 수행
- 수도 귀환/방어는 nation registry의 수도 좌표 사용
- physical 위치/HP/order를 world shard에 주기적으로 다시 기록

### 사망 정합성

소유자가 오프라인인 물리 군단이 전멸하면:
- world strategic row를 즉시 제거
- generation을 올려 stale entity 부활 방지
- 기존 player army_count 정산 debt는 다음 접속 시 적용

## 성능/저장 진단

설정 → 성능 진단에 다음 정보를 추가:
- world 전략 군단 수
- virtual 전략 군단 수
- 현재 로드 아군 군단 수
- world Dynamic Property 총 byte 수

국가별 army shard 분할을 사용해 하나의 거대한 JSON에 모든 군단을 저장하지 않는다.

## 아직 구현하지 않은 큰 리메이크

- 병영 Recruitment Queue / RallyPoint
- UI/핫바 전면 재구성
- 외부 병사 모델/rig/전투 애니메이션
- SquadBrain
- 실제 Formation
- 전략 군단 간 추상 전투
- 동맹 지원군 전략 행군
- 전술 카메라
- 전략 지도 재설계
- Marketplace 최종 접근성/온보딩

## 내부 검증 정책

사용자 실플레이 테스트는 아직 요구하지 않는다.

전체 리메이크가 충분히 진행된 뒤 내부 정적/수동 검사를 먼저 끝내고 마지막 단계에서 실제 Bedrock 플레이 검증을 요청한다.

단, 청크 독립 이동은 최종 검증 시 반드시:
- 500블록
- 1000블록
- 2000블록
- 소유자 로그아웃 + 다른 플레이어가 월드 유지
- 목적지 접근 후 실체화
- 과거 위치 stale actor 미부활

을 확인해야 한다.

현재 Alpha 2는 기반 공사 단계이며 리메이크 완료판이 아니다.
