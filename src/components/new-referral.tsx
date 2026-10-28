"use client";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileCheck,
  Send,
  UserPlus,
} from "lucide-react";
import {
  facilityAvailability,
  availabilityLabel,
  haversine,
} from "@/lib/facilities";
import { visiblePatients, type Command } from "@/lib/repository";
import type { AppState, DemoUser, Referral, ReferralInput } from "@/lib/types";
import { Field, Modal, Notice, Select } from "./ui";

export function NewReferral({
  state,
  actor,
  draft,
  onCancel,
  onSave,
  onDirty,
}: {
  state: AppState;
  actor: DemoUser;
  draft?: Referral;
  onCancel: () => void;
  onSave: (c: Command) => boolean;
  onDirty: (value: boolean) => void;
}) {
  const patients = visiblePatients(state, actor);
  const origin = state.facilities.find((f) => f.id === actor.facilityId)!;
  const [patientId, setPatient] = useState(
    draft?.patientId || patients[0]?.id || "",
  );
  const [destination, setDestination] = useState(
    draft?.destinationFacilityId || "hospital-a",
  );
  const [service, setService] = useState(
    draft?.requestedServiceId || "general",
  );
  const [doctor, setDoctor] = useState(draft?.preferredDoctorId || "");
  const [reason, setReason] = useState(
    "Fictional planned consultation requested following a demo clinician assessment.",
  );
  const [history, setHistory] = useState(
    "Fictional history reviewed at the referring facility; no actual patient records.",
  );
  const [allergies, setAllergies] = useState("Not recorded");
  const [medications, setMedications] = useState("Not recorded");
  const [reviewed, setReviewed] = useState(false);
  const [review, setReview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newPatient, setNewPatient] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [submissionKey] = useState(() => crypto.randomUUID());
  const busy = useRef(false);
  const change = () => {
    setDirty(true);
    onDirty(true);
  };
  const patient = patients.find((p) => p.id === patientId);
  const receiving = state.facilities.find((f) => f.id === destination);
  const input: ReferralInput = {
    patientId,
    destinationFacilityId: destination,
    requestedServiceId: service,
    preferredDoctorId: doctor || undefined,
    reason,
    history,
    allergies,
    medications,
    reviewed,
    submissionKey,
  };
  return (
    <section className="new-referral">
      <button
        className="text-button"
        onClick={() => (dirty ? setDiscard(true) : onCancel())}
      >
        <ArrowLeft size={17} /> Back to referrals
      </button>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            {draft?.reference || "NEW LOCAL DEMO REFERRAL"}
          </div>
          <h1>{review ? "Review referral" : "Prepare referral"}</h1>
          <p>From {origin.name} · fictional information only</p>
        </div>
        <span className="badge neutral">
          {review ? "2 · Review & share" : "1 · Prepare information"}
        </span>
      </div>
      <Notice tone="warning">
        Use fictional information only. This browser prototype has no production
        authentication or hospital connection. Review acknowledgement is a demo
        step, not a claim of legal compliance.
      </Notice>
      {review ? (
        <div className="panel review-panel">
          <h2>
            <FileCheck size={21} /> Review referral information
          </h2>
          <dl className="info-list">
            <div>
              <dt>Fictional patient</dt>
              <dd>
                {patient?.name} · {patientId} · {patient?.birthDate}
              </dd>
            </div>
            <div>
              <dt>Contact preference</dt>
              <dd>{patient?.contactPreference}</dd>
            </div>
            <div>
              <dt>Requested destination</dt>
              <dd>
                {receiving?.name} ·{" "}
                {state.services.find((s) => s.id === service)?.name}
              </dd>
            </div>
            <div>
              <dt>Preferred doctor request</dt>
              <dd>
                {state.doctors.find((d) => d.id === doctor)?.name ||
                  "No preference"}{" "}
                · subject to receiving confirmation
              </dd>
            </div>
            <div>
              <dt>Reason</dt>
              <dd>{reason}</dd>
            </div>
            <div>
              <dt>Relevant history</dt>
              <dd>{history}</dd>
            </div>
            <div>
              <dt>Allergies</dt>
              <dd>{allergies}</dd>
            </div>
            <div>
              <dt>Medications</dt>
              <dd>{medications}</dd>
            </div>
          </dl>
          <Notice>
            Submission creates an immutable snapshot and local in-app
            notifications. No real referral is delivered.
          </Notice>
          <div className="form-actions">
            <button
              className="button secondary"
              onClick={() => setReview(false)}
            >
              <ArrowLeft size={16} /> Edit information
            </button>
            <button
              className="button primary"
              onClick={() => {
                if (busy.current) return;
                busy.current = true;
                if (onSave({ type: "submit", input, draftId: draft?.id })) {
                  onDirty(false);
                  onCancel();
                }
                busy.current = false;
              }}
            >
              <Send size={16} /> Submit local demo referral
            </button>
          </div>
        </div>
      ) : (
        <form
          noValidate
          onChange={change}
          onSubmit={(e) => {
            e.preventDefault();
            const next: Record<string, string> = {};
            if (!patient)
              next.patient = "Choose a patient in your facility scope.";
            if (
              !receiving ||
              destination === origin.id ||
              !receiving.services.includes(service)
            )
              next.destination =
                "Choose another facility providing this service.";
            for (const [key, value] of Object.entries({
              reason,
              history,
              allergies,
              medications,
            }))
              if (value.trim().length < 3)
                next[key] =
                  "Enter at least 3 characters. Use “Not recorded” when information is missing.";
            if (!reviewed)
              next.reviewed = "Review the information and acknowledge sharing.";
            setErrors(next);
            if (Object.keys(next).length) {
              setTimeout(
                () =>
                  document
                    .getElementById(`new-${Object.keys(next)[0]}`)
                    ?.focus(),
                0,
              );
              return;
            }
            setReview(true);
            window.scrollTo({ top: 0, behavior: "instant" });
          }}
        >
          <div className="detail-columns">
            <div className="detail-main">
              <section className="panel">
                <div className="section-heading">
                  <h2>
                    <span className="section-number">1</span> Fictional patient
                  </h2>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setNewPatient(true)}
                  >
                    <UserPlus size={15} /> New demo patient
                  </button>
                </div>
                <Select
                  id="new-patient"
                  label="Select patient"
                  value={patientId}
                  disabled={!!draft}
                  aria-invalid={!!errors.patient}
                  onChange={(e) => setPatient(e.target.value)}
                >
                  <option value="">Select fictional patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.id}
                    </option>
                  ))}
                </Select>
                {errors.patient && (
                  <p className="field-error">{errors.patient}</p>
                )}
                {patient && (
                  <div className="patient-demographics">
                    <span className="avatar">
                      {patient.name
                        .split(" ")
                        .map((s) => s[0])
                        .join("")}
                    </span>
                    <div>
                      <strong>{patient.name}</strong>
                      <p>
                        {patient.id} · Born {patient.birthDate}
                      </p>
                      <p>{patient.address}</p>
                      <small>{patient.contactPreference}</small>
                    </div>
                  </div>
                )}
              </section>
              <section className="panel">
                <h2>
                  <span className="section-number">2</span> Clinician-entered
                  information
                </h2>
                <Field label="Reason for referral" error={errors.reason}>
                  <textarea
                    className="resize-none"
                    id="new-reason"
                    rows={4}
                    maxLength={3000}
                    required
                    value={reason}
                    aria-invalid={!!errors.reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </Field>
                <Field label="Concise relevant history" error={errors.history}>
                  <textarea
                    className="resize-none"
                    id="new-history"
                    rows={4}
                    maxLength={3000}
                    required
                    value={history}
                    aria-invalid={!!errors.history}
                    onChange={(e) => setHistory(e.target.value)}
                  />
                </Field>
                <div className="form-grid">
                  <Field
                    label="Allergies"
                    error={errors.allergies}
                    hint="“None” means explicitly reviewed; “Not recorded” means missing."
                  >
                    <input
                      id="new-allergies"
                      value={allergies}
                      maxLength={3000}
                      aria-invalid={!!errors.allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                    />
                  </Field>
                  <Field label="Medications" error={errors.medications}>
                    <input
                      id="new-medications"
                      value={medications}
                      maxLength={3000}
                      aria-invalid={!!errors.medications}
                      onChange={(e) => setMedications(e.target.value)}
                    />
                  </Field>
                </div>
              </section>
            </div>
            <aside>
              <section className="panel">
                <h2>
                  <span className="section-number">3</span> Requested care
                </h2>
                <Select
                  label="Requested service"
                  value={service}
                  onChange={(e) => {
                    setService(e.target.value);
                    setDoctor("");
                  }}
                >
                  {state.services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
                <Select
                  id="new-destination"
                  label="Eligible destination"
                  value={
                    receiving?.services.includes(service) ? destination : ""
                  }
                  aria-invalid={!!errors.destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    setDoctor("");
                  }}
                >
                  <option value="">Choose a destination</option>
                  {state.facilities
                    .filter(
                      (f) => f.id !== origin.id && f.services.includes(service),
                    )
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ·{" "}
                        {availabilityLabel(facilityAvailability(f, service))} ·{" "}
                        {haversine(origin.coordinates, f.coordinates).toFixed(
                          1,
                        )}{" "}
                        km straight-line
                      </option>
                    ))}
                </Select>
                {errors.destination && (
                  <p className="field-error">{errors.destination}</p>
                )}
                <p className="small muted">
                  Distance is between fictional facility coordinates. It does
                  not determine clinical suitability. Availability is
                  staff-reported and does not confirm a referral.
                </p>
                <Select
                  label="Preferred doctor (request only)"
                  value={doctor}
                  onChange={(e) => setDoctor(e.target.value)}
                >
                  <option value="">No preference</option>
                  {state.doctors
                    .filter(
                      (d) =>
                        d.facilityId === destination && d.serviceId === service,
                    )
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                        {!d.available ? " · Currently unavailable" : ""}
                      </option>
                    ))}
                </Select>
                {doctor &&
                  !state.doctors.find((d) => d.id === doctor)?.available && (
                    <Notice tone="warning">
                      Preferred doctor is unavailable in the fixture. Receiving
                      staff must coordinate an alternative before confirmation.
                    </Notice>
                  )}
              </section>
              <section className="panel">
                <label className="checkbox-label">
                  <input
                    id="new-reviewed"
                    type="checkbox"
                    checked={reviewed}
                    aria-invalid={!!errors.reviewed}
                    onChange={(e) => setReviewed(e.target.checked)}
                  />
                  <span>
                    I reviewed this fictional information and the requested
                    destination before sharing within the demo.
                  </span>
                </label>
                {errors.reviewed && (
                  <p className="field-error" role="alert">
                    {errors.reviewed}
                  </p>
                )}
                <button className="button primary full" type="submit">
                  Review referral <ArrowRight size={16} />
                </button>
              </section>
            </aside>
          </div>
        </form>
      )}
      {discard && (
        <Modal
          title="Discard unsaved referral changes?"
          onClose={() => setDiscard(false)}
        >
          <p>
            Your unsaved form changes will be lost. Existing referral records
            are kept.
          </p>
          <div className="form-actions">
            <button
              className="button secondary"
              onClick={() => setDiscard(false)}
            >
              Keep editing
            </button>
            <button
              className="button danger"
              onClick={() => {
                onDirty(false);
                onCancel();
              }}
            >
              Discard changes
            </button>
          </div>
        </Modal>
      )}
      {newPatient && (
        <NewPatient
          onClose={() => setNewPatient(false)}
          onSave={(command) => {
            if (onSave(command)) {
              setNewPatient(false);
              change();
            }
          }}
        />
      )}
    </section>
  );
}

export function NewPatient({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (command: Command) => void;
}) {
  const [error, setError] = useState("");
  return (
    <Modal title="Create a fictional demo patient" onClose={onClose}>
      <Notice tone="warning">Do not enter a real person’s information.</Notice>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const values = new FormData(e.currentTarget);
          const name = String(values.get("name") || ""),
            birthDate = String(values.get("birthDate") || ""),
            address = String(values.get("address") || ""),
            contactPreference = String(values.get("contactPreference") || "");
          if (
            name.trim().length < 3 ||
            !birthDate ||
            address.trim().length < 3 ||
            contactPreference.trim().length < 3
          ) {
            setError("Complete each field using fictional information.");
            e.currentTarget.querySelector<HTMLInputElement>("input")?.focus();
            return;
          }
          onSave({
            type: "create_patient",
            name,
            birthDate,
            address,
            contactPreference,
          });
        }}
      >
        <Field label="Fictional full name">
          <input name="name" required maxLength={100} />
        </Field>
        <Field label="Date of birth">
          <input
            name="birthDate"
            type="date"
            required
            max={new Date().toISOString().slice(0, 10)}
          />
        </Field>
        <Field label="Fictional address label">
          <input
            name="address"
            defaultValue="Demo household · Isabela City"
            maxLength={200}
          />
        </Field>
        <Field label="Contact preference">
          <input
            name="contactPreference"
            defaultValue="In-app demo updates"
            maxLength={200}
          />
        </Field>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="form-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="button primary">
            <Check size={16} /> Create demo patient
          </button>
        </div>
      </form>
    </Modal>
  );
}
