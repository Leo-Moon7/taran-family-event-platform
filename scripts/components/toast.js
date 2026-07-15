(function () {
  "use strict";

  function region() {
    let container = document.querySelector(".toast-region");
    if (container) return container;
    container = document.createElement("div");
    container.className = "toast-region";
    container.setAttribute("aria-live", "polite");
    container.setAttribute("aria-atomic", "true");
    document.body.append(container);
    return container;
  }

  function show(message, options = {}) {
    const toast = document.createElement("div");
    toast.className = `toast${options.type === "error" ? " toast--error" : ""}`;
    toast.setAttribute("role", options.type === "error" ? "alert" : "status");
    toast.textContent = String(message || "");
    region().append(toast);
    window.setTimeout(() => toast.remove(), Number(options.duration || 4000));
    return toast;
  }

  window.TaranToast = Object.freeze({ show });
})();
