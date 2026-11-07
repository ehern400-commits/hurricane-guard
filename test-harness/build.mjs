// Offline test build (no Vite available here): esbuild + Tailwind compile API.
// The team uses `npm run build` (Vite) instead; this only exists to verify the code.
import { createRequire } from "module";
import fs from "fs";
import path from "path";
const req = createRequire("/opt/npm-tools/node_modules/");
const esbuild = req("esbuild");
const { compile } = req("tailwindcss");
const root = path.resolve(import.meta.dirname, "..");
const out = path.join(import.meta.dirname, "out");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, "assets"), { recursive: true });
const shim = (f) => path.join(import.meta.dirname, "shims", f);

await esbuild.build({
  entryPoints: [path.join(root, "src/main.tsx")],
  bundle: true, splitting: true, format: "esm", outdir: path.join(out, "assets"),
  entryNames: "main-[hash]", chunkNames: "chunk-[hash]",
  jsx: "automatic", target: "es2020", minify: process.env.NOMIN ? false : true,
  nodePaths: ["/opt/npm-tools/node_modules"],
  alias: {
    "react-router-dom": shim("router.jsx"),
    "lucide-react": shim("lucide-named.js"),
    "leaflet/dist/leaflet.css": shim("empty.css"),
    leaflet: shim("leaflet.js"),
  },
  loader: { ".css": "empty" },
  define: {
    "import.meta.env.PROD": "true", "import.meta.env.DEV": "false",
    "import.meta.env.VITE_SYNC_URL": JSON.stringify(process.env.VITE_SYNC_URL ?? ""),
    "import.meta.env.VITE_DEMO_DEFAULT": '"false"',
    "process.env.NODE_ENV": '"production"',
  },
  logLevel: "warning",
});

// Tailwind: scan source for class candidates, compile index.css
const twDir = path.dirname(req.resolve("tailwindcss/package.json"));
const css = fs.readFileSync(path.join(root, "src/index.css"), "utf8");
const compiler = await compile(css, {
  base: root,
  loadStylesheet: async (id, base) => {
    const p = id === "tailwindcss" ? path.join(twDir, "index.css") : path.resolve(base, id);
    return { path: p, base: path.dirname(p), content: fs.readFileSync(p, "utf8") };
  },
});
const files = fs.readdirSync(path.join(root, "src"), { recursive: true }).filter((f) => /\.(tsx?|ts)$/.test(f));
const cands = new Set();
for (const f of files) for (const m of fs.readFileSync(path.join(root, "src", f), "utf8").matchAll(/[^\s"'`{}<>]+/g)) cands.add(m[0]);
fs.writeFileSync(path.join(out, "assets/app.css"), compiler.build([...cands]));

// public/ + index.html
fs.cpSync(path.join(root, "public"), out, { recursive: true });
const main = fs.readdirSync(path.join(out, "assets")).find((f) => /^main-.*\.js$/.test(f));
const html = fs.readFileSync(path.join(root, "index.html"), "utf8")
  .replace('<script type="module" src="/src/main.tsx"></script>', `<script type="module" src="/assets/${main}"></script>`)
  .replace("</head>", '  <link rel="stylesheet" href="/assets/app.css" />\n  </head>');
fs.writeFileSync(path.join(out, "index.html"), html);
console.log("built:", fs.readdirSync(path.join(out, "assets")).map((f) => `${f} ${(fs.statSync(path.join(out, "assets", f)).size / 1024).toFixed(0)}KB`).join(", "));
