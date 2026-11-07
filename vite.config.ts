import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The service worker lives in /public/sw.js (hand-written, no plugin) so the
// team can read exactly what gets cached. See README → "Offline strategy".
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: { sourcemap: false, target: "es2020" },
});
