import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const publicConfig = {
  appEnv: "production",
  siteId: "taran",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
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

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const outputPath = resolve(projectRoot, process.env.TARAN_CONFIG_OUTPUT || "content-config.js");

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `window.taranContentConfig = ${JSON.stringify(publicConfig, null, 2)};\n`,
  "utf8"
);
console.log(publicConfig.supabaseUrl && publicConfig.supabaseAnonKey
  ? "SONPUM HAEBANG public Supabase configuration created."
  : "SONPUM HAEBANG built without Supabase configuration; online-only features stay hidden.");
