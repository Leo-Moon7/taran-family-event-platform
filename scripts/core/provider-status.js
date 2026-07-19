(function () {
  "use strict";

  const text = (value) => String(value ?? "").trim();

  function firstValue(provider, keys) {
    for (const key of keys) {
      const value = provider?.[key] ?? provider?.detailFacts?.[key];
      if (value !== undefined && value !== null && text(value)) return value;
    }
    return "";
  }

  function numberFrom(value) {
    if (Number.isFinite(Number(value)) && Number(value) > 0) return Number(value);
    const matches = text(value).match(/\d[\d,]*/g);
    return matches?.length ? Math.max(...matches.map((item) => Number(item.replaceAll(",", "")))) : 0;
  }

  function getProviderAddress(provider) {
    return text(firstValue(provider, ["roadAddress", "address", "도로명 주소", "주소"]) || provider?.officialVerification?.roadAddress || provider?.officialVerification?.address);
  }

  function getProviderIndustry(provider) {
    return text(firstValue(provider, ["industry", "업종"]) || provider?.officialVerification?.category || provider?.category || provider?.subcategory);
  }

  function getProviderStatus(provider) {
    const ownerId = text(provider?.ownerUserId || provider?.owner_user_id);
    const explicit = text(provider?.profileStatus || provider?.profile_status).toLowerCase();
    const verification = text(provider?.officialVerification?.status).toLowerCase();
    const verifiedAt = text(provider?.lastVerifiedAt || provider?.last_verified_at || provider?.verifiedAt || provider?.officialVerification?.checkedAt);
    const updatedAt = text(provider?.lastUpdatedAt || provider?.last_updated_at || provider?.updatedAt || provider?.verifiedAt);

    if (explicit === "verified" || verification === "verified" || provider?.verified === true) {
      return { key: "verified", label: "정보 확인", description: "가격·운영 조건 확인", date: verifiedAt || updatedAt };
    }
    if (ownerId || ["claimed", "owner", "registered"].includes(explicit)) {
      return { key: "claimed", label: "업체 담당자 등록", description: updatedAt ? `최근 업데이트 ${updatedAt}` : "업체 담당자가 직접 등록", date: updatedAt };
    }
    return { key: "basic", label: "기본 정보", description: "업체 확인 전", date: updatedAt || verifiedAt };
  }

  function getProviderStatusLabel(provider) {
    return getProviderStatus(provider).label;
  }

  function getProviderFreshness(provider) {
    const status = getProviderStatus(provider);
    if (!status.date) return { state: "unknown", label: "확인일 미등록", date: "" };
    const date = new Date(status.date.replaceAll(".", "-"));
    if (Number.isNaN(date.getTime())) return { state: "unknown", label: status.date, date: status.date };
    const days = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (days <= 90) return { state: "fresh", label: `정보 확인 ${status.date}`, date: status.date };
    if (days <= 120) return { state: "review", label: "가격 확인 필요", date: status.date };
    return { state: "stale", label: "업체 정보 업데이트 필요", date: status.date };
  }

  function isProviderPublic(provider) {
    if (!provider || text(provider.publicationStatus || provider.publication_status).toLowerCase() === "hidden") return false;
    return Boolean(text(provider.name) && (text(provider.region) || text(provider.area) || getProviderAddress(provider)) && getProviderIndustry(provider));
  }

  function canReceiveInquiry(provider) {
    return isProviderPublic(provider) && [
      provider?.inquiryEnabled,
      provider?.inquiry_enabled,
      provider?.acceptsInquiry,
      provider?.accepts_inquiry
    ].some((value) => value === true || text(value).toLowerCase() === "true");
  }

  function getProviderFacts(provider) {
    const minGuests = numberFrom(firstValue(provider, ["minimumGuests", "minimum_guests", "minGuests", "minCapacity", "최소 수용인원"]));
    const maxGuests = numberFrom(firstValue(provider, ["maximumGuests", "maximum_guests", "maxGuests", "maxCapacity", "capacity", "최대 수용인원", "수용 인원"]));
    const guarantee = numberFrom(firstValue(provider, ["minimumGuarantee", "minimum_guarantee", "최소 보증 인원", "보증 인원"]));
    const adultMealMin = numberFrom(firstValue(provider, ["adultMealPriceMin", "adult_meal_price_min", "성인 식대", "성인 1인 식대"]));
    const adultMealMax = numberFrom(firstValue(provider, ["adultMealPriceMax", "adult_meal_price_max"]));
    const rentalFee = numberFrom(firstValue(provider, ["rentalFee", "rental_fee", "대관료"]));
    const parking = numberFrom(firstValue(provider, ["parkingCount", "parking_count", "주차 가능 대수", "주차"]));
    return { minGuests, maxGuests, guarantee, adultMealMin, adultMealMax, rentalFee, parking };
  }

  window.TaranProviderStatus = Object.freeze({
    getProviderStatus,
    getProviderStatusLabel,
    getProviderFreshness,
    getProviderAddress,
    getProviderIndustry,
    getProviderFacts,
    isProviderPublic,
    canReceiveInquiry
  });
})();
