// onboardingNarration.js — per-stage narration for the QE onboarding scene.
import { ONBOARD_STAGE_LIST } from "./onboardingReducer";

export function onboardingNarrationFor(ob = {}) {
  const stage = ob.currentStage;
  const idx = ob.stageIndex ?? -1;
  const total = ONBOARD_STAGE_LIST.length;
  const label = idx >= 0 ? `Stage ${idx + 1} of ${total}` : `Stage 0 of ${total}`;

  switch (stage) {
    case "ONBOARD_KYC_CAPTURED":
      return {
        overline: label,
        title: "KYC data captured",
        body: "Frida's identity details are entered — full name, email, national ID, tax ID, passport number. The application holds these in memory. Before a single byte leaves the process, the MongoDB Queryable Encryption driver intercepts the three designated sensitive fields.",
        doc: null,
      };

    case "ONBOARD_DEK_GENERATED":
      return {
        overline: label,
        title: "Data Encryption Key generated — client-side",
        body: "A DEK (Data Encryption Key) is generated in the client process specifically for Frida. Queryable Encryption uses a per-document DEK model: every customer gets their own key. At this point the key material exists only in memory — MongoDB has never seen plaintext or the key.",
        doc: null,
      };

    case "ONBOARD_DEK_WRAPPED":
      return {
        overline: label,
        title: "DEK wrapped by KMS and stored in key vault",
        body: "The DEK is encrypted (wrapped) by a master key held in the KMS. The resulting ciphertext is stored in the keyVault collection. MongoDB holds only the wrapped key material — it cannot unwrap it without the KMS, and the KMS never sees the document data.",
        doc: { collectionKey: null, label: "keyVault[0]", payload: ob.dekDoc },
      };

    case "ONBOARD_FIELDS_ENCRYPTED":
      return {
        overline: label,
        title: "Sensitive fields encrypted — client-side, before write",
        body: "nationalId, taxId, and passportNumber are encrypted with Frida's DEK before the write is dispatched. The driver produces BSON binary subType 06 — MongoDB's wire format for Queryable Encryption. The plaintext never reaches the MongoDB network layer.",
        doc: null,
      };

    case "ONBOARD_CUSTOMER_WRITTEN":
      return {
        overline: label,
        title: "Customer document written — ciphertext on disk",
        body: "The customer document is inserted. On disk: BSON subType 06 values for the three sensitive fields; plaintext for everything else. MongoDB can index and equality-query the encrypted fields without ever decrypting them — the server only compares ciphertexts.",
        doc: { collectionKey: null, label: "customers[0]", payload: ob.customerDoc },
      };

    case "ONBOARD_QUERY_DEMO":
      return {
        overline: label,
        title: "Equality query on encrypted nationalId",
        body: "A lookup by national ID is issued. The driver encrypts the query parameter client-side — the same DEK, the same deterministic encryption scheme. MongoDB receives and executes a ciphertext predicate. The server compares encrypted values, finds the match, and returns the document. Zero plaintext transmitted after onboarding.",
        callout: {
          variant: "note",
          title: "Queryable Encryption — what the server sees",
          body: "db.customers.find({ nationalId: { $binary: { base64: \"BhPx...\", subType: \"06\" } } }) → 1 document matched. The server never saw \"SE-8507-2193-K\".",
        },
        doc: null,
      };

    default:
      return {
        overline: "Idle",
        title: "Onboarding — Queryable Encryption",
        body: "Press Simulate to onboard Frida Karlsson. KYC fields (nationalId, taxId, passportNumber) are encrypted client-side before write. MongoDB stores BSON subType 06 ciphertext. Equality queries work against encrypted fields without server-side decryption.",
        doc: null,
      };
  }
}
