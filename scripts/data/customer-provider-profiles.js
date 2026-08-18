(function (global) {
  "use strict";

  const checkedAt = "2026-08-14";
  const oakwoodCheckedAt = "2026-08-18";

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function evidence(field, sourceUrl) {
    return {
      field,
      sourceClass: "official_website",
      sourceUrl,
      checkedAt
    };
  }

  function datedEvidence(field, sourceUrl, evidenceCheckedAt) {
    return {
      field,
      sourceClass: "official_website",
      sourceUrl,
      checkedAt: evidenceCheckedAt
    };
  }

  function product(name, priceMin, priceMax, unit, conditions, includedItems, sourceUrl) {
    return {
      name,
      includedItems,
      priceMin,
      priceMax,
      currency: "KRW",
      unit,
      conditions,
      checkedAt,
      evidence: {
        sourceClass: "official_website",
        sourceUrl,
        checkedAt
      }
    };
  }

  const lotteUrl = "https://restaurant.lottehotel.com/hp/hpm/selectHpmMainView.do?selectedBizChainId=11&selectedBizOfficeId=05";
  const marriottEventsUrl = "https://www.marriott.com/ko/hotels/seler-yeouido-park-centre-seoul-marriott-executive-apartments/events/";
  const marriottDiningUrl = "https://www.marriott.com/ko/hotels/seler-yeouido-park-centre-seoul-marriott-executive-apartments/dining/";
  const marriottPhotosUrl = "https://www.marriott.com/en-us/hotels/seler-yeouido-park-centre-seoul-marriott-executive-apartments/photos/";
  const walkerhillUrl = "https://app.walkerhill.com/vistawalkerhillseoul/dining/Myongwolgwan";
  const walkerhillPartyUrl = "https://www.walkerhill.com/pdf/myong_1stParty.pdf?v=20260520";
  const seorabolUrl = "https://seorabol.kr/";
  const seorabolEventUrl = "https://seorabol.kr/50";
  const ilsangstBranchesUrl = "https://www.ilsangst.com/branches/korea";
  const ilsangstPriceUrl = "https://www.ilsangst.com/price";
  const daonjaeUrl = "https://www.daonjae.com/23";
  const edahanokAboutUrl = "https://www.edahanok.com/about";
  const edahanokProductUrl = "https://www.edahanok.com/product";
  const edahanokContactUrl = "https://www.edahanok.com/contact";
  const oakwoodFirstBirthdayUrl = "https://www.homehmc.com/ko/special-offers/event-promotions/323/";

  const profiles = [
    {
      id: "NVR-DOL-001",
      name: "롯데호텔서울 도림",
      displayGate: "customer_ready",
      introduction: "도심 전망의 프라이빗 룸과 중식 코스가 있는 돌잔치·가족 모임 레스토랑입니다.",
      serviceCategories: ["돌잔치 장소·식사"],
      services: ["돌잔치 가족 모임", "중식 코스", "프라이빗 룸"],
      location: {
        province: "서울특별시",
        district: "중구",
        neighborhood: "소공동",
        address: "서울특별시 중구 을지로 30 메인타워 37F"
      },
      serviceMode: "visit",
      serviceAreas: [],
      businessHours: [
        "점심 11:30~14:30 (마지막 주문 14:00)",
        "저녁 17:30~21:30 (마지막 주문 20:30)"
      ],
      contact: {
        telephone: { display: "02-317-7101", href: "tel:+8223177101" },
        officialLinks: [
          { label: "도림 공식 정보", kind: "website", url: lotteUrl }
        ]
      },
      image: {
        url: null,
        alt: "",
        rightsVerified: false,
        fallbackCategory: "돌잔치 장소·식사"
      },
      products: [
        product(
          "런치 코스 메뉴",
          160000,
          340000,
          "성인 1인 코스",
          ["코스 메뉴는 2인 이상 주문", "160,000원 메뉴는 평일 홀에서만 이용", "돌잔치 전용 패키지 가격이 아닌 레스토랑 메뉴 가격"],
          [],
          lotteUrl
        ),
        product(
          "디너 코스 메뉴",
          160000,
          550000,
          "성인 1인 코스",
          ["코스 메뉴는 2인 이상 주문", "160,000원 메뉴는 평일 홀에서만 이용", "돌잔치 전용 패키지 가격이 아닌 레스토랑 메뉴 가격"],
          [],
          lotteUrl
        ),
        product(
          "주말 코스 메뉴",
          190000,
          230000,
          "성인 1인 코스",
          ["코스 메뉴는 2인 이상 주문", "돌잔치 전용 패키지 가격이 아닌 레스토랑 메뉴 가격"],
          [],
          lotteUrl
        )
      ],
      extraCosts: [],
      policies: { cancellation: null, setup: null, travel: null },
      availability: { mode: "contact_required", checkedAt: null },
      updatedAt: checkedAt,
      capabilities: { inquiry: false, compare: false, save: false, review: false },
      fieldEvidence: [
        evidence("identity", lotteUrl),
        evidence("location", lotteUrl),
        evidence("services", lotteUrl),
        evidence("businessHours", lotteUrl),
        evidence("contact.telephone", lotteUrl),
        evidence("contact.officialLinks", lotteUrl),
        evidence("products", lotteUrl)
      ]
    },
    {
      id: "NVR-DOL-003",
      name: "메리어트 파크카페",
      displayGate: "customer_ready",
      introduction: "여의도공원이 보이는 프라이빗 다이닝룸에서 아이 첫 생일 행사를 준비하는 레스토랑입니다.",
      serviceCategories: ["돌잔치 장소·식사"],
      services: ["아이 첫 생일 행사", "프라이빗 다이닝", "행사 스타일링과 메뉴"],
      location: {
        province: "서울특별시",
        district: "영등포구",
        neighborhood: "여의도동",
        address: "서울특별시 영등포구 여의대로 8 3층"
      },
      serviceMode: "visit",
      serviceAreas: [],
      businessHours: [
        "아침 07:00~10:00",
        "점심 11:30~14:30",
        "저녁 18:00~22:00"
      ],
      contact: {
        telephone: { display: "02-2090-8000", href: "tel:+82220908000" },
        officialLinks: [
          { label: "파크카페 행사 안내", kind: "website", url: marriottEventsUrl },
          { label: "파크카페 다이닝 안내", kind: "website", url: marriottDiningUrl },
          { label: "파크카페 사진 보기", kind: "portfolio", url: marriottPhotosUrl }
        ]
      },
      image: {
        url: null,
        alt: "",
        rightsVerified: false,
        fallbackCategory: "돌잔치 장소·식사"
      },
      products: [],
      extraCosts: [],
      policies: { cancellation: null, setup: null, travel: null },
      availability: { mode: "contact_required", checkedAt: null },
      updatedAt: checkedAt,
      capabilities: { inquiry: false, compare: false, save: false, review: false },
      fieldEvidence: [
        evidence("identity", marriottDiningUrl),
        evidence("location", marriottDiningUrl),
        evidence("services", marriottEventsUrl),
        evidence("businessHours", marriottDiningUrl),
        evidence("contact.telephone", marriottEventsUrl),
        evidence("contact.officialLinks", marriottEventsUrl)
      ]
    },
    {
      id: "NVR-DOL-004",
      name: "비스타 워커힐 서울 명월관",
      displayGate: "customer_ready",
      introduction: "한옥 분위기의 프라이빗 룸과 한우 숯불구이를 중심으로 한 돌잔치·가족연회 레스토랑입니다.",
      serviceCategories: ["돌잔치 장소·식사"],
      services: ["돌잔치 가족연회", "한우 숯불구이", "프라이빗 룸"],
      location: {
        province: "서울특별시",
        district: "광진구",
        neighborhood: "광장동",
        address: "서울특별시 광진구 워커힐로 177 워커힐 호텔앤리조트"
      },
      serviceMode: "visit",
      serviceAreas: [],
      businessHours: ["점심 12:00~15:00", "저녁 17:30~21:00"],
      contact: {
        telephone: { display: "1670-0006", href: "tel:16700006" },
        officialLinks: [
          { label: "명월관 공식 정보", kind: "website", url: walkerhillUrl },
          { label: "명월관 돌잔치 안내", kind: "document", url: walkerhillPartyUrl }
        ]
      },
      image: {
        url: null,
        alt: "",
        rightsVerified: false,
        fallbackCategory: "돌잔치 장소·식사"
      },
      products: [
        product(
          "정담 정식",
          210000,
          210000,
          "성인 1인 코스",
          ["성인 전원 코스 메뉴 주문", "최소 보증 인원 이상 주문", "월~목에만 주문 가능", "구성과 가격은 변경될 수 있음"],
          ["한우 물 육회", "특선 죽", "대게살 계란찜", "한우 떡갈비", "한우 등심과 양념 갈비", "식사와 후식"],
          walkerhillPartyUrl
        ),
        product(
          "예담 정식",
          250000,
          250000,
          "성인 1인 코스",
          ["성인 전원 코스 메뉴 주문", "최소 보증 인원 이상 주문", "구성과 가격은 변경될 수 있음"],
          ["한우 치맛살 육회", "특선 죽", "묵은지 도미찜", "전복 버터구이", "한우 등심과 양념 갈비", "식사와 후식"],
          walkerhillPartyUrl
        ),
        product(
          "수담 정식",
          320000,
          320000,
          "성인 1인 코스",
          ["성인 전원 코스 메뉴 주문", "최소 보증 인원 이상 주문", "구성과 가격은 변경될 수 있음"],
          ["한우 치맛살 육회", "특선 사시미", "해물 무 만두", "바닷가재 버터구이", "한우 등심과 양념 갈비", "솥밥과 후식"],
          walkerhillPartyUrl
        )
      ],
      extraCosts: [],
      policies: { cancellation: null, setup: null, travel: null },
      availability: { mode: "contact_required", checkedAt: null },
      updatedAt: checkedAt,
      capabilities: { inquiry: false, compare: false, save: false, review: false },
      fieldEvidence: [
        evidence("identity", walkerhillUrl),
        evidence("location", walkerhillUrl),
        evidence("services", walkerhillUrl),
        evidence("businessHours", walkerhillUrl),
        evidence("contact.telephone", walkerhillUrl),
        evidence("contact.officialLinks", walkerhillUrl),
        evidence("products", walkerhillPartyUrl)
      ]
    },
    {
      id: "NVR-DOL-005",
      name: "서라벌한정식 서초 본점",
      displayGate: "customer_ready",
      introduction: "단독 룸과 한정식 식사를 중심으로 돌잔치·백일 행사를 준비할 수 있는 레스토랑입니다.",
      serviceCategories: ["돌잔치 장소·식사"],
      services: ["돌잔치·백일", "한정식", "단독 룸", "행사 장비"],
      location: {
        province: "서울특별시",
        district: "서초구",
        neighborhood: "서초동",
        address: "서울특별시 서초구 법원로3길 6-9"
      },
      serviceMode: "visit",
      serviceAreas: [],
      businessHours: [
        "화~일 11:30~21:30",
        "월요일 정기휴무",
        "평일 휴게시간 15:00~17:30",
        "주말 휴게시간 16:00~17:30"
      ],
      contact: {
        telephone: { display: "02-599-5288", href: "tel:+8225995288" },
        officialLinks: [
          { label: "서라벌한정식 공식 정보", kind: "website", url: seorabolUrl },
          { label: "서라벌한정식 돌잔치·백일 안내", kind: "website", url: seorabolEventUrl }
        ]
      },
      image: {
        url: null,
        alt: "",
        rightsVerified: false,
        fallbackCategory: "돌잔치 장소·식사"
      },
      products: [],
      extraCosts: [],
      policies: { cancellation: null, setup: null, travel: null },
      availability: { mode: "contact_required", checkedAt: null },
      updatedAt: checkedAt,
      capabilities: { inquiry: false, compare: false, save: false, review: false },
      fieldEvidence: [
        evidence("identity", seorabolUrl),
        evidence("location", seorabolUrl),
        evidence("services", seorabolEventUrl),
        evidence("businessHours", seorabolUrl),
        evidence("contact.telephone", seorabolUrl),
        evidence("contact.officialLinks", seorabolUrl)
      ]
    },
    {
      id: "NVR-DOL-007",
      name: "눈부신일상 강남점",
      displayGate: "customer_ready",
      introduction: "백일·돌 촬영과 가족 촬영을 중심으로 하는 아기사진 스튜디오 강남점입니다.",
      serviceCategories: ["돌사진·스튜디오"],
      services: ["백일 촬영", "돌 촬영", "가족 촬영"],
      location: {
        province: "서울특별시",
        district: "서초구",
        neighborhood: "양재동",
        address: "서울특별시 서초구 양재천로21길 33 치금빌딩"
      },
      serviceMode: "visit",
      serviceAreas: [],
      businessHours: [],
      contact: {
        telephone: { display: "02-555-5909", href: "tel:+8225555909" },
        officialLinks: [
          { label: "눈부신일상 강남점 공식 정보", kind: "website", url: ilsangstBranchesUrl },
          { label: "눈부신일상 상품 안내", kind: "website", url: ilsangstPriceUrl }
        ]
      },
      image: {
        url: null,
        alt: "",
        rightsVerified: false,
        fallbackCategory: "돌사진·스튜디오"
      },
      products: [],
      extraCosts: [],
      policies: { cancellation: null, setup: null, travel: null },
      availability: { mode: "contact_required", checkedAt: null },
      updatedAt: checkedAt,
      capabilities: { inquiry: false, compare: false, save: false, review: false },
      fieldEvidence: [
        evidence("identity", ilsangstBranchesUrl),
        evidence("location", ilsangstBranchesUrl),
        evidence("services", ilsangstPriceUrl),
        evidence("contact.telephone", ilsangstBranchesUrl),
        evidence("contact.officialLinks", ilsangstBranchesUrl)
      ]
    },
    {
      id: "NVR-DOL-008",
      name: "다온재 한옥스튜디오 돌사진 삼청동집",
      displayGate: "customer_ready",
      introduction: "한옥 돌잔치와 돌사진·돌스냅을 함께 준비하는 한옥 스튜디오입니다.",
      serviceCategories: ["돌사진·스튜디오"],
      services: ["한옥 돌잔치", "돌사진", "돌스냅", "웨딩 한복스냅"],
      location: {
        province: "서울특별시",
        district: "종로구",
        neighborhood: "삼청동",
        address: "서울특별시 종로구 북촌로11다길 23"
      },
      serviceMode: "visit",
      serviceAreas: [],
      businessHours: [],
      contact: {
        telephone: { display: "010-3786-5942", href: "tel:+821037865942" },
        officialLinks: [
          { label: "다온재 공식 정보", kind: "website", url: daonjaeUrl }
        ]
      },
      image: {
        url: null,
        alt: "",
        rightsVerified: false,
        fallbackCategory: "돌사진·스튜디오"
      },
      products: [],
      extraCosts: [],
      policies: { cancellation: null, setup: null, travel: null },
      availability: { mode: "contact_required", checkedAt: null },
      updatedAt: checkedAt,
      capabilities: { inquiry: false, compare: false, save: false, review: false },
      fieldEvidence: [
        evidence("identity", daonjaeUrl),
        evidence("location", daonjaeUrl),
        evidence("services", daonjaeUrl),
        evidence("contact.telephone", daonjaeUrl),
        evidence("contact.officialLinks", daonjaeUrl)
      ]
    },
    {
      id: "NVR-DOL-009",
      name: "돌사진 한옥스튜디오 이다한옥 북촌점",
      displayGate: "customer_ready",
      introduction: "북촌 한옥에서 돌촬영을 전문으로 하며 한복과 헤어·메이크업을 함께 준비하는 스튜디오입니다.",
      serviceCategories: ["돌사진·스튜디오"],
      services: ["돌촬영", "한복 연계", "헤어·메이크업 연계", "가족사진"],
      location: {
        province: "서울특별시",
        district: "종로구",
        neighborhood: "삼청동",
        address: "서울특별시 종로구 북촌로15길 56"
      },
      serviceMode: "visit",
      serviceAreas: [],
      businessHours: [],
      contact: {
        telephone: { display: "010-2960-7214", href: "tel:+821029607214" },
        officialLinks: [
          { label: "이다한옥 공식 소개", kind: "website", url: edahanokAboutUrl },
          { label: "이다한옥 상품 안내", kind: "website", url: edahanokProductUrl },
          { label: "이다한옥 문의 안내", kind: "contact", url: edahanokContactUrl }
        ]
      },
      image: {
        url: null,
        alt: "",
        rightsVerified: false,
        fallbackCategory: "돌사진·스튜디오"
      },
      products: [],
      extraCosts: [],
      policies: { cancellation: null, setup: null, travel: null },
      availability: { mode: "contact_required", checkedAt: null },
      updatedAt: checkedAt,
      capabilities: { inquiry: false, compare: false, save: false, review: false },
      fieldEvidence: [
        evidence("identity", edahanokAboutUrl),
        evidence("location", edahanokContactUrl),
        evidence("services", edahanokAboutUrl),
        evidence("contact.telephone", edahanokContactUrl),
        evidence("contact.officialLinks", edahanokAboutUrl)
      ]
    },
    {
      id: "OFF-DOL-001",
      name: "오크우드 프리미어 코엑스 센터",
      displayGate: "customer_ready",
      introduction: "객실에서 가족끼리 첫 생일을 진행하는 공식 돌잔치 패키지를 운영하는 호텔입니다.",
      serviceCategories: ["돌잔치 장소·식사"],
      services: ["돌잔치 패키지", "프라이빗 객실", "코스 식사", "기본 돌상·포토 테이블"],
      location: {
        province: "서울특별시",
        district: "강남구",
        neighborhood: "삼성동",
        address: "서울특별시 강남구 테헤란로87길 46"
      },
      serviceMode: "visit",
      serviceAreas: [],
      businessHours: [],
      contact: {
        telephone: { display: "02-3466-7205", href: "tel:+82234667205" },
        officialLinks: [
          { label: "오크우드 돌잔치 패키지 공식 안내", kind: "website", url: oakwoodFirstBirthdayUrl }
        ]
      },
      image: {
        url: null,
        alt: "",
        rightsVerified: false,
        fallbackCategory: "돌잔치 장소·식사"
      },
      products: [
        {
          name: "4베드룸 프리미어 돌잔치 패키지",
          includedItems: ["4베드룸 프리미어 1박", "8인 코스 식사", "기본 돌상·포토 테이블", "주차 최대 4시간"],
          priceMin: 3580000,
          priceMax: 3980000,
          currency: "KRW",
          unit: "패키지 총액",
          conditions: ["A·B 코스 선택", "주말 가족연 전용", "2026.08.01~2026.12.31 공식 안내 기준"],
          checkedAt: oakwoodCheckedAt,
          evidence: { sourceClass: "official_website", sourceUrl: oakwoodFirstBirthdayUrl, checkedAt: oakwoodCheckedAt }
        },
        {
          name: "펜트하우스 돌잔치 패키지",
          includedItems: ["펜트하우스 1박", "10인 코스 식사", "기본 돌상·포토 테이블", "주차 최대 4시간"],
          priceMin: 6400000,
          priceMax: 6900000,
          currency: "KRW",
          unit: "패키지 총액",
          conditions: ["A·B 코스 선택", "주말 가족연 전용", "2026.08.01~2026.12.31 공식 안내 기준"],
          checkedAt: oakwoodCheckedAt,
          evidence: { sourceClass: "official_website", sourceUrl: oakwoodFirstBirthdayUrl, checkedAt: oakwoodCheckedAt }
        }
      ],
      extraCosts: [],
      policies: { cancellation: null, setup: null, travel: null },
      availability: { mode: "contact_required", checkedAt: null },
      updatedAt: oakwoodCheckedAt,
      capabilities: { inquiry: false, compare: false, save: false, review: false },
      fieldEvidence: [
        datedEvidence("identity", oakwoodFirstBirthdayUrl, oakwoodCheckedAt),
        datedEvidence("location", oakwoodFirstBirthdayUrl, oakwoodCheckedAt),
        datedEvidence("services", oakwoodFirstBirthdayUrl, oakwoodCheckedAt),
        datedEvidence("contact.telephone", oakwoodFirstBirthdayUrl, oakwoodCheckedAt),
        datedEvidence("contact.officialLinks", oakwoodFirstBirthdayUrl, oakwoodCheckedAt),
        datedEvidence("products", oakwoodFirstBirthdayUrl, oakwoodCheckedAt)
      ]
    }
  ];

  const frozenProfiles = deepFreeze(profiles);

  Object.defineProperty(global, "customerProviderProfiles", {
    value: frozenProfiles,
    enumerable: true,
    configurable: false,
    writable: false
  });
})(window);
