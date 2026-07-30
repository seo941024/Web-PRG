// ==========================================
// 전투 물리 엔진 및 오브젝트 풀링 (Combat & Physics)
// ==========================================

// 오브젝트 풀에서 비활성 슬롯을 재사용하거나 없으면 새로 추가
function getObj(arr) {
    let o = arr.find(x => !x.active);
    if (!o) { o = { active: false }; arr.push(o); }
    o.active = true;
    return o;
}

// overlap()은 core.js에 정의 (탑다운 재구축 시 이동)

// 탑다운 벽 충돌 — 축별로 분리 이동해 벽에 붙어 미끄러지게 처리
// (기존 사이드스크롤 resolveAABB의 발판/onGround 개념 제거, 단순 사각형 벽 충돌로 교체)
function resolveWalls(e, walls) {
    const hb = e.hb || { w: e.w, h: e.h };
    const test = (nx, ny) => {
        const bx = nx - hb.w / 2, by = ny - hb.h / 2;
        for (const w of walls) {
            if (bx < w.x + w.w && bx + hb.w > w.x && by < w.y + w.h && by + hb.h > w.y) return true;
        }
        return false;
    };
    if (!test(e.x + e.vx, e.y)) e.x += e.vx; else e.vx = 0;
    if (!test(e.x, e.y + e.vy)) e.y += e.vy; else e.vy = 0;
}

// 플레이어 투사체 생성 — sk: 관통 여부(Night Hollow 등에서 nhHitCount 추적)
function spawnBullet(x, y, vx, vy, life, r, sk, dmg, col) {
    const b = getObj(Game.bullets);
    b.x = x; b.y = y; b.vx = vx; b.vy = vy;
    b.life = life; b.maxLife = life; b.r = r; b.sk = sk; b.dmg = dmg;
    b.col = col || null;
    b.nhHitCount = 0; b.nhLastHit = {};
    b.isCard = false; b.cardCol = null;
    return b;
}

// 적 투사체 생성 — grav:중력 여부, unblockable:가드 불가, isArrow:화살형, isBomb:낙하 폭탄
function spawnEBullet(x, y, vx, vy, life, r, dmg, grav=false, unblockable=false, isArrow=false, isBomb=false) {
    const b = getObj(Game.eBullets);
    b.x = x; b.y = y; b.vx = vx; b.vy = vy;
    b.life = life; b.r = r; b.dmg = dmg;
    b.grav = grav; b.unblockable = unblockable; b.isArrow = isArrow; b.isBomb = isBomb;
}

// 레이저 생성 — life 동안 유지, hitTargets로 동일 대상 중복 피격 방지
function spawnLaser(x, y, w, h, life, color, dmg, isPlayer=false, unblockable=false) {
    const l = getObj(Game.lasers);
    l.x = x; l.y = y; l.w = w; l.h = h;
    l.life = life; l.maxLife = life; l.color = color; l.dmg = dmg;
    l.isPlayer = isPlayer; l.unblockable = unblockable;
    l.hitTargets = new Set();
}

// 파티클 생성 — 무작위 방향으로 튀어나감
function addPart(x, y, col, life, size=3) {
    const p = getObj(Game.parts);
    p.x = x; p.y = y;
    // 속도 범위 축소(±4→±2) — 예전 사이드스크롤 값이 탑다운 좁은 화면에선 너무 정신사나웠음
    p.vx = (Math.random() - 0.5) * 4;
    p.vy = (Math.random() - 0.5) * 4;
    p.col = col; p.life = life; p.ml = life; p.size = size;
}

// 위로 떠오르는 플로팅 텍스트 생성 (데미지 숫자, 상태 표시 등)
function addText(x, y, text, color, life, size=14, vx=0, vy=1.5) {
    const t = getObj(Game.texts);
    t.x = x; t.y = y; t.text = text; t.color = color;
    t.life = life; t.size = size; t.vx = vx; t.vy = vy;
}

// 아이템 드롭 생성 (hp, atk_drop 등)
function addItem(x, y, w, h, vy, life, type) {
    const i = getObj(Game.items);
    i.x = x; i.y = y; i.w = w; i.h = h;
    i.vy = vy; i.life = life; i.type = type;
    i.equip = null; // 장비 드롭이면 dropEquipItem이 채움 — 재사용 슬롯의 이전 값이 남지 않게 초기화
    return i;
}

// 적 투사체 이동/충돌 갱신 — 탑다운이라 grav/isArrow 등 사이드스크롤 전용 플래그는 무시하고 직선 이동만 처리
function updateEBullets(walls) {
    Game.eBullets.forEach(b => {
        if (!b.active) return;
        b.x += b.vx; b.y += b.vy;
        if (--b.life <= 0) { b.active = false; return; }
        for (const w of walls) {
            if (b.x > w.x && b.x < w.x + w.w && b.y > w.y && b.y < w.y + w.h) { b.active = false; return; }
        }
        if (!Player.dead) {
            const dx = b.x - Player.x, dy = b.y - Player.y;
            const hitR = b.r + Math.max(Player.hb.w, Player.hb.h) / 2;
            if (dx * dx + dy * dy < hitR * hitR) {
                hitPlayer(b.dmg, { x: b.x, y: b.y });
                b.active = false;
            }
        }
    });
}

// ── 지면 장판(hazard) — 예고(warnT) 후 일정 시간(activeT) 동안 밟으면 피해 ──
// 보스의 장판 패턴에 사용. 예고 링이 차오르는 동안은 무해하므로 미리 피할 수 있다.
function spawnHazard(x, y, r, warnT, activeT, dmg, col) {
    const h = getObj(Game.hazards);
    h.x = x; h.y = y; h.r = r;
    h.warnT = warnT; h.activeT = activeT; h.maxWarn = warnT;
    h.dmg = dmg; h.col = col || "#ff6a1e";
    h.tickCD = 0; h.blown = false;
    return h;
}

function updateHazards() {
    Game.hazards.forEach(h => {
        if (!h.active) return;
        if (h.warnT > 0) {
            h.warnT--;
            if (h.warnT === 0) {
                // 폭발 순간 연출 — 이후 activeT 동안 잔불로 남아 계속 위험
                h.blown = true;
                for (let i = 0; i < 14; i++) addPart(h.x, h.y, h.col, 20, 4);
                Game.camShake = Math.max(Game.camShake || 0, 6);
            }
            return;
        }
        if (h.tickCD > 0) h.tickCD--;
        if (!Player.dead && h.tickCD <= 0) {
            const dx = Player.x - h.x, dy = Player.y - h.y;
            if (dx * dx + dy * dy < h.r * h.r) {
                hitPlayer(h.dmg, { x: h.x, y: h.y });
                h.tickCD = 30; // 같은 장판에 계속 서 있어도 0.5초마다 한 번만
            }
        }
        if (--h.activeT <= 0) h.active = false;
    });
}

// 몹 처치 시 아이템 드롭 — skull_V1 mob.js의 드롭 확률/타입 로직 이식(중력 낙하만 제거, 탑다운은 제자리에 둥둥)
// 무기·방어구는 낮은 확률로만(엘리트는 상향), 나머지는 기존 스탯/HP 오브
function dropLoot(e) {
    // 장비 드롭 판정을 먼저 — 나오면 그것만 떨어뜨림
    const equipChance = e.isElite ? 0.25 : Game.pEquipDropRate;
    if (Math.random() < equipChance) {
        const kind = Math.random() < 0.5 ? "weapon" : "armor";
        // 티어는 현재 스테이지 기준, 엘리트는 한 단계 위가 나올 수도 있음
        const tier = Game.stageN + (e.isElite && Math.random() < 0.4 ? 1 : 0);
        dropEquipItem(e.x, e.y, kind, tier);
        return;
    }
    if (!(Math.random() < Game.pDropRate || e.isElite)) return;
    let type = "hp";
    const roll = Math.random();
    if (e.isElite) {
        if (roll < 0.2) type = "atk_drop";
        else if (roll < 0.4) type = "def_drop";
        else if (roll < 0.6) type = "atk_spd_drop";
        else if (roll < 0.8) type = "move_spd_drop";
        else type = "hp";
    } else {
        if (roll < 0.4) type = "hp";
        else if (roll < 0.55) type = "atk_drop";
        else if (roll < 0.7) type = "def_drop";
        else if (roll < 0.85) type = "atk_spd_drop";
        else type = "move_spd_drop";
    }
    addItem(e.x, e.y, 10, 10, 0, 600, type);
}

// 스테이지(보스) 클리어 보상 — 무기·방어구 확정 1개씩 + 회복 오브
function dropStageClearLoot(e) {
    dropEquipItem(e.x - 40, e.y, "weapon", Game.stageN);
    dropEquipItem(e.x + 40, e.y, "armor", Game.stageN);
    addItem(e.x, e.y + 44, 10, 10, 0, 900, "hp");
    addText(e.x, e.y - 78, "스테이지 클리어 보상!", "#ffcc00", 110, 14);
}

// 장비 아이템을 필드에 떨어뜨림 — 장비 데이터는 item.equip에 실어둔다
function dropEquipItem(x, y, kind, tier) {
    const eq = rollEquip(kind, tier);
    if (!eq) return;
    const it = addItem(x, y, 12, 12, 0, 900, kind === "weapon" ? "weapon_drop" : "armor_drop");
    it.equip = eq;
    return it;
}

const ITEM_STYLE = {
    hp:            { col: "#33ff66", label: "H" },
    atk_drop:      { col: "#ff5544", label: "A" },
    def_drop:      { col: "#44aaff", label: "D" },
    atk_spd_drop:  { col: "#ffdd44", label: "S" },
    move_spd_drop: { col: "#44ffee", label: "M" },
    weapon_drop:   { col: "#ff9c2b", label: "W" },
    armor_drop:    { col: "#8fb4ff", label: "R" },
};

// 아이템은 제자리에 떠 있다가 수명 만료 시 소멸, 플레이어가 닿으면 즉시 효과 적용 후 소멸.
// 유물 "끌어당기는 영혼"(pMagnet)이 있으면 일정 범위 안의 아이템이 플레이어를 향해 빨려온다.
function updateItems() {
    const magnetR = Game.pMagnet || 0;
    Game.items.forEach(it => {
        if (!it.active) return;
        if (--it.life <= 0) { it.active = false; return; }

        if (magnetR > 0 && !Player.dead) {
            const mdx = Player.x - it.x, mdy = Player.y - it.y;
            const md = Math.hypot(mdx, mdy);
            if (md < magnetR && md > 1) {
                const pull = Math.min(5, 1.2 + (1 - md / magnetR) * 4);
                it.x += (mdx / md) * pull;
                it.y += (mdy / md) * pull;
            }
        }

        const pRect = { x: Player.x - Player.hb.w / 2, y: Player.y - Player.hb.h / 2, w: Player.hb.w, h: Player.hb.h };
        const iRect = { x: it.x - it.w / 2, y: it.y - it.h / 2, w: it.w, h: it.h };
        if (!Player.dead && overlap(pRect, iRect)) {
            applyItemEffect(it);
            it.active = false;
        }
    });
}

function applyItemEffect(it) {
    const p = Player;
    if (typeof playSfx === 'function') playSfx('item');
    if (it.type === "weapon_drop" || it.type === "armor_drop") {
        if (it.equip) equipItem(it.equip);
        return;
    }
    if (it.type === "hp") {
        if (p.hp < p.maxHp) { p.hp = Math.min(p.maxHp, p.hp + 20); addText(p.x, p.y - 20, "+20 HP", "#33ff66", 40, 14); }
        else { Game.score += 20; addText(p.x, p.y - 20, "점수 +20", "#aaaaff", 40, 14); }
    } else if (it.type === "atk_drop") {
        Game.pAtkBonus += 2; addText(p.x, p.y - 20, "공격력 증가!", "#ff5544", 40, 14);
    } else if (it.type === "def_drop") {
        Game.pDefBonus += 1; addText(p.x, p.y - 20, "방어력 증가!", "#44aaff", 40, 14);
    } else if (it.type === "atk_spd_drop") {
        Game.pAtkSpdBonus += 0.06; addText(p.x, p.y - 20, "공격 속도 증가!", "#ffdd44", 40, 14);
    } else if (it.type === "move_spd_drop") {
        Game.pMoveSpdBonus += 0.06; addText(p.x, p.y - 20, "이동 속도 증가!", "#44ffee", 40, 14);
    }
    for (let i = 0; i < 8; i++) addPart(p.x, p.y, ITEM_STYLE[it.type].col, 16, 3);
}

// 파티클/텍스트 풀 업데이트 (수명 감소·이동, 없으면 생성만 되고 영원히 화면에 안 나옴)
function updateFx() {
    Game.parts.forEach(pt => {
        if (!pt.active) return;
        pt.x += pt.vx; pt.y += pt.vy; pt.vx *= 0.9; pt.vy *= 0.9;
        if (--pt.life <= 0) pt.active = false;
    });
    Game.texts.forEach(t => {
        if (!t.active) return;
        t.x += t.vx; t.y -= t.vy;
        if (--t.life <= 0) t.active = false;
    });
}

// 몬스터 피격 처리
// 좌표 규약(탑다운): e.x = 몸 중앙 x, e.y = 발치 y. 스프라이트는 e.y 위로 그려지므로
// 텍스트/파티클은 e.y에서 위로 띄운다. (V1 사이드스크롤의 e.w/e.h 기준 좌표를 쓰면 NaN이 됨)
function hitE(e, dmg, facing, isCrit, extraDmg = 0) {
    if (e.dead) return;

    // 슈퍼아머(탱커·엘리트·보스)는 넉백 없이 맞음
    const hasSuperArmor = !!e.superArmor;

    // 일반 몹 피격 무적시간 — 다단히트로 즉사하지 않게 짧게 둠
    if (!e.isBoss) {
        if ((e.hitInv || 0) > 0) return;
        e.hitInv = 8;
    }

    const extraDmgAmt = Math.floor(dmg * extraDmg);
    const finalDmg = Math.floor(dmg + extraDmgAmt);
    e.hp -= finalDmg;

    // 통일된 타격 피드백: 모든 직업·공격이 hitE를 거치므로 여기서 일관된 "손맛" 부여
    e.flash = isCrit ? 9 : 6;
    // 치명타는 화면 멈춤(hitStop) 없이 가벼운 셰이크만 — 치명타율이 높은 도적에서 게임이 끊겨 보였음
    if (isCrit) Game.camShake = Math.max(Game.camShake || 0, 3);

    // 넉백 — 플레이어 반대 방향으로 실제 벡터로 밀림 (유물 "묵직한 스윙"이 배율 증가)
    if (!hasSuperArmor) {
        e.kbT = 10;
        const kx = e.x - Player.x, ky = e.y - Player.y;
        const kd = Math.hypot(kx, ky) || 1;
        const kMul = 4 * (Game.pKnockbackMul || 1);
        e.vx = (kx / kd) * kMul;
        e.vy = (ky / kd) * kMul;
    }

    addText(e.x, e.y - 26, String(finalDmg), isCrit ? "#ffcc00" : "#ffffff", 40, isCrit ? 24 : 16);
    if (extraDmgAmt > 0) addText(e.x + 18, e.y - 12, "+" + extraDmgAmt, "#999999", 35, 10);

    for (let i = 0; i < 10; i++) addPart(e.x, e.y - 12, "#ff0000", 15, 3);
    if (typeof playSfx === 'function') playSfx('hit');

    // 유물 "피에 대한 갈증": 확률로 체력 회복
    if (Game.pLifesteal > 0 && Math.random() < Game.pLifesteal && Player.hp < Player.maxHp) {
        Player.hp = Math.min(Player.maxHp, Player.hp + 3);
        addText(Player.x - 18, Player.y - 30, "+3", "#33ff66", 26, 11, -0.4, -1.3);
    }

    if (e.hp <= 0) {
        e.hp = 0;
        // 엘리트 처치 누적 (직업 해금 조건은 탑다운에 아직 미이식 — 카운터만 저장)
        if (e.isElite) {
            Game.totalEliteKills = (Game.totalEliteKills || 0) + 1;
            localStorage.setItem("skull_eliteKills", Game.totalEliteKills);
        }
        e.dead = true;
    }
}

// ⚠️ 미이식(호출 금지) — skull_V1 사이드스크롤 전용 플레이어 피격 처리.
// 탑다운에서는 player.js의 hitPlayer()를 쓴다. 아래 코드는 Game.player·패링·가드·스태미나 등
// 아직 탑다운에 없는 구조에 의존하므로 그대로 호출하면 예외가 난다.
// (패링/가드 시스템을 나중에 이식할 때 참고 자료로만 남겨둠 — systems.js와 동일한 취급)
function takeDmg(dmg, eObj, unblockable=false, noParry=false) {
    const p = Game.player;
    if (!p || p.dead) return;
    // unblockable(낙사 등)이면 invT/dashT 무시
    if (!unblockable && (Game.invT > 0 || p.dashT > 0)) return;
    // 튜토리얼: 체력 무적 + 일반 피격과 동일한 85프레임 무적 부여
    // 무적 간격이 너무 짧으면 TUTORIAL 텍스트가 도배되므로 정상 무적시간 적용
    if (Game.isTutorial) {
        Game.invT = 85;
        p.kbT = 20;
        p.vx  = (eObj ? (p.x < eObj.x ? -1 : 1) : -p.facing) * 4;
        p.vy  = -3;
        Game.camShake = 8;
        addText(p.x, p.y - 20, "무적", "#88ffcc", 40, 13);
        for (let i = 0; i < 8; i++) addPart(p.x + 7, p.y + 9, "#88ffcc", 18, 3);
        return;
    }

    // 1. 패링 성공 (noParry면 패링 차단)
    if (!unblockable && !noParry && p.parryT > 0) {
        Game.hitStop = 8;
        if (typeof playSfx === 'function') playSfx('parry');
        Game.pMp = Math.min(Game.pMaxMp, Game.pMp + Game.pParryMp);
        addText(p.x, p.y - 20, "패링!", "#ffff00", 50, 16);
        // 패링 누적 카운터
        Game.totalParryCount = (Game.totalParryCount || 0) + 1;
        localStorage.setItem("skull_parryCount", Game.totalParryCount);
        _checkUnlocks();
// 보스: 체간 50 / 일반몹: 현재HP 30% + 즉시 기절
        if (eObj) {
            if (eObj.isBoss && typeof applyPoiseHit === 'function') {
                applyPoiseHit(eObj, 50);
            } else if (!eObj.isBoss) {
                // 즉시 기절 먼저 (hitE가 stun 해제하지 않도록)
                eObj.stun  = true;
                eObj.stunT = 90;
                eObj.vx    = 0;
                eObj.kbT   = 90;
                // 30% 확정 피해 — hitE 경유로 정상 사망 처리 보장
                const parryDmg = Math.max(1, Math.floor(eObj.hp * 0.30));
                if (typeof hitE === 'function') hitE(eObj, parryDmg, p.facing, false);
                addText(eObj.x + eObj.w/2, eObj.y - 30, "기절!", "#ffee00", 60, 16);
            }
        }

        p.vy  = -3; p.kbT = 12;
        p.vx  = (eObj ? (p.x < eObj.x ? -1 : 1) : -p.facing) * 2;
        Game.invT = 60;

        if (eObj && !eObj.isBoss) { eObj.vx = (eObj.x < p.x ? -1 : 1) * 4; eObj.vy = -3; }
        return;
    }

    // 2. 가드
    if (!unblockable && p.guarding) {
        // 가드 중 스태미나 추가 소모 — 연속 맞으면 가드 브레이크 유도
        if (typeof consumeStamina === 'function') consumeStamina(20);
        if ((p.stamina || 0) <= 0 && typeof _triggerGuardBreak === 'function') {
            _triggerGuardBreak(p);
            // 가드 브레이크 시엔 dmg 절반은 그냥 들어감
            dmg = Math.floor(dmg * 0.5);
        } else {
            addText(p.x, p.y - 20, "가드", "#00ccff", 40, 14);
            p.kbT = 15; p.vy = -3;
            p.vx  = (eObj ? (p.x < eObj.x ? -1 : 1) : -p.facing) * 3;
            if (eObj && !eObj.isBoss) { eObj.kbT = 15; eObj.vx = (eObj.x < p.x ? -1 : 1) * 2; eObj.vy = -2; }
            if (typeof playSfx === 'function') playSfx('hit');
            Game.invT = 60;
            return;
        }
    }

    // 3. 맨몸 피격 (방어력: 감소율 = def / (def + 60), 최대 70% 감소)
    dmg = Math.floor(dmg * (Game.pDmgReduction || 1));
    const _def = Game.pBaseDef || 0;
    const _defRate = _def >= 0 ? _def / (_def + 60) : Math.max(-0.3, _def / 20);
    dmg = Math.max(1, Math.floor(dmg * (1 - _defRate)));

    p.kbT = 20;
    p.vx  = (eObj ? (p.x < eObj.x ? -1 : 1) : -p.facing) * 5;
    p.vy  = -4;
    Game.hitStop = 15; Game.camShake = 20;
    if (typeof playSfx === 'function') playSfx('dmg');
    // 혈귀: 피격해도 콤보 유지 (혈기 스택 쌓기 & 연계 플레이 보상)
    if (Game.pClass !== 6) { Game.comboCount = 0; Game.comboTimer = 0; }

    // 낙사(unblockable)는 이미 invT를 무시하므로 일반 피격/환경 피해 무적 통일
    const invDur = eObj ? 60 : 15;

    // 가시 갑옷 반사
    if (Game.pReflectDmg > 0 && eObj && !eObj.isBoss) hitE(eObj, Game.pReflectDmg, p.facing, false);

    // 쉴드 먼저 차감
    if (Game.pShield > 0) {
        if (Game.pShield >= dmg) { Game.pShield -= dmg; dmg = 0; }
        else { dmg -= Game.pShield; Game.pShield = 0; }
    }

    // 리게인 없음 — 즉시 hp 차감
    if (dmg > 0) {
        p.hp -= dmg;
        addText(p.x, p.y - 20, `-${dmg}`, "#ff0000", 40, 22);
        for (let i = 0; i < 20; i++) addPart(p.x + 7, p.y + 9, "#ff0000", 25, 4);
        if (Game.runStats) Game.runStats.totalDmgTaken = (Game.runStats.totalDmgTaken || 0) + dmg;
        // 혈귀 패시브: 피격 시 혈기 스택 증가 (최대 5, 각 +12% 공격력)
        if (Game.pClass === 6) {
            Game._bloodFuryStacks = Math.min(5, (Game._bloodFuryStacks || 0) + 1);
            Game._bloodFuryTimer = 480; // 8초 지속
            addText(p.x + 14, p.y - 10, `혈기 ${Game._bloodFuryStacks}`, "#cc2244", 40, 11);
        }
    }

    Game.invT = invDur;

    // 사망/부활 판정 — 즉각적으로
    if (p.hp <= 0) {
        if (Game.pRevive > 0) {
            Game.pRevive--;
            p.hp = Math.floor(Game.pMaxHp * (Game._reviveHpMul || 0.5));
            addText(p.x, p.y - 30, "부활!", "#ffaa00", 60, 20);
            if (typeof playSfx === 'function') playSfx('item');
            for (let i = 0; i < 30; i++) addPart(p.x + 7, p.y + 9, "#ffaa00", 30, 5);
        } else {
            p.hp   = 0; p.dead = true;
            Game.gs = "dead"; Game.deadTimer = 120;
            if (typeof playSfx === 'function') playSfx('player_die');
            for (let i = 0; i < 50; i++) addPart(p.x + 7, p.y + 9, "#ff0000", 40, 6);
            if (typeof stopBGM === 'function') stopBGM();
            if (typeof playBGM === 'function') playBGM('dead');
        }
    }
}