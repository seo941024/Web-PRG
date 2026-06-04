// ==========================================
// 시각 렌더링 엔진 (Graphics & UI)
// ==========================================

function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = context.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    context.fillText(line, x, y);
}

function drawBone(isLarge, classType) {
    ctx.save();
    if (isLarge) ctx.scale(1.5, 1.5);
    const ext = Game.pRangeBonus; 
    
    if (classType === 1) { // 도적 단검
        ctx.fillStyle = "#888"; 
        ctx.fillRect(0, 0, 12 + ext, 3);
        ctx.fillStyle = "#555"; 
        ctx.fillRect(0, 5, 12 + ext, 3);
        ctx.fillStyle = "#fff"; 
        ctx.fillRect(10 + ext, -1, 4, 5); 
        ctx.fillRect(10 + ext, 4, 4, 5);
    } else if (classType === 2) { // 마법사 지팡이
        ctx.fillStyle = "#5c3a21"; 
        ctx.fillRect(0, -1, 16 + ext, 4); 
        ctx.fillStyle = "#aa00ff"; 
        ctx.beginPath(); 
        ctx.arc(16 + ext, 1, 6, 0, Math.PI*2); 
        ctx.fill(); 
        ctx.fillStyle = "#fff"; 
        ctx.beginPath(); 
        ctx.arc(16 + ext, 1, 2, 0, Math.PI*2); 
        ctx.fill();
    } else { // 기본 검사 뼈검
        ctx.fillStyle = "#d4b895"; 
        ctx.fillRect(0, -2, 10 + ext, 4); 
        ctx.fillStyle = "#f8f8fa"; 
        ctx.fillRect(2, -3, 14 + ext, 6); 
        ctx.fillRect(14 + ext, -5, 4, 4); 
        ctx.fillRect(14 + ext, 1, 4, 4);  
        ctx.fillStyle = "#d0d0d5"; 
        ctx.fillRect(4, 1, 10 + ext, 2);  
        ctx.fillRect(15 + ext, 3, 2, 2);
    }
    ctx.restore();
}

function drawBackground() {
    const themes = [
        ["#050508", "#0d0d14", "#1a1a25"], 
        ["#1e3623", "#2a4a33", "#4d7358"], 
        ["#0a0a0c", "#141416", "#252528"], 
        ["#0a050a", "#150a12", "#1e0f1f"], 
        ["#150202", "#250505", "#350a0a"], 
        ["#1c0512", "#280a1a", "#3f1025"], 
        ["#000000", "#000000", "#000000"]  
    ];
    
    let wg = 1;
    if (Game.worldN >= 3 && Game.worldN <= 4) wg = 2;
    else if (Game.worldN >= 5 && Game.worldN <= 6) wg = 3;
    else if (Game.worldN >= 7 && Game.worldN <= 8) wg = 4;
    else if (Game.worldN === 9) wg = 5;
    else if (Game.worldN === 10) wg = 6;
    
    const tColors = themes[wg];
    
    const skyGrd = ctx.createLinearGradient(0, 0, 0, CH);
    skyGrd.addColorStop(0, "#000000"); 
    skyGrd.addColorStop(1, tColors[0]);
    ctx.fillStyle = skyGrd; 
    ctx.fillRect(0, 0, CW, CH);
    
    if (wg === 1) { 
        const mGrd = ctx.createLinearGradient(0, CH - 150, 0, CH);
        mGrd.addColorStop(0, tColors[1]);
        mGrd.addColorStop(1, "#030305"); 
        ctx.fillStyle = mGrd;
        
        ctx.beginPath(); 
        ctx.moveTo(0, CH);
        for(let x = 0; x <= CW; x += 20) {
            ctx.lineTo(x, CH - 150 + Math.sin((x + Game.camX * 0.2) * 0.02) * 40 + Math.cos((x + Game.camX * 0.2) * 0.05) * 20);
        }
        ctx.lineTo(CW, CH); 
        ctx.fill();
        
        let wrap = CW + 150;
        for (let i = 0; i < 20; i++) {
            const bx = ((i * 150) % Game.levelW) * 0.5 - Game.camX * 0.5;
            const mod = ((bx % wrap) + wrap) % wrap - 50;
            if (mod > -50 && mod < CW + 50) {
                ctx.fillStyle = tColors[2];
                ctx.fillRect(mod, CH - 220 - (i % 5) * 20, 20, 250); 
                ctx.fillStyle = "rgba(0, 0, 0, 0.6)"; 
                ctx.fillRect(mod, CH - 220 - (i % 5) * 20, 8, 250); 
                
                ctx.fillStyle = tColors[2];
                ctx.beginPath(); 
                ctx.arc(mod + 10, CH - 220 - (i % 5) * 20, 35 + (i % 3) * 10, 0, Math.PI * 2); 
                ctx.fill(); 
                
                ctx.fillStyle = "rgba(0, 0, 0, 0.4)"; 
                ctx.beginPath(); 
                ctx.arc(mod + 10, CH - 220 - (i % 5) * 20 + 10, 35 + (i % 3) * 10, 0.2, Math.PI - 0.2); 
                ctx.fill();
            }
        }
    } 
    else if (wg === 2) { 
        let wrap = CW + 300;
        for (let i = 0; i < 15; i++) {
            let bx = ((i * 200) % Game.levelW) * 0.2 - Game.camX * 0.2;
            let mod = ((bx % wrap) + wrap) % wrap - 100;
            if (mod > -100 && mod < CW + 100) {
                ctx.fillStyle = "rgba(20, 25, 30, 0.5)";
                ctx.fillRect(mod + 40, CH - 180 + (i%5)*10, 12, 60); 
                ctx.fillRect(mod + 20, CH - 160 + (i%5)*10, 52, 12); 
                ctx.beginPath(); ctx.arc(mod + 46, CH - 120 + (i%5)*10, 40, Math.PI, 0); ctx.fill(); 
            }
        }
        for (let i = 0; i < 25; i++) {
            let bx = ((i * 120) % Game.levelW) * 0.4 - Game.camX * 0.4;
            let mod = ((bx % wrap) + wrap) % wrap - 50;
            if (mod > -50 && mod < CW + 50) {
                let yOff = CH - 100 + (i%3)*15;
                ctx.fillStyle = "#1c1c20";
                ctx.beginPath(); ctx.arc(mod + 30, yOff, 20, Math.PI, 0); ctx.fill();
                ctx.fillRect(mod + 10, yOff, 40, 30);
                
                ctx.fillStyle = "#888890";
                ctx.fillRect(mod - 15, yOff + 20, 15, 3);
                ctx.fillRect(mod - 10, yOff + 16, 12, 3);
                ctx.beginPath(); ctx.arc(mod - 20, yOff + 21, 4, 0, Math.PI*2); ctx.fill(); 
                
                ctx.fillStyle = "rgba(30, 0, 50, 0.05)";
                ctx.beginPath(); ctx.arc(mod + 20, yOff - 20, 50, 0, Math.PI*2); ctx.fill();
            }
        }
    }
    else if (wg === 3) {
        const t = Date.now();
        let castleX = (Game.levelW / 2) * 0.1 - Game.camX * 0.1;
        ctx.fillStyle = "#0a0a10";
        ctx.beginPath(); 
        ctx.moveTo(castleX + 300, CH - 100); 
        ctx.lineTo(castleX + 320, CH - 250); 
        ctx.lineTo(castleX + 340, CH - 220); 
        ctx.lineTo(castleX + 370, CH - 350); 
        ctx.lineTo(castleX + 400, CH - 220); 
        ctx.lineTo(castleX + 420, CH - 250); 
        ctx.lineTo(castleX + 440, CH - 100); 
        ctx.fill();
        
        let blink = Math.sin(t / 300) > 0.9 ? 1 : (Math.sin(t / 300) > 0.8 ? 0.5 : 0.1);
        ctx.fillStyle = `rgba(255, 0, 0, ${blink})`;
        ctx.shadowColor = "#ff0000"; 
        ctx.shadowBlur = 30 * blink;
        ctx.fillRect(castleX + 365, CH - 300, 10, 20);
        ctx.shadowBlur = 0;

        let wrap1 = CW + 100;
        for (let i = 0; i < 30; i++) {
            let bx = ((i * 90) % Game.levelW) * 0.3 - Game.camX * 0.3;
            let mod = ((bx % wrap1) + wrap1) % wrap1 - 30;
            if (mod > -30 && mod < CW + 30) {
                ctx.fillStyle = "rgba(15, 18, 25, 0.6)"; 
                ctx.beginPath(); 
                ctx.arc(mod + 40, CH - 80 - (i%3)*20, 80 + (i%2)*20, 0, Math.PI * 2); 
                ctx.fill();
            }
        }
    } 
    else if (wg === 4) { 
        let wrap1 = CW + 100;
        for (let i = 0; i < 30; i++) {
            let bx = ((i * 90) % Game.levelW) * 0.3 - Game.camX * 0.3;
            let mod = ((bx % wrap1) + wrap1) % wrap1 - 30;
            if (mod > -30 && mod < CW + 30) {
                ctx.fillStyle = "rgba(0, 0, 0, 0.6)"; 
                ctx.fillRect(mod, CH - 120 - (i % 3) * 20, 30, 150);
                ctx.beginPath(); 
                ctx.arc(mod + 15, CH - 120 - (i % 3) * 20, 15, Math.PI, 0); 
                ctx.fill(); 
                
                ctx.fillStyle = "rgba(255, 30, 30, 0.1)"; 
                ctx.fillRect(mod + 20, CH - 120 - (i % 3) * 20, 5, 150);
            }
        }
    } 
    else if (wg === 5) { 
        ctx.lineWidth = 4;
        let wrap = CW + 150;
        for (let i = 0; i < 18; i++) {
            ctx.strokeStyle = (i % 2 === 0) ? "#8800ff" : "#ff0055"; 
            ctx.shadowColor = "rgba(255, 0, 50, 0.6)"; 
            ctx.shadowBlur = 8;
            ctx.beginPath();
            for (let y = 0; y <= CH; y += 30) {
                let bx = ((i * 140) % Game.levelW) * 0.4 - Game.camX * 0.4;
                let mod = ((bx % wrap) + wrap) % wrap - 50;
                let wave = Math.sin((y + Date.now() * 0.05 + i * 100) * 0.03) * 20;
                if (y === 0) ctx.moveTo(mod + wave, y);
                else ctx.lineTo(mod + wave, y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0; 
        }
    }
    else if (wg === 6) { 
        let moonX = (Game.levelW / 2) * 0.1 - Game.camX * 0.1;
        const moonGrd = ctx.createRadialGradient(moonX + 300, 150, 20, moonX + 300, 150, 120);
        moonGrd.addColorStop(0, "#ff0000");
        moonGrd.addColorStop(0.5, "#550000");
        moonGrd.addColorStop(1, "transparent");
        ctx.fillStyle = moonGrd;
        ctx.beginPath(); ctx.arc(moonX + 300, 150, 120, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#110000";
        ctx.beginPath(); ctx.arc(moonX + 300, 150, 90, 0, Math.PI * 2); ctx.fill();
    }

    const vig = ctx.createRadialGradient(CW/2, CH/2, CH*0.3, CW/2, CH/2, CW*0.7);
    vig.addColorStop(0, "transparent");
    vig.addColorStop(1, "rgba(0, 0, 0, 0.75)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, CW, CH);

    return tColors;
}

function drawTile(tx, ty, w, h, t, wg, tColors) {
    if (wg === 1) { 
        ctx.fillStyle = t.drop ? "#4a3020" : "#3e2723"; 
        ctx.fillRect(tx, ty, w, h); 
        ctx.fillStyle = "#271714"; 
        for(let i=0; i<w; i+=15) { 
            for(let j=10; j<h; j+=15) { 
                if((i+j)%2===0) ctx.fillRect(tx+i, ty+j, 4, 4); 
            } 
        }
        ctx.fillStyle = t.drop ? "#6b472e" : tColors[2]; 
        ctx.fillRect(tx, ty, w, 8); 
    } 
    else if (wg === 2) { 
        ctx.fillStyle = t.drop ? "#1a1a1c" : "#2a2a2c"; 
        ctx.fillRect(tx, ty, w, h);
        ctx.fillStyle = "#111";
        for(let i=0; i<w; i+=8) {
            for(let j=0; j<h; j+=8) {
                if ((i * 7 + j * 3) % 5 === 0) ctx.fillRect(tx+i, ty+j, 3, 3);
            }
        }
        ctx.fillStyle = t.drop ? "#111112" : "#3a3a3c";
        ctx.beginPath();
        for(let i=0; i<w; i+=10) { 
            let jag = ((i * 13) % 7) - 3; 
            ctx.lineTo(tx+i, ty+jag); 
        }
        ctx.lineTo(tx+w, ty); 
        ctx.lineTo(tx, ty); 
        ctx.fill();
    } 
    else if (wg === 3) { 
        const isDark = !t.float;
        ctx.fillStyle = isDark ? "#1a1c22" : "#2a2d33"; 
        ctx.fillRect(tx, ty, w, h);
        ctx.fillStyle = isDark ? "#111" : "#1f2226"; 
        for(let j=0; j<h; j+=12) ctx.fillRect(tx, ty+j, w, 2); 
        for(let j=0; j<h; j+=12) { 
            let off = (j/12)%2===0 ? 0 : 12; 
            for(let i=off; i<w; i+=24) ctx.fillRect(tx+i, ty+j, 2, 12); 
        } 
        ctx.fillStyle = t.drop ? "#3a2222" : (isDark ? "#2f343d" : "#4a5059"); 
        ctx.fillRect(tx, ty, w, 4); 
    } 
    else if (wg === 4 || wg === 5) { 
        ctx.fillStyle = "#1f0a0a"; 
        ctx.fillRect(tx, ty, w, h);
        ctx.fillStyle = "#3a1111";
        for(let i=0; i<w; i+=12) {
            ctx.beginPath(); ctx.moveTo(tx+i, ty); ctx.lineTo(tx+i+6, ty+h/2); ctx.lineTo(tx+i, ty+h);
            ctx.strokeStyle = "#4a0f0f"; ctx.lineWidth = 2; ctx.stroke();
        }
        ctx.fillStyle = t.drop ? "#330000" : "#551111"; 
        ctx.fillRect(tx, ty, w, 4);
    } 
    else if (wg === 6) { 
        ctx.fillStyle = "#050505"; 
        ctx.fillRect(tx, ty, w, h);
        ctx.fillStyle = `rgba(255, 0, 0, ${0.2 + Math.sin(Date.now()*0.005)*0.2})`; 
        for(let i=10; i<w; i+=35) { ctx.fillRect(tx+i, ty, 2, h); ctx.fillRect(tx+i-8, ty+15, 18, 2); }
        ctx.fillStyle = "#110000"; ctx.fillRect(tx, ty, w, 4); ctx.fillStyle = "#ff0000"; ctx.fillRect(tx, ty, w, 1); 
    }

    if (wg < 5) { 
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)"; ctx.fillRect(tx, ty + h - 8, w, 8); 
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)"; ctx.fillRect(tx + w - 6, ty, 6, h); 
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)"; ctx.fillRect(tx, ty, 6, h);         
        ctx.fillStyle = "rgba(255, 255, 255, 0.06)"; ctx.fillRect(tx, ty + 4, w, 4); 
    } else { 
        ctx.fillStyle = "rgba(255, 0, 0, 0.15)"; ctx.fillRect(tx, ty + h - 4, w, 4); 
    }
}

function drawEnvironment(tColors) {
    let wg = 1;
    if (Game.worldN >= 3 && Game.worldN <= 4) wg = 2;
    else if (Game.worldN >= 5 && Game.worldN <= 6) wg = 3;
    else if (Game.worldN >= 7 && Game.worldN <= 8) wg = 4;
    else if (Game.worldN === 9) wg = 5;
    else if (Game.worldN === 10) wg = 6;

    Game.items.forEach(i => {
        if (!i.active) return;
        const ix = i.x - Game.camX; 
        if (ix < -10 || ix > CW) return;
        if (i.life < 100 && Math.floor(i.life / 5) % 2 === 0) return; 
        
        if (i.type === "hp") ctx.fillStyle = "#ff1111"; 
        else if (i.type === "atk_drop") ctx.fillStyle = "#ff6200"; 
        else if (i.type === "def_drop") ctx.fillStyle = "#b0bec5"; 
        else if (i.type === "atk_spd_drop") ctx.fillStyle = "#ffea00"; 
        else if (i.type === "move_spd_drop") ctx.fillStyle = "#00ffcc"; 
        else if (i.type === "jump_drop") ctx.fillStyle = "#42a5f5"; 
        else ctx.fillStyle = "#00ccff"; 
        
        ctx.fillRect(ix, i.y, 10, 10); ctx.fillStyle = "#ffffff"; ctx.fillRect(ix + 3, i.y + 2, 4, 4); 
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"; ctx.strokeRect(ix, i.y, 10, 10);
    });

    Game.platforms.forEach((t) => {
        const tx = t.x - Game.camX, ty = t.y; 
        if (tx > CW + TILE || tx + t.w < -TILE) return;
        ctx.save();
        if (t.float && t.fallTimer > 0) {
            ctx.globalAlpha = Math.max(0, 1 - (t.fallTimer / 50));
            const shake = t.fallTimer < 30 ? (Math.random() * 2 - 1) : 0;
            drawTile(tx + shake, ty, t.w, t.h, t, wg, tColors);
        } else {
            drawTile(tx, ty, t.w, t.h, t, wg, tColors);
        }
        ctx.restore();
    });

    Game.doors.forEach((d) => {
        const dx = d.x - Game.camX;
        if (d.open) { 
            ctx.shadowColor = "#aa00ff"; ctx.shadowBlur = 15;
            ctx.fillStyle = "#2a0044"; ctx.fillRect(dx, d.y, d.w, d.h);
            ctx.fillStyle = "#7700ff"; ctx.fillRect(dx + 4, d.y + 4, d.w - 8, d.h - 8);
            ctx.fillStyle = "#cc88ff"; ctx.fillRect(dx + 10, d.y + 10, d.w - 20, d.h - 20);
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#00ccff"; ctx.font = "12px NeoDunggeunmo"; ctx.textAlign = "center"; 
            ctx.fillText("ENTER", dx + d.w / 2, d.y + d.h / 2 + 4); 
        } else {
            ctx.fillStyle = "#3e2723"; ctx.fillRect(dx, d.y, d.w, d.h); 
            ctx.fillStyle = "#271714"; ctx.fillRect(dx + 4, d.y + 4, d.w - 8, d.h - 8); 
            ctx.fillStyle = "#4e342e"; ctx.fillRect(dx + 8, d.y + 8, d.w - 16, d.h - 16); 
            ctx.fillStyle = "#111"; ctx.fillRect(dx, d.y + 15, d.w, 4); ctx.fillRect(dx, d.y + 45, d.w, 4);
            ctx.fillStyle = "#757575"; ctx.fillRect(dx + d.w / 2 - 4, d.y + d.h / 2 - 4, 8, 8);
            ctx.fillStyle = "#00ccff"; ctx.font = "10px NeoDunggeunmo"; ctx.textAlign = "center"; 
            ctx.fillText("SEALED", dx + d.w / 2, d.y - 8); 
        }
        ctx.textAlign = "left";
    });
}

function drawEntities() {
    ctx.imageSmoothingEnabled = false; 

    Game.eBullets.forEach(b => {
        if (!b.active) return; 
        const bx = b.x - Game.camX; 
        if (bx < -10 || bx > CW + 10) return;
        
        if (b.unblockable) { 
            ctx.fillStyle = "#9900ff"; ctx.beginPath(); ctx.arc(bx, b.y, b.r * 1.4, 0, Math.PI * 2); ctx.fill(); 
            ctx.fillStyle = "#ff0000"; ctx.beginPath(); ctx.arc(bx, b.y, b.r * 0.7, 0, Math.PI * 2); ctx.fill(); 
        } else if (b.isArrow) { 
            ctx.fillStyle = "#2ecc71"; ctx.beginPath(); ctx.arc(bx, b.y, b.r, 0, Math.PI * 2); ctx.fill(); 
            ctx.fillStyle = "#27ae60"; ctx.beginPath(); ctx.arc(bx, b.y, b.r * 0.5, 0, Math.PI * 2); ctx.fill(); 
        } else if (b.isBomb) { 
            ctx.fillStyle = "#ff5500"; ctx.beginPath(); ctx.arc(bx, b.y, b.r * 1.2, 0, Math.PI * 2); ctx.fill(); 
            ctx.fillStyle = "#ffff00"; ctx.beginPath(); ctx.arc(bx, b.y, b.r * 0.5, 0, Math.PI * 2); ctx.fill(); 
        } else { 
            ctx.fillStyle = "#ff2222"; ctx.beginPath(); ctx.arc(bx, b.y, b.r, 0, Math.PI * 2); ctx.fill(); 
            ctx.fillStyle = "#ffaaaa"; ctx.beginPath(); ctx.arc(bx, b.y, b.r * 0.5, 0, Math.PI * 2); ctx.fill(); 
        }
    });

    Game.bullets.forEach(b => { 
        if (!b.active) return; 
        const bx = b.x - Game.camX; 
        if (bx < -10 || bx > CW + 10) return; 
        
        if (b.sk === 2) { 
            const height = b.r * 3 * (b.life / 15);
            ctx.fillStyle = "rgba(200, 240, 255, 0.8)"; ctx.fillRect(bx - b.r/2, b.y + 10 - height, b.r, height);
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)"; ctx.fillRect(bx - b.r/4, b.y + 10 - height, b.r/2, height);
        } else if (b.sk === 0 && Game.pClass === 2) {
            ctx.save(); ctx.translate(bx, b.y); ctx.rotate(Date.now() / 100); drawBone(false, 0); ctx.restore();
        } else {
            ctx.fillStyle = b.sk ? "#00ccff" : "#ffcc22"; ctx.beginPath(); ctx.arc(bx, b.y, b.r, 0, Math.PI * 2); ctx.fill(); 
        }
    });
    
    Game.lasers.forEach(l => { 
        if (!l.active) return; 
        const lx = l.x - Game.camX; 
        if (lx + l.w < 0 || lx > CW) return; 
        ctx.save(); ctx.globalAlpha = l.life / l.maxLife; ctx.fillStyle = l.color; ctx.fillRect(lx, l.y, l.w, l.h); 
        ctx.fillStyle = "#ffffff"; ctx.fillRect(lx, l.y + l.h * 0.2, l.w, l.h * 0.6); 
        ctx.restore(); 
    });
    
    Game.parts.forEach(pt => { 
        if (!pt.active) return; 
        const px = pt.x - Game.camX; 
        if (px < -10 || px > CW + 10) return; 
        ctx.globalAlpha = pt.life / pt.ml; ctx.fillStyle = pt.col; ctx.fillRect(px - (pt.size / 2), pt.y - (pt.size / 2), pt.size, pt.size); ctx.globalAlpha = 1; 
    });

    Game.enemies.forEach(e => {
        if (!e.active) return; 
        const ex = e.x - Game.camX; 
        if (ex < -100 || ex > CW + 100) return;
        
        ctx.save(); 
        ctx.translate(Math.round(ex + e.w / 2), Math.round(e.y + e.h / 2));

        if (e.warnT > 0) {
            ctx.save();
            if (e.isBoss) {
                const maxW = e.phase === 1 ? 35 : 25; 
                ctx.globalAlpha = 0.2 + (1 - e.warnT / maxW) * 0.5; 
                ctx.fillStyle = "#ff0033"; 
                const wd = e.warnData;
                
                if (e.world === 1 || e.world === 2) { 
                    if (wd.ap === 0) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 450, wd.ang - 0.3, wd.ang + 0.3); ctx.fill(); } 
                    else { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 450, wd.ang - 0.5, wd.ang + 0.5); ctx.fill(); } 
                } 
                else if (e.world === 3 || e.world === 4) { 
                    if (wd.ap === 0) { ctx.fillStyle = "#ff0000"; ctx.fillRect(-800, 0, 1600, 10); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 500, wd.ang - 0.2, wd.ang + 0.2); ctx.fill(); } 
                    else { ctx.beginPath(); ctx.arc(0, 0, 400, 0, Math.PI * 2); ctx.fill(); } 
                } 
                else if (e.world === 5) { 
                    if (wd.ap === 0) { ctx.fillRect(wd.facing > 0 ? 0 : -800, -10, 800, 20); } 
                    else { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 400, wd.ang - 0.4, wd.ang + 0.4); ctx.fill(); } 
                } 
                else if (e.world >= 6 && e.world <= 9) {
                    if (wd.ap === 0) {
                        if (e.world === 6) {
                            let targetY = wd.targetY || Game.player.y;
                            let deltaY = targetY - (e.y + 20);
                            let ang = Math.atan2(deltaY, Game.player.x - e.x);
                            ctx.rotate(ang);
                            ctx.fillRect(0, -10, 800, 20);
                        } else {
                            ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 400, wd.ang - 0.4, wd.ang + 0.4); ctx.fill();
                        }
                    }
                    else { ctx.fillRect(wd.facing > 0 ? 0 : -800, -10, 800, 20); }
                }
                else { 
                    if (wd.ap === 0) { ctx.fillRect(wd.facing > 0 ? 0 : -800, -20, 800, 40); } 
                    else { ctx.fillRect(wd.facing > 0 ? 0 : -800, -10, 800, 16); ctx.beginPath(); ctx.arc(0, 0, 400, wd.ang - 0.5, wd.ang + 0.5); ctx.fill(); } 
                }
            } else {
                if (e.type === "ranged_bullet") { 
                    ctx.globalAlpha = 0.2 + (1 - e.warnT / 25) * 0.4; 
                    ctx.fillStyle = "#ffaa00"; 
                    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 350, e.warnData.ang - 0.3, e.warnData.ang + 0.3); ctx.fill(); 
                }
                else if (e.type === "ranged_laser") { 
                    ctx.globalAlpha = 0.5 + (1 - e.warnT / 40) * 0.5; 
                    ctx.fillStyle = "#ff2222"; 
                    ctx.fillRect(e.warnData.facing > 0 ? 0 : -800, -2, 800, 4); 
                }
                else if (e.type === "shield" || e.type === "melee") { 
                    ctx.globalAlpha = 0.15 + (1 - e.warnT / 50) * 0.3; 
                    ctx.fillStyle = "#ff0033"; 
                    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 65, e.facing > 0 ? -0.7 : Math.PI - 0.7, e.facing > 0 ? 0.7 : Math.PI + 0.7); ctx.fill(); 
                }
            }
            ctx.restore();
        }

        ctx.scale(e.facing, 1); 
        if (e.flash > 0 && e.flash % 2 === 0) ctx.globalAlpha = 0.4;
        
        const eBob = (!e.isBoss || e.world < 5) && e.onGround && e.vx !== 0 ? (e.fr === 0 ? -1 : 0) : 0;
        const wRot = e.warnT > 0 ? -Math.PI * 0.3 : (e.atkAnim > 0 ? Math.PI * 0.6 : 0); 

        if (e.isBoss) {
            ctx.save();
            ctx.scale(2.5, 2.5); 
            const p2 = e.phase === 2;
            
            if (p2) { 
                ctx.shadowBlur = 15; 
                ctx.shadowColor = "#ff0000"; 
            }
            if (e.isRevived) {
                ctx.filter = 'sepia(100%) hue-rotate(300deg) brightness(0.7) contrast(1.5)';
            }

            if (e.world <= 2) { 
                ctx.fillStyle = "#1c331c"; 
                ctx.fillRect(-16, -14+eBob, 32, 28); 
                
                ctx.fillStyle = "#4a0000"; 
                ctx.beginPath(); ctx.moveTo(-16, -10+eBob); ctx.lineTo(-5, 0+eBob); ctx.lineTo(-16, 5+eBob); ctx.fill();
                
                ctx.fillStyle = p2 ? "#ff0000" : "#ffaa00"; 
                ctx.beginPath(); ctx.arc(-6, -6+eBob, 4, 0, Math.PI*2); ctx.fill();
                
                ctx.fillStyle = "#000"; 
                ctx.fillRect(-7, -7+eBob, 2, 2);
                
                ctx.fillStyle = "#220000"; 
                ctx.fillRect(-10, 4+eBob, 24, 8); 
                
                ctx.fillStyle = "#fff"; 
                for(let i=0; i<4; i++) { 
                    ctx.beginPath(); 
                    ctx.moveTo(-8 + i*6, 4+eBob); 
                    ctx.lineTo(-5 + i*6, 10+eBob); 
                    ctx.lineTo(-2 + i*6, 4+eBob); 
                    ctx.fill(); 
                }
                
                ctx.fillStyle = "#7a0000"; 
                ctx.fillRect(-4, 12+eBob, 2, 6 + Math.random()*4); 
                ctx.fillRect(8, 12+eBob, 3, 4 + Math.random()*3); 
                
                ctx.save(); 
                ctx.translate(16, 8+eBob); 
                ctx.rotate(wRot + Math.PI/4); 
                
                ctx.fillStyle = "#1a0f0a"; 
                ctx.fillRect(-4, -20, 8, 30); 
                
                ctx.fillStyle = "#333"; 
                ctx.fillRect(4, -40, 20, 30); 
                
                ctx.fillStyle = "#990000"; 
                ctx.beginPath(); 
                ctx.moveTo(24, -40); 
                ctx.lineTo(15, -20); 
                ctx.lineTo(24, -10); 
                ctx.fill(); 
                ctx.restore();
            } 
            else if (e.world <= 4) { 
                ctx.fillStyle = "#111"; 
                ctx.beginPath(); ctx.arc(0, -8+eBob, 22, 0, Math.PI*2); ctx.fill(); 
                ctx.fillStyle = "#d0d0d5"; 
                ctx.fillRect(-18, -12+eBob, 36, 28);
                
                ctx.fillStyle = "#0a0a0c"; 
                ctx.beginPath(); 
                ctx.moveTo(0, -12+eBob); 
                ctx.lineTo(18, -12+eBob); 
                ctx.lineTo(18, 5+eBob); 
                ctx.lineTo(5, 5+eBob); 
                ctx.lineTo(0, -5+eBob); 
                ctx.fill();
                
                ctx.fillStyle = p2 ? "#ff0000" : "#ff00ff"; 
                ctx.shadowBlur = 20; 
                ctx.shadowColor = ctx.fillStyle;
                ctx.beginPath(); 
                ctx.arc(-8, -2+eBob, 5 + Math.sin(Date.now()/100)*2, 0, Math.PI*2); 
                ctx.fill();
                ctx.shadowBlur = 0;
                
                ctx.fillStyle = "#111"; 
                ctx.beginPath(); 
                ctx.moveTo(-15, -12+eBob); 
                ctx.quadraticCurveTo(-30, -30+eBob, -10, -40+eBob); 
                ctx.lineTo(-10, -12+eBob); 
                ctx.fill();
                ctx.beginPath(); 
                ctx.moveTo(15, -12+eBob); 
                ctx.quadraticCurveTo(30, -30+eBob, 10, -40+eBob); 
                ctx.lineTo(10, -12+eBob); 
                ctx.fill();
                
                ctx.save(); 
                ctx.translate(14, 4+eBob); 
                ctx.rotate(wRot + Math.PI/6); 
                ctx.fillStyle = "#1a0a0a"; 
                ctx.fillRect(-3, -50, 6, 60); 
                ctx.fillStyle = "#4a0f0f"; 
                ctx.beginPath(); 
                ctx.moveTo(3, -40); 
                ctx.quadraticCurveTo(30, -50, 40, -25); 
                ctx.quadraticCurveTo(30, 0, 3, -10); 
                ctx.fill();
                ctx.fillStyle = "#111"; 
                ctx.beginPath(); 
                ctx.moveTo(3, -35); 
                ctx.lineTo(25, -25); 
                ctx.lineTo(3, -15); 
                ctx.fill();
                ctx.restore();
            } 
            else if (e.world <= 6) { 
                const t = Date.now();
                const floatY = Math.sin(t / 300) * 10;
                
                ctx.save();
                ctx.translate(0, floatY);
                ctx.scale(0.8, 0.8); 
                
                ctx.strokeStyle = "#111"; 
                ctx.lineWidth = 3;
                ctx.beginPath(); ctx.moveTo(-70, -70); ctx.lineTo(-10, 0); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(70, -60); ctx.lineTo(10, 0); ctx.stroke();
                
                for(let i=0; i<8; i++) {
                    ctx.save();
                    ctx.rotate((i * Math.PI / 4) + t/1500);
                    ctx.fillStyle = "#111"; 
                    ctx.beginPath(); ctx.moveTo(35, -20); ctx.lineTo(60, 0); ctx.lineTo(35, 20); ctx.fill();
                    ctx.fillStyle = "#7a0000"; 
                    ctx.beginPath(); ctx.moveTo(45, -10); ctx.lineTo(60, 0); ctx.lineTo(45, 10); ctx.fill(); 
                    ctx.restore();
                }

                ctx.fillStyle = "#2a0505";
                ctx.beginPath(); 
                for(let i=0; i<Math.PI*2; i+=0.5) {
                    let r = 40 + Math.sin(i*5 + t/200)*5;
                    if(i===0) ctx.moveTo(Math.cos(i)*r, Math.sin(i)*r);
                    else ctx.lineTo(Math.cos(i)*r, Math.sin(i)*r);
                }
                ctx.fill();
                
                ctx.shadowBlur = p2 ? 40 : 25; 
                ctx.shadowColor = p2 ? "#ff0000" : "#ff00aa"; 
                ctx.fillStyle = p2 ? "#550000" : "#330055";
                ctx.beginPath(); 
                ctx.arc(0, 0, 25, 0, Math.PI*2); 
                ctx.fill(); 
                ctx.shadowBlur = 0;
                
                ctx.fillStyle = p2 ? "#ffcc00" : "#ffffff";
                ctx.beginPath(); 
                ctx.ellipse(0, 0, 8, 20, 0, 0, Math.PI*2); 
                ctx.fill();
                
                ctx.fillStyle = "#000";
                ctx.beginPath(); 
                ctx.ellipse(0, 0, 2, 18, 0, 0, Math.PI*2); 
                ctx.fill();
                
                ctx.fillStyle = "#aa0000"; 
                ctx.fillRect(-2, 20, 4, 15 + Math.sin(t/100)*10);
                
                ctx.restore();
            } 
            else if (e.world <= 9) { 
                const t = Date.now();
                const isW7 = e.world === 7; 
                const isW8 = e.world === 8; 
                const isW9 = e.world === 9;
                
                ctx.fillStyle = "#0a0a0a";
                const wingFlap = Math.sin(t/200) * 15;
                ctx.beginPath(); 
                ctx.moveTo(-10, -20+eBob); 
                ctx.quadraticCurveTo(-60, -80+eBob-wingFlap, -90, -40+eBob); 
                ctx.lineTo(-50, -10+eBob); 
                ctx.fill();
                
                ctx.strokeStyle = "#ff0033"; 
                ctx.lineWidth = 1; 
                ctx.stroke(); 
                
                ctx.beginPath(); 
                ctx.moveTo(10, -20+eBob); 
                ctx.quadraticCurveTo(60, -80+eBob-wingFlap, 90, -40+eBob); 
                ctx.lineTo(50, -10+eBob); 
                ctx.fill(); 
                ctx.stroke();

                ctx.fillStyle = "#110505"; 
                ctx.fillRect(-18, -30+eBob, 36, 40); 
                ctx.fillStyle = "#2a0a0a"; 
                ctx.fillRect(-10, -25+eBob, 20, 15); 
                
                ctx.fillStyle = "#000"; 
                ctx.beginPath(); 
                ctx.arc(0, -35+eBob, 15, 0, Math.PI*2); 
                ctx.fill(); 
                
                ctx.fillStyle = "#3a0505"; 
                ctx.beginPath(); ctx.moveTo(-10, -45+eBob); ctx.lineTo(-25, -70+eBob); ctx.lineTo(-5, -50+eBob); ctx.fill();
                ctx.beginPath(); ctx.moveTo(10, -45+eBob); ctx.lineTo(25, -70+eBob); ctx.lineTo(5, -50+eBob); ctx.fill();

                ctx.fillStyle = "#ff0000"; 
                ctx.shadowBlur = 20; 
                ctx.shadowColor = "#ff0000"; 
                ctx.beginPath(); 
                ctx.moveTo(-8, -38+eBob); 
                ctx.lineTo(0, -33+eBob); 
                ctx.lineTo(8, -38+eBob); 
                ctx.lineTo(0, -40+eBob); 
                ctx.fill();
                ctx.shadowBlur = 0;
                
                ctx.save(); 
                ctx.translate(18, 0+eBob); 
                ctx.rotate(wRot + Math.PI/4); 
                
                if (isW7) { 
                    ctx.fillStyle = "#111"; ctx.fillRect(-2, -20, 4, 10); 
                    ctx.fillStyle = "#aa0000"; ctx.beginPath(); ctx.moveTo(-4, -10); ctx.lineTo(0, 35); ctx.lineTo(4, -10); ctx.fill();
                    ctx.save(); ctx.translate(-35, 0); ctx.rotate(Math.PI/6);
                    ctx.fillStyle = "#111"; ctx.fillRect(-2, -20, 4, 10); 
                    ctx.fillStyle = "#aa0000"; ctx.beginPath(); ctx.moveTo(-4, -10); ctx.lineTo(0, 35); ctx.lineTo(4, -10); ctx.fill();
                    ctx.restore();
                } else if (isW8) { 
                    ctx.fillStyle = "#111"; ctx.fillRect(-4, -15, 8, 15); 
                    ctx.fillStyle = "#ff0033"; ctx.fillRect(-12, -15, 24, 6); 
                    ctx.fillStyle = "#220000"; ctx.beginPath(); ctx.moveTo(-8, -9); ctx.lineTo(0, 55); ctx.lineTo(8, -9); ctx.fill(); 
                    ctx.fillStyle = "#ff5500"; ctx.fillRect(-1, -5, 2, 45); 
                } else if (isW9) { 
                    ctx.fillStyle = "#111"; ctx.fillRect(-3, -50, 6, 80); 
                    ctx.fillStyle = "#aa00ff"; 
                    ctx.beginPath(); ctx.moveTo(-3, -40); ctx.quadraticCurveTo(-50, -50, -60, -10); ctx.quadraticCurveTo(-40, -20, -3, -30); ctx.fill();
                    ctx.fillStyle = "#fff"; ctx.fillRect(-4, -40, 2, 10); 
                }
                ctx.restore();
            } 
            else { 
                const t = Date.now();
                ctx.shadowColor = "#ff0000"; 
                ctx.shadowBlur = 40;
                
                ctx.fillStyle = "rgba(10, 0, 0, 0.8)"; 
                ctx.beginPath(); 
                for(let i=0; i<Math.PI*2; i+=0.3) {
                    let r = 70 + Math.sin(i*4 + t/150)*15 + Math.cos(i*3 - t/200)*10;
                    if(i===0) ctx.moveTo(Math.cos(i)*r, Math.sin(i)*r - 20+eBob);
                    else ctx.lineTo(Math.cos(i)*r, Math.sin(i)*r - 20+eBob);
                }
                ctx.fill();
                
                ctx.shadowBlur = 0;
                for(let i=0; i<5; i++) {
                    let ex = Math.sin(t/1000 + i)*30; 
                    let ey = Math.cos(t/800 + i)*20 - 20+eBob;
                    ctx.fillStyle = p2 ? "#ff0000" : "#aa00ff"; 
                    ctx.beginPath(); ctx.arc(ex, ey, 6, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = "#fff"; ctx.fillRect(ex-1, ey-2, 2, 4); 
                }

                ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(0, -30+eBob, 18, 0, Math.PI*2); ctx.fill(); 
                ctx.fillStyle = "#ff0000"; ctx.beginPath(); ctx.arc(0, -30+eBob, 10 + Math.sin(t/100)*2, 0, Math.PI*2); ctx.fill(); 
                ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(0, -30+eBob, 2, 8, 0, 0, Math.PI*2); ctx.fill();

                ctx.fillStyle = "#550000";
                ctx.beginPath(); ctx.moveTo(-20, -55+eBob); ctx.lineTo(-35, -80+eBob); ctx.lineTo(-10, -65+eBob); ctx.fill();
                ctx.beginPath(); ctx.moveTo(0, -60+eBob); ctx.lineTo(0, -90+eBob); ctx.lineTo(5, -60+eBob); ctx.fill();
                ctx.beginPath(); ctx.moveTo(20, -55+eBob); ctx.lineTo(35, -80+eBob); ctx.lineTo(10, -65+eBob); ctx.fill();

                for(let i=-1; i<=1; i+=2) {
                    ctx.save(); 
                    ctx.translate(i*40, -10+eBob); 
                    ctx.rotate(wRot + (i>0 ? Math.PI/4 : -Math.PI/4));
                    ctx.strokeStyle = "#111"; 
                    ctx.lineWidth = 6; 
                    ctx.beginPath(); 
                    ctx.moveTo(0, 0); 
                    ctx.quadraticCurveTo(i*30, 20, i*50, 40); 
                    ctx.stroke();
                    ctx.fillStyle = "#aa0000"; 
                    ctx.beginPath(); 
                    ctx.moveTo(i*50, 40); 
                    ctx.lineTo(i*60, 60); 
                    ctx.lineTo(i*45, 45); 
                    ctx.fill();
                    ctx.restore();
                }
            }

            ctx.filter = 'none'; 
            ctx.restore();
        } 
        else {
            let scaleVal = e.isElite ? 1.8 : 1.5;
            ctx.scale(scaleVal, scaleVal);
            
            if (e.isElite) {
                ctx.shadowBlur = 15; 
                ctx.shadowColor = "#ff0000"; 
                ctx.filter = 'sepia(1) hue-rotate(320deg) saturate(5) brightness(0.8)';
            }
            
            let legL = e.fr === 0 ? 0 : -2, legR = e.fr === 0 ? -2 : 0;
            
            if (e.world <= 2) { 
                ctx.fillStyle = "#3cb371"; ctx.fillRect(-4, -8 + eBob, 8, 6); 
                ctx.fillStyle = "#795548"; ctx.fillRect(-5, -9 + eBob, 10, 2); 
                ctx.fillStyle = "#708090"; ctx.fillRect(-3, -2 + eBob, 6, 6); 
                ctx.fillStyle = "#ffeb3b"; ctx.fillRect(2, -6 + eBob, 1, 1); 
                ctx.fillStyle = "#3cb371"; ctx.fillRect(-3, 4, 2, 4 + legL); ctx.fillRect(2, 4, 2, 4 + legR); 
            } else if (e.world <= 4) { 
                ctx.fillStyle = "#f8f8fa"; ctx.fillRect(-4, -8 + eBob, 8, 6); 
                ctx.fillStyle = "#111"; ctx.fillRect(-2, -6 + eBob, 4, 2); 
                ctx.fillStyle = "#d0d0d5"; ctx.fillRect(-3, -2 + eBob, 6, 6); 
                ctx.fillStyle = "#f8f8fa"; ctx.fillRect(-3, 4, 1, 4 + legL); ctx.fillRect(2, 4, 1, 4 + legR); 
            } else if (e.world <= 6) { 
                ctx.fillStyle = "#111111"; ctx.fillRect(-4, -8 + eBob, 8, 6); 
                ctx.fillStyle = "#ff0033"; ctx.fillRect(-2, -6 + eBob, 2, 2); ctx.fillRect(2, -6 + eBob, 2, 2); 
                ctx.fillStyle = "#222222"; ctx.fillRect(-3, -2 + eBob, 6, 6); 
                ctx.fillStyle = "#111111"; ctx.fillRect(-3, 4, 2, 4 + legL); ctx.fillRect(2, 4, 2, 4 + legR); 
            } else if (e.world <= 8) { 
                ctx.fillStyle = "#ff3d00"; ctx.fillRect(-5, -8 + eBob, 10, 6); 
                ctx.fillStyle = "#212121"; ctx.fillRect(-3, -11 + eBob, 2, 3); ctx.fillRect(1, -11 + eBob, 2, 3); 
                ctx.fillStyle = "#37474f"; ctx.fillRect(-5, -2 + eBob, 10, 6); 
                ctx.fillStyle = "#ff9100"; ctx.fillRect(-4, 4, 2, 4 + legL); ctx.fillRect(2, 4, 2, 4 + legR); 
            } else { 
                ctx.fillStyle = "#1a0033"; ctx.fillRect(-5, -8 + eBob, 10, 6); 
                ctx.fillStyle = "#00ffcc"; ctx.fillRect(-2, -6 + eBob, 4, 1); 
                ctx.fillStyle = "#2a004d"; ctx.fillRect(-4, -2 + eBob, 8, 7); 
                ctx.fillStyle = "#1a0033"; ctx.fillRect(-2, 5, 1, 3 + legL); ctx.fillRect(1, 5, 1, 3 + legR); 
            }

            if (e.type === "shield") {
                if (e.isGuarding) {
                    ctx.fillStyle = "#b0bec5"; ctx.fillRect(2, -12 + eBob, 6, 22); 
                    ctx.fillStyle = "#78909c"; ctx.fillRect(4, -10 + eBob, 2, 18); 
                } else {
                    ctx.fillStyle = "#b0bec5"; ctx.fillRect(-2, 4 + eBob, 10, 4); 
                }
            } 
            else if (e.type === "melee") {
                ctx.save(); ctx.translate(4, -5 + eBob); ctx.rotate(wRot); 
                if (e.world <= 2) { ctx.fillStyle = "#b0bec5"; ctx.fillRect(0, 0, 3, 4); ctx.fillStyle = "#5d4037"; ctx.fillRect(1, -4, 1, 11); } 
                else if (e.world <= 4) { ctx.translate(0, 3); ctx.fillStyle = "#d4b895"; ctx.fillRect(0, -4, 2, 12); } 
                else if (e.world <= 6) { ctx.translate(0, 3); ctx.fillStyle = "#555555"; ctx.fillRect(0, -4, 2, 12); } 
                else if (e.world <= 8) { ctx.translate(0, 1); ctx.fillStyle = "#ffd700"; ctx.fillRect(0, -5, 2, 14); } 
                else { ctx.translate(0, -1); ctx.fillStyle = "#00ffcc"; ctx.fillRect(0, -6, 2, 18); ctx.fillStyle = "#330066"; ctx.fillRect(-1, -2, 4, 2); } 
                ctx.restore();
            }
            
            ctx.filter = 'none';
            ctx.shadowBlur = 0;
        }
        ctx.restore();

        if (!e.isBoss) {
            const bw = 24 * 1.5, bx = ex + e.w / 2 - bw / 2, by = e.y - 10; 
            if (bx > -10 && bx < CW) { 
                ctx.fillStyle = "#220000"; ctx.fillRect(bx, by, bw, 3); 
                let hpCol = e.isElite ? "#aa00ff" : (e.hp / e.maxHp > 0.5 ? "#22aa22" : "#cc2222");
                if (e.type === "shield" && !e.isElite) hpCol = e.hp / e.maxHp > 0.5 ? "#607d8b" : "#455a64";
                ctx.fillStyle = hpCol; ctx.fillRect(bx, by, bw * Math.max(0, e.hp / e.maxHp), 3); 
            }
        }
    });

    if (Game.player && !Game.player.dead) {
        const p = Game.player, px = Math.round(p.x - Game.camX), py = Math.round(p.y);
        if (Game.invT === 0 || Math.floor(Game.invT / 4) % 2 === 0 || p.dashT > 0) {
            const isMoving = p.vx !== 0, isJumping = p.vy < 0, isFalling = p.vy > 0;
            let pyOffset = 0, pLegL_Y = 0, pLegR_Y = 0, pLegL_X = 0, pLegR_X = 0, armRot = 0;
            
            if (isJumping || p.plunging || p.dashT > 0) { 
                pyOffset = -2; pLegL_Y = -2; pLegR_Y = -4; pLegL_X = -2; pLegR_X = 2; armRot = -0.5;
            } else if (isFalling) { 
                pyOffset = 0; pLegL_Y = -1; pLegR_Y = -2; pLegL_X = -1; pLegR_X = 1; armRot = 0.5;
            } else if (isMoving) { 
                const swing = Math.sin(p.fr * Math.PI / 2);
                pyOffset = Math.abs(swing) * 1.5; 
                pLegL_Y = -Math.abs(swing) * 2; 
                pLegR_Y = -Math.abs(Math.cos(p.fr * Math.PI / 2)) * 2;
                pLegL_X = swing * 3; pLegR_X = -swing * 3; armRot = swing * 0.6; 
            }

            ctx.save(); 
            ctx.translate(px + 7, py + 9 + pyOffset); 
            ctx.scale(p.facing, 1);

            // 💡 [패치] 가드 시청각 효과 (가드는 하늘색)
            if (p.guarding || p.parryT > 0) {
                ctx.fillStyle = p.parryT > 0 ? "rgba(255, 238, 0, 0.5)" : "rgba(0, 204, 255, 0.4)"; 
                ctx.beginPath(); ctx.arc(1, -pyOffset, 17, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = p.parryT > 0 ? "rgba(255, 215, 0, 0.9)" : "rgba(0, 204, 255, 0.9)"; 
                ctx.lineWidth = p.parryT > 0 ? 3 : 2; ctx.stroke();
            }

            if (Game.pClass === 1) { 
                ctx.fillStyle = "#111"; 
                if (isJumping || p.plunging || p.dashT > 0) { ctx.fillRect(-12, 2, 8, 6); ctx.fillRect(-14, 6, 6, 4); }
                else if (isFalling) { ctx.fillRect(-12, -8, 8, 10); ctx.fillRect(-14, -12, 6, 4); }
                else if (isMoving) { const flap = Math.sin(p.fr * Math.PI / 2) * 2; ctx.fillRect(-14, 2 + flap, 10, 5); ctx.fillRect(-16, 4 + flap, 6, 4); }
                else { ctx.fillRect(-9, 3, 5, 8); ctx.fillRect(-11, 8, 5, 5); }
            } else if (Game.pClass === 2) { 
                ctx.fillStyle = "#4a0088"; 
                if (isJumping || p.plunging || p.dashT > 0) { ctx.fillRect(-12, 2, 10, 6); ctx.fillRect(-14, 6, 8, 4); }
                else if (isFalling) { ctx.fillRect(-12, -8, 10, 10); ctx.fillRect(-14, -12, 8, 4); }
                else if (isMoving) { const flap = Math.sin(p.fr * Math.PI / 2) * 2; ctx.fillRect(-14, 2 + flap, 12, 5); ctx.fillRect(-16, 4 + flap, 8, 4); }
                else { ctx.fillRect(-9, 3, 7, 8); ctx.fillRect(-11, 8, 7, 5); }
            } else { 
                ctx.fillStyle = "#990000";
                if (isJumping || p.plunging || p.dashT > 0) { ctx.fillRect(-12, 2, 8, 6); ctx.fillRect(-14, 6, 6, 4); }
                else if (isFalling) { ctx.fillRect(-12, -8, 8, 10); ctx.fillRect(-14, -12, 6, 4); }
                else if (isMoving) { const flap = Math.sin(p.fr * Math.PI / 2) * 2; ctx.fillRect(-14, 2 + flap, 10, 5); ctx.fillRect(-16, 4 + flap, 6, 4); }
                else { ctx.fillRect(-9, 3, 5, 8); ctx.fillRect(-11, 8, 5, 5); }
            }

            ctx.fillStyle = "#1a1a25"; ctx.fillRect(-6, 2, 12, 6); ctx.fillStyle = "#2a2a35"; ctx.fillRect(-5, 2, 10, 5);
            ctx.fillStyle = "#f8f8fa";
            if (!p.guarding) { ctx.fillRect(-5 + pLegL_X, 7 + pLegL_Y, 3, 5); ctx.fillRect(1 + pLegR_X, 7 + pLegR_Y, 3, 5); } 
            else { ctx.fillRect(-5, 5, 4, 2); ctx.fillRect(3, 5, 4, 2); }
            
            ctx.fillStyle = "#f8f8fa"; ctx.fillRect(-6, -10, 14, 10); ctx.fillRect(-7, -8, 16, 6); 
            
            if (Game.pClass === 1) { 
                ctx.fillStyle = "#222"; ctx.fillRect(-6, -10, 14, 4); ctx.fillRect(-7, -8, 16, 4);
                ctx.fillStyle = "#444"; ctx.fillRect(-4, -1, 10, 3);
            } else if (Game.pClass === 2) { 
                ctx.fillStyle = "#2a0044"; ctx.beginPath(); ctx.moveTo(1, -22); ctx.lineTo(-8, -10); ctx.lineTo(10, -10); ctx.fill();
                ctx.fillStyle = "#4a0088"; ctx.fillRect(-10, -10, 22, 2);
            } else { 
                ctx.fillStyle = "#d0d0d5"; ctx.fillRect(-4, 0, 10, 3);
                ctx.fillStyle = "#808085"; ctx.fillRect(-2, 0, 1, 3); ctx.fillRect(1, 0, 1, 3); ctx.fillRect(4, 0, 1, 3);
            }
            
            let eyeW = 4, eyeH = 4;
            if (isMoving) { let pulse = (p.fr % 2 === 0) ? 1 : 0; eyeW += pulse; eyeH += pulse; }
            ctx.fillStyle = "#0a0a0f"; ctx.fillRect(2, -7 - (eyeH - 4), eyeW, eyeH); ctx.fillRect(-4 - (eyeW - 4), -7 - (eyeH - 4), eyeW, eyeH);
            ctx.fillStyle = p.atkAnim > 0 ? "#ff0000" : "#fff"; ctx.fillRect(3, -6, 2, 2); ctx.fillRect(-3, -6, 2, 2);
            if (Game.pClass !== 1) { ctx.fillStyle = "#cc0000"; ctx.fillRect(-7, -1, 14, 4); ctx.fillStyle = "#ff3333"; ctx.fillRect(-6, -1, 12, 2); }

            if (p.plunging) { 
                ctx.save(); ctx.translate(5, 5); ctx.rotate(Math.PI * 0.8 * p.facing); drawBone(false, Game.pClass); ctx.restore(); 
            } else if (p.atkAnim > 0) {
                ctx.save(); ctx.translate(5, 5);
                let isLastHit = (Game.pClass === 1 && p.combo === 5) || (Game.pClass !== 1 && p.combo === 3);
                const maxAnim = isLastHit ? 20 : 12; 
                const progress = 1 - (p.atkAnim / maxAnim); 
                let angle = 0;
                
                if (!isLastHit) { 
                    if (p.combo % 2 === 1) { angle = -Math.PI * 0.7 + (Math.PI * 1.4 * progress); } 
                    else { angle = Math.PI * 0.7 - (Math.PI * 1.4 * progress); } 
                } else { 
                    if (progress < 0.3) { angle = -Math.PI * 0.8 - (progress * 1.5); } 
                    else { const p2 = (progress - 0.3) / 0.7; angle = -Math.PI * 1.2 + (Math.PI * 2.2 * p2); } 
                }
                
                ctx.rotate(angle * p.facing); drawBone(isLastHit, Game.pClass);
                if (Game.pClass === 1) { ctx.save(); ctx.translate(-15, 0); ctx.rotate(-Math.PI * 0.5); drawBone(false, 1); ctx.restore(); }
                if (isLastHit && progress > 0.3 && progress < 0.8) { ctx.fillStyle = "rgba(255, 0, 0, 0.4)"; ctx.fillRect(0, -12, 20 + Game.pRangeBonus, 24); }
                ctx.restore();
            } else { 
                ctx.save(); ctx.translate(5, 5); ctx.rotate(armRot * 0.5); drawBone(false, Game.pClass); 
                if (Game.pClass === 1) { ctx.save(); ctx.translate(-15, 0); ctx.rotate(-Math.PI * 0.2); drawBone(false, 1); ctx.restore(); }
                ctx.restore(); 
            }
            ctx.restore();
        }
    }
}

// 💡 [수정] 640x360 캔버스 크기에 맞춰 박스와 텍스트 높이 완벽 픽셀 재조정
function renderClassSelect() {
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
            
            if (Math.floor(Date.now() / 400) % 2 === 0) {
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
        t.y -= (t.vy || 1.5); t.x += (t.vx || 0);
        if (t.vy !== undefined) t.vy -= 0.05; 
        const tx = t.x - Game.camX; 
        if (tx < -20 || tx > CW + 20) return; 
        ctx.save(); ctx.globalAlpha = Math.max(0, t.life / 20); ctx.fillStyle = t.color === "#ffffff" ? "#00ccff" : t.color; 
        ctx.font = `bold ${t.size || 14}px NeoDunggeunmo`; ctx.fillText(t.text, tx, t.y); ctx.restore(); 
    });

    if (Game.comboCount > 1) {
        ctx.save(); ctx.fillStyle = "#ffee00"; ctx.font = "italic bold 24px NeoDunggeunmo"; 
        ctx.shadowColor = "#ff3300"; ctx.shadowBlur = 4; ctx.fillText(`${Game.comboCount} COMBOS`, CW - 160, 60);
        ctx.fillStyle = "rgba(255,0,0,0.2)"; ctx.fillRect(CW - 160, 70, 120, 4); 
        ctx.fillStyle = "#ffcc00"; ctx.fillRect(CW - 160, 70, 120 * (Game.comboTimer / (150+Game.pComboDur)), 4); ctx.restore();
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
        const atkVal = Math.floor(Game.pBaseDmg * (Game.pBaseDmgMul || 1));
        const asVal = Math.round((Game.pBaseAtkSpd || 1) * (Game.pAtkSpdMul || 1) * 100);
        ctx.fillText(`ATK     : ${atkVal}`, 15, 65); ctx.fillText(`DEF     : ${Game.pBaseDef}`, 15, 80);
        ctx.fillText(`CRIT    : ${Math.round(Game.pCritChance * 100)}%`, 15, 95); ctx.fillText(`ATK SPD : ${asVal}%`, 15, 110); 
        ctx.fillText(`MOV SPD : ${Math.round(Game.pMoveSpdMul * 100)}%`, 15, 125); ctx.fillText(`JMP     : ${Math.round(Game.pJmpMul * 100)}%`, 15, 140); 
    }
    
    if (Game.invT > 85) { ctx.fillStyle = `rgba(255, 0, 0, ${(Game.invT - 85) / 15 * 0.4})`; ctx.fillRect(0, 0, CW, CH); }
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

function render() {
    ctx.imageSmoothingEnabled = false; 
    const isEven = Game.worldN % 2 === 0;
    
    const tColors = drawBackground();
    
    ctx.save(); 
    if (Game.camShake > 0) ctx.translate((Math.random() - 0.5) * Game.camShake, (Math.random() - 0.5) * Game.camShake);
    drawEnvironment(tColors); 
    
    // 💡 [수정] 짝수 스테이지 렉 유발 원인인 필터를 완전히 제거하고, 가벼운 어두운 오버레이로 교체 (프레임 드랍 완벽 해결)
    if (isEven) { 
        ctx.fillStyle = "rgba(15, 10, 25, 0.5)"; 
        ctx.fillRect(-Game.camX, 0, Game.levelW, CH); 
    }
    
    drawEntities();
    ctx.restore();
    drawUI();

    if (Game.gs === "boss_intro") {
        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, CW, 80); ctx.fillRect(0, CH - 80, CW, 80);
        ctx.fillStyle = "#ff0033"; ctx.font = "bold 45px NeoDunggeunmo"; ctx.textAlign = "center";
        const bossName = document.getElementById("bossBarLabel").textContent;
        ctx.fillText(bossName, CW / 2, CH / 2);
        ctx.fillStyle = "#fff"; ctx.font = "20px NeoDunggeunmo";
        if (Math.floor(Date.now() / 200) % 2 === 0) { ctx.fillText("▶ WARNING ◀", CW / 2, CH / 2 - 50); }
        ctx.textAlign = "left";
    }

    if (Game.transT > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${Game.transT / 255})`;
        ctx.fillRect(0, 0, CW, CH);
    }
}