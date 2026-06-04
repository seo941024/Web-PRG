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
    
    Game.eventObjects = [];
    Game.traps = [];

    // 청크 기반 맵 생성 (mapgen.js)
    if (typeof buildChunkMap === 'function') {
        buildChunkMap(w, l);
    }

    const isBoss = l === 3;
    const floorY = CH - 40;

    if (isBoss) {
        if (typeof mkBoss === 'function') mkBoss(Game.levelW / 2, floorY - 90, w); 
        document.getElementById("bossBarWrap").style.display = "flex";
        const bossNames = [
            "", "고블린 킹", "언데드 고블린 킹", "스켈레톤 치프틴", "언데드 스켈레톤 치프틴", 
            "거대 괴수 더스크", "리치 킹", "마족 제1친위대장 (쌍검)", "마족 제2친위대장 (대검)", "마족 제3친위대장 (사신)", "마왕 (Demon Lord)"
        ];
        document.getElementById("bossBarLabel").textContent = bossNames[Math.min(w, 10)];
        Game.gs = "boss_intro";
        Game.bossIntroT = 180;
    }
    
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
        
        // 짝수 월드 진입 전이면 업그레이드 후 루트 선택 예약
        if (Game.worldN % 2 === 0) {
            Game._pendingRouteSelect = true;
        }
        
        // 매 월드 클리어 시 업그레이드 화면
        Game.gs = "upgrade";
        if (typeof playBGM === 'function') playBGM('upgrade');
        if (typeof generateUpgradeOptions === 'function') generateUpgradeOptions();
        return;
    }
    
    // 스테이지(1,2) 클리어 시에도 업그레이드 화면
    Game.gs = "upgrade";
    if (typeof playBGM === 'function') playBGM('upgrade');
    if (typeof generateUpgradeOptions === 'function') generateUpgradeOptions();
    return;
    
}

// 💡 [신규] 화면이 완전히 까매졌을 때(Fade Out 완료) 맵을 생성하는 트리거 함수
function nextStageTrigger() {
    document.getElementById("bossBarWrap").style.display = "none";
    genStage(Game.worldN, Game.levelN);
    if (typeof updateHUD === 'function') updateHUD();
    
    Game.transState = 2; // 맵 생성 후 Fade In 상태로 전환
    if (typeof playBGM === 'function') playBGM('play'); 
}