import { Check, Clock3, MessageSquare, UserRound } from "lucide-react";
import { dateTime } from "@/lib/config";
import type { AppState, Referral } from "@/lib/types";

export function DoctorPlan({
  state,
  referral,
}: {
  state: AppState;
  referral: Referral;
}) {
  const snapshot = state.snapshots.find(
    (s) => s.id === referral.submittedSnapshotId,
  );
  const requestedId = snapshot?.preferredDoctorId ?? referral.preferredDoctorId;
  const requested = state.doctors.find((d) => d.id === requestedId);
  const proposal = state.alternatives
    .filter((p) => p.referralId === referral.id)
    .at(-1);
  const proposed = state.doctors.find((d) => d.id === proposal?.doctorId);
  const confirmed = ["confirmed", "arrived", "completed"].includes(
    referral.status,
  )
    ? referral.confirmedPlan
    : undefined;
  const receiving = state.doctors.find((d) => d.id === confirmed?.doctorId);
  const ended = ["cancelled", "declined"].includes(referral.status);
  return (
    <section className="panel doctor-plan" aria-label="Doctor coordination">
      <div className="section-heading">
        <div>
          <span className="eyebrow">REQUEST → COORDINATION → CONFIRMATION</span>
          <h2>Doctor coordination</h2>
        </div>
        <span className="badge neutral">Fictional doctors</span>
      </div>
      <ol className="doctor-plan-stages">
        <li>
          <span className="doctor-stage-icon">
            <UserRound size={22} />
          </span>
          <div>
            <span className="doctor-stage-label">Requested doctor</span>
            <h3>{requested?.name || "No preferred doctor requested"}</h3>
            <p>
              {
                state.facilities.find(
                  (f) => f.id === referral.destinationFacilityId,
                )?.name
              }
            </p>
            <span
              className={`badge ${requested && !requested.available ? "status-alternative_proposed" : "neutral"}`}
            >
              {requested && !requested.available
                ? "Unavailable in demo fixture"
                : "Preference only"}
            </span>
            <small>
              The original request stays in the submitted information.
            </small>
          </div>
        </li>
        <li className={proposal ? "has-proposal" : ""}>
          <span className="doctor-stage-icon">
            <MessageSquare size={22} />
          </span>
          <div>
            <span className="doctor-stage-label">Coordinated alternative</span>
            <h3>
              {proposal
                ? proposed?.name || "Alternative service / facility"
                : "No alternative proposed"}
            </h3>
            <p>
              {proposal
                ? state.facilities.find(
                    (f) => f.id === proposal.destinationFacilityId,
                  )?.name
                : "Receiving staff can propose another doctor, service, time, or destination."}
            </p>
            <span
              className={`badge ${proposal?.acceptedAt ? "success" : "neutral"}`}
            >
              {proposal?.acceptedAt ? (
                <>
                  <Check size={13} /> Accepted by referring staff
                </>
              ) : proposal ? (
                "Awaiting referring staff"
              ) : (
                "If a change is needed"
              )}
            </span>
            {proposal && <small>{proposal.reason}</small>}
          </div>
        </li>
        <li className={confirmed ? "is-confirmed" : ""}>
          <span className="doctor-stage-icon">
            {confirmed ? <Check size={22} /> : <Clock3 size={22} />}
          </span>
          <div>
            <span className="doctor-stage-label">Receiving confirmation</span>
            <h3>
              {confirmed
                ? receiving?.name || "No named doctor confirmed"
                : ended
                  ? "This request has ended"
                  : "Not confirmed yet"}
            </h3>
            <p>
              {confirmed
                ? confirmed.instructions
                : referral.linkedReplacementId
                  ? "The new receiving facility must review and confirm the linked replacement."
                  : ended
                    ? "A new plan needs a new coordinated request."
                    : "Receiving staff must confirm the agreed plan before travel is arranged."}
            </p>
            <span className={`badge ${confirmed ? "success" : "neutral"}`}>
              {confirmed
                ? "Confirmed by receiving staff"
                : "No confirmed doctor assignment"}
            </span>
            {confirmed && (
              <small>
                {dateTime(confirmed.confirmedAt)} · Asia/Manila · local demo
                action
              </small>
            )}
          </div>
        </li>
      </ol>
    </section>
  );
}
