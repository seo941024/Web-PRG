// player.js — 플레이어 이동/대시 (탑다운). td/td.js 프로토타입을 정식 구조로 이식.

// 직업 배율(hpMul/spdMul)이 이 기준값에 곱해진다. 방어구·영구강화·유물은 그 위에 더해짐.
const PLAYER_BASE_MAX_HP = 100;
const PLAYER_BASE_SPEED = 2.7;

// 스태미나 — 원래 V1 systems.js에 있었지만, 그 파일에서 실제로 쓰던 건 이 3개 상수뿐이고
// 나머지(체간·패링·가드·모닥불 250여 줄)는 전부 미사용이라 파일째로 정리하고 여기로 옮겼다.
// 가드/패링을 이식할 때는 skull_V1/skull/js/systems.js 를 참고할 것.
const STAMINA_MAX   = 100;
const STAMINA_REGEN = 0.45;  // 프레임당 자연회복
const STAMINA_DASH  = 35;    // 회피 1회 소모 (유물 pDashCostMul로 배율 적용)
// 회피가 끝난 직후에도 잠깐 무적을 남긴다(0.6초).
// 대시 모션이 끝나는 순간 바로 판정이 살아나면 "피했는데 맞는" 느낌이라 회피기로 안 읽힌다.
// 이 시간 동안 캐릭터는 점멸하고(render_entities), 투사체는 몸을 통과한다(updateEBullets).
// 0.6초 — 0.3초는 탄막 사이를 빠져나오기엔 짧아서 회피 후 바로 다시 맞았다.
const DASH_INV_AFTER = 36;

const Player = {
    x: 160, y: 200, vx: 0, vy: 0,
    speed: PLAYER_BASE_SPEED,   // resetRun()이 직업 배율을 적용해 덮어씀
    skillCD: 0,                 // 직업 스킬 쿨다운 (skill.js)
    facing: "south",
    dashT: 0, dashCD: 0,
    hb: { w: 18, h: 12 }, // 발치 히트박스 (충돌용)
    hp: PLAYER_BASE_MAX_HP, maxHp: PLAYER_BASE_MAX_HP, dead: false,
    invT: 0, kbT: 0,
    atkT: 0, atkAnim: 0, atkCD: 0,
    combo: 0, comboRestT: 0, comboWindowT: 0, // 4타 콤보: 피니시 후 휴식(0.3초), 타 사이 재입력 대기창
    animT: 0, animFrame: 0, animName: "idle", // 숨쉬기는 대기 상태에서 바로·계속 반복 재생
    stamina: STAMINA_MAX, staminaWarnT: 0,
};
const COMBO_MAX = 4;
const COMBO_REST_FRAMES = 18;   // 피니시(4타) 후 후딜 0.3초 @60fps
const COMBO_WINDOW_FRAMES = 24; // 타 사이 재입력 대기창 0.4초 — 이 안에 C 안 누르면 콤보 리셋
// 16프레임(PixelLab Frame Count는 14/16만 선택 가능, keep first frame 끔 → 전부 콤보용)을 4타로 배분: 3-4-4-5
const ATTACK_SEGMENTS = [3, 4, 4, 5]; // 합 16, [i] = (i+1)타의 프레임 수
const ATTACK_FRAME_OFFSET = 0; // 참조프레임 없음, 0번부터 바로 콤보 시작
function attackSegmentRange(combo) {
    let start = ATTACK_FRAME_OFFSET;
    for (let i = 0; i < combo - 1; i++) start += ATTACK_SEGMENTS[i] || 0;
    const size = ATTACK_SEGMENTS[combo - 1] || ATTACK_SEGMENTS[ATTACK_SEGMENTS.length - 1];
    return { start, size };
}
const ATTACK_ANIM_TOTAL = ATTACK_SEGMENTS.reduce((a, b) => a + b, 0); // 16 — 타이밍 계산은 실 콤보 분량 기준

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
    // 공속 = 직업 기본 × (1 + 아이템 누적 + 무기 보너스)
    const effAtkSpd = prof.atkSpd * (1 + (Game.pAtkSpdBonus || 0) + equipAtkSpd());
    // 4타 콤보 — 4타째 이후 짧은 휴식(0.3초), 그 뒤 다시 1타부터
    p.combo = (p.combo % COMBO_MAX) + 1;
    if (p.combo === COMBO_MAX) p.comboRestT = COMBO_REST_FRAMES;
    // 재생 길이는 "이번 타의 세그먼트 프레임 수" 기준 (전체 15프레임이 아니라 해당 구간만) — 공속 빠를수록 빨리 재생
    const segSize = ATTACK_SEGMENTS[p.combo - 1] || ATTACK_SEGMENTS[ATTACK_SEGMENTS.length - 1];
    const animFps = 16 * effAtkSpd; // 14→느림, 20→빠름 사이 조정
    p.atkAnimMax = Math.max(4, Math.round(60 / animFps * segSize));
    p.atkAnim = p.atkAnimMax;
    p.atkT = Math.round(p.atkAnimMax * 0.6); // 이동 잠금은 스윙 앞부분만
    p.atkCD = Math.max(p.atkAnimMax, Math.round(prof.atkCD / effAtkSpd / COMBO_MAX));
    p.animName = "attack"; p.animFrame = 0; p.animT = 0;
    if (typeof playSfx === 'function') playSfx(p.combo === COMBO_MAX ? 'combo_high' : 'atk');
    const [dx, dy] = DIR_VEC[p.facing];
    const cx = p.x, cy = p.y;

    // 원거리 직업(마법사·발키리)은 근접 부채꼴 대신 투사체를 발사한다
    if (prof.ranged) {
        const ang = Math.atan2(dy, dx);
        const sp = prof.shotSpeed || 8;
        // 발키리는 살짝 퍼지는 연사, 마법사는 정확한 관통탄
        const spread = Game.pClass === 4 ? (Math.random() - 0.5) * 0.12 : 0;
        const pierce = Game.pClass === 2 ? 2 : 0;
        spawnPBullet(cx, cy - 14, Math.cos(ang + spread) * sp, Math.sin(ang + spread) * sp,
            Math.round(prof.range / sp) + 10, 5, playerAtkDamage(prof), pierce, prof.tint || "#cceeff");
        return;
    }

    // 근접 — 판정 원점은 캐릭터 위치 자체(몸 앞으로 안 밀어냄). 안 그러면 적이 몸에 딱 붙었을 때
    // 원점보다 뒤쪽(반대 각도)이 돼서 각도 검사에 걸려 영원히 안 맞는 데드존이 생김.
    const range = prof.range, arc = prof.arc || 60; // 부채꼴 판정 반각(도) — 직업별로 다름
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
        let dmg = playerAtkDamage(prof);
        // 피니시(4타)는 후딜이 긴 만큼 데미지 보너스 — 콤보 완주 보상 (유물로 배율 상승)
        if (p.combo === COMBO_MAX) dmg = Math.round(dmg * (Game.pFinisherMul || 1.7));
        const isCrit = Math.random() < (prof.crit + (Game.pCritBonus || 0) + equipCrit());
        hitE(e, isCrit ? Math.round(dmg * (Game.pCritDmg || 2)) : dmg, dx >= 0 ? 1 : -1, isCrit);
        hitAny = true;
    });
    // 타격 파티클 — 명중했을 때만, 개수·범위 축소(정신사나움 방지)
    Game.camShake = hitAny ? 4 : 0;
    if (hitAny) {
        for (let i = 0; i < 4; i++) addPart(cx + (Math.random()-0.5)*12, cy + (Math.random()-0.5)*12, "#cceeff", 12, 2);
    }
}

// 평타 1타 기본 피해 — 직업 기본값 + 아이템/무기 가산 + 상황 배율.
// 근접·원거리·스킬이 전부 여기를 거쳐야 밸런스가 한 곳에서 관리된다.
function playerAtkDamage(prof) {
    prof = prof || classProfile(Game.pClass);
    let dmg = prof.dmgMin + Math.floor(Math.random() * (prof.dmgMax - prof.dmgMin + 1))
            + (Game.pAtkBonus || 0) + equipAtk();
    // 버서커 고유 특성 / 유물 "광포한 유전자" — 잃은 체력에 비례해 피해 증가
    const rage = (prof.rageDmg ? 0.5 : 0) + (Game.pLowHpDmg ? 0.6 : 0);
    if (rage > 0) dmg = Math.round(dmg * (1 + (1 - Player.hp / Player.maxHp) * rage));
    return dmg;
}

// 플레이어 피격 — 패링/가드는 아직 미이식(V1 takeDmg 참고), 보호막·가시·부활 유물만 반영
function hitPlayer(dmg, eObj) {
    const p = Player;
    if (p.dead || p.invT > 0 || p.dashT > 0) return;
    // 방어력 = 아이템 누적 + 방어구 보너스 (고정 감산, 최소 1 피해는 들어감)
    dmg = Math.max(1, dmg - (Game.pDefBonus || 0) - equipDef());

    // 유물 "가시 갑옷": 가해자에게 반사 — 장판/투사체처럼 실체가 없는 출처는 제외
    if (Game.pThorns > 0 && eObj && eObj.active && !eObj.dead) {
        hitE(eObj, Game.pThorns, 1, false);
    }

    // 보호막이 있으면 먼저 소모 (유물 "불굴의 방벽")
    if (Game.pShield > 0) {
        const absorbed = Math.min(Game.pShield, dmg);
        Game.pShield -= absorbed;
        dmg -= absorbed;
        addText(p.x + 16, p.y - 34, `방벽 -${absorbed}`, "#66ccff", 32, 11);
    }

    if (dmg > 0) p.hp -= dmg;
    p.invT = 72; p.kbT = 12;   // 피격 무적 1.2초 — 연속 피격으로 순식간에 녹는 걸 방지
    const ex = p.x - (eObj ? eObj.x : p.x), ey = p.y - (eObj ? eObj.y : p.y);
    const d = Math.hypot(ex, ey) || 1;
    p.vx = (ex / d) * 4; p.vy = (ey / d) * 4;
    Game.camShake = 10;
    if (typeof playSfx === 'function') playSfx('dmg');
    if (dmg > 0) {
        addText(p.x, p.y - 20, "-" + dmg, "#ff4444", 35, 16);
        for (let i = 0; i < 10; i++) addPart(p.x, p.y - 10, "#ff2222", 18, 3);
    }

    if (p.hp <= 0) {
        // 유물 "두 번째 생": 체력 50%로 부활
        if (Game.pRevive > 0) {
            Game.pRevive--;
            p.hp = Math.round(p.maxHp * 0.5);
            p.invT = 120;
            addText(p.x, p.y - 40, "부활!", "#ffaa00", 70, 22);
            for (let i = 0; i < 32; i++) addPart(p.x, p.y - 10, "#ffaa00", 34, 5);
            Game.camShake = 24;
            if (typeof playSfx === 'function') playSfx('unlock');
        } else {
            p.hp = 0; p.dead = true;
            if (typeof playSfx === 'function') playSfx('player_die');
            for (let i = 0; i < 40; i++) addPart(p.x, p.y - 10, "#ff0000", 40, 5);
        }
    }
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
    if (p.skillCD > 0) p.skillCD--;
    if (p.dead) return;
    if (dn("KeyC") && p.kbT <= 0) tryPlayerAttack();
    if (pr("ShiftLeft", "ShiftRight")) tryPlayerSkill();

    let mx = 0, my = 0;
    // 공격 중엔 스윙 전체(atkAnim) 동안 제자리 고정 — atkT(앞부분)만 잠그면 회수 동작 구간에서
    // 살짝 움직이는 게 티가 나서 atkAnim 전체로 확장. comboRestT(피니시 후딜)도 동일하게 고정.
    if (p.atkAnim <= 0 && p.comboRestT <= 0) {
        if (dn("ArrowLeft", "KeyA")) mx = -1;
        if (dn("ArrowRight", "KeyD")) mx = 1;
        if (dn("ArrowUp", "KeyW")) my = -1;
        if (dn("ArrowDown", "KeyS")) my = 1;
    }

    const dname = dirFromVec(mx, my);
    if (dname) p.facing = dname;

    // 이동속도 = 기본 × (1 + 아이템 누적 + 방어구 보너스)
    let sp = p.speed * (1 + (Game.pMoveSpdBonus || 0) + equipMoveSpd());
    if (mx !== 0 && my !== 0) sp *= 0.707; // 대각선 정규화

    // 스프린트: Z 유지 — 이동속도 2배, 스태미나 소모 없음 (풀스프린트 애니 사용)
    const sprintHeld = dn("KeyZ") && (mx !== 0 || my !== 0) && p.dashT <= 0;
    if (sprintHeld) sp *= 2;

    // 회피(구 대시): Space — 짧은 무적 突진 + 잔상, 스태미나 소모
    // 유물 "유령 걸음"은 소모를 줄이고(pDashCostMul) 무적 시간을 늘린다(pDashInvBonus)
    if (p.dashCD > 0) p.dashCD--;
    const dashCost = STAMINA_DASH * (Game.pDashCostMul || 1);
    if (dn("Space") && p.dashCD <= 0 && (mx !== 0 || my !== 0)) {
        if (p.stamina >= dashCost) {
            p.stamina -= dashCost;
            p.dashT = 10 + (Game.pDashInvBonus || 0); p.dashCD = 28;
            if (typeof playSfx === 'function') playSfx('dash');
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
        // 잔상도 그 순간의 애니 프레임을 그대로 남긴다 (정지 포즈로 남으면 본체와 자세가 달라 어색)
        if (p.dashT % 2 === 0) dashGhosts.push({
            x: p.x, y: p.y, facing: p.facing,
            anim: p.animName, frame: p.animFrame,
            life: 16, max: 16,
        });
        // 회피가 끝나는 순간, 대처할 시간을 주기 위해 무적을 조금 더 남긴다.
        // invT는 피격 무적과 같은 값이라 점멸 연출·데미지 차단이 그대로 적용된다.
        if (p.dashT <= 0) p.invT = Math.max(p.invT, DASH_INV_AFTER);
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
        // 회피(대시) 중에는 달리는 모션을 그대로 유지 — 예전엔 idle로 빠져서 정자세로 미끄러졌다
        const moving = (mx !== 0 || my !== 0);
        const targetAnim = p.dashT > 0 ? "sprint"
            : (moving ? (sprintHeld ? "sprint" : "walk") : "idle");
        if (p.animName !== targetAnim) { p.animName = targetAnim; p.animT = 0; p.animFrame = 0; }

        const fc = animFrameCount(p.animName);
        const fps = p.animName === "sprint" ? 16 : p.animName === "walk" ? 12 : 8; // idle=숨쉬기, 바로 계속 반복
        p.animT++;
        if (p.animT >= 60 / fps) { p.animT = 0; p.animFrame = (p.animFrame + 1) % fc; }
    }
}
