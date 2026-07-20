(function () {
  "use strict";

  const state = { step: 1, event: "", region: "", date: "", guests: 0, space: "", services: [] };
  const ranges = {
    kids: { meal: [55000, 90000], space: { restaurant: [0, 500000], hotel: [500000, 1500000], partyroom: [300000, 900000], home: [0, 300000] } },
    parents: { meal: [50000, 110000], space: { restaurant: [0, 600000], hotel: [700000, 1800000], partyroom: [300000, 900000], home: [0, 300000] } },
    wedding: { meal: [70000, 150000], space: { restaurant: [300000, 1000000], hotel: [1000000, 4000000], garden: [1500000, 5000000], partyroom: [500000, 1800000] } },
    home: { meal: [35000, 80000], space: { restaurant: [0, 500000], partyroom: [250000, 800000], home: [0, 250000], garden: [500000, 1500000] } }
  };
  const serviceRanges = { photo: [300000, 900000], video: [300000, 1000000], beauty: [200000, 600000], styling: [300000, 1500000], gift: [150000, 700000] };
  const spaces = {
    default: [{ value: "restaurant", title: "프라이빗 룸", note: "식당·한정식" }, { value: "hotel", title: "호텔·연회장", note: "식사와 진행 포함" }, { value: "partyroom", title: "대관 파티룸", note: "공간을 단독으로 이용" }, { value: "home", title: "자택·출장", note: "케이터링·대여" }],
    wedding: [{ value: "restaurant", title: "파인다이닝·룸", note: "상견례 중심" }, { value: "hotel", title: "호텔·연회장", note: "예식과 식사" }, { value: "garden", title: "야외 가든", note: "가든·하우스웨딩" }, { value: "partyroom", title: "단독 대관 공간", note: "소규모 예식" }]
  };
  const services = [{ value: "photo", title: "스냅 사진", note: "행사 촬영" }, { value: "video", title: "영상 촬영", note: "하이라이트 영상" }, { value: "beauty", title: "헤어·메이크업", note: "가족 스타일링" }, { value: "styling", title: "상차림·플라워", note: "돌상·포토존·꽃장식" }, { value: "gift", title: "답례품·초대장", note: "수량별 제작" }];
  const steps = [...document.querySelectorAll(".calculator-step")];
  const next = document.getElementById("calculator-next");
  const prev = document.getElementById("calculator-prev");

  function optionButton(item, multi) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.value = item.value;
    const strong = document.createElement("strong");
    strong.textContent = item.title;
    const span = document.createElement("span");
    span.textContent = item.note;
    button.append(strong, span);
    button.addEventListener("click", () => {
      if (multi) {
        const selected = new Set(state.services);
        selected.has(item.value) ? selected.delete(item.value) : selected.add(item.value);
        state.services = [...selected];
        button.classList.toggle("is-selected", selected.has(item.value));
      } else {
        const key = state.step === 1 ? "event" : state.step === 3 ? "guests" : "space";
        state[key] = state.step === 3 ? Number(item.value) : item.value;
        button.parentElement.querySelectorAll("button").forEach((candidate) => candidate.classList.toggle("is-selected", candidate === button));
      }
      next.disabled = false;
      calculate();
    });
    return button;
  }

  function renderDynamicOptions() {
    const spaceBox = document.getElementById("calculator-space-options");
    spaceBox.replaceChildren(...(spaces[state.event] || spaces.default).map((item) => optionButton(item, false)));
    document.getElementById("calculator-service-options").replaceChildren(...services.map((item) => optionButton(item, true)));
    document.getElementById("calculator-guests-guide").textContent = state.event === "wedding" ? "소규모 결혼식은 30~80명 구간을 많이 비교합니다." : state.event === "kids" ? "돌잔치는 10~50명 구간에서 장소 선택 폭이 넓습니다." : "가족 구성과 초대 범위를 기준으로 선택하세요.";
    document.getElementById("calculator-space-guide").textContent = state.event === "wedding" ? "야외 진행은 우천 대안과 식사 동선을 함께 확인하세요." : state.event === "parents" ? "어르신 동선과 단독 공간, 주차 조건을 함께 확인하세요." : "행사 방식에 가장 가까운 공간을 선택하세요.";
  }

  function showStep() {
    steps.forEach((section) => { section.hidden = Number(section.dataset.step) !== state.step; });
    document.getElementById("calculator-step-label").textContent = `${state.step} / 5`;
    document.getElementById("calculator-progress-bar").style.width = `${state.step * 20}%`;
    prev.hidden = state.step === 1;
    next.textContent = state.step === 5 ? "계산 완료" : "다음";
    next.disabled = state.step === 1 ? !state.event : state.step === 2 ? !state.region : state.step === 3 ? !state.guests : state.step === 4 ? !state.space : false;
  }

  function calculate() {
    if (!state.event) return;
    const config = ranges[state.event];
    const guests = state.guests || 20;
    let min = config.meal[0] * guests;
    let max = config.meal[1] * guests;
    const items = [["식사", config.meal[0] * guests, config.meal[1] * guests]];
    if (state.space && config.space[state.space]) {
      min += config.space[state.space][0]; max += config.space[state.space][1];
      items.push(["장소", ...config.space[state.space]]);
    }
    state.services.forEach((service) => {
      min += serviceRanges[service][0]; max += serviceRanges[service][1];
      items.push([services.find((item) => item.value === service).title, ...serviceRanges[service]]);
    });
    const format = (value) => `${Math.round(value / 10000).toLocaleString("ko-KR")}만 원`;
    document.getElementById("calculator-total").textContent = `${format(min)} ~ ${format(max)}`;
    document.getElementById("calculator-result-note").textContent = `${state.region ? `${state.region} · ` : ""}${guests}명 기준으로 선택한 항목을 합산한 참고 범위입니다.`;
    const box = document.getElementById("calculator-breakdown");
    box.replaceChildren(...items.map(([name, low, high]) => {
      const row = document.createElement("div");
      const label = document.createElement("span"); label.textContent = name;
      const value = document.createElement("strong"); value.textContent = `${format(low)}~${format(high)}`;
      row.append(label, value); return row;
    }));
    const context = { event: state.event, province: state.region, guests, budget: max, date: state.date };
    const query = new URLSearchParams(Object.entries(context).filter(([, value]) => value).map(([key, value]) => [key, String(value)]));
    document.getElementById("calculator-venues-link").href = `venues.html?${query}`;
    document.getElementById("calculator-checklist-link").href = `checklist.html?${query}`;
    window.TaranStorage.set("calculator-state", JSON.stringify({ ...state, min, max }));
    window.TaranSearchContext?.save?.(context);
  }

  document.querySelectorAll('[data-step="1"] [data-single-options] button').forEach((button) => button.addEventListener("click", () => {
    state.event = button.dataset.value;
    button.parentElement.querySelectorAll("button").forEach((candidate) => candidate.classList.toggle("is-selected", candidate === button));
    next.disabled = false;
    renderDynamicOptions();
    calculate();
  }));
  next.addEventListener("click", () => {
    if (state.step < 5) { state.step += 1; showStep(); return; }
    calculate();
    window.TaranAnalytics?.track("calculator_completed", "calculator.html", { eventType: state.event, guests: state.guests, services: state.services }).catch(() => {});
    document.getElementById("calculator-total").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
  });
  prev.addEventListener("click", () => { state.step = Math.max(1, state.step - 1); showStep(); });
  document.getElementById("calculator-region").addEventListener("change", (event) => {
    state.region = event.target.value;
    next.disabled = !state.region;
    calculate();
  });
  document.getElementById("calculator-date").addEventListener("change", (event) => {
    state.date = event.target.value;
    calculate();
  });
  document.getElementById("calculator-save").addEventListener("click", () => {
    calculate();
    window.TaranToast?.show?.("계산 결과를 이 브라우저에 저장했습니다.");
    window.TaranAnalytics?.track("calculator_saved", "calculator.html", { eventType: state.event }).catch(() => {});
  });
  document.getElementById("calculator-share").addEventListener("click", async () => {
    calculate();
    const total = document.getElementById("calculator-total").textContent;
    const shareData = { title: "따란 가족행사 예상 비용", text: `${state.region || "지역 미정"} · ${state.guests || 20}명 · ${total}`, url: location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        window.TaranToast?.show?.("계산 결과 링크를 복사했습니다.");
      }
      window.TaranAnalytics?.track("calculator_shared", "calculator.html", { eventType: state.event }).catch(() => {});
    } catch (error) {
      if (error?.name !== "AbortError") window.TaranToast?.show?.("공유하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  });
  showStep();
})();
