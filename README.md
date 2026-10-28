# iHealth HapIsabela

A working, frontend-first planned referral PWA prototype by Team Claudex for Isabela City, Basilan. All patients, facility sites, doctors, clinical text, and reported availability are fictional. No actual referral is delivered or appointment booked.

## Run locally

Use Node.js 22.12 or newer (tested with 22.21), npm, and a modern browser.

```powershell
npm.cmd ci
npm.cmd run dev
```

Open http://localhost:3000. For a production build:

```powershell
npm.cmd run build
npm.cmd start
```

No API key, backend, account, or environment file is needed for the basic demonstration. Package versions are recorded in package-lock.json; use npm ci to reproduce them. On macOS/Linux, use npm in place of npm.cmd.

## Demonstrate

For a projector, choose **Start pitch demo**. Presenter Mode extends the existing guided journey with larger desktop text, a visible referral reference/status, one-click role handoffs, and a confirmed **Restart rehearsal** action. Handoffs do not perform clinical approvals. The Doctor coordination panel shows the original doctor request, alternative acceptance, and receiving confirmation separately. Standard view / Presentation view changes only layout; Exit guide restores the normal workspace. See `docs/pitch/backup-demo.webm` for the silent backup recording, or regenerate it with `node scripts/record-pitch.mjs` while the app is running.

For a first presentation, choose **Start guided demo**. A six-step guide explains Ana’s journey and opens the right patient/facility and referral at each handoff. It follows saved workflow status, keeps existing changes, and leaves every submission and confirmation to the presenter. The four entry cards remain available for free exploration. **Switch view** preserves an open referral when the new persona can access it; staff have visible bottom navigation on phones. Referral searches and filters survive opening and returning from a record.

Choose Patient, Health Center, Hospital, or Clinic. Switch personas in the header without losing workflow changes. Use the active facility selector for staff or fictional patient selector for patients. See [DEMO_SCRIPT.md](DEMO_SCRIPT.md) for the complete Ana Reyes journey.

Ana Reyes (DEMO-P001) starts with draft DEMO-REF-0001 at Demo Health Center A, requesting OB-GYN at Demo Hospital A and an unavailable preferred doctor. Staff review and submit it; Hospital A acknowledges and proposes Dr. Sofia Lim; referring staff accept; Hospital A confirms. Patient instructions and notifications update from the same record. Receiving staff verify identity separately, record registration changes, complete the visit, and return follow-up. Clinics can send and receive only their configured services.

Six facilities (two of each type), six patients, and six initial referrals are seeded. The other referrals exercise submitted, acknowledged, confirmed, clarification, and completed states. Demo Health Center B is always scheduled closed. Hospital B's initial reports are stale. Clinic B has overnight hours.

## Fictional storage and reset

`src/lib/fixtures.ts` creates the fixtures. The single shared store hydrates after mount and validates the versioned `ihealth-hapisabela-demo-v1` localStorage value. Reload preserves fictional workflow changes. Same-origin tabs receive storage events. An intervening stored change is rejected before another command is applied; simultaneous writes are not transactional. Invalid data loads fresh fictional fixtures with a warning. Storage-denied mode continues in memory with a visible warning.

Open Demo settings → Reset Demo → confirm. This restores fixtures and clears selected starting points/routes in open synchronized tabs. Device coordinates and accuracy stay in transient tab memory, never localStorage. Manual starting points are also transient. Printouts and Google Maps links contain no hidden public clinical identifiers; patient printouts omit demographics and clinical notes.

These personas and facility/patient filters are **not authentication or production security**. Anyone with browser access can inspect fictional localStorage. Real authorization, confidential records, trusted audit, reliable concurrency, and delivery require a separately approved backend. Enter fictional information only.

## Mapping, geolocation, and routing

`src/lib/config.ts` owns the approximate city context, fictional site coordinates are in fixtures. Center `(6.704, 121.969)` is approximate; none of the facility markers is a verified real site.

- Leaflet/React Leaflet loads only in the browser. Map pins differ in icon and shape. Map/list selection and filters stay synchronized; a list remains usable if tiles fail.
- Location is requested only after Use My Location. Denial, timeout, unsupported and inaccurate positions have recovery guidance. A far-away position is kept with an explicit demo-location offer. Choose Starting Point enables map clicks; Use Demo Location works without permission. Device location is neither saved nor shared with staff.
- Discovery distances are Haversine **straight-line distance**. No origin means no invented distance.
- Directions use the public OSRM driving service by default, drawing the returned road geometry as a solid blue line. Road distance and estimated driving time come from the service; there is no live traffic estimate. Loading, offline, timeout, and no-route states never draw a straight connector. Retry and coordinate-only Google Maps directions remain available. Synthetic facility pins can be off-road: the screen reports the provider’s distance from the selected points to the mapped road.

The default `https://router.project-osrm.org` endpoint is for low-volume, non-commercial demonstrations under the [OSRM demo policy](https://github.com/Project-OSRM/osrm-backend/wiki/Demo-server). Requests are spaced by at least 1.2 seconds per tab. Use an authorized dedicated service for sustained usage. To override it, copy `.env.example` to `.env.local`, set `NEXT_PUBLIC_OSRM_ENDPOINT`, then restart/rebuild; CORS and a driving profile are required. Public environment values must contain no secrets. Directions send only origin/destination coordinates to the routing service; no patient names, referral references, or clinical information are included. Coordinates remain absent from localStorage, though the service receives and may log route requests. OSRM, FOSSGIS, and OpenStreetMap attribution plus a Fix the map link appear with directions.

While directions are open with device permission, watchPosition updates usable positions after at least 30 metres of movement. Device-driven road refreshes are limited to one every 15 seconds; obsolete requests are aborted and stale responses ignored. Watches clear on exit. Phone-lock/background tracking is not guaranteed.

Tile URL and attribution are configurable with `NEXT_PUBLIC_TILE_URL` and `NEXT_PUBLIC_TILE_ATTRIBUTION`. Default: standard OSM tiles over HTTPS, visible attribution, ordinary browser caching and referer. No prefetch/bulk download, custom no-cache requests, or service-worker tile caching. Respect the [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/) and change providers for heavier usage. Availability is best effort.

Staff-reported availability is per service and expires after **60 minutes**, a prototype assumption, not a clinical standard. Hours are evaluated in Asia/Manila, including overnight schedules. Neither hours nor availability guarantees a doctor or confirms a referral.

## PWA and network behavior

The manifest uses 192px/512px icons derived from the supplied text-free logo, plus a separate maskable icon with safe padding. `node scripts/generate-icons.mjs` regenerates them from `public/logo/mark.png`. Only a supported browser install event shows the install action; other browsers get menu/platform guidance. HTTPS or localhost is required for geolocation/service workers. LAN phone access over plain HTTP may not support those capabilities.

The service worker caches only the explicit offline HTML and brand icon allowlist. Navigation always goes to the network, falling back to the static offline document. It never caches referrals, clinical responses, tile images, live routes, external responses, or navigation URLs. This is a **limited static shell**, not a full offline referral app. An already-open tab can keep making fictional local changes offline. No background synchronization is claimed.

Demo settings includes clearly labeled Simulate Offline and Disable map tiles presentation switches. navigator.onLine is only a connectivity hint. Actual provider failures surface independently; local workflow actions never say they reached a real hospital.

## Verification commands

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
npx.cmd playwright install chromium --no-shell
npm.cmd run test:e2e
npm.cmd run format:check
```

Playwright starts a production server on port 3000 if none is running (`PLAYWRIGHT_PORT` selects an isolated port). Tests exercise guided and manual handoffs, mobile staff navigation, restored filters, location denial/demo origin, map markers, failed tiles, full Ana workflow, clinic receiving, scoping, persistence/reset across tabs, print privacy, PWA cache scope, road geometry, route failure/retry, and axe accessibility checks. Tiles are blocked and routing responses intercepted in automated tests so repeated tests do not query public services. The Isabela fixture was fetched successfully from the live public OSRM service with browser CORS support: 80 geometry points, 2.2391 km road distance, and 244.6 seconds estimated driving. See `tests/fixtures/README.md`.

See [VERIFICATION.md](VERIFICATION.md) for actual results and [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md) for boundaries. Design decisions live in DESIGN.md and shared interaction ownership in UX-CONTRACT.md.

## Small architecture

- `src/lib/types.ts`, `fixtures.ts`, `repository.ts`: domain types, mock repository and guarded commands.
- `src/lib/store.tsx`, `storage.ts`: one validated browser store and hydration/persistence.
- `src/lib/facilities.ts`, `routing.ts`: hours/freshness, distances, provider interface and fallback.
- `src/components`: shared shell, staff/patient workflows, map, forms, details and UI primitives.
- `src/app`: Next.js App Router, styles, safe errors and not-found page.
- `public/sw.js`: static allowlist only; no backend framework.

Unexpected operation failures expose a safe message and log only the operation name to the local developer console. There is no remote monitoring, alerting or authorized developer diagnostics backend. Expected validation failures are shown inline and are not logged as incidents.

Official integration references: [Next.js](https://nextjs.org/docs/app/getting-started/installation), [React Leaflet](https://react-leaflet.js.org/docs/start-setup/), [OSRM API](https://project-osrm.org/docs/v5.24.0/api/), [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started), [Geolocation](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition).
