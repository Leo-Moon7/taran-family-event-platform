(function () {
  "use strict";

  const items = Object.freeze([
    { id: "kids", label: "돌잔치·백일", description: "백일·돌잔치·키즈파티" },
    { id: "parents", label: "환갑·칠순·팔순", description: "부모님 생신·퇴임식" },
    { id: "meeting", label: "결혼 준비", description: "상견례·약혼·소규모 예식" },
    { id: "anniversary", label: "기념일·생신", description: "생일·결혼기념일" },
    { id: "other", label: "기타 가족행사", description: "가족모임·추모·그 밖의 행사" }
  ]);
  const publicLabels = Object.freeze(Object.fromEntries(items.map((item) => [item.id, item.label])));
  const aliases = Object.freeze({
    wedding: "meeting",
    smallWedding: "meeting",
    familyGathering: "other",
    memorial: "other",
    home: "other",
    legacyWedding: "meeting"
  });
  const labels = Object.freeze({
    ...publicLabels,
    wedding: publicLabels.meeting,
    smallWedding: publicLabels.meeting,
    familyGathering: publicLabels.other,
    memorial: publicLabels.other,
    home: publicLabels.other,
    legacyWedding: publicLabels.meeting
  });
  const legacyStorageIds = Object.freeze({
    kids: Object.freeze(["kids"]),
    parents: Object.freeze(["parents"]),
    meeting: Object.freeze(["meeting", "smallWedding"]),
    anniversary: Object.freeze(["anniversary"]),
    other: Object.freeze(["other", "familyGathering", "memorial", "home"])
  });

  function normalize(value, tags = []) {
    if (!value) return "kids";
    const raw = String(value).trim();
    if (publicLabels[raw]) return raw;
    if (aliases[raw]) return aliases[raw];
    const text = [raw, ...tags].join(" ").toLowerCase();
    if (/상견례|약혼|웨딩|결혼|wedding|브라이덜/.test(text)) return "meeting";
    if (/가족모임|홈파티|추모|기일|memorial|family|home/.test(text)) return "other";
    return "other";
  }

  function label(value) {
    return publicLabels[normalize(value)] || publicLabels.other;
  }

  function storageIds(value) {
    const representative = normalize(value);
    return [...(legacyStorageIds[representative] || [representative])];
  }

  window.SonpumEventTypes = Object.freeze({ items, labels, aliases, normalize, label, storageIds });
})();
