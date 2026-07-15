window.taranContentConfig = window.taranContentConfig || {
  siteId: window.PlatformBrand?.siteId || "taran",
  supabaseUrl: "",
  supabaseAnonKey: "",
  tables: {
    siteCopy: "taran_site_copy",
    providers: "taran_providers",
    articles: "taran_articles",
    banners: "taran_banners",
    customers: "taran_customers",
    adminEvents: "taran_admin_events",
    revisions: "taran_content_revisions",
    adminProfiles: "taran_admin_profiles"
  }
};
