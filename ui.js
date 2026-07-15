const publicHeader = document.querySelector("header.site-header:not(.admin-header)");

if (publicHeader) {
  const brand = publicHeader.querySelector(".brand");
  if (brand) {
    brand.setAttribute("aria-label", "메모아 홈");
    brand.innerHTML = `<span class="brand-mark">m</span><span>메모아</span><small>memoa</small>`;
  }

  const nav = publicHeader.querySelector("nav");
  if (nav) {
    nav.classList.remove("premium-header-nav");
    nav.classList.add("lifecycle-nav", "grouped-nav", "jp-grouped-nav", "memoa-grouped-nav");
    nav.innerHTML = `
      <div class="nav-group">
        <button class="nav-group-button" type="button" aria-haspopup="true" aria-expanded="false">행사 찾기</button>
        <div class="nav-dropdown">
          <a href="venues.html?event=kids"><strong>아이</strong><span>백일 · 돌잔치 · 키즈파티</span></a>
          <a href="venues.html?event=wedding"><strong>결혼·커플</strong><span>스몰웨딩 · 상견례 · 브라이덜 샤워</span></a>
          <a href="venues.html?event=parents"><strong>부모님</strong><span>환갑 · 칠순 · 퇴임식</span></a>
          <a href="venues.html?event=home"><strong>가족 모임</strong><span>집들이 · 명절 · 홈파티</span></a>
        </div>
      </div>
      <a href="venues.html">업체·장소</a>
      <a href="calculator.html">비용 계산기</a>
      <div class="nav-group">
        <button class="nav-group-button" type="button" aria-haspopup="true" aria-expanded="false">준비 가이드</button>
        <div class="nav-dropdown">
          <a href="articles.html"><strong>준비백과</strong><span>행사별 준비 순서와 계약 팁</span></a>
          <a href="checklist.html"><strong>체크리스트</strong><span>행사일 기준 자동 준비 일정</span></a>
          <a href="contribute.html"><strong>견적 공유</strong><span>받은 견적과 업체 정보를 나누고 포인트 받기</span></a>
          <a href="about.html"><strong>서비스 소개</strong><span>메모아가 정보를 정리하는 방식</span></a>
        </div>
      </div>
      <a href="community.html">커뮤니티</a>
      <a class="auth-link" href="login.html" data-auth-link>로그인</a>`;

    nav.querySelectorAll(".nav-group").forEach(group => {
      const button = group.querySelector(".nav-group-button");
      if (!button) return;
      group.addEventListener("mouseenter", () => button.setAttribute("aria-expanded", "true"));
      group.addEventListener("mouseleave", () => button.setAttribute("aria-expanded", "false"));
      group.addEventListener("focusin", () => button.setAttribute("aria-expanded", "true"));
      group.addEventListener("focusout", event => {
        if (!group.contains(event.relatedTarget)) {
          button.setAttribute("aria-expanded", "false");
        }
      });
    });

    window.SonpumAuth?.ready.then(account => {
      const link = nav.querySelector("[data-auth-link]");
      if (!link) return;
      link.textContent = account ? `${account.display_name}님` : "로그인";
      link.href = account ? "account.html" : "login.html";
    });
  }

  if (!publicHeader.querySelector(".memoa-mobile-header-actions")) {
    publicHeader.insertAdjacentHTML("beforeend", `
      <div class="memoa-mobile-header-actions" aria-label="모바일 빠른 메뉴">
        <a class="mobile-auth-link" href="login.html" data-mobile-auth-link>로그인</a>
      </div>`);
  }

  window.SonpumAuth?.ready.then(account => {
    const mobileLink = publicHeader.querySelector("[data-mobile-auth-link]");
    if (!mobileLink) return;
    mobileLink.textContent = account ? "MY" : "로그인";
    mobileLink.href = account ? "account.html" : "login.html";
  });
}

if (!document.querySelector(".memoa-bottom-nav")) {
  const bottomNav = document.createElement("nav");
  bottomNav.className = "memoa-bottom-nav";
  bottomNav.setAttribute("aria-label", "모바일 주요 메뉴");
  bottomNav.innerHTML = `
    <a href="index.html"><span>⌂</span><b>홈</b></a>
    <a href="venues.html"><span>⌕</span><b>찾기</b></a>
    <a href="calculator.html"><span>₩</span><b>계산기</b></a>
    <a href="login.html" data-bottom-auth-link><span>•</span><b>MY</b></a>`;
  document.body.appendChild(bottomNav);
  window.SonpumAuth?.ready.then(account => {
    const link = bottomNav.querySelector("[data-bottom-auth-link]");
    if (link && account) link.href = "account.html";
  });
}

document.querySelectorAll("[data-reveal]").forEach(element => {
  element.classList.add("reveal-ready");
});

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll("[data-reveal]").forEach(element => revealObserver.observe(element));
} else {
  document.querySelectorAll("[data-reveal]").forEach(element => element.classList.add("is-visible"));
}

document.querySelectorAll("[data-newsletter-form]").forEach(form => {
  form.addEventListener("submit", event => {
    event.preventDefault();
    const message = form.querySelector("[data-newsletter-message]");
    if (message) message.textContent = "업체 정보 수정 요청 화면으로 이동합니다.";
  });
});
