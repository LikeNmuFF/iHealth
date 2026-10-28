# iHealth HapIsabela UI behavior contract

## Business context sources

Authoritative scope: `iHealth_HapIsabela_Codex_Prototype_Prompts.md`, Prompt 1. The sections User Groups and Permissions, Workflow and State Rules, Prototype Mode and Data, Location Distance and Routing, and PWA and Network Behavior define this prototype. There is no existing backend, prior workflow, ADR, or authorization system in the initial workspace. Billing and legal-compliance flows are outside scope; the sharing checkbox is a demonstration acknowledgement only.

## Canonical UI Map

| Capability     | Canonical owner                      | Source of truth                                               | Allowed variants                                       | Verification                                     |
| -------------- | ------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------ |
| Select/Listbox | `Select` in `src/components/ui.tsx`  | This contract                                                 | Native platform popup; geometry and OS labels accepted | `tests/e2e/demo.spec.ts` keyboard selection      |
| Date           | Native date input in NewPatient      | English UI; platform calendar accepted; date-only ISO storage | Native birth-date input                                | Typecheck and browser form test                  |
| Form           | `Field`, NewReferral and ActionForm  | Prompt 1 staff screens                                        | Create, review, transition                             | Domain and browser tests                         |
| Scrollbar      | `src/app/globals.css`                | DESIGN.md                                                     | Global standards properties plus WebKit fallback       | Browser computed style and overflow checks       |
| Toast          | DemoApp persistent app notice        | This contract                                                 | Success status; error alert; inline modal recovery     | Browser tests                                    |
| CRUD           | `execute` in `src/lib/repository.ts` | Prompt 1 Workflow and State Rules                             | Create, addendum, transition, confirmed reset          | `tests/domain.test.ts`, `tests/e2e/demo.spec.ts` |

Table Selection is not applicable: no bulk selection or bulk mutations. All small fixture lists render completely; no pagination. Referral query/status/direction filters are held in DemoApp per persona and list, and survive opening/closing a detail. They remain in transient memory and clear on reset/reload. Searches are not put into URLs because patient names and clinical references must not leak into public URLs. Switching view preserves an open referral only when the destination persona has access; otherwise it opens that persona’s overview. Back from details returns to the originating screen.

Navigation guidance: `DemoGuide` owns the optional six-step Ana walkthrough. It derives guidance from current referral status, follows linked replacements, opens the correct scoped persona/record, and never executes domain commands. Forms must be finished or closed before its navigation action. A cancelled/declined journey offers the existing confirmed Reset Demo flow. Plain screen titles, a visible Switch view label, All demo views return action, current-page indicators, and staff bottom navigation make manual exploration discoverable. Staff referral actions appear above record details; the suggested valid action has primary emphasis. Source: the user’s navigation simplification request, preserving Prompt 1 permissions and workflow rules.

## Observable flow ledger

| Flow                 | UI consequence                                                                                                                           | Policy source                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Persona entry/switch | Four cards, persistent shared fictional records, active patient/facility selector; no sign-in claim                                      | Prompt 1 Prototype Mode and Data                                           |
| Submit               | Prepare → review → local submission; immutable snapshot, event, scoped notifications; duplicate submission key                           | Prompt 1 New referral form                                                 |
| Review/alternative   | Only valid facility/status actions; alternative must be accepted by referring staff; changed destination creates linked replacement      | Prompt 1 Workflow and State Rules                                          |
| Arrival              | Explicit staff identity verification and separate registration review                                                                    | Prompt 1 Arrival and follow-up                                             |
| Completion           | Separate staff return note and patient instruction                                                                                       | Prompt 1 Arrival and follow-up                                             |
| Cancellation/decline | Reason required, explicit app-owned action dialog                                                                                        | Prompt 1 Workflow and State Rules                                          |
| Reset                | Explicit app dialog names lost fictional changes; restores seed and clears transient origin/route                                        | Prompt 1 Prototype Mode and Data                                           |
| Mapping/routing      | Device permission only on click; solid provider-returned road geometry; no connector on loading/failure; retry and Google Maps available | User request for road-following public routes; Prompt 1 privacy boundaries |

## States and recovery

Hydration happens after mount with a stable server placeholder. Versioned localStorage is validated before use; invalid data yields fresh fictional fixtures and a visible warning. Storage write failures retain memory state with an honest persistence notice. Storage events synchronize tabs; commands check for intervening persisted changes and request review. This is best-effort browser coordination, not transactional multi-user storage. No security is claimed for client filtering.

Unsaved referral changes prompt before in-app navigation and use beforeunload on actual page exit. Failed actions preserve form context and show a recoverable message. Only known error messages are exposed. Clinical payloads are never logged. Unexpected failures log operation names only to developer console; there is no production error dashboard/server in this frontend-only build.

Successes are named local demo saves. No external SMS, real appointment, delivery receipt, traffic ETA, or background tracking is claimed. Cancellation preserves history; there is no hard-delete of individual referrals. Reset is a separately confirmed bulk restoration of fictional fixtures.

## Accessibility, locale, and responsive behavior

Native semantic buttons, labels and tables; visible focus, map list alternative, non-color status cues, named dialogs, keyboard Escape and focus restoration, first-error focus, live statuses, no page-level phone overflow. Date display uses en-PH and Asia/Manila; stored clinical timestamps are UTC ISO. Fixed bottom navigation has reserved content space. Map attribution is never under a drawer. Reduced motion and forced-colors are supported. Automated axe checks supplement browser tests; these are not a full certification.

## Navigation and privacy

Road directions default to public OSRM for low-volume, non-commercial demonstrations. The map accepts only validated `RoadRoute` geometry; direct-distance fallbacks cannot be rendered as route lines. Coordinates are sent only when directions are open with a starting point, with visible routing/privacy attribution. No patient details enter routing URLs. Requests are spaced at least 1.2 seconds per tab; device movement refreshes are throttled to 15 seconds. Road loading, offline, failure, and retry are explicit. Synthetic endpoint offsets are disclosed. Source: the user’s request to follow publicly accessible mapped roads instead of straight connections.

Presenter Mode is authorized by the user's request to add the pitch improvements. Start pitch demo activates the existing guide plus a projection layout; Start guided demo retains the standard layout. Handoffs use the existing scoped navigation helpers and never call repository transitions. View toggles and Exit guide change only transient UI state. The original submitted doctor preference stays visible while the alternative's referring acceptance and receiving confirmation remain distinct. Restart rehearsal opens the existing confirmed Reset Demo dialog; cancellation keeps records, and confirmation restarts the pitch as Ana at step one. Cross-tab resets clear the transient presentation state. No clinical snapshot or location is added to a URL or recording script payload.

The prototype is a single App Router page with in-app view state. There are no patient-data URLs or public QR records. Printing patient references omits demographics and clinical notes; staff summary printing includes the fictional snapshot and must be staff-assisted. Device coordinates never enter localStorage. Reset clears transient start/route state in all open synchronized tabs. PWA shell caches only named static placeholder assets and an offline document. No navigation, patient response, tile, route, or external response is cached by the service worker.
