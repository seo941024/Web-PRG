// ==========================================
// 렌더링 메인 컨트롤러 (Render Controller)
// 모든 렌더링 모듈을 레이어 순서에 따라 호출
// render_stage.js → render_ui.js → render.js(controller)
// ==========================================

function render() {
    ctx.imageSmoothingEnabled = false;
    const frameNow = Date.now();
    const isEven   = Game.worldN % 2 === 0;

    // ── Layer 0: 배경 ──────────────────────
    const tColors = drawBackground(frameNow); // render_stage.js

    // ── Layer 1: 월드 공간 (카메라 쉐이크 적용) ──
    ctx.save();
    if (Game.camShake > 0) {
        ctx.translate(
            (Math.random() - 0.5) * Game.camShake,
            (Math.random() - 0.5) * Game.camShake
        );
    }

    // 짝수 월드 어두운 오버레이
    if (isEven) {
        ctx.fillStyle = "rgba(15, 10, 25, 0.5)";
        ctx.fillRect(-Game.camX, 0, Game.levelW, CH);
    }

    drawEnvironment(tColors, frameNow); // 발판 + 함정 + 이벤트 오브젝트 (render_stage.js)
    drawEntities(frameNow);             // 적 + 투사체 + 파티클 (render_stage.js)

    ctx.restore();

    // ── Layer 2: HUD / UI (카메라와 독립) ──
    drawUI(); // render_ui.js

    // ── Layer 3: 보스 등장 컷신 오버레이 ──
    if (Game.gs === "boss_intro") {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, CW, 70);
        ctx.fillRect(0, CH - 70, CW, 70);
        ctx.fillStyle = "#ff0033";
        ctx.font = "bold 40px NeoDunggeunmo";
        ctx.textAlign = "center";
        ctx.shadowBlur = 20; ctx.shadowColor = "#ff0033";
        const bossName = document.getElementById("bossBarLabel")?.textContent || "";
        ctx.fillText(bossName, CW / 2, CH / 2);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fff";
        ctx.font = "18px NeoDunggeunmo";
        if (Math.floor(frameNow / 250) % 2 === 0) {
            ctx.fillText("▶ WARNING ◀", CW / 2, CH / 2 - 48);
        }
        ctx.textAlign = "left";
    }

    // ── Layer 4: 화면 전환 페이드 ──────────
    if (Game.transT > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${Game.transT / 255})`;
        ctx.fillRect(0, 0, CW, CH);
    }

    // ── Layer 5: 슬로모션 WITCH TIME 비네트 ──
    if (Game.justDodgeActive) {
        const jda = 0.15 + Math.sin(frameNow * 0.008) * 0.05;
        ctx.strokeStyle = `rgba(255, 230, 0, ${jda * 3})`;
        ctx.lineWidth = 8; ctx.strokeRect(4, 4, CW - 8, CH - 8);
        // 흑백 비네트
        const bwGrd = ctx.createRadialGradient(CW/2, CH/2, CH*0.2, CW/2, CH/2, CW*0.7);
        bwGrd.addColorStop(0, "rgba(0,0,0,0)");
        bwGrd.addColorStop(1, `rgba(0,0,0,${jda})`);
        ctx.fillStyle = bwGrd;
        ctx.fillRect(0, 0, CW, CH);
    }
}