import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../pages/provider-register.js", import.meta.url),
  "utf8"
);

const payloadStart = source.indexOf("function payload(data)");
const submitStart = source.indexOf('form.addEventListener("submit"');
const payloadBody = source.slice(payloadStart, submitStart);
const submitBody = source.slice(submitStart);

assert.match(
  payloadBody,
  /consent_version:\s*"provider-registration-v1"/,
  "Provider registration must attach the server-approved consent version."
);
assert.match(
  payloadBody,
  /owner_name:\s*String\(data\.get\("ownerName"\)/,
  "The existing owner name mapping must stay intact."
);
assert.match(
  payloadBody,
  /owner_email:\s*String\(data\.get\("ownerEmail"\)/,
  "The existing owner email mapping must stay intact."
);
assert.match(
  submitBody,
  /TaranApi\.rpc\("taran_submit_provider_registration"/,
  "The registration must continue through the narrow RPC."
);
assert.match(
  submitBody,
  /\.\.\.record/,
  "The versioned consent in the normalized record must be sent to the RPC."
);
assert.doesNotMatch(
  submitBody,
  /TaranApi\.(?:upsert|update|remove)\(/,
  "Registration must not write protected base tables directly."
);

console.log("Provider registration consent contract passed.");
