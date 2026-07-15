(function () {
  "use strict";

  let previousFocus = null;

  function focusableElements(modal) {
    return [...modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
  }

  function open(modal) {
    if (!modal) return;
    previousFocus = document.activeElement;
    modal.dataset.open = "true";
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    focusableElements(modal)[0]?.focus();
  }

  function close(modal) {
    if (!modal) return;
    modal.dataset.open = "false";
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    previousFocus?.focus?.();
  }

  document.addEventListener("click", event => {
    const opener = event.target.closest("[data-modal-open]");
    if (opener) open(document.querySelector(opener.dataset.modalOpen));

    const closer = event.target.closest("[data-modal-close]");
    if (closer) close(closer.closest(".modal"));

    if (event.target.matches(".modal")) close(event.target);
  });

  document.addEventListener("keydown", event => {
    const modal = document.querySelector('.modal[data-open="true"]');
    if (!modal) return;
    if (event.key === "Escape") close(modal);
    if (event.key !== "Tab") return;
    const focusable = focusableElements(modal);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.TaranModal = Object.freeze({ open, close });
})();
