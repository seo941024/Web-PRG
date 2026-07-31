#!/usr/bin/env node
// gif_frames.js — GIF를 프레임별 PNG로 추출한다 (의존성 없음, Node 내장 zlib만 사용)
//
// 왜 만들었나: tools/extract_gif_frames.py 는 Python + Pillow가 필요한데,
// 환경에 따라 python이 Windows Store 스텁이라 실행이 안 되는 경우가 있다.
// 이 스크립트는 Node만 있으면 어디서든 돈다.
//
// 사용법:
//   node tools/gif_frames.js <입력.gif> <출력디렉터리> [이름1,이름2,...]
//
//   이름 목록을 주면 프레임 i가 <출력디렉터리>/<이름[i]>.png 로 저장된다.
//   생략하면 frame_00.png, frame_01.png ... 형식으로 저장된다.
//
// 예) 8방향 회전 시트를 방향 이름으로 저장
//   node tools/gif_frames.js sprites/raw/boss1/Idle_rotations_8dir.gif sprites/raw/boss1 \
//        south,south-east,east,north-east,north,north-west,west,south-west
//
// ⚠️ 회전 시트의 프레임 순서는 툴마다 다를 수 있다. 반드시 결과를 눈으로 확인할 것.
//    (PixelLab 8방향 회전은 south에서 시작해 시계방향이었다)

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// ── GIF 파싱 ────────────────────────────────────────────────
function parseGif(buf) {
    let p = 0;
    const sig = buf.toString("ascii", 0, 6);
    if (sig !== "GIF87a" && sig !== "GIF89a") throw new Error("GIF 파일이 아닙니다: " + sig);
    p = 6;

    const width = buf.readUInt16LE(p); p += 2;
    const height = buf.readUInt16LE(p); p += 2;
    const packed = buf[p]; p += 1;
    p += 2; // 배경색 인덱스 + 픽셀 종횡비

    const hasGCT = !!(packed & 0x80);
    const gctSize = 2 << (packed & 0x07);
    let gct = null;
    if (hasGCT) { gct = buf.slice(p, p + gctSize * 3); p += gctSize * 3; }

    const frames = [];
    let gce = null; // 직전 Graphic Control Extension

    while (p < buf.length) {
        const block = buf[p];

        if (block === 0x3B) break;              // Trailer

        if (block === 0x21) {                    // Extension
            p += 1;
            const label = buf[p]; p += 1;
            if (label === 0xF9) {                // Graphic Control
                const size = buf[p]; p += 1;
                const flags = buf[p];
                const delay = buf.readUInt16LE(p + 1);
                const transIdx = buf[p + 3];
                gce = {
                    disposal: (flags >> 2) & 0x07,
                    hasTrans: !!(flags & 0x01),
                    transIdx, delay,
                };
                p += size;
                p += 1;                          // block terminator
            } else {
                // 그 외 확장(주석·애플리케이션 등)은 통째로 건너뛴다.
                // 여기서 p를 먼저 +1 하면 안 된다 — 현재 위치가 이미 첫 하위 블록의 "길이" 바이트다.
                // (예전에 +1을 해서 NETSCAPE 확장의 'N'(0x4E=78)을 길이로 읽고 78바이트를 건너뛰어
                //  파싱이 통째로 어긋났고, 그 결과 LZW가 쓰레기 데이터를 물고 메모리가 폭주했다)
                while (p < buf.length && buf[p] !== 0) p += buf[p] + 1;
                p += 1;
            }
            continue;
        }

        if (block === 0x2C) {                    // Image Descriptor
            p += 1;
            const ix = buf.readUInt16LE(p); p += 2;
            const iy = buf.readUInt16LE(p); p += 2;
            const iw = buf.readUInt16LE(p); p += 2;
            const ih = buf.readUInt16LE(p); p += 2;
            const ipacked = buf[p]; p += 1;

            const hasLCT = !!(ipacked & 0x80);
            const interlaced = !!(ipacked & 0x40);
            const lctSize = 2 << (ipacked & 0x07);
            let lct = null;
            if (hasLCT) { lct = buf.slice(p, p + lctSize * 3); p += lctSize * 3; }

            const minCode = buf[p]; p += 1;

            // LZW 데이터 하위 블록 합치기
            const chunks = [];
            while (buf[p] !== 0) {
                const len = buf[p]; p += 1;
                chunks.push(buf.slice(p, p + len)); p += len;
            }
            p += 1;
            const lzw = Buffer.concat(chunks);

            let indices = lzwDecode(lzw, minCode, iw * ih);
            if (interlaced) indices = deinterlace(indices, iw, ih);

            frames.push({
                x: ix, y: iy, w: iw, h: ih,
                palette: lct || gct,
                indices,
                disposal: gce ? gce.disposal : 0,
                hasTrans: gce ? gce.hasTrans : false,
                transIdx: gce ? gce.transIdx : -1,
            });
            gce = null;
            continue;
        }

        p += 1; // 알 수 없는 바이트는 건너뜀
    }

    return { width, height, frames };
}

// GIF의 가변 비트폭 LZW 디코더
function lzwDecode(data, minCodeSize, pixelCount) {
    const clearCode = 1 << minCodeSize;
    const eoiCode = clearCode + 1;
    let codeSize = minCodeSize + 1;
    let dict = [];
    const resetDict = () => {
        dict = new Array(clearCode + 2);
        for (let i = 0; i < clearCode; i++) dict[i] = [i];
        codeSize = minCodeSize + 1;
    };
    resetDict();

    const out = new Uint8Array(pixelCount);
    let outPos = 0;
    let bitPos = 0;
    let prev = null;

    const readCode = () => {
        let code = 0;
        for (let i = 0; i < codeSize; i++) {
            const byte = data[bitPos >> 3];
            if (byte === undefined) return eoiCode;
            code |= ((byte >> (bitPos & 7)) & 1) << i;
            bitPos++;
        }
        return code;
    };

    const MAX_DICT = 4096; // GIF 규격상 코드는 12비트까지 — 여기서 사전 증가를 멈춘다
    while (outPos < pixelCount) {
        const code = readCode();
        if (code === eoiCode) break;
        if (code === clearCode) { resetDict(); prev = null; continue; }

        let entry;
        if (code < dict.length && dict[code]) entry = dict[code];
        else if (prev) entry = prev.concat(prev[0]);
        else break;

        for (let i = 0; i < entry.length && outPos < pixelCount; i++) out[outPos++] = entry[i];

        // 사전이 가득 차면 더 늘리지 않는다. 이 상한이 없으면 codeSize가 12를 넘어
        // 매 코드마다 사전이 무한히 커지면서 메모리가 폭주한다.
        if (prev && dict.length < MAX_DICT) {
            dict.push(prev.concat(entry[0]));
            if (dict.length === (1 << codeSize) && codeSize < 12) codeSize++;
        }
        prev = entry;
    }
    return out;
}

// 인터레이스 GIF의 행 순서를 원래대로 되돌림
function deinterlace(src, w, h) {
    const dst = new Uint8Array(src.length);
    const passes = [[0, 8], [4, 8], [2, 4], [1, 2]];
    let row = 0;
    for (const [start, step] of passes) {
        for (let y = start; y < h; y += step) {
            dst.set(src.subarray(row * w, (row + 1) * w), y * w);
            row++;
        }
    }
    return dst;
}

// ── 프레임 합성 (disposal 처리) ─────────────────────────────
function composeFrames(gif) {
    const { width: W, height: H, frames } = gif;
    const canvas = new Uint8Array(W * H * 4); // RGBA, 초기값 투명
    const out = [];

    for (const f of frames) {
        // disposal=3(이전 상태 복원)에 대비해 백업
        const backup = f.disposal === 3 ? Uint8Array.from(canvas) : null;

        for (let yy = 0; yy < f.h; yy++) {
            for (let xx = 0; xx < f.w; xx++) {
                const idx = f.indices[yy * f.w + xx];
                if (f.hasTrans && idx === f.transIdx) continue; // 투명 픽셀은 아래를 유지
                const cx = f.x + xx, cy = f.y + yy;
                if (cx < 0 || cy < 0 || cx >= W || cy >= H) continue;
                const d = (cy * W + cx) * 4;
                const s = idx * 3;
                canvas[d] = f.palette[s];
                canvas[d + 1] = f.palette[s + 1];
                canvas[d + 2] = f.palette[s + 2];
                canvas[d + 3] = 255;
            }
        }

        out.push(Uint8Array.from(canvas)); // 이 시점의 화면을 프레임으로 확정

        if (f.disposal === 2) {            // 배경색으로 지우기 → 투명 처리
            for (let yy = 0; yy < f.h; yy++) {
                for (let xx = 0; xx < f.w; xx++) {
                    const cx = f.x + xx, cy = f.y + yy;
                    if (cx < 0 || cy < 0 || cx >= W || cy >= H) continue;
                    canvas.fill(0, (cy * W + cx) * 4, (cy * W + cx) * 4 + 4);
                }
            }
        } else if (f.disposal === 3 && backup) {
            canvas.set(backup);
        }
    }
    return { W, H, images: out };
}

// ── PNG 인코딩 ──────────────────────────────────────────────
const CRC_TABLE = (() => {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        t[n] = c;
    }
    return t;
})();
function crc32(buf) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
}
function encodePng(rgba, w, h) {
    // 각 스캔라인 앞에 필터 바이트 0을 붙인 원시 데이터
    const raw = Buffer.alloc((w * 4 + 1) * h);
    for (let y = 0; y < h; y++) {
        raw[y * (w * 4 + 1)] = 0;
        Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4)
            .copy(raw, y * (w * 4 + 1) + 1);
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
    ihdr[8] = 8;    // bit depth
    ihdr[9] = 6;    // color type: RGBA
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
        chunk("IHDR", ihdr),
        chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
        chunk("IEND", Buffer.alloc(0)),
    ]);
}

// ── main ────────────────────────────────────────────────────
const [, , inPath, outDir, namesArg] = process.argv;
if (!inPath || !outDir) {
    console.error("사용법: node tools/gif_frames.js <입력.gif> <출력디렉터리> [이름1,이름2,...]");
    process.exit(1);
}
const gif = parseGif(fs.readFileSync(inPath));
const { W, H, images } = composeFrames(gif);
const names = namesArg ? namesArg.split(",").map(s => s.trim()) : null;

fs.mkdirSync(outDir, { recursive: true });
images.forEach((img, i) => {
    const name = names ? (names[i] || `frame_${String(i).padStart(2, "0")}`)
                       : `frame_${String(i).padStart(2, "0")}`;
    const file = path.join(outDir, name + ".png");
    fs.writeFileSync(file, encodePng(img, W, H));
    console.log(`${file}  (${W}x${H})`);
});
console.log(`\n${images.length}개 프레임 추출 완료 (${W}x${H})`);
