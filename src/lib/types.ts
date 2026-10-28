export type Persona = "patient" | "health_center" | "hospital" | "clinic";
export type FacilityType = Exclude<Persona, "patient">;
export interface Coordinates {
  lat: number;
  lng: number;
}
export interface DemoUser {
  id: string;
  name: string;
  role: Persona;
  facilityId?: string;
  patientId?: string;
}
export interface Patient {
  id: string;
  name: string;
  birthDate: string;
  address: string;
  contactPreference: string;
  homeFacilityId: string;
  isDemo: true;
}
export interface Service {
  id: string;
  name: string;
  description: string;
}
export interface Doctor {
  id: string;
  name: string;
  facilityId: string;
  serviceId: string;
  available: boolean;
}
export interface ServiceAvailability {
  serviceId: string;
  status: "accepting" | "not_accepting" | "unknown";
  updatedAt: string;
}
export interface OperatingHours {
  days: number[];
  open: string;
  close: string;
}
export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  coordinates: Coordinates;
  addressLabel: string;
  services: string[];
  hours: OperatingHours[];
  timezone: "Asia/Manila";
  serviceAvailability: ServiceAvailability[];
  isDemo: true;
}
export type ReferralStatus =
  | "draft"
  | "submitted"
  | "acknowledged"
  | "clarification_requested"
  | "resubmitted"
  | "alternative_proposed"
  | "alternative_accepted"
  | "confirmed"
  | "arrived"
  | "completed"
  | "declined"
  | "cancelled";
export interface ConfirmedPlan {
  serviceId: string;
  doctorId?: string;
  instructions: string;
  confirmedAt: string;
}
export interface Referral {
  id: string;
  reference: string;
  patientId: string;
  originFacilityId: string;
  destinationFacilityId: string;
  requestedServiceId: string;
  preferredDoctorId?: string;
  status: ReferralStatus;
  submittedSnapshotId?: string;
  confirmedPlan?: ConfirmedPlan;
  linkedReplacementId?: string;
  replacesReferralId?: string;
  createdAt: string;
  updatedAt: string;
  submissionKey?: string;
}
export interface SubmittedSnapshot {
  id: string;
  referralId: string;
  patient: Patient;
  reason: string;
  history: string;
  allergies: string;
  medications: string;
  requestedServiceId: string;
  preferredDoctorId?: string;
  submittedAt: string;
}
export interface ReferralAddendum {
  id: string;
  referralId: string;
  text: string;
  actorId: string;
  createdAt: string;
}
export interface ReferralEvent {
  id: string;
  referralId: string;
  status: ReferralStatus;
  message: string;
  actorId: string;
  facilityId?: string;
  reason?: string;
  createdAt: string;
}
export interface AlternativeProposal {
  id: string;
  referralId: string;
  doctorId?: string;
  serviceId: string;
  destinationFacilityId: string;
  instructions: string;
  reason: string;
  acceptedAt?: string;
  createdAt: string;
}
export interface RegistrationVerification {
  id: string;
  referralId: string;
  identityVerified: true;
  changes: string;
  actorId: string;
  createdAt: string;
}
export interface ReturnNote {
  id: string;
  referralId: string;
  staffNote: string;
  patientInstruction: string;
  actorId: string;
  createdAt: string;
}
export interface Notification {
  id: string;
  referralId: string;
  patientId?: string;
  facilityId?: string;
  message: string;
  createdAt: string;
  read: boolean;
}
export interface AppState {
  version: 1;
  revision: number;
  patients: Patient[];
  facilities: Facility[];
  services: Service[];
  doctors: Doctor[];
  users: DemoUser[];
  referrals: Referral[];
  snapshots: SubmittedSnapshot[];
  addenda: ReferralAddendum[];
  events: ReferralEvent[];
  alternatives: AlternativeProposal[];
  verifications: RegistrationVerification[];
  returnNotes: ReturnNote[];
  notifications: Notification[];
}
export interface ReferralInput {
  patientId: string;
  destinationFacilityId: string;
  requestedServiceId: string;
  preferredDoctorId?: string;
  reason: string;
  history: string;
  allergies: string;
  medications: string;
  reviewed: boolean;
  submissionKey: string;
}
