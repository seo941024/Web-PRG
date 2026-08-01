// equip.js — 무기/방어구 장비 시스템
// 잡몹에서 낮은 확률로, 스테이지(보스) 클리어 시엔 확정으로 획득한다.
// 슬롯은 무기 1 / 방어구 1로 고정 — 주우면 즉시 장착되고 기존 장비는 버려진다(로그라이트 방식).
//
// 티어는 스테이지 테마 번호(1~5)와 맞춰져 있어서, 진행할수록 자연히 상위 장비가 나온다.
//   무기   : atk(고정 공격력) / atkSpd(공속 배율 가산) / crit(치명타율 가산)
//   방어구 : def(고정 피해 감산) / maxHp(최대체력 가산) / moveSpd(이동속도 배율 가산)

// 티어 접두사는 무기·방어구 양쪽에 자연스럽게 붙는 표현으로 고름.
// 아래 풀의 name에는 접두사와 겹치는 수식어를 넣지 말 것 ("마왕의 마왕의 흉갑" 같은 중복 방지).
const EQUIP_TIER_NAMES = ["", "낡은", "단단한", "저주받은", "불타는", "마왕의"];
const EQUIP_TIER_COLORS = ["", "#9aa08c", "#cfd6e6", "#b56bff", "#ff8a3a", "#ff3355"];

const WEAPON_POOL = [
    // tier 1 — 고블린 소굴
    { tier: 1, name: "단검",         atk: 2,  atkSpd: 0.04, crit: 0.02 },
    { tier: 1, name: "고블린 손도끼", atk: 4,  atkSpd: 0.00, crit: 0.00 },
    // tier 2 — 스켈레톤 요새
    { tier: 2, name: "뼈 세공 단검",  atk: 5,  atkSpd: 0.08, crit: 0.03 },
    { tier: 2, name: "늑골 검",       atk: 8,  atkSpd: 0.02, crit: 0.01 },
    // tier 3 — 언데드 무덤
    { tier: 3, name: "망령의 쌍검",   atk: 9,  atkSpd: 0.14, crit: 0.05 },
    { tier: 3, name: "묘지기의 낫",   atk: 14, atkSpd: 0.02, crit: 0.03 },
    // tier 4 — 화산 지대
    { tier: 4, name: "용암 단검",     atk: 15, atkSpd: 0.18, crit: 0.06 },
    { tier: 4, name: "화산암 대검",   atk: 22, atkSpd: 0.02, crit: 0.04 },
    // tier 5 — 마왕성
    { tier: 5, name: "송곳니 쌍검",   atk: 24, atkSpd: 0.24, crit: 0.10 },
    { tier: 5, name: "참격 대검",     atk: 34, atkSpd: 0.06, crit: 0.06 },
];

const ARMOR_POOL = [
    // tier 1
    { tier: 1, name: "가죽 조각",     def: 1, maxHp: 10, moveSpd: 0.02 },
    { tier: 1, name: "나무 방패",     def: 2, maxHp: 5,  moveSpd: 0.00 },
    // tier 2
    { tier: 2, name: "뼈 갑주",       def: 3, maxHp: 20, moveSpd: 0.02 },
    { tier: 2, name: "요새 흉갑",     def: 5, maxHp: 10, moveSpd: 0.00 },
    // tier 3
    { tier: 3, name: "수의",          def: 4, maxHp: 35, moveSpd: 0.06 },
    { tier: 3, name: "묘석 갑주",     def: 8, maxHp: 20, moveSpd: 0.00 },
    // tier 4
    { tier: 4, name: "흑요석 갑주",   def: 11, maxHp: 40, moveSpd: 0.02 },
    { tier: 4, name: "재의 망토",     def: 6,  maxHp: 30, moveSpd: 0.10 },
    // tier 5
    { tier: 5, name: "흉갑",         def: 16, maxHp: 60, moveSpd: 0.04 },
    { tier: 5, name: "암흑 외투",     def: 10, maxHp: 45, moveSpd: 0.14 },
];

// 스테이지 → 장비 티어. 장비 풀은 5티어인데 스테이지는 10개라 2스테이지당 1티어씩 오른다.
// (stageN을 그대로 티어로 쓰면 5스테이지부터 계속 최고 티어만 나와서 후반 절반이 성장 없이 정체됨)
const EQUIP_MAX_TIER = EQUIP_TIER_NAMES.length - 1;   // 5
function stageTier(stageN) {
    return Math.min(EQUIP_MAX_TIER, Math.max(1, Math.ceil(stageN / 2)));
}

// 티어에 맞는 장비 하나를 무작위로 뽑음. 해당 티어가 비었으면 가장 가까운 하위 티어로 폴백.
function rollEquip(kind, tier) {
    const pool = kind === "weapon" ? WEAPON_POOL : ARMOR_POOL;
    let t = Math.min(Math.max(tier, 1), EQUIP_TIER_NAMES.length - 1);
    let cands = pool.filter(x => x.tier === t);
    while (cands.length === 0 && t > 1) { t--; cands = pool.filter(x => x.tier === t); }
    if (cands.length === 0) return null;
    const base = cands[Math.floor(Math.random() * cands.length)];
    return { kind, ...base };
}

function equipDisplayName(eq) {
    return `${EQUIP_TIER_NAMES[eq.tier]} ${eq.name}`;
}
function equipColor(eq) {
    return EQUIP_TIER_COLORS[eq.tier] || "#ffffff";
}

// ── 가방(인벤토리) ─────────────────────────────────────────
// 주운 장비는 곧바로 장착하지 않고 가방에 쌓인다. 착용/해제는 [I] 화면에서 직접 한다.
// (예전엔 주우면 즉시 장착돼서, 더 좋은 장비를 모르고 덮어쓰는 일이 잦았다)
const BAG_SIZE = 12;

// 방어구는 최대체력을 바꾸므로, 착용 상태가 변할 때마다 여기서 한 번에 다시 계산한다.
// 여러 곳에서 Player.maxHp를 직접 만지면 영구강화·유물 보정과 어긋나기 쉬워 한 곳으로 모음.
function refreshMaxHp(prevArmorHp) {
    const prof = classProfile(Game.pClass);
    const base = Math.round(PLAYER_BASE_MAX_HP * (prof.hpMul || 1));
    const permHp = (Game.permHpLvl || 0) * 10;
    const armorHp = Game.equip.armor ? Game.equip.armor.maxHp : 0;
    const before = Player.maxHp;
    Player.maxHp = base + permHp + armorHp + (Game.pRelicMaxHp || 0);
    // 최대체력이 늘면 늘어난 만큼 즉시 회복(교체가 손해로 느껴지지 않게), 줄면 상한에 맞춤
    const delta = Player.maxHp - before;
    if (delta > 0) Player.hp = Math.min(Player.maxHp, Player.hp + delta);
    else Player.hp = Math.min(Player.hp, Player.maxHp);
}

// 가방에 넣기 — 가득 찼으면 false를 돌려주고, 호출부가 "가방이 가득 찼다"고 알린다
function bagAdd(eq) {
    if (!eq) return false;
    if (Game.bag.length >= BAG_SIZE) return false;
    Game.bag.push(eq);
    return true;
}

// 가방의 i번째를 착용. 착용 중이던 같은 부위 장비는 가방의 그 자리로 들어간다(맞바꿈).
function equipFromBag(i) {
    const eq = Game.bag[i];
    if (!eq) return;
    const prev = Game.equip[eq.kind];
    Game.equip[eq.kind] = eq;
    if (prev) Game.bag[i] = prev; else Game.bag.splice(i, 1);
    refreshMaxHp();
    if (typeof playSfx === 'function') playSfx('item');
}

// 착용 해제 — 가방에 자리가 없으면 벗지 못한다(장비를 잃지 않게)
function unequipToBag(kind) {
    const eq = Game.equip[kind];
    if (!eq) return false;
    if (Game.bag.length >= BAG_SIZE) return false;
    Game.bag.push(eq);
    Game.equip[kind] = null;
    refreshMaxHp();
    if (typeof playSfx === 'function') playSfx('item');
    return true;
}

// 가방에서 버리기
function dropFromBag(i) {
    if (!Game.bag[i]) return;
    Game.bag.splice(i, 1);
    if (typeof playSfx === 'function') playSfx('menu_select');
}

// 장비 장착 (직접 착용이 필요한 경우용) — 기존 장비는 가방으로, 자리 없으면 버려진다
function equipItem(eq) {
    const prev = Game.equip[eq.kind];
    Game.equip[eq.kind] = eq;
    if (prev) bagAdd(prev);
    refreshMaxHp();
    addText(Player.x, Player.y - 34, equipDisplayName(eq) + " 장착!", equipColor(eq), 70, 13);
    for (let i = 0; i < 12; i++) addPart(Player.x, Player.y - 10, equipColor(eq), 22, 3);
}

// ── 장착 장비의 합산 보정치 (전투 계산에서 참조) ──
function equipAtk()     { return Game.equip.weapon ? Game.equip.weapon.atk     : 0; }
function equipAtkSpd()  { return Game.equip.weapon ? Game.equip.weapon.atkSpd  : 0; }
function equipCrit()    { return Game.equip.weapon ? Game.equip.weapon.crit    : 0; }
function equipDef()     { return Game.equip.armor  ? Game.equip.armor.def      : 0; }
function equipMoveSpd() { return Game.equip.armor  ? Game.equip.armor.moveSpd  : 0; }
