(function () {
  "use strict";

  const state = { step: 1, event: "", region: "", district: "", date: "", guests: 0, space: "", services: [] };
  const profiles = {
    kids: { meal: [55000, 90000], guide: "초대할 가족 범위를 기준으로 참석 인원을 정해보세요.", spaces: ["restaurant", "hotel", "partyroom", "home"], services: ["dolTable", "photo", "childOutfit", "parentOutfit", "gift", "growthVideo", "host"] },
    parents: { meal: [50000, 110000], guide: "어르신 이동 동선과 주차를 고려해 참석 범위를 정해보세요.", spaces: ["restaurant", "hotel", "partyroom", "home"], services: ["ceremonyTable", "banner", "photoVideo", "cake", "gift", "transport", "performance"] },
    meeting: { meal: [60000, 160000], guide: "상견례나 소규모 예식에 함께할 양가 가족과 하객 범위를 정해보세요.", spaces: ["restaurant", "hotel", "garden", "partyroom"], services: ["privateRoom", "flower", "photoVideo", "dress", "beauty", "audioHost", "gift", "transport"] },
    anniversary: { meal: [50000, 120000], guide: "기념일은 식사와 사진을 함께 남길 인원을 기준으로 선택하세요.", spaces: ["restaurant", "hotel", "partyroom", "garden"], services: ["photoVideo", "flower", "cake", "beauty", "gift"] },
    other: { meal: [35000, 100000], guide: "가족모임·추모 등 행사 목적과 참석할 가족 범위를 기준으로 선택하세요.", spaces: ["restaurant", "hotel", "partyroom", "home", "garden"], services: ["flower", "photoVideo", "cake", "styling", "gift", "transport"] }
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
    button.addEventListener("click", () => {
      if (multi) {
        const selected = new Set(state.services);
        selected.has(item.value) ? selected.delete(item.value) : selected.add(item.value);
        state.services = [...selected];
        button.classList.toggle("is-selected", selected.has(item.value));
        button.setAttribute("aria-pressed", String(selected.has(item.value)));
      } else {
        const key = state.step === 3 ? "guests" : "space";
        state[key] = state.step === 3 ? Number(item.value) : item.value;
        button.parentElement.querySelectorAll("button").forEach((candidate) => {
          const active = candidate === button;
          candidate.classList.toggle("is-selected", active);
          candidate.setAttribute("aria-pressed", String(active));
        });
      }
      next.disabled = false;
      calculate();
    });
    return button;
  }

  function renderDynamicOptions() {
    const profile = profiles[state.event] || profiles.other;
    state.space = "";
    state.services = [];
    document.getElementById("calculator-space-options").replaceChildren(...profile.spaces.map((key) => optionButton(spaceOptions[key], false)));
    document.getElementById("calculator-service-options").replaceChildren(...profile.services.map((key) => optionButton(serviceOptions[key], true)));
    document.getElementById("calculator-guests-guide").textContent = profile.guide;
    document.getElementById("calculator-space-guide").textContent = state.event === "meeting"
      ? "상견례의 독립 공간과 소규모 예식의 우천 대안·식사 동선을 필요한 만큼 확인하세요."
      : state.event === "parents" ? "어르신 동선, 주차, 독립 공간을 함께 확인하세요." : "행사 방식에 가장 가까운 공간을 선택하세요.";
  }

  function showStep() {
    steps.forEach((section) => { section.hidden = Number(section.dataset.step) !== state.step; });
    document.getElementById("calculator-step-label").textContent = `${state.step} / 5`;
    document.getElementById("calculator-progress-bar").style.width = `${state.step * 20}%`;
    prev.hidden = state.step === 1;
    next.textContent = state.step === 5 ? "계산 완료" : "다음";
    next.disabled = state.step === 1 ? !state.event : state.step === 2 ? !state.region : state.step === 3 ? !state.guests : state.step === 4 ? !state.space : false;
  }

  function format(value) { return `${Math.round(value / 10000).toLocaleString("ko-KR")}만 원`; }

  function clearResult() {
    document.getElementById("calculator-min").textContent = "선택 전";
    document.getElementById("calculator-typical").textContent = "선택 전";
    document.getElementById("calculator-high").textContent = "선택 전";
    document.getElementById("calculator-total").textContent = "조건 선택 전";
    document.getElementById("calculator-result-note").textContent = "행사와 인원을 선택하면 참고 범위를 표시합니다.";
    document.getElementById("calculator-data-basis").textContent = "손품해방의 준비 계획용 가정이며, 확인된 시세·전국 표본·실제 견적이 아닙니다.";
    document.getElementById("calculator-breakdown").replaceChildren();
    document.getElementById("calculator-filter-note").textContent = "";
    resultLinks.hidden = true;
  }

  function calculate() {
    if (!state.event || !state.guests) {
      clearResult();
      return null;
    }
    const profile = profiles[state.event] || profiles.other;
    const guests = state.guests;
    let min = profile.meal[0] * guests;
    let high = profile.meal[1] * guests;
    const items = [["식사", profile.meal[0] * guests, profile.meal[1] * guests]];
    if (state.space && spaceRanges[state.space]) {
      min += spaceRanges[state.space][0]; high += spaceRanges[state.space][1];
      items.push(["장소", ...spaceRanges[state.space]]);
    }
    state.services.forEach((service) => {
      min += serviceRanges[service][0]; high += serviceRanges[service][1];
      items.push([serviceOptions[service].title, ...serviceRanges[service]]);
    });
    const typical = Math.round((min + (high - min) * 0.55) / 10000) * 10000;
    document.getElementById("calculator-min").textContent = format(min);
    document.getElementById("calculator-typical").textContent = format(typical);
    document.getElementById("calculator-high").textContent = format(high);
    document.getElementById("calculator-total").textContent = `약 ${format(min)}~${format(high)}`;
    document.getElementById("calculator-result-note").textContent = `${state.region ? `${state.region} · ` : ""}입력 ${guests}명 기준으로 선택한 항목을 합산했습니다.`;
    document.getElementById("calculator-data-basis").textContent = "손품해방의 준비 계획용 가정이며, 산정 기준과 검토일이 확정된 시세·전국 표본·실제 견적이 아닙니다.";
    document.getElementById("calculator-breakdown").replaceChildren(...items.map(([name, low, upper]) => {
      const row = document.createElement("div");
      const label = document.createElement("span"); label.textContent = name;
      const value = document.createElement("strong"); value.textContent = `${format(low)}~${format(upper)}`;
      row.append(label, value); return row;
    }));
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
    resultLinks.hidden = false;
    window.TaranSearchContext?.save?.(searchContext);
    return { min, typical, high, guestsFilter, budgetFilter };
  }

  document.querySelectorAll('[data-step="1"] [data-single-options] button').forEach((button) => button.addEventListener("click", () => {
    state.event = window.SonpumEventTypes?.normalize?.(button.dataset.value) || button.dataset.value;
    button.parentElement.querySelectorAll("button").forEach((candidate) => {
      const active = candidate === button;
      candidate.classList.toggle("is-selected", active);
      candidate.setAttribute("aria-pressed", String(active));
    });
    next.disabled = false;
    renderDynamicOptions();
    calculate();
  }));
  document.querySelectorAll('[data-step="3"] [data-single-options] button').forEach((button) => button.addEventListener("click", () => {
    state.guests = Number(button.dataset.value) || 0;
    button.parentElement.querySelectorAll("button").forEach((candidate) => {
      const active = candidate === button;
      candidate.classList.toggle("is-selected", active);
      candidate.setAttribute("aria-pressed", String(active));
    });
    next.disabled = !state.guests;
    calculate();
  }));
  next.addEventListener("click", () => {
    if (state.step < 5) { state.step += 1; showStep(); return; }
    calculate();
    window.TaranAnalytics?.track("calculator_completed", "calculator.html", { eventType: state.event, guests: state.guests, services: state.services }).catch(() => {});
    document.getElementById("calculator-result");
    document.querySelector(".calculator-result")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
  });
  prev.addEventListener("click", () => { state.step = Math.max(1, state.step - 1); showStep(); });
  document.getElementById("calculator-region").addEventListener("change", (event) => { state.region = event.target.value; next.disabled = !state.region; calculate(); });
  document.getElementById("calculator-district").addEventListener("change", (event) => { state.district = event.target.value; calculate(); });
  document.getElementById("calculator-date").addEventListener("change", (event) => { state.date = event.target.value; calculate(); });
  document.getElementById("calculator-save").addEventListener("click", async () => {
    const result = calculate();
    if (!result) {
      window.TaranToast?.show?.("행사와 인원을 선택한 뒤 결과를 저장해 주세요.");
      return;
    }
    window.TaranStorage.set("calculator-state", JSON.stringify({ ...state, ...result }));
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
      window.TaranToast?.show?.("행사와 인원을 선택한 뒤 결과를 공유해 주세요.");
      return;
    }
    const text = `${state.region || "지역 미정"} · ${state.guests}명 · 준비 계획용 ${document.getElementById("calculator-total").textContent}`;
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
  state.guests = Number(initial.guests) || 0;
  window.SonpumRegions?.setupSelects?.(document.getElementById("calculator-region"), document.getElementById("calculator-district"), { province: state.region, district: state.district });
  document.getElementById("calculator-date").value = state.date;
  document.querySelectorAll('[data-step="1"] button').forEach((button) => {
    const active = button.dataset.value === state.event;
    button.classList.toggle("is-selected", active);
    button.setAttribute("aria-pressed", String(active));
  });
  if (state.guests) {
    const initialGuestOption = state.guests <= 10 ? 10 : state.guests <= 30 ? 30 : state.guests <= 50 ? 50 : state.guests <= 80 ? 80 : 120;
    document.querySelectorAll('[data-step="3"] button').forEach((button) => {
      const active = Number(button.dataset.value) === initialGuestOption;
      button.classList.toggle("is-selected", active);
      button.setAttribute("aria-pressed", String(active));
    });
  } else {
    document.querySelectorAll('[data-step="3"] button').forEach((button) => button.setAttribute("aria-pressed", "false"));
  }
  renderDynamicOptions();
  calculate();
  showStep();
})();
