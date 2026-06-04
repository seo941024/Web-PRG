// ==========================================
// 소울라이크 심화 시스템 (Poise / Regain / Stamina / Just Dodge)
// ==========================================

// ── 상수 ──────────────────────────────────
const STAMINA_MAX       = 100;
const STAMINA_REGEN     = 0.55;   // 프레임당 자연회복
const STAMINA_DASH      = 28;
const STAMINA_GUARD     = 18;
const STAMINA_ATK       = 10;
const STAMINA_SKILL     = 40;
const REGAIN_WINDOW     = 140;    // 리게인 유효 프레임 (~2.3초)
const JUST_DODGE_WINDOW = 6;      // 대쉬 직후 피격 → 저스트 회피 인정 프레임

// ── 초기화: startGame에서 호출 ─────────────
function initSystems() {
    const p = Game.player;
    if (!p) return;
    p.stamina    = STAMINA_MAX;
    p.staminaRegen = 0;
    p.grayHp     = 0;       // 리게인 대기 중인 회색 체력
    p.justDodgeT = 0;       // 저스트 회피 감지 타이머
    p.justDodgeReady = false;

    // 체간 초기화는 몹 단위로 mkEnemy/mkBoss에서 세팅
}

// ── 스태미나 업데이트 (updatePlayer에서 호출) ──
function updateStamina() {
    const p = Game.player;
    if (!p || p.dead) return;

    // 자연 회복 (가드·대쉬 중엔 느리게)
    const regenRate = (p.guarding || p.dashT > 0) ? STAMINA_REGEN * 0.2 : STAMINA_REGEN;
    p.stamina = Math.min(STAMINA_MAX, (p.stamina || 0) + regenRate);

    // 스태미나 0이면 Fat Roll 판정
    p.fatRoll = p.stamina < 15;

    // 저스트 회피 타이머 감소
    if (p.justDodgeT > 0) {
        p.justDodgeT--;
        p.justDodgeReady = p.justDodgeT > 0;
    }
}

// 스태미나 소모 헬퍼 (true = 성공, false = 스태미나 부족)
function consumeStamina(amount) {
    const p = Game.player;
    if (!p) return true;
    if ((p.stamina || 0) < amount * 0.3) return false; // 30% 미만이면 동작 불가
    p.stamina = Math.max(0, (p.stamina || 0) - amount);
    return true;
}

// ── 리게인 시스템 ──────────────────────────
// takeDmg에서 즉시 깎지 않고 grayHp에 쌓음
// 공격 명중 시 grayHp 회복, 시간 초과 시 확정 피해

function applyRegain(dmg) {
    const p = Game.player;
    if (!p) return;
    // 현재 grayHp에 추가 (최대 maxHp의 40%까지만 회색 체력으로 버퍼)
    const maxGray = Math.floor(Game.pMaxHp * 0.4);
    p.grayHp = Math.min((p.grayHp || 0) + dmg, maxGray);
    p.regainTimer = REGAIN_WINDOW;
}

function updateRegain() {
    const p = Game.player;
    if (!p || p.dead) return;
    if ((p.grayHp || 0) <= 0) return;

    p.regainTimer = Math.max(0, (p.regainTimer || 0) - 1);

    if (p.regainTimer <= 0) {
        // 시간 초과 → 회색 체력 확정 피해
        const finalDmg = p.grayHp;
        p.grayHp = 0;
        p.hp = Math.max(1, p.hp - finalDmg);
        Game.camShake = 8;
        addText(p.x, p.y - 25, `-${finalDmg}`, "#ff4400", 40, 18);
        for (let i = 0; i < 15; i++) addPart(p.x + 7, p.y + 9, "#ff4400", 20, 3);
        if (p.hp <= 1) takeDmg(0, null, true); // 사망 처리 트리거
    }
}

// 공격 명중 시 리게인 회복 (hitE 성공 시 호출)
function recoverRegain(amount) {
    const p = Game.player;
    if (!p || p.dead || (p.grayHp || 0) <= 0) return;
    const recovered = Math.min(p.grayHp, amount);
    p.grayHp -= recovered;
    p.hp = Math.min(Game.pMaxHp, p.hp + recovered);
    if (recovered > 0) addText(p.x, p.y - 15, `+${recovered}`, "#ff6600", 30, 11);
}

// ── 체간(Poise) 시스템 ───────────────────
// 적 기본 체간값: mkEnemy/mkBoss에서 세팅
// 패링/강하공격 명중 → 체간 감소 → 0이면 STUN

function getMaxPoise(e) {
    if (e.isBoss) return 200 + e.world * 80;
    if (e.isElite) return 60;
    return 30 + (e.world || 1) * 5;
}

function initPoise(e) {
    e.poise    = getMaxPoise(e);
    e.poiseMx  = e.poise;
    e.stun     = false;
    e.stunT    = 0;
}

// 체간 데미지 적용 (패링/강하공격 전용, hitE 내부에서 호출)
function applyPoiseHit(e, poiseHit) {
    if (e.stun) return;
    e.poise = Math.max(0, (e.poise || 0) - poiseHit);
    if (e.poise <= 0) {
        e.stun  = true;
        e.stunT = e.isBoss ? 80 : 120;
        e.poise = e.poiseMx;        // 체간 리셋
        addText(e.x + e.w / 2, e.y - 20, "STUN!", "#ffee00", 60, 16);
        Game.camShake = 12;
        if (typeof playSfx === 'function') playSfx('parry');
        // 스턴 중 이동 정지
        e.vx = 0; e.kbT = e.stunT;
    }
}

function updatePoise(e) {
    if (!e.stun) return;
    e.stunT--;
    if (e.stunT <= 0) {
        e.stun = false;
        e.stunT = 0;
    }
}

// 처형 가능 여부 (스턴 상태 + 플레이어 근접)
function canExecute(e) {
    return e.stun && !e.isBoss && typeof Game.player !== 'undefined' &&
        Math.abs(Game.player.x - e.x) < 60 && Math.abs(Game.player.y - e.y) < 60;
}

// 처형 실행 (C키 롱프레스 or 스턴 상태 공격)
function executeEnemy(e) {
    if (!canExecute(e)) return false;
    const dmg = Math.floor(Game.pBaseDmg * (Game.pBaseDmgMul || 1) * (Game.pFinalDmgMul || 1) * 8);
    e.hp = 0; e.dead = true;
    Game.camShake = 20; Game.hitStop = 18;
    addText(e.x + e.w / 2, e.y - 30, "FATAL STRIKE!!", "#ff0000", 80, 22);
    for (let i = 0; i < 40; i++) addPart(e.x + e.w / 2, e.y + e.h / 2, i < 25 ? "#ff0000" : "#ffaa00", 35, 5);
    if (typeof playSfx === 'function') playSfx('skill');
    Game.pMp = Math.min(Game.pMaxMp, Game.pMp + 25); // MP 보너스
    return true;
}

// ── 저스트 회피 (마녀의 시간) ───────────────
// 대쉬 시작 시 justDodgeT 세팅, 이 윈도우 안에 피격받으면 발동

function triggerJustDodge() {
    const p = Game.player;
    if (!p) return;
    Game.justDodgeActive = true;
    Game.justDodgeT = 90;       // 슬로모션 지속 (~1.5초)
    Game.slowMoT = 90;
    addText(p.x, p.y - 30, "WITCH TIME!!", "#ffee00", 70, 18);
    Game.camShake = 10;
    // 다음 공격 데미지 2배 (1회)
    Game.justDodgeDmgBonus = 2.0;
    if (typeof playSfx === 'function') playSfx('parry');
}

function updateJustDodge() {
    if (Game.justDodgeT > 0) {
        Game.justDodgeT--;
        if (Game.justDodgeT <= 0) {
            Game.justDodgeActive = false;
            Game.justDodgeDmgBonus = 1.0;
        }
    }
}

// ── 혈흔 데칼 시스템 ─────────────────────
// 최대 60개 유지, 오래된 것부터 덮어씌움

function initBloodDecals() {
    if (!Game.bloodDecals) Game.bloodDecals = [];
}

function addBloodDecal(x, y) {
    if (!Game.bloodDecals) Game.bloodDecals = [];
    if (Game.bloodDecals.length >= 60) Game.bloodDecals.shift();
    Game.bloodDecals.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y,
        r: 2 + Math.random() * 4,
        a: 0.5 + Math.random() * 0.4,
        shape: Math.floor(Math.random() * 3) // 0=원, 1=타원, 2=스플래시
    });
}

// 혈흔 렌더 (drawEnvironment 끝에서 호출)
function renderBloodDecals() {
    if (!Game.bloodDecals || Game.bloodDecals.length === 0) return;
    ctx.save();
    for (const d of Game.bloodDecals) {
        const sx = d.x - Game.camX;
        if (sx < -20 || sx > CW + 20) continue;
        ctx.globalAlpha = d.a * 0.7;
        ctx.fillStyle = "#6b0000";
        if (d.shape === 0) {
            ctx.beginPath(); ctx.arc(sx, d.y, d.r, 0, Math.PI * 2); ctx.fill();
        } else if (d.shape === 1) {
            ctx.beginPath(); ctx.ellipse(sx, d.y, d.r * 2, d.r, 0, 0, Math.PI * 2); ctx.fill();
        } else {
            // 스플래시 방울들
            for (let s = 0; s < 3; s++) {
                const ox = (s - 1) * d.r * 1.5;
                ctx.beginPath(); ctx.arc(sx + ox, d.y - s * 1.5, d.r * 0.6, 0, Math.PI * 2); ctx.fill();
            }
        }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
}

// ── 화톳불 시스템 ─────────────────────────
// 화톳불 오브젝트: { x, y, lit, usedThisWorld }
// 사용 시 HP 완전 회복 + 해당 월드 몬스터 부활

function initBonfire(x, y) {
    return { type: "bonfire", x, y, w: 24, h: 32, lit: false, used: false };
}

function useBonfire(ev) {
    if (ev.used) return;
    ev.used = true;
    ev.lit = true;
    const p = Game.player;
    p.hp = Game.pMaxHp;
    p.stamina = STAMINA_MAX;
    Game.pMp = Game.pMaxMp;
    addText(ev.x, ev.y - 30, "REST...", "#ffaa44", 100, 16);
    addText(ev.x, ev.y - 50, "적들이 부활한다!", "#ff4400", 80, 13);
    // 현재 스테이지의 몬스터 재생성
    if (typeof genStage === 'function') {
        // 플레이어 현재 체력 유지를 위해 직접 재스폰
        const w = Game.worldN, l = Game.levelN;
        const floorY = CH - 40;
        const ec = 5 + w * 3 + l * 2;
        for (let i = 0; i < ec; i++) {
            let ex = 300 + Math.random() * (Game.levelW - 500);
            let ey = floorY - 30;
            if (typeof mkEnemy === 'function') mkEnemy(ex, ey, w);
        }
    }
    playSfx('item');
    Game.camShake = 15;
    for (let i = 0; i < 30; i++) addPart(ev.x + 12, ev.y, "#ffaa44", 30, 4);
}