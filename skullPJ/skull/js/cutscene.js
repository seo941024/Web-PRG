// cutscene.js — 컷신 (오프닝 / 보스 등장 / 보스 처치 / 엔딩)
// skull_V1 story.js의 타이핑 연출 구조를 탑다운 상태머신에 맞춰 재작성.
// 오프닝·엔딩 텍스트는 V1의 것을 그대로 이어받고(같은 이야기), 보스 대사는 5스테이지 로스터에 맞춰 새로 씀.
//
// 흐름: type이 끝나면 _cutsceneEnd()가 다음 상태로 넘긴다.
//   opening  → 스테이지 1-1 시작
//   boss     → 보스전 시작 (gs = "play")
//   bosskill → 유물 선택 (마지막 스테이지면 엔딩)
//   ending   → 메뉴

const CUTSCENES = {
    opening: [
        { img: "opening/scene1.png", speaker: "내레이터", dur: 300,
          text: "태초부터, 인간과 마족 사이에는 끊임없는 전쟁이 있었다." },
        { img: "opening/scene2.png", speaker: "내레이터", dur: 320,
          text: "수많은 승리와 패배가 있었으며, 마침내 마왕에 도달한 자가 있었으니—" },
        { img: "opening/scene3.png", speaker: "마왕", dur: 300,
          text: "하하하... 인간 따위가 짐에게 도전하다니. 실로 어리석구나." },
        { img: "opening/scene4.png", speaker: "내레이터", dur: 320,
          text: "인류의 희망이 패배했고, 세상은 혼돈에 휩싸였다." },
        { img: "", speaker: "내레이터", dur: 280,
          text: "......시간이 지난 후, 수많은 시체와 해골더미 중 무언가가 움직이기 시작했다." },
        { img: "opening/scene5.png", speaker: "????", dur: 280,
          text: "......나.. 죽은 것 아니였어....?" },
        { img: "opening/scene5.png", speaker: "해골", dur: 300,
          text: "......그렇군..... 죽지 못하는 저..주..... 인건가...." },
        { img: "opening/scene6.png", speaker: "해골용사", dur: 360,
          text: ".... 이 뼈만 남은 몸이라도..... 마왕을 죽이고 세상을 되찾아 보이겠어." },
    ],

    // 스테이지별 보스 등장 대사
    boss: {
        1: [
            { speaker: "고블린 킹", dur: 150, text: "끼에에엑! 겍겍겍! 침입자로군! 죽이고 죽인다! 캬아아악!" },
            { speaker: "해골용사",  dur: 150, text: "지능 낮은 고블린이군. 단숨에 해치우고 가자." },
        ],
        2: [
            { speaker: "스켈레톤 치프틴", dur: 160, text: "동족이여. 어찌 산 자들의 세상을 위해 뼈를 깎느냐." },
            { speaker: "해골용사",        dur: 150, text: "마족 따위와 같은 취급 하지 마라." },
        ],
        3: [
            { speaker: "내레이터",     dur: 150, text: "무덤이 열리고, 흙 속에서 왕관을 쓴 것이 일어섰다." },
            { speaker: "무덤의 군주", dur: 160, text: "이 땅의 모든 뼈는 내 것이다... 네 것도 곧 그리 되겠지." },
            { speaker: "해골용사",     dun: 0, dur: 150, text: "내 뼈는 아직 내 것이다." },
        ],
        4: [
            { speaker: "내레이터",     dur: 150, text: "대지가 갈라지고, 용암 속에서 거대한 형체가 솟구쳤다." },
            { speaker: "화산의 군주", dur: 140, text: "GROOAAARGH—!!" },
            { speaker: "해골용사",     dur: 150, text: "뼈가 재가 되기 전에 끝내야 한다." },
        ],
        5: [
            { speaker: "해골용사", dur: 160, text: "마왕!!!!!!" },
            { speaker: "마왕",     dur: 170, text: "...누가 겁도 없이 짐에게 도전하는가?" },
            { speaker: "마왕",     dur: 180, text: "오호? 자네는 나에게 이미 패배한 용사 아닌가. 꼴이 우습군." },
            { speaker: "해골용사", dur: 160, text: "못 본 사이에 말이 많아졌구나?" },
            { speaker: "해골용사", dur: 180, text: "세계의 혼돈을 가져오는 마왕이여! 이제 한 줌의 재가 되어라." },
            { speaker: "마왕",     dur: 170, text: "덤벼라, 필멸자여!!!!!" },
        ],
    },

    // 스테이지별 보스 처치 대사
    bosskill: {
        1: [{ speaker: "고블린 킹", dur: 130, text: "끼...끼에에... 왜... 왜 우리가..." }],
        2: [
            { speaker: "스켈레톤 치프틴", dur: 150, text: "...넌 이 굴레를 끊을 수 있겠는가..." },
            { speaker: "해골용사",        dur: 120, text: "반드시." },
        ],
        3: [
            { speaker: "무덤의 군주", dur: 150, text: "...흙으로... 돌아가는 것도... 나쁘지 않군..." },
            { speaker: "해골용사",    dur: 120, text: "편히 잠들어라." },
        ],
        4: [
            { speaker: "화산의 군주", dur: 140, text: "G...G...HHHHH..." },
            { speaker: "해골용사",    dur: 130, text: "불이 꺼졌군. 마왕성이 보인다." },
        ],
        5: [
            { speaker: "마왕",     dur: 170, text: "크...으...아직... 짐은... 아직 지지 않는다!!!" },
            { speaker: "마왕",     dur: 170, text: "이 세계가... 짐 없이 평화로울 것이라 믿는가...?" },
            { speaker: "해골용사", dur: 160, text: "......우린 살아갈 거야." },
        ],
    },

    ending: [
        { img: "ending/ending1.png", speaker: "내레이터", dur: 300,
          text: "마침내 — 용사의 검이 마왕을 베었다." },
        { img: "ending/ending2.png", speaker: "마왕", dur: 320,
          text: "...인간 따위에게...!!!! 짐이.... 짐이 패배하다니...!!!!!" },
        { img: "ending/ending3.png", speaker: "해골용사", dur: 320,
          text: "..... 끝난건가 ........ 아무것도 남지 않았군......" },
        { img: "", speaker: "내레이터", dur: 340,
          text: "... 그렇게 몇날며칠, 수개월을 돌아다녔지만, 폐허가 된 곳 뿐이었다—" },
        { img: "ending/ending4.png", speaker: "해골용사", dur: 320,
          text: "...... 살아있는 사람은 없는 건가..?...." },
        { img: "", speaker: "????", dur: 240, text: "..........!!!!!!!!!" },
        { img: "ending/ending5.png", speaker: "해골용사", dur: 320,
          text: "...이 곳은 ......." },
        { img: "ending/ending6.png", speaker: "내레이터", dur: 340,
          text: "따스한 햇살이 내리쬐는 꽃밭. 멀리 호수가 반짝였다. 그는 그 자리에 가만히 앉았다." },
        { img: "ending/ending7.png", speaker: "내레이터", dur: 340,
          text: "기분 좋은 바람이 불고, 향긋한 꽃내음이 풍겼다. 그는 하늘을 올려다 보았다." },
        { img: null, speaker: "", dur: 400, text: "", isTheEnd: true },
    ],
};

const _cutsceneImgCache = {};

function startCutscene(type, stageN) {
    let lines;
    if (type === "opening") lines = CUTSCENES.opening;
    else if (type === "ending") lines = CUTSCENES.ending;
    else if (type === "boss") lines = CUTSCENES.boss[stageN];
    else if (type === "bosskill") lines = CUTSCENES.bosskill[stageN];

    if (!lines || lines.length === 0) { _cutsceneEnd(type, stageN); return; }

    Game.cutscene = { type, stageN: stageN || 0, lines, step: 0, t: 0, typeIdx: 0, typeT: 0 };
    Game.gs = "cutscene";
    if (typeof playBGM === 'function') {
        if (type === "opening") playBGM('prologue');
        else if (type === "ending") playBGM('ending_dark');
    }
}

function _cutsceneEnd(type, stageN) {
    Game.cutscene = null;
    if (type === "opening") {
        beginRun();
    } else if (type === "boss") {
        Game.gs = "play";
        Game.camShake = 0;
        if (typeof playBGM === 'function') playBGM('play');
    } else if (type === "bosskill") {
        // 마지막 스테이지 보스면 엔딩으로, 아니면 유물 선택
        if (stageN >= STAGE_COUNT) startCutscene("ending");
        else openRelicSelect();
    } else if (type === "ending") {
        // 엔딩 후 성적 요약 화면 → SPACE로 메뉴 복귀 (main.js의 "win" 분기)
        Game.gs = "win";
    }
}

function updateCutscene() {
    const cs = Game.cutscene;
    if (!cs) return;
    cs.t++;

    const cur = cs.lines[cs.step];
    if (!cur) { _cutsceneEnd(cs.type, cs.stageN); return; }

    // 타이핑: 보스 대사는 빠르게(2프레임/글자), 오프닝·엔딩은 천천히(4프레임/글자)
    const typeSpeed = (cs.type === "boss" || cs.type === "bosskill") ? 2 : 4;
    if (cur.text) {
        cs.typeT++;
        if (cs.typeIdx < cur.text.length && cs.typeT >= typeSpeed) {
            cs.typeT = 0;
            cs.typeIdx++;
            const ch = cur.text[cs.typeIdx - 1];
            if (ch && ch !== ' ' && typeof playSfx === 'function' && !Game.isMuted) playSfx('typing');
        }
    }

    const typingDone = !cur.text || cs.typeIdx >= cur.text.length;
    // 표시 시간 = 지정값과 "타이핑 완료 + 읽을 여유" 중 긴 쪽
    const minDur = cur.text ? cur.text.length * typeSpeed + 70 : cur.dur;
    cs.effDur = Math.max(cur.dur, minDur);

    // ESC — 컷신 전체 스킵
    if (pr("Escape")) { _cutsceneEnd(cs.type, cs.stageN); return; }

    // SPACE — 타이핑 중이면 즉시 완성, 완성 상태면 다음 줄
    if (pr("Space", "Enter", "KeyC") && cs.t > 6) {
        if (typeof playSfx === 'function') playSfx('menu_select');
        if (!typingDone) { cs.typeIdx = cur.text.length; }
        else { _cutsceneNext(cs); }
        return;
    }

    if (typingDone && cs.t >= cs.effDur) _cutsceneNext(cs);
}

function _cutsceneNext(cs) {
    cs.step++;
    cs.t = 0; cs.typeIdx = 0; cs.typeT = 0;
    if (cs.step >= cs.lines.length) _cutsceneEnd(cs.type, cs.stageN);
}

function renderCutscene() {
    const cs = Game.cutscene;
    if (!cs) return;
    const cur = cs.lines[cs.step];
    if (!cur) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, CW, CH);

    // THE END 화면
    if (cur.isTheEnd) {
        const a = Math.min(1, cs.t / 70);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 34px SkullFont, NeoDunggeunmo, monospace";
        ctx.shadowBlur = 16; ctx.shadowColor = "#aaaaff";
        ctx.fillText("— THE END —", CW / 2, CH / 2 - 16);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#7a7396";
        ctx.font = "13px SkullFont, NeoDunggeunmo, monospace";
        ctx.fillText("[ SPACE ] 메뉴로", CW / 2, CH / 2 + 26);
        ctx.textAlign = "left";
        ctx.restore();
        return;
    }

    // 이미지 페이드 — 같은 이미지가 연속이면 페이드 없이 이어붙임
    const prev = cs.step > 0 ? cs.lines[cs.step - 1] : null;
    const next = cs.step < cs.lines.length - 1 ? cs.lines[cs.step + 1] : null;
    const sameBefore = prev && prev.img && prev.img === cur.img;
    const sameAfter = next && next.img && next.img === cur.img;
    const fade = 34;
    let alpha = 1;
    const effDur = cs.effDur || cur.dur;
    if (!sameBefore && cs.t < fade) alpha = cs.t / fade;
    else if (!sameAfter && cs.t > effDur - fade) alpha = Math.max(0, (effDur - cs.t) / fade);

    if (cur.img) {
        if (!_cutsceneImgCache[cur.img]) {
            const img = new Image();
            img.src = cur.img;
            _cutsceneImgCache[cur.img] = img;
        }
        const img = _cutsceneImgCache[cur.img];
        if (img.complete && img.naturalWidth > 0) {
            ctx.save();
            ctx.globalAlpha = alpha;
            // 비율 유지하며 화면을 꽉 채움
            const sc = Math.max(CW / img.naturalWidth, CH / img.naturalHeight);
            const dw = img.naturalWidth * sc, dh = img.naturalHeight * sc;
            ctx.drawImage(img, (CW - dw) / 2, (CH - dh) / 2, dw, dh);
            // 하단 어둡게 — 대사 가독성 확보
            const grd = ctx.createLinearGradient(0, CH * 0.5, 0, CH);
            grd.addColorStop(0, "rgba(0,0,0,0)");
            grd.addColorStop(1, "rgba(0,0,0,0.88)");
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, CW, CH);
            ctx.restore();
        }
    }

    // 대사 박스
    if (cur.text) {
        const boxX = 60, boxW = CW - 120, boxY = CH - 170, boxH = 120;
        ctx.save();
        ctx.globalAlpha = 0.62;
        ctx.fillStyle = "#000";
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.restore();
        ctx.strokeStyle = "rgba(150,120,200,0.5)"; ctx.lineWidth = 1.5;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        if (cur.speaker) {
            ctx.fillStyle = "#ffcc44";
            ctx.font = "bold 17px SkullFont, NeoDunggeunmo, monospace";
            ctx.textAlign = "left";
            ctx.fillText(cur.speaker, boxX + 22, boxY + 30);
        }

        // 타이핑 진행분만 출력 + 폭 초과 시 줄바꿈
        const shown = cur.text.slice(0, cs.typeIdx);
        ctx.fillStyle = "#f0e6dc";
        ctx.font = "19px SkullFont, NeoDunggeunmo, monospace";
        ctx.textAlign = "left";
        const maxW = boxW - 44, lineH = 28;
        let line = "", ly = boxY + 62;
        for (const ch of shown) {
            const test = line + ch;
            if (ctx.measureText(test).width > maxW && line.length > 0) {
                ctx.fillText(line, boxX + 22, ly);
                line = ch; ly += lineH;
            } else line = test;
        }
        if (line) ctx.fillText(line, boxX + 22, ly);
        // 타이핑 중 커서
        if (cs.typeIdx < cur.text.length && Math.floor(Game.frameCount / 12) % 2 === 0) {
            ctx.fillStyle = "rgba(255,220,100,0.9)";
            ctx.fillText("▌", boxX + 22 + ctx.measureText(line).width, ly);
        }
    }

    // 조작 안내
    if (cs.t > 30) {
        const glow = (Math.sin(Game.frameCount * 0.08) + 1) / 2;
        ctx.save();
        ctx.font = "bold 13px SkullFont, NeoDunggeunmo, monospace";
        ctx.textAlign = "right";
        ctx.fillStyle = `rgba(140,200,255,${0.35 + glow * 0.5})`;
        ctx.fillText("[ESC] 스킵", CW - 20, 28);
        ctx.textAlign = "center";
        ctx.fillStyle = `rgba(160,160,160,${0.35 + glow * 0.35})`;
        ctx.fillText("[SPACE] 다음", CW / 2, CH - 22);
        ctx.textAlign = "left";
        ctx.restore();
    }
}
