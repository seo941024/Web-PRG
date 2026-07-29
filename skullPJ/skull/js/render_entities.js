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
            ctx.strokeStyle = "rgba(255,60,60,0.7)"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(e.x, e.y - 14, 14, 0, Math.PI * 2 * (1 - e.warnT / 24)); ctx.stroke();
        }

        ctx.save();
        if (e.flash > 0) ctx.filter = "brightness(2) saturate(0)";
        drawDirSpriteTinted(ctx, Game.pClass, e.facing, e.x, e.y, "#ff3333");
        ctx.restore();

        // HP바
        const hpw = 24;
        ctx.fillStyle = "#000a"; ctx.fillRect(e.x - hpw/2, e.y - 40, hpw, 4);
        ctx.fillStyle = "#e33"; ctx.fillRect(e.x - hpw/2, e.y - 40, hpw * Math.max(0, e.hp / e.maxHp), 4);
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

    // 플레이어 HP HUD (화면 고정)
    ctx.fillStyle = "#000a"; ctx.fillRect(14, 14, 160, 16);
    ctx.fillStyle = "#e33"; ctx.fillRect(14, 14, 160 * Math.max(0, Player.hp / Player.maxHp), 16);
    ctx.strokeStyle = "#fff5"; ctx.strokeRect(14, 14, 160, 16);
    ctx.fillStyle = "#fff"; ctx.font = "11px monospace";
    ctx.fillText(`HP ${Math.max(0, Player.hp)}/${Player.maxHp}`, 20, 26);

    // 스태미나 바 (회피 소모)
    ctx.fillStyle = "#000a"; ctx.fillRect(14, 34, 160, 8);
    ctx.fillStyle = Player.stamina < STAMINA_DASH ? "#886600" : "#ffcc33";
    ctx.fillRect(14, 34, 160 * (Player.stamina / STAMINA_MAX), 8);
    ctx.strokeStyle = "#fff3"; ctx.strokeRect(14, 34, 160, 8);

    if (Player.dead) {
        ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(0, 0, CW, CH);
        ctx.fillStyle = "#f55"; ctx.font = "bold 28px monospace"; ctx.textAlign = "center";
        ctx.fillText("YOU DIED", CW/2, CH/2);
        ctx.textAlign = "left";
    }
}
