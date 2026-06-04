// ==========================================
// 메인 게임 로직 및 업데이트 루프 (Main Logic & Loop)
// ==========================================

function updateEnvironment() {
    Game.platforms.forEach(t => { 
        if (t.vx) { 
            t.x += t.vx; 
            if (t.x < t.boundL || t.x > t.boundR) t.vx *= -1; 
        } 
        if (t.drop) {
            if (Game.player && Game.player.onGround && Game.player.riding === t && Game.gs !== "dead") { 
                t.fallActive = true; 
            }
            if (t.fallActive) {
                t.fallTimer = (t.fallTimer || 0) + 1;
                if (t.fallTimer > 30) { t.vy = (t.vy || 0) + GRAV; t.y += t.vy; }
            }
        }
    });
}

function updatePlayer() {
    const p = Game.player;
    if (Game.gs === "dead" || Game.gs === "gameover") {
        if (Game.deadTimer > 0) { Game.deadTimer--; }
        p.vy += GRAV; p.y += p.vy; 
        return; 
    }

    p.frT++; if (p.frT > 7) { p.fr = (p.fr + 1) % 4; p.frT = 0; }
    
    if (Game.pRegenFrames > 0) {
        Game.regenT = (Game.regenT || 0) + 1;
        if (Game.regenT >= Game.pRegenFrames) {
            Game.regenT = 0;
            p.hp = Math.min(Game.pMaxHp, p.hp + 1);
        }
    }

    if (Game.pCursedPendant) {
        Game.curseT = (Game.curseT || 0) + 1;
        if (Game.curseT >= 60) {
            Game.curseT = 0;
            if (p.hp > 1) p.hp -= 1;
        }
    }

    if (Game.camShake > 0) Game.camShake--;
    if (Game.comboTimer > 0) { Game.comboTimer--; if (Game.comboTimer <= 0) Game.comboCount = 0; }

    if (p.onGround && p.riding && p.riding.vx) p.x += p.riding.vx;

    const guardNow = dn("KeyV");
    if (guardNow && !p.guarding && p.kbT <= 0 && p.dashT <= 0 && p.atkT === 0) { 
        p.parryT = 10 + Game.pParryBonus; 
    }
    if (p.parryT > 0) p.parryT--; 
    p.guarding = guardNow;

    if (dn("KeyZ") && p.dashCD <= 0 && !p.guarding && p.kbT <= 0 && p.atkT === 0) {
        p.dashT = 15 + Game.pDashInv; 
        p.dashCD = Math.floor(75 * Game.pDashCDMul); 
        p.vy = 0; p.plunging = false; playSfx('dash'); 
    }
    
    if (p.dashT > 0) {
        p.dashT--; p.vx = p.facing * 5.3 * Game.pMoveSpdMul; p.vy = 0; addPart(p.x + 7, p.y + 9, "#ffffff", 10, 3); 
    } else if (p.kbT > 0) {
        p.kbT--; p.vx *= 0.9;
    } else {
        let mx = 0; 
        if (!p.guarding && !p.plunging) { 
            // 💡 A, D 키 이동 삭제, 오직 좌우 방향키만 허용
            if (dn("ArrowLeft")) mx = -1; 
            if (dn("ArrowRight")) mx = 1; 
        }
        if (mx !== 0) p.facing = mx; p.vx = mx * 2.4 * Game.pMoveSpdMul; 
    }
    if (p.dashCD > 0) p.dashCD--;

    if (p.onGround) {
        p.jumpCount = 0;
        p.plungeCount = 0; 
    }
    
    // 💡 스페이스바 점프 삭제. 오직 X키로만 점프 가능
    const jpNow = dn("KeyX");
    if (jpNow && !p.jpOld && !p.guarding && p.kbT <= 0 && !p.plunging && p.atkT === 0) {
        if (p.onGround || p.dashT > 0) { 
            p.vy = -7.5 * Game.pJmpMul; p.jumpCount = 1; 
            if (p.dashT > 0) { p.dashT = 0; p.vx = p.facing * 3.3 * Game.pMoveSpdMul; } 
            playSfx('jump'); 
            for (let i = 0; i < 4; i++) addPart(p.x + 7, p.y + 18, "#6060ff", 12); 
        } else if (p.jumpCount < 2) { 
            p.vy = -6.5 * Game.pJmpMul; p.jumpCount = 2; p.dashT = 0; 
            playSfx('jump');
            for (let i = 0; i < 6; i++) addPart(p.x + 7, p.y + 18, "#ff60ff", 15); 
        }
    }
    p.jpOld = jpNow;

    if (!p.onGround && dn("ArrowDown") && dn("KeyC") && !p.plunging && p.atkT === 0 && p.dashT <= 0) { 
        if (Game.pClass === 2) { 
            if ((p.plungeCount || 0) < 3) {
                p.plungeCount = (p.plungeCount || 0) + 1;
                p.atkT = 20; p.vy = -5; 
                playSfx('atk'); 
                Game.camShake = 5;
                let currentBaseDmg = Game.pBaseDmg * (Game.pBaseDmgMul || 1.0);
                let pdmg = Math.floor(currentBaseDmg * 2.5 * Game.pFinalDmgMul);
                spawnBullet(p.x + 7, p.y + 18, 0, 10, 30, 8, 0, pdmg);
            }
        } else {
            p.plunging = true; 
            if (Game.pClass === 1) { 
                p.vy = 14; p.vx = p.facing * 6;
            } else { 
                p.vy = 12; p.vx = 0;
            }
        }
    }
    
    if (p.plunging) { 
        if (Game.pClass === 1) {
            p.vy = 14; p.vx = p.facing * 6; addPart(p.x + 7, p.y + 9, "#ff0055", 5); 
        } else {
            p.vy = 12; p.vx = 0; addPart(p.x + 7, p.y + 9, "#ffaa00", 5); 
        }
    } else if (p.dashT <= 0 && Game.pClass !== 2) { 
        p.vy = Math.min(p.vy + GRAV, 9); 
    } else if (p.dashT <= 0 && Game.pClass === 2) {
        p.vy = Math.min(p.vy + GRAV * 0.8, 8);
    }

    p.x += p.vx;
    p.y += p.vy;

    if (typeof resolveAABB === 'function') resolveAABB(p);
    
    if (p.plunging && p.onGround) {
        p.plunging = false; p.atkT = 20; Game.camShake = 15; Game.hitStop = 8; playSfx('hit');
        for (let i = 0; i < 20; i++) addPart(p.x + 7, p.y + 18, "#ffffff", 20);
        
        let currentBaseDmg = Game.pBaseDmg * (Game.pBaseDmgMul || 1.0);
        let pdmg = Math.floor(currentBaseDmg * 2.5 * Game.pFinalDmgMul); 
        if (pdmg < 1) pdmg = 1;
        
        if (Game.pClass === 1) { 
            spawnBullet(p.x + 7, p.y + 5, p.facing * 10, 0, 10, 15, 2, pdmg);
            spawnBullet(p.x + 7, p.y + 5, p.facing * 12, 0, 10, 15, 2, pdmg);
        } else { 
            spawnBullet(p.x - 10, p.y + 5, -8, 0, 15, 18, 2, pdmg);
            spawnBullet(p.x + 10, p.y + 5, 8, 0, 15, 18, 2, pdmg);
        }
    }

    p.x = Math.max(0, Math.min(Game.levelW - p.w, p.x));
    
    if (p.y > CH + 60) { 
        p.guarding = false; p.plunging = false; 
        let fallDmg = Math.floor(p.hp * 0.3);
        if (fallDmg < 1) fallDmg = 1;
        if(typeof takeDmg === 'function') takeDmg(fallDmg, null, true); 
        
        let safePlatform = Game.platforms.find(t => t.float && !t.drop && !t.vx) || Game.platforms.find(t => t.float && !t.drop) || Game.platforms[0];
        if (safePlatform) {
            p.x = safePlatform.x + safePlatform.w / 2 - p.w / 2; 
            p.y = safePlatform.y - 40; 
        } else {
            p.x = 80; p.y = 50; 
        }
        p.vx = 0; p.vy = 0; 
    }

    if (p.atkT > 0) p.atkT--; if (p.atkAnim > 0) p.atkAnim--; if (Game.invT > 0) Game.invT--;
}

function updatePlayerCombat() {
    const p = Game.player;
    if (p.dead) return;
    
    const currentAtkSpd = (Game.pBaseAtkSpd || 1.0) * (Game.pAtkSpdMul || 1.0);
    const currentBaseDmg = Game.pBaseDmg * (Game.pBaseDmgMul || 1.0);

    if (dn("KeyC") && !dn("ArrowDown") && p.atkT === 0 && !p.guarding && p.kbT <= 0 && p.dashT <= 0 && !p.plunging) {
        playSfx('atk');
        let maxCombo = (Game.pClass === 1) ? 5 : 3;
        p.combo = (p.combo % maxCombo) + 1; 
        const isLastHit = p.combo === maxCombo;
        
        p.atkT = Math.max(1, Math.floor((isLastHit ? 35 : 16) / currentAtkSpd));
        p.atkAnim = Math.max(1, Math.floor((isLastHit ? 20 : 12) / currentAtkSpd));
        
        p.comboT = 50;
        if (!p.onGround) p.vy = Math.min(p.vy, 1);

        const rangeX = (isLastHit ? 45 : 30) + Game.pRangeBonus; 
        const rangeY = (isLastHit ? 55 : 40) + Game.pRangeBonus * 0.5; 
        const cx = p.x + 7 + p.facing * (rangeX / 2 + 5); const cy = p.y + 9;

        let baseRoll = Math.floor((isLastHit ? currentBaseDmg * 2.2 : currentBaseDmg) * (0.8 + Math.random() * 0.4));
        let comboBon = Math.floor(Game.comboCount / 10) * Game.pComboDmg;
        
        if (Game.pBloodFestival) {
            comboBon += Math.min(150, Math.floor(Game.comboCount / 5) * 15);
        }
        
        let dmg = Math.floor(baseRoll + comboBon); 
        if (p.hp / p.maxHp < 0.3) dmg = Math.floor(dmg * Game.pLowHpDmg); 

        let isCrit = false;
        if (Math.random() < Game.pCritChance) { dmg = Math.floor(dmg * Game.pCritDmg); isCrit = true; }
        dmg = Math.floor(dmg * Game.pFinalDmgMul);
        if (dmg < 1) dmg = 1;

        if (Game.pClass === 2) {
            spawnBullet(cx, cy, p.facing * 8, 0, 40, 6, 0, dmg);
            if (isLastHit) {
                spawnBullet(cx, cy - 10, p.facing * 8, -2, 40, 6, 0, dmg);
                spawnBullet(cx, cy + 10, p.facing * 8, 2, 40, 6, 0, dmg);
                Game.camShake = 5;
            }
        } else {
            let hitTarget = false;
            Game.enemies.forEach((e) => {
                if (!e.active || e.dead) return;
                if (Math.abs(e.x + e.w / 2 - cx) < rangeX / 2 + e.w / 2 && Math.abs(e.y + e.h / 2 - cy) < rangeY / 2 + e.h / 2) {
                    if (e.isBoss && (e.y + e.h) < Game.player.y) return;
                    if(typeof hitE === 'function') hitE(e, dmg, p.facing, isCrit, Game.pExtraDmg); 
                    hitTarget = true;
                }
            });

            if (isLastHit) Game.camShake = 8; 
            if (hitTarget) { 
                Game.pMp = Math.min(Game.pMaxMp, Game.pMp + 2); 
                if (isLastHit) Game.hitStop = 6;
                Game.comboCount++;
                Game.comboTimer = 150 + Game.pComboDur;
            } 
            for (let i = 0; i < (isLastHit ? 15 : 6); i++) { addPart(cx + (Math.random() - 0.5) * 20, cy + (Math.random() - 0.5) * 20, isLastHit ? "#ff2222" : "#ffffff", 15, 3); }
        }
    }

    if (dn("ShiftLeft", "ShiftRight") && Game.pMp >= 100 && !p.guarding && p.kbT <= 0 && p.dashT <= 0 && !p.plunging && p.atkT === 0) {
        Game.pMp -= 100;
        p.atkT = 20; 
        playSfx('skill'); Game.camShake = 45; Game.hitStop = 10;
        let megaDmg = Math.floor(currentBaseDmg * 15 * Game.pSkillDmgMul); 
        let comboBon = Math.floor(Game.comboCount / 10) * Game.pComboDmg * 10;
        
        if (Game.pBloodFestival) comboBon += Math.min(150, Math.floor(Game.comboCount / 5) * 15) * 15 * Game.pSkillDmgMul;
        
        megaDmg += comboBon;
        if (p.hp / p.maxHp < 0.3) megaDmg = Math.floor(megaDmg * Game.pLowHpDmg);
        megaDmg = Math.floor(megaDmg * Game.pFinalDmgMul);
        
        const laserW = 450;
        const laserX = p.facing > 0 ? p.x + p.w : p.x - laserW;
        spawnLaser(laserX, p.y - 25, laserW, 70 * Game.pSkillWidth, 50, "#00ccff", megaDmg, true, true);
        
        for (let i = 0; i < 40; i++) addPart(p.x + 7, p.y + 9, "#00ccff", 35, 5);
        addText(p.x, p.y - 30, "OBLITERATE!!", "#00ffff", 60, 26);
    }
}

function updateProjectiles() {
    Game.bullets.forEach((b) => { 
        if (!b.active) return;
        b.x += b.vx; b.y += b.vy; 
        
        b.vy += (b.sk === true || b.sk === 1) ? 0.05 : 0; 
        b.life--; 
        if (b.life <= 0) { b.active = false; return; }
        
        if (b.sk !== 2) {
            for (const t of Game.platforms) { 
                if (overlap({ x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 }, t)) { b.active = false; return; } 
            }
        }
        
        Game.enemies.forEach((e) => {
            if (!e.active || e.dead) return;
            const hitR = b.sk === 2 ? b.r * 2.5 : b.r;
            if (Math.abs(e.x + e.w / 2 - b.x) < e.w / 2 + hitR && Math.abs(e.y + e.h / 2 - b.y) < e.h / 2 + hitR) { 
                if(typeof hitE === 'function') hitE(e, b.dmg || (Game.pBaseDmg * (Game.pBaseDmgMul||1)), b.vx > 0 ? 1 : -1, false); 
                if (b.sk) Game.hitStop = 3; 
                if (Game.pClass === 2 && !b.sk) Game.pMp = Math.min(Game.pMaxMp, Game.pMp + 1);
                if (!b.sk) {
                    Game.comboCount++;
                    Game.comboTimer = 150 + Game.pComboDur;
                }
                b.active = false; 
            }
        });
    });

    Game.eBullets.forEach((b) => { 
        if (!b.active) return;
        b.x += b.vx * Game.pProjSlow; b.y += b.vy * Game.pProjSlow; 
        if (b.grav) b.vy += 0.4 * Game.pProjSlow; else b.vy += 0.12 * Game.pProjSlow; 
        b.life--; 
        if (b.life <= 0 || b.y > CH + 30) { b.active = false; return; }
        
        for (const t of Game.platforms) { if (overlap({ x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 }, t)) { b.active = false; return; } }
        if (Game.invT === 0 && Math.abs(Game.player.x + 7 - b.x) < 11 && Math.abs(Game.player.y + 9 - b.y) < 12 && !Game.player.dead) { 
            if(typeof takeDmg === 'function') takeDmg(b.dmg || 15, b, b.unblockable); b.active = false; 
        }
    });

    Game.lasers.forEach((l) => {
        if (!l.active) return;
        if (l.isPlayer) {
            if (l.life > l.maxLife - 15) { 
                Game.enemies.forEach(e => {
                    if (e.active && !e.dead && overlap(e, l) && !l.hitTargets.has(e)) { 
                        if(typeof hitE === 'function') hitE(e, l.dmg, Game.player.facing, true); 
                        l.hitTargets.add(e); 
                    }
                });
            }
        } else {
            if (l.life > l.maxLife - 5) { 
                if (Game.invT === 0 && overlap(Game.player, l) && !Game.player.dead) { 
                    if(typeof takeDmg === 'function') takeDmg(l.dmg || 20, null, l.unblockable); 
                }
            }
        }
        l.life--;
        if (l.life <= 0) l.active = false;
    });
}

function updateItemsAndMisc() {
    Game.texts.forEach(t => { 
        if (!t.active) return;
        t.y -= 0.8; t.life--; 
        if (t.life <= 0) t.active = false;
    }); 

    Game.items.forEach(i => {
        if (!i.active) return;
        i.vy = Math.min(i.vy + GRAV, 8);  i.y += i.vy; let groundFound = false;
        Game.platforms.forEach(t => { if (overlap({x: i.x, y: i.y, w: i.w, h: i.h}, t) && i.vy > 0) { i.y = t.y - i.h; i.vy = 0; groundFound = true; } });
        if(groundFound) i.life--;
        
        if (overlap(Game.player, {x: i.x, y: i.y, w: i.w, h: i.h}) && !Game.player.dead) {
            playSfx('item');
            if (i.type === "hp") {
                if (Game.player.hp < Game.pMaxHp) { Game.player.hp = Math.min(Game.pMaxHp, Game.player.hp + 20); addText(Game.player.x, Game.player.y - 10, "+20 HP", "#27ae60", 40, 14); } 
                else { Game.score += 100; addText(Game.player.x, Game.player.y - 10, "+100 SCORE", "#aaaaff", 40, 14); }
            } else if (i.type === "atk_drop") { Game.pBaseDmg += 5; addText(Game.player.x, Game.player.y - 10, "ATK UP! (+5)", "#ff6200", 50, 16);
            } else if (i.type === "def_drop") { Game.pBaseDef += 5; addText(Game.player.x, Game.player.y - 10, "DEF UP! (+5)", "#b0bec5", 50, 16); 
            } else if (i.type === "atk_spd_drop") { Game.pBaseAtkSpd += 0.05; addText(Game.player.x, Game.player.y - 10, "ATK SPD UP!", "#ffea00", 50, 16);
            } else if (i.type === "move_spd_drop") { Game.pMoveSpdMul += 0.05; addText(Game.player.x, Game.player.y - 10, "MOVE SPD UP!", "#00ffcc", 50, 16); }
            else if (i.type === "jump_drop") { Game.pJmpMul += 0.05; addText(Game.player.x, Game.player.y - 10, "JUMP UP!", "#42a5f5", 50, 16); }
            
            i.active = false;
        } else if (i.life <= 0) {
            i.active = false;
        }
    });

    Game.parts.forEach((p) => { 
        if (!p.active) return;
        p.x += p.vx; p.y += p.vy; p.vx *= 0.87; p.vy *= 0.87; p.life--; 
        if (p.life <= 0) p.active = false;
    }); 
    
    const allDead = !Game.enemies.some(e => e.active && !e.dead);
    Game.doors.forEach((d) => { 
        d.open = allDead; 
        if (d.open && Game.player && overlap(Game.player, { x: d.x, y: d.y, w: d.w, h: d.h }) && !Game.player.dead) { 
            if (Game.transState === 0 && typeof nextStage === 'function') {
                nextStage(); 
            }
        } 
    });
}

function update() {
    if (Game.hitStop > 0) { Game.hitStop--; if (Game.camShake > 0) Game.camShake--; return; }
    if (!Game.player || Game.gs === "gameover") return;

    if (Game.gs === "boss_intro") {
        Game.bossIntroT--;
        if (Game.bossIntroT <= 0) Game.gs = "play";
        return;
    }

    updateEnvironment();
    updatePlayer();
    updatePlayerCombat();
    if(typeof updateEnemies === 'function') updateEnemies();
    updateProjectiles();
    updateItemsAndMisc();

    Game.camX += (Game.player.x - CW / 3 - Game.camX) * 0.1; 
    Game.camX = Math.max(0, Math.min(Game.levelW - CW, Game.camX));
}

function applyUpgrade(id) {
    if(id === 1) Game.pShield += 30;
    else if(id === 2) { Game.pBaseDmg += 10; Game.pRangeBonus += 50; } 
    else if(id === 3) { Game.pMaxHp += 50; Game.player.maxHp = Game.pMaxHp; Game.player.hp += 50; }
    else if(id === 4) Game.pSkillDmgMul += 0.3; 
    else if(id === 5) { Game.pDropRate += 0.15; } 
    else if(id === 6) { Game.pAtkSpdMul *= 2.3; Game.pFinalDmgMul *= 0.5; } 
    else if(id === 7) Game.pExtraDmg += 0.15; 
    else if(id === 8) { Game.pMaxHp += 10; Game.player.maxHp = Game.pMaxHp; Game.player.hp += 10; Game.pBaseDmg += 3; Game.pRangeBonus += 6; Game.pBaseDef += 3; Game.pBaseAtkSpd += 0.1; } 
    else if(id === 9) Game.pBaseAtkSpd += 0.2;
    else if(id === 10) Game.pHealOnHit = true;
    else if(id === 11) Game.pDashCDMul -= 0.25;
    else if(id === 12) Game.pMoveSpdMul += 0.2;
    else if(id === 13) Game.pLifestealChance += 0.05;
    else if(id === 14) Game.pCritChance += 0.15;
    else if(id === 15) Game.pCritDmg += 0.5;
    else if(id === 16) { Game.pFinalDmgMul *= 2.3; Game.pAtkSpdMul *= 0.5; } 
    else if(id === 17) Game.pMaxMp += 50;
    else if(id === 18) Game.pParryMp = 40; 
    else if(id === 19) { Game.pReflectDmg += 15; Game.pRegenFrames = 120; } 
    else if(id === 20) Game.pLowHpDmg = 1.5;
    else if(id === 21) Game.pDashInv += 10;
    else if(id === 22) { Game.pBaseDmgMul += 0.5; Game.pMaxHp = Math.max(1, Math.floor(Game.pMaxHp * 0.3)); Game.player.maxHp = Game.pMaxHp; Game.player.hp = Math.max(1, Math.floor(Game.player.hp * 0.3)); }
    else if(id === 23) { Game.pShield += 50; Game.pMoveSpdMul -= 0.1; }
    else if(id === 24) Game.pProjSlow -= 0.15;
    else if(id === 25) Game.pSkillWidth += 0.5; 
    else if(id === 26) Game.pDmgReduction -= 0.15;
    else if(id === 27) { Game.pComboDur += 300; Game.pBloodFestival = true; }
    else if(id === 28) { Game.pBaseDmgMul += 0.4; Game.pCursedPendant = true; }
    else if(id === 29) { Game.pBaseAtkSpd += 0.15; Game.pMoveSpdMul += 0.15; }
    else if(id === 30) Game.pRevive += 1;
    else if(id === 31) { Game.pJmpMul += 0.20; } 
    else if(id === 32) { Game.pJmpMul += 0.15; Game.pMoveSpdMul += 0.10; }
    else if(id === 33) { Game.pJmpMul += 0.30; Game.pDashCDMul -= 0.15; }
    
    if (!Game.obtainedItems) Game.obtainedItems = [];
    Game.obtainedItems.push(id);
}

function generateUpgradeOptions() {
    Game.offeredItems = [];
    let pool = Array.from({length: 33}, (_, i) => i + 1);
    
    if (Game.obtainedItems && Game.obtainedItems.length > 0) {
        pool = pool.filter(id => !Game.obtainedItems.includes(id));
    }

    for (let i = 0; i < 3; i++) {
        if (pool.length === 0) break;
        let r = Math.floor(Math.random() * pool.length);
        Game.offeredItems.push(pool[r]);
        pool.splice(r, 1);
    }
}

function renderUpgrade() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.9)"; ctx.fillRect(0, 0, CW, CH);
    ctx.fillStyle = "#ffcc00"; ctx.font = "30px NeoDunggeunmo"; ctx.textAlign = "center"; 
    ctx.fillText("보스 처치 보상 (1, 2, 3번 키 선택)", CW / 2, 60);
    
    ctx.fillStyle = "#00ccff"; ctx.font = "16px NeoDunggeunmo";
    ctx.fillText(`[R] 리롤 (코인: ${Game.rerollCoins} / 9)`, CW / 2, 90);
    
    ctx.fillStyle = "#ffffff"; ctx.font = "18px NeoDunggeunmo";
    
    const itemNames = [
        "",
        "뼈방패: 30 데미지 흡수 배리어",
        "뼈의봉: 공격력 소폭(+10) 상승 및 무기 길이 대폭(+50) 증가",
        "전사의 피: 최대 HP +50",
        "파괴의 룬: 필살기 데미지 30% 증폭",
        "도굴왕: 몬스터 처치 시 아이템 드롭 확률 상승(+15%)",
        "광전사의 장갑: 공속 2.3배 상승 / 최종 데미지 0.5배",
        "거인의 힘: 평타 추가 데미지 +15%",
        "스컬의 축복: 체력+10, 공격력+3, 방어력+3, 사거리+6, 공속+10%",
        "야수의 손톱: 공격속도 20% 증가",
        "늑대의 피갈퀴손: 평타 타격 시 확률로 HP 회복",
        "닌자의 발걸음: 대쉬 쿨타임 25% 감소",
        "바람의 망토: 이동 속도 20% 증가",
        "거머리의 송곳니: 흡혈 발동 확률 5% 추가 증가",
        "치명적인 일격: 치명타 확률 15% 증가",
        "암살자의 비수: 치명타 데미지 50% 증가",
        "저주받은 대검: 최종 데미지 2.3배 증폭 / 공속 0.5배",
        "마력의 근원: 최대 마나 50 증가",
        "명상의 투구: 패링 성공 시 마나 회복량 2배 증가",
        "가시 갑옷: 피격 시 적 1초 경직 및 2초당 HP 1 회복",
        "광전사의 분노: 체력 30% 이하일 때 데미지 50% 증가",
        "그림자 망토: 대쉬 무적 시간 소폭 증가",
        "폭군의 도끼: 공격력 50% 증폭, 최대 체력 70% 감소",
        "수호자의 긍지: 방어막 +50, 이동 속도 -10%",
        "시간의 시계태엽: 적 투사체 속도 15% 감소",
        "마법사의 안경: 스킬 레이저 두께 50% 증가",
        "강철의 의지: 받는 피해량 15% 감소",
        "피의 축제: 콤보 유지 시간 3배 증가, 5콤보당 공격력 대폭(15) 증가", 
        "저주받은 펜던트: 공격력 40% 증가, 1초당 체력 1 감소",
        "신속의 검: 공속 +15%, 이속 +15%",
        "불사조의 깃털: 사망 시 1회에 한해 체력 50% 부활",
        "도약의 부츠: 점프력 20% 상승",
        "개구리 뒷다리: 점프력 15% 상승 및 이동 속도 10% 상승",
        "페가수스의 깃털: 점프력 30% 상승 및 대쉬 쿨타임 15% 감소"
    ];

    if (Game.offeredItems.length === 3) {
        ctx.fillText(`[1] ${itemNames[Game.offeredItems[0]]}`, CW / 2, 170);
        ctx.fillText(`[2] ${itemNames[Game.offeredItems[1]]}`, CW / 2, 230);
        ctx.fillText(`[3] ${itemNames[Game.offeredItems[2]]}`, CW / 2, 290);
    } else if (Game.offeredItems.length === 0) {
        ctx.fillStyle = "#aaaaaa";
        ctx.fillText("더 이상 획득할 고유 유물이 없습니다. (최대 성장 완료)", CW / 2, 230);
        ctx.fillText("아무 키나 눌러 다음 스테이지로...", CW / 2, 290);
    } else {
        for(let i=0; i<Game.offeredItems.length; i++) {
            ctx.fillText(`[${i+1}] ${itemNames[Game.offeredItems[i]]}`, CW / 2, 170 + i*60);
        }
    }

    if (Game.offeredItems.length === 0 && (dn("Space", "Enter") || dn("Digit1", "Numpad1"))) { exitUpgrade(); }
    else if (Game.offeredItems.length > 0 && (dn("Digit1") || dn("Numpad1"))) { applyUpgrade(Game.offeredItems[0]); exitUpgrade(); } 
    else if (Game.offeredItems.length > 1 && (dn("Digit2") || dn("Numpad2"))) { applyUpgrade(Game.offeredItems[1]); exitUpgrade(); } 
    else if (Game.offeredItems.length > 2 && (dn("Digit3") || dn("Numpad3"))) { applyUpgrade(Game.offeredItems[2]); exitUpgrade(); }
    
    ctx.textAlign = "left";
}

function exitUpgrade() {
    Game.transState = 2; Game.transT = 255;
    Game.gs = "play"; playBGM('play'); 
    if(typeof genStage === 'function') genStage(Game.worldN, Game.levelN);
}

function saveProgress() {
    localStorage.setItem("skull_quartz", Game.darkQuartz);
    localStorage.setItem("skull_permHp", Game.permHpLvl);
    localStorage.setItem("skull_permAtk", Game.permAtkLvl);
    localStorage.setItem("skull_permCrit", Game.permCritLvl);
}

function updateShop() {
    if (dn("Escape") && !K.escOld) { Game.gs = "class_select"; playSfx('item'); }
    
    if (dn("Digit1", "Numpad1") && !K.u1Old) {
        let cost = 10 * (Game.permHpLvl + 1);
        if (Game.darkQuartz >= cost && Game.permHpLvl < 10) { 
            Game.darkQuartz -= cost; Game.permHpLvl++; saveProgress(); playSfx('item'); 
        }
    }
    if (dn("Digit2", "Numpad2") && !K.u2Old) {
        let cost = 15 * (Game.permAtkLvl + 1);
        if (Game.darkQuartz >= cost && Game.permAtkLvl < 10) { 
            Game.darkQuartz -= cost; Game.permAtkLvl++; saveProgress(); playSfx('item'); 
        }
    }
    if (dn("Digit3", "Numpad3") && !K.u3Old) {
        let cost = 20 * (Game.permCritLvl + 1);
        if (Game.darkQuartz >= cost && Game.permCritLvl < 10) { 
            Game.darkQuartz -= cost; Game.permCritLvl++; saveProgress(); playSfx('item'); 
        }
    }
}

function renderShop() {
    const bgGrd = ctx.createRadialGradient(CW/2, CH/2, 0, CW/2, CH/2, CW);
    bgGrd.addColorStop(0, "#3a0066"); 
    bgGrd.addColorStop(1, "#05020a"); 
    ctx.fillStyle = bgGrd;
    ctx.fillRect(0, 0, CW, CH);
    
    ctx.fillStyle = "#ff55ff"; ctx.font = "bold 26px NeoDunggeunmo"; ctx.textAlign = "center";
    ctx.shadowBlur = 10; ctx.shadowColor = "#000";
    ctx.fillText("어둠의 상점 (영구 강화)", CW/2, 45);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = "#00ffff"; ctx.font = "16px NeoDunggeunmo";
    ctx.fillText(`보유 다크 쿼츠: ${Game.darkQuartz} 개`, CW/2, 70);
    
    ctx.fillStyle = "#aaa"; ctx.font = "12px NeoDunggeunmo";
    ctx.fillText("(ESC를 눌러 뒤로가기)", CW/2, 90);

    const upgs = [
        { key: "[1]", name: "최대 체력 증가", lvl: Game.permHpLvl, max: 10, cost: 10 * (Game.permHpLvl + 1), effect: "+10 HP / Lvl" },
        { key: "[2]", name: "기본 공격력 증가", lvl: Game.permAtkLvl, max: 10, cost: 15 * (Game.permAtkLvl + 1), effect: "+2 ATK / Lvl" },
        { key: "[3]", name: "크리티컬 확률 증가", lvl: Game.permCritLvl, max: 10, cost: 20 * (Game.permCritLvl + 1), effect: "+2% CRIT / Lvl" }
    ];

    let boxW = 180;
    let boxH = 200;
    let startY = 110;
    let totalW = boxW * 3 + 40;
    let startX = CW/2 - totalW/2;

    for (let i = 0; i < 3; i++) {
        let u = upgs[i];
        let boxX = startX + i*(boxW + 20);
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)"; 
        ctx.fillRect(boxX, startY, boxW, boxH);
        ctx.strokeStyle = "#aa00ff"; ctx.lineWidth = 2; ctx.strokeRect(boxX, startY, boxW, boxH);
        
        ctx.fillStyle = "#fff"; ctx.font = "bold 14px NeoDunggeunmo";
        ctx.fillText(`${u.key} ${u.name}`, boxX + boxW/2, startY + 30);
        
        ctx.fillStyle = "#00ccff"; ctx.font = "14px NeoDunggeunmo";
        ctx.fillText(`Lv. ${u.lvl} / ${u.max}`, boxX + boxW/2, startY + 60);
        
        ctx.fillStyle = "#aaa"; ctx.font = "12px NeoDunggeunmo";
        ctx.fillText(`효과: ${u.effect}`, boxX + boxW/2, startY + 90);
        
        if (u.lvl < u.max) {
            ctx.fillStyle = Game.darkQuartz >= u.cost ? "#ffdd00" : "#ff3333";
            ctx.font = "bold 14px NeoDunggeunmo";
            ctx.fillText(`비용: ${u.cost} 쿼츠`, boxX + boxW/2, startY + 130);
        } else {
            ctx.fillStyle = "#555";
            ctx.fillText("MAX LEVEL", boxX + boxW/2, startY + 130);
        }
    }
    ctx.textAlign = "left";
}

function updateHUD() {
    const inGame = ["play", "dead", "gameover", "win", "upgrade", "boss_intro"].includes(Game.gs);
    
    // index.html에 작성된 UI 컴포넌트들을 찾아서 인게임 여부에 따라 보이거나 숨김
    const uiHp = document.getElementById("ui-hp");
    const stageLabel = document.getElementById("stageLabel");
    const scoreLabel = document.getElementById("scoreLabel");
    const killLabel = document.getElementById("killLabel");
    const uiSkill = document.getElementById("ui-skill");
    const reviveLabel = document.getElementById("reviveLabel");
    const bossBarWrap = document.getElementById("bossBarWrap");

    if (uiHp) uiHp.style.display = inGame ? "flex" : "none";
    if (stageLabel) stageLabel.style.display = inGame ? "block" : "none";
    if (scoreLabel) scoreLabel.style.display = inGame ? "block" : "none";
    if (killLabel) killLabel.style.display = inGame ? "block" : "none";
    if (uiSkill) uiSkill.style.display = inGame ? "flex" : "none";

    if (!inGame || !Game.player) {
        if (reviveLabel) reviveLabel.style.display = "none";
        if (bossBarWrap) bossBarWrap.style.display = "none";
        return;
    }

    const fill = document.getElementById("playerHpFill");
    const sFill = document.getElementById("playerShieldFill");
    const hpTxt = document.getElementById("hpText");
    
    if (fill && hpTxt) {
        fill.style.width = (Math.max(0, Game.player.hp) / Game.pMaxHp * 100) + "%";
        if (sFill) {
            sFill.style.width = (Math.min(30, Game.pShield) / 30 * 100) + "%";
            sFill.style.display = Game.pShield > 0 ? "block" : "none";
        }
        hpTxt.textContent = Game.player.hp + " / " + Game.pMaxHp + (Game.pShield > 0 ? ` (+${Game.pShield})` : "");
    }
    
    const mpF = document.getElementById("mpFill");
    const sLab = document.getElementById("skillLabel");
    if (mpF && sLab) {
        const pct = Math.floor((Game.pMp / Game.pMaxMp) * 100);
        mpF.style.width = Math.min(100, pct) + "%";
        if (Game.pMp >= 100) { sLab.textContent = "READY!"; sLab.style.color = "#ffee00"; }
        else { sLab.textContent = pct + "%"; sLab.style.color = "#00ccff"; }
    }

    if (reviveLabel) {
        if (Game.pRevive > 0) {
            reviveLabel.style.display = "block";
            reviveLabel.textContent = "[불사조의 깃털 " + Game.pRevive + "개 보유중]";
        } else {
            reviveLabel.style.display = "none";
        }
    }

    const boss = Game.enemies.find(e => e.isBoss && e.active && !e.dead);
    if (boss && bossBarWrap) {
        bossBarWrap.style.display = "flex";
        document.getElementById("bossFill").style.width = (Math.max(0, boss.hp) / boss.maxHp * 100) + "%";
    } else if (bossBarWrap) {
        bossBarWrap.style.display = "none";
    }

    const regionNames = ["", "고블린 초원", "고블린 전초기지", "스켈레톤 무덤", "스켈레톤 감옥", "언데드 묘지", "저주받은 성당", "어둠의 숲", "마족 성채", "마왕성 입구", "마왕의 왕좌"];
    let rName = regionNames[Math.min(Game.worldN, 10)];
    if(stageLabel) stageLabel.textContent = `[${rName}] STAGE ${Game.worldN}-${Game.levelN}${Game.levelN === 3 ? " [BOSS]" : ""}`;
    
    if(scoreLabel) scoreLabel.textContent = "SCORE: " + Game.score; 
    if(killLabel) killLabel.textContent = "처치: " + Game.kills;
}

// 💡 [패치] innerHTML을 사용하여 <br /> 태그가 정상적으로 줄바꿈되도록 수정
function showOv(t, s1, s2, btn) {
    const overlay = document.getElementById("overlay");
    if (overlay) {
        overlay.querySelector("h1").innerHTML = t;
        const subs = overlay.querySelectorAll(".sub"); 
        if (subs.length > 0) subs[0].innerHTML = s1; 
        if (subs.length > 1) subs[1].innerHTML = s2; 
        if (subs.length > 2) subs[2].innerHTML = "";
        const btnEl = document.querySelector(".startBtn"); 
        if (btnEl) btnEl.innerHTML = btn;
        
        overlay.style.display = "flex";
    }
}

// 💡 [패치] 로비 화면(메뉴) 복구 전용 함수 - innerHTML 사용으로 태그 깨짐 방지
function restoreLobbyUI() {
    const overlay = document.getElementById("overlay");
    if (overlay) {
        overlay.style.display = "flex";
        const h1 = overlay.querySelector("h1");
        if (h1) h1.innerHTML = "SKULL YUUSHA";
        const subs = overlay.querySelectorAll(".sub");
        if (subs.length > 0) subs[0].innerHTML = "저주에 의해 죽었지만 해골로 되살아난 용사. <br />마왕을 물리치고 저주를 풀기 위해 나아가야 한다.";
        if (subs.length > 1) subs[1].innerHTML = "[안내] 패링, 기본 공격 시 스킬 게이지가 충전됩니다.<br/> 게이지를 모아 강력한 기술을 사용하세요.";
        if (subs.length > 2) subs[2].innerHTML = "준비가 끝났다면 아래 버튼 또는 SPACE를 눌러주세요.";
        const btn = document.querySelector(".startBtn") || document.getElementById("startBtn");
        if (btn) btn.innerHTML = "▶ READY TO ADVENTURE";
    }
}

function startGame() {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    playBGM('play');
    
    Game.score = 0; Game.kills = 0; Game.worldN = 1; Game.levelN = 1; 
    Game.pMp = 0; Game.comboCount = 0; Game.pRangeBonus = 0; Game.pBaseDef = 0; Game.pShield = 0;
    
    if (Game.pClass === 0) { 
        Game.pMaxHp = 50 + (Game.permHpLvl * 10); Game.pBaseDmg = 30 + (Game.permAtkLvl * 2); 
        Game.pMoveSpdMul = 1.0; Game.pDashCDMul = 1.0; Game.pJmpMul = 1.0; Game.pBaseAtkSpd = 1.0;
    } else if (Game.pClass === 1) { 
        Game.pMaxHp = 35 + (Game.permHpLvl * 10); Game.pBaseDmg = 20 + (Game.permAtkLvl * 2); 
        Game.pMoveSpdMul = 1.25; Game.pDashCDMul = 0.6; Game.pJmpMul = 1.15; Game.pBaseAtkSpd = 1.6; 
    } else if (Game.pClass === 2) { 
        Game.pMaxHp = 35 + (Game.permHpLvl * 10); Game.pBaseDef = -5; Game.pBaseDmg = 35 + (Game.permAtkLvl * 2); 
        Game.pMaxMp = 150; Game.pMoveSpdMul = 1.0; Game.pJmpMul = 1.0; Game.pBaseAtkSpd = 1.0;
    }
    
    Game.pBaseDmgMul = 1.0; Game.pAtkSpdMul = 1.0; Game.pParryMp = 3; 
    Game.pSkillDmgMul = 1.0; Game.pExtraDmg = 0.0; Game.pHealOnHit = false;
    Game.pLifestealChance = 0.05; Game.pCritChance = 0.20 + (Game.permCritLvl * 0.02); Game.pCritDmg = 1.5;
    Game.pReflectDmg = 0; Game.pLowHpDmg = 1.0; Game.pDashInv = 0;
    Game.pProjSlow = 1.0; Game.pSkillWidth = 1.0; Game.pDmgReduction = 1.0; Game.pComboDur = 0; Game.pComboDmg = 0; Game.pRevive = 0;
    
    Game.pFinalDmgMul = 1.0; Game.pMultiplierItems = 0; Game.rerollCoins = 0; 
    Game.pRegenFrames = 0; Game.regenT = 0; Game.pHealOnClear = 0;
    Game.pParryBonus = 0; Game.pCursedPendant = false; Game.curseT = 0;
    Game.pDropRate = 0.35; Game.pBloodFestival = false; Game.obtainedItems = []; 
    
    Game.player = null; 
    Game.isPaused = false; 

    const bbw = document.getElementById("bossBarWrap");
    if(bbw) bbw.style.display = "none";
    if(typeof genStage === 'function') genStage(1, 1); 
    
    Game.transState = 2; Game.transT = 255;
    Game.gs = "play"; 
    
    const overlay = document.getElementById("overlay");
    if(overlay) overlay.style.display = "none";
}

const startBtn = document.getElementById("startBtn");
if(startBtn) {
    startBtn.addEventListener("click", () => {
        const overlay = document.getElementById("overlay");
        if(overlay) overlay.style.display = "none";
        Game.gs = "class_select";
    });
}

let lastTime = 0; const FPS = 60; const interval = 1000 / FPS; 

function updateClassSelect() {
    if (dn("ArrowRight") && !K.rDirOld) { Game.pClass = (Game.pClass + 1) % 3; playSfx('item'); }
    if (dn("ArrowLeft") && !K.lOld) { Game.pClass = (Game.pClass + 2) % 3; playSfx('item'); }

    if (dn("Space") && !K.spcOld) { startGame(); }
    if (dn("KeyS") && !K.sOld) { Game.gs = "shop"; playSfx('item'); }
}

function loop(currentTime) {
    requestAnimationFrame(loop); 
    const deltaTime = currentTime - lastTime;
    
    if (deltaTime >= interval) {
        lastTime = currentTime - (deltaTime % interval);
        
        // 💡 [패치] P키 일시정지
        if (dn("KeyP") && !K.pOld) {
            if (Game.gs === "play" || Game.gs === "boss_intro") { Game.isPaused = !Game.isPaused; playSfx('item'); }
        }
        
        if (Game.isPaused) {
            if (dn("KeyR") && !K.rOld) { Game.isPaused = false; startGame(); }
            
            // 💡 [패치] 일시정지 중 ESC: 로비 화면으로 (restoreLobbyUI 연동)
            if (dn("Escape") && !K.escOld) { 
                Game.isPaused = false; 
                if(typeof stopBGM === 'function') stopBGM(); 
                Game.gs = "menu"; 
                restoreLobbyUI();
            }
        }

        if (Game.transState === 1) { 
            Game.transT += 15;
            if (Game.transT >= 255) {
                Game.transT = 255;
                if(typeof nextStageTrigger === 'function') nextStageTrigger();
            }
        } else if (Game.transState === 2) { 
            Game.transT -= 15;
            if (Game.transT <= 0) { Game.transT = 0; Game.transState = 0; }
        }

        if (Game.gs === "class_select") {
            updateClassSelect();
            if(typeof renderClassSelect === 'function') renderClassSelect();
        }
        else if (Game.gs === "shop") { updateShop(); renderShop(); }
        else if (Game.gs === "upgrade") { 
            if (dn("KeyR") && !K.rOld && Game.rerollCoins > 0) {
                Game.rerollCoins--; playSfx('item');
                if(typeof generateUpgradeOptions === 'function') generateUpgradeOptions();
            }
            renderUpgrade(); 
        } 
        else { 
            if (Game.gs === "dead" && Game.deadTimer <= 0) {
                Game.gs = "gameover";
                if (Game.score > Game.highScore) { Game.highScore = Game.score; localStorage.setItem("skull_highscore", Game.highScore); }
                // 💡 [패치] Space 키로 로비로 복귀 안내
                showOv("YOU DIED", "스코어: " + Game.score, "최고 스코어: " + Game.highScore, "[Space]키로 로비로 복귀");
            }
            
            // 💡 [패치] 사망 후 Space 키로 로비 복귀 연동 (restoreLobbyUI 적용)
            if ((Game.gs === "gameover" || Game.gs === "win") && dn("Space") && !K.spcOld) { 
                if(typeof stopBGM === 'function') stopBGM(); 
                Game.gs = "menu"; 
                restoreLobbyUI();
            }
            
            if ((Game.gs === "play" || Game.gs === "dead" || Game.gs === "boss_intro") && !Game.isPaused) {
                if(typeof update === 'function') update(); 
            }
            
            if (Game.gs === "menu") { 
                const bgGrd = ctx.createRadialGradient(CW/2, CH/2, 0, CW/2, CH/2, CW);
                bgGrd.addColorStop(0, "#2a0b4e"); 
                bgGrd.addColorStop(1, "#05020a"); 
                ctx.fillStyle = bgGrd;
                ctx.fillRect(0, 0, CW, CH);
                
                ctx.fillStyle = "rgba(255, 255, 255, 0.03)"; 
                for (let x = 0; x < CW; x += TILE) ctx.fillRect(x, CH - TILE, TILE, TILE); 
                
                if (dn("Space") && !K.spcOld) {
                    const overlay = document.getElementById("overlay");
                    if(overlay) overlay.style.display = "none";
                    Game.gs = "class_select";
                    if(typeof playSfx === 'function') playSfx('item');
                }
            } else if (Game.gs === "play" || Game.gs === "dead" || Game.gs === "gameover" || Game.gs === "win" || Game.gs === "boss_intro") { 
                if(typeof render === 'function') render(); 
                
                if (Game.isPaused) {
                    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; ctx.fillRect(0, 0, CW, CH);
                    ctx.fillStyle = "#fff"; ctx.font = "bold 40px NeoDunggeunmo"; ctx.textAlign = "center";
                    ctx.fillText("PAUSED", CW/2, CH/2);
                    ctx.font = "16px NeoDunggeunmo"; ctx.fillStyle = "#aaa";
                    ctx.fillText("P: 재개 / R: 재시작 / ESC: 로비 복귀", CW/2, CH/2 + 40);
                    ctx.textAlign = "left";
                }
            } 
            
            if (Game.gs !== "menu" && Game.gs !== "class_select" && Game.gs !== "shop") {
                if (dn("KeyM") && !K.mOld) { Game.isMuted = !Game.isMuted; }
                
                if (Game.isMuted) {
                    ctx.fillStyle = "#ff0000"; ctx.font = "bold 16px NeoDunggeunmo"; ctx.textAlign = "right";
                    ctx.fillText("음소거", CW - 20, 30); ctx.textAlign = "left";
                } else {
                    ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.font = "12px NeoDunggeunmo"; ctx.textAlign = "right";
                    ctx.fillText("M: 음소거", CW - 20, 30); ctx.textAlign = "left";
                }
            }
        }
        
        K.escOld = dn("Escape"); K.mOld = dn("KeyM"); K.rOld = dn("KeyR");
        K.u1Old = dn("Digit1", "Numpad1"); K.u2Old = dn("Digit2", "Numpad2"); K.u3Old = dn("Digit3", "Numpad3");
        K.sOld = dn("KeyS"); 
        K.lOld = dn("ArrowLeft"); 
        K.rDirOld = dn("ArrowRight"); 
        K.pOld = dn("KeyP");
        K.spcOld = dn("Space");

        if(typeof updateHUD === 'function') updateHUD(); 
    }
}

requestAnimationFrame((time) => { lastTime = time; loop(time); });