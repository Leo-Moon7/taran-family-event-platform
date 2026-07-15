window.memoaAdminConfig = {
  ...(window.memoaContentConfig || {}),
  // 운영 전환 시 Supabase Project URL과 anon public key를 넣습니다.
  // service_role key는 절대 브라우저 파일에 넣으면 안 됩니다.
  supabaseUrl: (window.memoaContentConfig && window.memoaContentConfig.supabaseUrl) || "",
  supabaseAnonKey: (window.memoaContentConfig && window.memoaContentConfig.supabaseAnonKey) || "",
  siteId: (window.memoaContentConfig && window.memoaContentConfig.siteId) || "memoa",
  tables: {
    siteCopy: "memoa_site_copy",
    providers: "memoa_providers",
    articles: "memoa_articles",
    revisions: "memoa_content_revisions",
    adminProfiles: "memoa_admin_profiles",
    ...((window.memoaContentConfig && window.memoaContentConfig.tables) || {})
  }
};
