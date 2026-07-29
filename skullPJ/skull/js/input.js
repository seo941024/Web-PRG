// input.js — 키보드 입력 (탑다운)

const K = {};
addEventListener("keydown", e => { K[e.code] = true; if (e.code === "Space") e.preventDefault(); });
addEventListener("keyup",   e => { K[e.code] = false; });
const dn = (...codes) => codes.some(c => K[c]);
