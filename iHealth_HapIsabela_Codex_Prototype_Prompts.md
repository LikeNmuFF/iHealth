# iHealth HapIsabela: Codex prototype prompts

Team: Claudex
Target: Isabela City, Basilan, Philippines
Purpose: A functional ideathon prototype of a GIS-enabled patient referral PWA.

## How to use

Use Prompt 1 in Codex inside an empty project folder. If you already have a project, ask Codex to inspect it and preserve its working stack and unrelated changes. Prompts 2–5 are optional follow-ups after the initial build, not prerequisites. This is a new GIS prototype brief and does not silently update earlier concept notes or decks.

The default is a frontend-first prototype with fictional data and shared browser state. It is not a deployable medical record system. A separate backend is deliberately deferred so the first demonstration remains achievable.

## Prompt 1: Complete prototype build

```text
You are my product designer and full-stack developer. Build a functional, polished, responsive prototype of iHealth HapIsabela, a GIS-enabled healthcare referral Progressive Web App by Team Claudex.

Do the implementation. Do not stop at planning, a landing page, screenshots, or disconnected dashboards. Inspect the workspace first. Preserve an existing working stack and unrelated user changes. For an empty folder, use Next.js App Router, TypeScript, Tailwind CSS, Lucide icons, and Leaflet with a compatible React integration. Use compatible stable packages and inspect their current official documentation where necessary. Keep the architecture small and readable. Do not add a second backend framework to this prototype.

PRODUCT PURPOSE

Help patients discover nearby facilities, allow authorized facility staff to coordinate a referral, send relevant information ahead to the receiving hospital, and help the patient reach the confirmed destination. Hospital staff retrieve the existing referral information and verify identity or missing details on arrival.

The core story is: find care -> receive assessment -> send referral information -> hospital reviews -> patient sees confirmation and directions -> hospital retrieves information -> consultation and follow-up.

This prototype focuses on planned, non-emergency referrals. Do not add automated diagnosis, treatment recommendations, emergency dispatch, guaranteed doctor availability, or claims that patients skip required hospital processes.

PROTOTYPE MODE AND DATA

Use a clearly labeled Demo Mode with four entry cards: Patient, Health Center, Hospital, and Clinic. These are demo personas, not production authentication. Allow switching personas from the app header without resetting the workflow. Include a facility selector for demo staff and a patient selector for the demo patient view.

All clinical content and facility coordinates are fictional demonstration fixtures. Do not scrape patient records or invent partnerships, endorsements, live capacity feeds, or real hospital integrations. Put a concise demo-data indicator in the app and mark each fictional facility in its details.

Use a typed mock repository and a single shared application store. Persist only fictional fixtures and demo changes in versioned localStorage, hydrated after mount. Use storage events if supporting same-origin multi-tab demonstration. Include a confirmed Reset Demo action that restores the seed data and clears active demo location/route state. Do not store actual device coordinates or continuous location history in localStorage. Do not present browser persistence or UI filtering as production security.

These screens share the same referral records. Sending a referral in the health center view must make it appear in the correct hospital view. A hospital confirmation must update the correct patient's timeline and notification list. Reloading should preserve fictional workflow changes.

USER GROUPS AND PERMISSIONS

1. Patient: public facility discovery; own profile, own referral status, instructions, notifications, and destination directions. Patients cannot create clinical referral notes or see other patients' records.
2. Health Center: staff review patient information, create and submit referrals, select destination/service and optional preferred doctor, track responses, coordinate alternatives, and view return notes for their referrals.
3. Hospital: staff review referrals addressed to their facility, acknowledge them, request clarification, propose alternatives, confirm arrangements, decline with a reason, verify arrival, and record visit/follow-up status.
4. Clinic: similar staff workflow to a health center; may send referrals and receive referrals only for services the clinic actually has in the fixture configuration.

Model hospitals, health centers, and clinics as facility types. Staff are individual demo users attached to a facility. Reuse staff components where appropriate rather than creating three separate applications. Implement facility-scoped selectors and action guards in the mock layer, with a README warning that real authorization requires a trusted backend. Do not add an LGU dashboard in this build.

PATIENT EXPERIENCE

Make the patient view mobile-first with bottom navigation: Explore, My Referrals, Notifications, Profile.

Explore:
- Show a real interactive map and synchronized facility list/cards.
- Initial geographic context is Isabela City, Basilan. Store the map center and fictional site coordinates in a configuration file. If using an approximate city center, document that it is approximate. Never label synthetic markers as verified real facility locations.
- Provide Use My Location, Choose Starting Point, Recenter, and Map/List controls.
- Ask for location only after the patient taps the location button. Handle denied permission, timeout, unsupported geolocation, and inaccurate position. Explain that manual selection is available.
- Allow choosing a starting point by tapping the map or selecting a demo starting point. Real device location remains optional. Include a clearly labeled Use Demo Location control for presentations outside Basilan.
- Search by facility name and filter by facility type, service, scheduled opening, and reported referral availability.
- Use distinct marker icons as well as colors for hospitals, health centers, and clinics. Provide an accessible list alternative.
- If no origin is set, show facilities without invented patient distances. If origin is set, calculate distance and label its type.
- If a user is far from the demonstration area, do not silently replace their location. Offer the demo starting point.

Facility details:
- Name, fictional-site badge, type, address label, services, opening hours, distance, demo contact label, and availability freshness.
- Separate Scheduled Open/Closed from Accepting Referrals/Not Accepting/Unknown. Evaluate sample operating hours in Asia/Manila and support overnight hours if present.
- Staff-reported availability is service-specific, includes updatedAt, and becomes Unknown when older than a configurable demo freshness threshold. Document that threshold as a prototype assumption, not a clinical standard.
- Opening hours never imply that a specific doctor is available or that a referral has been accepted.
- Actions: View Directions and View Service Details. Browsing a facility does not book an appointment or create a referral.

My Referrals:
- Show the patient's referrals, origin and destination, service, reference number, current status, timestamped timeline, next step, and any confirmed instructions.
- Before confirmation, show Destination Requested, clearly distinguished from Confirmed Destination. A patient may inspect the requested location, but the app must not tell them to travel as if an appointment were confirmed.
- After confirmation, highlight the confirmed destination and View Route action.
- Use plain-language messages such as Hospital is reviewing your referral and Your receiving facility has confirmed the plan.
- Allow viewing a printable referral reference with minimal information. Do not expose diagnosis or personal data in a public URL or QR code.

LOCATION, DISTANCE, AND ROUTING

Use real mapping components, not a screenshot pretending to be interactive. Load browser-only mapping code safely in Next.js. Avoid hydration and window-is-not-defined errors. Make marker assets work in production builds.

Keep three concepts separate:
1. Geolocation provides the current position.
2. Mapping renders tiles, markers, and lines.
3. Routing computes a path along roads and its travel distance/duration.

Implement a small RoutingProvider interface. Include an optional real-road-route adapter using a configurable provider endpoint. Do not require a paid account for the basic prototype to run, do not invent credentials, and do not send requests to an arbitrary public demo endpoint without checking its published usage conditions. If a provider needs secrets, keep them server-side; follow provider requirements for any public browser token and document restrictions.

When a routing provider is configured, draw its returned road geometry and display returned road distance and estimated duration. Use a suitable walking/driving mode supported by the adapter. Do not claim traffic-aware ETA unless the configured service actually provides it.

When routing is not configured or fails:
- Keep the map usable.
- Display Haversine distance labeled Straight-line distance, not road distance.
- A dashed origin-to-destination connector may be shown, labeled Direct connection, not a travel route.
- Provide Open in Google Maps directions using the selected coordinates and a supported Maps URL. Only coordinates needed for directions should be included, never patient names, diagnoses, or referral IDs.
- Clearly say Road route unavailable in this prototype configuration. Never fabricate a road-following path or ETA.

While the route screen is active and the user has granted permission, watch location changes, update the current-position marker, and refresh straight-line distance. If real routing is enabled, throttle route refreshes, avoid parallel duplicate requests, cancel obsolete requests, and prevent older responses overwriting a newer route. Clear location watches on exit. Do not promise reliable background tracking when the phone is locked. Live location is not shared with hospital staff.

Use a configurable tile source and visible map attribution. If using the standard OpenStreetMap tile service, follow its current usage policy. Do not prefetch, bulk-download, or service-worker-cache those tiles for offline use. Handle blocked or unavailable tiles with a useful list view and error message. The prototype must still be demonstrable without a routing key or successful tile loading.

STAFF SCREENS

Use a desktop sidebar and responsive mobile menu with Overview, Referrals, Patients, Facility Profile, and Notifications. Receiving facilities also have Incoming Referrals; referring facilities have Outgoing Referrals. Clinics configured for both have both views.

Overview: show counts derived from the actual fixture/store data, such as pending incoming, awaiting response, confirmed, arrived, completed. No invented outcome statistics.

Referral list: searchable table/cards with reference, patient, origin/destination, requested service, status, timestamp, and action. Filter by status and direction. Scope records to the active facility.

New referral form:
- Select a fictional patient or create a new fictional demo patient.
- Show a notice to use fictional information only.
- Review demographics and contact preferences.
- Record clinician-entered reason, concise relevant history, allergies/medications where applicable, and service requested. Distinguish Not recorded from None.
- Select an eligible destination from a list/map based on service plus staff-reported availability and distance when an origin is known. Do not automatically assign the nearest facility or treat distance as clinical suitability.
- Optional preferred doctor selection; label it a request, subject to receiving-facility confirmation.
- Include a review-before-sharing acknowledgement in the demo. Do not claim that one checkbox establishes complete legal compliance.
- Show a review screen before submission.
- On submit, create one referral, one immutable submitted information snapshot, a timeline event, and relevant in-app notifications. Prevent accidental duplicate submission.

Referral review at receiving facility:
- Show the submitted snapshot and referring facility's details.
- Provide Acknowledge, Request Clarification, Propose Alternative, Confirm Plan, and Decline actions only when valid.
- Confirmation captures receiving service, optional doctor, proposed visit time or arrival instructions, and confirmation timestamp. Availability and confirmation must come from staff actions, never automatic map logic.
- If the preferred doctor is unavailable, propose another doctor, time, service, or destination with a reason. Coordinate acceptance through the referring facility before final confirmation. A proposed new destination does not become confirmed until that receiving facility also accepts it.
- Do not silently reassign or modify submitted clinical information.

Arrival and follow-up:
- Hospital staff search an existing referral by reference and retrieve demographics and referral details.
- Display Verify identity and review changes before marking Arrived. Opening the map, reaching a GPS boundary, or a patient clicking a button does not verify arrival.
- Capture missing/changed registration information separately from the original submitted snapshot.
- Staff mark the demonstration visit completed and enter a short return/follow-up note visible to the referring facility and a separately worded patient instruction visible to the patient.
- Include a print-friendly referral summary for staff-assisted patients without smartphones.

WORKFLOW AND STATE RULES

Use a typed transition function rather than arbitrary dropdown status changes:
draft -> submitted -> acknowledged -> confirmed -> arrived -> completed.

Additional explicit paths:
- submitted/acknowledged -> clarification_requested -> resubmitted -> acknowledged.
- acknowledged -> alternative_proposed -> alternative_accepted -> confirmed, after the receiving facility confirms the agreed plan.
- submitted/acknowledged/alternative_proposed/alternative_accepted -> declined with reason when appropriate.
- An active pre-arrival referral may be cancelled by an authorized demo actor with a reason.

For simplicity, an alternative that changes the destination creates a linked replacement referral that requires that facility's acceptance; preserve the original record and its timeline. Do not mark a different hospital's referral confirmed using the original hospital's action.

Make invalid transitions unavailable and guard them in the repository. Clarification is an addendum/revision, not an overwrite of the immutable submitted snapshot. Patients see a simplified timeline while staff can inspect the fuller event history. Every state change records timestamp, demo actor, facility, and reason where applicable.

DATA MODEL

Define readable TypeScript interfaces for DemoUser, Patient, Facility, Service, Doctor, ServiceAvailability, Referral, SubmittedSnapshot, ReferralAddendum, ReferralEvent, AlternativeProposal, RegistrationVerification, ReturnNote, Notification, and AppState. Use a few coherent modules rather than an enterprise architecture.

Facility: id, name, type, synthetic coordinates, addressLabel, services, hours, timezone, serviceAvailability, and isDemo.
Referral: id/reference, patientId, originFacilityId, destinationFacilityId, requestedServiceId, optional preferredDoctorId, status, submittedSnapshotId, optional confirmedPlan, linkedReplacementId, and timestamps.

Seed at least 6 fictional facilities (2 health centers, 2 hospitals, 2 clinics), several services, several demo staff/doctor profiles, and 6 fictional patient referrals across different statuses. Clearly label synthetic names and coordinates. Include unknown/stale availability and a closed facility to demonstrate filters.

Create Ana Reyes as the primary fictional demo patient, with DEMO-P001 and DEMO-REF-0001, for a planned OB-GYN referral from Demo Health Center A to Demo Hospital A. Include a preferred doctor unavailable scenario that is resolved by a staff-proposed alternative doctor at the same hospital. Do not use real contact numbers or patient identifiers.

UI DESIGN

Make a calm, readable healthcare interface with a strong map/list experience. Brand name: iHealth HapIsabela. Team credit: Claudex, small and secondary. Use blue as the primary action color, restrained yellow highlights, and red for errors/urgent UI feedback. Use neutral surfaces, strong text contrast, consistent spacing, and readable fonts. Do not invent an official logo asset; use a simple temporary wordmark if none is supplied.

Prioritize patient task clarity over decorative dashboards. Include an understandable referral progress stepper. Differentiate statuses using text and icons as well as color. Use clear labels, keyboard-accessible dialogs/forms, visible focus, error messages beside fields, loading states, empty states, and notifications that link to the affected referral. Support reduced motion. Do not make color the only way to interpret markers or referral progress.

At approximately 390px wide, patient screens should be comfortable with no page-level horizontal overflow. At desktop size, use a map/list split layout and readable staff tables. Preserve zoom/map controls and attribution when drawers are open.

PWA AND NETWORK BEHAVIOR

Add a web app manifest, suitable local icons, theme color, and supported install guidance. Generate simple code-native placeholder icons if no brand asset exists. Only show an install action when supported, otherwise provide concise platform guidance.

Use a service worker or a compatible PWA integration for a limited static app shell. Never blanket-cache authenticated responses, referral details, navigation URLs containing personal data, map tiles, or live routing responses. Do not claim full offline referrals or guaranteed background synchronization.

Provide offline/network-error indicators. Treat the browser online flag as a hint, not proof a provider/server is reachable. If a real backend is not present, label staff submissions and confirmations as local demo actions. A presentation-only Simulate Offline switch may demonstrate UI states, but label it as simulation. If the app cannot prove a real referral was delivered, never say Sent to hospital.

Do not add real SMS, file uploads, payment collection, AI diagnosis, bed management, live queues, or external hospital integrations. In-app demo notifications are sufficient. Do not add subscription payments or unvalidated pricing screens to this prototype.

IMPLEMENTATION SEQUENCE

1. Inspect and scaffold, then create typed fixtures, repository, state transitions, and reset/hydration behavior.
2. Build the app shell, demo persona entry, responsive navigation, and patient/staff layouts.
3. Build the facility map, list, filters, facility details, location permission handling, and manual origin.
4. Implement the shared end-to-end referral workflow and hospital information retrieval before adding visual polish.
5. Add routing adapter/fallback, location updates, PWA shell, and error states.
6. Polish mobile and desktop screens, verify the demonstration journey, and fix failures.

DELIVERABLES AND VERIFICATION

Create the actual working source code, README.md, .env.example with no secrets, DEMO_SCRIPT.md, and KNOWN_LIMITATIONS.md. README must include exact setup/run/build commands, fixture/reset instructions, map/routing configuration, what works without keys, and the browser-only persistence/auth limitations. No broken routes or nonfunctional primary buttons. Implement empty/error states rather than leaving TODOs in the core workflow.

Run type checking, linting if configured, and a production build. Add focused tests for referral transitions, facility/patient scoping, stale availability, snapshot preservation, and route-distance labeling/fallback. Avoid snapshot tests that merely duplicate the markup.

When browser automation is available, verify at least:
1. Patient denies location and selects a demo origin successfully.
2. Facility search, service filter, and map/list selection stay in sync.
3. Health center submits Ana's referral; only its receiving hospital sees it.
4. Hospital proposes an alternative doctor; referring facility coordinates acceptance; hospital confirms.
5. Patient sees the updated plan and destination, with honest distance/route labels.
6. Hospital retrieves prefilled information, verifies identity, marks arrival, and returns follow-up.
7. Another patient cannot see Ana's referral through normal selectors; another facility cannot act on it through guarded repository actions.
8. Reload preserves demo changes; Reset Demo restores fixtures; live device coordinates are not persisted.
9. Missing routing config, failed tiles, and network errors do not prevent reviewing the demo journey.
10. Mobile and desktop layouts have no clipped primary actions or hidden map attribution.

If something cannot be verified in the environment, report the exact limitation. Do not claim tests passed when they were not run. Finish with a concise summary of the implemented behavior, commands, test results, and remaining limitations. Continue until the authorized prototype is runnable; do not stop after an outline.
```

## Prompt 2: Improve the visual design after the build

```text
Review the existing iHealth HapIsabela prototype, then improve its visual clarity without changing its referral rules or introducing unimplemented features.

Keep the patient map/list view as the main discovery experience. Make facility cards readable: name, type, services, scheduled opening status, reported availability, freshness, and correctly labeled distance. Improve the mobile facility drawer and referral timeline. On staff screens, make the primary next action obvious for each status and show referral details in a clear hierarchy.

Use the established blue, yellow, and red accents with accessible contrast and neutral backgrounds. Keep markers distinguishable by shape/icon. Replace generic decorative charts with useful workflow content derived from demo data. Use restrained motion only for meaningful feedback and respect reduced-motion settings.

Inspect at phone and desktop widths, fix clipping/overflow, and verify key actions remain functional. Preserve the demo indicators, map attribution, honest routing fallbacks, immutable snapshots, and staff confirmation requirements. Do the edits, then report what changed and what you verified.
```

## Prompt 3: Complete or harden the GIS experience

```text
Inspect the existing GIS implementation and finish any missing behavior from the master brief. Do not replace the entire app or remove working referral features.

Verify map/list synchronization, service/type filters, optional user location, denied-permission handling, manual map origin, a labeled demo location, distance updates, and location-watch cleanup. Audit every kilometer label so straight-line distance cannot be mistaken for road distance. Verify stale routing responses cannot overwrite the current destination.

If an approved routing provider is configured, draw its actual returned geometry and use its distance/duration. If none is configured, preserve the clearly labeled dashed direct connector and Open in Google Maps fallback. Never draw a fabricated road route or estimated arrival time. Do not start paid services, invent API credentials, or rely on unrestricted public demo servers. Read the provider's current official documentation and usage policy before integrating it. Keep secrets out of client bundles and patient information out of mapping requests.

Preserve visible attribution, skip map tiles in service-worker caches, and retain a usable facility list when tiles fail. Test the missing-provider and denied-location cases, implement the fixes, and explain what routing mode is actually active.
```

## Prompt 4: Verify the referral demonstration

```text
Run a complete demonstration of iHealth HapIsabela using the fictional Ana Reyes referral. Use available browser automation and focused tests, without creating real patient data or contacting real hospitals.

Start from reset fixtures. Discover a facility as the patient, switch to the referring health center, review the fictional patient information, submit the referral, switch to the destination hospital, acknowledge it, propose an alternative doctor, coordinate acceptance as the referring staff member, and confirm the plan as hospital staff. Return to the patient view and verify the status, destination, directions, and next steps. Retrieve the referral at the hospital, verify identity separately from GPS, complete the demo visit, and record a return note visible to the originating facility.

Check role/facility guards, invalid transitions, duplicate submissions, snapshot preservation, refresh persistence, reset behavior, routing fallback, and mobile usability. Fix defects found in the implementation. Write DEMO_SCRIPT.md as a simple 3–4 minute role-switching walkthrough with what to click and what to say. Clearly separate local simulation from actual hospital delivery and list remaining limitations.
```

## Prompt 5: Add a backend after the prototype is approved

```text
Inspect the approved iHealth HapIsabela prototype and propose the smallest backend implementation that preserves its current UI, data types, and validated workflow. First identify which browser-only behaviors need trusted server enforcement. Do not rewrite the frontend or add a second competing source of truth.

If no backend preference is already established, use the existing Next.js server with PostgreSQL and a simple migration-based data layer. If this repository already has a Flask backend, integrate with it instead. Explain the selected approach before substantial structural changes, then implement the authorized work.

Replace the mock repository behind its interface. Add real sessions, password hashing, facility membership, server-side role and object authorization, input validation, transactional state transitions, immutable referral snapshots, audit events, and duplicate-request protection. Patient/facility IDs must never grant access without authorization. Scope all reads and writes to the authenticated actor. Never trust the demo role selector or client-submitted identity. Disable the demo switcher outside explicit demo builds.

Document a minimal policy for what information is shared, retained, logged, and available offline. Exclude health records and device coordinates from broad service-worker caching and application logs. Protect secrets, use HTTPS in deployment, and add backup/recovery guidance. Continue using fictional fixtures until a separate approved pilot process exists. Do not claim regulatory compliance or readiness for real patient use solely because these controls are implemented.

Keep mapping and routing independent of clinical payloads. Add tests for cross-facility access, patient ownership, invalid transitions, concurrent confirmation, duplicate submissions, and snapshot integrity. Provide migrations, seed/reset instructions for development, .env.example without secrets, and a concise deployment checklist. Do not deploy externally or import real patient records unless separately authorized.
```

## Technical references for the build agent

Consult current official documentation rather than copying outdated integration snippets:

- Leaflet documentation: https://leafletjs.com/reference.html
- Browser geolocation and permission handling: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition
- Routing response concepts: https://developers.google.com/maps/documentation/routes/reference/rest/v2/TopLevel/computeRoutes
- Google Maps directions URLs: https://developers.google.com/maps/documentation/urls/get-started
- OpenStreetMap standard tile usage policy: https://operations.osmfoundation.org/policies/tiles/
- PWA offline behavior: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation

The routing reference illustrates road geometry and distance outputs. It is not an instruction to activate a paid Google Maps API. Provider selection and credentials remain explicit configuration choices.
