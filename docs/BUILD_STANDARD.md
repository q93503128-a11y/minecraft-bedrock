# Bedrock Build & Validation Standard

공용 기준. 자바 Gradle/JAR 규칙을 베드락에 기계적으로 적용하지 않는다.

## 프로젝트 등록

- 정본은 `projects/<slug>/`. 최소 `PROJECT.md`, `STATUS.md`; 설계중이면 소스가 없어도 되나 **미구현이라고 명시**.
- 구현할 때 `BP/`(Behavior Pack), `RP/`(Resource Pack), `assets/`(Blockbench 등 원본), `tests/`, `tools/`를 같은 프로젝트에 모은다.
- `PROJECT.md`에는 목표 Minecraft 버전, namespace, BP/RP UUID와 버전, Script API 의존성, 설치 대상, 월드 호환성, 빌드/테스트 방법을 실제 확정 후 기록한다.
- 다른 프로젝트의 소스를 대신 사용하거나 누락 파일을 가짜 스텁으로 채우지 않는다.

## 확인 순서

1. 목표 Bedrock 정식 버전 및 Script API 안정/실험 API 사용 여부를 공식 자료로 확인.
2. `manifest.json`의 포맷·module·dependency·UUID·버전 정합성 검증.
3. 모든 JSON 파싱, 필수 엔티티·아이템·레시피·블록·사운드·텍스처 경로 및 ID 참조 검사.
4. JavaScript/TypeScript 구문, 이벤트 등록, 스키마, 최소 단위 테스트 검증.
5. BP/RP를 각각 올바르게 구성하고 하나의 재현 가능한 `.mcaddon`으로 패키징. 파일 누락·중복 경로·비어 있는 파일 검사.
6. 가능하면 실제 Minecraft Bedrock에서 새 월드 import, 활성화, 재접속, 기본 루프, 실제 렌더, 모바일/컨트롤러/멀티플레이 시험.
7. 성능과 저장 안정성, 실패 시 복원 가능성 확인.
8. 실행한 검사와 미실행/차단된 검사를 명확히 나누어 `STATUS.md` 및 보고서에 기록.

## 필수 안전성

- 판매/인벤토리/재화 지급은 재호출 시 중복 정산되지 않아야 한다.
- 직원·손님·점포 상태는 정당한 소유자/월드 권한으로만 수정한다.
- 청크 언로드, 월드 재시작, 플레이어 이탈, 재접속, 실패 중 재시도 시 상태가 무너지지 않아야 한다.
- 전체 월드/모든 엔티티를 매 틱 순회하지 않는다. 이벤트와 관심 구역·주기 제한을 우선한다.
- 기존 월드 마이그레이션은 마지막 정상 데이터와 백업 없이 파괴적으로 적용하지 않는다.

## CI/패키지

- workflow는 `.github/workflows/<slug>-test-build.yml`처럼 프로젝트별로 작성하며 실제 프로젝트 변경에만 실행되도록 경로를 제한한다.
- 빌드 경로 변경 시 workflow, 스크립트, 문서의 상대 경로를 함께 수정하고 CI 실행으로 확인한다.
- `.mcaddon/.mcpack` 파일만으로는 재빌드할 수 없다. 우선 소스+리소스+도구+라이선스 기록을 보존한다.
- 패키지는 릴리스나 승인된 체크포인트 중심으로 관리한다. 반복 생성되는 대용량 바이너리는 소스 이력을 압도하지 않게 한다.
- 외부 자산은 출처·라이선스·수정사항을 명시하고 재배포 권한을 확인한다.
- 토큰, 계정 비밀, 개인 경로·프로필, 라이선스가 없는 상용 자산, Minecraft 원본 파일은 저장소에 넣지 않는다.

## 완료 상태

`SOURCE_ONLY`, `STATIC_PASS`, `PACKAGE_PASS`, `ENGINE_PASS`, `MULTIPLAYER_PASS`와 `NOT_RUN/BLOCKED`를 구분한다. **실제 게임에서 시험하지 않은 경우 플레이 검증 완료를 주장하지 않는다.**

공식 기준: https://learn.microsoft.com/en-us/minecraft/creator/ 및 https://github.com/microsoft/minecraft-samples
