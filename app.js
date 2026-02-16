// =========================================
// 상태 관리 (localStorage 단일 소스)
// =========================================
const LS_KEYS = {
  MEMBER: "stock_member",          // "1"=회원, "0" 또는 null=게스트
  THEME: "stock_theme",            // "A"~"F"
  AD_HIDE_UNTIL: "stock_ad_hide_until" // 숫자(ms)
};

const state = {
  isMember: false,
  theme: "F",
  adHideUntil: 0,
  activeTab: "home",
  score: 76
};

const $ = (id) => document.getElementById(id);

// -----------------------------------------
// Storage
// -----------------------------------------
function loadState() {
  const member = localStorage.getItem(LS_KEYS.MEMBER);
  state.isMember = member === "1";

  const theme = localStorage.getItem(LS_KEYS.THEME);
  state.theme = theme || "F";

  const ad = localStorage.getItem(LS_KEYS.AD_HIDE_UNTIL);
  state.adHideUntil = ad ? Number(ad) : 0;
}

function saveMember(isMember) {
  state.isMember = !!isMember;
  localStorage.setItem(LS_KEYS.MEMBER, state.isMember ? "1" : "0");
}

function saveTheme(themeKey) {
  state.theme = themeKey;
  localStorage.setItem(LS_KEYS.THEME, themeKey);
}

function saveAdHideUntil(ms) {
  state.adHideUntil = ms;
  localStorage.setItem(LS_KEYS.AD_HIDE_UNTIL, String(ms));
}

// -----------------------------------------
// UI helpers
// -----------------------------------------
function setVisible(el, visible) {
  if (!el) return;
  el.classList.toggle("hidden", !visible);
}

function showModal(title, bodyText, actions = []) {
  $("modalTitle").textContent = title;
  $("modalBody").textContent = bodyText;

  const wrap = $("modalActions");
  wrap.innerHTML = "";

  actions.forEach(a => {
    const btn = document.createElement("button");
    btn.className = a.kind === "primary" ? "btn-primary"
                 : a.kind === "danger" ? "btn-danger"
                 : "btn-ghost";
    btn.textContent = a.label;
    btn.addEventListener("click", () => {
      if (a.onClick) a.onClick();
      closeModal();
    });
    wrap.appendChild(btn);
  });

  setVisible($("modal"), true);
}

function closeModal() {
  setVisible($("modal"), false);
}

function isAdHiddenNow() {
  if (!state.isMember) return false; // 게스트는 항상 노출(정책)
  return Date.now() < state.adHideUntil;
}

// -----------------------------------------
// 렌더링: "한 번에" 전부 갱신
// -----------------------------------------
function renderHeader() {
  $("userBadge").textContent = state.isMember ? "회원" : "게스트";
}

function renderTabs() {
  const tabIds = ["home","portfolio","search","settings"];
  tabIds.forEach(t => {
    const btn = document.querySelector(`.tab[data-tab="${t}"]`);
    if (btn) btn.classList.toggle("active", state.activeTab === t);
  });

  setVisible($("pageHome"), state.activeTab === "home");
  setVisible($("pagePortfolio"), state.activeTab === "portfolio");
  setVisible($("pageSearch"), state.activeTab === "search");
  setVisible($("pageSettings"), state.activeTab === "settings");
}

function renderMemberBlocks() {
  // guest-only / member-only 전체 처리
  document.querySelectorAll(".guest-only").forEach(el => {
    el.style.display = state.isMember ? "none" : "block";
  });
  document.querySelectorAll(".member-only").forEach(el => {
    el.style.display = state.isMember ? "block" : "none";
    // member-only는 기본 hidden일 수 있어 display로 풀어줬으니 hidden 제거
    el.classList.toggle("hidden", !state.isMember);
  });
}

function renderTheme() {
  const sel = $("themeSelect");
  if (sel) sel.value = state.theme;
  // 테마 색 적용까지 하고 싶으면 여기서 CSS 변수 바꾸면 됨.
}

function renderScore() {
  $("scoreNum").textContent = String(state.score);

  let label = "안정";
  let desc = "현재 보유 종목은 관리 가능한 흐름입니다. 급한 행동은 필요 없습니다.";
  if (state.score < 40) { label = "위험"; desc = "변동성이 큽니다. 리스크 점검이 필요합니다."; }
  else if (state.score < 70) { label = "주의"; desc = "주의 구간입니다. 무리한 진입은 피하세요."; }

  $("scoreLabel").textContent = label;
  $("scoreDesc").textContent = desc;

  // 게이지(원형) 퍼센트 반영: conic-gradient 비율 갱신
  const gauge = document.querySelector(".gauge");
  if (gauge) {
    const p = Math.max(0, Math.min(100, state.score));
    gauge.style.background = `conic-gradient(#19c37d 0 ${p}%, rgba(255,255,255,.09) 0)`;
  }
}

function renderAdState() {
  const t = $("adStateText");
  if (!t) return;

  if (!state.isMember) {
    t.textContent = "게스트는 항상 노출";
    return;
  }
  if (isAdHiddenNow()) {
    const leftMs = state.adHideUntil - Date.now();
    const leftMin = Math.ceil(leftMs / 60000);
    t.textContent = `배너 숨김 중 (약 ${leftMin}분 남음)`;
  } else {
    t.textContent = "배너 광고 노출(회원 기본 ON)";
  }
}

function renderAll() {
  renderHeader();
  renderTabs();
  renderMemberBlocks();
  renderTheme();
  renderScore();
  renderAdState();
}

// -----------------------------------------
// 이벤트
// -----------------------------------------
function setTab(tab) {
  state.activeTab = tab;
  renderAll();
}

function doLoginTest() {
  showModal(
    "로그인(테스트)",
    "지금은 테스트용이야.\n“로그인” 누르면 회원으로 전환되고 저장/알림 기능이 열림.\n※ 실제 계정/DB는 다음 단계에서 붙임",
    [
      { label: "취소", kind: "ghost" },
      { label: "로그인", kind: "primary", onClick: () => {
          saveMember(true);
          renderAll();
        }
      }
    ]
  );
}

function doLogout() {
  showModal(
    "로그아웃",
    "게스트로 전환할까?",
    [
      { label: "취소", kind: "ghost" },
      { label: "로그아웃", kind: "danger", onClick: () => {
          saveMember(false);
          renderAll();
        }
      }
    ]
  );
}

function showAdPolicy() {
  showModal(
    "광고 정책",
    state.isMember
      ? "회원: 배너 광고 기본 ON\n“1분 광고 보기” 완료 시 24시간 배너 숨김"
      : "게스트: 배너 광고 24시간 노출",
    [
      { label: "닫기", kind: "primary" },
      ...(state.isMember ? [{
        label: "1분 광고 보기(테스트)",
        kind: "primary",
        onClick: () => {
          // 테스트: 24시간 숨김 처리
          saveAdHideUntil(Date.now() + 24*60*60*1000);
          renderAll();
        }
      }] : [])
    ]
  );
}

function resetAd() {
  saveAdHideUntil(0);
  renderAll();
}

function runAnalysis() {
  // 지금은 데모: 점수 랜덤
  const next = Math.floor(30 + Math.random() * 70);
  state.score = next;
  renderAll();
}

function bindEvents() {
  // 탭
  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => setTab(btn.dataset.tab));
  });

  // 상단 버튼
  $("btnRefresh").addEventListener("click", () => location.reload());
  $("btnSearchTop").addEventListener("click", () => setTab("search"));

  // 테마
  $("themeSelect").addEventListener("change", (e) => {
    saveTheme(e.target.value);
    renderAll();
  });

  // 홈 액션
  $("btnRun").addEventListener("click", runAnalysis);
  $("btnSavedList").addEventListener("click", () => {
    if (!state.isMember) return doLoginTest();
    showModal("저장 리스트", "여기에 회원 저장 리스트 기능을 붙일 예정.", [{label:"닫기", kind:"primary"}]);
  });
  $("btnAlerts").addEventListener("click", () => {
    if (!state.isMember) return doLoginTest();
    showModal("알림 설정", "여기에 회원 알림 설정 기능을 붙일 예정.", [{label:"닫기", kind:"primary"}]);
  });

  // 광고 정책
  $("btnAdPolicy").addEventListener("click", showAdPolicy);

  // 로그인 버튼(각 페이지)
  $("btnLoginFromPortfolio").addEventListener("click", doLoginTest);
  $("btnLoginFromSearch").addEventListener("click", doLoginTest);

  // 설정
  $("btnAdReset").addEventListener("click", resetAd);
  $("btnLogout").addEventListener("click", doLogout);

  // 모달 닫기
  $("modalClose").addEventListener("click", closeModal);
  $("modal").addEventListener("click", (e) => {
    if (e.target === $("modal")) closeModal();
  });
}

// -----------------------------------------
// 부팅
// -----------------------------------------
(function boot() {
  loadState();
  bindEvents();
  renderAll();
})();
