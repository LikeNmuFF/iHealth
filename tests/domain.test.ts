import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { createSeed } from "../src/lib/fixtures";
import {
  execute,
  visibleReferrals,
  visiblePatients,
  visibleNotifications,
  canAct,
} from "../src/lib/repository";
import {
  availabilityStatus,
  haversine,
  isScheduledOpen,
} from "../src/lib/facilities";
import {
  directConnection,
  googleDirections,
  OsrmRoutingProvider,
  routeOrFallback,
} from "../src/lib/routing";
import { parseStored } from "../src/lib/storage";
import type { AppState, ReferralInput } from "../src/lib/types";
const now = new Date("2026-10-27T08:00:00Z");
const input: ReferralInput = {
  patientId: "DEMO-P001",
  destinationFacilityId: "hospital-a",
  requestedServiceId: "ob",
  preferredDoctorId: "dr-ob-1",
  reason: "Fictional planned consultation",
  history: "Fictional history, no clinical recommendation",
  allergies: "Not recorded",
  medications: "Not recorded",
  reviewed: true,
  submissionKey: "test-ana-unique",
};
function submitted() {
  return execute(
    createSeed(now),
    "staff-hc-a",
    { type: "submit", input, draftId: "ref-1" },
    now,
  );
}
function acknowledged() {
  return execute(
    submitted(),
    "staff-hospital-a",
    { type: "acknowledge", referralId: "ref-1" },
    now,
  );
}
function confirmed() {
  let s = acknowledged();
  s = execute(
    s,
    "staff-hospital-a",
    {
      type: "propose",
      referralId: "ref-1",
      destinationFacilityId: "hospital-a",
      serviceId: "ob",
      doctorId: "dr-ob-2",
      instructions: "Demo visit at 09:00. Verify identity at the desk.",
      reason: "Preferred doctor unavailable.",
    },
    now,
  );
  s = execute(
    s,
    "staff-hc-a",
    { type: "accept_alternative", referralId: "ref-1" },
    now,
  );
  return execute(
    s,
    "staff-hospital-a",
    {
      type: "confirm",
      referralId: "ref-1",
      serviceId: "ob",
      doctorId: "dr-ob-2",
      instructions: "Demo visit at 09:00. Verify identity at the desk.",
    },
    now,
  );
}
const actor = (s: AppState, id: string) => s.users.find((u) => u.id === id)!;
describe("Shared referral lifecycle", () => {
  it("requires referring review and hides unsubmitted drafts from receiving staff", () => {
    const s = createSeed(now);
    expect(
      visibleReferrals(s, actor(s, "staff-hospital-a")).some(
        (r) => r.id === "ref-1",
      ),
    ).toBe(false);
    expect(() =>
      execute(
        s,
        "staff-hospital-a",
        { type: "submit", input, draftId: "ref-1" },
        now,
      ),
    ).toThrow();
    expect(() =>
      execute(
        s,
        "staff-hc-a",
        {
          type: "submit",
          input: { ...input, reviewed: false },
          draftId: "ref-1",
        },
        now,
      ),
    ).toThrow(/Review/);
  });
  it("creates exactly one immutable snapshot and notifications; duplicate submission is idempotent", () => {
    const s = submitted();
    expect(s.referrals).toHaveLength(6);
    expect(s.referrals[0].status).toBe("submitted");
    expect(s.snapshots.filter((s) => s.referralId === "ref-1")).toHaveLength(1);
    expect(
      execute(
        s,
        "staff-hc-a",
        { type: "submit", input, draftId: "ref-1" },
        now,
      ),
    ).toBe(s);
    expect(
      visibleNotifications(s, actor(s, "user-DEMO-P001")).length,
    ).toBeGreaterThan(1);
  });
  it("coordinates alternative doctor, preserves snapshot, confirms, verifies arrival and returns follow-up", () => {
    const snapshot = submitted().snapshots.find(
      (s) => s.referralId === "ref-1",
    )!;
    let s = confirmed();
    expect(s.referrals[0].confirmedPlan?.doctorId).toBe("dr-ob-2");
    expect(s.snapshots.find((s) => s.referralId === "ref-1")?.patient).toEqual(
      snapshot.patient,
    );
    expect(
      s.snapshots.find((s) => s.referralId === "ref-1")?.preferredDoctorId,
    ).toBe("dr-ob-1");
    expect(() =>
      execute(
        s,
        "staff-hospital-a",
        {
          type: "arrive",
          referralId: "ref-1",
          identityVerified: false,
          changes: "No changes",
        },
        now,
      ),
    ).toThrow(/Verify identity/);
    s = execute(
      s,
      "staff-hospital-a",
      {
        type: "arrive",
        referralId: "ref-1",
        identityVerified: true,
        changes: "Registration changes recorded separately",
      },
      now,
    );
    s = execute(
      s,
      "staff-hospital-a",
      {
        type: "complete",
        referralId: "ref-1",
        staffNote: "Return to referring team.",
        patientInstruction: "Arrange your next planned follow-up.",
      },
      now,
    );
    expect(s.referrals[0].status).toBe("completed");
    expect(s.verifications[0].changes).toContain("separately");
    expect(s.returnNotes.at(-1)?.staffNote).toBe("Return to referring team.");
    expect(
      s.events
        .filter((e) => e.referralId === "ref-1")
        .every((e) => e.actorId && e.createdAt),
    ).toBe(true);
  });
  it("does not confirm an unavailable doctor or an unaccepted alternative", () => {
    const s = acknowledged();
    expect(() =>
      execute(
        s,
        "staff-hospital-a",
        {
          type: "confirm",
          referralId: "ref-1",
          serviceId: "ob",
          doctorId: "dr-ob-1",
          instructions: "Demo arrival instructions",
        },
        now,
      ),
    ).toThrow(/unavailable/);
    const proposed = execute(
      s,
      "staff-hospital-a",
      {
        type: "propose",
        referralId: "ref-1",
        destinationFacilityId: "hospital-a",
        serviceId: "ob",
        doctorId: "dr-ob-2",
        instructions: "Demo agreed plan",
        reason: "Doctor unavailable",
      },
      now,
    );
    expect(() =>
      execute(
        proposed,
        "staff-hospital-a",
        {
          type: "confirm",
          referralId: "ref-1",
          serviceId: "ob",
          doctorId: "dr-ob-2",
          instructions: "Demo agreed plan",
        },
        now,
      ),
    ).toThrow();
  });
  it("stores clarification as an addendum and requires re-acknowledgement", () => {
    let s = submitted();
    const original = structuredClone(s.snapshots);
    s = execute(
      s,
      "staff-hospital-a",
      {
        type: "clarify",
        referralId: "ref-1",
        reason: "Please clarify demo history",
      },
      now,
    );
    s = execute(
      s,
      "staff-hc-a",
      {
        type: "resubmit",
        referralId: "ref-1",
        text: "Fictional clarification appended",
      },
      now,
    );
    expect(s.referrals[0].status).toBe("resubmitted");
    expect(s.snapshots).toEqual(original);
    expect(
      canAct(s.referrals[0], actor(s, "staff-hospital-a"), "confirm"),
    ).toBe(false);
    s = execute(
      s,
      "staff-hospital-a",
      { type: "acknowledge", referralId: "ref-1" },
      now,
    );
    expect(s.referrals[0].status).toBe("acknowledged");
  });
  it("new destination creates a linked unconfirmed referral, confirmed only by the new receiver", () => {
    let s = acknowledged();
    s = execute(
      s,
      "staff-hospital-a",
      {
        type: "propose",
        referralId: "ref-1",
        destinationFacilityId: "hospital-b",
        serviceId: "ob",
        doctorId: "dr-ob-b",
        instructions: "Coordinate at new destination",
        reason: "Alternate facility requested",
      },
      now,
    );
    s = execute(
      s,
      "staff-hc-a",
      { type: "accept_alternative", referralId: "ref-1" },
      now,
    );
    const replacement = s.referrals.find(
      (r) => r.replacesReferralId === "ref-1",
    )!;
    expect(replacement.status).toBe("submitted");
    expect(s.referrals[0].linkedReplacementId).toBe(replacement.id);
    expect(() =>
      execute(
        s,
        "staff-hospital-a",
        {
          type: "confirm",
          referralId: "ref-1",
          serviceId: "ob",
          instructions: "Invalid cross-facility confirmation",
        },
        now,
      ),
    ).toThrow();
    expect(() =>
      execute(
        s,
        "staff-hospital-a",
        { type: "acknowledge", referralId: replacement.id },
        now,
      ),
    ).toThrow();
    s = execute(
      s,
      "staff-hospital-b",
      { type: "acknowledge", referralId: replacement.id },
      now,
    );
    s = execute(
      s,
      "staff-hospital-b",
      {
        type: "confirm",
        referralId: replacement.id,
        serviceId: "ob",
        doctorId: "dr-ob-b",
        instructions: "New facility confirms instructions",
      },
      now,
    );
    expect(s.referrals.find((r) => r.id === replacement.id)?.status).toBe(
      "confirmed",
    );
  });
  it("cancellation and decline require reasons and preserve records", () => {
    let s = submitted();
    expect(() =>
      execute(
        s,
        "staff-hospital-a",
        { type: "decline", referralId: "ref-1", reason: "" },
        now,
      ),
    ).toThrow();
    s = execute(
      s,
      "user-DEMO-P001",
      { type: "cancel", referralId: "ref-1", reason: "Demo plan cancelled" },
      now,
    );
    expect(s.referrals).toHaveLength(6);
    expect(s.referrals[0].status).toBe("cancelled");
    expect(() =>
      execute(
        s,
        "staff-hospital-a",
        { type: "acknowledge", referralId: "ref-1" },
        now,
      ),
    ).toThrow();
  });
});
describe("Scope guards and clinic services", () => {
  it("shows only the selected patient or facility records", () => {
    const s = submitted();
    expect(
      visibleReferrals(s, actor(s, "user-DEMO-P002")).some(
        (r) => r.patientId === "DEMO-P001",
      ),
    ).toBe(false);
    expect(visiblePatients(s, actor(s, "user-DEMO-P001"))).toHaveLength(1);
    expect(
      visibleReferrals(s, actor(s, "staff-hospital-b")).some(
        (r) => r.id === "ref-1",
      ),
    ).toBe(false);
    expect(() =>
      execute(
        s,
        "staff-hospital-b",
        { type: "acknowledge", referralId: "ref-1" },
        now,
      ),
    ).toThrow();
    expect(() =>
      execute(
        s,
        "user-DEMO-P001",
        { type: "acknowledge", referralId: "ref-1" },
        now,
      ),
    ).toThrow();
  });
  it("guards forged actor objects using the registered identity", () => {
    const s = submitted();
    const forged = {
      ...actor(s, "user-DEMO-P002"),
      role: "hospital" as const,
      facilityId: "hospital-a",
    };
    expect(visibleReferrals(s, forged).some((r) => r.id === "ref-1")).toBe(
      false,
    );
  });
  it("allows a clinic to receive only services actually configured", () => {
    const s = createSeed(now);
    expect(() =>
      execute(
        s,
        "staff-hc-a",
        {
          type: "submit",
          input: { ...input, destinationFacilityId: "clinic-a" },
          draftId: "ref-1",
        },
        now,
      ),
    ).toThrow(/service/);
    const clinic = execute(
      s,
      "staff-hc-a",
      {
        type: "submit",
        input: {
          ...input,
          destinationFacilityId: "clinic-a",
          requestedServiceId: "general",
          preferredDoctorId: undefined,
        },
        draftId: "ref-1",
      },
      now,
    );
    expect(
      visibleReferrals(clinic, actor(clinic, "staff-clinic-a")).some(
        (r) => r.id === "ref-1",
      ),
    ).toBe(true);
    expect(
      execute(
        clinic,
        "staff-clinic-a",
        { type: "acknowledge", referralId: "ref-1" },
        now,
      ).referrals[0].status,
    ).toBe("acknowledged");
  });
  it("limits new fictional patient and availability edits to staff scope", () => {
    const s = createSeed(now);
    expect(() =>
      execute(
        s,
        "user-DEMO-P001",
        { type: "availability", serviceId: "ob", status: "accepting" },
        now,
      ),
    ).toThrow();
    expect(() =>
      execute(
        s,
        "staff-clinic-a",
        { type: "availability", serviceId: "ob", status: "accepting" },
        now,
      ),
    ).toThrow();
    const updated = execute(
      s,
      "staff-clinic-a",
      {
        type: "create_patient",
        name: "Fictional Test Person",
        birthDate: "2000-01-01",
        address: "Demo household",
        contactPreference: "In-app demo",
      },
      now,
    );
    expect(updated.patients.at(-1)?.homeFacilityId).toBe("clinic-a");
    expect(
      visiblePatients(updated, actor(updated, "staff-hc-a")).some(
        (p) => p.name === "Fictional Test Person",
      ),
    ).toBe(false);
  });
});
describe("Availability, operating hours and persistence", () => {
  it("expires stale reports and keeps opening hours independent", () => {
    const s = createSeed(now);
    expect(
      availabilityStatus(
        s.facilities.find((f) => f.id === "hospital-b")!.serviceAvailability[0],
        now.getTime(),
      ),
    ).toBe("unknown");
    expect(
      availabilityStatus(s.facilities[0].serviceAvailability[0], now.getTime()),
    ).toBe("accepting");
    expect(
      isScheduledOpen(
        s.facilities.find((f) => f.id === "hc-b")!,
        now,
      ),
    ).toBe(false);
  });
  it("evaluates overnight schedules and previous day in Manila", () => {
    const f = createSeed(now).facilities.find((f) => f.id === "clinic-b")!;
    f.hours = [{ days: [2], open: "20:00", close: "06:00" }];
    expect(isScheduledOpen(f, new Date("2026-10-27T14:00:00Z"))).toBe(true);
    expect(isScheduledOpen(f, new Date("2026-10-27T21:00:00Z"))).toBe(true);
    expect(isScheduledOpen(f, new Date("2026-10-28T06:00:00Z"))).toBe(false);
  });
  it("validates versioned fixtures; reset starts fresh and never persists device coordinates", () => {
    const s = confirmed();
    expect(parseStored(JSON.stringify(s))).toEqual(s);
    expect(() => parseStored('{"version":2}')).toThrow();
    const seed = createSeed(now);
    expect(seed.referrals[0].status).toBe("draft");
    expect(seed).not.toHaveProperty("origin");
    expect(seed).not.toHaveProperty("locationHistory");
    expect(seed.facilities.every((f) => f.isDemo)).toBe(true);
  });
});
describe("Honest distance and route behavior", () => {
  it("uses Haversine without pretending a direct line is a road route", () => {
    const a = { lat: 6.7, lng: 121.96 },
      b = { lat: 6.71, lng: 121.97 };
    expect(haversine(a, a)).toBe(0);
    const result = directConnection(a, b);
    expect(result.kind).toBe("direct");
    expect(result.label).toBe("Straight-line distance");
    expect(result).not.toHaveProperty("durationMinutes");
    expect(result.geometry).toEqual([a, b]);
  });
  it("falls back for missing config and failed providers, without ETA", async () => {
    const a = { lat: 6.7, lng: 121.96 },
      b = { lat: 6.71, lng: 121.97 };
    const signal = new AbortController().signal;
    expect((await routeOrFallback(undefined, a, b, signal)).kind).toBe(
      "direct",
    );
    expect(
      (
        await routeOrFallback(
          {
            route: async () => {
              throw new Error("Provider failed");
            },
          },
          a,
          b,
          signal,
        )
      ).label,
    ).toBe("Straight-line distance");
  });
  it("uses actual road geometry, distance, duration only from a valid configured response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          code: "Ok",
          routes: [
            {
              distance: 2400,
              duration: 450,
              geometry: {
                type: "LineString",
                coordinates: [
                  [121.96, 6.7],
                  [121.97, 6.71],
                ],
              },
            },
          ],
        }),
      }),
    );
    const r = await new OsrmRoutingProvider(
      "https://authorized-routing.example",
    ).route(
      { lat: 6.7, lng: 121.96 },
      { lat: 6.71, lng: 121.97 },
      new AbortController().signal,
    );
    expect(r.label).toBe("Road distance");
    expect(r.distanceKm).toBe(2.4);
    expect(r.durationMinutes).toBe(7.5);
    vi.unstubAllGlobals();
  });
  it("Google Maps URLs contain only coordinates, supported mode and api version", () => {
    const url = new URL(
      googleDirections({ lat: 6.7, lng: 121.96 }, { lat: 6.71, lng: 121.97 }),
    );
    expect([...url.searchParams.keys()].sort()).toEqual([
      "api",
      "destination",
      "origin",
      "travelmode",
    ]);
    expect(url.search).not.toMatch(/Ana|DEMO|diagnosis/i);
    expect(url.searchParams.get("api")).toBe("1");
  });
  it("draws the verified Isabela road geometry and exposes distances to snapped roads", async () => {
    const fixture = JSON.parse(
      readFileSync("tests/fixtures/isabela-road-route.json", "utf8"),
    );
    const request = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => fixture });
    vi.stubGlobal("fetch", request);
    try {
      const origin = { lat: 6.7048, lng: 121.9654 };
      const destination = { lat: 6.7022, lng: 121.9761 };
      const result = await new OsrmRoutingProvider(
        "https://routing.example",
      ).route(origin, destination, new AbortController().signal);
      expect(result.geometry).toHaveLength(80);
      expect(result.distanceKm).toBe(2.2391);
      expect(result.distanceKm).toBeGreaterThan(haversine(origin, destination));
      expect(result.startOffsetMeters).toBeGreaterThan(100);
      expect(result.destinationOffsetMeters).toBeGreaterThan(100);
      expect(result.geometry[0]).toEqual({
        lat: fixture.routes[0].geometry.coordinates[0][1],
        lng: fixture.routes[0].geometry.coordinates[0][0],
      });
      const url = new URL(request.mock.calls[0][0]);
      expect(url.searchParams.get("geometries")).toBe("geojson");
      expect(url.searchParams.get("radiuses")).toBe("1000;1000");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
it("keeps documented palette in sync with the canonical runtime tokens", () => {
  const css = readFileSync("src/app/globals.css", "utf8"),
    doc = readFileSync("DESIGN.md", "utf8");
  for (const token of [
    "primary",
    "primary-hover",
    "blue-soft",
    "ink",
    "muted",
    "surface",
    "canvas",
    "line",
    "yellow",
    "yellow-soft",
    "red",
    "green",
  ]) {
    const value = css.match(new RegExp(`--${token}:\\s*([^;]+)`))?.[1];
    expect(value).toBeTruthy();
    expect(doc.toLowerCase()).toContain(
      `${token}: "${value!.toLowerCase() === "#fff" ? "#ffffff" : value!.toLowerCase()}"`,
    );
  }
});
