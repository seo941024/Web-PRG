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
}
