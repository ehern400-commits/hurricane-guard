# 🌀 Hurricane Guard

**Stay Prepared. Stay Connected. Stay Informed.**

Offline-first hurricane preparedness PWA for Miami (English, Spanish, Haitian Creole, Portuguese, French, and Simplified Chinese), built for the Sharkbyte hackathon EC-Council challenge: *tell real hurricane alerts from fake ones, explain why in plain language, and keep working when the network goes down.*

| Feature | Where | Works offline? |
|---|---|---|
| **Alert Checker**: labels a message *Verified / Suspicious / Unverified* with reasons | Storms → Alert Checker | ✅ (uses last saved official data) |
| Location-based official alerts (GPS → neighborhood picker → ZIP) | Home | ✅ saved copy |
| Active storms from the National Hurricane Center | Home, Storms | ✅ saved copy, labeled |
| Shelters (Miami-Dade official GIS list), saved places, directions | Map | ✅ list (map tiles need internet) |
| **Hurricane Ripple Effect**: packages, food, travel, utilities | Impact | ✅ saved copy |
| Preparedness checklist (custom items, progress %) | Safety → Checklist | ✅ |
| Emergency contacts (tap to call) | Safety → Contacts | ✅ |
| Family safety status + sync queue | Safety → Family | ✅ saved locally |
| Emergency guide + search across all local content | Safety → Guide | ✅ |
| Demo Mode, Simulate offline, language (six languages; location-based recommendation; manual choice is saved) | Settings | ✅ |

---

## 1. Quick start (VS Code)

**Requirements:** [Node.js 20+](https://nodejs.org) (LTS), Git, and VS Code.

```bash
git clone <your-repo-url> hurricane-guard
cd hurricane-guard
npm install
npm run dev          # → http://localhost:5173  (and your LAN IP for phones)
```

In VS Code: **File → Open Folder → hurricane-guard**, then **Terminal → New Terminal** and run the commands above. Recommended extensions: *Tailwind CSS IntelliSense*, *ESLint*, *Prettier*.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload (service worker **off** in dev on purpose) |
| `npm run typecheck` | TypeScript check |
| `npm test` | Unit tests: verifier, ripple, checklist, sync queue |
| `npm run build` | Typecheck + production build into `dist/` |
| `npm run preview` | Serve `dist/` locally, **with** the service worker (use this to test offline) |

Optional env vars: copy `.env.example` → `.env.local`. **Nothing secret goes in `VITE_*` variables**, because they end up in the browser.

---

## 2. Deploy (Vercel, about 5 minutes)

1. Push the repo to GitHub.
2. At [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
3. Framework preset: **Vite**. Build command `npm run build`, output `dist`. Click **Deploy**.
4. You get an `https://…vercel.app` URL. HTTPS is required for the PWA and GPS.

`api/storms.ts` and `api/shelters.ts` deploy automatically as Vercel Edge Functions. They pass through the official NHC and Miami-Dade feeds in case the browser blocks direct cross-origin requests. Netlify also works for the frontend, but you'd need to port those two functions.

**Install on a phone:** open the Vercel URL. On iPhone, tap **Share → Add to Home Screen**. On Android, tap **⋮ → Install app**.

**Test on a phone before deploying:** `npm run dev`, then open the "Network" URL Vite prints (same Wi-Fi). Service workers and GPS need HTTPS on phones, so test offline behavior on the Vercel URL.

---

## 3. Architecture

```
src/
  App.tsx              routes (HashRouter → every route works offline)
  main.tsx             boot: seed checklist, register service worker
  components/          Layout, BottomNav (+ desktop SideNav), ui kit, StormCard, MapView, LocationPicker, NotificationCenter
  pages/               Home, Storms, AlertChecker, MapPage, Impact, Safety, Checklist, Contacts, Family, Guide, Settings
  hooks/               AppState (global state), useTable (live IndexedDB queries)
  services/            weather (NHC + NWS), shelters (Miami-Dade GIS), location, loader (network-first + cache)
  db/                  db.ts (IndexedDB wrapper), seed.ts
  sync/                syncQueue.ts (pure logic + tests), syncRunner.ts (IndexedDB + optional server)
  offline/             connectivity.ts (real reachability check), registerSW.ts
  logic/               verifier.ts, ripple.ts, checklist.ts, format.ts  (pure, unit-tested)
  i18n/                language catalogs (TypeScript forces identical keys), I18nContext.tsx
  data/                guides, resources (official links), neighborhoods, demo.ts (SIMULATED data only)
  types/               Hurricane, WeatherAlert, EmergencyShelter, ChecklistItem, EmergencyContact,
                       FamilyStatus, DisruptionReport, SyncQueueItem, …
public/                sw.js, manifest.webmanifest, icons/, health.txt
api/                   Vercel Edge Functions (storms, shelters)
test-harness/          offline verification rig used while building (see §8); not part of the app
```

### Data flow

```
 NHC / NWS / Miami-Dade ──fetch──► services/loadWithCache ──► IndexedDB (cache:<key>, with fetchedAt)
                                          │                         │
                                          ▼                         ▼  (startup / offline)
                                   AppState (React) ◄──────────── readCache
                                          │
                       pages render + label each piece: Live · Saved copy · Simulated

 User edits ──► IndexedDB first (always) ──► syncQueue (if VITE_SYNC_URL set) ──► POST when reachable
 Service worker: caches the app shell (HTML/JS/CSS/icons) only. App data lives in IndexedDB.
```

### Key decisions

- **Hand-written IndexedDB wrapper instead of Dexie.** We only need get/put/delete/getAll, and about 80 readable lines beat another dependency in a 24-hour hackathon. Swapping in Dexie later is easy.
- **Hand-written `public/sw.js` instead of vite-plugin-pwa.** Everyone can read exactly what's cached. Navigations are network-first with an offline fallback; static assets are cache-first. On first load, the page sends the SW its list of loaded files, so one visit is enough to work offline.
- **Real connectivity detection.** `navigator.onLine` only means "an interface is up" (Wi-Fi without internet still says true). We also ping `/health.txt`, which the SW never caches, with a timeout.
- **HashRouter.** Every URL is the same cached `index.html`, so routes work offline and on any static host.
- **No backend required.** Everything essential works with zero servers. The sync queue is real, but it only sends when you set `VITE_SYNC_URL`. Until then the UI honestly says "Saved locally", never "Sent".

### Official data sources and limitations

| Source | Used for | Limitations |
|---|---|---|
| NHC `CurrentStorms.json` | Active storms, wind, pressure, motion, advisory link | Atlantic + E/C Pacific only. Empty list = no storms NHC is advising on. Category is computed from NHC wind using the Saffir-Simpson scale. |
| NWS `api.weather.gov/alerts/active?point=lat,lon` | Official alerts for your exact location, and for logistics hubs (Ripple) | U.S. only. Can lag a few minutes. |
| Miami-Dade GIS, Evacuation Centers (311CRM layer 78) | Shelter list | Lists *possible* centers. It does **not** say which are open; the county announces openings per storm. So every shelter is labeled "Listed: status NOT verified". |
| OpenStreetMap tiles (Leaflet) | Map | Online only. OSM's policy forbids bulk offline tile downloads, so the saved shelter list is the offline fallback. |
| OSM Nominatim | ZIP → coordinates | Online only, light use. Neighborhood picker works offline. |

### Alert Checker rules (`src/logic/verifier.ts`)

Each rule adds or subtracts points, and each produces a plain-language reason in EN/ES:
- **Source:** official app or account, news, forward/chain message, unknown.
- **Links:** official `.gov` domains count in favor. Link shorteners count against. Look-alike domains (e.g. `fema-relief-help.com`) are a strong red flag.
- **Scam asks:** money, gift cards, passwords or SSN (EN + ES).
- **Manipulation:** "share now", ALL CAPS, `!!!`.
- **Known hoaxes:** shark on a flooded highway; "Category 6" (doesn't exist).
- **Storm name** checked against NHC active storms, and claimed category against the official category.
- **Warning/evacuation claims** checked against NWS alerts for *your* location.
- **Data freshness:** if official data is more than 6 hours old, matching evidence counts half and the user is told.

**Verified** requires corroboration by official data. Any strong red flag makes it **Suspicious**. Anything else is **Unverified**, which is never shown as "safe".

---

## 4. Team plan (5 people)

| Person | Owns (files) | First 2 hours | Then |
|---|---|---|---|
| **Programmer 1: Design / UI** | `src/components/ui.tsx`, `Layout.tsx`, `BottomNav.tsx`, `src/index.css`, `public/icons` | Run app on phone, polish spacing/colors/icons, logo | Home + Storms visual polish, empty states, desktop layout, accessibility pass |
| **Programmer 2: Data & Maps** | `src/services/*`, `api/*`, `MapView.tsx`, `MapPage.tsx` | Deploy to Vercel, confirm `/api/storms` and `/api/shelters` return data | Map polish, shelter filters (pet-friendly), evacuation-zone lookup (future) |
| **Programmer 3: Offline & Storage** | `src/db/*`, `src/sync/*`, `src/offline/*`, `public/sw.js`, Checklist/Contacts/Family pages | Test offline on a real phone (airplane mode) | Optional Supabase sync endpoint, sync status UI, `npm test` additions |
| **Researcher: Hurricane info** | `src/data/guides.ts`, `resources.ts`, `neighborhoods.ts`, `demo.ts` (samples), `src/i18n/es.ts` wording | **Click-check every official link** in `resources.ts` and `guides.ts` | Collect 20–30 real & fake alert examples (past storms) to test the Alert Checker; review Spanish; build the pitch facts |
| **Lead: full-stack + info verifier** | `src/logic/verifier.ts`, `ripple.ts`, `AlertChecker.tsx`, `Impact.tsx`, `App.tsx` | Merge PRs, run the demo script end-to-end | Tune verifier rules with the researcher's examples, final say on every label/claim shown to users, rehearse pitch |

### GitHub workflow (avoids merge conflicts)

```bash
git checkout -b ui/home-polish        # one branch per task: <area>/<short-name>
# …work only in files you own…
git add -A && git commit -m "Home: larger quick action buttons"
git push -u origin ui/home-polish     # open a Pull Request on GitHub
```

- `main` must always build. The lead merges PRs after a quick `npm run build`.
- Pull often: `git pull origin main` before starting each task.
- **Translation files are shared:** add new keys at the *end* of your section in both `en.ts` and `es.ts`. TypeScript will fail the build if a key is missing in Spanish.
- Need to change someone else's file? Ask in the team chat first, or keep it to a tiny PR.

---

## 5. Demo script for the judges (about 3 minutes)

1. **Online:** open the app. Home shows your location, NHC storm status and NWS alerts, each marked **Live**.
2. Settings → **Demo Mode ON**. The orange banner reads "simulated data, not real alerts", and the DEMO storm, alert and disruptions appear.
3. **Impact:** a simulated package disruption, then **Check hubs now** (real NWS alerts at PortMiami, MIA, Jacksonville, Memphis, and other hubs).
4. **Checklist:** check off 3 items and add a custom one. The progress % updates.
5. **Alert Checker:** tap example #1 → **Suspicious**, with reasons in plain language. Switch to Español to show the bilingual explanations.
6. **Airplane mode ON** (or Settings → Simulate offline). Close and reopen the app: it still opens.
7. The offline banner shows the last update time. Navigate all tabs, open the guide and contacts, edit the checklist.
8. **Alert Checker offline:** paste the FEMA gift-card scam (#2) → **Suspicious**, plus a note that it checked against saved data.
9. **Airplane mode OFF:** the banner disappears, data refreshes, and your offline edits are still there.
10. Close: "Live, Saved copy and Simulated are always labeled. We never invent alerts or shelter status."

During hurricane off-season there may be no real storms, which is why Demo Mode exists. Say this to the judges up front.

---

## 6. Manual test checklist

| # | Steps | Expected |
|---|---|---|
| 1 | iPhone-size viewport (390×844), open each bottom tab | Each tab opens; active tab teal; nothing hidden behind the bar |
| 2 | Desktop width ≥1024px | Left sidebar replaces bottom bar |
| 3 | Checklist: check 3, add "Baby formula", refresh page | Progress kept after refresh |
| 4 | Add contact with phone "abc" | Rejected with an error; valid phone saves; tap ☎ opens dialer |
| 5 | `npm run build && npm run preview`, load once, DevTools → Network → Offline, reload | App loads; offline banner with last update time; data labeled "Saved copy" |
| 6 | While offline: edit checklist, record "I'm Safe" | Saved; status shows "Saved locally" |
| 7 | Go back online | Banner disappears within seconds; edits still there |
| 8 | Block `api.weather.gov` in DevTools (Request blocking) and refresh | "Information unavailable" or saved copy, never a crash |
| 9 | Fresh install, offline from the start | Messages say "connect once to download it", not "no storms" |
| 10 | Switch EN ↔ ES, reload | Language persists; nav, buttons, guides, errors translated |
| 11 | Alert Checker: samples #1–#4 | #1–#3 Suspicious; #4 Unverified/Verified depending on live alerts |
| 12 | Keyboard only (Tab/Enter) | Every control reachable, visible focus ring |

---

## 7. What's implemented vs. not

**Implemented:** everything in the feature table above. Also: PWA manifest and installable icons, service worker, IndexedDB persistence, connectivity checks, a sync queue with retry/backoff and honest states (local / pending / synced / failed), a notification center separating official, saved, demo and reminder items, Demo Mode, and EN/ES.

**Not implemented (future):**
- Push notifications. A PWA can't receive new alerts offline anyway, and the app says so.
- Authenticated family sharing (needs a backend such as Supabase: set `VITE_SYNC_URL` to an endpoint that accepts POSTed JSON).
- Offline map tiles.
- Evacuation-zone lookup.
- Bluetooth or peer-to-peer messaging. A web PWA can't do this reliably, so we don't pretend.
- Live carrier, airport and utility outage feeds. The Ripple tab links to their official pages instead, and "Confirmed" only ever appears with a source or in Demo Mode.

---

## 8. How this was verified

The build environment had **no internet access to npm**, so Vite, React Router, Lucide, Leaflet and the type packages couldn't be installed there. Verification used the tools that *were* available:

- `npm test` equivalent (`tsx --test`): **20/20 unit tests passed** (verifier, ripple, checklist, sync queue).
- TypeScript strict typecheck of all app code, with minimal stand-in type declarations for the external libraries (`test-harness/types`).
- Bundled with esbuild and Tailwind v4, then run in headless Chrome (`test-harness/e2e.py`) with mocked NHC/NWS responses: **44/44 end-to-end checks passed**. These covered mobile layout, all routes, offline reload via the service worker, checklist and contact persistence, Alert Checker labels online and offline, demo labeling, Spanish, and the desktop sidebar.

**First thing to do on your machine:** `npm install && npm run build`. That is the first run with the real Vite, React Router and Lucide versions. If anything fails, it will most likely be a version-specific type detail, quick to fix.

---

> ⚠️ Hurricane Guard does not replace official instructions. Always follow **Miami-Dade Emergency Management** and the **National Weather Service**. In an emergency, call **911**.
