// mob.js — 탑다운 적 AI
// 공통 상태머신: chase(추격) → windup(예고 링) → attack(실행) → cooldown
// 원형별로 attack 단계에서 하는 일이 다르다 (stage.js의 MOB_ARCHETYPES 참고):
//   melee/tank/charger → 예고 방향으로 돌진해 몸통 판정
//   ranged            → 제자리에서 투사체 발사
//   bomber            → 자폭 (죽어도 폭발)
// 보스(isBoss)는 boss.js의 updateBossAI로 위임한다.

// 스테이지 테마의 몹 목록에서 하나 골라 스탯을 스케일링해 스폰
function spawnThemedEnemy(x, y, stageN, roundN) {
    const theme = stageTheme(stageN);
    const type = theme.mobs[Math.floor(Math.random() * theme.mobs.length)];
    const isElite = Math.random() < theme.eliteChance;
    return spawnEnemy(x, y, { type, stageN, roundN, isElite });
}

// opts: { type, stageN, roundN, isElite } | { boss: true, stageN }
function spawnEnemy(x, y, opts) {
    opts = opts || {};
    const e = getObj(Game.enemies);
    e.x = x; e.y = y; e.vx = 0; e.vy = 0;
    e.facing = "south";
    e.state = "chase"; e.warnT = 0; e._warnBase = 0; e.atkAnim = 0; e.atkCD = 0;
    e.hitInv = 0; e.dead = false; e.flash = 0; e.kbT = 0;
    e.ap = undefined; e.chaseT = 0; e._p2Flagged = false;

    if (opts.boss) {
        const theme = stageTheme(opts.stageN);
        const b = theme.boss;
        e.isBoss = true; e.isElite = false;
        e.mtype = "boss";
        e.hb = { ...b.hb };
        e.hp = b.hp; e.maxHp = b.hp; e.atk = b.atk; e.speed = b.speed;
        e.tint = b.tint; e.bossName = b.name;
        e.superArmor = true; // 보스는 넉백에 밀리지 않음
        return e;
    }

    const theme = stageTheme(opts.stageN);
    const arch = MOB_ARCHETYPES[opts.type] || MOB_ARCHETYPES.melee;
    const scale = stageScale(opts.stageN, opts.roundN);
    const eliteMul = opts.isElite ? 1.7 : 1;

    e.isBoss = false;
    e.isElite = !!opts.isElite;
    e.mtype = opts.type;
    e.arch = arch;
    e.hb = opts.isElite ? { w: arch.hb.w + 4, h: arch.hb.h + 3 } : { ...arch.hb };
    e.hp = Math.round(arch.hp * scale * eliteMul);
    e.maxHp = e.hp;
    e.atk = Math.round(arch.atk * scale * (opts.isElite ? 1.3 : 1));
    e.speed = arch.speed * (opts.isElite ? 0.9 : 1); // 엘리트는 조금 느리지만 훨씬 단단함
    e.superArmor = !!arch.superArmor || !!opts.isElite;
    e.tint = opts.isElite ? "#ffcc33" : theme.mobTint;
    return e;
}

// 처치 보상 — skull_V1 mob.js의 점수/킬카운트/드롭/보스 다크 퀴츠 지급을 탑다운으로 이식
function onEnemyDeath(e) {
    Game.kills = (Game.kills || 0) + 1;
    if (e.isBoss) {
        Game.score += 500;
        const dq = Math.round((Math.floor(Math.random() * 15) + 20) * (Game.pQuartzMul || 1));
        Game.darkQuartz = (Game.darkQuartz || 0) + dq;
        if (typeof saveProgress === 'function') saveProgress();
        addText(e.x, e.y - 60, `${e.bossName || "보스"} 격파!`, "#ffcc00", 100, 20);
        addText(e.x, e.y - 40, `다크 쿼츠 +${dq}`, "#dd44ff", 90, 15);
        Game.camShake = Math.max(Game.camShake || 0, 30);
        if (typeof playSfx === 'function') playSfx('boss_clear');
        // 스테이지 클리어 보상: 무기·방어구 확정 1개씩 + HP 회복 오브
        dropStageClearLoot(e);
    } else {
        Game.score += e.isElite ? 150 : 50;
        if (e.isElite) {
            // 엘리트는 소량의 다크 쿼츠도 떨어뜨림 — 한 런 안에서 상점 목표가 생기게
            const dq = Math.round((Math.floor(Math.random() * 5) + 3) * (Game.pQuartzMul || 1));
            Game.darkQuartz = (Game.darkQuartz || 0) + dq;
            if (typeof saveProgress === 'function') saveProgress();
            addText(e.x, e.y - 34, `다크 쿼츠 +${dq}`, "#dd44ff", 60, 12);
        }
        if (typeof playSfx === 'function') playSfx('enemy_die');
        dropLoot(e);
    }
    // 자폭형은 죽을 때도 터진다 — 근접으로 마무리할 때 위험 요소
    if (e.mtype === "bomber") explodeBomber(e);

    // 유물 "죽음의 개화": 처치 지점에서 폭발해 주변 적에게 연쇄 피해
    if (Game.pKillExplode > 0) {
        const R = 70;
        for (let i = 0; i < 16; i++) addPart(e.x, e.y - 8, "#cc66ff", 20, 4);
        Game.enemies.forEach(o => {
            if (!o.active || o.dead || o === e) return;
            const dx = o.x - e.x, dy = o.y - e.y;
            if (dx * dx + dy * dy < R * R) hitE(o, Game.pKillExplode, 1, false);
        });
    }

    const col = e.isElite ? "#ffcc33" : "#ff0000";
    for (let i = 0; i < (e.isBoss ? 40 : 20); i++) {
        addPart(e.x, e.y, Math.random() < 0.5 ? col : "#aa0000", 20 + Math.random() * 20, 4);
    }
}

// 자폭 — 반경 내 플레이어에게 피해 + 예고 없는 즉발이라 반경을 좁게 잡음
function explodeBomber(e) {
    const arch = e.arch || MOB_ARCHETYPES.bomber;
    const r = arch.explodeR, dmg = Math.round(arch.explodeDmg * (e.atk / arch.atk));
    addText(e.x, e.y - 20, "폭발!", "#ff8800", 30, 14);
    for (let i = 0; i < 24; i++) addPart(e.x, e.y, Math.random() < 0.5 ? "#ff8800" : "#ffdd44", 22, 4);
    Game.camShake = Math.max(Game.camShake || 0, 10);
    const dx = Player.x - e.x, dy = Player.y - e.y;
    if (dx * dx + dy * dy < r * r && typeof hitPlayer === 'function') hitPlayer(dmg, e);
}

function updateEnemies(walls) {
    const p = Player;
    Game.enemies.forEach(e => {
        if (!e.active) return;
        if (e.dead) { onEnemyDeath(e); e.active = false; return; }
        if (e.isBoss) { updateBossAI(e, walls); return; }

        if (e.flash > 0) e.flash--;
        if ((e.hitInv || 0) > 0) e.hitInv--;

        const dx = p.x - e.x, dy = p.y - e.y;
        const dist = Math.hypot(dx, dy) || 1;
        const dname = dirFromVec(Math.sign(dx) || 0, Math.sign(dy) || 0);
        if (dname && e.state !== "attack") e.facing = dname;

        // 피격 넉백 중엔 AI 판단 없이 관성으로만 밀림
        if ((e.kbT || 0) > 0) {
            e.kbT--; e.vx *= 0.85; e.vy *= 0.85;
            resolveWalls(e, walls);
            return;
        }

        const arch = e.arch || MOB_ARCHETYPES.melee;
        // 유물 "한기의 오라": 플레이어 주변 적은 이동속도 30% 감소
        const spd = (Game.pSlowAura && dist < 190) ? e.speed * 0.7 : e.speed;

        if (e.state === "chase") {
            if (e.mtype === "ranged") {
                // 사거리 안에 들어오면 멈춰 조준, 너무 가까우면 뒤로 물러남
                if (dist < arch.keepDist * 0.75) {
                    e.vx = -(dx / dist) * spd * 1.3;
                    e.vy = -(dy / dist) * spd * 1.3;
                } else if (dist > arch.atkRange) {
                    e.vx = (dx / dist) * spd;
                    e.vy = (dy / dist) * spd;
                } else {
                    e.vx = 0; e.vy = 0;
                }
                if (dist <= arch.atkRange) {
                    e.chaseT = (e.chaseT || 0) + 1;
                    if (e.chaseT > 40) { e.chaseT = 0; enterWindup(e, arch, dx, dy); }
                }
            } else {
                if (dist < arch.atkRange) {
                    enterWindup(e, arch, dx, dy);
                } else if (dist < 320) {
                    e.vx = (dx / dist) * spd;
                    e.vy = (dy / dist) * spd;
                } else {
                    e.vx = 0; e.vy = 0; // 탐지 범위 밖이면 대기
                }
            }
        } else if (e.state === "windup") {
            e.vx = 0; e.vy = 0;
            e.warnT--;
            if (e.warnT <= 0) {
                e.state = "attack";
                if (typeof playSfx === 'function') playSfx(e.mtype === "ranged" ? 'mob_laser' : 'enemy_atk');
                if (e.mtype === "ranged") {
                    fireMobShot(e, arch);
                    e.atkAnim = 8;
                } else if (e.mtype === "bomber") {
                    // 자폭형은 예고가 끝나면 즉시 터지고 사라짐
                    e.hp = 0; e.dead = true;
                    e.atkAnim = 0;
                } else {
                    e.atkAnim = arch.dashDur || 14;
                }
            }
        } else if (e.state === "attack") {
            e.atkAnim--;
            if (e.mtype !== "ranged") {
                const [ux, uy] = DIR_VEC[e.facing];
                e.vx = ux * (arch.dash || 5);
                e.vy = uy * (arch.dash || 5);
                if (dist < 24 && typeof hitPlayer === 'function') {
                    hitPlayer(e.atk, e);
                    e.state = "cooldown"; e.atkCD = arch.cd;
                }
            }
            if (e.atkAnim <= 0) { e.state = "cooldown"; e.atkCD = arch.cd; }
        } else if (e.state === "cooldown") {
            e.vx *= 0.8; e.vy *= 0.8;
            e.atkCD--;
            if (e.atkCD <= 0) e.state = "chase";
        }

        resolveWalls(e, walls);
    });
}

function enterWindup(e, arch, dx, dy) {
    e.state = "windup";
    e.warnT = arch.warn;
    e._warnBase = arch.warn;
    e.warnAng = Math.atan2(dy, dx);
    e.vx = 0; e.vy = 0;
}

// 원거리 몹 발사 — 엘리트는 3발 부채꼴, 일반은 단발
function fireMobShot(e, arch) {
    const spd = arch.shotSpeed;
    const shots = e.isElite ? [-0.16, 0, 0.16] : [0];
    shots.forEach(da => {
        const a = e.warnAng + da;
        spawnEBullet(e.x, e.y - 8, Math.cos(a) * spd, Math.sin(a) * spd, 150, 5, e.atk);
    });
}
