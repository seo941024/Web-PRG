// main.js — 탑다운 게임 루프 (3단계: 방→방 진행 + 레이아웃 다양화 + 보스 패턴)
// worldN/levelN 카운터는 core.js에 이미 있던 걸 여기서 실사용.
// skull_V1(사이드스크롤)의 stage.js 구조(월드 10개 × 레벨 3, 레벨3=보스방)를 참고해
// 탑다운 "방 1개 = 레벨 1개"로 단순 이식. 보스 패턴은 boss.js(updateBossAI)로 분리.

ctx.imageSmoothingEnabled = false; // 스프라이트는 표시 크기 그대로(1:1) 뽑아 선명하게

// 방 자체 크기는 고정(테두리), 내부 장애물 배치만 템플릿별로 다르게 — 방 크기/모양 자체를 바꾸는 건 다음 단계
// 동쪽 벽 중앙에 문이 들어갈 틈을 미리 뚫어둠 (DOOR_Y ± DOOR_H/2)
const DOOR_Y = 500, DOOR_H = 64;

// 일반 레벨용 장애물 템플릿 3종 — worldN/levelN 조합으로 순환 선택해 방마다 다른 느낌을 줌
const ROOM_TEMPLATES = [
    // A: 십자형 — 중앙 큰 블록 + 세로/가로 통로
    [
        { x: 460, y: 460, w: 140, h: 140 },
        { x: 750, y: 260, w: 24,  h: 240 },
        { x: 260, y: 700, w: 240, h: 24 },
    ],
    // B: 4기둥 — 사방에 엄폐물, 중앙은 뻥 뚫림
    [
        { x: 260, y: 260, w: 70, h: 70 },
        { x: 770, y: 260, w: 70, h: 70 },
        { x: 260, y: 770, w: 70, h: 70 },
        { x: 770, y: 770, w: 70, h: 70 },
    ],
    // C: 지그재그 — 가로 벽을 어긋나게 배치해 통로처럼 느껴지게
    [
        { x: 180, y: 260, w: 340, h: 24 },
        { x: 580, y: 460, w: 340, h: 24 },
        { x: 180, y: 660, w: 340, h: 24 },
    ],
];
// 보스방 전용 — 넓게 트인 아레나 + 구석 엄폐물 정도만 (탄막 패턴이 지나갈 공간 확보)
const BOSS_ARENA_OBSTACLES = [
    { x: 200, y: 200, w: 50, h: 50 },
    { x: 850, y: 200, w: 50, h: 50 },
    { x: 200, y: 850, w: 50, h: 50 },
    { x: 850, y: 850, w: 50, h: 50 },
];

let baseWalls = [];   // 방 테두리 + 장애물 (문 제외, 고정 충돌체)
let Player_spawn = { x: 160, y: 500 };

// 레벨당 몹 수 — 보스 레벨(3의 배수)은 buildRoom에서 별도 처리
function mobCountFor(levelN) {
    return 2 + levelN; // 1레벨=3마리, 2레벨=4마리
}

// worldN/levelN에 맞는 방을 새로 구성 — 기존 적/투사체/파티클 비우고 벽·문·적 재배치
function buildRoom(worldN, levelN) {
    Game.enemies.forEach(e => e.active = false);
    Game.bullets.forEach(b => b.active = false);
    Game.eBullets.forEach(b => b.active = false);
    Game.parts.forEach(p => p.active = false);
    Game.texts.forEach(t => t.active = false);
    Game.items.forEach(it => it.active = false);

    const isBossLevel = levelN >= 3;
    // (worldN, levelN) 조합을 시드로 템플릿 순환 선택 — 같은 스테이지는 항상 같은 레이아웃(재현 가능)
    const templateIdx = (worldN * 3 + levelN) % ROOM_TEMPLATES.length;
    const obstacles = isBossLevel ? BOSS_ARENA_OBSTACLES : ROOM_TEMPLATES[templateIdx];

    baseWalls = [
        { x: 80,  y: 80,  w: 940, h: 24 },
        { x: 80,  y: 1000, w: 940, h: 24 },
        { x: 80,  y: 80,  w: 24,  h: 944 },                                  // 서쪽벽 — 문 없음, 통째로 막힘
        { x: 996, y: 80,  w: 24,  h: DOOR_Y - DOOR_H/2 - 80 },               // 동쪽벽 — 문 틈 위
        { x: 996, y: DOOR_Y + DOOR_H/2, w: 24, h: 1024 - (DOOR_Y + DOOR_H/2) }, // 동쪽벽 — 문 틈 아래
        ...obstacles,
    ];

    Game.doors = [{ x: 996, y: DOOR_Y - DOOR_H/2, w: 24, h: DOOR_H, open: false }];

    if (isBossLevel) {
        spawnEnemy(700, 500, true); // 보스 — boss.js의 updateBossAI가 패턴 진행
    } else {
        const n = mobCountFor(levelN);
        const spots = [[700, 400], [300, 750], [820, 780], [180, 300], [500, 900], [900, 200]];
        for (let i = 0; i < n; i++) {
            const [sx, sy] = spots[i % spots.length];
            spawnEnemy(sx, sy);
        }
    }

    Player.x = Player_spawn.x; Player.y = Player_spawn.y;
    Player.hp = Player.hp > 0 ? Player.hp : Player.maxHp; // 죽지 않은 상태로만 넘어옴 (사망 처리는 별도)
    Game._doorLock = 40; // 새 방 스폰 직후 문 재트리거 방지
}

// 레벨 클리어 → 다음 레벨, 3레벨(보스) 클리어 시 다음 월드로 순환
function nextStage() {
    Game.levelN++;
    if (Game.levelN > 3) { Game.levelN = 1; Game.worldN++; }
    buildRoom(Game.worldN, Game.levelN);
}

loadCharSprites(Game.pClass);
preloadAnims(Game.pClass, ["idle", "walk", "sprint", "attack"]);

buildRoom(Game.worldN, Game.levelN);

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
const MAX_STEPS_PER_FRAME = 5; // 텝 전환 등으로 너무 오래 멈췄다 돌아와도 한번에 폭주하지 않게 제한
let lastTime = null, acc = 0;

function step() {
    Game.frameCount++;
    const walls = collisionWalls();
    if (!Player.dead) {
        updatePlayer(walls);
        updateEnemies(walls);
        updateEBullets(walls);
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
