(function () {
  "use strict";

  document.querySelectorAll("[data-provider-join-cta]").forEach((link) => {
    link.addEventListener("click", () => {
      window.TaranAnalytics?.track?.("provider_join_cta_clicked", "provider-join.html", {
        action: link.dataset.providerJoinCta
      }).catch?.(() => {});
    });
  });
})();
