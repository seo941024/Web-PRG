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

function loop() {
    Game.frameCount++;
    if (!Player.dead) {
        updatePlayer(walls);
        updateEnemies(walls);
    }
    updateFx();
    updateCamera(Player);
    renderRoom(walls);
    requestAnimationFrame(loop);
}
loop();
