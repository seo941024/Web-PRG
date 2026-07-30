// ui.js — 전체 화면 UI (메뉴 / 일시정지 / 사망 / 유물 선택 / 상점) + 미니맵
// 월드 렌더는 render_entities.js가 담당하고, 여기서는 화면 좌표(setTransform 초기화 상태) 기준으로만 그린다.

// ── 공통 헬퍼 ──────────────────────────────────────────────
function _uiPanel(x, y, w, h, accent) {
    ctx.fillStyle = "rgba(10,7,16,0.88)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = accent || "#5a3a8a";
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 10; ctx.shadowColor = (accent || "#7a4fc9") + "aa";
    ctx.strokeRect(x, y, w, h);
    ctx.shadowBlur = 0;
}
function _uiText(txt, x, y, size, col, align, bold, glow) {
    ctx.fillStyle = col;
    ctx.font = `${bold ? "bold " : ""}${size}px SkullFont, NeoDunggeunmo, monospace`;
    ctx.textAlign = align || "left";
    if (glow) { ctx.shadowBlur = glow; ctx.shadowColor = col; }
    ctx.fillText(txt, x, y);
    ctx.shadowBlur = 0;
    ctx.textAlign = "left";
}

// ── 메인 메뉴 ──────────────────────────────────────────────
let _menuBgImg = null;

function updateMenu() {
    if (pr("Space", "Enter", "KeyC")) {
        if (typeof playSfx === 'function') playSfx('menu_select');
        startCutscene("opening");
    }
    if (pr("KeyS")) { if (typeof playSfx === 'function') playSfx('menu_select'); openShop(); }
    if (pr("KeyM")) { Game.isMuted = !Game.isMuted; if (Game.isMuted && typeof stopBGM === 'function') stopBGM(); else if (typeof playBGM === 'function') playBGM('lobby'); }
}

function renderMenu() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#05030a";
    ctx.fillRect(0, 0, CW, CH);

    // 타이틀 배경 일러스트
    if (!_menuBgImg) { _menuBgImg = new Image(); _menuBgImg.src = "scene_main.png"; }
    if (_menuBgImg.complete && _menuBgImg.naturalWidth > 0) {
        const sc = Math.max(CW / _menuBgImg.naturalWidth, CH / _menuBgImg.naturalHeight);
        const dw = _menuBgImg.naturalWidth * sc, dh = _menuBgImg.naturalHeight * sc;
        ctx.save();
        ctx.globalAlpha = 0.62;
        ctx.drawImage(_menuBgImg, (CW - dw) / 2, (CH - dh) / 2, dw, dh);
        ctx.restore();
        const grd = ctx.createLinearGradient(0, 0, 0, CH);
        grd.addColorStop(0, "rgba(5,3,10,0.55)");
        grd.addColorStop(1, "rgba(5,3,10,0.92)");
        ctx.fillStyle = grd; ctx.fillRect(0, 0, CW, CH);
    }

    const pulse = 0.8 + Math.sin(Game.frameCount * 0.05) * 0.2;
    ctx.save();
    ctx.shadowBlur = 26 * pulse; ctx.shadowColor = "#ff2200";
    _uiText("해골용사", CW / 2, CH * 0.36, 62, "#fff8e7", "center", true);
    ctx.shadowBlur = 0;
    ctx.restore();
    _uiText("SKULL YUUSHA — 탑다운", CW / 2, CH * 0.36 + 32, 14, "#9a8cc0", "center");

    // 시작 안내 (깜빡임)
    if (Math.floor(Game.frameCount / 26) % 2 === 0) {
        _uiText("▶  SPACE  게임 시작  ◀", CW / 2, CH * 0.60, 20, "#ffcc44", "center", true, 10);
    }
    _uiText(`[S] 영구 강화        [M] 음소거 ${Game.isMuted ? "ON" : "OFF"}`, CW / 2, CH * 0.60 + 34, 13, "#8e83ad", "center");
    _uiText(`보유 다크 쿼츠: ${Game.darkQuartz}`, CW / 2, CH * 0.60 + 58, 13, "#dd88ff", "center");

    _uiText("이동 방향키/WASD   ·   스프린트 Z   ·   회피 Space   ·   공격 C   ·   일시정지 ESC",
        CW / 2, CH - 26, 12, "#6e6390", "center");
}

// ── 유물 선택 (보스 격파 후 3택 1) ─────────────────────────
function renderRelicSelect() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "rgba(4,2,10,0.9)";
    ctx.fillRect(0, 0, CW, CH);

    _uiText("유물을 하나 선택하라", CW / 2, 96, 30, "#ffcc44", "center", true, 14);
    _uiText("이번 런에만 유지된다", CW / 2, 124, 13, "#8e83ad", "center");

    const cards = Game.relicChoices;
    const cw = 260, ch = 300, gap = 34;
    const totalW = cards.length * cw + (cards.length - 1) * gap;
    const sx = (CW - totalW) / 2, sy = 180;

    cards.forEach((r, i) => {
        const rar = RELIC_RARITY[r.rarity];
        const x = sx + i * (cw + gap);
        const sel = i === Game.relicIdx;
        // 선택된 카드는 살짝 떠오르고 테두리가 밝아짐
        const y = sy - (sel ? 12 : 0);

        ctx.save();
        if (sel) { ctx.shadowBlur = 22; ctx.shadowColor = rar.color; }
        ctx.fillStyle = sel ? "rgba(24,16,38,0.96)" : "rgba(12,8,20,0.9)";
        ctx.fillRect(x, y, cw, ch);
        ctx.strokeStyle = rar.color;
        ctx.lineWidth = sel ? 3 : 1.5;
        ctx.strokeRect(x, y, cw, ch);
        ctx.shadowBlur = 0;
        ctx.restore();

        // 희귀도 띠
        ctx.fillStyle = rar.color;
        ctx.globalAlpha = sel ? 0.28 : 0.16;
        ctx.fillRect(x, y, cw, 40);
        ctx.globalAlpha = 1;
        _uiText(rar.name, x + cw / 2, y + 26, 14, rar.color, "center", true);

        _uiText(r.name, x + cw / 2, y + 86, 21, "#ffffff", "center", true, sel ? 8 : 0);

        // 설명 — 카드 폭에 맞춰 줄바꿈
        ctx.font = "14px SkullFont, NeoDunggeunmo, monospace";
        ctx.fillStyle = "#c3b9dd";
        ctx.textAlign = "center";
        const words = r.desc.split(" ");
        let line = "", ly = y + 130;
        words.forEach(wd => {
            const test = line ? line + " " + wd : wd;
            if (ctx.measureText(test).width > cw - 36 && line) {
                ctx.fillText(line, x + cw / 2, ly); line = wd; ly += 22;
            } else line = test;
        });
        if (line) ctx.fillText(line, x + cw / 2, ly);
        ctx.textAlign = "left";

        if (sel) _uiText("▲ SPACE 선택", x + cw / 2, y + ch - 22, 14, rar.color, "center", true, 8);
    });

    _uiText("← →  이동      SPACE  선택", CW / 2, CH - 34, 15, "#9a8cc0", "center", true);
}

// ── 영구 강화 상점 ─────────────────────────────────────────
function renderShop() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#07040e";
    ctx.fillRect(0, 0, CW, CH);

    _uiText("다크 쿼츠 — 영구 강화", CW / 2, 74, 30, "#dd88ff", "center", true, 14);
    _uiText("여기서 산 강화는 죽어도 사라지지 않는다", CW / 2, 100, 13, "#8e83ad", "center");
    _uiText(`보유: ${Game.darkQuartz}`, CW / 2, 126, 18, "#ffcc44", "center", true, 8);

    const rowH = 56, listW = 620;
    const sx = (CW - listW) / 2, sy = 158;

    PERM_UPGRADES.forEach((u, i) => {
        const lvl = Game[u.key] || 0;
        const maxed = lvl >= PERM_MAX_LVL;
        const cost = permCost(lvl);
        const sel = i === Game.shopIdx;
        const y = sy + i * rowH;

        _uiPanel(sx, y, listW, rowH - 8, sel ? u.color : "#3a3352");
        if (sel) {
            ctx.fillStyle = u.color; ctx.globalAlpha = 0.10;
            ctx.fillRect(sx, y, listW, rowH - 8);
            ctx.globalAlpha = 1;
            _uiText("▶", sx - 20, y + 32, 18, u.color, "left", true);
        }

        _uiText(u.name, sx + 18, y + 22, 17, u.color, "left", true);
        _uiText(u.desc + " / 레벨", sx + 18, y + 40, 12, "#8e83ad");

        // 레벨 게이지 10칸
        const gx = sx + 250, gy = y + 16, cellW = 16, cellH = 16;
        for (let c = 0; c < PERM_MAX_LVL; c++) {
            ctx.fillStyle = c < lvl ? u.color : "#241d38";
            ctx.fillRect(gx + c * (cellW + 3), gy, cellW, cellH);
        }
        _uiText(`${lvl}/${PERM_MAX_LVL}`, gx + PERM_MAX_LVL * 19 + 10, y + 29, 13, "#c3b9dd", "left", true);

        if (maxed) {
            _uiText("MAX", sx + listW - 22, y + 30, 15, "#66ff99", "right", true);
        } else {
            const afford = Game.darkQuartz >= cost;
            _uiText(`${cost} 쿼츠`, sx + listW - 22, y + 30, 15, afford ? "#ffcc44" : "#77607a", "right", true);
        }
    });

    if (Game.shopMsg && Game.shopMsg.t > 0) {
        _uiText(Game.shopMsg.text, CW / 2, sy + PERM_UPGRADES.length * rowH + 30, 16, Game.shopMsg.col, "center", true, 8);
    }
    _uiText("↑ ↓  이동      SPACE  구입      ESC  돌아가기", CW / 2, CH - 30, 15, "#9a8cc0", "center", true);
}

// ── 일시정지 (스탯 + 보유 유물 확인) ───────────────────────
function renderPause() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "rgba(4,2,10,0.82)";
    ctx.fillRect(0, 0, CW, CH);
    _uiText("일시정지", CW / 2, 78, 32, "#cbb8ee", "center", true, 12);

    // 왼쪽: 스탯
    const px = 120, py = 120, pw = 440;
    _uiPanel(px, py, pw, 300);
    _uiText("현재 스탯", px + 20, py + 30, 18, "#ffcc44", "left", true);
    const prof = classProfile(Game.pClass);
    const rows = [
        ["체력", `${Math.ceil(Player.hp)} / ${Player.maxHp}`],
        ["공격력", `${prof.dmgMin + (Game.pAtkBonus || 0) + equipAtk()} ~ ${prof.dmgMax + (Game.pAtkBonus || 0) + equipAtk()}`],
        ["방어력", `${(Game.pDefBonus || 0) + equipDef()}`],
        ["치명타율", `${Math.round((prof.crit + (Game.pCritBonus || 0) + equipCrit()) * 100)}%`],
        ["치명타 피해", `${Math.round((Game.pCritDmg || 2) * 100)}%`],
        ["공격속도", `${Math.round((1 + (Game.pAtkSpdBonus || 0) + equipAtkSpd()) * 100)}%`],
        ["이동속도", `${Math.round((1 + (Game.pMoveSpdBonus || 0) + equipMoveSpd()) * 100)}%`],
        ["보호막", `${Math.round(Game.pShield || 0)}`],
    ];
    rows.forEach((r, i) => {
        const y = py + 62 + i * 28;
        _uiText(r[0], px + 24, y, 15, "#8e83ad");
        _uiText(r[1], px + pw - 24, y, 15, "#ffffff", "right", true);
    });

    // 오른쪽: 장비 + 유물
    const qx = px + pw + 30, qw = CW - qx - 120;
    _uiPanel(qx, py, qw, 300);
    _uiText("장비", qx + 20, py + 30, 18, "#ffcc44", "left", true);
    const eqRows = [["무기", Game.equip.weapon], ["방어구", Game.equip.armor]];
    eqRows.forEach(([lab, eq], i) => {
        const y = py + 58 + i * 24;
        _uiText(lab, qx + 24, y, 14, "#8e83ad");
        _uiText(eq ? equipDisplayName(eq) : "— 없음 —", qx + 90, y, 14, eq ? equipColor(eq) : "#4a4360", "left", !!eq);
    });

    _uiText(`유물 (${Game.relics.length})`, qx + 20, py + 130, 18, "#ffcc44", "left", true);
    if (Game.relics.length === 0) {
        _uiText("아직 없음 — 보스를 격파하면 획득", qx + 24, py + 158, 13, "#4a4360");
    } else {
        Game.relics.forEach((r, i) => {
            // 2열로 배치 (최대 12개까지 표시)
            if (i >= 12) return;
            const col = i % 2, row = Math.floor(i / 2);
            const x = qx + 24 + col * (qw / 2 - 10);
            const y = py + 158 + row * 22;
            _uiText("◆ " + r.name, x, y, 13, RELIC_RARITY[r.rarity].color);
        });
        if (Game.relics.length > 12) {
            _uiText(`... 외 ${Game.relics.length - 12}개`, qx + 24, py + 158 + 6 * 22, 12, "#6e6390");
        }
    }

    _uiText("ESC  계속하기        Q  메뉴로 (진행 포기)", CW / 2, CH - 44, 15, "#9a8cc0", "center", true);
}

// ── 사망 화면 ──────────────────────────────────────────────
function renderDead() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "rgba(6,0,10,0.88)";
    ctx.fillRect(0, 0, CW, CH);

    _uiText("당신은 죽었습니다", CW / 2, CH / 2 - 90, 46, "#ff3344", "center", true, 22);

    const theme = stageTheme();
    _uiText(`STAGE ${Game.stageN}-${Game.roundN}  ${theme.name} 에서 쓰러짐`,
        CW / 2, CH / 2 - 44, 16, "#c3b9dd", "center");

    const px = CW / 2 - 210;
    _uiPanel(px, CH / 2 - 20, 420, 122, "#7a3050");
    const stats = [
        ["도달", `${globalRound(Game.stageN, Game.roundN)} / ${STAGE_COUNT * ROUNDS_PER_STAGE} 라운드`],
        ["처치", `${Game.kills}`],
        ["점수", `${Game.score}`],
        ["획득 유물", `${Game.relics.length}개`],
    ];
    stats.forEach((s, i) => {
        const y = CH / 2 + 6 + i * 26;
        _uiText(s[0], px + 24, y, 14, "#8e83ad");
        _uiText(s[1], px + 396, y, 14, "#ffffff", "right", true);
    });

    _uiText(`이번 런에서 모은 다크 쿼츠는 그대로 남습니다 (보유 ${Game.darkQuartz})`,
        CW / 2, CH / 2 + 130, 13, "#dd88ff", "center");

    if (Math.floor(Game.frameCount / 26) % 2 === 0) {
        _uiText("R  다시 시작        ESC  메뉴로", CW / 2, CH / 2 + 176, 18, "#ffcc44", "center", true, 8);
    }
}

// ── 승리 화면 ──────────────────────────────────────────────
function renderWin() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "rgba(4,2,10,0.9)";
    ctx.fillRect(0, 0, CW, CH);
    _uiText("마왕을 쓰러뜨렸다", CW / 2, CH / 2 - 40, 46, "#ffcc44", "center", true, 24);
    _uiText(`15스테이지 완주  ·  점수 ${Game.score}  ·  처치 ${Game.kills}`,
        CW / 2, CH / 2 + 6, 17, "#cbb8ee", "center");
    if (Math.floor(Game.frameCount / 26) % 2 === 0) {
        _uiText("SPACE  계속", CW / 2, CH / 2 + 60, 17, "#ffcc44", "center", true, 8);
    }
}

// ── 미니맵 (플레이 중 우하단) ──────────────────────────────
function renderMinimap() {
    const MW = 150, MH = 150;
    const mx = CW - MW - 16, my = CH - MH - 16;
    const sc = MW / ROOM_W;

    ctx.save();
    ctx.fillStyle = "rgba(6,4,12,0.7)";
    ctx.fillRect(mx, my, MW, MH);
    ctx.strokeStyle = "#4a3a6a"; ctx.lineWidth = 1;
    ctx.strokeRect(mx, my, MW, MH);

    // 벽·장애물
    ctx.fillStyle = "#3d3552";
    baseWalls.forEach(w => {
        ctx.fillRect(mx + w.x * sc, my + w.y * sc, Math.max(1, w.w * sc), Math.max(1, w.h * sc));
    });

    // 문
    Game.doors.forEach(d => {
        ctx.fillStyle = d.open ? "#3cdc78" : "#dc3c3c";
        ctx.fillRect(mx + d.x * sc - 1, my + d.y * sc, 3, Math.max(2, d.h * sc));
    });

    // 적 — 보스는 크고 금색
    Game.enemies.forEach(e => {
        if (!e.active || e.dead) return;
        ctx.fillStyle = e.isBoss ? "#ffcc33" : (e.isElite ? "#ffaa22" : "#ff5555");
        const r = e.isBoss ? 3.5 : 2;
        ctx.beginPath(); ctx.arc(mx + e.x * sc, my + e.y * sc, r, 0, Math.PI * 2); ctx.fill();
    });

    // 아이템
    Game.items.forEach(it => {
        if (!it.active) return;
        ctx.fillStyle = it.equip ? "#ff9c2b" : "#33ff66";
        ctx.fillRect(mx + it.x * sc - 1, my + it.y * sc - 1, 2.5, 2.5);
    });

    // 플레이어
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(mx + Player.x * sc, my + Player.y * sc, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}
