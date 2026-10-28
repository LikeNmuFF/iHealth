# A 3–4 minute demonstration

## Pitch presentation mode

For the pitch, choose **Start pitch demo** on the opening screen. This uses the existing guided journey with larger desktop text and a wider workspace. The guide keeps Ana's reference, actual status, next action, and **Restart rehearsal** visible. **Standard view** switches back to the normal layout without changing any records; **Presentation view** enables it again. Phones keep their normal navigation and stacked cards.

Use **Doctor coordination** as the central moment: show the original unavailable preferred doctor, the hospital's proposed alternative, referring-staff acceptance, then the receiving confirmation. Changing views does not approve anything. Use the normal action buttons to make each transition. **Restart rehearsal** requires confirmation before restoring fixtures and returning Presenter Mode to the first step.

A silent backup recording is saved as `docs/pitch/backup-demo.webm`. It shows real local demo actions, including staff confirmation, identity verification, and follow-up. Its map tiles are explicitly disabled using the presentation simulation; distances remain honestly labeled. This is not a live hospital delivery or narrated promotional video. To recreate it with a production server running, use `node scripts/record-pitch.mjs`; set `PITCH_BASE_URL` if using another local port.

## Recommended: use the guided demo

Choose **Start guided demo** on the opening screen. The guide stays above the workspace, explains the current step, and opens the correct person and referral when you choose **Continue as…**. You still review and confirm each workflow action yourself. Starting the guide keeps existing fictional changes; use Demo settings → Reset Demo for a fresh run.

1. **Patient explores:** try Use Demo Location, then Continue as Health Center.
2. **Health center prepares:** review and submit Ana’s draft.
3. **Teams coordinate:** continue as Hospital, acknowledge, and propose the available doctor. Continue as Health Center to accept, then Hospital to confirm.
4. **Patient reviews:** continue as Patient to show confirmed instructions and optional directions. Back to referral details returns to the same record.
5. **Hospital records the visit:** Next: record arrival opens the hospital record. Verify identity, mark arrival, then complete the visit with separate staff and patient follow-up.
6. **Patient follows up:** continue as Patient and explain the final instruction. The guide marks the journey complete.

Explain the four views in one sentence: **patients find care and follow their plan; health centers prepare referrals; hospitals review and confirm them; clinics can send or receive referrals for their services.**

**Switch view** changes perspective. If that view can access the open referral, it stays open. The facility/patient selector changes whose records you are viewing. **All demo views** returns to the opening screen. On phones, staff have Overview, Referrals, Patients, and More at the bottom.

## Optional: explore manually

Preparation: open http://localhost:3000, Demo settings → Reset Demo → confirm. Use a desktop screen for role switching. A phone-width patient view also works. Say: “This is a fictional local browser demonstration, not a live hospital connection. Planned, non-emergency referrals only.”

## 0:00–0:35 · Patient explores

1. Choose Patient. Ana Reyes is selected.
2. Click Use My Location and deny, or skip permission. Click Use Demo Location.
3. Filter Service to OB-GYN, search Hospital A, select its card. Point out the matching map marker, fictional-site label, scheduled hours, and service-specific availability report.
4. Say: “These are synthetic facility locations on a real interactive map. The displayed distance is straight-line, not a road journey. Discovery does not book a visit.”

## 0:35–1:15 · Referring facility prepares the information

1. Header Switch view → Health Center. Keep Demo Health Center A.
2. Open All Referrals, then DEMO-REF-0001 for Ana Reyes.
3. Click Review & submit draft. Show demographics, clinician-entered fictional information and the preferred doctor marked unavailable.
4. Check the review acknowledgement. Click Review referral; inspect the review; Submit local demo referral.
5. Say: “One immutable submitted snapshot and local in-app notifications now exist. No real referral has been delivered.”

## 1:15–2:00 · Hospital and referring team coordinate

1. Switch to Hospital. Keep Demo Hospital A. Open DEMO-REF-0001 through All Referrals.
2. Acknowledge referral. Propose alternative. Dr. Sofia Lim is preselected as the available alternative; inspect the reason and instructions, then Save proposed alternative.
3. Switch to Health Center, open Ana’s record, and Accept coordinated alternative.
4. Switch to Hospital A, reopen the record, Confirm plan, then confirm in the dialog.
5. Say: “Receiving staff explicitly confirm the agreed plan. A different destination would create a linked request requiring the new facility’s acceptance.”

## 2:00–2:35 · Patient sees a confirmed next step

1. Switch to Patient → My Referrals → DEMO-REF-0001.
2. Show Confirmed destination, alternative doctor, confirmed instructions, progress timeline, and notification updates.
3. Click View route → Use Demo Location.
4. Say: “The blue line follows mapped roads, with road distance and an estimated driving time from OSRM. The fictional pin may be slightly away from a road; that offset is shown without an off-road connector. No live traffic estimate is provided. Directions send only coordinates to the public routing service, never patient details. If the service is unavailable, retry or use Google Maps.”

## 2:35–3:15 · Retrieve, verify, complete

1. Switch to Hospital A → All Referrals; search DEMO-REF-0001 and open it.
2. Show the original submitted information, including the original preferred-doctor request. Click Verify identity & arrival.
3. Review registration changes and check the identity-verification acknowledgement. Mark arrived.
4. Complete visit & follow-up. Enter a fictional return note for referring staff and a separately worded patient instruction. Complete demo visit.
5. Switch to Health Center A and show the return note. Switch to Patient to show the patient instruction without the staff clinical snapshot.

## 3:15–3:45 · Clinic and resilience

1. Switch to Clinic A → Incoming Referrals → DEMO-REF-0004. Show that it can receive its configured general medicine service; New referral supports outgoing referrals too.
2. Reload, re-enter a persona, and show that fictional changes remain.
3. Optional: select Hospital B to show Ana’s Hospital A referral is absent; select another patient to show their separate record list.
4. Optional: Demo settings → Simulate Offline / Disable map tiles. Referral records remain demonstrable, with the simulation clearly labeled.
5. Say: “Browser filters and demo personas are not production authorization. A trusted backend, operational agreements and separate pilot approval are future work.”

Cleanup: Demo settings → Reset Demo → confirm. Ana returns to Draft and transient route/start state clears. Patient Print referral reference provides a minimal smartphone-free reference; staff can print the fictional submitted summary. No public QR record is created.
