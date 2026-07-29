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

const Game = {
    gs: "play",          // 임시: 메뉴 없이 바로 플레이 (메뉴/직업선택은 다음 단계에서 연결)
    score: 0,
    kills: 0, worldN: 1, levelN: 1,
    camShake: 0, hitStop: 0, invT: 0,
    isPaused: false, isMuted: false,
    pClass: 1,            // 임시 기본값: 도적 (스프라이트 있는 직업)
    difficulty: 0,

    // 영구 성장 재화 (기존 세이브 그대로 이식 — localStorage 키 동일 유지)
    darkQuartz: parseInt(localStorage.getItem("skull_quartz")) || 0,
    permHpLvl: parseInt(localStorage.getItem("skull_permHp")) || 0,
    permAtkLvl: parseInt(localStorage.getItem("skull_permAtk")) || 0,
    permCritLvl: parseInt(localStorage.getItem("skull_permCrit")) || 0,
    permSpdLvl: parseInt(localStorage.getItem("skull_permSpd")) || 0,
    permDefLvl: parseInt(localStorage.getItem("skull_permDef")) || 0,
    permAtkSpdLvl: parseInt(localStorage.getItem("skull_permAtkSpd")) || 0,

    // 오브젝트 풀 (combat.js의 getObj가 사용)
    bullets: [], eBullets: [], lasers: [], parts: [], texts: [], items: [],
    enemies: [],
    doors: [], // 스테이지 진행용 문 — main.js의 buildRoom()이 방마다 새로 채움

    // 몹 처치 보상 — skull_V1(사이드스크롤) mob.js/upgrade_shop.js의 아이템 드롭·런 강화 구조를
    // 탑다운으로 이식. pDropRate 확률로 잡몹이 아이템 드롭, 보스는 확정 드롭 + 다크 퀴츠.
    pDropRate: 0.35,
    pAtkBonus: 0,      // 평타 데미지 고정 가산 (atk_drop 아이템)
    pDefBonus: 0,      // 피격 데미지 고정 감산 (def_drop 아이템)
    pAtkSpdBonus: 0,   // 공격속도 배율 가산 (atk_spd_drop 아이템)
    pMoveSpdBonus: 0,  // 이동속도 배율 가산 (move_spd_drop 아이템)

    frameCount: 0,
};

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
