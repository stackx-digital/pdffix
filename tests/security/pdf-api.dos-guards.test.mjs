#!/usr/bin/env node
/**
 * tests/security/pdf-api.dos-guards.test.mjs
 *
 * Plain, runner-free regression test (no jest/vitest in package.json, so
 * this is a standalone executable node script, matching the style of the
 * other scripts in this directory). It imports the real
 * src/lib/pdf-api/helpers.ts via `tsx` (already present as a transitive
 * dependency / usable via `npx tsx`), so it exercises the actual guard
 * code rather than a reimplementation of it.
 *
 * Usage:
 *   npx tsx tests/security/pdf-api.dos-guards.test.mjs
 *   (plain `node` also works once Node has native strip-types support;
 *   `npx tsx` is the portable way to run it today)
 *
 * Exits with code 0 on pass, 1 on failure, and prints a PASS/FAIL per check.
 *
 * What it covers
 * ---------------
 * The public /api/v1/pdf/* routes (src/app/api/v1/pdf/**\/route.ts) accept
 * untrusted file uploads and feed them straight into pdf-lib / pdfjs-dist /
 * tesseract.js, all of which buffer the whole file and do work proportional
 * to its declared page count. Before the fix there was no cap anywhere on
 * upload size or page count, so a single authenticated request with a huge
 * file (or a PDF declaring millions of pages) could exhaust server
 * memory/CPU — a resource-exhaustion / DoS vector.
 *
 * This script exercises the real guard helpers added to
 * src/lib/pdf-api/helpers.ts:
 *   - checkFileSize / checkFilesSize: rejects oversized uploads (413)
 *     *before* the bytes are read into memory.
 *   - checkPageCount: rejects PDFs with an unreasonable page count (400)
 *     before looping over pages.
 *
 * It also statically verifies every in-scope route file actually calls one
 * of these guards, so a regression that quietly removes the check in a
 * route (while leaving the shared helper intact) is still caught.
 *
 * It does NOT need Next.js, a running server, or real PDF/image bytes —
 * the helpers only look at File.size / numeric page counts.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`PASS - ${name}`);
    passed++;
  } catch (err) {
    console.log(`FAIL - ${name}`);
    console.log(`       ${err.message}`);
    failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// --- Import the real guard functions straight from the TS source. `tsx`
// (run via `npx tsx tests/security/pdf-api.dos-guards.test.mjs`) registers
// a loader that handles the .ts import below; no reimplementation of the
// guard logic is needed, so a regression in the real code is caught here.
const helpersUrl = new URL("../../src/lib/pdf-api/helpers.ts", import.meta.url);
const { checkFileSize, checkFilesSize, checkPageCount, MAX_FILE_SIZE_BYTES, MAX_TOTAL_PAGES } =
  await import(helpersUrl);

function fakeFile(size) {
  return { size };
}

// --- checkFileSize ----------------------------------------------------
check("checkFileSize allows a normal-sized file", () => {
  const res = checkFileSize(fakeFile(1024));
  assert(res === null, "expected no error for a 1KB file");
});

check("checkFileSize rejects a file over the default cap with 413", () => {
  const res = checkFileSize(fakeFile(MAX_FILE_SIZE_BYTES + 1));
  assert(res !== null, "expected an error response for an oversized file");
  assert(res.status === 413, `expected status 413, got ${res.status}`);
});

check("checkFileSize respects a custom max", () => {
  const res = checkFileSize(fakeFile(1000), 500);
  assert(res !== null && res.status === 413, "expected 413 when exceeding custom max");
  const ok = checkFileSize(fakeFile(400), 500);
  assert(ok === null, "expected pass when under custom max");
});

// --- checkFilesSize (merge / image-to-pdf) -----------------------------
check("checkFilesSize rejects when any single file exceeds the cap", () => {
  const res = checkFilesSize([fakeFile(100), fakeFile(MAX_FILE_SIZE_BYTES + 1)]);
  assert(res !== null && res.status === 413, "expected 413 for an oversized individual file");
});

check("checkFilesSize rejects when the combined total exceeds the cap", () => {
  const half = Math.floor(MAX_FILE_SIZE_BYTES / 2) + 1024;
  const res = checkFilesSize([fakeFile(half), fakeFile(half)]);
  assert(res !== null && res.status === 413, "expected 413 when combined size exceeds the cap");
});

check("checkFilesSize allows several small files under the combined cap", () => {
  const res = checkFilesSize([fakeFile(1024), fakeFile(2048), fakeFile(4096)]);
  assert(res === null, "expected no error for small combined uploads");
});

// --- checkPageCount (split/rotate/delete-pages/extract-pages/organize/
// watermark/add-page-numbers/pdf-to-text/merge) -------------------------
check("checkPageCount allows a reasonable page count", () => {
  const res = checkPageCount(10);
  assert(res === null, "expected no error for 10 pages");
});

check("checkPageCount rejects a PDF declaring millions of pages with 400", () => {
  const res = checkPageCount(5_000_000);
  assert(res !== null, "expected an error response for an excessive page count");
  assert(res.status === 400, `expected status 400, got ${res.status}`);
});

check("checkPageCount boundary is exactly MAX_TOTAL_PAGES", () => {
  const atLimit = checkPageCount(MAX_TOTAL_PAGES);
  assert(atLimit === null, "expected pass at exactly the limit");
  const overLimit = checkPageCount(MAX_TOTAL_PAGES + 1);
  assert(overLimit !== null, "expected failure one page over the limit");
});

// --- Static check: every in-scope route actually calls a guard ---------
const routesNeedingFileSizeGuard = [
  "merge", "split", "rotate", "delete-pages", "extract-pages", "watermark",
  "add-page-numbers", "pdf-to-text", "flatten", "protect", "crop",
  "organize", "image-to-pdf", "ocr-image",
];

for (const route of routesNeedingFileSizeGuard) {
  check(`route ${route} calls a size guard before buffering the upload`, () => {
    const p = path.join(repoRoot, "src/app/api/v1/pdf", route, "route.ts");
    const src = readFileSync(p, "utf8");
    assert(
      /checkFileSize|checkFilesSize/.test(src),
      `${route}/route.ts does not reference checkFileSize/checkFilesSize`
    );
  });
}

const routesNeedingPageCountGuard = [
  "split", "rotate", "delete-pages", "extract-pages", "watermark",
  "add-page-numbers", "pdf-to-text", "organize", "merge", "image-to-pdf",
];

for (const route of routesNeedingPageCountGuard) {
  check(`route ${route} calls checkPageCount before looping over pages`, () => {
    const p = path.join(repoRoot, "src/app/api/v1/pdf", route, "route.ts");
    const src = readFileSync(p, "utf8");
    assert(/checkPageCount/.test(src), `${route}/route.ts does not reference checkPageCount`);
  });
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
