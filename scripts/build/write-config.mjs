import { writeFile } from "node:fs/promises";

const publicConfig = {
  appEnv: "production",
  siteId: "taran",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ""
};

await writeFile(
  new URL("../../content-config.js", import.meta.url),
  `window.taranContentConfig = ${JSON.stringify(publicConfig, null, 2)};\n`,
  "utf8"
);
console.log(publicConfig.supabaseUrl && publicConfig.supabaseAnonKey
  ? "T'ARAN public Supabase configuration created."
  : "T'ARAN built without Supabase configuration; online-only features stay hidden.");
