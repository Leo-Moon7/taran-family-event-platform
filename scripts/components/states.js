(function () {
  "use strict";

  function message({ title, description, actionLabel, onAction, type = "empty" }) {
    const wrapper = document.createElement("div");
    wrapper.className = `result-state result-state--${type}`;
    const heading = document.createElement("strong");
    heading.textContent = String(title || "표시할 내용이 없습니다.");
    const copy = document.createElement("p");
    copy.textContent = String(description || "조건을 바꾸고 다시 확인해 주세요.");
    wrapper.append(heading, copy);
    if (actionLabel && typeof onAction === "function") {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "button button--secondary";
      button.textContent = actionLabel;
      button.addEventListener("click", onAction);
      wrapper.append(button);
    }
    return wrapper;
  }

  function skeletonCards(count = 6) {
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < count; index += 1) {
      const card = document.createElement("article");
      card.className = "card";
      card.setAttribute("aria-hidden", "true");
      card.innerHTML = '<div class="card__media skeleton"></div><div class="card__body"><div class="skeleton" style="height:1.5rem;width:65%"></div><div class="skeleton" style="height:1rem;width:45%"></div><div class="skeleton" style="height:1rem;width:85%"></div></div>';
      fragment.append(card);
    }
    return fragment;
  }

  window.TaranStates = Object.freeze({ message, skeletonCards });
})();
