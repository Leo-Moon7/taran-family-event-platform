(function () {
  "use strict";

  const base = "assets/images/placeholders/";
  const rules = [
    ["photo-video.webp", /스냅|사진|영상|촬영|photo|video/i],
    ["decoration-flower.webp", /돌상|플라워|꽃|장식|스타일링|포토존/i],
    ["gift.webp", /답례품|선물|기프트|초대장/i],
    ["clothing.webp", /의상|한복|드레스|메이크업|뷰티/i],
    ["wedding-venue.webp", /웨딩|결혼식|브라이덜|wedding/i],
    ["dol-specialist.webp", /돌잔치|백일|돌상|키즈/i],
    ["hotel-banquet.webp", /호텔|연회장|banquet/i],
    ["buffet.webp", /뷔페|케이터링|catering/i],
    ["party-room.webp", /파티룸|키즈풀|대관|party/i],
    ["private-dining.webp", /상견례|프라이빗|한정식|파인다이닝/i],
    ["restaurant.webp", /식당|레스토랑|한식|중식|일식|양식|음식|식사/i]
  ];

  function text(provider = {}) {
    return [
      provider.name, provider.category, provider.providerType, provider.spaceType,
      provider.businessCategory, provider.summary, provider.description,
      ...(provider.tags || []), ...(provider.services || []), ...(provider.eventTypes || [])
    ].filter(Boolean).join(" ");
  }

  function get(provider = {}) {
    const value = text(provider);
    const match = rules.find(([, pattern]) => pattern.test(value));
    return `${base}${match?.[0] || "default-provider.webp"}`;
  }

  function isPlaceholder(url = "") {
    return String(url).includes("/placeholders/") || String(url).includes("placeholders/");
  }

  function apply(img, provider = {}, requestedUrl = "") {
    if (!img) return;
    const url = requestedUrl || get(provider);
    img.src = url;
    img.alt = requestedUrl ? `${provider.name || "업체"} 대표 이미지` : "업체 사진 준비 중";
    img.dataset.placeholder = requestedUrl ? "false" : "true";
    img.addEventListener("error", () => {
      img.src = `${base}default-provider.webp`;
      img.alt = "업체 사진 준비 중";
      img.dataset.placeholder = "true";
    }, { once: true });
  }

  window.SonpumProviderPlaceholder = Object.freeze({ get, isPlaceholder, apply });
})();
