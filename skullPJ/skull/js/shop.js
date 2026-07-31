// shop.js — 다크 쿼츠 영구강화 (런 간 성장)
// 유물(relic.js)은 한 런에서만 유지되고, 여기서 산 강화는 localStorage에 저장돼 영구히 남는다.
// 레벨 키는 skull_V1과 동일하게 유지해서 기존 세이브를 그대로 이어 쓴다.
//
// 진입: 메뉴 화면에서 S. 적용: 런 시작 시 resetRun()이 applyPermUpgrades()를 호출.

const PERM_MAX_LVL = 10;

const PERM_UPGRADES = [
    { key: "permHpLvl",     name: "생명력",   desc: "최대 체력 +10",     color: "#ff6a4d",
      apply: (g, lvl) => { Player.maxHp += lvl * 10; } },
    { key: "permAtkLvl",    name: "공격력",   desc: "공격력 +2",         color: "#ff9c2b",
      apply: (g, lvl) => { g.pAtkBonus += lvl * 2; } },
    { key: "permDefLvl",    name: "방어력",   desc: "방어력 +1",         color: "#4da3ff",
      apply: (g, lvl) => { g.pDefBonus += lvl * 1; } },
    { key: "permCritLvl",   name: "치명타",   desc: "치명타율 +2%",      color: "#ff88cc",
      apply: (g, lvl) => { g.pCritBonus += lvl * 0.02; } },
    { key: "permAtkSpdLvl", name: "공격속도", desc: "공격속도 +4%",      color: "#ffe066",
      apply: (g, lvl) => { g.pAtkSpdBonus += lvl * 0.04; } },
    { key: "permSpdLvl",    name: "이동속도", desc: "이동속도 +3%",      color: "#44ffee",
      apply: (g, lvl) => { g.pMoveSpdBonus += lvl * 0.03; } },
];

// 다음 레벨 구입 비용 — 레벨이 오를수록 비싸짐
function permCost(lvl) { return 20 + lvl * 15; }

function saveProgress() {
    localStorage.setItem("skull_quartz", Game.darkQuartz);
    PERM_UPGRADES.forEach(u => localStorage.setItem(_permStorageKey(u.key), Game[u.key]));
}

// core.js가 읽는 localStorage 키와 1:1로 맞춤 (permHpLvl → skull_permHp)
function _permStorageKey(key) {
    return "skull_" + key.replace(/Lvl$/, "");
}

// 런 시작 시 구매한 영구강화를 실제 스탯에 반영
function applyPermUpgrades() {
    PERM_UPGRADES.forEach(u => {
        const lvl = Game[u.key] || 0;
        if (lvl > 0) u.apply(Game, lvl);
    });
}

function openShop() {
    Game.shopIdx = 0;
    Game.gs = "shop";
    if (typeof playBGM === 'function') playBGM('upgrade');
}

// 상점은 3열 그리드로 그리므로(ui.js renderShop) 좌우는 1칸, 상하는 한 행(3칸)씩 이동
const SHOP_COLS = 3;

function updateShop() {
    const n = PERM_UPGRADES.length;
    const move = (d) => { Game.shopIdx = (Game.shopIdx + d + n) % n; if (typeof playSfx === 'function') playSfx('menu_select'); };
    if (pr("ArrowLeft", "KeyA"))  move(-1);
    if (pr("ArrowRight", "KeyD")) move(1);
    if (pr("ArrowUp", "KeyW"))    move(-SHOP_COLS);
    if (pr("ArrowDown", "KeyS"))  move(SHOP_COLS);

    if (pr("Space", "Enter", "KeyC")) {
        const u = PERM_UPGRADES[Game.shopIdx];
        const lvl = Game[u.key] || 0;
        if (lvl >= PERM_MAX_LVL) {
            Game.shopMsg = { text: "더 올릴 수 없다", col: "#ff8866", t: 90 };
        } else {
            const cost = permCost(lvl);
            if (Game.darkQuartz < cost) {
                Game.shopMsg = { text: `쿼츠가 모자란다 — ${cost} 필요`, col: "#ff8866", t: 90 };
                if (typeof playSfx === 'function') playSfx('hit');
            } else {
                Game.darkQuartz -= cost;
                Game[u.key] = lvl + 1;
                saveProgress();
                Game.shopMsg = { text: `${u.name} Lv.${lvl + 1} — 힘이 새겨졌다`, col: "#66ff99", t: 90 };
                if (typeof playSfx === 'function') playSfx('unlock');
            }
        }
    }

    if (pr("Escape", "KeyX")) {
        Game.gs = "menu";
        if (typeof playBGM === 'function') playBGM('lobby');
    }
    if (Game.shopMsg && Game.shopMsg.t > 0) Game.shopMsg.t--;
}
