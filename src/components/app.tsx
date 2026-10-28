"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Building2,
  CalendarCheck,
  Check,
  ChevronRight,
  Compass,
  Download,
  FileText,
  Hospital,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Plus,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
  WifiOff,
  X,
} from "lucide-react";
import { useDemoStore } from "@/lib/store";
import {
  canAct,
  DemoError,
  visibleNotifications,
  visiblePatients,
  visibleReferrals,
  type Command,
} from "@/lib/repository";
import { dateTime, STATUS_LABELS, TYPE_LABELS } from "@/lib/config";
import { availabilityLabel, availabilityStatus } from "@/lib/facilities";
import type { AppState, DemoUser, Persona, Referral } from "@/lib/types";
import { Explore, FacilityIcon, type Origin } from "./explore";
import { BrandLogo } from "./brand-logo";
import { DemoGuide, type GuidePhase } from "./demo-guide";
import { NewReferral, NewPatient } from "./new-referral";
import { ReferralDetail, ReferralList } from "./referral-detail";
import { Empty, Modal, Notice, SearchBox, Select, StatusBadge } from "./ui";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
type Page =
  | "explore"
  | "referrals"
  | "notifications"
  | "profile"
  | "overview"
  | "incoming"
  | "outgoing"
  | "patients"
  | "facility";
type ReferralFilters = { query: string; status: string; direction: string };
const PAGE_TITLES: Record<Page, string> = {
  explore: "Explore care facilities",
  referrals: "Referrals",
  notifications: "Notifications",
  profile: "Patient profile",
  overview: "Referral overview",
  incoming: "Incoming referrals",
  outgoing: "Outgoing referrals",
  patients: "Patients",
  facility: "Facility profile",
};
export default function DemoApp() {
  const { state, dispatch, reset, persistenceNotice } = useDemoStore();
  const [entered, setEntered] = useState(false);
  const [guidePhase, setGuidePhase] = useState<GuidePhase>();
  const [presenting, setPresenting] = useState(false);
  const [returnPage, setReturnPage] = useState<Page>("referrals");
  const [listFilters, setListFilters] = useState<
    Record<string, ReferralFilters>
  >({});
  const [actorId, setActor] = useState("user-DEMO-P001");
  const [page, setPage] = useState<Page>("explore");
  const [selectedRef, setSelectedRef] = useState<string>();
  const [newReferral, setNewReferral] = useState(false);
  const [draftId, setDraft] = useState<string>();
  const [origin, setOrigin] = useState<Origin>();
  const [routeDestination, setRouteDestination] = useState<string>();
  const [resetOpen, setResetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [simulateOffline, setSimulateOffline] = useState(false);
  const [tilesDisabled, setTilesDisabled] = useState(false);
  const [online, setOnline] = useState(true);
  const [notice, setNotice] = useState<{ message: string; error: boolean }>();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt>();
  const [dirty, setDirty] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<() => void>();
  const [installHelp, setInstallHelp] = useState(false);
  const [swError, setSwError] = useState(false);
  const headingRef = useRef<HTMLDivElement>(null);
  const setOriginStable = useCallback(
    (v: Origin | undefined) => setOrigin(v),
    [],
  );
  useEffect(() => {
    if (!entered) return;
    const heading = headingRef.current?.querySelector("h1");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
  }, [page, selectedRef, actorId, entered, newReferral, routeDestination]);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    const install = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", install);
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => setSwError(true));
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      window.removeEventListener("beforeinstallprompt", install);
    };
  }, []);
  useEffect(() => {
    const listener = (e: Event) =>
      setRouteDestination((e as CustomEvent<string>).detail);
    window.addEventListener("demo-directions", listener);
    return () => window.removeEventListener("demo-directions", listener);
  }, []);
  useEffect(() => {
    const clear = () => {
      setOrigin(undefined);
      setRouteDestination(undefined);
      setSelectedRef(undefined);
      setNewReferral(false);
      setDirty(false);
      setGuidePhase(undefined);
      setPresenting(false);
      setListFilters({});
    };
    window.addEventListener("ihealth-demo-reset", clear);
    return () => window.removeEventListener("ihealth-demo-reset", clear);
  }, []);
  useEffect(() => {
    if (!mobileMenu) return;
    const close = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMobileMenu(false);
      document
        .querySelector<HTMLButtonElement>(
          '[aria-label="Mobile staff navigation"] button[aria-expanded]',
        )
        ?.focus();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [mobileMenu]);
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);
  useEffect(() => {
    document.title = `${!entered ? "Choose a demo" : newReferral ? "New referral" : routeDestination ? "Referral directions" : selectedRef ? "Referral details" : PAGE_TITLES[page]} · iHealth HapIsabela Demo`;
  }, [page, newReferral, selectedRef, routeDestination, entered]);
  useEffect(() => {
    if (notice && !notice.error) {
      const timer = setTimeout(() => setNotice(undefined), 6500);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  if (!state)
    return (
      <main className="boot">
        <BrandLogo size={64} />
        <h1>iHealth HapIsabela</h1>
        <p>Loading fictional demonstration records…</p>
      </main>
    );
  const actor =
    state.users.find((u) => u.id === actorId) ||
    state.users.find((u) => u.id === "user-DEMO-P001")!;
  const isPatient = actor.role === "patient";
  const initials = actor.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  const facility = state.facilities.find((f) => f.id === actor.facilityId);
  const referrals = visibleReferrals(state, actor);
  const notifications = visibleNotifications(state, actor);
  const unread = notifications.filter((n) => !n.read).length;
  const referral = referrals.find((r) => r.id === selectedRef);
  function perform(command: Command) {
    try {
      dispatch(actor.id, command);
      setNotice({
        message:
          command.type === "read_notification"
            ? "Notification opened."
            : command.type === "availability"
              ? "Demo service availability updated."
              : "Local demo saved. No real facility has been contacted.",
        error: false,
      });
      return true;
    } catch (error) {
      if (!(error instanceof DemoError))
        console.error("[iHealth demo] Operation failed:", command.type);
      setNotice({
        message:
          error instanceof DemoError
            ? error.message
            : "The demo action could not be completed. Review the record and try again.",
        error: true,
      });
      return false;
    }
  }
  function navigate(action: () => void) {
    if (dirty) {
      setPendingNavigation(() => action);
      return;
    }
    action();
    setMobileMenu(false);
  }
  function go(next: Page) {
    navigate(() => {
      setPage(next);
      setSelectedRef(undefined);
      setNewReferral(false);
      setRouteDestination(undefined);
      window.scrollTo({ top: 0 });
    });
  }
  function switchActor(id: string) {
    navigate(() => {
      const next = state!.users.find((u) => u.id === id)!;
      const keepReferral =
        selectedRef &&
        visibleReferrals(state!, next).some((r) => r.id === selectedRef);
      setActor(id);
      setPage(
        keepReferral
          ? "referrals"
          : next.role === "patient"
            ? "explore"
            : "overview",
      );
      setSelectedRef(keepReferral ? selectedRef : undefined);
      setReturnPage("referrals");
      setNewReferral(false);
      setRouteDestination(undefined);
      setNotice(undefined);
    });
  }
  function openReferral(id: string) {
    navigate(() => {
      if (!visibleReferrals(state!, actor).some((r) => r.id === id)) return;
      if (!selectedRef) setReturnPage(page);
      setSelectedRef(id);
      if (!["referrals", "incoming", "outgoing"].includes(page))
        setPage("referrals");
      setRouteDestination(undefined);
      setNewReferral(false);
      window.scrollTo({ top: 0 });
    });
  }
  function guideNavigate(id: string, referralId?: string) {
    navigate(() => showGuideView(id, referralId));
  }
  function showGuideView(id: string, referralId?: string) {
    const next = state!.users.find((u) => u.id === id);
    if (!next) return;
    if (
      referralId &&
      !visibleReferrals(state!, next).some((r) => r.id === referralId)
    )
      return;
    setActor(id);
    setEntered(true);
    setPage(referralId ? "referrals" : "explore");
    setReturnPage("referrals");
    setSelectedRef(referralId);
    setRouteDestination(undefined);
    setNewReferral(false);
    setNotice(undefined);
    window.scrollTo({ top: 0 });
  }
  function startGuide(pitch = false) {
    navigate(() => {
      const draft = state!.referrals.find((r) => r.id === "ref-1");
      setGuidePhase(draft?.status === "draft" ? "explore" : "referral");
      setPresenting(pitch);
      showGuideView(
        "user-DEMO-P001",
        draft?.status === "draft" ? undefined : draft?.id,
      );
    });
  }
  function startReferral(draft?: Referral) {
    navigate(() => {
      setNewReferral(true);
      setSelectedRef(undefined);
      setDraft(draft?.id);
      setPage("referrals");
      window.scrollTo({ top: 0 });
    });
  }
  const patientNav: { id: Page; label: string; icon: typeof Compass }[] = [
    { id: "explore", label: "Explore", icon: Compass },
    { id: "referrals", label: "My Referrals", icon: FileText },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "profile", label: "Profile", icon: UserRound },
  ];
  const staffNav: { id: Page; label: string; icon: typeof Compass }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "referrals", label: "All Referrals", icon: FileText },
    { id: "incoming", label: "Incoming Referrals", icon: ArrowDownLeft },
    { id: "outgoing", label: "Outgoing Referrals", icon: ArrowUpRight },
    { id: "patients", label: "Patients", icon: Users },
    { id: "facility", label: "Facility Profile", icon: Building2 },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];
  const nav = isPatient ? patientNav : staffNav;
  return (
    <div className={presenting ? "presentation-mode" : undefined}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="app-header">
        <button
          className="brand"
          title="Choose a demo view"
          onClick={() => navigate(() => setEntered(false))}
        >
          <BrandLogo className="header-logo" />
          <span>
            <strong>
              iHealth <span>HapIsabela</span>
            </strong>
            <small>CONNECTED CARE, CLOSER TO HOME</small>
          </span>
        </button>
        {entered && isPatient && (
          <nav className="desktop-patient-nav" aria-label="Patient navigation">
            {patientNav.slice(0, 3).map((item) => (
              <button
                key={item.id}
                className={page === item.id ? "active" : ""}
                aria-current={page === item.id ? "page" : undefined}
                onClick={() => go(item.id)}
              >
                <item.icon size={17} />
                {item.label}
                {item.id === "notifications" && unread > 0 && (
                  <span className="notification-count">{unread}</span>
                )}
              </button>
            ))}
          </nav>
        )}
        <div className="header-actions">
          <span className="demo-badge">
            <span className="tiny-dot" /> Demo mode
          </span>
          {entered && (
            <>
              <Select
                label="Switch view"
                value={actor.role}
                onChange={(e) => {
                  const next = state.users.find(
                    (u) => u.role === e.target.value,
                  );
                  if (next) switchActor(next.id);
                }}
              >
                <option value="patient">Patient view</option>
                <option value="health_center">Health Center view</option>
                <option value="hospital">Hospital view</option>
                <option value="clinic">Clinic view</option>
              </Select>
              <button
                className="icon-button settings-trigger"
                aria-label="Demo settings"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings2 size={19} />
              </button>
              <button
                className="avatar profile-trigger"
                aria-label={`${initials}: Open profile for ${actor.name}`}
                onClick={() => go(isPatient ? "profile" : "facility")}
              >
                {initials}
              </button>
              {!isPatient && (
                <button
                  className="icon-button menu-trigger"
                  aria-label="Toggle staff menu"
                  aria-expanded={mobileMenu}
                  aria-controls="staff-navigation-panel"
                  onClick={() => setMobileMenu(!mobileMenu)}
                >
                  {mobileMenu ? <X size={20} /> : <Menu size={20} />}
                </button>
              )}
            </>
          )}
        </div>
      </header>
      {(!online || simulateOffline) && (
        <div className="network-banner" role="status">
          <WifiOff size={16} />
          {simulateOffline
            ? "Simulated offline · presentation control"
            : "Browser reports offline · connectivity hint"}{" "}
          · Local demo actions remain available. Maps and road providers may be
          unavailable.
        </div>
      )}
      {persistenceNotice && <Notice tone="warning">{persistenceNotice}</Notice>}
      {!entered ? (
        <main id="main-content" className="entry-page">
          <div className="entry-copy">
            <span className="eyebrow">
              <span className="tiny-dot" /> TEAM CLAUDEX · INTERACTIVE PROTOTYPE
            </span>
            <h1>
              Follow a referral.
              <br />
              <span>From start to finish.</span>
            </h1>
            <p>
              See how a patient, health center, and hospital coordinate planned
              care in Isabela City. Choose a guided journey or explore a view.
            </p>
            <div className="entry-path">
              <span>
                <Compass size={19} /> Find care
              </span>
              <ArrowRight size={16} />
              <span>
                <FileText size={19} /> Coordinate
              </span>
              <ArrowRight size={16} />
              <span>
                <CalendarCheck size={19} /> Confirm
              </span>
            </div>
          </div>
          <section className="guide-start" aria-label="Start a guided demo">
            <div>
              <span className="eyebrow">RECOMMENDED · ABOUT 4 MINUTES</span>
              <h2>Follow Ana’s referral</h2>
              <p>
                One patient, six steps, with help at every handoff. Pitch demo
                uses larger text for presenting; guided demo uses the standard
                layout. Both keep your existing demo changes.
              </p>
            </div>
            <div className="guide-entry-actions">
              <button
                className="button primary"
                onClick={() => startGuide(true)}
              >
                Start pitch demo <ArrowRight size={17} />
              </button>
              <button className="button secondary" onClick={() => startGuide()}>
                Start guided demo
              </button>
            </div>
          </section>
          <section className="persona-section">
            <div className="section-heading">
              <div>
                <h2>Or explore a view on your own</h2>
                <p>
                  Choose who you want to be. You can switch views without
                  resetting the records.
                </p>
              </div>
              <span className="badge neutral">
                4 perspectives · 1 shared story
              </span>
            </div>
            <div className="persona-grid">
              {(
                [
                  {
                    role: "patient",
                    title: "Patient",
                    description:
                      "Explore facilities, follow your referral, and view confirmed instructions.",
                    icon: UserRound,
                  },
                  {
                    role: "health_center",
                    title: "Health Center",
                    description:
                      "Review patient information and coordinate planned referrals.",
                    icon: Building2,
                  },
                  {
                    role: "hospital",
                    title: "Hospital",
                    description:
                      "Review incoming referrals, confirm plans, and record follow-up.",
                    icon: Hospital,
                  },
                  {
                    role: "clinic",
                    title: "Clinic",
                    description:
                      "Send and receive referrals for your configured services.",
                    icon: Stethoscope,
                  },
                ] as {
                  role: Persona;
                  title: string;
                  description: string;
                  icon: typeof UserRound;
                }[]
              ).map((p) => (
                <button
                  className={`persona-card persona-${p.role}`}
                  key={p.role}
                  onClick={() => {
                    setGuidePhase(undefined);
                    setPresenting(false);
                    switchActor(state.users.find((u) => u.role === p.role)!.id);
                    setEntered(true);
                  }}
                >
                  <span className="persona-icon">
                    <p.icon size={27} />
                  </span>
                  <h3>{p.title}</h3>
                  <p>{p.description}</p>
                  <span className="persona-enter">
                    Enter demo <ArrowRight size={17} />
                  </span>
                </button>
              ))}
            </div>
            <Notice>
              Fictional patients, facilities, coordinates, and availability.
              These views are demo personas, not sign-in or production
              authorization. Planned care only; no real referral delivery.
            </Notice>
          </section>
          <div className="entry-footer">
            <span>
              <ShieldCheck size={17} /> Your location is optional and never
              saved in demo storage.
            </span>
            <button
              className="text-button"
              onClick={() => setSettingsOpen(true)}
            >
              Demo settings <Settings2 size={15} />
            </button>
          </div>
        </main>
      ) : (
        <div
          className={`app-layout ${isPatient ? "patient-layout" : "staff-layout"}`}
        >
          {!isPatient && (
            <aside
              id="staff-navigation-panel"
              className={`staff-sidebar ${mobileMenu ? "mobile-open" : ""}`}
            >
              <div className="sidebar-facility">
                <span className={`facility-icon ${facility!.type}`}>
                  <FacilityIcon type={facility!.type} />
                </span>
                <strong>{facility!.name}</strong>
                <small>Fictional facility workspace</small>
              </div>
              <div className="sidebar-label">WORKSPACE</div>
              <nav aria-label="Staff navigation">
                {staffNav.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => go(item.id)}
                    className={page === item.id ? "active" : ""}
                    aria-current={page === item.id ? "page" : undefined}
                  >
                    <item.icon size={18} />
                    {item.label}
                    {item.id === "incoming" && (
                      <small>
                        {
                          referrals.filter(
                            (r) =>
                              r.destinationFacilityId === actor.facilityId &&
                              ["submitted", "resubmitted"].includes(r.status),
                          ).length
                        }
                      </small>
                    )}
                  </button>
                ))}
              </nav>
              <div className="sidebar-bottom">
                <span className="badge neutral">LOCAL DEMO WORKSPACE</span>
                <p>
                  Shared browser records.
                  <br />
                  No real hospital integration.
                </p>
                <button
                  className="text-button"
                  onClick={() => navigate(() => setEntered(false))}
                >
                  <LogOut size={16} /> Choose another view
                </button>
                <small>Built by Team Claudex</small>
              </div>
            </aside>
          )}
          <main id="main-content" ref={headingRef} className="main-content">
            <div className="workspace-strip">
              <div>
                <span className="tiny-dot" />
                {isPatient
                  ? "Patient workspace"
                  : `${TYPE_LABELS[facility!.type]} workspace`}
                <span className="strip-divider">/</span>
                <span>{actor.name}</span>
              </div>
              <Select
                label={isPatient ? "Fictional patient" : "Active demo facility"}
                value={actor.id}
                onChange={(e) => switchActor(e.target.value)}
              >
                {state.users
                  .filter((u) => u.role === actor.role)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {isPatient
                        ? u.name
                        : state.facilities.find((f) => f.id === u.facilityId)
                            ?.name}
                    </option>
                  ))}
              </Select>
            </div>
            <div className="workspace-toolbar">
              <button
                className="text-button"
                onClick={() => navigate(() => setEntered(false))}
              >
                <LayoutDashboard size={15} /> All demo views
              </button>
              <span>
                {newReferral
                  ? "New referral"
                  : routeDestination
                    ? "Referral directions"
                    : referral
                      ? "Referral details"
                      : nav.find((item) => item.id === page)?.label}
              </span>
              {!guidePhase && (
                <button
                  className="text-button"
                  onClick={() => startGuide(true)}
                >
                  Pitch demo <ArrowRight size={15} />
                </button>
              )}
            </div>
            {guidePhase && (
              <DemoGuide
                state={state}
                actor={actor}
                phase={guidePhase}
                selectedRef={routeDestination ? undefined : selectedRef}
                editing={newReferral}
                onNavigate={guideNavigate}
                onPhase={setGuidePhase}
                presenting={presenting}
                onPresentation={() => setPresenting((value) => !value)}
                onExit={() => {
                  setGuidePhase(undefined);
                  setPresenting(false);
                }}
                onReset={() => setResetOpen(true)}
              />
            )}
            {notice && (
              <div
                className={`app-notice ${notice.error ? "error" : "success"}`}
                role={notice.error ? "alert" : "status"}
              >
                <span>{notice.message}</span>
                <button
                  className="icon-button"
                  aria-label="Dismiss message"
                  onClick={() => setNotice(undefined)}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {newReferral ? (
              <NewReferral
                key={`${actor.id}-${draftId || "new"}`}
                state={state}
                actor={actor}
                draft={state.referrals.find((r) => r.id === draftId)}
                onDirty={setDirty}
                onCancel={() => {
                  setNewReferral(false);
                  setDirty(false);
                }}
                onSave={perform}
              />
            ) : routeDestination && isPatient ? (
              <Explore
                key={`route-${routeDestination}`}
                state={state}
                origin={origin}
                setOrigin={setOriginStable}
                destination={routeDestination}
                backLabel={
                  referral ? "Back to referral details" : "Back to facilities"
                }
                onCloseRoute={() => setRouteDestination(undefined)}
                offline={!online || simulateOffline}
                tilesDisabled={tilesDisabled}
              />
            ) : referral ? (
              <>
                {canAct(referral, actor, "submit") && (
                  <div className="draft-banner" id="referral-actions">
                    <FileText size={19} />
                    <span>This draft is ready for referring-staff review.</span>
                    <button
                      className="button primary"
                      onClick={() => startReferral(referral)}
                    >
                      Review & submit draft <ArrowRight size={16} />
                    </button>
                  </div>
                )}
                <ReferralDetail
                  key={`${referral.id}-${actor.id}`}
                  state={state}
                  actor={actor}
                  referral={referral}
                  onBack={() => {
                    setSelectedRef(undefined);
                    setPage(returnPage);
                  }}
                  backLabel={`Back to ${returnPage === "overview" ? "overview" : returnPage === "patients" ? "patients" : returnPage === "notifications" ? "notifications" : "referrals"}`}
                  onOpen={openReferral}
                  onRoute={(id) => {
                    setRouteDestination(id);
                    window.scrollTo({ top: 0 });
                  }}
                  dispatch={perform}
                />
              </>
            ) : page === "explore" && isPatient ? (
              <Explore
                key="explore"
                state={state}
                origin={origin}
                setOrigin={setOriginStable}
                onCloseRoute={() => setRouteDestination(undefined)}
                offline={!online || simulateOffline}
                tilesDisabled={tilesDisabled}
              />
            ) : page === "overview" ? (
              <Overview
                state={state}
                actor={actor}
                referrals={referrals}
                onOpen={openReferral}
                onNew={() => startReferral()}
                onIncoming={() => go("incoming")}
              />
            ) : ["referrals", "incoming", "outgoing"].includes(page) ? (
              <ReferralsPage
                key={actor.id + page}
                state={state}
                actor={actor}
                referrals={referrals}
                page={page}
                filters={listFilters[actor.id + page]}
                onFiltersChange={(filters) =>
                  setListFilters((previous) => ({
                    ...previous,
                    [actor.id + page]: filters,
                  }))
                }
                onOpen={openReferral}
                onNew={() => startReferral()}
              />
            ) : page === "notifications" ? (
              <section>
                <PageTitle
                  eyebrow="YOUR UPDATES"
                  title="Notifications"
                  description="In-app demo notifications for this selected patient or facility."
                />
                <div className="panel notifications-list">
                  {!notifications.length ? (
                    <Empty title="You’re all caught up">
                      Updates appear here when a referral changes.
                    </Empty>
                  ) : (
                    notifications
                      .slice()
                      .reverse()
                      .map((n) => (
                        <button
                          key={n.id}
                          className={`notification-item ${!n.read ? "unread" : ""}`}
                          onClick={() => {
                            perform({
                              type: "read_notification",
                              notificationId: n.id,
                            });
                            openReferral(n.referralId);
                          }}
                        >
                          <span className="notice-bell">
                            <Bell size={19} />
                          </span>
                          <span>
                            <strong>{n.message}</strong>
                            <small>
                              {
                                state.referrals.find(
                                  (r) => r.id === n.referralId,
                                )?.reference
                              }{" "}
                              · {dateTime(n.createdAt)}
                            </small>
                          </span>
                          <ChevronRight size={17} />
                        </button>
                      ))
                  )}
                </div>
              </section>
            ) : page === "patients" ? (
              <Patients
                state={state}
                actor={actor}
                onSave={perform}
                onOpen={openReferral}
              />
            ) : page === "facility" ? (
              <FacilityProfile state={state} actor={actor} onSave={perform} />
            ) : (
              <section>
                <PageTitle
                  eyebrow="FICTIONAL PATIENT PROFILE"
                  title={actor.name}
                  description="Only the selected demo patient’s profile is shown."
                />
                <div className="panel profile-panel">
                  <span className="avatar large">
                    {actor.name
                      .split(" ")
                      .map((s) => s[0])
                      .join("")}
                  </span>
                  <dl className="info-list">
                    {Object.entries(
                      state.patients.find((p) => p.id === actor.patientId) ||
                        {},
                    )
                      .filter(([key]) =>
                        [
                          "id",
                          "birthDate",
                          "address",
                          "contactPreference",
                        ].includes(key),
                      )
                      .map(([key, value]) => (
                        <div key={key}>
                          <dt>
                            {
                              {
                                id: "Demo patient reference",
                                birthDate: "Date of birth",
                                address: "Fictional address",
                                contactPreference: "Contact preference",
                              }[key]
                            }
                          </dt>
                          <dd>{String(value)}</dd>
                        </div>
                      ))}
                  </dl>
                  <Notice>
                    Persona switching is for demonstration. Browser filtering is
                    not real access control. Do not enter real medical or
                    identifying information.
                  </Notice>
                </div>
              </section>
            )}
            <footer className="app-footer">
              <span>
                <ShieldCheck size={14} /> Fictional data · Local demo actions ·
                Planned referrals only
              </span>
              <span>
                <BrandLogo size={24} /> iHealth HapIsabela{" "}
                <span className="muted">by Team Claudex</span>
              </span>
            </footer>
          </main>
          {isPatient && (
            <nav
              className="patient-bottom-nav"
              aria-label="Mobile patient navigation"
            >
              {nav.map((item) => (
                <button
                  key={item.id}
                  className={page === item.id ? "active" : ""}
                  aria-current={page === item.id ? "page" : undefined}
                  onClick={() => go(item.id)}
                >
                  <item.icon size={21} />
                  <span>{item.label}</span>
                  {item.id === "notifications" && unread > 0 && (
                    <small>{unread}</small>
                  )}
                </button>
              ))}
            </nav>
          )}
          {!isPatient && (
            <nav
              className="patient-bottom-nav"
              aria-label="Mobile staff navigation"
            >
              {staffNav
                .filter((item) =>
                  ["overview", "referrals", "patients"].includes(item.id),
                )
                .map((item) => (
                  <button
                    key={item.id}
                    className={page === item.id ? "active" : ""}
                    aria-current={page === item.id ? "page" : undefined}
                    onClick={() => go(item.id)}
                  >
                    <item.icon size={21} />
                    <span>
                      {item.id === "referrals" ? "Referrals" : item.label}
                    </span>
                  </button>
                ))}
              <button
                onClick={() => setMobileMenu(!mobileMenu)}
                aria-expanded={mobileMenu}
                aria-controls="staff-navigation-panel"
              >
                {mobileMenu ? <X size={21} /> : <Menu size={21} />}
                <span>More</span>
              </button>
            </nav>
          )}
        </div>
      )}
      {settingsOpen && (
        <Modal title="Demo settings" onClose={() => setSettingsOpen(false)}>
          <Notice>
            Presentation controls affect this tab. Referral changes are local
            fictional browser data.
          </Notice>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={simulateOffline}
              onChange={(e) => setSimulateOffline(e.target.checked)}
            />{" "}
            Simulate Offline (presentation only)
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={tilesDisabled}
              onChange={(e) => setTilesDisabled(e.target.checked)}
            />{" "}
            Disable map tiles (presentation only)
          </label>
          <p className="small muted">
            The browser online flag is a hint, not proof that tiles or a routing
            provider are reachable.
          </p>
          {swError && (
            <Notice tone="warning">
              The static-shell service worker could not register. The online
              demo remains usable.
            </Notice>
          )}
          <button
            className="button secondary full"
            onClick={async () => {
              if (installPrompt) {
                await installPrompt.prompt();
                setInstallPrompt(undefined);
              } else setInstallHelp(true);
            }}
          >
            <Download size={16} />
            {installPrompt ? "Install prototype" : "How to install"}
          </button>
          {installHelp && (
            <p>
              On supported HTTPS browsers, use the browser’s Install app menu.
              On iPhone/iPad, use Safari → Share → Add to Home Screen.
              Availability depends on the browser. This app has a limited static
              offline shell.
            </p>
          )}
          <div className="settings-reset">
            <h3>Restore the fictional starting point</h3>
            <p>
              Reset all demo records and clear this tab’s starting point and
              route.
            </p>
            <button
              className="button danger-outline"
              onClick={() => {
                setSettingsOpen(false);
                setResetOpen(true);
              }}
            >
              <RotateCcw size={16} /> Reset Demo
            </button>
          </div>
        </Modal>
      )}
      {resetOpen && (
        <Modal
          title="Reset all fictional demo records?"
          onClose={() => setResetOpen(false)}
        >
          <p>
            This restores six seeded referrals, including Ana’s draft, across
            all four views. Saved fictional changes will be lost. Device
            location and routes in this tab will be cleared.
          </p>
          <div className="form-actions">
            <button
              className="button secondary"
              onClick={() => setResetOpen(false)}
            >
              Keep demo changes
            </button>
            <button
              className="button danger"
              onClick={() => {
                const restartPitch = presenting;
                const restartGuide = !!guidePhase;
                reset();
                setOrigin(undefined);
                setRouteDestination(undefined);
                setSelectedRef(undefined);
                setNewReferral(false);
                setDirty(false);
                setResetOpen(false);
                if (restartGuide) {
                  setPresenting(restartPitch);
                  setGuidePhase("explore");
                  setActor("user-DEMO-P001");
                  setEntered(true);
                  setPage("explore");
                }
                setNotice({
                  message:
                    "Demo reset. Fictional fixtures restored; starting point and route cleared.",
                  error: false,
                });
              }}
            >
              Reset Demo
            </button>
          </div>
        </Modal>
      )}
      {pendingNavigation && (
        <Modal
          title="Discard unsaved changes?"
          onClose={() => setPendingNavigation(undefined)}
        >
          <p>
            There are unsaved fictional referral changes. Keep editing or
            discard them before switching views.
          </p>
          <div className="form-actions">
            <button
              className="button secondary"
              onClick={() => setPendingNavigation(undefined)}
            >
              Keep editing
            </button>
            <button
              className="button danger"
              onClick={() => {
                setDirty(false);
                pendingNavigation();
                setMobileMenu(false);
                setPendingNavigation(undefined);
              }}
            >
              Discard changes
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
function Overview({
  state,
  actor,
  referrals,
  onOpen,
  onNew,
  onIncoming,
}: {
  state: AppState;
  actor: DemoUser;
  referrals: Referral[];
  onOpen: (id: string) => void;
  onNew: () => void;
  onIncoming: () => void;
}) {
  const incoming = referrals.filter(
    (r) => r.destinationFacilityId === actor.facilityId,
  );
  const nextReferral =
    referrals.find((r) =>
      [
        "submit",
        "acknowledge",
        "resubmit",
        "accept_alternative",
        "confirm",
        "arrive",
        "complete",
      ].some((action) => canAct(r, actor, action)),
    ) || referrals[0];
  const counts = [
    {
      label: "Pending incoming",
      value: incoming.filter((r) =>
        ["submitted", "resubmitted"].includes(r.status),
      ).length,
      icon: ArrowDownLeft,
    },
    {
      label: "Awaiting response",
      value: referrals.filter(
        (r) =>
          r.originFacilityId === actor.facilityId &&
          [
            "submitted",
            "acknowledged",
            "clarification_requested",
            "resubmitted",
            "alternative_proposed",
            "alternative_accepted",
          ].includes(r.status),
      ).length,
      icon: FileText,
    },
    {
      label: "Confirmed plans",
      value: referrals.filter((r) => r.status === "confirmed").length,
      icon: CalendarCheck,
    },
    {
      label: "Visits completed",
      value: referrals.filter((r) => r.status === "completed").length,
      icon: Check,
    },
  ];
  return (
    <section>
      <PageTitle
        eyebrow="FACILITY OVERVIEW"
        title="Referral overview"
        description="Your facility’s referral activity, drawn from the shared fictional records."
        action={
          <button className="button primary" onClick={onNew}>
            <Plus size={17} /> New referral
          </button>
        }
      />
      <div className="staff-welcome">
        <div>
          <span className="eyebrow">
            GOOD TO SEE YOU, {actor.name.split(" ")[0].toUpperCase()}
          </span>
          <h2>
            {referrals.some((r) => r.status === "draft")
              ? "Start with a draft referral"
              : incoming.some((r) =>
                    ["submitted", "resubmitted"].includes(r.status),
                  )
                ? "Review a new incoming referral"
                : "Track your facility’s referrals"}
          </h2>
          <p>
            {referrals.some((r) => r.status === "draft")
              ? "Open the draft below to review and submit it. The receiving facility will review it next."
              : "Open a referral below to see its status, instructions, and available actions."}
          </p>
          <button
            className="button white"
            onClick={() => {
              const draft = referrals.find((r) => canAct(r, actor, "submit"));
              if (draft) onOpen(draft.id);
              else if (nextReferral) onOpen(nextReferral.id);
              else onIncoming();
            }}
          >
            {referrals.some((r) => canAct(r, actor, "submit"))
              ? "Open draft referral"
              : nextReferral
                ? "Open next referral"
                : "View incoming referrals"}{" "}
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="care-flow-art" aria-hidden="true">
          <span>
            <Building2 size={30} />
          </span>
          <i />
          <span>
            <FileText size={34} />
          </span>
          <i />
          <span>
            <Hospital size={30} />
          </span>
        </div>
      </div>
      <div className="metric-grid">
        {counts.map((c) => (
          <div className="metric-card" key={c.label}>
            <div>
              <span>{c.label}</span>
              <c.icon size={19} />
            </div>
            <strong>{c.value}</strong>
            <small>Current demo records</small>
          </div>
        ))}
      </div>
      <div className="section-heading">
        <div>
          <h2>Referrals needing your attention</h2>
          <p>Open a record to see its next available action.</p>
        </div>
        <span className="badge neutral">
          {referrals.length} facility records
        </span>
      </div>
      <ReferralTable
        state={state}
        referrals={referrals
          .slice()
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))}
        onOpen={onOpen}
      />
    </section>
  );
}
function ReferralTable({
  state,
  referrals,
  onOpen,
}: {
  state: AppState;
  referrals: Referral[];
  onOpen: (id: string) => void;
}) {
  return (
    <div className="table-frame">
      <table>
        <caption className="sr-only">
          Facility-scoped fictional referral records
        </caption>
        <thead>
          <tr>
            <th scope="col">Reference / patient</th>
            <th scope="col">Origin → destination</th>
            <th scope="col">Requested service</th>
            <th scope="col">Status</th>
            <th scope="col">Updated</th>
            <th scope="col">
              <span className="sr-only">Action</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {referrals.map((r) => (
            <tr key={r.id}>
              <td>
                <button
                  className="table-reference"
                  onClick={() => onOpen(r.id)}
                >
                  {r.reference}
                </button>
                <strong>
                  {state.patients.find((p) => p.id === r.patientId)?.name}
                </strong>
              </td>
              <td>
                {
                  state.facilities.find((f) => f.id === r.originFacilityId)
                    ?.name
                }
                <small>
                  →{" "}
                  {
                    state.facilities.find(
                      (f) => f.id === r.destinationFacilityId,
                    )?.name
                  }
                </small>
              </td>
              <td>
                {
                  state.services.find((s) => s.id === r.requestedServiceId)
                    ?.name
                }
              </td>
              <td>
                <StatusBadge status={r.status} />
              </td>
              <td>{dateTime(r.updatedAt)}</td>
              <td>
                <button
                  className="icon-button"
                  aria-label={`Open ${r.reference}`}
                  onClick={() => onOpen(r.id)}
                >
                  <ChevronRight size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!referrals.length && (
        <Empty title="No matching referrals">
          Try a different search or status.
        </Empty>
      )}
    </div>
  );
}
function ReferralsPage({
  state,
  actor,
  referrals,
  page,
  onOpen,
  onNew,
  filters,
  onFiltersChange,
}: {
  state: AppState;
  actor: DemoUser;
  referrals: Referral[];
  page: Page;
  onOpen: (id: string) => void;
  onNew: () => void;
  filters?: ReferralFilters;
  onFiltersChange: (filters: ReferralFilters) => void;
}) {
  const currentFilters = filters || {
    query: "",
    status: "",
    direction:
      page === "incoming" ? "incoming" : page === "outgoing" ? "outgoing" : "",
  };
  const { query, status, direction } = currentFilters;
  const setQuery = (query: string) =>
    onFiltersChange({ ...currentFilters, query });
  const setStatus = (status: string) =>
    onFiltersChange({ ...currentFilters, status });
  const setDirection = (direction: string) =>
    onFiltersChange({ ...currentFilters, direction });
  const isPatient = actor.role === "patient";
  const filtered = referrals.filter(
    (r) =>
      (!status || r.status === status) &&
      (!direction ||
        (direction === "incoming"
          ? r.destinationFacilityId === actor.facilityId
          : r.originFacilityId === actor.facilityId)) &&
      (!query ||
        `${r.reference} ${state.patients.find((p) => p.id === r.patientId)?.name} ${state.facilities.find((f) => f.id === r.destinationFacilityId)?.name}`
          .toLowerCase()
          .includes(query.toLowerCase())),
  );
  return (
    <section>
      <PageTitle
        eyebrow={isPatient ? "YOUR CARE JOURNEY" : "REFERRAL WORKSPACE"}
        title={
          isPatient
            ? "My referrals"
            : page === "incoming"
              ? "Incoming referrals"
              : page === "outgoing"
                ? "Outgoing referrals"
                : "All referrals"
        }
        description={
          isPatient
            ? "Track your own referral plans and confirmed instructions."
            : page === "incoming"
              ? "Requests sent to this facility. Review these before confirming a plan."
              : page === "outgoing"
                ? "Requests sent by this facility. Track the receiving facility’s response."
                : "All referrals sent or received by your selected facility."
        }
        action={
          !isPatient && (
            <button className="button primary" onClick={onNew}>
              <Plus size={17} /> New referral
            </button>
          )
        }
      />
      <div className="referral-filters">
        <SearchBox
          value={query}
          onChange={setQuery}
          label="Search referrals"
          placeholder={
            isPatient
              ? "Search your referrals…"
              : "Search by reference or patient…"
          }
        />
        <Select
          label="Referral status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </Select>
        {!isPatient && (
          <Select
            label="Referral direction"
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
          >
            <option value="">All directions</option>
            <option value="incoming">Incoming</option>
            <option value="outgoing">Outgoing</option>
          </Select>
        )}
      </div>
      <p className="result-count" aria-live="polite">
        {filtered.length} {isPatient ? "personal" : "facility"} referral
        {filtered.length === 1 ? "" : "s"}
      </p>
      {isPatient ? (
        <ReferralList
          state={state}
          referrals={filtered}
          onOpen={onOpen}
          patient
        />
      ) : (
        <>
          <div className="desktop-referrals">
            <ReferralTable state={state} referrals={filtered} onOpen={onOpen} />
          </div>
          <div className="mobile-referrals">
            <ReferralList state={state} referrals={filtered} onOpen={onOpen} />
          </div>
        </>
      )}
    </section>
  );
}
function Patients({
  state,
  actor,
  onSave,
  onOpen,
}: {
  state: AppState;
  actor: DemoUser;
  onSave: (c: Command) => boolean;
  onOpen: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [create, setCreate] = useState(false);
  const patients = visiblePatients(state, actor).filter((p) =>
    `${p.name} ${p.id}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section>
      <PageTitle
        eyebrow="FICTIONAL PATIENT DIRECTORY"
        title="Patients"
        description="Registered patients and referred patients visible to this demo facility."
        action={
          <button className="button primary" onClick={() => setCreate(true)}>
            <Plus size={17} /> New demo patient
          </button>
        }
      />
      <SearchBox
        value={query}
        onChange={setQuery}
        label="Search patients"
        placeholder="Search fictional patient name or ID…"
      />
      <div className="patient-grid">
        {patients.map((p) => (
          <div className="panel" key={p.id}>
            <span className="avatar">
              {p.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
            <h2>{p.name}</h2>
            <p className="reference">{p.id}</p>
            <p>Born {p.birthDate}</p>
            <p>{p.contactPreference}</p>
            {visibleReferrals(state, actor)
              .filter((r) => r.patientId === p.id)
              .map((r) => (
                <button
                  className="button secondary full"
                  key={r.id}
                  onClick={() => onOpen(r.id)}
                >
                  {r.reference}
                  <ChevronRight size={15} />
                </button>
              ))}
          </div>
        ))}
      </div>
      {!patients.length && (
        <Empty title="No matching patients">
          Clear the search or create a fictional demo patient.
        </Empty>
      )}
      {create && (
        <NewPatient
          onClose={() => setCreate(false)}
          onSave={(c) => {
            if (onSave(c)) setCreate(false);
          }}
        />
      )}
    </section>
  );
}
function FacilityProfile({
  state,
  actor,
  onSave,
}: {
  state: AppState;
  actor: DemoUser;
  onSave: (c: Command) => boolean;
}) {
  const f = state.facilities.find((f) => f.id === actor.facilityId)!;
  return (
    <section>
      <PageTitle
        eyebrow="FICTIONAL FACILITY PROFILE"
        title={f.name}
        description={`${TYPE_LABELS[f.type]} · synthetic coordinates · demo contact only`}
      />
      <div className="detail-columns">
        <div className="panel">
          <h2>Services and reported referral availability</h2>
          <p>
            Staff report availability per service. Reports older than 60 minutes
            become Unknown, a prototype assumption.
          </p>
          {f.services.map((id) => {
            const report = f.serviceAvailability.find(
              (s) => s.serviceId === id,
            );
            return (
              <div className="availability-editor" key={id}>
                <h3>{state.services.find((s) => s.id === id)?.name}</h3>
                <p>
                  {availabilityLabel(availabilityStatus(report))} · updated{" "}
                  {report ? dateTime(report.updatedAt) : "never"}
                </p>
                <Select
                  label={`Update ${state.services.find((s) => s.id === id)?.name} availability`}
                  value={availabilityStatus(report)}
                  onChange={(e) =>
                    onSave({
                      type: "availability",
                      serviceId: id,
                      status: e.target.value as
                        "accepting" | "not_accepting" | "unknown",
                    })
                  }
                >
                  <option value="accepting">Accepting referrals</option>
                  <option value="not_accepting">Not accepting</option>
                  <option value="unknown">Unknown</option>
                </Select>
                <button
                  className="text-button"
                  onClick={() =>
                    onSave({
                      type: "availability",
                      serviceId: id,
                      status: report?.status || "unknown",
                    })
                  }
                >
                  Refresh report timestamp
                </button>
              </div>
            );
          })}
        </div>
        <aside className="panel">
          <h2>Site details</h2>
          <p>
            <MapPin size={16} /> {f.addressLabel}
          </p>
          <p>
            Coordinates: {f.coordinates.lat}, {f.coordinates.lng} (synthetic)
          </p>
          <p>
            Hours:{" "}
            {f.hours.length
              ? f.hours.map((h) => `${h.open}–${h.close}`).join("; ")
              : "Closed in demo schedule"}{" "}
            · Asia/Manila
          </p>
          <p>Contact: no real contact number</p>
          <Notice>
            Scheduled hours and reported availability never confirm a doctor or
            referral plan. Receiving staff must explicitly confirm each
            referral.
          </Notice>
        </aside>
      </div>
    </section>
  );
}
