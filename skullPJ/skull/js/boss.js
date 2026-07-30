// boss.js — 스테이지별 보스 패턴 (5테마 × 각 3~4패턴)
// skull_V1 boss.js의 "예고(warnT) → 0이 되는 순간 발사" 구조를 그대로 따르되, 탑다운 좌표계로 재작성.
// 예고 표시(render_entities.js)와 실제 발사가 같은 warnAng/warnKind를 참조하므로 방향이 어긋나지 않는다.
//
// 패턴 정의 형식:
//   { name: 화면 표시 이름, warn: 선딜(프레임), dur: 실행 시간, kind: "dash" | "cast", exec(e, isP2) }
//   kind "dash" → 실행 중 예고 각도로 돌진하며 몸통 판정 / "cast" → 제자리에서 발사만
// phase2(HP 50% 이하)는 공통으로 선딜 -30%, 쿨다운 -35%가 걸리고 패턴별로 탄수·범위가 늘어난다.

const BOSS_PATTERNS = {
    // ── 1. 고블린 킹 — 단순하고 읽기 쉬운 근접 위주. 첫 보스답게 학습용 ──
    1: [
        {
            name: "철퇴 돌진", warn: 34, dur: 24, kind: "dash",
            exec: () => { Game.camShake = Math.max(Game.camShake || 0, 10); },
        },
        {
            name: "회전 후려치기", warn: 30, dur: 12, kind: "cast",
            exec: (e, isP2) => {
                const amt = isP2 ? 16 : 11;
                for (let i = 0; i < amt; i++) {
                    const a = (i / amt) * Math.PI * 2;
                    spawnEBullet(e.x, e.y - 8, Math.cos(a) * 3.1, Math.sin(a) * 3.1, 110, 5, Math.round(e.atk * 0.55));
                }
                Game.camShake = Math.max(Game.camShake || 0, 8);
            },
        },
        {
            name: "돌 던지기", warn: 28, dur: 10, kind: "cast",
            exec: (e, isP2) => {
                const count = isP2 ? 5 : 3;
                for (let i = 0; i < count; i++) {
                    const a = e.warnAng + (i - (count - 1) / 2) * 0.20;
                    spawnEBullet(e.x, e.y - 8, Math.cos(a) * 5.2, Math.sin(a) * 5.2, 130, 6, Math.round(e.atk * 0.8));
                }
            },
        },
    ],

    // ── 2. 스켈레톤 치프틴 — 원거리 압박 + 잡졸 소환. 엄폐물 활용을 강제 ──
    2: [
        {
            name: "뼈 화살 일제사격", warn: 30, dur: 12, kind: "cast",
            exec: (e, isP2) => {
                const count = isP2 ? 9 : 6;
                for (let i = 0; i < count; i++) {
                    const a = e.warnAng + (i - (count - 1) / 2) * 0.14;
                    spawnEBullet(e.x, e.y - 8, Math.cos(a) * 6.4, Math.sin(a) * 6.4, 150, 5, Math.round(e.atk * 0.7));
                }
            },
        },
        {
            name: "십자 뼈창", warn: 34, dur: 14, kind: "cast",
            exec: (e, isP2) => {
                // 축 4방향(+phase2는 대각 4방향 추가)으로 두꺼운 탄을 길게 뿜음
                const dirs = isP2 ? 8 : 4;
                for (let i = 0; i < dirs; i++) {
                    const a = (i / dirs) * Math.PI * 2 + (Game.frameCount % 90) * 0.004;
                    for (let k = 0; k < 3; k++) {
                        spawnEBullet(e.x, e.y - 8, Math.cos(a) * (3.4 + k * 1.3), Math.sin(a) * (3.4 + k * 1.3),
                            160, 6, Math.round(e.atk * 0.65));
                    }
                }
                Game.camShake = Math.max(Game.camShake || 0, 9);
            },
        },
        {
            name: "망자 소집", warn: 44, dur: 20, kind: "cast",
            exec: (e, isP2) => {
                // 자기 주변에 잡졸을 불러냄 — 문이 열리려면 소환된 몹까지 정리해야 함
                const n = isP2 ? 3 : 2;
                for (let i = 0; i < n; i++) {
                    const a = (i / n) * Math.PI * 2;
                    spawnThemedEnemy(e.x + Math.cos(a) * 70, e.y + Math.sin(a) * 70, Game.stageN, Game.roundN);
                }
                addText(e.x, e.y - 40, "망자 소집!", "#cfd6e6", 50, 14);
            },
        },
        {
            name: "돌격 창격", warn: 28, dur: 22, kind: "dash",
            exec: () => { Game.camShake = Math.max(Game.camShake || 0, 11); },
        },
    ],

    // ── 3. 무덤의 군주 — 순간이동으로 거리를 무시하고, 장판으로 공간을 좁힌다 ──
    3: [
        {
            name: "영혼 흡수", warn: 36, dur: 14, kind: "cast",
            exec: (e, isP2) => {
                // 느리지만 큰 유도성 탄 — 벽으로 끊거나 회피로 통과해야 함
                const count = isP2 ? 5 : 3;
                for (let i = 0; i < count; i++) {
                    const a = e.warnAng + (i - (count - 1) / 2) * 0.30;
                    spawnEBullet(e.x, e.y - 8, Math.cos(a) * 2.6, Math.sin(a) * 2.6, 240, 10, Math.round(e.atk * 0.9));
                }
            },
        },
        {
            name: "저주의 봉인", warn: 40, dur: 18, kind: "cast",
            exec: (e, isP2) => {
                // 플레이어 주변 지면에 지연 폭발 장판을 여러 개 — 계속 움직이게 강제
                const n = isP2 ? 5 : 3;
                for (let i = 0; i < n; i++) {
                    const a = Math.random() * Math.PI * 2;
                    const d = Math.random() * 90;
                    spawnHazard(Player.x + Math.cos(a) * d, Player.y + Math.sin(a) * d,
                        56, 48, 40, Math.round(e.atk * 0.8), "#b56bff");
                }
                addText(e.x, e.y - 40, "저주의 봉인", "#b56bff", 50, 13);
            },
        },
        {
            name: "그림자 도약", warn: 30, dur: 16, kind: "cast",
            exec: (e, isP2) => {
                // 플레이어 등 뒤로 순간이동 후 전방위 탄막 — 근접 유지 플레이를 응징
                for (let i = 0; i < 14; i++) addPart(e.x, e.y, "#b56bff", 20, 4);
                const a0 = Math.random() * Math.PI * 2;
                e.x = Math.max(140, Math.min(960, Player.x + Math.cos(a0) * 60));
                e.y = Math.max(140, Math.min(960, Player.y + Math.sin(a0) * 60));
                for (let i = 0; i < 14; i++) addPart(e.x, e.y, "#b56bff", 20, 4);
                const amt = isP2 ? 20 : 14;
                for (let i = 0; i < amt; i++) {
                    const a = (i / amt) * Math.PI * 2;
                    spawnEBullet(e.x, e.y - 8, Math.cos(a) * 3.6, Math.sin(a) * 3.6, 120, 5, Math.round(e.atk * 0.6));
                }
                addText(e.x, e.y - 40, "그림자 도약", "#c98bff", 40, 13);
                Game.camShake = Math.max(Game.camShake || 0, 12);
            },
        },
    ],

    // ── 4. 화산의 군주 — 나선 탄막 + 지면 폭발. 화면을 넓게 쓰게 만든다 ──
    4: [
        {
            name: "화염 나선", warn: 32, dur: 40, kind: "cast",
            exec: (e, isP2) => {
                // 실행 시간 동안 계속 뿜는 방식 — updateBossAI의 sustain 훅에서 프레임마다 발사
                e.sustain = { kind: "spiral", t: 0, dur: 40, arms: isP2 ? 3 : 2 };
            },
        },
        {
            name: "용암 분출", warn: 38, dur: 20, kind: "cast",
            exec: (e, isP2) => {
                // 방 전역에 격자로 폭발 장판 — 안전지대를 읽고 이동해야 함
                const n = isP2 ? 9 : 6;
                for (let i = 0; i < n; i++) {
                    const gx = 200 + Math.random() * 700;
                    const gy = 200 + Math.random() * 700;
                    spawnHazard(gx, gy, 70, 50 + i * 4, 40, Math.round(e.atk * 0.9), "#ff6a1e");
                }
                // 플레이어 현재 위치에도 확정 1개
                spawnHazard(Player.x, Player.y, 70, 50, 40, Math.round(e.atk * 0.9), "#ff6a1e");
                addText(e.x, e.y - 44, "용암 분출!", "#ff8a3a", 50, 14);
                Game.camShake = Math.max(Game.camShake || 0, 14);
            },
        },
        {
            name: "분화 돌진", warn: 26, dur: 30, kind: "dash",
            exec: (e) => {
                // 돌진 경로에 불씨를 흘림 — 지나간 자리도 잠시 위험
                e.sustain = { kind: "trail", t: 0, dur: 30 };
                Game.camShake = Math.max(Game.camShake || 0, 14);
            },
        },
        {
            name: "폭염 파열", warn: 30, dur: 12, kind: "cast",
            exec: (e, isP2) => {
                const waves = isP2 ? 2 : 1;
                for (let w = 0; w < waves; w++) {
                    const amt = 18;
                    for (let i = 0; i < amt; i++) {
                        const a = (i / amt) * Math.PI * 2 + w * 0.17;
                        const sp = 3.0 + w * 1.6;
                        spawnEBullet(e.x, e.y - 8, Math.cos(a) * sp, Math.sin(a) * sp, 150, 6, Math.round(e.atk * 0.6));
                    }
                }
            },
        },
    ],

    // ── 5. 마왕 — 앞선 테마들의 위협을 전부 섞은 최종 보스 ──
    5: [
        {
            name: "왕관의 뇌격", warn: 34, dur: 20, kind: "cast",
            exec: (e, isP2) => {
                // 플레이어를 중심으로 십자 방향에 장판을 깔아 도망칠 축을 제한
                const arms = isP2 ? 8 : 4;
                for (let i = 0; i < arms; i++) {
                    const a = (i / arms) * Math.PI * 2;
                    for (let k = 1; k <= 3; k++) {
                        spawnHazard(Player.x + Math.cos(a) * k * 70, Player.y + Math.sin(a) * k * 70,
                            54, 42 + k * 6, 34, Math.round(e.atk * 0.75), "#ff2d55");
                    }
                }
                addText(e.x, e.y - 50, "왕관의 뇌격", "#ff2d55", 55, 15);
                Game.camShake = Math.max(Game.camShake || 0, 18);
            },
        },
        {
            name: "지옥의 문", warn: 36, dur: 16, kind: "cast",
            exec: (e, isP2) => {
                // 2파 방사 — 1파 사이를 2파가 메워서 단순 직선 회피를 막음
                const amt = isP2 ? 24 : 18;
                for (let i = 0; i < amt; i++) {
                    const a = (i / amt) * Math.PI * 2;
                    spawnEBullet(e.x, e.y - 8, Math.cos(a) * 5.0, Math.sin(a) * 5.0, 200, 6, Math.round(e.atk * 0.6));
                }
                for (let i = 0; i < amt; i++) {
                    const a = ((i + 0.5) / amt) * Math.PI * 2;
                    spawnEBullet(e.x, e.y - 8, Math.cos(a) * 2.9, Math.sin(a) * 2.9, 240, 6, Math.round(e.atk * 0.5));
                }
                addText(e.x, e.y - 50, "지옥의 문", "#ff0033", 55, 16);
                Game.camShake = Math.max(Game.camShake || 0, 22);
            },
        },
        {
            name: "심연의 참격", warn: 26, dur: 28, kind: "dash",
            exec: (e) => {
                e.sustain = { kind: "trail", t: 0, dur: 28 };
                Game.camShake = Math.max(Game.camShake || 0, 16);
            },
        },
        {
            name: "광란의 탄막", warn: 32, dur: 46, kind: "cast",
            exec: (e, isP2) => {
                e.sustain = { kind: "spiral", t: 0, dur: 46, arms: isP2 ? 4 : 3 };
                addText(e.x, e.y - 50, "광란의 탄막!", "#ff0033", 55, 16);
            },
        },
    ],
};

function bossPatterns(stageN) {
    return BOSS_PATTERNS[stageN] || BOSS_PATTERNS[1];
}

function updateBossAI(e, walls) {
    if ((e.hitInv || 0) > 0) e.hitInv--;
    if (e.flash > 0) e.flash--;

    // 넉백은 슈퍼아머로 막지만, 혹시 걸렸다면 관성 처리만 하고 패턴은 멈춤
    if ((e.kbT || 0) > 0) {
        e.kbT--; e.vx *= 0.85; e.vy *= 0.85;
        resolveWalls(e, walls);
        return;
    }

    const p = Player;
    const dx = p.x - e.x, dy = p.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    const dname = dirFromVec(Math.sign(dx) || 0, Math.sign(dy) || 0);
    if (dname && e.state !== "attack") e.facing = dname;

    const isP2 = e.hp < e.maxHp * 0.5;
    if (isP2 && !e._p2Flagged) {
        e._p2Flagged = true;
        addText(e.x, e.y - 46, "PHASE 2", "#ff3344", 80, 20);
        for (let i = 0; i < 40; i++) addPart(e.x, e.y, "#ff3344", 40, 5);
        Game.camShake = Math.max(Game.camShake || 0, 26);
    }

    const pats = bossPatterns(Game.stageN);

    if (e.state === "chase") {
        // 일정 거리를 유지하며 접근 — 너무 붙으면 패턴이 안 보이므로 60px 밖에서 멈춤
        if (dist > 70) { e.vx = (dx / dist) * e.speed; e.vy = (dy / dist) * e.speed; }
        else { e.vx *= 0.85; e.vy *= 0.85; }
        e.chaseT = (e.chaseT || 0) + 1;
        if (e.chaseT > (isP2 ? 42 : 70)) {
            e.chaseT = 0;
            // 패턴 순환 — phase2에서는 한 번에 두 패턴을 연달아 쓰도록 콤보 큐를 채움
            e.ap = ((e.ap === undefined ? -1 : e.ap) + 1) % pats.length;
            if (isP2 && !e.comboQueue) e.comboQueue = [(e.ap + 1) % pats.length];
            startBossPattern(e, pats[e.ap], isP2);
        }
    } else if (e.state === "windup") {
        e.vx *= 0.8; e.vy *= 0.8;
        e.warnT--;
        if (e.warnT <= 0) {
            const pat = pats[e.ap];
            e.state = "attack";
            e.atkAnim = pat.dur;
            e.sustain = null;
            if (typeof playSfx === 'function') playSfx('boss_atk');
            pat.exec(e, isP2);
        }
    } else if (e.state === "attack") {
        e.atkAnim--;
        const pat = pats[e.ap];
        if (pat.kind === "dash") {
            e.vx = Math.cos(e.warnAng) * 7.2;
            e.vy = Math.sin(e.warnAng) * 7.2;
            if (dist < 34 && typeof hitPlayer === 'function') hitPlayer(e.atk, e);
        } else {
            e.vx *= 0.85; e.vy *= 0.85;
        }
        updateBossSustain(e, isP2);
        if (e.atkAnim <= 0) {
            e.sustain = null;
            // phase2 콤보 큐가 남아 있으면 쿨다운 없이 바로 다음 패턴으로 이어감
            if (e.comboQueue && e.comboQueue.length > 0) {
                e.ap = e.comboQueue.shift();
                if (e.comboQueue.length === 0) e.comboQueue = null;
                startBossPattern(e, pats[e.ap], isP2);
            } else {
                e.state = "cooldown";
                e.atkCD = Math.round((isP2 ? 30 : 46));
            }
        }
    } else if (e.state === "cooldown") {
        e.vx *= 0.8; e.vy *= 0.8;
        e.atkCD--;
        if (e.atkCD <= 0) e.state = "chase";
    }

    resolveWalls(e, walls);
}

function startBossPattern(e, pat, isP2) {
    e.state = "windup";
    e.warnT = Math.round(pat.warn * (isP2 ? 0.7 : 1));
    e._warnBase = e.warnT;
    e.warnKind = pat.kind;
    e.warnName = pat.name;
    e.warnAng = Math.atan2(Player.y - e.y, Player.x - e.x);
    e.vx = 0; e.vy = 0;
}

// 실행 시간 내내 계속 효과가 나가는 패턴(나선 탄막 / 돌진 불씨) 처리
function updateBossSustain(e, isP2) {
    const s = e.sustain;
    if (!s) return;
    s.t++;
    if (s.kind === "spiral") {
        // 팔(arm) 개수만큼 각도를 벌려 회전시키며 발사 — 4프레임마다 한 겹
        if (s.t % 4 === 0) {
            const base = s.t * 0.16;
            for (let i = 0; i < s.arms; i++) {
                const a = base + (i / s.arms) * Math.PI * 2;
                spawnEBullet(e.x, e.y - 8, Math.cos(a) * 3.8, Math.sin(a) * 3.8, 170, 5, Math.round(e.atk * 0.5));
            }
        }
    } else if (s.kind === "trail") {
        // 지나간 자리에 짧은 장판을 흘림
        if (s.t % 6 === 0) {
            spawnHazard(e.x, e.y, 44, 14, 30, Math.round(e.atk * 0.55), "#ff6a1e");
        }
    }
    if (s.t >= s.dur) e.sustain = null;
}
