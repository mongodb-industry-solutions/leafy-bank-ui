// hardEdgeNarration.js
import { HARD_EDGE_STAGE_LIST } from "./hardEdgeReducer";

export function hardEdgeNarrationFor(h = {}) {
  const stage = h.currentStage;
  const idx = h.stageIndex ?? -1;
  const total = HARD_EDGE_STAGE_LIST.length;
  const label = idx >= 0 ? `Stage ${idx + 1} of ${total}` : `Stage 0 of ${total}`;

  switch (stage) {
    case "HARD_EDGE_CONSUMER_OFFLINE":
      return {
        overline: label,
        title: "Consumer goes offline",
        body: "The fraud pipeline consumer goes offline at 22:00 on May 4th — network partition, deployment, whatever the reason. Its last resume token is stored. The consumer will use this token to resume exactly where it left off. It doesn't know yet that the oplog window has a limit.",
        doc: null,
      };
    case "HARD_EDGE_OPLOG_ROLLS":
      return {
        overline: label,
        title: "Oplog window rolls — events fall off",
        body: "MongoDB's oplog is a capped collection — it has a finite size and retention window, typically hours to days depending on write volume. While the consumer is offline, writes keep coming. Older events age out of the oplog. The consumer's stored resume token now points to a position that no longer exists.",
        callout: {
          variant: "important",
          title: "The oplog cannot be extended",
          body: "MongoDB cannot hold oplog entries indefinitely. Once an event ages out of the window, it is gone from the oplog. The resume token that pointed to it is permanently invalid. MongoDB cannot help with this.",
        },
        doc: null,
      };
    case "HARD_EDGE_RESUME_ATTEMPT":
      return {
        overline: label,
        title: "Consumer reconnects — attempts resume",
        body: "The fraud pipeline comes back online. It reads its stored resume token and opens a change stream with startAfter: { token }. This is the standard pattern. Normally this works. This time, the token points to a position that has rolled out of the oplog.",
        doc: null,
      };
    case "HARD_EDGE_ERROR_286":
      return {
        overline: label,
        title: "Error 286: ChangeStreamHistoryLost",
        body: "MongoDB returns error code 286 — ChangeStreamHistoryLost. The cursor is immediately invalidated. There is no retry that will fix this. The resume point is gone. The consumer cannot receive events from the oplog. Most demos hide this failure mode. This is the hard edge of every change stream architecture.",
        callout: {
          variant: "important",
          title: "The cursor is dead — there is no recovery via the oplog",
          body: "Error 286 is not a transient error. The token is permanently invalid. The consumer must fall back to an alternative source of truth. If no WORM sink exists, the events are lost.",
        },
        doc: null,
      };
    case "HARD_EDGE_WORM_RECOVERY":
      return {
        overline: label,
        title: "Recovery via WORM sink",
        body: "The WORM sink is the actual record of authority — every event was written there durably by the CDC tier. The fraud pipeline reads the WORM sink from its last processed sequence number, replays the missed events, and processes them in order. The WORM sink is the safety net that makes this architecture recoverable.",
        doc: null,
      };
    case "HARD_EDGE_CAUGHT_UP":
      return {
        overline: label,
        title: "Consumer caught up — new resume token acquired",
        body: "The fraud pipeline has replayed all missed events from the WORM sink and is now current. It re-opens its change stream cursor and receives a fresh resume token pointing to the current oplog position. The consumer is back in the live stream. The WORM sink made recovery possible.",
        callout: {
          variant: "note",
          title: "WORM sink is not optional in this architecture",
          body: "Without it, error 286 means data loss. With it, any consumer can recover from any offline duration regardless of oplog window size. The WORM sink transforms an unrecoverable error into a recoverable one.",
        },
        doc: null,
      };
    default:
      return {
        overline: "Idle",
        title: "The Hard Edge — ChangeStreamHistoryLost",
        body: "Press Simulate to see what most demos hide: a consumer goes offline, the oplog window rolls, and MongoDB returns error 286 — ChangeStreamHistoryLost. The cursor is dead. Recovery proceeds from the WORM sink.",
        doc: null,
      };
  }
}
