// ==========================================
// UI / HUD / 클래스선택 렌더링 (UI Renderer)
// ==========================================

// wrapText 헬퍼 (render_stage.js와 공유)
function wrapText(context, text, x, y, maxWidth, lineHeight) {
    if (!text) return;
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = context.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else { line = testLine; }
    }
    context.fillText(line, x, y);
}

function renderClassSelect(frameNow) {
    // 배경
    const bgGrd = ctx.createRadialGradient(CW/2, CH/2, 0, CW/2, CH/2, CW);
    bgGrd.addColorStop(0, "#1e0840"); bgGrd.addColorStop(1, "#04010a");
    ctx.fillStyle = bgGrd; ctx.fillRect(0, 0, CW, CH);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffcc00"; ctx.font = "bold 22px SkullFont, NeoDunggeunmo";
    ctx.shadowBlur = 10; ctx.shadowColor = "#aa00ff";
    ctx.fillText("클래스 선택", CW/2, 30);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#919191"; ctx.font = "11px SkullFont, NeoDunggeunmo";
    ctx.fillText("← → 이동  |  스페이스 결정  |  S 다크 쿼츠 시스템", CW/2, 55);

    // ── 6직업 데이터 ──
    const classes = [
        { name:"검사",   color:"#ffffff", hp:60,  atk:35,
          tags:["근거리","공속 보통","밸런스형"],
          skill:"파워스트라이크",
          skillDesc:"적을 향해 돌진하며 일도양단한다.",
          charDesc:"검과 방어가 균형잡힌 기본 전사." },
        { name:"도적",   color:"#cc44ff", hp:45,  atk:20,
          tags:["근거리","공속 최고","이동 빠름"],
          skill:"새비지블로우",
          skillDesc:"6연타로 무차별 난도질 후 돌진 마무리.",
          charDesc:"초고속 쌍단검, 이마의 X자 흉터가 특징." },
        { name:"마법사", color:"#00ccff", hp:40,  atk:35,
          tags:["원거리","마나 회복上","공속 보통"],
          skill:"에너지 볼트",
          skillDesc:"관통하는 마법 파동을 발사한다.",
          charDesc:"마법탄 발사, 마나 회복력 1.5배 증가" },
        { name:"버서커", color:"#ff2200", hp:100,  atk:80,
          tags:["중거리","공속 느림","체력 최고"],
          skill:"인레이지",
          skillDesc:"공중 도약 후 내려찍어 핏빛 폭발을 일으킨다.",
          charDesc:"역수 대검으로 지면을 끌며 싸우는 광전사." },
        { name:"발키리", color:"#aaaaaa", hp:50,  atk:15,
          tags:["원거리","8발 연사","공속 최고"],
          skill:"서먼 크루",
          skillDesc:"5초간 무적 선원 2명을 소환해 함께 싸운다.",
          charDesc:"8발 연사 후 자동 재장전하는 총잡이." },
        { name:"방패병", color:"#ffcc00", hp:80,  atk:30,
          tags:["중거리","패링 3배","체력 높음"],
          skill:"디바인 저지먼트",
          skillDesc:"망치를 내리쳐 전방 광역에 신성 충격파를 날린다.",
          charDesc:"망치와 방패, 패링 판정 3배의 수호자." },
    ];

    const cur  = Game.pClass || 0;
    const prev = (cur + 5) % 6;
    const next = (cur + 1) % 6;

    const slideDir = Game._classSlideDir || 0;
    const slideT   = Game._classSlideT !== undefined ? Game._classSlideT : 1;
    const eased    = slideT < 1 ? 1 - Math.pow(1 - slideT, 2) : 1;

    // 카드 크기 & 위치 — CH=360 기준
    const BIG_W = 210, BIG_H = 245;
    const SML_W = 155, SML_H = 190;
    const GAP   = 12;
    const CY    = CH / 2 + 8;   // 중앙 y

    const bigCX   = CW / 2;
    const leftCX  = bigCX - BIG_W / 2 - GAP - SML_W / 2;
    const rightCX = bigCX + BIG_W / 2 + GAP + SML_W / 2;

    function getCardX(slot) {
        const targets = { "-1": leftCX, "0": bigCX, "1": rightCX };
        const base = targets[String(slot)];
        if (slideDir === 0 || eased >= 1) return base;
        const step   = rightCX - bigCX;
        const offset = step * slideDir * (1 - eased);
        return base + offset;
    }

    ctx.save();
    ctx.beginPath(); ctx.rect(0, 46, CW, CH - 46); ctx.clip();

    const renderOrder = [
        { cls: prev, slot: -1, isCenter: false },
        { cls: next, slot:  1, isCenter: false },
        { cls: cur,  slot:  0, isCenter: true  },
    ];

    renderOrder.forEach(({ cls, slot, isCenter }) => {
        const cl  = classes[cls];
        const cw  = isCenter ? BIG_W : SML_W;
        const ch  = isCenter ? BIG_H : SML_H;
        const ccx = getCardX(slot);
        const bx  = Math.round(ccx - cw / 2);
        const by  = Math.round(CY - ch / 2);

        ctx.save();
        ctx.globalAlpha = isCenter ? 1.0 : 0.4;

        const r = parseInt(cl.color.slice(1,3),16);
        const g = parseInt(cl.color.slice(3,5),16);
        const b = parseInt(cl.color.slice(5,7),16);

        // 카드 배경
        ctx.fillStyle = isCenter
            ? `rgba(${r},${g},${b},0.15)`
            : "rgba(255,255,255,0.03)";
        ctx.fillRect(bx, by, cw, ch);

        // 테두리
        if (isCenter) {
            ctx.strokeStyle = cl.color; ctx.lineWidth = 2;
            ctx.shadowBlur = 8; ctx.shadowColor = cl.color;
            ctx.strokeRect(bx, by, cw, ch);
            ctx.shadowBlur = 0;
        } else {
            ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 1;
            ctx.strokeRect(bx, by, cw, ch);
        }

        // ── 직업명 ──
        ctx.fillStyle = isCenter ? cl.color : "#666";
        ctx.font = `bold ${isCenter ? 15 : 12}px SkullFont, NeoDunggeunmo`;
        ctx.textAlign = "center";
        if (isCenter) { ctx.shadowBlur = 5; ctx.shadowColor = cl.color; }
        ctx.fillText(cl.name, bx + cw/2, by + 22);
        ctx.shadowBlur = 0;

        // ── 스탯 (체력 / 공격) ──
        const hpVal  = cl.hp  + (Game.permHpLvl  || 0) * 10;
        const atkVal = cl.atk + (Game.permAtkLvl || 0) * 2;
        ctx.font = `${isCenter ? 10 : 9}px SkullFont, NeoDunggeunmo`;

        if (isCenter) {
            // 체력 / 공격 양쪽으로 나눠서 표시
            ctx.fillStyle = "#ff8888";
            ctx.fillText(`체력 ${hpVal}`, bx + cw * 0.3, by + 38);
            ctx.fillStyle = "#ffcc88";
            ctx.fillText(`공격 ${atkVal}`, bx + cw * 0.7, by + 38);
        } else {
            ctx.fillStyle = "#555";
            ctx.fillText(`체력 ${hpVal}   공격 ${atkVal}`, bx + cw/2, by + 36);
        }

        if (!isCenter) { ctx.restore(); return; }

        // ── 태그 3개 — 고정 폭으로 균등 배치 ──
        const TAG_Y    = by + 50;
        const TAG_W    = 58;   // 각 태그 고정 폭
        const TAG_H    = 13;
        const TAG_GAP  = 4;
        const tagsTotal = cl.tags.length * TAG_W + (cl.tags.length - 1) * TAG_GAP;
        let tagX = bx + (cw - tagsTotal) / 2;

        cl.tags.forEach(tag => {
            ctx.fillStyle = `rgba(${r},${g},${b},0.28)`;
            ctx.fillRect(tagX, TAG_Y, TAG_W, TAG_H);
            ctx.strokeStyle = `rgba(${r},${g},${b},0.5)`; ctx.lineWidth = 0.8;
            ctx.strokeRect(tagX, TAG_Y, TAG_W, TAG_H);
            ctx.fillStyle = "#cccccc";
            ctx.font = "8px SkullFont, NeoDunggeunmo";
            ctx.textAlign = "center";
            ctx.fillText(tag, tagX + TAG_W/2, TAG_Y + 9);
            tagX += TAG_W + TAG_GAP;
        });

        // ── 구분선 ──
        const LINE1_Y = by + 70;
        ctx.fillStyle = `rgba(${r},${g},${b},0.35)`;
        ctx.fillRect(bx + 10, LINE1_Y, cw - 20, 1);

        // ── 직업 설명 ──
        ctx.fillStyle = "#99aacc";
        ctx.font = "9px SkullFont, NeoDunggeunmo";
        ctx.textAlign = "center";
        ctx.fillText(cl.charDesc, bx + cw/2, LINE1_Y + 12);

        // ── 구분선 2 ──
        const LINE2_Y = LINE1_Y + 21;
        ctx.fillStyle = `rgba(${r},${g},${b},0.2)`;
        ctx.fillRect(bx + 10, LINE2_Y, cw - 20, 1);

        // ── 스킬 이름 ──
        const SKILL_Y = LINE2_Y + 14;
        ctx.fillStyle = cl.color;
        ctx.font = "bold 11px SkullFont, NeoDunggeunmo";
        ctx.textAlign = "center";
        ctx.shadowBlur = 4; ctx.shadowColor = cl.color;
        ctx.fillText(`스킬: ${cl.skill}`, bx + cw/2, SKILL_Y);
        ctx.shadowBlur = 0;

        // ── 스킬 설명 ──
        ctx.fillStyle = "#aaaacc";
        ctx.font = "9px SkullFont, NeoDunggeunmo";
        // 줄바꿈 처리
        const words = cl.skillDesc;
        const maxW  = cw - 20;
        let line = "", lineY = SKILL_Y + 14;
        for (let i = 0; i < words.length; i++) {
            const test = line + words[i];
            if (ctx.measureText(test).width > maxW && line.length > 0) {
                ctx.fillText(line, bx + cw/2, lineY);
                line = words[i]; lineY += 13;
            } else { line = test; }
        }
        if (line) ctx.fillText(line, bx + cw/2, lineY);

        // ── 선택 플래시 ──
        if (Math.floor(frameNow / 350) % 2 === 0) {
            ctx.fillStyle = cl.color;
            ctx.font = "bold 9px SkullFont, NeoDunggeunmo";
            ctx.textAlign = "center";
            ctx.fillText("▶ SPACE 선택 ◀", bx + cw/2, by + ch - 8);
        }

        ctx.restore();
    });

    // 사이드 화살표
    ctx.save(); ctx.globalAlpha = 0.35; ctx.font = "16px SkullFont, NeoDunggeunmo"; ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("◀", leftCX - SML_W/2 - 10, CY + 5);
    ctx.fillText("▶", rightCX + SML_W/2 + 10, CY + 5);
    ctx.restore();

    // 페이지 인디케이터
    ctx.save();
    for (let i = 0; i < 6; i++) {
        const dotX = CW/2 - 5*7 + i*14 + 7;
        const dotY = CY + BIG_H/2 + 12;
        ctx.fillStyle = i === cur ? "#ffcc00" : "rgba(255,255,255,0.18)";
        ctx.beginPath(); ctx.arc(dotX, dotY, i === cur ? 4 : 2.5, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();

    ctx.restore(); // clip 해제
    ctx.textAlign = "left"; ctx.lineWidth = 1;
}
function drawUI() {
    if (Game.gs === "menu" || Game.gs === "class_select" || Game.gs === "shop") return;

    Game.texts.forEach(t => { 
        if (!t.active) return;
        const tx = t.x - Game.camX; 
        if (tx < -20 || tx > CW + 20) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, t.life / 20);
        ctx.fillStyle = t.color === "#ffffff" ? "#00ccff" : t.color;
        ctx.font = `bold ${t.size || 14}px NeoDunggeunmo`;
        // 데미지 텍스트에 그림자 효과
        if (t.color === "#ff0000" || t.color === "#ffcc00" || t.color === "#ff6600") {
            ctx.shadowBlur = 4; ctx.shadowColor = t.color;
        }
        ctx.fillText(t.text, tx, t.y);
        ctx.shadowBlur = 0;
        ctx.restore();
    });

    // Fatal Strike 가능 표시 (스턴 상태 근접 적이 있을 때)
    if (typeof canExecute === 'function') {
        const stunTarget = Game.enemies && Game.enemies.find(e => e.active && !e.dead && e.stun && canExecute(e));
        if (stunTarget) {
            const stx = stunTarget.x - Game.camX;
            const blink = Math.floor(Date.now() / 300) % 2 === 0;
            if (blink) {
                ctx.fillStyle = "#ff0000";
                ctx.font = "bold 13px SkullFont, NeoDunggeunmo"; ctx.textAlign = "center";
                ctx.shadowBlur = 8; ctx.shadowColor = "#ff0000";
                ctx.fillText("▼ 처형 공격 [C]", stx + stunTarget.w/2, stunTarget.y - 20);
                ctx.shadowBlur = 0; ctx.textAlign = "left";
            }
        }
    }

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
        const comboCol = isMegaCombo ? "#ff0000" : (isHighCombo ? "#fdd85e" : "#e7e7e7");
        ctx.font = `bold ${isMegaCombo ? 26 : (isHighCombo ? 22 : 18)}px NeoDunggeunmo`;
        ctx.fillStyle = comboCol;
        ctx.shadowColor = comboCol; ctx.shadowBlur = isMegaCombo ? 15 : (isHighCombo ? 8 : 4);
        ctx.fillText(`${Game.comboCount} 콤보`, 0, 0);
        ctx.shadowBlur = 0;
        // 콤보 타이머 바
        const barW = 155 * (Game.comboTimer / (150 + Game.pComboDur));
        ctx.fillStyle = "rgba(80,0,0,0.4)"; ctx.fillRect(-5, 6, 155, 5);
        ctx.fillStyle = comboCol; ctx.fillRect(-5, 6, barW, 5);
        ctx.restore();
    }

    if (!Game.enemies.some(e=>e.active && !e.dead) && Game.doors.length > 0 && Game.doors[0].open) {
        ctx.fillStyle = "rgba(0,255,100,0.06)"; ctx.fillRect(0, 0, CW, CH);
        ctx.fillStyle = "#00ccff"; ctx.font = "16px SkullFont, NeoDunggeunmo"; ctx.textAlign = "center"; 
        ctx.fillText("구역 정화 완료 → 문으로 입장하세요.", CW / 2, 30); ctx.textAlign = "left";
    }

    // ── 게이지 3종은 index.html DOM 요소(ui-skill 등)로 표시 — 캔버스 중복 렌더링 제거 ──
    
    if (Game.gs === "play" || Game.gs === "dead" || Game.gs === "boss_intro") {
        // 스탯창: ATK→DEF→CRIT→SPD→MOV→JMP 세로 정렬, 쿼츠/스테이지/킬 제거
        const atkVal = Math.floor(
            Game.pBaseDmg * (Game.pBaseDmgMul || 1)
            * (Game.pFinalDmgMul || 1) * (1 + (Game.pExtraDmg || 0))
        );
        const asVal  = Math.round((Game.pBaseAtkSpd || 1) * (Game.pAtkSpdMul || 1) * 100);
        const critPct = Math.round((Game.pCritChance || 0.2) * 100);
        const movPct  = Math.round((Game.pMoveSpdMul || 1) * 100);
        const jmpPct  = Math.round((Game.pJmpMul || 1) * 100);

        ctx.fillStyle = "rgba(0,0,0,0.75)"; ctx.fillRect(10, 50, 120, 112);
        ctx.font = "11px SkullFont, NeoDunggeunmo"; ctx.textAlign = "left";

        const rows = [
            { label: "공격력", val: `${atkVal}`,      col: "#af1616" },
            { label: "방어력", val: `${Game.pBaseDef}`, col: "#32b427" },
            { label: "치명타",val: `${critPct}%`,    col: "#d6467d" },
            { label: "공격속도", val: `${asVal}%`,      col: "#f1d13e" },
            { label: "이동속도", val: `${movPct}%`,     col: "#2e9de7" },
            { label: "점프력", val: `${jmpPct}%`,     col: "#661ea1" },
        ];
        rows.forEach((r, i) => {
            ctx.fillStyle = "#888";
            ctx.fillText(r.label, 16, 75 + i * 16);
            ctx.fillStyle = r.col;
            ctx.fillText(r.val, 66, 75 + i * 16);
        });
    }
    
    // 스태미나/대시/스킬은 위의 하단 게이지 3종으로 통합
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
    
    // 발키리 탄약 UI — 플레이어 중앙 기준으로 정렬
    if (Game.pClass === 4 && Game.player && !Game.player.dead) {
        const ammo  = Game.pGunAmmo !== undefined ? Game.pGunAmmo : 8;
        const reload = Game.pGunReload || 0;
        const p = Game.player;
        // 플레이어 중앙 x
        const pcx = Math.round(p.x + p.w / 2 - Game.camX);
        const pcy = Math.round(p.y);

        // 탄약 8칸: 각 5px 너비, 간격 1px → 총 너비 8*5 + 7*1 = 47px
        const SLOT = 5, GAP = 1, SLOTS = 8;
        const barW = SLOTS * SLOT + (SLOTS - 1) * GAP; // 47px
        const barX = pcx - Math.floor(barW / 2);       // 중앙 정렬
        const barY = pcy - 32;

        // 배경
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(barX - 2, barY - 2, barW + 4, 12);

        // 탄약 칸
        for (let a = 0; a < SLOTS; a++) {
            ctx.fillStyle = a < ammo ? "#ffcc00" : "#333";
            ctx.fillRect(barX + a * (SLOT + GAP), barY, SLOT, 8);
        }

        // 재장전 게이지
        if (reload > 0) {
            const prog = 1 - reload / 90;
            const rgY = barY - 14;
            ctx.fillStyle = "rgba(0,0,0,0.8)";
            ctx.fillRect(barX - 2, rgY - 2, barW + 4, 12);
            ctx.fillStyle = "#555";
            ctx.fillRect(barX, rgY, barW, 8);
            ctx.fillStyle = "#aaa";
            ctx.fillRect(barX, rgY, Math.floor(barW * prog), 8);
            ctx.fillStyle = "#ccc";
            ctx.font = "8px SkullFont, NeoDunggeunmo";
            ctx.textAlign = "center";
            ctx.fillText("재장전 중...", pcx, rgY - 3);
            ctx.textAlign = "left";
        }
    }

    // 크루 미니언 렌더
    if (Game.crewMinions && Game.crewMinions.length > 0) {
        for (const cm of Game.crewMinions) {
            if (!cm.active) continue;
            const mx = cm.x - Game.camX, my = cm.y;
            ctx.save();
            ctx.globalAlpha = 0.7 + Math.sin(Date.now() * 0.005) * 0.2;
            ctx.fillStyle = "#888"; ctx.fillRect(mx - 4, my, 8, 10);
            ctx.fillStyle = "#aaa"; ctx.fillRect(mx - 3, my - 6, 6, 6);
            ctx.fillStyle = "#666"; ctx.fillRect(mx - 2, my - 3, 4, 2);
            // 남은 시간 바
            const lifeRatio = cm.life / 300;
            ctx.fillStyle = "rgba(100,100,100,0.5)"; ctx.fillRect(mx - 6, my - 12, 12, 3);
            ctx.fillStyle = "#999"; ctx.fillRect(mx - 6, my - 12, 12 * lifeRatio, 3);
            ctx.globalAlpha = 1; ctx.restore();
        }
    }

    ctx.textAlign = "left"; ctx.fillStyle = "#00ccff"; ctx.font = "14px SkullFont, NeoDunggeunmo"; 
    ctx.fillText("적 수: " + Game.enemies.filter(e=>e.active && !e.dead).length, 10, 20);
}