#!/usr/bin/env node
/**
 * Scores a provider's extraction output against samples/ground-truth.json.
 *
 *   node scripts/score-extraction.mjs
 *
 * Expects one file per slip at samples/output/<id>.json containing exactly what
 * the provider returned. Missing files are reported, not fatal — so you can
 * score a partial run.
 *
 * The point of this script is to make the provider choice a measurement rather
 * than an argument: run it once per provider and compare the summaries.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const truthPath = join(root, "samples", "ground-truth.json");
const outputDir = join(root, "samples", "output");

if (!existsSync(truthPath)) {
  console.error(`Missing ${truthPath}`);
  process.exit(1);
}

const truth = JSON.parse(readFileSync(truthPath, "utf8"));

/** Loose text comparison — case, punctuation and spacing don't count. */
function loose(text) {
  return (text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function textMatches(expected, actual) {
  if (expected == null) return null; // no ground truth to compare against
  return loose(expected) === loose(actual);
}

/**
 * Greedy pairing of extracted items to expected items by quantity, then text.
 *
 * Text is only compared where ground truth has it. Some slips deliberately
 * carry no expected text — the wording is illegible or, as on Varalakshmi,
 * genuinely doesn't matter because it gets matched to the user's job work list
 * anyway. Scoring those against a guess would measure nothing.
 */
function scoreItems(expected, actual) {
  const remaining = [...actual];
  let quantityHits = 0;
  let textHits = 0;
  let textComparable = 0;

  for (const want of expected) {
    let index = remaining.findIndex((got) => got.quantity === want.quantity);
    if (index === -1) {
      index = remaining.findIndex(
        (got) => textMatches(want.raw_text, got.raw_text) === true
      );
    }
    if (index === -1) continue;

    const got = remaining.splice(index, 1)[0];
    if (got.quantity === want.quantity) quantityHits += 1;

    const textResult = textMatches(want.raw_text, got.raw_text);
    if (textResult !== null) {
      textComparable += 1;
      if (textResult) textHits += 1;
    }
  }

  return {
    expectedCount: expected.length,
    actualCount: actual.length,
    countMatches: expected.length === actual.length,
    quantityHits,
    textHits,
    textComparable,
    spurious: remaining.length,
  };
}

const fieldTally = { party: [0, 0], number: [0, 0], date: [0, 0], total: [0, 0] };
const itemTally = { quantityHits: 0, quantityTotal: 0, textHits: 0, textTotal: 0, countMatches: 0, countTotal: 0 };
const missing = [];

console.log("");

for (const slip of truth.slips) {
  const outPath = join(outputDir, `${slip.id}.json`);
  if (!existsSync(outPath)) {
    missing.push(slip.id);
    continue;
  }

  const got = JSON.parse(readFileSync(outPath, "utf8"));
  const rows = [];

  const checks = [
    ["party", slip.party_name, got.party_name?.value, got.party_name?.confidence],
    ["number", slip.work_order_number, got.work_order_number?.value, got.work_order_number?.confidence],
    ["date", slip.received_date, got.received_date?.value, got.received_date?.confidence],
    ["total", slip.document_total_quantity, got.document_total_quantity, null],
  ];

  for (const [field, want, actual, confidence] of checks) {
    // No ground truth for this field — report what came back, score nothing.
    if (want === null || want === undefined) {
      rows.push(
        `    SKIP  ${field.padEnd(7)} no ground truth` +
          `  got ${JSON.stringify(actual ?? null)}${confidence ? ` (${confidence})` : ""}`
      );
      continue;
    }

    const ok =
      field === "total"
        ? want === actual
        : textMatches(String(want), String(actual ?? "")) === true;
    fieldTally[field][1] += 1;
    if (ok) fieldTally[field][0] += 1;
    rows.push(
      `    ${ok ? "PASS" : "FAIL"}  ${field.padEnd(7)} expected ${JSON.stringify(want)}` +
        `  got ${JSON.stringify(actual ?? null)}${confidence ? ` (${confidence})` : ""}`
    );
  }

  console.log(`${slip.id}  [${slip.difficulty}]`);
  rows.forEach((r) => console.log(r));

  if (slip.items == null) {
    console.log("    SKIP  items    no human ground truth yet — please fill in samples/ground-truth.json");
  } else {
    const s = scoreItems(slip.items, got.items ?? []);
    itemTally.quantityHits += s.quantityHits;
    itemTally.quantityTotal += s.expectedCount;
    itemTally.textHits += s.textHits;
    itemTally.textTotal += s.textComparable;
    itemTally.countTotal += 1;
    if (s.countMatches) itemTally.countMatches += 1;

    console.log(
      `    ${s.countMatches ? "PASS" : "FAIL"}  items    ${s.actualCount} extracted vs ${s.expectedCount} expected` +
        `  |  quantities ${s.quantityHits}/${s.expectedCount}` +
        `  |  text ${s.textHits}/${s.textComparable}` +
        (s.spurious ? `  |  ${s.spurious} unmatched` : "")
    );
  }

  if (got.notes?.length) {
    got.notes.forEach((n) => console.log(`    note: ${n}`));
  }
  console.log("");
}

const pct = (hit, total) => (total === 0 ? "n/a" : `${Math.round((hit / total) * 100)}%`);

console.log("─".repeat(64));
console.log("Header fields");
for (const [field, [hit, total]] of Object.entries(fieldTally)) {
  console.log(`  ${field.padEnd(8)} ${hit}/${total}  ${pct(hit, total)}`);
}
console.log("Line items");
console.log(`  count    ${itemTally.countMatches}/${itemTally.countTotal}  ${pct(itemTally.countMatches, itemTally.countTotal)}`);
console.log(`  quantity ${itemTally.quantityHits}/${itemTally.quantityTotal}  ${pct(itemTally.quantityHits, itemTally.quantityTotal)}`);
console.log(`  text     ${itemTally.textHits}/${itemTally.textTotal}  ${pct(itemTally.textHits, itemTally.textTotal)}`);

if (missing.length) {
  console.log("");
  console.log(`No output for: ${missing.join(", ")}`);
  console.log(`Save provider responses to samples/output/<id>.json`);
}
console.log("");
