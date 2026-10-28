import type {
  AppState,
  Facility,
  Referral,
  ReferralStatus,
  SubmittedSnapshot,
} from "./types";

export function createSeed(now = new Date()): AppState {
  const stamp = now.toISOString();
  const earlier = (hours: number) =>
    new Date(now.getTime() - hours * 3600000).toISOString();
  const services = [
    {
      id: "ob",
      name: "OB-GYN",
      description:
        "Planned obstetrics and gynecology consultations. Referral plans are confirmed by receiving staff.",
    },
    {
      id: "general",
      name: "General medicine",
      description:
        "Scheduled general medicine assessments and follow-up consultations.",
    },
    {
      id: "pediatrics",
      name: "Pediatrics",
      description:
        "Planned child health consultations with a receiving clinician.",
    },
    {
      id: "diagnostics",
      name: "Diagnostics",
      description:
        "Requested diagnostic service coordination. No results are generated in this demo.",
    },
  ];
  const allWeek = [
    { days: [0, 1, 2, 3, 4, 5, 6], open: "00:00", close: "23:59" },
  ];
  const facilities: Facility[] = [
    {
      id: "hc-a",
      name: "Demo Health Center A",
      type: "health_center",
      coordinates: { lat: 6.7082, lng: 121.9662 },
      addressLabel: "Demo site · West district, Isabela City",
      services: ["general", "ob"],
      hours: allWeek,
      timezone: "Asia/Manila",
      serviceAvailability: [
        { serviceId: "general", status: "accepting", updatedAt: stamp },
        { serviceId: "ob", status: "unknown", updatedAt: stamp },
      ],
      isDemo: true,
    },
    {
      id: "hospital-a",
      name: "Demo Hospital A",
      type: "hospital",
      coordinates: { lat: 6.7022, lng: 121.9761 },
      addressLabel: "Demo site · Central district, Isabela City",
      services: ["ob", "general", "pediatrics", "diagnostics"],
      hours: allWeek,
      timezone: "Asia/Manila",
      serviceAvailability: services.map((s) => ({
        serviceId: s.id,
        status: "accepting",
        updatedAt: stamp,
      })),
      isDemo: true,
    },
    {
      id: "clinic-a",
      name: "Demo Clinic A",
      type: "clinic",
      coordinates: { lat: 6.6986, lng: 121.9705 },
      addressLabel: "Demo site · South district, Isabela City",
      services: ["general", "diagnostics"],
      hours: allWeek,
      timezone: "Asia/Manila",
      serviceAvailability: [
        { serviceId: "general", status: "accepting", updatedAt: stamp },
        { serviceId: "diagnostics", status: "not_accepting", updatedAt: stamp },
      ],
      isDemo: true,
    },
    {
      id: "hc-b",
      name: "Demo Health Center B",
      type: "health_center",
      coordinates: { lat: 6.716, lng: 121.971 },
      addressLabel: "Demo site · North district, Isabela City",
      services: ["general", "pediatrics"],
      hours: [],
      timezone: "Asia/Manila",
      serviceAvailability: [
        { serviceId: "general", status: "not_accepting", updatedAt: stamp },
        { serviceId: "pediatrics", status: "unknown", updatedAt: stamp },
      ],
      isDemo: true,
    },
    {
      id: "hospital-b",
      name: "Demo Hospital B",
      type: "hospital",
      coordinates: { lat: 6.71, lng: 121.985 },
      addressLabel: "Demo site · East district, Isabela City",
      services: ["ob", "general", "diagnostics"],
      hours: allWeek,
      timezone: "Asia/Manila",
      serviceAvailability: ["ob", "general", "diagnostics"].map(
        (serviceId) => ({
          serviceId,
          status: "accepting",
          updatedAt: earlier(3),
        }),
      ),
      isDemo: true,
    },
    {
      id: "clinic-b",
      name: "Demo Clinic B",
      type: "clinic",
      coordinates: { lat: 6.722, lng: 121.96 },
      addressLabel: "Demo site · Hillside district, Isabela City",
      services: ["general", "pediatrics"],
      hours: [{ days: [0, 1, 2, 3, 4, 5, 6], open: "20:00", close: "06:00" }],
      timezone: "Asia/Manila",
      serviceAvailability: [
        { serviceId: "general", status: "unknown", updatedAt: stamp },
        { serviceId: "pediatrics", status: "accepting", updatedAt: stamp },
      ],
      isDemo: true,
    },
  ];
  const patients = [
    {
      id: "DEMO-P001",
      name: "Ana Reyes",
      birthDate: "1997-03-14",
      address: "Demo household · West district",
      contactPreference: "In-app updates; printed reference if needed",
      homeFacilityId: "hc-a",
      isDemo: true as const,
    },
    ...[
      "Marco Santos",
      "Lea Cruz",
      "Nico Ramos",
      "Mia Flores",
      "Luis Garcia",
    ].map((name, i) => ({
      id: `DEMO-P00${i + 2}`,
      name,
      birthDate: `199${i + 1}-06-12`,
      address: "Fictional household · Isabela City",
      contactPreference: "In-app demo notification",
      homeFacilityId: i % 2 ? "clinic-a" : "hc-b",
      isDemo: true as const,
    })),
  ];
  const drafts: [string, string, string, string, ReferralStatus][] = [
    ["DEMO-P001", "hc-a", "hospital-a", "ob", "draft"],
    ["DEMO-P002", "hc-b", "hospital-a", "general", "submitted"],
    ["DEMO-P003", "clinic-a", "hospital-a", "diagnostics", "confirmed"],
    ["DEMO-P004", "hc-b", "clinic-a", "general", "acknowledged"],
    ["DEMO-P005", "clinic-a", "hospital-b", "ob", "clarification_requested"],
    ["DEMO-P006", "hc-b", "hospital-a", "pediatrics", "completed"],
  ];
  const referrals: Referral[] = drafts.map(
    (
      [
        patientId,
        originFacilityId,
        destinationFacilityId,
        requestedServiceId,
        status,
      ],
      i,
    ) => ({
      id: `ref-${i + 1}`,
      reference: `DEMO-REF-${String(i + 1).padStart(4, "0")}`,
      patientId,
      originFacilityId,
      destinationFacilityId,
      requestedServiceId,
      status,
      preferredDoctorId: i === 0 ? "dr-ob-1" : undefined,
      submittedSnapshotId: status === "draft" ? undefined : `snap-${i + 1}`,
      createdAt: earlier(5),
      updatedAt: earlier(1),
      confirmedPlan: ["confirmed", "completed"].includes(status)
        ? {
            serviceId: requestedServiceId,
            instructions:
              "Demo visit: check in with the receiving desk during scheduled hours. Identity verification is required.",
            confirmedAt: earlier(2),
          }
        : undefined,
    }),
  );
  const snapshots: SubmittedSnapshot[] = referrals
    .filter((r) => r.status !== "draft")
    .map((r) => ({
      id: r.submittedSnapshotId!,
      referralId: r.id,
      patient: structuredClone(patients.find((p) => p.id === r.patientId)!),
      reason: "Fictional planned consultation requested after assessment.",
      history: "Demonstration history only. No actual medical record.",
      allergies: "Not recorded",
      medications: "Not recorded",
      requestedServiceId: r.requestedServiceId,
      submittedAt: earlier(4),
    }));
  return {
    version: 1,
    revision: 0,
    patients,
    facilities,
    services,
    doctors: [
      {
        id: "dr-ob-1",
        name: "Dr. Celia Dela Paz (demo)",
        facilityId: "hospital-a",
        serviceId: "ob",
        available: false,
      },
      {
        id: "dr-ob-2",
        name: "Dr. Sofia Lim (demo)",
        facilityId: "hospital-a",
        serviceId: "ob",
        available: true,
      },
      {
        id: "dr-general",
        name: "Dr. Paolo Tan (demo)",
        facilityId: "clinic-a",
        serviceId: "general",
        available: true,
      },
      {
        id: "dr-ob-b",
        name: "Dr. Elisa Ong (demo)",
        facilityId: "hospital-b",
        serviceId: "ob",
        available: true,
      },
    ],
    users: [
      ...facilities.map((f, i) => ({
        id: `staff-${f.id}`,
        name: [
          "Mara Villanueva",
          "Elena Santos",
          "Rafi Mendoza",
          "Liza Ramos",
          "Dina Cruz",
          "Ben Flores",
        ][i],
        role: f.type,
        facilityId: f.id,
      })),
      ...patients.map((p) => ({
        id: `user-${p.id}`,
        name: p.name,
        role: "patient" as const,
        patientId: p.id,
      })),
    ],
    referrals,
    snapshots,
    addenda: [],
    events: referrals.map((r) => ({
      id: `event-seed-${r.id}`,
      referralId: r.id,
      status: r.status,
      message:
        r.status === "draft"
          ? "Draft prepared at the referring facility."
          : "Fictional demonstration record loaded.",
      actorId: `staff-${r.originFacilityId}`,
      facilityId: r.originFacilityId,
      createdAt: r.updatedAt,
    })),
    alternatives: [],
    verifications: [],
    returnNotes: [
      {
        id: "return-seed",
        referralId: "ref-6",
        staffNote:
          "Demo consultation completed. Please coordinate a local follow-up visit.",
        patientInstruction:
          "Contact your referring health center to arrange your next planned visit.",
        actorId: "staff-hospital-a",
        createdAt: earlier(1),
      },
    ],
    notifications: [
      {
        id: "notice-ana",
        referralId: "ref-1",
        patientId: "DEMO-P001",
        message:
          "Your referring health center has prepared a draft. No visit is confirmed yet.",
        createdAt: stamp,
        read: false,
      },
    ],
  };
}
