// boss.js — 스테이지별 보스 패턴 (5테마 × 각 3~4패턴)
// skull_V1 boss.js의 "예고(warnT) → 0이 되는 순간 발사" 구조를 그대로 따르되, 탑다운 좌표계로 재작성.
// 예고 표시(render_entities.js)와 실제 발사가 같은 warnAng/warnKind를 참조하므로 방향이 어긋나지 않는다.
//
// 패턴 정의 형식:
//   { name, warn: 선딜, dur: 실행 시간, rec: 후딜(회복), kind: "dash" | "cast", exec(e, isP2) }
//   kind "dash" → 실행 중 예고 각도로 돌진하며 몸통 판정 / "cast" → 제자리에서 발사만
//
// rec(후딜)이 이 파일의 난이도 조절 핵심이다. 큰 기술일수록 길게 줘서, 플레이어가
// "지금이 때린다" 하고 들어갈 창을 확보한다. 후딜 없이 패턴이 연달아 나가면
// 회피만 반복하게 되고 반격 리듬이 사라져 짜증만 남는다.
// phase2에서도 REC_MIN 아래로는 절대 줄지 않는다.

const BOSS_PATTERNS = {
    // ── 1. 고블린 킹 — 단순하고 읽기 쉬운 근접 위주. 첫 보스답게 학습용 ──
    1: [
        {
            name: "철퇴 돌진", warn: 34, dur: 24, rec: 56, kind: "dash",
            exec: () => { Game.camShake = Math.max(Game.camShake || 0, 10); },
        },
        {
            name: "회전 후려치기", warn: 30, dur: 12, rec: 64, kind: "cast",
            exec: (e, isP2) => {
                const amt = isP2 ? 16 : 11;
                for (let i = 0; i < amt; i++) {
                    const a = (i / amt) * Math.PI * 2;
                    spawnEBullet(e.x, e.y - 8, Math.cos(a) * 3.1, Math.sin(a) * 3.1, 110, 5, Math.round(e.atk * 0.55));
                }
                Game.camShake = Math.max(Game.camShake || 0, 8);
            },
        },
        {
            name: "돌 던지기", warn: 28, dur: 10, rec: 44, kind: "cast",
            exec: (e, isP2) => {
                const count = isP2 ? 5 : 3;
                for (let i = 0; i < count; i++) {
                    const a = e.warnAng + (i - (count - 1) / 2) * 0.20;
                    spawnEBullet(e.x, e.y - 8, Math.cos(a) * 5.2, Math.sin(a) * 5.2, 130, 6, Math.round(e.atk * 0.8));
                }
            },
        },
    ],

    // ── 2. 스켈레톤 치프틴 — 원거리 압박 + 잡졸 소환. 엄폐물 활용을 강제 ──
    2: [
        {
            name: "뼈 화살 일제사격", warn: 30, dur: 12, rec: 48, kind: "cast",
            exec: (e, isP2) => {
                const count = isP2 ? 9 : 6;
                for (let i = 0; i < count; i++) {
                    const a = e.warnAng + (i - (count - 1) / 2) * 0.14;
                    spawnEBullet(e.x, e.y - 8, Math.cos(a) * 6.4, Math.sin(a) * 6.4, 150, 5, Math.round(e.atk * 0.7));
                }
            },
        },
        {
            name: "십자 뼈창", warn: 34, dur: 14, rec: 72, kind: "cast",
            exec: (e, isP2) => {
                // 축 4방향(+phase2는 대각 4방향 추가)으로 두꺼운 탄을 길게 뿜음
                const dirs = isP2 ? 8 : 4;
                for (let i = 0; i < dirs; i++) {
                    const a = (i / dirs) * Math.PI * 2 + (Game.frameCount % 90) * 0.004;
                    for (let k = 0; k < 3; k++) {
                        spawnEBullet(e.x, e.y - 8, Math.cos(a) * (3.4 + k * 1.3), Math.sin(a) * (3.4 + k * 1.3),
                            160, 6, Math.round(e.atk * 0.65));
                    }
                }
                Game.camShake = Math.max(Game.camShake || 0, 9);
            },
        },
        {
            name: "망자 소집", warn: 44, dur: 20, rec: 96, kind: "cast",
            exec: (e, isP2) => {
                // 자기 주변에 잡졸을 불러냄 — 문이 열리려면 소환된 몹까지 정리해야 함
                const n = isP2 ? 3 : 2;
                for (let i = 0; i < n; i++) {
                    const a = (i / n) * Math.PI * 2;
                    spawnThemedEnemy(e.x + Math.cos(a) * 70, e.y + Math.sin(a) * 70, Game.stageN, Game.roundN);
                }
                addText(e.x, e.y - 40, "망자 소집!", "#cfd6e6", 50, 14);
            },
        },
        {
            name: "돌격 창격", warn: 28, dur: 22, rec: 56, kind: "dash",
            exec: () => { Game.camShake = Math.max(Game.camShake || 0, 11); },
        },
    ],

    // ── 3. 무덤의 군주 — 순간이동으로 거리를 무시하고, 장판으로 공간을 좁힌다 ──
    3: [
        {
            name: "영혼 흡수", warn: 36, dur: 14, rec: 54, kind: "cast",
            exec: (e, isP2) => {
                // 느리지만 큰 유도성 탄 — 벽으로 끊거나 회피로 통과해야 함
                const count = isP2 ? 5 : 3;
                for (let i = 0; i < count; i++) {
                    const a = e.warnAng + (i - (count - 1) / 2) * 0.30;
                    spawnEBullet(e.x, e.y - 8, Math.cos(a) * 2.6, Math.sin(a) * 2.6, 240, 10, Math.round(e.atk * 0.9));
                }
            },
        },
        {
            name: "저주의 봉인", warn: 40, dur: 18, rec: 84, kind: "cast",
            exec: (e, isP2) => {
                // 플레이어 주변 지면에 지연 폭발 장판을 여러 개 — 계속 움직이게 강제
                const n = isP2 ? 5 : 3;
                for (let i = 0; i < n; i++) {
                    const a = Math.random() * Math.PI * 2;
                    const d = Math.random() * 90;
                    spawnHazard(Player.x + Math.cos(a) * d, Player.y + Math.sin(a) * d,
                        56, 48, 40, Math.round(e.atk * 0.8), "#b56bff");
                }
                addText(e.x, e.y - 40, "저주의 봉인", "#b56bff", 50, 13);
            },
        },
        {
            name: "그림자 도약", warn: 30, dur: 16, rec: 66, kind: "cast",
            exec: (e, isP2) => {
                // 플레이어 등 뒤로 순간이동 후 전방위 탄막 — 근접 유지 플레이를 응징
                for (let i = 0; i < 14; i++) addPart(e.x, e.y, "#b56bff", 20, 4);
                const a0 = Math.random() * Math.PI * 2;
                e.x = Math.max(140, Math.min(960, Player.x + Math.cos(a0) * 60));
                e.y = Math.max(140, Math.min(960, Player.y + Math.sin(a0) * 60));
                for (let i = 0; i < 14; i++) addPart(e.x, e.y, "#b56bff", 20, 4);
                const amt = isP2 ? 20 : 14;
                for (let i = 0; i < amt; i++) {
                    const a = (i / amt) * Math.PI * 2;
                    spawnEBullet(e.x, e.y - 8, Math.cos(a) * 3.6, Math.sin(a) * 3.6, 120, 5, Math.round(e.atk * 0.6));
                }
                addText(e.x, e.y - 40, "그림자 도약", "#c98bff", 40, 13);
                Game.camShake = Math.max(Game.camShake || 0, 12);
            },
        },
    ],

    // ── 4. 화산의 군주 — 나선 탄막 + 지면 폭발. 화면을 넓게 쓰게 만든다 ──
    4: [
        {
            name: "화염 나선", warn: 32, dur: 40, rec: 96, kind: "cast",
            exec: (e, isP2) => {
                // 실행 시간 동안 계속 뿜는 방식 — updateBossAI의 sustain 훅에서 프레임마다 발사
                e.sustain = { kind: "spiral", t: 0, dur: 40, arms: isP2 ? 3 : 2 };
            },
        },
        {
            name: "용암 분출", warn: 38, dur: 20, rec: 88, kind: "cast",
            exec: (e, isP2) => {
                // 방 전역에 격자로 폭발 장판 — 안전지대를 읽고 이동해야 함
                const n = isP2 ? 9 : 6;
                for (let i = 0; i < n; i++) {
                    const gx = 200 + Math.random() * 700;
                    const gy = 200 + Math.random() * 700;
                    spawnHazard(gx, gy, 70, 50 + i * 4, 40, Math.round(e.atk * 0.9), "#ff6a1e");
                }
                // 플레이어 현재 위치에도 확정 1개
                spawnHazard(Player.x, Player.y, 70, 50, 40, Math.round(e.atk * 0.9), "#ff6a1e");
                addText(e.x, e.y - 44, "용암 분출!", "#ff8a3a", 50, 14);
                Game.camShake = Math.max(Game.camShake || 0, 14);
            },
        },
        {
            name: "분화 돌진", warn: 26, dur: 30, rec: 76, kind: "dash",
            exec: (e) => {
                // 돌진 경로에 불씨를 흘림 — 지나간 자리도 잠시 위험
                e.sustain = { kind: "trail", t: 0, dur: 30 };
                Game.camShake = Math.max(Game.camShake || 0, 14);
            },
        },
        {
            name: "폭염 파열", warn: 30, dur: 12, rec: 62, kind: "cast",
            exec: (e, isP2) => {
                const waves = isP2 ? 2 : 1;
                for (let w = 0; w < waves; w++) {
                    const amt = 18;
                    for (let i = 0; i < amt; i++) {
                        const a = (i / amt) * Math.PI * 2 + w * 0.17;
                        const sp = 3.0 + w * 1.6;
                        spawnEBullet(e.x, e.y - 8, Math.cos(a) * sp, Math.sin(a) * sp, 150, 6, Math.round(e.atk * 0.6));
                    }
                }
            },
        },
    ],

    // ── 5. 서리 거인 — 느리고 묵직. 예고가 길지만 범위가 넓어 "미리 빠져나오기"를 요구 ──
    5: [
        {
            name: "서리 강타", warn: 40, dur: 26, rec: 78, kind: "dash",
            exec: (e) => {
                e.sustain = { kind: "trail", t: 0, dur: 26 };
                Game.camShake = Math.max(Game.camShake || 0, 16);
            },
        },
        {
            name: "빙결 파열", warn: 34, dur: 14, rec: 82, kind: "cast",
            exec: (e, isP2) => {
                // 느린 탄을 촘촘히 — 벽에 몰리면 빠져나갈 틈이 없다
                const amt = isP2 ? 26 : 18;
                for (let i = 0; i < amt; i++) {
                    const a = (i / amt) * Math.PI * 2;
                    spawnEBullet(e.x, e.y - 8, Math.cos(a) * 2.6, Math.sin(a) * 2.6, 240, 7, Math.round(e.atk * 0.55));
                }
                addText(e.x, e.y - 46, "빙결 파열", "#a8e8ff", 50, 14);
            },
        },
        {
            name: "고드름 낙하", warn: 36, dur: 18, rec: 86, kind: "cast",
            exec: (e, isP2) => {
                // 플레이어가 있던 자리로 이어지는 낙하 — 계속 움직이면 피할 수 있음
                const n = isP2 ? 8 : 5;
                const dx = Player.x - e.x, dy = Player.y - e.y;
                const d = Math.hypot(dx, dy) || 1;
                for (let i = 1; i <= n; i++) {
                    spawnHazard(e.x + (dx / d) * i * 80, e.y + (dy / d) * i * 80,
                        62, 40 + i * 5, 36, Math.round(e.atk * 0.8), "#7fd8ff");
                }
                Game.camShake = Math.max(Game.camShake || 0, 12);
            },
        },
        {
            name: "혹한의 숨결", warn: 30, dur: 34, rec: 90, kind: "cast",
            exec: (e, isP2) => {
                e.sustain = { kind: "spiral", t: 0, dur: 34, arms: isP2 ? 3 : 2 };
            },
        },
    ],

    // ── 6. 늪의 마녀 — 빠르고 성가심. 장판으로 공간을 좁히고 졸개를 계속 부른다 ──
    6: [
        {
            name: "독무 살포", warn: 30, dur: 16, rec: 78, kind: "cast",
            exec: (e, isP2) => {
                const n = isP2 ? 10 : 7;
                for (let i = 0; i < n; i++) {
                    spawnHazard(200 + Math.random() * 700, 200 + Math.random() * 700,
                        76, 46 + i * 4, 44, Math.round(e.atk * 0.7), "#9dff4d");
                }
                addText(e.x, e.y - 46, "독무 살포", "#b6ff5c", 50, 14);
            },
        },
        {
            name: "늪의 부름", warn: 38, dur: 20, rec: 104, kind: "cast",
            exec: (e, isP2) => {
                // 졸개 소환 — 방치하면 순식간에 포위당한다
                const n = isP2 ? 4 : 2;
                for (let i = 0; i < n; i++) {
                    const a = (i / n) * Math.PI * 2;
                    spawnThemedEnemy(e.x + Math.cos(a) * 80, e.y + Math.sin(a) * 80, Game.stageN, Game.roundN);
                }
                addText(e.x, e.y - 46, "늪의 부름!", "#b6ff5c", 55, 15);
            },
        },
        {
            name: "부식 탄막", warn: 28, dur: 40, rec: 88, kind: "cast",
            exec: (e, isP2) => {
                e.sustain = { kind: "spiral", t: 0, dur: 40, arms: isP2 ? 4 : 3 };
            },
        },
        {
            name: "도약 강습", warn: 24, dur: 22, rec: 62, kind: "dash",
            exec: (e) => { Game.camShake = Math.max(Game.camShake || 0, 12); },
        },
    ],

    // ── 7. 파멸의 기사 — 순수 근접. 돌진이 빠르고 연달아 들어와 회피 타이밍을 시험한다 ──
    7: [
        {
            name: "파멸의 돌격", warn: 26, dur: 30, rec: 62, kind: "dash",
            exec: (e) => {
                e.sustain = { kind: "trail", t: 0, dur: 30 };
                Game.camShake = Math.max(Game.camShake || 0, 16);
            },
        },
        {
            name: "대검 회전", warn: 30, dur: 44, rec: 92, kind: "cast",
            exec: (e, isP2) => {
                e.sustain = { kind: "spiral", t: 0, dur: 44, arms: isP2 ? 4 : 2 };
                addText(e.x, e.y - 46, "대검 회전!", "#e0d0aa", 50, 14);
            },
        },
        {
            name: "충격 파쇄", warn: 32, dur: 14, rec: 74, kind: "cast",
            exec: (e, isP2) => {
                // 자기 주변 고리형 장판 — 붙어 있으면 반드시 맞는다, 거리를 벌리게 강제
                const arms = isP2 ? 12 : 8;
                for (let i = 0; i < arms; i++) {
                    const a = (i / arms) * Math.PI * 2;
                    spawnHazard(e.x + Math.cos(a) * 110, e.y + Math.sin(a) * 110,
                        66, 44, 32, Math.round(e.atk * 0.8), "#c8b48a");
                }
                Game.camShake = Math.max(Game.camShake || 0, 18);
            },
        },
        {
            name: "연속 돌진", warn: 20, dur: 26, rec: 54, kind: "dash",
            exec: (e) => { Game.camShake = Math.max(Game.camShake || 0, 14); },
        },
    ],

    // ── 8. 공허의 눈 — 탄막형. 이동을 멈추면 죽는다 ──
    8: [
        {
            name: "차원 균열", warn: 32, dur: 16, rec: 84, kind: "cast",
            exec: (e, isP2) => {
                // 2파 방사(속도 차) — 직선 회피를 막는다
                const amt = isP2 ? 22 : 16;
                for (let i = 0; i < amt; i++) {
                    const a = (i / amt) * Math.PI * 2;
                    spawnEBullet(e.x, e.y - 8, Math.cos(a) * 4.6, Math.sin(a) * 4.6, 210, 6, Math.round(e.atk * 0.55));
                }
                for (let i = 0; i < amt; i++) {
                    const a = ((i + 0.5) / amt) * Math.PI * 2;
                    spawnEBullet(e.x, e.y - 8, Math.cos(a) * 2.7, Math.sin(a) * 2.7, 250, 6, Math.round(e.atk * 0.45));
                }
                addText(e.x, e.y - 46, "차원 균열", "#a67bff", 50, 14);
            },
        },
        {
            name: "중력 붕괴", warn: 30, dur: 48, rec: 100, kind: "cast",
            exec: (e, isP2) => {
                e.sustain = { kind: "spiral", t: 0, dur: 48, arms: isP2 ? 5 : 3 };
                addText(e.x, e.y - 46, "중력 붕괴!", "#8a5cff", 55, 15);
            },
        },
        {
            name: "공허 응시", warn: 34, dur: 18, rec: 88, kind: "cast",
            exec: (e, isP2) => {
                // 플레이어 주변을 링으로 둘러싸 도주로를 좁힘
                const arms = isP2 ? 10 : 6;
                for (let i = 0; i < arms; i++) {
                    const a = (i / arms) * Math.PI * 2;
                    spawnHazard(Player.x + Math.cos(a) * 96, Player.y + Math.sin(a) * 96,
                        58, 44, 34, Math.round(e.atk * 0.75), "#8a5cff");
                }
            },
        },
        {
            name: "왜곡 강습", warn: 22, dur: 26, rec: 66, kind: "dash",
            exec: (e) => {
                e.sustain = { kind: "trail", t: 0, dur: 26 };
                Game.camShake = Math.max(Game.camShake || 0, 14);
            },
        },
    ],

    // ── 9. 피의 대제사장 — 장판·소환·탄막을 모두 쓰는 최종 관문 직전 ──
    9: [
        {
            name: "피의 제물", warn: 30, dur: 16, rec: 82, kind: "cast",
            exec: (e, isP2) => {
                // 플레이어 기준 십자로 뻗는 장판
                const arms = isP2 ? 8 : 4;
                for (let i = 0; i < arms; i++) {
                    const a = (i / arms) * Math.PI * 2;
                    for (let k = 1; k <= 3; k++) {
                        spawnHazard(Player.x + Math.cos(a) * k * 72, Player.y + Math.sin(a) * k * 72,
                            56, 40 + k * 6, 34, Math.round(e.atk * 0.7), "#ff4d4d");
                    }
                }
                addText(e.x, e.y - 48, "피의 제물", "#ff5555", 52, 15);
            },
        },
        {
            name: "광신도 소환", warn: 36, dur: 20, rec: 102, kind: "cast",
            exec: (e, isP2) => {
                const n = isP2 ? 4 : 3;
                for (let i = 0; i < n; i++) {
                    const a = (i / n) * Math.PI * 2;
                    spawnThemedEnemy(e.x + Math.cos(a) * 90, e.y + Math.sin(a) * 90, Game.stageN, Game.roundN);
                }
                addText(e.x, e.y - 48, "광신도 소환!", "#ff5555", 55, 15);
            },
        },
        {
            name: "혈창 난사", warn: 28, dur: 44, rec: 96, kind: "cast",
            exec: (e, isP2) => {
                e.sustain = { kind: "spiral", t: 0, dur: 44, arms: isP2 ? 4 : 3 };
            },
        },
        {
            name: "핏빛 질주", warn: 22, dur: 28, rec: 64, kind: "dash",
            exec: (e) => {
                e.sustain = { kind: "trail", t: 0, dur: 28 };
                Game.camShake = Math.max(Game.camShake || 0, 16);
            },
        },
    ],

    // ── 10. 마왕 — 앞선 테마들의 위협을 전부 섞은 최종 보스 ──
    10: [
        {
            name: "왕관의 뇌격", warn: 34, dur: 20, rec: 86, kind: "cast",
            exec: (e, isP2) => {
                // 플레이어를 중심으로 십자 방향에 장판을 깔아 도망칠 축을 제한
                const arms = isP2 ? 8 : 4;
                for (let i = 0; i < arms; i++) {
                    const a = (i / arms) * Math.PI * 2;
                    for (let k = 1; k <= 3; k++) {
                        spawnHazard(Player.x + Math.cos(a) * k * 70, Player.y + Math.sin(a) * k * 70,
                            54, 42 + k * 6, 34, Math.round(e.atk * 0.75), "#ff2d55");
                    }
                }
                addText(e.x, e.y - 50, "왕관의 뇌격", "#ff2d55", 55, 15);
                Game.camShake = Math.max(Game.camShake || 0, 18);
            },
        },
        {
            name: "지옥의 문", warn: 36, dur: 16, rec: 94, kind: "cast",
            exec: (e, isP2) => {
                // 2파 방사 — 1파 사이를 2파가 메워서 단순 직선 회피를 막음
                const amt = isP2 ? 24 : 18;
                for (let i = 0; i < amt; i++) {
                    const a = (i / amt) * Math.PI * 2;
                    spawnEBullet(e.x, e.y - 8, Math.cos(a) * 5.0, Math.sin(a) * 5.0, 200, 6, Math.round(e.atk * 0.6));
                }
                for (let i = 0; i < amt; i++) {
                    const a = ((i + 0.5) / amt) * Math.PI * 2;
                    spawnEBullet(e.x, e.y - 8, Math.cos(a) * 2.9, Math.sin(a) * 2.9, 240, 6, Math.round(e.atk * 0.5));
                }
                addText(e.x, e.y - 50, "지옥의 문", "#ff0033", 55, 16);
                Game.camShake = Math.max(Game.camShake || 0, 22);
            },
        },
        {
            name: "심연의 참격", warn: 26, dur: 28, rec: 74, kind: "dash",
            exec: (e) => {
                e.sustain = { kind: "trail", t: 0, dur: 28 };
                Game.camShake = Math.max(Game.camShake || 0, 16);
            },
        },
        {
            name: "광란의 탄막", warn: 32, dur: 46, rec: 112, kind: "cast",
            exec: (e, isP2) => {
                e.sustain = { kind: "spiral", t: 0, dur: 46, arms: isP2 ? 4 : 3 };
                addText(e.x, e.y - 50, "광란의 탄막!", "#ff0033", 55, 16);
            },
        },
    ],
};

function bossPatterns(stageN) {
    return BOSS_PATTERNS[stageN] || BOSS_PATTERNS[1];
}

// 후딜 하한 — phase2 단축 배율이 걸려도 이 아래로는 안 내려간다.
// 0.5초는 도적 기준 4타 콤보를 한 사이클 넣을 수 있는 최소 창.
const REC_MIN = 32;
// phase2 후딜 배율 (너무 줄이면 반격 창이 사라져 회피만 반복하게 됨)
const REC_P2_MUL = 0.78;
// 콤보로 이어지는 패턴 사이 간격 — 0이면 두 기술이 겹쳐 보여 회피가 불가능해진다
const COMBO_LINK_DELAY = 30;

function bossRecovery(pat, isP2) {
    const base = pat.rec || 50;
    return Math.max(REC_MIN, Math.round(base * (isP2 ? REC_P2_MUL : 1)));
}

// 보스 숨쉬기(idle) 애니 재생 속도 — 플레이어 attack처럼 fps 개념 없이 그냥 느긋하게 고정
const BOSS_IDLE_FPS = 6;

function updateBossAI(e, walls) {
    if ((e.hitInv || 0) > 0) e.hitInv--;
    if (e.flash > 0) e.flash--;

    // idle 숨쉬기 애니 진행 — 다른 동작(공격 실행 등) 애니가 생기기 전까지는 항상 idle을 돌린다.
    // 프레임 수를 모르면(아직 안 뽑은 보스) 그냥 넘어가고, drawAnimSprite가 정지 포즈로 폴백한다.
    e.animName = "idle";
    e.animT = (e.animT || 0) + 1;
    const idleFc = animFrameCount("idle", e.spriteKey);
    if (e.animT >= 60 / BOSS_IDLE_FPS) { e.animT = 0; e.animFrame = ((e.animFrame || 0) + 1) % idleFc; }

    // 넉백은 슈퍼아머로 막지만, 혹시 걸렸다면 관성 처리만 하고 패턴은 멈춤
    if ((e.kbT || 0) > 0) {
        e.kbT--; e.vx *= 0.85; e.vy *= 0.85;
        resolveWalls(e, walls);
        return;
    }

    const p = Player;
    const dx = p.x - e.x, dy = p.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    const dname = dirFromAngle(dx, dy);
    if (dname && e.state !== "attack") e.facing = dname;

    const isP2 = e.hp < e.maxHp * 0.5;
    if (isP2 && !e._p2Flagged) {
        e._p2Flagged = true;
        addText(e.x, e.y - 46, "PHASE 2", "#ff3344", 80, 20);
        for (let i = 0; i < 40; i++) addPart(e.x, e.y, "#ff3344", 40, 5);
        Game.camShake = Math.max(Game.camShake || 0, 26);
    }

    const pats = bossPatterns(Game.stageN);

    if (e.state === "chase") {
        // 일정 거리를 유지하며 접근 — 너무 붙으면 패턴이 안 보이므로 60px 밖에서 멈춤
        if (dist > 70) { e.vx = (dx / dist) * e.speed; e.vy = (dy / dist) * e.speed; }
        else { e.vx *= 0.85; e.vy *= 0.85; }
        e.chaseT = (e.chaseT || 0) + 1;
        if (e.chaseT > (isP2 ? 50 : 78)) {
            e.chaseT = 0;
            e.ap = ((e.ap === undefined ? -1 : e.ap) + 1) % pats.length;
            // phase2에서만, 그리고 매번이 아니라 절반 정도만 2연속 콤보를 건다.
            // 항상 걸면 압박이 단조로워지고 반격 리듬을 잡을 수 없다.
            if (isP2 && !e.comboQueue && Math.random() < 0.55) {
                e.comboQueue = [(e.ap + 1) % pats.length];
            }
            startBossPattern(e, pats[e.ap], isP2);
        }
    } else if (e.state === "windup") {
        e.vx *= 0.8; e.vy *= 0.8;
        e.warnT--;
        if (e.warnT <= 0) {
            const pat = pats[e.ap];
            e.state = "attack";
            e.atkAnim = pat.dur;
            e.sustain = null;
            if (typeof playSfx === 'function') playSfx('boss_atk');
            pat.exec(e, isP2);
        }
    } else if (e.state === "attack") {
        e.atkAnim--;
        const pat = pats[e.ap];
        if (pat.kind === "dash") {
            e.vx = Math.cos(e.warnAng) * 7.2;
            e.vy = Math.sin(e.warnAng) * 7.2;
            if (dist < 34 && typeof hitPlayer === 'function') hitPlayer(e.atk, e);
        } else {
            e.vx *= 0.85; e.vy *= 0.85;
        }
        updateBossSustain(e, isP2);
        if (e.atkAnim <= 0) {
            e.sustain = null;
            // 콤보로 이어지더라도 짧은 간격은 반드시 둔다 — 예전엔 즉시 다음 패턴이 나가서
            // 두 기술의 탄이 겹쳐 회피가 물리적으로 불가능했다.
            if (e.comboQueue && e.comboQueue.length > 0) {
                e.state = "recover";
                e.recT = COMBO_LINK_DELAY;
                e.recMax = COMBO_LINK_DELAY;
            } else {
                e.state = "recover";
                e.recT = bossRecovery(pat, isP2);
                e.recMax = e.recT;
            }
        }
    } else if (e.state === "recover") {
        // 후딜 — 제자리에 굳어 있고, 이 구간이 플레이어의 반격 창이다.
        e.vx *= 0.82; e.vy *= 0.82;
        e.recT--;
        if (e.recT <= 0) {
            if (e.comboQueue && e.comboQueue.length > 0) {
                e.ap = e.comboQueue.shift();
                if (e.comboQueue.length === 0) e.comboQueue = null;
                startBossPattern(e, pats[e.ap], isP2);
            } else {
                e.state = "chase";
                e.chaseT = 0;
            }
        }
    }

    resolveWalls(e, walls);
}

function startBossPattern(e, pat, isP2) {
    e.state = "windup";
    e.warnT = Math.round(pat.warn * (isP2 ? 0.7 : 1));
    e._warnBase = e.warnT;
    e.warnKind = pat.kind;
    e.warnName = pat.name;
    e.warnAng = Math.atan2(Player.y - e.y, Player.x - e.x);
    e.vx = 0; e.vy = 0;
}

// 실행 시간 내내 계속 효과가 나가는 패턴(나선 탄막 / 돌진 불씨) 처리
function updateBossSustain(e, isP2) {
    const s = e.sustain;
    if (!s) return;
    s.t++;
    if (s.kind === "spiral") {
        // 팔(arm) 개수만큼 각도를 벌려 회전시키며 발사 — 4프레임마다 한 겹
        if (s.t % 4 === 0) {
            const base = s.t * 0.16;
            for (let i = 0; i < s.arms; i++) {
                const a = base + (i / s.arms) * Math.PI * 2;
                spawnEBullet(e.x, e.y - 8, Math.cos(a) * 3.8, Math.sin(a) * 3.8, 170, 5, Math.round(e.atk * 0.5));
            }
        }
    } else if (s.kind === "trail") {
        // 지나간 자리에 짧은 장판을 흘림
        if (s.t % 6 === 0) {
            spawnHazard(e.x, e.y, 44, 14, 30, Math.round(e.atk * 0.55), "#ff6a1e");
        }
    }
    if (s.t >= s.dur) e.sustain = null;
}
