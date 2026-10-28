import { z } from "zod";
import type { AppState } from "./types";
const id = z.string().min(1),
  stamp = z.iso.datetime();
const status = z.enum([
  "draft",
  "submitted",
  "acknowledged",
  "clarification_requested",
  "resubmitted",
  "alternative_proposed",
  "alternative_accepted",
  "confirmed",
  "arrived",
  "completed",
  "declined",
  "cancelled",
]);
const patient = z.object({
  id,
  name: id,
  birthDate: id,
  address: id,
  contactPreference: id,
  homeFacilityId: id,
  isDemo: z.literal(true),
});
const facilityType = z.enum(["health_center", "hospital", "clinic"]);
const schema = z.object({
  version: z.literal(1),
  revision: z.number().int().nonnegative(),
  patients: z.array(patient),
  facilities: z.array(
    z.object({
      id,
      name: id,
      type: facilityType,
      coordinates: z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      }),
      addressLabel: id,
      services: z.array(id),
      hours: z.array(
        z.object({
          days: z.array(z.number().int().min(0).max(6)),
          open: id,
          close: id,
        }),
      ),
      timezone: z.literal("Asia/Manila"),
      serviceAvailability: z.array(
        z.object({
          serviceId: id,
          status: z.enum(["accepting", "not_accepting", "unknown"]),
          updatedAt: stamp,
        }),
      ),
      isDemo: z.literal(true),
    }),
  ),
  services: z.array(z.object({ id, name: id, description: id })),
  doctors: z.array(
    z.object({
      id,
      name: id,
      facilityId: id,
      serviceId: id,
      available: z.boolean(),
    }),
  ),
  users: z.array(
    z.object({
      id,
      name: id,
      role: z.enum(["patient", "health_center", "hospital", "clinic"]),
      facilityId: id.optional(),
      patientId: id.optional(),
    }),
  ),
  referrals: z.array(
    z.object({
      id,
      reference: id,
      patientId: id,
      originFacilityId: id,
      destinationFacilityId: id,
      requestedServiceId: id,
      preferredDoctorId: id.optional(),
      status,
      submittedSnapshotId: id.optional(),
      confirmedPlan: z
        .object({
          serviceId: id,
          doctorId: id.optional(),
          instructions: id,
          confirmedAt: stamp,
        })
        .optional(),
      linkedReplacementId: id.optional(),
      replacesReferralId: id.optional(),
      createdAt: stamp,
      updatedAt: stamp,
      submissionKey: id.optional(),
    }),
  ),
  snapshots: z.array(
    z.object({
      id,
      referralId: id,
      patient,
      reason: id,
      history: id,
      allergies: id,
      medications: id,
      requestedServiceId: id,
      preferredDoctorId: id.optional(),
      submittedAt: stamp,
    }),
  ),
  addenda: z.array(
    z.object({ id, referralId: id, text: id, actorId: id, createdAt: stamp }),
  ),
  events: z.array(
    z.object({
      id,
      referralId: id,
      status,
      message: id,
      actorId: id,
      facilityId: id.optional(),
      reason: id.optional(),
      createdAt: stamp,
    }),
  ),
  alternatives: z.array(
    z.object({
      id,
      referralId: id,
      doctorId: id.optional(),
      serviceId: id,
      destinationFacilityId: id,
      instructions: id,
      reason: id,
      acceptedAt: stamp.optional(),
      createdAt: stamp,
    }),
  ),
  verifications: z.array(
    z.object({
      id,
      referralId: id,
      identityVerified: z.literal(true),
      changes: id,
      actorId: id,
      createdAt: stamp,
    }),
  ),
  returnNotes: z.array(
    z.object({
      id,
      referralId: id,
      staffNote: id,
      patientInstruction: id,
      actorId: id,
      createdAt: stamp,
    }),
  ),
  notifications: z.array(
    z.object({
      id,
      referralId: id,
      patientId: id.optional(),
      facilityId: id.optional(),
      message: id,
      createdAt: stamp,
      read: z.boolean(),
    }),
  ),
});
export function parseStored(raw: string): AppState {
  return schema.parse(JSON.parse(raw));
}
