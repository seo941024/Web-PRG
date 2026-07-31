// main.js — 게임 루프 + 상태머신 + 방 생성/진행
// 총 30스테이지: 10테마(stageN 1~10) × 3라운드(roundN 1~3), 라운드 3은 보스방.
// 테마·레이아웃·몹 구성·보스 스탯은 stage.js에 데이터로 분리돼 있고, 여기서는 그걸 읽어
// 방을 조립(buildRoom)하고 상태 전이를 관리한다.
//
// 상태 전이도는 core.js의 Game 선언부 주석 참고.

ctx.imageSmoothingEnabled = false; // 스프라이트는 표시 크기 그대로(1:1) 뽑아 선명하게

// 방 크기는 모든 스테이지 공통(테두리 고정), 내부 장애물만 테마·라운드별로 다르다.
const ROOM_W = 1100, ROOM_H = 1100;
// 동쪽 벽 중앙에 문이 들어갈 틈을 미리 뚫어둠 (DOOR_Y ± DOOR_H/2)
const DOOR_Y = 500, DOOR_H = 64;
const PLAYER_SPAWN = { x: 160, y: 500 };

let baseWalls = [];   // 방 테두리 + 장애물 (문 제외, 고정 충돌체)

// 몹 스폰 후보 격자 — 벽에 겹치거나 플레이어 스폰에 너무 가까운 지점은 걸러서 사용.
// 레이아웃이 15종이라 스폰 좌표를 전부 손으로 맞추는 대신 자동 회피로 처리한다.
function pickSpawnSpots(n, walls) {
    const cands = [];
    for (let gx = 220; gx <= 900; gx += 85) {
        for (let gy = 200; gy <= 920; gy += 90) {
            // 플레이어 스폰 근처는 시작하자마자 맞는 걸 막기 위해 제외
            const pdx = gx - PLAYER_SPAWN.x, pdy = gy - PLAYER_SPAWN.y;
            if (pdx * pdx + pdy * pdy < 240 * 240) continue;
            // 벽/장애물과 겹치면 제외 (몹 히트박스보다 넉넉한 여유를 둠)
            const pad = 20;
            let blocked = false;
            for (const w of walls) {
                if (gx > w.x - pad && gx < w.x + w.w + pad && gy > w.y - pad && gy < w.y + w.h + pad) {
                    blocked = true; break;
                }
            }
            if (!blocked) cands.push([gx, gy]);
        }
    }
    // 후보를 섞어서 앞에서 n개 — 매 런마다 배치가 달라져 반복 플레이가 덜 지루해짐
    for (let i = cands.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cands[i], cands[j]] = [cands[j], cands[i]];
    }
    if (cands.length === 0) return [[700, 500]]; // 이론상 안 나오지만 안전장치
    const out = [];
    for (let i = 0; i < n; i++) out.push(cands[i % cands.length]);
    return out;
}

// stageN/roundN에 맞는 방을 새로 구성 — 기존 오브젝트 비우고 벽·문·적 재배치
function buildRoom(stageN, roundN) {
    Game.enemies.forEach(e => e.active = false);
    Game.pBullets.forEach(b => b.active = false);
    Game.eBullets.forEach(b => b.active = false);
    Game.parts.forEach(p => p.active = false);
    Game.texts.forEach(t => t.active = false);
    Game.items.forEach(it => it.active = false);
    Game.hazards.forEach(h => h.active = false);

    const bossRound = isBossRound(roundN);
    const obstacles = roundObstacles(stageN, roundN);

    baseWalls = [
        { x: 80,  y: 80,   w: 940, h: 24 },
        { x: 80,  y: 1000, w: 940, h: 24 },
        { x: 80,  y: 80,   w: 24,  h: 944 },                                    // 서쪽벽 — 문 없음, 통째로 막힘
        { x: 996, y: 80,   w: 24,  h: DOOR_Y - DOOR_H / 2 - 80 },               // 동쪽벽 — 문 틈 위
        { x: 996, y: DOOR_Y + DOOR_H / 2, w: 24, h: 1024 - (DOOR_Y + DOOR_H / 2) }, // 동쪽벽 — 문 틈 아래
        ...obstacles,
    ];

    Game.doors = [{ x: 996, y: DOOR_Y - DOOR_H / 2, w: 24, h: DOOR_H, open: false }];

    const theme = stageTheme(stageN);
    if (bossRound) {
        spawnEnemy(700, 500, { boss: true, stageN });
        Game.bannerT = 150;
        Game.bannerText = `${theme.name} — ${theme.boss.name}`;
    } else {
        const spots = pickSpawnSpots(roundMobCount(stageN, roundN), baseWalls);
        spots.forEach(([sx, sy]) => spawnThemedEnemy(sx, sy, stageN, roundN));
        Game.bannerT = 110;
        Game.bannerText = `STAGE ${stageN}-${roundN}  ${theme.name}`;
    }

    Player.x = PLAYER_SPAWN.x; Player.y = PLAYER_SPAWN.y;
    Player.vx = 0; Player.vy = 0;
    Player.atkAnim = 0; Player.atkT = 0; Player.atkCD = 0;
    Player.combo = 0; Player.comboRestT = 0; Player.comboWindowT = 0;
    Player.kbT = 0; Player.dashT = 0;
    Player.invT = 60;   // 입장 직후 1초 무적 — 스폰 즉시 피격 방지
    Game._doorLock = 40; // 새 방 스폰 직후 문 재트리거 방지
    Game._clearSfxDone = false;
    Game._bossKillT = 0;
}

// 방 입장 — 보스방이면 등장 대사 컷신을 먼저 재생하고, 컷신이 끝나면 gs="play"가 된다
function enterRound(stageN, roundN) {
    buildRoom(stageN, roundN);
    if (isBossRound(roundN)) {
        startCutscene("boss", stageN);
    } else {
        Game.gs = "play";
        if (typeof playBGM === 'function') playBGM('play');
    }
}

// 새 런 시작 (메뉴 → 오프닝 컷신 종료 시, 또는 사망 후 R)
function beginRun() {
    resetRun();
    enterRound(1, 1);
}

// 구역 정화 보상 유물 효과 (정화의 만찬 / 불굴의 방벽)
function applyClearBonus() {
    if (Game.pHealOnClear > 0 && Player.hp < Player.maxHp) {
        Player.hp = Math.min(Player.maxHp, Player.hp + Game.pHealOnClear);
        addText(Player.x, Player.y - 30, `+${Game.pHealOnClear} HP`, "#33ff66", 45, 13);
    }
    if (Game.pShieldOnClear > 0) {
        Game.pShield += Game.pShieldOnClear;
        addText(Player.x, Player.y - 46, `보호막 +${Game.pShieldOnClear}`, "#66ccff", 45, 13);
    }
}

// 문 통과 시 호출 — 다음 라운드로.
// 보스 라운드는 updateDoors()에서 처치 즉시 컷신으로 넘기므로 여기까지 오지 않는다(방어적으로만 남겨둠).
function nextStage() {
    if (isBossRound(Game.roundN)) {
        applyClearBonus();
        startCutscene("bosskill", Game.stageN);
        return;
    }
    applyClearBonus();
    Game.roundN++;
    enterRound(Game.stageN, Game.roundN);
}

// 유물 선택 완료 후 — 다음 스테이지 1라운드로 (relic.js가 호출)
function advanceAfterRelic() {
    Game.stageN++;
    Game.roundN = 1;
    // 스테이지 사이 회복 — 다음 테마로 넘어갈 때 절반 정도 보정
    Player.hp = Math.min(Player.maxHp, Player.hp + Math.round(Player.maxHp * 0.35));
    enterRound(Game.stageN, Game.roundN);
}

loadCharSprites(Game.pClass);
preloadAnims(Game.pClass, ["idle", "walk", "sprint", "attack"]);
if (typeof playBGM === 'function') playBGM('lobby');

// 문 상태 갱신 + 통과 판정 — 모든 적이 죽으면 열리고, 열린 문에 닿으면 다음 스테이지로
function updateDoors() {
    if (Game._doorLock > 0) Game._doorLock--;
    const allDead = !Game.enemies.some(e => e.active && !e.dead);
    if (allDead && !Game._clearSfxDone) {
        Game._clearSfxDone = true;
        if (typeof playSfx === 'function') playSfx('clear');
        // 보스 라운드는 문을 통과할 때까지 기다리지 않고 쓰러뜨린 자리에서 바로 처치 대사로 넘어간다.
        // (예전엔 nextStage()에서 처리해서 문을 지나야 대사가 나와 타이밍이 어긋났음)
        if (isBossRound(Game.roundN)) Game._bossKillT = 50; // 죽는 연출을 잠깐 보여준 뒤
    }
    // 보스 처치 연출 대기 — 다 되면 대사 컷신으로
    if (Game._bossKillT > 0) {
        if (--Game._bossKillT === 0) {
            applyClearBonus();
            startCutscene("bosskill", Game.stageN);
        }
        return;
    }
    const pRect = { x: Player.x - Player.hb.w / 2, y: Player.y - Player.hb.h / 2, w: Player.hb.w, h: Player.hb.h };
    Game.doors.forEach(d => {
        d.open = allDead;
        if (d.open && Game._doorLock <= 0 && overlap(pRect, d)) {
            nextStage();
        }
    });
}

// 닫힌 문은 그대로 벽처럼 막고, 열리면 충돌에서 빠져 통과 가능 — 매 프레임 재계산(문 상태가 바뀌므로)
function collisionWalls() {
    const closedDoors = Game.doors.filter(d => !d.open);
    return closedDoors.length ? baseWalls.concat(closedDoors) : baseWalls;
}

// 로직 전체가 "프레임당 px/60fps 기준 타이머"로 짜여 있어서, rAF를 그대로 쓰면
// 모니터 주사율(120/144Hz 등)에 비례해 게임 속도 자체가 빨라짐. 고정 스텝(1/60초)
// 누적기로 로직 업데이트만 60Hz에 고정하고, 렌더는 매 rAF마다 그려 부드러움은 유지.
const STEP_MS = 1000 / 60;
const MAX_STEPS_PER_FRAME = 5; // 탭 전환 등으로 너무 오래 멈췄다 돌아와도 한번에 폭주하지 않게 제한
let lastTime = null, acc = 0;

// 플레이 중에만 도는 로직
function stepPlay() {
    const walls = collisionWalls();
    updatePlayer(walls);
    updateEnemies(walls);
    updatePBullets(walls);
    updateEBullets(walls);
    updateSkillPending();
    updateHazards();
    updateItems();
    updateDoors();
    updateCamera(Player);

    // 유물: 재생하는 심핵 — 3초마다 회복
    if (Game.pRegen > 0) {
        Game.regenT++;
        if (Game.regenT >= 180) {
            Game.regenT = 0;
            if (Player.hp < Player.maxHp) {
                Player.hp = Math.min(Player.maxHp, Player.hp + Game.pRegen);
                addText(Player.x, Player.y - 28, `+${Game.pRegen}`, "#66ff99", 30, 11);
            }
        }
    }

    // 사망 감지 — 상태 전이는 여기서만 (hitPlayer는 Player.dead만 세움)
    if (Player.dead) {
        Game.gs = "dead";
        if (typeof stopBGM === 'function') stopBGM();
        if (typeof playBGM === 'function') playBGM('dead');
    }
}

function step() {
    Game.frameCount++;
    if (Game.bannerT > 0) Game.bannerT--;
    if (typeof ensureAudioRunning === 'function') ensureAudioRunning();

    // 조작법 오버레이 — 상태와 무관하게 H로 토글. 열려 있는 동안은 게임 진행을 멈춘다.
    if (pr("KeyH")) {
        Game.showKeys = !Game.showKeys;
        if (typeof playSfx === 'function') playSfx('menu_select');
    }
    if (Game.showKeys) {
        if (pr("Escape")) Game.showKeys = false;
        endFrameInput();
        return;
    }

    switch (Game.gs) {
        case "menu":
            updateMenu();
            break;
        case "classSelect":
            updateClassSelect();
            break;
        case "shop":
            updateShop();
            break;
        case "cutscene":
            updateCutscene();
            break;
        case "relic":
            updateRelicSelect();
            break;
        case "paused":
            if (pr("Escape")) { Game.gs = "play"; if (typeof playBGM === 'function') playBGM('play'); }
            if (pr("KeyQ")) { Game.gs = "menu"; if (typeof stopBGM === 'function') stopBGM(); if (typeof playBGM === 'function') playBGM('lobby'); }
            break;
        case "dead":
            if (pr("KeyR")) beginRun();
            if (pr("Escape")) { Game.gs = "menu"; if (typeof stopBGM === 'function') stopBGM(); if (typeof playBGM === 'function') playBGM('lobby'); }
            updateFx();
            break;
        case "win":
            if (pr("Space", "Enter")) { Game.gs = "menu"; if (typeof playBGM === 'function') playBGM('lobby'); }
            updateFx();
            break;
        case "play":
            if (pr("Escape")) { Game.gs = "paused"; }
            else {
                stepPlay();
                updateFx();
            }
            break;
    }

    if (pr("KeyM") && Game.gs !== "menu") {
        Game.isMuted = !Game.isMuted;
        if (Game.isMuted && typeof stopBGM === 'function') stopBGM();
    }
    endFrameInput();
}

function render() {
    switch (Game.gs) {
        case "menu":        renderMenu(); break;
        case "classSelect": renderClassSelect(); break;
        case "shop":        renderShop(); break;
        case "cutscene": renderCutscene(); break;
        case "relic":
            // 유물 선택은 전투 화면 위에 겹쳐 보여주면 맥락이 이어짐
            renderRoom(collisionWalls());
            renderRelicSelect();
            break;
        case "paused":
            renderRoom(collisionWalls());
            renderPause();
            break;
        case "dead":
            renderRoom(collisionWalls());
            renderDead();
            break;
        case "win":
            renderWin();
            break;
        default:
            renderRoom(collisionWalls());
            renderMinimap();
            break;
    }
    // 조작법은 항상 최상단에
    if (Game.showKeys) renderKeyGuide();
}

function loop(now) {
    requestAnimationFrame(loop);
    if (lastTime === null) lastTime = now;
    acc += now - lastTime;
    lastTime = now;
    acc = Math.min(acc, STEP_MS * MAX_STEPS_PER_FRAME);
    let steps = 0;
    while (acc >= STEP_MS && steps < MAX_STEPS_PER_FRAME) {
        step();
        acc -= STEP_MS;
        steps++;
    }
    render();
}
requestAnimationFrame(loop);
