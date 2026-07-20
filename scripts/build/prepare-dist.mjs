import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const outputRoot = join(projectRoot, "dist");
const rootFileExtensions = new Set([
  ".html",
  ".js",
  ".css",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".ico",
  ".xml",
  ".txt"
]);
const excludedRootFiles = new Set([
  "content-config.example.js",
  "_inline_index_check.js"
]);
const publicDirectories = new Set(["admin", "assets", "styles", "scripts"]);
const excludedScriptDirectories = new Set([
  "scripts/build",
  "scripts/tests"
]);

function normalizedRelative(path) {
  return relative(projectRoot, path).replaceAll("\\", "/");
}

function shouldCopyDirectory(path) {
  const value = normalizedRelative(path);
  if (excludedScriptDirectories.has(value)) return false;
  if (value.startsWith("scripts/")) return true;
  return publicDirectories.has(value.split("/")[0]);
}

async function copyDirectory(source, target) {
  await cp(source, target, {
    recursive: true,
    filter(path) {
      if (path === source) return true;
      const value = normalizedRelative(path);
      return ![...excludedScriptDirectories].some(
        (excluded) => value === excluded || value.startsWith(`${excluded}/`)
      );
    }
  });
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

for (const entry of await readdir(projectRoot, { withFileTypes: true })) {
  const source = join(projectRoot, entry.name);
  const target = join(outputRoot, entry.name);

  if (entry.isDirectory()) {
    if (shouldCopyDirectory(source)) await copyDirectory(source, target);
    continue;
  }

  if (
    rootFileExtensions.has(extname(entry.name).toLowerCase())
    && !excludedRootFiles.has(basename(entry.name))
  ) {
    await cp(source, target);
  }
}

process.env.TARAN_CONFIG_OUTPUT = "dist/content-config.js";
await import("./write-config.mjs");

console.log("SONPUM HAEBANG Netlify deployment bundle created in dist/.");
