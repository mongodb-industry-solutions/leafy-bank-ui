// fanoutNarration.js
import { FANOUT_STAGE_LIST } from "./fanoutReducer";

export function fanoutNarrationFor(f = {}) {
  const stage = f.currentStage;
  const idx = f.stageIndex ?? -1;
  const total = FANOUT_STAGE_LIST.length;
  const label = idx >= 0 ? `Stage ${idx + 1} of ${total}` : `Stage 0 of ${total}`;

  switch (stage) {
    case "FANOUT_JOURNAL_COMMITTED":
      return {
        overline: label,
        title: "Journal entry committed",
        body: "JNL-20260506-001 is written to journalEntries with status=POSTED. The ledger write is durable. Now the downstream systems need to learn about it — but they don't poll the database. They subscribe to a change stream.",
        doc: null,
      };
    case "FANOUT_STREAM_OPENED":
      return {
        overline: label,
        title: "Change stream open — CDC tier watching",
        body: "A single CDC tier process holds an open change stream cursor on journalEntries. This is the architectural choice: one stream per collection, not one stream per downstream consumer. Downstream consumers subscribe to the CDC tier — they never hold their own database cursors.",
        doc: null,
      };
    case "FANOUT_EVENT_RECEIVED":
      return {
        overline: label,
        title: "INSERT event received by CDC tier",
        body: "The change stream delivers an INSERT event for JNL-20260506-001. The CDC tier receives the full document including clusterTime. It now fans out to all registered consumers. Each consumer will process this event independently.",
        doc: null,
      };
    case "FANOUT_CONSUMER_BALANCE":
      return {
        overline: label,
        title: "Balance Projection service consumed",
        body: "The balance projection service receives the event and updates the running balance for ACC-FRIDA-001 and ACC-BO-001. It stores a resume token — a pointer into the oplog identifying the last event it processed. If it reconnects, it can resume from exactly this position.",
        doc: null,
      };
    case "FANOUT_CONSUMER_FRAUD":
      return {
        overline: label,
        title: "Fraud Pipeline consumed",
        body: "The fraud pipeline receives the same event. It runs velocity checks and pattern analysis. It also stores a resume token. The token is opaque — the consumer doesn't need to interpret it, only store it durably so it can be passed back on reconnect.",
        doc: null,
      };
    case "FANOUT_CONSUMER_WORM":
      return {
        overline: label,
        title: "WORM Sink consumed — all three resume tokens live",
        body: "The WORM sink writes an immutable, hash-chained record to the append-only archive. Each entry includes SHA-256(prevHash ‖ payload) and an RFC 3161 trusted timestamp — compatible with S3 Object Lock and Azure Immutable Blob Storage. Sequence numbers are monotonically increasing; any gap signals tampering. Now all three consumers have processed the event and hold resume tokens.",
        callout: {
          variant: "note",
          title: "Resume tokens are oplog pointers — WORM is the fallback",
          body: "Each token is a reference into MongoDB's oplog. They allow a consumer to resume from exactly where it left off. But the oplog has finite retention. When the window expires (Scene 4), the WORM sink becomes the recovery source — its immutable hash chain replays missed events with cryptographic proof of ordering.",
        },
        doc: null,
      };
    default:
      return {
        overline: "Idle",
        title: "Fan-out — CDC Tier & Resume Tokens",
        body: "Press Simulate to watch a committed journal entry fan out through the CDC tier to three downstream consumers. Each consumer stores a resume token for exactly-once replay on reconnect.",
        doc: null,
      };
  }
}
