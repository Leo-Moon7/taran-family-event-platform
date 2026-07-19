(function () {
  "use strict";

  if (!window.TaranConfig?.isSupabaseConfigured || !window.TaranApi) return;

  function sessionId() {
    const key = "taran-analytics-session";
    try {
      let value = sessionStorage.getItem(key);
      if (!value) {
        value = crypto.randomUUID();
        sessionStorage.setItem(key, value);
      }
      return value;
    } catch (_error) {
      return crypto.randomUUID();
    }
  }

  function track(eventName, pagePath, metadata = {}) {
    return window.TaranApi.rpc("taran_track_event", {
      p_event_name: eventName,
      p_page_path: pagePath,
      p_metadata: { ...metadata, sessionId: sessionId() }
    });
  }

  window.TaranAnalytics = Object.freeze({ track, sessionId });

  const pagePath = `${location.pathname.split("/").pop() || "index.html"}`;
  if (/^(admin\/|admin-)/.test(location.pathname)) return;
  const key = `taran-page-view:${pagePath}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch (_error) {
    // 통계 저장 실패가 화면 이용을 막지 않도록 합니다.
  }

  track(pagePath === "provider.html" ? "provider_view" : "page_view", pagePath).catch(() => {});
})();
