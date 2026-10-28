"use client";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Navigation,
  Printer,
  Send,
} from "lucide-react";
import { dateTime, STATUS_LABELS } from "@/lib/config";
import { canAct, type Command } from "@/lib/repository";
import { googleDirections } from "@/lib/routing";
import type { AppState, DemoUser, Referral } from "@/lib/types";
import { Empty, Field, Modal, Notice, Select, StatusBadge } from "./ui";
import { BrandLogo } from "./brand-logo";
import { DoctorPlan } from "./doctor-plan";

type Dispatch = (command: Command) => boolean;
export function ReferralList({
  state,
  referrals,
  onOpen,
  patient = false,
}: {
  state: AppState;
  referrals: Referral[];
  onOpen: (id: string) => void;
  patient?: boolean;
}) {
  return (
    <div className="referral-list">
      {!referrals.length && (
        <Empty title="No referrals here">
          Change the filters or start a new fictional referral.
        </Empty>
      )}
      {referrals.map((r) => (
        <button
          key={r.id}
          className="referral-card"
          onClick={() => onOpen(r.id)}
        >
          <div className="row between">
            <span className="reference">{r.reference}</span>
            <StatusBadge status={r.status} />
          </div>
          <h3>
            {patient
              ? state.services.find((s) => s.id === r.requestedServiceId)?.name
              : state.patients.find((p) => p.id === r.patientId)?.name}
          </h3>
          <p>
            {state.facilities.find((f) => f.id === r.originFacilityId)?.name}{" "}
            <ArrowRight size={13} />{" "}
            {
              state.facilities.find((f) => f.id === r.destinationFacilityId)
                ?.name
            }
          </p>
          <div className="row between small">
            <span>
              {patient
                ? "View referral and next steps"
                : state.services.find((s) => s.id === r.requestedServiceId)
                    ?.name}{" "}
              · {dateTime(r.updatedAt)}
            </span>
            <ChevronRight size={17} />
          </div>
        </button>
      ))}
    </div>
  );
}

export function ReferralDetail({
  state,
  referral: r,
  actor,
  onBack,
  backLabel = "Back to referrals",
  onRoute,
  onOpen,
  dispatch,
}: {
  state: AppState;
  referral: Referral;
  actor: DemoUser;
  onBack: () => void;
  backLabel?: string;
  onRoute: (id: string) => void;
  onOpen: (id: string) => void;
  dispatch: Dispatch;
}) {
  const [action, setAction] = useState<string>();
  const isPatient = actor.role === "patient";
  const patient = state.patients.find((p) => p.id === r.patientId)!;
  const snapshot = state.snapshots.find((s) => s.id === r.submittedSnapshotId);
  const destination = state.facilities.find(
    (f) => f.id === r.destinationFacilityId,
  )!;
  const origin = state.facilities.find((f) => f.id === r.originFacilityId)!;
  const alternative = state.alternatives
    .filter((a) => a.referralId === r.id)
    .at(-1);
  const returnNote = state.returnNotes.find((n) => n.referralId === r.id);
  const confirmed =
    !!r.confirmedPlan && !["cancelled", "declined"].includes(r.status);
  const nextStep = r.linkedReplacementId
    ? "A linked replacement is awaiting the new receiving facility."
    : (
        {
          draft:
            "Your referring facility is preparing the information. No visit is confirmed.",
          submitted:
            "The receiving facility is reviewing your referral. Wait for a confirmed plan.",
          acknowledged:
            "The receiving facility has acknowledged your referral. Wait for a confirmed plan.",
          clarification_requested:
            "Your referring facility needs to coordinate additional information.",
          resubmitted:
            "Additional information is ready for receiving staff to review.",
          alternative_proposed:
            "Your referring facility will coordinate the proposed alternative with you.",
          alternative_accepted:
            "The alternative is accepted by the referring facility. Receiving confirmation is still required.",
          confirmed:
            "Review your confirmed instructions and arrange travel when appropriate.",
          arrived:
            "Receiving staff have recorded arrival. Follow the facility’s registration and consultation process.",
          completed: "Review your follow-up instructions below.",
          declined:
            "Contact your referring facility to coordinate another option.",
          cancelled:
            "This request is no longer active. Contact your referring facility for a new plan.",
        } as const
      )[r.status];
  const mainIndex = [
    "draft",
    "submitted",
    "acknowledged",
    "confirmed",
    "arrived",
    "completed",
  ].indexOf(r.status);
  const progress =
    mainIndex >= 0
      ? mainIndex
      : [
            "alternative_proposed",
            "alternative_accepted",
            "clarification_requested",
            "resubmitted",
          ].includes(r.status)
        ? 2
        : 0;
  const recommended =
    r.status === "acknowledged" &&
    r.preferredDoctorId &&
    state.doctors.some((d) => d.id === r.preferredDoctorId && !d.available)
      ? "propose"
      : (
          {
            submitted: "acknowledge",
            resubmitted: "acknowledge",
            acknowledged: "confirm",
            alternative_proposed: "accept_alternative",
            alternative_accepted: "confirm",
            confirmed: "arrive",
            arrived: "complete",
          } as Record<string, string>
        )[r.status];
  const actionPanel = (
    <div
      className="panel actions-panel"
      id={r.status === "draft" ? undefined : "referral-actions"}
    >
      <h2>{isPatient ? "Your reference" : "Available actions"}</h2>
      {!isPatient && (
        <p className="small muted">
          {recommended && canAct(r, actor, recommended)
            ? "The blue button is the next suggested action. Other options are below."
            : "Review the current status and available options. The next step may belong to the other facility."}
        </p>
      )}
      <div className="action-buttons">
        {(
          [
            "acknowledge",
            "clarify",
            "propose",
            "accept_alternative",
            "confirm",
            "arrive",
            "complete",
            "decline",
            "cancel",
          ] as const
        )
          .filter((type) => canAct(r, actor, type))
          .map((type) => (
            <button
              key={type}
              className={`button ${type === recommended ? "primary" : type === "decline" || type === "cancel" ? "danger-outline" : "secondary"}`}
              onClick={() => {
                if (type === "acknowledge" || type === "accept_alternative")
                  dispatch({ type, referralId: r.id });
                else setAction(type);
              }}
            >
              {
                {
                  acknowledge: "Acknowledge referral",
                  clarify: "Request clarification",
                  propose: "Propose alternative",
                  accept_alternative: "Accept coordinated alternative",
                  confirm: "Confirm plan",
                  arrive: "Verify identity & arrival",
                  complete: "Complete visit & follow-up",
                  decline: "Decline with reason",
                  cancel: "Cancel referral",
                }[type]
              }
            </button>
          ))}
        {canAct(r, actor, "resubmit") && (
          <button
            className="button primary"
            onClick={() => setAction("resubmit")}
          >
            <Send size={16} /> Add clarification & resubmit
          </button>
        )}
        <button className="button secondary" onClick={() => window.print()}>
          <Printer size={16} /> Print{" "}
          {isPatient ? "referral reference" : "referral summary"}
        </button>
      </div>
    </div>
  );
  return (
    <section className="detail-page">
      <button className="text-button" onClick={onBack}>
        <ArrowLeft size={17} /> {backLabel}
      </button>
      <div className="page-heading">
        <div>
          <div className="eyebrow">{r.reference}</div>
          <h1>{isPatient ? "Referral details" : patient.name}</h1>
          <p>
            {state.services.find((s) => s.id === r.requestedServiceId)?.name} ·
            Planned, non-emergency referral
          </p>
        </div>
        <StatusBadge status={r.status} />
      </div>
      <Notice>
        Local demo record · no information has been delivered to a real
        facility. All patient details are fictional.
      </Notice>
      {!isPatient && actionPanel}
      <ol className="progress-stepper" aria-label="Referral progress">
        {[
          "Prepared",
          "Submitted",
          "Reviewed",
          "Confirmed",
          "Arrived",
          "Completed",
        ].map((label, i) => (
          <li
            className={i <= progress ? "reached" : ""}
            key={label}
            aria-current={i === progress ? "step" : undefined}
          >
            <span>{i < progress ? <Check size={14} /> : i + 1}</span>
            <small>{label}</small>
          </li>
        ))}
      </ol>
      <DoctorPlan state={state} referral={r} />
      <div className="detail-columns">
        <div className="detail-main">
          <div className="panel next-step">
            <span className="eyebrow">
              {isPatient ? "YOUR NEXT STEP" : "NEXT STEP FOR THIS REFERRAL"}
            </span>
            <h2>{nextStep}</h2>
            {confirmed && <p>{r.confirmedPlan?.instructions}</p>}
            {returnNote && (
              <Notice tone="success">{returnNote.patientInstruction}</Notice>
            )}
            {r.linkedReplacementId && (
              <button
                className="button secondary"
                onClick={() => onOpen(r.linkedReplacementId!)}
              >
                View linked replacement <ArrowRight size={16} />
              </button>
            )}
            {r.replacesReferralId && (
              <button
                className="text-button"
                onClick={() => onOpen(r.replacesReferralId!)}
              >
                View original referral
              </button>
            )}
          </div>
          <div className="panel">
            <div className="section-heading">
              <h2>
                {confirmed ? "Confirmed destination" : "Destination requested"}
              </h2>
              <span className={`badge ${confirmed ? "success" : "neutral"}`}>
                {confirmed ? "Confirmed by demo staff" : "Not yet confirmed"}
              </span>
            </div>
            <h3>{destination.name}</h3>
            <p>{destination.addressLabel} · Fictional site</p>
            <div className="route-origin">
              <span className="tiny-dot" />
              <div>
                <small>Referring facility</small>
                <strong>{origin.name}</strong>
              </div>
            </div>
            {confirmed && r.confirmedPlan && (
              <dl className="info-list">
                <div>
                  <dt>Receiving service</dt>
                  <dd>
                    {
                      state.services.find(
                        (s) => s.id === r.confirmedPlan!.serviceId,
                      )?.name
                    }
                  </dd>
                </div>
                <div>
                  <dt>Receiving doctor</dt>
                  <dd>
                    {state.doctors.find(
                      (d) => d.id === r.confirmedPlan?.doctorId,
                    )?.name || "Assigned by receiving facility"}
                  </dd>
                </div>
                <div>
                  <dt>Confirmed at</dt>
                  <dd>{dateTime(r.confirmedPlan.confirmedAt)} · Manila</dd>
                </div>
              </dl>
            )}
            {isPatient ? (
              <button
                className={`button ${confirmed ? "primary" : "secondary"}`}
                onClick={() => onRoute(destination.id)}
              >
                <Navigation size={16} />
                {confirmed ? "View route" : "Inspect requested location"}
              </button>
            ) : (
              <a
                className="button secondary"
                href={googleDirections(destination.coordinates)}
                target="_blank"
                rel="noreferrer"
              >
                <Navigation size={16} /> Inspect fictional destination in Google
                Maps
              </a>
            )}
            {!confirmed && (
              <p className="small muted">
                Inspecting a location does not confirm a visit. Wait for
                receiving-facility instructions before travelling.
              </p>
            )}
          </div>
          {!isPatient && (
            <>
              <div className="panel">
                <div className="section-heading">
                  <h2>Submitted information</h2>
                  <span className="badge neutral">
                    <FileText size={12} /> Immutable snapshot
                  </span>
                </div>
                {snapshot ? (
                  <>
                    <dl className="info-list">
                      <div>
                        <dt>Patient</dt>
                        <dd>
                          {snapshot.patient.name} · {snapshot.patient.id}
                        </dd>
                      </div>
                      <div>
                        <dt>Date of birth</dt>
                        <dd>{snapshot.patient.birthDate}</dd>
                      </div>
                      <div>
                        <dt>Address label</dt>
                        <dd>{snapshot.patient.address}</dd>
                      </div>
                      <div>
                        <dt>Contact preference</dt>
                        <dd>{snapshot.patient.contactPreference}</dd>
                      </div>
                      <div>
                        <dt>Reason for referral</dt>
                        <dd>{snapshot.reason}</dd>
                      </div>
                      <div>
                        <dt>Relevant history</dt>
                        <dd>{snapshot.history}</dd>
                      </div>
                      <div>
                        <dt>Allergies</dt>
                        <dd>{snapshot.allergies}</dd>
                      </div>
                      <div>
                        <dt>Medications</dt>
                        <dd>{snapshot.medications}</dd>
                      </div>
                      <div>
                        <dt>Preferred doctor request</dt>
                        <dd>
                          {state.doctors.find(
                            (d) => d.id === snapshot.preferredDoctorId,
                          )?.name || "No preference requested"}
                        </dd>
                      </div>
                    </dl>
                    <p className="small muted">
                      Captured {dateTime(snapshot.submittedAt)} · clinical
                      information is never overwritten by subsequent actions.
                    </p>
                  </>
                ) : (
                  <p>
                    This draft has not been submitted. Review and share its
                    fictional information.
                  </p>
                )}
                {state.addenda
                  .filter((a) => a.referralId === r.id)
                  .map((a) => (
                    <div key={a.id} className="addendum">
                      <strong>
                        Clarification / addendum · {dateTime(a.createdAt)}
                      </strong>
                      <p>{a.text}</p>
                    </div>
                  ))}
              </div>
              {state.verifications
                .filter((v) => v.referralId === r.id)
                .map((v) => (
                  <div className="panel" key={v.id}>
                    <h2>
                      <ClipboardCheck size={19} /> Arrival and registration
                      review
                    </h2>
                    <p>
                      Identity verified by{" "}
                      {state.users.find((u) => u.id === v.actorId)?.name} ·{" "}
                      {dateTime(v.createdAt)}
                    </p>
                    <p>{v.changes}</p>
                    <small>
                      Registration changes are separate from the original
                      submitted information.
                    </small>
                  </div>
                ))}
              {returnNote && (
                <div className="panel">
                  <h2>Return note to referring facility</h2>
                  <p>{returnNote.staffNote}</p>
                  <h3>Separate patient instruction</h3>
                  <p>{returnNote.patientInstruction}</p>
                </div>
              )}
            </>
          )}
        </div>
        <aside>
          <div className="panel timeline-panel">
            <h2>Referral timeline</h2>
            <ol className="timeline">
              {state.events
                .filter((e) => e.referralId === r.id)
                .map((e) => (
                  <li key={e.id}>
                    <span className="timeline-dot" />
                    <small>{dateTime(e.createdAt)} · Manila</small>
                    <strong>{STATUS_LABELS[e.status]}</strong>
                    <p>{e.message}</p>
                    {!isPatient && (
                      <>
                        <small>
                          {state.users.find((u) => u.id === e.actorId)?.name} ·{" "}
                          {state.facilities.find((f) => f.id === e.facilityId)
                            ?.name || "Demo patient"}
                        </small>
                        {e.reason && <p className="event-reason">{e.reason}</p>}
                      </>
                    )}
                  </li>
                ))}
            </ol>
          </div>
          {alternative && (
            <div className="panel alternative-panel">
              <span className="eyebrow">COORDINATED ALTERNATIVE</span>
              <h2>
                {state.doctors.find((d) => d.id === alternative.doctorId)
                  ?.name ||
                  state.services.find((s) => s.id === alternative.serviceId)
                    ?.name}
              </h2>
              <p>
                {
                  state.facilities.find(
                    (f) => f.id === alternative.destinationFacilityId,
                  )?.name
                }
              </p>
              <p>{alternative.reason}</p>
              <p>{alternative.instructions}</p>
              <span className="badge neutral">
                {alternative.acceptedAt
                  ? "Referring facility accepted"
                  : "Awaiting referring facility"}
              </span>
            </div>
          )}
          {isPatient && actionPanel}
        </aside>
      </div>
      {action && (
        <ActionForm
          key={action + r.updatedAt}
          action={action}
          r={r}
          state={state}
          onCancel={() => setAction(undefined)}
          onSave={(command) => {
            const saved = dispatch(command);
            if (saved) setAction(undefined);
            return saved;
          }}
        />
      )}
      <div className="print-summary">
        <BrandLogo size={56} />
        <h1>iHealth HapIsabela · Demo referral</h1>
        <h2>{r.reference}</h2>
        <p>{STATUS_LABELS[r.status]}</p>
        <p>From: {origin.name}</p>
        <p>
          {confirmed
            ? "Confirmed destination"
            : "Destination requested (not confirmed)"}
          : {destination.name}
        </p>
        <p>
          Service:{" "}
          {state.services.find((s) => s.id === r.requestedServiceId)?.name}
        </p>
        {!isPatient && snapshot && (
          <>
            <p>
              Fictional patient: {snapshot.patient.name} · {snapshot.patient.id}{" "}
              · {snapshot.patient.birthDate}
            </p>
            <p>Contact preference: {snapshot.patient.contactPreference}</p>
            <p>Reason: {snapshot.reason}</p>
            <p>History: {snapshot.history}</p>
            <p>
              Allergies: {snapshot.allergies} · Medications:{" "}
              {snapshot.medications}
            </p>
          </>
        )}
        <p>{confirmed ? r.confirmedPlan?.instructions : nextStep}</p>
        {returnNote && <p>Follow-up: {returnNote.patientInstruction}</p>}
        <p>
          Fictional demonstration only. No real facility delivery or
          appointment. Verify identity at arrival. Printed{" "}
          {dateTime(new Date().toISOString())} (Asia/Manila).
        </p>
      </div>
    </section>
  );
}

function ActionForm({
  action,
  r,
  state,
  onCancel,
  onSave,
}: {
  action: string;
  r: Referral;
  state: AppState;
  onCancel: () => void;
  onSave: (c: Command) => boolean;
}) {
  const alternative = state.alternatives
    .filter((a) => a.referralId === r.id)
    .at(-1);
  const agreed =
    action === "confirm" && r.status === "alternative_accepted"
      ? alternative
      : undefined;
  const [destination, setDestination] = useState(
    agreed?.destinationFacilityId || r.destinationFacilityId,
  );
  const [service, setService] = useState(
    agreed?.serviceId || r.requestedServiceId,
  );
  const [doctor, setDoctor] = useState(
    agreed?.doctorId ||
      (action === "propose"
        ? state.doctors.find(
            (d) =>
              d.facilityId === r.destinationFacilityId &&
              d.serviceId === r.requestedServiceId &&
              d.available,
          )?.id
        : r.preferredDoctorId) ||
      "",
  );
  const [note, setNote] = useState(
    action === "propose"
      ? "Preferred doctor unavailable. Please coordinate the available alternative doctor."
      : "",
  );
  const [instructions, setInstructions] = useState(
    agreed?.instructions ||
      "Demo planned visit: contact the receiving desk to coordinate a time. Bring your referral reference; identity and registration details will be reviewed.",
  );
  const [verified, setVerified] = useState(false);
  const [registration, setRegistration] = useState(
    "No changes reported during this demo registration review.",
  );
  const [patientInstruction, setPatientInstruction] = useState(
    "Contact your referring facility to arrange your next planned follow-up.",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const needsNote = [
    "clarify",
    "resubmit",
    "decline",
    "cancel",
    "propose",
    "complete",
  ].includes(action);
  const needsPlan = ["propose", "confirm"].includes(action);
  return (
    <Modal
      title={
        (
          {
            clarify: "Request clarification",
            resubmit: "Add a clarification addendum",
            propose: "Propose an alternative plan",
            confirm: "Confirm receiving plan",
            arrive: "Verify identity before arrival",
            complete: "Complete visit and return information",
            decline: "Decline this referral",
            cancel: "Cancel this referral",
          } as Record<string, string>
        )[action]
      }
      onClose={onCancel}
    >
      <Notice>
        Fictional demo action only.{" "}
        {action === "arrive"
          ? "Opening a map or reaching a GPS boundary never verifies arrival."
          : "No real hospital message will be sent."}
      </Notice>
      {errors.save && <Notice tone="error">{errors.save}</Notice>}
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const issues: Record<string, string> = {};
          if (needsNote && note.trim().length < 3)
            issues.note = "Enter at least 3 characters.";
          if (needsPlan && instructions.trim().length < 3)
            issues.instructions = "Enter clear arrival or visit instructions.";
          if (action === "arrive" && !verified)
            issues.verified =
              "Confirm identity verification and review registration changes.";
          if (action === "arrive" && registration.trim().length < 3)
            issues.registration =
              "Record changes or explicitly state no changes.";
          if (action === "complete" && patientInstruction.trim().length < 3)
            issues.patientInstruction =
              "Enter a separate instruction for the patient.";
          setErrors(issues);
          if (Object.keys(issues).length) {
            setTimeout(
              () =>
                document
                  .getElementById(`action-${Object.keys(issues)[0]}`)
                  ?.focus(),
              0,
            );
            return;
          }
          let command: Command;
          switch (action) {
            case "propose":
              command = {
                type: "propose",
                referralId: r.id,
                destinationFacilityId: destination,
                serviceId: service,
                doctorId: doctor || undefined,
                instructions,
                reason: note,
              };
              break;
            case "confirm":
              command = {
                type: "confirm",
                referralId: r.id,
                serviceId: service,
                doctorId: doctor || undefined,
                instructions,
              };
              break;
            case "arrive":
              command = {
                type: "arrive",
                referralId: r.id,
                identityVerified: verified,
                changes: registration,
              };
              break;
            case "complete":
              command = {
                type: "complete",
                referralId: r.id,
                staffNote: note,
                patientInstruction,
              };
              break;
            case "resubmit":
              command = { type: "resubmit", referralId: r.id, text: note };
              break;
            default:
              command = {
                type: action as "clarify" | "decline" | "cancel",
                referralId: r.id,
                reason: note,
              };
          }
          if (!onSave(command))
            setErrors({
              save: "This action was not saved. Check the current status, doctor availability, and agreed plan. Review the updated record and try again.",
            });
        }}
      >
        {needsPlan && (
          <>
            <Select
              label="Receiving destination"
              value={destination}
              disabled={action === "confirm"}
              onChange={(e) => {
                setDestination(e.target.value);
                setDoctor("");
                if (
                  !state.facilities
                    .find((f) => f.id === e.target.value)
                    ?.services.includes(service)
                )
                  setService(
                    state.facilities.find((f) => f.id === e.target.value)!
                      .services[0],
                  );
              }}
            >
              {state.facilities
                .filter((f) => f.id !== r.originFacilityId)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
            </Select>
            <Select
              label="Receiving service"
              value={service}
              disabled={action === "confirm"}
              onChange={(e) => {
                setService(e.target.value);
                setDoctor("");
              }}
            >
              {state.services
                .filter((s) =>
                  state.facilities
                    .find((f) => f.id === destination)
                    ?.services.includes(s.id),
                )
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </Select>
            <Select
              label="Receiving doctor"
              value={doctor}
              disabled={action === "confirm"}
              onChange={(e) => setDoctor(e.target.value)}
            >
              <option value="">No specific doctor</option>
              {state.doctors
                .filter(
                  (d) =>
                    d.facilityId === destination && d.serviceId === service,
                )
                .map((d) => (
                  <option key={d.id} value={d.id} disabled={!d.available}>
                    {d.name}
                    {!d.available ? " · Unavailable" : ""}
                  </option>
                ))}
            </Select>
            {action === "confirm" &&
              doctor &&
              !state.doctors.find((d) => d.id === doctor)?.available && (
                <Notice tone="warning">
                  The preferred doctor is unavailable. Close this form and
                  propose an alternative for the referring facility to accept
                  first.
                </Notice>
              )}
            <Field
              label="Visit time or arrival instructions"
              error={errors.instructions}
            >
              <textarea
                className="resize-none"
                id="action-instructions"
                rows={4}
                required
                minLength={3}
                maxLength={3000}
                value={instructions}
                readOnly={!!agreed}
                aria-invalid={!!errors.instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </Field>
            {action === "propose" &&
              destination !== r.destinationFacilityId && (
                <Notice tone="warning">
                  Acceptance creates a linked replacement referral. Only the new
                  receiving facility can confirm it.
                </Notice>
              )}
          </>
        )}
        {needsNote && (
          <Field
            label={
              action === "complete"
                ? "Return / follow-up note for referring staff"
                : action === "resubmit"
                  ? "Clarification addendum"
                  : "Reason"
            }
            error={errors.note}
          >
            <textarea
              className="resize-none"
              id="action-note"
              required
              minLength={3}
              maxLength={3000}
              rows={4}
              value={note}
              aria-invalid={!!errors.note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
        )}
        {action === "arrive" && (
          <>
            <Field
              label="Missing or changed registration information"
              error={errors.registration}
            >
              <textarea
                className="resize-none"
                id="action-registration"
                rows={4}
                value={registration}
                aria-invalid={!!errors.registration}
                onChange={(e) => setRegistration(e.target.value)}
              />
            </Field>
            <label className="checkbox-label">
              <input
                id="action-verified"
                type="checkbox"
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
                aria-invalid={!!errors.verified}
              />{" "}
              I verified identity and reviewed missing or changed registration
              information.
            </label>
            {errors.verified && (
              <p className="field-error" role="alert">
                {errors.verified}
              </p>
            )}
          </>
        )}
        {action === "complete" && (
          <Field
            label="Separate patient follow-up instruction"
            error={errors.patientInstruction}
          >
            <textarea
              className="resize-none"
              id="action-patientInstruction"
              rows={4}
              value={patientInstruction}
              aria-invalid={!!errors.patientInstruction}
              onChange={(e) => setPatientInstruction(e.target.value)}
            />
          </Field>
        )}
        <div className="form-actions">
          <button type="button" className="button secondary" onClick={onCancel}>
            Keep current status
          </button>
          <button
            className={`button ${["cancel", "decline"].includes(action) ? "danger" : "primary"}`}
            type="submit"
          >
            {
              (
                {
                  clarify: "Request clarification",
                  resubmit: "Add information & resubmit",
                  propose: "Save proposed alternative",
                  confirm: "Confirm plan",
                  arrive: "Mark arrived",
                  complete: "Complete demo visit",
                  decline: "Decline referral",
                  cancel: "Cancel referral",
                } as Record<string, string>
              )[action]
            }
          </button>
        </div>
      </form>
    </Modal>
  );
}
