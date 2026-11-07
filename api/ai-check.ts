// Vercel Node.js function: POST /api/ai-check. The Anthropic key stays server-side.
export const config = { runtime: "nodejs" };

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const SYSTEM_PROMPT = `You help Miami residents check if hurricane news, messages and photos may be fake. You cannot be certain. Look for red flags: AI watermarks (e.g. Sora), garbled text on signs, objects blending together, impossible scenes (sharks in streets or pools), scam requests (money, gift cards, personal data), urgency to share, and claims that contradict the official alerts provided. Answer ONLY with JSON: { "verdict": "likely_fake" | "uncertain" | "no_red_flags", "redFlags": string[], "explanation": string } written in the user's language, in plain simple words, max 4 short sentences. Never say something is definitely real.`;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_TEXT_LENGTH = 2000;

interface ApiRequest {
  method?: string;
  body?: unknown;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  setHeader: (name: string, value: string) => void;
  json: (body: unknown) => void;
}

interface ClientBody {
  text?: unknown;
  language?: unknown;
  alerts?: unknown;
  storms?: unknown;
  image?: { media_type?: unknown; data?: unknown } | null;
}

const json = (res: ApiResponse, status: number, body: unknown) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(status).json(body);
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fallbackOpinion() {
  return {
    verdict: "uncertain" as const,
    redFlags: [],
    explanation: "",
  };
}

function parseOpinion(content: unknown) {
  if (!Array.isArray(content)) return fallbackOpinion();
  const text = content.find((block) => isRecord(block) && block.type === "text");
  if (!isRecord(text) || typeof text.text !== "string") return fallbackOpinion();
  try {
    const parsed: unknown = JSON.parse(text.text);
    if (!isRecord(parsed)) return fallbackOpinion();
    const verdict = parsed.verdict;
    if (verdict !== "likely_fake" && verdict !== "uncertain" && verdict !== "no_red_flags") return fallbackOpinion();
    return {
      verdict,
      redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags.filter((flag): flag is string => typeof flag === "string").slice(0, 10) : [],
      explanation: typeof parsed.explanation === "string" ? parsed.explanation.slice(0, 1500) : fallbackOpinion().explanation,
    };
  } catch {
    return fallbackOpinion();
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Method not allowed" });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json(res, 503, { error: "AI not configured" });

  const body: ClientBody = isRecord(req.body) ? req.body : {};
  if (typeof body.text !== "string" || body.text.length > MAX_TEXT_LENGTH) {
    return json(res, 400, { error: `Text is required and must be at most ${MAX_TEXT_LENGTH} characters` });
  }
  if (body.language !== undefined && (typeof body.language !== "string" || body.language.length > 80)) {
    return json(res, 400, { error: "Invalid language" });
  }
  if (body.image !== undefined && body.image !== null) {
    if (!isRecord(body.image) || typeof body.image.media_type !== "string" || typeof body.image.data !== "string") {
      return json(res, 400, { error: "Invalid image" });
    }
    if (!/^image\/(jpeg|png|gif|webp)$/.test(body.image.media_type)) {
      return json(res, 400, { error: "Unsupported image type" });
    }
    const base64 = body.image.data;
    const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
    const imageBytes = Math.floor(base64.length * 3 / 4) - padding;
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64) || imageBytes > MAX_IMAGE_BYTES) {
      return json(res, 413, { error: "Image must be at most 4 MB" });
    }
  }

  const content: Record<string, unknown>[] = [];
  if (body.image && isRecord(body.image)) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: body.image.media_type, data: body.image.data },
    });
  }
  content.push({
    type: "text",
    text: [
      `User language: ${typeof body.language === "string" ? body.language : "en"}`,
      `Message text:\n${body.text}`,
      `Official alerts summary:\n${typeof body.alerts === "string" ? body.alerts.slice(0, 6000) : "No alert summary provided."}`,
      `Active storms summary:\n${typeof body.storms === "string" ? body.storms.slice(0, 3000) : "No storm summary provided."}`,
    ].join("\n\n"),
  });

  try {
    const upstream = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-5-5",
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content }],
      }),
    });
    if (!upstream.ok) return json(res, 502, { error: "AI service unavailable" });
    const response: unknown = await upstream.json();
    return json(res, 200, parseOpinion(isRecord(response) ? response.content : undefined));
  } catch {
    return json(res, 502, { error: "AI service unavailable" });
  }
}
