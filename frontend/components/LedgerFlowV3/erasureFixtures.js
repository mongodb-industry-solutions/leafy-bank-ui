// erasureFixtures.js — fixture data for the GDPR erasure / crypto-shredding scene.
// Reuses customer doc and DEK from onboarding — this is the same key being destroyed.

export { FRIDA_CUSTOMER_DOC, FRIDA_DEK } from "./onboardingFixtures";

function isoDate(d) { return { $date: new Date(d).toISOString() }; }

export const ERASURE_AUDIT_LOG = {
  auditId: "AUDIT-20260506-ERA-001",
  eventType: "GDPR_ERASURE",
  legalBasis: "GDPR Art. 17 — Right to Erasure",
  customerId: "CUST-FRIDA-001",
  dekId: "DEK-FRIDA-001",
  retentionExemption: "journalEntries retained · PSD2 Art. 25 (5yr)",
  affectedCollection: "customers",
  encryptedFieldsOrphaned: ["nationalId", "taxId", "passportNumber"],
  requestedAt: isoDate("2026-05-06T14:00:00Z"),
  executedAt: isoDate("2026-05-06T14:00:02Z"),
  executedBy: "erasure-service",
  status: "COMPLETED",
};

// Sample journal entries that survive the erasure
export const SAMPLE_JOURNAL_ENTRIES = [
  { journalId: "JNL-20260501-001", journalType: "PAYMENT", totalAmount: { $numberDecimal: "250.00" }, status: "POSTED" },
  { journalId: "JNL-20260503-014", journalType: "PAYMENT", totalAmount: { $numberDecimal: "89.50" }, status: "POSTED" },
];
