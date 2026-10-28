/* ═══════════════════════════════════════════════════════════
   펫케어 — 메인 스크립트
   ───────────────────────────────────────────────────────────
   API 키 설정 — 아래 두 칸에 발급받은 키를 넣으면 실데이터로 작동해요.
   비워두면 키 없이 데모(샘플 데이터)로 표시됩니다.

   • dataGoKrKey : 공공데이터포털(data.go.kr) "유기동물 조회 서비스"
                   신청 → 일반 인증키(Decoding) 복사해서 붙여넣기
   • kakaoKey    : 카카오 개발자(developers.kakao.com) JavaScript 키
                   내 애플리케이션 → 플랫폼 → Web에 사이트 도메인 등록 필요
   ═══════════════════════════════════════════════════════════ */
/* 키 값은 config.js에서 읽음, 저장소에는 config.example.js만 포함 */
const CONFIG = {
  dataGoKrKey: "",
  kakaoKey: "",
  ...(window.PETCARE_CONFIG || {}),
};

/* 짧은 셀렉터 헬퍼 */
const $ = (id) => document.getElementById(id);

/* ── 상태 관리 (localStorage) ── */
let currentUser = JSON.parse(localStorage.getItem("petcare_user") || "null");

function saveUser(u) {
  currentUser = u;
  localStorage.setItem("petcare_user", JSON.stringify(u));
}

/* ── 페이지 초기화 ── */
function initPage() {
  if (currentUser) {
    renderLoggedIn();
  } else {
    renderLoggedOut();
  }
}

function renderLoggedIn() {
  const verified = currentUser.verified;
  const name = currentUser.name;

  // 네비 업데이트
  $("navActions").innerHTML = `
    <span class="nav-user-badge">${verified ? "" : ""} ${name} 님</span>
    ${!verified ? `<button class="btn btn-outline btn-sm" onclick="openAuthModal()">동물등록 인증</button>` : ""}
    <button class="btn btn-ghost btn-sm" onclick="doLogout()">로그아웃</button>
  `;

  // 커뮤니티 표시
  $("communityLocked").style.display = "none";
  $("communityContent").style.display = "block";

  // 인증 유도 배너
  const banner = $("communityVerifyBanner");
  if (banner) banner.style.display = verified ? "none" : "flex";

  // 일기 이름
  const el = $("diaryPetName");
  if (el) el.textContent = name + " 님네 아이";
}

function renderLoggedOut() {
  $("navActions").innerHTML = `
    <button class="btn btn-outline btn-sm" onclick="openLoginModal('login')">로그인</button>
    <button class="btn btn-primary btn-sm" onclick="openLoginModal('signup')">회원가입</button>
  `;
  $("communityLocked").style.display = "block";
  $("communityContent").style.display = "none";
}

/* ── 회원가입 / 로그인 모달 ── */
function openLoginModal(tab) {
  switchTab(tab);
  openModal("loginModal");
}

function switchTab(tab) {
  $("formSignup").style.display = tab === "signup" ? "block" : "none";
  $("formLogin").style.display = tab === "login" ? "block" : "none";
  $("tabSignup").classList.toggle("active", tab === "signup");
  $("tabLogin").classList.toggle("active", tab === "login");
}

function doSignup() {
  const name = $("signupName").value.trim();
  const email = $("signupEmail").value.trim();
  const pw = $("signupPw").value;
  const pw2 = $("signupPw2").value;
  let ok = true;

  const show = (id, cond) => {
    $(id).style.display = cond ? "block" : "none";
    if (cond) ok = false;
  };
  show("errSignupName", !name);
  show("errSignupEmail", !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  show("errSignupPw", pw.length < 6);
  show("errSignupPw2", pw !== pw2);
  if (!ok) return;

  // localStorage에 계정 저장 (비밀번호는 실제 서비스에선 절대 이렇게 저장 안 함)
  const accounts = JSON.parse(localStorage.getItem("petcare_accounts") || "{}");
  if (accounts[email]) {
    $("errSignupEmail").textContent = "이미 가입된 이메일이에요";
    $("errSignupEmail").style.display = "block";
    return;
  }
  accounts[email] = { name, pw };
  localStorage.setItem("petcare_accounts", JSON.stringify(accounts));

  saveUser({ name, email, verified: false });
  closeModal("loginModal");
  initPage();
  showToast(`${name} 님, 환영해요!`);
}

function doLogin() {
  const email = $("loginEmail").value.trim();
  const pw = $("loginPw").value;
  const accounts = JSON.parse(localStorage.getItem("petcare_accounts") || "{}");
  const acc = accounts[email];
  const errEl = $("errLoginEmail");

  if (!acc || acc.pw !== pw) {
    errEl.textContent = "이메일 또는 비밀번호가 올바르지 않아요";
    errEl.style.display = "block";
    return;
  }
  errEl.style.display = "none";

  // 계정에 저장된 인증 상태 복원
  saveUser({
    name: acc.name,
    email,
    verified: acc.verified || false,
    petNums: acc.petNums || [],
  });
  closeModal("loginModal");
  initPage();
  showToast(`${acc.name} 님, 반갑습니다!`);
}

function doLogout() {
  localStorage.removeItem("petcare_user");
  currentUser = null;
  renderLoggedOut();
  showToast("로그아웃 됐어요");
}

/* ── 동물등록번호 인증 ── */
function checkAuthInput(el) {
  el.value = el.value.replace(/\D/g, "");
  $("authSubmit").disabled = el.value.length !== 15;
}

/* 등록번호 목록을 완료 화면에 렌더 (markLast=true면 마지막 항목에 "방금 등록" 배지) */
function renderPetNumbers(petNums, markLast) {
  return petNums
    .map(
      (n, i) =>
        `<div class="pet-num-row">
          <span class="pet-num-icon"></span>
          <span class="pet-num-val">${n}</span>
          ${markLast && i === petNums.length - 1 ? '<span class="pet-num-new">방금 등록</span>' : ""}
        </div>`,
    )
    .join("");
}

function submitAuth() {
  const val = $("authInput").value;
  if (val.length !== 15) return;

  // 기존 등록 번호 목록 가져오기
  const accounts = JSON.parse(localStorage.getItem("petcare_accounts") || "{}");
  const email = currentUser.email;
  if (!accounts[email]) return;

  const petNums = accounts[email].petNums || [];
  if (!petNums.includes(val)) petNums.push(val);
  accounts[email].petNums = petNums;
  accounts[email].verified = true;
  localStorage.setItem("petcare_accounts", JSON.stringify(accounts));

  saveUser({ ...currentUser, verified: true, petNums });
  initPage();

  // 완료 화면으로 전환
  $("authFormView").style.display = "none";
  $("authDoneView").style.display = "block";
  $("authDoneNumbers").innerHTML = renderPetNumbers(petNums, true);
}

function addAnotherPet() {
  $("authDoneView").style.display = "none";
  $("authFormView").style.display = "block";
  $("authInput").value = "";
  $("authSubmit").disabled = true;
}

function openAuthModal() {
  if (!currentUser) {
    openLoginModal("login");
    return;
  }
  if (currentUser.verified && currentUser.petNums && currentUser.petNums.length > 0) {
    // 이미 인증된 상태 → 완료 화면 바로 표시
    $("authFormView").style.display = "none";
    $("authDoneView").style.display = "block";
    $("authDoneNumbers").innerHTML = renderPetNumbers(currentUser.petNums, false);
  } else {
    // 미인증 → 입력 화면
    $("authFormView").style.display = "block";
    $("authDoneView").style.display = "none";
    const input = $("authInput");
    if (input) input.value = "";
    const btn = $("authSubmit");
    if (btn) btn.disabled = true;
  }
  openModal("authModal");
}

/* ── 커뮤니티 ── */
function connectMentor(name) {
  if (!currentUser) {
    openLoginModal("login");
    return;
  }
  if (!currentUser.verified) {
    showToast("멘토 연결은 동물등록번호 인증 후 가능해요");
    setTimeout(() => openAuthModal(), 1200);
    return;
  }
  showToast(`${name} 님에게 연결 요청을 보냈어요!`);
}

function openDiaryModal() {
  if (!currentUser) {
    openLoginModal("login");
    return;
  }
  if (!currentUser.verified) {
    showToast("성장 일기는 동물등록번호 인증 후 가능해요");
    setTimeout(() => openAuthModal(), 1200);
    return;
  }
  $("diaryText").value = "";
  document
    .querySelectorAll("#diaryModal input[type=checkbox]")
    .forEach((cb) => (cb.checked = false));
  openModal("diaryModal");
}

function saveDiary() {
  const text = $("diaryText").value.trim();
  if (!text) {
    showToast("일기 내용을 입력해주세요");
    return;
  }

  const tags = [
    ...document.querySelectorAll("#diaryModal input[type=checkbox]:checked"),
  ].map((cb) => cb.value);
  const today = new Date();
  const day = today.getDate();

  const entry = document.createElement("div");
  entry.className = "diary-day";
  entry.innerHTML = `
    <div class="diary-date"><strong>${day}</strong>일</div>
    <div class="diary-content">
      <p></p>
      ${tags.length ? `<div class="diary-icons">${tags.map((t) => `<span class="diary-icon">${t}</span>`).join("")}</div>` : ""}
    </div>
  `;
  // 사용자 입력은 textContent로 안전하게 삽입 (XSS 방지)
  entry.querySelector(".diary-content p").textContent = text;
  $("diaryEntries").prepend(entry);
  closeModal("diaryModal");
  showToast("일기가 저장됐어요!");
}

function exportPDF() {
  if (!currentUser) {
    openLoginModal("login");
    return;
  }
  if (!currentUser.verified) {
    showToast("PDF 내보내기는 동물등록번호 인증 후 가능해요");
    return;
  }
  showToast("PDF 내보내기 기능은 서버 연동 후 제공될 예정이에요");
}

/* ── 반려동물 선택 ── */
function selectPet(el) {
  document
    .querySelectorAll(".hero-pet-card")
    .forEach((c) => {
      c.classList.remove("active");
      c.setAttribute("aria-pressed", "false");
    });
  el.classList.add("active");
  el.setAttribute("aria-pressed", "true");
}

/* ── 체크리스트 ── */
document.querySelectorAll("#checklistItems input[type=checkbox]").forEach((cb) => {
  cb.addEventListener("change", () => {
    $("checkCount").textContent =
      document.querySelectorAll("#checklistItems input:checked").length;
  });
});

/* ── 예산 계산기 ── */
function updateBudget(val) {
  const fee = parseInt(val);
  $("adoptFeeLabel").textContent = fee.toLocaleString();
  $("bAdopt").textContent = fee.toLocaleString() + "원";
  $("budgetTotal").textContent = (fee + 200000).toLocaleString() + "원";
}

/* ── 성향 퀴즈 ── */
let quizStep = 1;
const quizQuestions = [
  {
    q: "하루에 산책이나 외출에 쓸 수 있는 시간은?",
    opts: ["1시간 이상", "30분 정도", "거의 없음", "재택근무라 항상"],
  },
  {
    q: "현재 거주 형태는?",
    opts: ["마당 있는 주택", "아파트/오피스텔", "원룸", "반려동물 불가 건물"],
  },
  {
    q: "반려동물 비용으로 월 얼마 지출 가능한가요?",
    opts: ["5만원 이하", "5~15만원", "15~30만원", "제한 없음"],
  },
  {
    q: "원하는 교감 방식은?",
    opts: ["같이 달리고 뛰기", "쓰다듬고 안기", "조용히 옆에 있기", "바라보는 것만으로 충분"],
  },
  {
    q: "털빠짐 감당 가능한가요?",
    opts: ["털? 상관없음", "적당히는 괜찮음", "최대한 적게", "털 알레르기 있음"],
  },
];
const QUIZ_TOTAL = quizQuestions.length;

function nextQuiz(el) {
  document.querySelectorAll(".quiz-option").forEach((o) => o.classList.remove("selected"));
  el.classList.add("selected");
  setTimeout(() => {
    quizStep = Math.min(quizStep + 1, QUIZ_TOTAL);
    $("quizBar").style.width = (quizStep / QUIZ_TOTAL) * 100 + "%";
    $("quizStep").textContent = `질문 ${quizStep} / ${QUIZ_TOTAL}`;
    const q = quizQuestions[quizStep - 1];
    $("quizQ").textContent = q.q;
    $("quizOptions").innerHTML = q.opts
      .map((o) => `<div class="quiz-option" onclick="nextQuiz(this)">${o}</div>`)
      .join("");
    if (quizStep === QUIZ_TOTAL) setTimeout(() => openModal("quizModal"), 800);
  }, 300);
}

/* ── 바디랭귀지 ── */
function showBodyLang(title, emoji, desc) {
  $("modalTitle").textContent = title;
  $("modalEmoji").textContent = emoji;
  $("modalDesc").textContent = desc;
  openModal("bodyLangModal");
}

/* ── 위험 음식·식물 검색 ──
   레벨 프리셋: D(매우 위험) / C(주의) / S(안전)
   _alias 로 같은 설명을 공유하는 동의어를 묶는다. */
const LV = {
  D: { title: "매우 위험 — 절대 금지", color: "#FFEBEE", border: "#E53935" },
  C: { title: "주의 필요 — 가급적 금지", color: "#FFF9E6", border: "#F59E0B" },
  S: { title: "안전 — 적당히 OK", color: "#EDF7F1", border: "#4CAF7D" },
};

/* [이름들], 레벨, 설명 */
const DANGER_RAW = [
  // ── 음식: 매우 위험 ──
  [["포도", "건포도", "머스캣"], "D", "강아지·고양이 모두 급성 신부전을 일으킬 수 있어요. 건포도도 동일하게 위험합니다. 소량이라도 절대 금지."],
  [["초콜릿", "다크초콜릿", "코코아"], "D", "테오브로민 성분이 심장·신경계에 독성을 일으켜요. 다크 초콜릿일수록 위험도가 높습니다."],
  [["양파", "파", "대파", "쪽파", "마늘", "부추", "샬롯"], "D", "적혈구를 파괴해 빈혈을 일으켜요. 익히거나 가루로 만들어도 독성은 그대로입니다."],
  [["자일리톨", "껌", "무설탕사탕"], "D", "강아지에게 급격한 저혈당과 간부전을 일으켜요. 무설탕 껌·사탕에 흔히 들어 있습니다."],
  [["마카다미아", "마카다미아넛"], "D", "강아지에게 구토·무기력·고열·뒷다리 마비를 일으킬 수 있어요."],
  [["카페인", "커피", "녹차", "에너지드링크"], "D", "심장 박동을 비정상적으로 높여 위험해요. 커피 찌꺼기도 주의하세요."],
  [["알코올", "술", "맥주", "와인"], "D", "소량으로도 구토·호흡곤란·혼수에 이를 수 있어요. 절대 금지."],
  [["복숭아씨", "자두씨", "살구씨", "체리씨", "사과씨"], "D", "씨앗에 시안화물이 들어 있어 중독을 일으켜요. 과육은 괜찮아도 씨는 반드시 제거하세요."],
  [["익힌뼈", "닭뼈", "갈비뼈"], "D", "익힌 뼈는 날카롭게 쪼개져 식도·장을 찢을 수 있어요. 생뼈도 권장하지 않습니다."],
  [["빵반죽", "생반죽", "이스트"], "D", "위 속에서 부풀며 가스와 알코올을 만들어 매우 위험해요."],
  [["소금", "짠음식", "건어물"], "D", "과다 섭취 시 나트륨 중독으로 구토·발작을 일으킬 수 있어요."],

  // ── 식물: 매우 위험 ──
  [["백합", "나리"], "D", "고양이에게 치명적이에요. 꽃가루만 핥아도 신부전으로 사망할 수 있어 집에 두면 안 됩니다."],
  [["튤립", "수선화", "히아신스"], "D", "구근에 독성이 강해요. 구토·설사·심장 이상을 일으킵니다."],
  [["진달래", "철쭉"], "D", "소량으로도 구토·서맥·발작을 일으키는 강한 독성 식물이에요."],
  [["협죽도", "은방울꽃", "디기탈리스"], "D", "심장 독성이 매우 강해 치명적일 수 있어요. 정원에 있으면 주의하세요."],
  [["디펜바키아", "칼라디움", "필로덴드론"], "D", "수산칼슘 결정이 입·혀를 붓게 하고 호흡곤란을 일으킬 수 있어요."],

  // ── 주의 필요 ──
  [["아보카도"], "C", "페르신 성분이 소화기 이상을 일으킬 수 있어요. 씨는 질식 위험도 있으니 주지 않는 게 안전합니다."],
  [["우유", "치즈", "유제품", "아이스크림"], "C", "대부분 유당을 소화 못 해 설사·복통을 일으켜요. 반려동물용 락토프리만 소량 주세요."],
  [["호두", "아몬드", "땅콩", "견과류"], "C", "소화가 어렵고 지방이 많아 췌장염 위험이 있어요. 곰팡이 핀 견과는 특히 위험."],
  [["감자", "생감자", "감자싹"], "C", "익힌 감자는 소량 가능하지만 생감자·싹·껍질의 솔라닌은 독성이 있어요."],
  [["토마토", "방울토마토"], "C", "잘 익은 과육은 소량 가능하나, 덜 익은 열매와 줄기·잎은 독성이 있어요."],
  [["은행", "은행나무"], "C", "구토·경련을 일으킬 수 있어 권장하지 않아요."],
  [["알로에"], "C", "잎의 성분이 구토·설사를 일으켜요. 반려동물이 갉아먹지 않게 하세요."],
  [["포인세티아", "고무나무", "포토스", "스킨답서스", "아이비", "몬스테라"], "C", "수액·잎이 입안 자극, 구토·설사를 일으킬 수 있어요. 화분은 닿지 않는 곳에 두세요."],
  [["수국"], "C", "잎·꽃에 미량의 시안 성분이 있어 구토·설사를 일으킬 수 있어요."],

  // ── 안전 ──
  [["당근"], "S", "적당량의 당근은 건강에 좋아요! 다만 당분이 있으니 과다 급여는 피하세요."],
  [["사과"], "S", "씨와 심을 제거하면 안전해요. 비타민이 풍부합니다. (씨는 위험)"],
  [["바나나"], "S", "소량이면 좋은 간식이에요. 당분이 높으니 조금씩만 주세요."],
  [["고구마", "단호박", "호박"], "S", "익혀서 으깨 주면 소화에 좋아요. 식이섬유가 풍부합니다."],
  [["블루베리", "딸기", "수박"], "S", "항산화 간식으로 좋아요. 수박·딸기는 씨를 빼고 소량씩 주세요."],
  [["오이", "브로콜리"], "S", "저칼로리 간식이에요. 브로콜리는 익혀서 소량만 주세요."],
  [["닭가슴살", "삶은닭"], "S", "양념 없이 삶은 닭가슴살은 좋은 단백질 간식이에요. 뼈는 반드시 제거하세요."],
];

/* 평탄화: 이름 → 데이터 */
const dangerDB = {};
for (const [names, lv, desc] of DANGER_RAW) {
  for (const n of names) dangerDB[n] = { ...LV[lv], desc, level: "" };
}

function searchDanger() {
  const q = $("foodSearch").value.trim().replace(/\s+/g, "");
  const result = $("dangerResult");

  let data = dangerDB[q];
  // 부분 일치: "다크초콜릿" → "초콜릿", "방울토마토" → "토마토"
  if (!data && q) {
    const key = Object.keys(dangerDB).find((k) => q.includes(k) || k.includes(q));
    if (key) data = dangerDB[key];
  }
  if (!data) {
    data = {
      level: "",
      title: "검색 결과 없음",
      desc: "데이터베이스에 없는 항목이에요. 확실하지 않으면 동물병원이나 수의사에게 직접 문의해 주세요.",
      color: "#F5F5F5",
      border: "#ddd",
    };
  }

  $("dangerEmoji").textContent = data.level;
  $("dangerTitle").textContent = data.title;
  $("dangerDesc").textContent = data.desc;
  result.style.borderColor = data.border;
  result.style.background = data.color;
  result.classList.add("show");
}

function quickSearch(q) {
  $("foodSearch").value = q;
  searchDanger();
  $("dangerResult").scrollIntoView({ behavior: "smooth", block: "center" });
}

$("foodSearch").addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchDanger();
});

/* ── 모달 공통 ── */
function openModal(id) {
  $(id).classList.add("open");
}
function closeModal(id) {
  $(id).classList.remove("open");
}
document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("open");
  });
});
// ESC 키로 열린 모달 닫기
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-overlay.open").forEach((m) => m.classList.remove("open"));
  }
});

/* ── 토스트 ── */
let toastTimer;
function showToast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
}

/* ═══════════════════════════════════════════════════════════
   유기동물 입양 — 공공데이터포털 유기동물 조회 서비스
   ═══════════════════════════════════════════════════════════ */
let adoptFilter = "all";
const UPKIND = { dog: "417000", cat: "422400" };

function setAdoptFilter(f, btn) {
  adoptFilter = f;
  document.querySelectorAll(".adopt-filter").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  loadAdopt();
}

async function loadAdopt() {
  const grid = $("adoptGrid");
  const notice = $("adoptNotice");
  grid.innerHTML = '<div class="adopt-loading">보호 중인 친구들을 불러오는 중...</div>';

  let items = [],
    live = false;
  if (CONFIG.dataGoKrKey) {
    try {
      items = await fetchAbandoned();
      live = items.length > 0;
    } catch (e) {
      console.warn("유기동물 API 호출 실패 — 데모로 표시합니다.", e);
    }
  }
  if (!items.length) items = demoAdopt();

  renderAdopt(items);
  notice.textContent = live ? "※ 공공데이터포털 실시간 유기동물 정보입니다." : "";
}

/* 로컬 server.js 프록시(/api/adopt)를 통해 호출 — 같은 출처라 CORS 없음.
   인증키는 서버(server.js)에서만 사용하고 브라우저엔 노출하지 않는다. */
async function fetchAbandoned() {
  const params = new URLSearchParams();
  if (adoptFilter !== "all") params.set("upkind", UPKIND[adoptFilter]);
  const res = await fetch("/api/adopt?" + params.toString());
  if (!res.ok) throw new Error("프록시 응답 오류: " + res.status);
  const json = await res.json();
  return json.items || [];
}

/* 키 없을 때 데모 — 외부 사진 호출 없이 이모지 플레이스홀더만 사용 */
function demoAdopt() {
  const data = {
    dog: [
      { kind: "초코", age: "2021년생", weight: "8.5kg" },
      { kind: "보리", age: "2019년생", weight: "3.2kg" },
      { kind: "콩이", age: "2022년생", weight: "15kg" },
      { kind: "두부", age: "2015년생", weight: "4.0kg" },
      { kind: "호두", age: "2023년생", weight: "9.1kg" },
    ],
    cat: [
      { kind: "나나", age: "2022년생", weight: "4.2kg" },
      { kind: "비비", age: "2020년생", weight: "5.0kg" },
      { kind: "먼지", age: "2023년생", weight: "3.5kg" },
      { kind: "치즈", age: "2021년생", weight: "4.8kg" },
    ],
  };
  const places = ["서울 마포구", "경기 고양시", "인천 부평구", "서울 강서구", "경기 수원시"];
  const shelters = ["행복유기동물보호소", "한국동물구조관리협회", "시립동물보호센터", "우리동물보호센터"];
  const plan =
    adoptFilter === "all"
      ? ["dog", "cat", "dog", "cat", "dog", "cat", "dog", "cat"]
      : Array(8).fill(adoptFilter);

  return plan.map((sp, i) => {
    const d = data[sp][i % data[sp].length];
    // 무료 이미지 — 유기/믹스 샘플이라 품종 매칭은 안 되고, 종(강아지/고양이)만 맞춘다.
    // 카드마다 id로 고정해 새로고침해도 같은 사진이 나온다.
    const photo =
      sp === "cat"
        ? `https://cataas.com/cat?width=300&height=300&u=${i + 1}`
        : `https://placedog.net/300/300?id=${i + 1}`;
    return {
      photo,
      species: sp,
      kind: d.kind,
      sex: Math.random() > 0.5 ? "M" : "F",
      age: d.age,
      weight: d.weight,
      place: places[i % places.length],
      shelter: shelters[i % shelters.length],
      state: "보호중",
    };
  });
}

function renderAdopt(items) {
  const grid = $("adoptGrid");
  if (!items.length) {
    grid.innerHTML = '<div class="adopt-loading">표시할 동물이 없어요</div>';
    return;
  }
  grid.innerHTML = items
    .map((it) => {
      const emoji = it.species === "cat" ? "" : "";
      const sexTxt = it.sex === "M" ? "수컷" : it.sex === "F" ? "암컷" : "성별미상";
      const photo = it.photo
        ? `<img src="${it.photo}" alt="${it.kind}" loading="lazy" onerror="this.parentElement.textContent='${emoji}'">`
        : emoji;
      return `<article class="adopt-card">
      <div class="adopt-photo">${photo}</div>
      <div class="adopt-body">
        <div class="adopt-kind">${emoji} ${it.kind}</div>
        <div class="adopt-meta">${sexTxt} · ${it.age || "나이미상"} · ${it.weight || "-"}<br>${it.place || "-"}<br>${it.shelter || "-"}</div>
        <span class="adopt-badge">${it.state}</span>
      </div>
    </article>`;
    })
    .join("");
}

/* ═══════════════════════════════════════════════════════════
   카카오맵 — 멘토 위치 + 주변 동물병원 검색
   ═══════════════════════════════════════════════════════════ */
const MENTOR_LOCS = [
  { name: "김민준", lat: 37.5495, lng: 126.9136 }, // 합정
  { name: "이지아", lat: 37.5556, lng: 126.9015 }, // 망원
  { name: "박서준", lat: 37.553, lng: 126.918 }, // 서교
];
let kakaoMap = null,
  kakaoLoaded = false;

function initKakaoMap() {
  if (!CONFIG.kakaoKey) return; // 키 없으면 안내 placeholder 유지
  const s = document.createElement("script");
  s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${CONFIG.kakaoKey}&libraries=services&autoload=false`;
  s.onload = () =>
    kakao.maps.load(() => {
      kakaoLoaded = true;
      initKakaoMapWithLocation();
    });
  s.onerror = () => {
    $("petMap").textContent = "카카오맵 로드 실패 — 키와 도메인 등록을 확인하세요";
  };
  document.head.appendChild(s);
}

function renderMap(userLat, userLng) {
  const box = $("petMap");
  box.innerHTML = "";
  const lat = userLat || 37.5535;
  const lng = userLng || 126.911;
  const center = new kakao.maps.LatLng(lat, lng);
  kakaoMap = new kakao.maps.Map(box, { center, level: 4 });

  // 내 위치 마커
  if (userLat) {
    new kakao.maps.Marker({
      map: kakaoMap,
      position: center,
      title: "내 위치",
    });
  }

  MENTOR_LOCS.forEach((m) => {
    const mk = new kakao.maps.Marker({
      map: kakaoMap,
      position: new kakao.maps.LatLng(m.lat, m.lng),
    });
    const iw = new kakao.maps.InfoWindow({
      content: `<div style="padding:5px 9px;font-size:12px">${m.name} 멘토</div>`,
    });
    kakao.maps.event.addListener(mk, "click", () => iw.open(kakaoMap, mk));
  });

  // 지도 로드 후 바로 주변 검색 실행
  findVets();
}

function initKakaoMapWithLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => renderMap(pos.coords.latitude, pos.coords.longitude),
      () => renderMap(), // 권한 거부 시 기본 위치
      { timeout: 5000 }
    );
  } else {
    renderMap();
  }
}

function findVets() {
  if (!CONFIG.kakaoKey || !kakaoLoaded || !kakaoMap) return;
  const ps = new kakao.maps.services.Places();
  const center = kakaoMap.getCenter();
  const list = $("vetList");
  list.innerHTML = `<div style="padding:8px;color:#888;font-size:.82rem">검색 중...</div>`;
  ps.keywordSearch(
    "동물병원",
    (data, status) => {
      if (status !== kakao.maps.services.Status.OK) {
        list.innerHTML = `<div style="padding:8px;color:#888;font-size:.82rem">주변 동물병원을 찾지 못했어요</div>`;
        return;
      }
      list.innerHTML = data
        .slice(0, 5)
        .map(
          (p) =>
            `<div class="vet-item"><span class="vname">${p.place_name}</span><span class="vdist">${(p.distance / 1000).toFixed(1)}km</span></div>`,
        )
        .join("");
      data.slice(0, 5).forEach(
        (p) =>
          new kakao.maps.Marker({
            map: kakaoMap,
            position: new kakao.maps.LatLng(p.y, p.x),
          }),
      );
    },
    {
      location: center,
      radius: 5000,
      sort: kakao.maps.services.SortBy.DISTANCE,
    },
  );
}

/* ═══════════════════════════════════════════════════════════
   갤러리 슬라이더
   ═══════════════════════════════════════════════════════════ */
const GALLERY_TOTAL = 6;
let galleryCurrentSlide = 0;

function galleryImgError(img, filename) {
  img.parentElement.innerHTML = `<div class="gallery-ph"><small>${filename}</small></div>`;
}

function getVisibleSlides() {
  return window.innerWidth >= 768 ? 3 : 1;
}

function moveSlider(dir) {
  const maxSlide = GALLERY_TOTAL - getVisibleSlides();
  galleryCurrentSlide = Math.max(0, Math.min(galleryCurrentSlide + dir, maxSlide));
  updateGallery();
}

function goToSlide(idx) {
  const maxSlide = GALLERY_TOTAL - getVisibleSlides();
  galleryCurrentSlide = Math.max(0, Math.min(idx, maxSlide));
  updateGallery();
}

function updateGallery() {
  const track = $("galleryTrack");
  const slide = track.querySelector(".gallery-slide");
  if (!slide) return;
  const slideW = slide.offsetWidth + 20; // 20px = CSS gap
  track.style.transform = `translateX(-${galleryCurrentSlide * slideW}px)`;
  document.querySelectorAll(".gallery-dot").forEach((dot, i) => {
    dot.classList.toggle("active", i === galleryCurrentSlide);
    dot.setAttribute("aria-selected", i === galleryCurrentSlide ? "true" : "false");
  });
}

function initGallery() {
  const visible = getVisibleSlides();
  const totalDots = GALLERY_TOTAL - visible + 1;
  const dotsEl = $("galleryDots");
  dotsEl.innerHTML = Array.from(
    { length: totalDots },
    (_, i) =>
      `<button class="gallery-dot${i === 0 ? " active" : ""}" onclick="goToSlide(${i})" role="tab" aria-label="${i + 1}번 슬라이드" aria-selected="${i === 0}"></button>`,
  ).join("");
}

// 리사이즈 시 debounce 적용 (불필요한 재계산 방지)
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    galleryCurrentSlide = 0;
    initGallery();
    updateGallery();
  }, 150);
});

/* ── 시작 ── */
initPage();
loadAdopt();
initKakaoMap();
initGallery();
if (window.lucide) lucide.createIcons();
