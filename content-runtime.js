(function () {
  const storageKey = "taran-admin-overrides-preview";
  const config = window.taranContentConfig || {};
  const CONTENT_SLOTS = Object.freeze({
    "home.hero.title": { selector: "[data-content-slot='home.hero.title']", type: "text" },
    "home.hero.description": { selector: "[data-content-slot='home.hero.description']", type: "text" },
    "home.finalCta.title": { selector: "[data-content-slot='home.finalCta.title']", type: "text" }
  });
  const ALLOWED_PROTOCOLS = new Set(["https:", "http:", "tel:", "mailto:"]);
  const tables = {
    siteCopy: "taran_site_copy",
    providers: "taran_providers",
    articles: "taran_articles",
    banners: "taran_banners",
    ...(config.tables || {})
  };

  function emptyOverrides() {
    return { version: "", siteCopy: [], providers: [], articles: [], banners: [] };
  }

  function readPreviewOverrides() {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function normalizeList(value) {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    return String(value)
      .split(/[,|\n]/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  function normalizeProvider(provider) {
    if (!provider || !provider.name) return null;
    const slug = String(provider.id || provider.name)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return {
      id: provider.id || `custom-${slug || Date.now()}`,
      name: provider.name,
      category: provider.category || "공간 대여",
      subcategory: provider.subcategory || "가족행사",
      region: provider.region || "전국",
      area: provider.area || "",
      price: Number(provider.price || 0),
      priceLabel: provider.priceLabel || "",
      minCapacity: provider.minCapacity,
      maxCapacity: provider.maxCapacity,
      primaryLabel: provider.primaryLabel || "지역",
      primaryValue: provider.primaryValue || [provider.region, provider.area].filter(Boolean).join(" "),
      secondaryLabel: provider.secondaryLabel || "공간·서비스",
      secondaryValue: provider.secondaryValue || provider.subcategory || provider.category || "가족행사",
      tertiaryLabel: provider.tertiaryLabel || "후기",
      tertiaryValue: provider.tertiaryValue || "",
      intro: provider.intro || "",
      tags: normalizeList(provider.tags),
      image: provider.image || "assets/images/venue-hanjeongsik.webp",
      verifiedAt: provider.verifiedAt || new Date().toISOString().slice(0, 10).replace(/-/g, "."),
      publicationStatus: provider.publicationStatus || "published",
      detailFacts: provider.detailFacts || {},
      checkpoints: normalizeList(provider.checkpoints),
      eventTags: normalizeList(provider.eventTags),
      serviceTags: normalizeList(provider.serviceTags || ["venue"]),
      externalReviews: Array.isArray(provider.externalReviews) ? provider.externalReviews : [],
      sourceCount: Number(provider.sourceCount || 0),
      internalRating: provider.internalRating ? Number(provider.internalRating) : undefined,
      officialLink: provider.officialLink || ""
    };
  }

  function normalizeArticle(article) {
    if (!article || !article.title) return null;
    const slug = String(article.slug || article.title)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const plainBody = Array.isArray(article.body) ? article.body : String(article.body || "").split(/\n\s*\n|\n/).map(value => value.trim()).filter(Boolean);
    const sections = Array.isArray(article.sections) && article.sections.length
      ? article.sections
      : (plainBody.length ? [{ heading: "본문", body: plainBody }] : []);
    return {
      slug: article.slug || `custom-${slug || Date.now()}`,
      category: article.category || "준비 가이드",
      title: article.title,
      excerpt: article.excerpt || "",
      date: article.date || new Date().toISOString().slice(0, 10).replace(/-/g, "."),
      readTime: article.readTime || "5분",
      image: article.image || "assets/images/editorial-checklist.webp",
      alt: article.alt || article.title,
      tags: normalizeList(article.tags),
      sections,
      checklist: normalizeList(article.checklist),
      summaryPoints: normalizeList(article.summaryPoints),
      questions: normalizeList(article.questions),
      pitfalls: normalizeList(article.pitfalls),
      nextActions: normalizeList(article.nextActions)
    };
  }

  function normalizeBanner(banner) {
    if (!banner || !banner.id) return null;
    return {
      id: String(banner.id),
      placement: banner.placement || "home-point",
      status: banner.status || "published",
      eyebrow: banner.eyebrow || "",
      title: banner.title || "",
      body: banner.body || "",
      ctaLabel: banner.ctaLabel || "",
      ctaUrl: banner.ctaUrl || "",
      image: banner.image || "",
      startAt: banner.startAt || "",
      endAt: banner.endAt || "",
      sortOrder: Number(banner.sortOrder || 0)
    };
  }

  function upsertByKey(list, items, key) {
    if (!Array.isArray(list) || !Array.isArray(items)) return;
    items.forEach(item => {
      if (!item || !item[key]) return;
      const index = list.findIndex(existing => existing && existing[key] === item[key]);
      if (index >= 0) {
        list[index] = { ...list[index], ...item };
      } else {
        list.unshift(item);
      }
    });
  }

  function mergeByKey(base, next, key) {
    const merged = Array.isArray(base) ? [...base] : [];
    upsertByKey(merged, Array.isArray(next) ? next : [], key);
    return merged;
  }

  function mergeSiteCopy(base, next) {
    const merged = Array.isArray(base) ? [...base] : [];
    (Array.isArray(next) ? next : []).forEach(item => {
      const contentSlotId = item?.contentSlotId || item?.id;
      if (!contentSlotId || !CONTENT_SLOTS[contentSlotId]) return;
      const normalized = { contentSlotId, text: String(item.text || item.textValue || "") };
      const index = merged.findIndex(existing => (existing.contentSlotId || existing.id) === contentSlotId);
      if (index >= 0) merged[index] = { ...merged[index], ...normalized };
      else merged.push(normalized);
    });
    return merged;
  }

  function mergeOverrides(...sources) {
    return sources.reduce((acc, source) => {
      if (!source) return acc;
      return {
        version: source.version || acc.version,
        siteCopy: mergeSiteCopy(acc.siteCopy, source.siteCopy),
        providers: mergeByKey(acc.providers, source.providers, "id"),
        articles: mergeByKey(acc.articles, source.articles, "slug"),
        banners: mergeByKey(acc.banners, source.banners, "id")
      };
    }, emptyOverrides());
  }

  function hasDbConfig() {
    return Boolean(window.TaranConfig?.isSupabaseConfigured && window.TaranApi);
  }

  async function fetchTable(tableName, params = {}) {
    if (!hasDbConfig()) return [];
    return window.TaranApi.select(tableName, params);
  }

  async function readOnlineOverrides() {
    if (!hasDbConfig()) return null;
    try {
      const siteId = config.siteId || "taran";
      const [copyRows, providerRows, articleRows, bannerRows] = await Promise.all([
        fetchTable(tables.siteCopy, { site_id: `eq.${siteId}`, status: "eq.published" }),
        fetchTable(tables.providers, { status: "eq.published" }),
        fetchTable(tables.articles, { status: "eq.published" }),
        fetchTable(tables.banners, { site_id: `eq.${siteId}`, status: "eq.published", order: "sort_order.asc" })
      ]);
      return {
        version: new Date().toISOString().slice(0, 10).replace(/-/g, "."),
        siteCopy: (copyRows || []).map(row => ({
          contentSlotId: row.content_slot_id || row.id,
          text: row.text_value || ""
        })).filter(item => CONTENT_SLOTS[item.contentSlotId]),
        providers: (providerRows || []).map(row => ({
          ...(row.data || {}),
          id: row.id,
          eventTypes: Array.isArray(row.event_types) && row.event_types.length
            ? row.event_types
            : (row.data || {}).eventTypes,
          eventTags: Array.isArray(row.event_types) && row.event_types.length
            ? row.event_types
            : (row.data || {}).eventTags,
          eventProfiles: row.event_profiles && typeof row.event_profiles === "object"
            ? row.event_profiles
            : (row.data || {}).eventProfiles,
          eventTaxonomyStatus: row.event_taxonomy_status || "classified"
        })),
        articles: (articleRows || []).map(row => ({ ...(row.data || {}), slug: row.slug })),
        banners: (bannerRows || []).map(row => ({
          ...(row.data || {}),
          id: row.id,
          placement: row.placement || (row.data || {}).placement,
          status: row.status || (row.data || {}).status,
          sortOrder: row.sort_order || (row.data || {}).sortOrder
        }))
      };
    } catch (error) {
      console.warn("온라인 콘텐츠를 불러오지 못해 정적 콘텐츠로 표시합니다.", error);
      return null;
    }
  }

  function applySiteCopy(overrides) {
    const siteCopy = Array.isArray(overrides.siteCopy) ? overrides.siteCopy : [];
    if (!siteCopy.length) return;

    const apply = () => {
      siteCopy.forEach(item => {
        const contentSlotId = item?.contentSlotId || item?.id;
        const slot = CONTENT_SLOTS[contentSlotId];
        if (!slot || slot.type !== "text") return;
        document.querySelectorAll(slot.selector).forEach(element => {
          element.textContent = String(item.text || "");
        });
      });
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", apply);
    } else {
      apply();
    }
  }

  function bannerTargets(placement) {
    const placementSelectors = {
      "home-point": ".taran-wide-banner",
      "directory-bottom": ".directory-ad-placeholder",
      "article-top": ".blog-inline-ad-card, .guide-ad-slot",
      "calculator-top": ".calculator-affiliate-placeholder"
    };
    const selectors = [
      `[data-taran-banner-placement="${placement}"]`,
      placementSelectors[placement]
    ].filter(Boolean);
    return selectors.flatMap(selector => Array.from(document.querySelectorAll(selector)));
  }

  function safeUrl(value, protocols = ALLOWED_PROTOCOLS) {
    try {
      const url = new URL(String(value || ""), window.location.href);
      return protocols.has(url.protocol) ? url.href : "";
    } catch (_error) {
      return "";
    }
  }

  function appendTextElement(parent, tagName, className, value) {
    if (!value) return null;
    const element = document.createElement(tagName);
    if (className) element.className = className;
    element.textContent = String(value);
    parent.append(element);
    return element;
  }

  function applyBanners(overrides) {
    const banners = (overrides.banners || [])
      .map(normalizeBanner)
      .filter(item => item && item.status === "published")
      .sort((a, b) => a.sortOrder - b.sortOrder);

    window.taranBanners = banners;
    if (!banners.length) return;

    const apply = () => {
      const usedPlacements = new Set();
      banners.forEach(banner => {
        if (usedPlacements.has(banner.placement)) return;
        const targets = bannerTargets(banner.placement);
        if (!targets.length) return;
        usedPlacements.add(banner.placement);
        targets.forEach(target => {
          target.setAttribute("data-taran-managed-banner", banner.id);
          target.replaceChildren();
          const copy = document.createElement("div");
          copy.className = "cms-public-banner-copy";
          appendTextElement(copy, "span", "cms-public-banner-eyebrow", banner.eyebrow);
          appendTextElement(copy, "h3", "", banner.title);
          appendTextElement(copy, "p", "", banner.body);
          const ctaUrl = safeUrl(banner.ctaUrl);
          if (banner.ctaLabel && ctaUrl) {
            const link = appendTextElement(copy, "a", "", `${banner.ctaLabel} →`);
            link.href = ctaUrl;
          }
          target.append(copy);
          const imageUrl = safeUrl(banner.image, new Set(["https:", "http:"]));
          if (imageUrl) {
            const image = document.createElement("img");
            image.src = imageUrl;
            image.alt = banner.title ? `${banner.title} 배너 이미지` : "";
            image.loading = "lazy";
            target.append(image);
          }
        });
      });
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", apply);
    } else {
      apply();
    }
  }

  function applyData(overrides) {
    const providers = (overrides.providers || []).map(normalizeProvider).filter(Boolean);
    const articles = (overrides.articles || []).map(normalizeArticle).filter(Boolean);

    if (!Array.isArray(window.publicDirectoryData)) window.publicDirectoryData = [];
    upsertByKey(window.publicDirectoryData, providers, "id");

    if (!Array.isArray(window.taran_BLOG_POSTS)) window.taran_BLOG_POSTS = [];
    upsertByKey(window.taran_BLOG_POSTS, articles, "slug");

    applySiteCopy(overrides);
    applyBanners(overrides);
    window.taranResolvedContentOverrides = overrides;
    document.dispatchEvent(new CustomEvent("taran:content-ready", { detail: overrides }));
  }

  window.taranContentReady = (async function bootContent() {
    const fileOverrides = window.taranContentOverrides || emptyOverrides();
    const onlineOverrides = await readOnlineOverrides();
    const previewOverrides = readPreviewOverrides();
    const overrides = mergeOverrides(fileOverrides, onlineOverrides, previewOverrides);
    applyData(overrides);
    return overrides;
  })();

  window.TaranContentSlots = CONTENT_SLOTS;
})();
