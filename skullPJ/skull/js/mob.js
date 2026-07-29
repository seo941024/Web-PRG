// mob.js — 탑다운 적 AI (1차: 근접 추격형)
// 상태: chase(추격) → windup(예고, 멈춤+색변화) → attack(돌진+판정) → cooldown

function spawnEnemy(x, y, isBoss) {
    const e = getObj(Game.enemies);
    e.x = x; e.y = y; e.vx = 0; e.vy = 0;
    e.isBoss = !!isBoss;
    // 보스 스탯은 아직 전용 AI/스프라이트가 없어 임시로 일반 몹을 덩치·능력치만 키운 자리표시자.
    // worldN/levelN 스테이지 배관을 먼저 검증하기 위한 것 — 실제 보스 패턴은 나중에 별도로 작업.
    if (e.isBoss) {
        e.hb = { w: 28, h: 22 };
        e.hp = 260; e.maxHp = 260; e.atk = 18;
        e.speed = 1.1;
    } else {
        e.hb = { w: 16, h: 12 };
        e.hp = 40; e.maxHp = 40; e.atk = 8;
        e.speed = 1.5;
    }
    e.facing = "south";
    e.state = "chase"; e.warnT = 0; e.atkAnim = 0; e.atkCD = 0;
    e.hitInv = 0; e.dead = false; e.flash = 0;
    return e;
}

// 처치 보상 — skull_V1 mob.js의 점수/킬카운트/드롭/보스 다크 퀴츠 지급을 탑다운으로 이식
function onEnemyDeath(e) {
    Game.kills = (Game.kills || 0) + 1;
    if (e.isBoss) {
        Game.score += 500;
        const dq = Math.floor(Math.random() * 15) + 20;
        Game.darkQuartz = (Game.darkQuartz || 0) + dq;
        localStorage.setItem("skull_quartz", Game.darkQuartz);
        addText(e.x, e.y - 40, `다크 쿼츠 +${dq} 획득!`, "#dd44ff", 90, 15);
        addText(e.x, e.y - 60, "보스 처치!", "#ffcc00", 90, 20);
        addItem(e.x, e.y, 10, 10, 0, 600, "hp"); // 보스는 HP 아이템 확정 드롭
    } else {
        Game.score += 50;
        dropLoot(e);
    }
    for (let i = 0; i < 20; i++) addPart(e.x, e.y, Math.random() < 0.5 ? "#ff0000" : "#aa0000", 20 + Math.random() * 20, 4);
}

function updateEnemies(walls) {
    const p = Player;
    Game.enemies.forEach(e => {
        if (!e.active) return;
        if (e.dead) { onEnemyDeath(e); e.active = false; return; }
        if (e.isBoss) { updateBossAI(e, walls); return; } // 보스는 boss.js의 전용 패턴 AI로 위임

        if (e.flash > 0) e.flash--;
        if ((e.hitInv || 0) > 0) e.hitInv--;

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
                e.state = "windup"; e.warnT = 24; e._warnBase = 24; e.vx = 0; e.vy = 0;
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
