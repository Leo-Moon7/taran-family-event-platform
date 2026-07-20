(function () {
  "use strict";

  const scope = window.SonpumServiceScope || {};
  window.SonpumDisplayDefaults = Object.freeze({
    province: scope.defaultProvince || "서울특별시",
    event: scope.defaultEvent || "kids",
    heroCollection: scope.defaultHeroCollection || "seoul-kids",
    guests: scope.defaultGuests || "",
    sort: "recommended"
  });
})();
