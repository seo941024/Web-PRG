// relic.js — 유물 (런 내 강화)
// skull_V1 upgrade_shop.js의 "유물 = 런 한정 일회성 강화, 공격력은 %로 적용" 설계를 이어받되,
// 탑다운에서 실제로 동작하는 효과만 골라 24종으로 재구성했다.
//
// 획득 시점: 보스(라운드 3) 격파 직후 3장 중 1장 선택 (Game.gs = "relic")
// 효과 구현 방식 2가지:
//   1) 즉시 스탯 가산 — apply(g)에서 Game 필드를 직접 올림
//   2) 런타임 훅 — Game에 플래그를 세우고, 해당 로직 지점에서 그 플래그를 읽음
//      (훅 위치는 각 유물 주석에 표기 — 나중에 밸런스 조정할 때 찾기 쉽게)

const RELIC_RARITY = {
    common:    { name: "일반",   color: "#cfd6e6", weight: 60 },
    rare:      { name: "희귀",   color: "#4da3ff", weight: 30 },
    legendary: { name: "전설",   color: "#ffb02e", weight: 10 },
};

const RELICS = [
    // ── 일반 ────────────────────────────────────────────────
    { id: "sharp_fang",  rarity: "common", name: "날카로운 이빨",   desc: "공격력 +4",
      apply: g => { g.pAtkBonus += 4; } },
    { id: "iron_hide",   rarity: "common", name: "무쇠 가죽",       desc: "방어력 +3",
      apply: g => { g.pDefBonus += 3; } },
    { id: "swift_boots", rarity: "common", name: "날랜 발놀림",     desc: "이동속도 +10%",
      apply: g => { g.pMoveSpdBonus += 0.10; } },
    { id: "light_grip",  rarity: "common", name: "가벼운 손잡이",   desc: "공격속도 +10%",
      apply: g => { g.pAtkSpdBonus += 0.10; } },
    { id: "thick_bone",  rarity: "common", name: "굵은 뼈대",       desc: "최대 체력 +25 (즉시 회복)",
      apply: g => { Player.maxHp += 25; Player.hp = Math.min(Player.maxHp, Player.hp + 25); } },
    { id: "keen_eye",    rarity: "common", name: "매서운 눈",       desc: "치명타율 +8%",
      apply: g => { g.pCritBonus += 0.08; } },
    { id: "grave_robber",rarity: "common", name: "도굴꾼의 손",     desc: "아이템 드롭률 +15%",
      apply: g => { g.pDropRate += 0.15; } },
    { id: "quartz_vein", rarity: "common", name: "쿼츠 광맥",       desc: "다크 쿼츠 획득 +50%",
      apply: g => { g.pQuartzMul += 0.5; } },
    { id: "heavy_swing", rarity: "common", name: "묵직한 스윙",     desc: "넉백 +80%",
      apply: g => { g.pKnockbackMul += 0.8; } },   // 훅: combat.js hitE 넉백 계산

    // ── 희귀 ────────────────────────────────────────────────
    { id: "blood_thirst",rarity: "rare", name: "피에 대한 갈증",    desc: "공격 시 25% 확률로 체력 3 회복",
      apply: g => { g.pLifesteal += 0.25; } },      // 훅: combat.js hitE
    { id: "thorn_mail",  rarity: "rare", name: "가시 갑옷",         desc: "피격 시 가해자에게 12 반사",
      apply: g => { g.pThorns += 12; } },           // 훅: player.js hitPlayer
    { id: "regen_core",  rarity: "rare", name: "재생하는 심핵",     desc: "3초마다 체력 4 회복",
      apply: g => { g.pRegen += 4; } },             // 훅: main.js step()
    { id: "magnet_soul", rarity: "rare", name: "끌어당기는 영혼",   desc: "아이템 자동 수집 범위 대폭 증가",
      apply: g => { g.pMagnet += 110; } },          // 훅: combat.js updateItems
    { id: "combo_master",rarity: "rare", name: "연격의 극의",       desc: "콤보 피니시 피해 배율 1.7 → 2.4",
      apply: g => { g.pFinisherMul += 0.7; } },     // 훅: player.js tryPlayerAttack
    { id: "crit_fang",   rarity: "rare", name: "처형자의 송곳니",   desc: "치명타 피해 200% → 280%",
      apply: g => { g.pCritDmg += 0.8; } },         // 훅: player.js tryPlayerAttack
    { id: "ghost_step",  rarity: "rare", name: "유령 걸음",         desc: "회피 스태미나 소모 -40%, 무적 시간 증가",
      apply: g => { g.pDashCostMul *= 0.6; g.pDashInvBonus += 10; } }, // 훅: player.js updatePlayer
    { id: "clear_feast", rarity: "rare", name: "정화의 만찬",       desc: "적을 전멸시키면 체력 20 회복",
      apply: g => { g.pHealOnClear += 20; } },      // 훅: main.js nextStage
    { id: "war_forge",   rarity: "rare", name: "전쟁의 화로",       desc: "공격력 +8, 공격속도 +8%",
      apply: g => { g.pAtkBonus += 8; g.pAtkSpdBonus += 0.08; } },
    { id: "chill_aura",  rarity: "rare", name: "한기의 오라",       desc: "주변 적의 이동속도 30% 감소",
      apply: g => { g.pSlowAura = true; } },        // 훅: mob.js updateEnemies

    // ── 전설 ────────────────────────────────────────────────
    { id: "death_bloom", rarity: "legendary", name: "죽음의 개화",  desc: "적 처치 시 주변에 폭발 (피해 22)",
      apply: g => { g.pKillExplode += 22; } },      // 훅: mob.js onEnemyDeath
    { id: "second_life", rarity: "legendary", name: "두 번째 생",   desc: "사망 시 체력 50%로 1회 부활",
      apply: g => { g.pRevive += 1; } },            // 훅: player.js hitPlayer
    { id: "aegis_clear", rarity: "legendary", name: "불굴의 방벽",  desc: "적을 전멸시키면 보호막 30 획득",
      apply: g => { g.pShieldOnClear += 30; } },    // 훅: main.js nextStage / player.js hitPlayer
    { id: "titan_blood", rarity: "legendary", name: "거인의 피",    desc: "최대 체력 +60, 방어력 +6 (즉시 회복)",
      apply: g => { Player.maxHp += 60; Player.hp = Math.min(Player.maxHp, Player.hp + 60); g.pDefBonus += 6; } },
    { id: "berserk_gene",rarity: "legendary", name: "광포한 유전자",desc: "체력이 낮을수록 피해 증가 (최대 +60%)",
      apply: g => { g.pLowHpDmg = true; } },        // 훅: player.js tryPlayerAttack
];

function relicById(id) { return RELICS.find(r => r.id === id); }

// 아직 얻지 않은 유물 중에서 희귀도 가중치로 n개 추첨 (중복 없음)
function rollRelicChoices(n) {
    const owned = new Set(Game.relics.map(r => r.id));
    const pool = RELICS.filter(r => !owned.has(r.id));
    const out = [];
    for (let i = 0; i < n && pool.length > 0; i++) {
        const total = pool.reduce((s, r) => s + RELIC_RARITY[r.rarity].weight, 0);
        let roll = Math.random() * total;
        let pick = pool.length - 1;
        for (let j = 0; j < pool.length; j++) {
            roll -= RELIC_RARITY[pool[j].rarity].weight;
            if (roll <= 0) { pick = j; break; }
        }
        out.push(pool[pick]);
        pool.splice(pick, 1);
    }
    return out;
}

// 보스 격파 직후 호출 — 선택 화면으로 전환
function openRelicSelect() {
    Game.relicChoices = rollRelicChoices(3);
    if (Game.relicChoices.length === 0) { advanceAfterRelic(); return; } // 전부 모았으면 스킵
    Game.relicIdx = 0;
    Game.gs = "relic";
    if (typeof playBGM === 'function') playBGM('upgrade');
}

function acquireRelic(relic) {
    Game.relics.push(relic);
    relic.apply(Game);
    if (typeof playSfx === 'function') playSfx('unlock');
}

// 유물 선택 화면 입력 처리 (main.js의 step에서 gs === "relic"일 때 호출)
function updateRelicSelect() {
    const n = Game.relicChoices.length;
    if (pr("ArrowLeft", "KeyA"))  { Game.relicIdx = (Game.relicIdx - 1 + n) % n; if (typeof playSfx === 'function') playSfx('menu_select'); }
    if (pr("ArrowRight", "KeyD")) { Game.relicIdx = (Game.relicIdx + 1) % n;     if (typeof playSfx === 'function') playSfx('menu_select'); }
    if (pr("Space", "Enter", "KeyC")) {
        acquireRelic(Game.relicChoices[Game.relicIdx]);
        Game.relicChoices = [];
        advanceAfterRelic();
    }
}
