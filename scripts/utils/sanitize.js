(function () {
  "use strict";
  const protocols = new Set(["https:", "http:", "tel:", "mailto:"]);
  function url(value, allowed = protocols) {
    try {
      const parsed = new URL(String(value || ""), location.href);
      return allowed.has(parsed.protocol) ? parsed.href : "";
    } catch (_error) { return ""; }
  }
  function text(value, maxLength = 5000) { return String(value ?? "").trim().slice(0, maxLength); }
  window.TaranSanitize = Object.freeze({ url, text });
})();
