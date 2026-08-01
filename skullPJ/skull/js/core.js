// core.js — 게임 전역 상태 (탑다운 재구축)
// 영구 재화·직업 관련 필드는 기존 사이드스크롤 버전(_legacy_sidescroller/js/core.js)에서 그대로 이식.
// 물리 상수(GRAV, TILE)는 탑다운에 불필요해 제거.
//
// 확정 로스터/번호 (검사·조커 삭제, 혈귀는 히든 캐릭터):
//   0 성기사(팔라딘)  1 도적  2 마법사  3 버서커  4 발키리  5 혈귀(히든)
// CLASS_PROFILE·sprites/raw/<번호>/ 폴더는 이 번호에 맞춰서 만들 것.

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const CW = canvas.width, CH = canvas.height;
const ZOOM = 2; // 게임 월드 확대 배율 — 정수 배율이라 도트가 균일하게 늘어나 완전히 선명함

// ── UI 스케일 ──────────────────────────────────────────────
// 1280×720 캔버스에 UI를 1:1로 그리면 화면만 크고 글씨·패널이 잘아 보인다("웹게임" 인상의 원인).
// UI만 통째로 확대해서 그리고, UI 코드는 축소된 논리 해상도(UW×UH) 기준으로 좌표를 쓴다.
// 월드 렌더는 ZOOM을 따로 쓰므로 영향 없음.
const UI_SCALE = 1.35;
const UW = Math.round(CW / UI_SCALE);   // UI 논리 폭  (약 948)
const UH = Math.round(CH / UI_SCALE);   // UI 논리 높이 (약 533)

// UI를 그리기 직전에 호출 — 이후 좌표는 UW×UH 기준
function uiBegin() { ctx.setTransform(UI_SCALE, 0, 0, UI_SCALE, 0, 0); }
// UI가 끝나고 원래 화면 좌표로 되돌릴 때
function uiEnd() { ctx.setTransform(1, 0, 0, 1, 0, 0); }

// ── UI 색 팔레트 ───────────────────────────────────────────
// 예전 색들은 채도가 너무 높아(네온 보라 테두리, 형광 빨강/노랑 게이지) 다크 판타지 톤과 안 맞았다.
// 여기 한 곳에서만 관리하고, 전체적으로 탁하고 어둡게 — 강조는 채도가 아니라 명도 차이로 준다.
// 바탕은 채도가 거의 없는 돌·가죽 톤으로 두고, 색은 "내용"이 담당하게 한다.
// (예전엔 UIC 자체가 보라 계열이라 무엇을 그려도 화면 전체가 보랏빛으로 물들었다.
//  등급 색·직업 색처럼 의미 있는 색만 튀어야 정보가 읽힌다)
const UIC = {
    line:    "#7a6a52",   // 패널 테두리 — 낡은 청동/가죽
    lineDim: "#4a4138",   // 비활성 테두리
    text:    "#e6e0d4",   // 본문 (살짝 따뜻한 흰색)
    label:   "#9a9184",   // 라벨(설명)
    faint:   "#645b50",   // 흐린 보조
    accent:  "#d4a94e",   // 금색 강조
    good:    "#7fbf8a",
    bad:     "#c06a63",
    // 패널 본체 — 두 단계 평면 색
    panel:   ["#221f1b", "#16140f"],
    slot:    "#141210",   // 인벤토리 칸 바닥
    hp:      ["#b45a4a", "#5e1c16"],  // 게이지 [위, 아래]
    stam:    ["#bfa055", "#5e4a18"],
    stamLow: ["#6e5c30", "#3a2e10"],
    shield:  ["#7fa8c4", "#2c4a60"],
};

// 채도가 높은 직업/테마 색을 UI에서 쓸 때 한 톤 죽인다
function uiMute(hex, amt) {
    if (!hex || hex[0] !== "#" || hex.length < 7) return hex;
    const f = amt === undefined ? 0.45 : amt;
    let r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    const gray = (r * 0.299 + g * 0.587 + b * 0.114);
    r = Math.round(r + (gray - r) * f);
    g = Math.round(g + (gray - g) * f);
    b = Math.round(b + (gray - b) * f);
    const h = (v) => v.toString(16).padStart(2, "0");
    return `#${h(r)}${h(g)}${h(b)}`;
}

// 게임 상태(gs) 전이도:
//   menu ─SPACE→ cutscene(opening) ─→ play
//   play ─보스격파→ cutscene(bosskill) ─→ relic ─→ play (다음 스테이지)
//                                              └(5스테이지면)→ cutscene(ending) → menu
//   play ─사망→ dead ─R→ play(새 런) / ─ESC→ menu
//   play ─ESC→ paused ─ESC→ play / ─Q→ menu
//   menu ─S→ shop ─ESC→ menu
const Game = {
    gs: "menu",
    score: 0,
    // 스테이지 진행: 10테마(stageN) × 3라운드(roundN) = 총 30스테이지. 정의는 stage.js.
    kills: 0, stageN: 1, roundN: 1,
    camShake: 0,
    isMuted: false,
    showKeys: false,      // [H] 조작법 오버레이 (열려 있는 동안 게임 정지)
    // 히트 콤보 — 실제로 맞힌 횟수(허공 스윙은 안 셈). Player.combo(4타 스윙 순번)와 별개.
    hitCombo: 0, hitComboT: 0, hitComboBest: 0,
    pClass: 1,            // 임시 기본값: 도적 (스프라이트 있는 직업)

    // ── 영구 진행 (localStorage, 런을 넘어 유지) ──
    // 키 이름은 skull_V1과 동일하게 유지해서 기존 세이브를 그대로 이어 씀
    darkQuartz: parseInt(localStorage.getItem("skull_quartz")) || 0,
    permHpLvl: parseInt(localStorage.getItem("skull_permHp")) || 0,
    permAtkLvl: parseInt(localStorage.getItem("skull_permAtk")) || 0,
    permCritLvl: parseInt(localStorage.getItem("skull_permCrit")) || 0,
    permSpdLvl: parseInt(localStorage.getItem("skull_permSpd")) || 0,
    permDefLvl: parseInt(localStorage.getItem("skull_permDef")) || 0,
    permAtkSpdLvl: parseInt(localStorage.getItem("skull_permAtkSpd")) || 0,
    totalEliteKills: parseInt(localStorage.getItem("skull_eliteKills")) || 0,

    // 오브젝트 풀 (combat.js의 getObj가 사용)
    pBullets: [], // 플레이어 투사체 — 마법사·발키리 평타와 일부 스킬이 사용
    eBullets: [], parts: [], texts: [], items: [],
    enemies: [],
    doors: [],   // 스테이지 진행용 문 — main.js의 buildRoom()이 방마다 새로 채움
    hazards: [], // 지면 장판(예고 → 폭발) — 화산/마왕 보스 패턴이 사용

    // ── 런 스코프 스탯 (resetRun()이 전부 초기화) ──
    // 출처는 3가지: 영구강화(shop.js) + 드롭 아이템(combat.js) + 유물(relic.js)
    // 모두 같은 필드에 누적되고, 실제 전투 계산은 player.js가 여기에 장비 보너스를 더해 씀
    // 잡몹이 뭔가를 떨어뜨릴 확률. 방마다 10~20마리라 0.35는 아이템이 끝없이 쏟아졌다.
    // 기본 스펙(체력·공격력)을 올린 대신 이걸 낮춰서, 성장은 장비·유물·영구강화로 몰아준다.
    pDropRate: 0.18,
    pEquipDropRate: 0.06, // 잡몹에서 무기·방어구가 나올 확률 (엘리트는 별도 상향)
    pAtkBonus: 0,       // 평타 데미지 고정 가산
    pDefBonus: 0,       // 피격 데미지 고정 감산
    pAtkSpdBonus: 0,    // 공격속도 배율 가산
    pMoveSpdBonus: 0,   // 이동속도 배율 가산
    pCritBonus: 0,      // 치명타율 가산
    pCritDmg: 2.0,      // 치명타 배율 (기본 200%)
    pFinisherMul: 1.7,  // 콤보 4타 피니시 배율
    pLifesteal: 0,      // 공격 시 회복 확률
    pThorns: 0,         // 피격 시 반사 피해
    pRegen: 0,          // 3초마다 회복량
    pMagnet: 0,         // 아이템 자동 수집 추가 범위
    pDashCostMul: 1,    // 회피 스태미나 소모 배율
    pDashInvBonus: 0,   // 회피 무적 추가 프레임
    pHealOnClear: 0,    // 구역 정화 시 회복량
    pShieldOnClear: 0,  // 구역 정화 시 보호막 획득량
    pShield: 0,         // 현재 보호막 (HP보다 먼저 소모)
    pRevive: 0,         // 남은 부활 횟수
    pKillExplode: 0,    // 처치 시 폭발 피해
    pKnockbackMul: 1,   // 넉백 배율
    pQuartzMul: 1,      // 다크 쿼츠 획득 배율
    pSlowAura: false,   // 주변 적 감속
    pLowHpDmg: false,   // 체력 낮을수록 피해 증가
    regenT: 0,

    // 장비 슬롯 (equip.js) — 무기·방어구 각 1개. 주운 장비는 가방에 쌓이고 [I]에서 직접 착용한다
    equip: { weapon: null, armor: null },
    bag: [],              // 가방 (최대 BAG_SIZE칸)
    invIdx: 0,            // 인벤토리 커서
    invOnEquip: false,    // 커서가 장착칸(무기/방어구)에 있는지
    showInv: false,       // [I] 인벤토리 열림 — 열려 있는 동안 게임 정지
    // 유물 (relic.js) — 런 한정, 보스 격파 시 3택 1
    relics: [], relicChoices: [], relicIdx: 0,
    // 상점 (shop.js)
    shopIdx: 0, shopMsg: null,
    // 컷신 (cutscene.js)
    cutscene: null,

    // 방 입장 시 스테이지 이름을 띄우는 배너 (main.js의 buildRoom이 설정)
    bannerT: 0, bannerText: "",

    // 스킬 (skill.js)
    skillPending: [],  // 다단히트/연사용 지연 실행 큐
    skillFx: [],       // 스킬 범위 링 이펙트
    chillT: 0,         // 마법사 서릿발 감속 지속시간
    classIdx: 1,       // 직업 선택 화면 커서 (기본 도적)

    // 방 구성(몹 수·배치) 난수 시드 — resetRun()에서 갱신되어 탐험마다 배치가 달라진다
    runSeed: (Date.now() ^ 0x9e3779b9) >>> 0,

    frameCount: 0,
};

// 런 스코프 상태를 전부 초기값으로 되돌린 뒤 영구강화를 다시 얹는다.
// 사망 후 재시작·메뉴에서 새 게임 시작 모두 이 함수를 거치므로, 런 한정 강화가 누적되지 않는다.
function resetRun() {
    Game.score = 0; Game.kills = 0;
    Game.stageN = 1; Game.roundN = 1;
    Game.camShake = 0;

    Game.pDropRate = 0.18;
    Game.pEquipDropRate = 0.06;
    Game.pAtkBonus = 0; Game.pDefBonus = 0;
    Game.pAtkSpdBonus = 0; Game.pMoveSpdBonus = 0;
    Game.pCritBonus = 0; Game.pCritDmg = 2.0;
    Game.pFinisherMul = 1.7;
    Game.pLifesteal = 0; Game.pThorns = 0; Game.pRegen = 0; Game.pMagnet = 0;
    Game.pDashCostMul = 1; Game.pDashInvBonus = 0;
    Game.pHealOnClear = 0; Game.pShieldOnClear = 0; Game.pShield = 0;
    Game.pRevive = 0; Game.pKillExplode = 0;
    Game.pKnockbackMul = 1; Game.pQuartzMul = 1;
    Game.pSlowAura = false; Game.pLowHpDmg = false;
    Game.regenT = 0;
    Game.hitCombo = 0; Game.hitComboT = 0; Game.hitComboBest = 0;
    Game.runSeed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0; // 새 탐험 = 새 배치

    Game.equip = { weapon: null, armor: null };
    Game.bag = []; Game.invIdx = 0; Game.invOnEquip = false; Game.showInv = false;
    Game.relics = []; Game.relicChoices = []; Game.relicIdx = 0;
    Game.skillPending = []; Game.skillFx = []; Game.chillT = 0;

    // 플레이어 초기화 — 최대체력은 직업 배율 → 영구강화 → 유물 순서로 쌓인다
    const prof = classProfile(Game.pClass);
    Player.maxHp = Math.round(PLAYER_BASE_MAX_HP * (prof.hpMul || 1));
    Player.speed = PLAYER_BASE_SPEED * (prof.spdMul || 1);
    Player.dead = false;
    Player.stamina = STAMINA_MAX;
    Player.invT = 0; Player.kbT = 0; Player.dashT = 0; Player.dashCD = 0;
    Player.atkT = 0; Player.atkAnim = 0; Player.atkCD = 0;
    Player.combo = 0; Player.comboRestT = 0; Player.comboWindowT = 0;
    Player.animName = "idle"; Player.animFrame = 0; Player.animT = 0;
    Player.skillCD = 0;
    // 혈귀는 흡혈이 직업 고유 특성 — 유물 흡혈과 합산된다
    Game.pLifesteal += (prof.innateLifesteal || 0);

    applyPermUpgrades();   // 영구강화 반영 (maxHp 등)
    Player.hp = Player.maxHp;

    // 오브젝트 풀 전부 비우기 — 이전 런의 탄·장판이 남아 있으면 새 런 시작 즉시 피격됨
    [Game.pBullets, Game.eBullets, Game.parts, Game.texts, Game.items, Game.enemies, Game.hazards]
        .forEach(pool => pool.forEach(o => o.active = false));
}

// ── 직업 프로필 ────────────────────────────────────────────
// 확정 로스터: 0 성기사 / 1 도적 / 2 마법사 / 3 버서커 / 4 발키리 / 5 혈귀
// range는 애니 동작 크기와 별개로 게임적 손맛을 위해 넉넉하게 잡는다(도적 원래 38 → 50).
//
// ⚠️ 스프라이트는 아직 도적(1)만 있다. 나머지 직업은 도적 원화를 tint 색으로 구분해 돌려쓴다
//    (몹과 같은 방식). 전용 스프라이트가 나오면 tint만 제거하면 된다.
//
// skill: Shift로 쓰는 직업 고유기. 구현은 skill.js의 CLASS_SKILLS.
const CLASS_PROFILE = {
    0: { name: "성기사", tint: "#ffd24a", desc: "느리지만 단단한 근접. 넓은 범위를 쓸어친다.",
         atkSpd: 0.95, range: 62, atkCD: 34, dmgMin: 24, dmgMax: 32, crit: 0.12,
         hpMul: 1.45, spdMul: 0.88, arc: 80, skillCD: 300 },
    1: { name: "도적",   tint: null,      desc: "초고속 쌍단검. 치명타로 녹인다. 대신 약하다.",
         atkSpd: 2.00, range: 50, atkCD: 20, dmgMin: 12, dmgMax: 19, crit: 0.35,
         hpMul: 0.85, spdMul: 1.15, arc: 60, skillCD: 240 },
    2: { name: "마법사", tint: "#5ab6ff", desc: "원거리 관통 마법탄. 몸이 약해 거리 유지가 생명.",
         atkSpd: 1.10, range: 300, atkCD: 30, dmgMin: 17, dmgMax: 24, crit: 0.18,
         hpMul: 0.75, spdMul: 1.00, arc: 30, ranged: true, shotSpeed: 8.5, skillCD: 300 },
    3: { name: "버서커", tint: "#ff5533", desc: "느리고 둔하지만 한 방이 무겁다. 체력이 깎일수록 강해진다.",
         atkSpd: 0.80, range: 66, atkCD: 40, dmgMin: 36, dmgMax: 50, crit: 0.10,
         hpMul: 1.30, spdMul: 0.86, arc: 90, rageDmg: true, skillCD: 330 },
    4: { name: "발키리", tint: "#c9d4e6", desc: "빠른 연사 원거리. 탄 하나하나는 약하다.",
         atkSpd: 1.85, range: 280, atkCD: 18, dmgMin: 10, dmgMax: 15, crit: 0.25,
         hpMul: 0.85, spdMul: 1.08, arc: 24, ranged: true, shotSpeed: 10, skillCD: 270 },
    5: { name: "혈귀",   tint: "#cc1f4a", desc: "피를 마시며 싸운다. 공격이 곧 회복.",
         atkSpd: 1.35, range: 56, atkCD: 26, dmgMin: 19, dmgMax: 29, crit: 0.22,
         hpMul: 1.05, spdMul: 1.05, arc: 70, innateLifesteal: 0.22, skillCD: 285 },
};
const CLASS_IDS = [0, 1, 2, 3, 4, 5];

function classProfile(id) {
    return CLASS_PROFILE[id] || CLASS_PROFILE[1];
}
// 스프라이트 없는 직업은 도적 원화에 색을 입혀 구분 (전용 원화 생기면 이 함수만 null 반환하게)
function classTint(id) {
    return classProfile(id).tint;
}

function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
}
