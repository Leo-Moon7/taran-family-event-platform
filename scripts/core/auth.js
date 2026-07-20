(function () {
  "use strict";

  const sessionKey = "auth-session";
  let account = null;

  function parseBody(options) {
    if (!options?.body) return {};
    if (typeof options.body === "object") return options.body;
    try { return JSON.parse(options.body); } catch (_error) { return {}; }
  }

  function saveSession(session) {
    if (session) window.TaranStorage?.set(sessionKey, JSON.stringify(session));
    else window.TaranStorage?.remove(sessionKey);
  }

  function sessionAccount(session) {
    const user = session?.user;
    if (!user?.id) return null;
    return {
      id: user.id,
      email: user.email || "",
      display_name: user.user_metadata?.name || user.user_metadata?.display_name || user.email?.split("@")[0] || "회원",
      phone: user.phone || user.user_metadata?.phone || ""
    };
  }

  function updateAuthLinks() {
    document.querySelectorAll("[data-auth-link]").forEach(link => {
      if (!window.TaranConfig?.isSupabaseConfigured && location.protocol !== "file:") {
        link.hidden = true;
        return;
      }
      link.hidden = false;
      link.textContent = account ? `${account.display_name}님` : "로그인";
      link.href = account ? "account.html" : "login.html";
      link.setAttribute("aria-label", account ? `${account.display_name}님 계정 정보` : "로그인");
    });
  }

  async function loadAccount() {
    const session = window.TaranApi?.readSession();
    account = sessionAccount(session);
    if (session?.access_token && window.TaranConfig?.isSupabaseConfigured) {
      try {
        const user = await window.TaranApi.auth("user", { method: "GET" });
        account = sessionAccount({ ...session, user });
      } catch (error) {
        if (error.status === 401) saveSession(null);
        account = error.status === 401 ? null : account;
      }
    }
    updateAuthLinks();
    return account;
  }

  async function login(email, password) {
    const session = await window.TaranApi.auth("token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    saveSession(session);
    account = sessionAccount(session);
    updateAuthLinks();
    return account;
  }

  async function register(values) {
    const payload = {
      email: values.email,
      password: values.password,
      data: { name: values.name || values.display_name || "", phone: values.phone || "" }
    };
    const result = await window.TaranApi.auth("signup", { method: "POST", body: JSON.stringify(payload) });
    if (result?.access_token) saveSession(result);
    account = sessionAccount(result);
    updateAuthLinks();
    return result;
  }

  async function logout() {
    const session = window.TaranApi?.readSession();
    if (session?.access_token && window.TaranConfig?.isSupabaseConfigured) {
      try { await window.TaranApi.auth("logout", { method: "POST" }); } catch (_error) { /* local session is still cleared */ }
    }
    saveSession(null);
    account = null;
    updateAuthLinks();
  }

  function scopedKey(name) {
    return `${account?.id || "guest"}-${name}`;
  }

  function readLocal(name, fallback) {
    const raw = window.TaranStorage?.get(scopedKey(name), null);
    if (raw === null) return fallback;
    try { return JSON.parse(raw); } catch (_error) { return fallback; }
  }

  function writeLocal(name, value) {
    window.TaranStorage?.set(scopedKey(name), JSON.stringify(value));
    return value;
  }

  async function compatibilityApi(path, options = {}) {
    const body = parseBody(options);
    if (path === "/api/auth/me") return account;
    if (path === "/api/auth/login") return login(body.email, body.password);
    if (path === "/api/auth/register") return register(body);
    if (path === "/api/auth/logout") return logout();
    if (path === "/api/auth/account" && options.method === "DELETE") {
      if (!window.TaranConfig?.isSupabaseConfigured || !account) throw new Error("온라인 계정으로 로그인한 뒤 탈퇴를 요청할 수 있습니다.");
      await window.TaranApi.rpc("taran_request_account_deletion");
      await logout();
      return { ok: true };
    }
    if (path === "/api/member/saved-venues") {
      if (options.method === "GET" || !options.method) {
        if (window.TaranConfig?.isSupabaseConfigured && account) {
          const rows = await window.TaranApi.select(window.TaranConfig.tables.savedProviders, { user_id: `eq.${account.id}`, select: "provider_id", order: "created_at.desc" });
          return { venue_slugs: rows.map(row => row.provider_id) };
        }
        return { venue_slugs: readLocal("saved-venues", []) };
      }
    }
    const savedMatch = path.match(/^\/api\/member\/saved-venues\/(.+)$/);
    if (savedMatch) {
      const id = decodeURIComponent(savedMatch[1]);
      if (window.TaranConfig?.isSupabaseConfigured && account) {
        if (options.method === "DELETE") await window.TaranApi.remove(window.TaranConfig.tables.savedProviders, { user_id: `eq.${account.id}`, provider_id: `eq.${id}` });
        else await window.TaranApi.upsert(window.TaranConfig.tables.savedProviders, { user_id: account.id, provider_id: id }, "user_id,provider_id");
        return { ok: true };
      }
      const saved = new Set(readLocal("saved-venues", []));
      if (options.method === "DELETE") saved.delete(id); else saved.add(id);
      return { venue_slugs: writeLocal("saved-venues", [...saved]) };
    }
    const stateMatch = path.match(/^\/api\/member\/state\/(calculator|checklist)$/);
    if (stateMatch) {
      if (window.TaranConfig?.isSupabaseConfigured && account) {
        if (options.method === "PUT") {
          const rows = await window.TaranApi.upsert(window.TaranConfig.tables.memberStates, { user_id: account.id, state_key: stateMatch[1], data: body.state || {}, updated_at: new Date().toISOString() }, "user_id,state_key");
          return { state: rows?.[0]?.data || body.state || {} };
        }
        const rows = await window.TaranApi.select(window.TaranConfig.tables.memberStates, { user_id: `eq.${account.id}`, state_key: `eq.${stateMatch[1]}`, limit: 1 });
        return { state: rows?.[0]?.data || {} };
      }
      if (options.method === "PUT") return { state: writeLocal(`state-${stateMatch[1]}`, body.state || {}) };
      return { state: readLocal(`state-${stateMatch[1]}`, {}) };
    }
    const error = new Error("지원하지 않는 요청입니다.");
    error.status = 404;
    throw error;
  }

  function safeReturnPath(path) {
    const allowed = /^(?:(?:index|venues|provider|venue|compare|inquiry|account|partner|provider-register|calculator|checklist|guides|articles|article|partners|claim|community|community-post|contribute)\.html|admin\/(?:index|inquiries|providers|venues|content|banners|members|analytics|settings)\.html)(?:[?#].*)?$/;
    return allowed.test(path || "") ? path : "account.html";
  }

  const ready = loadAccount();
  window.TaranAuth = Object.freeze({
    api: compatibilityApi,
    ready,
    login,
    register,
    logout,
    refresh: loadAccount,
    getAccount: () => account,
    isConfigured: () => Boolean(window.TaranConfig?.isSupabaseConfigured),
    loginUrl: returnPath => `login.html?return=${encodeURIComponent(safeReturnPath(returnPath || "account.html"))}`,
    safeReturnPath
  });
})();
