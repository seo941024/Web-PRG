// input.js — 키보드 입력 (탑다운)
// dn() : 눌려있는 동안 계속 true (이동·스프린트처럼 유지형 입력)
// pr() : 누른 그 프레임에만 true (메뉴 선택·일시정지처럼 1회성 입력)
//
// pr()은 "이전 프레임 상태"와 비교하는 방식이라, 게임 루프의 고정 스텝마다
// endFrameInput()으로 스냅샷을 갱신해줘야 한다. (main.js의 step() 마지막에서 호출)

const K = {};
const KPrev = {};

addEventListener("keydown", e => {
    K[e.code] = true;
    // 스페이스·화살표의 브라우저 기본 스크롤을 막아야 화면이 튀지 않음
    if (e.code === "Space" || e.code.startsWith("Arrow")) e.preventDefault();
});
addEventListener("keyup", e => { K[e.code] = false; });
// 창 포커스를 잃으면 눌린 키가 박혀서 캐릭터가 계속 걸어가버리므로 전부 해제
addEventListener("blur", () => { for (const k in K) K[k] = false; });

const dn = (...codes) => codes.some(c => K[c]);
const pr = (...codes) => codes.some(c => K[c] && !KPrev[c]);

function endFrameInput() {
    for (const k in K) KPrev[k] = K[k];
    // 클릭은 눌린 그 프레임에만 true — 키보드 pr()과 같은 방식
    Mouse.clicked = false;
    Mouse.rightClicked = false;
}

// ── 마우스 ─────────────────────────────────────────────────
// 인벤토리처럼 격자를 다루는 UI는 키보드보다 마우스가 직관적이라 별도로 받는다.
// 좌표는 "캔버스 픽셀" 기준으로 저장하고, UI 코드는 UI_SCALE로 나눠 논리좌표(UW×UH)로 쓴다.
// (캔버스가 CSS로 늘어나 있을 수 있어 표시 크기 대비 실제 해상도 비율을 곱해야 한다)
const Mouse = { x: -999, y: -999, down: false, clicked: false, rightClicked: false };

function _toCanvas(e) {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    Mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
    Mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
}
addEventListener("mousemove", _toCanvas);
addEventListener("mousedown", e => {
    _toCanvas(e);
    if (e.button === 0) { Mouse.down = true; Mouse.clicked = true; }
    else if (e.button === 2) Mouse.rightClicked = true;
});
addEventListener("mouseup", e => { if (e.button === 0) Mouse.down = false; });
// 인벤토리에서 우클릭을 쓰므로 캔버스 위 기본 컨텍스트 메뉴는 막는다
canvas.addEventListener("contextmenu", e => e.preventDefault());

// UI 논리좌표(UW×UH)로 변환한 마우스 위치
function mouseUI() { return { x: Mouse.x / UI_SCALE, y: Mouse.y / UI_SCALE }; }
// 논리좌표 사각형 안에 마우스가 있는지
function mouseIn(x, y, w, h) {
    const m = mouseUI();
    return m.x >= x && m.x < x + w && m.y >= y && m.y < y + h;
}
