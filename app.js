/* ===============================
   기본 헬퍼
================================= */
const $ = (id) => document.getElementById(id);

function showModal(id){
  const el = $(id);
  if(el) el.style.display = "flex";
}
function closeModal(id){
  const el = $(id);
  if(el) el.style.display = "none";
}

document.addEventListener("click",(e)=>{
  const closeTarget = e.target.getAttribute?.("data-close");
  if(closeTarget) closeModal(closeTarget);
});

/* ===============================
   상태 관리 (localStorage)
================================= */
const LS = {
  USER:"stock_user",           // guest | member
  THEME:"stock_theme",
  AD_HIDE_UNTIL:"stock_ad_hide_until"
};

function getUser(){
  return localStorage.getItem(LS.USER) || "guest";
}
function setUser(v){
  localStorage.setItem(LS.USER,v);
}

function getTheme(){
  return localStorage.getItem(LS.THEME) || "A";
}
function setTheme(v){
  localStorage.setItem(LS.THEME,v);
}

function getAdHideUntil(){
  return Number(localStorage.getItem(LS.AD_HIDE_UNTIL) || 0);
}
function setAdHideUntil(ts){
  localStorage.setItem(LS.AD_HIDE_UNTIL, ts);
}

/* ===============================
   테마 시스템
================================= */
const THEMES = {
  A:{bg:"#0b1320",accent:"#4c8bf5",good:"#1fcf78"},
  B:{bg:"#0b1320",accent:"#6bd1ff",good:"#36d399"},
  C:{bg:"#0b1320",accent:"#9ad0ff",good:"#1fcf78"},
  D:{bg:"#0b1320",accent:"#8bd0ff",good:"#1fcf78"},
  E:{bg:"#07101b",accent:"#c9a55a",good:"#1fcf78"},
  F:{bg:"#0b1320",accent:"#d8a2a2",good:"#1fcf78"}
};

function applyTheme(key){
  const t = THEMES[key] || THEMES.A;
  const r = document.documentElement.style;
  r.setProperty("--bg", t.bg);
  r.setProperty("--accent", t.accent);
  r.setProperty("--good", t.good);
}

/* ===============================
   게이지 업데이트
================================= */
function updateGauge(score){
  const deg = score * 3.6;
  $("gauge").style.setProperty("--deg", deg+"deg");
  $("scoreText").textContent = score;

  let status="안정";
  if(score<40) status="위험";
  else if(score<70) status="주의";
  else status="안정";

  $("statusText").textContent = status;
}

/* ===============================
   탭 전환 (차트/뉴스/리스크)
================================= */
function activateTab(tab){
  const tabs=["Chart","News","Risk"];
  tabs.forEach(t=>{
    $("panel"+t).style.display="none";
    $("tab"+t).style.opacity=".7";
  });
  $("panel"+tab).style.display="block";
  $("tab"+tab).style.opacity="1";
}

/* ===============================
   하단 네비 전환
================================= */
document.querySelectorAll(".navItem").forEach(el=>{
  el.addEventListener("click",()=>{
    const page=el.dataset.page;

    document.querySelectorAll(".navItem")
      .forEach(n=>n.classList.remove("active"));
    el.classList.add("active");

    document.querySelectorAll(".page")
      .forEach(p=>p.classList.remove("active"));

    $("page"+page).classList.add("active");
  });
});

/* ===============================
   광고 로직
================================= */
function updateAdUI(){
  const user=getUser();
  const now=Date.now();
  const hideUntil=getAdHideUntil();

  const banner=$("bannerCard");
  const badge=$("adStateBadge");
  const remain=$("adRemainText");
  const detail=$("adDetailState");

  if(user==="guest"){
    banner.style.display="block";
    badge.textContent="ON";
    remain.textContent="게스트는 항상 노출";
    detail.textContent="상태: 게스트 (항상 ON)";
    return;
  }

  if(now < hideUntil){
    banner.style.display="none";
    const hours=Math.ceil((hideUntil-now)/3600000);
    remain.textContent="광고 숨김 "+hours+"시간 남음";
    detail.textContent="상태: 24시간 숨김 활성";
  }else{
    banner.style.display="block";
    badge.textContent="ON";
    remain.textContent="광고 표시중";
    detail.textContent="상태: 광고 ON";
  }
}

/* ===============================
   이벤트 연결
================================= */
document.addEventListener("DOMContentLoaded",()=>{

  // 초기값
  applyTheme(getTheme());
  updateGauge(76);
  updateAdUI();

  $("themeSelect").value=getTheme();

  // 테마 변경
  $("themeSelect").addEventListener("change",(e)=>{
    setTheme(e.target.value);
    applyTheme(e.target.value);
  });

  // 분석 실행
  $("btnAnalyze").addEventListener("click",()=>{
    const random=40+Math.floor(Math.random()*60);
    updateGauge(random);
  });

  // 탭 버튼
  $("tabChart").addEventListener("click",()=>activateTab("Chart"));
  $("tabNews").addEventListener("click",()=>activateTab("News"));
  $("tabRisk").addEventListener("click",()=>activateTab("Risk"));

  // 광고 상세
  $("btnAdDetail").addEventListener("click",()=>{
    showModal("modalAdBack");
    updateAdUI();
  });

  // 광고 보기(테스트)
  $("btnWatchAd").addEventListener("click",()=>{
    const now=Date.now();
    const hideUntil=now + (24*60*60*1000);
    setAdHideUntil(hideUntil);
    closeModal("modalAdBack");
    updateAdUI();
  });

  // 강제 광고 켜기
  $("btnForceAdOn").addEventListener("click",()=>{
    setAdHideUntil(0);
    updateAdUI();
  });

  // 로그인
  $("btnLogin").addEventListener("click",()=>showModal("modalLoginBack"));
  $("btnDoLogin").addEventListener("click",()=>{
    setUser("member");
    closeModal("modalLoginBack");
    updateUserUI();
    updateAdUI();
  });

  // 로그아웃
  $("btnLogout").addEventListener("click",()=>{
    setUser("guest");
    updateUserUI();
    updateAdUI();
  });

  updateUserUI();
});

/* ===============================
   사용자 UI 업데이트
================================= */
function updateUserUI(){
  const user=getUser();
  $("userStateText").textContent = user==="member"?"회원":"게스트";
  $("settingUserText").textContent = user==="member"?"회원":"게스트";

  if(user==="member"){
    $("btnLogin").style.display="none";
    $("btnLogout").style.display="flex";
  }else{
    $("btnLogin").style.display="inline-block";
    $("btnLogout").style.display="none";
  }
      }
