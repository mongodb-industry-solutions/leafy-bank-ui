// erasureNarration.js — per-stage narration for the GDPR crypto-shredding scene.
import { ERASURE_STAGE_LIST } from "./erasureReducer";

export function erasureNarrationFor(er = {}) {
  const stage = er.currentStage;
  const idx = er.stageIndex ?? -1;
  const total = ERASURE_STAGE_LIST.length;
  const label = idx >= 0 ? `Stage ${idx + 1} of ${total}` : `Stage 0 of ${total}`;

  switch (stage) {
    case "ERASURE_REQUESTED":
      return {
        overline: label,
        title: "Right to erasure invoked — GDPR Art. 17",
        body: "Frida submits a Subject Access Request: she wants her personal data erased. DEK-FRIDA-001 is the target — the key that protects nationalId, taxId, and passportNumber in the customers collection. The ledger is not touched.",
        doc: null,
      };

    case "ERASURE_DEK_LOCATED":
      return {
        overline: label,
        title: "DEK located in key vault",
        body: "The erasure service looks up DEK-FRIDA-001 in the keyVault collection. The key material is confirmed present. A deleteOne is about to execute. This is the entire erasure mechanism — there is no data deletion, no document removal, no journal truncation.",
        doc: null,
      };

    case "ERASURE_DEK_DELETED":
      return {
        overline: label,
        title: "DEK destroyed — key material gone",
        body: "db.keyVault.deleteOne({ _id: \"DEK-FRIDA-001\" }) executes. The key document is removed. The ciphertext values for nationalId, taxId, and passportNumber remain on disk in the customers collection exactly as they were — BSON subType 06. They are now permanently unreadable.",
        callout: {
          variant: "important",
          title: "No plaintext recovery is possible",
          body: "Without the DEK, the MongoDB driver cannot decrypt the fields and cannot construct an encrypted query predicate. The ciphertext is computationally indistinguishable from random noise.",
        },
        doc: null,
      };

    case "ERASURE_CIPHERTEXT_ORPHANED":
      return {
        overline: label,
        title: "Ciphertext orphaned — three fields unreadable",
        body: "The customer document still exists. customerId, fullName, and email are plaintext — they remain readable. nationalId, taxId, and passportNumber are ciphertext with no corresponding key. Those values are gone. The legal record of the person's account persists; the PII does not.",
        doc: null,
      };

    case "ERASURE_QUERY_ATTEMPT":
      return {
        overline: label,
        title: "Query attempt — 0 documents returned",
        body: "db.customers.find({ nationalId: \"SE-8507-2193-K\" }) is attempted. The driver tries to encrypt the query predicate using DEK-FRIDA-001. The key no longer exists. The driver throws an error — the query cannot execute. Zero documents are returned. The data cannot be found by its PII.",
        callout: {
          variant: "important",
          title: "No partial match — all or nothing",
          body: "Queryable Encryption is binary: without the key, no predicate can be formed. There is no degraded mode, no fallback to plaintext scan. The field is gone from the query surface.",
        },
        doc: null,
      };

    case "ERASURE_AUDIT_LOGGED":
      return {
        overline: label,
        title: "Erasure complete — audit record committed",
        body: "A GDPR_ERASURE event is written to the audit log: which DEK was deleted, which fields were orphaned, and the retention exemption for journalEntries (PSD2 Art. 25, 5-year requirement). The journal lives on — immutable, permanent. Privacy and retention coexist.",
        callout: {
          variant: "note",
          title: "The ledger is intact — the PII is gone",
          body: "journalEntries, subLedgerEntries, and glAccounts are untouched. Frida's financial history is preserved for regulatory compliance. Her identity data is cryptographically erased. Both obligations satisfied simultaneously.",
        },
        doc: { collectionKey: null, label: "gdprAuditLog[0]", payload: er.auditLog },
      };

    default:
      return {
        overline: "Idle",
        title: "The Erasure — GDPR Art. 17 Crypto-shredding",
        body: "Press Simulate to erase Frida's PII. The DEK is deleted — not the journal, not the customer document. Ciphertext on disk becomes permanently unreadable. The ledger survives intact. Regulatory retention and privacy erasure satisfied simultaneously.",
        doc: null,
      };
  }
}
