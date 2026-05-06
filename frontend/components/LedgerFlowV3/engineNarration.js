// engineNarration.js — narration for each ENGINE stage.

export function engineNarrationFor(engineState) {
  const stage = engineState?.currentStage;
  const total = 4;
  const idx = engineState?.stageIndex ?? -1;
  const indexLabel = idx >= 0 ? `Stage ${idx + 1} of ${total}` : `Stage 0 of ${total}`;
  const evt = engineState?.events?.find((e) => e.stage === stage)?.payload || {};

  switch (stage) {
    case "ENGINE_BALANCE_FAIL":
      return {
        overline: indexLabel,
        title: "Pacioli check — $expr rejects",
        body: "Σ Dr = $249.90, Σ Cr = $250.00. Delta = −$0.10. The $expr validator fires at the database — before the application sees success. Pacioli's 1494 double-entry invariant is enforced in < 40ms. No trigger, no CHECK constraint, no application-layer guard required. The database is the last line of defense.",
        callout: {
          variant: "important",
          title: "WriteError: Document failed validation",
          body: "$expr: { $eq: [{ $sum: '$lines.amountBaseMinor' }, 0] } — Σ amountBaseMinor must equal exactly zero. Any imbalanced document is rejected before it enters the collection.",
        },
        doc: {
          collectionKey: null,
          label: "Rejected write attempt",
          payload: evt.document || null,
        },
      };

    case "ENGINE_SOD_FAIL":
      return {
        overline: indexLabel,
        title: "Segregation of Duties — $expr rejects",
        body: "createdBy: 'alice', approvedBy: 'alice'. The SoD predicate requires they differ — a single user cannot both create and approve a journal entry. WriteError. SOX 404 ITGC enforced at the engine: auditors verify by re-running the query, not reading a policy document. The control is the schema.",
        callout: {
          variant: "important",
          title: "WriteError: Document failed validation",
          body: "$expr: { $ne: ['$createdBy', '$approvedBy'] } — Segregation of Duties enforced at the database layer. Proof is the schema itself.",
        },
        doc: {
          collectionKey: null,
          label: "Rejected write attempt",
          payload: evt.document || null,
        },
      };

    case "ENGINE_IDEMPOTENCY_FAIL":
      return {
        overline: indexLabel,
        title: "Idempotency — partial unique index fires",
        body: "externalRef 'FEDNOW-uetr-0f3a-4b11' already exists. The partial unique index fires E11000 before the second insert commits. At-least-once delivery from FedNow becomes exactly-once journaling at the database. Retries are safe by construction — not by convention.",
        callout: {
          variant: "important",
          title: "E11000 duplicate key error",
          body: "index: externalRef_1 (partial unique, filter: { status: 'POSTED' }) — duplicate externalRef rejected before the document is written.",
        },
        doc: {
          collectionKey: null,
          label: "Rejected duplicate write",
          payload: evt.document || null,
        },
      };

    case "ENGINE_COMMIT":
      return {
        overline: indexLabel,
        title: "All gates pass — COMMITTED",
        body: "Σ amountBaseMinor = 0 ✓. createdBy ≠ approvedBy ✓. externalRef is new ✓. All three checks pass simultaneously. The entry is written, immutable, and durable with w:majority · j:true. The engine has done its job. Three invariants — one $expr, one index — enforced at 40ms, not 4 hours.",
        callout: {
          variant: "note",
          title: "COMMITTED · IMMUTABLE",
          body: "The document is now in glJournalEntries. It cannot be updated or deleted — only reversed by a new REVERSAL journal. The audit trail is complete from the moment of write.",
        },
        doc: {
          collectionKey: null,
          label: "Committed entry",
          payload: evt.document || null,
        },
      };

    default:
      return {
        overline: "Engine",
        title: "Validation gate",
        body: "MongoDB's $expr validator and partial unique index enforce three invariants at write time: Pacioli balance (Σ = 0), Segregation of Duties (createdBy ≠ approvedBy), and idempotency (unique externalRef). Postgres needs a trigger. MongoDB doesn't.",
        doc: null,
      };
  }
}
