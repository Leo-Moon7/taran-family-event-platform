window.taranAdminConfig = {
  ...(window.taranContentConfig || {}),
  // 운영 전환 시 Supabase Project URL과 anon public key를 넣습니다.
  // service_role key는 절대 브라우저 파일에 넣으면 안 됩니다.
  supabaseUrl: (window.taranContentConfig && window.taranContentConfig.supabaseUrl) || "",
  supabaseAnonKey: (window.taranContentConfig && window.taranContentConfig.supabaseAnonKey) || "",
  siteId: (window.taranContentConfig && window.taranContentConfig.siteId) || "taran",
  tables: {
    siteCopy: "taran_site_copy",
    providers: "taran_providers",
    articles: "taran_articles",
    revisions: "taran_content_revisions",
    adminProfiles: "taran_admin_profiles",
    ...((window.taranContentConfig && window.taranContentConfig.tables) || {})
  }
};
