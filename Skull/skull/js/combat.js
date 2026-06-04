// ==========================================
// 전투 물리 엔진 및 오브젝트 풀링 (Combat & Physics)
// ==========================================

// 오브젝트 재사용(풀링) 함수 - 메모리 누수 방지
function getObj(arr) {
    let o = arr.find(x => !x.active);
    if (!o) { 
        o = { active: false }; 
        arr.push(o); 
    }
    o.active = true; 
    return o;
}

// 사각형 충돌(AABB) 감지 함수
function overlap(a, b) {
    return a.x < b.x + b.w && 
           a.x + a.w > b.x && 
           a.y < b.y + b.h && 
           a.y + a.h > b.y;
}

// 지형(발판) 충돌 처리 함수
function resolveAABB(e) {
    e.onGround = false; 
    e.riding = null;
    
    for (let t of Game.platforms) {
        // 아래로 떨어지는 중이거나, 얇은 발판을 아래서 위로 통과할 때는 충돌 무시
        if (t.drop && e.vy < 0) continue;
        if (t.drop && (e.y + e.h) > t.y + 10) continue; 

        if (overlap(e, t)) {
            let dx = (e.x + e.w / 2) - (t.x + t.w / 2);
            let dy = (e.y + e.h / 2) - (t.y + t.h / 2);
            let aw = (e.w + t.w) / 2;
            let ah = (e.h + t.h) / 2;

            let wy = aw * dy;
            let hx = ah * dx;

            if (wy > hx) {
                if (wy > -hx) { 
                    e.y = t.y + t.h; 
                    e.vy = 0; 
                } // 바닥 충돌
                else { 
                    e.x = t.x - e.w; 
                    e.vx = 0; 
                } // 왼쪽 벽 충돌
            } else {
                if (wy > -hx) { 
                    e.x = t.x + t.w; 
                    e.vx = 0; 
                } // 오른쪽 벽 충돌
                else { 
                    e.y = t.y - e.h; 
                    e.vy = 0; 
                    e.onGround = true; 
                    e.riding = t; 
                } // 천장(발판 위) 안착
            }
        }
    }
}

// 플레이어 투사체 생성
function spawnBullet(x, y, vx, vy, life, r, sk, dmg) {
    let b = getObj(Game.bullets);
    b.x = x; 
    b.y = y; 
    b.vx = vx; 
    b.vy = vy; 
    b.life = life; 
    b.maxLife = life; 
    b.r = r; 
    b.sk = sk; 
    b.dmg = dmg;
}

// 적 투사체 생성
function spawnEBullet(x, y, vx, vy, life, r, dmg, grav = false, unblockable = false, isArrow = false, isBomb = false) {
    let b = getObj(Game.eBullets);
    b.x = x; 
    b.y = y; 
    b.vx = vx; 
    b.vy = vy; 
    b.life = life; 
    b.r = r; 
    b.dmg = dmg;
    b.grav = grav; 
    b.unblockable = unblockable; 
    b.isArrow = isArrow; 
    b.isBomb = isBomb;
}

// 레이저(필살기 및 보스 패턴) 생성
function spawnLaser(x, y, w, h, life, color, dmg, isPlayer = false, unblockable = false) {
    let l = getObj(Game.lasers);
    l.x = x; 
    l.y = y; 
    l.w = w; 
    l.h = h; 
    l.life = life; 
    l.maxLife = life; 
    l.color = color; 
    l.dmg = dmg;
    l.isPlayer = isPlayer; 
    l.unblockable = unblockable; 
    l.hitTargets = new Set();
}

// 타격 파티클(이펙트) 생성
function addPart(x, y, col, life, size = 3) {
    let p = getObj(Game.parts);
    p.x = x; 
    p.y = y; 
    p.vx = (Math.random() - 0.5) * 8; 
    p.vy = (Math.random() - 0.5) * 8;
    p.col = col; 
    p.life = life; 
    p.ml = life; 
    p.size = size;
}

// 데미지 텍스트 및 UI 텍스트 생성
function addText(x, y, text, color, life, size = 14, vx = 0, vy = 1.5) {
    let t = getObj(Game.texts);
    t.x = x; 
    t.y = y; 
    t.text = text; 
    t.color = color; 
    t.life = life; 
    t.size = size;
    t.vx = vx; 
    t.vy = vy;
}

// 드롭 아이템 생성
function addItem(x, y, w, h, vy, life, type) {
    let i = getObj(Game.items);
    i.x = x; 
    i.y = y; 
    i.w = w; 
    i.h = h; 
    i.vy = vy; 
    i.life = life; 
    i.type = type;
}

// 몬스터 피격 처리 로직
function hitE(e, dmg, facing, isCrit, extraDmg = 0) {
    if (e.dead) return;
    // 투명 구간 중엔 피해 무효
    if (e.type === "phantom" && e.visible === false) {
        addText(e.x + e.w/2, e.y - 10, "MISS", "#888", 25, 12);
        return;
    }
    
    const extraDmgAmt = Math.floor(dmg * extraDmg);
    // 저스트 회피 데미지 보너스 적용
    const jdBonus = (typeof Game !== 'undefined' && Game.justDodgeDmgBonus > 1.0) ? Game.justDodgeDmgBonus : 1.0;
    if (jdBonus > 1.0) { Game.justDodgeDmgBonus = 1.0; } // 1회 소모
    const finalDmg = Math.floor((dmg + extraDmgAmt) * jdBonus);
    e.hp -= finalDmg; 
    e.flash = 6;
    
    // 리게인 회복 (공격 명중 시)
    if (typeof recoverRegain === 'function') recoverRegain(Math.ceil(finalDmg * 0.3));

    // 혈흔 데칼
    if (typeof addBloodDecal === 'function') addBloodDecal(e.x + e.w / 2, e.y + e.h - 4);

    // 패링/강하공격 시 체간 데미지 (포이즈 히트)
    // isCrit = 패링/강하공격 플래그로도 사용
    if (isCrit && typeof applyPoiseHit === 'function' && !e.dead) {
        applyPoiseHit(e, e.isBoss ? 30 : 20);
    }

    // 스턴 중인 적 공격 → 처형 판정
    if (e.stun && typeof executeEnemy === 'function') {
        executeEnemy(e);
        return;
    }

    if (!e.isBoss) { 
        e.kbT = 10; 
        e.vx = facing * (e.isElite ? 2 : 4); 
        e.vy = -3;
    }
    
    // 데미지 텍스트 띄우기
    addText(
        e.x + e.w / 2, 
        e.y - 10, 
        dmg.toString(), 
        isCrit ? "#ffcc00" : "#ffffff", 
        40, 
        isCrit ? 24 : 16
    );
    // 추가 데미지는 우측하단에 작게 회색으로 별도 표기
    if (extraDmgAmt > 0) {
        addText(
            e.x + e.w / 2 + 10,
            e.y - 2,
            "+" + extraDmgAmt,
            "#aaaaaa",
            35,
            11
        );
    }
    
    // 출혈(파티클) 효과
    for (let i = 0; i < 10; i++) {
        addPart(e.x + e.w / 2, e.y + e.h / 2, "#ff0000", 15, 3);
    }

    // 흡혈 옵션 발동
    if (Game.pLifestealChance > 0 && Math.random() < Game.pLifestealChance && Game.player.hp < Game.pMaxHp) {
        Game.player.hp = Math.min(Game.pMaxHp, Game.player.hp + 2);
        addText(Game.player.x, Game.player.y - 10, "ABSORB", "#00ff00", 30, 12);
    }
    
    // 타격 시 고정 회복 발동
    if (Game.pHealOnHit && Game.player.hp < Game.pMaxHp && Math.random() < 0.1) {
        Game.player.hp = Math.min(Game.pMaxHp, Game.player.hp + 1);
    }

    // 사망 처리
    if (e.hp <= 0) { 
        e.hp = 0;
        // Splitter: 사망 직전 분열 처리 (updateEnemies의 dead 블록보다 먼저 실행)
        if (e.type === "splitter" && !e.splitDone) {
            e.splitDone = true;
            for (let si = -1; si <= 1; si += 2) {
                const se = getObj(Game.enemies);
                se.x = e.x + si * 15; se.y = e.y;
                se.w = 12; se.h = 16; se.vx = si * 2.5; se.vy = -4;
                se.hp = Math.floor(e.maxHp * 0.3); se.maxHp = se.hp;
                se.atk = Math.floor(e.atk * 0.7);
                se.type = "melee"; se.isBoss = false; se.isElite = false;
                se.facing = si; se.fr = 0; se.frT = 0; se.flash = 0;
                se.dead = false; se.kbT = 8; se.warnT = 0; se.warnData = null;
                se.atkAnim = 0; se.world = e.world; se.isGuarding = false; se.guardT = 0;
                se.sI = 120; se.sT = 60; se.pDir = si; se.pT = 0; se.onGround = false;
                se.id = (typeof _enemyIdCounter !== 'undefined') ? _enemyIdCounter++ : Math.random();
                se.splitDone = true;
            }
            addText(e.x + e.w / 2, e.y - 15, "SPLIT!", "#ff8800", 50, 14);
        }
        e.dead = true;
    }
}

// 💡 [패치] 플레이어 데미지 피격 및 가드/패링 처리 로직 완벽 적용
function takeDmg(dmg, eObj, unblockable=false) {
    const p = Game.player; 
    if (!p || p.dead || Game.invT > 0 || p.dashT > 0) return; // 무적 상태면 무시
    
    // 💡 1. 패링 성공 시
    if (!unblockable && p.parryT > 0) {
        Game.hitStop = 8; 
        if (typeof playSfx === 'function') playSfx('parry');
        Game.pMp = Math.min(Game.pMaxMp, Game.pMp + Game.pParryMp);
        addText(p.x, p.y - 20, "PARRY!", "#ffff00", 50, 16);
        Game.slowMoT = 18; // 패링 슬로모션 약 0.3초
        
        // 플레이어 넉백 및 에어본, 무적 시간 추가
        p.vy = -3;
        p.kbT = 12;
        p.vx = (eObj ? (p.x < eObj.x ? -1 : 1) : -p.facing) * 2;
        Game.invT = 40; // 연속 패링 방지용 넉넉한 무적 판정

        // 몬스터 넉백 및 에어본
        if (eObj && !eObj.isBoss) { 
            eObj.kbT = 30; 
            eObj.vx = (eObj.x < p.x ? -1 : 1) * 4; 
            eObj.vy = -3; 
        }
        return;
    }

    // 💡 2. 가드(방어) 시
    if (!unblockable && p.guarding) {
        dmg = 0; //
        
        // 텍스트를 눈에 잘 띄는 하늘색으로 변경
        addText(p.x, p.y - 20, "GUARD", "#00ccff", 40, 14);
        
        // 플레이어 넉백 및 에어본
        p.kbT = 15; 
        p.vy = -3;
        p.vx = (eObj ? (p.x < eObj.x ? -1 : 1) : -p.facing) * 3;
        
        // 몬스터 넉백 및 에어본
        if (eObj && !eObj.isBoss) {
            eObj.kbT = 15;
            eObj.vx = (eObj.x < p.x ? -1 : 1) * 2;
            eObj.vy = -2;
        }

        if (typeof playSfx === 'function') playSfx('hit');
    } 
    // 💡 3. 맨몸으로 피격 시
    else {
        dmg = Math.floor(dmg * Game.pDmgReduction);
        if (dmg < 1) dmg = 1;

        // 저스트 회피 윈도우 안 → 마녀의 시간 발동
        if (p.justDodgeReady && typeof triggerJustDodge === 'function') {
            triggerJustDodge();
            p.justDodgeReady = false;
            return; // 피해 무효
        }
        
        p.kbT = 20; 
        p.vx = (eObj ? (p.x < eObj.x ? -1 : 1) : -p.facing) * 5; 
        p.vy = -4; 
        
        Game.hitStop = 15; Game.camShake = 20; 
        if (typeof playSfx === 'function') playSfx('dmg');

        // 리게인 시스템: 즉시 깎지 않고 회색 체력으로 버퍼
        if (typeof applyRegain === 'function') {
            applyRegain(dmg);
            addText(p.x, p.y - 20, `-${dmg}`, "#ff6600", 40, 20);
        } else {
            addText(p.x, p.y - 20, `-${dmg}`, "#ff0000", 40, 22);
        }
        for(let i=0; i<20; i++) addPart(p.x+7, p.y+9, "#ff0000", 25, 4);

        // 피격 시 콤보 초기화
        Game.comboCount = 0;
        Game.comboTimer = 0;
        return; // 리게인 시스템이 hp 차감 처리
    }

    // 가시 갑옷 반사 데미지
    if (Game.pReflectDmg > 0 && eObj && !eObj.isBoss) {
        hitE(eObj, Game.pReflectDmg, p.facing, false);
    }

    // 쉴드가 있으면 쉴드부터 차감
    if (Game.pShield > 0) {
        if (Game.pShield >= dmg) { Game.pShield -= dmg; dmg = 0; } 
        else { dmg -= Game.pShield; Game.pShield = 0; }
    }

    // 최종 체력 차감 및 피격 후 기본 무적 시간 부여
    p.hp -= dmg; 
    Game.invT = 85;

    // 체력이 0 이하가 되어 사망 시
    if (p.hp <= 0) {
        if (Game.pRevive > 0) {
            Game.pRevive--; 
            p.hp = Math.floor(Game.pMaxHp * 0.5);
            addText(p.x, p.y - 30, "REVIVED!", "#ffaa00", 60, 20); 
            if (typeof playSfx === 'function') playSfx('item');
            for(let i=0; i<30; i++) addPart(p.x+7, p.y+9, "#ffaa00", 30, 5);
        } 
        else {
            p.hp = 0; p.dead = true; Game.gs = "dead"; Game.deadTimer = 120;
            if (typeof playSfx === 'function') playSfx('player_die');
            for(let i=0; i<50; i++) addPart(p.x+7, p.y+9, "#ff0000", 40, 6);
            if (typeof stopBGM === 'function') stopBGM();
            if (typeof playBGM === 'function') playBGM('dead');
        }
    }
}