// Test-only: Leaflet is not installed here, so the map throws and the app
// must fall back to the offline shelter list (that fallback is what we test).
const fail = () => { throw new Error("leaflet not available in test harness"); };
export const map = fail, tileLayer = fail, layerGroup = fail, circleMarker = fail;
