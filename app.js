const STORAGE_KEY = "eunmi_ai_stock_v1";

const DEFAULT_STATE = {
  auth: { mode: "guest" },            // guest | member
  nav: { tab: "home" },               // home | portfolio | search | settings
  ui: { modal: null },                // null | login | adPolicy | adWatch
  ad: {
    guestAlwaysOn: true,              // 게스트는 배너 항상 노출(정책)
    hideUntil: 0                      // 회원이 1분 광고 완료 시: now + 24h
  }
};

let state = loadState();

// ---------- State Helpers ----------
function setState(patch) {
  state = deepMerge(state, patch);
  saveState(state);
  render();
}

function dispatch(action) {
  switch (action.type) {
    case "NAV_TO":
      setState({ nav: { tab: action.tab }, ui: { modal: null } });
      return;

    case "OPEN_MODAL":
      setState({ ui: { modal: action.modal } });
      return;

    case "CLOSE_MODAL":
      setState({ ui: { modal: null } });
      return;

    case "LOGIN_AS_MEMBER":
      setState({ auth: { mode: "member" }, ui: { modal: null } });
      return;

    case "LOGOUT_TO_GUEST":
      // 로그아웃하면 게스트 정책(배너 always on)으로 즉시 복귀
      setState({ auth: { mode: "guest" }, ui: { modal: null }, ad: { hideUntil: 0 } });
      return;

    case "AD_WATCH_DONE_1MIN":
      // 회원: 1분 광고 완료 -> 24시간 배너 숨김
      setState({ ad: { hideUntil: Date.now() + 24 * 60 * 60 * 1000 }, ui: { modal: null } });
      return;

    case "RESET_AD_HIDE":
      setState({ ad: { hideUntil: 0 } });
      return;

    default:
      console.warn("Unknown action:", action);
  }
}

// ---------- Rules ----------
function isMember() {
  return state.auth.mode === "member";
}

function isAdHiddenNow() {
  // 게스트는 숨김 불가(항상 노출)
  if (!isMember()) return false;
  return Date.now() < (state.ad.hideUntil || 0);
}

// ---------- Render ----------
function render() {
  // 상단/설정 화면 상태 표시
  const elMode1 = document.querySelector("[data-role='auth-mode']");
  const elMode2 = document.querySelector("[data-role='auth-mode-2']");
  if (elMode1) elMode1.textContent = isMember() ? "회원" : "게스트";
  if (elMode2) elMode2.textContent = isMember() ? "회원" : "게스트";

  // 화면 표시
  showOnly(`[data-screen='${state.nav.tab}']`, "[data-screen]");

  // 하단 탭 active
  document.querySelectorAll("[data-nav]").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-nav") === state.nav.tab);
  });

  // 로그인 버튼 문구 통일
  document.querySelectorAll("[data-action='open-login']").forEach(btn => {
    btn.textContent = isMember() ? "로그아웃" : "로그인하기";
  });

  // “로그인 필요” 버튼은 게스트면 로그인 모달로 유도, 회원이면 안내 모달(현재는 로그인 모달로 통일)
  document.querySelectorAll("[data-action='need-login']").forEach(btn => {
    btn.textContent = isMember() ? "기능 준비중" : "로그인하기";
    btn.disabled = isMember(); // 회원이면 아직 미구현이라 비활성
  });

  // 배너 표시
  const banner = document.querySelector("[data-role='banner']");
  if (banner) {
    const showBanner = !isAdHiddenNow();
    banner.style.display = showBanner ? "block" : "none";

    const desc = banner.querySelector("[data-role='banner-desc']");
    if (desc) {
      desc.textContent = isMember()
        ? (showBanner ? "회원: 배너 기본 ON. 1분 광고 시청 완료 시 24시간 숨김." : "회원: 24시간 배너 숨김 상태.")
        : "게스트: 배너 광고 24시간 노출(정책).";
    }
  }

  renderModal();
}

function renderModal() {
  const modalWrap = document.querySelector("[data-role='modal-wrap']");
  if (!modalWrap) return;

  const modal = state.ui.modal;

  if (!modal) {
    modalWrap.style.display = "none";
    modalWrap.innerHTML = "";
    return;
  }

  modalWrap.style.display = "flex";

  if (modal === "login") {
    modalWrap.innerHTML = `
      <div class="modal">
        <div class="modal-head">
          <div class="modal-title">로그인(테스트)</div>
          <button class="modal-x" data-action="close-modal">×</button>
        </div>
        <div class="modal-body">
          <div class="muted">
            지금은 테스트용이야.<br/>
            "로그인" 누르면 회원으로 전환되고 저장/알림 기능이 열림.<br/>
            ※ 실제 계정/DB는 다음 단계에서 붙임
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn ghost" data-action="close-modal">취소</button>
          <button class="btn primary" data-action="login-member">로그인</button>
        </div>
      </div>
    `;
    return;
  }

  if (modal === "adPolicy") {
    modalWrap.innerHTML = `
      <div class="modal">
        <div class="modal-head">
          <div class="modal-title">광고 정책</div>
          <button class="modal-x" data-action="close-modal">×</button>
        </div>
        <div class="modal-body">
          <div class="muted">
            - 게스트: 배너 광고 24시간 노출<br/>
            - 회원: 1분 광고 시청 완료 시 24시간 배너 숨김<br/><br/>
            상태: ${isMember() ? "회원" : "게스트"} ${isMember() ? (isAdHiddenNow() ? "(배너 숨김)" : "(배너 노출)") : "(항상 노출)"}
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn ghost" data-action="close-modal">닫기</button>
          ${isMember() ? `<button class="btn primary" data-action="open-adwatch">1분 광고 보기(테스트)</button>` : ``}
        </div>
      </div>
    `;
    return;
  }

  if (modal === "adWatch") {
    modalWrap.innerHTML = `
      <div class="modal">
        <div class="modal-head">
          <div class="modal-title">1분 광고 보기(테스트)</div>
          <button class="modal-x" data-action="close-modal">×</button>
        </div>
        <div class="modal-body">
          <div class="muted">
            실제 광고 SDK 연결 전이라 테스트 버튼으로 처리.<br/>
            완료 시 24시간 배너가 숨김 처리됨.
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn ghost" data-action="close-modal">닫기</button>
          <button class="btn primary" data-action="adwatch-done">완료 처리</button>
        </div>
      </div>
    `;
    return;
  }

  // fallback
  modalWrap.innerHTML = `
    <div class="modal">
      <div class="modal-head">
        <div class="modal-title">알림</div>
        <button class="modal-x" data-action="close-modal">×</button>
      </div>
      <div class="modal-body">
        <div class="muted">알 수 없는 모달 상태입니다.</div>
      </div>
      <div class="modal-foot">
        <button class="btn" data-action="close-modal">닫기</button>
      </div>
    </div>
  `;
}

// ---------- Events ----------
function bindEvents() {
  document.addEventListener("click", (e) => {
    const navBtn = e.target.closest("[data-nav]");
    if (navBtn) {
      dispatch({ type: "NAV_TO", tab: navBtn.getAttribute("data-nav") });
      return;
    }

    const act = e.target.closest("[data-action]");
    if (!act) return;

    const action = act.getAttribute("data-action");

    if (action === "open-login") {
      if (isMember()) dispatch({ type: "LOGOUT_TO_GUEST" });
      else dispatch({ type: "OPEN_MODAL", modal: "login" });
      return;
    }

    if (action === "need-login") {
      if (!isMember()) dispatch({ type: "OPEN_MODAL", modal: "login" });
      return;
    }

    if (action === "login-member") {
      dispatch({ type: "LOGIN_AS_MEMBER" });
      return;
    }

    if (action === "close-modal") {
      dispatch({ type: "CLOSE_MODAL" });
      return;
    }

    if (action === "open-adpolicy") {
      dispatch({ type: "OPEN_MODAL", modal: "adPolicy" });
      return;
    }

    if (action === "open-adwatch") {
      dispatch({ type: "OPEN_MODAL", modal: "adWatch" });
      return;
    }

    if (action === "adwatch-done") {
      dispatch({ type: "AD_WATCH_DONE_1MIN" });
      return;
    }

    if (action === "reset-ad-hide") {
      dispatch({ type: "RESET_AD_HIDE" });
      return;
    }
  });
}

// ---------- Storage ----------
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return deepMerge(structuredClone(DEFAULT_STATE), parsed);
  } catch (e) {
    console.warn("Failed to load state:", e);
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState(s) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch (e) {
    console.warn("Failed to save state:", e);
  }
}

// ---------- Utils ----------
function deepMerge(a, b) {
  if (typeof a !== "object" || a === null) return b;
  if (typeof b !== "object" || b === null) return b;

  const out = Array.isArray(a) ? [...a] : { ...a };
  for (const k of Object.keys(b)) {
    out[k] = deepMerge(a[k], b[k]);
  }
  return out;
}

function showOnly(selectorToShow, allSelector) {
  document.querySelectorAll(allSelector).forEach(el => {
    el.style.display = "none";
  });
  const target = document.querySelector(selectorToShow);
  if (target) target.style.display = "block";
}

// ---------- Init ----------
function init() {
  bindEvents();
  render();
}

document.addEventListener("DOMContentLoaded", init);
