(function () {
  let account = null;

  async function api(path, options = {}) {
    const response = await fetch(path, {
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options
    });
    if (response.status === 204) return null;
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.detail || "요청을 처리하지 못했습니다.");
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  function updateAuthLinks() {
    document.querySelectorAll("[data-auth-link]").forEach(link => {
      if (account) {
        link.textContent = `${account.display_name}님`;
        link.href = "account.html";
        link.setAttribute("aria-label", `${account.display_name}님 내 정보`);
      } else {
        link.textContent = "로그인";
        link.href = "login.html";
        link.setAttribute("aria-label", "로그인");
      }
    });
  }

  async function loadAccount() {
    try {
      account = await api("/api/auth/me");
    } catch (error) {
      if (error.status !== 401) console.warn("로그인 상태를 확인하지 못했습니다.");
      account = null;
    }
    updateAuthLinks();
    return account;
  }

  function safeReturnPath(path) {
    const allowed = /^(index|venues|venue|account|calculator|checklist|guides|partners)\.html(?:[?#].*)?$/;
    return allowed.test(path || "") ? path : "account.html";
  }

  function loginUrl(returnPath) {
    return `login.html?return=${encodeURIComponent(safeReturnPath(returnPath || "account.html"))}`;
  }

  const ready = loadAccount();
  window.TaranAuth = {
    api,
    ready,
    getAccount: () => account,
    refresh: loadAccount,
    loginUrl,
    safeReturnPath
  };
})();
