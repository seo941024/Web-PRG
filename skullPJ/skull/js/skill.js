// skill.js — 직업 고유 스킬 (Shift)
// 쿨다운 기반. MP 자원을 따로 두지 않은 이유: 게이지가 하나 더 늘면 HUD가 복잡해지고,
// 탑다운 전투 템포에서는 "언제 쓸까"만 결정하게 하는 쿨다운이 더 읽기 쉽다.
//
// 쿨다운 길이는 core.js의 CLASS_PROFILE.skillCD(프레임)에 있다.
// 피해량은 playerAtkDamage()를 기준으로 배율을 걸어, 장비·유물·진행 보정이 스킬에도 반영되게 한다.
// 배율 기준: 쿨다운 4초 동안 평타만 쳐도 콤보 5회(약 23배)가 나오므로,
// 스킬 1회 총합이 콤보 2~2.5회분(약 10~12배)은 돼야 쓸 이유가 생긴다.
// 다단히트 스킬은 (배율 × 히트수)가 그 총합이 되도록 배율을 나눠 잡을 것.

// 부채꼴/원형 범위 안의 적에게 피해를 주는 공통 헬퍼.
// arcDeg를 생략하면 360도(주변 전체).
function skillHitArea(cx, cy, range, arcDeg, dirAng, dmg, opts) {
    opts = opts || {};
    let hits = 0;
    Game.enemies.forEach(e => {
        if (!e.active || e.dead) return;
        const ex = e.x - cx, ey = e.y - cy;
        const dist = Math.hypot(ex, ey);
        if (dist > range) return;
        if (arcDeg < 360 && dist > 12) {
            const d = Math.atan2(ey, ex) - dirAng;
            const da = Math.abs(Math.atan2(Math.sin(d), Math.cos(d))) * 180 / Math.PI;
            if (da > arcDeg / 2) return;
        }
        const prof = classProfile(Game.pClass);
        const isCrit = Math.random() < (prof.crit + (Game.pCritBonus || 0) + equipCrit());
        hitE(e, isCrit ? Math.round(dmg * (Game.pCritDmg || 2)) : dmg, ex >= 0 ? 1 : -1, isCrit);
        if (opts.stun) { e.kbT = Math.max(e.kbT || 0, opts.stun); }
        hits++;
    });
    return hits;
}

// 시각 이펙트용 링 — render_entities.js가 Game.skillFx를 읽어 그린다
function skillRing(x, y, r, col, life) {
    Game.skillFx.push({ x, y, r, col, life, max: life });
}

const CLASS_SKILLS = {
    // 성기사 — 신성 충격파: 주변 전체를 쓸고 짧은 무적. 탱커답게 위기 탈출기로도 쓰인다.
    0: {
        name: "신성 충격파",
        run() {
            const dmg = Math.round(playerAtkDamage() * 9.5);
            skillHitArea(Player.x, Player.y, 130, 360, 0, dmg, { stun: 20 });
            skillRing(Player.x, Player.y, 130, "#ffd24a", 26);
            Player.invT = Math.max(Player.invT, 60);   // 1초 무적
            Game.camShake = 20;
            for (let i = 0; i < 26; i++) addPart(Player.x, Player.y - 10, "#ffe9a0", 26, 4);
        },
    },

    // 도적 — 그림자 난무: 바라보는 방향으로 순간이동한 뒤 전방을 다단히트.
    1: {
        name: "그림자 난무",
        run() {
            const [dx, dy] = DIR_VEC[Player.facing];
            const ang = Math.atan2(dy, dx);
            const walls = collisionWalls();
            // 배율 0.55는 너무 낮았다 — 4초 쿨 스킬 총합(29)이 평타 4타 콤보(49)보다 약해
            // 쓸 이유가 없었다. 1.0배로 올려 관통 1회 + 도착 5연타 = 평타 6회분(약 63)이 되게 한다.
            const dmg = Math.round(playerAtkDamage() * 1.8);

            // 순간이동 — 벽은 통과하지 않도록 조금씩 전진하며 충돌 검사.
            // 지나친 적도 베어야 한다. 안 그러면 멀리 있는 적을 노리고 돌진했을 때
            // 가까운 적들을 그냥 통과해버려 헛방이 된다(도착 지점 판정만으로는 뒤에 남음).
            const slashed = new Set();
            for (let step = 0; step < 14; step++) {
                const nx = Player.x + dx * 8, ny = Player.y + dy * 8;
                const hb = Player.hb;
                let blocked = false;
                for (const w of walls) {
                    if (nx - hb.w / 2 < w.x + w.w && nx + hb.w / 2 > w.x &&
                        ny - hb.h / 2 < w.y + w.h && ny + hb.h / 2 > w.y) { blocked = true; break; }
                }
                if (blocked) break;
                Player.x = nx; Player.y = ny;
                if (step % 2 === 0) dashGhosts.push({ x: Player.x, y: Player.y, facing: Player.facing, life: 18, max: 18 });
                // 경로 주변의 적을 관통 베기 (한 적당 1회)
                Game.enemies.forEach(e => {
                    if (!e.active || e.dead || slashed.has(e)) return;
                    const ex = e.x - Player.x, ey = e.y - Player.y;
                    if (ex * ex + ey * ey > 40 * 40) return;
                    slashed.add(e);
                    const prof = classProfile(Game.pClass);
                    const isCrit = Math.random() < (prof.crit + (Game.pCritBonus || 0) + equipCrit());
                    hitE(e, isCrit ? Math.round(dmg * (Game.pCritDmg || 2)) : dmg, ex >= 0 ? 1 : -1, isCrit);
                    for (let i = 0; i < 5; i++) addPart(e.x, e.y - 12, "#cc44ff", 16, 3);
                });
            }

            // 도착 지점에서 5연타 (프레임을 나눠 때려 다단히트 느낌)
            // 직업 선택 화면 설명이 "5연타"라 숫자를 맞춘다(예전엔 4타로 어긋나 있었음)
            Game.skillPending.push({ t: 0, every: 4, left: 5, fn: () => {
                skillHitArea(Player.x, Player.y, 68, 160, ang, dmg);
                for (let i = 0; i < 4; i++) addPart(Player.x + dx * 20, Player.y - 12, "#cc44ff", 14, 3);
            }});
            skillRing(Player.x, Player.y, 68, "#cc44ff", 18);
            Player.invT = Math.max(Player.invT, 24);
            Game.camShake = 10;
        },
    },

    // 마법사 — 서릿발: 전방으로 관통 냉기탄 5발을 부채꼴로. 맞은 적은 크게 느려진다.
    2: {
        name: "서릿발",
        run() {
            const [dx, dy] = DIR_VEC[Player.facing];
            const base = Math.atan2(dy, dx);
            const dmg = Math.round(playerAtkDamage() * 9.0);
            for (let i = -2; i <= 2; i++) {
                const a = base + i * 0.16;
                const b = spawnPBullet(Player.x, Player.y - 14, Math.cos(a) * 7.5, Math.sin(a) * 7.5,
                    70, 8, dmg, 3, "#7fdcff");
                b.chill = true;   // updatePBullets가 아니라 여기 표시만 — 감속은 아래 pending에서 일괄 처리
            }
            // 냉기 장 — 잠시 주변 적 감속 (유물 한기의 오라와 같은 플래그를 일시적으로 켬)
            Game.chillT = 240;
            skillRing(Player.x, Player.y, 90, "#7fdcff", 20);
            Game.camShake = 8;
        },
    },

    // 버서커 — 대지 강타: 넓은 원형 강타 + 강한 넉백. 자기 체력을 8% 태워서 쓴다.
    3: {
        name: "대지 강타",
        run() {
            const cost = Math.max(1, Math.round(Player.maxHp * 0.08));
            Player.hp = Math.max(1, Player.hp - cost);   // 자해로 죽지는 않게 최소 1 보장
            addText(Player.x, Player.y - 34, `-${cost} 광기`, "#ff5533", 40, 13);
            const dmg = Math.round(playerAtkDamage() * 11.0);
            skillHitArea(Player.x, Player.y, 150, 360, 0, dmg, { stun: 26 });
            skillRing(Player.x, Player.y, 150, "#ff5533", 30);
            // 강한 넉백
            Game.enemies.forEach(e => {
                if (!e.active || e.dead) return;
                const ex = e.x - Player.x, ey = e.y - Player.y;
                const d = Math.hypot(ex, ey) || 1;
                if (d < 150 && !e.superArmor) { e.vx = (ex / d) * 11; e.vy = (ey / d) * 11; e.kbT = 18; }
            });
            Game.camShake = 28;
            for (let i = 0; i < 34; i++) addPart(Player.x, Player.y, "#ff7744", 30, 5);
        },
    },

    // 발키리 — 일제사격: 전방 부채꼴로 12발을 빠르게 흩뿌린다.
    4: {
        name: "일제사격",
        run() {
            const [dx, dy] = DIR_VEC[Player.facing];
            const base = Math.atan2(dy, dx);
            const dmg = Math.round(playerAtkDamage() * 0.95);
            // 3프레임 간격으로 4번, 매번 3발 — 연사 느낌
            Game.skillPending.push({ t: 0, every: 3, left: 4, fn: () => {
                for (let i = -1; i <= 1; i++) {
                    const a = base + i * 0.14 + (Math.random() - 0.5) * 0.08;
                    spawnPBullet(Player.x, Player.y - 14, Math.cos(a) * 11, Math.sin(a) * 11,
                        60, 5, dmg, 0, "#e8eef8");
                }
                if (typeof playSfx === 'function') playSfx('atk');
            }});
            Game.camShake = 10;
        },
    },

    // 혈귀 — 혈참: 전방 광역을 베고, 명중한 적 수에 비례해 체력을 흡수한다.
    5: {
        name: "혈참",
        run() {
            const [dx, dy] = DIR_VEC[Player.facing];
            const ang = Math.atan2(dy, dx);
            const dmg = Math.round(playerAtkDamage() * 2.0);
            const hits = skillHitArea(Player.x, Player.y, 105, 160, ang, dmg);
            skillRing(Player.x, Player.y, 105, "#cc1f4a", 24);
            if (hits > 0) {
                const heal = Math.min(hits * 7, Math.round(Player.maxHp * 0.25));
                Player.hp = Math.min(Player.maxHp, Player.hp + heal);
                addText(Player.x, Player.y - 34, `+${heal} 흡수`, "#ff5577", 45, 14);
            }
            Game.camShake = 18;
            for (let i = 0; i < 24; i++) addPart(Player.x + dx * 30, Player.y - 12, "#cc1f4a", 26, 4);
        },
    },
};

function classSkill(id) { return CLASS_SKILLS[id] || CLASS_SKILLS[1]; }

// Shift 입력 → 스킬 발동
function tryPlayerSkill() {
    const p = Player;
    if (p.dead || p.skillCD > 0 || p.atkAnim > 0 || p.dashT > 0 || p.kbT > 0) return;
    const prof = classProfile(Game.pClass);
    const sk = classSkill(Game.pClass);
    p.skillCD = prof.skillCD || 300;
    p.skillCDMax = p.skillCD;
    addText(p.x, p.y - 50, sk.name, prof.tint || "#ffffff", 50, 15);
    if (typeof playSfx === 'function') playSfx('skill');
    sk.run();
}

// 지연 실행 큐 — 다단히트/연사처럼 여러 프레임에 걸쳐 나가는 스킬에 사용.
// setTimeout을 쓰면 일시정지·씬 전환 중에도 터져버리므로 게임 루프에 묶어 처리한다.
function updateSkillPending() {
    for (let i = Game.skillPending.length - 1; i >= 0; i--) {
        const q = Game.skillPending[i];
        q.t++;
        if (q.t >= q.every) {
            q.t = 0;
            q.fn();
            if (--q.left <= 0) Game.skillPending.splice(i, 1);
        }
    }
    // 스킬 이펙트 링 수명
    for (let i = Game.skillFx.length - 1; i >= 0; i--) {
        if (--Game.skillFx[i].life <= 0) Game.skillFx.splice(i, 1);
    }
    if (Game.chillT > 0) Game.chillT--;
}
