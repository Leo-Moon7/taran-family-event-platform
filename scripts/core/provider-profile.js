(function () {
  "use strict";

  const DAY = 86400000;

  function text(value) {
    return String(value || "").trim();
  }

  function hasArray(value) {
    return Array.isArray(value) && value.some((item) => text(item));
  }

  function firstNumber(value) {
    const match = text(value).match(/\d[\d,]*/);
    return match ? Number(match[0].replaceAll(",", "")) || null : null;
  }

  function facts(data) {
    return data?.detailFacts && typeof data.detailFacts === "object" ? data.detailFacts : {};
  }

  function fact(data, ...keys) {
    const source = facts(data);
    return keys.map((key) => source[key]).find((value) => text(value)) || "";
  }

  function profileChecks(provider) {
    const data = provider?.data || provider || {};
    const eventTypes = provider?.event_types || data.eventTags;
    return [
      { key: "name", label: "업체명", score: 10, done: Boolean(text(data.name)) },
      { key: "category", label: "업체 유형", score: 5, done: Boolean(text(data.category || data.subcategory)) },
      {
        key: "location",
        label: "지역과 주소",
        score: 15,
        done: Boolean(text(data.region) && text(data.address || data.area))
      },
      { key: "events", label: "진행 가능한 행사", score: 10, done: hasArray(eventTypes) },
      {
        key: "guests",
        label: "수용 인원",
        score: 10,
        done: Boolean(
          provider?.minimum_guests
          || provider?.maximum_guests
          || provider?.minimum_guarantee
          || firstNumber(fact(data, "적정 인원", "최대 수용인원"))
        )
      },
      {
        key: "price",
        label: "가격 또는 식대",
        score: 15,
        done: Boolean(
          provider?.adult_meal_price_min
          || provider?.adult_meal_price_max
          || provider?.rental_fee
          || text(data.price)
          || text(fact(data, "가격", "성인 식대", "대관료"))
        )
      },
      {
        key: "parking",
        label: "주차 정보",
        score: 10,
        done: provider?.parking_count !== null && provider?.parking_count !== undefined
          ? true
          : Boolean(text(fact(data, "주차", "주차 정보")))
      },
      {
        key: "outside",
        label: "외부 음식·업체 이용",
        score: 5,
        done: Boolean(
          text(provider?.outside_food_policy)
          || text(provider?.outside_vendor_policy)
          || text(fact(data, "외부 음식", "외부 업체 이용"))
        )
      },
      {
        key: "policy",
        label: "취소·환불 조건",
        score: 10,
        done: Boolean(text(provider?.cancellation_summary) || text(fact(data, "취소·환불")))
      },
      {
        key: "image",
        label: "대표 이미지",
        score: 10,
        done: Boolean(text(data.image || data.imageUrl) || hasArray(data.images))
      }
    ];
  }

  function completeness(provider) {
    return profileChecks(provider).reduce((sum, item) => sum + (item.done ? item.score : 0), 0);
  }

  function freshness(provider, now = Date.now()) {
    const source = provider?.last_verified_at || provider?.updated_at;
    const time = new Date(source || 0).getTime();
    if (!time) return { days: null, level: "missing", label: "확인일을 등록해 주세요." };
    const days = Math.max(0, Math.floor((now - time) / DAY));
    if (days <= 90) return { days, level: "current", label: "최신 정보로 표시됩니다." };
    if (days <= 120) return { days, level: "soon", label: "가격과 이용 조건을 한 번 확인해 주세요." };
    if (days <= 180) return { days, level: "stale", label: "정보 갱신이 필요합니다." };
    return { days, level: "expired", label: "정보를 갱신하면 견적 문의를 다시 받을 수 있습니다." };
  }

  function responseTime(minutes) {
    const value = Number(minutes);
    if (!Number.isFinite(value) || value <= 0) return "집계 전";
    if (value < 60) return `평균 ${Math.round(value)}분`;
    if (value < 1440) return `평균 ${Math.round(value / 60)}시간`;
    return `평균 ${Math.round(value / 1440)}일`;
  }

  window.TaranProviderProfile = Object.freeze({
    checks: profileChecks,
    completeness,
    freshness,
    firstNumber,
    responseTime
  });
})();
