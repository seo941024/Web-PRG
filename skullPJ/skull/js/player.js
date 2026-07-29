// player.js — 플레이어 이동/대시 (탑다운). td/td.js 프로토타입을 정식 구조로 이식.

const Player = {
    x: 160, y: 200, vx: 0, vy: 0,
    speed: 2.7,
    facing: "south",
    dashT: 0, dashCD: 0,
    hb: { w: 18, h: 12 }, // 발치 히트박스 (충돌용)
    hp: 100, maxHp: 100, dead: false,
    invT: 0, kbT: 0,
    atkT: 0, atkAnim: 0, atkCD: 0,
    combo: 0, comboRestT: 0, comboWindowT: 0, // 4타 콤보: 피니시 후 휴식(0.3초), 타 사이 재입력 대기창
    animT: 0, animFrame: 0, animName: "idle", // 숨쉬기는 대기 상태에서 바로·계속 반복 재생
    stamina: STAMINA_MAX, staminaWarnT: 0,
};
const COMBO_MAX = 4;
const COMBO_REST_FRAMES = 18;   // 피니시(4타) 후 후딜 0.3초 @60fps
const COMBO_WINDOW_FRAMES = 24; // 타 사이 재입력 대기창 0.4초 — 이 안에 C 안 누르면 콤보 리셋
// 14프레임(실 콤보 분량)을 4타로 배분 (14는 4로 안 나눠떨어짐) — 피니시가 크고 화려하므로 프레임 더 배정
// 실제 gif는 15프레임인데 0번은 PixelLab이 강제한 "참조(idle) 프레임"이라 재생에서 제외 — 1~14번만 사용
const ATTACK_SEGMENTS = [3, 3, 3, 5]; // 합 14, [i] = (i+1)타의 프레임 수
const ATTACK_FRAME_OFFSET = 1; // 참조 프레임(0번) 건너뛰기
function attackSegmentRange(combo) {
    let start = ATTACK_FRAME_OFFSET;
    for (let i = 0; i < combo - 1; i++) start += ATTACK_SEGMENTS[i] || 0;
    const size = ATTACK_SEGMENTS[combo - 1] || ATTACK_SEGMENTS[ATTACK_SEGMENTS.length - 1];
    return { start, size };
}
const ATTACK_ANIM_TOTAL = ATTACK_SEGMENTS.reduce((a, b) => a + b, 0); // 14 — 타이밍 계산은 실 콤보 분량 기준

// 방향 이름 → 단위벡터 (공격 판정 방향에 사용)
const DIR_VEC = {
    south: [0, 1], north: [0, -1], east: [1, 0], west: [-1, 0],
    "south-east": [0.7, 0.7], "south-west": [-0.7, 0.7],
    "north-east": [0.7, -0.7], "north-west": [-0.7, -0.7],
};

// 플레이어 평타 — 직업 프로필(공속/사거리/데미지) 반영, 스프라이트 애니 없이 판정+이펙트로 손맛
function tryPlayerAttack() {
    const p = Player;
    if (p.atkT > 0 || p.atkCD > 0 || p.dashT > 0 || p.comboRestT > 0) return;
    p.comboWindowT = 0; // 재입력 성공 — 대기창 소모
    const prof = classProfile(Game.pClass);
    // 4타 콤보 — 4타째 이후 짧은 휴식(0.3초), 그 뒤 다시 1타부터
    p.combo = (p.combo % COMBO_MAX) + 1;
    if (p.combo === COMBO_MAX) p.comboRestT = COMBO_REST_FRAMES;
    // 재생 길이는 "이번 타의 세그먼트 프레임 수" 기준 (전체 15프레임이 아니라 해당 구간만) — 공속 빠를수록 빨리 재생
    const segSize = ATTACK_SEGMENTS[p.combo - 1] || ATTACK_SEGMENTS[ATTACK_SEGMENTS.length - 1];
    const animFps = 28 * prof.atkSpd; // 더 스냅있게 (기존 20 → 28)
    p.atkAnimMax = Math.max(4, Math.round(60 / animFps * segSize));
    p.atkAnim = p.atkAnimMax;
    p.atkT = Math.round(p.atkAnimMax * 0.6); // 이동 잠금은 스윙 앞부분만
    p.atkCD = Math.max(p.atkAnimMax, Math.round(prof.atkCD / prof.atkSpd / COMBO_MAX));
    p.animName = "attack"; p.animFrame = 0; p.animT = 0;
    const [dx, dy] = DIR_VEC[p.facing];
    const range = prof.range, arc = 60; // 부채꼴 판정 반각(도)
    // 판정 원점 = 캐릭터 위치 자체(몸 앞으로 안 밀어냄) — 안 그러면 적이 몸에 딱 붙었을 때
    // 원점보다 뒤쪽(반대 각도)이 돼서 각도 검사에 걸려 영원히 안 맞는 데드존이 생김.
    const cx = p.x, cy = p.y;
    const pointBlank = 12; // 이 거리 이내는 각도 무관 무조건 명중 (밀착 시 넉백으로 분리 보장)
    let hitAny = false;
    Game.enemies.forEach(e => {
        if (!e.active || e.dead) return;
        const ex = e.x - cx, ey = e.y - cy;
        const dist = Math.hypot(ex, ey);
        if (dist > range) return;
        if (dist > pointBlank) {
            const ang = Math.atan2(ey, ex) - Math.atan2(dy, dx);
            let da = Math.abs(Math.atan2(Math.sin(ang), Math.cos(ang))) * 180 / Math.PI;
            if (da > arc) return;
        }
        let dmg = prof.dmgMin + Math.floor(Math.random() * (prof.dmgMax - prof.dmgMin + 1));
        // 피니시(4타)는 후딜이 긴 만큼 데미지 보너스 — 콤보 완주 보상
        if (p.combo === COMBO_MAX) dmg = Math.round(dmg * 1.7);
        const isCrit = Math.random() < prof.crit;
        hitE(e, isCrit ? dmg * 2 : dmg, dx >= 0 ? 1 : -1, isCrit);
        hitAny = true;
    });
    // 타격 파티클 — 명중했을 때만, 개수·범위 축소(정신사나움 방지)
    Game.camShake = hitAny ? 4 : 0;
    if (hitAny) {
        for (let i = 0; i < 4; i++) addPart(cx + (Math.random()-0.5)*12, cy + (Math.random()-0.5)*12, "#cceeff", 12, 2);
    }
}

// 플레이어 피격 — 경량 버전 (마나/스태미나/패링 없는 상태의 임시 구현, 추후 시스템 확장 시 교체)
function hitPlayer(dmg, eObj) {
    const p = Player;
    if (p.dead || p.invT > 0 || p.dashT > 0) return;
    p.hp -= dmg;
    p.invT = 45; p.kbT = 12;
    const ex = p.x - (eObj ? eObj.x : p.x), ey = p.y - (eObj ? eObj.y : p.y);
    const d = Math.hypot(ex, ey) || 1;
    p.vx = (ex / d) * 4; p.vy = (ey / d) * 4;
    Game.camShake = 10;
    addText(p.x, p.y - 20, "-" + dmg, "#ff4444", 35, 16);
    for (let i = 0; i < 10; i++) addPart(p.x, p.y - 10, "#ff2222", 18, 3);
    if (p.hp <= 0) { p.hp = 0; p.dead = true; }
}

const dashGhosts = [];

function updatePlayer(walls) {
    const p = Player;
    if (p.invT > 0) p.invT--;
    if (p.atkT > 0) p.atkT--;
    if (p.atkAnim > 0) p.atkAnim--;
    if (p.atkCD > 0) {
        p.atkCD--;
        // 스윙(현재 타격 구간)이 방금 끝났고, 아직 콤보 진행 중(피니시 전)이면 재입력 대기창 시작
        if (p.atkCD === 0 && p.combo > 0 && p.combo < COMBO_MAX && p.comboRestT <= 0) {
            p.comboWindowT = COMBO_WINDOW_FRAMES;
        }
    } else if (p.comboWindowT > 0) {
        p.comboWindowT--;
        if (p.comboWindowT <= 0) p.combo = 0; // 시간 안에 재입력 없음 → 콤보 리셋, 다음엔 idle/walk로 자연 전환
    }
    if (p.comboRestT > 0) p.comboRestT--;
    if (p.kbT > 0) { p.kbT--; p.x += p.vx; p.y += p.vy; p.vx *= 0.85; p.vy *= 0.85; }
    if (p.dead) return;
    if (dn("KeyC") && p.kbT <= 0) tryPlayerAttack();

    let mx = 0, my = 0;
    if (dn("ArrowLeft", "KeyA")) mx = -1;
    if (dn("ArrowRight", "KeyD")) mx = 1;
    if (dn("ArrowUp", "KeyW")) my = -1;
    if (dn("ArrowDown", "KeyS")) my = 1;

    const dname = dirFromVec(mx, my);
    if (dname) p.facing = dname;

    let sp = p.speed;
    if (mx !== 0 && my !== 0) sp *= 0.707; // 대각선 정규화

    // 스프린트: Z 유지 — 이동속도 2배, 스태미나 소모 없음 (풀스프린트 애니 사용)
    const sprintHeld = dn("KeyZ") && (mx !== 0 || my !== 0) && p.dashT <= 0;
    if (sprintHeld) sp *= 2;

    // 회피(구 대시): Space — 짧은 무적 突진 + 잔상, 스태미나 소모
    if (p.dashCD > 0) p.dashCD--;
    if (dn("Space") && p.dashCD <= 0 && (mx !== 0 || my !== 0)) {
        if (p.stamina >= STAMINA_DASH) {
            p.stamina -= STAMINA_DASH;
            p.dashT = 10; p.dashCD = 28;
        } else if (p.staminaWarnT <= 0) {
            addText(p.x, p.y - 20, "스태미너 부족!", "#ff6600", 40, 11);
            p.staminaWarnT = 40;
        }
    }
    if (p.staminaWarnT > 0) p.staminaWarnT--;
    // 스태미나 자연 회복 (회피 중엔 회복 안 함)
    if (p.dashT <= 0) p.stamina = Math.min(STAMINA_MAX, p.stamina + STAMINA_REGEN);

    if (p.dashT > 0) {
        p.dashT--; sp = 8;
        if (p.dashT % 2 === 0) dashGhosts.push({ x: p.x, y: p.y, facing: p.facing, life: 16, max: 16 });
    }
    for (let i = dashGhosts.length - 1; i >= 0; i--) { if (--dashGhosts[i].life <= 0) dashGhosts.splice(i, 1); }

    p.vx = mx * sp;
    p.vy = my * sp;

    resolveWalls(p, walls);

    // 애니메이션 상태 결정 — 공격 재생 중이면 최우선, 아니면 걷기/스프린트/숨쉬기 전부 계속 반복 재생
    if (p.atkAnim > 0 && p.animName === "attack") {
        // 전체 클립을 4타로 배분 — 이번 타격은 자기 구간만 재생 (구간 크기는 ATTACK_SEGMENTS)
        const { start: segStart, size: segSize } = attackSegmentRange(Math.max(1, p.combo));
        const progress = 1 - p.atkAnim / (p.atkAnimMax || 1);
        p.animFrame = Math.min(segStart + segSize - 1, segStart + Math.floor(progress * segSize));
    } else {
        const moving = (mx !== 0 || my !== 0) && p.dashT <= 0;
        const targetAnim = moving ? (sprintHeld ? "sprint" : "walk") : "idle";
        if (p.animName !== targetAnim) { p.animName = targetAnim; p.animT = 0; p.animFrame = 0; }

        const fc = animFrameCount(p.animName);
        const fps = p.animName === "sprint" ? 16 : p.animName === "walk" ? 12 : 8; // idle=숨쉬기, 바로 계속 반복
        p.animT++;
        if (p.animT >= 60 / fps) { p.animT = 0; p.animFrame = (p.animFrame + 1) % fc; }
    }
}
