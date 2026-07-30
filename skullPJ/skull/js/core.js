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
    // 스테이지 진행: 5테마(stageN) × 3라운드(roundN) = 총 15스테이지. 정의는 stage.js.
    kills: 0, stageN: 1, roundN: 1,
    camShake: 0, hitStop: 0, invT: 0,
    isMuted: false,
    pClass: 1,            // 임시 기본값: 도적 (스프라이트 있는 직업)
    difficulty: 0,

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
    bullets: [], eBullets: [], lasers: [], parts: [], texts: [], items: [],
    enemies: [],
    doors: [],   // 스테이지 진행용 문 — main.js의 buildRoom()이 방마다 새로 채움
    hazards: [], // 지면 장판(예고 → 폭발) — 화산/마왕 보스 패턴이 사용

    // ── 런 스코프 스탯 (resetRun()이 전부 초기화) ──
    // 출처는 3가지: 영구강화(shop.js) + 드롭 아이템(combat.js) + 유물(relic.js)
    // 모두 같은 필드에 누적되고, 실제 전투 계산은 player.js가 여기에 장비 보너스를 더해 씀
    pDropRate: 0.35,
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

    // 장비 슬롯 (equip.js) — 무기·방어구 각 1개, 주우면 즉시 교체
    equip: { weapon: null, armor: null },
    // 유물 (relic.js) — 런 한정, 보스 격파 시 3택 1
    relics: [], relicChoices: [], relicIdx: 0,
    // 상점 (shop.js)
    shopIdx: 0, shopMsg: null,
    // 컷신 (cutscene.js)
    cutscene: null,

    // 방 입장 시 스테이지 이름을 띄우는 배너 (main.js의 buildRoom이 설정)
    bannerT: 0, bannerText: "",

    frameCount: 0,
};

// 런 스코프 상태를 전부 초기값으로 되돌린 뒤 영구강화를 다시 얹는다.
// 사망 후 재시작·메뉴에서 새 게임 시작 모두 이 함수를 거치므로, 런 한정 강화가 누적되지 않는다.
function resetRun() {
    Game.score = 0; Game.kills = 0;
    Game.stageN = 1; Game.roundN = 1;
    Game.camShake = 0; Game.hitStop = 0;

    Game.pDropRate = 0.35;
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

    Game.equip = { weapon: null, armor: null };
    Game.relics = []; Game.relicChoices = []; Game.relicIdx = 0;

    // 플레이어 초기화 — 최대체력은 영구강화/유물이 위에 더해지므로 기본값에서 다시 시작
    Player.maxHp = PLAYER_BASE_MAX_HP;
    Player.dead = false;
    Player.stamina = STAMINA_MAX;
    Player.invT = 0; Player.kbT = 0; Player.dashT = 0; Player.dashCD = 0;
    Player.atkT = 0; Player.atkAnim = 0; Player.atkCD = 0;
    Player.combo = 0; Player.comboRestT = 0; Player.comboWindowT = 0;
    Player.animName = "idle"; Player.animFrame = 0; Player.animT = 0;

    applyPermUpgrades();   // 영구강화 반영 (maxHp 등)
    Player.hp = Player.maxHp;

    // 오브젝트 풀 전부 비우기 — 이전 런의 탄·장판이 남아 있으면 새 런 시작 즉시 피격됨
    [Game.bullets, Game.eBullets, Game.lasers, Game.parts, Game.texts, Game.items, Game.enemies, Game.hazards]
        .forEach(pool => pool.forEach(o => o.active = false));
}

// 직업별 전투 프로필 (구 사이드스크롤 core.js의 pBaseAtkSpd/pRangeBonus 이식)
// 도적: 매우 빠른 공속·짧은 사거리·높은 치명타 / 나머지는 값 들어오는 대로 채움
// range는 애니 동작이 작아 보이는 것과 별개로 게임적 손맛을 위해 넉넉하게 잡음
// (도적 기존 38 → 1.5배. 다른 직업 추가 시 자기 원래값의 2~3배 기준으로)
const CLASS_PROFILE = {
    1: { atkSpd: 2.0, range: 50, atkCD: 20, dmgMin: 8, dmgMax: 13, crit: 0.35 }, // 도적 — TODO: 판정(50)에 맞게 동작이 더 크게 보이는 공격 애니로 나중에 교체
};
function classProfile(id) {
    return CLASS_PROFILE[id] || { atkSpd: 1.0, range: 26, atkCD: 34, dmgMin: 12, dmgMax: 18, crit: 0.2 };
}

function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
}
