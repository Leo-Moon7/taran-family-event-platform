(function () {
  "use strict";

  const emptySpaceDetails = () => ({ cuisine: "", mealBudget: "", useMode: "", venueFeeMin: "", venueFeeMax: "" });
  const state = { step: 1, event: "", eventDetail: "", region: "", district: "", date: "", guests: 0, mealGuests: 0, mealGuestsManual: false, space: "", spaceDetails: emptySpaceDetails(), services: [], completed: false };
  const profiles = {
    kids: { title: "돌잔치·백일", guide: "초대할 가족을 떠올려 대략적인 예상 인원을 입력해 주세요.", spaces: ["restaurant", "hotel", "partyroom", "home"], services: ["dolTable", "photo", "childOutfit", "parentOutfit", "gift", "growthVideo", "host"] },
    parents: { title: "환갑·칠순·팔순", guide: "어르신 이동 동선과 주차를 고려해 대략적인 예상 인원을 입력해 주세요.", spaces: ["restaurant", "hotel", "partyroom", "home"], services: ["ceremonyTable", "banner", "photoVideo", "cake", "gift", "transport", "performance"] },
    meeting: { title: "결혼 준비", guide: "양가 가족과 하객을 떠올려 대략적인 예상 인원을 입력해 주세요.", spaces: ["restaurant", "hotel", "garden", "partyroom"], services: ["privateRoom", "flower", "photoVideo", "dress", "beauty", "audioHost", "gift", "transport"] },
    anniversary: { title: "기념일·생신", guide: "식사와 사진을 함께할 분을 기준으로 대략적인 예상 인원을 입력해 주세요.", spaces: ["restaurant", "hotel", "partyroom", "garden"], services: ["photoVideo", "flower", "cake", "beauty", "gift"] },
    other: { title: "기타 가족행사", guide: "행사 목적에 맞춰 대략적인 예상 인원을 입력해 주세요.", spaces: ["restaurant", "hotel", "partyroom", "home", "garden"], services: ["flower", "photoVideo", "cake", "styling", "gift", "transport"] }
  };
  const eventDetailOptions = {
    kids: [
      { value: "baekil", title: "백일", note: "아기의 백일을 기념하는 자리" },
      { value: "dol", title: "돌잔치", note: "첫돌을 축하하는 가족행사" },
      { value: "kidsParty", title: "키즈 파티", note: "아이 생일·성장 기념 모임" }
    ],
    parents: [
      { value: "hwangap", title: "환갑", note: "만 60세를 기념하는 자리" },
      { value: "chilsun", title: "칠순", note: "70세를 축하하는 가족행사" },
      { value: "palsun", title: "팔순", note: "80세를 축하하는 가족행사" },
      { value: "parentBirthday", title: "부모님 생신", note: "연령 기념과 별도의 생신 모임" },
      { value: "retirement", title: "퇴임·은퇴 기념", note: "새 출발을 축하하는 자리" }
    ],
    meeting: [
      { value: "familyMeeting", title: "상견례", note: "양가가 처음 인사하는 식사 자리" },
      { value: "engagement", title: "약혼식", note: "약혼을 기념하는 가족행사" },
      { value: "smallWedding", title: "소규모 예식", note: "가까운 가족·지인 중심 예식" }
    ],
    anniversary: [
      { value: "birthday", title: "생일", note: "성인·가족의 생일 모임" },
      { value: "weddingAnniversary", title: "결혼기념일", note: "부부와 가족이 함께하는 기념식" },
      { value: "familyAnniversary", title: "가족 기념일", note: "가족에게 의미 있는 날의 모임" }
    ],
    other: [
      { value: "familyGathering", title: "가족모임", note: "명절·친목을 위한 가족 식사" },
      { value: "memorial", title: "추모·제례", note: "가족이 함께 기억하는 자리" },
      { value: "yearEnd", title: "송년·신년 모임", note: "한 해를 마무리하거나 시작하는 모임" },
      { value: "otherFamilyEvent", title: "그 밖의 가족행사", note: "위 유형에 포함되지 않는 가족행사" }
    ]
  };
  const spaceRanges = {
    restaurant: [0, 800000], hotel: [700000, 2800000], partyroom: [250000, 1200000],
    home: [0, 350000], garden: [800000, 3500000]
  };
  const spaceOptions = {
    restaurant: { value: "restaurant", title: "프라이빗 룸", note: "식당·한정식·파인다이닝" },
    hotel: { value: "hotel", title: "호텔·연회장", note: "식사와 행사 진행" },
    partyroom: { value: "partyroom", title: "대관 파티룸", note: "공간을 단독으로 이용" },
    home: { value: "home", title: "자택·출장", note: "케이터링·상차림" },
    garden: { value: "garden", title: "야외·가든", note: "가든·하우스 행사" }
  };
  const cuisineOptions = [
    { value: "korean", title: "한정식", note: "한식 코스·상차림" },
    { value: "fineDining", title: "파인다이닝", note: "코스 중심 식사" },
    { value: "chinese", title: "중식", note: "중식 코스·요리" },
    { value: "buffet", title: "뷔페", note: "여러 메뉴 선택" },
    { value: "general", title: "일반 레스토랑", note: "캐주얼 식사" }
  ];
  const mealBudgetOptions = [
    { value: "under50000", title: "3.5만~5만 원", note: "1인 계획 범위", range: [35000, 50000] },
    { value: "50000to80000", title: "5만~8만 원", note: "1인 계획 범위", range: [50000, 80000] },
    { value: "80000to120000", title: "8만~12만 원", note: "1인 계획 범위", range: [80000, 120000] },
    { value: "over120000", title: "12만~18만 원", note: "1인 계획 범위", range: [120000, 180000] }
  ];
  const useModeOptions = {
    hotel: [
      { value: "dining", title: "식사 중심", note: "별도 진행 없이 식사 위주", range: [0, 0] },
      { value: "banquet", title: "연회 진행 포함", note: "음향·진행 공간까지 준비", range: [300000, 1200000] },
      { value: "stay", title: "숙박 연계", note: "가족 숙박까지 함께 계획", range: [500000, 1800000] }
    ],
    partyroom: [
      { value: "spaceOnly", title: "공간만 대관", note: "음식과 장식은 별도 준비", range: [0, 0] },
      { value: "styled", title: "장식 포함 대관", note: "기본 테이블·공간 연출 포함", range: [150000, 600000] },
      { value: "fullDay", title: "종일 대관", note: "준비·정리 시간을 넉넉하게", range: [200000, 800000] }
    ],
    home: [
      { value: "self", title: "직접 준비", note: "가족이 식사와 공간을 준비", range: [0, 200000] },
      { value: "catering", title: "출장 케이터링", note: "음식 운반·세팅 포함", range: [200000, 900000] },
      { value: "tableSetting", title: "상차림 중심", note: "기념 상차림과 장식 중심", range: [150000, 550000] }
    ],
    garden: [
      { value: "venueOnly", title: "야외 공간 중심", note: "공간과 기본 좌석 위주", range: [0, 0] },
      { value: "ceremonyMeal", title: "행사·식사 함께", note: "진행 공간과 식사 동선 포함", range: [500000, 1500000] },
      { value: "rainBackup", title: "우천 대안 포함", note: "실내 대체 공간까지 준비", range: [700000, 2000000] }
    ]
  };
  const spaceServiceRules = {
    restaurant: { add: ["cake", "gift"], remove: ["privateRoom"], recommendation: "독립 공간 여부와 식사 흐름을 먼저 확인하고 케이크·답례품처럼 반입 조건이 있는 항목을 함께 살펴보세요." },
    hotel: { add: ["flower", "audioHost"], remove: ["privateRoom"], recommendation: "연회장 포함 범위를 확인한 뒤 꽃 장식과 음향·진행을 별도 준비할지 선택해 보세요." },
    partyroom: { add: ["styling", "audioHost"], remove: ["privateRoom"], recommendation: "대관에 포함된 장비와 장식을 확인하고 부족한 스타일링·음향 항목을 더해 보세요." },
    home: { add: ["styling", "cake"], remove: ["privateRoom", "audioHost"], recommendation: "집 안 동선과 정리 범위를 고려해 상차림·장식처럼 현장 준비가 필요한 항목을 골라 보세요." },
    garden: { add: ["flower", "audioHost", "transport"], remove: ["privateRoom"], recommendation: "날씨 대안과 이동 동선을 먼저 확인하고 야외 장식·음향·차량 준비를 함께 살펴보세요." }
  };
  const eventServiceAdvice = {
    kids: "돌잔치·백일에는 아이 동선과 촬영 시간을 기준으로 준비 항목을 좁혀 보세요.",
    parents: "부모님 행사는 어르신 이동과 순서 진행에 꼭 필요한 준비를 우선해 보세요.",
    meeting: "결혼 준비 행사는 양가 대화와 진행이 방해받지 않는 항목을 우선해 보세요.",
    anniversary: "기념일·생신에는 식사 흐름을 해치지 않는 기록과 장식 중심으로 골라 보세요.",
    other: "행사 목적에 꼭 필요한 항목부터 선택하고 포함 여부를 업체에 다시 확인해 주세요."
  };
  const contractChecksByEvent = {
    kids: ["아기 의자·수유실·기저귀 교환 공간과 유모차 동선을 확인하세요.", "돌상·스냅·성장 영상 업체의 설치 시간과 반입 가능 시간을 함께 확인하세요."],
    parents: ["어르신이 이동하기 쉬운 엘리베이터·화장실·주차 동선을 확인하세요.", "행사 순서와 마이크·화면 사용이 공간 이용 시간에 포함되는지 확인하세요."],
    meeting: ["양가 대화를 위한 독립 공간과 옆 테이블 소음 차단 여부를 확인하세요.", "꽃·선물·의상 보관과 식사 전후 대기 공간을 확인하세요."],
    anniversary: ["케이크·꽃·외부 촬영의 반입 가능 여부와 추가비를 확인하세요.", "기념 촬영 시간과 식사 제공 시간을 함께 맞출 수 있는지 확인하세요."],
    other: ["행사 성격에 필요한 좌석 배치와 별도 공간 사용 가능 여부를 확인하세요.", "외부 물품 반입·준비·정리 시간이 대관 시간에 포함되는지 확인하세요."]
  };
  const contractChecksBySpace = {
    restaurant: ["프라이빗 룸 최소 주문 금액과 룸 이용료 포함 여부를 확인하세요.", "주류·케이크·답례품 등 외부 물품 반입 가능 여부를 확인하세요.", "무료 주차 시간과 지원 차량 수를 확인하세요."],
    hotel: ["최소 보증 인원과 최종 인원 확정 기한을 확인하세요.", "부가세·봉사료·음향·대기실이 견적에 포함되는지 확인하세요.", "주차 지원 범위와 행사 전후 이용 시간을 확인하세요."],
    partyroom: ["대관 시간에 준비·정리 시간이 포함되는지 확인하세요.", "취사·케이터링·외부 장식 반입과 폐기물 처리 조건을 확인하세요.", "테이블·의자·빔·음향 장비의 실제 제공 수량을 확인하세요."],
    home: ["출장비·설치비·철수비와 계단·주차 추가비를 확인하세요.", "음식 보관·배식·설거지와 행사 후 정리 범위를 확인하세요.", "가구 이동과 장식 설치가 가능한 벽·공간을 미리 확인하세요."],
    garden: ["우천·폭염·한파 시 대체 공간과 취소 기준을 확인하세요.", "전기·조명·음향·화장실과 이동 동선을 확인하세요.", "행사 시간 제한과 야외 소음 기준을 확인하세요."]
  };
  const serviceRanges = {
    dolTable: [350000, 1200000], photo: [300000, 900000], childOutfit: [80000, 300000], parentOutfit: [150000, 600000], gift: [150000, 700000], growthVideo: [100000, 450000], host: [150000, 450000],
    ceremonyTable: [300000, 1000000], banner: [100000, 400000], photoVideo: [450000, 1500000], cake: [70000, 300000], transport: [250000, 1200000], performance: [300000, 1500000],
    privateRoom: [0, 300000], flower: [100000, 1000000], clothing: [150000, 700000], dress: [400000, 1800000], beauty: [200000, 700000], audioHost: [300000, 1200000], styling: [200000, 1000000]
  };
  const serviceOptions = {
    dolTable: { value: "dolTable", title: "돌상·장식", note: "돌상·포토존" }, photo: { value: "photo", title: "스냅 사진", note: "행사 촬영" }, childOutfit: { value: "childOutfit", title: "아기 의상", note: "한복·드레스" }, parentOutfit: { value: "parentOutfit", title: "부모 의상", note: "한복·정장" }, gift: { value: "gift", title: "답례품·선물", note: "수량별 제작" }, growthVideo: { value: "growthVideo", title: "성장 영상", note: "상영 영상 제작" }, host: { value: "host", title: "사회·진행", note: "행사 진행" },
    ceremonyTable: { value: "ceremonyTable", title: "상차림", note: "환갑·칠순 상차림" }, banner: { value: "banner", title: "현수막·장식", note: "기념 문구와 공간 연출" }, photoVideo: { value: "photoVideo", title: "사진·영상", note: "스냅과 영상 기록" }, cake: { value: "cake", title: "케이크", note: "맞춤 제작" }, transport: { value: "transport", title: "버스·차량", note: "가족 이동" }, performance: { value: "performance", title: "사회·공연", note: "진행과 축하 공연" },
    privateRoom: { value: "privateRoom", title: "프라이빗 룸 추가비", note: "독립 공간 이용" }, flower: { value: "flower", title: "꽃·플라워", note: "테이블·공간 장식" }, clothing: { value: "clothing", title: "의상", note: "가족 복장 준비" }, dress: { value: "dress", title: "드레스·한복", note: "예식 의상" }, beauty: { value: "beauty", title: "헤어·메이크업", note: "가족 스타일링" }, audioHost: { value: "audioHost", title: "음향·사회", note: "장비와 진행" }, styling: { value: "styling", title: "장식·스타일링", note: "분위기 연출" }
  };
  const steps = [...document.querySelectorAll(".calculator-step")];
  const next = document.getElementById("calculator-next");
  const prev = document.getElementById("calculator-prev");
  const resultLinks = document.getElementById("calculator-result-links");
  const resultPanel = document.getElementById("calculator-result");
  const completeStatus = document.getElementById("calculator-complete-status");

  function invalidateCompletion() {
    state.completed = false;
    resultLinks.hidden = true;
    completeStatus.hidden = true;
    resultPanel.classList.remove("is-complete");
  }

  function ensureOptionState(button) {
    let marker = button.querySelector(".calculator-option-state");
    if (!marker) {
      marker = document.createElement("small");
      marker.className = "calculator-option-state";
      marker.setAttribute("aria-hidden", "true");
      button.append(marker);
    }
    return marker;
  }

  function setButtonSelected(button, active) {
    button.classList.toggle("is-selected", active);
    button.setAttribute("aria-pressed", String(active));
    ensureOptionState(button).textContent = active ? "✓ 선택됨" : "○ 선택";
  }

  function selectedOption(options, value) {
    return options.find((option) => option.value === value) || null;
  }

  function selectedEventDetail() {
    return selectedOption(eventDetailOptions[state.event] || [], state.eventDetail);
  }

  function exactGuestCount(value) {
    const raw = String(value).trim();
    if (!/^\d+$/.test(raw)) return 0;
    const count = Number(raw);
    return Number.isInteger(count) && count >= 1 && count <= 500 ? count : 0;
  }

  function guestCountsComplete() {
    return Boolean(state.guests && state.mealGuests && state.mealGuests <= state.guests);
  }

  function venueFeeRangeState() {
    const minText = String(state.spaceDetails.venueFeeMin ?? "").trim();
    const maxText = String(state.spaceDetails.venueFeeMax ?? "").trim();
    if (!minText && !maxText) return { hasValue: false, valid: true, range: null };
    const min = Number(minText);
    const max = Number(maxText);
    const valid = minText !== "" && maxText !== "" && Number.isFinite(min) && Number.isFinite(max) && min >= 0 && max >= min && max <= 10000;
    return { hasValue: true, valid, range: valid ? [min * 10000, max * 10000] : null };
  }

  function spaceDetailsComplete() {
    if (!state.space) return false;
    const requiredComplete = state.space === "restaurant"
      ? Boolean(state.spaceDetails.cuisine && state.spaceDetails.mealBudget)
      : Boolean(state.spaceDetails.useMode && state.spaceDetails.mealBudget);
    return requiredComplete && venueFeeRangeState().valid;
  }

  function updateNextState() {
    next.disabled = state.step === 1 ? !(state.event && state.eventDetail)
      : state.step === 2 ? !state.region
        : state.step === 3 ? !guestCountsComplete()
          : state.step === 4 ? !spaceDetailsComplete()
            : false;
  }

  function syncGuestShortcutState() {
    document.querySelectorAll("#calculator-guest-shortcuts button").forEach((button) => {
      setButtonSelected(button, Number(button.dataset.value) === state.guests);
    });
  }

  function commitGuestValue(showError) {
    const input = document.getElementById("calculator-guests");
    const error = document.getElementById("calculator-guests-error");
    state.guests = exactGuestCount(input.value);
    const invalid = !state.guests && (showError || input.value.trim() !== "");
    input.setAttribute("aria-invalid", String(invalid));
    input.setCustomValidity(invalid ? "1명부터 500명 사이의 정수를 입력해 주세요." : "");
    error.hidden = !invalid;
    document.getElementById("calculator-meal-guests").max = String(state.guests || 500);
    if (!state.mealGuestsManual) {
      state.mealGuests = state.guests;
      document.getElementById("calculator-meal-guests").value = state.mealGuests || "";
    }
    commitMealGuestValue(showError && Boolean(state.guests), false);
    syncGuestShortcutState();
    updateNextState();
    calculate();
  }

  function commitMealGuestValue(showError, markManual = true) {
    const input = document.getElementById("calculator-meal-guests");
    const error = document.getElementById("calculator-meal-guests-error");
    if (markManual) state.mealGuestsManual = true;
    state.mealGuests = exactGuestCount(input.value);
    const invalid = !state.mealGuests || state.mealGuests > state.guests;
    const shouldShow = invalid && (showError || input.value.trim() !== "");
    input.setAttribute("aria-invalid", String(shouldShow));
    input.setCustomValidity(shouldShow ? "식사 인원은 1명 이상이며 전체 참석 인원을 넘을 수 없습니다." : "");
    error.hidden = !shouldShow;
    updateNextState();
    calculate();
  }

  function guestFilterValue(guests) {
    const value = Number(guests) || 0;
    if (value <= 10) return 10;
    if (value <= 30) return 30;
    if (value <= 50) return 50;
    if (value <= 100) return 100;
    return 101;
  }

  function guestFilterLabel(value) {
    return value === 101 ? "100명 초과" : `${value}명 이하`;
  }

  function budgetFilterValue(amount) {
    const filters = [1000000, 2000000, 3000000, 5000000];
    return filters.find((value) => amount <= value) || 5000001;
  }

  function budgetFilterLabel(value) {
    return value === 5000001 ? "500만 원 초과" : `${Math.round(value / 10000).toLocaleString("ko-KR")}만 원 이하`;
  }

  function optionButton(item, multi) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.value = item.value;
    button.setAttribute("aria-pressed", "false");
    const strong = document.createElement("strong"); strong.textContent = item.title;
    const span = document.createElement("span"); span.textContent = item.note;
    button.append(strong, span);
    setButtonSelected(button, multi ? state.services.includes(item.value) : state.space === item.value);
    button.addEventListener("click", () => {
      invalidateCompletion();
      if (multi) {
        const selected = new Set(state.services);
        selected.has(item.value) ? selected.delete(item.value) : selected.add(item.value);
        state.services = [...selected];
        setButtonSelected(button, selected.has(item.value));
      } else {
        if (state.space !== item.value) {
          state.space = item.value;
          state.spaceDetails = emptySpaceDetails();
          state.services = [];
          renderSpaceDetails();
          renderServiceOptions();
        }
        button.parentElement.querySelectorAll("button").forEach((candidate) => {
          const active = candidate === button;
          setButtonSelected(candidate, active);
        });
      }
      updateNextState();
      calculate();
    });
    return button;
  }

  function detailOptionButton(item, key) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.value = item.value;
    button.dataset.detailKey = key;
    const strong = document.createElement("strong"); strong.textContent = item.title;
    const span = document.createElement("span"); span.textContent = item.note;
    button.append(strong, span);
    setButtonSelected(button, state.spaceDetails[key] === item.value);
    button.addEventListener("click", () => {
      invalidateCompletion();
      state.spaceDetails[key] = item.value;
      button.parentElement.querySelectorAll("button").forEach((candidate) => setButtonSelected(candidate, candidate === button));
      updateNextState();
      calculate();
    });
    return button;
  }

  function eventDetailOptionButton(item) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.value = item.value;
    button.dataset.detailKey = "eventDetail";
    const strong = document.createElement("strong"); strong.textContent = item.title;
    const span = document.createElement("span"); span.textContent = item.note;
    button.append(strong, span);
    setButtonSelected(button, state.eventDetail === item.value);
    button.addEventListener("click", () => {
      invalidateCompletion();
      if (state.eventDetail !== item.value) {
        state.eventDetail = item.value;
        renderDynamicOptions();
      }
      button.parentElement.querySelectorAll("button").forEach((candidate) => setButtonSelected(candidate, candidate === button));
      updateNextState();
      calculate();
    });
    return button;
  }

  function detailGroup(legendText, hintText, key, options) {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "calculator-detail-group";
    const legend = document.createElement("legend"); legend.textContent = legendText;
    const hint = document.createElement("p");
    hint.className = "calculator-detail-hint";
    hint.id = `calculator-detail-${key}-hint`;
    hint.textContent = hintText;
    const buttons = document.createElement("div");
    buttons.className = "calculator-detail-options";
    buttons.setAttribute("role", "group");
    buttons.setAttribute("aria-label", legendText);
    buttons.setAttribute("aria-describedby", hint.id);
    buttons.append(...options.map((item) => detailOptionButton(item, key)));
    fieldset.append(legend, hint, buttons);
    return fieldset;
  }

  function venueFeeGroup() {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "calculator-detail-group calculator-venue-fee";
    const legend = document.createElement("legend");
    legend.textContent = "알고 있는 공간·룸 이용료 (선택)";
    const hint = document.createElement("p");
    hint.className = "calculator-detail-hint";
    hint.id = "calculator-venue-fee-hint";
    hint.textContent = "이미 받은 안내가 있을 때만 최소·최대 금액을 입력하세요. 비우면 공간 유형의 넓은 임시 범위를 사용합니다.";
    const fields = document.createElement("div");
    fields.className = "calculator-venue-fee__fields";
    const inputConfig = [
      ["venueFeeMin", "최소", "calculator-venue-fee-min"],
      ["venueFeeMax", "최대", "calculator-venue-fee-max"]
    ];
    inputConfig.forEach(([key, labelText, id]) => {
      const label = document.createElement("label");
      label.setAttribute("for", id);
      const labelSpan = document.createElement("span");
      labelSpan.textContent = labelText;
      const inputWrap = document.createElement("span");
      inputWrap.className = "calculator-venue-fee__input";
      const input = document.createElement("input");
      input.className = "input";
      input.id = id;
      input.type = "number";
      input.min = "0";
      input.max = "10000";
      input.step = "10";
      input.inputMode = "numeric";
      input.value = state.spaceDetails[key];
      input.setAttribute("aria-describedby", `${hint.id} calculator-venue-fee-error`);
      const unit = document.createElement("span");
      unit.textContent = "만원";
      unit.setAttribute("aria-hidden", "true");
      inputWrap.append(input, unit);
      label.append(labelSpan, inputWrap);
      fields.append(label);
      input.addEventListener("input", () => {
        invalidateCompletion();
        state.spaceDetails[key] = input.value;
        const feeState = venueFeeRangeState();
        const error = document.getElementById("calculator-venue-fee-error");
        fields.querySelectorAll("input").forEach((candidate) => candidate.setAttribute("aria-invalid", String(!feeState.valid)));
        error.hidden = feeState.valid;
        updateNextState();
        calculate();
      });
    });
    const error = document.createElement("p");
    error.className = "calculator-field-error";
    error.id = "calculator-venue-fee-error";
    error.role = "status";
    error.textContent = "최소·최대 금액을 모두 입력하고 최대 금액을 최소 금액 이상으로 적어 주세요.";
    error.hidden = true;
    fieldset.append(legend, hint, fields, error);
    return fieldset;
  }

  function renderEventDetails() {
    const container = document.getElementById("calculator-event-details");
    const options = eventDetailOptions[state.event] || [];
    if (!state.event || !options.length) {
      container.hidden = true;
      container.replaceChildren();
      return;
    }
    const heading = document.createElement("h3");
    heading.textContent = `${profiles[state.event].title} 세부 행사`;
    const required = document.createElement("p");
    required.className = "calculator-required-note";
    required.textContent = "다음 단계로 가려면 실제 준비 중인 세부 행사 하나를 선택해 주세요.";
    const fieldset = document.createElement("fieldset");
    fieldset.className = "calculator-detail-group";
    const legend = document.createElement("legend");
    legend.textContent = "세부 행사 유형 (필수)";
    const hint = document.createElement("p");
    hint.className = "calculator-detail-hint";
    hint.id = "calculator-event-detail-hint";
    hint.textContent = "선택한 유형은 결과 요약과 저장 상태에 반영됩니다.";
    const buttons = document.createElement("div");
    buttons.className = "calculator-detail-options";
    buttons.setAttribute("role", "group");
    buttons.setAttribute("aria-label", "세부 행사 유형");
    buttons.setAttribute("aria-describedby", hint.id);
    buttons.append(...options.map(eventDetailOptionButton));
    fieldset.append(legend, hint, buttons);
    container.replaceChildren(heading, required, fieldset);
    container.hidden = false;
  }

  function renderSpaceDetails() {
    const container = document.getElementById("calculator-space-details");
    if (!state.space) {
      container.hidden = true;
      container.replaceChildren();
      return;
    }
    const heading = document.createElement("h3");
    heading.textContent = `${spaceOptions[state.space].title} 세부 조건`;
    const required = document.createElement("p");
    required.className = "calculator-required-note";
    required.textContent = "다음 단계로 가려면 아래 필수 항목을 선택해 주세요.";
    const groups = state.space === "restaurant"
      ? [
          detailGroup("음식점 유형 (필수)", "원하는 식사 방식에 가장 가까운 유형을 선택해 주세요.", "cuisine", cuisineOptions),
          detailGroup("원하는 1인 식비 (필수)", "선택한 범위를 예상 인원에 한 번만 곱해 식사 계획 금액으로 반영합니다.", "mealBudget", mealBudgetOptions)
        ]
      : [
          detailGroup("이용 방식 (필수)", "공간 이용에 포함할 범위를 하나 선택해 주세요.", "useMode", useModeOptions[state.space] || []),
          detailGroup("원하는 1인 식비 (필수)", "선택한 범위를 예상 인원에 한 번만 곱해 식사 계획 금액으로 반영합니다.", "mealBudget", mealBudgetOptions)
        ];
    container.replaceChildren(heading, required, ...groups, venueFeeGroup());
    container.hidden = false;
  }

  function serviceKeysForSelection() {
    const profile = profiles[state.event] || profiles.other;
    const rule = spaceServiceRules[state.space];
    if (!rule) return [...profile.services];
    const excluded = new Set(rule.remove);
    return [...new Set([...profile.services, ...rule.add])].filter((key) => !excluded.has(key) && serviceOptions[key]);
  }

  function renderServiceOptions() {
    const keys = serviceKeysForSelection();
    state.services = state.services.filter((key) => keys.includes(key));
    document.getElementById("calculator-service-options").replaceChildren(...keys.map((key) => optionButton(serviceOptions[key], true)));
    const recommendation = document.getElementById("calculator-service-recommendation");
    document.getElementById("calculator-service-guide").textContent = state.space
      ? `${spaceOptions[state.space].title}과 행사 목적에 맞춘 항목입니다. 필요한 항목은 여러 개 선택할 수 있습니다.`
      : "필요한 항목은 여러 개 선택할 수 있습니다.";
    recommendation.textContent = state.space ? `${eventServiceAdvice[state.event] || eventServiceAdvice.other} ${spaceServiceRules[state.space].recommendation}` : "";
    recommendation.hidden = !state.space;
  }

  function renderDynamicOptions() {
    const profile = profiles[state.event] || profiles.other;
    state.space = "";
    state.spaceDetails = emptySpaceDetails();
    state.services = [];
    document.getElementById("calculator-space-options").replaceChildren(...profile.spaces.map((key) => optionButton(spaceOptions[key], false)));
    renderSpaceDetails();
    renderServiceOptions();
    document.getElementById("calculator-guests-guide").textContent = profile.guide;
    document.getElementById("calculator-space-guide").textContent = state.event === "meeting"
      ? "상견례의 독립 공간과 소규모 예식의 우천 대안·식사 동선을 필요한 만큼 확인하세요."
      : state.event === "parents" ? "어르신 동선, 주차, 독립 공간을 함께 확인하세요." : "행사 방식에 가장 가까운 공간을 선택하세요.";
  }

  function showStep(moveIntoView = false) {
    steps.forEach((section) => { section.hidden = Number(section.dataset.step) !== state.step; });
    document.getElementById("calculator-step-label").textContent = `${state.step} / 5`;
    document.getElementById("calculator-progress-bar").style.width = `${state.step * 20}%`;
    prev.hidden = state.step === 1;
    next.textContent = state.step === 5 ? "결과 확인하기" : "다음";
    updateNextState();
    if (moveIntoView) {
      steps.find((section) => Number(section.dataset.step) === state.step)?.scrollIntoView({
        behavior: "auto",
        block: "start"
      });
    }
  }

  function format(value) { return `${Math.round(value / 10000).toLocaleString("ko-KR")}만 원`; }

  function formatPerPerson(value) {
    const amount = value / 10000;
    return `약 ${amount.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}만 원`;
  }

  function clearResult() {
    document.getElementById("calculator-min").textContent = "선택 전";
    document.getElementById("calculator-typical").textContent = "선택 전";
    document.getElementById("calculator-high").textContent = "선택 전";
    document.getElementById("calculator-total").textContent = "조건 선택 전";
    document.getElementById("calculator-result-note").textContent = "세부 행사, 예상 인원, 공간과 식비를 선택하면 참고 범위를 표시합니다.";
    document.getElementById("calculator-data-basis").textContent = "손품해방의 준비 계획용 가정이며, 확인된 시세·전국 표본·실제 견적이 아닙니다.";
    document.getElementById("calculator-selection-summary").replaceChildren();
    document.getElementById("calculator-breakdown").replaceChildren();
    document.getElementById("calculator-per-person").textContent = "선택 전";
    document.getElementById("calculator-guest-impact").textContent = "선택 전";
    document.getElementById("calculator-fixed-share").textContent = "선택 전";
    document.getElementById("calculator-cost-driver").textContent = "선택 전";
    document.getElementById("calculator-contract-checks").replaceChildren();
    document.getElementById("calculator-filter-note").textContent = "";
    resultLinks.hidden = true;
  }

  function renderSelectionSummary(eventDetail, cuisine, mealBudget, useMode, venueFee) {
    const feeDescription = venueFee.range ? `직접 입력 · ${format(venueFee.range[0])}~${format(venueFee.range[1])}` : "직접 입력 없음 · 임시 범위 사용";
    const rows = [
      ["세부 행사", `${profiles[state.event].title} · ${eventDetail.title}`],
      ["참석 / 식사", `${state.guests.toLocaleString("ko-KR")}명 / ${state.mealGuests.toLocaleString("ko-KR")}명`],
      ["공간", `${spaceOptions[state.space].title}${state.space === "restaurant" ? ` · ${cuisine.title}` : ` · ${useMode.title}`}`],
      ["1인 식비", mealBudget.title],
      ["공간 이용료", feeDescription]
    ];
    document.getElementById("calculator-selection-summary").replaceChildren(...rows.flatMap(([term, description]) => {
      const dt = document.createElement("dt"); dt.textContent = term;
      const dd = document.createElement("dd"); dd.textContent = description;
      return [dt, dd];
    }));
  }

  function renderPlanningAnalysis(items, typical, mealRange, fixedTypical, venueFee) {
    const perPerson = state.guests ? typical / state.guests : 0;
    const guestImpact = [mealRange[0] * 10, mealRange[1] * 10];
    const fixedShare = typical ? Math.round((fixedTypical / typical) * 100) : 0;
    const driver = [...items].sort((a, b) => b.typical - a.typical)[0];
    document.getElementById("calculator-per-person").textContent = formatPerPerson(perPerson);
    document.getElementById("calculator-guest-impact").textContent = `약 ${format(guestImpact[0])}~${format(guestImpact[1])}`;
    document.getElementById("calculator-fixed-share").textContent = `약 ${fixedShare}%`;
    document.getElementById("calculator-cost-driver").textContent = driver?.label || "선택 전";

    const checks = [];
    if (state.date) {
      const day = new Date(`${state.date}T12:00:00`).getDay();
      checks.push(`${state.date}은 ${day === 0 || day === 6 ? "주말" : "평일"}입니다. 해당 날짜의 최소 보증 인원·추가 조건을 다시 확인하세요.`);
    } else {
      checks.push("희망 날짜가 정해지면 평일·주말, 성수기, 최소 보증 인원 조건을 다시 확인하세요.");
    }
    if (state.mealGuests < state.guests) {
      checks.push(`전체 참석 ${state.guests}명 중 식사 ${state.mealGuests}명으로 계산했습니다. 어린이 식대와 무료 인원 기준을 확인하세요.`);
    }
    checks.push(venueFee.range
      ? `공간·룸 이용료는 직접 입력한 ${format(venueFee.range[0])}~${format(venueFee.range[1])}을 사용했습니다. 포함 항목을 견적서와 대조하세요.`
      : "공간·룸 이용료를 입력하지 않아 넓은 임시 범위를 사용했습니다. 실제 견적의 대관료·룸 비용을 확인하세요.");
    checks.push(...(contractChecksByEvent[state.event] || contractChecksByEvent.other).slice(0, 1));
    checks.push(...(contractChecksBySpace[state.space] || []).slice(0, 2));
    document.getElementById("calculator-contract-checks").replaceChildren(...checks.slice(0, 6).map((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      return item;
    }));
  }

  function calculate() {
    if (!state.event || !state.eventDetail || !guestCountsComplete() || !spaceDetailsComplete()) {
      clearResult();
      return null;
    }
    const guests = state.guests;
    const eventDetail = selectedEventDetail();
    const cuisine = selectedOption(cuisineOptions, state.spaceDetails.cuisine);
    const mealBudget = selectedOption(mealBudgetOptions, state.spaceDetails.mealBudget);
    const useMode = selectedOption(useModeOptions[state.space] || [], state.spaceDetails.useMode);
    if (!eventDetail || !mealBudget || (state.space === "restaurant" ? !cuisine : !useMode)) {
      clearResult();
      return null;
    }
    const mealRange = mealBudget.range;
    const venueFee = venueFeeRangeState();
    const mealLabel = state.space === "restaurant"
      ? `식사 · ${cuisine.title} · 1인 ${mealBudget.title}`
      : `식사 · 1인 ${mealBudget.title}`;
    const items = [];
    const addItem = (label, low, high, kind) => items.push({ label, low, high, typical: low + (high - low) * 0.55, kind });
    addItem(mealLabel, mealRange[0] * state.mealGuests, mealRange[1] * state.mealGuests, "variable");
    if (state.space && spaceRanges[state.space]) {
      const fallbackSpaceRange = [
        spaceRanges[state.space][0] + (useMode?.range[0] || 0),
        spaceRanges[state.space][1] + (useMode?.range[1] || 0)
      ];
      const spaceRange = venueFee.range || fallbackSpaceRange;
      addItem(`장소 · ${spaceOptions[state.space].title}${useMode ? ` · ${useMode.title}` : ""}${venueFee.range ? " · 직접 입력" : " · 임시 범위"}`, spaceRange[0], spaceRange[1], "fixed");
    }
    state.services.forEach((service) => {
      addItem(serviceOptions[service].title, serviceRanges[service][0], serviceRanges[service][1], "fixed");
    });
    const min = items.reduce((sum, item) => sum + item.low, 0);
    const high = items.reduce((sum, item) => sum + item.high, 0);
    const typical = Math.round(items.reduce((sum, item) => sum + item.typical, 0) / 10000) * 10000;
    const fixedTypical = items.filter((item) => item.kind === "fixed").reduce((sum, item) => sum + item.typical, 0);
    document.getElementById("calculator-min").textContent = format(min);
    document.getElementById("calculator-typical").textContent = format(typical);
    document.getElementById("calculator-high").textContent = format(high);
    document.getElementById("calculator-total").textContent = `약 ${format(min)}~${format(high)}`;
    document.getElementById("calculator-result-note").textContent = `${state.region ? `${state.region} · ` : ""}${eventDetail.title} · 전체 참석 ${guests.toLocaleString("ko-KR")}명, 식사 ${state.mealGuests.toLocaleString("ko-KR")}명 기준으로 계산했습니다.`;
    document.getElementById("calculator-data-basis").textContent = `식비는 식사 인원 ${state.mealGuests.toLocaleString("ko-KR")}명에 선택한 1인 범위를 곱했습니다. 공간비는 ${venueFee.range ? "직접 입력한 범위" : "공간 유형의 넓은 임시 범위"}를 사용했으며, 나머지는 준비 계획용 가정입니다.`;
    renderSelectionSummary(eventDetail, cuisine, mealBudget, useMode, venueFee);
    document.getElementById("calculator-breakdown").replaceChildren(...items.map(({ label: name, low, high: upper, kind }) => {
      const row = document.createElement("div");
      row.dataset.costType = kind;
      const label = document.createElement("span"); label.textContent = name;
      const value = document.createElement("strong"); value.textContent = `${format(low)}~${format(upper)}`;
      row.append(label, value); return row;
    }));
    renderPlanningAnalysis(items, typical, mealRange, fixedTypical, venueFee);
    const guestsFilter = guestFilterValue(guests);
    const budgetFilter = budgetFilterValue(typical);
    const searchContext = {
      event: state.event,
      province: state.region,
      district: state.district,
      guests: guestsFilter,
      budget: budgetFilter,
      budgetMin: min,
      budgetMax: high,
      date: state.date,
      source: "calculator"
    };
    const checklistContext = { ...searchContext, guests };
    const searchQuery = window.TaranSearchContext?.toParams?.(searchContext) || new URLSearchParams(Object.entries(searchContext).filter(([, value]) => value).map(([key, value]) => [key, String(value)]));
    const checklistQuery = window.TaranSearchContext?.toParams?.(checklistContext) || new URLSearchParams(Object.entries(checklistContext).filter(([, value]) => value).map(([key, value]) => [key, String(value)]));
    document.getElementById("calculator-venues-link").href = `venues.html?${searchQuery}`;
    document.getElementById("calculator-checklist-link").href = `checklist.html?${checklistQuery}`;
    document.getElementById("calculator-filter-note").textContent = `업체 검색에는 인원 ‘${guestFilterLabel(guestsFilter)}’, 예산 ‘${budgetFilterLabel(budgetFilter)}’ 필터가 적용됩니다.`;
    resultLinks.hidden = !state.completed;
    window.TaranSearchContext?.save?.(searchContext);
    return { min, typical, high, guestsFilter, budgetFilter, mealGuests: state.mealGuests, fixedTypical };
  }

  document.querySelectorAll('[data-step="1"] [data-single-options] button').forEach((button) => button.addEventListener("click", () => {
    const eventValue = window.SonpumEventTypes?.normalize?.(button.dataset.value) || button.dataset.value;
    if (eventValue === state.event) return;
    invalidateCompletion();
    state.event = eventValue;
    state.eventDetail = "";
    button.parentElement.querySelectorAll("button").forEach((candidate) => {
      const active = candidate === button;
      setButtonSelected(candidate, active);
    });
    renderEventDetails();
    renderDynamicOptions();
    updateNextState();
    calculate();
  }));
  document.getElementById("calculator-guests").addEventListener("input", () => {
    invalidateCompletion();
    commitGuestValue(false);
  });
  document.getElementById("calculator-guests").addEventListener("blur", () => commitGuestValue(true));
  document.getElementById("calculator-meal-guests").addEventListener("input", () => {
    invalidateCompletion();
    commitMealGuestValue(false);
  });
  document.getElementById("calculator-meal-guests").addEventListener("blur", () => commitMealGuestValue(true));
  document.querySelectorAll("#calculator-guest-shortcuts button").forEach((button) => button.addEventListener("click", () => {
    invalidateCompletion();
    document.getElementById("calculator-guests").value = button.dataset.value;
    commitGuestValue(false);
  }));
  document.getElementById("calculator-form").addEventListener("submit", (event) => event.preventDefault());
  next.addEventListener("click", () => {
    if (state.step < 5) { state.step += 1; showStep(true); return; }
    state.completed = true;
    calculate();
    completeStatus.hidden = false;
    resultPanel.classList.add("is-complete");
    window.TaranAnalytics?.track("calculator_completed", "calculator.html", { eventType: state.event, guests: state.guests, space: state.space, spaceDetails: state.spaceDetails, services: state.services }).catch(() => {});
    resultPanel.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    resultPanel.focus({ preventScroll: true });
  });
  prev.addEventListener("click", () => { state.step = Math.max(1, state.step - 1); showStep(true); });
  document.getElementById("calculator-region").addEventListener("change", (event) => { invalidateCompletion(); state.region = event.target.value; next.disabled = !state.region; calculate(); });
  document.getElementById("calculator-district").addEventListener("change", (event) => { invalidateCompletion(); state.district = event.target.value; calculate(); });
  document.getElementById("calculator-date").addEventListener("change", (event) => { invalidateCompletion(); state.date = event.target.value; calculate(); });
  document.getElementById("calculator-save").addEventListener("click", async () => {
    const result = calculate();
    if (!result) {
      window.TaranToast?.show?.("세부 행사, 예상 인원, 공간과 식비를 선택한 뒤 결과를 저장해 주세요.");
      return;
    }
    window.TaranStorage.set("calculator-state", JSON.stringify({ ...state, ...result }));
    if (!window.TaranConfig?.supabaseUrl || !window.TaranConfig?.supabaseAnonKey) {
      window.TaranToast?.show?.("이 기기에 계산 결과를 저장했습니다.");
      return;
    }
    await window.TaranAuth?.ready;
    if (!window.TaranAuth?.getAccount?.()) {
      location.href = window.TaranAuth?.loginUrl?.(`calculator.html${location.search}`) || "login.html?return=calculator.html";
      return;
    }
    try { await window.TaranAuth.api("/api/member/state/calculator", { method: "PUT", body: JSON.stringify({ state: { ...state, ...result } }) }); }
    catch (_error) { window.TaranToast?.show?.("브라우저에는 저장했지만 온라인 계정 저장은 잠시 후 다시 시도해 주세요."); return; }
    window.TaranToast?.show?.("계산 결과를 계정에서 이어볼 수 있도록 저장했습니다.");
  });
  document.getElementById("calculator-share").addEventListener("click", async () => {
    const result = calculate();
    if (!result) {
      window.TaranToast?.show?.("세부 행사, 예상 인원, 공간과 식비를 선택한 뒤 결과를 공유해 주세요.");
      return;
    }
    const detail = selectedEventDetail();
    const mealBudget = selectedOption(mealBudgetOptions, state.spaceDetails.mealBudget);
    const text = `${state.region || "지역 미정"} · ${detail.title} · 참석 ${state.guests}명 · 식사 ${state.mealGuests}명 · 1인 식비 ${mealBudget.title} · 준비 계획용 ${document.getElementById("calculator-total").textContent}`;
    try {
      if (navigator.share) await navigator.share({ title: "손품해방 가족행사 준비 비용 범위", text, url: location.href });
      else { await navigator.clipboard.writeText(`${text}\n${location.href}`); window.TaranToast?.show?.("계산 결과 링크를 복사했습니다."); }
    } catch (error) { if (error?.name !== "AbortError") window.TaranToast?.show?.("공유하지 못했습니다. 잠시 후 다시 시도해 주세요."); }
  });
  const initial = window.TaranSearchContext?.resolve?.() || { event: "kids", province: "서울특별시" };
  state.event = window.SonpumEventTypes?.normalize?.(initial.event || "kids") || "kids";
  state.region = initial.province || "서울특별시";
  state.district = initial.district || "";
  state.date = initial.date || "";
  state.guests = 0;
  state.mealGuests = 0;
  state.mealGuestsManual = false;
  window.SonpumRegions?.setupSelects?.(document.getElementById("calculator-region"), document.getElementById("calculator-district"), { province: state.region, district: state.district });
  document.getElementById("calculator-date").value = state.date;
  document.querySelectorAll('[data-step="1"] button').forEach((button) => {
    const active = button.dataset.value === state.event;
    setButtonSelected(button, active);
  });
  document.getElementById("calculator-guests").value = "";
  document.getElementById("calculator-meal-guests").value = "";
  syncGuestShortcutState();
  renderEventDetails();
  renderDynamicOptions();
  calculate();
  showStep();
})();
