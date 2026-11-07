# Bedrock Projects

각 프로젝트는 `projects/<slug>/` 안에 기획서, 상태, 원본 소스, 리소스, 검증 자료를 함께 둔다.

| 경로 | 상태 | 정본 |
| --- | --- | --- |
| [monster-restaurant](monster-restaurant/) | 기획 중 / 실행 소스 없음 | [PROJECT.md](monster-restaurant/PROJECT.md) |
| [plainkingdoms](plainkingdoms/) | 기존 문서 보존 / 소스 미이관 | [PROJECT.md](plainkingdoms/PROJECT.md) |
| [wildbound](wildbound/) | 기존 문서 보존 / 소스 미이관 | [PROJECT.md](wildbound/PROJECT.md) |
| [rpg-survival](rpg-survival/) | 기존 문서 보존 / 소스 미이관 | [PROJECT.md](rpg-survival/PROJECT.md) |
| [status-window-lab](status-window-lab/) | 독립 UI 실험 / 초기 구현 | [PROJECT.md](status-window-lab/PROJECT.md) · [STATUS.md](status-window-lab/STATUS.md) |
| [augmentation-survival](augmentation-survival/) | 초기 애드온 / 부분 BDS 검증 20종, 미이식 129종 | [PROJECT.md](augmentation-survival/PROJECT.md) · [STATUS.md](augmentation-survival/STATUS.md) |

새 프로젝트 등록 시 `PROJECT.md`와 `STATUS.md`를 먼저 마련하고 구현 시 실제 BP/RP/원본/테스트를 같은 경로에 둔다. 모든 프로젝트 상태는 실제 최신 저장소와 런타임 검증을 기준으로 기록한다.

2026-11-05 개편: 종전 `docs/<project>/` 자료는 **원본 Git blob SHA를 그대로 재사용**해 각 프로젝트의 `docs/`로 이동했다. 기존 문서 내용의 재해석/축약은 하지 않았다.

폐기 Lucky Block의 현재 main 파일과 CI는 사용자 요청으로 제거. 별도 보관용 복제는 만들지 않았으며 이전 Git 커밋 이력에서 접근 가능하다.
