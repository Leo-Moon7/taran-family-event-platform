const calculatorIds = ["adult-count", "adult-price", "child-count", "child-price", "venue-cost", "table-cost", "photo-cost", "outfit-cost", "gift-count", "gift-price", "extra-cost"];
const eventType = document.querySelector("#event-type");
const flowRoot = document.querySelector("#calculator-flow");
const won = value => `${Math.round(value).toLocaleString("ko-KR")}원`;
let saveTimer;
let flowStep = 0;
let flowState = { event: "kids", guests: "mid", venue: "private", package: "basic", packages: ["basic"] };

const eventPresets = {
  kids: { "adult-count": 20, "adult-price": 70000, "child-count": 5, "child-price": 35000, "venue-cost": 0, "table-cost": 500000, "photo-cost": 600000, "outfit-cost": 300000, "gift-count": 25, "gift-price": 8000, "extra-cost": 100000 },
  wedding: { "adult-count": 40, "adult-price": 90000, "child-count": 0, "child-price": 0, "venue-cost": 1000000, "table-cost": 1500000, "photo-cost": 1200000, "outfit-cost": 800000, "gift-count": 40, "gift-price": 12000, "extra-cost": 300000 },
  parents: { "adult-count": 30, "adult-price": 80000, "child-count": 0, "child-price": 0, "venue-cost": 0, "table-cost": 400000, "photo-cost": 600000, "outfit-cost": 200000, "gift-count": 30, "gift-price": 10000, "extra-cost": 200000 },
  home: { "adult-count": 15, "adult-price": 45000, "child-count": 5, "child-price": 25000, "venue-cost": 300000, "table-cost": 300000, "photo-cost": 0, "outfit-cost": 0, "gift-count": 0, "gift-price": 0, "extra-cost": 150000 }
};

const eventCopy = {
  kids: ["아이 행사", "백일·돌·키즈파티 기준으로 장소, 식사, 스타일링, 촬영 비용을 계산합니다."],
  wedding: ["결혼 준비", "상견례·스몰웨딩·브라이덜 샤워 기준으로 공간, 스타일링, 촬영 비용을 계산합니다."],
  parents: ["부모님 행사", "환갑·칠순·팔순·퇴임식 기준으로 식사, 룸, 촬영, 선물 비용을 계산합니다."],
  home: ["가족·홈파티", "집들이·명절·기념일 기준으로 케이터링, 대관, 스타일링 비용을 계산합니다."]
};

const flowConfig = {
  event: {
    title: "어떤 행사를 계산할까요?",
    help: "행사 종류를 먼저 고르면 다음 질문이 바뀝니다.",
    options: [
      ["kids", "아이 행사", "백일 · 돌잔치 · 키즈 생일파티"],
      ["wedding", "결혼 준비", "상견례 · 스몰웨딩 · 브라이덜 샤워"],
      ["parents", "부모님 행사", "환갑 · 칠순 · 팔순 · 퇴임식"],
      ["home", "가족·홈파티", "집들이 · 명절 · 홈파티 · 기념일"]
    ]
  },
  guests: {
    title: "몇 명 정도 함께하나요?",
    help: "인원에 따라 식대와 공간 비용이 달라집니다.",
    optionsByEvent: {
      kids: [["small", "10명 이하", "직계가족 중심"], ["mid", "10~30명", "소규모 돌·백일"], ["large", "30~50명", "친척까지 함께"], ["xlarge", "50명 이상", "연회장 검토"]],
      wedding: [["small", "10명 이하", "상견례 중심"], ["mid", "20~50명", "스몰웨딩"], ["large", "50~80명", "하우스웨딩"], ["xlarge", "80명 이상", "전문 베뉴"]],
      parents: [["small", "10명 이하", "직계가족 중심"], ["mid", "10~30명", "가족 생신"], ["large", "30~50명", "친척 모임"], ["xlarge", "50명 이상", "연회형 행사"]],
      home: [["small", "10명 이하", "집들이·기념일"], ["mid", "10~30명", "홈파티·명절"], ["large", "30~50명", "대관 모임"], ["xlarge", "50명 이상", "출장 케이터링"]]
    }
  },
  venue: {
    titleByEvent: {
      kids: "어떤 공간을 생각하고 있나요?",
      wedding: "어떤 결혼 준비 공간인가요?",
      parents: "부모님 행사 장소는 어떤 느낌인가요?",
      home: "어디에서 모일 예정인가요?"
    },
    help: "공간 성격에 따라 대관료와 식대 기준을 조정합니다.",
    optionsByEvent: {
      kids: [["private", "프라이빗 룸", "식당·호텔 룸"], ["partyroom", "키즈 파티룸", "대관 중심"], ["hotel", "호텔 연회장", "식사 포함"], ["home", "집에서 준비", "출장·대여"]],
      wedding: [["dining", "상견례 룸", "한정식·파인다이닝"], ["house", "스몰웨딩 베뉴", "단독 대관"], ["garden", "야외 가든", "플라워 중심"], ["shower", "브라이덜 샤워룸", "파티룸"]],
      parents: [["hanjeongsik", "한정식 룸", "가족 식사"], ["hotel", "호텔 연회장", "연회형"], ["fine", "파인다이닝", "소규모 고급"], ["home", "가족 단독룸", "편한 동선"]],
      home: [["home", "우리집", "출장 서비스"], ["partyroom", "파티룸 대관", "공간 대여"], ["catering", "케이터링", "음식 중심"], ["restaurant", "레스토랑", "식사 중심"]]
    }
  },
  package: {
    title: "필요한 준비 범위는 어디까지인가요?",
    help: "선택한 범위에 맞춰 촬영·스타일링·선물 기본값을 넣습니다.",
    optionsByEvent: {
      kids: [["basic", "장소·식사 중심", "기본 준비"], ["photo", "스냅 포함", "촬영 추가"], ["style", "돌상·스타일링 포함", "상차림 추가"], ["full", "촬영+스타일링", "풀 구성"]],
      wedding: [["basic", "공간·식사 중심", "기본 준비"], ["photo", "스냅·영상 포함", "기록 중심"], ["style", "플라워 포함", "공간 연출"], ["full", "풀 패키지", "촬영+연출"]],
      parents: [["basic", "식사 중심", "기본 준비"], ["photo", "가족사진 포함", "촬영 추가"], ["gift", "감사패·선물 포함", "선물 준비"], ["full", "촬영+선물", "풀 구성"]],
      home: [["basic", "음식 중심", "기본 준비"], ["rental", "공간 대관 포함", "장소 추가"], ["style", "소품·스타일링 포함", "분위기 연출"], ["full", "대관+스타일링", "풀 구성"]]
    }
  }
};

const guestValues = {
  kids: { small: [8, 2], mid: [20, 5], large: [38, 8], xlarge: [60, 12] },
  wedding: { small: [8, 0], mid: [40, 0], large: [65, 4], xlarge: [100, 8] },
  parents: { small: [8, 0], mid: [25, 2], large: [42, 4], xlarge: [65, 6] },
  home: { small: [8, 2], mid: [20, 5], large: [40, 8], xlarge: [60, 10] }
};

const venueValues = {
  kids: { private: { "venue-cost": 0, "adult-price": 70000, "child-price": 35000 }, partyroom: { "venue-cost": 400000, "adult-price": 45000, "child-price": 25000 }, hotel: { "venue-cost": 700000, "adult-price": 90000, "child-price": 45000 }, home: { "venue-cost": 0, "adult-price": 35000, "child-price": 20000 } },
  wedding: { dining: { "venue-cost": 0, "adult-price": 90000 }, house: { "venue-cost": 1200000, "adult-price": 85000 }, garden: { "venue-cost": 1800000, "adult-price": 95000 }, shower: { "venue-cost": 400000, "adult-price": 55000 } },
  parents: { hanjeongsik: { "venue-cost": 0, "adult-price": 80000 }, hotel: { "venue-cost": 800000, "adult-price": 90000 }, fine: { "venue-cost": 0, "adult-price": 120000 }, home: { "venue-cost": 300000, "adult-price": 65000 } },
  home: { home: { "venue-cost": 0, "adult-price": 45000, "child-price": 25000 }, partyroom: { "venue-cost": 350000, "adult-price": 40000, "child-price": 22000 }, catering: { "venue-cost": 0, "adult-price": 55000, "child-price": 30000 }, restaurant: { "venue-cost": 0, "adult-price": 65000, "child-price": 32000 } }
};

const packageValues = {
  basic: { "table-cost": 200000, "photo-cost": 0, "outfit-cost": 0, "gift-count": 0, "gift-price": 0, "extra-cost": 100000 },
  photo: { "table-cost": 250000, "photo-cost": 700000, "outfit-cost": 0, "gift-count": 0, "gift-price": 0, "extra-cost": 120000 },
  style: { "table-cost": 800000, "photo-cost": 0, "outfit-cost": 200000, "gift-count": 20, "gift-price": 8000, "extra-cost": 150000 },
  gift: { "table-cost": 300000, "photo-cost": 300000, "outfit-cost": 0, "gift-count": 30, "gift-price": 15000, "extra-cost": 200000 },
  rental: { "table-cost": 300000, "photo-cost": 0, "outfit-cost": 0, "gift-count": 0, "gift-price": 0, "extra-cost": 120000 },
  full: { "table-cost": 1000000, "photo-cost": 900000, "outfit-cost": 350000, "gift-count": 30, "gift-price": 12000, "extra-cost": 250000 }
};

function selectedPackages() {
  const raw = Array.isArray(flowState.packages) && flowState.packages.length
    ? flowState.packages
    : [flowState.package || "basic"];
  const valid = raw.filter(value => packageValues[value]);
  return valid.length ? [...new Set(valid)] : ["basic"];
}

function setSelectedPackages(values) {
  const valid = [...new Set(values.filter(value => packageValues[value]))];
  flowState.packages = valid.length ? valid : ["basic"];
  flowState.package = flowState.packages[0] || "basic";
}

function combinedPackageValues(values = selectedPackages()) {
  if (values.includes("full")) return packageValues.full;
  const combined = { ...packageValues.basic };
  values.filter(value => value !== "basic").forEach(value => {
    const preset = packageValues[value] || {};
    Object.entries(preset).forEach(([key, amount]) => {
      combined[key] = Math.max(Number(combined[key] || 0), Number(amount || 0));
    });
  });
  return combined;
}

function numberValue(id) {
  return Math.max(0, Number(document.querySelector(`#${id}`).value) || 0);
}

function setValues(values = {}) {
  Object.entries(values).forEach(([id, value]) => {
    const input = document.querySelector(`#${id}`);
    if (input) input.value = value;
  });
}

function currentEvent() {
  return eventType?.value || flowState.event || "kids";
}

function calculatorState() {
  return {
    "event-type": currentEvent(),
    "flow-state": flowState,
    ...Object.fromEntries(calculatorIds.map(id => [id, numberValue(id)]))
  };
}

function renderEventCopy() {
  const copy = eventCopy[currentEvent()] || eventCopy.kids;
  const note = document.querySelector("#calculator-event-note");
  const basicTitle = document.querySelector("#calculator-basic-title");
  if (note) note.textContent = copy[1];
  if (basicTitle) basicTitle.textContent = `${copy[0]} 기본 정보`;
}

function renderCalculation() {
  renderEventCopy();
  const adults = numberValue("adult-count");
  const children = numberValue("child-count");
  const costs = {
    "식사": adults * numberValue("adult-price") + children * numberValue("child-price"),
    "장소": numberValue("venue-cost"),
    "스타일링": numberValue("table-cost"),
    "스냅·영상": numberValue("photo-cost"),
    "의상·뷰티": numberValue("outfit-cost"),
    "답례품·선물": numberValue("gift-count") * numberValue("gift-price"),
    "기타": numberValue("extra-cost")
  };
  const total = Object.values(costs).reduce((sum, value) => sum + value, 0);
  const people = adults + children;
  document.querySelector("#total-cost").textContent = won(total);
  document.querySelector("#per-person").textContent = won(people ? total / people : 0);
  document.querySelector("#cost-breakdown").innerHTML = Object.entries(costs).map(([label, value]) => `<div class="cost-row"><span>${label}</span><div><i style="width:${total ? Math.max(2, value / total * 100) : 0}%"></i></div><b>${Math.round(value / 10000).toLocaleString("ko-KR")}만원</b></div>`).join("");
  const guide = total < 2500000 ? ["실속형 예산", "장소와 식사 조건을 먼저 확정하고 선택 항목을 조정해보세요."] : total < 6000000 ? ["균형형 예산", "식사·공간·촬영·스타일링 비용의 비중을 비교해보세요."] : ["확장형 예산", "패키지 포함 항목과 중복 비용이 없는지 확인해보세요."];
  document.querySelector("#budget-band").textContent = guide[0];
  document.querySelector("#budget-recommendation").textContent = guide[1];
}

function getFlowOptions(stepId) {
  const config = flowConfig[stepId];
  return config.options || config.optionsByEvent[currentEvent()] || [];
}

function applyFlowChoice(stepId, value) {
  if (stepId === "event") {
    const firstVenue = flowConfig.venue.optionsByEvent[value]?.[0]?.[0] || "private";
    flowState = { event: value, guests: "mid", venue: firstVenue, package: "basic", packages: ["basic"] };
    eventType.value = value;
    setValues(eventPresets[value]);
  } else if (stepId === "package") {
    const current = selectedPackages();
    let next;
    if (value === "basic") {
      next = ["basic"];
    } else if (value === "full") {
      next = current.includes("full") ? ["basic"] : ["full"];
    } else {
      next = current.includes(value)
        ? current.filter(item => item !== value && item !== "basic" && item !== "full")
        : [...current.filter(item => item !== "basic" && item !== "full"), value];
      if (!next.length) next = ["basic"];
    }
    setSelectedPackages(next);
  } else {
    flowState[stepId] = value;
  }

  if (stepId === "guests") {
    const counts = guestValues[currentEvent()]?.[value];
    if (counts) setValues({ "adult-count": counts[0], "child-count": counts[1] });
  }

  if (stepId === "venue") {
    setValues(venueValues[currentEvent()]?.[value] || {});
  }

  if (stepId === "package") {
    setValues(combinedPackageValues());
  }

  renderCalculation();
  scheduleSave();
}

function renderFlow() {
  if (!flowRoot) return;
  const steps = ["event", "guests", "venue", "package"];
  const stepId = steps[flowStep];
  const config = flowConfig[stepId];
  const title = config.titleByEvent?.[currentEvent()] || config.title;
  const options = getFlowOptions(stepId);
  const currentValue = stepId === "event" ? currentEvent() : flowState[stepId];
  const isMultiStep = stepId === "package";
  const currentPackages = selectedPackages();
  flowRoot.innerHTML = `
    <div class="calculator-flow-head">
      <span>${flowStep + 1} / ${steps.length}</span>
      <strong>${title}</strong>
      <p>${config.help}</p>
    </div>
    <div class="calculator-flow-options ${isMultiStep ? "is-multi" : ""}">
      ${options.map(([value, label, help]) => {
        const selected = isMultiStep ? currentPackages.includes(value) : value === currentValue;
        return `<button type="button" class="calculator-flow-option ${selected ? "is-selected" : ""}" data-flow-value="${value}" aria-pressed="${selected ? "true" : "false"}"><span>${label}</span><small>${help}</small></button>`;
      }).join("")}
    </div>
    <div class="calculator-flow-actions">
      <button type="button" data-flow-prev ${flowStep === 0 ? "hidden" : ""}>이전</button>
      <button type="button" data-flow-next>${flowStep === steps.length - 1 ? "상세 비용 수정하기" : "다음"}</button>
    </div>`;

  flowRoot.querySelectorAll("[data-flow-value]").forEach(button => {
    button.addEventListener("click", () => {
      applyFlowChoice(stepId, button.dataset.flowValue);
      if (!isMultiStep && flowStep < steps.length - 1) flowStep += 1;
      renderFlow();
    });
  });

  flowRoot.querySelector("[data-flow-prev]")?.addEventListener("click", () => {
    flowStep = Math.max(0, flowStep - 1);
    renderFlow();
  });

  flowRoot.querySelector("[data-flow-next]")?.addEventListener("click", () => {
    if (flowStep < steps.length - 1) {
      flowStep += 1;
      renderFlow();
      return;
    }
    document.querySelector(".calculator-form-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

async function saveCalculator() {
  const state = calculatorState();
  localStorage.setItem("sonpum-calculator", JSON.stringify(state));
  const account = window.SonpumAuth.getAccount();
  if (!account) {
    document.querySelector("#calculator-save-status").textContent = "현재 브라우저에 임시 저장 중";
    return;
  }
  try {
    await window.SonpumAuth.api("/api/member/state/calculator", { method: "PUT", body: JSON.stringify({ state }) });
    document.querySelector("#calculator-save-status").textContent = "계정에 자동 저장됨";
  } catch (_) {
    document.querySelector("#calculator-save-status").textContent = "저장 연결을 확인해주세요";
  }
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveCalculator, 400);
}

function applyState(state = {}) {
  const eventValue = state["event-type"] || state["flow-state"]?.event || currentEvent();
  if (eventType && eventPresets[eventValue]) eventType.value = eventValue;
  flowState = { ...flowState, ...(state["flow-state"] || {}), event: eventValue };
  setSelectedPackages(Array.isArray(flowState.packages) ? flowState.packages : [flowState.package || "basic"]);
  const fallback = eventPresets[currentEvent()] || eventPresets.kids;
  calculatorIds.forEach(id => {
    const value = state[id] !== undefined ? state[id] : fallback[id];
    document.querySelector(`#${id}`).value = value;
  });
  renderCalculation();
  renderFlow();
}

function applyEventPreset() {
  flowState.event = currentEvent();
  setValues(eventPresets[currentEvent()] || eventPresets.kids);
  renderCalculation();
  renderFlow();
  scheduleSave();
}

if (eventType) {
  eventType.addEventListener("change", applyEventPreset);
}

calculatorIds.forEach(id => {
  document.querySelector(`#${id}`).addEventListener("input", () => {
    renderCalculation();
    scheduleSave();
  });
});

document.querySelector("#calculator-reset").addEventListener("click", () => {
  applyState({ "event-type": currentEvent(), ...(eventPresets[currentEvent()] || eventPresets.kids) });
  scheduleSave();
});

(async function initializeCalculator() {
  const account = await window.SonpumAuth.ready;
  document.querySelector("#calculator-login-link").hidden = Boolean(account);
  if (account) {
    try {
      const saved = await window.SonpumAuth.api("/api/member/state/calculator");
      applyState(Object.keys(saved.state).length ? saved.state : { "event-type": "kids", ...eventPresets.kids });
      document.querySelector("#calculator-save-status").textContent = "계정에 자동 저장됨";
      return;
    } catch (_) {}
  }
  try {
    const saved = JSON.parse(localStorage.getItem("sonpum-calculator") || "{}");
    applyState(Object.keys(saved).length ? saved : { "event-type": "kids", ...eventPresets.kids });
  } catch (_) {
    applyState({ "event-type": "kids", ...eventPresets.kids });
  }
  document.querySelector("#calculator-save-status").textContent = "현재 브라우저에 임시 저장 중";
})();
