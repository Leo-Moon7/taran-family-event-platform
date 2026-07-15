
    (() => {
      const ranges = {
        wedding: { under10: [180, 420], "10to30": [250, 580], "30to50": [420, 900], over50: [680, 1400] },
        kids: { under10: [60, 150], "10to30": [120, 260], "30to50": [220, 460], over50: [380, 780] },
        parents: { under10: [80, 180], "10to30": [150, 320], "30to50": [280, 560], over50: [450, 900] },
        home: { under10: [40, 120], "10to30": [90, 220], "30to50": [180, 420], over50: [320, 760] }
      };
      const budgetMultiplier = { under100: 0.82, "100to300": 1, "300to500": 1.16, over500: 1.32 };
      const eventLabels = {
        wedding: "결혼·커플",
        kids: "아이 행사",
        parents: "부모님 행사",
        home: "가족 모임"
      };
      const event = document.querySelector("#jp-event");
      const guests = document.querySelector("#jp-guests");
      const budget = document.querySelector("#jp-budget");
      const region = document.querySelector("#jp-region");
      const result = document.querySelector("#jp-estimate-result");
      const note = document.querySelector("#jp-estimate-note");
      const form = document.querySelector("#jp-calculator-form");
      const stepLabels = Array.from(form.querySelectorAll("[data-step]"));
      const stepTitle = document.querySelector("#memoa-step-title");
      const stepCount = document.querySelector("#memoa-step-count");
      const stepHelp = document.querySelector("#memoa-step-help");
      const prevButton = form.querySelector("[data-step-prev]");
      const nextButton = form.querySelector("[data-step-next]");
      const submitButton = form.querySelector("[data-step-submit]");
      const choiceGrid = document.createElement("div");
      choiceGrid.className = "memoa-step-choice-grid";
      form.insertBefore(choiceGrid, form.querySelector(".memoa-step-actions"));
      const stepCopy = [
        ["어떤 행사를 준비하시나요?", "행사 종류를 선택하세요."],
        ["어느 지역에서 준비하시나요?", "희망 지역을 선택하세요."],
        ["행사 날짜는 정해졌나요?", "날짜 또는 예정 월을 선택하세요."],
        ["몇 명 정도 참석하나요?", "예상 인원을 선택하세요."],
        ["생각해둔 예산이 있나요?", "예산 범위를 선택하세요."]
      ];
      const eventOptionHelp = {
        kids: "백일 · 돌잔치 · 키즈 생일파티",
        wedding: "상견례 · 스몰웨딩 · 브라이덜 샤워",
        parents: "환갑 · 칠순 · 팔순 · 퇴임식",
        home: "집들이 · 명절 · 홈파티 · 기념일"
      };
      let currentStep = 0;
      const update = () => {
        const base = ranges[event.value][guests.value];
        const multiplier = budgetMultiplier[budget.value] || 1;
        const min = Math.round(base[0] * multiplier / 10) * 10;
        const max = Math.round(base[1] * multiplier / 10) * 10;
        result.textContent = `${min}만원 ~ ${max}만원`;
        note.textContent = `${eventLabels[event.value]} 기준으로 장소, 기본 식사, 준비 항목 일부를 포함한 대략적인 범위입니다.`;
      };
      const renderStep = () => {
        stepLabels.forEach((label, index) => {
          const active = index === currentStep;
          label.hidden = !active;
          label.classList.toggle("is-active", active);
        });
        stepCount.textContent = `${currentStep + 1} / ${stepLabels.length}`;
        stepTitle.textContent = stepCopy[currentStep][0];
        stepHelp.textContent = stepCopy[currentStep][1];
        prevButton.hidden = currentStep === 0;
        nextButton.hidden = currentStep === stepLabels.length - 1;
        submitButton.hidden = currentStep !== stepLabels.length - 1;
        renderChoices();
      };
      const renderChoices = () => {
        const select = stepLabels[currentStep].querySelector("select");
        choiceGrid.innerHTML = "";
        Array.from(select.options).forEach(option => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "memoa-choice-card";
          button.classList.toggle("is-selected", option.value === select.value);
          button.dataset.value = option.value;
          const help = select.id === "jp-event" ? eventOptionHelp[option.value] : "";
          button.innerHTML = `<span>${option.textContent}</span>${help ? `<small>${help}</small>` : ""}`;
          button.addEventListener("click", () => {
            select.value = option.value;
            update();
            renderChoices();
            if (currentStep < stepLabels.length - 1) {
              window.setTimeout(() => moveStep(1), 140);
            }
          });
          choiceGrid.appendChild(button);
        });
      };
      const moveStep = direction => {
        currentStep = Math.max(0, Math.min(stepLabels.length - 1, currentStep + direction));
        renderStep();
      };
      nextButton.addEventListener("click", () => moveStep(1));
      prevButton.addEventListener("click", () => moveStep(-1));
      [event, guests, budget].forEach(input => input.addEventListener("change", update));
      stepLabels.forEach(label => {
        const select = label.querySelector("select");
        select.addEventListener("change", () => {
          update();
          renderChoices();
        });
      });
      update();
      renderStep();
      form.addEventListener("submit", e => {
        e.preventDefault();
        if (currentStep < stepLabels.length - 1) {
          moveStep(1);
          return;
        }
        const query = new URLSearchParams({ event: event.value });
        if (region.value) query.set("region", region.value);
        location.href = `venues.html?${query.toString()}`;
      });
    })();
  