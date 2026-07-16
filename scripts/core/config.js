(function () {
  "use strict";

  const source = window.taranContentConfig || window.TARAN_PUBLIC_CONFIG || {};
  const supabaseUrl = String(source.supabaseUrl || "").trim().replace(/\/$/, "");
  const supabaseAnonKey = String(source.supabaseAnonKey || "").trim();
  const appEnv = String(source.appEnv || "production").toLowerCase();

  function validHttpUrl(value) {
    try {
      const url = new URL(String(value || ""));
      return ["https:", "http:"].includes(url.protocol) ? url.href.replace(/\/$/, "") : "";
    } catch (_error) {
      return "";
    }
  }

  window.TaranConfig = Object.freeze({
    appEnv,
    siteId: source.siteId || window.PlatformBrand?.siteId || "taran",
    supabaseUrl: validHttpUrl(supabaseUrl),
    supabaseAnonKey,
    isProduction: appEnv === "production",
    isSupabaseConfigured: Boolean(validHttpUrl(supabaseUrl) && supabaseAnonKey),
    tables: Object.freeze({
      siteCopy: "taran_site_copy",
      providers: "taran_providers",
      articles: "taran_articles",
      banners: "taran_banners",
      inquiries: "taran_inquiries",
      reviews: "taran_reviews",
      contributions: "taran_contributions",
      points: "taran_point_ledger",
      rewards: "taran_rewards",
      rewardRedemptions: "taran_reward_redemptions",
      deletionRequests: "taran_account_deletion_requests",
      memberStates: "taran_member_states",
      savedProviders: "taran_saved_providers",
      adminProfiles: "taran_admin_profiles",
      adminEvents: "taran_admin_events",
      providerClaims: "taran_provider_claims",
      communityPosts: "taran_community_posts",
      communityComments: "taran_community_comments",
      ...(source.tables || {})
    })
  });
})();
