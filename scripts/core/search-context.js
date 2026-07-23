(function () {
  "use strict";

  const KEYS = ["event", "detail", "province", "district", "guests", "budget", "budgetMin", "budgetMax", "date", "category", "sort", "source"];
  const defaults = window.SonpumDisplayDefaults || { event: "kids", province: "서울특별시", sort: "recommended" };

  function normalized(context = {}) {
    const next = { ...context };
    if (next.event && next.event !== "all") next.event = window.SonpumEventTypes?.normalize?.(next.event) || next.event;
    return next;
  }

  function fromParams(params = new URLSearchParams(location.search)) {
    return normalized(KEYS.reduce((result, key) => {
      const value = params.get(key);
      if (value) result[key] = value;
      return result;
    }, {}));
  }

  function toParams(context, base = new URLSearchParams()) {
    const safeContext = normalized(context);
    KEYS.forEach((key) => {
      const value = safeContext?.[key];
      if (value !== undefined && value !== null && value !== "" && value !== "all" && value !== "0") base.set(key, String(value));
    });
    return base;
  }

  function save(context) {
    window.TaranStorage?.set("search-context", JSON.stringify(normalized(context)));
  }

  function load() {
    try { return normalized(JSON.parse(window.TaranStorage?.get("search-context", "{}") || "{}")); }
    catch (_error) { return {}; }
  }

  function resolve(params = new URLSearchParams(location.search)) {
    return normalized({ ...defaults, ...load(), ...fromParams(params) });
  }

  function venuesUrl(context) {
    const params = toParams(context);
    return `venues.html${params.size ? `?${params}` : ""}`;
  }

  window.TaranSearchContext = Object.freeze({ keys: KEYS, defaults, fromParams, toParams, save, load, resolve, venuesUrl });
})();
