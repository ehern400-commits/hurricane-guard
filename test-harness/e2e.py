"""End-to-end check of the built app in headless Chrome (mobile viewport).
Official APIs are mocked with TEST fixtures so the live → cached → offline path
can be exercised without internet. Run: python3 e2e.py  (server on :4173)."""
import json, sys, time
from datetime import datetime, timezone
from playwright.sync_api import sync_playwright, expect

BASE = "http://localhost:4173"
SHOTS = "/home/claude/hurricane-guard/test-harness/shots"
now = datetime.now(timezone.utc).isoformat()

NHC = {"activeStorms": [{
    "id": "al142026", "binNumber": "AT4", "name": "Testy", "classification": "HU",
    "intensity": "105", "pressure": "955", "latitudeNumeric": 23.4, "longitudeNumeric": -78.2,
    "movementDir": 300, "movementSpeed": 10, "lastUpdate": now,
    "publicAdvisory": {"url": "https://www.nhc.noaa.gov/text/MIATCPAT4.shtml"}}]}
NWS = {"features": [{"id": "urn:test:1", "properties": {
    "event": "Hurricane Warning", "headline": "TEST FIXTURE Hurricane Warning issued for Miami-Dade",
    "severity": "Extreme", "areaDesc": "Metro Miami-Dade", "sent": now, "senderName": "NWS Miami FL",
    "@id": "https://api.weather.gov/alerts/urn:test:1"}}]}

results, errors = [], []
def check(name, cond):
    results.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2,
                              is_mobile=True, has_touch=True, locale="en-US",
                              service_workers="allow")
    page = ctx.new_page()
    page.on("console", lambda m: m.type == "error" and errors.append(m.text))
    page.on("pageerror", lambda e: errors.append(str(e)))

    def fulfill(route, body, ctype="application/json"):
        route.fulfill(status=200, body=json.dumps(body), headers={"content-type": ctype, "access-control-allow-origin": "*"})
    ctx.route("**/api/storms", lambda r: fulfill(r, NHC))
    ctx.route("https://www.nhc.noaa.gov/**", lambda r: fulfill(r, NHC))
    ctx.route("https://api.weather.gov/**", lambda r: fulfill(r, NWS, "application/geo+json"))
    ctx.route("**/api/shelters", lambda r: r.fulfill(status=404, body="nope"))
    ctx.route("https://giswspro.miamidade.gov/**", lambda r: r.abort())
    ctx.route("https://tile.openstreetmap.org/**", lambda r: r.abort())

    # ---------- 1. Online first load ----------
    page.goto(BASE + "/")
    page.wait_for_selector("text=Hurricane status")
    page.wait_for_selector("text=Testy", timeout=10000)
    check("home shows parsed NHC storm (105kt → Category 3, 120 mph)", page.locator("text=Category 3").count() > 0 and page.locator("text=120 mph").count() > 0)
    check("home shows NWS alert for location", page.locator("text=TEST FIXTURE Hurricane Warning").count() > 0)
    check("live badge shown", page.locator("text=Live").count() > 0)
    nav = page.locator("nav[aria-label=Main]").last
    check("bottom nav visible with 5 tabs", nav.is_visible() and nav.locator("a").count() == 5)
    navbox = nav.bounding_box()
    check("bottom nav fixed at bottom", abs(navbox["y"] + navbox["height"] - 844) < 2)
    page.screenshot(path=f"{SHOTS}/01-home.png", full_page=False)

    # content not hidden behind nav: scroll to bottom, last element above nav
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    time.sleep(0.3)
    last = page.locator("main > div > *").last.bounding_box()
    check("last content not hidden behind nav", last["y"] + last["height"] <= navbox["y"] + 1)

    # touch targets
    small = page.evaluate("""() => [...document.querySelectorAll('nav[aria-label=Main] a')].filter(a => a.offsetParent && a.getBoundingClientRect().height < 44).length""")
    check("nav touch targets >= 44px", small == 0)

    # wait for SW to control page (needed for offline reload)
    page.evaluate("navigator.serviceWorker.ready")
    page.reload(); page.wait_for_selector("text=Hurricane status")
    check("service worker controls page", page.evaluate("!!navigator.serviceWorker.controller"))
    time.sleep(1.0)

    # ---------- 2. Navigate tabs via bottom nav ----------
    for label, heading in [("Storms", "Hurricane Tracking"), ("Map", "Emergency Map"), ("Impact", "Hurricane Ripple Effect"), ("Safety", "Safety Center"), ("Home", "Hurricane status")]:
        nav.locator(f"a:has-text('{label}')").click()
        page.wait_for_selector(f"text={heading}")
        active = nav.locator(f"a:has-text('{label}')").get_attribute("class")
        check(f"tab {label} opens and is highlighted teal", "text-teal" in active)
    nav.locator("a:has-text('Storms')").click(); page.wait_for_selector("text=Max sustained wind")
    page.screenshot(path=f"{SHOTS}/02-storms.png")
    nav.locator("a:has-text('Map')").click(); page.wait_for_selector("text=Emergency Map")
    check("map falls back gracefully when map lib unavailable", page.locator("text=Map tiles need internet").count() > 0)
    nav.locator("a:has-text('Impact')").click(); page.wait_for_selector("text=Check hubs now")
    page.click("text=Check hubs now")
    page.wait_for_selector("text=Potential Impact", timeout=10000)
    check("ripple: hub with official tropical alert → Potential Impact", page.locator("text=Potential Impact").count() >= 1)
    check("ripple: never shows 'Confirmed' without a source (non-demo)", page.locator("text=Confirmed Disruption").count() == 0)
    page.screenshot(path=f"{SHOTS}/03-impact.png")

    # ---------- 3. Checklist ----------
    page.goto(BASE + "/#/safety/checklist"); page.wait_for_selector("text=Essential Supplies")
    page.click("text=Drinking water"); page.click("text=Flashlights"); page.click("text=Batteries")
    page.fill("input[aria-label*='Essential Supplies']", "Baby formula")
    page.press("input[aria-label*='Essential Supplies']", "Enter")
    page.wait_for_selector("text=Baby formula")
    check("checklist progress 3/19 = 16%", "16%" in page.inner_text("[data-testid=cl-pct]"))
    page.fill("input[aria-label*='Home Preparation']", "   "); page.press("input[aria-label*='Home Preparation']", "Enter")
    check("empty custom item rejected", page.locator("text=Please enter something.").count() > 0)
    page.screenshot(path=f"{SHOTS}/04-checklist.png")

    # ---------- 4. Contacts ----------
    page.goto(BASE + "/#/safety/contacts"); page.click("text=Add contact")
    page.fill("input[autocomplete=name]", "Mamá")
    page.fill("input[type=tel]", "abc")
    page.click("button:has-text('Save')")
    check("invalid phone rejected", page.locator("text=Enter a valid phone number.").count() > 0)
    page.fill("input[type=tel]", "(305) 555-0100")
    page.click("button:has-text('Save')")
    page.wait_for_selector("text=Mamá")
    check("contact saved with call link", page.locator("a[href='tel:3055550100']").count() == 1)

    # ---------- 5. Alert checker ----------
    page.goto(BASE + "/#/storms/check"); page.wait_for_selector("text=Alert Checker")
    page.locator("button:has-text('#1')").click()
    check("sample #1 (Cat 6 forward) → Suspicious", page.inner_text("[data-testid=verdict]") == "Suspicious")
    page.screenshot(path=f"{SHOTS}/05-checker-suspicious.png", full_page=True)
    page.fill("#msg", "NWS Miami: Hurricane Warning in effect for Miami-Dade. Hurricane Testy. weather.gov/mfl")
    page.select_option("#src", "official-app"); page.click("text=Check message")
    check("official text matching live alert → Verified", page.inner_text("[data-testid=verdict]") == "Verified")
    page.fill("#msg", "Hurricane Milton will hit Brickell tonight, evacuate now"); page.select_option("#src", "unknown"); page.click("text=Check message")
    check("non-active storm name → Suspicious", page.inner_text("[data-testid=verdict]") == "Suspicious")

    # ---------- 6. Family status ----------
    page.goto(BASE + "/#/safety/family"); page.click("text=I'm Safe")
    page.wait_for_selector("text=Saved locally")
    check("family status saved locally (no server) and labeled honestly", page.locator("text=Saved locally").count() >= 1)

    # ---------- 7. OFFLINE ----------
    ctx.set_offline(True)
    page.goto(BASE + "/")  # full reload with no network → must come from SW cache
    page.wait_for_selector("text=Hurricane status", timeout=10000)
    page.wait_for_selector("text=Offline Mode: Showing saved information.", timeout=10000)
    check("app opens offline (service worker shell)", True)
    check("offline: cached storm still shown", page.locator("text=Testy").count() > 0)
    check("offline: data labeled 'Saved copy' + stale warning", page.locator("text=Saved copy").count() > 0 and page.locator("text=Conditions may have changed").count() > 0)
    check("offline: last successful update time shown", page.locator("text=Last successful update").count() > 0)
    page.screenshot(path=f"{SHOTS}/06-offline-home.png")
    nav = page.locator("nav[aria-label=Main]").last
    for label in ["Storms", "Map", "Impact", "Safety"]:
        nav.locator(f"a:has-text('{label}')").click(); time.sleep(0.2)
    check("offline: navigation works", "Safety Center" in page.inner_text("main"))
    page.goto(BASE + "/#/safety/checklist"); page.wait_for_selector("text=Baby formula")
    check("offline: checklist persisted after reload", "16%" in page.inner_text("[data-testid=cl-pct]"))
    page.click("text=Nonperishable food")
    page.wait_for_function("document.querySelector('[data-testid=cl-pct]').innerText.includes('21%')", timeout=5000)
    check("offline: checklist editable (4/19 = 21%)", "21%" in page.inner_text("[data-testid=cl-pct]"))
    page.goto(BASE + "/#/safety/contacts"); page.wait_for_selector("text=Mamá")
    check("offline: contacts available", True)
    page.goto(BASE + "/#/safety/guide"); page.wait_for_selector("text=Get prepared")
    page.fill("input[type=search]", "generator")
    page.wait_for_selector("text=Power outages")
    check("offline: guide search works", True)
    page.goto(BASE + "/#/storms/check"); page.locator("button:has-text('#2')").click()
    check("offline: alert checker still works (FEMA gift-card scam → Suspicious)", page.inner_text("[data-testid=verdict]") == "Suspicious")
    check("offline: checker says it used saved data", page.locator("text=You're offline").count() > 0)
    page.screenshot(path=f"{SHOTS}/07-offline-checker.png", full_page=True)
    page.goto(BASE + "/#/map"); page.wait_for_selector("text=Emergency Map")
    check("offline: map shows offline fallback text", page.locator("text=Map tiles need internet").count() > 0)

    # ---------- 8. Reconnect ----------
    ctx.set_offline(False)
    page.evaluate("window.dispatchEvent(new Event('online'))")
    page.wait_for_selector("text=Offline Mode", state="detached", timeout=10000)
    page.goto(BASE + "/#/safety/checklist"); page.wait_for_selector("text=Baby formula")
    check("reconnect: offline edits preserved", "21%" in page.inner_text("[data-testid=cl-pct]"))

    # ---------- 9. Demo mode + Spanish ----------
    page.goto(BASE + "/#/settings"); page.wait_for_selector("text=Demo Mode")
    page.locator("label:has-text('Demo Mode')").click()
    page.wait_for_selector("text=DEMO MODE")
    page.goto(BASE + "/#/"); page.wait_for_selector("text=DEMO Atlas")
    check("demo mode: simulated storm clearly labeled", page.locator("text=Simulated").count() > 0)
    page.screenshot(path=f"{SHOTS}/08-demo-home.png")
    page.goto(BASE + "/#/impact"); page.wait_for_selector("text=DEMO: Package sorting delays")
    check("demo ripple reports tagged DEMO", page.locator("text=DEMO: Package sorting delays").count() == 1)
    page.click("button[aria-label^='Language']")
    page.wait_for_selector("text=Efecto Dominó del Huracán")
    check("Spanish: page translated", page.locator("text=Paquetes").count() > 0)
    check("Spanish: nav translated", page.locator("nav[aria-label=Main] >> text=Inicio").count() > 0)
    page.screenshot(path=f"{SHOTS}/09-impact-es-demo.png")
    page.reload(); page.wait_for_selector("text=Efecto Dominó del Huracán")
    check("language persisted after reload", True)
    page.goto(BASE + "/#/settings"); page.locator("label:has-text('Modo demo')").click()
    page.click("text=English")

    # ---------- 10. Desktop ----------
    dpage = browser.new_context(viewport={"width": 1280, "height": 800}).new_page()
    dpage.goto(BASE + "/"); dpage.wait_for_selector("text=Hurricane status")
    check("desktop: sidebar visible, bottom nav hidden",
          dpage.locator("nav[aria-label=Main]").first.is_visible() and not dpage.locator("nav[aria-label=Main]").last.is_visible())
    dpage.screenshot(path=f"{SHOTS}/10-desktop.png")
    browser.close()

relevant = [e for e in errors if "ERR_INTERNET_DISCONNECTED" not in e and "Failed to load resource" not in e and "net::" not in e and "leaflet not available in test harness" not in e]
check("no unexpected console/page errors", not relevant)
if relevant: print("\n".join(relevant[:10]))
fails = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(fails)}/{len(results)} checks passed")
sys.exit(1 if fails else 0)
