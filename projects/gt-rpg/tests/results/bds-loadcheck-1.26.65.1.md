# 독립 BDS 팩 로드 결과

- 수행일: 2026-11-20
- 서버: 공식 Bedrock Dedicated Server 1.26.65.1 ([공식 다운로드](https://www.minecraft.net/en-us/download/server/bedrock))
- 환경: 임시 별도 서버/월드, Survival, Easy, 최대 4명, LAN 광고 비활성화
- 결과: `PASS` — 로그에 GT RPG Behavior Pack이 활성 팩 스택으로 나타났고 `Server started.`가 기록됐다.
- 확인 범위: 빌드된 BP를 서버의 `behavior_packs/GT-RPG-BP`에 적용하고, 팩 식별/로딩 및 서버 프로세스 기동 확인.
- 수정 이력: 첫 실행에서 균열 봉인 레시피에 unlock data가 없다는 경고를 확인했다. 잿불 조각 해금 조건을 추가하고 재실행한 로그에 pack stack과 서버 시작이 나타났다.
- 미확인: 실제 플레이어 미접속. 커스텀 엔티티 스폰/AI, 아이템/레시피 조작, Script API 이벤트 동작, UI/애니메이션/렌더링, 저장 복원, 멀티플레이는 이 결과로 입증되지 않는다.
- 보존 자료: 서버는 검증 종료 후 중지했다. 테스트 로그와 임시 서버 디렉터리는 커밋하지 않았으며, 증거는 위 판정 범위만 기록한다.
