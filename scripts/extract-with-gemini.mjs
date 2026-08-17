#!/usr/bin/env node
/**
 * Runs the slip photos in samples/work-orders/ through Gemini and writes each
 * response to samples/output/<id>.json for scoring.
 *
 *   node scripts/extract-with-gemini.mjs
 *   node scripts/extract-with-gemini.mjs --model gemini-3.6-flash
 *   node scripts/extract-with-gemini.mjs --max-dimension 3000 --only uttam-2357
 *   node scripts/extract-with-gemini.mjs --list-models
 *
 * The API key is read from GEMINI_API_KEY in the environment or in .env.local
 * (gitignored). It is never written into this file.
 *
 * Free-tier quotas are per model and mostly per DAY (20 requests/day on the
 * newest Flash at time of writing). So the runner walks a chain of models: when
 * one is out of daily quota it moves to the next rather than retrying into a
 * wall. Per-minute limits are different — those it waits out, using the delay
 * the API itself reports.
 *
 * Photos come off a phone at ~5700px and ~4MB. They're downscaled with `sips`
 * (built into macOS, so no image dependency) before upload: smaller requests,
 * and it mirrors what the app would do in the browser. Raise --max-dimension if
 * handwriting accuracy looks resolution-limited.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const imageDir = join(root, "samples", "work-orders");
const outputDir = join(root, "samples", "output");
const contractPath = join(root, "src", "lib", "extraction", "contract.ts");

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

/**
 * Tried in order. Each has its own free-tier quota, so exhausting one leaves
 * the rest untouched. Newest first — they read handwriting better — with older
 * Flash models behind them as capacity rather than as a quality choice.
 */
const DEFAULT_MODEL_CHAIN = [
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-2.5-flash",
];

// ── args ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const argValue = (name, fallback) => {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};
const explicitModel = argValue("--model", null);
const MODEL_CHAIN = explicitModel ? [explicitModel] : DEFAULT_MODEL_CHAIN;
const MAX_DIMENSION = Number(argValue("--max-dimension", "2048"));
const ONLY = argValue("--only", null);
const LIST_MODELS = args.includes("--list-models");

// ── key ─────────────────────────────────────────────────────────────────────
function readApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();

  const envFile = join(root, ".env.local");
  if (existsSync(envFile)) {
    const match = readFileSync(envFile, "utf8").match(/^GEMINI_API_KEY\s*=\s*(.+)$/m);
    if (match) return match[1].trim().replace(/^["']|["']$/g, "");
  }

  console.error(
    "No API key found.\n" +
      "Add it to .env.local (gitignored) as:\n" +
      "    GEMINI_API_KEY=your-key\n" +
      "or export GEMINI_API_KEY before running."
  );
  process.exit(1);
}

const API_KEY = readApiKey();

// ── error interpretation ────────────────────────────────────────────────────
/** Pull `retryDelay: "11.3s"` out of a RetryInfo detail, in milliseconds. */
function parseRetryDelay(bodyText) {
  const match = bodyText.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/);
  return match ? Math.ceil(Number(match[1]) * 1000) : null;
}

/**
 * A per-day quota is spent until midnight — switch models. A per-minute quota
 * just needs a pause. The distinction is in the QuotaFailure violation's
 * quotaId, which names the window.
 */
function quotaWindow(bodyText) {
  if (/PerDay/i.test(bodyText)) return "day";
  if (/PerMinute/i.test(bodyText)) return "minute";
  return "unknown";
}

/** First line of the API's message, rather than a wall of JSON. */
function summariseError(bodyText) {
  try {
    const message = JSON.parse(bodyText)?.error?.message;
    if (message) return message.split("\n")[0].trim();
  } catch {
    /* fall through to the raw body */
  }
  return bodyText.slice(0, 200);
}

// ── image prep ──────────────────────────────────────────────────────────────
const preparedCache = new Map();

/** Downscale with macOS `sips`; falls back to the original if unavailable. */
function prepareImage(sourcePath) {
  if (preparedCache.has(sourcePath)) return preparedCache.get(sourcePath);

  const scratch = join(tmpdir(), "slip-extract");
  mkdirSync(scratch, { recursive: true });
  const outPath = join(
    scratch,
    `${basename(sourcePath, extname(sourcePath))}-${MAX_DIMENSION}.jpg`
  );

  let result = outPath;
  try {
    execFileSync("sips", ["-Z", String(MAX_DIMENSION), sourcePath, "--out", outPath], {
      stdio: "ignore",
    });
  } catch {
    console.warn(`  (sips unavailable — sending ${basename(sourcePath)} at full size)`);
    result = sourcePath;
  }

  preparedCache.set(sourcePath, result);
  return result;
}

// ── request ─────────────────────────────────────────────────────────────────
/**
 * The contract is a TypeScript module (see the note in contract.ts on why it is
 * not JSON), so compile it to a temporary ESM file and import that. esbuild
 * already ships with Vite, so this needs no extra dependency.
 */
async function loadContract() {
  const compiled = join(tmpdir(), `slip-contract-${process.pid}.mjs`);
  execFileSync(
    "npx",
    ["esbuild", contractPath, "--format=esm", `--outfile=${compiled}`, "--log-level=error"],
    { cwd: root, stdio: "inherit" }
  );
  return import(`file://${compiled}`);
}

const contract = await loadContract();

async function callGemini(model, imagePath) {
  const prepared = prepareImage(imagePath);
  const base64 = readFileSync(prepared).toString("base64");

  const response = await fetch(`${API_BASE}/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-goog-api-key": API_KEY },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64 } },
            { text: contract.EXTRACTION_PROMPT },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: contract.EXTRACTION_SCHEMA_GEMINI,
      },
    }),
  });

  const bodyText = await response.text();

  if (!response.ok) {
    const error = new Error(summariseError(bodyText));
    error.status = response.status;
    error.retryAfterMs = parseRetryDelay(bodyText);
    error.quotaWindow = response.status === 429 ? quotaWindow(bodyText) : null;
    throw error;
  }

  const envelope = JSON.parse(bodyText);
  const text = envelope?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    const reason = envelope?.candidates?.[0]?.finishReason ?? "unknown";
    const error = new Error(`no text in response (finishReason: ${reason})`);
    error.status = 200;
    throw error;
  }

  return {
    extracted: JSON.parse(text),
    usage: envelope.usageMetadata ?? null,
    sizeKb: Math.round(base64.length / 1365),
  };
}

/** Transient server-side conditions worth retrying on the same model. */
const TRANSIENT = new Set([500, 502, 503, 504]);
const MAX_ATTEMPTS = 4;

/**
 * @returns the result, or throws with `.exhaustsModel = true` when this model's
 *          daily quota is spent and the caller should move down the chain.
 */
async function extractWithModel(model, imagePath, log) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await callGemini(model, imagePath);
    } catch (error) {
      const isLastAttempt = attempt === MAX_ATTEMPTS;

      if (error.status === 429) {
        if (error.quotaWindow === "day") {
          error.exhaustsModel = true;
          throw error;
        }
        // Per-minute or unclear: wait out the window the API reported.
        if (isLastAttempt) {
          error.exhaustsModel = true;
          throw error;
        }
        const waitMs = Math.max(error.retryAfterMs ?? 0, 5000 * attempt);
        log(`[rate limited, waiting ${Math.round(waitMs / 1000)}s]`);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }

      if (TRANSIENT.has(error.status) && !isLastAttempt) {
        const waitMs = Math.max(error.retryAfterMs ?? 0, 2000 * 2 ** (attempt - 1));
        log(`[${error.status}, retrying in ${Math.round(waitMs / 1000)}s]`);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }

      throw error;
    }
  }
}

// ── model listing ───────────────────────────────────────────────────────────
if (LIST_MODELS) {
  const response = await fetch(`${API_BASE}/models?pageSize=200`, {
    headers: { "X-goog-api-key": API_KEY },
  });
  const models = (await response.json()).models ?? [];
  models
    .filter((m) => (m.supportedGenerationMethods ?? []).includes("generateContent"))
    .forEach((m) => console.log(m.name.replace("models/", "")));
  process.exit(0);
}

// ── run ─────────────────────────────────────────────────────────────────────
mkdirSync(outputDir, { recursive: true });

const images = readdirSync(imageDir)
  .filter((f) => /\.(jpe?g|png)$/i.test(f))
  .filter((f) => !ONLY || basename(f, extname(f)) === ONLY)
  .sort();

if (images.length === 0) {
  console.error(`No images in ${imageDir}${ONLY ? ` matching "${ONLY}"` : ""}`);
  process.exit(1);
}

console.log(
  `\nModels: ${MODEL_CHAIN.join(" → ")}` +
    `\nImages downscaled to ${MAX_DIMENSION}px long edge\n`
);

const exhausted = new Set();
let succeeded = 0;
const failures = [];

for (const file of images) {
  const id = basename(file, extname(file));
  process.stdout.write(`${id.padEnd(22)} `);

  let done = false;
  let lastError = null;

  for (const model of MODEL_CHAIN) {
    if (exhausted.has(model)) continue;

    try {
      const { extracted, usage, sizeKb } = await extractWithModel(
        model,
        join(imageDir, file),
        (msg) => process.stdout.write(`${msg} `)
      );

      writeFileSync(
        join(outputDir, `${id}.json`),
        JSON.stringify(
          { ...extracted, _meta: { model, maxDimension: MAX_DIMENSION, usage } },
          null,
          2
        )
      );

      const tokens = usage?.totalTokenCount ? `${usage.totalTokenCount} tok` : "";
      console.log(
        `ok  ${String(extracted.items?.length ?? 0).padStart(2)} items  ${sizeKb}KB  ${tokens}  via ${model}`
      );
      succeeded += 1;
      done = true;
      break;
    } catch (error) {
      lastError = error;
      if (error.exhaustsModel) {
        exhausted.add(model);
        process.stdout.write(`[${model} out of quota] `);
        continue;
      }
      break; // a real error, not a capacity problem — don't burn other models
    }
  }

  if (!done) {
    console.log("FAILED");
    console.log(`     ${lastError?.message ?? "unknown error"}`);
    failures.push(id);
  }

  // Stay under the per-minute request cap (5 RPM on the free tier).
  if (file !== images[images.length - 1]) {
    await new Promise((r) => setTimeout(r, 13000));
  }
}

console.log(`\nWrote ${succeeded}/${images.length} to samples/output/`);

if (exhausted.size) {
  console.log(`Out of daily quota: ${[...exhausted].join(", ")}`);
}
if (failures.length) {
  console.log(
    `Failed: ${failures.join(", ")}\n` +
      `If every model is out of quota, the free tier resets daily — or pass\n` +
      `--model with one not yet used today (--list-models shows what's available).`
  );
}
console.log(`Next: node scripts/score-extraction.mjs\n`);

process.exit(failures.length > 0 ? 1 : 0);
