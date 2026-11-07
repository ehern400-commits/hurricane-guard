# test-harness (not part of the app)

Used to verify the app in an environment without npm access:
- `shims/` + `types/` — tiny stand-ins for react-router-dom, lucide-react, leaflet.
- `build.mjs` — esbuild + Tailwind compile → `out/`
- `e2e.py` — Playwright (Python) end-to-end checks against `out/` served on :4173.

With normal internet you don't need any of this: use `npm run build`, `npm run preview`, `npm test`.
