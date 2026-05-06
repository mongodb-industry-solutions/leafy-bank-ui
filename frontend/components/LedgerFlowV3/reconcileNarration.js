// reconcileNarration.js — 3-run × 3-scenario reconciliation narration.

function fmtMoney(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n || 0);
}

const SCENARIO_LABELS = {
  BALANCED: "Perfect Balance",
  STRAND_DRIFT: "Strand Drift Δ$0.10",
  SUB_GL_LAG: "Pipeline Lag",
};

export function reconcileNarrationFor(reconcile) {
  const stage = reconcile?.currentStage;
  const scenario = reconcile?.scenario || "BALANCED";
  const idx = reconcile?.stageIndex ?? -1;
  const indexLabel = idx >= 0 ? `Stage ${idx + 1}` : "Stage 0";
  const scenarioLabel = SCENARIO_LABELS[scenario] || scenario;
  const evt = reconcile?.events?.find((e) => e.stage === stage)?.payload || {};

  switch (stage) {
    case "RECON_INTRO":
      return {
        overline: `${indexLabel} · ${scenarioLabel}`,
        title: "Three reconciliation runs — the integrity engine",
        body: `The accounting period runs three reconciliation checks before it can close. Run 1: transferGroupBalance — per-strand Σ DR = Σ CR (continuous). Run 2: subledgerToGL — sub-ledger postings sum = GL summary postings sum. Run 3: trialBalance — Σ DR = Σ CR across all glJournalEntries for the period. All three must return BALANCED before the period-close gate can open. Scenario: ${scenarioLabel}.`,
        doc: null,
      };

    case "RUN_TGB_START":
      return {
        overline: `${indexLabel} · transferGroupBalance`,
        title: "Run 1 — transferGroupBalance scanning",
        body: "transferGroupBalance groups every sub-ledger entry by its transfer strand identifier and verifies Σ DR = Σ CR within each strand. This is a continuous run — it fires after every batch of postings, not just at EOD. Per-strand balance keeps the integrity signal close to the posting event, not the period close.",
        doc: null,
      };

    case "RUN_TGB_RESULT": {
      const isUnbalanced = evt.status === "UNBALANCED";
      if (isUnbalanced) {
        return {
          overline: `${indexLabel} · transferGroupBalance`,
          title: `UNBALANCED — Δ${fmtMoney(parseFloat(evt.delta?.$numberDecimal || 0.10))} strand drift`,
          body: `transferGroupBalance detects ${evt.unbalancedStrands || 1} strand(s) where Σ DR ≠ Σ CR. Offending strand: ${evt.offendingStrand || "STR-20260506-0047"}. A delta of ${fmtMoney(parseFloat(evt.delta?.$numberDecimal || 0.10))} indicates one leg has a wrong amount — not a missing leg. A reconciliationExceptions document is created with priority=HIGH. Period close is blocked until resolved.`,
          callout: { variant: "important", title: "STRAND_DRIFT exception created", body: "transferGroupBalance is the earliest detector — it fires continuously, so the delta is caught minutes after posting, not at EOD." },
          doc: null,
        };
      }
      return {
        overline: `${indexLabel} · transferGroupBalance`,
        title: "BALANCED — all strands balanced",
        body: `transferGroupBalance scans ${evt.strandCount || 142} transfer strands. All return Σ DR = Σ CR. Delta = $0.00 across ${fmtMoney(parseFloat(evt.totalDebit?.$numberDecimal || 984723.11))} posted. Run 1 completes in BALANCED status — no exception lifecycle needed for this run.`,
        doc: null,
      };
    }

    case "TGB_EXCEPTION": {
      const exType = evt.exception?.exceptionType || "STRAND_DRIFT";
      const isPipelineLag = exType === "PIPELINE_LAG";
      return {
        overline: `${indexLabel} · Exception created`,
        title: isPipelineLag ? "PIPELINE_LAG exception created" : "STRAND_DRIFT exception created",
        body: isPipelineLag
          ? "The subledgerToGL run detects that the ASP glSummaryPipeline has stalled — sub-ledger entry count exceeds GL entry count by 116 entries. A reconciliationExceptions document is created with errorClass=pipeline_stall. The operator is paged. Period close is blocked."
          : "A reconciliationExceptions document is created: OPEN status, priority=HIGH, slaHours=8. The exception captures the strand ID, break amount, and the control account. The exception lifecycle begins: OPEN → INVESTIGATING → RESOLVED. Period close cannot proceed until all exceptions are resolved.",
        callout: { variant: "important", title: "Period close blocked", body: "All reconciliation exceptions must be RESOLVED before GATE_NO_EXCEPTIONS can pass." },
        doc: { collectionKey: null, label: "reconciliationExceptions", payload: evt.exception || null },
      };
    }

    case "TGB_RESOLVED": {
      const isPipelineLag = evt.note && evt.note.includes("pipeline");
      return {
        overline: `${indexLabel} · Exception resolved`,
        title: isPipelineLag ? "Pipeline restarted — catch-up complete" : "Exception RESOLVED — correction journal posted",
        body: isPipelineLag
          ? "The operator restarts the glSummaryPipeline via Atlas Stream Processing console. The pipeline catches up: 116 missing entries are projected into GL. A re-run of subledgerToGL returns BALANCED. Exception status → RESOLVED. Period close is unblocked."
          : "Analyst confirms the root cause (one sub-ledger leg had a wrong amountBaseMinor). An ADJUSTMENT journal corrects the Δ$0.10 break. A re-run of transferGroupBalance returns all 142 strands BALANCED. Exception status → RESOLVED. The correction journal provides a complete audit trail — the original wrong entry is never modified.",
        callout: { variant: "note", title: "Immutability preserved", body: "The wrong entry is not updated. An ADJUSTMENT journal corrects the break. Both documents form the audit trail." },
        doc: null,
      };
    }

    case "RUN_SGL_START":
      return {
        overline: `${indexLabel} · subledgerToGL`,
        title: "Run 2 — subledgerToGL scanning",
        body: "subledgerToGL compares the sum of all sub-ledger entries for control account 2100 against the GL summary. This run catches mismatches between the entity-level detail (sub-ledger) and the GL aggregate — most commonly caused by ASP projection lag or a pipeline stall. It runs nightly and on-demand before period close.",
        doc: null,
      };

    case "RUN_SGL_RESULT": {
      const isLag = evt.status === "PIPELINE_LAG";
      if (isLag) {
        return {
          overline: `${indexLabel} · subledgerToGL`,
          title: `PIPELINE_LAG — Δ${fmtMoney(parseFloat(evt.delta?.$numberDecimal || 2311.89))} ASP lag detected`,
          body: `subledgerToGL counts ${evt.subLedgerCount || 58947} sub-ledger entries but only ${evt.glCount || 58831} GL entries. Delta: ${fmtMoney(parseFloat(evt.delta?.$numberDecimal || 2311.89))}. Root cause: glSummaryPipeline stalled at ${evt.aspLag?.lastCheckpoint || "2026-05-06T17:58:00Z"}. Lag: ${evt.aspLag?.lagMs || 4200}ms. A reconciliationExceptions document is created. The operator must restart the ASP pipeline before period close.`,
          callout: { variant: "important", title: "ASP pipeline stall detected", body: "cdcDeadLetters will have captured any failed projection events. Check cdcDeadLetters.pipeline = 'glSummaryPipeline' before restarting." },
          doc: null,
        };
      }
      return {
        overline: `${indexLabel} · subledgerToGL`,
        title: "BALANCED — sub-ledger matches GL",
        body: `subledgerToGL: ${fmtMoney(parseFloat(evt.subLedgerTotal?.$numberDecimal || 984723.11))} across ${evt.subLedgerCount || 58947} sub-ledger entries equals ${fmtMoney(parseFloat(evt.glTotal?.$numberDecimal || 984723.11))} in GL. Delta = $0.00. No ASP lag detected. Run 2 completes in BALANCED status.`,
        doc: null,
      };
    }

    case "GATE_RUN_BALANCED":
      return {
        overline: `${indexLabel} · Period close · Gate 1`,
        title: "Gate 1 PASS — all runs BALANCED",
        body: "Period-close gate 1 requires all reconciliation runs to return BALANCED before the period can close. transferGroupBalance: BALANCED ✓. subledgerToGL: BALANCED ✓. Both runs completed without open exceptions. Gate 1 is now open.",
        callout: { variant: "note", title: "Gate 1 cleared", body: "All reconciliation runs BALANCED. Advancing to Gate 2: SoD verification." },
        doc: null,
      };

    case "GATE_SOD":
      return {
        overline: `${indexLabel} · Period close · Gate 2`,
        title: "Gate 2 PASS — SoD verified",
        body: "Period-close gate 2 re-runs the SoD predicate across all journal entries in the period: { $expr: { $ne: ['$createdBy', '$approvedBy'] } }. Zero violations found for May 2026. SOX 404 ITGC control verified. Gate 2 is now open.",
        callout: { variant: "note", title: "Gate 2 cleared", body: "SoD verified across all journal entries. Advancing to Gate 3: trial balance." },
        doc: null,
      };

    case "GATE_TRIAL":
      return {
        overline: `${indexLabel} · Period close · Gate 3`,
        title: "Gate 3 PASS — trial balance Σ = 0",
        body: "Period-close gate 3 runs a trialBalance aggregation across all glJournalEntries for period 2026-05: { $sum: '$amountBaseMinor' }. Result: $0.00. Pacioli invariant verified at period level. Gate 3 is now open.",
        callout: { variant: "note", title: "Gate 3 cleared", body: "Trial balance Σ = $0.00 for May 2026. Advancing to Gate 4: exception clearance." },
        doc: null,
      };

    case "GATE_NO_EXCEPTIONS":
      return {
        overline: `${indexLabel} · Period close · Gate 4`,
        title: "Gate 4 PASS — no open exceptions",
        body: "Period-close gate 4 queries reconciliationExceptions where { periodCode: '2026-05', status: { $ne: 'RESOLVED' } }. Count: 0. All exceptions resolved. Gate 4 is now open. All four gates have cleared — the period can be closed.",
        callout: { variant: "note", title: "All 4 gates cleared", body: "Zero open exceptions for May 2026. Initiating period close." },
        doc: null,
      };

    case "PERIOD_CLOSED":
      return {
        overline: `${indexLabel} · Period CLOSED`,
        title: "Period 2026-05 CLOSED · LOCKED",
        body: "accountingPeriods document for 2026-05 is updated to status=CLOSED. All glJournalEntries for this period are now locked — the period close adds an additional immutability layer. Any correction to a closed-period entry requires a new journal in the current open period with a reference to the closed period. The audit trail is complete and unalterable.",
        callout: {
          variant: "note",
          title: "Period closed · BCBS 239 P6 compliant",
          body: "All 4 gates passed: Runs balanced ✓ · SoD verified ✓ · Trial balance Σ = 0 ✓ · No open exceptions ✓. Closing timestamp and operator identity recorded.",
        },
        doc: {
          collectionKey: null,
          label: "accountingPeriods",
          payload: {
            periodCode: "2026-05",
            periodName: "May 2026",
            status: "CLOSED",
            closedAt: { $date: new Date().toISOString() },
            closedBy: "period-close-svc",
            gates: { runBalanced: true, sod: true, trial: true, noExceptions: true },
          },
        },
      };

    default:
      return {
        overline: "Reconcile",
        title: "Three-run reconciliation",
        body: "Walk through MongoDB's three-run integrity check: transferGroupBalance (per-strand), subledgerToGL (ASP vs GL), and trialBalance + 4-gate period close. Choose a scenario — Perfect Balance, Strand Drift, or Pipeline Lag — to see how each exception is detected, investigated, and resolved before the period closes.",
        doc: null,
      };
  }
}
