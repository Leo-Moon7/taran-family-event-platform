(function (global) {
  "use strict";

  const sourceType = "NAVER 지역검색 API 관측";
  const observedAt = "2026-08-12";
  const status = "정보 확인 전";
  const naverSearchUrl = "https://search.naver.com/search.naver";

  const rows = [
    ["NVR-DOL-001", "롯데호텔서울 도림", "장소·음식", "서울특별시 중구 을지로 30 메인타워 37F", "중구", "소공동", "중식>중식당", ["호텔", "돌잔치"]],
    ["NVR-DOL-002", "마실한정식 발산점", "장소·음식", "서울특별시 강서구 공항대로 290 201호", "강서구", "내발산동", "한식>한정식", ["돌잔치", "한정식"]],
    ["NVR-DOL-003", "메리어트 파크카페", "장소·음식", "서울특별시 영등포구 여의대로 8 3층", "영등포구", "여의도동", "음식점>양식", ["호텔", "돌잔치"]],
    ["NVR-DOL-004", "비스타 워커힐 서울 명월관", "장소·음식", "서울특별시 광진구 워커힐로 177 워커힐 호텔앤리조트", "광진구", "광장동", "한식>육류,고기요리", ["호텔", "돌잔치"]],
    ["NVR-DOL-005", "서라벌한정식 서초 본점", "장소·음식", "서울특별시 서초구 법원로3길 6-9", "서초구", "서초동", "한식>한정식", ["돌잔치", "한정식"]],
    ["NVR-DOL-006", "송림가", "장소·음식", "서울특별시 구로구 경인로 398 송림가", "구로구", "고척동", "한식>한정식", ["돌잔치", "한정식"]],
    ["NVR-DOL-007", "눈부신일상 강남점", "촬영", "서울특별시 서초구 양재천로21길 33 치금빌딩", "서초구", "양재동", "사진,스튜디오>아기사진전문", ["돌사진", "스튜디오"]],
    ["NVR-DOL-008", "다온재 한옥스튜디오 돌사진 삼청동집", "촬영", "서울특별시 종로구 북촌로11다길 23", "종로구", "삼청동", "사진,스튜디오>아기사진전문", ["돌스냅"]],
    ["NVR-DOL-009", "돌사진 한옥스튜디오 이다한옥 북촌점", "촬영", "서울특별시 종로구 북촌로15길 56 이다한옥", "종로구", "삼청동", "사진,스튜디오>아기사진전문", ["돌스냅"]],
    ["NVR-DOL-010", "베이비돌스냅", "촬영", "서울특별시 강남구 논현로150길 36-5 B 1층", "강남구", "논현2동", "생활,편의>사진,스튜디오", ["돌스냅"]],
    ["NVR-DOL-011", "꼬마돌상, 부모님생신상", "돌상·장식", "서울특별시 강서구 강서로47길 165 9층 297호", "강서구", "내발산동", "임대,대여>소품대여", ["백일상", "돌상", "대여"]],
    ["NVR-DOL-012", "베스트파티앤돌상", "돌상·장식", "서울특별시 마포구 월드컵북로 202-8 대윤빌라", "마포구", "성산동", "지원,대행>이벤트,파티", ["출장", "돌상"]],
    ["NVR-DOL-013", "다비드727스튜디오 백일상 돌상 아기사진 셀프스튜디오", "돌상·장식", "서울특별시 강서구 양천로 424 7층 727호", "강서구", "등촌동", "사진,스튜디오>셀프,대여스튜디오", ["백일상", "돌상", "대여"]],
    ["NVR-DOL-014", "맘엔맘돌상", "돌상·장식", "서울특별시 강서구 양천로67길 54", "강서구", "염창동", "음식>출장요리", ["출장", "돌상"]],
    ["NVR-DOL-015", "꾸밈살롱by연아 상암점", "의상·미용", "서울특별시 마포구 월드컵북로54길 17 사보이시티디엠씨 2층 A동", "마포구", "상암동", "미용>메이크업", ["돌잔치", "메이크업"]],
    ["NVR-DOL-016", "도도나", "의상·미용", "서울특별시 강서구 공항대로 206 나인스퀘어 404호", "강서구", "마곡동", "미용>메이크업", ["돌잔치", "메이크업"]],
    ["NVR-DOL-017", "미쁘다한복맞춤", "의상·미용", "서울특별시 광진구 자양로 219 자이안트빌딩 1층 104호", "광진구", "구의동", "임대,대여>한복대여", ["돌잔치", "한복"]],
    ["NVR-DOL-018", "또바기 돌답례품", "답례·케이크", "서울특별시 강남구 논현로75길 23", "강남구", "역삼동", "쇼핑,유통>판촉,기념품", ["돌잔치", "답례품"]],
    ["NVR-DOL-019", "뵈르니", "답례·케이크", "서울특별시 성동구 성덕정5길 10 1층", "성동구", "성수동1가", "카페,디저트>케이크전문", ["돌잔치", "케이크"]],
    ["NVR-DOL-020", "브레드컴퍼니쉐프조", "답례·케이크", "서울특별시 영등포구 당산로31길 20 1층", "영등포구", "당산동3가", "카페,디저트>베이커리", ["돌잔치", "케이크"]]
  ];

  const knownIds = new Set(rows.map(([id]) => id));
  const configuredDenylist = global.unverifiedProviderDenylist;
  const denylistIsValid = Array.isArray(configuredDenylist)
    && new Set(configuredDenylist).size === configuredDenylist.length
    && configuredDenylist.every((id) => typeof id === "string" && knownIds.has(id));
  const deniedIds = denylistIsValid ? new Set(configuredDenylist) : knownIds;

  const candidates = rows.filter(([id]) => !deniedIds.has(id)).map(([
    id,
    name,
    candidateField,
    address,
    district,
    neighborhood,
    sourceCategory,
    observedTopics
  ]) => {
    const query = new URLSearchParams({ where: "place", query: `${name} ${address}` });

    return Object.freeze({
      id,
      name,
      candidateField,
      region: "서울",
      address,
      district,
      neighborhood,
      sourceCategory,
      observedTopics: Object.freeze([...observedTopics]),
      sourceType,
      sourceUrl: `${naverSearchUrl}?${query}`,
      observedAt,
      status,
      unverifiedCandidate: true,
      inquiryEnabled: false,
      reviewEnabled: false,
      compareEnabled: false
    });
  });

  Object.defineProperty(global, "unverifiedProviderCandidates", {
    value: Object.freeze(candidates),
    enumerable: true,
    configurable: false,
    writable: false
  });
})(window);
