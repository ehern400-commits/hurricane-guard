// Vercel Edge Function: GET /api/storms
// Pass-through for the official NHC active-storms feed. It exists because browsers
// may block direct cross-origin requests to nhc.noaa.gov (CORS). No secrets here.
export const config = { runtime: "edge" };

const NHC_URL = "https://www.nhc.noaa.gov/CurrentStorms.json";

export default async function handler(): Promise<Response> {
  try {
    const upstream = await fetch(NHC_URL, {
      headers: { "User-Agent": "HurricaneGuard/0.1 (student hackathon project)" },
    });
    if (!upstream.ok) return json({ error: `NHC responded ${upstream.status}` }, 502);
    const body = await upstream.text();
    return new Response(body, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300", // NHC updates every few hours; 5 min is safe
      },
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "fetch failed" }, 502);
  }
}

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
