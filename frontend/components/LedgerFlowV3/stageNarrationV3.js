// stageNarrationV3.js — scene-aware narration dispatcher.

import {
  narrationFor as v2NarrationFor,
  STAGE_LIST,
  stageOf,
  indexOfStage,
  stageLabel,
} from "../LedgerFlow/stageNarration";
import { onboardingNarrationFor } from "./onboardingNarration";
import { erasureNarrationFor } from "./erasureNarration";
import { fanoutNarrationFor } from "./fanoutNarration";
import { hardEdgeNarrationFor } from "./hardEdgeNarration";
import { engineNarrationFor } from "./engineNarration";
import { reconcileNarrationFor } from "./reconcileNarration";
import { archNarrationFor } from "./archNarration";
import { rbacNarrationFor } from "./rbacNarration";

export { STAGE_LIST, stageOf, indexOfStage, stageLabel };

// In v2 the POSTING scene replaces the v1 "RECONCILE_SKIPPED" placeholder
// with the engine-reconcile gate (Pacioli / SoD / idempotency) — this is the
// pre-commit validation a real GL fires before the journal is written.
function postingNarrationFor(state) {
  if (state.currentStage === "RECONCILE_SKIPPED") {
    const idx = indexOfStage("RECONCILE_SKIPPED");
    const total = STAGE_LIST.length;
    const indexLabel = idx >= 0 ? `Stage ${idx + 1} of ${total}` : "";
    return {
      overline: indexLabel,
      title: "Engine reconcile · pre-commit gates fire",
      body:
        "Before the GL journal commits, MongoDB enforces three invariants at the database — not the application. " +
        "Pacioli double-entry: $expr asserts Σ amountBaseMinor = 0 across the entry's lines. " +
        "Segregation of Duties: $expr asserts createdBy ≠ approvedBy. " +
        "Idempotency: a partial unique index on externalRef rejects duplicate POSTED writes (E11000). " +
        "All three gates pass simultaneously in < 40ms. The next stage is the atomic GL write.",
      callout: {
        variant: "note",
        title: "Engine reconcile vs detective reconcile",
        body:
          "Engine reconcile (this gate) is preventive — it runs before every commit. " +
          "Detective reconcile (the Reconcile scene) is the EOD batch that compares posted GL against sub-ledgers and external feeds.",
      },
      doc: null,
    };
  }
  return v2NarrationFor(state);
}

export function narrationFor(state) {
  switch (state.scene) {
    case "POSTING":
      return postingNarrationFor(state);

    case "ONBOARDING":
      return onboardingNarrationFor(state.onboarding || {});

    case "ARCH":
      return archNarrationFor(state.arch || {});

    case "RBAC":
      return rbacNarrationFor(state.rbac || {});

    case "ONBOARDING_PLACEHOLDER":
      return {
        overline: "Scene 1 · Coming in Phase C",
        title: "Onboarding — PII Vault & Queryable Encryption",
        body: "Frida is being onboarded. KYC captures her national ID, tax ID, and passport — encrypted before write via Queryable Encryption. MongoDB stores ciphertext; equality queries run without decryption. Each customer gets their own DEK wrapped by a master key.",
        doc: null,
      };

    case "ENGINE":
      return engineNarrationFor(state.engine || {});

    case "FANOUT":
      return fanoutNarrationFor(state.fanout || {});

    case "HARD_EDGE":
      return hardEdgeNarrationFor(state.hardEdge || {});

    case "RECONCILE":
      return reconcileNarrationFor(state.reconcile || {});

    case "ERASURE":
      return erasureNarrationFor(state.erasure || {});

    case "ERASURE_PLACEHOLDER":
      return {
        overline: "Scene 5 · Coming in Phase C",
        title: "The Erasure — GDPR Art 17 Crypto-shredding",
        body: "Frida exercises her right to erasure. We don't delete the journal — that would corrupt the ledger. We delete the key. The vault documents stay on disk for audit; their ciphertext is permanently unreadable. The journal lives on. Privacy and retention coexist.",
        doc: null,
      };

    default:
      return v2NarrationFor(state);
  }
}
