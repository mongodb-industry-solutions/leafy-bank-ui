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

export function narrationFor(state) {
  switch (state.scene) {
    case "POSTING":
      return v2NarrationFor(state);

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
