(function () {
  "use strict";
  const text = value => String(value ?? "").trim();
  const email = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(value));
  const phone = value => !value || /^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(text(value));
  const positiveNumber = value => Number.isFinite(Number(value)) && Number(value) >= 0;
  const safeSlug = value => /^[a-z0-9가-힣]+(?:-[a-z0-9가-힣]+)*$/.test(text(value));
  window.TaranValidation = Object.freeze({ text, email, phone, positiveNumber, safeSlug });
})();
