// main.js — 탑다운 게임 루프 (1단계: 이동/카메라/벽충돌/대시)
// td/td.js 프로토타입을 정식 구조로 승격. 다음 단계에서 mob.js(적 AI) 연결 예정.

ctx.imageSmoothingEnabled = false; // 스프라이트는 표시 크기 그대로(1:1) 뽑아 선명하게

// 화면이 커진 만큼 방도 같이 확장 (700x700 -> 1100x1100)
const walls = [
    { x: 80,  y: 80,  w: 940, h: 24 },
    { x: 80,  y: 1000, w: 940, h: 24 },
    { x: 80,  y: 80,  w: 24,  h: 944 },
    { x: 996, y: 80,  w: 24,  h: 944 },
    { x: 460, y: 460, w: 140, h: 140 },
    { x: 750, y: 260, w: 24,  h: 240 },
    { x: 260, y: 700, w: 240, h: 24 },
];

loadCharSprites(Game.pClass);
preloadAnims(Game.pClass, ["idle", "walk", "sprint", "attack"]);

// 테스트용 적 4마리 스폰 (넓어진 방에 맞춰 배치)
spawnEnemy(700, 400);
spawnEnemy(300, 750);
spawnEnemy(820, 780);
spawnEnemy(180, 300);

// 로직 전체가 "프레임당 px/60fps 기준 타이머"로 짜여 있어서, rAF를 그대로 쓰면
// 모니터 주사율(120/144Hz 등)에 비례해 게임 속도 자체가 빨라짐. 고정 스텝(1/60초)
// 누적기로 로직 업데이트만 60Hz에 고정하고, 렌더는 매 rAF마다 그려 부드러움은 유지.
const STEP_MS = 1000 / 60;
const MAX_STEPS_PER_FRAME = 5; // 텝 전환 등으로 너무 오래 멈췄다 돌아와도 한번에 폭주하지 않게 제한
let lastTime = null, acc = 0;

function step() {
    Game.frameCount++;
    if (!Player.dead) {
        updatePlayer(walls);
        updateEnemies(walls);
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
    renderRoom(walls);
}
requestAnimationFrame(loop);
