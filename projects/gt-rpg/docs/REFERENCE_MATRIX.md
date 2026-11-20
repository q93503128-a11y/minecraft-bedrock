# 레퍼런스 비교표

조사는 2026-11-20에 수행했다. 상용/All Rights Reserved 애드온은 시스템·플레이 흐름만 참고했고 해당 파일은 복사하지 않았다.

| 소스 | 조사한 해법 | 실제 GT RPG 적용 | 적용하지 않은 점 / 이유 |
| --- | --- | --- | --- |
| [RPG Adventure: Skill Tree](https://www.curseforge.com/minecraft-bedrock/addons/rpg-adventure-skill-tree) — All Rights Reserved | 직업 선택, 직업별 스킬, 모험 중 던전/장비 성장 | 수호자·추적자·원소술사 역할을 나누고 각 1개 액티브 기술을 둠 | 파일·모델·아이콘 복사 금지. 장기 스킬 트리는 초반 진행을 늦출 수 있어 MVP에 넣지 않음 |
| [Solo Leveling Addon](https://www.curseforge.com/minecraft-bedrock/addons/solo-leveling-addon) — All Rights Reserved | 균열·던전, 보스 체력바, 단계별 보상과 전투 목표 | 준비된 플레이어가 소모품으로 여는 보스 도전, 바닐라 보스 HUD, 참가자별 보상 | 원작 UI·문구·에셋·코드는 복사하지 않음. 월드 전체에 무작위 게이트를 생성하지 않음 |
| [Modifiers](https://github.com/IEatTablesWeekly/Modifiers) — MIT | 장비 희귀도와 Common→Legendary 확률, 액션바/로어에 상태 표시 | 공개 확률 40/30/20/8/2를 보스 대검 한 종류의 개인 보상 선택에 적용 | MIT 코드 미복사. 액션바 HUD는 다른 애드온과 충돌하므로 미채택. 외부 코드 대신 GT RPG의 단일 보상 처리기로 운영 |
| [OriginsPE](https://github.com/r4isen1920/OriginsPE) — MIT | 최초 선택으로 능력이 다른 역할을 정하고 역할 변경을 제한 | 월드별 최초 직업 선택과 저장 상태 | Origins와 직업 체계를 겹쳐 두 번 고르지 않음. 해당 스크립트/에셋 복사하지 않음 |
| [UnRealm Bedrock](https://github.com/CrzxaExe/UnRealm-Bedrock) — 대상 RP 폴더 MIT | RP attachable로 3D 무기를 1/3인칭 포즈에 결합 | 원본 `kyles` 지오메트리·텍스처·아이콘·grab/first-person 포즈 애니메이션을 실제 대검에 사용 | 전체 팩의 experimental/beta 스크립트와 전투/UI 구현은 가져오지 않음. attachable 참조는 안정 렌더 컨트롤러로 단순화 |
| [Neo's More Mobs](https://github.com/BluePhinix/NeosMoreMobs) — 모델/작가별 다중 라이선스 | 본 계층이 나뉜 전갈 하이브리드 외형과 실제 대기·걷기·달리기·공격 동작 | Scorpion Girl의 `geo.json`, PNG, 애니메이션, 컨트롤러, render controller를 보스에 통합 | 스폰/전투/드롭 로직 전체는 복사하지 않음. 원 저작자 CC BY 4.0과 Neo artwork license를 각각 유지 |
| [MinUI](https://github.com/codex-alchemist-dev/MinUI) — MIT, 초기 상태 | Bedrock JSON UI 후킹과 폼/오버레이 확장 | 재사용 코드는 없음. 버튼이 있는 메뉴에 공식 네이티브 UI API 선택 | 공개 UI 후킹·공용 파일 교체·클릭 불가 HUD 영역의 위험을 피하려 framework를 넣지 않음 |
| [Better on Bedrock](https://github.com/XxPoggyisLitxX/Better-on-Bedrock) — 게임성 참고 | 여러 콘텐츠를 바닐라 월드 진행에 엮는 방식 | 기존 생존 월드를 보존하고 소모성 보스 도전을 선택적으로 시작 | 게임 데이터/시각 에셋 복사하지 않음. 이번 MVP가 범용 콘텐츠 팩으로 커지는 것 방지 |

## 선택의 이유

- 우선 순위는 “원본 에셋을 실제 쓰되 런타임 전체를 베타 의존성으로 바꾸지 않는 것”이었다. 그래서 Neo의 에셋 중 재배포 조건이 확인되는 모델과 애니메이션만 사용하고, 동작은 안정 API와 한 개 전용 보스 정의로 묶었다.
- 세 직업은 서로 다른 판단을 하나씩 만든다. 능력 트리를 여러 번 읽지 않아도 초반 역할이 구별되고, 이후 플레이에서 밸런스를 확인할 범위가 작다.
- MinUI/Modifiers 액션바 방식은 다른 HUD와 충돌할 수 있어 도입하지 않았다. 메뉴는 공식 네이티브 폼, 보스 체력은 기본 게임 HUD를 사용한다.
- 사용한 소스/파일, 수정한 namespace와 조건은 [ASSET_PROVENANCE](ASSET_PROVENANCE.md)에 기록했다. 실제 모델 포즈와 UI 시각 완성도는 사용자의 게임 캡처 전까지 검수 완료가 아니다.
