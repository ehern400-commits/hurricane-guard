export type AiVerdict = "likely_fake" | "uncertain" | "no_red_flags";

export interface AiOpinion {
  verdict: AiVerdict;
  redFlags: string[];
  explanation: string;
}

interface AiCheckInput {
  text: string;
  language: string;
  alerts: string;
  storms: string;
  photo?: File | null;
}

function canvasJpeg(file: File) {
  return new Promise<Blob>((resolve, reject) => {
    void createImageBitmap(file).then((bitmap) => {
      try {
        const scale = 1568 / Math.max(bitmap.width, bitmap.height);
        const width = Math.max(1, Math.round(bitmap.width * Math.min(scale, 1)));
        const height = Math.max(1, Math.round(bitmap.height * Math.min(scale, 1)));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Image canvas is unavailable.");
        context.drawImage(bitmap, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Could not encode the selected photo."));
        }, "image/jpeg", 0.85);
      } catch (error) {
        reject(error);
      } finally {
        bitmap.close();
      }
    }).catch(reject);
  });
}

async function base64Jpeg(file: File) {
  const blob = await canvasJpeg(file);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export async function askAiCheck(input: AiCheckInput): Promise<AiOpinion> {
  const image = input.photo ? { media_type: "image/jpeg", data: await base64Jpeg(input.photo) } : undefined;
  const response = await fetch("/api/ai-check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: input.text.slice(0, 2000),
      language: input.language,
      alerts: input.alerts,
      storms: input.storms,
      ...(image ? { image } : {}),
    }),
  });
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof result === "object" && result !== null && "error" in result
      && typeof result.error === "string" ? result.error : "AI check failed";
    throw new Error(message);
  }
  if (typeof result !== "object" || result === null || !("verdict" in result) || !("redFlags" in result) || !("explanation" in result)) {
    throw new Error("Invalid AI response");
  }
  const opinion = result as AiOpinion;
  if (!["likely_fake", "uncertain", "no_red_flags"].includes(opinion.verdict)
    || !Array.isArray(opinion.redFlags)
    || !opinion.redFlags.every((flag) => typeof flag === "string")
    || typeof opinion.explanation !== "string") {
    throw new Error("Invalid AI response");
  }
  return opinion;
}
