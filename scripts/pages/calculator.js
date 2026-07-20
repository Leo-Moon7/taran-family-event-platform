(function () {
  "use strict";

  const state = { step: 1, event: "", region: "", district: "", date: "", guests: 0, space: "", services: [] };
  const profiles = {
    kids: { meal: [55000, 90000], guide: "돌잔치는 10~50명 구간에서 장소 선택 폭이 넓습니다.", spaces: ["restaurant", "hotel", "partyroom", "home"], services: ["dolTable", "photo", "childOutfit", "parentOutfit", "gift", "growthVideo", "host"] },
    parents: { meal: [50000, 110000], guide: "어르신 이동 동선과 주차를 고려해 참석 범위를 정해보세요.", spaces: ["restaurant", "hotel", "partyroom", "home"], services: ["ceremonyTable", "banner", "photoVideo", "cake", "gift", "transport", "performance"] },
    meeting: { meal: [60000, 140000], guide: "상견례는 6~12명 규모의 독립된 룸을 많이 찾습니다.", spaces: ["restaurant", "hotel"], services: ["privateRoom", "gift", "flower", "clothing", "transport"] },
    smallWedding: { meal: [70000, 160000], guide: "스몰웨딩은 30~80명 구간을 많이 비교합니다.", spaces: ["hotel", "garden", "partyroom", "restaurant"], services: ["flower", "photoVideo", "dress", "beauty", "audioHost", "gift"] },
    familyGathering: { meal: [35000, 85000], guide: "가족모임은 좌석과 식사 준비가 편한 인원으로 잡아보세요.", spaces: ["restaurant", "partyroom", "home", "garden"], services: ["cake", "photo", "styling", "gift", "transport"] },
    anniversary: { meal: [50000, 120000], guide: "기념일은 식사와 사진을 함께 남길 인원을 기준으로 선택하세요.", spaces: ["restaurant", "hotel", "partyroom", "garden"], services: ["photoVideo", "flower", "cake", "beauty", "gift"] },
    memorial: { meal: [35000, 80000], guide: "추모모임은 참석 인원과 조용한 독립 공간을 먼저 고려하세요.", spaces: ["restaurant", "hotel", "home"], services: ["flower", "transport", "gift"] },
    other: { meal: [40000, 100000], guide: "초대하려는 가족과 지인 범위를 기준으로 선택하세요.", spaces: ["restaurant", "hotel", "partyroom", "home", "garden"], services: ["photoVideo", "beauty", "styling", "gift", "transport"] }
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
    document.getElementById("calculator-space-guide").textContent = state.event === "smallWedding"
      ? "야외 진행은 우천 대안과 식사 동선을 함께 확인하세요."
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

  function calculate() {
    if (!state.event) return null;
    const profile = profiles[state.event] || profiles.other;
    const guests = state.guests || 20;
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
    document.getElementById("calculator-total").textContent = `${format(min)} ~ ${format(high)}`;
    document.getElementById("calculator-result-note").textContent = `${state.region ? `${state.region} · ` : ""}${guests}명 기준으로 선택한 항목을 합산했습니다.`;
    const basisMonth = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit" }).format(new Date());
    document.getElementById("calculator-data-basis").textContent = `${basisMonth} 기준 · 선택 지역의 확정 표본이 부족한 항목은 전국 참고 범위를 사용했습니다.`;
    document.getElementById("calculator-breakdown").replaceChildren(...items.map(([name, low, upper]) => {
      const row = document.createElement("div");
      const label = document.createElement("span"); label.textContent = name;
      const value = document.createElement("strong"); value.textContent = `${format(low)}~${format(upper)}`;
      row.append(label, value); return row;
    }));
    const context = { event: state.event, province: state.region, district: state.district, guests, budgetMin: min, budgetMax: high, date: state.date, source: "calculator" };
    const query = window.TaranSearchContext?.toParams?.(context) || new URLSearchParams(Object.entries(context).filter(([, value]) => value).map(([key, value]) => [key, String(value)]));
    document.getElementById("calculator-venues-link").href = `venues.html?${query}`;
    document.getElementById("calculator-checklist-link").href = `checklist.html?${query}`;
    window.TaranSearchContext?.save?.(context);
    return { min, typical, high };
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
    await window.TaranAuth?.ready;
    if (!window.TaranAuth?.getAccount?.()) {
      location.href = window.TaranAuth?.loginUrl?.(`calculator.html${location.search}`) || "login.html?return=calculator.html";
      return;
    }
    const result = calculate();
    window.TaranStorage.set("calculator-state", JSON.stringify({ ...state, ...result }));
    try { await window.TaranAuth.api("/api/member/state/calculator", { method: "PUT", body: JSON.stringify({ state: { ...state, ...result } }) }); }
    catch (_error) { window.TaranToast?.show?.("브라우저에는 저장했지만 온라인 계정 저장은 잠시 후 다시 시도해 주세요."); return; }
    window.TaranToast?.show?.("계산 결과를 계정에서 이어볼 수 있도록 저장했습니다.");
  });
  document.getElementById("calculator-share").addEventListener("click", async () => {
    calculate();
    const text = `${state.region || "지역 미정"} · ${state.guests || 20}명 · ${document.getElementById("calculator-total").textContent}`;
    try {
      if (navigator.share) await navigator.share({ title: "손품해방 가족행사 예상 비용", text, url: location.href });
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
  const initialButton = document.querySelector(`[data-step="1"] button[data-value="${state.event}"]`);
  if (initialButton) { initialButton.classList.add("is-selected"); initialButton.setAttribute("aria-pressed", "true"); }
  renderDynamicOptions();
  calculate();
  showStep();
})();
