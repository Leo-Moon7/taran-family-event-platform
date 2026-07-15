(function () {
  "use strict";

  function text(value) { return String(value ?? ""); }
  function element(tag, value, className) {
    const node = document.createElement(tag);
    if (value !== undefined) node.textContent = text(value);
    if (className) node.className = className;
    return node;
  }
  function readJson(name, fallback) {
    try { return JSON.parse(window.TaranStorage?.get(name, JSON.stringify(fallback)) ?? JSON.stringify(fallback)); }
    catch (_error) { return fallback; }
  }
  function reviewCount(item) {
    return (Array.isArray(item.reviews) ? item.reviews.length : 0) + (Array.isArray(item.externalReviews) ? item.externalReviews.length : 0);
  }
  function setEmptyState(empty, hasRows) {
    if (empty) empty.hidden = Boolean(hasRows);
  }

  window.TaranAdmin = Object.freeze({ text, element, readJson, reviewCount, setEmptyState });
})();
