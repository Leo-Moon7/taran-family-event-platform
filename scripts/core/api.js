(function () {
  "use strict";

  const config = window.TaranConfig || {};
  const sessionKey = "auth-session";

  function readSession() {
    try {
      return JSON.parse(window.TaranStorage?.get(sessionKey, "null") || "null");
    } catch (_error) {
      return null;
    }
  }

  function tokenExpiry(accessToken) {
    try {
      const payload = JSON.parse(atob(String(accessToken || "").split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      return Number(payload?.exp || 0);
    } catch (_error) {
      return 0;
    }
  }

  function sessionExpired(session, skewSeconds = 30) {
    if (!session?.access_token) return true;
    const expiresAt = Number(session.expires_at || tokenExpiry(session.access_token) || 0);
    return expiresAt > 0 && expiresAt <= Math.floor(Date.now() / 1000) + skewSeconds;
  }

  function authHeaders(extra, useAnon = false) {
    const session = readSession();
    const accessToken = !useAnon && !sessionExpired(session) ? session?.access_token : "";
    return {
      apikey: config.supabaseAnonKey || "",
      Authorization: `Bearer ${accessToken || config.supabaseAnonKey || ""}`,
      "Content-Type": "application/json",
      ...(extra || {})
    };
  }

  async function request(url, options = {}) {
    if (!config.isSupabaseConfigured) {
      const error = new Error("온라인 저장소가 아직 연결되지 않았습니다.");
      error.code = "NOT_CONFIGURED";
      throw error;
    }
    const { useAnon = false, ...fetchOptions } = options;
    const response = await fetch(url, { ...fetchOptions, headers: authHeaders(options.headers, useAnon) });
    const text = await response.text();
    let payload = null;
    if (text) {
      try { payload = JSON.parse(text); } catch (_error) { payload = text; }
    }
    if (!response.ok) {
      const error = new Error(payload?.message || payload?.msg || payload?.error_description || `요청 실패 (${response.status})`);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }
    return payload;
  }

  function restUrl(table, query) {
    const url = new URL(`${config.supabaseUrl}/rest/v1/${encodeURIComponent(table)}`);
    Object.entries(query || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    });
    return url.href;
  }

  async function select(table, query = {}) {
    return request(restUrl(table, { select: "*", ...query }), { method: "GET" });
  }

  async function upsert(table, rows, conflictKey) {
    const query = conflictKey ? { on_conflict: conflictKey } : {};
    return request(restUrl(table, query), {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(Array.isArray(rows) ? rows : [rows])
    });
  }

  async function update(table, values, filters) {
    return request(restUrl(table, filters), {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(values)
    });
  }

  async function remove(table, filters) {
    return request(restUrl(table, filters), { method: "DELETE", headers: { Prefer: "return=minimal" } });
  }

  async function auth(path, options = {}) {
    const cleanPath = path.replace(/^\//, "");
    const useAnon = options.useAnon ?? /^(?:token\?|signup)/.test(cleanPath);
    return request(`${config.supabaseUrl}/auth/v1/${cleanPath}`, { ...options, useAnon });
  }

  async function refreshSession() {
    const session = readSession();
    if (!session?.refresh_token) return null;
    return auth("token?grant_type=refresh_token", {
      method: "POST",
      useAnon: true,
      body: JSON.stringify({ refresh_token: session.refresh_token })
    });
  }

  async function rpc(functionName, body = {}) {
    return request(`${config.supabaseUrl}/rest/v1/rpc/${encodeURIComponent(functionName)}`, { method: "POST", body: JSON.stringify(body) });
  }

  async function uploadPrivate(file, folder = "evidence") {
    if (!config.isSupabaseConfigured) throw new Error("온라인 저장소가 아직 연결되지 않았습니다.");
    const session = readSession();
    const userId = session?.user?.id;
    if (!userId) throw new Error("로그인 후 파일을 올릴 수 있습니다.");
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) throw new Error("JPG, PNG, WEBP, PDF 파일만 올릴 수 있습니다.");
    if (file.size > 10 * 1024 * 1024) throw new Error("파일은 한 개당 10MB 이하만 올릴 수 있습니다.");
    const extension = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" })[file.type];
    const name = `${userId}/${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const response = await fetch(`${config.supabaseUrl}/storage/v1/object/taran-private-evidence/${name}`, {
      method: "POST",
      headers: { apikey: config.supabaseAnonKey, Authorization: `Bearer ${session.access_token}`, "Content-Type": file.type, "x-upsert": "false" },
      body: file
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || "파일을 올리지 못했습니다.");
    return name;
  }

  async function createPrivateSignedUrl(path, expiresIn = 300) {
    const session = readSession();
    if (!session?.access_token) throw new Error("로그인 후 파일을 확인할 수 있습니다.");
    const cleanPath = String(path || "").replace(/^\/+/, "");
    if (!cleanPath || cleanPath.includes("..")) throw new Error("파일 경로가 올바르지 않습니다.");
    const response = await fetch(`${config.supabaseUrl}/storage/v1/object/sign/taran-private-evidence/${cleanPath.split("/").map(encodeURIComponent).join("/")}`, {
      method: "POST",
      headers: { apikey: config.supabaseAnonKey, Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ expiresIn: Math.min(600, Math.max(60, Number(expiresIn) || 300)) })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || "파일 확인 주소를 만들지 못했습니다.");
    const signed = payload.signedURL || payload.signedUrl;
    if (!signed) throw new Error("파일 확인 주소를 받지 못했습니다.");
    return signed.startsWith("http") ? signed : `${config.supabaseUrl}/storage/v1${signed}`;
  }

  window.TaranApi = Object.freeze({ request, select, upsert, update, remove, auth, rpc, uploadPrivate, createPrivateSignedUrl, readSession, refreshSession, sessionExpired });
})();
