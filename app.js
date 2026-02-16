// 스톡지능 - single file app (no build)
// 목표: 사진 같은 "독도막걸리(다크)" / "고운한복(한지)" 텍스처 + 글래스 카드 느낌
// 구조: Home / Portfolio / Search / Settings
// 테마 선택은 Settings로 이동 (요청 반영)

const THEMES = [
  { key: "A", name: "A. 고급 금융", hint: "골드 포인트" },
  { key: "B", name: "B. 심리 안정형", hint: "하늘빛 소프트" },
  { key: "C", name: "C. 애플 미니멀", hint: "밝고 미니멀" },
  { key: "D", name: "D. 기간형", hint: "차분한 딥톤" },
  { key: "E", name: "E. 독도막걸리 (다크)", hint: "먹빛 텍스처" },
  { key: "F", name: "F. 고운한복 (한지)", hint: "한지/분홍 결" },
];

const state = {
  tab: "home",       // home | portfolio | search | settings
  isMember: true,    // 회원/게스트 UI
  theme: "E",        // 기본: 독도막걸리
  score: 78,
  statusText: "안정",
  modalOpen: false,
  searchQuery: "",
};

const $app = document.getElementById("app");

function setTheme(themeKey){
  state.theme = themeKey;
  document.body.setAttribute("data-theme", themeKey);
  render();
}

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function statusFromScore(score){
  if(score >= 80) return "안정";
  if(score >= 60) return "관망";
  if(score >= 40) return "주의";
  return "경계";
}

function scoreDesc(score){
  if(score >= 80) return "현재 보유 종목은 관리 가능한 흐름입니다. 급한 행동은 필요 없습니다.";
  if(score >= 60) return "관망이 유리합니다. 신호가 명확해질 때까지 지켜보세요.";
  if(score >= 40) return "리스크 점검이 필요합니다. 손절/비중 조절을 고려하세요.";
  return "위험 구간입니다. 즉시 포지션 정리 또는 방어 전략이 필요합니다.";
}

function iconSvg(name){
  // 최소한만: 새로고침 / 검색
  if(name === "refresh"){
    return `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M21 3v6h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }
  if(name === "search"){
    return `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" stroke-width="2"/>
      <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  }
  return "";
}

function openLoginModal(){
  state.modalOpen = true;
  render();
}
function closeModal(){
  state.modalOpen = false;
  render();
}
function doLoginTest(){
  // 테스트용: 게스트/회원 토글
  state.isMember = true;
  state.modalOpen = false;
  render();
}
function toGuest(){
  state.isMember = false;
  render();
}
function randomize(){
  const s = clamp(Math.floor(30 + Math.random()*65), 0, 99);
  state.score = s;
  state.statusText = statusFromScore(s);
  render();
}

function nav(tab){
  state.tab = tab;
  render();
}

function Home(){
  const p = `${clamp(state.score,0,100)}%`;
  const modeText = state.isMember ? "회원" : "게스트";
  const modeMeta = state.isMember ? "저장/알림 UI 사용 가능" : "게스트 모드";

  return `
    <div class="card section">
      <div class="sectionTitleRow">
        <h2 class="sectionTitle">오늘 상태 요약</h2>
        <div class="sectionMeta">${modeMeta}</div>
      </div>

      <div class="ringWrap">
        <div class="ring" style="--p:${p}">
          <div class="ringCenter">
            <div>
              <div class="bigScore">${state.score}</div>
              <div class="status">${state.statusText}</div>
            </div>
          </div>
        </div>
        <p class="desc">${scoreDesc(state.score)}</p>
      </div>

      <button class="primaryBtn" id="runBtn">분석 실행</button>

      <div class="pills">
        <button class="pill active" data-pill="chart">차트</button>
        <button class="pill" data-pill="news">뉴스</button>
        <button class="pill" data-pill="risk">리스크</button>
      </div>

      <div class="featureGrid">
        <div class="feature">
          <h3>검색</h3>
          <p>홈에서는 “검색/요약”만 남겨서 깔끔하게. 종목을 찾아 추가하는 기능은 검색 탭에서 연결.</p>
          <div class="searchBar">
            <input class="searchInput" id="searchInput" placeholder="종목명/티커 검색..." value="${escapeHtml(state.searchQuery)}" />
            <button class="searchGo" id="searchGo">${iconSvg("search")}</button>
          </div>
        </div>

        <div class="feature">
          <h3>저장 리스트</h3>
          <p>관심 종목 저장/삭제/정렬(회원 기능). 지금은 UI 자리만 잡아둠.</p>
          <button class="smallBtn" ${state.isMember ? "" : "disabled"}>${state.isMember ? "기능 준비중" : "회원 전용"}</button>
        </div>

        <div class="feature">
          <h3>알림</h3>
          <p>점수 변동/리스크 상승 알림(회원 기능). 지금은 UI 자리만 잡아둠.</p>
          <button class="smallBtn" ${state.isMember ? "" : "disabled"}>${state.isMember ? "기능 준비중" : "회원 전용"}</button>
        </div>

        <div class="feature">
          <h3>빠른 안내</h3>
          <p>테마 선택은 이제 설정에 있습니다. 홈에는 검색/요약만 남겨서 더 “있어 보이게” 구성했습니다.</p>
        </div>
      </div>
    </div>
  `;
}

function Portfolio(){
  return `
    <div class="card section">
      <div class="sectionTitleRow">
        <h2 class="sectionTitle">포트폴리오</h2>
        <div class="sectionMeta">다음 단계에서 실제 연동</div>
      </div>
      <hr class="sep"/>
      <p class="desc" style="text-align:left">
        현재는 UI 뼈대만. 나중에 “보유종목/수익률/리밸런싱” 카드 추가하면 사진처럼 더 고급스럽게 만들 수 있어.
      </p>
      <button class="smallBtn" id="mockPort">예시 데이터 보기(테스트)</button>
    </div>
  `;
}

function Search(){
  // 게스트일 때는 로그인 유도 (기존 컨셉 유지)
  if(!state.isMember){
    return `
      <div class="card section">
        <div class="sectionTitleRow">
          <h2 class="sectionTitle">검색</h2>
          <div class="sectionMeta">게스트 모드</div>
        </div>
        <hr class="sep"/>
        <p class="desc" style="text-align:left">
          게스트는 검색/추가 기능이 제한됩니다. 테스트 로그인으로 회원 UI를 열 수 있어요.
        </p>
        <button class="primaryBtn" id="loginBtn">로그인하기</button>
      </div>
    `;
  }

  return `
    <div class="card section">
      <div class="sectionTitleRow">
        <h2 class="sectionTitle">검색</h2>
        <div class="sectionMeta">종목 검색/추가 자리</div>
      </div>
      <hr class="sep"/>
      <div class="searchBar">
        <input class="searchInput" id="searchInput2" placeholder="종목명/티커 검색..." value="${escapeHtml(state.searchQuery)}" />
        <button class="searchGo" id="searchGo2">${iconSvg("search")}</button>
      </div>

      <div class="featureGrid">
        <div class="feature">
          <h3>검색 결과</h3>
          <p>여기에 결과 리스트(카드 형태) 붙이면 사진처럼 “고급 앱” 느낌이 확 살아남.</p>
          <button class="smallBtn">기능 준비중</button>
        </div>
      </div>
    </div>
  `;
}

function Settings(){
  const modeText = state.isMember ? "회원" : "게스트";

  return `
    <div class="card section">
      <div class="sectionTitleRow">
        <h2 class="sectionTitle">설정</h2>
        <div class="sectionMeta">현재 상태</div>
      </div>

      <div class="featureGrid">
        <div class="feature">
          <div class="sectionTitleRow">
            <div>
              <h3 style="margin:0 0 4px">현재 모드</h3>
              <p style="margin:0;color:var(--muted)">${modeText} · ${state.isMember ? "저장/알림 UI 사용 가능" : "게스트 제한"}</p>
            </div>
            <button class="smallBtn" id="toggleMode" style="width:auto;padding:0 14px;height:44px">
              ${state.isMember ? "게스트로" : "회원(테스트)"}
            </button>
          </div>
        </div>

        <div class="feature">
          <h3 style="margin:0 0 6px">테마 선택</h3>
          <p style="margin:0;color:var(--muted)">사진처럼 보이는 핵심. 독도막걸리/고운한복을 우선 완성.</p>

          <div class="themeGrid">
            ${THEMES.map(t => `
              <button class="themeBtn" data-theme="${t.key}">
                <div>
                  ${t.name}
                  <div><small>${t.hint}</small></div>
                </div>
                ${state.theme === t.key ? `<span class="badge">적용중</span>` : `<span class="badge">선택</span>`}
              </button>
            `).join("")}
          </div>

          <div class="miniNote">
            ※ 네가 원한대로 “홈 화면”에서 테마 선택 UI는 빼고, 설정으로 옮겼어.<br/>
            홈은 “요약 + 검색”만 남겨서 더 깔끔/고급스럽게 보이게 구성.
          </div>
        </div>

        <div class="feature">
          <h3 style="margin:0 0 6px">광고 정책(테스트)</h3>
          <p style="margin:0;color:var(--muted)">배너 기본 ON · “1분 광고 보기” 완료 시 24시간 배너 숨김</p>
          <button class="smallBtn">광고 다시 켜기(테스트)</button>
        </div>
      </div>
    </div>
  `;
}

function Modal(){
  if(!state.modalOpen) return "";

  return `
    <div class="modalOverlay show" id="modalOverlay">
      <div class="modal card">
        <div class="modalTop">
          <div class="modalTitle">로그인(테스트)</div>
          <button class="closeBtn" id="closeModal">✕</button>
        </div>
        <p>
          지금은 테스트용이야.<br/>
          “로그인” 누르면 <b>회원</b>으로 전환되고 저장/알림 기능 UI가 열린다.<br/>
          <span style="color:var(--muted2)">※ 실제 계정/DB는 다음 단계에서 붙임</span>
        </p>
        <div class="modalActions">
          <button id="cancelModal">취소</button>
          <button class="ok" id="okModal">로그인</button>
        </div>
      </div>
    </div>
  `;
}

function Header(){
  return `
    <div class="header">
      <div class="brand">
        <div class="logo"><span>📊</span></div>
        <div>
          <h1>스톡지능</h1>
          <div class="sub">${state.isMember ? "회원" : "게스트"}</div>
        </div>
      </div>

      <div class="headerActions">
        <button class="iconBtn" id="refreshBtn" title="새로고침">${iconSvg("refresh")}</button>
        <button class="iconBtn" id="topSearchBtn" title="검색">${iconSvg("search")}</button>
      </div>
    </div>
  `;
}

function BottomNav(){
  const items = [
    { key:"home", label:"홈", icon:"⌂" },
    { key:"portfolio", label:"포트폴리오", icon:"★" },
    { key:"search", label:"검색", icon:"🔎" },
    { key:"settings", label:"설정", icon:"⚙" },
  ];

  return `
    <div class="bottomNav">
      ${items.map(it => `
        <div class="navItem ${state.tab===it.key ? "active":""}" data-nav="${it.key}">
          <div class="i">${it.icon}</div>
          <div class="t">${it.label}</div>
        </div>
      `).join("")}
    </div>
  `;
}

function Screen(){
  if(state.tab === "home") return Home();
  if(state.tab === "portfolio") return Portfolio();
  if(state.tab === "search") return Search();
  return Settings();
}

function render(){
  document.body.setAttribute("data-theme", state.theme);

  $app.innerHTML = `
    <div class="texture"></div>
    <div class="shell">
      ${Header()}
      ${Screen()}
    </div>
    ${BottomNav()}
    ${Modal()}
  `;

  // Header actions
  const refreshBtn = document.getElementById("refreshBtn");
  refreshBtn?.addEventListener("click", () => randomize());

  const topSearchBtn = document.getElementById("topSearchBtn");
  topSearchBtn?.addEventListener("click", () => nav("search"));

  // Home buttons
  document.getElementById("runBtn")?.addEventListener("click", () => randomize());

  // Search inputs (home/search)
  const si = document.getElementById("searchInput");
  if(si){
    si.addEventListener("input", (e)=> state.searchQuery = e.target.value);
  }
  document.getElementById("searchGo")?.addEventListener("click", ()=> nav("search"));

  const si2 = document.getElementById("searchInput2");
  if(si2){
    si2.addEventListener("input", (e)=> state.searchQuery = e.target.value);
  }
  document.getElementById("searchGo2")?.addEventListener("click", ()=> alert(`검색(테스트): ${state.searchQuery || "입력 없음"}`));

  // Search page login for guest
  document.getElementById("loginBtn")?.addEventListener("click", ()=> openLoginModal());

  // Settings: toggle mode
  document.getElementById("toggleMode")?.addEventListener("click", ()=>{
    state.isMember = !state.isMember;
    render();
  });

  // Settings: theme select
  document.querySelectorAll("[data-theme]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const t = btn.getAttribute("data-theme");
      setTheme(t);
    });
  });

  // Bottom nav
  document.querySelectorAll("[data-nav]").forEach(el=>{
    el.addEventListener("click", ()=>{
      nav(el.getAttribute("data-nav"));
    });
  });

  // Modal actions
  document.getElementById("closeModal")?.addEventListener("click", closeModal);
  document.getElementById("cancelModal")?.addEventListener("click", closeModal);
  document.getElementById("okModal")?.addEventListener("click", doLoginTest);

  // Overlay click closes
  document.getElementById("modalOverlay")?.addEventListener("click", (e)=>{
    if(e.target.id === "modalOverlay") closeModal();
  });

  // Portfolio mock
  document.getElementById("mockPort")?.addEventListener("click", ()=>{
    alert("예시 데이터(테스트) - 다음 단계에서 연결");
  });
}

function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

render();
