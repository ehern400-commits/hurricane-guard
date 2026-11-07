import { KNOWN_FAKES, type KnownFake } from "../data/knownFakes";

const AI_SOURCE_LABELS = ["trainedAlgorithmicMedia", "compositeWithTrainedAlgorithmicMedia"];
const AI_GENERATORS = ["OpenAI", "DALL-E", "ChatGPT", "Firefly", "Gemini", "Imagen", "Sora", "Midjourney", "Stable Diffusion"];
const WATERMARKS = ["Sora", "AI generated", "AI-generated", "Made with AI", "Generado con IA", "Meta AI", "Grok"];

export interface ImageLabels {
  contentCredentials: boolean;
  aiLabel: string | null;
}

export function inspectImageLabels(bytes: Uint8Array, metadataValues: unknown[] = []): ImageLabels {
  const fileText = new TextDecoder().decode(bytes);
  const metadataText = metadataValues
    .filter((value): value is string => typeof value === "string")
    .join(" ");
  const content = `${fileText}\n${metadataText}`;
  const lower = content.toLowerCase();
  const contentCredentials = lower.includes("c2pa") || lower.includes("jumb");
  const sourceLabel = AI_SOURCE_LABELS.find((label) => lower.includes(label.toLowerCase()));
  const generator = AI_GENERATORS.find((name) => lower.includes(name.toLowerCase()));
  return {
    contentCredentials,
    aiLabel: generator ?? sourceLabel ?? null,
  };
}

export function containsAiWatermark(text: string) {
  const lower = text.toLowerCase();
  return WATERMARKS.some((watermark) => lower.includes(watermark.toLowerCase()));
}

export function cleanOcrText(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => {
      const letters = line.match(/\p{L}/gu)?.length ?? 0;
      const visible = line.replace(/\s/g, "").length;
      return letters >= 3 && visible > 0 && letters / visible >= 0.5;
    })
    .join("\n");
}

export function differenceHash(pixels: Uint8ClampedArray) {
  if (pixels.length !== 9 * 8 * 4) throw new RangeError("Expected RGBA pixels for a 9x8 image.");
  let hash = 0n;
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      const left = pixels[(y * 9 + x) * 4];
      const right = pixels[(y * 9 + x + 1) * 4];
      hash = (hash << 1n) | (left > right ? 1n : 0n);
    }
  }
  return hash.toString(16).padStart(16, "0");
}

export function hammingDistance64(left: string, right: string) {
  const parseHash = (hash: string) => {
    const normalized = hash.replace(/^0x/i, "");
    if (!/^[\da-f]{1,16}$/i.test(normalized)) throw new TypeError("Expected a 64-bit hexadecimal hash.");
    return BigInt(`0x${normalized}`);
  };
  let bits = parseHash(left) ^ parseHash(right);
  let distance = 0;
  while (bits) {
    distance += Number(bits & 1n);
    bits >>= 1n;
  }
  return distance;
}

export function findKnownFake(hash: string, entries: KnownFake[] = KNOWN_FAKES) {
  for (const entry of entries) {
    if (hammingDistance64(hash, entry.hash) <= 10) return entry;
  }
  return null;
}

export function isPhotoFar(lat: number, lon: number, userLat: number, userLon: number) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(userLat - lat);
  const dLon = radians(userLon - lon);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(lat)) * Math.cos(radians(userLat)) * Math.sin(dLon / 2) ** 2;
  const distance = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return distance > 300;
}
