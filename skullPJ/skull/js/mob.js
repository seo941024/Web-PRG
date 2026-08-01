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
        // 보스 전용 도트 조회 키 — sprites/raw/boss<stageN>/ 아래를 찾는다.
        // 없으면 sprites.js가 자동으로 도적(1) 원화+tint로 대체한다 (spriteClassOf 폴백 재사용).
        e.spriteKey = "boss" + opts.stageN;
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
    // 전용 도트가 있으면 그걸(스테이지+원형 조합 → MOB_SPRITE_MAP), 없으면 undefined로 두어
    // render_entities.js가 기존처럼 도적 원화 tint 폴백을 타게 한다.
    e.spriteKey = MOB_SPRITE_MAP[`${opts.stageN}_${opts.type}`];
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
        const dname = dirFromAngle(dx, dy);
        if (dname && e.state !== "attack") e.facing = dname;

        // 피격 넉백 중엔 AI 판단 없이 관성으로만 밀림
        if ((e.kbT || 0) > 0) {
            e.kbT--; e.vx *= 0.85; e.vy *= 0.85;
            resolveWalls(e, walls);
            return;
        }

        const arch = e.arch || MOB_ARCHETYPES.melee;
        // 감속: 유물 "한기의 오라"(항상) / 마법사 "서릿발"(지속시간 동안) — 둘 다 근접 범위에만 적용
        const slowed = (Game.pSlowAura || Game.chillT > 0) && dist < 190;
        const spd = slowed ? e.speed * (Game.chillT > 0 ? 0.55 : 0.7) : e.speed;

        if (e.state === "chase") {
            if (isRangedType(e.mtype)) {
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
                if (typeof playSfx === 'function') playSfx(isRangedType(e.mtype) ? 'mob_laser' : 'enemy_atk');
                if (e.mtype === "thrower") {
                    // 돌을 한 발씩 연달아 던진다 — 발사 간격(burstGap)마다 1발씩, 총 burst발.
                    // 조준각은 매 발 새로 잡아서 플레이어가 계속 움직이게 만든다.
                    e.burstLeft = arch.burst || 5;
                    e.burstCD = 0;
                    e.atkAnim = (arch.burst || 5) * (arch.burstGap || 9);
                } else if (e.mtype === "archer" || e.mtype === "ranged") {
                    fireMobShot(e, arch);
                    e.atkAnim = 8;
                } else if (e.mtype === "bomber") {
                    // 자폭형은 도화선(warn)이 다 타면 터지고 사라짐
                    e.hp = 0; e.dead = true;
                    e.atkAnim = 0;
                } else {
                    e.atkAnim = arch.dashDur || 14;
                }
            }
        } else if (e.state === "attack") {
            e.atkAnim--;
            if (e.mtype === "thrower") {
                // 제자리에서 연발 — 이동하지 않고 간격마다 한 발씩
                e.vx = 0; e.vy = 0;
                if ((e.burstCD || 0) > 0) e.burstCD--;
                if (e.burstCD <= 0 && (e.burstLeft || 0) > 0) {
                    e.warnAng = Math.atan2(dy, dx);   // 매 발 재조준
                    fireMobShot(e, arch);
                    e.burstLeft--;
                    e.burstCD = arch.burstGap || 9;
                    if (typeof playSfx === 'function') playSfx('mob_laser');
                }
                if ((e.burstLeft || 0) <= 0) { e.state = "cooldown"; e.atkCD = arch.cd; }
            } else if (!isRangedType(e.mtype)) {
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

// 원거리 몹 발사
//   arch.fan 이 있으면 그 수만큼 부채꼴로 동시 발사(궁병)
//   없으면 단발 — 엘리트만 3발 부채꼴 (기존 ranged 동작 유지)
//   투척병은 이 함수를 burst 간격마다 1회씩 호출해 "연발"을 만든다
function fireMobShot(e, arch) {
    const spd = arch.shotSpeed;
    let shots;
    if (arch.fan) {
        // fan발을 fanSpread 간격으로 좌우 대칭 배치 (5발이면 -2,-1,0,1,2)
        const n = arch.fan, sp = arch.fanSpread || 0.18;
        shots = [];
        for (let i = 0; i < n; i++) shots.push((i - (n - 1) / 2) * sp);
    } else {
        shots = e.isElite ? [-0.16, 0, 0.16] : [0];
    }
    // 돌은 크고 느리게, 화살은 작고 빠르게 — 색으로도 구분해 무엇이 날아오는지 읽히게
    const isStone = e.mtype === "thrower";
    const r = isStone ? 6 : 4;
    const col = isStone ? "#9a8f7a" : "#d8c9a0";
    shots.forEach(da => {
        const a = e.warnAng + da;
        spawnEBullet(e.x, e.y - 8, Math.cos(a) * spd, Math.sin(a) * spd, 150, r, e.atk, col);
    });
}
