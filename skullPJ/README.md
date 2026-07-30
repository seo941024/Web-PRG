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
- **스테이지: 5테마 × 3라운드 = 총 15스테이지** (`stage.js`에 데이터로 분리)
  | 스테이지 | 테마 | 등장 몹 | 보스 (HP) |
  |---|---|---|---|
  | 1 | 고블린 소굴 | melee, charger | 고블린 킹 (260) |
  | 2 | 스켈레톤 요새 | melee, ranged | 스켈레톤 치프틴 (380) |
  | 3 | 언데드 무덤 | tank, melee, ranged | 무덤의 군주 (520) |
  | 4 | 화산 지대 | bomber, charger, ranged | 화산의 군주 (700) |
  | 5 | 마왕성 | tank, charger, ranged, bomber | 마왕 (1000) |
  - 라운드 3이 보스방. 방 안 적을 전멸시키면 동쪽 문이 열리고, 통과하면 다음 라운드로. 5-3 클리어 시 `Game.gs="win"`
  - 방 레이아웃은 테마별로 일반 2종 + 보스 아레나 1종 = **15종**. 몹 스폰 지점은 `pickSpawnSpots()`가 벽 겹침을 자동 회피하므로
    레이아웃을 추가할 때 스폰 좌표를 손으로 맞출 필요 없음
  - 몹 스탯은 `stageScale()`로 진행도에 따라 완만히 상승(1라운드 1.0배 → 15라운드 약 2.4배). 테마별 원형 차이가 묻히지 않을 정도로만
- **몹 원형 5종** (`MOB_ARCHETYPES`): melee(기본) / charger(예고 길고 빠른 돌진) / ranged(거리 유지 사격) /
  tank(느리고 단단, 넉백 면역) / bomber(붙어서 자폭 — 죽어도 터짐). 테마마다 조합이 달라 요구되는 플레이가 바뀜
  - 엘리트: 테마별 확률로 등장, HP 1.7배·공격력 1.3배·발밑 금색 링·장비 드롭률 25%
- **보스 패턴 총 17종** (`boss.js`) — 예고(warnT) → 0이 되는 순간 발사. 예고 표시와 실제 발사가 같은 `warnAng/warnKind`를
  참조하므로 방향이 어긋나지 않음. 돌진 계열은 어느 방향으로 올지 선으로 미리 보여주고, 보스는 패턴 이름도 머리 위에 표시
  - HP 50% 이하 phase2: 선딜 -30%, 쿨다운 -35%, 탄수·범위 증가, **패턴 2개를 쿨다운 없이 연달아** 사용(comboQueue)
  - 지속형 패턴은 `sustain` 훅으로 처리 (spiral=회전 탄막, trail=돌진 경로에 장판)
- **지면 장판(hazard)**: 예고 링이 차오르는 동안은 무해, 터진 뒤 잔불로 남아 0.5초마다 피해. 화산·마왕 패턴이 사용
- **보상**: 잡몹 처치 시 장비 6%/소모품 35%, 엘리트는 장비 25%+소모품 확정, 보스는 **무기·방어구 확정 1개씩 + HP 오브 + 다크 퀴츠**
- **장비 시스템** (`equip.js`): 무기/방어구 슬롯 각 1개, 주우면 즉시 교체(로그라이트 방식). 티어 1~5가 스테이지 테마와 대응
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
  - `sprites/raw/<직업번호>/<방향>.png` — 정지 포즈 8방향 (5방향만 실제 생성, west 계열은 `sprites.js`가 좌우반전으로 자동 처리 → 크레딧 37.5% 절감)
  - `sprites/raw/<직업번호>/anim/<idle|walk|sprint|attack>/<방향>/frame_XX.png` — GIF에서 `tools/extract_gif_frames.py`로 추출
  - **애니마다 프레임 수/캔버스 크기가 다를 수 있음** — `sprites.js`의 `ANIM_FRAME_COUNTS`, `ANIM_FEET_RATIO`에 애니 이름별로 등록해서 처리 (예: idle/walk/sprint는 92×92·7~8프레임, attack은 108×108·16프레임 — 캔버스 크기가 달라서 발치 정렬 비율도 따로 실측해 등록함, 안 그러면 발이 공중에 떠 보임)
  - 도적 attack: 16프레임, 4타 균등 아닌 **3-4-4-5** 배분(`ATTACK_SEGMENTS`), 피니시가 크고 화려하게. 재생 fps는 `16 * 직업공속배율`
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
연결됨(index.html 로드 순서대로): `core.js`(전역 상태) → `input.js` → `camera.js` → `sprites.js` →
**`stage.js`**(15스테이지 테마·레이아웃·몹 원형 데이터) → **`equip.js`**(장비 풀·장착) → `combat.js`(오브젝트 풀·hitE·드롭·장판) →
`systems.js`(스태미나 상수만) → `player.js` → **`boss.js`**(보스 패턴) → `mob.js`(몹 AI) → `render_entities.js` → `main.js`(루프·방 생성·진행).
> `stage.js`/`equip.js`는 `main.js`가 로드 시점에 바로 `buildRoom()`을 호출하므로 **반드시 그보다 먼저** 로드돼야 함.

미이식(연결 안 됨, 참고용): `upgrade_shop.js`(유물 100+종, %기반 밸런스), `story.js`(오프닝/보스/엔딩 컷신 — 캔버스 텍스트박스 방식이라
탑다운에도 거의 그대로 쓸 수 있음), `audio.js`, `npc.js`, `systems.js`의 함수들, `render_ui.js`(직업선택 화면 포함),
`combat.js`의 `takeDmg()`(패링/가드 — 탑다운은 `player.js`의 `hitPlayer()`를 씀).
이들은 전부 구 `Game.player` 구조에 얽혀 있어서 참조만 `Player`로 바꿔선 안 되고, 좌표 규약도 다름 —
**V1은 `e.x/e.y`가 좌상단 + `e.w/e.h`, 탑다운은 `e.x`=몸 중앙·`e.y`=발치 + `e.hb`**.
(실제로 `hitE`를 이식할 때 이 차이를 놓쳐서 데미지 숫자·타격 파티클이 NaN 좌표로 그려져 안 보이던 버그가 있었음)

### 다음 할 일 (우선순위 순)
1. **성기사·마법사·버서커·발키리(단순화)·혈귀** 스프라이트(idle/walk/sprint 프리셋 위주, attack은 신중히) + `CLASS_PROFILE` 스탯
2. **보스·몹 전용 스프라이트** — 지금은 전부 도적 원화를 테마 색으로 틴트해 돌려쓰는 중(`drawDirSpriteTinted`).
   보스는 특히 덩치·실루엣이 잡몹과 같아서 위압감이 없음
3. `story.js` 연결 — 오프닝 컷신, 보스 등장/처치 대사(`STORY.boss`/`bossKill`는 월드 10개 기준이라 5스테이지에 맞춰 재편 필요)
4. `render_ui.js` 기반 직업선택 화면 + 다크 퀴츠 영구강화 상점(`upgrade_shop.js`)
5. 사망 시 재시작 흐름 — 지금은 죽으면 화면만 뜨고 리셋 입력이 없음
6. (아이디어, 후순위) **대시 공격** — Space 회피 중 C 누르면 돌진하며 찌르는 별도 모션. 걷기공격/러닝공격은
   직업 수만큼 배로 늘어나서(직업×3~5종 애니) 지금은 스킵 — 대시공격 하나 정도만 나중에 추가 검토

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
