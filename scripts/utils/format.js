(function () {
  "use strict";
  const number = value => Number(value || 0).toLocaleString("ko-KR");
  const currency = value => Number(value) > 0 ? `${number(value)}원` : "가격 문의";
  const date = value => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "-" : new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(parsed);
  };
  window.TaranFormat = Object.freeze({ number, currency, date });
})();
