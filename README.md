# Minecraft Bedrock Projects

문승준의 Minecraft Bedrock Edition 애드온 **멀티프로젝트 소스 저장소**이다. 기획서만이 아니라 재현 가능한 실제 Behavior Pack/Resource Pack 소스, Blockbench 원본, 도구, 검증 결과를 프로젝트별로 관리한다.

## 프로젝트 목록

| 프로젝트 | 경로 | 현재 GitHub 상태 |
| --- | --- | --- |
| Monster Restaurant (가칭) | [projects/monster-restaurant/](projects/monster-restaurant/) | 기획 초안 / 미구현 |
| PlainKingdoms Remake | [projects/plainkingdoms/](projects/plainkingdoms/) | 기존 문서 보존 / 실행 소스 미이관 |
| Wildbound Remake | [projects/wildbound/](projects/wildbound/) | 기존 문서 보존 / 실행 소스 미이관 |
| RPG Survival | [projects/rpg-survival/](projects/rpg-survival/) | 기존 문서 보존 / 실행 소스 미이관 |
| Augmentation Survival | [projects/augmentation-survival/](projects/augmentation-survival/) | 초기 애드온 / 부분 BDS 검증 7종, 미이식 142종 |

폐기 프로젝트 Lucky Block은 2026-11-05 사용자 지시에 따라 현재 main에서 소스·패키지·문서·전용 CI를 제거했다. Git 커밋 기록은 강제 삭제하지 않는다.

## 저장소 구조

- `projects/<slug>/`: **프로젝트의 단일 정본 위치**. 기획, 상태, BP/RP, 에셋 원본, 검증 코드를 같은 폴더에서 관리.
- `projects/README.md`: 프로젝트 등록·상태 인덱스.
- `AGENTS.md`: AI 에이전트와 개발자의 공용 작업 계약.
- `docs/BUILD_STANDARD.md`: Bedrock 개발·패키징·검증 기준.
- `docs/QUALITY_STANDARD.md`: 외부 게임 레퍼런스, UI/UX, 플레이어 문구, 모델, 사운드, 성능의 공용 품질 기준.
- `.github/workflows/`: 실제 소스가 있는 프로젝트에서만 검증된 workflow를 프로젝트별로 추가.

## 작업 시작 순서

1. [AGENTS.md](AGENTS.md)와 공용 표준 문서를 읽는다.
2. [projects/README.md](projects/README.md)에서 대상 프로젝트를 확인한다.
3. 대상 `PROJECT.md`, `GAME_DESIGN.md`(있다면), `STATUS.md`, 실제 소스를 확인한다.
4. **현재 게임 버전/Bedrock API 호환성 및 외부 게임 레퍼런스를 조사**하고 구현·검수를 진행한다.
5. 최종 변경은 재현 가능한 소스/원본/검증 기록과 함께 저장·커밋한다.

## 중요 원칙

- 각 프로젝트의 소스/문서를 다른 프로젝트와 섞지 않는다.
- 프로젝트별 `PROJECT.md`가 현재 정본 상태와 외부에만 있는 소스를 명시한다.
- 소스가 없는 프로젝트를 '실행 가능'이라고 표시하지 않는다.
- 실제 Bedrock 월드 실행과 시각 검증을 하지 않은 결과는 검증 완료가 아니다.
- 생성 패키지(.mcaddon/.mcpack)는 소스의 대체품이 아니며 필요할 때만 재현 가능한 배포 체크포인트로 보존한다.
- 제3자 자산의 라이선스·원천·수정 이력을 기록하며 배포 권한이 없는 파일을 넣지 않는다.
