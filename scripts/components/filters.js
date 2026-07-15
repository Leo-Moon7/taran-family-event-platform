(function () {
  "use strict";

  function createChip(label, value, onRemove) {
    const chip = document.createElement("span");
    chip.className = "filter-chip";
    chip.dataset.value = String(value || "");
    const text = document.createElement("span");
    text.textContent = String(label || "");
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", `${label} 조건 제거`);
    button.textContent = "×";
    button.addEventListener("click", () => onRemove?.(value));
    chip.append(text, button);
    return chip;
  }

  window.TaranFilters = Object.freeze({ createChip });
})();
