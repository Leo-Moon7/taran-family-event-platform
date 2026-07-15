(function () {
  "use strict";

  const PREFIX = "taran-";
  const MIGRATION_MARKER = `${PREFIX}storage-migration-v1`;
  const LEGACY_KEYS = {
    "memoa-admin-overrides-preview": "taran-admin-overrides-preview",
    "memoa-admin-studio": "taran-admin-studio",
    "nopoom-user": "taran-user",
    "nopoom-saved-venues": "taran-saved-venues",
    "nopoom-calculator": "taran-calculator",
    "nopoom-checklist": "taran-checklist",
    "sonpum-haebang-crawl-review": "taran-crawl-review",
    "sonpum-haebang-claims": "taran-provider-claims",
    "sonpum-haebang-vendor-edits": "taran-provider-edits"
  };

  function migrateStorage(storage) {
    if (!storage || storage.getItem(MIGRATION_MARKER) === "done") return;

    Object.entries(LEGACY_KEYS).forEach(([legacyKey, nextKey]) => {
      const legacyValue = storage.getItem(legacyKey);
      const nextValue = storage.getItem(nextKey);

      if (legacyValue !== null && nextValue === null) {
        storage.setItem(nextKey, legacyValue);
      }
      if (legacyValue !== null) storage.removeItem(legacyKey);
    });

    storage.setItem(MIGRATION_MARKER, "done");
  }

  try {
    migrateStorage(window.localStorage);
    migrateStorage(window.sessionStorage);
  } catch (error) {
    console.warn("따란 저장 데이터 마이그레이션을 완료하지 못했습니다.", error);
  }

  window.TaranStorage = Object.freeze({
    prefix: PREFIX,
    key(name) {
      return `${PREFIX}${String(name || "").replace(/^taran-/, "")}`;
    },
    get(name, fallback = null, storage = window.localStorage) {
      try {
        const value = storage.getItem(this.key(name));
        return value === null ? fallback : value;
      } catch (_error) {
        return fallback;
      }
    },
    set(name, value, storage = window.localStorage) {
      storage.setItem(this.key(name), String(value));
    },
    remove(name, storage = window.localStorage) {
      storage.removeItem(this.key(name));
    }
  });
})();
