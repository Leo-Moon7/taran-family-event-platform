(function () {
  "use strict";

  function render(container, { page, totalPages, onChange }) {
    if (!container) return;
    container.replaceChildren();
    if (totalPages <= 1) return;

    const previous = document.createElement("button");
    previous.type = "button";
    previous.className = "button button--secondary";
    previous.textContent = "이전";
    previous.disabled = page <= 1;
    previous.addEventListener("click", () => onChange(page - 1));

    const status = document.createElement("span");
    status.textContent = `${page} / ${totalPages}`;
    status.setAttribute("aria-live", "polite");

    const next = document.createElement("button");
    next.type = "button";
    next.className = "button button--secondary";
    next.textContent = "다음";
    next.disabled = page >= totalPages;
    next.addEventListener("click", () => onChange(page + 1));

    container.append(previous, status, next);
  }

  window.TaranPagination = Object.freeze({ render });
})();
