import { createClient } from "@supabase/supabase-js";
import contract from "../src/lib/extraction/contract.json";

/**
 * Reads a photographed job-work slip and returns a draft work order.
 *
 * Runs server-side for two reasons: the model API key must never reach the
 * browser, and the caller has to be an authenticated user of this app — an open
 * endpoint would let anyone spend the project's model quota.
 *
 * Provider is deliberately isolated to `callGemini` below. The prompt and
 * response schema come from `contract.json`, which the evaluation script in
 * scripts/extract-with-gemini.mjs reads from too, so measured accuracy and
 * shipped behaviour cannot drift apart.
 */

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

/**
 * Tried in order. Free-tier quota is per model and mostly per day, so when one
 * runs out the next still has capacity. Newest first — they read handwriting
 * better; the older Flash models are capacity, not a quality choice.
 */
const MODEL_CHAIN = [
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-2.5-flash",
];

/** Roughly 6MB of base64 — comfortably inside the serverless body limit. */
const MAX_BASE64_LENGTH = 8_000_000;

interface RequestLike {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface ResponseLike {
  status(code: number): ResponseLike;
  json(body: unknown): void;
}

function env(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  return undefined;
}

function headerValue(
  headers: RequestLike["headers"],
  name: string
): string | undefined {
  const raw = headers[name] ?? headers[name.toLowerCase()];
  return Array.isArray(raw) ? raw[0] : raw;
}

export default async function handler(request: RequestLike, response: ResponseLike) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = env("SUPABASE_URL", "VITE_SUPABASE_URL");
  const supabaseAnonKey = env("SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY");
  const geminiKey = env("GEMINI_API_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase environment variables are not configured.");
    return response.status(500).json({ error: "Server is not configured." });
  }
  if (!geminiKey) {
    console.error("GEMINI_API_KEY is not set.");
    return response.status(500).json({ error: "Scanning is not configured." });
  }

  // ── Authenticate ──────────────────────────────────────────────────────────
  // Verified against Supabase rather than merely decoded: a decoded JWT proves
  // nothing about whether the signature or expiry are valid.
  const authorization = headerValue(request.headers, "authorization");
  const accessToken = authorization?.replace(/^Bearer\s+/i, "").trim();

  if (!accessToken) {
    return response.status(401).json({ error: "Not signed in." });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: userData, error: authError } = await supabase.auth.getUser(accessToken);

  if (authError || !userData?.user) {
    return response.status(401).json({ error: "Your session has expired. Sign in again." });
  }

  // ── Validate the payload ──────────────────────────────────────────────────
  const body = (typeof request.body === "string" ? safeParse(request.body) : request.body) as
    | { imageBase64?: unknown; mimeType?: unknown }
    | undefined;

  const imageBase64 = typeof body?.imageBase64 === "string" ? body.imageBase64 : null;
  const mimeType = typeof body?.mimeType === "string" ? body.mimeType : "image/jpeg";

  if (!imageBase64) {
    return response.status(400).json({ error: "No image was received." });
  }
  if (imageBase64.length > MAX_BASE64_LENGTH) {
    return response.status(413).json({
      error: "That photo is too large. Try again — it should be resized automatically.",
    });
  }

  // ── Extract ───────────────────────────────────────────────────────────────
  const exhausted: string[] = [];

  for (const model of MODEL_CHAIN) {
    try {
      const extracted = await callGemini(model, geminiKey, imageBase64, mimeType);
      return response.status(200).json({ extracted, model });
    } catch (error) {
      const failure = error as GeminiError;

      if (failure.outOfDailyQuota) {
        exhausted.push(model);
        continue; // next model has its own quota
      }

      console.error(`Extraction failed on ${model}:`, failure.message);
      return response.status(502).json({
        error: "The slip could not be read just now. Please try again, or enter it manually.",
      });
    }
  }

  console.error(`All models out of quota: ${exhausted.join(", ")}`);
  return response.status(429).json({
    error:
      "Today's free scanning limit has been reached. It resets tomorrow — please enter this one manually.",
  });
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

interface GeminiError extends Error {
  outOfDailyQuota?: boolean;
}

async function callGemini(
  model: string,
  apiKey: string,
  imageBase64: string,
  mimeType: string
) {
  const result = await fetch(`${GEMINI_BASE}/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { inlineData: { mimeType, data: imageBase64 } },
            { text: contract.prompt },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: contract.gemini,
      },
    }),
  });

  const bodyText = await result.text();

  if (!result.ok) {
    const error: GeminiError = new Error(`HTTP ${result.status}: ${bodyText.slice(0, 300)}`);
    // A per-day quota is spent until midnight, so fall through to another model.
    // A per-minute one would be worth waiting on, but not inside a request the
    // user is watching — treat it as this model being unavailable too.
    error.outOfDailyQuota = result.status === 429;
    throw error;
  }

  const envelope = JSON.parse(bodyText);
  const text = envelope?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error(
      `No content returned (finishReason: ${envelope?.candidates?.[0]?.finishReason ?? "unknown"})`
    );
  }

  return JSON.parse(text);
}
