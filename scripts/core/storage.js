(function () {
  "use strict";

  const BRAND = window.PlatformBrand || { storagePrefix: "sonpum-haebang-" };
  const PREFIX = BRAND.storagePrefix;
  const MIGRATION_MARKER = "sonpum-haebang-storage-migration-v1";
  const LEGACY_KEYS = {
    "taran-compare-providers": "sonpum-haebang-compare-providers",
    "taran-checklist": "sonpum-haebang-checklist",
    "taran-calculator": "sonpum-haebang-calculator",
    "taran-favorites": "sonpum-haebang-favorites",
    "taran-search-context": "sonpum-haebang-search-context",
    "taran-user": "sonpum-haebang-user",
    "taran-saved-venues": "sonpum-haebang-saved-venues",
    "taran-saved-providers": "sonpum-haebang-saved-providers",
    "taran-admin-overrides-preview": "sonpum-haebang-admin-overrides-preview",
    "taran-admin-studio": "sonpum-haebang-admin-studio",
    "taran-crawl-review": "sonpum-haebang-crawl-review",
    "taran-provider-claims": "sonpum-haebang-provider-claims",
    "taran-provider-edits": "sonpum-haebang-provider-edits",
    "memoa-admin-overrides-preview": "sonpum-haebang-admin-overrides-preview",
    "memoa-admin-studio": "sonpum-haebang-admin-studio",
    "nopoom-user": "sonpum-haebang-user",
    "nopoom-saved-venues": "sonpum-haebang-saved-venues",
    "nopoom-calculator": "sonpum-haebang-calculator",
    "nopoom-checklist": "sonpum-haebang-checklist",
    "compare-providers": "sonpum-haebang-compare-providers",
    "saved-providers": "sonpum-haebang-saved-providers"
  };

  function migrateStorage(storage) {
    if (!storage || storage.getItem(MIGRATION_MARKER) === "done") return;

    Object.entries(LEGACY_KEYS).forEach(([legacyKey, nextKey]) => {
      const legacyValue = storage.getItem(legacyKey);
      const nextValue = storage.getItem(nextKey);

      if (legacyValue !== null && nextValue === null) {
        storage.setItem(nextKey, legacyValue);
      }
    });

    storage.setItem(MIGRATION_MARKER, "done");
  }

  try {
    migrateStorage(window.localStorage);
    migrateStorage(window.sessionStorage);
  } catch (error) {
    console.warn(`${window.PlatformBrand?.nameKo || "서비스"} 저장 데이터 마이그레이션을 완료하지 못했습니다.`, error);
  }

  window.TaranStorage = Object.freeze({
    prefix: PREFIX,
    key(name) {
      return `${PREFIX}${String(name || "").replace(/^(?:sonpum-haebang-|taran-)/, "")}`;
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
