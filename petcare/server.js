/* ───────────────────────────────────────────────────────────
   펫케어 로컬 서버 (의존성 없음 / 순수 Node)
   1) 정적 파일 서빙 (index.html, style.css, script.js, images ...)
   2) /api/adopt  →  data.go.kr 유기동물 조회 API 를 서버에서 대신 호출
                     (브라우저 CORS 우회 — 프론트는 같은 출처만 fetch)

   실행:  node server.js     →  http://localhost:3000
   ─────────────────────────────────────────────────────────── */
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const ROOT = __dirname;

/* data.go.kr 인증키: 환경 변수 또는 keys.local.json, 저장소에는 keys.example.json만 포함 */
let localKeys = {};
try {
  localKeys = require("./keys.local.json");
} catch (e) {}
const KEYS = {
  list: process.env.PETCARE_LIST_KEY || localKeys.list || "", // 유기동물 리스트
  photo: process.env.PETCARE_PHOTO_KEY || localKeys.photo || "", // 사진
};

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".ico": "image/x-icon",
};

/* data.go.kr 호출 (지정한 serviceKey 로) */
function callDataGoKr(serviceKey, query) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      _type: "json",
      numOfRows: query.numOfRows || "8",
      pageNo: "1",
      bgnde: query.bgnde,
      endde: query.endde,
    });
    if (query.upkind) params.set("upkind", query.upkind);

    // serviceKey는 URLSearchParams 밖에서 수동 결합 — 자동 인코딩 방지
    const url =
      "https://apis.data.go.kr/1543061/abandonmentPublicSrvc/abandonmentPublic?" +
      "serviceKey=" + serviceKey + "&" + params.toString();

    https
      .get(url, (r) => {
        let body = "";
        r.on("data", (c) => (body += c));
        r.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error("JSON 파싱 실패: " + body.slice(0, 200)));
          }
        });
      })
      .on("error", reject);
  });
}

async function handleAdopt(req, res, query) {
  const fmt = (d) => d.toISOString().slice(0, 10).replace(/-/g, "");
  const today = new Date();
  const q = {
    bgnde: fmt(new Date(today.getTime() - 30 * 864e5)),
    endde: fmt(today),
    upkind: query.upkind || "",
    numOfRows: "8",
  };

  /* 1차: 리스트 키 → 인증 실패 시 사진 키로 재시도 */
  let json;
  try {
    json = await callDataGoKr(KEYS.list, q);
    const code = json?.response?.header?.resultCode;
    if (code && code !== "00") {
      json = await callDataGoKr(KEYS.photo, q);
    }
  } catch (e) {
    res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: String(e.message || e) }));
    return;
  }

  let arr = json?.response?.body?.items?.item || [];
  if (!Array.isArray(arr)) arr = arr ? [arr] : [];
  const items = arr.map((it) => ({
    photo: it.popfile || it.filename || null,
    kind: (it.kindCd || "").replace(/^\[.*?\]\s*/, "") || "믹스",
    sex: it.sexCd,
    age: it.age,
    weight: it.weight,
    place: it.orgNm || it.happenPlace,
    shelter: it.careNm,
    state: it.processState || "보호중",
    species: (it.kindCd || "").includes("고양이") ? "cat" : "dog",
  }));

  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ items, resultCode: json?.response?.header?.resultCode }));
}

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === "/") rel = "/index.html";
  const filePath = path.join(ROOT, rel);

  /* 디렉터리 탈출 방지 */
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

http
  .createServer((req, res) => {
    const u = new URL(req.url, `http://localhost:${PORT}`);
    if (u.pathname === "/api/adopt") {
      handleAdopt(req, res, Object.fromEntries(u.searchParams));
    } else {
      serveStatic(req, res, u.pathname);
    }
  })
  .listen(PORT, () => {
    console.log(`펫케어 서버 실행 중 →  http://localhost:${PORT}`);
  });
