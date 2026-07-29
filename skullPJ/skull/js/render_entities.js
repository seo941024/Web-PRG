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

    // 바닥 격자
    const G = 32, ROOM = 1100;
    ctx.fillStyle = "#1b1b26";
    ctx.fillRect(0, 0, ROOM, ROOM);
    ctx.strokeStyle = "#24243250"; ctx.lineWidth = 1;
    for (let gx = 0; gx <= ROOM; gx += G) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, ROOM); ctx.stroke(); }
    for (let gy = 0; gy <= ROOM; gy += G) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(ROOM, gy); ctx.stroke(); }

    // 벽
    for (const w of walls) {
        ctx.fillStyle = "#33333f"; ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.fillStyle = "#44445260"; ctx.fillRect(w.x, w.y, w.w, 4);
    }

    // 문 — 닫힘(잠김, 붉은빛)/열림(초록빛) 상태를 벽 위에 덧칠해 구분
    (Game.doors || []).forEach(d => {
        ctx.fillStyle = d.open ? "rgba(60,220,120,0.35)" : "rgba(220,60,60,0.35)";
        ctx.fillRect(d.x, d.y, d.w, d.h);
        ctx.strokeStyle = d.open ? "#3cdc78" : "#dc3c3c"; ctx.lineWidth = 2;
        ctx.strokeRect(d.x, d.y, d.w, d.h);
    });

    // 대시 잔상
    for (const g of dashGhosts) {
        ctx.globalAlpha = (g.life / g.max) * 0.45;
        drawDirSprite(ctx, Game.pClass, g.facing, g.x, g.y);
        ctx.globalAlpha = 1;
    }

    // 적 (그림자 + 틴트 스프라이트 + HP바 + 공격 예고)
    Game.enemies.forEach(e => {
        if (!e.active || e.dead) return;
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.beginPath(); ctx.ellipse(e.x, e.y, 10, 4, 0, 0, Math.PI * 2); ctx.fill();

        if (e.state === "windup") {
            const warnBase = e._warnBase || 24;
            ctx.strokeStyle = e.isBoss ? "rgba(255,200,60,0.85)" : "rgba(255,60,60,0.7)";
            ctx.lineWidth = e.isBoss ? 3 : 2;
            const ringR = e.isBoss ? 22 : 14;
            ctx.beginPath(); ctx.arc(e.x, e.y - (e.isBoss ? 18 : 14), ringR, 0, Math.PI * 2 * (1 - e.warnT / warnBase)); ctx.stroke();
        }

        ctx.save();
        if (e.flash > 0) ctx.filter = "brightness(2) saturate(0)";
        drawDirSpriteTinted(ctx, Game.pClass, e.facing, e.x, e.y, e.isBoss ? "#ffcc33" : "#ff3333");
        ctx.restore();

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

    // 플레이어 공격 스윙 이펙트 — 몸통 높이 기준 채워진 부채꼴 (판정 각도 60도와 정확히 일치)
    if (Player.atkAnim > 0) {
        const prof = classProfile(Game.pClass);
        const [dx, dy] = DIR_VEC[Player.facing];
        const baseAng = Math.atan2(dy, dx);
        const t = 1 - Player.atkAnim / (Player.atkAnimMax || 1); // 0→1, 실제 재생 중인 애니 길이와 동기화
        const spreadRad = 60 * Math.PI / 180;
        const apexOff = 16; // 몸 중앙이 아니라 몸 밖으로 나가서 시작 (안 그러면 캐릭터 위에 겹쳐 보임)
        ctx.save();
        ctx.translate(Player.x + dx * apexOff, Player.y - 20 + dy * apexOff);
        ctx.fillStyle = `rgba(220,240,255,${0.5 * (1 - t)})`;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, prof.range, baseAng - spreadRad, baseAng + spreadRad);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - t)})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }

    // 적 투사체 (보스 패턴 등)
    Game.eBullets.forEach(b => {
        if (!b.active) return;
        ctx.fillStyle = "#ff6633";
        ctx.shadowBlur = 6; ctx.shadowColor = "#ff6633";
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    });

    // 드롭 아이템 — 종류별 색 원 + 살짝 둥둥 뜨는 느낌, 만료 임박하면 깜빡임
    Game.items.forEach(it => {
        if (!it.active) return;
        const style = ITEM_STYLE[it.type] || { col: "#ffffff", label: "?" };
        const bob = Math.sin((Game.frameCount + it.x) * 0.08) * 2;
        if (it.life < 90 && Math.floor(it.life / 6) % 2 === 0) return; // 소멸 임박 깜빡임
        ctx.save();
        ctx.translate(it.x, it.y + bob);
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath(); ctx.ellipse(0, 8, 7, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = style.col;
        ctx.shadowBlur = 8; ctx.shadowColor = style.col;
        ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#000";
        ctx.font = "bold 9px monospace"; ctx.textAlign = "center";
        ctx.fillText(style.label, 0, 3);
        ctx.textAlign = "left";
        ctx.restore();
    });

    // 플레이어 그림자
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(Player.x, Player.y, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 플레이어 스프라이트 (idle/walk 애니 재생, 무적 중 깜빡임)
    if (Player.invT <= 0 || Math.floor(Player.invT / 4) % 2 === 0) {
        drawAnimSprite(ctx, Game.pClass, Player.animName, Player.facing, Player.animFrame, Player.x, Player.y);
    }

    // 파티클
    Game.parts.forEach(pt => {
        if (!pt.active) return;
        ctx.globalAlpha = Math.max(0, pt.life / pt.ml);
        ctx.fillStyle = pt.col;
        ctx.fillRect(pt.x - pt.size/2, pt.y - pt.size/2, pt.size, pt.size);
        ctx.globalAlpha = 1;
    });

    // 플로팅 텍스트
    Game.texts.forEach(t => {
        if (!t.active) return;
        ctx.fillStyle = t.color; ctx.font = `bold ${t.size}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(t.text, t.x, t.y);
        ctx.textAlign = "left";
    });

    ctx.restore();

    // ── 화면 흔들림 ──
    if (Game.camShake > 0) Game.camShake--;

    // ── 플레이어 HUD 패널 (화면 고정) ──
    const HX = 14, HY = 12, HW = 176, HH = 54;
    ctx.save();
    ctx.fillStyle = "rgba(10,8,18,0.72)";
    ctx.fillRect(HX, HY, HW, HH);
    ctx.strokeStyle = "#5a3a8a"; ctx.lineWidth = 1.5;
    ctx.shadowBlur = 6; ctx.shadowColor = "#7a4fc9aa";
    ctx.strokeRect(HX, HY, HW, HH);
    ctx.shadowBlur = 0;

    // HP 바
    const barX = HX + 10, barW = HW - 20;
    const hpRatio = Math.max(0, Player.hp / Player.maxHp);
    ctx.fillStyle = "#1a0808"; ctx.fillRect(barX, HY + 8, barW, 14);
    const hpGrd = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    hpGrd.addColorStop(0, "#ff6a4d"); hpGrd.addColorStop(1, "#c81e1e");
    ctx.fillStyle = hpGrd; ctx.fillRect(barX, HY + 8, barW * hpRatio, 14);
    ctx.strokeStyle = "#00000080"; ctx.strokeRect(barX, HY + 8, barW, 14);
    ctx.fillStyle = "#ffe8e0"; ctx.font = "bold 10px SkullFont, NeoDunggeunmo, monospace";
    ctx.textAlign = "left"; ctx.shadowBlur = 3; ctx.shadowColor = "#000";
    ctx.fillText(`HP ${Math.max(0, Math.ceil(Player.hp))}/${Player.maxHp}`, barX + 4, HY + 18.5);
    ctx.shadowBlur = 0;

    // 스태미나 바 (회피 소모)
    const stRatio = Player.stamina / STAMINA_MAX;
    ctx.fillStyle = "#1a1408"; ctx.fillRect(barX, HY + 26, barW, 9);
    const stGrd = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    if (Player.stamina < STAMINA_DASH) { stGrd.addColorStop(0, "#8a6a1a"); stGrd.addColorStop(1, "#5a4408"); }
    else { stGrd.addColorStop(0, "#ffe066"); stGrd.addColorStop(1, "#e8a020"); }
    ctx.fillStyle = stGrd; ctx.fillRect(barX, HY + 26, barW * stRatio, 9);
    ctx.strokeStyle = "#00000080"; ctx.strokeRect(barX, HY + 26, barW, 9);

    // 콤보 표시
    if (Player.combo > 0 && (Player.atkAnim > 0 || Player.comboWindowT > 0)) {
        ctx.fillStyle = "#ffcc44"; ctx.font = "bold 11px SkullFont, NeoDunggeunmo, monospace";
        ctx.textAlign = "left"; ctx.shadowBlur = 4; ctx.shadowColor = "#aa6600";
        ctx.fillText(`콤보 ${Player.combo}/${COMBO_MAX}`, barX, HY + 46);
        ctx.shadowBlur = 0;
    }
    ctx.restore();

    // ── 월드/레벨 표시 (화면 우측 상단) ──
    ctx.save();
    ctx.textAlign = "right";
    const isBossLv = Game.levelN >= 3;
    ctx.fillStyle = isBossLv ? "#ff5555" : "#cbb8ee";
    ctx.font = "bold 13px SkullFont, NeoDunggeunmo, monospace";
    ctx.shadowBlur = 4; ctx.shadowColor = isBossLv ? "#ff2222" : "#7a4fc9";
    ctx.fillText(`WORLD ${Game.worldN} - ${Game.levelN}${isBossLv ? "  [ BOSS ]" : ""}`, CW - 14, 24);
    ctx.shadowBlur = 0;
    ctx.font = "11px SkullFont, NeoDunggeunmo, monospace";
    ctx.fillStyle = "#9a8cc0";
    ctx.fillText(`점수 ${Game.score}   킬 ${Game.kills}   다크 쿼츠 ${Game.darkQuartz}`, CW - 14, 40);
    ctx.restore();

    if (Player.dead) {
        ctx.fillStyle = "rgba(5,0,10,0.7)"; ctx.fillRect(0, 0, CW, CH);
        ctx.textAlign = "center";
        ctx.fillStyle = "#ff3344"; ctx.font = "bold 40px SkullFont, NeoDunggeunmo, monospace";
        ctx.shadowBlur = 18; ctx.shadowColor = "#ff0000";
        ctx.fillText("당신은 죽었습니다", CW/2, CH/2);
        ctx.shadowBlur = 0;
        ctx.textAlign = "left";
    }
}
