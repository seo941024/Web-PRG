// ==========================================
// 스테이지 생성 및 진행 관리 모듈 (Stage & Progression)
// ==========================================

function genStage(w, l) {
    Game.platforms = []; 
    Game.doors = []; 
    
    Game.enemies.forEach(e => e.active = false); 
    Game.bullets.forEach(b => b.active = false); 
    Game.eBullets.forEach(b => b.active = false); 
    Game.parts.forEach(p => p.active = false); 
    Game.lasers.forEach(l => l.active = false);
    Game.texts.forEach(t => t.active = false);
    Game.items.forEach(i => i.active = false);

    Game.kills = 0; 
    Game.invT = 0; 
    Game.hitStop = 0;
    
    const isBoss = l === 3;
    Game.levelW = isBoss ? 1400 : 2500;

    const floorY = CH - 40;

    for (let x = 0; x < Game.levelW; x += TILE) {
        Game.platforms.push({ x, y: floorY, w: TILE, h: 40 }); 
    }
    for (let y = 0; y < CH; y += TILE) {
        Game.platforms.push({ x: -TILE, y, w: TILE, h: TILE });
        Game.platforms.push({ x: Game.levelW, y, w: TILE, h: TILE });
    }

    if (!isBoss) {
        const tier1Y = floorY - 100;  
        const tier2Y = floorY - 200; 
        const tier3Y = floorY - 300; 
        
        for (let px = 200; px < Game.levelW - 300; px += 250 + Math.random() * 100) {
            let pw = 120 + Math.random() * 80;
            Game.platforms.push({ x: px, y: tier1Y, w: pw, h: TILE, float: true, drop: false });
            
            if (Math.random() < 0.4) {
                Game.platforms.push({ x: px + 60, y: tier2Y, w: 100 + Math.random() * 40, h: TILE, float: true, drop: Math.random() < 0.4 });
            }
            if (Math.random() < 0.15) {
                Game.platforms.push({ x: px + 20, y: tier3Y, w: 80, h: TILE, float: true, drop: true }); 
            }
        }

        Game.platforms.push({ x: 600, y: floorY - 120, w: 100, h: TILE, float: true, vx: 1.0, boundL: 450, boundR: 850 });
        Game.platforms.push({ x: 1400, y: floorY - 200, w: 100, h: TILE, float: true, vx: -1.5, boundL: 1100, boundR: 1600 });

        const pits = [];
        for (let i = 0; i < Math.min(2, w); i++) {
            let gx = 500 + Math.random() * (Game.levelW - 1000); 
            let gw = TILE * 3; 
            pits.push({ x: gx, w: gw });
            Game.platforms = Game.platforms.filter(p => !(p.float == null && p.x >= gx && p.x < gx + gw && p.y === floorY));
        }

        const ec = 5 + w * 3 + l * 2;
        for (let i = 0; i < ec; i++) {
            let ex = 300 + Math.random() * (Game.levelW - 500); 
            let ey = floorY - 30; 
            let floaters = Game.platforms.filter(p => p.float && !p.vx && !p.drop);
            if (floaters.length > 0 && Math.random() < 0.6) {
                let f = floaters[Math.floor(Math.random() * floaters.length)];
                ex = f.x + Math.random() * (f.w - 18); 
                ey = f.y - 30; 
            }
            if(typeof mkEnemy === 'function') mkEnemy(ex, ey, w); 
        }
    } else {
        if(typeof mkBoss === 'function') mkBoss(Game.levelW / 2, floorY - 90, w); 
        
        document.getElementById("bossBarWrap").style.display = "flex";
        const bossNames = [
            "", "고블린 킹", "언데드 고블린 킹", "스켈레톤 치프틴", "언데드 스켈레톤 치프틴", 
            "거대 괴수 더스크", "리치 킹", "마족 제1친위대장 (쌍검)", "마족 제2친위대장 (대검)", "마족 제3친위대장 (사신)", "마왕 (Demon Lord)"
        ];
        document.getElementById("bossBarLabel").textContent = bossNames[Math.min(w, 10)];
        
        // 💡 [신규] 보스 스테이지 진입 시 컷신 상태로 전환
        Game.gs = "boss_intro";
        Game.bossIntroT = 180; // 약 3초간 컷신 발동
    }
    
    Game.doors.push({ x: Game.levelW - 70, y: floorY - 64, w: 40, h: 64, open: false });
    
    let currentHp = Game.player ? Game.player.hp : Game.pMaxHp; 
    if(typeof mkP === 'function') Game.player = mkP(40, floorY - 30);
    if(Game.player) Game.player.hp = currentHp; 
    
    Game.camX = 0;
    if (typeof updateHUD === 'function') updateHUD();
}

function nextStage() {
    Game.levelN++;
    
    if (Game.player && Game.pHealOnClear > 0) {
        Game.player.hp = Math.min(Game.pMaxHp, Game.player.hp + Game.pHealOnClear);
    }

    if (Game.levelN > 3) {
        Game.levelN = 1;
        Game.worldN++;
        
        if (Game.worldN > 10) { 
            Game.gs = "win";
            if (Game.score > Game.highScore) { 
                Game.highScore = Game.score; 
                localStorage.setItem("skull_highscore", Game.highScore); 
            }
            if (typeof showOv === 'function') showOv("LORD OF SKULLS (CLEAR)", "모든 악몽을 정복했습니다.", "스코어: " + Game.score + " (최고: " + Game.highScore + ")", "▶ RETURN TO LOBBY");
            return;
        }
        
        Game.gs = "upgrade";
        if (typeof playBGM === 'function') playBGM('upgrade');
        
        if(typeof generateUpgradeOptions === 'function') generateUpgradeOptions();
        return;
    }
    
    // 💡 [신규] 바로 맵을 생성하지 않고 암전(Fade Out) 상태 발동
    Game.transState = 1; 
    Game.transT = 0;
}

// 💡 [신규] 화면이 완전히 까매졌을 때(Fade Out 완료) 맵을 생성하는 트리거 함수
function nextStageTrigger() {
    document.getElementById("bossBarWrap").style.display = "none";
    genStage(Game.worldN, Game.levelN);
    if (typeof updateHUD === 'function') updateHUD();
    
    Game.transState = 2; // 맵 생성 후 Fade In 상태로 전환
    if (typeof playBGM === 'function') playBGM('play'); 
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