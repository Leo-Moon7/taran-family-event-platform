(function () {
  "use strict";

  const templates = {
    kids: {
      label: "돌잔치·백일",
      tasks: [
        { id: "venue-budget", days: 120, title: "장소 후보와 전체 예산 정하기", action: "venues" },
        { id: "photo-table", days: 90, title: "촬영과 돌상 구성 비교하기", action: "compare" },
        { id: "outfits", days: 60, title: "아기와 가족 의상 준비하기", action: "guide" },
        { id: "invitation-gift", days: 30, title: "초대장과 답례품 확정하기", action: "guide" },
        { id: "final-kids", days: 7, title: "최종 인원과 아기 준비물 확인하기", action: "none" }
      ]
    },
    parents: {
      label: "환갑·칠순·팔순",
      tasks: [
        { id: "date-venue", days: 90, title: "날짜와 장소 후보 정하기", action: "venues" },
        { id: "guests-table", days: 60, title: "참석 인원과 상차림 정하기", action: "calculator" },
        { id: "photo-gift", days: 30, title: "사진 촬영과 답례품 준비하기", action: "guide" },
        { id: "seats", days: 14, title: "좌석과 어르신 이동 동선 확인하기", action: "guide" },
        { id: "final-parents", days: 3, title: "최종 인원과 진행 순서 확인하기", action: "none" }
      ]
    },
    meeting: {
      label: "상견례",
      tasks: [
        { id: "meeting-date", days: 30, title: "양가 일정과 지역 정하기", action: "none" },
        { id: "meeting-venue", days: 21, title: "프라이빗 룸과 코스 비교하기", action: "venues" },
        { id: "meeting-menu", days: 14, title: "메뉴와 좌석 배치 확정하기", action: "compare" },
        { id: "meeting-gift", days: 7, title: "선물과 복장 준비하기", action: "guide" },
        { id: "meeting-final", days: 1, title: "예약 시간과 주차 안내 확인하기", action: "none" }
      ]
    },
    smallWedding: {
      label: "스몰웨딩",
      tasks: [
        { id: "wedding-budget", days: 240, title: "예산과 예상 하객 정하기", action: "calculator" },
        { id: "wedding-venue", days: 180, title: "예식 장소 계약하기", action: "venues" },
        { id: "wedding-photo-outfit", days: 120, title: "촬영과 의상 업체 정하기", action: "compare" },
        { id: "wedding-invite-food", days: 60, title: "초대장과 식사 구성 확정하기", action: "guide" },
        { id: "wedding-direction", days: 30, title: "진행 순서와 공간 연출 정하기", action: "guide" },
        { id: "wedding-final", days: 7, title: "인원과 우천 대안 최종 확인하기", action: "none" }
      ]
    },
    familyGathering: {
      label: "가족모임",
      tasks: [
        { id: "gathering-purpose", days: 45, title: "모임 목적과 참석 범위 정하기", action: "none" },
        { id: "gathering-venue", days: 30, title: "장소와 식사 구성 정하기", action: "venues" },
        { id: "gathering-transport", days: 14, title: "좌석과 이동 동선 안내하기", action: "guide" },
        { id: "gathering-supplies", days: 3, title: "케이크와 당일 준비물 확인하기", action: "none" }
      ]
    },
    anniversary: {
      label: "기념일",
      tasks: [
        { id: "anniversary-plan", days: 60, title: "기념 방식과 예산 정하기", action: "calculator" },
        { id: "anniversary-venue", days: 45, title: "장소와 촬영 방식 정하기", action: "venues" },
        { id: "anniversary-flower", days: 30, title: "꽃과 공간 연출 준비하기", action: "compare" },
        { id: "anniversary-letter", days: 10, title: "편지와 선물 준비하기", action: "guide" },
        { id: "anniversary-final", days: 2, title: "예약과 전달 순서 확인하기", action: "none" }
      ]
    },
    memorial: {
      label: "추모 가족행사",
      tasks: [
        { id: "memorial-family", days: 30, title: "가족 일정과 진행 방식 정하기", action: "none" },
        { id: "memorial-meal", days: 20, title: "장소와 식사 구성 확인하기", action: "venues" },
        { id: "memorial-notice", days: 7, title: "참석 가족에게 일정 안내하기", action: "none" },
        { id: "memorial-final", days: 2, title: "준비물과 이동 동선 확인하기", action: "guide" }
      ]
    },
    other: {
      label: "기타 가족행사",
      tasks: [
        { id: "other-purpose", days: 60, title: "행사 목적과 예상 인원 정하기", action: "none" },
        { id: "other-budget", days: 45, title: "예산과 필요한 서비스 정하기", action: "calculator" },
        { id: "other-venue", days: 30, title: "장소와 업체 비교하기", action: "compare" },
        { id: "other-run-sheet", days: 7, title: "당일 진행 순서 정리하기", action: "guide" },
        { id: "other-final", days: 2, title: "예약 조건 최종 확인하기", action: "none" }
      ]
    }
  };

  function getTemplate(type = "kids") {
    const normalized = window.SonpumEventTypes?.normalize?.(type) || type;
    const source = templates[normalized] || templates.other;
    return { type: normalized, label: source.label, tasks: source.tasks.map((task) => ({ ...task })) };
  }

  const labels = Object.fromEntries(Object.entries(templates).map(([key, value]) => [key, value.label]));
  window.TaranChecklistTemplates = Object.freeze({ getTemplate, labels });
})();
