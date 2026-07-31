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

// 적 투사체 생성 — 보스 패턴과 원거리 몹이 사용
function spawnEBullet(x, y, vx, vy, life, r, dmg) {
    const b = getObj(Game.eBullets);
    b.x = x; b.y = y; b.vx = vx; b.vy = vy;
    b.life = life; b.r = r; b.dmg = dmg;
}

// 플레이어 투사체 생성 — 마법사·발키리 평타와 일부 스킬이 사용.
// pierce: 추가 관통 횟수(0이면 첫 명중에 소멸). hitSet으로 같은 적 중복 타격을 막는다.
function spawnPBullet(x, y, vx, vy, life, r, dmg, pierce, col) {
    const b = getObj(Game.pBullets);
    b.x = x; b.y = y; b.vx = vx; b.vy = vy;
    b.life = life; b.r = r; b.dmg = dmg;
    b.pierce = pierce || 0;
    b.col = col || "#cceeff";
    b.hitSet = new Set();
    return b;
}

// 플레이어 투사체 갱신 — 벽에 막히고, 적에게 명중하면 hitE를 거친다(치명타·흡혈 등 공통 처리)
function updatePBullets(walls) {
    const prof = classProfile(Game.pClass);
    Game.pBullets.forEach(b => {
        if (!b.active) return;
        b.x += b.vx; b.y += b.vy;
        if (--b.life <= 0) { b.active = false; return; }
        for (const w of walls) {
            if (b.x > w.x && b.x < w.x + w.w && b.y > w.y && b.y < w.y + w.h) { b.active = false; return; }
        }
        for (const e of Game.enemies) {
            if (!e.active || e.dead || b.hitSet.has(e)) continue;
            const dx = e.x - b.x, dy = (e.y - 14) - b.y;
            const rr = b.r + Math.max(e.hb.w, e.hb.h) / 2 + 4;
            if (dx * dx + dy * dy > rr * rr) continue;
            b.hitSet.add(e);
            const isCrit = Math.random() < (prof.crit + (Game.pCritBonus || 0) + equipCrit());
            hitE(e, isCrit ? Math.round(b.dmg * (Game.pCritDmg || 2)) : b.dmg, b.vx >= 0 ? 1 : -1, isCrit);
            for (let i = 0; i < 4; i++) addPart(b.x, b.y, b.col, 12, 3);
            if (b.pierce-- <= 0) { b.active = false; return; }
        }
    });
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
        // 티어는 현재 스테이지 기준(2스테이지당 1티어), 엘리트는 한 단계 위가 나올 수도 있음
        const tier = stageTier(Game.stageN) + (e.isElite && Math.random() < 0.4 ? 1 : 0);
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
    dropEquipItem(e.x - 40, e.y, "weapon", stageTier(Game.stageN));
    dropEquipItem(e.x + 40, e.y, "armor", stageTier(Game.stageN));
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

// 드롭 아이템 표시용 — 도트 아이콘 완성 전까지는 name(한글 라벨)만 실제로 쓰인다.
// col/label은 미니맵 등 잔여 참조용으로 남겨둠.
// label: 아이콘 안에 찍는 한 글자 / gain: 주우면 실제로 얼마나 오르는지(표시용, applyItemEffect와 값 일치)
const ITEM_STYLE = {
    hp:            { col: "#33ff66", label: "＋", name: "회복",     gain: "+20 HP" },
    atk_drop:      { col: "#ff5544", label: "⚔", name: "공격력",   gain: "+2" },
    def_drop:      { col: "#44aaff", label: "◈", name: "방어력",   gain: "+1" },
    atk_spd_drop:  { col: "#ffdd44", label: "≫", name: "공격속도", gain: "+6%" },
    move_spd_drop: { col: "#44ffee", label: "≡", name: "이동속도", gain: "+6%" },
    weapon_drop:   { col: "#ff9c2b", label: "⚔", name: "무기" },
    armor_drop:    { col: "#8fb4ff", label: "◈", name: "방어구" },
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
        Game.pAtkBonus += 2; addText(p.x, p.y - 20, `공격력 +2  (총 ${Game.pAtkBonus + equipAtk()})`, "#ff5544", 50, 14);
    } else if (it.type === "def_drop") {
        Game.pDefBonus += 1; addText(p.x, p.y - 20, `방어력 +1  (총 ${Game.pDefBonus + equipDef()})`, "#44aaff", 50, 14);
    } else if (it.type === "atk_spd_drop") {
        Game.pAtkSpdBonus += 0.06; addText(p.x, p.y - 20, `공격속도 +6%  (총 ${Math.round((1 + Game.pAtkSpdBonus + equipAtkSpd()) * 100)}%)`, "#ffdd44", 50, 14);
    } else if (it.type === "move_spd_drop") {
        Game.pMoveSpdBonus += 0.06; addText(p.x, p.y - 20, `이동속도 +6%  (총 ${Math.round((1 + Game.pMoveSpdBonus + equipMoveSpd()) * 100)}%)`, "#44ffee", 50, 14);
    }
    for (let i = 0; i < 8; i++) addPart(p.x, p.y, ITEM_STYLE[it.type].col, 16, 3);
}

// 파티클/텍스트 풀 업데이트 (수명 감소·이동, 없으면 생성만 되고 영원히 화면에 안 나옴)
// 마지막 타격 후 이 시간 안에 다시 맞히지 못하면 히트 콤보가 끊긴다 (1.5초)
const HIT_COMBO_HOLD = 90;

function updateFx() {
    // 히트 콤보 유지 시간 — 다 되면 0으로 끊김
    if (Game.hitComboT > 0 && --Game.hitComboT <= 0) Game.hitCombo = 0;

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

    // 실제로 적을 맞혔을 때만 오르는 히트 카운터.
    // Player.combo(4타 스윙 순번)와는 별개다 — 그건 허공을 쳐도 올라가는 "동작 단계"라
    // 화면에 콤보로 띄우면 플레이어 기대와 어긋난다(허공에 휘둘렀는데 콤보가 쌓임).
    Game.hitCombo = (Game.hitCombo || 0) + 1;
    Game.hitComboT = HIT_COMBO_HOLD;
    if (Game.hitCombo > (Game.hitComboBest || 0)) Game.hitComboBest = Game.hitCombo;

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
// 플레이어 피격 처리는 player.js의 hitPlayer()에 있다.
// V1의 takeDmg()(패링/가드/리게인/부활 포함)는 Game.player 구조 전제라 탑다운에서 호출 불가였고,
// 죽은 코드로 남아 혼란만 주므로 제거했다. 패링·가드를 이식할 때는
// skull_V1/skull/js/combat.js 의 takeDmg()와 systems.js를 참고할 것.
