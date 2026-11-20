# 에셋 출처 및 재배포 조건

확인 날짜: 2026-11-20. 이 저장소와 빌드 산출물은 무료로 배포하며, 결제·광고·광고 게이트를 붙이지 않는다. 외부 artwork를 유료화하거나 제작자에게 받은 추가 허가를 주장하지 않는다.

## 실제로 포함한 원본

| 제작자 / 출처 | 실제 사용 파일 | 권리 | 수정·통합 |
| --- | --- | --- | --- |
| Bada, [“The scorpion girl - Blockbench”](https://skfb.ly/6XCQ9) | Neo's More Mobs에서 가져온 `scorpion.geo.json` → `RP/models/entity/ashen_scorpion_queen.geo.json` | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). 저작자와 원본 링크 표시, 변경 표시 필수 | Bedrock용 원본 리그·UV를 유지하고 geometry ID만 `geometry.gtrpg.ashen_scorpion_queen`으로 변경. 게임 안 렌더/크기/리그 검수는 미실행 |
| Neo / NeoPhinixMC, [Neo's More Mobs](https://github.com/BluePhinix/NeosMoreMobs) · [CurseForge 프로필](https://www.curseforge.com/members/neophinix) · [YouTube](https://youtube.com/@neophinixmc) | `scorpion.png`, `scorpion.animation.json`, `neosmoremobs.animation_controllers.json`, `scorpion.render_controllers.json`; RP client entity는 구조를 참고해 GT RPG용으로 다시 작성 | Neo's Art License 1.0. Artwork를 무료 프로젝트에서 사용·수정·재배포 가능. 저자와 세 링크를 표시하고 라이선스를 계속 포함하며 변경 사항을 공개해야 함. 판매·유료 접근·광고 게이트·광고 수익 미러 금지. 전체 조건은 `assets/source/neo-more-mobs/LICENSE.txt` 및 `RP/credits/neo-more-mobs-license-and-attribution.txt` 참조 | 애니메이션/컨트롤러 내부 동작과 UV는 유지하고 `neosmoremobs.scorpion` 참조를 `gtrpg.ashen_scorpion_queen`으로 변경. 보스 체형 scale은 client definition에서 1.1 적용. 게임 안 동기화/렌더 검수는 미실행 |
| Crzx / UnRealm Bedrock, [저장소](https://github.com/CrzxaExe/UnRealm-Bedrock) · RP commit `4565698900e32f281167bd4c352b686195cf3b7f` | `kyles.geo.json`, `kyle.png`, `textures/items/weapon/kyle.png`, `kyles.animation.json`; `kyles.json` attachable 원본을 보존 | 해당 Resource Pack의 MIT license. 원본 MIT 문구는 `assets/source/unrealm/LICENSE`와 `RP/credits/unrealm-mit-license.txt` 참조 | geometry/PNG를 대검에 쓰고, animation 이름을 `gtrpg.ember_blade`로 바꿈. attachable은 각 희귀도 item ID로 복제하고 원본 pose를 쓰되 `controller.render.item_default`를 사용하도록 간소화. 실제 1·3인칭 포즈 검수는 미실행 |
| IEatTablesWeekly, [Modifiers](https://github.com/IEatTablesWeekly/Modifiers) | `40/30/20/8/2` 희귀도 배분을 `BP/scripts/core/progression.js`의 확률 데이터로 채택 | 저장소 MIT. 코드·이미지는 가져오지 않음 | 각 보스 참가자에게 독립 대검 1개를 주는 GT RPG 보상 규칙으로 전환. 원본의 액션바/로어 시스템은 제외 |

## 원본과 변경본 위치

- 원본 스냅샷: `assets/source/neo-more-mobs/`, `assets/source/unrealm/`. `SOURCE-COMMIT.txt`에서 실제 git commit을 고정한다.
- 생성된 게임 파일: `RP/models/entity/`, `RP/textures/`, `RP/animations/`, `RP/animation_controllers/`, `RP/render_controllers/`, `RP/entity/`, `RP/attachables/`.
- 재현: `python tools/import_external_assets.py`는 원본을 수정하지 않고 namespace가 분리된 사본을 다시 만든다.
- `CREDITS.txt`, 각 원본 `LICENSE`, Neo Artwork grant 및 MIT 텍스트는 `assets/source/`와 팩 안 `RP/credits/`에 보존한다.
- Bada 원작자 표기와 수정 범위는 이 문서 및 번들된 Neo credits에 적었다. Neo의 필수 크레딧은 원문 블록을 `RP/credits/neo-more-mobs-source-credits.txt`에 유지한다.

## 재배포 제한

Neo's Art License는 Artwork를 포함한 프로젝트의 유료 판매, 다운로드 결제, 광고 게이트 및 광고 수익 콘텐츠 미러를 금지한다. 이 프로젝트의 GitHub 소스, `.mcpack`, `.mcaddon`은 무료이며 광고를 두지 않는다. 에셋 원본·수정본은 Neo Artwork License를 따르며 MIT로 다시 라이선스하지 않는다. CC BY 4.0 모델의 출처와 변경 사항을 함께 표시한다. UnRealm MIT 문구도 해당 파생 RP에 동봉한다.

## 채택하지 않은 콘텐츠

RPG Adventure: Skill Tree와 Solo Leveling Addon은 CurseForge에서 All Rights Reserved로 확인해 디자인만 조사했다. Better on Bedrock 저장소에서 에셋 재배포 근거를 확인하지 않아 파일은 사용하지 않았다. MinUI/OriginsPE/Modifiers의 코드나 UI 이미지는 이 패키지에 복사하지 않았다.
