// render_entities.js — 탑다운 렌더 (바닥/벽/그림자/스프라이트)

function renderRoom(walls) {
    ctx.clearRect(0, 0, CW, CH);
    const shk = Game.camShake > 0 ? (Math.random() - 0.5) * Math.min(8, Game.camShake) : 0;
    const shkY = Game.camShake > 0 ? (Math.random() - 0.5) * Math.min(8, Game.camShake) : 0;
    ctx.save();
    // scale+translate 대신 setTransform으로 화면 픽셀 단위까지 반올림 — 소수 배율(1.4)에서
    // 카메라가 서브픽셀 단위로 흔들려 도트가 매 프레임 미세하게 밀리며 깨져 보이던 문제 해결
    const tx = Math.round((-Cam.x + shk) * ZOOM);
    const ty = Math.round((-Cam.y + shkY) * ZOOM);
    ctx.setTransform(ZOOM, 0, 0, ZOOM, tx, ty);

    // 바닥 격자 — 색은 현재 스테이지 테마(stage.js의 palette)에서 가져옴
    const pal = stageTheme().palette;
    const G = 32, ROOM = 1100;
    ctx.fillStyle = pal.floor;
    ctx.fillRect(0, 0, ROOM, ROOM);
    ctx.strokeStyle = pal.grid; ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    for (let gx = 0; gx <= ROOM; gx += G) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, ROOM); ctx.stroke(); }
    for (let gy = 0; gy <= ROOM; gy += G) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(ROOM, gy); ctx.stroke(); }
    ctx.globalAlpha = 1;
    // 테마 분위기 오버레이 (화산은 붉게, 무덤은 보랏빛 등)
    ctx.fillStyle = pal.fog;
    ctx.fillRect(0, 0, ROOM, ROOM);

    // 벽 — 윗면을 밝게 칠해 두께감을 줌
    for (const w of walls) {
        ctx.fillStyle = pal.wall; ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.fillStyle = pal.wallTop; ctx.fillRect(w.x, w.y, w.w, 4);
    }

    // 지면 장판 — 예고 중엔 테두리만 차오르고, 터진 뒤엔 채워진 채로 남아 계속 위험
    Game.hazards.forEach(h => {
        if (!h.active) return;
        ctx.save();
        if (h.warnT > 0) {
            const prog = 1 - h.warnT / h.maxWarn;
            ctx.strokeStyle = h.col; ctx.globalAlpha = 0.7; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2); ctx.stroke();
            ctx.globalAlpha = 0.22;
            ctx.fillStyle = h.col;
            ctx.beginPath(); ctx.arc(h.x, h.y, h.r * prog, 0, Math.PI * 2); ctx.fill();
        } else {
            const fade = Math.min(1, h.activeT / 20);
            ctx.globalAlpha = 0.42 * fade;
            ctx.fillStyle = h.col;
            ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 0.85 * fade;
            ctx.strokeStyle = h.col; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.restore();
    });

    // 문 — 닫힘(잠김, 붉은빛)/열림(초록빛) 상태를 벽 위에 덧칠해 구분
    (Game.doors || []).forEach(d => {
        ctx.fillStyle = d.open ? "rgba(60,220,120,0.35)" : "rgba(220,60,60,0.35)";
        ctx.fillRect(d.x, d.y, d.w, d.h);
        ctx.strokeStyle = d.open ? "#3cdc78" : "#dc3c3c"; ctx.lineWidth = 2;
        ctx.strokeRect(d.x, d.y, d.w, d.h);
    });

    // 대시 잔상 — 남길 때의 애니 프레임 그대로 (본체와 자세가 어긋나지 않게)
    for (const g of dashGhosts) {
        ctx.globalAlpha = (g.life / g.max) * 0.45;
        const gt = classTint(Game.pClass);
        if (g.anim) drawAnimSprite(ctx, Game.pClass, g.anim, g.facing, g.frame || 0, g.x, g.y, gt);
        else drawDirSprite(ctx, Game.pClass, g.facing, g.x, g.y, gt);
        ctx.globalAlpha = 1;
    }

    // 적 (그림자 + 틴트 스프라이트 + HP바 + 공격 예고)
    Game.enemies.forEach(e => {
        if (!e.active || e.dead) return;
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.beginPath(); ctx.ellipse(e.x, e.y, 10, 4, 0, 0, Math.PI * 2); ctx.fill();

        if (e.state === "windup") {
            const warnBase = e._warnBase || 24;
            const prog = 1 - e.warnT / warnBase;
            ctx.strokeStyle = e.isBoss ? "rgba(255,200,60,0.85)" : "rgba(255,60,60,0.7)";
            ctx.lineWidth = e.isBoss ? 3 : 2;
            const ringR = e.isBoss ? 22 : 14;
            ctx.beginPath(); ctx.arc(e.x, e.y - (e.isBoss ? 18 : 14), ringR, 0, Math.PI * 2 * prog); ctx.stroke();
            // 돌진 계열은 어느 방향으로 올지 선으로 미리 알려줌 (회피 방향을 판단할 수 있게)
            const isDash = e.warnKind === "dash" || e.mtype === "charger" || e.mtype === "bomber";
            if (e.warnAng !== undefined && isDash) {
                const len = (e.isBoss ? 150 : 90) * prog;
                ctx.globalAlpha = 0.45;
                ctx.lineWidth = e.isBoss ? 5 : 3;
                ctx.beginPath();
                ctx.moveTo(e.x, e.y - 6);
                ctx.lineTo(e.x + Math.cos(e.warnAng) * len, e.y - 6 + Math.sin(e.warnAng) * len);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
            // 보스는 패턴 이름을 머리 위에 띄워 무엇이 오는지 읽히게
            if (e.isBoss && e.warnName) {
                ctx.fillStyle = "#ffd76a"; ctx.font = "bold 14px SkullFont, NeoDunggeunmo, monospace";
                ctx.textAlign = "center";
                ctx.fillText(e.warnName, e.x, e.y - 64);
                ctx.textAlign = "left";
            }
        }

        // 보스 후딜(빈틈) — 여기가 반격 창이라는 걸 플레이어가 읽을 수 있게 표시.
        // 남은 시간에 비례해 줄어드는 청록 링 + "빈틈" 라벨.
        if (e.isBoss && e.state === "recover" && e.recMax > 0) {
            const t = e.recT / e.recMax;
            ctx.save();
            ctx.strokeStyle = "rgba(80,255,190,0.85)"; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(e.x, e.y - 18, 14 + 16 * t, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = "rgba(80,255,190,0.12)";
            ctx.beginPath(); ctx.arc(e.x, e.y - 18, 14 + 16 * t, 0, Math.PI * 2); ctx.fill();
            if (Math.floor(Game.frameCount / 8) % 2 === 0) {
                ctx.fillStyle = "#50ffbe"; ctx.font = "bold 14px SkullFont, NeoDunggeunmo, monospace";
                ctx.textAlign = "center";
                ctx.fillText("빈틈!", e.x, e.y - 64);
                ctx.textAlign = "left";
            }
            ctx.restore();
        }

        ctx.save();
        if (e.flash > 0) ctx.filter = "brightness(2) saturate(0)";
        drawDirSpriteTinted(ctx, Game.pClass, e.facing, e.x, e.y, e.tint || "#ff3333");
        ctx.restore();

        // 엘리트 표식 — 발밑 금색 링
        if (e.isElite && !e.isBoss) {
            ctx.strokeStyle = "rgba(255,204,51,0.8)"; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.ellipse(e.x, e.y, 13, 5, 0, 0, Math.PI * 2); ctx.stroke();
        }

        // HP바 — 보스는 크고 금테, 일반 몹은 작고 붉은 그대로
        const hpw = e.isBoss ? 60 : 24;
        const hpy = e.isBoss ? e.y - 52 : e.y - 40;
        ctx.fillStyle = "#000c"; ctx.fillRect(e.x - hpw/2 - 1, hpy - 1, hpw + 2, 6);
        ctx.fillStyle = "#3a0808"; ctx.fillRect(e.x - hpw/2, hpy, hpw, 4);
        const ehpRatio = Math.max(0, e.hp / e.maxHp);
        const ehpGrd = ctx.createLinearGradient(e.x - hpw/2, 0, e.x + hpw/2, 0);
        if (e.isBoss) { ehpGrd.addColorStop(0, "#ffe066"); ehpGrd.addColorStop(1, "#cc8800"); }
        else { ehpGrd.addColorStop(0, "#ff5050"); ehpGrd.addColorStop(1, "#cc1111"); }
        ctx.fillStyle = ehpGrd; ctx.fillRect(e.x - hpw/2, hpy, hpw * ehpRatio, 4);
        if (e.isBoss) { ctx.strokeStyle = "#ffcc33aa"; ctx.lineWidth = 1; ctx.strokeRect(e.x - hpw/2, hpy, hpw, 4); }
    });

    // (공격 판정 부채꼴 연출은 삭제 — 공격 모션이 있는데 반투명 부채꼴까지 겹치면
    //  화면이 지저분하고 도트 감성이 깨진다. 타격감은 파티클·화면흔들림으로만.)

    // 적 투사체 (보스 패턴 등)
    Game.eBullets.forEach(b => {
        if (!b.active) return;
        ctx.fillStyle = "#ff6633";
        ctx.shadowBlur = 6; ctx.shadowColor = "#ff6633";
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    });

    // 드롭 아이템 — 임시 플레이스홀더.
    // 도트 아이콘으로 교체 예정이므로 모양·색에 공들이지 않고, "무엇인지 읽히는지"만 신경 쓴다.
    // 흰 네모 + 이름표. 소멸 임박하면 깜빡여서 곧 사라진다는 걸 알림.
    Game.items.forEach(it => {
        if (!it.active) return;
        if (it.life < 90 && Math.floor(it.life / 6) % 2 === 0) return;
        // 아이템 — 예전엔 전부 똑같은 흰 네모라 뭘 줍는지 알 수 없었다.
        // 종류별 색 + 기호 아이콘으로 바꾸고, 이름 아래에 실제 상승치를 같이 띄운다.
        const style = ITEM_STYLE[it.type] || { label: "?", col: "#cccccc" };
        const bob = Math.sin((Game.frameCount + it.x) * 0.08) * 2;
        const col = it.equip ? equipColor(it.equip) : style.col;
        const label = it.equip ? equipDisplayName(it.equip) : (style.name || style.label);
        // 장비는 실제 옵션을, 소모품은 고정 상승치를 부제로
        let sub = style.gain || "";
        if (it.equip) {
            const e = it.equip;
            sub = e.kind === "weapon"
                ? [e.atk ? `공 +${e.atk}` : "", e.atkSpd ? `속 +${Math.round(e.atkSpd * 100)}%` : "", e.crit ? `치명 +${Math.round(e.crit * 100)}%` : ""].filter(Boolean).join("  ")
                : [e.def ? `방 +${e.def}` : "", e.maxHp ? `체력 +${e.maxHp}` : "", e.moveSpd ? `이속 +${Math.round(e.moveSpd * 100)}%` : ""].filter(Boolean).join("  ");
        }

        ctx.save();
        ctx.translate(it.x, it.y + bob);

        // 바닥 광원 — 어디에 떨어졌는지 눈에 띄게
        const gr = ctx.createRadialGradient(0, 4, 1, 0, 4, 16);
        gr.addColorStop(0, col + "55");
        gr.addColorStop(1, col + "00");
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.ellipse(0, 4, 16, 7, 0, 0, Math.PI * 2); ctx.fill();

        // 아이콘 — 마름모(장비는 한 겹 더 둘러 구분)
        ctx.shadowBlur = 8; ctx.shadowColor = col;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(0, -10); ctx.lineTo(9, 0); ctx.lineTo(0, 10); ctx.lineTo(-9, 0);
        ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(0,0,0,0.85)"; ctx.lineWidth = 2; ctx.stroke();
        if (it.equip) {
            ctx.strokeStyle = col; ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, -15); ctx.lineTo(13, 0); ctx.lineTo(0, 15); ctx.lineTo(-13, 0);
            ctx.closePath(); ctx.stroke();
        }
        // 기호
        ctx.font = "bold 11px SkullFont, NeoDunggeunmo, monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.fillText(style.label || "?", 0, 4);

        // 이름 + 상승치 — 배경 없이도 읽히게 외곽선 처리
        ctx.lineWidth = 3; ctx.strokeStyle = "rgba(0,0,0,0.9)";
        ctx.font = "bold 12px SkullFont, NeoDunggeunmo, monospace";
        ctx.strokeText(label, 0, -20);
        ctx.fillStyle = col;
        ctx.fillText(label, 0, -20);
        if (sub) {
            ctx.font = "bold 10px SkullFont, NeoDunggeunmo, monospace";
            ctx.lineWidth = 3; ctx.strokeStyle = "rgba(0,0,0,0.9)";
            ctx.strokeText(sub, 0, -8);
            ctx.fillStyle = "#e8e8f0";
            ctx.fillText(sub, 0, -8);
        }
        ctx.textAlign = "left";
        ctx.restore();
    });

    // 플레이어 그림자
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(Player.x, Player.y, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 플레이어 스프라이트 (애니 재생, 무적 중 깜빡임)
    // 전용 도트가 없는 직업은 sprites.js가 도적 원화로 대체하고, 여기서 넘긴 직업 색을 덧입혀 구분한다.
    // ⚠️ 예전엔 애니 스프라이트를 그린 뒤 정지 포즈(drawDirSpriteTinted)를 한 번 더 겹쳐 그려서
    //    두 자세가 겹쳐 보였다 — 반드시 한 번만 그릴 것.
    if (Player.invT <= 0 || Math.floor(Player.invT / 4) % 2 === 0) {
        drawAnimSprite(ctx, Game.pClass, Player.animName, Player.facing,
            Player.animFrame, Player.x, Player.y, classTint(Game.pClass));
    }

    // 플레이어 투사체 (마법사·발키리 평타, 일부 스킬)
    Game.pBullets.forEach(b => {
        if (!b.active) return;
        ctx.fillStyle = b.col;
        ctx.shadowBlur = 8; ctx.shadowColor = b.col;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    });

    // 스킬 범위 링 — 남은 수명에 따라 퍼지며 사라짐
    Game.skillFx.forEach(fx => {
        const t = 1 - fx.life / fx.max;
        ctx.save();
        ctx.globalAlpha = (1 - t) * 0.9;
        ctx.strokeStyle = fx.col; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(fx.x, fx.y, fx.r * (0.35 + t * 0.65), 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = (1 - t) * 0.18;
        ctx.fillStyle = fx.col;
        ctx.beginPath(); ctx.arc(fx.x, fx.y, fx.r * (0.35 + t * 0.65), 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    });

    // 파티클
    Game.parts.forEach(pt => {
        if (!pt.active) return;
        ctx.globalAlpha = Math.max(0, pt.life / pt.ml);
        ctx.fillStyle = pt.col;
        ctx.fillRect(pt.x - pt.size/2, pt.y - pt.size/2, pt.size, pt.size);
        ctx.globalAlpha = 1;
    });

    // 플로팅 텍스트 (데미지 숫자 등) — SkullFont 적용 + 검은 외곽선으로 배경과 분리
    Game.texts.forEach(t => {
        if (!t.active) return;
        ctx.font = `bold ${t.size}px SkullFont, NeoDunggeunmo, monospace`;
        ctx.textAlign = "center";
        ctx.lineWidth = 3; ctx.strokeStyle = "rgba(0,0,0,0.85)";
        ctx.strokeText(t.text, t.x, t.y);
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, t.x, t.y);
        ctx.textAlign = "left";
    });

    ctx.restore();

    // ── 화면 흔들림 ──
    if (Game.camShake > 0) Game.camShake--;

    // 여기서부터는 HUD — UI 스케일 좌표계(UW×UH)로 전환한다.
    // 1:1로 그리면 1280×720 화면에서 패널·글씨가 잘아 보여서 UI만 통째로 확대한다.
    uiBegin();

    // ── 플레이어 HUD 패널 (화면 고정) ──
    // 게이지 폭·높이와 글씨를 전반적으로 키우고, 수치는 외곽선을 넣어 배경과 무조건 분리.
    const HX = 18, HY = 16, HW = 300;
    const hasShield = (Game.pShield || 0) > 0;
    const BAR_H = 26, ST_H = 16, SH_H = 14, SK_H = 16;
    const STAT_H = 18; // 공/방/치명/속도 한 줄 — 아이템을 주웠을 때 뭐가 올랐는지 확인할 수 있어야 함
    const HH = 12 + BAR_H + 8 + ST_H + 8 + SK_H + (hasShield ? 8 + SH_H : 0) + 8 + STAT_H + 10;
    ctx.save();
    ctx.fillStyle = "rgba(10,8,18,0.80)";
    ctx.fillRect(HX, HY, HW, HH);
    ctx.strokeStyle = "#7a4fc9"; ctx.lineWidth = 2;
    ctx.shadowBlur = 8; ctx.shadowColor = "#7a4fc9aa";
    ctx.strokeRect(HX, HY, HW, HH);
    ctx.shadowBlur = 0;

    const barX = HX + 12, barW = HW - 24;
    let by = HY + 12;

    // 수치 텍스트를 게이지 위에 얹을 때 쓰는 공통 처리 (외곽선 → 채움)
    const gaugeLabel = (txt, x, y, size, col) => {
        ctx.font = `bold ${size}px SkullFont, NeoDunggeunmo, monospace`;
        ctx.textAlign = "left";
        ctx.lineWidth = 3; ctx.strokeStyle = "rgba(0,0,0,0.9)";
        ctx.strokeText(txt, x, y);
        ctx.fillStyle = col; ctx.fillText(txt, x, y);
    };

    // HP 바 — 가장 크게. 30% 이하면 테두리가 붉게 깜빡여 위험을 알림.
    const hpRatio = Math.max(0, Player.hp / Player.maxHp);
    ctx.fillStyle = "#1a0808"; ctx.fillRect(barX, by, barW, BAR_H);
    const hpGrd = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    hpGrd.addColorStop(0, "#ff6a4d"); hpGrd.addColorStop(1, "#c81e1e");
    ctx.fillStyle = hpGrd; ctx.fillRect(barX, by, barW * hpRatio, BAR_H);
    const lowHp = hpRatio <= 0.3;
    ctx.strokeStyle = lowHp && Math.floor(Game.frameCount / 10) % 2 === 0 ? "#ff5566" : "#00000090";
    ctx.lineWidth = 2; ctx.strokeRect(barX, by, barW, BAR_H);
    gaugeLabel(`HP  ${Math.max(0, Math.ceil(Player.hp))} / ${Player.maxHp}`, barX + 8, by + 18, 17, "#fff2ec");
    by += BAR_H + 8;

    // 스태미나 바 (회피 소모) — 회피 가능 여부가 한눈에 보이게 부족하면 어둡게
    const stRatio = Player.stamina / STAMINA_MAX;
    const dashCost = STAMINA_DASH * (Game.pDashCostMul || 1);
    const canDash = Player.stamina >= dashCost;
    ctx.fillStyle = "#1a1408"; ctx.fillRect(barX, by, barW, ST_H);
    const stGrd = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    if (!canDash) { stGrd.addColorStop(0, "#8a6a1a"); stGrd.addColorStop(1, "#5a4408"); }
    else { stGrd.addColorStop(0, "#ffe066"); stGrd.addColorStop(1, "#e8a020"); }
    ctx.fillStyle = stGrd; ctx.fillRect(barX, by, barW * stRatio, ST_H);
    // 회피 1회분 지점에 눈금 — 언제 회피가 되는지 판단 가능
    const dashMark = barX + barW * (dashCost / STAMINA_MAX);
    ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(dashMark, by); ctx.lineTo(dashMark, by + ST_H); ctx.stroke();
    ctx.strokeStyle = "#00000090"; ctx.lineWidth = 2; ctx.strokeRect(barX, by, barW, ST_H);
    gaugeLabel(`기력  ${Math.round(Player.stamina)}`, barX + 8, by + 12.5, 13, canDash ? "#fff8dc" : "#b9a06a");
    by += ST_H + 8;

    // 스킬 게이지 — 쿨다운이 차오르는 걸 보여주고, 준비되면 직업 색으로 빛남
    const prof = classProfile(Game.pClass);
    const skReady = Player.skillCD <= 0;
    const skRatio = skReady ? 1 : 1 - Player.skillCD / (Player.skillCDMax || prof.skillCD || 300);
    const skCol = prof.tint || "#cc44ff";
    ctx.fillStyle = "#150c22"; ctx.fillRect(barX, by, barW, SK_H);
    const skGrd = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    if (skReady) { skGrd.addColorStop(0, skCol); skGrd.addColorStop(1, "#ffffff"); }
    else { skGrd.addColorStop(0, "#4a3a6a"); skGrd.addColorStop(1, "#6a4f9a"); }
    ctx.fillStyle = skGrd; ctx.fillRect(barX, by, barW * skRatio, SK_H);
    if (skReady && Math.floor(Game.frameCount / 14) % 2 === 0) {
        ctx.strokeStyle = skCol; ctx.lineWidth = 2;
    } else { ctx.strokeStyle = "#00000090"; ctx.lineWidth = 2; }
    ctx.strokeRect(barX, by, barW, SK_H);
    gaugeLabel(
        skReady ? `[Shift] ${classSkill(Game.pClass).name}` : `${Math.ceil(Player.skillCD / 60)}초`,
        barX + 8, by + 12.5, 12, skReady ? "#ffffff" : "#9a8cc0"
    );
    by += SK_H + 8;

    // 보호막 바 (유물 "불굴의 방벽" 보유 시에만)
    if (hasShield) {
        ctx.fillStyle = "#0a1622"; ctx.fillRect(barX, by, barW, SH_H);
        const shRatio = Math.min(1, Game.pShield / 60);
        const shGrd = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        shGrd.addColorStop(0, "#8fd6ff"); shGrd.addColorStop(1, "#3a8fd0");
        ctx.fillStyle = shGrd; ctx.fillRect(barX, by, barW * shRatio, SH_H);
        ctx.strokeStyle = "#00000090"; ctx.lineWidth = 2; ctx.strokeRect(barX, by, barW, SH_H);
        gaugeLabel(`방벽  ${Math.round(Game.pShield)}`, barX + 8, by + 11.5, 12, "#dff2ff");
        by += SH_H + 8;
    }

    // ── 스탯 한 줄 (공격력 / 방어력 / 치명타 / 이동속도) ──
    // 드롭 아이템으로 오르는 수치가 어디에도 안 보여서 "뭘 주운 건지 모르겠다"는 문제가 있었다.
    {
        const prof = classProfile(Game.pClass);
        const atkLo = prof.dmgMin + (Game.pAtkBonus || 0) + equipAtk();
        const atkHi = prof.dmgMax + (Game.pAtkBonus || 0) + equipAtk();
        const def   = (Game.pDefBonus || 0) + equipDef();
        const crit  = Math.round((prof.crit + (Game.pCritBonus || 0) + equipCrit()) * 100);
        const spd   = Math.round((1 + (Game.pMoveSpdBonus || 0) + equipMoveSpd()) * 100);
        const cells = [
            ["공", `${atkLo}~${atkHi}`, "#ff8877"],
            ["방", `${def}`,            "#7fc4ff"],
            ["치명", `${crit}%`,        "#ff9ad5"],
            ["이속", `${spd}%`,         "#7ff0e6"],
        ];
        let cx2 = barX;
        cells.forEach(([lab, val, c]) => {
            ctx.font = "bold 11px SkullFont, NeoDunggeunmo, monospace";
            ctx.textAlign = "left";
            ctx.lineWidth = 3; ctx.strokeStyle = "rgba(0,0,0,0.9)";
            ctx.strokeText(lab, cx2, by + 13);
            ctx.fillStyle = "#8e83ad"; ctx.fillText(lab, cx2, by + 13);
            const lw = ctx.measureText(lab).width + 4;
            ctx.font = "bold 13px SkullFont, NeoDunggeunmo, monospace";
            ctx.lineWidth = 3; ctx.strokeStyle = "rgba(0,0,0,0.9)";
            ctx.strokeText(val, cx2 + lw, by + 13);
            ctx.fillStyle = c; ctx.fillText(val, cx2 + lw, by + 13);
            cx2 += lw + ctx.measureText(val).width + 14;
        });
    }
    ctx.restore();

    // ── 히트 콤보 (화면 중앙 하단, 크게) ──
    // 표시 기준은 "실제로 맞힌 횟수"(Game.hitCombo)다. Player.combo는 허공을 쳐도 올라가는
    // 4타 스윙 순번이라 콤보로 띄우면 안 됨 — 대신 피니시 스윙일 때만 문구를 강조한다.
    const hc = Game.hitCombo || 0;
    if (hc >= 2) {
        ctx.save();
        ctx.textAlign = "center";
        const finisher = Player.combo === COMBO_MAX && Player.atkAnim > 0;
        const big = hc >= 10 || finisher;
        ctx.font = `bold ${big ? 34 : 26}px SkullFont, NeoDunggeunmo, monospace`;
        ctx.lineWidth = 5; ctx.strokeStyle = "rgba(0,0,0,0.9)";
        const txt = finisher ? `${hc} 히트  피니시!` : `${hc} 히트`;
        ctx.strokeText(txt, UW / 2, UH - 78);
        ctx.fillStyle = finisher ? "#ff8a3a" : (hc >= 10 ? "#ffdd55" : "#ffcc44");
        ctx.shadowBlur = big ? 16 : 8; ctx.shadowColor = finisher ? "#ff5500" : "#aa6600";
        ctx.fillText(txt, UW / 2, UH - 78);
        ctx.shadowBlur = 0;
        ctx.textAlign = "left";
        ctx.restore();
    }

    // ── 장비 슬롯 + 유물 개수 (HP 패널 바로 아래) ──
    ctx.save();
    ctx.textAlign = "left";
    const infoRow = (label, value, valCol, y) => {
        ctx.font = "13px SkullFont, NeoDunggeunmo, monospace";
        ctx.lineWidth = 3; ctx.strokeStyle = "rgba(0,0,0,0.85)";
        ctx.strokeText(label, HX + 4, y);
        ctx.fillStyle = "#9a8cc0"; ctx.fillText(label, HX + 4, y);
        ctx.font = "bold 13px SkullFont, NeoDunggeunmo, monospace";
        ctx.strokeText(value, HX + 66, y);
        ctx.fillStyle = valCol; ctx.fillText(value, HX + 66, y);
    };
    let iy = HY + HH + 20;
    infoRow("무기", Game.equip.weapon ? equipDisplayName(Game.equip.weapon) : "— 없음 —",
        Game.equip.weapon ? equipColor(Game.equip.weapon) : "#5a5372", iy); iy += 19;
    infoRow("방어구", Game.equip.armor ? equipDisplayName(Game.equip.armor) : "— 없음 —",
        Game.equip.armor ? equipColor(Game.equip.armor) : "#5a5372", iy); iy += 19;
    if (Game.relics.length > 0) {
        infoRow("유물", `${Game.relics.length}개  [ESC]`, "#ffcc44", iy);
    }
    ctx.restore();

    // ── 스테이지/라운드 표시 (화면 우측 상단) ──
    const theme = stageTheme();
    const bossRound = isBossRound(Game.roundN);
    ctx.save();
    ctx.textAlign = "right";
    const rightX = UW - 18;
    const outlined = (txt, y, size, col, glow) => {
        ctx.font = `bold ${size}px SkullFont, NeoDunggeunmo, monospace`;
        ctx.lineWidth = 4; ctx.strokeStyle = "rgba(0,0,0,0.88)";
        ctx.strokeText(txt, rightX, y);
        if (glow) { ctx.shadowBlur = glow; ctx.shadowColor = col; }
        ctx.fillStyle = col; ctx.fillText(txt, rightX, y);
        ctx.shadowBlur = 0;
    };
    outlined(
        `STAGE ${Game.stageN}-${Game.roundN}  ${theme.name}${bossRound ? "  [ BOSS ]" : ""}`,
        34, 20, bossRound ? "#ff5555" : theme.palette.accent, 6
    );
    outlined(`진행 ${globalRound(Game.stageN, Game.roundN)} / ${STAGE_COUNT * ROUNDS_PER_STAGE}`,
        56, 14, "#b3a6d4");
    outlined(`점수 ${Game.score}   킬 ${Game.kills}   쿼츠 ${Game.darkQuartz}`,
        76, 14, "#b3a6d4");
    ctx.restore();

    // ── 방 입장 배너 ──
    if (Game.bannerT > 0) {
        const a = Math.min(1, Game.bannerT / 30);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(8,5,14,0.80)";
        ctx.fillRect(UW / 2 - 300, 96, 600, 64);
        ctx.strokeStyle = theme.palette.accent; ctx.lineWidth = 2;
        ctx.strokeRect(UW / 2 - 300, 96, 600, 64);
        ctx.font = "bold 26px SkullFont, NeoDunggeunmo, monospace";
        ctx.lineWidth = 4; ctx.strokeStyle = "rgba(0,0,0,0.9)";
        ctx.strokeText(Game.bannerText || "", UW / 2, 128);
        ctx.fillStyle = theme.palette.accent;
        ctx.shadowBlur = 10; ctx.shadowColor = theme.palette.accent;
        ctx.fillText(Game.bannerText || "", UW / 2, 128);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#a396c4";
        ctx.font = "13px SkullFont, NeoDunggeunmo, monospace";
        ctx.fillText(theme.subtitle, UW / 2, 149);
        ctx.textAlign = "left";
        ctx.restore();
    }

    // ── 문이 열렸을 때 안내 ──
    // 사망/승리/일시정지 오버레이는 ui.js가 별도로 그린다 (여기서는 월드 + 플레이 HUD만 담당)
    if (Game.doors.length > 0 && Game.doors[0].open && Game.gs === "play" && !Player.dead) {
        const blink = Math.floor(Game.frameCount / 24) % 2 === 0;
        if (blink) {
            ctx.save();
            ctx.textAlign = "center";
            ctx.font = "bold 20px SkullFont, NeoDunggeunmo, monospace";
            ctx.lineWidth = 4; ctx.strokeStyle = "rgba(0,0,0,0.9)";
            ctx.strokeText("적을 모두 쓰러뜨렸다 — 동쪽 문이 열렸다", UW / 2, UH - 30);
            ctx.fillStyle = "#3cdc78";
            ctx.shadowBlur = 10; ctx.shadowColor = "#3cdc78";
            ctx.fillText("적을 모두 쓰러뜨렸다 — 동쪽 문이 열렸다", UW / 2, UH - 30);
            ctx.shadowBlur = 0;
            ctx.restore();
        }
    }

    uiEnd(); // 화면 좌표계로 복귀 — 이후 ui.js가 자기 스케일을 다시 건다
}
