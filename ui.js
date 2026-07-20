const publicHeader = document.querySelector("header.site-header:not(.admin-header)");

if (publicHeader) {
  const brand = publicHeader.querySelector(".brand");
  if (brand) {
    brand.setAttribute("aria-label", "따란 홈");
    const englishName = brand.querySelector("small");
    if (englishName) englishName.textContent = "T'ARAN";
  }

  const nav = publicHeader.querySelector("nav");
  if (nav) {
    window.TaranAuth?.ready.then(account => {
      const link = nav.querySelector("[data-auth-link]");
      if (!link) return;
      link.textContent = account ? `${account.display_name}님` : "로그인";
      link.href = account ? "account.html" : "login.html";
    });
  }
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
