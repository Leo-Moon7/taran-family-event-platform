(function () {
  "use strict";

  const form = document.querySelector("#home-search");
  const container = document.querySelector("#home-recommended");

  form?.addEventListener("submit", event => {
    event.preventDefault();
    const params = new URLSearchParams(new FormData(form));
    window.location.href = `venues.html?${params.toString()}`;
  });

  function text(value, fallback = "") {
    return String(value ?? fallback).trim();
  }

  function imageUrl(value) {
    const url = text(value);
    if (!url || /^(?:javascript|data):/i.test(url)) return "assets/images/venue-hanjeongsik.webp";
    return url;
  }

  function verifiedPartners() {
    const source = Array.isArray(window.reviewLifecycleVerifiedData) ? window.reviewLifecycleVerifiedData : [];
    return source
      .filter(item => item && item.name && item.publicationStatus !== "hidden")
      .sort((a, b) => text(b.verifiedAt).localeCompare(text(a.verifiedAt)))
      .slice(0, 6);
  }

  function createPartnerCard(item) {
    const link = document.createElement("a");
    link.className = "card card--interactive";
    link.href = `provider.html?id=${encodeURIComponent(item.id)}`;
    link.setAttribute("aria-label", `${text(item.name)} 상세 보기`);

    const media = document.createElement("div");
    media.className = "card__media";
    const image = document.createElement("img");
    image.src = imageUrl(item.image);
    image.alt = `${text(item.name)} 관련 이미지`;
    image.loading = "lazy";
    media.append(image);

    const body = document.createElement("div");
    body.className = "card__body";
    const badge = document.createElement("span");
    badge.className = "badge badge--success";
    badge.textContent = text(item.sourceStatus, "기본 정보");
    const title = document.createElement("h3");
    title.className = "card__title";
    title.textContent = text(item.name);
    const meta = document.createElement("p");
    meta.className = "card__meta";
    meta.textContent = [text(item.region), text(item.area)].filter(Boolean).join(" ");
    const facts = document.createElement("div");
    facts.className = "partner-facts";
    [item.subcategory, item.minCapacity ? `최소 ${item.minCapacity}명` : "", item.priceLabel].filter(Boolean).slice(0, 3).forEach(value => {
      const span = document.createElement("span");
      span.textContent = text(value);
      facts.append(span);
    });
    body.append(badge, title, meta, facts);
    link.append(media, body);
    return link;
  }

  if (container) {
    const partners = verifiedPartners();
    if (partners.length) partners.forEach(item => container.append(createPartnerCard(item)));
    else container.append(window.TaranStates.message({ title: "추천 파트너를 준비하고 있습니다.", description: "업체 전체보기에서 현재 공개된 정보를 확인해 주세요." }));
  }
})();
