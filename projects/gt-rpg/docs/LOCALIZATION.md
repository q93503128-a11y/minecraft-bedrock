# 한국어 현지화

- 기본 로케일은 `ko_KR`, 보조 확인 로케일은 `en_US`다. 두 로케일 키는 `BP/texts/`에 나눈다.
- item/entity 이름은 언어 파일에 둔다. 내부 ID, geometry/animation ID, 저장 키는 `gtrpg`로 고정하며 번역하지 않는다.
- 길잡이/직업/보스 경고/보상 문구는 별도 `BP/scripts/main.js`의 한국어 문구로 관리한다. 전투 중 기술 용어는 “재사용 대기시간”, “전리품”, “모험 레벨”로 쓴다.
- 보이는 안내는 다음 플레이 행동만 짧게 알려 준다. 파일 경로·API·테스트 상태 같은 개발자 문구는 화면에 넣지 않는다.
- `python -m unittest discover -s tests`는 두 lang 파일의 키 일치, 정의된 이름 키, 일부 개발자 문구 차단을 검사한다.
- 실제 Bedrock 폰트·줄바꿈·GUI Scale과 한국어 긴 이름은 아직 캡처로 보지 않았다. 작은 창/모바일의 실화면 QA는 NOT_RUN이다.
