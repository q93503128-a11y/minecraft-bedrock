# GT RPG

한국어를 기본으로 하는 Bedrock 멀티플레이 생존 RPG 수직 슬라이스다. 새 월드를 만들거나 복사본에서 플레이하는 것을 권장한다. 기존 프로젝트와 독립적으로 동작한다.

## 고정 정보

- 프로젝트 slug: `gt-rpg`
- 기본 namespace: `gtrpg`
- 현재 팩 버전: `0.1.0`
- 최소 엔진 버전: manifest 기준 `[1, 26, 60]`
- Script API 의존성: 안정 `@minecraft/server` 2.11.0, `@minecraft/server-ui` 2.3.0
- 구성: `BP/`, `RP/`, 원본 에셋 `assets/source/`, 제작 도구 `tools/`, 자동화 검사 `tests/`
- 실행 진입점: `BP/scripts/main.js`
- BP/RP manifest UUID와 pack 간 연결: 각 `manifest.json`

## 현재 플레이 루프

1. `/gtrpg:menu`에서 수호자, 추적자, 원소술사 중 하나를 선택한다.
2. 좀비, 스켈레톤 등 바닐라 적을 처치해 모험 경험치와 레벨을 얻는다.
3. `/gtrpg:skill` 또는 길잡이 메뉴의 스킬 버튼으로 직업 능력을 사용한다.
4. 첫 접속에 받은 균열 봉인을 길잡이 메뉴에서 사용해 잿빛 전갈 여왕에게 도전한다.
5. 보스에게 피해를 준 각 모험가는 잿불 조각 하나와 별도 확률의 잿불 대검을 받는다.
6. 잿불 조각, 철괴, 엔더의 눈으로 다음 균열 봉인을 제작한다.

### 저장과 멀티플레이

플레이어 레벨, 경험치, 직업, 스킬 대기시간, 보상 대기열은 플레이어 동적 속성에 저장한다. 보스별 피해 참여자와 오프라인 보상은 월드 동적 속성에 저장한다. 전리품 지급 전에 고유 보상 표식을 검사해 재접속/재시도 중 중복 지급을 줄인다. 한 근처에서 진행할 수 있는 보스는 최대 두 개체다. 이 구조는 정적 검토만 끝났으며, 동시 접속·월드 재시작 검증은 `STATUS.md`에 따로 표시한다.

## 설치 및 플레이

1. `build/GT-RPG_0.1.0.mcaddon`을 열어 Behavior Pack과 Resource Pack을 가져온다.
2. 새 시험 월드 또는 복사본에서 두 팩을 모두 활성화하고 월드를 연다. 친구가 접속할 멀티플레이 월드라면 RP 다운로드도 허용한다.
3. 게임 안에서 `/gtrpg:menu`를 열어 직업을 고른다. `/gtrpg:skill`은 직업 기술을 사용한다.
4. 적 사냥으로 성장한 뒤 길잡이의 **보스 도전**에서 균열 봉인을 사용한다. 함께 싸운 플레이어마다 개인 보상을 받는다.

월드 백업을 권장한다. API·manifest는 안정 모듈 버전으로 구성했지만, 실제 설치된 클라이언트에서 팩 import와 인게임 기능은 아직 수동 확인이 필요하다.

## 개발과 재현

프로젝트 디렉터리에서 다음을 실행한다.

```powershell
python tools/import_external_assets.py
python -m unittest discover -s tests
node --test tests/progression.test.mjs
python tools/build_addon.py
```

가져오기 도구는 `assets/source/`의 변경하지 않은 외부 원본에서 RP용 namespace 사본을 만든다. 패키징 도구는 날짜를 고정해 같은 입력의 바이트 동일 빌드를 만든다. `build/`에는 `.mcaddon`, 개별 `.mcpack`, SHA-256 파일을 둔다.

## 라이선스와 참고

재배포하는 모델·텍스처·애니메이션과 사용 제한은 [에셋 출처 기록](docs/ASSET_PROVENANCE.md)에 정리한다. 모델·장비 원본과 번들 라이선스는 `assets/source/` 및 `RP/credits/`에 보존한다. Neo의 미술 라이선스 조건에 따라 이 배포물은 무료이며 다운로드에 광고·결제를 붙이지 않는다.

레퍼런스 선정과 적용 판단은 [REFERENCE_MATRIX](docs/REFERENCE_MATRIX.md), 한국어 키와 검사 범위는 [LOCALIZATION](docs/LOCALIZATION.md)에 있다. 실제 인게임 스크린샷 검수는 완료 전까지 [MANUAL_VISUAL_QA](docs/MANUAL_VISUAL_QA.md)를 따른다.
