// stage.js — 15스테이지(5테마 × 3라운드) 데이터 정의
// skull_V1의 stage.js(월드 10 × 레벨 3, 레벨3=보스방) 구조를 5테마로 압축해 탑다운으로 재구성.
// 각 테마는 "월드"에 대응하고, 라운드 1·2는 일반 방, 라운드 3은 보스방이다.
//
// 데이터만 여기 모아둔다 — 실제 동작은 mob.js(몹 AI) / boss.js(보스 패턴) /
// render_entities.js(테마 렌더) / main.js(방 생성·진행)가 이 데이터를 읽어 처리.

const ROUNDS_PER_STAGE = 3;   // 라운드 3 = 보스
const STAGE_COUNT = 5;        // 총 5테마 → 5 × 3 = 15 스테이지

// ── 몹 원형(archetype) ─────────────────────────────────────
// 테마별로 이 원형을 골라 쓰고, 스탯은 stageScale()로 스테이지 진행도에 따라 배율 적용.
//   melee   : 붙어서 예고 후 짧게 돌진 베기 (기본형)
//   charger : 예고가 길지만 아주 빠르고 멀리 돌진 (회피 타이밍 요구)
//   ranged  : 거리를 유지하며 투사체 발사 (접근하면 물러남)
//   tank    : 느리고 단단함, 넉백 안 먹음(슈퍼아머)
//   bomber  : 빠르게 붙어 자폭 (죽어도 폭발 — 근접 딜러에게 위험)
const MOB_ARCHETYPES = {
    melee:   { hp: 40, atk: 8,  speed: 1.50, hb: { w: 16, h: 12 }, atkRange: 26, warn: 24, dash: 5,  cd: 50 },
    charger: { hp: 34, atk: 11, speed: 2.10, hb: { w: 16, h: 12 }, atkRange: 34, warn: 34, dash: 9,  cd: 64, dashDur: 22 },
    ranged:  { hp: 26, atk: 7,  speed: 1.00, hb: { w: 16, h: 12 }, atkRange: 250, warn: 32, cd: 78, keepDist: 165, shotSpeed: 4.2 },
    tank:    { hp: 95, atk: 15, speed: 0.85, hb: { w: 22, h: 16 }, atkRange: 32, warn: 38, dash: 4,  cd: 70, superArmor: true },
    bomber:  { hp: 22, atk: 6,  speed: 1.95, hb: { w: 16, h: 12 }, atkRange: 22, warn: 20, dash: 6,  cd: 40, explodeDmg: 18, explodeR: 62 },
};

// ── 5개 테마 ───────────────────────────────────────────────
// palette: 방 렌더 색상 / mobs: 이 테마에 등장하는 몹 원형 목록(가중치 없이 균등 추첨)
// layouts: [라운드1 장애물, 라운드2 장애물], bossArena: 라운드3(보스방) 장애물
// 좌표계 기준 — 방 내부는 x 104~996, y 104~1000. 플레이어 스폰 (160,500), 문은 동쪽 벽 y 468~532.
// 스폰 지점은 main.js의 pickSpawnSpots()가 벽 겹침을 자동 회피하므로 장애물 배치만 신경쓰면 됨.
const STAGE_THEMES = [
    {
        id: 1,
        name: "고블린 소굴",
        subtitle: "GOBLIN DEN",
        palette: {
            floor: "#1d2418", grid: "#2b3524", wall: "#3a4a2c", wallTop: "#4d6139",
            accent: "#7dc242", fog: "rgba(60,90,40,0.05)",
        },
        mobTint: "#8fdd4a",
        mobs: ["melee", "melee", "charger"],   // 잡졸 위주 + 간간이 돌격병
        eliteChance: 0.08,
        boss: { name: "고블린 킹", hp: 260, atk: 18, speed: 1.15, tint: "#a8e05a", hb: { w: 28, h: 22 } },
        layouts: [
            // R1 — 좁은 소굴: 작은 바위 엄폐물이 흩어져 있음
            [
                { x: 300, y: 250, w: 60, h: 60 }, { x: 600, y: 200, w: 60, h: 60 },
                { x: 450, y: 600, w: 60, h: 60 }, { x: 750, y: 700, w: 60, h: 60 },
                { x: 250, y: 800, w: 60, h: 60 },
            ],
            // R2 — 어긋난 가로 통로
            [
                { x: 250, y: 300, w: 400, h: 24 }, { x: 450, y: 650, w: 400, h: 24 },
                { x: 300, y: 850, w: 300, h: 24 },
            ],
        ],
        bossArena: [
            { x: 200, y: 200, w: 60, h: 60 }, { x: 840, y: 200, w: 60, h: 60 },
            { x: 200, y: 840, w: 60, h: 60 }, { x: 840, y: 840, w: 60, h: 60 },
        ],
    },
    {
        id: 2,
        name: "스켈레톤 요새",
        subtitle: "SKELETON FORTRESS",
        palette: {
            floor: "#20222b", grid: "#2e313d", wall: "#454a5c", wallTop: "#5d6478",
            accent: "#cfd6e6", fog: "rgba(120,130,160,0.05)",
        },
        mobTint: "#dfe4f0",
        mobs: ["melee", "ranged", "ranged"],   // 궁수 비중이 높아 엄폐물 활용을 요구
        eliteChance: 0.10,
        boss: { name: "스켈레톤 치프틴", hp: 380, atk: 22, speed: 1.20, tint: "#e8edf8", hb: { w: 28, h: 22 } },
        layouts: [
            // R1 — 요새 기둥 4개
            [
                { x: 280, y: 280, w: 80, h: 80 }, { x: 740, y: 280, w: 80, h: 80 },
                { x: 280, y: 740, w: 80, h: 80 }, { x: 740, y: 740, w: 80, h: 80 },
            ],
            // R2 — 세로 격벽 통로 (궁수 사선을 끊고 들어가야 함)
            [
                { x: 400, y: 150, w: 24, h: 300 }, { x: 400, y: 650, w: 24, h: 300 },
                { x: 700, y: 150, w: 24, h: 300 }, { x: 700, y: 650, w: 24, h: 300 },
            ],
        ],
        bossArena: [
            { x: 350, y: 200, w: 24, h: 200 }, { x: 350, y: 700, w: 24, h: 200 },
            { x: 750, y: 200, w: 24, h: 200 }, { x: 750, y: 700, w: 24, h: 200 },
        ],
    },
    {
        id: 3,
        name: "언데드 무덤",
        subtitle: "UNDEAD GRAVEYARD",
        palette: {
            floor: "#1a1526", glow: true, grid: "#271f38", wall: "#3b2f52", wallTop: "#513f6e",
            accent: "#b56bff", fog: "rgba(120,60,180,0.07)",
        },
        mobTint: "#b56bff",
        mobs: ["tank", "melee", "ranged"],     // 시체 탱커 + 강령술사
        eliteChance: 0.12,
        boss: { name: "무덤의 군주", hp: 520, atk: 26, speed: 1.10, tint: "#c98bff", hb: { w: 30, h: 24 } },
        layouts: [
            // R1 — 묘비 열: 좁은 시야, 근접전 유도
            [
                { x: 250, y: 250, w: 40, h: 50 }, { x: 420, y: 250, w: 40, h: 50 },
                { x: 590, y: 250, w: 40, h: 50 }, { x: 760, y: 250, w: 40, h: 50 },
                { x: 330, y: 650, w: 40, h: 50 }, { x: 500, y: 650, w: 40, h: 50 },
                { x: 670, y: 650, w: 40, h: 50 }, { x: 840, y: 650, w: 40, h: 50 },
                { x: 250, y: 850, w: 40, h: 50 }, { x: 420, y: 850, w: 40, h: 50 },
                { x: 590, y: 850, w: 40, h: 50 },
            ],
            // R2 — 십자 석벽
            [
                { x: 520, y: 200, w: 24, h: 280 }, { x: 520, y: 620, w: 24, h: 280 },
                { x: 250, y: 300, w: 220, h: 24 }, { x: 620, y: 750, w: 220, h: 24 },
            ],
        ],
        bossArena: [{ x: 480, y: 480, w: 100, h: 100 }],
    },
    {
        id: 4,
        name: "화산 지대",
        subtitle: "VOLCANIC WASTES",
        palette: {
            floor: "#2a1408", grid: "#3d1c0a", wall: "#5c2a10", wallTop: "#7d3a14",
            accent: "#ff6a1e", fog: "rgba(200,70,10,0.07)",
        },
        mobTint: "#ff7a33",
        mobs: ["bomber", "charger", "ranged"], // 자폭 슬라임 + 화염 임프 — 난전 유도
        eliteChance: 0.14,
        boss: { name: "화산의 군주", hp: 700, atk: 30, speed: 1.25, tint: "#ff8a3a", hb: { w: 32, h: 26 } },
        layouts: [
            // R1 — 용암 균열(긴 벽)이 어긋나게
            [
                { x: 200, y: 300, w: 300, h: 24 }, { x: 560, y: 430, w: 300, h: 24 },
                { x: 200, y: 620, w: 300, h: 24 }, { x: 560, y: 790, w: 300, h: 24 },
            ],
            // R2 — 굳은 용암 덩어리 2개, 넓은 난전 공간
            [
                { x: 280, y: 250, w: 180, h: 180 }, { x: 620, y: 600, w: 180, h: 180 },
            ],
        ],
        // 보스가 지면 폭발 장판을 깔기 때문에 피할 공간을 최대한 비워둠
        bossArena: [{ x: 300, y: 300, w: 50, h: 50 }, { x: 750, y: 750, w: 50, h: 50 }],
    },
    {
        id: 5,
        name: "마왕성",
        subtitle: "DEMON KING'S CASTLE",
        palette: {
            floor: "#170a12", grid: "#24101c", wall: "#3d1526", wallTop: "#5a1f36",
            accent: "#ff2d55", fog: "rgba(180,20,60,0.08)",
        },
        mobTint: "#ff4d6a",
        mobs: ["tank", "charger", "ranged", "bomber"], // 친위대 — 모든 유형이 섞여 나옴
        eliteChance: 0.20,
        boss: { name: "마왕", hp: 1000, atk: 36, speed: 1.30, tint: "#ff3355", hb: { w: 34, h: 28 } },
        layouts: [
            // R1 — 대칭 기둥 회랑
            [
                { x: 320, y: 220, w: 70, h: 70 }, { x: 700, y: 220, w: 70, h: 70 },
                { x: 510, y: 430, w: 70, h: 70 },
                { x: 320, y: 640, w: 70, h: 70 }, { x: 700, y: 640, w: 70, h: 70 },
            ],
            // R2 — 미로형 격벽
            [
                { x: 250, y: 250, w: 24, h: 300 }, { x: 250, y: 250, w: 300, h: 24 },
                { x: 700, y: 250, w: 24, h: 300 }, { x: 450, y: 700, w: 300, h: 24 },
                { x: 750, y: 600, w: 24, h: 250 },
            ],
        ],
        // 왕좌의 방 — 네 귀퉁이 장식만, 사실상 완전 개방
        bossArena: [
            { x: 150, y: 150, w: 60, h: 24 }, { x: 890, y: 150, w: 60, h: 24 },
            { x: 150, y: 900, w: 60, h: 24 }, { x: 890, y: 900, w: 60, h: 24 },
        ],
    },
];

// ── 조회 헬퍼 ──────────────────────────────────────────────

// 현재(또는 지정) 스테이지의 테마. 범위를 벗어나면 마지막 테마로 클램프.
function stageTheme(stageN) {
    const n = stageN === undefined ? Game.stageN : stageN;
    return STAGE_THEMES[Math.min(Math.max(n, 1), STAGE_COUNT) - 1];
}

// 1~15 통합 진행도 — 스탯 스케일링과 HUD 표기에 사용
function globalRound(stageN, roundN) {
    return (stageN - 1) * ROUNDS_PER_STAGE + roundN;
}

// 진행도에 따른 몹 스탯 배율 — 15라운드에 걸쳐 완만하게 상승
// globalRound 1 → 1.00배, 15 → 약 2.4배. 테마별 원형 차이가 묻히지 않을 정도로만 올림.
function stageScale(stageN, roundN) {
    return 1 + (globalRound(stageN, roundN) - 1) * 0.10;
}

// 해당 라운드가 보스방인지
function isBossRound(roundN) {
    return roundN >= ROUNDS_PER_STAGE;
}

// 라운드별 장애물 배치 — 보스방은 bossArena, 일반 방은 layouts[roundN-1]
function roundObstacles(stageN, roundN) {
    const theme = stageTheme(stageN);
    if (isBossRound(roundN)) return theme.bossArena;
    return theme.layouts[Math.min(roundN, theme.layouts.length) - 1];
}

// 일반 라운드의 몹 수 — 스테이지·라운드가 오를수록 조금씩 늘어남
function roundMobCount(stageN, roundN) {
    return 2 + roundN + Math.floor((stageN - 1) / 2);
}

// audio.js가 BGM 트랙을 고르는 데 쓰는 "월드 그룹" 번호.
// V1에서는 월드 10개를 5그룹으로 묶었지만, 지금은 테마가 5개라 1:1로 대응된다.
function getWg() {
    return Math.min(Math.max(Game.stageN, 1), STAGE_COUNT);
}
