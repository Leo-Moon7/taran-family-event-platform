(function () {
  const storageKey = "memoa-admin-overrides-preview";
  const config = window.memoaContentConfig || {};
  const tables = {
    siteCopy: "memoa_site_copy",
    providers: "memoa_providers",
    articles: "memoa_articles",
    banners: "memoa_banners",
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
      sections: Array.isArray(article.sections) ? article.sections : [],
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
      if (!item || !item.selector) return;
      const key = item.id || item.selector;
      const index = merged.findIndex(existing => (existing.id || existing.selector) === key);
      if (index >= 0) merged[index] = { ...merged[index], ...item };
      else merged.push(item);
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
    return /^https?:\/\//.test(config.supabaseUrl || "") && Boolean(config.supabaseAnonKey);
  }

  async function fetchTable(tableName, params = {}) {
    if (!hasDbConfig() || !window.fetch) return [];
    const url = new URL(`${config.supabaseUrl.replace(/\/$/, "")}/rest/v1/${tableName}`);
    url.searchParams.set("select", "*");
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    const response = await fetch(url.toString(), {
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${config.supabaseAnonKey}`
      }
    });
    if (!response.ok) throw new Error(`콘텐츠 DB 조회 실패: ${response.status}`);
    return response.json();
  }

  async function readOnlineOverrides() {
    if (!hasDbConfig()) return null;
    try {
      const siteId = config.siteId || "memoa";
      const [copyRows, providerRows, articleRows, bannerRows] = await Promise.all([
        fetchTable(tables.siteCopy, { site_id: `eq.${siteId}`, status: "eq.published" }),
        fetchTable(tables.providers, { status: "eq.published" }),
        fetchTable(tables.articles, { status: "eq.published" }),
        fetchTable(tables.banners, { site_id: `eq.${siteId}`, status: "eq.published", order: "sort_order.asc" })
      ]);
      return {
        version: new Date().toISOString().slice(0, 10).replace(/-/g, "."),
        siteCopy: (copyRows || []).map(row => ({
          id: row.id,
          label: row.label,
          selector: row.selector,
          ...(row.mode === "html" ? { html: row.html_value || "" } : { text: row.text_value || "" }),
          attributes: row.attributes || {}
        })),
        providers: (providerRows || []).map(row => ({ ...(row.data || {}), id: row.id })),
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
        if (!item || !item.selector) return;
        document.querySelectorAll(item.selector).forEach(element => {
          if (item.html) {
            element.innerHTML = item.html;
          } else if (item.text) {
            element.textContent = item.text;
          }
          if (item.attributes && typeof item.attributes === "object") {
            Object.entries(item.attributes).forEach(([name, value]) => {
              element.setAttribute(name, value);
            });
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

  function bannerTargets(placement) {
    const placementSelectors = {
      "home-point": ".memoa-wide-banner",
      "directory-bottom": ".directory-ad-placeholder",
      "article-top": ".blog-inline-ad-card, .guide-ad-slot",
      "calculator-top": ".calculator-affiliate-placeholder"
    };
    const selectors = [
      `[data-memoa-banner-placement="${placement}"]`,
      placementSelectors[placement]
    ].filter(Boolean);
    return selectors.flatMap(selector => Array.from(document.querySelectorAll(selector)));
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function applyBanners(overrides) {
    const banners = (overrides.banners || [])
      .map(normalizeBanner)
      .filter(item => item && item.status === "published")
      .sort((a, b) => a.sortOrder - b.sortOrder);

    window.memoaBanners = banners;
    if (!banners.length) return;

    const apply = () => {
      const usedPlacements = new Set();
      banners.forEach(banner => {
        if (usedPlacements.has(banner.placement)) return;
        const targets = bannerTargets(banner.placement);
        if (!targets.length) return;
        usedPlacements.add(banner.placement);
        targets.forEach(target => {
          target.setAttribute("data-memoa-managed-banner", banner.id);
          target.innerHTML = `
            <div class="cms-public-banner-copy">
              ${banner.eyebrow ? `<span class="cms-public-banner-eyebrow">${escapeHtml(banner.eyebrow)}</span>` : ""}
              ${banner.title ? `<h3>${escapeHtml(banner.title)}</h3>` : ""}
              ${banner.body ? `<p>${escapeHtml(banner.body)}</p>` : ""}
              ${banner.ctaLabel && banner.ctaUrl ? `<a href="${escapeHtml(banner.ctaUrl)}">${escapeHtml(banner.ctaLabel)} →</a>` : ""}
            </div>
            ${banner.image ? `<img src="${escapeHtml(banner.image)}" alt="" loading="lazy">` : ""}
          `;
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

    if (window.publicDirectoryData) {
      upsertByKey(window.publicDirectoryData, providers, "id");
    }

    if (window.memoa_BLOG_POSTS) {
      upsertByKey(window.memoa_BLOG_POSTS, articles, "slug");
    }

    applySiteCopy(overrides);
    applyBanners(overrides);
    window.memoaResolvedContentOverrides = overrides;
    document.dispatchEvent(new CustomEvent("memoa:content-ready", { detail: overrides }));
  }

  window.memoaContentReady = (async function bootContent() {
    const fileOverrides = window.memoaContentOverrides || emptyOverrides();
    const onlineOverrides = await readOnlineOverrides();
    const previewOverrides = readPreviewOverrides();
    const overrides = mergeOverrides(fileOverrides, onlineOverrides, previewOverrides);
    applyData(overrides);
    return overrides;
  })();
})();
