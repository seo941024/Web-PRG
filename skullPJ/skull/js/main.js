// main.js — 탑다운 게임 루프 + 스테이지 진행
// 총 15스테이지: 5테마(stageN 1~5) × 3라운드(roundN 1~3), 라운드 3은 보스방.
// 테마·레이아웃·몹 구성·보스 스탯은 전부 stage.js에 데이터로 분리돼 있고, 여기서는 그걸 읽어
// 방을 조립(buildRoom)하고 문 통과로 진행(nextStage)시키는 역할만 한다.

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
    Game.bullets.forEach(b => b.active = false);
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

    if (bossRound) {
        spawnEnemy(700, 500, { boss: true, stageN });
        const theme = stageTheme(stageN);
        Game.bannerT = 150;
        Game.bannerText = `${theme.name} — ${theme.boss.name}`;
    } else {
        const spots = pickSpawnSpots(roundMobCount(stageN, roundN), baseWalls);
        spots.forEach(([sx, sy]) => spawnThemedEnemy(sx, sy, stageN, roundN));
        const theme = stageTheme(stageN);
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
}

// 라운드 클리어 → 다음 라운드. 라운드 3(보스) 클리어 시 다음 스테이지.
// 5스테이지 보스까지 잡으면 게임 클리어(win).
function nextStage() {
    Game.roundN++;
    if (Game.roundN > ROUNDS_PER_STAGE) {
        Game.roundN = 1;
        Game.stageN++;
        if (Game.stageN > STAGE_COUNT) {
            Game.stageN = STAGE_COUNT;
            Game.gs = "win";
            return;
        }
        // 스테이지 사이 회복 — 다음 테마로 넘어갈 때 절반 체력 보정
        Player.hp = Math.min(Player.maxHp, Player.hp + Math.round(Player.maxHp * 0.35));
    }
    buildRoom(Game.stageN, Game.roundN);
}

loadCharSprites(Game.pClass);
preloadAnims(Game.pClass, ["idle", "walk", "sprint", "attack"]);

buildRoom(Game.stageN, Game.roundN);

// 문 상태 갱신 + 통과 판정 — 모든 적이 죽으면 열리고, 열린 문에 닿으면 다음 스테이지로
function updateDoors() {
    if (Game._doorLock > 0) Game._doorLock--;
    const allDead = !Game.enemies.some(e => e.active && !e.dead);
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

function step() {
    Game.frameCount++;
    if (Game.bannerT > 0) Game.bannerT--;
    if (Game.gs === "win") { updateFx(); return; }
    const walls = collisionWalls();
    if (!Player.dead) {
        updatePlayer(walls);
        updateEnemies(walls);
        updateEBullets(walls);
        updateHazards();
        updateItems();
        updateDoors();
    }
    updateFx();
    updateCamera(Player);
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
    renderRoom(collisionWalls());
}
requestAnimationFrame(loop);
