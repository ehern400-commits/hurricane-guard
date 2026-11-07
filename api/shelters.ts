// Vercel Edge Function: GET /api/shelters
// Pass-through for Miami-Dade County's official Evacuation Center GIS layer
// (311CRM MapServer layer 78). Returns GeoJSON. No secrets here.
export const config = { runtime: "edge" };

const URL_MDC =
  "https://giswspro.miamidade.gov/arcgis/rest/services/311/311CRM/MapServer/78/query" +
  "?where=1%3D1&outFields=*&outSR=4326&f=geojson";

export default async function handler(): Promise<Response> {
  try {
    const upstream = await fetch(URL_MDC);
    if (!upstream.ok) return json({ error: `Miami-Dade GIS responded ${upstream.status}` }, 502);
    return new Response(await upstream.text(), {
      headers: {
        "Content-Type": "application/geo+json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
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
