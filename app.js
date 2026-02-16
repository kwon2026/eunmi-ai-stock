/* =========================
   StockGenius v1 (single-file app)
   - routing
   - state store
   - theme in settings
   - guest/member
   - banner ad: hide 24h after "watch"
========================= */

const STORE_KEY = "stockgenius_state_v1";

const defaultState = {
  route: "home",
  auth: { mode: "guest" }, // guest | member
  theme: "dokdo",          // dokdo | hanbok
  gauge: { score: 76, label: "안정" },
  ads: {
    bannerEnabled: true,
    bannerHiddenUntil: 0,  // timestamp ms
  },
  portfolio: {
    items: [
      { name: "ABC전자", price: 36300, change: 1200, pct: 3.85, note: "실제 데이터는 다음 단계" },
      { name: "NMF바이오", price: 17250, change: -1300, pct: -7.00, note: "UI만 우선" },
      { name: "123게임즈", price: 9320, change: 1160, pct: 14.20, note: "리스트/상세 연결 예정" },
    ]
  }
};

/* ===== Utilities ===== */
function now(){ return Date.now(); }
function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function formatNum(n){
  try { return n.toLocaleString("ko-KR"); }
  catch { return String(n); }
}

function formatChange(change){
  const sign = change > 0 ? "+" : "";
  return `${sign}${formatNum(change)}`;
}

function showToast(msg){
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.add("hidden"), 1600);
}

/* ===== Store ===== */
function loadState(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(!raw) return structuredClone(defaultState);
    const parsed = JSON.parse(raw);
    return mergeDeep(structuredClone(defaultState), parsed);
  }catch{
    return structuredClone(defaultState);
  }
}

function saveState(){
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function mergeDeep(target, source){
  if(typeof source !== "object" || source === null) return target;
  for(const k of Object.keys(source)){
    if(source[k] && typeof source[k] === "object" && !Array.isArray(source[k])){
      target[k] = mergeDeep(target[k] ?? {}, source[k]);
    } else {
      target[k] = source[k];
    }
  }
  return target;
}

let state = loadState();

/* ===== DOM ===== */
const pageEl = document.getElementById("page");
const userBadgeEl = document.getElementById("userBadge");
const loginModalEl = document.getElementById("loginModal");

const btnRefresh = document.getElementById("btnRefresh");
const btnTopSearch = document.getElementById("btnTopSearch");

const btnCloseLogin = document.getElementById("btnCloseLogin");
const btnCancelLogin = document.getElementById("btnCancelLogin");
const btnDoLogin = document.getElementById("btnDoLogin");

/* ===== Theme apply ===== */
function applyTheme(){
  document.body.classList.remove("theme-hanbok");
  // default is dokdo-like (no class)
  if(state.theme === "hanbok") document.body.classList.add("theme-hanbok");
}

/* ===== Auth badge ===== */
function applyAuthBadge(){
  userBadgeEl.textContent = state.auth.mode === "member" ? "회원" : "게스트";
}

/* ===== Routing ===== */
function setRoute(route){
  state.route = route;
  saveState();
  render();
}

function setActiveNav(){
  document.querySelectorAll(".navItem").forEach(btn=>{
    const r = btn.dataset.route;
    btn.classList.toggle("active", r === state.route);
  });
}

document.querySelectorAll(".navItem").forEach(btn=>{
  btn.addEventListener("click", ()=> setRoute(btn.dataset.route));
});

btnTopSearch.addEventListener("click", ()=> setRoute("search"));
btnRefresh.addEventListener("click", ()=>{
  // demo refresh: slightly vary score
  const delta = Math.floor(Math.random()*5) - 2; // -2..+2
  state.gauge.score = clamp(state.gauge.score + delta, 0, 100);
  state.gauge.label = state.gauge.score >= 70 ? "안정" : (state.gauge.score >= 40 ? "관망" : "주의");
  saveState();
  render();
  showToast("새로고침 완료");
});

/* ===== Modal handlers ===== */
function openLoginModal(){
  loginModalEl.classList.remove("hidden");
}
function closeLoginModal(){
  loginModalEl.classList.add("hidden");
}

btnCloseLogin.addEventListener("click", closeLoginModal);
btnCancelLogin.addEventListener("click", closeLoginModal);
btnDoLogin.addEventListener("click", ()=>{
  state.auth.mode = "member";
  saveState();
  closeLoginModal();
  applyAuthBadge();
  render();
  showToast("회원 모드로 전환됨");
});

loginModalEl.addEventListener("click", (e)=>{
  if(e.target === loginModalEl) closeLoginModal();
});

/* ===== Ads (24h hide after watch) ===== */
function isBannerVisible(){
  if(state.auth.mode !== "member") return false; // 게스트는 광고정책 안내만, 배너는 숨김(원하면 바꿀 수 있음)
  if(!state.ads.bannerEnabled) return false;
  return now() >= (state.ads.bannerHiddenUntil || 0);
}

function watchAdOneMinute(){
  // 실제 영상은 다음 단계. 지금은 “완료” 버튼 개념만 구현.
  state.ads.bannerHiddenUntil = now() + 24*60*60*1000; // 24h
  saveState();
  render();
  showToast("24시간 배너 숨김 처리");
}

/* =========================
   Page Templates
========================= */
function HomePage(){
  const score = clamp(state.gauge.score, 0, 100);
  const deg = Math.round(score * 2.6); // 0..260deg (nice arc)
  const ringStyle = `background: conic-gradient(from 220deg, var(--accent) ${deg}deg, rgba(255,255,255,0.18) 0deg);`;

  return `
    <section class="card">
      <div class="cardHeader">
        <h2 class="h2">오늘 상태 요약</h2>
        <div class="small">${state.auth.mode === "member" ? "회원 모드" : "게스트 모드"}</div>
      </div>

      <div class="gaugeWrap">
        <div class="gauge" aria-label="상태 게이지">
          <div class="gaugeRingShadow"></div>
          <div class="gaugeRing" style="${ringStyle}"></div>
          <div class="gaugeText">
            <div class="score">${score}</div>
            <div class="label">${escapeHtml(state.gauge.label)}</div>
          </div>
        </div>
      </div>

      <p class="muted" style="text-align:center; margin: 10px 6px 0 6px;">
        현재 보유 종목은 관리 가능한 흐름입니다. 급한 행동은 필요 없습니다.
      </p>

      <div class="mt16">
        <button class="btn primary" id="btnRun">분석 실행</button>
      </div>

      <div class="pills">
        <div class="pill disabled">차트</div>
        <div class="pill disabled">뉴스</div>
        <div class="pill disabled">리스크</div>
      </div>
    </section>

    <section class="card">
      <div class="cardHeader">
        <h2 class="h2">저장 리스트</h2>
      </div>
      <div class="small">
        관심 종목 저장/삭제/정렬(회원 기능). 지금은 UI 자리만 잡아둠.
      </div>
      <div class="mt12">
        <button class="btn ghost" id="btnList">
          기능 준비중
        </button>
      </div>
    </section>

    <section class="card">
      <div class="cardHeader">
        <h2 class="h2">알림</h2>
      </div>
      <div class="small">
        점수 변동/리스크 상승 알림(회원 기능). 지금은 UI 자리만 잡아둠.
      </div>
      <div class="mt12">
        <button class="btn ghost" id="btnAlarm">
          기능 준비중
        </button>
      </div>
    </section>

    ${state.auth.mode === "member" ? BannerCard() : ""}

    <section class="card">
      <div class="cardHeader">
        <h2 class="h2">빠른 안내</h2>
      </div>
      <div class="small">
        테마 선택은 이제 <b>설정</b>에 있습니다. 홈에는 검색/요약만 남겨서 더 깔끔하게 갑니다.
      </div>
    </section>
  `;
}

function BannerCard(){
  const visible = isBannerVisible();
  const onOff = state.ads.bannerEnabled ? "on" : "";
  const statusText = visible ? "ON" : "숨김(24h)";
  return `
    <section class="card">
      <div class="cardHeader">
        <h2 class="h2">배너 광고</h2>
        <div class="small">회원: 배너 기본 ON · “1분 광고 보기” 완료 시 24시간 숨김</div>
      </div>

      <div class="bannerRow">
        <div class="toggle">
          <div class="switch ${onOff}" id="swBanner" role="switch" aria-checked="${state.ads.bannerEnabled}">
            <div class="knob"></div>
          </div>
          <div>
            <div style="font-weight:900;">상태: ${statusText}</div>
            <div class="small">배너를 켜두면 UI 아래에 노출됩니다.</div>
          </div>
        </div>

        <button class="btn smallBtn primary" id="btnAdWatch" style="max-width:140px;">
          1분 보기
        </button>
      </div>

      ${visible ? `
        <div class="mt16 small">
          <b>배너 표시 중</b> (실제 광고 SDK는 다음 단계에서 연결)
        </div>
      ` : `
        <div class="mt16 small">
          <b>현재 배너 숨김 상태</b> · 숨김 해제는 설정에서 “광고 다시 켜기(테스트)”로 가능
        </div>
      `}
    </section>
  `;
}

function PortfolioPage(){
  const items = state.portfolio.items || [];
  const locked = state.auth.mode !== "member";

  return `
    <section class="card">
      <div class="cardHeader">
        <h2 class="h2">포트폴리오</h2>
        <div class="small">현재 자산은 관리 가능한 범위입니다. (다음 단계: 보유종목 리스트 + 상세 페이지 연결)</div>
      </div>

      ${locked ? `
        <div class="row gap16">
          <button class="btn primary" id="btnNeedLogin">로그인하기</button>
        </div>
        <div class="mt12 small">
          게스트는 포트폴리오 저장/관리 기능이 잠겨 있습니다.
        </div>
      ` : `
        <div class="small">샘플 리스트(추후 DB 연결 예정)</div>
        <hr class="sep"/>
        ${items.map(renderPortfolioItem).join("")}
      `}
    </section>
  `;
}

function renderPortfolioItem(it){
  const ch = it.change;
  const pct = it.pct;
  const sign = ch >= 0 ? "+" : "";
  const pctSign = pct >= 0 ? "+" : "";
  return `
    <div class="card" style="margin: 10px 0; padding: 14px;">
      <div class="row" style="justify-content:space-between;">
        <div style="font-weight:900; font-size:16px;">${escapeHtml(it.name)}</div>
        <div class="small">${escapeHtml(it.note || "")}</div>
      </div>
      <div class="mt8 muted" style="font-weight:900;">
        ${formatNum(it.price)} · ${sign}${formatNum(ch)} (${pctSign}${pct}%)
      </div>
    </div>
  `;
}

function SearchPage(){
  const locked = state.auth.mode !== "member";
  return `
    <section class="card">
      <div class="cardHeader">
        <h2 class="h2">검색</h2>
        <div class="small">종목 검색/추가 기능 자리(다음 단계에서 연결)</div>
      </div>

      ${locked ? `
        <button class="btn primary" id="btnSearchLogin">로그인하기</button>
        <div class="mt12 small">게스트는 검색/추가 기능이 제한됩니다.</div>
      ` : `
        <div class="small">여기에 검색창 + 결과 리스트가 들어갈 예정</div>
        <div class="mt12">
          <button class="btn ghost" id="btnSearchDemo">기능 준비중</button>
        </div>
      `}
    </section>
  `;
}

function SettingsPage(){
  const isMember = state.auth.mode === "member";
  const themeLabel = state.theme === "hanbok" ? "F. 고운한복" : "E. 독도막걸리";

  return `
    <section class="card">
      <div class="cardHeader">
        <h2 class="h2">설정</h2>
        <div class="small">현재 상태</div>
      </div>

      <div class="row" style="justify-content:space-between;">
        <div>
          <div style="font-weight:900; font-size:16px;">${isMember ? "회원" : "게스트"}</div>
          <div class="small">${isMember ? "저장/알림 UI 사용 가능" : "게스트 제한/광고 정책 적용"}</div>
        </div>
        ${isMember ? `
          <button class="btn smallBtn ghost" id="btnLogout" style="max-width:130px;">게스트로</button>
        ` : `
          <button class="btn smallBtn primary" id="btnLogin" style="max-width:130px;">로그인하기</button>
        `}
      </div>

      <hr class="sep"/>

      <div class="card" style="margin:0; padding:14px;">
        <div class="cardHeader" style="margin-bottom:8px;">
          <h2 class="h2">테마 선택</h2>
          <div class="small">지금 적용: <b>${themeLabel}</b></div>
        </div>

        <div class="small">※ 프리미엄 글자 표시는 안 넣었다. 테마는 모두 동일 기능.</div>

        <div class="mt12">
          <button class="btn ghost" id="btnThemeDokdo">E. 독도막걸리 (다크)</button>
        </div>
        <div class="mt12">
          <button class="btn ghost" id="btnThemeHanbok">F. 고운한복 (한지)</button>
        </div>
      </div>

      <hr class="sep"/>

      <div class="card" style="margin:0; padding:14px;">
        <div class="cardHeader" style="margin-bottom:8px;">
          <h2 class="h2">게스트 제한</h2>
          <div class="small">- 저장 리스트 관리 불가<br/>- 알림 설정 불가</div>
        </div>
        <div class="small">게스트는 핵심 요약만 제공하고, 관리 기능은 회원에서 열립니다.</div>
      </div>

      <hr class="sep"/>

      <div class="card" style="margin:0; padding:14px;">
        <div class="cardHeader" style="margin-bottom:8px;">
          <h2 class="h2">회원 광고 정책</h2>
          <div class="small">- 배너 광고 기본 ON<br/>- “1분 광고 보기” 완료 시 24시간 배너 숨김</div>
        </div>

        ${isMember ? `
          <div class="mt12">
            <button class="btn ghost" id="btnAdReset">광고 다시 켜기(테스트)</button>
          </div>
        ` : `
          <div class="mt12 small">회원 전용(로그인 시 테스트 가능)</div>
        `}
      </div>
    </section>
  `;
}

/* =========================
   Render + Bind
========================= */
function render(){
  applyTheme();
  applyAuthBadge();
  setActiveNav();

  const route = state.route;
  if(route === "home") pageEl.innerHTML = HomePage();
  else if(route === "portfolio") pageEl.innerHTML = PortfolioPage();
  else if(route === "search") pageEl.innerHTML = SearchPage();
  else pageEl.innerHTML = SettingsPage();

  bindPageEvents();
}

function bindPageEvents(){
  // HOME
  const btnRun = document.getElementById("btnRun");
  if(btnRun){
    btnRun.addEventListener("click", ()=>{
      showToast("분석 실행(데모)");
      // demo: nudge score
      const delta = Math.floor(Math.random()*9) - 4; // -4..+4
      state.gauge.score = clamp(state.gauge.score + delta, 0, 100);
      state.gauge.label = state.gauge.score >= 70 ? "안정" : (state.gauge.score >= 40 ? "관망" : "주의");
      saveState();
      render();
    });
  }

  // Banner controls
  const swBanner = document.getElementById("swBanner");
  if(swBanner){
    swBanner.addEventListener("click", ()=>{
      state.ads.bannerEnabled = !state.ads.bannerEnabled;
      saveState();
      render();
      showToast(state.ads.bannerEnabled ? "배너 ON" : "배너 OFF");
    });
  }
  const btnAdWatch = document.getElementById("btnAdWatch");
  if(btnAdWatch){
    btnAdWatch.addEventListener("click", ()=>{
      watchAdOneMinute();
    });
  }

  // PORTFOLIO
  const btnNeedLogin = document.getElementById("btnNeedLogin");
  if(btnNeedLogin) btnNeedLogin.addEventListener("click", openLoginModal);

  // SEARCH
  const btnSearchLogin = document.getElementById("btnSearchLogin");
  if(btnSearchLogin) btnSearchLogin.addEventListener("click", openLoginModal);
  const btnSearchDemo = document.getElementById("btnSearchDemo");
  if(btnSearchDemo) btnSearchDemo.addEventListener("click", ()=> showToast("다음 단계에서 연결"));

  // SETTINGS
  const btnLogin = document.getElementById("btnLogin");
  if(btnLogin) btnLogin.addEventListener("click", openLoginModal);

  const btnLogout = document.getElementById("btnLogout");
  if(btnLogout){
    btnLogout.addEventListener("click", ()=>{
      state.auth.mode = "guest";
      saveState();
      render();
      showToast("게스트 모드로 전환됨");
    });
  }

  const btnThemeDokdo = document.getElementById("btnThemeDokdo");
  if(btnThemeDokdo){
    btnThemeDokdo.addEventListener("click", ()=>{
      state.theme = "dokdo";
      saveState();
      render();
      showToast("독도막걸리 테마 적용");
    });
  }

  const btnThemeHanbok = document.getElementById("btnThemeHanbok");
  if(btnThemeHanbok){
    btnThemeHanbok.addEventListener("click", ()=>{
      state.theme = "hanbok";
      saveState();
      render();
      showToast("고운한복 테마 적용");
    });
  }

  const btnAdReset = document.getElementById("btnAdReset");
  if(btnAdReset){
    btnAdReset.addEventListener("click", ()=>{
      state.ads.bannerHiddenUntil = 0;
      state.ads.bannerEnabled = true;
      saveState();
      render();
      showToast("배너 다시 표시");
    });
  }
}

/* ===== Safe HTML ===== */
function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

/* ===== Init ===== */
applyTheme();
applyAuthBadge();
render();
