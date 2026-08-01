# 해골용사 프로젝트 — 작업 안내

이 폴더에는 게임의 두 버전이 있습니다. **다른 컴퓨터/세션에서 이어서 작업할 때 반드시 아래를 먼저 읽으세요.**
경로: `Web_PRG/skullPJ/` 안에 `skull_V1/`, `skull/` 두 폴더. (예전엔 `Web_PRG/skull/`, `Web_PRG/Skull/` 로 흩어져 있었는데 하나로 정리함)

## 📁 skull_V1/ — 개발 완료 (더 이상 수정 안 함)
사이드스크롤 액션 플랫포머 버전. 8직업, 밸런스, 아이템, 스토리까지 완성된 **참고/백업용**입니다.
- 새 기능을 여기 추가하지 마세요.
- 코드 로직(데미지 공식, 아이템 %, 스탯 등)을 skull(신규)로 이식할 때 참고 자료로만 사용하세요.

## 📁 skull/ — 현재 개발 중 (여기에 집중)
**탑다운(쿼터뷰, "2.5D" 액션 RPG 스타일 — 디아블로류) 액션 게임으로 새로 재구축 중.**
앞으로의 모든 작업은 이 폴더에서 진행합니다. 실행: `skull/index.html`을 브라우저에서 직접 열기.

### 왜 사이드스크롤 → 탑다운으로 갈아엎었나
"코어키퍼 같은 시점", 대시/회피가 자연스러운 느낌을 원해서 전환. 사이드스크롤+스프라이트만 교체하는 게
작업량은 훨씬 적었겠지만(기존 물리·전투·스테이지 재사용 가능), 원하던 "그 느낌"은 시점 자체를 바꿔야만 나옴.
지금은 이 선택 재확인 완료 — 계속 탑다운으로 진행.

### 진행 상황 (도적=1번 직업 기준, 유일하게 완성된 직업)
- 엔진: 순수 JS + Canvas 2D. `ctx.setTransform`으로 화면 픽셀 단위까지 반올림한 **2배(ZOOM=2) 정수 확대** — 소수 배율은 도트가 미세하게 깨짐, 정수 배율만 완전히 선명함
- 게임 루프: **고정 60Hz 타임스텝**(`main.js`). 로직이 전부 "프레임당 px / 60fps 기준 타이머"로 짜여 있어서
  rAF를 그대로 쓰면 고주사율 모니터(120/144Hz)에서 게임 속도 자체가 그만큼 빨라짐 — 누적기로 로직만 60Hz에 고정하고 렌더는 매 rAF
- **UI 스케일** — 1280×720에 UI를 1:1로 그리면 화면만 크고 글씨·패널이 잘아 보여서("웹게임" 인상의 원인)
  `core.js`의 `UI_SCALE`(1.35)로 UI만 통째로 확대한다. UI 코드는 논리 해상도 `UW×UH` 기준으로 좌표를 쓰고,
  그리기 직전 `uiBegin()` / 끝나면 `uiEnd()`. 월드 렌더는 `ZOOM`을 따로 쓰므로 영향 없음.
  **UI 쪽에서 `CW`/`CH`를 쓰면 안 된다** — 반드시 `UW`/`UH`
- **UI는 각진 픽셀 톤으로 통일** — 둥근 모서리·그라디언트·글로우가 들어가면 캐릭터 도트와 따로 놀면서
  UI만 매끈하고 "가벼워" 보인다. 규칙:
  - `_rr()`은 **radius 인자를 무시**하고 정수 스냅된 사각형만 그린다 (곡선 금지)
  - 패널은 `_uiPanel` — 통짜 계단 그림자 + 2단 평면 색 + 1px 하이라이트/음영 + 각진 2겹 테두리(`_pxFrame`)
  - 게이지는 `_uiBar` — 각진 홈에 2단 평면 채움 + 최상단 1px 하이라이트
  - **UI에 `shadowBlur`(형광 글로우) 쓰지 말 것.** 강조는 채도가 아니라 명도·테두리로
- **색은 `core.js`의 `UIC` 팔레트 한 곳에서** — 채도가 높으면 다크 판타지 톤과 안 맞는다.
  직업 tint·테마 accent처럼 원래 채도가 높은 색을 UI에 쓸 땐 `uiMute(hex, 0.3~0.55)`로 한 톤 죽여서 사용
- **글씨는 전부 `_uiText`** — 항상 굵게 + 검은 외곽선. 크기/색만 넘기고 굵기·글로우는 넘기지 않는다
  (예전엔 호출부마다 제각각이라 어떤 건 얇고 어떤 건 형광이었음). 폭이 넘칠 위험이 있으면 `_fit()`으로 …처리
- **말투는 정중체로 통일** — "보유 중인 유물이 없습니다." / "보스를 처치하면 획득할 수 있습니다." 식.
  단 컷신 대사는 캐릭터 말투이므로 예외. 게임 용어 "런"은 "탐험"으로 쓴다
- **조작 안내는 게임 안 [H] 오버레이** — 예전엔 캔버스 밖 HTML 힌트바로 상시 노출했는데, 게임 화면과 분리돼
  보여서 플래시 웹게임 인상을 주는 주범이었다. `ui.js`의 `KEY_GUIDE`/`renderKeyGuide()`로 옮기고 HTML/CSS에서 제거.
  H는 상태와 무관하게 토글되며 열려 있는 동안 게임이 멈춘다(`main.js` step 초입에서 early return)
- **스테이지: 10테마 × 3라운드 = 총 30스테이지** (`stage.js`에 데이터로 분리)
  | 스테이지 | 테마 | 등장 몹 | 보스 (HP) |
  |---|---|---|---|
  | 1 | 고블린 소굴 | melee, charger | 고블린 킹 (260) |
  | 2 | 스켈레톤 요새 | melee, ranged | 스켈레톤 치프틴 (380) |
  | 3 | 언데드 무덤 | tank, melee, ranged | 무덤의 군주 (520) |
  | 4 | 화산 지대 | bomber, charger, ranged | 화산의 군주 (700) |
  | 5 | 얼어붙은 심연 | tank, ranged, melee | 서리 거인 (900) |
  | 6 | 독기의 늪 | bomber, ranged | 늪의 마녀 (1150) |
  | 7 | 폐허가 된 성채 | tank, charger, melee | 파멸의 기사 (1450) |
  | 8 | 심연의 나락 | charger, ranged, bomber | 공허의 눈 (1800) |
  | 9 | 핏빛 제단 | tank, charger, ranged, bomber | 피의 대제사장 (2200) |
  | 10 | 마왕성 | tank, charger, ranged, bomber | 마왕 (2800) |
  - 라운드 3이 보스방. 방 안 적을 전멸시키면 동쪽 문이 열리고, 통과하면 다음 라운드로. 10-3 클리어 시 `Game.gs="win"`
  - **보스는 문 통과가 아니라 쓰러뜨린 자리에서 바로 처치 대사로 넘어간다**(`updateDoors()`의 `_bossKillT`, 50프레임 뒤).
    예전엔 `nextStage()`에서 처리해 문을 지나야 대사가 나와 타이밍이 어긋났음
  - 방 레이아웃은 테마별로 일반 2종 + 보스 아레나 1종 = **30종**. 몹 스폰 지점은 `pickSpawnSpots()`가 벽 겹침을 자동 회피하므로
    레이아웃을 추가할 때 스폰 좌표를 손으로 맞출 필요 없음
  - 몹 스탯은 `stageScale()`로 진행도에 따라 완만히 상승(1라운드 1.0배 → 30라운드 약 3.5배). 라운드가 두 배가 됐으므로 계수를 0.10→0.085로 낮춤
  - **테마 10개인데 하위 시스템은 5단위인 것들이 있다** — BGM 트랙 프로필(`getWg()` = `ceil(stageN/2)`, `WG_COUNT`),
    장비 티어(`stageTier()` = `ceil(stageN/2)`). 장비는 예전에 `tier = stageN`을 그대로 써서 5스테이지부터
    계속 최고 티어만 나왔는데, 2스테이지당 1티어로 바꿔 후반에도 성장이 이어지게 함
- **몹 원형 5종** (`MOB_ARCHETYPES`): melee(기본) / charger(예고 길고 빠른 돌진) / ranged(거리 유지 사격) /
  tank(느리고 단단, 넉백 면역) / bomber(붙어서 자폭 — 죽어도 터짐). 테마마다 조합이 달라 요구되는 플레이가 바뀜
  - 엘리트: 테마별 확률로 등장, HP 1.7배·공격력 1.3배·발밑 금색 링·장비 드롭률 25%
- **보스 패턴 총 37종** (`boss.js`, 보스당 4종 × 10 — 마왕만 4종에 phase2 조합) — 예고(warnT) → 0이 되는 순간 발사. 예고 표시와 실제 발사가 같은 `warnAng/warnKind`를
  참조하므로 방향이 어긋나지 않음. 돌진 계열은 어느 방향으로 올지 선으로 미리 보여주고, 보스는 패턴 이름도 머리 위에 표시
  - HP 50% 이하 phase2: 선딜 -30%, 쿨다운 -35%, 탄수·범위 증가, **패턴 2개를 쿨다운 없이 연달아** 사용(comboQueue)
  - 지속형 패턴은 `sustain` 훅으로 처리 (spiral=회전 탄막, trail=돌진 경로에 장판)
- **지면 장판(hazard)**: 예고 링이 차오르는 동안은 무해, 터진 뒤 잔불로 남아 0.5초마다 피해. 화산·마왕 패턴이 사용
- **게임 루프 완성** — 메뉴 → 오프닝 컷신 → 30스테이지(보스방마다 등장/처치 대사) → 엔딩 → 결과 화면 → 메뉴.
  상태 전이도는 `core.js`의 `Game` 선언부 주석에 정리해둠. 상태별 update/render 분기는 `main.js`의 `step()`/`render()`
  | 상태 | 설명 | 조작 |
  |---|---|---|
  | `menu` | 타이틀 (scene_main.png 배경) | SPACE 시작 / S 상점 / M 음소거 |
  | `cutscene` | 오프닝·보스등장·보스처치·엔딩 | SPACE 다음 / ESC 스킵 |
  | `play` | 전투 | ESC 일시정지 |
  | `paused` | 스탯·장비·유물 확인 | ESC 계속 / Q 메뉴 |
  | `relic` | 보스 격파 후 유물 3택 1 | ← → 이동 / SPACE 선택 |
  | `dead` | 도달 라운드·처치·점수 요약 | **R 재시작** / ESC 메뉴 |
  | `shop` | 다크 쿼츠 영구강화 | ↑ ↓ / SPACE 구입 / ESC 나가기 |
  | `win` | 완주 성적 | SPACE 메뉴 |
- **유물 24종** (`relic.js`) — 보스 격파마다 3택 1, 런 한정. 희귀도 가중치 추첨(일반60/희귀30/전설10).
  단순 스탯형 외에 런타임 훅형이 있고, 훅 위치는 각 유물 주석에 적어둠:
  가시 갑옷(피격 반사) / 죽음의 개화(처치 시 연쇄 폭발) / 두 번째 생(부활) / 끌어당기는 영혼(아이템 자석) /
  한기의 오라(주변 적 감속) / 재생하는 심핵 / 불굴의 방벽(보호막) / 유령 걸음(회피 비용·무적) /
  연격의 극의(피니시 배율) / 처형자의 송곳니(치명타 피해) / 광포한 유전자(체력 낮을수록 피해 증가) 등
- **영구강화** (`shop.js`) — 다크 쿼츠로 6종(생명력/공격력/방어력/치명타/공속/이속) 각 10레벨.
  비용 `20 + lvl*15`. localStorage 키는 V1과 동일해서 기존 세이브를 그대로 이어 씀.
  런 시작 시 `resetRun()` → `applyPermUpgrades()` 순서로 적용
- **런 스코프 분리** — `resetRun()`이 런 한정 상태(유물·장비·보너스·최대체력·오브젝트 풀)를 전부 되돌린다.
  다크 쿼츠와 영구강화 레벨만 남는다. 사망 후 R 재시작이 이 함수를 거치므로 강화가 누적되지 않음
  (검증: 유물2·5티어장비·maxHp145 상태에서 사망 → 재시작 시 maxHp100·유물0·장비없음, 쿼츠는 유지)
- **오디오 연결** — V1 `audio.js`(절차 생성 WebAudio, 파일 에셋 없음)를 그대로 연결. SFX 24종·BGM 8종.
  첫 키 입력 때 AudioContext가 해제되고, `ensureAudioRunning()`이 매 프레임 suspended 상태를 복구
- **미니맵** — 우하단. 벽·문(개폐 색 구분)·적(보스/엘리트 색 구분)·아이템·플레이어 표시
- **보상**: 잡몹 처치 시 장비 6%/소모품 35%, 엘리트는 장비 25%+소모품 확정+쿼츠 소량,
  보스는 **무기·방어구 확정 1개씩 + HP 오브 + 다크 퀴츠**
- **장비 + 인벤토리** (`equip.js`, `ui.js`의 `renderInventory`): 무기/방어구 슬롯 각 1개.
  **주우면 즉시 장착이 아니라 가방(12칸)에 쌓이고, [I]에서 직접 착용/해제한다**
  (예전엔 즉시 장착이라 더 좋은 장비를 모르고 덮어썼음). 티어 1~5, 2스테이지당 1티어(stageTier)
  - 가방이 가득 차면 줍지 못하고 바닥에 남는다(모르는 새 사라지지 않게). Q로 버려 자리를 만든다
  - **최대체력은 `refreshMaxHp()` 한 곳에서만 계산한다** — 직업배율·영구강화·방어구를 매번 다시 합산.
    여러 곳에서 `Player.maxHp`를 직접 더하고 빼면 착용/해제를 반복할 때 값이 어긋난다
  - 무기: atk(고정) / atkSpd(공속 배율) / crit(치명타율) — 5티어 장착 시 평균 타격 16.7 → 73.5로 검증됨
  - 방어구: def(고정 감산) / maxHp / moveSpd. 최대체력이 늘면 그만큼 즉시 회복해 교체가 손해로 안 느껴지게 함
  - ⚠️ 티어 접두사(`EQUIP_TIER_NAMES`)가 이름 앞에 붙으므로, 풀의 `name`에 겹치는 수식어를 넣지 말 것
    (예전에 "마왕의 마왕의 흉갑"이 나왔음)
- 이동: 8방향, **스프린트**(Z 유지, 2배속 + Full Sprint 애니), **회피**(Space, 스태미나 35 소모 + 잔상, 짧은 무적)
- 전투: **4타 콤보** — 콤보 윈도우 0.4초(시간 안에 C 재입력 안 하면 자동 리셋), 4타(피니시) 데미지 ×1.7 보너스 + 후딜 0.3초.
  **공격 중엔 이동 완전 고정**(안 그러면 스윙 중에도 미끄러져서 어색함).
  판정 원점은 캐릭터 위치 자체(몸 앞으로 안 밀어냄) + 밀착(12px 이내)은 각도 무관 무조건 명중 — 안 그러면 적이 몸에 붙었을 때 영원히 못 때리는 데드존 생김
- 적 AI: 추격 → 예고(빨간 원) → 돌진공격 → 쿨다운 상태머신. 넉백은 실제 플레이어 반대 벡터로 (사이드스크롤식 고정 -3 아님)
- 스프라이트 파이프라인:
  - `sprites/raw/<직업번호>/<방향>.png` — 정지 포즈. **그 방향 원화가 있으면 그걸 쓰고, 없을 때만 반대편을 좌우 반전**한다.
    5방향(south, south-east, east, north-east, north)만 뽑아도 west 계열이 자동 폴백되고,
    8방향을 다 뽑았다면 반전 없이 원화가 나온다(망토·무기 비대칭이 뒤집히지 않음)
  - 전용 도트가 없는 직업은 `spriteClassOf()`가 **도적(1) 원화로 대체**하고 `CLASS_PROFILE.tint` 색을 덧입힌다.
    ⚠️ 스프라이트는 **한 번만** 그릴 것 — 예전에 애니 프레임 위에 정지 포즈를 겹쳐 그려 두 자세가 겹쳐 보인 적 있음
  - `sprites/raw/<직업번호>/anim/<idle|walk|sprint|attack>/<방향>/frame_XX.png` — GIF에서 `tools/extract_gif_frames.py`로 추출
  - **애니마다 프레임 수/캔버스 크기가 다를 수 있음** — `sprites.js`의 `ANIM_FRAME_COUNTS`, `ANIM_FEET_RATIO`에 애니 이름별로 등록해서 처리 (예: idle/walk/sprint는 92×92·7~8프레임, attack은 108×108·16프레임 — 캔버스 크기가 달라서 발치 정렬 비율도 따로 실측해 등록함, 안 그러면 발이 공중에 떠 보임)
  - 도적 attack: 16프레임, 4타 균등 아닌 **3-4-4-5** 배분(`ATTACK_SEGMENTS`), 피니시가 크고 화려하게. 재생 fps는 `16 * 직업공속배율`
- **콤보 표시는 "실제로 맞힌 횟수"(`Game.hitCombo`)** — `Player.combo`는 허공을 쳐도 오르는 4타 스윙 순번이라
  콤보로 띄우면 안 된다. 히트 콤보는 1.5초(`HIT_COMBO_HOLD`) 안에 다시 맞히면 유지되고, HUD엔 "N 히트"로 표시.
  4타 스윙일 때만 "피니시!"를 덧붙인다
- **보스 처치 흐름**: 보스 사망 → 50프레임 뒤 처치 대사 → **방으로 복귀(전리품 획득 구간)** → 동쪽 문 통과 → 유물 선택 → 다음 스테이지.
  최종 스테이지(10-3)만 대사 직후 엔딩. `applyClearBonus()`는 처치 시점 1회만 (문 통과 때 재호출하면 이중 적용)
- **방 구성은 시드 난수** — `roomRng(stageN, roundN)`이 `Game.runSeed`와 스테이지/라운드를 해시해서 쓴다.
  같은 탐험의 같은 방은 몹 수·배치가 항상 동일하고, 새 탐험이면 달라진다(`resetRun`이 `runSeed` 갱신).
  일반 방 몹 수는 진행도에 따라 **10~20마리**(중심값 11→18, ±2)
- **드롭 아이템은 무엇인지 읽혀야 한다** — 종류별 색 + 기호 아이콘 + 이름 아래 실제 상승치(`ITEM_STYLE.gain`,
  장비는 옵션 수치). 획득 시에도 "공격력 +2 (총 14)"처럼 증가량과 합계를 함께 띄운다.
  HUD 하단 공/방/치명/이속 줄이 그 수치를 확인하는 곳
- 구현 완료된 직업: **도적(1)만** (이동/전투/콤보/AI/애니 전부) — 나머지는 스탯·스프라이트 미구현

### 확정된 직업 번호 (core.js 주석 참고)
| 번호 | 직업 | 상태 |
|---|---|---|
| 0 | 성기사(팔라딘) | 미구현 |
| 1 | 도적 | ✅ 완료 (이동/전투/AI/애니) |
| 2 | 마법사 | 미구현 |
| 3 | 버서커 | 미구현 |
| 4 | 발키리 | 미구현 (탄창+재장전 시스템은 빼고 단순화 예정 — 원거리 평타+쿨다운 기반 스킬로) |
| 5 | 혈귀 | 미구현, **히든 캐릭터**로 취급 |

검사(구 0번)·조커는 로스터에서 삭제 확정.

### 파일 구조 (`skull/js/`)
index.html 로드 순서 = 의존 순서. **데이터 레이어가 `main.js`보다 먼저 와야 한다**
(`main.js`는 로드 직후 `buildRoom()`을 호출하므로):

`skull/js/`에는 **실제로 로드되는 파일만** 둔다. index.html의 로드 순서 = 의존 순서.

```
core.js        전역 상태 Game + resetRun()  (상태 전이도 주석 있음)
input.js       dn() 유지형 / pr() 엣지형 입력
camera.js      추적 카메라
sprites.js     방향별 스프라이트 + 좌우반전 재사용
audio.js       절차 생성 WebAudio (SFX / 테마별 BGM)
─ 데이터 레이어 ─
stage.js       30스테이지 테마·레이아웃·몹 원형 + getWg()·stageTier 기준
equip.js       무기/방어구 풀·장착
relic.js       유물 24종·추첨·선택 입력
shop.js        영구강화 6종·구입·저장
─ 로직 ─
combat.js      오브젝트 풀·hitE·드롭·장판·아이템
player.js      이동·회피·4타 콤보·피격 + 스태미나 상수
boss.js        보스 패턴 10보스 × 4종 (선딜/실행/후딜)
mob.js         몹 원형 5종 AI·처치 보상
─ 렌더 ─
render_entities.js  월드 + 플레이 HUD
ui.js               메뉴/일시정지/사망/승리/유물/상점 + 미니맵
cutscene.js         컷신 데이터·타이핑·렌더
main.js             루프·상태머신·방 생성·진행
```

### V1에서 걷어낸 것 (2026-07-30 정리)
탑다운 재구축 초기에 V1 파일을 통째로 복사해 왔는데, 상당수가 로드조차 되지 않거나
호출하면 예외가 나는 죽은 코드였다. **원본은 전부 `skull_V1/`에 그대로 있으니 참고할 때 거기를 볼 것.**

| 걷어낸 것 | 이유 |
|---|---|
| `systems.js` (파일) | 250여 줄 중 실제 사용은 스태미나 상수 3개뿐 → `player.js`로 옮김 |
| `upgrade_shop.js`, `render_ui.js`, `story.js`, `npc.js` | index.html에 연결조차 안 됨 |
| `_legacy_sidescroller/` (488K) | `skull_V1/skull`과 내용 동일한 부분집합 (고유 파일 0) |
| `combat.js`의 `takeDmg()` (131줄) | 패링/가드/`Game.player` 전제라 호출 불가. 호출 시 예외 |
| `spawnBullet` / `spawnLaser`, `Game.bullets` / `Game.lasers` | 플레이어 투사체·레이저 — 탑다운에 호출처 없음 |
| `Game.difficulty` / `hitStop` / `invT` | 전부 죽은 `takeDmg()` 안에서만 쓰였음 |
| `audio.js` `playSfx`의 클래스 0~18 분기 | 삭제된 직업(검사·조커·검성·마창사…)까지 포함, 실제 로스터는 0~5 |
| `audio.js` `'skill'` SFX 블록 (58줄) | 탑다운에 스킬 시스템이 없어 호출처 없음 |
| `audio.js` wg4/5/6 프로필 + 드론/유령 레이어 (330여 줄) | 스테이지 4·5가 메탈 분기로 early return → 도달 불가 |

**아직 남긴 개념적 부채**: 몹/보스 스프라이트가 없어 도적 원화를 테마 색으로 틴트해 돌려쓰는 중.
드롭 아이템도 도트 아이콘 대기 중이라 흰 네모 + 한글 이름표 플레이스홀더.

### V1 코드를 참고할 때 주의 — 좌표 규약이 다르다
V1은 `e.x/e.y`가 **좌상단** + `e.w/e.h`, 탑다운은 `e.x`=**몸 중앙**·`e.y`=**발치** + `e.hb`.
실제로 `hitE`를 이식할 때 이 차이를 놓쳐서 데미지 숫자·타격 파티클이 NaN 좌표로 그려져
화면에 아예 안 보이던 버그가 있었다. V1 코드를 가져올 때는 좌표부터 변환할 것.

### 직업 6종 (2026-07-30 구현)
메뉴 → SPACE → **직업 선택** 화면에서 고른다. 스탯·평타 방식·스킬이 전부 다르다.
정의는 `core.js`의 `CLASS_PROFILE`, 스킬 구현은 `skill.js`의 `CLASS_SKILLS`.

| 직업 | 체력 | 이속 | 평타 | 특성 | 스킬 [Shift] |
|---|---|---|---|---|---|
| 0 성기사 | 175 | 느림 | 16~22 / 넓은 부채꼴(80°) | 단단함 | 신성 충격파 — 주변 전체 + 1초 무적 |
| 1 도적 | 115 | 빠름 | 8~13 / 초고속·치명타 35% | 유리몸 고화력 | 그림자 난무 — 순간이동 + 경로 관통 + 4연타 |
| 2 마법사 | 105 | 보통 | 11~16 / **원거리 관통탄** | 최약체 | 서릿발 — 관통 냉기탄 5발 + 주변 감속 |
| 3 버서커 | 160 | 느림 | 24~34 / 최대 범위(90°) | 체력 낮을수록 +50% | 대지 강타 — 광역 강타, 자기 체력 8% 소모 |
| 4 발키리 | 115 | 빠름 | 6~10 / **원거리 연사** | 다수 견제 | 일제사격 — 부채꼴 12발 |
| 5 혈귀 | 135 | 빠름 | 13~19 | **흡혈 22% 고유** | 혈참 — 전방 광역 + 명중 수만큼 흡수 |

- 스킬은 **쿨다운 기반**(4~5.5초). MP 게이지를 따로 두지 않은 이유는 HUD가 복잡해지고
  탑다운 템포에서는 "언제 쓸까"만 판단하게 하는 쿨다운이 더 읽기 쉬워서.
- 스킬 피해는 전부 `playerAtkDamage()`에 배율을 걸어 계산 → 장비·유물 성장이 스킬에도 반영된다.
- 다단히트/연사는 `Game.skillPending` 큐로 프레임 단위 처리. `setTimeout`을 쓰면
  일시정지·씬 전환 중에도 터져버리므로 게임 루프에 묶었다.
- ⚠️ **스프라이트는 도적(1)만 있다.** 나머지는 도적 원화에 `CLASS_PROFILE.tint` 색을 입혀 임시 구분한다.
  전용 원화가 나오면 해당 직업의 `tint`를 지우면 된다(`classTint()`가 null을 반환하면 원본을 그대로 씀).

### 다음 할 일 (우선순위 순)
1. **보스·몹 전용 스프라이트** — 지금은 전부 도적 원화를 테마 색으로 틴트해 돌려쓰는 중(`drawDirSpriteTinted`).
   보스도 덩치·실루엣이 잡몹과 같아서 위압감이 없음. **현재 가장 큰 시각적 구멍**
2. **직업 5종 전용 스프라이트** — 위와 같은 이유. `CLASS_PROFILE.tint`만 지우면 붙는다
3. **드롭 아이템 도트 아이콘** — 현재는 종류별 색 사각 아이콘 + 기호 + 상승치 라벨(임시).
   교체 지점은 `render_entities.js`의 아이템 렌더 블록 한 곳
4. **효과음·BGM을 실제 음원으로** — 지금은 `audio.js`가 WebAudio로 파형을 직접 합성해서
   소리가 아기자기하고 가볍다. 무료 CC0 음원(Kenney / OpenGameArt / Freesound)을 받아
   `skull/sfx/`에 넣고 재생 코드로 교체할 것. 우선순위: 공격/피격/적사망/회피/스킬/획득/문열림
5. 직업 해금 조건 — 지금은 6직업 전부 바로 선택 가능. V1처럼 조건을 걸지는 미정
6. 패링/가드(V) 이식 — `skull_V1/skull/js/combat.js`의 `takeDmg()` + `systems.js` 참고
7. 이벤트 방(상인·도박 등) — `skull_V1/skull/js/upgrade_shop.js`의 `generateEventOptions()` 참고
8. 방 크기 조정 검토 — 몹을 10~20으로 늘려 밀도는 개선했지만, 여전히 넓게 느껴지면
   `main.js` `buildRoom()`의 벽 좌표와 `render_entities.js`의 `ROOM`(1100)을 함께 줄일 것
9. (아이디어, 후순위) **대시 공격** — Space 회피 중 C 누르면 돌진하며 찌르는 별도 모션

### ✅ 채택된 최종 프롬프트 (앞으로 모든 직업 attack 생성에 이걸로 계속 쓸 것)
손 교체를 극단적으로 강조한 버전("이게 제일 중요한 규칙" 식)은 오히려 결과가 더 안 좋았음(정적인 포즈로 오해).
**아래 버전(손 교체는 언급하되 과하게 강조 안 한 버전)이 실전 테스트에서 성공적** — 5방향 다 이걸로 생성 완료.

**Custom Animation V3 — Action Description:**
```
Fast 4-hit dual-dagger combo, one continuous motion. The character strikes using only ONE arm at a time for every single hit — never both daggers swinging together. Alternate hands: right, left, right, left. Each strike should be BIG and exaggerated — a large, wide, full-arm swing with a strong wind-up before the strike and a strong follow-through after, not a small subtle flick. The first three hits are fast wide slashes; the fourth and final hit is the biggest and most powerful, a large overhead or wide sweeping finishing blow with maximum extension. Character and weapon motion only — do NOT draw any impact effects, sparks, motion trails, slash lines, or speed lines around the character; keep the frame clean, showing only the body and dagger movement itself, no extra VFX elements. Grim dark-fantasy skeleton character.
```

**설정:**
- Frame Count: **16** (14 또는 16만 선택 가능. "Keep first frame" 반드시 **끄기**)
- Direction: 5방향(south, south-east, east, north-east, north) 각각 생성
- 실제 결과: 손이 완벽하게 매번 교체되진 않음(AI 한계), 그래도 동작 크기·이펙트 없음·전체적인 느낌은 합격점 — **이 정도면 실사용 가능한 수준으로 판단하고 채택**

**참고 — 시도했다가 기각한 버전** (손 교체를 "가장 중요한 규칙"으로 못박은 버전, 오히려 정적인 X자 포즈로 나옴):
```
Fast 4-hit dagger combo. This is the MOST important rule: the character MUST physically switch which hand holds and swings the dagger every single hit — hit 1 uses the RIGHT hand, hit 2 uses the LEFT hand, hit 3 uses the RIGHT hand again, hit 4 uses the LEFT hand. The dagger visibly moves from one hand to the other between each hit. Do not keep the same hand for multiple hits. Big exaggerated swings, dark-fantasy skeleton character, no impact effects or sparks.
```
→ 이 버전은 쓰지 말 것.

**⚠️ 알려진 한계 — 방향별 통일성**: 5방향(south/south-east/east/north-east/north)을 각각 독립적으로 생성하다 보니
AI가 매번 "새로 그리는" 것에 가까워서, 방향마다 동작의 디테일·타이밍이 미묘하게 달라짐. 이건 **프롬프트로 못 고치는
툴 구조 자체의 한계**로 판단하고 받아들이기로 함(재시도로 해결 안 됨). 실제 플레이에선 한 번에 한 방향만 보이니
크게 안 거슬릴 걸로 예상 — 나중에 실플레이에서 진짜 문제 되면 그때 방향별 `ATTACK_SEGMENTS` 커스터마이즈 고려.

### 도적 베이스 캐릭터 프롬프트 (참고용 — 이미 완성됨, 재생성 필요시)
```
Undead skeleton assassin, bone-white skull face with hollow glowing eyes, dark charcoal armor with a hood, tattered purple scarf and violet cape. Lean and agile, dual-wielding two short steel daggers, one in each hand. Fast rogue thief, vivid purple accents, grim dark-fantasy game character.
```
설정: Humanoid / v3 / Low Top-Down 카메라 / 48px / High Detail

### PixelLab 사용 팁 (겪은 시행착오)
- 캐릭터 생성: Humanoid / v3 / **Low Top-Down** 카메라 / 48px / High Detail
- 방향은 5개만 생성(south, south-east, east, north-east, north) — west 계열은 코드가 좌우반전으로 자동 처리
- **프리셋 애니(Walking/Running=Full Sprint/Idle)는 안정적.** Custom Animation V3는 BETA라 실패 확률 있음:
  - 회전하는 동작(구르기 등)은 거의 실패 → 스킵 권장
  - **양손 동시 동작 요청 시 캐릭터가 "춤추듯" 이상하게 움직임** — 반드시 "한 번에 한 팔만" 명시
  - **"한 손씩 번갈아 치기"는 AI가 완벽히 지키진 못함** — 손 교체를 "가장 중요한 규칙"으로 과하게 강조하면 오히려 정적인 포즈로 나빠짐. 적당히만 언급한 버전이 실전에서 더 나음 → 아래 "채택된 최종 프롬프트" 참고, 그걸로 고정해서 씀
  - **타격 이펙트(스파크·궤적선)를 하지 말라고 해도 자꾸 그려 넣음** — 완전히 막긴 어려움, 심하지 않으면 그냥 받아들이는 것도 방법. 어차피 실제 타격 이펙트는 `combat.js`의 `addPart`/`addText`로 코드에서 따로 그림
  - 유료 결제 후엔 실패 감수하고 **과감한 동작도 시도**하는 방침 (실패해도 재시도 여지 있음). 보스는 특히 단순 팔동작만으론 부족, 크고 과격한 모션 필요
- Pixelorama 편집기에서 "V3 animations... visible frame count of 4,6,8,10,12,14,16" 에러 나면: "Keep first frame" 옵션 켜져있으면 참조프레임이 카운트에서 제외되는 것 — 총 프레임을 목록 값+1로 맞추거나, **처음부터 "Keep first frame" 끄고 원하는 프레임수(14 또는 16만 선택 가능)로 재생성**하는 게 훨씬 깔끔함
- **레이저·투사체 등 원거리 공격은 캐릭터 팔 애니로 정교하게 안 만들어도 됨** — 캐릭터는 짧은 시전 포즈만, 실제 빔/탄환은 `combat.js`의 `spawnLaser`/`spawnEBullet`처럼 코드로 그리는 별도 오브젝트로 처리 (보스도 동일)
- **GIF 프레임 수·캔버스 크기는 애니마다 다르게 나올 수 있음** — 새 GIF 받으면 항상 `python -c "from PIL import Image; im=Image.open('경로'); print(im.size, im.n_frames)"` 로 먼저 확인하고 코드(`ANIM_FRAME_COUNTS`, `ANIM_FEET_RATIO`)에 반영할 것
- GIF → PNG 프레임 추출: `python tools/extract_gif_frames.py` (sprites/raw/*/anim/*/*/*.gif 전부 자동 스캔)
