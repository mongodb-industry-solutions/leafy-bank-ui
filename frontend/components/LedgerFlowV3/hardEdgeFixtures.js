// hardEdgeFixtures.js — fixture data for the ChangeStreamHistoryLost scene.

function isoDate(d) { return { $date: new Date(d).toISOString() }; }

export const STALE_RESUME_TOKEN = "826E1A00000000012B0229296E03";
export const NEW_RESUME_TOKEN   = "826E2A00000000012B0229296E07";

export const CONSUMER = {
  consumerId: "fraud-pipeline-001",
  collection: "journalEntries",
  resumeToken: STALE_RESUME_TOKEN,
  lastSeenAt: isoDate("2026-05-04T22:00:00Z"),
  status: "OFFLINE",
};

export const STREAM_ERROR = {
  code: 286,
  codeName: "ChangeStreamHistoryLost",
  message:
    "Resume of change stream was not possible, as the resume point may no longer be in the oplog.",
  operationTime: isoDate("2026-05-06T09:00:00Z"),
};

export const WORM_ENTRIES = [
  { wormId: "WORM-20260504-8821", journalId: "JNL-20260504-091", event: "insert", seq: 8821 },
  { wormId: "WORM-20260504-8822", journalId: "JNL-20260504-092", event: "insert", seq: 8822 },
  { wormId: "WORM-20260504-8823", journalId: "JNL-20260504-093", event: "insert", seq: 8823 },
  { wormId: "WORM-20260506-9104", journalId: "JNL-20260506-001", event: "insert", seq: 9104 },
];
