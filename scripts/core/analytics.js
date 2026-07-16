(function () {
  "use strict";

  if (!window.TaranConfig?.isSupabaseConfigured || !window.TaranApi) return;
  const pagePath = `${location.pathname.split("/").pop() || "index.html"}`;
  if (/^(admin\/|admin-)/.test(location.pathname)) return;
  const key = `taran-page-view:${pagePath}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch (_error) { /* 통계 실패가 화면 이용을 막지 않게 합니다. */ }

  window.TaranApi.rpc("taran_track_event", {
    p_event_name: pagePath === "provider.html" ? "provider_view" : "page_view",
    p_page_path: pagePath,
    p_metadata: {}
  }).catch(() => {});
})();
