const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const CW = canvas.width, CH = canvas.height;
const TILE = 40;
const GRAV = 0.4; 

const Game = {
    gs: "menu",
    score: 0, highScore: parseInt(localStorage.getItem("skull_highscore")) || 0,
    kills: 0, worldN: 1, levelN: 1,
    camX: 0, camShake: 0, hitStop: 0, invT: 0, deadTimer: 120,
    
    isPaused: false, isMuted: false,
    transT: 0, transState: 0, bossIntroT: 0,
    pClass: 0,

    // 영구 성장 재화 및 스탯 (localStorage 연동)
    darkQuartz: parseInt(localStorage.getItem("skull_quartz")) || 0,
    permHpLvl: parseInt(localStorage.getItem("skull_permHp")) || 0,
    permAtkLvl: parseInt(localStorage.getItem("skull_permAtk")) || 0,
    permCritLvl: parseInt(localStorage.getItem("skull_permCrit")) || 0,

    platforms: [], doors: [],
    enemies: [], bullets: [], eBullets: [], parts: [], lasers: [], texts: [], items: [],
    offeredItems: [], obtainedItems: [],
    rerollCoins: 0, pMultiplierItems: 0,
    player: null,
    
    pMaxHp: 50, pBaseDmg: 30, pBaseDmgMul: 1.0, 
    pBaseAtkSpd: 1.0, pAtkSpdMul: 1.0, 
    pRangeBonus: 0, pBaseDef: 0, pShield: 0, 
    pMp: 0, pMaxMp: 100, pParryMp: 3, pParryBonus: 0,
    pSkillDmgMul: 1.0, pSkillWidth: 1.0, pExtraDmg: 0.0,
    pHealOnHit: false, pLifestealChance: 0.05,
    pDashCDMul: 1.0, pMoveSpdMul: 1.0, pJmpMul: 1.0, 
    pCritChance: 0.20, pCritDmg: 1.5,
    pReflectDmg: 0, pLowHpDmg: 1.0, pDashInv: 0,
    pProjSlow: 1.0, pDmgReduction: 1.0,
    pComboDur: 0, pComboDmg: 0,
    pRevive: 0, pDropRate: 0.35, pBloodFestival: false, pFinalDmgMul: 1.0, 
    pRegenFrames: 0, regenT: 0, pHealOnClear: 0,
    pCursedPendant: false, curseT: 0,
    comboCount: 0, comboTimer: 0
};

for (let i = 0; i < 40; i++) Game.enemies.push({ active: false });
for (let i = 0; i < 50; i++) Game.bullets.push({ active: false });
for (let i = 0; i < 250; i++) Game.eBullets.push({ active: false });
for (let i = 0; i < 300; i++) Game.parts.push({ active: false });
for (let i = 0; i < 20; i++) Game.lasers.push({ active: false });
for (let i = 0; i < 30; i++) Game.texts.push({ active: false });
for (let i = 0; i < 40; i++) Game.items.push({ active: false }); 

const K = {};
window.addEventListener("keydown", e => { K[e.code] = true; });
window.addEventListener("keyup", e => { K[e.code] = false; });
function dn(...c) { return c.some(k => K[k]); }

let audioCtx = null, noiseBuffer = null, isBgmPlaying = false, bgmInterval = null, currentBgmScene = ''; 

function initAudio() {
    if (audioCtx) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const bufferSize = audioCtx.sampleRate * 0.1; 
        noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) output[i] = (Math.random() > 0.5 ? 1 : -1) * Math.random(); 
    } catch(e) {}
}

function stopBGM() { 
    if (bgmInterval) clearInterval(bgmInterval);
    isBgmPlaying = false;
    currentBgmScene = '';
}

function playSfx(type) {
    if (!audioCtx) initAudio(); if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (Game.isMuted) return;

    const now = audioCtx.currentTime;

    if (type === 'jump') { 
        if (noiseBuffer) {
            const src = audioCtx.createBufferSource(); src.buffer = noiseBuffer;
            const filter = audioCtx.createBiquadFilter(); filter.type = 'highpass'; filter.frequency.value = 1000;
            const gain = audioCtx.createGain(); 
            gain.gain.setValueAtTime(0.4, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            src.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination); src.start(now);
        }
    } else if (type === 'atk') { 
        const osc = audioCtx.createOscillator(); osc.type = 'square'; 
        osc.frequency.setValueAtTime(700, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        const gain = audioCtx.createGain(); 
        gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain); gain.connect(audioCtx.destination); osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'enemy_atk') { 
        const osc = audioCtx.createOscillator(); osc.type = 'sawtooth'; 
        osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
        const gain = audioCtx.createGain(); 
        gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain); gain.connect(audioCtx.destination); osc.start(now); osc.stop(now + 0.12);
    } else if (type === 'mob_laser') {
        const osc = audioCtx.createOscillator(); osc.type = 'sawtooth'; 
        osc.frequency.setValueAtTime(1200, now); osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
        const gain = audioCtx.createGain(); 
        gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain); gain.connect(audioCtx.destination); osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'boss_atk') { 
        const osc = audioCtx.createOscillator(); osc.type = 'square'; 
        osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
        const gain = audioCtx.createGain(); 
        gain.gain.setValueAtTime(0.7, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain); gain.connect(audioCtx.destination); osc.start(now); osc.stop(now + 0.25);
    } else if (type === 'hit') { 
        const osc = audioCtx.createOscillator(); osc.type = 'square'; 
        osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
        const gain = audioCtx.createGain(); 
        gain.gain.setValueAtTime(0.4, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain); gain.connect(audioCtx.destination); osc.start(now); osc.stop(now + 0.15);
    } else if (type === 'parry') { 
        const osc = audioCtx.createOscillator(); osc.type = 'square'; 
        osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
        const gain = audioCtx.createGain(); 
        gain.gain.setValueAtTime(0.5, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain); gain.connect(audioCtx.destination); osc.start(now); osc.stop(now + 0.2);
    } else if (type === 'skill') { 
        const osc = audioCtx.createOscillator(); osc.type = 'square'; 
        osc.frequency.setValueAtTime(900, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
        const gain = audioCtx.createGain(); 
        gain.gain.setValueAtTime(0.6, now); gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.connect(gain); gain.connect(audioCtx.destination); osc.start(now); osc.stop(now + 0.5);
    } else if (type === 'dmg') { 
        const osc = audioCtx.createOscillator(); osc.type = 'sawtooth'; 
        osc.frequency.setValueAtTime(120, now); osc.frequency.exponentialRampToValueAtTime(20, now + 0.3);
        const gain = audioCtx.createGain(); 
        gain.gain.setValueAtTime(0.6, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain); gain.connect(audioCtx.destination); osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'player_die') { 
        if (noiseBuffer) {
            const src = audioCtx.createBufferSource(); src.buffer = noiseBuffer;
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.8, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            src.connect(gain); gain.connect(audioCtx.destination); src.start(now);
        }
    } else if (type === 'clear') {
        const freqs = [330, 440, 523, 659]; 
        freqs.forEach((f, i) => {
            const osc = audioCtx.createOscillator(); osc.type = 'square'; 
            osc.frequency.setValueAtTime(f, now + i * 0.15);
            const gain = audioCtx.createGain(); 
            gain.gain.setValueAtTime(0, now + i * 0.15); 
            gain.gain.setValueAtTime(0.3, now + i * 0.15 + 0.02); 
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.4);
            osc.connect(gain); gain.connect(audioCtx.destination); 
            osc.start(now + i * 0.15); osc.stop(now + i * 0.15 + 0.4);
        });
    } else if (type === 'item') {
        const osc = audioCtx.createOscillator(); osc.type = 'square'; 
        osc.frequency.setValueAtTime(500, now); osc.frequency.setValueAtTime(800, now + 0.08);
        const gain = audioCtx.createGain(); 
        gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain); gain.connect(audioCtx.destination); osc.start(now); osc.stop(now + 0.2);
    } else if (type === 'enemy_die') {
        if (noiseBuffer) {
            const src = audioCtx.createBufferSource(); src.buffer = noiseBuffer;
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.4, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            src.connect(gain); gain.connect(audioCtx.destination); src.start(now);
        }
    }
}

function playBGM(scene = 'play') {
    if (!audioCtx) initAudio(); if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const sceneId = scene === 'play' ? `play_${Game.worldN}_${Game.levelN}` : scene;
    if (currentBgmScene === sceneId && isBgmPlaying) return;
    
    if (bgmInterval) clearInterval(bgmInterval);
    currentBgmScene = sceneId; isBgmPlaying = true;
    let step = 0; let chordStep = 0;

    if (scene === 'dead') {
        bgmInterval = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) return; 
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator(); osc.type = 'triangle'; 
            const gain = audioCtx.createGain(); 
            const notes = [146.83, 138.59, 130.81, 110.00]; 
            const note = notes[step % notes.length];
            gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.4, now + 0.1); gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
            osc.frequency.setValueAtTime(note, now); osc.connect(gain); gain.connect(audioCtx.destination); osc.start(now); osc.stop(now + 1.2);
            step++;
        }, 600);
        return;
    }

    if (scene === 'upgrade') {
        bgmInterval = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) return; 
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator(); osc.type = 'square';
            const gain = audioCtx.createGain(); 
            gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.2, now + 0.05); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc.connect(gain); gain.connect(audioCtx.destination);
            const freqs = [220, 261, 329, 392, 329, 261];
            osc.frequency.value = freqs[step % freqs.length];
            osc.start(now); osc.stop(now + 0.4);
            step++;
        }, 250);
        return;
    }

    let isBoss = (scene === 'play' && Game.levelN === 3); 
    let wg = 1;
    if (Game.worldN >= 3 && Game.worldN <= 4) wg = 2;
    else if (Game.worldN >= 5 && Game.worldN <= 6) wg = 3;
    else if (Game.worldN >= 7 && Game.worldN <= 8) wg = 4;
    else if (Game.worldN === 9) wg = 5;
    else if (Game.worldN === 10) wg = 6;
    
    let isFinalBoss = (Game.worldN === 10 && isBoss);

    let speed = 150;
    if (isFinalBoss) speed = 600; 
    else if (isBoss) speed = 120; 
    else if (wg === 4) speed = 180; 
    else if (wg === 3) speed = 200; 
    else if (wg === 2) speed = 160; 
    else speed = 150; 

    bgmInterval = setInterval(() => {
        if (!isBgmPlaying) return;
        if (Game.isMuted) {
            step++;
            if (step % (isBoss && !isFinalBoss ? 2 : 4) === 0) chordStep++;
            return;
        }

        const now = audioCtx.currentTime;
        
        if (step % (isBoss && !isFinalBoss ? 1 : 2) === 0) { 
            const osc = audioCtx.createOscillator(); 
            if (isFinalBoss) osc.type = 'sine';
            else osc.type = (wg === 5 || wg === 3) ? (isBoss ? 'sawtooth' : 'sine') : (isBoss ? 'sawtooth' : 'square'); 
            if (wg === 5 && !isBoss) osc.detune.value = Math.sin(now * 4) * 25; 

            const gain = audioCtx.createGain(); 
            gain.gain.setValueAtTime(isFinalBoss ? 0.3 : (isBoss ? 0.15 : (wg===3 ? 0.3 : 0.12)), now); 
            gain.gain.exponentialRampToValueAtTime(0.01, now + (isFinalBoss ? 1.5 : (isBoss ? 0.15 : (wg === 5 ? 0.6 : 0.4))));
            osc.connect(gain); gain.connect(audioCtx.destination);
            
            let f = 0;
            if (isFinalBoss) { f = [[82, 73, 65, 55], [73, 65, 55, 49], [65, 55, 49, 41]][chordStep % 3][step % 4]; }
            else if (isBoss) {
                if (wg === 1) f = [[261, 392, 523, 392], [293, 440, 587, 440], [349, 523, 698, 523]][chordStep % 3][step % 4];
                else if (wg === 2) f = [[220, 329, 440, 329], [174, 261, 349, 261], [207, 311, 415, 311]][chordStep % 3][step % 4];
                else if (wg === 3) f = [[523, 659, 783, 1046], [493, 622, 740, 987], [440, 554, 659, 880]][chordStep % 3][step % 4];
                else if (wg === 4 || wg === 5) f = [[196, 293, 392, 293], [174, 261, 349, 261], [155, 233, 311, 233]][chordStep % 3][step % 4]; 
            } else if (wg === 1) { 
                const fChords = [[261, 329, 392], [293, 349, 440], [349, 440, 523], [392, 493, 587]];
                f = fChords[chordStep % 4][(step / 2) % 3];
            } else if (wg === 2) { 
                const fChords = [[220, 261, 329], [174, 220, 261], [207, 246, 311], [164, 207, 246]];
                f = fChords[chordStep % 4][(step / 2) % 3];
            } else if (wg === 3) { 
                const dollChords = [[523, 659, 783], [493, 659, 783], [440, 523, 659], [415, 523, 622]];
                f = dollChords[chordStep % 4][(step / 2) % 3];
            } else if (wg === 4) { 
                const fChords = [[196, 233, 293], [174, 207, 261], [155, 196, 233], [146, 174, 220]];
                f = fChords[chordStep % 4][(step / 2) % 3];
            } else if (wg === 5) { 
                const dollChords = [[329, 392, 493], [311, 392, 493], [261, 329, 392], [246, 311, 392]]; 
                f = dollChords[chordStep % 4][(step / 2) % 3] * 0.8; 
            }
            
            osc.frequency.value = f;
            osc.start(now); osc.stop(now + (isFinalBoss ? 1.5 : (isBoss ? 0.15 : (wg === 5 ? 0.6 : 0.4))));
        }

        if (step % (isBoss && !isFinalBoss ? 2 : 4) === 0) { 
            const bOsc = audioCtx.createOscillator(); 
            bOsc.type = (wg === 5 || wg === 3) ? 'sawtooth' : (isBoss ? 'square' : 'triangle'); 
            const bGain = audioCtx.createGain(); 
            bGain.gain.setValueAtTime(wg === 5 ? 0.1 : (isFinalBoss ? 0.5 : (isBoss ? 0.35 : 0.25)), now); 
            bGain.gain.exponentialRampToValueAtTime(0.01, now + (isFinalBoss ? 1.8 : (isBoss ? 0.3 : 0.8)));
            bOsc.connect(bGain); bGain.connect(audioCtx.destination);
            
            let bf = 0;
            if (isFinalBoss) bf = [32, 30, 27, 24][chordStep % 4]; 
            else if (isBoss) bf = [65, 55, 49, 41][chordStep % 4];
            else if (wg === 1) bf = [130, 146, 174, 196][chordStep % 4];
            else if (wg === 2) bf = [110, 87, 103, 82][chordStep % 4];
            else if (wg === 3) bf = [65, 61, 55, 51][chordStep % 4]; 
            else if (wg === 4) bf = [49, 43, 36, 32][chordStep % 4]; 
            else if (wg === 5) bf = [41, 38, 32, 30][chordStep % 4]; 
            
            bOsc.frequency.value = bf;
            bOsc.start(now); bOsc.stop(now + (isFinalBoss ? 1.8 : (isBoss ? 0.3 : 0.8)));
            chordStep++;
        }
        
        step++;
    }, speed);
}