// mob.js — 탑다운 적 AI (1차: 근접 추격형)
// 상태: chase(추격) → windup(예고, 멈춤+색변화) → attack(돌진+판정) → cooldown

function spawnEnemy(x, y) {
    const e = getObj(Game.enemies);
    e.x = x; e.y = y; e.vx = 0; e.vy = 0;
    e.hb = { w: 16, h: 12 };
    e.hp = 40; e.maxHp = 40; e.atk = 8;
    e.speed = 1.5;
    e.facing = "south";
    e.state = "chase"; e.warnT = 0; e.atkAnim = 0; e.atkCD = 0;
    e.hitInv = 0; e.dead = false; e.flash = 0;
    return e;
}

function updateEnemies(walls) {
    const p = Player;
    Game.enemies.forEach(e => {
        if (!e.active) return;
        if (e.flash > 0) e.flash--;
        if ((e.hitInv || 0) > 0) e.hitInv--;

        if (e.dead) { e.active = false; return; }

        const dx = p.x - e.x, dy = p.y - e.y;
        const dist = Math.hypot(dx, dy);
        const dname = dirFromVec(Math.sign(dx) || 0, Math.sign(dy) || 0);
        if (dname) e.facing = dname;

        // 피격 넉백 중엔 AI 판단 없이 관성으로만 밀림
        if ((e.kbT || 0) > 0) {
            e.kbT--; e.vx *= 0.85; e.vy *= 0.85;
            resolveWalls(e, walls);
            return;
        }

        if (e.state === "chase") {
            if (dist < 26) {
                e.state = "windup"; e.warnT = 24; e.vx = 0; e.vy = 0;
            } else if (dist < 260) {
                e.vx = (dx / dist) * e.speed;
                e.vy = (dy / dist) * e.speed;
            } else {
                e.vx = 0; e.vy = 0; // 너무 멀면 대기 (탐지 범위 밖)
            }
        } else if (e.state === "windup") {
            e.vx = 0; e.vy = 0;
            e.warnT--;
            if (e.warnT <= 0) { e.state = "attack"; e.atkAnim = 14; }
        } else if (e.state === "attack") {
            e.atkAnim--;
            const [ux, uy] = DIR_VEC[e.facing];
            e.vx = ux * 5; e.vy = uy * 5;
            if (dist < 24 && typeof hitPlayer === 'function') { hitPlayer(e.atk, e); e.state = "cooldown"; e.atkCD = 50; }
            if (e.atkAnim <= 0) { e.state = "cooldown"; e.atkCD = 50; }
        } else if (e.state === "cooldown") {
            e.vx *= 0.8; e.vy *= 0.8;
            e.atkCD--;
            if (e.atkCD <= 0) e.state = "chase";
        }

        resolveWalls(e, walls);
    });
}
