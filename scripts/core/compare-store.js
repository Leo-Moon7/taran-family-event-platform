(function () {
  "use strict";

  const KEY = "compare-providers";
  const LIMIT = 3;
  const listeners = new Set();

  function read() {
    try {
      const raw = window.TaranStorage?.get(KEY, "[]") ?? localStorage.getItem("taran-compare-providers") ?? "[]";
      const parsed = JSON.parse(raw);
      const ids = (Array.isArray(parsed) ? parsed : []).map((item) => typeof item === "string" ? item : item?.id).filter(Boolean);
      return [...new Set(ids)].slice(0, LIMIT);
    } catch (_error) {
      return [];
    }
  }

  function write(ids) {
    const clean = [...new Set(ids.filter(Boolean))].slice(0, LIMIT);
    window.TaranStorage?.set(KEY, JSON.stringify(clean));
    listeners.forEach((listener) => listener(clean));
    window.dispatchEvent(new CustomEvent("taran:compare-change", { detail: { ids: clean } }));
    return clean;
  }

  function add(id) {
    const ids = read();
    if (ids.includes(id)) return { ok: true, ids, alreadyAdded: true };
    if (ids.length >= LIMIT) return { ok: false, ids, reason: "limit" };
    return { ok: true, ids: write([...ids, id]), alreadyAdded: false };
  }

  function remove(id) {
    return write(read().filter((value) => value !== id));
  }

  function toggle(id) {
    return read().includes(id) ? { ok: true, ids: remove(id), removed: true } : add(id);
  }

  function clear() {
    return write([]);
  }

  function has(id) {
    return read().includes(id);
  }

  function subscribe(listener) {
    listeners.add(listener);
    listener(read());
    return () => listeners.delete(listener);
  }

  window.TaranCompareStore = Object.freeze({ key: KEY, limit: LIMIT, read, add, remove, toggle, clear, has, subscribe });
})();
