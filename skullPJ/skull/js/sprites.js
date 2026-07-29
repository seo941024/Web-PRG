// sprites.js — 방향별 스프라이트 로드 + 좌우 반전 최적화
// PixelLab 생성 비용 절감: 5방향(south, south-east, east, north-east, north)만 실제로 뽑고,
// west/south-west/north-west는 east/south-east/north-east를 코드에서 좌우 반전해 재사용.
// (8방향 전부 생성 대비 크레딧 37.5% 절감)

const SPRITE_BASE = "sprites/raw"; // 후처리 완료되면 "sprites/characters"로 교체
// 발치 정렬 비율 — PIL로 실측(콘텐츠 하단 ratio ≈0.73~0.75). 이전 0.82는 감으로 잡은 값이라 캐릭터가 그림자 위로 떠 보였음.
const SPRITE_FEET_RATIO = 0.75;

// 실제로 파일이 있는 5방향과, 그걸 반전해서 만들 3방향의 매핑
const REAL_DIRS = ["south", "south-east", "east", "north-east", "north"];
const MIRROR_MAP = { "west": "east", "south-west": "south-east", "north-west": "north-east" };

const CharSprites = {}; // { [classId]: { [dir]: HTMLImageElement, ready:bool } }

function loadCharSprites(classId) {
    if (CharSprites[classId]) return CharSprites[classId];
    const entry = { ready: false, images: {}, loadedCount: 0 };
    CharSprites[classId] = entry;
    REAL_DIRS.forEach(dir => {
        const img = new Image();
        img.onload = () => { entry.loadedCount++; entry.ready = entry.loadedCount >= REAL_DIRS.length; };
        img.onerror = () => { /* 아직 안 뽑은 직업 — 조용히 무시, placeholder로 대체됨 */ };
        img.src = `${SPRITE_BASE}/${classId}/${dir}.png`;
        entry.images[dir] = img;
    });
    return entry;
}

// dir(8방향 이름)에 대해 실제로 그릴 이미지와 좌우반전 여부를 반환
function resolveDirImage(classId, dir) {
    const entry = CharSprites[classId];
    if (!entry) return null;
    if (REAL_DIRS.includes(dir)) {
        const img = entry.images[dir];
        return (img && img.complete && img.naturalWidth > 0) ? { img, flip: false } : null;
    }
    const src = MIRROR_MAP[dir];
    const img = entry.images[src];
    return (img && img.complete && img.naturalWidth > 0) ? { img, flip: true } : null;
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
const ANIM_FRAME_COUNTS = { attack: 15, idle: 7 }; // 애니마다 프레임 수 다르면 여기 등록. attack: 0번=참조(idle)프레임, 1~14=실제 4타 콤보
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

// classId의 idle/walk 애니를 5방향 모두 예약 로드 (없는 파일은 그냥 404, 문제 없음)
function preloadAnims(classId, animNames) {
    animNames.forEach(a => REAL_DIRS.forEach(d => loadAnim(classId, a, d)));
}

// 프레임 애니 렌더 — 준비 안 됐으면 정지 포즈(drawDirSprite)로 폴백
function drawAnimSprite(ctx, classId, animName, dir, frameIndex, x, y) {
    const realDir = REAL_DIRS.includes(dir) ? dir : MIRROR_MAP[dir];
    const flip = !REAL_DIRS.includes(dir);
    const entry = loadAnim(classId, animName, realDir);
    const img = entry.frames[frameIndex % (entry.frameCount || ANIM_FRAME_COUNT)];
    if (!img || !img.complete || img.naturalWidth === 0) {
        drawDirSprite(ctx, classId, dir, x, y); // 폴백: 정지 포즈
        return;
    }
    const dw = img.naturalWidth, dh = img.naturalHeight;
    ctx.save();
    if (flip) { ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0); }
    ctx.drawImage(img, x - dw / 2, y - dh * SPRITE_FEET_RATIO, dw, dh);
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
