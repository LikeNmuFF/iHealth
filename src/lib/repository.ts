import type {
  AppState,
  DemoUser,
  Patient,
  Referral,
  ReferralInput,
  ReferralStatus,
} from "./types";

export class DemoError extends Error {}
function requireValue(value: unknown, message: string): asserts value {
  if (!value) throw new DemoError(message);
}
const active: ReferralStatus[] = [
  "draft",
  "submitted",
  "acknowledged",
  "clarification_requested",
  "resubmitted",
  "alternative_proposed",
  "alternative_accepted",
  "confirmed",
];
export function actorFrom(state: AppState, id: string) {
  const actor = state.users.find((u) => u.id === id);
  requireValue(actor, "Choose a valid demo persona.");
  return actor;
}
export function visibleReferrals(state: AppState, actor: DemoUser) {
  const valid = actorFrom(state, actor.id);
  return state.referrals.filter((r) =>
    valid.role === "patient"
      ? r.patientId === valid.patientId
      : r.originFacilityId === valid.facilityId ||
        (r.status !== "draft" && r.destinationFacilityId === valid.facilityId),
  );
}
export function visiblePatients(state: AppState, actor: DemoUser) {
  const valid = actorFrom(state, actor.id);
  const refs = visibleReferrals(state, valid);
  return state.patients.filter((p) =>
    valid.role === "patient"
      ? p.id === valid.patientId
      : p.homeFacilityId === valid.facilityId ||
        refs.some((r) => r.patientId === p.id),
  );
}
export function visibleNotifications(state: AppState, actor: DemoUser) {
  const valid = actorFrom(state, actor.id);
  return state.notifications.filter((n) =>
    valid.role === "patient"
      ? n.patientId === valid.patientId
      : n.facilityId === valid.facilityId,
  );
}
export type Command =
  | { type: "submit"; input: ReferralInput; draftId?: string }
  | { type: "acknowledge"; referralId: string }
  | { type: "clarify"; referralId: string; reason: string }
  | { type: "resubmit"; referralId: string; text: string }
  | {
      type: "propose";
      referralId: string;
      destinationFacilityId: string;
      serviceId: string;
      doctorId?: string;
      instructions: string;
      reason: string;
    }
  | { type: "accept_alternative"; referralId: string }
  | {
      type: "confirm";
      referralId: string;
      serviceId: string;
      doctorId?: string;
      instructions: string;
    }
  | { type: "decline" | "cancel"; referralId: string; reason: string }
  | {
      type: "arrive";
      referralId: string;
      identityVerified: boolean;
      changes: string;
    }
  | {
      type: "complete";
      referralId: string;
      staffNote: string;
      patientInstruction: string;
    }
  | {
      type: "create_patient";
      name: string;
      birthDate: string;
      address: string;
      contactPreference: string;
    }
  | {
      type: "availability";
      serviceId: string;
      status: "accepting" | "not_accepting" | "unknown";
    }
  | { type: "read_notification"; notificationId: string };

const receivers = {
  acknowledge: ["submitted", "resubmitted"],
  clarify: ["submitted", "acknowledged"],
  propose: ["acknowledged"],
  confirm: ["acknowledged", "alternative_accepted"],
  decline: [
    "submitted",
    "acknowledged",
    "alternative_proposed",
    "alternative_accepted",
  ],
  arrive: ["confirmed"],
  complete: ["arrived"],
} as const;
export function canAct(ref: Referral, actor: DemoUser, type: string) {
  if (type === "cancel")
    return (
      active.includes(ref.status) &&
      !ref.linkedReplacementId &&
      (actor.role === "patient"
        ? actor.patientId === ref.patientId
        : [ref.originFacilityId, ref.destinationFacilityId].includes(
            actor.facilityId || "",
          ))
    );
  if (actor.role === "patient") return false;
  if (type === "submit")
    return ref.status === "draft" && ref.originFacilityId === actor.facilityId;
  if (type === "resubmit")
    return (
      ref.status === "clarification_requested" &&
      ref.originFacilityId === actor.facilityId
    );
  if (type === "accept_alternative")
    return (
      ref.status === "alternative_proposed" &&
      ref.originFacilityId === actor.facilityId
    );
  const states = receivers[type as keyof typeof receivers] as
    readonly string[] | undefined;
  return (
    actor.facilityId === ref.destinationFacilityId &&
    !!states?.includes(ref.status) &&
    !ref.linkedReplacementId
  );
}
function text(value: string, label: string) {
  requireValue(
    value.trim().length >= 3 && value.length <= 3000,
    `${label} must contain 3–3000 characters.`,
  );
  return value.trim();
}
function eligible(
  state: AppState,
  facilityId: string,
  serviceId: string,
  doctorId?: string,
  confirm = false,
) {
  const f = state.facilities.find((f) => f.id === facilityId);
  requireValue(
    f?.services.includes(serviceId),
    "This facility does not provide the selected service.",
  );
  if (doctorId) {
    const d = state.doctors.find((d) => d.id === doctorId);
    requireValue(
      d && d.facilityId === facilityId && d.serviceId === serviceId,
      "Choose a doctor for this facility and service.",
    );
    if (confirm)
      requireValue(
        d.available,
        "This preferred doctor is unavailable. Coordinate an alternative first.",
      );
  }
}

export function execute(
  state: AppState,
  actorId: string,
  command: Command,
  now = new Date(),
): AppState {
  const actor = actorFrom(state, actorId);
  const next = structuredClone(state);
  const stamp = now.toISOString();
  const id = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
  const event = (
    r: Referral,
    status: ReferralStatus,
    message: string,
    reason?: string,
  ) => {
    r.status = status;
    r.updatedAt = stamp;
    next.events.push({
      id: id("evt"),
      referralId: r.id,
      status,
      message,
      reason,
      actorId: actor.id,
      facilityId: actor.facilityId,
      createdAt: stamp,
    });
    next.notifications.push(
      {
        id: id("np"),
        referralId: r.id,
        patientId: r.patientId,
        message,
        createdAt: stamp,
        read: false,
      },
      ...Array.from(new Set([r.originFacilityId, r.destinationFacilityId])).map(
        (facilityId) => ({
          id: id("nf"),
          referralId: r.id,
          facilityId,
          message: `${r.reference}: ${message}`,
          createdAt: stamp,
          read: false,
        }),
      ),
    );
  };
  const makeReferral = (
    patientId: string,
    originFacilityId: string,
    destinationFacilityId: string,
    requestedServiceId: string,
    preferredDoctorId?: string,
  ): Referral => {
    const n =
      Math.max(
        0,
        ...next.referrals.map((r) => Number(r.reference.split("-").at(-1))),
      ) + 1;
    return {
      id: id("ref"),
      reference: `DEMO-REF-${String(n).padStart(4, "0")}`,
      patientId,
      originFacilityId,
      destinationFacilityId,
      requestedServiceId,
      preferredDoctorId,
      status: "draft",
      createdAt: stamp,
      updatedAt: stamp,
    };
  };
  if (command.type === "submit") {
    requireValue(
      actor.role !== "patient" && actor.facilityId,
      "Only demo facility staff can submit clinical referral information.",
    );
    const i = command.input;
    if (
      next.referrals.some(
        (r) =>
          r.submissionKey === i.submissionKey &&
          r.originFacilityId === actor.facilityId,
      )
    )
      return state;
    requireValue(i.submissionKey.length > 0, "Missing submission reference.");
    const patient = visiblePatients(state, actor).find(
      (p) => p.id === i.patientId,
    );
    requireValue(patient, "This patient is outside your demo facility scope.");
    requireValue(
      i.destinationFacilityId !== actor.facilityId,
      "Choose a different receiving facility.",
    );
    eligible(
      state,
      i.destinationFacilityId,
      i.requestedServiceId,
      i.preferredDoctorId,
    );
    requireValue(
      i.reviewed,
      "Review the fictional information before sharing.",
    );
    const r = command.draftId
      ? next.referrals.find((r) => r.id === command.draftId)
      : makeReferral(
          i.patientId,
          actor.facilityId,
          i.destinationFacilityId,
          i.requestedServiceId,
          i.preferredDoctorId,
        );
    requireValue(
      r && canAct(r, actor, "submit"),
      "This draft cannot be submitted by this facility or has already been submitted.",
    );
    requireValue(
      r.patientId === i.patientId,
      "Draft patient cannot be changed.",
    );
    Object.assign(r, {
      destinationFacilityId: i.destinationFacilityId,
      requestedServiceId: i.requestedServiceId,
      preferredDoctorId: i.preferredDoctorId,
      submissionKey: i.submissionKey,
      submittedSnapshotId: id("snapshot"),
    });
    next.snapshots.push({
      id: r.submittedSnapshotId!,
      referralId: r.id,
      patient: structuredClone(patient),
      reason: text(i.reason, "Referral reason"),
      history: text(i.history, "Relevant history"),
      allergies: text(i.allergies, "Allergies"),
      medications: text(i.medications, "Medications"),
      requestedServiceId: i.requestedServiceId,
      preferredDoctorId: i.preferredDoctorId,
      submittedAt: stamp,
    });
    if (!command.draftId) next.referrals.push(r);
    event(
      r,
      "submitted",
      "Your referring facility submitted information in this local demo. The receiving facility has not confirmed a plan.",
    );
  } else if (command.type === "create_patient") {
    requireValue(
      actor.role !== "patient" && actor.facilityId,
      "Only staff can create fictional patients.",
    );
    requireValue(
      /^\d{4}-\d{2}-\d{2}$/.test(command.birthDate) &&
        !Number.isNaN(Date.parse(command.birthDate)) &&
        Date.parse(command.birthDate) <= now.getTime(),
      "Enter a valid birth date in the past.",
    );
    const patient: Patient = {
      id: `DEMO-P${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      name: text(command.name, "Fictional name"),
      birthDate: command.birthDate,
      address: text(command.address, "Demo address"),
      contactPreference: text(command.contactPreference, "Contact preference"),
      homeFacilityId: actor.facilityId,
      isDemo: true,
    };
    next.patients.push(patient);
    next.users.push({
      id: `user-${patient.id}`,
      name: patient.name,
      role: "patient",
      patientId: patient.id,
    });
  } else if (command.type === "availability") {
    requireValue(
      actor.role !== "patient" && actor.facilityId,
      "Only staff can update reported availability.",
    );
    const f = next.facilities.find((f) => f.id === actor.facilityId)!;
    requireValue(
      f.services.includes(command.serviceId),
      "Service is outside this facility.",
    );
    f.serviceAvailability = f.serviceAvailability.filter(
      (a) => a.serviceId !== command.serviceId,
    );
    f.serviceAvailability.push({
      serviceId: command.serviceId,
      status: command.status,
      updatedAt: stamp,
    });
  } else if (command.type === "read_notification") {
    requireValue(
      visibleNotifications(state, actor).some(
        (n) => n.id === command.notificationId,
      ),
      "Notification is outside your demo scope.",
    );
    next.notifications.find((n) => n.id === command.notificationId)!.read =
      true;
  } else {
    const r = next.referrals.find((r) => r.id === command.referralId);
    requireValue(r, "Referral not found.");
    requireValue(
      canAct(r, actor, command.type),
      "This action is unavailable for this referral status or demo facility.",
    );
    switch (command.type) {
      case "acknowledge":
        event(
          r,
          "acknowledged",
          "The receiving facility is reviewing your referral.",
        );
        break;
      case "clarify":
        event(
          r,
          "clarification_requested",
          "Your referring facility is coordinating additional information.",
          text(command.reason, "Clarification request"),
        );
        break;
      case "resubmit":
        next.addenda.push({
          id: id("addendum"),
          referralId: r.id,
          text: text(command.text, "Clarification addendum"),
          actorId: actor.id,
          createdAt: stamp,
        });
        event(
          r,
          "resubmitted",
          "Your referring facility added the requested information.",
        );
        break;
      case "propose":
        eligible(
          next,
          command.destinationFacilityId,
          command.serviceId,
          command.doctorId,
          true,
        );
        requireValue(
          command.destinationFacilityId !== r.originFacilityId,
          "Choose a receiving destination other than the referring facility.",
        );
        next.alternatives.push({
          id: id("alt"),
          referralId: r.id,
          destinationFacilityId: command.destinationFacilityId,
          serviceId: command.serviceId,
          doctorId: command.doctorId,
          instructions: text(command.instructions, "Proposed instructions"),
          reason: text(command.reason, "Alternative reason"),
          createdAt: stamp,
        });
        event(
          r,
          "alternative_proposed",
          "The receiving facility proposed an alternative. Your referring facility will coordinate acceptance.",
          command.reason.trim(),
        );
        break;
      case "accept_alternative": {
        const proposal = next.alternatives
          .filter((a) => a.referralId === r.id)
          .at(-1);
        requireValue(proposal, "Alternative proposal not found.");
        proposal.acceptedAt = stamp;
        event(
          r,
          "alternative_accepted",
          "Your referring facility accepted the alternative. Receiving confirmation is still required.",
        );
        if (proposal.destinationFacilityId !== r.destinationFacilityId) {
          const replacement = makeReferral(
            r.patientId,
            r.originFacilityId,
            proposal.destinationFacilityId,
            proposal.serviceId,
            proposal.doctorId,
          );
          replacement.replacesReferralId = r.id;
          r.linkedReplacementId = replacement.id;
          const original = next.snapshots.find(
            (s) => s.id === r.submittedSnapshotId,
          );
          requireValue(original, "Submitted information missing.");
          replacement.submittedSnapshotId = id("snapshot");
          next.snapshots.push({
            ...structuredClone(original),
            id: replacement.submittedSnapshotId,
            referralId: replacement.id,
            requestedServiceId: proposal.serviceId,
            preferredDoctorId: proposal.doctorId,
            submittedAt: stamp,
          });
          next.referrals.push(replacement);
          next.addenda.push({
            id: id("addendum"),
            referralId: replacement.id,
            text: `Linked alternative: ${proposal.reason}. ${proposal.instructions}`,
            actorId: actor.id,
            createdAt: stamp,
          });
          event(
            replacement,
            "submitted",
            "A linked replacement referral requires review by the new receiving facility.",
          );
        }
        break;
      }
      case "confirm": {
        const proposal = next.alternatives
          .filter((a) => a.referralId === r.id)
          .at(-1);
        if (r.status === "alternative_accepted") {
          requireValue(
            proposal?.acceptedAt &&
              proposal.destinationFacilityId === r.destinationFacilityId,
            "A different destination requires its own receiving acceptance.",
          );
          requireValue(
            command.serviceId === proposal.serviceId &&
              command.doctorId === proposal.doctorId &&
              command.instructions.trim() === proposal.instructions,
            "Confirm the agreed alternative exactly, or coordinate a new proposal.",
          );
        } else {
          requireValue(
            command.serviceId === r.requestedServiceId &&
              command.doctorId === r.preferredDoctorId,
            "Changes to the requested service or doctor require an accepted alternative.",
          );
        }
        eligible(
          next,
          r.destinationFacilityId,
          command.serviceId,
          command.doctorId,
          true,
        );
        r.confirmedPlan = {
          serviceId: command.serviceId,
          doctorId: command.doctorId,
          instructions: text(command.instructions, "Arrival instructions"),
          confirmedAt: stamp,
        };
        event(
          r,
          "confirmed",
          "Your receiving facility has confirmed the plan in this local demo. Review your instructions.",
        );
        break;
      }
      case "decline":
        event(
          r,
          "declined",
          "The receiving facility declined this request. Contact your referring facility for next steps.",
          text(command.reason, "Decline reason"),
        );
        break;
      case "cancel":
        event(
          r,
          "cancelled",
          "This referral was cancelled. Contact your referring facility if you need a new plan.",
          text(command.reason, "Cancellation reason"),
        );
        break;
      case "arrive":
        requireValue(
          command.identityVerified,
          "Verify identity and review registration changes before marking arrival.",
        );
        next.verifications.push({
          id: id("verify"),
          referralId: r.id,
          identityVerified: true,
          changes: text(command.changes, "Registration review"),
          actorId: actor.id,
          createdAt: stamp,
        });
        event(
          r,
          "arrived",
          "Receiving staff verified identity and recorded your arrival.",
        );
        break;
      case "complete":
        next.returnNotes.push({
          id: id("return"),
          referralId: r.id,
          staffNote: text(command.staffNote, "Return note"),
          patientInstruction: text(
            command.patientInstruction,
            "Patient instruction",
          ),
          actorId: actor.id,
          createdAt: stamp,
        });
        event(
          r,
          "completed",
          "Your demo visit is complete. Review your follow-up instructions.",
        );
        break;
    }
  }
  next.revision = state.revision + 1;
  return next;
}
