// ==========================================
// 엔티티 생성 및 보스 AI 모듈 (Entities & AI)
// ==========================================

function mkP(x, y) {
    return {
        x: x, y: y, w: 14, h: 18, vx: 0, vy: 0, onGround: false, 
        hp: Game.pMaxHp, maxHp: Game.pMaxHp, 
        facing: 1, atkT: 0, atkAnim: 0, fr: 0, frT: 0, 
        jpOld: false, kbT: 0, guarding: false, 
        jumpCount: 0, combo: 0, comboT: 0, dashT: 0, dashCD: 0, parryT: 0, 
        plunging: false, dead: false 
    };
}

function mkEnemy(x, y, w) {
    const rand = Math.random(); 
    let type = "melee";
    
    if (w >= 1) { 
        if (rand < 0.2) type = "ranged_laser"; 
        else if (rand < 0.4) type = "ranged_bullet"; 
        else if (rand < 0.55 && w >= 2) type = "shield"; 
    }
    
    let e = getObj(Game.enemies); 
    
    const isElite = (w >= 2 && Math.random() < 0.1);
    const baseHp = (20 + w * 25 + (type === "melee" ? 5 : 0)) * 5;
    const hp = isElite ? Math.floor(baseHp * 3) : baseHp;
    
    e.x = x; e.y = y; 
    e.w = isElite ? 22 : 18; 
    e.h = isElite ? 30 : 24; 
    e.vx = 0; e.vy = 0; e.onGround = false; 
    e.hp = hp; e.maxHp = hp; e.type = type; e.isBoss = false; 
    e.isElite = isElite; 
    e.facing = 1; e.fr = 0; e.frT = 0; e.flash = 0;
    
    e.isGuarding = false; e.guardT = 0; 
    e.sI = isElite ? 100 : 160; 
    e.sT = 80 + Math.random() * 50; 
    
    const baseAtk = Math.floor(Math.random() * 5) + 3; 
    const atkMul = 1 + Math.floor((w - 1) / 2) * 0.5;  
    e.atk = Math.floor(baseAtk * atkMul * (isElite ? 1.5 : 1.0));
    
    e.pDir = Math.random() < 0.5 ? 1 : -1; 
    e.pT = 0; e.dead = false; e.kbT = 0; e.warnT = 0; e.warnData = null; e.atkAnim = 0; e.world = w;
    return e;
}

function mkBoss(x, y, w) {
    const hps = [0, 800, 1200, 1800, 2500, 3500, 4800, 6000, 7500, 9000, 6000]; 
    const hp = hps[Math.min(w, 10)]; 
    let e = getObj(Game.enemies);
    
    if (w === 5 || w === 6) { e.w = 180; e.h = 180; } 
    else { e.w = w === 10 ? 90 : 70; e.h = w === 10 ? 120 : 90; }
    
    e.x = x; e.y = y; e.vx = 0; e.vy = 0; e.onGround = false; 
    e.hp = hp; e.maxHp = hp; e.type = "boss"; e.isBoss = true; e.isElite = false; e.facing = 1; 
    e.fr = 0; e.frT = 0; e.flash = 0;
    
    e.sT = 60; e.sI = 60; e.phase = 1; e.mT = 50; e.ap = 0; 
    
    const bossBaseAtk = Math.floor(Math.random() * 5) + 8; 
    const atkMul = 1 + Math.floor((w - 1) / 2) * 0.5;
    e.atk = Math.floor(bossBaseAtk * atkMul * 1.5);
    
    e.dead = false; e.kbT = 0; e.warnT = 0; e.warnData = null; e.atkAnim = 0; e.world = w;
    return e;
}

function calcLaser(startX, startY, height, facing) {
    let minHitDist = Game.levelW;
    for (const t of Game.platforms) {
        if (t.y < startY + height && t.y + t.h > startY) {
            if (facing > 0 && t.x > startX) minHitDist = Math.min(minHitDist, t.x - startX);
            else if (facing < 0 && t.x + t.w < startX) minHitDist = Math.min(minHitDist, startX - (t.x + t.w));
        }
    }
    return { x: facing > 0 ? startX : Math.max(0, startX - minHitDist), w: minHitDist };
}

const BossAI = {
    1: (e, oX, spd, dmg, p2) => { 
        if (e.ap === 0) { 
            let arc = p2 ? 3 : 2; 
            for (let s = -arc; s <= arc; s++) spawnEBullet(e.x + 14, e.y + 18, Math.cos(e.warnData.ang + s * 0.15) * 5 * spd, Math.sin(e.warnData.ang + s * 0.15) * 5 * spd, 100, 4, dmg); 
        } else { 
            const lBox = calcLaser(oX, e.y + 18, 16, e.facing); 
            spawnLaser(lBox.x, e.y + 18, lBox.w, 16, 18, "#aa00ff", Math.floor(dmg * 1.3), false); Game.camShake = 5; 
        }
    },
    2: (e, oX, spd, dmg, p2) => { 
        if (e.ap === 0) {
            for (let i = 0; i < (p2 ? 5 : 3); i++) spawnEBullet(e.x + e.w/2, e.y, (e.facing * 3) + (i - 1) * 1.5, -6, 120, 5, dmg, false, true);
        } else {
            let arc = p2 ? 4 : 2;
            for (let s = -arc; s <= arc; s++) spawnEBullet(e.x + 14, e.y + 18, e.facing * 5, s * 1.5, 80, 4, dmg);
        }
    },
    3: (e, oX, spd, dmg, p2) => { 
        if (e.ap === 0) { 
            const lBox = calcLaser(oX, e.y + 18, 10, e.facing); 
            spawnLaser(lBox.x, e.y + 18, lBox.w, 10, 15, "#ff1111", Math.floor(dmg * 1.4), false); 
            let amt = p2 ? 10 : 6; 
            for (let i = 0; i < amt; i++) spawnEBullet(e.x + 14, e.y + 18, Math.cos((i * Math.PI) / (amt / 2)) * 6 * spd, Math.sin((i * Math.PI) / (amt / 2)) * 6 * spd, 100, 4, dmg); 
        } else { 
            let amt = p2 ? 6 : 4; 
            for (let i = 0; i < amt; i++) spawnEBullet(e.x + e.w / 2, e.y, e.facing * (2.5 + i * 1.5) * spd, -8, 150, 6, dmg, false, true, true); 
        }
    },
    4: (e, oX, spd, dmg, p2) => { 
        if (e.ap === 0) {
            let amt = p2 ? 14 : 8;
            for (let i = 0; i < amt; i++) spawnEBullet(e.x + e.w/2, e.y + e.h/2, Math.cos(i) * 6, Math.sin(i) * 6, 90, 4, dmg);
        } else {
            const dx = Game.player.x - e.x, dy = Game.player.y - e.y;
            let angle = Math.atan2(dy, dx);
            for(let i = -1; i <= 1; i++) spawnEBullet(e.x + e.w/2, e.y, Math.cos(angle + i * 0.2) * 7, Math.sin(angle + i * 0.2) * 7, 120, 6, dmg, false, true, true);
        }
    },
    5: (e, oX, spd, dmg, p2) => { 
        if (e.ap === 0) { 
            const lBox = calcLaser(oX, e.y + e.h/2, p2 ? 100 : 70, e.facing); 
            spawnLaser(lBox.x, e.y + e.h/2, lBox.w, p2 ? 100 : 70, 25, "#330066", Math.floor(dmg * 1.8), false); Game.camShake = 12; 
        } else { 
            let amt = p2 ? 24 : 16; 
            for (let i = 0; i < amt; i++) spawnEBullet(e.x + e.w/2, e.y + e.h/2, Math.cos((i * Math.PI) / (amt / 2)) * 5 * spd, Math.sin((i * Math.PI) / (amt / 2)) * 5 * spd, 150, 5, dmg); 
        }
    },
    6: (e, oX, spd, dmg, p2) => { 
        if (e.ap === 0) { 
            let targetY = e.warnData.targetY || Game.player.y;
            let laserY = Math.max(e.y, Math.min(e.y + e.h - 20, targetY)); 
            const lBox = calcLaser(oX, laserY, 50, e.facing); 
            spawnLaser(lBox.x, laserY, lBox.w, 50, 30, "#ff3300", Math.floor(dmg * 1.8), false); Game.camShake = 15; 
        } else { 
            const dx = Game.player.x - (e.x + e.w/2), dy = Game.player.y - (e.y + e.h/2);
            let ang = Math.atan2(dy, dx);
            for (let i = -3; i <= 3; i++) {
                spawnEBullet(e.x + e.w/2, e.y + e.h/2, Math.cos(ang + i * 0.12) * 6 * spd, Math.sin(ang + i * 0.12) * 6 * spd, 120, 5, dmg);
            }
        }
    },
    7: (e, oX, spd, dmg, p2) => { 
        if (e.ap === 0) { 
            let pX = Game.player.x; 
            spawnLaser(pX - 10, 0, 20, CH, 45, "#0a0015", Math.floor(dmg * 2.2), true); 
            addText(pX, CH - 60, "DARK REAPER!", "#aa00ff", 35, 14); Game.camShake = 10; 
        } else { 
            let amt = p2 ? 22 : 14; 
            for (let i = 0; i < amt; i++) {
                let angle = (i * Math.PI * 2) / amt;
                spawnEBullet(e.x + e.w/2, e.y + e.h/2, Math.cos(angle) * 4 * spd, Math.sin(angle) * 4 * spd, 160, 6, dmg, false, false, false);
            }
        }
    },
    8: (e, oX, spd, dmg, p2) => { 
        if (e.ap === 0) { 
            const lBox = calcLaser(oX, e.y + 10, 40, e.facing); 
            spawnLaser(lBox.x, e.y + 10, lBox.w, 40, 20, "#00ff88", Math.floor(dmg * 2.2), false); Game.camShake = 12; 
        } else { 
            let amt = p2 ? 15 : 8; 
            for (let i = 0; i < amt; i++) spawnEBullet(e.x + e.w / 2, e.y, (Math.random() - 0.5) * 12, -10 - Math.random() * 6, 180, 6, dmg, false, true, true); 
        }
    },
    9: (e, oX, spd, dmg, p2) => { 
        if (e.ap === 0) { 
            const lBox = calcLaser(oX, e.y, 50, e.facing); 
            spawnLaser(lBox.x, e.y, lBox.w, 50, 25, "#ff00ff", Math.floor(dmg * 2.5), false); 
        } else { 
            for(let i=0; i<8; i++) {
                spawnEBullet(e.x + e.w/2, e.y + 20, (Math.random() - 0.5) * 10, -5 - Math.random()*5, 140, 5, dmg, true);
            }
        }
    },
    10: (e, oX, spd, dmg, p2) => { 
        if (e.ap === 0) { 
            const lBox = calcLaser(oX, e.y, 100, e.facing); 
            spawnLaser(lBox.x, e.y - 40, lBox.w, 50, 30, "#ff0000", Math.floor(dmg * 3), false); 
            spawnLaser(lBox.x, e.y + 60, lBox.w, 50, 35, "#aa0000", Math.floor(dmg * 3), false); 
            Game.camShake = 25; 
        } else if (e.ap === 1) { 
            let amt = 60; 
            for (let i = 0; i < amt; i++) spawnEBullet(e.x + 14, e.y + 18, Math.cos((i * Math.PI) / (amt / 2)) * 8 * spd, Math.sin((i * Math.PI) / (amt / 2)) * 8 * spd, 200, 6, dmg); 
        } else { 
            let amt = 50; 
            for (let i = 0; i < amt; i++) spawnEBullet(e.x + e.w / 2, e.y, (Math.random() - 0.5) * 25, -15 - Math.random() * 10, 300, 8, dmg, false, true, true); 
        }
    }
};

function updateBoss(e) {
    const p = Game.player; 
    if (!p || p.dead) return;
    
    const isP2 = e.hp < e.maxHp * 0.5; 
    e.phase = isP2 ? 2 : 1; 
    
    const w = e.world; 
    const isFlying = w >= 5 && w < 10;
    
    e.isRevived = [2, 4, 6].includes(w); 
    const spdMod = e.isRevived ? 1.5 : 1.0; 
    
    if (isFlying) {
        e.vy += ((p.y - 60) - e.y) * 0.05;
        e.vy *= 0.85; 
        e.onGround = false;
        
        if (w === 5 || w === 6) {
            e.y = Math.max(150, Math.min(e.y, CH - 250));
        }
    } else {
        e.vy = Math.min(e.vy + GRAV, 10); 
    }
    
    e.vy = Math.max(-20, Math.min(20, e.vy));
    e.vx = Math.max(-15, Math.min(15, e.vx));
    
    const dx = p.x + p.w / 2 - (e.x + e.w / 2), dy = p.y + p.h / 2 - (e.y + e.h / 2);
    if (!e.warnT && e.atkAnim <= 0) e.facing = dx > 0 ? 1 : -1; 
    
    let currentSpd = (isP2 ? 3.0 + w * 0.1 : 2.0 + w * 0.1) * spdMod; 
    
    if (e.atkAnim > 0) e.atkAnim--;
    if (e.kbT > 0) { 
        e.kbT--; e.vx *= 0.88; 
    } else if (e.warnT > 0) {
        e.warnT--; e.vx = 0; 
        if (e.warnT <= 0) {
            e.atkAnim = 20; 
            if(typeof playSfx === 'function') playSfx('boss_atk');
            
            const wd = e.warnData; const originX = wd.facing > 0 ? e.x + e.w : e.x;
            const bDmg = e.atk; const spdM = (isP2 ? 1.4 : 1.1) * spdMod; 
            
            if ((w === 5 || w === 9 || w === 10) && isP2 && Math.random() < 0.3) { 
                p.vx -= Math.sign(dx) * 10; p.vy = -3; 
                addText(p.x, p.y, "PULLED!", "#cc00ff", 30, 20); 
            }
            if (BossAI[w]) BossAI[w](e, originX, spdM, bDmg, isP2);
        }
    } else {
        e.mT -= (w === 10 ? 1.5 : 1); 
        if (e.mT <= 0) { 
            e.mT = isP2 ? 25 : 45; 
            if (dx * dx > 62500) currentSpd *= 2.2; 
            if (!isFlying && e.onGround && dy < -60 && Math.random() < 0.7) { e.vy = -9; } 
            
            if ((w === 2 || w === 7 || w === 10) && isP2 && Math.random() < 0.4) { 
                let targetX = p.x - e.facing * 50;
                let targetY = isFlying ? p.y - 60 : p.y - 10;
                
                e.x = Math.max(60, Math.min(Game.levelW - e.w - 60, targetX));
                e.y = isFlying ? targetY : Math.min(CH - 40 - e.h, targetY); 
                e.vx = 0; e.vy = 0;
                
                e.kbT = 35; 
                addText(e.x, e.y - 25, "TELEPORT!", "#aa00ff", 40, 18); 
                for (let i = 0; i < 15; i++) addPart(e.x + e.w/2, e.y + e.h/2, "#aa00ff", 20, 4);
            } 
        }
        e.vx = e.facing * currentSpd; 
        e.sT--;
        
        if (e.sT <= 0) { 
            let baseInterval = w <= 4 ? 110 : 80;
            e.sI = Math.max(45, baseInterval - w * 3); 
            e.sT = e.sI * (isP2 ? 0.7 : 1.1) * (e.isRevived ? 0.7 : 1.0); 
            
            e.ap = Math.floor(Math.random() * (isP2 ? 3 : 2)); 
            e.warnT = w <= 4 ? 35 : 25; 
            
            e.warnData = { ang: Math.atan2(dy, dx), facing: e.facing, ap: e.ap, targetY: p.y }; 
            e.vx = 0; 
        }
    }

    if (e.atkAnim > 0) { e.vx = 0; }

    let attemptedVx = e.vx;
    
    e.x += e.vx;
    e.y += e.vy;

    if (typeof resolveAABB === 'function') resolveAABB(e); 
    e.x = Math.max(0, Math.min(Game.levelW - e.w, e.x));
    
    if (!isFlying && e.onGround && attemptedVx !== 0 && e.vx === 0 && e.atkAnim <= 0 && e.warnT <= 0) {
        e.vy = -9; 
    }

    if (Game.invT === 0 && typeof overlap === 'function' && overlap(Game.player, { x: e.x, y: e.y, w: e.w, h: e.h }) && !Game.player.dead) {
        if(typeof takeDmg === 'function') takeDmg(e.atk, e);
    }
    if (e.y > CH + 60) e.dead = true;
}

function updateEnemies() {
    Game.enemies.forEach(e => {
        if (!e.active) return;
        
        if (e.y > CH + 50 && !e.dead) { e.hp = 0; e.dead = true; } 
        
        if (e.dead) {
            Game.score += e.isBoss ? 500 : (e.isElite ? 150 : 50); Game.kills++; 
            
            if (e.isElite) {
                Game.darkQuartz += Math.floor(Math.random() * 3) + 1;
                addText(e.x, e.y - 30, "+ DARK QUARTZ", "#aa00ff", 60, 16);
                if (typeof saveProgress === 'function') saveProgress();
            } else if (e.isBoss) {
                Game.darkQuartz += Math.floor(Math.random() * 10) + 10;
                Game.rerollCoins += 1;
                if (typeof saveProgress === 'function') saveProgress();
            }

            if(typeof playSfx === 'function') playSfx('enemy_die'); 
            for (let i = 0; i < 25; i++) {
                if(typeof addPart === 'function') addPart(e.x + e.w / 2, Math.min(e.y, CH-20), Math.random() < 0.5 ? "#ff0000" : "#aa0000", 20 + Math.random() * 20, 4);
            }

            if (Math.random() < Game.pDropRate || e.isBoss || e.isElite) {
                let randType = "hp"; let roll = Math.random();
                if (e.isBoss || e.isElite) { 
                    if(roll < 0.2) randType = "atk_drop"; else if(roll < 0.4) randType = "def_drop"; else if(roll < 0.6) randType = "atk_spd_drop"; else if(roll < 0.8) randType = "move_spd_drop"; else randType = "jump_drop"; 
                } else { 
                    if (roll < 0.35) randType = "hp"; else if (roll < 0.5) randType = "atk_drop"; else if (roll < 0.65) randType = "def_drop"; else if (roll < 0.8) randType = "atk_spd_drop"; else if (roll < 0.9) randType = "move_spd_drop"; else randType = "jump_drop"; 
                }
                if(typeof addItem === 'function') addItem(e.x + e.w/2 - 5, Math.min(e.y, CH - 20), 10, 10, -4, 600, randType);
            }
            if (Game.enemies.filter(x => x.active && !x.dead).length === 0 && !e.isBoss) {
                if(typeof playSfx === 'function') playSfx('clear'); 
            } else if (e.isBoss) {
                if(typeof playSfx === 'function') playSfx('clear'); 
                if(typeof stopBGM === 'function') stopBGM(); 
            }
            e.active = false;
            return;
        }
        
        e.frT++; if (e.frT > 10) { e.fr = (e.fr + 1) % 2; e.frT = 0; }
        if (e.flash > 0) e.flash--;

        if (e.isBoss) { if (typeof updateBoss === 'function') updateBoss(e); return; }

        e.vy = Math.min(e.vy + 0.4, 9);
        if (e.onGround && e.riding && e.riding.vx) e.x += e.riding.vx;

        if (e.kbT > 0) { 
            e.kbT--; e.vx *= 0.88; 
        } 
        else {
            const dx = Game.player.x - e.x; const dy = Game.player.y - e.y;
            const distSq = dx * dx + dy * dy;
            
            if (e.type === "melee") {
                e.sT--;
                if (Math.abs(dx) < 65 && Math.abs(dy) < 40 && e.sT <= 0 && e.warnT <= 0 && e.atkAnim <= 0) {
                    e.warnT = 30; // 공격 선딜레이
                    e.sT = e.sI; e.vx = 0; e.facing = dx > 0 ? 1 : -1; 
                }
                if (e.warnT > 0) {
                    e.warnT--; e.vx = 0; 
                    if (e.warnT <= 0) {
                        e.atkAnim = 30; 
                        if(typeof playSfx === 'function') playSfx('enemy_atk'); 
                        
                        if ((e.facing > 0 && dx > 0 && dx < 80) || (e.facing < 0 && dx < 0 && dx > -80)) {
                            if (Math.abs(dy) < 45 && typeof takeDmg === 'function') takeDmg(e.atk, e);
                        }
                    }
                } else if (e.atkAnim > 0) { e.atkAnim--; e.vx = 0; } 
                else {
                    // 미친 호전성 (추격)
                    if (distSq < 400000) { 
                        let eSpd = e.isElite ? 0.35 : 0.25;
                        let maxSpd = e.isElite ? 2.5 : 2.0;
                        e.facing = dx > 0 ? 1 : -1; e.vx += (dx > 0 ? 1 : -1) * eSpd; e.vx = Math.max(-maxSpd, Math.min(maxSpd, e.vx)); 
                    } else { e.pT--; if (e.pT <= 0) { e.pT = 60 + Math.random() * 60; e.pDir *= -1; } e.vx = e.pDir * (e.isElite ? 1.5 : 1.0); }
                }
            } 
            else if (e.type === "shield") {
                e.guardT = (e.guardT + 1) % 360; 
                e.isGuarding = e.guardT < 180;   
                
                if (distSq < 400000) {
                    e.facing = dx > 0 ? 1 : -1; 
                    let spdAdd = e.isGuarding ? 0.05 : (e.isElite ? 0.25 : 0.15); 
                    let spdMax = e.isGuarding ? 0.4 : (e.isElite ? 1.5 : 1.0);
                    e.vx += (dx > 0 ? 1 : -1) * spdAdd; 
                    e.vx = Math.max(-spdMax, Math.min(spdMax, e.vx)); 
                } else { 
                    e.pT--; if (e.pT <= 0) { e.pT = 60 + Math.random() * 60; e.pDir *= -1; } 
                    e.vx = e.pDir * (e.isGuarding ? 0.4 : (e.isElite ? 1.1 : 0.8)); 
                }
            } 
            else { 
                if (e.warnT > 0) {
                    e.warnT--; e.vx *= 0.8;
                    if (e.warnT <= 0) {
                        e.atkAnim = 40;
                        const ang = e.warnData.ang;
                        if (e.type === "ranged_bullet") {
                            let bulletCount = e.isElite ? 2 : 1;
                            for (let s = -bulletCount; s <= bulletCount; s++) { if(typeof spawnEBullet === 'function') spawnEBullet(e.x + 6, e.y + 8, Math.cos(ang + s * 0.15) * 5, Math.sin(ang + s * 0.15) * 5, 80, 4, e.atk); }
                            if(typeof playSfx === 'function') playSfx('mob_laser');
                        } else {
                            const originX = e.facing > 0 ? e.x + e.w : e.x;
                            if(typeof calcLaser === 'function' && typeof spawnLaser === 'function') {
                                const lBox = calcLaser(originX, e.y + 6, 6, e.facing);
                                spawnLaser(lBox.x, e.y + 6, lBox.w, e.isElite ? 10 : 6, 12, "#ff3300", e.atk, false);
                            }
                            if(typeof playSfx === 'function') playSfx('mob_laser');
                        }
                    }
                } else if (e.atkAnim > 0) {
                    e.atkAnim--; e.vx = 0;
                } else {
                    if (distSq < 160000) { 
                        e.facing = dx > 0 ? 1 : -1;
                        if (distSq < 22500) e.vx += (dx > 0 ? -1 : 1) * 0.15; else e.vx *= 0.9; 
                        e.vx = Math.max(-1.4, Math.min(1.4, e.vx)); e.sT--;
                        if (e.sT <= 0) { e.sT = e.sI; e.warnT = e.type === "ranged_laser" ? 40 : 25; e.warnData = { ang: Math.atan2(dy, dx), facing: e.facing }; }
                    } else { e.pT--; if (e.pT <= 0) { e.pT = 60 + Math.random() * 60; e.pDir *= -1; } e.vx = e.pDir * (e.isElite ? 1.2 : 0.8); }
                }
            }

            // 💡 낭떠러지 감지 및 짐승 도약 (근접 몹 전용)
            if (e.onGround && e.type === "melee" && e.atkAnim <= 0) {
                let checkX = e.facing > 0 ? e.x + e.w + 15 : e.x - 15; 
                let checkY = e.y + e.h + 10; 
                let floorSafe = false;
                for (const t of Game.platforms) { 
                    if (checkX >= t.x && checkX <= t.x + t.w && checkY >= t.y && checkY <= t.y + t.h + 10) { 
                        floorSafe = true; break; 
                    } 
                }
                // 발판이 끊겼다면 플레이어를 향해 크게 도약!
                if (!floorSafe) {
                    e.vy = -8.5; // 위로 높게 점프
                    e.vx = e.facing * 4.5; // 앞으로 빠르게 덮침
                    e.onGround = false;
                }
            }
        }
        
        e.x += e.vx;
        e.y += e.vy;

        if (typeof resolveAABB === 'function') resolveAABB(e); 
        e.x = Math.max(0, Math.min(Game.levelW - e.w, e.x));
        
        if (Game.invT === 0 && typeof overlap === 'function' && overlap(Game.player, { x: e.x, y: e.y, w: e.w, h: e.h }) && !Game.player.dead) { 
            if(typeof takeDmg === 'function') takeDmg(e.atk, e); 
        }
    });
}