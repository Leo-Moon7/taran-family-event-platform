(function () {
  "use strict";

  const common = [
    { id: "date", days: 120, title: "행사 날짜 확정하기", action: "calendar" },
    { id: "guests", days: 110, title: "예상 인원 정리하기", action: "calculator" },
    { id: "budget", days: 100, title: "예산 범위 정하기", action: "calculator" },
    { id: "venues", days: 90, title: "장소 후보 찾기", action: "venues" },
    { id: "compare", days: 75, title: "장소 조건 비교하기", action: "compare" },
    { id: "inquiry", days: 65, title: "후보 업체에 견적 문의하기", action: "inquiry" },
    { id: "contract", days: 50, title: "계약·취소 조건 확인하기", action: "guide" },
    { id: "final-guests", days: 14, title: "최종 인원 전달하기", action: "venues" },
    { id: "reconfirm", days: 3, title: "예약 내용 재확인하기", action: "none" }
  ];

  const specific = {
    kids: [
      { id: "table", days: 60, title: "돌상·포토존 구성 정하기", action: "venues" },
      { id: "snap", days: 55, title: "스냅·영상 예약하기", action: "venues" },
      { id: "outfit", days: 40, title: "아기와 가족 의상 준비하기", action: "guide" },
      { id: "baby-bag", days: 2, title: "아기 간식·여벌옷 챙기기", action: "none" }
    ],
    parents: [
      { id: "ceremony", days: 60, title: "행사 순서와 감사 인사 정하기", action: "guide" },
      { id: "snap", days: 45, title: "가족사진·영상 예약하기", action: "venues" },
      { id: "mobility", days: 20, title: "어르신 이동 동선 확인하기", action: "guide" }
    ],
    wedding: [
      { id: "families", days: 60, title: "양가 참석 인원 확정하기", action: "none" },
      { id: "menu", days: 45, title: "식사 메뉴와 좌석 확인하기", action: "venues" },
      { id: "gift", days: 20, title: "선물·예단 전달 방식 정하기", action: "guide" }
    ],
    home: [
      { id: "catering", days: 30, title: "식사·케이터링 구성 정하기", action: "venues" },
      { id: "seats", days: 14, title: "좌석과 이동 공간 정리하기", action: "guide" },
      { id: "supplies", days: 3, title: "당일 식기·소모품 확인하기", action: "none" }
    ]
  };

  const labels = { kids: "돌잔치·백일", parents: "환갑·칠순", wedding: "상견례·소규모 결혼식", home: "가족모임" };

  function getTemplate(type = "kids") {
    return {
      type,
      label: labels[type] || labels.kids,
      tasks: [...common, ...(specific[type] || specific.kids)].sort((a, b) => b.days - a.days)
    };
  }

  window.TaranChecklistTemplates = Object.freeze({ getTemplate, labels });
})();
