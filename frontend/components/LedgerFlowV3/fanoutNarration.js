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
        body: "The WORM sink writes an immutable record to the append-only archive. Now all three consumers have processed the event and each holds a resume token. The oplog is a finite sliding window — if any consumer goes offline too long, its token becomes invalid. Scene 4 shows what happens then.",
        callout: {
          variant: "note",
          title: "Resume tokens are oplog pointers",
          body: "Each token is a reference into MongoDB's oplog. They allow a consumer to resume from exactly where it left off after a disconnect. But the oplog has a finite retention window. Scene 4 (Hard Edge) shows what happens when that window expires.",
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
