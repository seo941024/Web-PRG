// ==========================================
// 컷신 / 오프닝 / 엔딩 / 보스 등장 연출 (Story & Cutscene)
// ==========================================

/*
  게임 상태(Game.gs) 흐름:
  menu → opening_cutscene → class_select → play ...
  boss_intro → boss_cutscene → play
  win → ending_cutscene → menu

  Game.cutscene = {
    type: "opening" | "boss_intro" | "ending",
    step:  현재 대사/씬 인덱스,
    t:     현재 씬에서 흐른 프레임,
    auto:  true면 타이머로 자동 진행,
    fadeAlpha: 페이드 값 0~1,
    lines: [{text, speaker, duration, bg}] 배열
  }
*/

// ── 스토리 데이터 ──────────────────────────────────────────

const STORY = {

  // 오프닝: 텍스트 스토리 → 마지막 씬에서 해골 조립 애니메이션으로 전환
  opening: [
    { bg: "black",   speaker: "",             duration: 90,  text: "" },
    { bg: "black",   speaker: "내레이터",     duration: 160, text: "태초부터 인간과 마족 사이에는 끊이지 않는 전쟁이 있었다." },
    { bg: "black",   speaker: "내레이터",     duration: 160, text: "마왕은 저주의 힘으로 용사들을 하나씩 쓰러뜨렸다." },
    { bg: "village", speaker: "내레이터",     duration: 140, text: "그리고 마침내... 가장 강하다는 용사도 그 앞에 무릎을 꿇었다." },
    { bg: "black",   speaker: "",             duration: 80,  text: "" },
    { bg: "grave",   speaker: "내레이터",     duration: 160, text: "죽음. 그것이 끝이었어야 했다." },
    { bg: "grave",   speaker: "??",           duration: 160, text: "...아직이다. 아직 끝나지 않았어." },
    { bg: "grave",   speaker: "SKULL YUUSHA", duration: 180, text: "뼈만 남은 몸으로도 싸울 수 있다. 저주를 풀 때까지—" },
    { bg: "grave",   speaker: "SKULL YUUSHA", duration: 160, text: "마왕성을 향해... 나아간다." },
  ],

  // 보스별 등장 대사 [worldN] = [{speaker, text, duration}]
  boss: {
    1:  [
      { speaker: "고블린 킹",     duration: 130, text: "크하하! 뼈다귀 주제에 감히 내 영역을 침범해?!" },
      { speaker: "SKULL YUUSHA", duration: 130, text: "비켜라. 너는 내 길목일 뿐이다." },
    ],
    2:  [
      { speaker: "언데드 고블린 킹", duration: 130, text: "...나는 죽었다. 그래도 싸운다. 너처럼." },
      { speaker: "SKULL YUUSHA",    duration: 130, text: "편히 쉬어라. 이번엔 진짜로 끝내주마." },
    ],
    3:  [
      { speaker: "스켈레톤 치프틴", duration: 130, text: "뼈의 전사여, 어찌 동족을 거스르느냐?" },
      { speaker: "SKULL YUUSHA",   duration: 130, text: "나는 살아있는 자들의 편이다." },
    ],
    4:  [
      { speaker: "언데드 스켈레톤", duration: 130, text: "…죽음도 우릴 멈추지 못한다." },
      { speaker: "SKULL YUUSHA",   duration: 130, text: "그래도 길을 열어라." },
    ],
    5:  [
      { speaker: "거대 괴수 더스크", duration: 140, text: "GRAAAH—!!" },
      { speaker: "내레이터",         duration: 110, text: "대지가 울렸다. 마왕의 수호수가 깨어났다." },
    ],
    6:  [
      { speaker: "리치 킹",         duration: 140, text: "빛도, 어둠도 닿지 않는 자. 네가 감히—" },
      { speaker: "SKULL YUUSHA",    duration: 130, text: "죽은 자가 죽은 자를 두려워하겠나." },
    ],
    7:  [
      { speaker: "마족 제1친위대장", duration: 140, text: "하! 해골 따위가 왕성에? 마왕님이 웃으실 것 같군." },
      { speaker: "SKULL YUUSHA",    duration: 130, text: "웃음이 나올 때 웃어라. 곧 멈출 테니." },
    ],
    8:  [
      { speaker: "마족 제2친위대장", duration: 140, text: "이 대검이 너의 뼈를 가루로 만들어주마." },
      { speaker: "SKULL YUUSHA",    duration: 130, text: "해봐라." },
    ],
    9:  [
      { speaker: "마족 제3친위대장", duration: 140, text: "...여기까지 오다니. 하지만 마왕님 앞은 통과 불가다." },
      { speaker: "SKULL YUUSHA",    duration: 130, text: "마왕 앞에 서는 건 나다. 비켜라." },
    ],
    10: [
      { speaker: "마왕",            duration: 160, text: "...놀랍군. 내 저주를 받고도 여기까지 왔다." },
      { speaker: "마왕",            duration: 160, text: "뼈가 되어서도 포기하지 않다니. 그 집념... 경의를 표한다." },
      { speaker: "SKULL YUUSHA",    duration: 160, text: "경의는 필요 없다. 저주를 거둬라." },
      { speaker: "마왕",            duration: 160, text: "후후... 그것만은 안 되지. 어서 와라, 해골 용사여." },
    ],
  },

  ending: [
    { bg: "black",   speaker: "",             duration: 90,  text: "" },
    { bg: "throne",  speaker: "내레이터",     duration: 160, text: "마왕이 쓰러졌다. 마왕성에 침묵이 흘렀다." },
    { bg: "throne",  speaker: "마왕",         duration: 160, text: "...대단하다. 이 저주는... 풀린다. 하지만—" },
    { bg: "throne",  speaker: "마왕",         duration: 160, text: "한 번 죽은 자가 되돌아올 수 있을지는... 모르겠군." },
    { bg: "skull",   speaker: "SKULL YUUSHA", duration: 160, text: "..." },
    { bg: "black",   speaker: "",             duration: 120, text: "" },
    { bg: "village", speaker: "내레이터",     duration: 180, text: "저주가 걷히고, 해골 용사의 모습은 서서히 사라졌다." },
    { bg: "village", speaker: "내레이터",     duration: 180, text: "사람들은 이름 모를 용사를 기억하지 못했지만—" },
    { bg: "village", speaker: "내레이터",     duration: 180, text: "평화는 돌아왔다. 그것으로 충분했다." },
    { bg: "black",   speaker: "",             duration: 120, text: "" },
    { bg: "title",   speaker: "",             duration: 240, text: "SKULL YUUSHA" },
    { bg: "black",   speaker: "",             duration: 90,  text: "" },
  ],
};

// ── 컷신 초기화 ───────────────────────────────────────────

function startCutscene(type, worldN) {
    let lines;
    if (type === "opening") lines = STORY.opening;
    else if (type === "boss")   lines = STORY.boss[worldN] || [];
    else if (type === "ending") lines = STORY.ending;
    else return;

    if (!lines || lines.length === 0) {
        // 대사 없으면 바로 다음 상태로
        _cutsceneEnd(type);
        return;
    }

    Game.cutscene = {
        type,
        worldN: worldN || 0,
        step: 0,
        t: 0,
        fadeAlpha: 1,
        lines,
    };
    Game.gs = "cutscene";
}

function _cutsceneEnd(type) {
    Game.cutscene = null;
    if (type === "opening") {
        // 텍스트 스토리 끝 → 해골 조립 애니메이션
        Game.openingAnim = { t: 0, phase: 0, eyeOn: false };
        Game.gs = "opening_anim";
    } else if (type === "boss") {
        Game.gs = "play";
    } else if (type === "ending") {
        Game.gs = "menu";
        if (typeof restoreLobbyUI === 'function') restoreLobbyUI();
    }
}

// ── 컷신 업데이트 (매 프레임 호출) ───────────────────────

function updateCutscene() {
    const cs = Game.cutscene;
    if (!cs) return;

    cs.t++;
    const cur = cs.lines[cs.step];
    if (!cur) { _cutsceneEnd(cs.type); return; }

    // SPACE / ENTER / Z 로 스킵
    const skip = dn("Space", "Enter", "KeyZ", "KeyX");
    if ((cs.t >= cur.duration || skip) && cs.t > 10) {
        cs.step++;
        cs.t = 0;
        if (cs.step >= cs.lines.length) {
            _cutsceneEnd(cs.type);
        }
    }
}

// ── 컷신 렌더 (매 프레임 호출) ────────────────────────────

function renderCutscene(frameNow) {
    const cs = Game.cutscene;
    if (!cs) return;

    const cur = cs.lines[cs.step];
    if (!cur) return;

    // 배경
    _drawCutsceneBg(cur.bg, frameNow);

    // 페이드 처리
    const fadeDur = 18;
    let alpha = 1;
    if (cs.t < fadeDur) alpha = cs.t / fadeDur;
    else if (cs.t > cur.duration - fadeDur) alpha = Math.max(0, (cur.duration - cs.t) / fadeDur);

    // 대사 박스
    if (cur.text) {
        // 반투명 하단 박스
        ctx.fillStyle = `rgba(0,0,0,${0.75 * alpha})`;
        ctx.fillRect(0, CH - 90, CW, 90);
        ctx.strokeStyle = `rgba(180,30,30,${0.6 * alpha})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(8, CH - 88, CW - 16, 86);

        // 화자 이름
        if (cur.speaker) {
            ctx.fillStyle = `rgba(255,180,30,${alpha})`;
            ctx.font = "bold 13px NeoDunggeunmo";
            ctx.textAlign = "left";
            ctx.fillText(cur.speaker, 18, CH - 68);
        }

        // 대사 텍스트 (줄바꿈 지원)
        ctx.fillStyle = `rgba(240,230,220,${alpha})`;
        ctx.font = "14px NeoDunggeunmo";
        ctx.textAlign = "left";
        _wrapCutsceneText(cur.text, 18, CH - 50, CW - 36, 22, alpha);
    }

    // 스킵 안내
    if (cs.t > 40) {
        const blinkAlpha = ((Math.sin(frameNow * 0.006) + 1) / 2) * 0.5 * alpha;
        ctx.fillStyle = `rgba(150,150,150,${blinkAlpha})`;
        ctx.font = "11px NeoDunggeunmo";
        ctx.textAlign = "right";
        ctx.fillText("[SPACE] 다음", CW - 12, CH - 8);
        ctx.textAlign = "left";
    }
}

function _wrapCutsceneText(text, x, y, maxW, lineH, alpha) {
    const words = text.split(" ");
    let line = "";
    let curY = y;
    ctx.fillStyle = `rgba(240,230,220,${alpha})`;
    for (const w of words) {
        const test = line ? line + " " + w : w;
        if (ctx.measureText(test).width > maxW && line) {
            ctx.fillText(line, x, curY);
            line = w;
            curY += lineH;
        } else {
            line = test;
        }
    }
    if (line) ctx.fillText(line, x, curY);
}

function _drawCutsceneBg(bg, frameNow) {
    const t = frameNow;

    if (bg === "black" || !bg) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, CW, CH);
        return;
    }

    if (bg === "village") {
        // 마을 실루엣
        ctx.fillStyle = "#0a0510";
        ctx.fillRect(0, 0, CW, CH);
        // 하늘 그라데이션
        const sky = ctx.createLinearGradient(0, 0, 0, CH * 0.6);
        sky.addColorStop(0, "#1a0a2e");
        sky.addColorStop(1, "#2a1a1a");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, CW, CH * 0.6);
        // 별
        for (let i = 0; i < 40; i++) {
            const bx = ((i * 137) % CW);
            const by = ((i * 97) % (CH * 0.5));
            const blink = (Math.sin(t * 0.003 + i) + 1) / 2;
            ctx.fillStyle = `rgba(255,255,200,${0.3 + blink * 0.5})`;
            ctx.fillRect(bx, by, 1, 1);
        }
        // 마을 집 실루엣
        ctx.fillStyle = "#050208";
        for (let i = 0; i < 8; i++) {
            const bx = i * 85 - 20;
            const bh = 60 + (i % 3) * 20;
            ctx.fillRect(bx, CH - bh, 70, bh);
            // 지붕
            ctx.beginPath();
            ctx.moveTo(bx - 5, CH - bh);
            ctx.lineTo(bx + 35, CH - bh - 30);
            ctx.lineTo(bx + 75, CH - bh);
            ctx.fill();
            // 창문 (희미한 불빛)
            ctx.fillStyle = `rgba(255,150,30,0.25)`;
            ctx.fillRect(bx + 15, CH - bh + 15, 12, 10);
            ctx.fillRect(bx + 40, CH - bh + 15, 12, 10);
            ctx.fillStyle = "#050208";
        }
        // 지면
        ctx.fillStyle = "#080310";
        ctx.fillRect(0, CH - 25, CW, 25);
        return;
    }

    if (bg === "grave") {
        // 묘지 씬
        ctx.fillStyle = "#050208";
        ctx.fillRect(0, 0, CW, CH);
        // 달
        const moonGrd = ctx.createRadialGradient(CW * 0.75, 60, 5, CW * 0.75, 60, 50);
        moonGrd.addColorStop(0, "rgba(200,180,120,0.9)");
        moonGrd.addColorStop(0.5, "rgba(140,120,80,0.4)");
        moonGrd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = moonGrd;
        ctx.beginPath(); ctx.arc(CW * 0.75, 60, 50, 0, Math.PI * 2); ctx.fill();
        // 묘비들
        ctx.fillStyle = "#111118";
        for (let i = 0; i < 6; i++) {
            const gx = 30 + i * 95;
            const gy = CH - 70;
            const gh = 40 + (i % 2) * 15;
            ctx.fillRect(gx, gy - gh, 28, gh);
            ctx.beginPath(); ctx.arc(gx + 14, gy - gh, 14, Math.PI, 0); ctx.fill();
        }
        // 안개
        ctx.fillStyle = `rgba(100,80,120,${0.08 + Math.sin(t * 0.001) * 0.03})`;
        ctx.fillRect(0, CH - 80, CW, 80);
        // 중앙 묘비 (플레이어)
        ctx.fillStyle = "#1a1a22";
        ctx.fillRect(CW / 2 - 20, CH - 120, 40, 80);
        ctx.beginPath(); ctx.arc(CW / 2, CH - 120, 20, Math.PI, 0); ctx.fill();
        ctx.fillStyle = "#444";
        ctx.font = "10px NeoDunggeunmo"; ctx.textAlign = "center";
        ctx.fillText("HERO", CW / 2, CH - 90);
        ctx.textAlign = "left";
        // 지면
        ctx.fillStyle = "#080310";
        ctx.fillRect(0, CH - 40, CW, 40);
        return;
    }

    if (bg === "skull") {
        // 검은 배경 + 표창형 빨간 불빛이 밝아졌다 어두워졌다 반복
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, CW, CH);

        // 천천히 맥동하는 붉은 빛 (sin 주기 ~2.5초)
        const pulse = (Math.sin(t * 0.0025 * Math.PI * 2) + 1) / 2; // 0~1
        const cx2 = CW / 2, cy2 = CH / 2;

        // 표창(별) 모양 - 8방향 뾰족한 빛줄기
        const spikes = 8;
        const innerR = 18 + pulse * 12;   // 안쪽 반지름
        const outerR = 90 + pulse * 60;   // 바깥 반지름 (맥동)
        const glowR  = 180 + pulse * 100; // 글로우 범위

        // 바깥 글로우 그라데이션
        const glowGrd = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, glowR);
        glowGrd.addColorStop(0,   `rgba(255, 0, 20, ${0.25 + pulse * 0.35})`);
        glowGrd.addColorStop(0.4, `rgba(180, 0, 10, ${0.12 + pulse * 0.18})`);
        glowGrd.addColorStop(1,   "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glowGrd;
        ctx.beginPath(); ctx.arc(cx2, cy2, glowR, 0, Math.PI * 2); ctx.fill();

        // 표창 본체
        ctx.fillStyle = `rgba(255, 0, 30, ${0.55 + pulse * 0.45})`;
        ctx.shadowBlur = 30 + pulse * 40;
        ctx.shadowColor = "#ff0022";
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            const r = i % 2 === 0 ? outerR : innerR;
            const px2 = cx2 + Math.cos(angle) * r;
            const py2 = cy2 + Math.sin(angle) * r;
            i === 0 ? ctx.moveTo(px2, py2) : ctx.lineTo(px2, py2);
        }
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // 중심 밝은 핵
        const coreGrd = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, innerR * 1.5);
        coreGrd.addColorStop(0,   `rgba(255, 200, 180, ${0.7 + pulse * 0.3})`);
        coreGrd.addColorStop(0.5, `rgba(255, 40, 20, ${0.5 + pulse * 0.3})`);
        coreGrd.addColorStop(1,   "rgba(0,0,0,0)");
        ctx.fillStyle = coreGrd;
        ctx.beginPath(); ctx.arc(cx2, cy2, innerR * 1.5, 0, Math.PI * 2); ctx.fill();

        return;
    }

    if (bg === "throne") {
        // 왕좌 씬
        ctx.fillStyle = "#040004";
        ctx.fillRect(0, 0, CW, CH);
        // 핏빛 달
        const mGrd = ctx.createRadialGradient(CW / 2, 50, 10, CW / 2, 50, 100);
        mGrd.addColorStop(0, "rgba(180,0,0,0.6)");
        mGrd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = mGrd;
        ctx.beginPath(); ctx.arc(CW / 2, 50, 100, 0, Math.PI * 2); ctx.fill();
        // 왕좌 기둥들
        ctx.fillStyle = "#0a0008";
        for (let i = 0; i < 5; i++) {
            const px = 40 + i * 130;
            ctx.fillRect(px, 0, 20, CH - 30);
            ctx.beginPath(); ctx.arc(px + 10, 0, 10, Math.PI, 0); ctx.fill();
        }
        // 왕좌 실루엣
        ctx.fillStyle = "#080006";
        ctx.fillRect(CW / 2 - 45, CH * 0.3, 90, CH * 0.6);
        ctx.beginPath(); ctx.moveTo(CW / 2 - 45, CH * 0.3); ctx.lineTo(CW / 2, CH * 0.1); ctx.lineTo(CW / 2 + 45, CH * 0.3); ctx.fill();
        // 붉은 오라
        ctx.fillStyle = `rgba(150,0,0,${0.1 + Math.sin(t * 0.003) * 0.05})`;
        ctx.beginPath(); ctx.arc(CW / 2, CH * 0.3, 120, 0, Math.PI * 2); ctx.fill();
        // 지면
        ctx.fillStyle = "#060004";
        ctx.fillRect(0, CH - 30, CW, 30);
        return;
    }

    if (bg === "title") {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, CW, CH);
        const pulse = (Math.sin(t * 0.004) + 1) / 2;
        ctx.fillStyle = `rgba(255,0,60,${0.7 + pulse * 0.3})`;
        ctx.font = "bold 52px NeoDunggeunmo";
        ctx.textAlign = "center";
        ctx.shadowBlur = 25; ctx.shadowColor = "#ff0033";
        ctx.fillText("SKULL YUUSHA", CW / 2, CH / 2 - 10);
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(180,160,120,${0.5 + pulse * 0.3})`;
        ctx.font = "16px NeoDunggeunmo";
        ctx.fillText("— FIN —", CW / 2, CH / 2 + 30);
        ctx.textAlign = "left";
        return;
    }

    // fallback
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, CW, CH);
}


// ==========================================
// 오프닝 애니메이션 - 해골 용사 조립
// ==========================================

function updateOpeningAnim() {
    const a = Game.openingAnim;
    if (!a) return;
    a.t++;

    const done = a.t >= 420; // 애니메이션 자연 종료 (phase4 진입)
    
    if (done && !a.waitPhase) {
        // 조립 완료 → 대기 상태로 전환 (자동 진행 차단)
        a.waitPhase = true;
        a.waitT = 0;
    }
    
    if (a.waitPhase) {
        a.waitT++;
        // 충분히 기다린 후(30프레임) SPACE 입력 감지
        if (a.waitT > 30 && dn("Space") && !a._spaceOld) {
            Game.openingAnim = null;
            Game.gs = "class_select";
        }
        a._spaceOld = dn("Space");
        return;
    }
    
    // 조립 중 스킵 (phase 2 이상 진입 후만)
    if (a.t > 160 && dn("Space") && !a._spaceOld && !a.waitPhase) {
        // 스킵 시 즉시 대기 상태로
        a.waitPhase = true;
        a.waitT = 0;
        a.t = 420; // phase4로 점프
    }
    a._spaceOld = dn("Space");
}

function renderOpeningAnim(frameNow) {
    const a = Game.openingAnim;
    if (!a) return;
    const t = a.t;

    // 배경
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, CW, CH);

    // 별 (흩뿌려진 뼈 파티클 → 중심으로 모임)
    const cx = CW / 2, cy = CH / 2 - 10;

    // Phase 0 (0~60): 어둠 속 정적
    // Phase 1 (60~160): 뼈 파편들이 흩어져 있다가 중심으로 모임
    // Phase 2 (160~260): 해골 형태로 조립 (뼈 조각들 제자리)
    // Phase 3 (260~340): 눈이 천천히 켜짐
    // Phase 4 (340~420): 붉은 눈 빛남 + 타이틀 텍스트

    const phase = t < 60 ? 0 : t < 160 ? 1 : t < 260 ? 2 : t < 340 ? 3 : 4;
    a.phase = phase;

    if (phase === 0) {
        // 순수 암전 + 미세한 먼지 파티클
        for (let i = 0; i < 12; i++) {
            const px = ((i * 173 + t * 0.5) % CW);
            const py = ((i * 97 + t * 0.3) % CH);
            ctx.fillStyle = `rgba(80,60,60,${0.05 + (i%3)*0.02})`;
            ctx.fillRect(px, py, 1, 1);
        }
        return;
    }

    if (phase >= 1 && phase < 2) {
        // 뼈 파편들이 사방에서 중심으로 날아옴
        const prog = (t - 60) / 100; // 0→1
        const eased = 1 - Math.pow(1 - prog, 3); // ease-out cubic
        const bones = [
            { sx:-200, sy:-150 }, { sx:200, sy:-130 }, { sx:-160, sy:100 },
            { sx:180, sy: 120 }, { sx:0, sy:-220 }, { sx:0, sy:180 },
            { sx:-220, sy:0 }, { sx:220, sy:0 }, { sx:-100, sy:-200 },
            { sx:100, sy:200 },
        ];
        bones.forEach((b, i) => {
            const bx = cx + b.sx * (1 - eased);
            const by = cy + b.sy * (1 - eased);
            const rot = b.sx * 0.05 * (1 - eased);
            ctx.save();
            ctx.translate(bx, by); ctx.rotate(rot);
            ctx.fillStyle = `rgba(200,190,170,${0.3 + eased * 0.5})`;
            ctx.fillRect(-4, -12, 8, 24);
            ctx.fillRect(-8, -14, 16, 5);
            ctx.fillRect(-8, 9, 16, 5);
            ctx.restore();
        });
        return;
    }

    // phase 2+: 해골 형태 렌더
    const asmProg = phase === 2 ? Math.min(1, (t - 160) / 80) : 1;

    // 몸통 뼈대
    ctx.save();
    ctx.globalAlpha = asmProg;
    ctx.fillStyle = "#d8d4c8";

    // 갈비뼈
    for (let r = 0; r < 4; r++) {
        ctx.strokeStyle = `rgba(200,190,165,${asmProg})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy + 8 + r * 8);
        ctx.quadraticCurveTo(cx - 22, cy + 5 + r * 8, cx - 20, cy + 13 + r * 8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 5, cy + 8 + r * 8);
        ctx.quadraticCurveTo(cx + 22, cy + 5 + r * 8, cx + 20, cy + 13 + r * 8);
        ctx.stroke();
    }
    // 척추
    for (let v = 0; v < 6; v++) {
        ctx.fillStyle = "#ccc9be";
        ctx.fillRect(cx - 3, cy + 6 + v * 7, 6, 5);
    }
    // 골반
    ctx.fillStyle = "#bbb8ae";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 52, 20, 10, 0, 0, Math.PI * 2); ctx.fill();
    // 다리뼈
    ctx.fillStyle = "#c8c4b8";
    ctx.fillRect(cx - 20, cy + 58, 8, 36);
    ctx.fillRect(cx + 12, cy + 58, 8, 36);
    // 팔뼈
    ctx.fillRect(cx - 34, cy - 10, 8, 32);
    ctx.fillRect(cx + 26, cy - 10, 8, 32);

    // 흉골
    ctx.fillStyle = "#d0ccbf";
    ctx.fillRect(cx - 4, cy + 5, 8, 40);

    // 머리 (해골)
    ctx.fillStyle = "#e0ddd5";
    ctx.beginPath(); ctx.arc(cx, cy - 20, 26, 0, Math.PI * 2); ctx.fill();
    // 광대뼈
    ctx.fillStyle = "#c8c5bd";
    ctx.fillRect(cx - 26, cy - 14, 6, 8);
    ctx.fillRect(cx + 20, cy - 14, 6, 8);
    // 이마 능선
    ctx.fillStyle = "#d5d2c8";
    ctx.fillRect(cx - 22, cy - 32, 44, 6);
    // 코뼈
    ctx.fillStyle = "#aaa";
    ctx.fillRect(cx - 2, cy - 18, 2, 5); ctx.fillRect(cx + 1, cy - 18, 2, 5);
    // 이빨
    ctx.fillStyle = "#e0ddd5";
    ctx.fillRect(cx - 16, cy - 2, 32, 6);
    ctx.fillStyle = "#222";
    for (let t2 = 0; t2 < 5; t2++) ctx.fillRect(cx - 14 + t2 * 7, cy - 2, 4, 6);

    // 눈 구멍
    if (phase < 3) {
        ctx.fillStyle = "#000";
        ctx.beginPath(); ctx.ellipse(cx - 10, cy - 22, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 10, cy - 22, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // Phase 3: 눈이 켜짐
    if (phase >= 3) {
        const eyeProg = phase === 3 ? Math.min(1, (t - 260) / 60) : 1;
        const eyeA = eyeProg * (0.7 + Math.sin(frameNow * 0.004) * 0.3);
        ctx.fillStyle = "#000";
        ctx.beginPath(); ctx.ellipse(cx - 10, cy - 22, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 10, cy - 22, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(255, 0, 0, ${eyeA})`;
        ctx.shadowBlur = 15 * eyeProg; ctx.shadowColor = "#ff0000";
        ctx.beginPath(); ctx.ellipse(cx - 10, cy - 22, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 10, cy - 22, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    }

    // Phase 4: 타이틀 텍스트 + 대기 상태 PRESS SPACE 깜빡임
    if (phase >= 4 || (a && a.waitPhase)) {
        const txtProg = (a && a.waitPhase) ? 1.0 : Math.min(1, (t - 340) / 60);
        ctx.fillStyle = `rgba(255,0,60,${txtProg * 0.9})`;
        ctx.font = "bold 38px NeoDunggeunmo";
        ctx.textAlign = "center";
        ctx.shadowBlur = 18; ctx.shadowColor = "#ff0033";
        ctx.fillText("SKULL YUUSHA", cx, cy + 115);
        ctx.shadowBlur = 0;
        // 대기 상태에서는 깜빡이는 PRESS SPACE
        if (a && a.waitPhase) {
            const blink = Math.floor(frameNow / 480) % 2 === 0;
            ctx.fillStyle = blink ? "rgba(255,220,80,0.95)" : "rgba(180,160,100,0.3)";
            ctx.font = "bold 15px NeoDunggeunmo";
            ctx.shadowBlur = blink ? 10 : 0; ctx.shadowColor = "#ffcc44";
            ctx.fillText("PRESS  SPACE  TO  START", cx, cy + 142);
            ctx.shadowBlur = 0;
        } else {
            ctx.fillStyle = `rgba(180,160,140,${txtProg * 0.4})`;
            ctx.font = "13px NeoDunggeunmo";
            ctx.fillText("[ SPACE ] 계속", cx, cy + 138);
        }
        ctx.textAlign = "left";
    }
}