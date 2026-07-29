import assert from "node:assert/strict";
import { assessSyntaxCheckResult } from "./validate.mjs";

const normal = assessSyntaxCheckResult("scripts/normal.js", {
  status: 0,
  stdout: "",
  stderr: ""
});
assert.deepEqual(normal, {
  ok: true,
  spawnFailed: false,
  message: ""
});

const syntaxFailure = assessSyntaxCheckResult("scripts/syntax-failure.js", {
  status: 1,
  stdout: "",
  stderr: "SyntaxError: Unexpected token"
});
assert.equal(syntaxFailure.ok, false);
assert.equal(syntaxFailure.spawnFailed, false);
assert.equal(
  syntaxFailure.message,
  "JavaScript 문법 오류: scripts/syntax-failure.js\nSyntaxError: Unexpected token"
);

const eperm = new Error("spawnSync node.exe EPERM");
eperm.code = "EPERM";
const epermFailure = assessSyntaxCheckResult("scripts/eperm.js", {
  status: null,
  error: eperm,
  stdout: undefined,
  stderr: undefined
});
assert.equal(epermFailure.ok, false);
assert.equal(epermFailure.spawnFailed, true);
assert.match(epermFailure.message, /scripts\/eperm\.js/);
assert.match(epermFailure.message, /error code: EPERM/);
assert.doesNotMatch(epermFailure.message, /TypeError/);

const enoent = new Error("spawnSync missing-node ENOENT");
enoent.code = "ENOENT";
const enoentFailure = assessSyntaxCheckResult("scripts/enoent.js", {
  status: null,
  error: enoent
});
assert.equal(enoentFailure.ok, false);
assert.equal(enoentFailure.spawnFailed, true);
assert.match(enoentFailure.message, /scripts\/enoent\.js/);
assert.match(enoentFailure.message, /error code: ENOENT/);

const missingStderrFailure = assessSyntaxCheckResult("scripts/no-stderr.js", {
  status: 1,
  stdout: undefined,
  stderr: undefined
});
assert.equal(missingStderrFailure.ok, false);
assert.equal(missingStderrFailure.spawnFailed, false);
assert.match(missingStderrFailure.message, /scripts\/no-stderr\.js/);
assert.match(missingStderrFailure.message, /stderr\/stdout 없음 \(exit code: 1\)/);
assert.doesNotMatch(missingStderrFailure.message, /TypeError/);

console.log("validate harness error reporting: 5/5 PASS");
