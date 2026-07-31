// ui.js — 전체 화면 UI (메뉴 / 일시정지 / 사망 / 유물 선택 / 상점) + 미니맵
// 월드 렌더는 render_entities.js가 담당하고, 여기서는 화면 좌표(setTransform 초기화 상태) 기준으로만 그린다.

// ── 공통 헬퍼 ──────────────────────────────────────────────
// 둥근 사각형 — roundRect 미지원 브라우저에서도 깨지지 않게 사각형으로 폴백
function _rr(x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
}

// 폭을 넘는 글자는 …로 잘라 반환 — 패널 밖으로 글씨가 튀어나가는 걸 막는다
function _fit(txt, maxW, size, bold) {
    ctx.font = `${bold ? "bold " : ""}${size}px SkullFont, NeoDunggeunmo, monospace`;
    if (ctx.measureText(txt).width <= maxW) return txt;
    let s = txt;
    while (s.length > 1 && ctx.measureText(s + "…").width > maxW) s = s.slice(0, -1);
    return s + "…";
}

// 패널 — 평면에 테두리만 있으면 납작해 보여서, 입체감을 내는 요소를 층으로 쌓는다.
//   ① 아래로 드리우는 그림자(떠 있는 느낌) ② 본체 그라디언트
//   ③ 위/왼쪽 밝은 베벨 + 아래/오른쪽 어두운 베벨(두께감) ④ 상단 광택 ⑤ 바깥 글로우 테두리
function _uiPanel(x, y, w, h, accent) {
    const col = uiMute(accent || UIC.line, 0.35);   // 네온기 제거

    // ① 바닥 그림자 — 패널이 화면 위에 떠 있는 것처럼
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 18; ctx.shadowColor = "rgba(0,0,0,0.9)";
    _rr(x + 3, y + 5, w, h, 8); ctx.fill();
    ctx.restore();

    // ② 본체 — 채도를 낮춘 회보라 계열
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0,    "rgba(30,26,40,0.96)");
    g.addColorStop(0.55, "rgba(18,15,26,0.96)");
    g.addColorStop(1,    "rgba(9,8,14,0.96)");
    ctx.fillStyle = g;
    _rr(x, y, w, h, 8); ctx.fill();

    // ③ 베벨 — 위/왼쪽은 밝게, 아래/오른쪽은 어둡게 해서 두께가 있는 판처럼
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.beginPath();
    ctx.moveTo(x + 2, y + h - 8); ctx.lineTo(x + 2, y + 8);
    ctx.quadraticCurveTo(x + 2, y + 2, x + 8, y + 2); ctx.lineTo(x + w - 8, y + 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.moveTo(x + w - 2, y + 8); ctx.lineTo(x + w - 2, y + h - 8);
    ctx.quadraticCurveTo(x + w - 2, y + h - 2, x + w - 8, y + h - 2); ctx.lineTo(x + 8, y + h - 2);
    ctx.stroke();
    ctx.restore();

    // ④ 상단 광택
    const hg = ctx.createLinearGradient(x, y, x, y + Math.min(h * 0.32, 44));
    hg.addColorStop(0, "rgba(210,200,230,0.07)");
    hg.addColorStop(1, "rgba(210,200,230,0)");
    ctx.fillStyle = hg;
    _rr(x + 2, y + 2, w - 4, Math.min(h * 0.32, 44), [7, 7, 0, 0]); ctx.fill();

    // ⑤ 테두리 + 글로우
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 5; ctx.shadowColor = "rgba(0,0,0,0.8)";  // 형광 글로우 대신 은은한 그림자만
    _rr(x, y, w, h, 8); ctx.stroke();
    ctx.shadowBlur = 0;
}

// 게이지 — 파인 홈(inset)에 채워 넣고 위쪽에 광택을 얹어 입체적으로
function _uiBar(x, y, w, h, ratio, colA, colB, r) {
    r = r === undefined ? Math.min(5, h / 2) : r;
    // 홈 바닥 + 안쪽 그림자
    ctx.fillStyle = "rgba(0,0,0,0.72)";
    _rr(x, y, w, h, r); ctx.fill();
    const ish = ctx.createLinearGradient(x, y, x, y + h);
    ish.addColorStop(0, "rgba(0,0,0,0.65)");
    ish.addColorStop(0.5, "rgba(0,0,0,0)");
    ctx.fillStyle = ish;
    _rr(x, y, w, h, r); ctx.fill();

    const fw = Math.max(0, Math.min(1, ratio)) * w;
    if (fw > 1) {
        const fg = ctx.createLinearGradient(x, y, x, y + h);
        fg.addColorStop(0, colA);
        fg.addColorStop(1, colB);
        ctx.fillStyle = fg;
        _rr(x, y, fw, h, r); ctx.fill();
        // 위쪽 광택
        ctx.fillStyle = "rgba(255,255,255,0.16)";
        _rr(x + 1, y + 1, Math.max(0, fw - 2), Math.max(1, h * 0.38), [r, r, 0, 0]); ctx.fill();
    }
    // 테두리
    ctx.strokeStyle = "rgba(0,0,0,0.85)"; ctx.lineWidth = 1.5;
    _rr(x, y, w, h, r); ctx.stroke();
}
// 게임 안 모든 글씨는 여기를 거친다.
// 예전엔 호출할 때마다 굵기/글로우/외곽선을 따로 넘겨서 화면마다 스타일이 제각각이었다
// (어떤 건 얇고, 어떤 건 형광, 어떤 건 외곽선). 도트 게임에서는 검은 외곽선이 제일 깔끔하므로
// **항상 굵게 + 항상 검은 외곽선**으로 통일하고, glow 인자는 무시한다(호출부 호환용으로만 남김).
const UI_FONT = "SkullFont, NeoDunggeunmo, monospace";

function _uiText(txt, x, y, size, col, align, _bold, _glow) {
    ctx.font = `bold ${size}px ${UI_FONT}`;
    ctx.textAlign = align || "left";
    ctx.lineJoin = "round";                       // 외곽선 모서리가 뾰족하게 튀지 않게
    ctx.lineWidth = Math.max(3, Math.round(size * 0.22));
    ctx.strokeStyle = "rgba(0,0,0,0.92)";
    ctx.strokeText(txt, x, y);
    ctx.fillStyle = col;
    ctx.fillText(txt, x, y);
    ctx.textAlign = "left";
}

// ── 메인 메뉴 ──────────────────────────────────────────────
let _menuBgImg = null;

function updateMenu() {
    if (pr("Space", "Enter", "KeyC")) {
        if (typeof playSfx === 'function') playSfx('menu_select');
        Game.classIdx = CLASS_IDS.indexOf(Game.pClass);
        if (Game.classIdx < 0) Game.classIdx = 1;
        Game.gs = "classSelect";
    }
    if (pr("KeyS")) { if (typeof playSfx === 'function') playSfx('menu_select'); openShop(); }
    if (pr("KeyM")) { Game.isMuted = !Game.isMuted; if (Game.isMuted && typeof stopBGM === 'function') stopBGM(); else if (typeof playBGM === 'function') playBGM('lobby'); }
}

// ── 직업 선택 ──────────────────────────────────────────────
function updateClassSelect() {
    const n = CLASS_IDS.length;
    if (pr("ArrowLeft", "KeyA"))  { Game.classIdx = (Game.classIdx - 1 + n) % n; if (typeof playSfx === 'function') playSfx('menu_select'); }
    if (pr("ArrowRight", "KeyD")) { Game.classIdx = (Game.classIdx + 1) % n;     if (typeof playSfx === 'function') playSfx('menu_select'); }
    if (pr("Space", "Enter", "KeyC")) {
        Game.pClass = CLASS_IDS[Game.classIdx];
        // 선택한 직업 스프라이트/애니를 미리 로드 (도적 외에는 아직 파일이 없어 조용히 실패)
        loadCharSprites(Game.pClass);
        preloadAnims(Game.pClass, ["idle", "walk", "sprint", "attack"]);
        if (typeof playSfx === 'function') playSfx('unlock');
        startCutscene("opening");
    }
    if (pr("Escape", "KeyX")) { Game.gs = "menu"; }
}

function renderClassSelect() {
    uiBegin();
    ctx.fillStyle = "#07040e";
    ctx.fillRect(0, 0, UW, UH);

    _uiText("직업 선택", UW / 2, 68, 34, "#ffcc44", "center", true, 14);
    _uiText("← →  이동      SPACE  결정      ESC  뒤로", UW / 2, 94, 14, "#8e83ad", "center");

    const id = CLASS_IDS[Game.classIdx];
    const prof = classProfile(id);
    const sk = classSkill(id);
    const col = prof.tint || "#cc44ff";

    // 상단: 직업 탭 — 화면 폭에 맞춰 탭 크기를 계산한다
    // (예전엔 150px 고정이라 6직업이면 950px가 되어 948px 화면 밖으로 삐져나갔음)
    const gap = 10, sideMargin = 40;
    const tabW = Math.min(150, Math.floor((UW - sideMargin * 2 - gap * (CLASS_IDS.length - 1)) / CLASS_IDS.length));
    const totalW = CLASS_IDS.length * tabW + (CLASS_IDS.length - 1) * gap;
    const sx = (UW - totalW) / 2;
    CLASS_IDS.forEach((cid, i) => {
        const p = classProfile(cid);
        const x = sx + i * (tabW + gap);
        const sel = i === Game.classIdx;
        const c = p.tint || "#cc44ff";
        const ty = sel ? 116 : 120, th = sel ? 58 : 54; // 선택된 탭은 살짝 커지며 떠오름
        ctx.save();
        // 아래 그림자로 떠 있는 느낌
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        _rr(x + 2, ty + 4, tabW, th, 6); ctx.fill();
        const tg = ctx.createLinearGradient(x, ty, x, ty + th);
        if (sel) { tg.addColorStop(0, "rgba(48,30,72,0.98)"); tg.addColorStop(1, "rgba(16,8,28,0.98)"); }
        else     { tg.addColorStop(0, "rgba(20,12,34,0.9)");  tg.addColorStop(1, "rgba(8,4,16,0.9)"); }
        ctx.fillStyle = tg;
        _rr(x, ty, tabW, th, 6); ctx.fill();
        // 위쪽 밝은 베벨
        ctx.strokeStyle = sel ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x + 4, ty + 2); ctx.lineTo(x + tabW - 4, ty + 2); ctx.stroke();
        if (sel) { ctx.shadowBlur = 18; ctx.shadowColor = c; }
        ctx.strokeStyle = c; ctx.lineWidth = sel ? 3 : 1.5;
        _rr(x, ty, tabW, th, 6); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
        _uiText(_fit(p.name, tabW - 12, sel ? 24 : 20, true), x + tabW / 2, ty + th / 2 + 8,
            sel ? 24 : 20, sel ? c : "#7d739c", "center", true, sel ? 8 : 0);
    });

    // 본문 패널
    const px = 150, py = 200, pw = UW - 300, ph = 300;
    _uiPanel(px, py, pw, ph, col);

    _uiText(prof.name, px + 28, py + 44, 32, col, "left", true, 10);
    _uiText(prof.desc, px + 28, py + 74, 15, "#c3b9dd", "left");

    // 스탯 바 — 직업 간 차이가 한눈에 보이게 상대값으로 표시
    const stats = [
        ["체력",     prof.hpMul / 1.5],
        ["공격력",   (prof.dmgMin + prof.dmgMax) / 2 / 30],
        ["공격속도", prof.atkSpd / 2.1],
        ["이동속도", prof.spdMul / 1.2],
        ["치명타",   prof.crit / 0.4],
        ["사거리",   Math.min(1, prof.range / 300)],
    ];
    stats.forEach((s, i) => {
        const y = py + 112 + i * 28;
        _uiText(s[0], px + 28, y + 12, 15, "#9a8cc0", "left");
        const bx = px + 120, bw = 260;
        _uiBar(bx, y, bw, 15, Math.max(0.06, Math.min(1, s[1])), col, "#00000066", 4);
    });

    // 스킬 설명
    const skx = px + 430;
    _uiText("스킬  [Shift]", skx, py + 118, 15, "#9a8cc0", "left", true);
    _uiText(sk.name, skx, py + 148, 24, col, "left", true, 8);
    const descW = px + pw - 28 - skx;   // 패널 오른쪽 끝까지만 사용
    const desc = SKILL_DESC[id] || "";
    let line = "", ly = py + 176;
    ctx.font = `bold 14px ${UI_FONT}`;
    desc.split(" ").forEach(w => {
        const t = line ? line + " " + w : w;
        if (ctx.measureText(t).width > descW && line) {
            _uiText(line, skx, ly, 14, "#c3b9dd"); line = w; ly += 22;
            ctx.font = `bold 14px ${UI_FONT}`;
        } else line = t;
    });
    if (line) _uiText(line, skx, ly, 14, "#c3b9dd");
    _uiText(`쿨다운 ${(prof.skillCD / 60).toFixed(1)}초`, skx, ly + 30, 13, "#8e83ad", "left");

    if (prof.ranged) _uiText("※ 기본 공격이 원거리다", skx, ly + 54, 13, "#66ccff", "left", true);
    if (prof.tint)   _uiText("※ 전용 도트는 아직 없다 — 색으로 임시 구분", px + 28, py + ph - 18, 12, "#6e6390", "left");

    if (Math.floor(Game.frameCount / 26) % 2 === 0) {
        _uiText("▶  SPACE 로 시작  ◀", UW / 2, UH - 40, 20, col, "center", true, 10);
    }
}

// 직업선택 화면에 띄우는 스킬 설명 (실제 동작은 skill.js)
const SKILL_DESC = {
    0: "주변 전체에 신성 충격파를 터뜨려 적을 밀어내고 1초간 무적이 된다. 위기 탈출기로도 쓸 수 있다.",
    1: "바라보는 방향으로 순간이동한 뒤 전방을 5연타로 난도질한다. 이동 중 짧은 무적.",
    2: "관통하는 냉기탄 5발을 부채꼴로 발사하고, 잠시 주변 적을 크게 느려지게 만든다.",
    3: "대지를 내리쳐 넓은 원형에 강타를 넣고 적을 크게 밀어낸다. 자기 체력 8%를 소모한다.",
    4: "전방 부채꼴로 12발을 빠르게 흩뿌린다. 탄 하나는 약하지만 몰아넣으면 강하다.",
    5: "전방 광역을 베고, 명중한 적 수에 비례해 체력을 흡수한다.",
};

function renderMenu() {
    uiBegin();
    ctx.fillStyle = "#05030a";
    ctx.fillRect(0, 0, UW, UH);

    // 타이틀 배경 일러스트
    if (!_menuBgImg) { _menuBgImg = new Image(); _menuBgImg.src = "scene_main.png"; }
    if (_menuBgImg.complete && _menuBgImg.naturalWidth > 0) {
        const sc = Math.max(UW / _menuBgImg.naturalWidth, UH / _menuBgImg.naturalHeight);
        const dw = _menuBgImg.naturalWidth * sc, dh = _menuBgImg.naturalHeight * sc;
        ctx.save();
        ctx.globalAlpha = 0.62;
        ctx.drawImage(_menuBgImg, (UW - dw) / 2, (UH - dh) / 2, dw, dh);
        ctx.restore();
        const grd = ctx.createLinearGradient(0, 0, 0, UH);
        grd.addColorStop(0, "rgba(5,3,10,0.55)");
        grd.addColorStop(1, "rgba(5,3,10,0.92)");
        ctx.fillStyle = grd; ctx.fillRect(0, 0, UW, UH);
    }

    const pulse = 0.8 + Math.sin(Game.frameCount * 0.05) * 0.2;
    ctx.save();
    ctx.shadowBlur = 26 * pulse; ctx.shadowColor = "#ff2200";
    _uiText("해골용사", UW / 2, UH * 0.36, 62, "#fff8e7", "center", true);
    ctx.shadowBlur = 0;
    ctx.restore();
    _uiText("SKULL YUUSHA — 탑다운", UW / 2, UH * 0.36 + 32, 14, "#9a8cc0", "center");

    // 시작 안내 (깜빡임)
    if (Math.floor(Game.frameCount / 26) % 2 === 0) {
        _uiText("▶  SPACE  게임 시작  ◀", UW / 2, UH * 0.60, 20, "#ffcc44", "center", true, 10);
    }
    _uiText(`[S] 영구 강화        [H] 조작법        [M] 음소거 ${Game.isMuted ? "ON" : "OFF"}`,
        UW / 2, UH * 0.60 + 34, 13, "#8e83ad", "center");
    _uiText(`보유 다크 쿼츠: ${Game.darkQuartz}`, UW / 2, UH * 0.60 + 58, 13, "#dd88ff", "center");
}

// ── 유물 선택 (보스 격파 후 3택 1) ─────────────────────────
function renderRelicSelect() {
    uiBegin();
    ctx.fillStyle = "rgba(4,2,10,0.9)";
    ctx.fillRect(0, 0, UW, UH);

    _uiText("유물을 하나 골라라", UW / 2, 96, 30, "#ffcc44", "center", true, 14);
    _uiText("이번 탐험 동안만 남는다", UW / 2, 124, 13, "#8e83ad", "center");

    const cards = Game.relicChoices;
    const cw = 260, ch = 300, gap = 34;
    const totalW = cards.length * cw + (cards.length - 1) * gap;
    const sx = (UW - totalW) / 2, sy = 180;

    cards.forEach((r, i) => {
        const rar = RELIC_RARITY[r.rarity];
        const x = sx + i * (cw + gap);
        const sel = i === Game.relicIdx;
        // 선택된 카드는 살짝 떠오르고 테두리가 밝아짐
        const y = sy - (sel ? 12 : 0);

        // 카드 — 상점 카드와 같은 톤(그라디언트 + 글로우). 희귀도 색이 카드 전체를 물들인다.
        ctx.save();
        const cg = ctx.createLinearGradient(x, y, x, y + ch);
        if (sel) { cg.addColorStop(0, "rgba(34,20,52,0.97)"); cg.addColorStop(1, "rgba(10,4,18,0.97)"); }
        else     { cg.addColorStop(0, "rgba(16,8,28,0.92)");  cg.addColorStop(1, "rgba(6,2,12,0.92)"); }
        ctx.fillStyle = cg;
        _rr(x, y, cw, ch, 9); ctx.fill();

        if (sel) { ctx.shadowBlur = 22; ctx.shadowColor = rar.color; }
        ctx.strokeStyle = rar.color;
        ctx.lineWidth = sel ? 3 : 1.5;
        _rr(x, y, cw, ch, 9); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();

        // 희귀도 띠 — 위에서 아래로 옅어지게
        const rg = ctx.createLinearGradient(x, y, x, y + 46);
        rg.addColorStop(0, rar.color + (sel ? "66" : "3a"));
        rg.addColorStop(1, rar.color + "00");
        ctx.fillStyle = rg;
        _rr(x, y, cw, 46, [9, 9, 0, 0]); ctx.fill();
        _uiText(rar.name, x + cw / 2, y + 28, 15, rar.color, "center", true, sel ? 6 : 0);

        _uiText(r.name, x + cw / 2, y + 86, 21, "#ffffff", "center", true, sel ? 8 : 0);

        // 설명 — 카드 폭에 맞춰 줄바꿈
        const words = r.desc.split(" ");
        let line = "", ly = y + 130;
        ctx.font = `bold 14px ${UI_FONT}`;
        words.forEach(wd => {
            const test = line ? line + " " + wd : wd;
            if (ctx.measureText(test).width > cw - 36 && line) {
                _uiText(line, x + cw / 2, ly, 14, "#c3b9dd", "center"); line = wd; ly += 22;
                ctx.font = `bold 14px ${UI_FONT}`;
            } else line = test;
        });
        if (line) _uiText(line, x + cw / 2, ly, 14, "#c3b9dd", "center");

        if (sel) _uiText("▲ SPACE 선택", x + cw / 2, y + ch - 22, 14, rar.color, "center", true, 8);
    });

    _uiText("← →  이동      SPACE  선택", UW / 2, UH - 34, 15, "#9a8cc0", "center", true);
}

// ── 영구 강화 상점 ─────────────────────────────────────────
function renderShop() {
    uiBegin();
    const t = Date.now();
    const pulse = (Math.sin(t * 0.0028) + 1) / 2;

    // ── 배경: 다층 방사형 그라디언트 ──
    const bgGrd = ctx.createRadialGradient(UW / 2, UH * 0.38, 20, UW / 2, UH / 2, UW * 0.85);
    bgGrd.addColorStop(0,    "#1c0035");
    bgGrd.addColorStop(0.45, "#0e001e");
    bgGrd.addColorStop(1,    "#030008");
    ctx.fillStyle = bgGrd; ctx.fillRect(0, 0, UW, UH);

    // ── 배경 부유 파티클 (다크 쿼츠 결정) ──
    ctx.save();
    for (let i = 0; i < 26; i++) {
        const px = ((i * 103 + t * 0.009 * (i % 3 === 0 ? 1 : -0.6)) % UW + UW) % UW;
        const py = ((i * 61  + t * 0.007 * (i % 2 === 0 ? 0.8 : -0.5)) % UH + UH) % UH;
        const pa = 0.06 + Math.sin(t * 0.002 + i * 1.4) * 0.04;
        const ps = 1 + (i % 4) * 0.8;
        ctx.fillStyle = `rgba(190,90,255,${pa})`;
        ctx.beginPath(); ctx.arc(px, py, ps, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // ── 구분선 그라디언트 (상·하단 재사용) ──
    const sepGrd = ctx.createLinearGradient(0, 0, UW, 0);
    sepGrd.addColorStop(0,    "transparent");
    sepGrd.addColorStop(0.15, "#7722aa");
    sepGrd.addColorStop(0.5,  "#cc66ff");
    sepGrd.addColorStop(0.85, "#7722aa");
    sepGrd.addColorStop(1,    "transparent");

    // ── 헤더 ──
    _uiText("어둠의 제단", UW / 2, 46, 34, "#f0d0ff", "center");
    _uiText("— 영구 강화 시스템 —", UW / 2, 66, 13, "#8a5cc0", "center");
    _uiText(`◆  ${Game.darkQuartz}  ◆`, UW / 2, 96, 21, "#dd88ff", "center");
    _uiText("보유 다크 쿼츠", UW / 2, 113, 12, "#7a5a99", "center");

    ctx.strokeStyle = sepGrd; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 124); ctx.lineTo(UW, 124); ctx.stroke();

    // ── 카드 그리드 (3열 × 2행) ──
    const cols = 3;
    const bw = 240, bh = 168, padX = 20, padY = 16;
    const totalW = cols * bw + (cols - 1) * padX;
    const startX = (UW - totalW) / 2;
    const startY = 146;

    PERM_UPGRADES.forEach((u, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const bx = startX + col * (bw + padX);
        const by = startY + row * (bh + padY);
        const lvl   = Game[u.key] || 0;
        const cost  = permCost(lvl);
        const maxed = lvl >= PERM_MAX_LVL;
        const afford = Game.darkQuartz >= cost;
        const sel   = i === Game.shopIdx;
        const canBuy = afford && !maxed;
        const cp = sel && !maxed ? pulse : 0;

        // 선택 카드 글로우
        if (sel) {
            ctx.save();
            ctx.shadowBlur = 16 + cp * 10; ctx.shadowColor = maxed ? "#ffaa22" : u.color;
            ctx.strokeStyle = "rgba(0,0,0,0)"; ctx.lineWidth = 1;
            _rr(bx - 2, by - 2, bw + 4, bh + 4, 9); ctx.stroke();
            ctx.restore();
        }

        // 카드 배경 그라디언트 — 최대강화는 금색, 구입 가능은 보라, 부족은 어둡게
        const cg = ctx.createLinearGradient(bx, by, bx, by + bh);
        if (maxed) {
            cg.addColorStop(0, "rgba(52,38,6,0.95)"); cg.addColorStop(1, "rgba(22,15,2,0.95)");
        } else if (canBuy) {
            cg.addColorStop(0, `rgba(${40 + Math.round(cp * 14)},0,${64 + Math.round(cp * 20)},0.94)`);
            cg.addColorStop(1, "rgba(10,0,18,0.94)");
        } else {
            cg.addColorStop(0, "rgba(16,2,26,0.90)"); cg.addColorStop(1, "rgba(6,0,12,0.90)");
        }
        ctx.fillStyle = cg;
        _rr(bx, by, bw, bh, 8); ctx.fill();

        // 최대강화 골드 상단 스트라이프
        if (maxed) {
            const hg = ctx.createLinearGradient(bx, by, bx + bw, by);
            hg.addColorStop(0, "rgba(255,200,0,0)");
            hg.addColorStop(0.5, "rgba(255,200,0,0.10)");
            hg.addColorStop(1, "rgba(255,200,0,0)");
            ctx.fillStyle = hg;
            _rr(bx, by, bw, bh * 0.32, [8, 8, 0, 0]); ctx.fill();
        }

        // 카드 테두리
        ctx.lineWidth = 2;
        if (maxed) {
            ctx.shadowBlur = 4; ctx.shadowColor = "#996600";
            ctx.strokeStyle = "#886600";
        } else if (sel) {
            ctx.shadowBlur = 6 + cp * 8; ctx.shadowColor = u.color;
            ctx.strokeStyle = u.color;
        } else if (canBuy) {
            ctx.shadowBlur = 0; ctx.strokeStyle = "#6a2a9a";
        } else {
            ctx.shadowBlur = 0; ctx.strokeStyle = "#2d0044";
        }
        _rr(bx, by, bw, bh, 8); ctx.stroke();
        ctx.shadowBlur = 0;

        // 좌상단 인덱스 뱃지
        ctx.fillStyle = maxed ? "rgba(90,60,0,0.95)" : (sel ? "rgba(90,20,130,0.95)" : "rgba(45,0,70,0.9)");
        _rr(bx + 8, by + 8, 26, 20, 4); ctx.fill();
        _uiText(String(i + 1), bx + 21, by + 23, 13,
            maxed ? "#ffdd44" : (sel ? "#e8b0ff" : "#8a6aa8"), "center");

        // 이름 / 효과
        _uiText(_fit(u.name, bw - 24, 19), bx + bw / 2, by + 44, 19,
            maxed ? "#ffeebb" : (sel ? "#ffffff" : "#b79ccc"), "center");
        _uiText(_fit(u.desc, bw - 24, 14), bx + bw / 2, by + 68, 14,
            maxed ? "#bbaa55" : (sel ? u.color : "#8f7fae"), "center");

        // 레벨 바 — 파인 홈에 채워 넣은 입체 게이지
        const barX = bx + 18, barY = by + 84, barW = bw - 36, barH = 11;
        _uiBar(barX, barY, barW, barH, lvl / PERM_MAX_LVL,
            maxed ? "#ffdd44" : u.color, maxed ? "#a06000" : "#5a0f8a", 4);

        // Lv 표기
        _uiText(`Lv ${lvl} / ${PERM_MAX_LVL}`, bx + bw / 2, by + 116, 13,
            maxed ? "#ddaa33" : "#a99ac0", "center");

        // 비용 / MAX
        if (!maxed) {
            _uiText(`◆ ${cost}`, bx + bw / 2, by + 141, 17, afford ? "#ffcc00" : "#cc3333", "center");
            _uiText(afford ? "쿼츠 필요" : "쿼츠 부족", bx + bw / 2, by + 156, 11,
                afford ? "#9a7a22" : "#8a3333", "center");
        } else {
            _uiText("✦ MAX", bx + bw / 2, by + 146, 19, "#ffcc44", "center");
        }
    });

    // ── 하단 구분선 & 안내 ──
    ctx.strokeStyle = sepGrd; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, UH - 40); ctx.lineTo(UW, UH - 40); ctx.stroke();

    if (Game.shopMsg && Game.shopMsg.t > 0) {
        _uiText(Game.shopMsg.text, UW / 2, UH - 52, 16, Game.shopMsg.col, "center", true, 8);
    }
    _uiText("← → ↑ ↓  이동      SPACE  강화      ESC  돌아가기", UW / 2, UH - 18, 14, "#9a8cc0", "center", true);
}

// ── 일시정지 (스탯 + 보유 유물 확인) ───────────────────────
function renderPause() {
    uiBegin();
    ctx.fillStyle = "rgba(4,2,10,0.82)";
    ctx.fillRect(0, 0, UW, UH);
    _uiText("일시정지", UW / 2, 78, 32, "#cbb8ee", "center", true, 12);

    // 왼쪽: 스탯
    // 좌우 여백을 줄여 오른쪽(장비·유물) 패널이 이름을 담을 만큼 넓어지게 재배분
    // (예전 배치는 우패널이 238px뿐이라 유물 이름이 잘렸다)
    // 패널 높이는 행 수에서 역산한다 — 예전엔 300px 고정이라 10번째 행(스킬)이 패널 밖으로 나갔음
    const px = 70, py = 112, pw = 420;
    const ROW_H = 26, HEAD_H = 56;
    const prof = classProfile(Game.pClass);
    const rows = [
        ["체력", `${Math.ceil(Player.hp)} / ${Player.maxHp}`],
        ["공격력", `${prof.dmgMin + (Game.pAtkBonus || 0) + equipAtk()} ~ ${prof.dmgMax + (Game.pAtkBonus || 0) + equipAtk()}`],
        ["방어력", `${(Game.pDefBonus || 0) + equipDef()}`],
        ["치명타율", `${Math.round((prof.crit + (Game.pCritBonus || 0) + equipCrit()) * 100)}%`],
        ["치명타 피해", `${Math.round((Game.pCritDmg || 2) * 100)}%`],
        ["공격속도", `${Math.round((1 + (Game.pAtkSpdBonus || 0) + equipAtkSpd()) * 100)}%`],
        ["이동속도", `${Math.round((1 + (Game.pMoveSpdBonus || 0) + equipMoveSpd()) * 100)}%`],
        ["흡혈", `${Math.round((Game.pLifesteal || 0) * 100)}%`],
        ["보호막", `${Math.round(Game.pShield || 0)}`],
        ["스킬", Player.skillCD > 0 ? `${Math.ceil(Player.skillCD / 60)}초 남음` : `${classSkill(Game.pClass).name} 준비`],
    ];
    const panelH = HEAD_H + rows.length * ROW_H + 16;
    _uiPanel(px, py, pw, panelH, UIC.line);
    _uiText(`현재 스탯  —  ${prof.name}`, px + 20, py + 30, 18, uiMute(prof.tint || UIC.accent, 0.35), "left");
    // 헤더 구분선
    ctx.strokeStyle = "rgba(255,255,255,0.10)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px + 18, py + 42); ctx.lineTo(px + pw - 18, py + 42); ctx.stroke();

    rows.forEach((r, i) => {
        const y = py + HEAD_H + i * ROW_H;
        // 홀수 행에 옅은 띠 — 값이 어느 항목인지 눈으로 따라가기 쉽게
        if (i % 2 === 1) {
            ctx.fillStyle = "rgba(255,255,255,0.035)";
            ctx.fillRect(px + 12, y - 15, pw - 24, ROW_H - 2);
        }
        _uiText(r[0], px + 24, y, 14, UIC.label);
        _uiText(_fit(String(r[1]), pw - 170, 14), px + pw - 24, y, 14, UIC.text, "right");
    });

    // 오른쪽: 장비 + 유물
    const qx = px + pw + 26, qw = UW - qx - 70;
    _uiPanel(qx, py, qw, panelH, UIC.line);
    _uiText("장비", qx + 20, py + 30, 18, UIC.accent, "left");
    ctx.strokeStyle = "rgba(255,255,255,0.10)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(qx + 18, py + 42); ctx.lineTo(qx + qw - 18, py + 42); ctx.stroke();
    const eqRows = [["무기", Game.equip.weapon], ["방어구", Game.equip.armor]];
    eqRows.forEach(([lab, eq], i) => {
        const y = py + 58 + i * 24;
        _uiText(lab, qx + 24, y, 14, "#8e83ad");
        const nameW = qw - (90 + 24); // 패널 오른쪽 끝을 넘지 않게 잘라 그린다
        _uiText(eq ? _fit(equipDisplayName(eq), nameW, 14, true) : "— 없음 —",
            qx + 90, y, 14, eq ? equipColor(eq) : "#4a4360", "left", !!eq);
    });

    _uiText(`유물 (${Game.relics.length})`, qx + 20, py + 130, 18, "#ffcc44", "left", true);
    if (Game.relics.length === 0) {
        _uiText(_fit("아직 없다 — 보스를 쓰러뜨리면 얻는다", qw - 48, 13), qx + 24, py + 158, 13, "#4a4360");
    } else {
        // 2열 — 열 폭이 좁으면 이름이 잘리므로 _fit으로 …처리
        const colW = (qw - 48) / 2;
        Game.relics.forEach((r, i) => {
            if (i >= 12) return;
            const col = i % 2, row = Math.floor(i / 2);
            const x = qx + 24 + col * colW;
            const y = py + 158 + row * 22;
            _uiText(_fit("◆ " + r.name, colW - 8, 13), x, y, 13, RELIC_RARITY[r.rarity].color);
        });
        if (Game.relics.length > 12) {
            _uiText(`... 외 ${Game.relics.length - 12}개`, qx + 24, py + 158 + 6 * 22, 12, "#6e6390");
        }
    }

    _uiText("ESC  계속하기        H  조작법        Q  메뉴로 (진행 포기)", UW / 2, UH - 44, 15, "#9a8cc0", "center", true);
}

// ── 사망 화면 ──────────────────────────────────────────────
function renderDead() {
    uiBegin();
    ctx.fillStyle = "rgba(6,0,10,0.88)";
    ctx.fillRect(0, 0, UW, UH);

    _uiText("쓰러졌다", UW / 2, UH / 2 - 90, 46, "#ff3344", "center", true, 22);

    const theme = stageTheme();
    _uiText(`STAGE ${Game.stageN}-${Game.roundN}  ${theme.name} 에서 쓰러짐`,
        UW / 2, UH / 2 - 44, 16, "#c3b9dd", "center");

    const px = UW / 2 - 210;
    _uiPanel(px, UH / 2 - 20, 420, 122, "#7a3050");
    const stats = [
        ["도달", `${globalRound(Game.stageN, Game.roundN)} / ${STAGE_COUNT * ROUNDS_PER_STAGE} 라운드`],
        ["처치", `${Game.kills}`],
        ["점수", `${Game.score}`],
        ["획득 유물", `${Game.relics.length}개`],
    ];
    stats.forEach((s, i) => {
        const y = UH / 2 + 6 + i * 26;
        _uiText(s[0], px + 24, y, 14, "#8e83ad");
        _uiText(s[1], px + 396, y, 14, "#ffffff", "right", true);
    });

    _uiText(`이번 런에서 모은 다크 쿼츠는 그대로 남습니다 (보유 ${Game.darkQuartz})`,
        UW / 2, UH / 2 + 130, 13, "#dd88ff", "center");

    if (Math.floor(Game.frameCount / 26) % 2 === 0) {
        _uiText("R  다시 시작        ESC  메뉴로", UW / 2, UH / 2 + 176, 18, "#ffcc44", "center", true, 8);
    }
}

// ── 승리 화면 ──────────────────────────────────────────────
function renderWin() {
    uiBegin();
    ctx.fillStyle = "rgba(4,2,10,0.9)";
    ctx.fillRect(0, 0, UW, UH);
    _uiText("마왕을 쓰러뜨렸다", UW / 2, UH / 2 - 40, 46, "#ffcc44", "center", true, 24);
    _uiText(`${STAGE_COUNT * ROUNDS_PER_STAGE}스테이지 완주  ·  점수 ${Game.score}  ·  처치 ${Game.kills}`,
        UW / 2, UH / 2 + 6, 17, "#cbb8ee", "center");
    if (Math.floor(Game.frameCount / 26) % 2 === 0) {
        _uiText("SPACE  계속", UW / 2, UH / 2 + 60, 17, "#ffcc44", "center", true, 8);
    }
}

// ── 조작법 (H 토글, 어느 화면에서든) ──────────────────────
// 예전엔 캔버스 밖 HTML 힌트바로 상시 노출했는데, 게임 화면과 분리돼 보여서
// (플래시 웹게임 인상의 주된 원인) 게임 안 오버레이로 옮겼다.
const KEY_GUIDE = [
    { sec: "이동" },
    { k: "← → ↑ ↓  /  W A S D", d: "8방향 이동" },
    { k: "Z (누르는 동안)",      d: "스프린트 — 이동 속도 2배" },
    { k: "Space",                d: "회피 — 짧은 무적 + 잔상, 기력 소모" },
    { sec: "전투" },
    { k: "C",                    d: "공격 — 연타하면 4타 콤보, 마지막 타는 피해 증가" },
    { k: "Shift",                d: "직업 스킬 — 쿨다운은 HUD 게이지로 표시" },
    { sec: "화면" },
    { k: "ESC",                  d: "일시정지 (스탯·장비·유물 확인)" },
    { k: "H",                    d: "이 조작법 열기 / 닫기" },
    { k: "M",                    d: "음소거" },
    { k: "R",                    d: "사망 화면에서 재시작" },
];

function renderKeyGuide() {
    uiBegin();
    ctx.fillStyle = "rgba(4,2,10,0.93)";
    ctx.fillRect(0, 0, UW, UH);

    _uiText("조작법", UW / 2, 62, 32, "#ffcc44", "center", true, 14);

    const pw = 620, px = (UW - pw) / 2, py = 86;
    let y = py + 34;
    const rows = KEY_GUIDE.length;
    _uiPanel(px, py, pw, 30 + rows * 26 + 10, "#7a4fc9");

    KEY_GUIDE.forEach(row => {
        if (row.sec) {
            _uiText(`— ${row.sec} —`, px + 24, y + 4, 15, "#dd88ff", "left", true);
            y += 28;
            return;
        }
        // 키 캡슐
        ctx.font = "bold 13px SkullFont, NeoDunggeunmo, monospace";
        const kw = Math.max(58, ctx.measureText(row.k).width + 18);
        ctx.fillStyle = "#241a38";
        ctx.fillRect(px + 24, y - 12, kw, 20);
        ctx.strokeStyle = "#7a4fc9"; ctx.lineWidth = 1;
        ctx.strokeRect(px + 24, y - 12, kw, 20);
        _uiText(row.k, px + 24 + kw / 2, y + 3, 13, "#ffcc44", "center", true);
        _uiText(row.d, px + 24 + kw + 16, y + 3, 14, "#c3b9dd", "left");
        y += 26;
    });

    if (Math.floor(Game.frameCount / 26) % 2 === 0) {
        _uiText("H  또는  ESC  로 닫기", UW / 2, UH - 34, 16, "#9a8cc0", "center", true);
    }
    uiEnd();
}

// ── 미니맵 (플레이 중 우하단) ──────────────────────────────
function renderMinimap() {
    const MW = 150, MH = 150;
    const mx = UW - MW - 16, my = UH - MH - 16;
    const sc = MW / ROOM_W;

    ctx.save();
    uiBegin(); // 미니맵도 UI 스케일 좌표계 — ctx.restore()가 원래 변환을 되돌려준다
    ctx.fillStyle = "rgba(6,4,12,0.7)";
    ctx.fillRect(mx, my, MW, MH);
    ctx.strokeStyle = UIC.lineDim; ctx.lineWidth = 1;
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
