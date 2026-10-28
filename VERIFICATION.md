# Verification record

Date: 2026-10-28. Initial workspace contained only the supplied prototype prompt. Its contents were preserved. No existing application was replaced and no external deployment, message or publication was made.

## Final checks

| Command                                                    | Result                                                                 |
| ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| `npm.cmd run typecheck`                                    | Passed                                                                 |
| `npm.cmd run lint`                                         | Passed with no errors or warnings                                      |
| `npm.cmd test`                                             | 20 domain tests passed                                                 |
| `npm.cmd run build`                                        | Production build passed, `/` and not-found prerendered                 |
| `npm.cmd run test:e2e`                                     | All 8 Chromium scenarios passed, final run 2.9 minutes on port 3006    |
| `npm.cmd run format:check`                                 | Passed                                                                 |
| Frontend Design Premium `audit_project.py . --mode strict` | Passed, zero findings; `premium-audit.json` saved                      |
| `npx.cmd -y -p @google/design.md designmd lint DESIGN.md`  | Passed, 0 errors; 10 nonblocking document-component reference warnings |

The design document mirrors canonical runtime CSS tokens. Its reference warnings concern tokens used in CSS rather than declared component objects. The domain suite checks documented palette drift. The design audit is static evidence, not a replacement for browser checks.

## Browser evidence

Tests run against the actual production server with full Chromium (`channel: chromium`), using desktop and 390×844 viewports. Axe scans include the staff overview, patient facility/map view, and patient referral detail. All scans passed with no excluded map region in the final run. This is not a comprehensive accessibility certification.

1. **Shared workflow:** Health Center A reviews and submits Ana's fictional draft, Hospital B cannot see it, Hospital A acknowledges and proposes the available alternative doctor, referring staff accept, Hospital A confirms, the patient sees the updated plan and returned road geometry, staff verify identity, complete the visit, and return separate staff/patient notes. Clinic A also confirms its incoming general-medicine referral. Reload retains changes, another patient's list excludes Ana, and confirmed Reset Demo restores the draft.
2. **GIS recovery:** geolocation denial followed by demo origin, service/name filters, matching list and marker selection, manual map starting point, blocked tiles, no-results state, and keyboard-accessible clear-search recovery.
3. **Phone:** no page-level overflow at 390px, native select keyboard operation, visible map attribution, reduced motion, simulated offline/disabled tiles, dialog Escape/focus restoration, and patient print output without name/clinical notes.
4. **Persistence/network:** real browser geolocation with fictional test coordinates remains transient, same-origin tabs exchange changes and reset origins, service-worker caches contain only allowlisted static assets, and actual offline navigation opens the limited offline document.
5. **Guided journey and navigation:** the guide opens the appropriate actor and referral at every handoff; normal referral searches and starting points survive opening details. Mobile staff navigation remains visible.
6. **Road routing:** no request is sent without an origin; failed requests draw no shortcut line. Retry renders the intercepted road geometry and reports the synthetic pin's offset from the road. Routing responses use the recorded Isabela fixture; tests do not repeatedly query the public service.
7. **Presenter Mode:** role handoffs leave status unchanged until explicit staff actions. The original preferred doctor, accepted alternative, and actual receiving confirmation remain distinct. Layout toggles preserve the stored record; canceling a restart preserves changes. Confirmed restart returns to step one in both presentation and standard layouts. The confirmed patient view passes axe; the phone layout has no horizontal overflow.

Domain tests additionally cover invalid transitions, patient/facility guards, forged actor metadata, duplicate submissions, service-restricted clinic receiving, same-hospital alternatives, changed-destination linked replacements, snapshot preservation through clarification and completion, reason requirements, stale availability, overnight Manila schedules, storage version validation, Haversine labels, provider failure, coordinate-only Google Maps links, and mocked real-road adapter responses.

Automated tests deliberately block OSM tile requests to verify resilience and avoid treating successful tiles as a prerequisite. Preview images are supplementary visual evidence; they do not replace these tests. Presenter screenshots are saved under `test-results/` and the pitch backup is documented in `DEMO_SCRIPT.md`.

A separate live-tile preview check (`node scripts/inspect-demo.mjs`) returned zero successful OSM tile responses in this environment. It confirmed all six synthetic facility pins inside the phone map bounds and no phone page overflow. Saved previews in `docs/preview/` therefore show the honest tile-unavailable fallback, not a verified online basemap. Online tile availability remains unverified here.

## Defects found and corrected

- Schema-normalized property order initially caused a false cross-tab conflict. The store now compares the last actual persisted representation before accepting a command.
- Hidden visual labels initially left native selects unnamed. The shared Select provides an explicit accessible name.
- Staff and mobile navigation captions had insufficient contrast on tinted surfaces. Text contrast was corrected without changing status meanings.
- Brand/avatar accessible labels were brought into agreement with visible text.
- Map framing now fits the displayed fictional facilities and nearby origin; markers have explicit titles and the list stays available.
- Map positions are typed Leaflet tuples; the compiler/linter tool versions are compatible.
- Presenter next-step copy now meets contrast requirements on its tinted background. Rehearsal reset preserves the selected layout while returning the active guide to the patient's first step.

## Environment-specific notes and unverified behavior

- The installed native Windows SWC binding was unavailable in this environment. Next.js's supported Webpack path and WASM compiler fallback successfully built and served the prototype. Build and server logs contain this warning. `dev` and `build` explicitly use `--webpack`.
- The optional headless-shell download encountered network resets. Full Chromium installed successfully and all final tests used it. The documented `playwright install chromium --no-shell` matches the configured browser.
- Directions now use the public OSRM endpoint by default. A successful live response is saved in `tests/fixtures/isabela-road-route.json` (80 road geometry points, 2239.1 metres, 244.6 seconds); see its adjacent README for provenance. Browser tests intercept requests with this fixture and verify failure/retry independently. Discovery distances remain explicitly straight-line; unavailable road directions draw no connecting line and invent no ETA. The public service is best effort, and these are synthetic locations.
- Timeout, unsupported/low-accuracy/far-away location recovery are implemented; not every physical-device condition was reproduced. Location-watch cleanup is implemented, but phone-lock/background behavior is not promised.
- No Safari/iOS installation, screen-reader certification, real clinical suitability, backend authorization, actual hospital delivery, or multi-user transaction guarantees were verified or claimed.
- The go-to-market artifact in `founder/go-to-market.md` is a judge-first review plan, not evidence of users, partnerships, clinical outcomes, or launch authorization.
