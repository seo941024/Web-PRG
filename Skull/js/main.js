// main.js — 게임 루프 및 상태 관리

function update() {
    Game.frameCount++;
    // 슬로모션 처리 (패링 성공 시)
    if (Game.slowMoT > 0) {
        Game.slowMoT--;
        if (Game.slowMoT % 2 !== 0) return; // 짝수 프레임만 실행 → 0.5배속
    }
    if (Game.hitStop > 0) { Game.hitStop--; if (Game.camShake > 0) Game.camShake--; return; }
    if (!Game.player || Game.gs === "gameover") return;

    if (Game.gs === "boss_intro") {
        Game.bossIntroT--;
        if (Game.bossIntroT <= 0) {
            Game.camX = Math.max(0, (Game.levelW / 2) - CW / 2);
            Game.camShake = 0; Game.hitStop = 0;
            // 보스 대사 컷신 — STORY.boss[worldN]에 대사가 있으면 표시
            if (typeof startCutscene === 'function') startCutscene("boss", Game.worldN);
            else Game.gs = "play";
        }
        return;
    }

    updateEnvironment();
    updatePlayer();
    if (typeof updateStamina === 'function') updateStamina();
    if (typeof updateJustDodge === 'function') updateJustDodge();
    updatePlayerCombat();
    if(typeof updateEnemies === 'function') updateEnemies();
    updateProjectiles();
    if (typeof updateTraps === 'function') updateTraps();
    if (typeof updateNPCs === 'function') updateNPCs();
    updateCrewMinions();
    updateItemsAndMisc();

    Game.camX += (Game.player.x - CW / 3 - Game.camX) * 0.1; 
    Game.camX = Math.max(0, Math.min(Game.levelW - CW, Game.camX));
}

// ==========================================
// 업그레이드 데이터 테이블 (이름 + 효과 함수 통합)
// ==========================================
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
    // 게이지 묶음 전체 표시/숨김 — SKILL만 아니라 DASH, STAMINA 포함
    const uiGauges = document.getElementById("ui-gauges");
    if (uiGauges) uiGauges.style.display = inGame ? "flex" : "none";
    // STAMINA도 항상 flex 유지 (position:absolute이므로 부모 display만 맞으면 됨)
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
        const hpPct = Math.max(0, Game.player.hp) / Game.pMaxHp;
        fill.style.width = (hpPct * 100) + "%";
        // 리게인 회색 체력 바
        const grayAmt = Game.player.grayHp || 0;
        const grayPct = Math.min(1 - hpPct, grayAmt / Game.pMaxHp);
        let grayFill = document.getElementById("playerGrayHpFill");
        if (!grayFill && fill.parentNode) {
            grayFill = document.createElement("div");
            grayFill.id = "playerGrayHpFill";
            grayFill.style.cssText = "position:absolute;height:100%;background:#ff6600;opacity:0.75;top:0;pointer-events:none;transition:width 0.05s;";
            fill.parentNode.appendChild(grayFill);
        }
        if (grayFill) { grayFill.style.left = (hpPct*100)+"%"; grayFill.style.width = (grayPct*100)+"%"; }
        if (sFill) {
            sFill.style.width = (Math.min(30, Game.pShield) / 30 * 100) + "%";
            sFill.style.display = Game.pShield > 0 ? "block" : "none";
        }
        hpTxt.textContent = Game.player.hp + " / " + Game.pMaxHp + (Game.pShield > 0 ? ` (+${Game.pShield})` : "") + (grayAmt > 0 ? ` [${grayAmt}]` : "");
    }
    
    const mpF = document.getElementById("mpFill");
    const sLab = document.getElementById("skillLabel");
    if (mpF && sLab) {
        const pct = Math.floor((Game.pMp / (Game.pMaxMp || 15)) * 100);
        mpF.style.width = Math.min(100, pct) + "%";
        if (Game.pMp >= (Game.pMaxMp || 15)) {
            sLab.textContent = "READY!"; sLab.style.color = "#ffee00";
        } else {
            sLab.textContent = pct + "%"; sLab.style.color = "#00ffcc";
        }
    }

    // DASH 게이지 DOM 업데이트
    const dashFill = document.getElementById("dashFill");
    const dashLab  = document.getElementById("dashLabel");
    if (dashFill && Game.player) {
        const dashPct = 1 - Math.min(1, Game.player.dashCD / (75 * (Game.pDashCDMul || 1)));
        dashFill.style.width = (dashPct * 100) + "%";
        dashFill.style.background = dashPct >= 1 ? "#ffdd00" : "#aa9900";
        if (dashLab) {
            // SKILL과 동일하게 "READY!" 로 통일
            dashLab.textContent = dashPct >= 1 ? "READY!" : Math.floor(dashPct * 100) + "%";
            dashLab.style.color  = dashPct >= 1 ? "#ffee00" : "#aa9900";
        }
    }

    // STAMINA 게이지 DOM 업데이트
    const stamFill  = document.getElementById("staminaFill");
    const stamLab   = document.getElementById("staminaLabel");
    if (stamFill && Game.player) {
        const stam    = Game.player.stamina || 0;
        const stamMax = typeof STAMINA_MAX !== 'undefined' ? STAMINA_MAX : 100;
        const stamPct = Math.min(1, stam / stamMax);
        // STAMINA 색: greenyellow 기본, 부족하면 red로 경고
        const stamCol = stam < 15 ? "#ff4400" : "greenyellow";
        stamFill.style.width      = (stamPct * 100) + "%";
        stamFill.style.background = stamCol;
        if (stamLab) {
            if (stam >= stamMax) {
                stamLab.textContent = "MAX"; stamLab.style.color = "greenyellow";
            } else if (stam < 15) {
                stamLab.textContent = "EMPTY!"; stamLab.style.color = "#ff4400";
            } else {
                stamLab.textContent = Math.floor(stamPct * 100) + "%";
                stamLab.style.color = stamCol;
            }
        }
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

    const regionNames = ["", "고블린 숲", "파괴된 고블린 숲", "스켈레톤의 영역", "파괴된 스켈레톤의 영역", "저주받은 성당", "부서진 저주받은 성당", "어둠의 성당", "마족 성채", "마왕성 입구", "마왕의 왕좌"];
    let rName = regionNames[Math.min(Game.worldN, 10)];
    // 튜토리얼일 때는 STAGE 0으로 표기 — 1-1로 잘못 표시되는 혼란 방지
    if (Game.isTutorial) {
        if (stageLabel) stageLabel.textContent = "스테이지 0  [ 튜토리얼 ]";
    } else {
        if (stageLabel) stageLabel.textContent = `[${rName}] 스테이지 ${Game.worldN}-${Game.levelN}${Game.levelN === 3 ? " [BOSS]" : ""}`;
    }
    
    if(scoreLabel) scoreLabel.textContent = "점수: " + Game.score; 
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
    if (typeof stopBGM === 'function') stopBGM();
    // 로비 복귀 시 로비 BGM 재생
    setTimeout(() => { if (typeof playBGM === 'function') playBGM('lobby'); }, 200);
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
    // 사망 BGM 등 이전 BGM을 완전히 끊고 새로 시작 — 재시작 시 dead BGM 잔류 방지
    if (typeof stopBGM === 'function') stopBGM();
    playBGM('play');
    
    Game.score = 0; Game.kills = 0; Game.worldN = 1; Game.levelN = 1; 
    Game.pMp = 0; Game.comboCount = 0; Game.pRangeBonus = 0; Game.pBaseDef = 0; Game.pShield = 0;
    Game.pMaxMp = 15;

    // ── 직업별 기본 스탯 ──
    if (Game.pClass === 0) {
        // 전사: 밸런스
        Game.pMaxHp = 60 + (Game.permHpLvl * 10); Game.pBaseDmg = 35 + (Game.permAtkLvl * 2);
        Game.pMoveSpdMul = 1.0; Game.pDashCDMul = 1.0; Game.pJmpMul = 1.0; Game.pBaseAtkSpd = 1.0;
    } else if (Game.pClass === 1) {
        // 도적: 쌍단검, 매우 빠름, 낮은 데미지
        Game.pMaxHp = 45 + (Game.permHpLvl * 10); Game.pBaseDmg = 20 + (Game.permAtkLvl * 2);
        Game.pMoveSpdMul = 1.3; Game.pDashCDMul = 0.55; Game.pJmpMul = 1.2; Game.pBaseAtkSpd = 1.9;
    } else if (Game.pClass === 2) {
        // 마법사: 원거리, 보통 공속
        Game.pMaxHp = 40 + (Game.permHpLvl * 10); Game.pBaseDef = -5; Game.pBaseDmg = 35 + (Game.permAtkLvl * 2);
        Game.pMoveSpdMul = 1.0; Game.pJmpMul = 1.0; Game.pBaseAtkSpd = 0.55;
    } else if (Game.pClass === 3) {
        // 버서커: 매우 높은 HP/ATK, 매우 느린 공속
        Game.pMaxHp = 100 + (Game.permHpLvl * 10); Game.pBaseDmg = 80 + (Game.permAtkLvl * 2);
        Game.pMoveSpdMul = 0.85; Game.pDashCDMul = 1.3; Game.pJmpMul = 1.0; Game.pBaseAtkSpd = 0.45;
        Game.pRangeBonus = 20; // 중거리 판정
    } else if (Game.pClass === 4) {
        // 발키리(해적): 총, 매우 빠른 공속, 낮은 데미지, 8발 리로드
        Game.pMaxHp = 50 + (Game.permHpLvl * 10); Game.pBaseDmg = 15 + (Game.permAtkLvl * 2);
        Game.pMoveSpdMul = 1.1; Game.pDashCDMul = 0.9; Game.pJmpMul = 1.0; Game.pBaseAtkSpd = 2.5;
        Game.pGunAmmo = 8; Game.pGunReload = 0; // 탄약 시스템
    } else if (Game.pClass === 5) {
        // 방패병: 망치+방패, 중거리, 보통 공속, 패링 3배
        Game.pMaxHp = 80 + (Game.permHpLvl * 10); Game.pBaseDmg = 30 + (Game.permAtkLvl * 2);
        Game.pMoveSpdMul = 0.9; Game.pDashCDMul = 1.1; Game.pJmpMul = 0.95; Game.pBaseAtkSpd = 0.9;
        Game.pRangeBonus = 15; // 중거리
    }
    
    Game.pBaseDmgMul = 1.0; Game.pAtkSpdMul = 1.0; Game.pParryMp = 3; 
    Game.pSkillDmgMul = 1.0; Game.pExtraDmg = 0.0; Game.pHealOnHit = false;
    Game.pLifestealChance = 0.05; Game.pCritChance = 0.20; Game.pCritDmg = 1.5;
    // 영구 강화: 클래스 기본값에 더함 (덮어쓰기 아닌 누적)
    Game.pMaxHp  += (Game.permHpLvl  || 0) * 10;
    Game.pBaseDmg += (Game.permAtkLvl || 0) * 2;
    Game.pCritChance += (Game.permCritLvl || 0) * 0.02;
    Game.pMoveSpdMul += (Game.permSpdLvl  || 0) * 0.04;
    Game.pJmpMul     += (Game.permJmpLvl  || 0) * 0.05;
    Game.pDashCDMul   = Math.max(0.5, Game.pDashCDMul - (Game.permDashLvl || 0) * 0.05);
    Game.pCritDmg    += (Game.permCritDmgLvl || 0) * 0.15;
    // 최대 마나 고정 15
    Game.pReflectDmg = 0; Game.pLowHpDmg = 1.0; Game.pDashInv = 0;
    Game.pProjSlow = 1.0; Game.pSkillWidth = 1.0; Game.pDmgReduction = 1.0; Game.pComboDur = 0; Game.pComboDmg = 0; Game.pRevive = 0;
    
    Game.pFinalDmgMul = 1.0; Game.pMultiplierItems = 0; Game.rerollCoins = 0; 
    Game.pRegenFrames = 0; Game.regenT = 0; Game.pHealOnClear = 0;
    Game.pParryBonus = 0; Game.pCursedPendant = false; Game.curseT = 0;
    Game.pDropRate = 0.35; Game.pBloodFestival = false; Game.obtainedItems = []; 
    
    Game.player = null; 
    Game.isPaused = false;
    Game.traps = [];
    Game.bloodDecals = [];
    Game.justDodgeActive = false;
    Game.justDodgeT = 0;
    Game.justDodgeDmgBonus = 1.0;
    // 런 결과 기록 초기화
    Game.runStats = { startTime: Date.now(), totalDmgDealt: 0, totalDmgTaken: 0, bossesKilled: 0, maxCombo: 0, itemsObtained: 0 };
    _appliedSynergies.clear(); 

    const bbw = document.getElementById("bossBarWrap");
    if(bbw) bbw.style.display = "none";
    // 조작법 안내 화면(tutorial_intro) → 튜토리얼 맵(play) → 1-1 순서
    // overlay 숨김은 여기서 먼저 처리
    const overlay = document.getElementById("overlay");
    if (overlay) overlay.style.display = "none";

    if (typeof startTutorialIntro === 'function') {
        // tutorial_intro 상태로 전환 — 이후 gs 덮어쓰기 금지!
        startTutorialIntro();
        // transT는 tutorial_intro 렌더에서 별도 처리하므로 여기선 안 건드림
    } else if (typeof genTutorial === 'function') {
        genTutorial(); // genTutorial 내부에서 gs/transState 직접 세팅
    } else {
        if (typeof genStage === 'function') genStage(1, 1);
        if (typeof initSystems === 'function') initSystems();
        if (typeof initBloodDecals === 'function') initBloodDecals();
        Game.transState = 2; Game.transT = 255;
        Game.gs = "play";
    }
}

const startBtn = document.getElementById("startBtn");
if(startBtn) {
    startBtn.addEventListener("click", () => {
        const overlay = document.getElementById("overlay");
        if(overlay) overlay.style.display = "none";
        if (typeof startCutscene === 'function') startCutscene("opening");
        else Game.gs = "class_select";
    });
}

let lastTime = 0; const FPS = 60; const interval = 1000 / FPS; 

function updateClassSelect() {
    // ← → 로 6직업 순환 + 슬라이드 애니메이션 트리거
    if (dn("ArrowRight") && !K.rDirOld) {
        Game._classSlideDir = 1;   // 오른쪽으로 슬라이드
        Game._classSlideT   = 0;
        Game.pClass = (Game.pClass + 1) % 6;
        playSfx('item');
    }
    if (dn("ArrowLeft") && !K.lOld) {
        Game._classSlideDir = -1;  // 왼쪽으로 슬라이드
        Game._classSlideT   = 0;
        Game.pClass = (Game.pClass + 5) % 6;
        playSfx('item');
    }
    // 슬라이드 타이머 진행
    if (Game._classSlideT !== undefined && Game._classSlideT < 1) {
        Game._classSlideT = Math.min(1, (Game._classSlideT || 0) + 0.1);
    }

    if (dn("Space") && !K.spcOld) { startGame(); }
    if (dn("KeyS") && !K.sOld) { Game._prevShopGs = Game.gs; Game.gs = "shop"; playSfx('item'); }
}

// ==========================================
// 게임 상태별 업데이트/렌더 핸들러
// ==========================================

function tickRouteSelect(frameNow) {
    // 배경
    ctx.fillStyle = "#08040f";
    ctx.fillRect(0, 0, CW, CH);
    const grd = ctx.createRadialGradient(CW/2, CH/2, 0, CW/2, CH/2, CW*0.6);
    grd.addColorStop(0, "rgba(60,0,80,0.4)"); grd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grd; ctx.fillRect(0, 0, CW, CH);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffcc00"; ctx.font = "bold 22px NeoDunggeunmo";
    ctx.fillText(`WORLD ${Game.worldN} 진입 전 - 루트 선택`, CW/2, 55);
    ctx.fillStyle = "#aaa"; ctx.font = "13px NeoDunggeunmo";
    ctx.fillText("앞으로 나아갈 길을 선택하라.", CW/2, 78);

    const opts = [
        { key: "1", label: "치유의 은혜", desc: "HP 50% 즉시 회복\n체력이 위험할 때 선택", col: "#ff4444" },
        { key: "2", label: "마나의 샘", desc: "마나 100% 즉시 회복\n필살기 연계 시 선택", col: "#44aaff" },
        { key: "3", label: "유물의 현현", desc: "패시브 유물 하나 더 선택\n강한 빌드를 원할 때", col: "#ffcc44" },
    ];
    opts.forEach((opt, i) => {
        const bx = 70 + i * 170, by = 110, bw = 155, bh = 150;
        const hover = (dn("Digit" + opt.key) || dn("Numpad" + opt.key));
        ctx.fillStyle = hover ? opt.col.replace(")", ",0.25)").replace("rgb","rgba") : "rgba(20,10,30,0.7)";
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = hover ? opt.col : "rgba(100,60,140,0.6)";
        ctx.lineWidth = hover ? 2 : 1;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = opt.col; ctx.font = "bold 16px NeoDunggeunmo";
        ctx.fillText(`[${opt.key}] ${opt.label}`, bx + bw/2, by + 30);
        ctx.fillStyle = "#ccc"; ctx.font = "12px NeoDunggeunmo";
        const lines = opt.desc.split("\n");
        lines.forEach((l, j) => ctx.fillText(l, bx + bw/2, by + 60 + j * 20));
    });
    ctx.textAlign = "left";

    if (dn("Digit1", "Numpad1") && !K.u1Old) {
        // 치유: HP 50% 회복
        if (Game.player) Game.player.hp = Math.min(Game.pMaxHp, Game.player.hp + Math.floor(Game.pMaxHp * 0.5));
        addText(320, 160, "HP +50% 회복!", "#ff4444", 80, 18, 0, 0.5);
        playSfx('item');
        Game.transState = 2; Game.transT = 255;
        Game.gs = "play"; playBGM('play');
        if (typeof genStage === 'function') genStage(Game.worldN, Game.levelN);
    } else if (dn("Digit2", "Numpad2") && !K.u2Old) {
        // 마나 100% 회복
        Game.pMp = Game.pMaxMp;
        addText(320, 160, "MP 100% 회복!", "#44aaff", 80, 18, 0, 0.5);
        playSfx('item');
        Game.transState = 2; Game.transT = 255;
        Game.gs = "play"; playBGM('play');
        if (typeof genStage === 'function') genStage(Game.worldN, Game.levelN);
    } else if (dn("Digit3", "Numpad3") && !K.u3Old) {
        // 유물의 현현: 미리보기+획득/지나치기 모드로 진입
        if (typeof generateUpgradeOptions === 'function') generateUpgradeOptions();
        Game._upgradeFromRoute = true;
        Game._upgradePreview = null;
        Game._upgradeRouteDelay = 10; // 진입 후 10프레임간 키 무시
        Game.gs = "upgrade";
        playBGM('upgrade');
    }
}

function tickMenu() {
    const bgGrd = ctx.createRadialGradient(CW/2, CH/2, 0, CW/2, CH/2, CW);
    bgGrd.addColorStop(0, "#2a0b4e");
    bgGrd.addColorStop(1, "#05020a");
    ctx.fillStyle = bgGrd;
    ctx.fillRect(0, 0, CW, CH);
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    for (let x = 0; x < CW; x += TILE) ctx.fillRect(x, CH - TILE, TILE, TILE);

    if (dn("Space") && !K.spcOld) {
        const overlay = document.getElementById("overlay");
        if (overlay) overlay.style.display = "none";
        playSfx('item');
        if (typeof startCutscene === 'function') startCutscene("opening");
        else Game.gs = "class_select";
    }
}

function tickClassSelect(frameNow) {
    updateClassSelect();
    if (typeof renderClassSelect === 'function') renderClassSelect(frameNow);
}

function tickShop() {
    updateShop();
    renderShop();
}

function tickUpgrade() {
    if (dn("KeyR") && !K.rOld && Game.rerollCoins > 0) {
        Game.rerollCoins--;
        playSfx('item');
        if (typeof generateUpgradeOptions === 'function') generateUpgradeOptions();
    }
    renderUpgrade();
}

function tickPlay() {
    // 사망 → 게임오버 전환
    if (Game.gs === "dead" && Game.deadTimer <= 0) {
        Game.gs = "gameover";
        if (Game.score > Game.highScore) {
            Game.highScore = Game.score;
            localStorage.setItem("skull_highscore", Game.highScore);
        }
        const rs = Game.runStats;
        const runSec = rs ? Math.floor((Date.now() - rs.startTime) / 1000) : 0;
        const runMin = Math.floor(runSec / 60), runS = runSec % 60;
        const timeStr = `${runMin}분 ${runS}초`;
        const reachStr = `W${Game.worldN}-${Game.levelN} 도달  최대 ${rs ? rs.maxCombo : 0} 콤보`;
        showOv("YOU DIED", `스코어: ${Game.score}  (최고: ${Game.highScore})`, `${reachStr}  플레이 ${timeStr}`, "[Space]키로 로비로 복귀");
    }

    // 게임오버/클리어 → 로비 복귀
    if (Game.gs === "gameover" && dn("Space") && !K.spcOld) {
        stopBGM();
        // 깨진 맵/상태 완전 초기화 — 로비 복귀 후에도 이전 맵이 남아있는 버그 방지
        Game.platforms = []; Game.doors = []; Game.traps = []; Game.eventObjects = [];
        Game.enemies.forEach(e  => { e.active = false; e.isTutorialDummy = false; });
        Game.bullets.forEach(b  => b.active = false);
        Game.eBullets.forEach(b => b.active = false);
        Game.lasers.forEach(l   => l.active = false);
        Game.parts.forEach(p    => p.active = false);
        Game.texts.forEach(t    => t.active = false);
        Game.items.forEach(i    => i.active = false);
        Game.player       = null;
        Game.cutscene     = null;
        Game.isTutorial   = false;
        Game.camX         = 0;
        Game.camShake     = 0;
        Game.hitStop      = 0;
        Game.transT       = 0;
        Game.transState   = 0;
        Game.invT         = 0;
        Game.slowMoT      = 0;
        Game.justDodgeActive = false;
        Game.justDodgeT   = 0;
        const bbw = document.getElementById("bossBarWrap");
        if (bbw) bbw.style.display = "none";
        Game.gs = "menu";
        restoreLobbyUI();
        return;
    }
    if (Game.gs === "win" && dn("Space") && !K.spcOld) {
        stopBGM();
        if (typeof startCutscene === 'function') startCutscene("ending");
        else { Game.gs = "menu"; restoreLobbyUI(); }
        return;
    }

    // 로직 업데이트
    if ((Game.gs === "play" || Game.gs === "dead" || Game.gs === "boss_intro") && !Game.isPaused) {
        if (typeof update === 'function') update();
    }

    // 렌더 — cutscene/opening 계열은 switch에서 별도 처리하므로 여기선 skip
    if (typeof render === 'function'
        && Game.gs !== "cutscene"
        && Game.gs !== "opening_anim"
        && Game.gs !== "opening_end"
        && Game.gs !== "tutorial_intro") {
        render();
    }

    // 일시정지 오버레이
    if (Game.isPaused) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; ctx.fillRect(0, 0, CW, CH);
        ctx.fillStyle = "#fff"; ctx.font = "bold 40px NeoDunggeunmo"; ctx.textAlign = "center";
        ctx.fillText("PAUSED", CW/2, CH/2);
        ctx.font = "16px NeoDunggeunmo"; ctx.fillStyle = "#aaa";
        ctx.fillText("P: 재개 / R: 재시작 / ESC: 로비 복귀", CW/2, CH/2 + 40);
        ctx.textAlign = "left";
    }
}

function tickMuteOverlay() {
    if (dn("KeyM") && !K.mOld) Game.isMuted = !Game.isMuted;
    if (Game.isMuted) {
        ctx.fillStyle = "#ff0000"; ctx.font = "bold 16px NeoDunggeunmo"; ctx.textAlign = "right";
        ctx.fillText("음소거", CW - 20, 30); ctx.textAlign = "left";
    } else {
        ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.font = "12px NeoDunggeunmo"; ctx.textAlign = "right";
        ctx.fillText("M: 음소거", CW - 20, 30); ctx.textAlign = "left";
    }
}

// ==========================================
// 메인 루프
// ==========================================

// ── 튜토리얼 사전 안내 화면 렌더 ──────────────
const _TUTORIAL_PAGES = [
    {
        title: "[ 기본 조작 ]",
        lines: [
            "← → 키  :  이동",
            "X 키     :  점프  (공중에서 한 번 더 점프 가능)",
            "Z 키     :  대시  (짧은 무적 회피, 스태미나 소모)",
            "C 키     :  기본 공격  (3연타 콤보)",
            "↓ + C   :  강하 공격  (공중에서 아래방향+C, 체간 대량 감소)",
            "Shift 키 :  필살기  (MP 게이지 100% 시 발동)",
            "V 키     :  가드 / 패링",
        ]
    },
    {
        title: "[ 전투 심화: 콤보 & 체간 ]",
        lines: [
            "■ 콤보 시스템",
            "  C를 연속 입력하면 콤보 카운터 상승 → 데미지 보너스 누적.",
            "  피격되면 콤보가 초기화됩니다.",
            "",
            "■ 체간(Poise) & 기절(Stun)",
            "  모든 적은 HP 바 아래에 파란 체간 게이지를 가집니다.",
            "  체간이 0 → 기절(STUNNED) 상태 진입.",
            "  기절 중 C를 누르면 FATAL STRIKE 처형 (무적 + 고데미지)!",
            "  패링(V) 성공 시 체간 -50, 강하(↓+C) 적중 시 체간 -30.",
        ]
    },
    {
        title: "[ 방어 & 특수 상태 ]",
        lines: [
            "■ 가드 & 패링",
            "  V를 누르고 있으면 가드 (스태미나 서서히 소모).",
            "  공격이 닿는 순간 V를 누르면 패링 → MP 회복 + 적 경직!",
            "",
            "■ 가드 브레이크",
            "  스태미나 0인 채로 피격 → 가드 브레이크 (치명 넉백).",
            "  스태미나 게이지를 항상 확인하세요.",
            "",
            "■ Witch Time (저스트 회피)",
            "  대시 직후 피격되면 슬로모션 발동 → 다음 공격 2배 데미지!",
        ]
    },
];

function _renderTutorialIntro(frameNow) {
    const page = Game.tutorialIntroPage || 0;
    const data = _TUTORIAL_PAGES[Math.min(page, _TUTORIAL_PAGES.length - 1)];

    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, CW, CH);
    ctx.strokeStyle = "rgba(180,30,30,0.3)"; ctx.lineWidth = 1;
    ctx.strokeRect(12, 12, CW - 24, CH - 24);

    // 페이지
    ctx.fillStyle = "#555"; ctx.font = "11px SkullFont, NeoDunggeunmo";
    ctx.textAlign = "right";
    ctx.fillText(`${page + 1} / ${_TUTORIAL_PAGES.length}`, CW - 22, 30);
    ctx.textAlign = "left";

    // 제목
    ctx.fillStyle = "#ff4422"; ctx.font = "bold 18px SkullFont, NeoDunggeunmo";
    ctx.shadowBlur = 8; ctx.shadowColor = "#ff2200";
    ctx.fillText(data.title, 30, 48);
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "rgba(180,60,40,0.4)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(30, 56); ctx.lineTo(CW - 30, 56); ctx.stroke();

    data.lines.forEach((line, i) => {
        if (!line) return;
        if (line.startsWith("■")) {
            ctx.fillStyle = "#ffcc44"; ctx.font = "bold 13px SkullFont, NeoDunggeunmo";
        } else if (line.startsWith("  ")) {
            ctx.fillStyle = "#cccccc"; ctx.font = "12px SkullFont, NeoDunggeunmo";
        } else {
            ctx.fillStyle = "#eeeeee"; ctx.font = "13px SkullFont, NeoDunggeunmo";
        }
        ctx.fillText(line, 30, 76 + i * 22);
    });

    const blink = Math.floor(frameNow / 400) % 2 === 0;
    ctx.font = "bold 12px SkullFont, NeoDunggeunmo"; ctx.textAlign = "center";
    if (page < _TUTORIAL_PAGES.length - 1) {
        ctx.fillStyle = blink ? "#ffcc44" : "#886622";
        ctx.fillText("[ SPACE / → ] 다음 페이지  |  [ ← ] 이전", CW / 2, CH - 20);
    } else {
        ctx.fillStyle = blink ? "#00ffcc" : "#008866";
        ctx.shadowBlur = blink ? 8 : 0; ctx.shadowColor = "#00ffcc";
        ctx.fillText("[ SPACE ] 튜토리얼 시작!", CW / 2, CH - 20);
        ctx.shadowBlur = 0;
    }
    ctx.textAlign = "left";

    if (!Game._tutPageOld) Game._tutPageOld = {};
    const isLastPage = page >= _TUTORIAL_PAGES.length - 1;
    // 마지막 페이지는 Space만 진행 — 방향키로 실수 진입 방지
    const spNow   = isLastPage ? dn("Space") : dn("Space", "ArrowRight");
    const backNow = dn("ArrowLeft");
    if (spNow && !Game._tutPageOld.sp) {
        if (!isLastPage) { Game.tutorialIntroPage++; }
        else if (typeof genTutorial === 'function') { genTutorial(); }
    }
    if (backNow && !Game._tutPageOld.back && page > 0) { Game.tutorialIntroPage--; }
    Game._tutPageOld.sp   = spNow;
    Game._tutPageOld.back = backNow;
}

function loop(currentTime) {
    if (typeof ensureAudioRunning === 'function') ensureAudioRunning();
    requestAnimationFrame(loop);
    const deltaTime = currentTime - lastTime;
    if (deltaTime < interval) return;

    lastTime = currentTime - (deltaTime % interval);
    const frameNow = Date.now();

    // P키 일시정지 토글
    if (dn("KeyP") && !K.pOld) {
        if (Game.gs === "play" || Game.gs === "boss_intro") { Game.isPaused = !Game.isPaused; playSfx('item'); }
    }

    // 일시정지 중 단축키
    if (Game.isPaused) {
        if (dn("KeyR") && !K.rOld) { Game.isPaused = false; startGame(); }
        if (dn("Escape") && !K.escOld) {
            Game.isPaused = false;
            stopBGM();
            Game.gs = "menu";
            restoreLobbyUI();
        }
    }

    // 화면 전환 페이드
    if (Game.transState === 1) {
        Game.transT += 15;
        if (Game.transT >= 255) { Game.transT = 255; if (typeof nextStageTrigger === 'function') nextStageTrigger(); }
    } else if (Game.transState === 2) {
        Game.transT -= 15;
        if (Game.transT <= 0) { Game.transT = 0; Game.transState = 0; }
    }

    // 상태별 디스패치
    switch (Game.gs) {
        case "menu":         tickMenu();              break;
        case "class_select": tickClassSelect(frameNow); break;
        case "shop":         tickShop();              break;
        case "upgrade":      tickUpgrade();           break;
        case "route_select": tickRouteSelect(frameNow); break;
        case "cutscene":
            if (typeof updateCutscene === 'function') updateCutscene();
            if (typeof renderCutscene === 'function') renderCutscene(frameNow);
            break;
        case "opening_anim":
            if (typeof updateOpeningAnim === 'function') updateOpeningAnim();
            if (typeof renderOpeningAnim === 'function') renderOpeningAnim(frameNow);
            break;
        case "opening_end":
            if (typeof updateOpeningAnim === 'function') updateOpeningAnim();
            if (typeof renderOpeningAnim === 'function') renderOpeningAnim(frameNow);
            break;
        case "tutorial_intro":
            // 배경 + 페이드인도 같이 처리
            ctx.fillStyle = "#000"; ctx.fillRect(0, 0, CW, CH);
            _renderTutorialIntro(frameNow);
            // 페이드인 오버레이 (startGame에서 transT=255로 세팅됨)
            if (Game.transT > 0) {
                ctx.fillStyle = `rgba(0,0,0,${Game.transT / 255})`;
                ctx.fillRect(0, 0, CW, CH);
            }
            break;
        default:             tickPlay();              break;
    }

    // 음소거 오버레이 (메뉴/클래스선택/상점 제외)
    if (Game.gs !== "menu" && Game.gs !== "class_select" && Game.gs !== "shop" && Game.gs !== "cutscene" && Game.gs !== "opening_anim") {
        tickMuteOverlay();
    }

    // 키 상태 스냅샷 (엣지 감지용)
    K.escOld   = dn("Escape");
    K.mOld     = dn("KeyM");
    K.rOld     = dn("KeyR");
    K.u1Old    = dn("Digit1", "Numpad1");
    K.u2Old    = dn("Digit2", "Numpad2");
    K.u3Old    = dn("Digit3", "Numpad3");
    K.sOld     = dn("KeyS");
    K.lOld     = dn("ArrowLeft");
    K.rDirOld  = dn("ArrowRight");
    K.pOld     = dn("KeyP");
    K.spcOld   = dn("Space");
    // 🔥 [버그 수정] 상호작용 키(ArrowUp) 엣지 감지 추가
    K.upOld    = dn("ArrowUp");

    if (typeof updateHUD === 'function') updateHUD();
}

requestAnimationFrame((time) => { lastTime = time; loop(time); });