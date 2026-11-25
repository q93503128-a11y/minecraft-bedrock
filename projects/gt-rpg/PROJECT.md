# GT RPG — Minecraft Bedrock 생존 RPG

> **상태: 기획 정본(사용자와 2026-11-24까지 합의한 내용 복원) / 구현 미착수**  
> 이 프로젝트는 기존 `projects/rpg-survival/`과 별도이다. 2026-11-20 폐기된 GT RPG 0.1.0 시험판의 소스·UI·검증 결과를 현재 구현으로 간주하지 않는다.

## 목표
Minecraft **Bedrock Edition**의 바닐라 생존(채굴·건축·탐험·제작)을 보존하면서 친구와 함께 즐기는 직업 중심 RPG 애드온. 모바일 터치/PC/멀티플레이가 핵심이며 스킬 조작을 최소화한다. 직업 9종·6차 전직, 무한 레벨과 세계 위협도, 장비·각인·RPG 가방, 기존/신규 몬스터와 보스, 자연 생성 던전, 승급 도전, 동의 기반 PvP 콜로세움을 갖춘다.

## 문서 정본
- [SYSTEMS.md](SYSTEMS.md): 모험가의 서 메뉴 구조 초안 및 남은 공통 시스템 기획 목록.
- [SAVE_DESIGN.md](SAVE_DESIGN.md): 저장·복구·정산·M0 게이트 상세 가안.
- [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md): 기획 감사·미결정 사항·단계별 개발 계획.
- [GAME_DESIGN.md](GAME_DESIGN.md): 공통 시스템, 생존·전투·성장·장비·월드·던전·멀티플레이.
- [PVP.md](PVP.md): 콜로세움 신청·결투·패배 및 복귀 가안.
- [ASCENSION.md](ASCENSION.md): 승급 도전 투표·웨이브·수호자·세계 위협도 상세 가안.
- [DUNGEONS.md](DUNGEONS.md): 일회용 자연 생성 입구, 난이도 선택, 던전 공간 재사용 및 승패/보상 설계.
- [MONSTERS.md](MONSTERS.md): 신규 몬스터·정예·미니보스·고유 보스·승급 수호자 콘텐츠 초안.
- [EQUIPMENT.md](EQUIPMENT.md): 장비 종류·옵션·각인 콘텐츠 초안.
- [HUD_DESIGN.md](HUD_DESIGN.md): RPG HUD 목표·베드락 지원 범위·실기 검증.
- [SKILL_BALANCE.md](SKILL_BALANCE.md): 9직업 54단계/9액티브 상세 수치·장비 옵션 가안.
- [BALANCE.md](BALANCE.md): 성장·전투·경험치·장비 수치 모델 가안 및 산술 검산.
- [CLASSES.md](CLASSES.md): 9개 직업 각각의 액티브·1~6차 패시브·강화·전직 보너스.
- [TECHNICAL_RISKS.md](TECHNICAL_RISKS.md): Bedrock 구현상의 제약, 미검증 항목, 실제 검증 조건.
- [DECISIONS.md](DECISIONS.md): 확정사항/수치 가안/추후 결정 및 충돌 정리.
- [REFERENCES.md](REFERENCES.md): 기존 대화에서 참고한 사례와 구현 전 재조사 과제.
- [STATUS.md](STATUS.md): 실제 GitHub 상태, 실행·검증 결과, 다음 작업.

## 작업 계약
1. **명시적으로 구현 시작을 지시받기 전까지 코드·BP/RP·에셋 제작 금지.** 현재 목표는 기획 보존.
2. 확정된 사용자 결정을 임의 변경하지 않는다. 예시 수치와 구현 후보를 확정으로 둔갑시키지 않는다.
3. 구현 전 저장소 루트 `README.md`, `AGENTS.md`, `docs/BUILD_STANDARD.md`, `docs/QUALITY_STANDARD.md`와 공통 `q93503128-a11y/dev-playbook` 최신 main을 읽는다.
4. 시각 디자인·애니메이션·3D 모델은 실제 Bedrock에서 확인하고 정당한 라이선스의 소스와 원본을 보존한다. 이름만 바꾼 바닐라 아이템이나 임시 사각형 UI를 최종 품질로 취급하지 않는다.
5. 원칙: 파티클 남발 금지, 시야 방해 금지, 모바일/멀티플레이 성능 우선, 실제 게임 시험 없으면 PASS 주장 금지.
6. 구현 시 `projects/gt-rpg/` 아래에 BP/RP, 모델 원본, 검증 코드, 빌드 재현 문서를 함께 보존한다. 버전 라벨은 `GT RPG vX.Y.Z [BP/RP]`로 실제 manifest 버전과 동기화.

## 미설정 정보
- 목표 Bedrock 정식 버전, namespace, UUID, pack 버전, Script API 버전: **미결정** (구현 시작 때 최신 안정 버전과 호환성 확인)
- 빌드/설치 방법, 월드 마이그레이션, 테스트 커맨드: **미구현**
- 실행 가능한 BP/RP 또는 `.mcaddon`: **현재 없음**
