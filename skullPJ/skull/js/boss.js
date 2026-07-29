// boss.js — 탑다운 보스 AI (자리표시자 스탯 위에 실제 패턴을 얹은 1차 버전)
// skull_V1의 boss.js(telegraph → BossAI[world] 발사) 구조를 참고해 탑다운 좌표계로 재작성.
// 전용 스프라이트가 아직 없어 mob.js의 도적 스프라이트를 금색 틴트로 재사용 중 — 로직/패턴만 검증 목적.
// 패턴 3종 순환: 0=돌진 베기(근접) 1=전방위 탄막 2=조준 3연사. HP 50% 이하(phase2)는 선딜 짧아지고 탄수 증가.

const BOSS_PATTERN_COUNT = 3;

function updateBossAI(e, walls) {
    if ((e.hitInv || 0) > 0) e.hitInv--;
    if (e.flash > 0) e.flash--;

    // 피격 넉백 중엔 패턴 진행 없이 관성으로만 밀림 (일반 몹과 동일 규칙)
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
    if (isP2 && !e._p2Flagged) { e._p2Flagged = true; addText(e.x, e.y - 30, "PHASE 2", "#ff3344", 60, 16); }

    if (e.state === "chase") {
        if (dist > 60) { e.vx = (dx / dist) * e.speed; e.vy = (dy / dist) * e.speed; }
        else { e.vx = 0; e.vy = 0; }
        e.chaseT = (e.chaseT || 0) + 1;
        if (e.chaseT > (isP2 ? 55 : 85)) {
            e.chaseT = 0;
            e.state = "windup";
            e.ap = ((e.ap === undefined ? -1 : e.ap) + 1) % BOSS_PATTERN_COUNT;
            e.warnT = isP2 ? 24 : 34;
            e._warnBase = e.warnT;
            e.warnAng = Math.atan2(dy, dx);
            e.vx = 0; e.vy = 0;
        }
    } else if (e.state === "windup") {
        e.vx = 0; e.vy = 0;
        e.warnT--;
        if (e.warnT <= 0) {
            e.state = "attack";
            e.atkAnim = e.ap === 0 ? 22 : 10;
            fireBossPattern(e, isP2);
        }
    } else if (e.state === "attack") {
        e.atkAnim--;
        if (e.ap === 0) {
            // 돌진 베기 — 텔레그래프 시점 각도로 직진, 스치면 즉시 적중
            e.vx = Math.cos(e.warnAng) * 6.5;
            e.vy = Math.sin(e.warnAng) * 6.5;
            if (dist < 30 && typeof hitPlayer === 'function') { hitPlayer(e.atk, e); e.atkAnim = 0; }
        }
        if (e.atkAnim <= 0) { e.state = "cooldown"; e.atkCD = isP2 ? 26 : 42; }
    } else if (e.state === "cooldown") {
        e.vx *= 0.8; e.vy *= 0.8;
        e.atkCD--;
        if (e.atkCD <= 0) e.state = "chase";
    }

    resolveWalls(e, walls);
}

// 텔레그래프(warnT===0) 시점에 실제 패턴 발사 — 렌더의 예고 표시와 반드시 1:1 대응
function fireBossPattern(e, isP2) {
    const cx = e.x, cy = e.y;
    if (e.ap === 1) {
        // 전방위 탄막
        const amt = isP2 ? 18 : 12;
        for (let i = 0; i < amt; i++) {
            const a = (i / amt) * Math.PI * 2;
            spawnEBullet(cx, cy, Math.cos(a) * 3.2, Math.sin(a) * 3.2, 110, 5, Math.floor(e.atk * 0.6));
        }
        Game.camShake = Math.max(Game.camShake || 0, 8);
    } else if (e.ap === 2) {
        // 조준 3(phase2: 5)연사
        const count = isP2 ? 5 : 3;
        for (let i = 0; i < count; i++) {
            const a = e.warnAng + (i - (count - 1) / 2) * 0.18;
            spawnEBullet(cx, cy, Math.cos(a) * 5.5, Math.sin(a) * 5.5, 130, 5, Math.floor(e.atk * 0.8));
        }
        Game.camShake = Math.max(Game.camShake || 0, 6);
    }
    // ap===0(돌진 베기)은 attack 단계의 이동+판정 자체가 공격이라 발사체 없음
}
