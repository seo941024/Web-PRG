// sprites.js — 방향별 스프라이트 로드 + 좌우 반전 폴백
//
// 원칙: **해당 방향의 실제 원화가 있으면 그걸 쓰고, 없을 때만 반대편을 좌우 반전해서 대신 쓴다.**
// PixelLab 크레딧을 아끼려면 5방향(south, south-east, east, north-east, north)만 뽑아도 되고,
// 그 경우 west 계열은 자동으로 반전 폴백이 걸린다. 8방향을 다 뽑았다면 반전 없이 원화가 그대로 나온다
// (망토·무기처럼 좌우 비대칭인 요소가 뒤집히지 않아 더 자연스러움).

const SPRITE_BASE = "sprites/raw"; // 후처리 완료되면 "sprites/characters"로 교체
// 발치 정렬 비율 — PIL로 실측(콘텐츠 하단 ratio ≈0.73~0.75). 이전 0.82는 감으로 잡은 값이라 캐릭터가 그림자 위로 떠 보였음.
const SPRITE_FEET_RATIO = 0.75;

const ALL_DIRS = ["south", "south-east", "east", "north-east", "north", "north-west", "west", "south-west"];
// 원화가 없을 때 대신 좌우 반전해 쓸 짝
const MIRROR_MAP = { "west": "east", "south-west": "south-east", "north-west": "north-east" };
// 최소 보장 방향 — 로딩 완료 판정 기준
const REAL_DIRS = ["south", "south-east", "east", "north-east", "north"];

const CharSprites = {}; // { [classId]: { [dir]: HTMLImageElement, ready:bool } }

// 이미지가 실제로 그릴 수 있는 상태인지
function _imgOK(img) { return !!(img && img.complete && img.naturalWidth > 0); }

function loadCharSprites(classId) {
    if (CharSprites[classId]) return CharSprites[classId];
    const entry = { ready: false, images: {}, loadedCount: 0 };
    CharSprites[classId] = entry;
    // 8방향 전부 시도 — 없는 방향은 조용히 404 나고 반전 폴백으로 처리된다
    ALL_DIRS.forEach(dir => {
        const img = new Image();
        img.onload = () => { entry.loadedCount++; entry.ready = entry.loadedCount >= REAL_DIRS.length; };
        img.onerror = () => { /* 아직 안 뽑은 방향/직업 — 반전 폴백 또는 placeholder */ };
        img.src = `${SPRITE_BASE}/${classId}/${dir}.png`;
        entry.images[dir] = img;
    });
    return entry;
}

// dir(8방향 이름)에 대해 실제로 그릴 이미지와 좌우반전 여부를 반환
function resolveDirImage(classId, dir) {
    const entry = CharSprites[classId];
    if (!entry) return null;
    // 1순위 — 그 방향 원화 그대로
    if (_imgOK(entry.images[dir])) return { img: entry.images[dir], flip: false };
    // 2순위 — 반대편을 좌우 반전
    const src = MIRROR_MAP[dir];
    if (src && _imgOK(entry.images[src])) return { img: entry.images[src], flip: true };
    return null;
}

// 발치 기준(x,y)에 방향 스프라이트를 그림. 없으면 placeholder 사각형.
function drawDirSprite(ctx, classId, dir, x, y) {
    const r = resolveDirImage(classId, dir);
    if (!r) {
        // placeholder: 스프라이트 없는 직업 임시 표시
        ctx.fillStyle = "#555a";
        ctx.fillRect(x - 10, y - 30, 20, 30);
        return;
    }
    const { img, flip } = r;
    const dw = img.naturalWidth, dh = img.naturalHeight;
    ctx.save();
    if (flip) {
        ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0);
    }
    ctx.drawImage(img, x - dw / 2, y - dh * SPRITE_FEET_RATIO, dw, dh);
    ctx.restore();
}

// 같은 원화를 색만 다르게 틴트해서 그림 — 새 아트 없이 적 변형을 공짜로 뽑는 용도
function drawDirSpriteTinted(ctx, classId, dir, x, y, tintColor) {
    const r = resolveDirImage(classId, dir);
    if (!r) { ctx.fillStyle = tintColor + "cc"; ctx.beginPath(); ctx.arc(x, y - 14, 10, 0, Math.PI * 2); ctx.fill(); return; }
    const { img, flip } = r;
    const dw = img.naturalWidth, dh = img.naturalHeight;
    ctx.save();
    if (flip) { ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0); }
    const dx = x - dw / 2, dy = y - dh * SPRITE_FEET_RATIO;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.globalCompositeOperation = "source-atop";
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = tintColor;
    ctx.fillRect(dx, dy, dw, dh);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
}

// ── 프레임 애니메이션 (GIF → PNG 프레임 추출본, tools/extract_gif_frames.py) ──
// 아직 안 뽑은 방향/애니는 조용히 실패 → drawAnimSprite가 정지 포즈로 자동 폴백.
const ANIM_FRAME_COUNT = 8; // 기본 프레임 수 (대부분의 애니)
const ANIM_FRAME_COUNTS = { attack: 16, idle: 7 }; // 애니마다 프레임 수 다르면 여기 등록. attack: 0~15 전부 4타 콤보(3-4-4-5, 참조프레임 없음)
function animFrameCount(animName) { return ANIM_FRAME_COUNTS[animName] || ANIM_FRAME_COUNT; }
const AnimSprites = {}; // key `${classId}_${anim}_${dir}` -> { frames:[Image], loadedCount, ready, frameCount }

function loadAnim(classId, animName, dir) {
    const key = `${classId}_${animName}_${dir}`;
    if (AnimSprites[key]) return AnimSprites[key];
    const fc = animFrameCount(animName);
    const entry = { frames: [], ready: false, loadedCount: 0, frameCount: fc };
    for (let i = 0; i < fc; i++) {
        const img = new Image();
        img.onload = () => { entry.loadedCount++; entry.ready = entry.loadedCount >= fc; };
        img.onerror = () => {};
        img.src = `${SPRITE_BASE}/${classId}/anim/${animName}/${dir}/frame_${String(i).padStart(2, "0")}.png`;
        entry.frames[i] = img;
    }
    AnimSprites[key] = entry;
    return entry;
}

// 애니를 8방향 모두 예약 로드 — 안 뽑은 방향은 그냥 404 나고 반전 폴백으로 처리된다
function preloadAnims(classId, animNames) {
    animNames.forEach(a => ALL_DIRS.forEach(d => loadAnim(classId, a, d)));
}

// 애니메이션별 발치 비율 — 캔버스 크기가 다른 애니(예: attack은 108px, idle/walk는 92px)는
// 여백 비율도 달라서 공용 SPRITE_FEET_RATIO를 쓰면 발이 떠 보임. PIL로 실측해서 등록.
const ANIM_FEET_RATIO = { attack: 0.713 };
function feetRatioFor(animName) { return ANIM_FEET_RATIO[animName] || SPRITE_FEET_RATIO; }

// 프레임 애니 렌더
// 1순위 그 방향 원화 → 2순위 반대편 좌우반전 → 3순위 정지 포즈
function drawAnimSprite(ctx, classId, animName, dir, frameIndex, x, y) {
    const pick = (d) => {
        const e = loadAnim(classId, animName, d);
        const im = e.frames[frameIndex % (e.frameCount || ANIM_FRAME_COUNT)];
        return _imgOK(im) ? im : null;
    };
    let img = pick(dir), flip = false;
    if (!img && MIRROR_MAP[dir]) { img = pick(MIRROR_MAP[dir]); flip = !!img; }
    if (!img) {
        drawDirSprite(ctx, classId, dir, x, y); // 폴백: 정지 포즈
        return;
    }
    const dw = img.naturalWidth, dh = img.naturalHeight;
    ctx.save();
    if (flip) { ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0); }
    ctx.drawImage(img, x - dw / 2, y - dh * feetRatioFor(animName), dw, dh);
    ctx.restore();
}

// 이동 벡터 → 8방향 이름
function dirFromVec(mx, my) {
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
