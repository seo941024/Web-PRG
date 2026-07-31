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

// 장비 장착 — 기존 장비는 버려지고, 방어구는 최대체력이 바뀌므로 현재 체력도 같이 보정한다.
function equipItem(eq) {
    const prev = Game.equip[eq.kind];
    Game.equip[eq.kind] = eq;
    if (eq.kind === "armor") {
        const prevBonus = prev ? prev.maxHp : 0;
        const delta = eq.maxHp - prevBonus;
        Player.maxHp = PLAYER_BASE_MAX_HP + eq.maxHp;
        // 최대체력이 늘면 그만큼 즉시 회복(장비 교체가 손해로 느껴지지 않게), 줄면 상한에 맞춰 깎음
        if (delta > 0) Player.hp = Math.min(Player.maxHp, Player.hp + delta);
        else Player.hp = Math.min(Player.hp, Player.maxHp);
    }
    addText(Player.x, Player.y - 34, equipDisplayName(eq) + " 장착!", equipColor(eq), 70, 13);
    for (let i = 0; i < 12; i++) addPart(Player.x, Player.y - 10, equipColor(eq), 22, 3);
}

// ── 장착 장비의 합산 보정치 (전투 계산에서 참조) ──
function equipAtk()     { return Game.equip.weapon ? Game.equip.weapon.atk     : 0; }
function equipAtkSpd()  { return Game.equip.weapon ? Game.equip.weapon.atkSpd  : 0; }
function equipCrit()    { return Game.equip.weapon ? Game.equip.weapon.crit    : 0; }
function equipDef()     { return Game.equip.armor  ? Game.equip.armor.def      : 0; }
function equipMoveSpd() { return Game.equip.armor  ? Game.equip.armor.moveSpd  : 0; }
