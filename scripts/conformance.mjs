#!/usr/bin/env node
/**
 * Cross-validator conformance — run the shared manifest corpus against THIS
 * repo's real validator (scripts/validate.mjs), unmodified.
 *
 * The corpus lives in cortex-registry (conformance/manifests.json) and is
 * the shared floor enforced by three implementations: the registry's
 * validator, this template's validate.mjs, and cortex-app's server-side
 * validate_manifest. Each fixture is materialized into a temp app dir
 * (app.json + icon + src/) and validate.mjs runs against it as a child
 * process — so this tests the actual gate, not a copy of its rules.
 *
 * Corpus resolution: $CONFORMANCE_FILE (local path) → ../cortex-registry
 * sibling checkout → raw.githubusercontent.com.
 */

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const CORPUS_URL =
  "https://raw.githubusercontent.com/mocaOS/cortex-registry/main/conformance/manifests.json";

async function loadCorpus() {
  if (process.env.CONFORMANCE_FILE) {
    return JSON.parse(readFileSync(process.env.CONFORMANCE_FILE, "utf8"));
  }
  const sibling = join(root, "..", "cortex-registry", "conformance", "manifests.json");
  if (existsSync(sibling)) return JSON.parse(readFileSync(sibling, "utf8"));
  const res = await fetch(CORPUS_URL);
  if (!res.ok) throw new Error(`corpus fetch failed: ${res.status}`);
  return res.json();
}

function runValidator(manifest) {
  const dir = mkdtempSync(join(tmpdir(), "conformance-"));
  try {
    mkdirSync(join(dir, "scripts"));
    mkdirSync(join(dir, "src"));
    cpSync(join(root, "scripts", "validate.mjs"), join(dir, "scripts", "validate.mjs"));
    writeFileSync(join(dir, "app.json"), JSON.stringify(manifest, null, 2));
    writeFileSync(join(dir, manifest.icon ?? "icon.svg"), "<svg/>");
    try {
      const out = execFileSync(process.execPath, [join(dir, "scripts", "validate.mjs")], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      return { code: 0, output: out };
    } catch (err) {
      return { code: err.status ?? 1, output: `${err.stdout ?? ""}${err.stderr ?? ""}` };
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const corpus = await loadCorpus();
let failed = 0;
for (const testCase of corpus.cases) {
  const { code, output } = runValidator(testCase.manifest);
  if (testCase.valid && code !== 0) {
    failed++;
    console.error(`✗ ${testCase.name}: expected VALID, validator failed:\n${output.trim()}`);
  } else if (!testCase.valid && code === 0) {
    failed++;
    console.error(`✗ ${testCase.name}: expected INVALID, but validate.mjs passed it`);
  } else if (!testCase.valid && testCase.mention &&
             !output.toLowerCase().includes(testCase.mention.toLowerCase())) {
    failed++;
    console.error(`✗ ${testCase.name}: output does not mention "${testCase.mention}":\n${output.trim()}`);
  }
}

if (failed) {
  console.error(`\n${failed}/${corpus.cases.length} conformance case(s) FAILED`);
  process.exit(1);
}
console.log(`✓ ${corpus.cases.length} conformance cases pass (template validate.mjs)`);
