"use client";
import { ArrowRight, Check, Monitor, RotateCcw, X } from "lucide-react";
import type { AppState, DemoUser } from "@/lib/types";
import { StatusBadge } from "./ui";

export type GuidePhase = "explore" | "referral" | "arrival";

export function DemoGuide({
  state,
  actor,
  phase,
  selectedRef,
  editing,
  onNavigate,
  onPhase,
  onExit,
  onReset,
  presenting = false,
  onPresentation,
}: {
  state: AppState;
  actor: DemoUser;
  phase: GuidePhase;
  selectedRef?: string;
  editing: boolean;
  onNavigate: (actorId: string, referralId?: string) => void;
  onPhase: (phase: GuidePhase) => void;
  onExit: () => void;
  onReset: () => void;
  presenting?: boolean;
  onPresentation: () => void;
}) {
  let current = state.referrals.find((r) => r.id === "ref-1");
  const visited = new Set<string>();
  while (current?.linkedReplacementId && !visited.has(current.id)) {
    visited.add(current.id);
    const replacementId = current.linkedReplacementId;
    current = state.referrals.find((r) => r.id === replacementId);
  }
  if (!current) return null;
  const referral = current;
  const patient = state.users.find((u) => u.patientId === referral.patientId)!;
  const sender = state.users.find(
    (u) => u.facilityId === referral.originFacilityId,
  )!;
  const receiver = state.users.find(
    (u) => u.facilityId === referral.destinationFacilityId,
  )!;
  const ended = ["cancelled", "declined"].includes(referral.status);
  const unavailable = state.doctors.some(
    (d) => d.id === referral.preferredDoctorId && !d.available,
  );
  let step = 3;
  let title = "Hospital reviews the request";
  let instruction =
    "Choose Acknowledge referral. This records that receiving staff have started reviewing the request.";
  let target = receiver;
  if (phase === "explore" && referral.status === "draft") {
    step = 1;
    title = "Patient explores care facilities";
    instruction =
      "Try Use Demo Location and choose a facility. Browsing does not book a visit. When ready, continue to the health center.";
    target = sender;
  } else if (referral.status === "draft") {
    step = 2;
    title = "Health center prepares the referral";
    instruction =
      "Choose Review & submit draft, check the sharing acknowledgement, then review and submit the fictional information.";
    target = sender;
  } else if (referral.status === "acknowledged") {
    instruction = unavailable
      ? "The requested doctor is unavailable. Choose Propose alternative, then save the available doctor and instructions."
      : "Choose Confirm plan, review the instructions, and confirm. Changes to the requested doctor or service need an agreed alternative.";
  } else if (referral.status === "clarification_requested") {
    title = "Health center adds the missing information";
    instruction =
      "Choose Add clarification & resubmit. The hospital will review the additional information next.";
    target = sender;
  } else if (referral.status === "alternative_proposed") {
    title = "Health center accepts the alternative";
    instruction =
      "Review the proposed doctor, facility, and instructions. Choose Accept coordinated alternative to send the decision back to the hospital.";
    target = sender;
  } else if (referral.status === "alternative_accepted") {
    title = "Hospital confirms the agreed plan";
    instruction =
      "Choose Confirm plan and confirm the agreed instructions in the dialog. The patient can then see the confirmed destination.";
  } else if (referral.status === "confirmed" && phase !== "arrival") {
    step = 4;
    title = "Patient checks the confirmed plan";
    instruction =
      "Read the confirmed doctor and instructions. View route shows the destination; use Back to referral details to return here.";
    target = patient;
  } else if (referral.status === "confirmed" || referral.status === "arrived") {
    step = 5;
    title = "Hospital records arrival and follow-up";
    instruction =
      referral.status === "confirmed"
        ? "Choose Verify identity & arrival. Check the identity acknowledgement before marking arrival; opening a map never verifies arrival."
        : "Choose Complete visit & follow-up. Add a return note for staff and a separate instruction for the patient, then complete the visit.";
  } else if (referral.status === "completed") {
    step = 6;
    title = "Patient reviews the follow-up";
    instruction =
      "The visit is complete. Read the patient follow-up instruction. Referring staff can see their separate return note by switching to the health center.";
    target = patient;
  } else if (ended) {
    title = "This referral has ended";
    instruction =
      "This request was cancelled or declined. Review its history, or reset the fictional demo to try the full journey again.";
    target = patient;
  }
  const exploring = phase === "explore" && referral.status === "draft";
  const atTarget =
    actor.id === target.id && selectedRef === referral.id && !editing;
  const viewedPlan = atTarget && step === 4;
  const finished = atTarget && step === 6;
  const role =
    target.role === "patient"
      ? "Patient"
      : target.role === "health_center"
        ? "Health Center"
        : target.role === "hospital"
          ? "Hospital"
          : "Clinic";
  return (
    <section className="demo-guide" aria-label="Guided demo">
      <div className="guide-copy" aria-live="polite">
        <span className="eyebrow">
          {presenting ? "PITCH DEMO" : "GUIDED DEMO"} ·{" "}
          {ended ? "JOURNEY ENDED" : `STEP ${step} OF 6`} · ANA REYES
        </span>
        <div className="guide-reference">
          <span className="reference">{referral.reference}</span>
          <StatusBadge status={referral.status} />
          <span>Local demo · staff actions required</span>
        </div>
        <h2>{title}</h2>
        <p>{instruction}</p>
      </div>
      <div className="guide-controls">
        {ended ? (
          <button className="button secondary" onClick={onReset}>
            Reset demo journey
          </button>
        ) : finished ? (
          <span className="guide-complete">
            <Check size={18} /> Demo journey complete
          </span>
        ) : (
          <button
            className="button primary"
            disabled={editing}
            onClick={() => {
              if (viewedPlan) {
                onPhase("arrival");
                onNavigate(receiver.id, referral.id);
              } else if (atTarget && !exploring) {
                const actions = document.getElementById("referral-actions");
                actions?.scrollIntoView({
                  block: "center",
                  behavior: "instant",
                });
                (
                  actions?.querySelector<HTMLButtonElement>(
                    "button.button.primary",
                  ) || actions?.querySelector<HTMLButtonElement>("button")
                )?.focus();
              } else {
                if (exploring) onPhase("referral");
                onNavigate(target.id, referral.id);
              }
            }}
          >
            {viewedPlan
              ? "Next: record arrival"
              : atTarget && !exploring
                ? "Show available actions"
                : `Continue as ${role}`}
            <ArrowRight size={16} />
          </button>
        )}
        {editing && (
          <small>Finish or close the referral form to continue.</small>
        )}
        <div className="guide-utilities">
          <button
            className="text-button"
            aria-pressed={presenting}
            onClick={onPresentation}
          >
            <Monitor size={15} />
            {presenting ? "Standard view" : "Presentation view"}
          </button>
          <button className="text-button" onClick={onReset}>
            <RotateCcw size={15} /> Restart rehearsal
          </button>
          <button className="text-button" onClick={onExit}>
            <X size={15} /> Exit guide
          </button>
        </div>
      </div>
    </section>
  );
}
