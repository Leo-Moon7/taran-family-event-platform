(function () {
  "use strict";

  const items = Object.freeze([
    { id: "kids", label: "돌잔치·백일", description: "백일·돌잔치·키즈파티" },
    { id: "parents", label: "환갑·칠순·팔순", description: "환갑·칠순·팔순·퇴임식" },
    { id: "meeting", label: "상견례", description: "양가 식사·약혼식" },
    { id: "smallWedding", label: "스몰웨딩", description: "소규모 결혼식·하우스웨딩" },
    { id: "familyGathering", label: "가족모임", description: "집들이·명절·홈파티" },
    { id: "anniversary", label: "기념일·생신", description: "생일·결혼기념일" },
    { id: "memorial", label: "추모 가족행사", description: "가족 추모·기일 모임" },
    { id: "other", label: "기타 가족행사", description: "그 밖의 가족행사" }
  ]);
  const labels = Object.freeze(Object.fromEntries(items.map((item) => [item.id, item.label])));

  function normalize(value, tags = []) {
    if (!value) return "kids";
    if (value === "home") return "familyGathering";
    if (value !== "wedding") return labels[value] ? value : "other";
    const text = tags.join(" ").toLowerCase();
    if (/상견례|약혼|meeting/.test(text)) return "meeting";
    if (/웨딩|결혼|wedding|브라이덜/.test(text)) return "smallWedding";
    return "legacyWedding";
  }

  function label(value) {
    if (value === "legacyWedding") return "결혼·커플 행사";
    return labels[normalize(value)] || labels.other;
  }

  window.SonpumEventTypes = Object.freeze({ items, labels, normalize, label });
})();
