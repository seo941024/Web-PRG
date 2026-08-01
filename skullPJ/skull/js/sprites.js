// sprites.js — 방향별 스프라이트 로드 + 좌우 반전 폴백
//
// 원칙: **해당 방향의 실제 원화가 있으면 그걸 쓰고, 없을 때만 반대편을 좌우 반전해서 대신 쓴다.**
// PixelLab 크레딧을 아끼려면 5방향(south, south-east, east, north-east, north)만 뽑아도 되고,
// 그 경우 west 계열은 자동으로 반전 폴백이 걸린다. 8방향을 다 뽑았다면 반전 없이 원화가 그대로 나온다
// (망토·무기처럼 좌우 비대칭인 요소가 뒤집히지 않아 더 자연스러움).

const SPRITE_BASE = "sprites/raw"; // 후처리 완료되면 "sprites/characters"로 교체
// 발치 정렬 비율 — 스프라이트 (x,y)를 "발이 닿는 지점"으로 맞추는 값.
// 이 값이 실제보다 크면 캐릭터가 그림자 위로 떠 보인다. 감으로 잡지 말고 반드시 실측할 것:
//   python -c "from PIL import Image; im=Image.open('south.png').convert('RGBA'); print(im.getbbox()[3]/im.size[1])"
const SPRITE_FEET_RATIO = 0.75;   // 기본값(도적 = 실측 0.750)

// 클래스별 실측값 — PixelLab이 캔버스 크기(88/92/96/128px)를 매번 다르게 내주기 때문에
// 여백 비율도 제각각이라 공용값을 쓰면 전부 떠 보인다. 새 스프라이트를 추가하면 여기에 등록할 것.
const CLASS_FEET_RATIO = {
    mob1_basic:   0.727,
    mob1_thrower: 0.739,
    mob1_archer:  0.727,
    mob1_bomber:  0.729,
    boss1:        0.719,
};
function classFeetRatio(classId) {
    const v = CLASS_FEET_RATIO[classId];
    return v === undefined ? SPRITE_FEET_RATIO : v;
}

const ALL_DIRS = ["south", "south-east", "east", "north-east", "north", "north-west", "west", "south-west"];
// 원화가 없을 때 대신 좌우 반전해 쓸 짝
const MIRROR_MAP = { "west": "east", "south-west": "south-east", "north-west": "north-east" };
// 최소 보장 방향 — 로딩 완료 판정 기준
const REAL_DIRS = ["south", "south-east", "east", "north-east", "north"];

const CharSprites = {}; // { [classId]: { [dir]: HTMLImageElement, ready:bool } }

// 이미지가 실제로 그릴 수 있는 상태인지
function _imgOK(img) { return !!(img && img.complete && img.naturalWidth > 0); }

// ── 스프라이트 틴트 ────────────────────────────────────────
// ⚠️ 메인 캔버스에 바로 source-atop + fillRect를 하면 안 된다.
//    source-atop은 "이미 그려진 모든 것"(= 바닥·벽 포함) 기준으로 합성돼서
//    스프라이트가 아니라 사각형이 통째로 물든다. 실제로 자폭병이 빨간 네모로 보였던 원인.
//    그래서 오프스크린 캔버스에 스프라이트만 올려놓고 거기서 틴트한 뒤 결과를 옮겨 그린다.
const _tintCv = (typeof document !== "undefined" && document.createElement)
    ? document.createElement("canvas") : null;
const _tintCx = _tintCv ? _tintCv.getContext("2d") : null;

function _drawSpriteTinted(ctx, img, dx, dy, dw, dh, tint) {
    if (!tint || !_tintCx) { ctx.drawImage(img, dx, dy, dw, dh); return; }
    const w = img.naturalWidth, h = img.naturalHeight;
    if (_tintCv.width !== w || _tintCv.height !== h) { _tintCv.width = w; _tintCv.height = h; }
    _tintCx.globalCompositeOperation = "source-over";
    _tintCx.clearRect(0, 0, w, h);
    _tintCx.drawImage(img, 0, 0);
    _tintCx.globalCompositeOperation = "source-atop";  // 여기선 캔버스에 스프라이트뿐이라 안전
    _tintCx.fillStyle = tint;
    _tintCx.fillRect(0, 0, w, h);
    _tintCx.globalCompositeOperation = "source-over";
    ctx.drawImage(_tintCv, dx, dy, dw, dh);
}

// 아직 전용 도트가 없는 직업은 도적(1) 원화를 대신 쓴다.
// (예전엔 파일이 없으면 회색 네모 placeholder가 떠서, 도적 외 직업은 캐릭터가 아예 안 보였다.
//  직업 구분은 CLASS_PROFILE.tint 색으로 하고, 전용 도트가 나오면 이 폴백만 빠지면 됨)
const SPRITE_FALLBACK_CLASS = 1;
function spriteClassOf(classId) {
    const e = CharSprites[classId];
    if (e && ALL_DIRS.some(d => _imgOK(e.images[d]))) return classId;
    return SPRITE_FALLBACK_CLASS;
}

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
    let entry = CharSprites[classId];
    let srcClass = classId;
    // 전용 도트가 없는 직업이면 도적 원화로 대체 (없으면 로드까지 걸어둠)
    if (!entry || !ALL_DIRS.some(d => _imgOK(entry.images[d]))) {
        entry = CharSprites[SPRITE_FALLBACK_CLASS] || loadCharSprites(SPRITE_FALLBACK_CLASS);
        srcClass = SPRITE_FALLBACK_CLASS;   // 발치 비율도 빌려온 원화 기준으로 맞춰야 함
    }
    if (!entry) return null;
    // 1순위 — 그 방향 원화 그대로
    if (_imgOK(entry.images[dir])) return { img: entry.images[dir], flip: false, srcClass };
    // 2순위 — 반대편을 좌우 반전
    const src = MIRROR_MAP[dir];
    if (src && _imgOK(entry.images[src])) return { img: entry.images[src], flip: true, srcClass };
    return null;
}

// 발치 기준(x,y)에 방향 스프라이트를 그림. 없으면 placeholder 사각형.
function drawDirSprite(ctx, classId, dir, x, y, tint, scale) {
    const r = resolveDirImage(classId, dir);
    const sc = scale || 1;
    if (!r) {
        // placeholder: 스프라이트 없는 직업 임시 표시
        ctx.fillStyle = "#555a";
        ctx.fillRect(x - 10 * sc, y - 30 * sc, 20 * sc, 30 * sc);
        return;
    }
    const { img, flip, srcClass } = r;
    const dw = img.naturalWidth * sc, dh = img.naturalHeight * sc;
    const dx = x - dw / 2, dy = y - dh * classFeetRatio(srcClass);
    ctx.save();
    if (flip) {
        ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0);
    }
    // 남의 원화를 빌려 쓸 때 직업 색으로 구분 — 스프라이트 픽셀만 물들인다
    _drawSpriteTinted(ctx, img, dx, dy, dw, dh, tint ? _tintWithAlpha(tint, 0.45) : null);
    ctx.restore();
}

// #rrggbb면 기본 농도를 씌우고, rgba(...)면 지정된 농도를 그대로 존중한다
// (자폭병 도화선처럼 시간에 따라 붉기가 짙어지는 연출에 필요)
function _tintWithAlpha(tint, defAlpha) {
    if (typeof tint !== "string") return tint;
    if (tint.startsWith("rgba")) return tint;
    if (tint[0] === "#" && tint.length >= 7) {
        const r = parseInt(tint.slice(1, 3), 16), g = parseInt(tint.slice(3, 5), 16), b = parseInt(tint.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${defAlpha})`;
    }
    return tint;
}

// 같은 원화를 색만 다르게 틴트해서 그림 — 새 아트 없이 적 변형을 공짜로 뽑는 용도.
// tintColor가 없으면(null/undefined) 틴트 없이 원화 그대로 그린다 —
// 전용 도트가 있는 보스는 이미 색이 맞으므로 덧칠하면 오히려 탁해진다.
function drawDirSpriteTinted(ctx, classId, dir, x, y, tintColor, scale) {
    const r = resolveDirImage(classId, dir);
    const sc = scale || 1;
    if (!r) {
        if (tintColor) { ctx.fillStyle = tintColor + "cc"; ctx.beginPath(); ctx.arc(x, y - 14 * sc, 10 * sc, 0, Math.PI * 2); ctx.fill(); }
        return;
    }
    const { img, flip, srcClass } = r;
    // 배율은 발치(x, y)를 기준으로 커진다 — 커져도 바닥에 붙어 있어야 하므로
    const dw = img.naturalWidth * sc, dh = img.naturalHeight * sc;
    ctx.save();
    if (flip) { ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0); }
    const dx = x - dw / 2, dy = y - dh * classFeetRatio(srcClass);
    _drawSpriteTinted(ctx, img, dx, dy, dw, dh,
        tintColor ? _tintWithAlpha(tintColor, 0.45) : null);
    ctx.restore();
}

// ── 프레임 애니메이션 (GIF → PNG 프레임 추출본, tools/extract_gif_frames.py) ──
// 아직 안 뽑은 방향/애니는 조용히 실패 → drawAnimSprite가 정지 포즈로 자동 폴백.
const ANIM_FRAME_COUNT = 8; // 기본 프레임 수 (대부분의 애니)
const ANIM_FRAME_COUNTS = { attack: 16, idle: 7 }; // 애니마다 프레임 수 다르면 여기 등록. attack: 0~15 전부 4타 콤보(3-4-4-5, 참조프레임 없음)
// 클래스별 예외 — 같은 애니 이름이라도 캐릭터마다 프레임 수가 다를 수 있다
// (예: 도적 idle=7, 고블린 킹(boss1) idle=8 — PixelLab에서 뽑을 때마다 다르게 나옴)
const ANIM_FRAME_COUNTS_BY_CLASS = { boss1: { idle: 8, walk: 8 } };
function animFrameCount(animName, classId) {
    const byClass = ANIM_FRAME_COUNTS_BY_CLASS[classId];
    if (byClass && byClass[animName] !== undefined) return byClass[animName];
    return ANIM_FRAME_COUNTS[animName] || ANIM_FRAME_COUNT;
}
const AnimSprites = {}; // key `${classId}_${anim}_${dir}` -> { frames:[Image], loadedCount, ready, frameCount }

function loadAnim(classId, animName, dir) {
    const key = `${classId}_${animName}_${dir}`;
    if (AnimSprites[key]) return AnimSprites[key];
    const fc = animFrameCount(animName, classId);
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
// 클래스별 예외 — boss1(고블린 킹)은 128px 캔버스라 도적(92px) 비율과 다름. PIL 실측값(≈0.72)
// boss1은 idle/walk 모두 128px 캔버스라 비율이 같다(PIL 실측 0.719)
const ANIM_FEET_RATIO_BY_CLASS = { boss1: { idle: 0.72, walk: 0.72 } };
function feetRatioFor(animName, classId) {
    const byClass = ANIM_FEET_RATIO_BY_CLASS[classId];
    if (byClass && byClass[animName] !== undefined) return byClass[animName];
    return ANIM_FEET_RATIO[animName] || SPRITE_FEET_RATIO;
}

// 프레임 애니 렌더
// 1순위 그 방향 원화 → 2순위 반대편 좌우반전 → 3순위 정지 포즈
function drawAnimSprite(ctx, classId, animName, dir, frameIndex, x, y, tint, scale) {
    const srcClass = spriteClassOf(classId); // 전용 도트 없으면 도적 원화로
    const sc = scale || 1;
    const pick = (d) => {
        const e = loadAnim(srcClass, animName, d);
        const im = e.frames[frameIndex % (e.frameCount || ANIM_FRAME_COUNT)];
        return _imgOK(im) ? im : null;
    };
    let img = pick(dir), flip = false;
    if (!img && MIRROR_MAP[dir]) { img = pick(MIRROR_MAP[dir]); flip = !!img; }
    if (!img) {
        drawDirSprite(ctx, classId, dir, x, y, tint, sc); // 폴백: 정지 포즈
        return;
    }
    const dw = img.naturalWidth * sc, dh = img.naturalHeight * sc;
    const dx = x - dw / 2, dy = y - dh * feetRatioFor(animName, srcClass);
    ctx.save();
    if (flip) { ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0); }
    // 전용 도트가 없어 남의 원화를 빌려 쓰는 경우, 직업 색을 덧입혀 구분한다
    _drawSpriteTinted(ctx, img, dx, dy, dw, dh, tint ? _tintWithAlpha(tint, 0.45) : null);
    ctx.restore();
}

// 이동 벡터 → 8방향 이름
// 연속 벡터(적 → 플레이어 같은 실수 좌표차) → 8방향.
// ⚠️ 적 AI에서 dirFromVec(Math.sign(dx), Math.sign(dy))를 쓰면 안 된다.
//    dx/dy가 정확히 0이 되는 일은 거의 없어서 sign이 항상 ±1 → 대각선 4방향만 나온다.
//    (dirFromVec은 키 입력 전용 — 방향키는 실제로 0이 나오므로 그쪽은 문제없음)
const DIR_BY_SECTOR = ["east", "south-east", "south", "south-west", "west", "north-west", "north", "north-east"];
function dirFromAngle(dx, dy) {
    if (dx === 0 && dy === 0) return null;
    let i = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)); // 45도씩 8구간 (화면 좌표라 +y가 south)
    if (i < 0) i += 8;
    return DIR_BY_SECTOR[i % 8];
}

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
