// fanoutFixtures.js — fixture data for the CDC fan-out scene.

function isoDate(d) { return { $date: new Date(d).toISOString() }; }
function dec(n) { return { $numberDecimal: Number(n).toFixed(2) }; }

export const FANOUT_JOURNAL = {
  journalId: "JNL-20260506-001",
  journalType: "PAYMENT",
  status: "POSTED",
  currency: "USD",
  totalAmount: dec(250.00),
  debitAccountId: "ACC-FRIDA-001",
  creditAccountId: "ACC-BO-001",
  idempotencyKey: "idem_frida_bo_250_20260506",
  postedAt: isoDate("2026-05-06T09:15:00Z"),
};

export const FANOUT_CHANGE_EVENT = {
  operationType: "insert",
  ns: { db: "leafybank", coll: "journalEntries" },
  documentKey: { _id: "JNL-20260506-001" },
  fullDocument: { journalId: "JNL-20260506-001", status: "POSTED" },
  clusterTime: { $timestamp: { t: 1746521700, i: 1 } },
};

export const CONSUMERS = [
  {
    key: "BALANCE",
    label: "Balance Projection",
    collection: "accountBalances",
    description: "projects running balance",
    color: "#016BF8",
    lightColor: "#E1F7FF",
    resumeToken: "826E2A00000000012B0229296E04",
  },
  {
    key: "FRAUD",
    label: "Fraud Pipeline",
    collection: "fraudSignals",
    description: "velocity & pattern checks",
    color: "#944F01",
    lightColor: "#FDE7C8",
    resumeToken: "826E2A00000000012B0229296E05",
  },
  {
    key: "WORM",
    label: "WORM Sink",
    collection: "wormLedger",
    description: "immutable audit archive",
    color: "#00684A",
    lightColor: "#E3FCF7",
    resumeToken: "826E2A00000000012B0229296E06",
  },
];
