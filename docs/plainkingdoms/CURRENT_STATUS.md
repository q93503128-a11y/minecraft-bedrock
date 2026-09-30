# PlainKingdoms 리메이크 현재 상태

기준일: 2026-09-30
기준 원본: 사용자 제공 `PlainKingdoms_v1.1.5.mcaddon`
현재 로컬 개발 빌드: `1.5.0 Remake Alpha 4`

## 저장소 역할

이 GitHub 저장소는 Bedrock 프로젝트의 기획/설계/감사 문서 정본이다.
PlainKingdoms 실제 Bedrock BP/RP 수정과 .mcaddon 패키징은 현재 작업 환경에서 수행한다.
GitHub Actions 통과 여부를 Bedrock 런타임 정상의 근거로 사용하지 않는다.

## Alpha 1 — 장거리 지휘 / 선제 전략 전환

- 블록 ray hit 실패 시 장거리 지면 보정
- 군령 깃발 허공 사용을 장거리 이동/공격이동으로 사용
- 웅크리기+사용은 군단 메뉴
- 플레이어와 멀어진 물리 군단을 엔진 청크 정지 전에 전략 상태로 능동 전환
- 44/56블록 hysteresis

## Alpha 2 — World/Nation StrategicArmyState 정본화

- 국가 슬롯별 `pk_armies_slot_<slot>` world shard가 군단 정본
- 기존 player `army_roster`는 세이브 호환 mirror
- 소유자가 로그아웃해도 다른 플레이어가 월드를 유지하면 전략 행군 지속
- 실체 기록인데 actor가 사라진 군단의 1.5초 누락 복구
- 다른 플레이어가 접근해도 전략 군단 실체화
- 오프라인 소유 군단 사망 정합성 처리

## Alpha 3 — 병영 생산 Queue / RallyPoint / 3도구 UI

- 즉시 군단 생성 대신 병영 Recruitment Queue
- 병영별 병렬/순차 생산
- 병영 레벨 기반 훈련 시간
- 군단 한도/인구 예약
- 취소 시 자원 환불
- 병영별 RallyPoint
- 모집 완료 시 StrategicArmyState 먼저 생성
- 소유자 오프라인 중 월드가 실행되면 Queue 진행
- 강제 핫바 시스템 도구 6개 → 3개
- 중복 통합 메뉴 제거

## Alpha 4 — 건설 UX / 방향 / 기반시설

### 건설 메뉴 정보 구조

기존 13개 건물 단일 긴 목록을 다음 카테고리로 분리:
- 추천
- 주거 / 경제
- 군사
- 지원 / 연구
- 방어
- 도로 / 성벽

일반 플레이에서 건설도구를 열면 먼저 카테고리와 현재 배치 상태를 본다.

### 건물 방향 / 회전

새 일반 건물 선택 시 플레이어가 바라보는 방향을 가장 가까운 90° 단위로 스냅하여 건물 정면으로 사용한다.

지원 방향:
- 북
- 동
- 남
- 서

배치 중:
- 웅크리기 + 건설도구 사용 → 90° 회전
- 건설 메뉴의 회전 버튼 → 90° 회전

미리보기에는:
- 현재 실제 Lv.1 외곽
- Lv.5 최대 예약 외곽
- 설치 가능/불가
- 정면 방향용 별도 입구 마커

가 동시에 표시된다.

회전은 단순 UI 값이 아니라 실제 procedural structure operation 좌표 전체에 적용된다.

### 건물 저장 포맷 v3

기존 building shard v2:
- type
- x/y/z
- level

Alpha 4 building shard v3:
- type
- x/y/z
- level
- rotation

v2 월드는 그대로 읽으며 rotation은 0°(북)로 간주한다.
다음 shard 저장 시 v3로 자연 승격한다.

업그레이드/재시공에서도 기존 rotation을 유지한다.

회전값은 다음에도 반영:
- 건물 실제 크기/예약 footprint
- 건물끼리 충돌 판정
- 증축 충돌 판정
- 주민 근무지 출입 방향
- 병영 기본 RallyPoint
- 건물 목록/관리 UI

### 연속 배치

건설 메뉴에서 연속 배치 ON/OFF를 선택할 수 있다.

ON:
- 공사 완료 뒤 같은 건물 종류를 계속 배치

OFF:
- 공사 등록 시 배치 모드 해제

기존 모바일 중복 탭 방지와 미리보기→재터치 확정은 유지한다.

### 도로 2점 배치

건설 → 도로 / 성벽 → 도로

1. 시작점 터치
2. 끝점 터치
3. 최대 길이/영토/건물 교차/자원 검사
4. 공사 Queue 등록

초기 구현:
- 최대 72블록
- 3블록 폭
- gravel 중심
- 일정 간격 stone brick 강조
- 길이 비례 석재 비용

정밀 드래그를 요구하지 않아 터치에서도 동일하게 사용한다.

### 성벽 2점 배치

건설 → 도로 / 성벽 → 성벽

1. 시작점 터치
2. 끝점 터치
3. 유효성 검사
4. 공사 Queue 등록

초기 구현:
- 최대 72블록
- stone brick 기반
- 상단 stone brick wall
- 일정 간격 lantern
- 길이 비례 석재/목재 비용

도로/성벽은 일반 건물 record가 아니라 construction job 기반 기반시설이다.
기존 건물의 현재 footprint를 관통하는 구간은 거부한다.

### 모바일 조작 원칙

- 일반 건물은 기존 미리보기/재터치 유지
- 회전은 웅크리기+사용 또는 큰 메뉴 버튼
- 도로/성벽은 start/end 두 번 터치
- 필수 drag 없음
- 기반시설 첫 지점은 particle marker로 유지
- 웅크리기+건설도구 사용으로 기반시설 첫 지점 초기화 가능

## 내부 정적 검사

Alpha 4 최종 패키지 기준:
- JavaScript syntax PASS
- duplicate function declaration 0
- JSON 55개 전수 parse PASS
- BP/RP/모듈 버전 1.5.0 정합
- BP→RP dependency 정합
- building shard v2/v3 backward read 확인
- rotated structure plan 코드 경로 확인
- rectangular barracks L1 footprint 13×16 → 90° 회전 시 16×13 계산 확인
- source ZIP / mcaddon CRC PASS
- source / mcaddon 82개 payload byte hash 일치

정적 검사는 런타임 플레이 정상 판정을 대신하지 않는다.

## 아직 남은 큰 리메이크

- 외부 병사 모델/rig/전투 애니메이션
- 혼성 편성 대표 병사 시각화
- SquadBrain
- 실제 Formation
- 원거리 projectile/공성 연출
- 전략 군단 간 추상 전투
- 동맹 지원군 전략 행군
- 외교 treaty permission
- 전술 카메라
- 전략 지도 재설계
- UI 컨텍스트 명령 추가 정리
- Marketplace 최종 접근성/온보딩/모바일 전수검사

## 검증 정책

현재도 사용자 실플레이 테스트 단계가 아니다.

통합 테스트 단계에서 Alpha 4 건설 기능은 반드시:
- 직사각형 건물을 4방향 모두 배치
- 회전 미리보기와 실제 구조 일치
- 회전 건물 업그레이드/재시공 시 방향 유지
- Alpha 3 building shard v2 → v3 호환
- 도로/성벽 평지·경사·대각선
- 영토 경계 거부
- 기존 건물 교차 거부
- 연속 배치 ON/OFF
- 모바일 중복 터치
- 회전 병영 RallyPoint
- 회전 건물 주민 근무 위치

를 확인한다.

현재 Alpha 4는 리메이크 중간 개발판이며 완료판이 아니다.
