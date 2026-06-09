// player.js — 플레이어/투사체/이벤트 업데이트
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
    if ((Game.pGunReload || 0) > 0) {
        // 💡 기존의 단순 1씩 감소(Game.pGunReload--)를 지우고, 공속에 비례해 빠르게 감소시킴
        const currentAtkSpd = (Game.pBaseAtkSpd || 1.0) * (Game.pAtkSpdMul || 1.0);
        Game.pGunReload -= currentAtkSpd; 
        
        // 재장전 완료: 탄약 자동 복구
        if (Game.pGunReload <= 0) {
            Game.pGunReload = 0;
            if (Game.pClass === 4) {
                Game.pGunAmmo = 8;
            }
        }
    }
    // 숨쉬기 타이머 (idle 애니메이션용)
    Game._breathT = ((Game._breathT || 0) + 1) % 120;
    if (Game.runStats && Game.comboCount > (Game.runStats.maxCombo || 0)) Game.runStats.maxCombo = Game.comboCount;

    if (p.onGround && p.riding && p.riding.vx) p.x += p.riding.vx;

    const guardNow = dn("KeyV");
    if (guardNow && !p.guarding && p.kbT <= 0 && p.dashT <= 0 && p.atkT === 0) { 
        p.parryT = 10 + Game.pParryBonus;
        if (typeof consumeStamina === 'function') consumeStamina((typeof STAMINA_GUARD !== 'undefined') ? STAMINA_GUARD : 18);
    }
    if (p.parryT > 0) p.parryT--;
    // 방패병: 패링 판정 시간 3배 연장
    if (Game.pClass === 5 && p.justDodgeT > 0 && p.justDodgeT < 6) p.justDodgeT = 18; 
    p.guarding = guardNow;

    if (dn("KeyZ") && p.dashCD <= 0 && !p.guarding && p.kbT <= 0 && p.atkT === 0) {
        const dashCost = typeof STAMINA_DASH !== 'undefined' ? STAMINA_DASH : 35;
        const hasStamina = typeof consumeStamina !== 'function' || consumeStamina(dashCost);
        if (!hasStamina) {
            // 스태미나 부족 — 대시 완전 불가, 문구 쿨타임 60프레임(1초)
            if (!p._staminaWarnT || p._staminaWarnT <= 0) {
                addText(p.x, p.y - 20, "STAMINA!", "#ff6600", 50, 11);
                p._staminaWarnT = 60;
            }
        } else {
        p.dashT = 15 + Game.pDashInv;
        p.dashCD = Math.floor(75 * Game.pDashCDMul);
        p.vy = 0; p.plunging = false; playSfx('dash');
        // 저스트 회피 윈도우 열기
        p.justDodgeT = typeof JUST_DODGE_WINDOW !== 'undefined' ? JUST_DODGE_WINDOW : 6;
        } // hasStamina 블록 종료
        p.justDodgeReady = true;
    }
    
    if (p.dashT > 0) {
        p.dashT--; p.vx = p.facing * 5.3 * Game.pMoveSpdMul; p.vy = 0; addPart(p.x + 7, p.y + 9, "#ffffff", 10, 3);
        // 대시 종료 프레임에 착지 무적 부여 — dashT가 0이 되는 순간 invT 세팅
        if (p.dashT === 0 && Game.invT === 0) {
            Game.invT = 20; // 대시 후 약 0.33초 무적 — 착지 직후 즉시 피격 방지
        }
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
    if (p.dashGauge < 100) {
        p.dashGauge += 0.8; // 초당 회복량 조절
        if (p.dashGauge > 100) p.dashGauge = 100; // 100을 넘지 않도록 제한
    }
    if (p._staminaWarnT > 0) p._staminaWarnT--;

    if (p.onGround) {
        p.airDashUsed = false; // 착지하면 공중 대쉬 충전
        p.jumpCount = 0;
        p.plungeCount = 0; 
    }
    
    // 💡 스페이스바 점프 삭제. 오직 X키로만 점프 가능
    const jpNow = dn("KeyX") || dn("ArrowUp"); // ↑ 방향키도 점프
    // 공격 중에도 점프 가능 — 액션 게임 기본 조작감
    if (jpNow && !p.jpOld && !p.guarding && p.kbT <= 0 && !p.plunging) {
        if (p.onGround) {
            // 땅에서만 첫 점프 — 대시 중 점프 리셋 제거 (무한 점프 버그 방지)
            p.vy = -7.5 * Game.pJmpMul; p.jumpCount = 1;
            playSfx('jump');
            for (let i = 0; i < 4; i++) addPart(p.x + 7, p.y + 18, "#6060ff", 12);
        } else if (p.jumpCount < 2) {
            // 공중 2단 점프 — 대시 취소 없이 정직하게
            p.vy = -6.5 * Game.pJmpMul; p.jumpCount = 2;
            playSfx('jump');
            for (let i = 0; i < 6; i++) addPart(p.x + 7, p.y + 18, "#ff60ff", 15);
        }
    }
    p.jpOld = jpNow;
    p.gOld  = dn("KeyV"); // 가드 이전 프레임 상태 — 튜토리얼 체크용

    if (!p.onGround && dn("ArrowDown") && dn("KeyC") && !p.plunging && p.atkT === 0 && p.dashT <= 0) {
       let canPlunge = true;

        if (Game.pClass === 4 && ((Game.pGunReload || 0) > 0 || (Game.pGunAmmo !== undefined && Game.pGunAmmo <= 0))) {
            canPlunge = false;
        }
        if (Game.pClass === 2 && (p.plungeCount || 0) >= 3) {
            canPlunge = false;
        }

        if (canPlunge) {
            const hasStamina = typeof consumeStamina !== 'function' || consumeStamina(35);
            if (!hasStamina) {
                if (!p._staminaWarnT || p._staminaWarnT <= 0) {
                    addText(p.x, p.y - 20, "스태미너 부족!", "#ff6600", 50, 11);
                    p._staminaWarnT = 60;
                }
                canPlunge = false; // 스태미나 부족 시 발동 취소
            }
        }
        if (Game.pClass === 4) {
            // 발키리: 재장전 중이면 완전 무시 (소프트락 방지)
            if ((Game.pGunReload || 0) <= 0) {
                if (typeof consumeStamina === 'function') consumeStamina(35);
                if (Game.pGunAmmo === undefined) Game.pGunAmmo = 8;
                const shots = Game.pGunAmmo;
                if (shots <= 0) {
                    // 탄약 없음 — 강하 불가 (재장전 대기)
                } else {
                    p.vy = -5; p.y -= 2;
                    for (let qi = 0; qi < shots; qi++) {
                        setTimeout(() => {
                            if (!Game.player || Game.player.dead) return;
                            const pp = Game.player;
                            const currentDmg2 = Game.pBaseDmg * (Game.pBaseDmgMul||1) * (Game.pFinalDmgMul||1);
                            const yOff = (pp.h/2) - qi * 5;
                            spawnBullet(pp.x + pp.w/2, pp.y + yOff, pp.facing * 10, 9, 40, 5, 0, Math.floor(currentDmg2));
                            playSfx('mob_laser');
                        }, qi * 60);
                    }
                    Game.pGunAmmo = 0;
                    Game.pGunReload = 90;
                    if (!Game._reloadTextShown) {
                        addText(p.x, p.y-22, "재장전 중...", "#aaaaaa", 90, 12);
                        Game._reloadTextShown = true;
                        setTimeout(() => { Game._reloadTextShown = false; }, 1500);
                    }
                    p.atkT = Math.max(shots * 60 / 16, 20);
                }
            }
        } else if (Game.pClass === 2) {
            if (typeof consumeStamina === 'function') consumeStamina(35);
            if ((p.plungeCount || 0) < 3) {
                p.plungeCount = (p.plungeCount || 0) + 1;
                p.atkT = Math.floor(20 / ((Game.pBaseAtkSpd || 1) * (Game.pAtkSpdMul || 1)));
                p.vy = -5;
                playSfx('atk');
                Game.camShake = 5;
                let currentBaseDmg2 = Game.pBaseDmg * (Game.pBaseDmgMul || 1.0);
                const isCritAir = Math.random() < (Game.pCritChance || 0.2);
                const pdmg2 = Math.floor(currentBaseDmg2 * 1.4 * (isCritAir ? (Game.pCritDmg||1.5) : 1) * (Game.pFinalDmgMul||1));
                spawnBullet(p.x + p.w/2, p.y + p.h/2, p.facing * 8, 0, 40, 6, 0, pdmg2);
                spawnBullet(p.x + 7, p.y + 18, 0, 10, 30, 8, 0, pdmg2);
                Game.pMp = Math.min(Game.pMaxMp, Game.pMp + 3);
            }
        } else {
            if (typeof consumeStamina === 'function') consumeStamina(35);
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
            p.vy = 14; p.vx = p.facing * 6; addPart(p.x+7, p.y+9, "#ff0055", 5);
        } else if (Game.pClass === 4) {
            // 발키리는 공중 총알로 처리 — plunging 안 함 (도달 불가)
            p.plunging = false;
        } else if (Game.pClass === 3) {
            // 버서커: 빠르고 무거운 수직 하강
            p.vy = 14; p.vx = 0; addPart(p.x+7, p.y+9, "#cc0000", 5);
        } else if (Game.pClass === 5) {
            // 방패병: 수직 내려찍기
            p.vy = 13; p.vx = 0; addPart(p.x+7, p.y+9, "#ffdd00", 5);
        } else {
            p.vy = 12; p.vx = 0; addPart(p.x+7, p.y+9, "#ffaa00", 5);
        }
    } else if (p.dashT <= 0 && Game.pClass === 4 && p.plunging && p.atkT > 0 && !p.onGround) {
        p.vy = 0;
    } else if (p.dashT <= 0 && Game.pClass !== 2) {
        p.vy = Math.min(p.vy + GRAV, 9); 
    } else if (p.dashT <= 0 && Game.pClass === 2) {
        p.vy = Math.min(p.vy + GRAV * 0.8, 8);
    }
    // 대쉬 잔상 파티클
    if (p.dashT > 0) {
        const trailCol = Game.pClass === 0 ? "#ff2200" : (Game.pClass === 1 ? "#aa00ff" : "#00ccff");
        for (let i = 0; i < 3; i++) addPart(p.x + Math.random() * p.w, p.y + Math.random() * p.h, trailCol, 10, 3);
    }

    p.x += p.vx;
    p.y += p.vy;

    if (typeof resolveAABB === 'function') resolveAABB(p);
    
    if (p.plunging && p.onGround) {
        p.plunging = false; p.atkT = 20; Game.hitStop = 10; playSfx('plunge_land');
        // 직업별 색깔
        const plungeCol = Game.pClass === 0 ? "#ff4400"
            : (Game.pClass === 1 ? "#cc44ff"
            : (Game.pClass === 3 ? "#880000"   // 버서커: 진한 붉은색
            : (Game.pClass === 4 ? "#ffcc00"   // 발키리: 노란색
            : (Game.pClass === 5 ? "#ffe040"   // 방패병: 밝은 노란색
            : "#00ccff"))));
        Game.camShake = Game.pClass === 3 ? 40 : (Game.pClass === 5 ? 28 : 20);
        // 충격파 링도 직업별 색상
        const plungeRingCol = Game.pClass === 3 ? "#aa0000"  // 버서커: 진한 붉은색
            : (Game.pClass === 5 ? "#ffee44"              // 방패병: 밝은 노란색
            : plungeCol);
        for (let i = 0; i < 30; i++) addPart(p.x + 7, p.y + 18, plungeCol, 25, 4);
        spawnLaser(p.x - 30, p.y + 14, 60, 6, 8, plungeRingCol, 0, true);
        
        let currentBaseDmg = Game.pBaseDmg * (Game.pBaseDmgMul || 1.0);
        // 강하 착지: 크리/콤보/저체력/최종배율 전부 반영
        const isCritPlunge = Math.random() < (Game.pCritChance || 0.2);
        // 다운어택 폭주 제거 — 체간 30 확정 + 1.6배 적정 배율로 정상화
        let pdmg = Math.floor(currentBaseDmg * 1.6 * (Game.pFinalDmgMul || 1)
            * (isCritPlunge ? (Game.pCritDmg || 1.5) : 1)
            * (p.hp / Game.pMaxHp < 0.3 ? (Game.pLowHpDmg || 1.5) : 1));
        pdmg += Math.floor(Game.comboCount / 10) * (Game.pComboDmg || 5);
        if (pdmg < 1) pdmg = 1;
        // 강하 착지 시 체간 30 확정 부여 — isCrit 종속 아님
        Game.enemies.forEach(e => {
            if (e.active && !e.dead && Math.abs(e.x - p.x) < 80 && Math.abs(e.y - p.y) < 80) {
                if (typeof applyPoiseHit === 'function') applyPoiseHit(e, 15);
            }
        });
        // 강하 착지 범위 내 적에게 실제 데미지 적용
        let plungeHitAny = false;
        Game.enemies.forEach(e => {
            if (e.active && !e.dead && Math.abs(e.x - p.x) < 80 && Math.abs(e.y - p.y) < 80) {
                plungeHitAny = true;
            }
        });
        // 강하 착지가 적에게 닿았을 때: MP 회복 + 콤보 카운터 증가
        if (plungeHitAny) {
            Game.pMp = Math.min(Game.pMaxMp, Game.pMp + 5);
            // 강하도 콤보에 기여 — 1타로 계산 (콤보 타이머 리셋)
            Game.comboCount = (Game.comboCount || 0) + 1;
            Game.comboTimer = 150 + (Game.pComboDur || 0);
            if (Game.runStats) Game.runStats.maxCombo = Math.max(Game.runStats.maxCombo || 0, Game.comboCount);
        }

        if (Game.pClass === 1) {
            // 도적: 전방 2발
            spawnBullet(p.x + 7, p.y + 5, p.facing * 10, 0, 10, 15, 2, pdmg);
            spawnBullet(p.x + 7, p.y + 5, p.facing * 12, 0, 10, 15, 2, pdmg);
        } else if (Game.pClass === 4) {
            // 발키리 강하: 마법사처럼 공중에서 대각선 아래 방향으로 총알 연속 발사
            // 공중에 머무르며 아래로 탄 4발
            for (let qi = 0; qi < 4; qi++) {
                setTimeout(() => {
                    if (!Game.player) return;
                    const pp = Game.player;
                    // 총알마다 발사 높이 점진 상승 (qi 증가할수록 위에서 발사)
                    const yOff = (pp.h / 2) - qi * 5;
                    spawnBullet(pp.x + pp.w/2, pp.y + yOff, pp.facing * 10, 9, 35, 5, 0, pdmg);
                    playSfx('mob_laser');
                    for (let j=0;j<3;j++) addPart(pp.x+pp.w/2+pp.facing*8, pp.y+yOff, "#ffcc00", 10, 3);
                }, qi * 80);
            }
        } else {
            spawnBullet(p.x - 10, p.y + 5, -8, 0, 15, 18, 2, pdmg);
            spawnBullet(p.x + 10, p.y + 5, 8, 0, 15, 18, 2, pdmg);
        }
    }

    p.x = Math.max(0, Math.min(Game.levelW - p.w, p.x));
    
    if (p.y > CH + 60) { 
        p.guarding = false; p.plunging = false; p.dashT = 0;
        let fallDmg = Math.floor(p.hp * 0.3);
        if (fallDmg < 1) fallDmg = 1;
        if(typeof takeDmg === 'function') takeDmg(fallDmg, null, true); 
        
        let safePlatform = Game.platforms.find(t => t.float && !t.drop && !t.vx) || Game.platforms.find(t => t.float && !t.drop) || Game.platforms[0];
        if (safePlatform) {
            p.x = safePlatform.x + safePlatform.w / 2 - p.w / 2;
            // 공중에 스폰해서 즉시 재낙사 방지 — 발판 위로 좀 띄워줌
            p.y = safePlatform.y - p.h - 20;
        } else {
            p.x = 80; p.y = -50;
        }
        // 낙사 직후 속도 완전 초기화 — 관성 때문에 또 떨어지는 꼴 방지
        p.vx = 0; p.vy = 0; 
    }

    if (p.atkT > 0) p.atkT--; if (p.atkAnim > 0) p.atkAnim--; if (Game.invT > 0) Game.invT--;
    // Witch Time 윈도우 감소
    if ((p.justDodgeT || 0) > 0) { p.justDodgeT--; if (p.justDodgeT <= 0) p.justDodgeReady = false; }
}

function updatePlayerCombat() {
    const p = Game.player;
    if (p.dead) return;
    
    const currentAtkSpd = (Game.pBaseAtkSpd || 1.0) * (Game.pAtkSpdMul || 1.0);
    const currentBaseDmg = Game.pBaseDmg * (Game.pBaseDmgMul || 1.0);

    const _npcTalking = Game.eventObjects && Game.eventObjects.some(ev => ev.type === 'npc' && ev.talking);
    if (dn("KeyC") && !dn("ArrowDown") && p.atkT === 0 && !p.guarding && p.kbT <= 0 && p.dashT <= 0 && !p.plunging && !_npcTalking) {
        // 스태미나 부족하면 공격 자체를 막음 — 무한 콤보 방지
        // 평타 스태미나 소모 없음 — 공속 빠를수록 의미없어지는 문제 해결
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
            // 마법사: 하늘색 마법탄
            spawnBullet(cx, cy, p.facing * 8, 0, 40, 6, 0, dmg);
            if (isLastHit) {
                spawnBullet(cx, cy - 10, p.facing * 8, -2, 40, 6, 0, dmg);
                spawnBullet(cx, cy + 10, p.facing * 8, 2, 40, 6, 0, dmg);
                Game.camShake = 5;
            }
            Game.pMp = Math.min(Game.pMaxMp, Game.pMp + 3);
            Game.comboCount++; Game.comboTimer = 150 + Game.pComboDur;
        } else if (Game.pClass === 4) {
            // 발키리: 총 원거리 공격
            if ((Game.pGunReload || 0) > 0) {
                // 재장전 중 — 공격 불가 (문구는 render_ui에서만 표시)
            } else {
                if (Game.pGunAmmo === undefined) Game.pGunAmmo = 8;
                // 탄약 소진 시 자동 재장전
                if (Game.pGunAmmo <= 0) {
                    Game.pGunReload = 90;
                    Game.pGunAmmo = 8;
                    // 재장전 문구 — 쿨타임 방지
                    if (!Game._reloadTextShown) {
                        addText(p.x, p.y - 22, "재장전 중...", "#aaaaaa", 90, 12);
                        Game._reloadTextShown = true;
                        setTimeout(() => { Game._reloadTextShown = false; }, 1500);
                    }
                } else {
                    // 사각형 총알 파티클
                    const gunRange = 40 + Math.floor((Game.pRangeBonus||0)*0.8);
                    spawnBullet(cx, cy-2, p.facing*14, -0.1, gunRange, 5, 0, dmg);
                    Game.pGunAmmo--;
                    playSfx('mob_laser');
                    Game.pMp = Math.min(Game.pMaxMp, Game.pMp + 1);
                    // 콤보는 총알이 적에 명중할 때만 (bullets 충돌에서 처리) — 여기서 중복 제거
                    // 탄약 소진 시 즉시 자동 재장전 트리거
                    if (Game.pGunAmmo <= 0) {
                        Game.pGunReload = 90;
                        Game.pGunAmmo = 8;
                        if (!Game._reloadTextShown) {
                            addText(p.x, p.y - 22, "재장전 중...", "#aaaaaa", 90, 12);
                            Game._reloadTextShown = true;
                            setTimeout(() => { Game._reloadTextShown = false; }, 1500);
                        }
                    }
                }
            }
        } else {
            let hitTarget = false;
            Game.enemies.forEach((e) => {
                if (!e.active || e.dead) return;
                if (Math.abs(e.x + e.w / 2 - cx) < rangeX / 2 + e.w / 2 && Math.abs(e.y + e.h / 2 - cy) < rangeY / 2 + e.h / 2) {
                    if (e.isBoss && (e.y + e.h) < Game.player.y) return;
                    // 강하공격은 처형 없음 — 기본공격 전용
                    if(typeof hitE === 'function') hitE(e, dmg, p.facing, isCrit, Game.pExtraDmg);
                    // 평타도 체간 소량 감소 — 계속 맞으면 결국 스턴 유도
                    const poiseDmgNormal = isCrit ? 12 : 6;
                    if (typeof applyPoiseHit === 'function') applyPoiseHit(e, poiseDmgNormal);
                    hitTarget = true;
                }
            });

            if (isLastHit) Game.camShake = 8; 
            if (hitTarget) { 
                Game.pMp = Math.min(Game.pMaxMp, Game.pMp + 2); 
                if (isLastHit) Game.hitStop = 6;
                Game.comboCount++;
                Game.comboTimer = 150 + Game.pComboDur;
                // 콤보 마일스톤 연출
                if (Game.comboCount === 10) { playSfx('combo_high'); addText(Game.player.x, Game.player.y - 40, "10 콤보!", "#dddddd", 50, 18); }
                else if (Game.comboCount === 30) { playSfx('combo_high'); addText(Game.player.x, Game.player.y - 40, "30 콤보!!", "#ff6600", 60, 22); }
                else if (Game.comboCount === 50) { playSfx('combo_high'); addText(Game.player.x, Game.player.y - 40, "50 콤보!!!", "#ff0000", 70, 26); }
            } 
            for (let i = 0; i < (isLastHit ? 15 : 6); i++) { addPart(cx + (Math.random() - 0.5) * 20, cy + (Math.random() - 0.5) * 20, isLastHit ? "#ff2222" : "#ffffff", 15, 3); }
        }
    }

    // ── 액티브 스킬 (Shift) — MP 30 소모, 직업별 스킬 ──
    if (dn("ShiftLeft", "ShiftRight") && !p.guarding && p.kbT <= 0 && p.dashT <= 0 && !p.plunging && p.atkT === 0) {
        const skillMpCost = 15;
        if (Game.pMp < skillMpCost) {
            if (!Game._skillWarnT || Game._skillWarnT <= 0) {
                addText(p.x, p.y - 30, "마나 부족!", "#8888ff", 40, 13);
                Game._skillWarnT = 45;
            }
        } else {
            Game.pMp -= skillMpCost;
            p.atkT = Game.pClass === 3 ? 40 : (Game.pClass === 5 ? 30 : 20);
            p.invT = Math.max(p.invT || 0, (p.atkT + 60));
            playSfx('skill');
            let skillDmg = Math.floor(currentBaseDmg * 5 * Game.pSkillDmgMul * Game.pFinalDmgMul);
            const laserW = 280 + (Game.pRangeBonus || 0);
            const laserX = p.facing > 0 ? p.x + p.w : p.x - laserW;
            const cx = p.x + p.w / 2, cy = p.y + p.h / 2;

            if (Game.pClass === 0) {
                // 파워스트라이크: 텔레포트 돌진 — 화면 끝까지 순간이동, 경로상 적 전체 타격
                const teleRange = 600; // 텔레포트 거리
                const startX  = p.x;
                // 경로 상 적 먼저 타격 (텔레포트 전에 계산)
                const hitList = [];
                Game.enemies.forEach(e => {
                    if (!e.active || e.dead) return;
                    const edx = (e.x + e.w/2) - (p.x + p.w/2);
                    if (Math.sign(edx) === p.facing
                        && Math.abs(edx) < teleRange
                        && Math.abs((e.y+e.h/2) - (p.y+p.h/2)) < 45) {
                        hitList.push(e);
                    }
                });
                // 텔레포트: 가장 먼 피격 적 뒤로 이동 (or 최대 거리)
                if (hitList.length > 0) {
                    const farthest = hitList.reduce((a, b) =>
                        Math.abs((b.x+b.w/2)-(p.x+p.w/2)) > Math.abs((a.x+a.w/2)-(p.x+p.w/2)) ? b : a);
                    p.x = farthest.x + p.facing * 30; // 적 바로 뒤
                } else {
                    p.x = Math.max(0, Math.min(Game.levelW - p.w, p.x + p.facing * teleRange));
                }
                p.vx = 0; p.atkT = 20;
                // 순간이동 후 타격 + 이펙트
                hitList.forEach(e => {
                    if (typeof hitE === 'function') hitE(e, skillDmg, p.facing, false);
                    if (typeof applyPoiseHit === 'function') applyPoiseHit(e, 25);
                    for (let j=0;j<8;j++) addPart(e.x+e.w/2, e.y+e.h/2, j<5?"#ff2200":"#ff6600", 22, 4);
                });
                // 텔레포트 잔상 파티클 (이동 경로 전체)
                const dist = Math.abs(p.x - startX);
                for (let i = 0; i < 18; i++) {
                    const tx = startX + p.facing * (dist * i / 18);
                    addPart(tx + (Math.random()-0.5)*8, cy + (Math.random()-0.5)*16, "#ff4400", 18, 3);
                }
                for (let i = 0; i < 30; i++) addPart(p.x+p.w/2, cy, i<20?"#ff2200":"#881100", 30, i<15?5:3);
                addText(p.x, p.y - 35, "파워스트라이크", "#ffffff", 50, 20);
                p.invT = 60;
                Game.skillFlashCol = "rgba(180,0,0,0.3)"; Game.skillFlashT = 16; Game.camShake = 25;

            } else if (Game.pClass === 1) {
                // 새비지블로우: 6연타 무차별 베기 + 마지막 돌진
                const sRange1 = 60 + (Game.pRangeBonus || 0);

                // 1. 스킬 시작 연출 및 무적 선 부여
                addText(p.x, p.y-35, "새비지블로우", "#cc00ff", 50, 20);
                p.invT = 60;
                Game.skillFlashCol = "rgba(80,0,150,0.25)"; Game.skillFlashT = 18;

                // 2. 제자리 6연타 난도질
                for (let i = 0; i < 6; i++) {
                    setTimeout(() => {
                        if (!Game.player || Game.player.dead) return;
                        const pp = Game.player;
                        // 무기 휘두르기 모션 세팅
                        pp.atkAnim = 10; pp.combo = (i % 2) + 1;
                        Game.enemies.forEach(e => {
                            if (!e.active || e.dead) return;
                            const edx = (e.x+e.w/2)-(pp.x+pp.w/2);
                            if (Math.sign(edx) === pp.facing && Math.abs(edx) < sRange1 && Math.abs((e.y+e.h/2)-(pp.y+pp.h/2)) < 35) {
                                if (typeof hitE === 'function') hitE(e, Math.floor(skillDmg*0.22), pp.facing, false);
                            }
                        });
                        for (let j=0;j<6;j++) addPart(pp.x+pp.w/2+pp.facing*25, pp.y+pp.h/2+(Math.random()-0.5)*20, "#aa00ff", 12, 3);
                        playSfx('atk');
                    }, i * 65);
                }

                // 3. 마지막 6타 끝난 직후: 블링크(돌진) 및 마무리 참격
                setTimeout(() => {
                    if (!Game.player || Game.player.dead) return;
                    const pp = Game.player;
                    const blinkRange = 200;
                    const blinkStartX = pp.x;
                    const cy = pp.y + pp.h / 2; // 이펙트용 y좌표 중앙값
                    const blinkHitList = [];

                    // 돌진 거리 계산
                    Game.enemies.forEach(e => {
                        if (!e.active || e.dead) return;
                        const edx = (e.x+e.w/2)-(pp.x+pp.w/2);
                        if (Math.sign(edx)===pp.facing && Math.abs(edx)<blinkRange && Math.abs((e.y+e.h/2)-(pp.y+pp.h/2))<40)
                            blinkHitList.push(e);
                    });

                    // 블링크 이동
                    if (blinkHitList.length > 0) {
                        const farthest = blinkHitList.reduce((a,b) =>
                            Math.abs((b.x+b.w/2)-(pp.x+pp.w/2))>Math.abs((a.x+a.w/2)-(pp.x+pp.w/2))?b:a);
                        pp.x = farthest.x + pp.facing * 20;
                    } else {
                        pp.x = Math.max(0, Math.min(Game.levelW-pp.w, pp.x+pp.facing*blinkRange));
                    }
                    
                    pp.vx = pp.facing * 10; pp.dashT = 8;
                    const blinkDist = Math.abs(pp.x-blinkStartX);
                    
                    // 돌진 잔상 이펙트
                    for (let i=0;i<10;i++) {
                        const tx = blinkStartX + pp.facing*(blinkDist*i/10);
                        addPart(tx+(Math.random()-0.5)*6, cy+(Math.random()-0.5)*12, "#aa00ff", 14, 2);
                    }

                    // 돌진 마무리 참격 데미지
                    Game.enemies.forEach(e => {
                        if (!e.active || e.dead) return;
                        const edx = (e.x+e.w/2)-(pp.x+pp.w/2);
                        if (Math.sign(edx) === pp.facing && Math.abs(edx) < sRange1+40 && Math.abs((e.y+e.h/2)-(pp.y+pp.h/2)) < 40) {
                            if (typeof hitE === 'function') hitE(e, Math.floor(skillDmg*0.7), pp.facing, false);
                            if (typeof applyPoiseHit === 'function') applyPoiseHit(e, 30);
                        }
                    });
                    for (let j = 0; j < 25; j++) addPart(pp.x+pp.w/2+pp.facing*30, pp.y+pp.h/2, j<15?"#cc00ff":"#550088", 28, 4);
                    Game.camShake = 15;
                }, 6 * 65);
                const blinkRange = 200;
                const blinkStartX = p.x;
                const blinkHitList = [];
                Game.enemies.forEach(e => {
                    if (!e.active || e.dead) return;
                    const edx = (e.x+e.w/2)-(p.x+p.w/2);
                    if (Math.sign(edx)===p.facing && Math.abs(edx)<blinkRange && Math.abs((e.y+e.h/2)-(p.y+p.h/2))<40)
                        blinkHitList.push(e);
                });
                if (blinkHitList.length > 0) {
                    const farthest = blinkHitList.reduce((a,b) =>
                        Math.abs((b.x+b.w/2)-(p.x+p.w/2))>Math.abs((a.x+a.w/2)-(p.x+p.w/2))?b:a);
                    p.x = farthest.x + p.facing * 20;
                } else {
                    p.x = Math.max(0, Math.min(Game.levelW-p.w, p.x+p.facing*blinkRange));
                }
                p.vx = 0;
                const blinkDist = Math.abs(p.x-blinkStartX);
                for (let i=0;i<10;i++) {
                    const tx = blinkStartX + p.facing*(blinkDist*i/10);
                    addPart(tx+(Math.random()-0.5)*6, cy+(Math.random()-0.5)*12, "#aa00ff", 14, 2);
                }
                addText(p.x, p.y-35, "새비지블로우", "#cc00ff", 50, 20);
                p.invT = 60;
                Game.skillFlashCol = "rgba(80,0,150,0.25)"; Game.skillFlashT = 18;

            } else if (Game.pClass === 2) {
                // Night Hollow: 기본 투사체(r=6)의 5배 크기 구체, 5초 지속, 0.5초마다 최대 10회
                const nhBullet = spawnBullet(cx, cy, p.facing*0.8, 0, 300, 30, 4, Math.floor(skillDmg*0.55));
                for (let i=0;i<40;i++) addPart(cx+p.facing*20, cy, i<25?"#0088cc":"#005588", 35, i<20?6:3);
                addText(p.x, p.y-35, "Night Hollow", "#0099cc", 65, 22);
                Game.skillFlashCol = "rgba(0,100,170,0.3)"; Game.skillFlashT = 18; Game.camShake = 12;

            } else if (Game.pClass === 3) {
                // 인레이지: 도약 → 내려찍기 모션 → 착지 광역 폭발
                // 단계1: 도약
                p.vy = -14; p.vx = 0; p.onGround = false;
                Game._berserkSlam = true; // 내려찍기 플래그

                // 단계2: 200ms 후 강제 하강
                setTimeout(() => {
                    if (!Game.player || Game.player.dead) return;
                    Game.player.vy = 18; // 강하게 내려찍기
                    Game.player.vx = 0;
                    // 하강 중 파티클
                    for (let i=0;i<8;i++) {
                        setTimeout(() => {
                            if (!Game.player) return;
                            for (let j=0;j<4;j++) addPart(Game.player.x+Game.player.w/2+(Math.random()-0.5)*10, Game.player.y+Game.player.h, "#cc0000", 15, 4);
                        }, i*30);
                    }
                }, 220);

                // 단계3: 착지 판정 (350ms 후 — 땅에 닿을 때)
                setTimeout(() => {
                    if (!Game.player) return;
                    const pp = Game.player;
                    Game._berserkSlam = false;
                    // 착지 광역 — 범위 넓게 (±180px)
                    Game.enemies.forEach(e => {
                        if (!e.active || e.dead) return;
                        if (Math.abs((e.x+e.w/2)-(pp.x+pp.w/2)) < 180 && Math.abs((e.y+e.h/2)-(pp.y+pp.h/2)) < 80) {
                            if (typeof hitE === 'function') hitE(e, Math.floor(skillDmg*1.8), pp.facing, false);
                            if (typeof applyPoiseHit === 'function') applyPoiseHit(e, 50);
                            for (let j=0;j<8;j++) addPart(e.x+e.w/2, e.y+e.h/2, j<5?"#cc0000":"#ff4400", 25, 5);
                        }
                    });
                    // 충격파 파티클
                    for (let i=0;i<80;i++) {
                        const ang = Math.random() * Math.PI * 2;
                        const dist = Math.random() * 90;
                        addPart(pp.x+pp.w/2+Math.cos(ang)*dist, pp.y+pp.h, i<50?"#cc0000":"#550000", 60, i<35?7:4);
                    }
                    // 충격파 링 (빔으로 표현)
                    spawnLaser(pp.x-90, pp.y+pp.h-4, 180, 8, 12, "#880000", 0, true);
                    Game.camShake = 70; playSfx('boss_atk');
                }, 450);

                addText(p.x, p.y - 35, "인레이지", "#ff0000", 50, 22);
                Game.skillFlashCol = "rgba(150,0,0,0.35)"; Game.skillFlashT = 20;

            } else if (Game.pClass === 4) {
                // 서먼 크루: 5초 동안 선원 2명 소환
                Game.crewMinions = Game.crewMinions || [];
                for (let s = -1; s <= 1; s += 2) {
                    const cm = {
                        active: true, x: p.x + s * 30, y: p.y,
                        hp: Math.floor(currentBaseDmg * 0.6 * 20),
                        atk: Math.floor(currentBaseDmg * 0.6),
                        life: 600, // 10초(600프레임)
                        atkT: 0, facing: p.facing
                    };
                    Game.crewMinions.push(cm);
                }
                for (let i = 0; i < 20; i++) addPart(cx, cy, "#666", 25, 4);
                addText(p.x, p.y - 35, "서먼 크루", "#888888", 50, 20);
                Game.skillFlashCol = "rgba(80,80,80,0.25)"; Game.skillFlashT = 15; Game.camShake = 10;

            } else if (Game.pClass === 5) {
                // 디바인 저지먼트: 망치 내려찍기 광역 근접 (빔 없음)
                const hammerRange = 80 + (Game.pRangeBonus || 0);
                Game.enemies.forEach(e => {
                    if (!e.active || e.dead) return;
                    const edx = (e.x+e.w/2)-(p.x+p.w/2);
                    if (Math.sign(edx) === p.facing && Math.abs(edx) < hammerRange && Math.abs((e.y+e.h/2)-(p.y+p.h/2)) < 50) {
                        if (typeof hitE === 'function') hitE(e, skillDmg, p.facing, false);
                        if (typeof applyPoiseHit === 'function') applyPoiseHit(e, 35);
                    }
                });
                for (let i = 0; i < 40; i++) {
                    addPart(cx+p.facing*(20+Math.random()*40), cy+(Math.random()-0.5)*30,
                        i<25?"#ffcc00":"#ffaa00", 35, i<20?6:3);
                }
                addText(p.x, p.y - 35, "디바인 저지먼트", "#ffdd00", 50, 18);
                Game.skillFlashCol = "rgba(200,180,0,0.25)"; Game.skillFlashT = 18; Game.camShake = 25;
            }
        }
    }
    if (Game._skillWarnT > 0) Game._skillWarnT--;
}

// 발키리 서먼 크루 미니언 업데이트
function updateCrewMinions() {
    if (!Game.crewMinions || !Game.player) return;
    const p = Game.player;
    Game.crewMinions = Game.crewMinions.filter(cm => cm.active && cm.life > 0);
    for (const cm of Game.crewMinions) {
        cm.life--;
        if (cm.life <= 0) { cm.active = false; continue; }
        // 플레이어 추종 — 너무 멀면 즉시 텔레포트 (맵 이동 시 이상한 위치 방지)
        const tdx = p.x - cm.x;
        if (Math.abs(tdx) > 300) {
            // 즉시 플레이어 옆으로 이동
            cm.x = p.x + (cm === Game.crewMinions[0] ? -30 : 30);
        } else if (Math.abs(tdx) > 30) {
            cm.x += Math.sign(tdx) * 3.5;
        }
        cm.y = p.y;
        cm.facing = p.facing;
        // 가장 가까운 적 공격
        cm.atkT = (cm.atkT || 0) - 1;
        if (cm.atkT <= 0) {
            // 크루 미니언: 총으로 원거리 공격
            let closest = null, minDist = 9999;
            for (const e of Game.enemies) {
                if (!e.active || e.dead) continue;
                const d = Math.abs(e.x - cm.x);
                if (d < minDist) { minDist = d; closest = e; }
            }
            if (closest && minDist < 200 && typeof spawnBullet === 'function') {
                const dir = closest.x > cm.x ? 1 : -1;
                cm.facing = dir;
                spawnBullet(cm.x + 10*dir, cm.y + 5, dir * 12, -0.2, 40, 4, 0, cm.atk);
                cm.atkT = 25;
            }
        }
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
                if (b.sk !== 4 && overlap({ x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 }, t)) { b.active = false; return; } 
            }
        }
        
        Game.enemies.forEach((e) => {
            if (!e.active || e.dead) return;
            const hitR = b.sk === 2 ? b.r * 2.5 : b.r;
            if (Math.abs(e.x + e.w / 2 - b.x) < e.w / 2 + hitR && Math.abs(e.y + e.h / 2 - b.y) < e.h / 2 + hitR) { 
                if (b.sk === 4) {
                    // Night Hollow: 30프레임(0.5초)마다 최대 10회 타격
                    b.nhLastHit = b.nhLastHit || {};
                    const eid = Game.enemies.indexOf(e);
                    const lastF = b.nhLastHit[eid] || -9999;
                    if (Game.frameCount - lastF >= 30 && (b.nhHitCount||0) < 10) {
                        if(typeof hitE === 'function') hitE(e, b.dmg, b.vx > 0 ? 1 : -1, false);
                        b.nhLastHit[eid] = Game.frameCount;
                        b.nhHitCount = (b.nhHitCount||0) + 1;
                    }
                    // 비활성화 안 함 — life 소진 시 자연 소멸
                } else {
                    if(typeof hitE === 'function') hitE(e, b.dmg || (Game.pBaseDmg * (Game.pBaseDmgMul||1)), b.vx > 0 ? 1 : -1, false);
                    if (b.sk && b.sk !== 3) Game.hitStop = 3;
                    if (Game.pClass === 2 && !b.sk) Game.pMp = Math.min(Game.pMaxMp, Game.pMp + 1);
                    if (!b.sk) {
                        if (typeof applyPoiseHit === 'function') applyPoiseHit(e, Game.pClass === 4 ? 5 : 10);
                        Game.comboCount++;
                        Game.comboTimer = 150 + Game.pComboDur;
                    }
                    if (b.sk !== 3) b.active = false;
                    // sk=3(마법사 3연타): 관통 — 비활성화 안 함
                }
            }
        });
    });

    Game.eBullets.forEach((b) => { 
        if (!b.active) return;
        b.x += b.vx * Game.pProjSlow; b.y += b.vy * Game.pProjSlow;
        // grav=true면 중력 적용, false면 직선 비행 (vy 변화 없음)
        if (b.grav) b.vy += 0.4 * Game.pProjSlow;
        b.life--;
        const _floorY = CH - 40;
        // sk=4(Night Hollow)는 바닥 충돌 무시
        if (b.sk === 4) {
            if (b.life <= 0 || b.x < -50 || b.x > (Game.levelW || 3200) + 50) { b.active = false; return; }
        } else {
            if (b.life <= 0 || b.y > _floorY + 50 || b.x < -50 || b.x > (Game.levelW || 3200) + 50) { b.active = false; return; }
        }

        // 발판 충돌 — 발판 상면 위로 올라오는 경우도 처리
        for (const t of Game.platforms) {
            if (overlap({ x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 }, t)) {
                b.active = false; return;
            }
            // 발판을 통과해버린 경우 — y가 발판 아래에 있으면 제거
            if (b.y > t.y + t.h && b.x >= t.x && b.x <= t.x + t.w) {
                b.active = false; return;
            }
        }
        // 투사체 r이 8~10으로 커졌으므로 히트박스도 r 기반 동적 계산
        const hitR2 = (b.r || 8) * 0.85;
        const pCx = Game.player.x + Game.player.w / 2;
        const pCy = Game.player.y + Game.player.h / 2;
        if (Game.invT === 0 && Math.abs(pCx - b.x) < hitR2 + 8 && Math.abs(pCy - b.y) < hitR2 + 10 && !Game.player.dead) {
            if (typeof takeDmg === 'function') takeDmg(b.dmg || 15, b, b.unblockable); b.active = false;
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
            // 적 레이저: 최초 1회만 피격 (hitTargets로 중복 방지)
            if (!l.hitTargets) l.hitTargets = new Set();
            if (l.life > l.maxLife - 5 && !l.hitTargets.has('player')) {
                if (Game.invT === 0 && overlap(Game.player, l) && !Game.player.dead) {
                    if (typeof takeDmg === 'function') takeDmg(l.dmg || 20, null, l.unblockable);
                    l.hitTargets.add('player');
                }
            }
        }
        l.life--;
        if (l.life <= 0) l.active = false;
    });
}

function updateItemsAndMisc() {
    // 튜토리얼 통과 조건 체크 — 각 조작 1회 수행 여부 감지
    if (Game.isTutorial && Game.tutorialChecks) {
        const p2 = Game.player;
        const tc = Game.tutorialChecks;

        // dash: 대시 모션 중 — 정상
        if (p2 && p2.dashT > 0) tc.dash = true;

        // jump: 점프 키(X)를 실제로 누른 순간만 — 낙하나 발판 아래 등 즉시 true 방지
        if (p2 && dn("KeyX") && !p2.jpOld && !p2.onGround) tc.jump = true;

        // attack: 실제 공격이 적에게 닿았을 때(콤보 카운트 증가) — atkAnim 잔류 오감지 방지
        if (Game.comboCount > 0) tc.attack = true;

        // guard: V키 누른 순간만 — 단순 상태 유지로 즉시 체크되는 것 방지
        if (dn("KeyV") && !p2?.gOld) tc.guard = true;

        // skill: Shift 입력 자체 감지
        if (dn("ShiftLeft", "ShiftRight")) tc.skill = true;

        // 모든 조작 완료 시 문 열기
        const allDone = tc.dash && tc.jump && tc.attack && tc.guard && tc.skill;
        if (allDone && Game.doors[0] && !Game.doors[0].open) {
            Game.doors[0].open = true;
            // 화면 중앙 고정 좌표로 — 월드 좌표가 아닌 카메라 기준
            addText(Game.camX + CW / 2 - 80, CH / 2 - 30, "ALL DONE! 문이 열렸다!", "#00ffcc", 180, 18);
        }

        // 더미 몬스터 — 체력만 리셋, 스턴/포이즈는 유지해 처형 연습 가능하게
        Game.enemies.forEach(e => {
            if (e.active && e.isTutorialDummy) {
                e.hp   = e.maxHp; // 죽지 않는 허수아비
                e.dead = false;   // 혹시 dead 처리됐어도 강제 부활
                e.active = true;
                // poise/stun은 건드리지 않음 — 패링→스턴→처형 흐름 체험 가능
            }
        });
    }

    // 튜토리얼 말풍선 힌트 렌더
    if (Game.isTutorial && Game.tutorialHints) {
        ctx.save();
        ctx.textAlign = "left";
        Game.tutorialHints.forEach(h => {
            const hx = h.x - Game.camX;
            if (hx < -200 || hx > CW + 200) return;
            // 말풍선 배경
            ctx.font = "bold 10px SkullFont, NeoDunggeunmo";
            const tw = ctx.measureText(h.text).width;
            ctx.fillStyle = "rgba(0,0,0,0.72)";
            ctx.fillRect(hx - 4, h.y - 13, tw + 8, 16);
            ctx.strokeStyle = h.col || "#ffcc44";
            ctx.lineWidth = 1;
            ctx.strokeRect(hx - 4, h.y - 13, tw + 8, 16);
            // 텍스트
            ctx.fillStyle = h.col || "rgba(255,220,80,0.92)";
            ctx.fillText(h.text, hx, h.y);
        });
        // 통과 조건 현황 (화면 우상단)
        if (Game.tutorialChecks) {
            const tc2 = Game.tutorialChecks;
            const checks = [
                { key: "dash",   label: "Z 대시",   done: tc2.dash   },
                { key: "jump",   label: "X 점프",   done: tc2.jump   },
                { key: "attack", label: "C 평타",   done: tc2.attack },
                { key: "skill",  label: "Shift 스킬", done: tc2.skill },
                { key: "guard",  label: "V 가드",   done: tc2.guard  },
            ];
            ctx.font = "bold 11px SkullFont, NeoDunggeunmo";
            checks.forEach((ch, i) => {
                ctx.fillStyle = ch.done ? "#00ffcc" : "#666";
                ctx.fillText((ch.done ? "✓ " : "○ ") + ch.label, CW - 120, 30 + i * 16);
            });
            const allDone2 = tc2.dash && tc2.jump && tc2.attack && tc2.guard && tc2.skill;
            ctx.fillStyle = allDone2 ? "#ffcc00" : "#555";
            ctx.font = "bold 12px SkullFont, NeoDunggeunmo";
            ctx.textAlign = "center";
            ctx.fillText(allDone2 ? "→ 문 통과하기!" : "모든 조작을 수행하세요", CW / 2, 22);
            ctx.textAlign = "left";
        }
        ctx.restore();
    }
    Game.texts.forEach(t => { 
        if (!t.active) return;
        t.y -= 0.8; t.life--; 
        if (t.life <= 0) t.active = false;
    }); 

    if (Game.eventObjects && Game.player && !Game.player.dead) {
        const p = Game.player;
        for (const ev of Game.eventObjects) {
            if (ev.used) continue;
            const near = Math.abs((p.x + p.w/2) - (ev.x + ev.w/2)) < 55 && Math.abs(p.y - ev.y) < 70;
            ev._nearPlayer = near;
            
            // 🔥 K.upOld를 사용하여 키 씹힘 완벽 방지
            if (near && dn("ArrowUp") && !K.upOld) {
                // 💥 기존 버그: 여기서 ev.used = true를 일괄 처리해서 화톳불이 고장났었음. (삭제 완료)

                if (ev.type === "curse_altar") {
                    ev.used = true;
                    const dmgAmt = Math.floor(p.hp * 0.25);
                    p.hp = Math.max(1, p.hp - dmgAmt);
                    const roll = Math.random();

                    // 증가 전 실제 ATK 계산
                    const atkBefore = Math.floor(Game.pBaseDmg * (Game.pBaseDmgMul||1) * (Game.pFinalDmgMul||1));

                    if (roll < 0.33) {
                        Game.pBaseDmg   += 15;           // 기본 공격력 직접 증가
                        Game.pFinalDmgMul += 0.5;         // 최종 배율도 추가
                        const atkAfter = Math.floor(Game.pBaseDmg * (Game.pBaseDmgMul||1) * (Game.pFinalDmgMul||1));
                        addText(ev.x, ev.y - 40, `저주: ATK ${atkBefore} → ${atkAfter}`, "#ff0055", 160, 14);
                        addText(ev.x, ev.y - 20, "공격력 폭증 + 최종데미지 +50%!", "#ff4488", 120, 11);
                    } else if (roll < 0.66) {
                        Game.pSkillDmgMul += 0.5;
                        addText(ev.x, ev.y - 40, "저주: 필살기 위력 +50%!", "#ff0055", 160, 14);
                        addText(ev.x, ev.y - 20, `현재 ATK: ${atkBefore}`, "#ff4488", 100, 11);
                    } else {
                        Game.pCritChance = Math.min(0.95, Game.pCritChance + 0.25);
                        Game.pCritDmg   += 1.0;
                        const critPct = Math.round(Game.pCritChance * 100);
                        addText(ev.x, ev.y - 40, `저주: 치명타 ${critPct}% / 데미지 ×${Game.pCritDmg.toFixed(1)}`, "#ff0055", 160, 13);
                        addText(ev.x, ev.y - 20, "크리 확률+25% / 크리 배율+100%!", "#ff4488", 120, 11);
                    }
                    // HUD 즉시 갱신 — ATK 수치가 UI에 바로 반영
                    if (typeof updateHUD === 'function') updateHUD();
                    playSfx('skill'); Game.camShake = 20;
                    for (let pi = 0; pi < 30; pi++) addPart(ev.x + ev.w/2, ev.y + ev.h/2, "#ff0055", 30, 4);
                    
                } else if (ev.type === "relic_chest") {
                    ev.used = true; // 상자 사용 완료 처리
                    const pool = Array.from({length:33},(_,i)=>i+1)
                        .filter(id => !Game.obtainedItems || !Game.obtainedItems.includes(id));
                    if (pool.length > 0) {
                        const id = pool[Math.floor(Math.random() * pool.length)];
                        if (typeof applyUpgrade === 'function') applyUpgrade(id);
                        const name = (typeof UPGRADES !== 'undefined' && UPGRADES[id]) ? UPGRADES[id].name.split(':')[0] : '유물';
                        addText(ev.x, ev.y - 20, "유물: " + name + "!", "#ffcc00", 120, 13);
                        playSfx('item'); playSfx('clear');
                    }
                    for (let pi = 0; pi < 25; pi++) addPart(ev.x + ev.w/2, ev.y + ev.h/2, "#ffcc00", 30, 4);
                    
                } else if (ev.type === "bonfire") {
                    // 🔥 화톳불 함수 호출. 함수 내부에서 스스로 HP 회복 후 ev.used = true 처리함!
                    if (typeof useBonfire === 'function') useBonfire(ev);
                    
                } else if (ev.type === "mimic_chest") {
                    ev.used = true; // 미믹 사용 완료 처리
                    if (typeof triggerMimic === 'function') triggerMimic(ev);
                }
            }
        }
    }


    Game.items.forEach(i => {
        if (!i.active) return;
        i.vy = Math.min(i.vy + GRAV, 8);  i.y += i.vy; let groundFound = false;
        Game.platforms.forEach(t => { if (overlap({x: i.x, y: i.y, w: i.w, h: i.h}, t) && i.vy > 0) { i.y = t.y - i.h; i.vy = 0; groundFound = true; } });
        if(groundFound) i.life--;
        
        if (overlap(Game.player, {x: i.x, y: i.y, w: i.w, h: i.h}) && !Game.player.dead) {
            playSfx('item');
            if (i.type === "hp") {
                if (Game.player.hp < Game.pMaxHp) { Game.player.hp = Math.min(Game.pMaxHp, Game.player.hp + 20); addText(Game.player.x, Game.player.y - 10, "+20 HP", "#27ae60", 40, 14); } 
                else { Game.score += 100; addText(Game.player.x, Game.player.y - 10, "점수 +100", "#aaaaff", 40, 14); }
            } else if (i.type === "atk_drop") { Game.pBaseDmg += 5; addText(Game.player.x, Game.player.y - 10, "공격력 증가! (+5)", "#af1616", 50, 16);
            } else if (i.type === "def_drop") { Game.pBaseDef += 5; addText(Game.player.x, Game.player.y - 10, "방어력 증가! (+5)", "#32b427", 50, 16); 
            } else if (i.type === "atk_spd_drop") { Game.pBaseAtkSpd += 0.05; addText(Game.player.x, Game.player.y - 10, "공격 속도 증가!", "#f1d13e", 50, 16);
            } else if (i.type === "move_spd_drop") { Game.pMoveSpdMul += 0.05; addText(Game.player.x, Game.player.y - 10, "이동 속도 증가!", "#2e9de7", 50, 16); }
            else if (i.type === "jump_drop") { Game.pJmpMul += 0.05; addText(Game.player.x, Game.player.y - 10, "점프력 증가", "#661ea1", 50, 16); }
            
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
        if (Game.isTutorial) {
            // 튜토리얼: 문은 항상 열려 있음 — 조건 복잡도로 막히는 문제 방지
            d.open = true;
        } else {
            d.open = allDead;
        }
        if (d.open && Game.player && overlap(Game.player, { x: d.x, y: d.y, w: d.w, h: d.h }) && !Game.player.dead) {
            if (Game.transState === 0 && typeof nextStage === 'function') {
                nextStage();
            }
        }
    });
}
