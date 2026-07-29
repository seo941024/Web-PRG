// td.js — 탑다운 프로토타입 (1단계: 이동·카메라·벽충돌·구르기)
// 도적(class 1) 8방향 스프라이트로 "탑다운 느낌" 검증용.

const cv = document.getElementById("c");
const ctx = cv.getContext("2d");
const CW = cv.width, CH = cv.height;   // 내부 해상도 480x270
// 스프라이트를 미리 57px로 리사이즈해뒀으니 1:1로 그림 → 선명 (축소 아티팩트 없음)
ctx.imageSmoothingEnabled = false;

// 1:1 — CSS 확대 없음 (캔버스 내부 해상도 = 화면 픽셀)

// ── 8방향 스프라이트 로드 ──
const DIRS = ["south", "south-east", "east", "north-east", "north", "north-west", "west", "south-west"];
const sprites = {};
let loaded = 0;
DIRS.forEach(d => {
    const img = new Image();
    img.onload = () => { loaded++; };
    img.src = "../sprites/raw/1/" + d + ".png";
    sprites[d] = img;
});

// ── 플레이어 ──
const p = {
    x: 160, y: 200, vx: 0, vy: 0,   // 빈 공간에서 시작 (벽 안에서 시작하면 안 움직임)
    speed: 2.7,
    facing: "south",
    dashT: 0, dashCD: 0,
};
const ghosts = [];  // 대시 잔상

// ── 벽(충돌용 사각형) — 간단한 방 ──
const walls = [
    { x: 80,  y: 80,  w: 500, h: 24 },   // 위
    { x: 80,  y: 560, w: 500, h: 24 },   // 아래
    { x: 80,  y: 80,  w: 24,  h: 500 },  // 왼쪽
    { x: 556, y: 80,  w: 24,  h: 500 },  // 오른쪽
    { x: 250, y: 250, w: 90,  h: 90 },   // 가운데 기둥
    { x: 430, y: 180, w: 24,  h: 140 },  // 칸막이
];

// 플레이어 발치 히트박스 (탑다운은 '발' 기준으로 충돌)
const HB = { w: 18, h: 12 };  // 발치 박스 크기

// ── 입력 ──
const keys = {};
addEventListener("keydown", e => { keys[e.code] = true; if (e.code === "Space") e.preventDefault(); });
addEventListener("keyup",   e => { keys[e.code] = false; });
const dn = (...c) => c.some(k => keys[k]);

// 이동 벡터 → 8방향 이름
function dirName(mx, my) {
    if (mx > 0 && my < 0) return "north-east";
    if (mx > 0 && my > 0) return "south-east";
    if (mx < 0 && my < 0) return "north-west";
    if (mx < 0 && my > 0) return "south-west";
    if (mx > 0) return "east";
    if (mx < 0) return "west";
    if (my < 0) return "north";
    if (my > 0) return "south";
    return null;
}

// 발치 박스가 벽과 겹치나
function hitsWall(cx, cy) {
    const bx = cx - HB.w / 2, by = cy - HB.h / 2;
    for (const w of walls) {
        if (bx < w.x + w.w && bx + HB.w > w.x && by < w.y + w.h && by + HB.h > w.y) return true;
    }
    return false;
}

const cam = { x: 0, y: 0 };

function update() {
    // 입력 → 이동 방향
    let mx = 0, my = 0;
    if (dn("ArrowLeft", "KeyA")) mx = -1;
    if (dn("ArrowRight", "KeyD")) mx = 1;
    if (dn("ArrowUp", "KeyW")) my = -1;
    if (dn("ArrowDown", "KeyS")) my = 1;

    // 방향 갱신 (움직일 때만)
    const dname = dirName(mx, my);
    if (dname) p.facing = dname;

    // 대각선 속도 보정 (정규화)
    let sp = p.speed;
    if (mx !== 0 && my !== 0) sp *= 0.707;

    // 대시 (구르기 대신 — 빠른 이동 + 잔상 효과, 별도 모션 불필요)
    if (p.dashCD > 0) p.dashCD--;
    if (dn("Space") && p.dashCD <= 0 && (mx !== 0 || my !== 0)) {
        p.dashT = 10; p.dashCD = 28;
    }
    if (p.dashT > 0) {
        p.dashT--; sp = 8;
        if (p.dashT % 2 === 0) ghosts.push({ x: p.x, y: p.y, facing: p.facing, life: 16, max: 16 });
    }
    // 잔상 수명 감소
    for (let i = ghosts.length - 1; i >= 0; i--) { if (--ghosts[i].life <= 0) ghosts.splice(i, 1); }

    p.vx = mx * sp;
    p.vy = my * sp;

    // 축별로 이동 + 벽 충돌 (한 축씩 처리해야 벽에 붙어 미끄러짐)
    if (!hitsWall(p.x + p.vx, p.y)) p.x += p.vx;
    if (!hitsWall(p.x, p.y + p.vy)) p.y += p.vy;

    // 카메라: 플레이어 중심으로 부드럽게 따라감
    const tx = p.x - CW / 2, ty = p.y - CH / 2;
    cam.x += (tx - cam.x) * 0.12;
    cam.y += (ty - cam.y) * 0.12;
}

function render() {
    ctx.clearRect(0, 0, CW, CH);

    // 바닥 격자
    ctx.save();
    ctx.translate(-Math.round(cam.x), -Math.round(cam.y));
    const G = 32;
    ctx.fillStyle = "#1b1b26";
    ctx.fillRect(0, 0, 700, 700);
    ctx.strokeStyle = "#24243250"; ctx.lineWidth = 1;
    for (let gx = 0; gx <= 700; gx += G) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, 700); ctx.stroke(); }
    for (let gy = 0; gy <= 700; gy += G) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(700, gy); ctx.stroke(); }

    // 벽
    for (const w of walls) {
        ctx.fillStyle = "#33333f"; ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.fillStyle = "#44445260"; ctx.fillRect(w.x, w.y, w.w, 4);
    }

    // 대시 잔상 (플레이어 뒤에 반투명 고스트)
    for (const g of ghosts) {
        const gi = sprites[g.facing];
        if (gi && gi.complete) {
            const dw = gi.width, dh = gi.height;
            ctx.globalAlpha = (g.life / g.max) * 0.45;
            ctx.drawImage(gi, g.x - dw / 2, g.y - dh * 0.82, dw, dh);
            ctx.globalAlpha = 1;
        }
    }

    // 그림자 (발치 타원)
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 플레이어 스프라이트 (발치 기준으로 위로 그림)
    const img = sprites[p.facing];
    if (img && img.complete) {
        const dw = img.width, dh = img.height;    // 이미 57px로 리사이즈됨 → 1:1
        ctx.drawImage(img, p.x - dw / 2, p.y - dh * 0.82, dw, dh);
    }
    ctx.restore();

    // 로딩 표시
    if (loaded < DIRS.length) {
        ctx.fillStyle = "#889"; ctx.font = "12px monospace";
        ctx.fillText("스프라이트 로딩... " + loaded + "/" + DIRS.length, 12, CH - 12);
    }
}

function loop() {
    update();
    render();
    requestAnimationFrame(loop);
}
loop();
