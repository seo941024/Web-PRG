// ==========================================
// UI / HUD / 클래스선택 렌더링 (UI Renderer)
// ==========================================

function renderClassSelect(frameNow) {
    const bgGrd = ctx.createRadialGradient(CW/2, CH/2, 0, CW/2, CH/2, CW);
    bgGrd.addColorStop(0, "#2a0b4e"); 
    bgGrd.addColorStop(1, "#05020a"); 
    ctx.fillStyle = bgGrd;
    ctx.fillRect(0, 0, CW, CH);

    ctx.fillStyle = "#ffcc00"; 
    ctx.font = "28px NeoDunggeunmo"; 
    ctx.textAlign = "center";
    ctx.shadowBlur = 10; 
    ctx.shadowColor = "#aa00ff";
    ctx.fillText("클래스 선택", CW/2, 45);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = "#aaa"; 
    ctx.font = "12px NeoDunggeunmo";
    ctx.fillText("(좌/우 방향키 이동, 스페이스바로 결정, S키로 상점 이동)", CW/2, 70);

    const classes = [
        { name: "검사 (Sword)", hp: 50, atk: 30, desc: "[근거리] 밸런스가 가장 잘 잡힌 기본 스컬 클래스입니다." },
        { name: "도적 (Rogue)", hp: 35, atk: 20, desc: "[근거리] 매우 빠른 이동속도와 짧은 대쉬 쿨타임을 가집니다." },
        { name: "마법사 (Wizard)", hp: 40, atk: 35, desc: "[원거리] 마법 뼈다귀를 발사하며 마나통(150)이 넓습니다." }
    ];

    let boxW = 160;
    let boxH = 220; 
    let startY = 95;
    let totalW = boxW * 3 + 40; 
    let startX = CW/2 - totalW/2;

    for (let i = 0; i < 3; i++) {
        let isSel = (Game.pClass === i);
        let boxX = startX + i*(boxW + 20);
        
        ctx.fillStyle = isSel ? "rgba(255, 200, 0, 0.15)" : "rgba(255, 255, 255, 0.05)";
        ctx.fillRect(boxX, startY, boxW, boxH); 
        
        if (isSel) {
            ctx.strokeStyle = "#ffcc00"; 
            ctx.lineWidth = 3;
            ctx.strokeRect(boxX, startY, boxW, boxH);
            
            if (Math.floor(frameNow / 400) % 2 === 0) {
                ctx.fillStyle = "#ff0055"; 
                ctx.font = "bold 12px NeoDunggeunmo";
                ctx.fillText("▶ PRESS SPACE ◀", boxX + boxW/2, startY + boxH - 15);
            }
        }
        
        ctx.fillStyle = isSel ? "#fff" : "#888";
        ctx.font = "bold 16px NeoDunggeunmo";
        ctx.fillText(classes[i].name, boxX + boxW/2, startY + 30);
        
        ctx.font = "12px NeoDunggeunmo";
        ctx.fillText(`HP: ${classes[i].hp}`, boxX + boxW/2, startY + 60);
        if (Game.permHpLvl > 0) { ctx.fillStyle = "#00ff00"; ctx.fillText(`(+${Game.permHpLvl*10})`, boxX + boxW/2, startY + 75); ctx.fillStyle = isSel ? "#fff" : "#888"; }
        
        ctx.fillText(`ATK: ${classes[i].atk}`, boxX + boxW/2, startY + 95);
        if (Game.permAtkLvl > 0) { ctx.fillStyle = "#00ff00"; ctx.fillText(`(+${Game.permAtkLvl*2})`, boxX + boxW/2, startY + 110); }

        ctx.fillStyle = isSel ? "#00ccff" : "#555";
        ctx.font = "12px NeoDunggeunmo";
        ctx.textAlign = "center";
        
        wrapText(ctx, classes[i].desc, boxX + boxW/2, startY + 140, boxW - 20, 16);
    }
    ctx.textAlign = "left";
}

function drawUI() {
    if (Game.gs === "menu" || Game.gs === "class_select" || Game.gs === "shop") return;

    Game.texts.forEach(t => { 
        if (!t.active) return;
        // 위치 업데이트는 updateItemsAndMisc에서만 수행 (이중 이동 버그 방지)
        const tx = t.x - Game.camX; 
        if (tx < -20 || tx > CW + 20) return; 
        ctx.save(); ctx.globalAlpha = Math.max(0, t.life / 20); ctx.fillStyle = t.color === "#ffffff" ? "#00ccff" : t.color; 
        ctx.font = `bold ${t.size || 14}px NeoDunggeunmo`; ctx.fillText(t.text, tx, t.y); ctx.restore(); 
    });

    if (Game.comboCount > 1) {
        ctx.save();
        const comboX = CW - 170, comboY = 55;
        const isHighCombo = Game.comboCount >= 10;
        const isMegaCombo = Game.comboCount >= 30;
        // 높은 콤보일수록 크게 + 진동
        const shake = isMegaCombo ? (Math.random()-0.5)*3 : 0;
        const scale = isMegaCombo ? 1.3 : (isHighCombo ? 1.15 : 1.0);
        ctx.translate(comboX + shake, comboY);
        ctx.scale(scale, scale);
        // 배경 반투명 박스
        ctx.fillStyle = isMegaCombo ? "rgba(180,0,0,0.25)" : (isHighCombo ? "rgba(100,0,180,0.2)" : "rgba(0,0,0,0.3)");
        ctx.fillRect(-8, -22, 165, 32);
        // 콤보 숫자
        const comboCol = isMegaCombo ? "#ff0000" : (isHighCombo ? "#ff6600" : "#ffcc00");
        ctx.font = `bold ${isMegaCombo ? 26 : (isHighCombo ? 22 : 18)}px NeoDunggeunmo`;
        ctx.fillStyle = comboCol;
        ctx.shadowColor = comboCol; ctx.shadowBlur = isMegaCombo ? 15 : (isHighCombo ? 8 : 4);
        ctx.fillText(`${Game.comboCount} COMBO`, 0, 0);
        ctx.shadowBlur = 0;
        // 콤보 타이머 바
        const barW = 155 * (Game.comboTimer / (150 + Game.pComboDur));
        ctx.fillStyle = "rgba(80,0,0,0.4)"; ctx.fillRect(-5, 6, 155, 5);
        ctx.fillStyle = comboCol; ctx.fillRect(-5, 6, barW, 5);
        ctx.restore();
    }

    if (!Game.enemies.some(e=>e.active && !e.dead) && Game.doors.length > 0 && Game.doors[0].open) {
        ctx.fillStyle = "rgba(0,255,100,0.06)"; ctx.fillRect(0, 0, CW, CH);
        ctx.fillStyle = "#00ccff"; ctx.font = "16px NeoDunggeunmo"; ctx.textAlign = "center"; 
        ctx.fillText("AREA CLEARED → ENTER THE DOOR", CW / 2, 30); ctx.textAlign = "left";
    }

    const dashPct = Game.player ? Game.player.dashCD / (75*Game.pDashCDMul) : 0; 
    ctx.fillStyle = "#111118"; ctx.fillRect(CW - 100, CH - 22, 90, 12);
    if (dashPct > 0) { 
        ctx.fillStyle = "#27ae60"; ctx.fillRect(CW - 100, CH - 22, 90 * (1 - dashPct), 12); 
        ctx.fillStyle = "#00ccff"; ctx.font = "10px NeoDunggeunmo"; ctx.textAlign = "center"; ctx.fillText("DASH CD", CW - 55, CH - 13); 
    } else { 
        ctx.fillStyle = "#2ecc71"; ctx.fillRect(CW - 100, CH - 22, 90, 12); 
        ctx.fillStyle = "#00ccff"; ctx.font = "10px NeoDunggeunmo"; ctx.textAlign = "center"; ctx.fillText("DASH READY", CW - 55, CH - 13); 
    }
    
    if (Game.gs === "play" || Game.gs === "dead" || Game.gs === "boss_intro") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; ctx.fillRect(10, 50, 110, 100); 
        ctx.fillStyle = "#00ccff"; ctx.font = "12px NeoDunggeunmo"; ctx.textAlign = "left";
        const atkVal = Math.floor(
            Game.pBaseDmg
            * (Game.pBaseDmgMul || 1)
            * (Game.pFinalDmgMul || 1)
            * (1 + (Game.pExtraDmg || 0))
        );
        const asVal = Math.round((Game.pBaseAtkSpd || 1) * (Game.pAtkSpdMul || 1) * 100);
        ctx.fillText(`ATK     : ${atkVal}`, 15, 65); ctx.fillText(`DEF     : ${Game.pBaseDef}`, 15, 80);
        ctx.fillText(`CRIT    : ${Math.round(Game.pCritChance * 100)}%`, 15, 95); ctx.fillText(`ATK SPD : ${asVal}%`, 15, 110); 
        ctx.fillText(`MOV SPD : ${Math.round(Game.pMoveSpdMul * 100)}%`, 15, 125); ctx.fillText(`JMP     : ${Math.round(Game.pJmpMul * 100)}%`, 15, 140); 
    }
    
    // 스태미나 바 (화면 하단)
    if (Game.player && typeof STAMINA_MAX !== 'undefined') {
        const stam = Game.player.stamina || 0;
        const stamPct = stam / STAMINA_MAX;
        const stamY = CH - 8;
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(CW/2 - 60, stamY, 120, 6);
        ctx.fillStyle = Game.player.fatRoll ? "#ff4400" : (stam < 30 ? "#ffaa00" : "#44ddff");
        ctx.fillRect(CW/2 - 60, stamY, 120 * stamPct, 6);
        ctx.strokeStyle = "rgba(100,200,255,0.3)"; ctx.lineWidth = 1;
        ctx.strokeRect(CW/2 - 60, stamY, 120, 6);
        if (Game.player.fatRoll) {
            ctx.fillStyle = "rgba(255,60,0,0.7)"; ctx.font = "10px NeoDunggeunmo"; ctx.textAlign = "center";
            ctx.fillText("STAMINA!", CW/2, stamY - 3); ctx.textAlign = "left";
        }
    }
    // 체간 게이지 (스턴 가능 적 위에 표시) - drawEntities에서 처리
    if (Game.invT > 85) { ctx.fillStyle = `rgba(255, 0, 0, ${(Game.invT - 85) / 15 * 0.4})`; ctx.fillRect(0, 0, CW, CH); }
    // 필살기 플래시
    if (Game.skillFlashT > 0) {
        Game.skillFlashT--;
        const sfAlpha = Game.skillFlashT / 20;
        ctx.fillStyle = Game.skillFlashCol ? Game.skillFlashCol.replace(/[\d.]+\)$/, `${sfAlpha})`) : `rgba(0,200,255,${sfAlpha * 0.3})`;
        ctx.fillRect(0, 0, CW, CH);
    }
    // 슬로모션 비네트 (파란빛 테두리)
    if (Game.slowMoT > 0) {
        const smA = Math.min(1, Game.slowMoT / 18) * 0.4;
        ctx.strokeStyle = `rgba(255,230,0,${smA})`;
        ctx.lineWidth = 6; ctx.strokeRect(3, 3, CW-6, CH-6);
    }
    if (Game.player && Game.player.hp / Game.pMaxHp <= 0.3 && !Game.player.dead) {
        const pulse = (Math.sin(Date.now() / 150) + 1) / 2; ctx.fillStyle = `rgba(150, 0, 0, ${0.1 + pulse * 0.3})`;
        ctx.fillRect(0, 0, CW, 15); ctx.fillRect(0, CH - 15, CW, 15); ctx.fillRect(0, 0, 15, CH); ctx.fillRect(CW - 15, 0, 15, CH); 
    }

    if (Game.player && Game.player.dead) {
        let alpha = 1; if (Game.gs === "dead") { alpha = Math.max(0, Math.min(1, 1 - (Game.deadTimer / 120))); }
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`; ctx.fillRect(0, 0, CW, CH);
    }
    
    ctx.textAlign = "left"; ctx.fillStyle = "#00ccff"; ctx.font = "14px NeoDunggeunmo"; 
    ctx.fillText("Enemies: " + Game.enemies.filter(e=>e.active && !e.dead).length, 10, 20);
}