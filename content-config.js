window.taranContentConfig = window.taranContentConfig || {
  appEnv: "production",
  siteId: window.PlatformBrand?.siteId || "taran",
  supabaseUrl: "",
  supabaseAnonKey: "",
  tables: {
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
    customers: "taran_customers",
    adminEvents: "taran_admin_events",
    revisions: "taran_content_revisions",
    adminProfiles: "taran_admin_profiles",
    providerClaims: "taran_provider_claims",
    communityPosts: "taran_community_posts",
    communityComments: "taran_community_comments"
  }
};
