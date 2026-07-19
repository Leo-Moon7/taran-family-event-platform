(function () {
  "use strict";

  const KEYS = ["event", "detail", "province", "district", "guests", "budget", "date", "category"];

  function fromParams(params = new URLSearchParams(location.search)) {
    return KEYS.reduce((result, key) => {
      const value = params.get(key);
      if (value) result[key] = value;
      return result;
    }, {});
  }

  function toParams(context, base = new URLSearchParams()) {
    KEYS.forEach((key) => {
      const value = context?.[key];
      if (value !== undefined && value !== null && value !== "" && value !== "all" && value !== "0") base.set(key, String(value));
    });
    return base;
  }

  function save(context) {
    window.TaranStorage?.set("search-context", JSON.stringify(context || {}));
  }

  function load() {
    try { return JSON.parse(window.TaranStorage?.get("search-context", "{}") || "{}"); }
    catch (_error) { return {}; }
  }

  function venuesUrl(context) {
    const params = toParams(context);
    return `venues.html${params.size ? `?${params}` : ""}`;
  }

  window.TaranSearchContext = Object.freeze({ keys: KEYS, fromParams, toParams, save, load, venuesUrl });
})();
