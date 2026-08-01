// ui.js — 전체 화면 UI (메뉴 / 일시정지 / 사망 / 유물 선택 / 상점) + 미니맵
// 월드 렌더는 render_entities.js가 담당하고, 여기서는 화면 좌표(setTransform 초기화 상태) 기준으로만 그린다.

// ── 공통 헬퍼 ──────────────────────────────────────────────
// 사각형 — 도트 게임 톤에 맞춰 **둥근 모서리를 쓰지 않는다**.
// (radius 인자는 호출부 호환을 위해 받기만 하고 무시. 곡선/블러가 들어가면
//  캐릭터 도트와 따로 놀면서 UI만 가볍고 매끈해 보인다.)
// 좌표는 정수로 스냅해 가장자리가 흐릿해지는 것도 줄인다.
function _rr(x, y, w, h, _r) {
    ctx.beginPath();
    ctx.rect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// 픽셀 UI용 테두리 — 바깥 검정 + 안쪽 밝은 선 2겹으로 각진 프레임을 만든다
function _pxFrame(x, y, w, h, col) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#05040a";                 // 바깥: 검은 윤곽
    ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);
    ctx.strokeStyle = col;                        // 안쪽: 색 테두리
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
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
    const col = uiMute(accent || UIC.line, 0.35);
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);

    // ① 아래로 1칸 밀린 통짜 그림자 — 블러가 아니라 도트처럼 계단식으로
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(x + 4, y + 4, w, h);

    // ② 본체 — 매끄러운 그라디언트 대신 두 단계 평면 색
    ctx.fillStyle = "#15121f";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#1c1828";
    ctx.fillRect(x, y, w, Math.round(h * 0.42));

    // ③ 안쪽 하이라이트/그림자 1px — 각진 두께감
    ctx.fillStyle = "rgba(255,255,255,0.09)";
    ctx.fillRect(x + 2, y + 2, w - 4, 1);
    ctx.fillRect(x + 2, y + 2, 1, h - 4);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(x + 2, y + h - 3, w - 4, 1);
    ctx.fillRect(x + w - 3, y + 2, 1, h - 4);

    // ④ 각진 2겹 테두리
    _pxFrame(x, y, w, h, col);
}

// 게이지 — 둥근 모서리·그라디언트 없이 각진 홈에 평면으로 채운다
function _uiBar(x, y, w, h, ratio, colA, colB, _r) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    // 홈 바닥
    ctx.fillStyle = "#0a0810";
    ctx.fillRect(x, y, w, h);

    const fw = Math.round(Math.max(0, Math.min(1, ratio)) * w);
    if (fw > 0) {
        ctx.fillStyle = colB;                    // 아래쪽 어두운 몸통
        ctx.fillRect(x, y, fw, h);
        ctx.fillStyle = colA;                    // 위쪽 밝은 띠 (2단 평면)
        ctx.fillRect(x, y, fw, Math.max(1, Math.round(h * 0.45)));
        ctx.fillStyle = "rgba(255,255,255,0.14)"; // 최상단 1px 하이라이트
        ctx.fillRect(x, y, fw, 1);
    }
    // 각진 검은 테두리
    ctx.lineWidth = 2; ctx.strokeStyle = "#05040a";
    ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);
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
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(Math.round(x) + 3, Math.round(ty) + 3, Math.round(tabW), Math.round(th));
        ctx.fillStyle = sel ? "#221c33" : "#131020";
        ctx.fillRect(Math.round(x), Math.round(ty), Math.round(tabW), Math.round(th));
        ctx.fillStyle = sel ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.05)";
        ctx.fillRect(Math.round(x) + 2, Math.round(ty) + 2, Math.round(tabW) - 4, 1);
        _pxFrame(x, ty, tabW, th, sel ? uiMute(c, 0.3) : UIC.lineDim);
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

    if (prof.ranged) _uiText("※ 기본 공격이 원거리입니다", skx, ly + 54, 13, "#66ccff", "left", true);
    if (prof.tint)   _uiText("※ 전용 스프라이트가 없어 색으로 구분합니다", px + 28, py + ph - 18, 12, "#6e6390", "left");

    if (Math.floor(Game.frameCount / 26) % 2 === 0) {
        _uiText("▶  SPACE 로 시작  ◀", UW / 2, UH - 40, 20, col, "center", true, 10);
    }
}

// 직업선택 화면에 띄우는 스킬 설명 (실제 동작은 skill.js)
const SKILL_DESC = {
    0: "주변 전체에 신성 충격파를 터뜨려 적을 밀어내고 1초간 무적이 됩니다. 위기 탈출기로도 쓸 수 있습니다.",
    1: "바라보는 방향으로 순간이동한 뒤 전방을 5연타로 난도질합니다. 이동 중 짧은 무적.",
    2: "관통하는 냉기탄 5발을 부채꼴로 발사하고, 잠시 주변 적을 크게 느려지게 만듭니다.",
    3: "대지를 내리쳐 넓은 원형에 강타를 넣고 적을 크게 밀어냅니다. 자신의 체력 8%를 소모합니다.",
    4: "전방 부채꼴로 12발을 빠르게 흩뿌린다. 탄 하나는 약하지만 몰아넣으면 강력합니다.",
    5: "전방 광역을 베고, 명중한 적 수에 비례해 체력을 흡수합니다.",
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

    _uiText("해골용사", UW / 2, UH * 0.36, 62, "#e8dfd0", "center");
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

    _uiText("유물을 하나 선택하세요", UW / 2, 96, 30, "#ffcc44", "center", true, 14);
    _uiText("이번 탐험에서만 유지됩니다", UW / 2, 124, 13, "#8e83ad", "center");

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

        // 카드 — 각진 픽셀 프레임. 희귀도 색은 테두리와 상단 띠로만 드러낸다.
        const rc = uiMute(rar.color, 0.3);
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.fillRect(Math.round(x) + 4, Math.round(y) + 4, Math.round(cw), Math.round(ch));
        ctx.fillStyle = sel ? "#1d1830" : "#141020";
        ctx.fillRect(Math.round(x), Math.round(y), Math.round(cw), Math.round(ch));
        // 상단 희귀도 띠 (그라데이션 없이 통짜)
        ctx.fillStyle = rc;
        ctx.globalAlpha = sel ? 0.30 : 0.18;
        ctx.fillRect(Math.round(x), Math.round(y), Math.round(cw), 44);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(Math.round(x), Math.round(y) + 44, Math.round(cw), 1);
        _pxFrame(x, y, cw, ch, sel ? rc : UIC.lineDim);

        _uiText(rar.name, x + cw / 2, y + 28, 15, uiMute(rar.color, 0.25), "center");

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

        // 카드 — 각진 픽셀 프레임 (곡선·그라디언트·글로우 없음)
        const cardCol = maxed ? "#8a6a22" : (sel ? uiMute(u.color, 0.3) : UIC.lineDim);
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.fillRect(Math.round(bx) + 4, Math.round(by) + 4, Math.round(bw), Math.round(bh));
        ctx.fillStyle = maxed ? "#221b0e" : (sel ? "#201a30" : "#12101c");
        ctx.fillRect(Math.round(bx), Math.round(by), Math.round(bw), Math.round(bh));
        // 상단 절반만 살짝 밝게 — 평면 2단
        ctx.fillStyle = "rgba(255,255,255,0.045)";
        ctx.fillRect(Math.round(bx), Math.round(by), Math.round(bw), Math.round(bh * 0.4));
        ctx.fillStyle = "rgba(255,255,255,0.09)";
        ctx.fillRect(Math.round(bx) + 2, Math.round(by) + 2, Math.round(bw) - 4, 1);
        _pxFrame(bx, by, bw, bh, cardCol);

        // 좌상단 인덱스 뱃지
        ctx.fillStyle = maxed ? "#4a3610" : (sel ? "#33254a" : "#1d1830");
        ctx.fillRect(Math.round(bx) + 8, Math.round(by) + 8, 26, 20);
        ctx.strokeStyle = "#05040a"; ctx.lineWidth = 2;
        ctx.strokeRect(Math.round(bx) + 7, Math.round(by) + 7, 28, 22);
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
        _uiText(_fit("보유 중인 유물이 없습니다.", qw - 48, 13), qx + 24, py + 158, 13, UIC.faint);
        _uiText(_fit("보스를 처치하면 획득할 수 있습니다.", qw - 48, 13), qx + 24, py + 178, 13, UIC.faint);
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

    _uiText("쓰러졌습니다", UW / 2, UH / 2 - 90, 46, "#ff3344", "center", true, 22);

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

    _uiText(`이번 탐험에서 모은 다크 쿼츠는 그대로 남습니다 (보유 ${Game.darkQuartz})`,
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
    _uiText("마왕을 쓰러뜨렸습니다", UW / 2, UH / 2 - 40, 46, "#ffcc44", "center", true, 24);
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
    { k: "← → ↑ ↓  /  W A S D", d: "8방향으로 이동합니다" },
    { k: "Z (누르는 동안)",      d: "스프린트 — 더 빠르게 이동합니다" },
    { k: "Space",                d: "회피 — 짧은 무적, 기력을 소모합니다" },
    { sec: "전투" },
    { k: "C",                    d: "공격 — 연타 시 4타 콤보, 마지막 타는 피해가 증가합니다" },
    { k: "Shift",                d: "직업 스킬 — 쿨다운은 HUD 게이지에 표시됩니다" },
    { sec: "화면" },
    { k: "I",                    d: "소지품 — 주운 장비를 착용하거나 해제합니다" },
    { k: "ESC",                  d: "일시정지 — 스탯·장비·유물을 확인합니다" },
    { k: "H",                    d: "조작법을 열거나 닫습니다" },
    { k: "M",                    d: "소리를 끄거나 켭니다" },
    { k: "R",                    d: "사망 화면에서 다시 시작합니다" },
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
        ctx.fillStyle = e.isBoss ? "#c9a44e" : (e.isElite ? "#b8893a" : "#b05046");
        const r = e.isBoss ? 4 : 3;
        ctx.fillRect(Math.round(mx + e.x * sc - r / 2), Math.round(my + e.y * sc - r / 2), r, r);
    });

    // 아이템
    Game.items.forEach(it => {
        if (!it.active) return;
        ctx.fillStyle = it.equip ? "#ff9c2b" : "#33ff66";
        ctx.fillRect(mx + it.x * sc - 1, my + it.y * sc - 1, 2.5, 2.5);
    });

    // 플레이어
    ctx.fillStyle = "#e8e2f0";
    ctx.fillRect(Math.round(mx + Player.x * sc - 2), Math.round(my + Player.y * sc - 2), 4, 4);
    ctx.restore();
}

// ── 인벤토리 [I] ───────────────────────────────────────────
// 주운 장비는 가방에 쌓이고 여기서 직접 착용/해제한다.
// 커서는 두 영역을 오간다: 장착칸(무기·방어구 2칸) ↔ 가방(BAG_SIZE칸, 4열 격자).
const INV_COLS = 4;

function updateInventory() {
    const n = Game.bag.length;

    if (pr("KeyI", "Escape", "KeyX")) { Game.showInv = false; return; }

    if (Game.invOnEquip) {
        // 장착칸: 무기(0) ↔ 방어구(1)
        if (pr("ArrowLeft", "KeyA"))  Game.invIdx = 0;
        if (pr("ArrowRight", "KeyD")) Game.invIdx = 1;
        if (pr("ArrowDown", "KeyS"))  { Game.invOnEquip = false; Game.invIdx = 0; }
        if (pr("Space", "Enter", "KeyC")) {
            const kind = Game.invIdx === 0 ? "weapon" : "armor";
            if (Game.equip[kind] && !unequipToBag(kind)) {
                Game.shopMsg = { text: "가방이 가득 찼습니다", col: "#ff8866", t: 90 };
            }
        }
    } else {
        // 가방 격자
        if (pr("ArrowLeft", "KeyA"))  Game.invIdx = Math.max(0, Game.invIdx - 1);
        if (pr("ArrowRight", "KeyD")) Game.invIdx = Math.min(Math.max(0, n - 1), Game.invIdx + 1);
        if (pr("ArrowUp", "KeyW")) {
            if (Game.invIdx < INV_COLS) { Game.invOnEquip = true; Game.invIdx = 0; }
            else Game.invIdx -= INV_COLS;
        }
        if (pr("ArrowDown", "KeyS")) {
            if (Game.invIdx + INV_COLS < n) Game.invIdx += INV_COLS;
        }
        if (pr("Space", "Enter", "KeyC")) {
            if (Game.bag[Game.invIdx]) equipFromBag(Game.invIdx);
            if (Game.invIdx >= Game.bag.length) Game.invIdx = Math.max(0, Game.bag.length - 1);
        }
        // 버리기 — 가방이 가득 찼을 때 자리를 비우는 유일한 수단
        if (pr("KeyQ") && Game.bag[Game.invIdx]) {
            dropFromBag(Game.invIdx);
            if (Game.invIdx >= Game.bag.length) Game.invIdx = Math.max(0, Game.bag.length - 1);
        }
    }
    if (Game.shopMsg && Game.shopMsg.t > 0) Game.shopMsg.t--;
}

// 장비 한 칸 그리기 — 선택 여부에 따라 테두리를 강조
function _invSlot(x, y, w, h, eq, sel, emptyLabel) {
    const col = eq ? uiMute(equipColor(eq), 0.25) : UIC.lineDim;
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(Math.round(x) + 3, Math.round(y) + 3, Math.round(w), Math.round(h));
    ctx.fillStyle = sel ? "#231d33" : "#15121f";
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    _pxFrame(x, y, w, h, sel ? "#c9a44e" : col);
    if (!eq) {
        _uiText(emptyLabel || "비어 있음", x + w / 2, y + h / 2 + 5, 12, UIC.faint, "center");
        return;
    }
    _uiText(_fit(equipDisplayName(eq), w - 16, 13), x + w / 2, y + 22, 13, col, "center");
    // 옵션 — 무엇이 오르는지 칸 안에서 바로 보이게
    const lines = eq.kind === "weapon"
        ? [eq.atk ? `공 +${eq.atk}` : "", eq.atkSpd ? `속 +${Math.round(eq.atkSpd * 100)}%` : "", eq.crit ? `치명 +${Math.round(eq.crit * 100)}%` : ""]
        : [eq.def ? `방 +${eq.def}` : "", eq.maxHp ? `체력 +${eq.maxHp}` : "", eq.moveSpd ? `이속 +${Math.round(eq.moveSpd * 100)}%` : ""];
    lines.filter(Boolean).forEach((t, i) => {
        _uiText(t, x + w / 2, y + 40 + i * 14, 11, UIC.label, "center");
    });
}

function renderInventory() {
    uiBegin();
    ctx.fillStyle = "rgba(4,3,8,0.88)";
    ctx.fillRect(0, 0, UW, UH);
    _uiText("소지품", UW / 2, 56, 30, UIC.accent, "center");
    _uiText("← → ↑ ↓  이동      SPACE  착용/해제      Q  버리기      I  닫기",
        UW / 2, 80, 13, UIC.label, "center");

    // ── 장착 중 ──
    const eqW = 200, eqH = 86, gap = 20;
    const eqX = (UW - (eqW * 2 + gap)) / 2, eqY = 104;
    _uiText("장착 중", eqX, eqY - 8, 15, UIC.text);
    [["weapon", "무기 없음"], ["armor", "방어구 없음"]].forEach(([kind, empty], i) => {
        const sel = Game.invOnEquip && Game.invIdx === i;
        _invSlot(eqX + i * (eqW + gap), eqY, eqW, eqH, Game.equip[kind], sel, empty);
    });

    // ── 가방 ──
    const bagY = eqY + eqH + 34;
    _uiText(`가방  ${Game.bag.length} / ${BAG_SIZE}`, eqX, bagY - 8, 15, UIC.text);
    const cw = 200, ch = 86, cgap = 12;
    const gridW = INV_COLS * cw + (INV_COLS - 1) * cgap;
    const gx = (UW - gridW) / 2;
    for (let i = 0; i < BAG_SIZE; i++) {
        const cx = gx + (i % INV_COLS) * (cw + cgap);
        const cy = bagY + Math.floor(i / INV_COLS) * (ch + cgap);
        const sel = !Game.invOnEquip && Game.invIdx === i;
        _invSlot(cx, cy, cw, ch, Game.bag[i], sel, "—");
    }

    if (Game.shopMsg && Game.shopMsg.t > 0) {
        _uiText(Game.shopMsg.text, UW / 2, UH - 20, 15, Game.shopMsg.col, "center");
    }
}
