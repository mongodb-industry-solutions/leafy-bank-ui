# LedgerFlow V3 — Phase E Implementation Plan

Generated: 2026-05-06

## Scope

Arrow alignment fixes + architecture spec incorporation (key elements only, good narrative arc). No new scenes — enrich existing 6 scenes in place. 3 reconciliation scenarios with selector.

---

## A. Arrow Alignment Fixes

### A1. FanoutCanvas — CDC exit points
**Problem:** `y1 = CDC_CY + (row.midY - CDC_CY) * 0.18` clusters all three fan-out lines near the CDC circle's horizontal center-right. Lines should exit the circle's actual circumference at the angle toward each consumer row.

**Fix:** Compute exit point as true circle intersection:
- CDC center: (530, 192), radius 62
- For each consumer midY, compute angle `θ = atan2(midY - CDC_CY, CON_X - CDC_CX)`
- Exit point: `(CDC_CX + CDC_R * cos(θ), CDC_CY + CDC_R * sin(θ))`
- Pre-compute in JS: hardcode the 3 values

**Pre-computed:**
- Row 0 (midY ≈ 101): exit ≈ (584.6, 162.5) — angle -28°
- Row 1 (midY ≈ 195): exit ≈ (592, 192.2) — near horizontal
- Row 2 (midY ≈ 289): exit ≈ (584.6, 221.7) — angle +28°

### A2. HardEdgeCanvas — Recovery arrow
**Problem:** Recovery arrow path `M1020,296 C940,296 500,296 420,296` has all control-point y values equal to 296 — renders as a straight line.

**Fix:** Arc the bezier control points below the card zone (y + 80):
```
M1020,296 C980,376 460,376 420,296
```
This routes the arrow below the card bottom (cards end at y=332), giving a clear visual for the backward recovery path.

---

## B. Architecture Enhancements (in-canvas, no new stages)

### B1. StageCanvas (Posting) — ISO 20022 source badge
**Where:** Left side of canvas, visible from PAYMENT_INITIATED onward.
**What:** Small badge near Frida node: `ISO 20022 · PACS.008` with CBPR+ sub-label. Shows the payment arrived via ingest/mapping layer even though we don't animate those stages.

### B2. StageCanvas (Posting) — w:majority + MDT badge
**Where:** JournalCore node, appear on JOURNAL_POSTED.
**What:** Pill badge below journalId: `MDT · w:majority · j:true · snapshot isolation`
Shows that the 3-collection write (subLedgerEntries × 2 + journalEntries) is wrapped in a multi-document transaction with majority write concern.

### B3. FanoutCanvas — WORM hash chain
**Where:** WORM consumer card (row 2), below the resume token row.
**What:** Two rows showing hash chaining:
- `prevHash: a1b2c3d4e5f6…`
- `hash: sha256(prevHash ‖ payload)` → `f7a3b9c2d1e8…`
- `seq: 8821 · RFC 3161 anchored`

### B4. FanoutCanvas — postBatchResumeToken
**Where:** CDC change event badge
**What:** Add PBRT label below the event badge: `PBRT checkpointed — durable cursor position`

### B5. StageCanvas (Posting) — Reconcile membrane label
**Current:** `→ Scene 5` (too vague)
**Fix:** Update sublabel to `EOD period close` — clearer what the deferral means

---

## C. Reconciliation Scenarios (3 variants)

### C1. Scenarios
| Key | Name | Delta | Root cause |
|-----|------|-------|-----------|
| `FX_ROUNDING` | FX Pence Rounding | −$1.00 | FX conversion in SL-20260430-047823 |
| `DUPLICATE` | Duplicate Posting | −$250.00 | Payment posted twice to sub-ledger |
| `MATCH` | Perfect Balance | $0.00 | All entries match immediately |

### C2. Changes needed
1. **reconcileFixtures.js** — Add `DUPLICATE_SCENARIO` and `MATCH_SCENARIO` exports with scenario-specific `RECONCILE_RUN`, `RECONCILE_EXCEPTION`, `CORRECTION_JOURNAL`.
2. **reconcileReducer.js** — Add `scenario: "FX_ROUNDING"` to `reconcileInitialState`. Pass through `RECONCILE_SET_SCENARIO` action.
3. **ledgerReducerV3.js** — Forward `RECONCILE_SET_SCENARIO` to reconcileReducer. Preserve `scenario` across scene transitions.
4. **ReconcileCanvas.jsx** — Accept `scenario` prop, look up correct fixture data per scenario.
5. **LedgerFlowV3.jsx** — Add scenario selector (3 pills) visible when scene is RECONCILE or before Start. Dispatch `RECONCILE_SET_SCENARIO`.
6. **reconcileNarration.js** — Branch narration per scenario.

### C3. MATCH scenario behavior
- Stages: SCANNING_SOURCE → SCANNING_TARGET → BALANCE_CHECK → RESULT_BALANCED → RESOLVED
- Skip EXCEPTION_CREATED, INVESTIGATION_OPENED, CORRECTION_POSTED stages
- Beam stays green, delta shows $0.00 BALANCED immediately

### C4. DUPLICATE scenario behavior
- Delta: $250.00 (the payment amount was double-posted)
- Exception: `DUPLICATE_POSTING` type, priority: `CRITICAL`
- Investigation: "Found duplicate insert for PAY-20260506-0042 — reversal journal required"
- Correction: Reversal journal JNL-20260506-REV-001

---

## D. Narration Updates

### D1. stageNarration.js (Posting)
- `PAYMENT_INITIATED`: mention "ISO 20022 PACS.008 ingested, mapped to canonical PaymentOrder"
- `JOURNAL_POSTED`: mention "multi-document transaction · w:majority · snapshot isolation — 3 writes atomic"
- `CHANGE_STREAM`: mention "postBatchResumeToken checkpointed"

### D2. fanoutNarration.js
- `FANOUT_CONSUMER_WORM`: mention "hash-chained · SHA-256(prevHash ‖ payload) · RFC 3161 timestamp anchored · S3 Object Lock compatible"

### D3. reconcileNarration.js
- Branch on scenario in each stage narration
- `RESULT_BALANCED` (MATCH): "Zero-delta — period-close gate opens immediately"
- `RESULT_UNBALANCED` (FX_ROUNDING): existing text
- `RESULT_UNBALANCED` (DUPLICATE): "Duplicate posting detected — $250.00 double-entry on PAY-20260506-0042"

---

## E. Implementation Order

1. [A1] Fix FanoutCanvas fan-out exit points
2. [A2] Fix HardEdgeCanvas recovery arrow curve
3. [B5] Fix StageCanvas reconcile membrane sublabel
4. [B1] Add ISO 20022 source badge to StageCanvas
5. [B2] Add w:majority / MDT badge to StageCanvas journal
6. [B3] Add WORM hash chain rows to FanoutCanvas
7. [B4] Add PBRT label to FanoutCanvas CDC badge
8. [C1-C6] Reconciliation scenarios (all 6 sub-steps)
9. [D1-D3] Narration updates
10. Build check: `npm run build` in `frontend/`

---

## Files touched

- `frontend/components/LedgerFlowV3/FanoutCanvas.jsx`
- `frontend/components/LedgerFlowV3/HardEdgeCanvas.jsx`
- `frontend/components/LedgerFlow/StageCanvas.jsx`
- `frontend/components/LedgerFlowV3/reconcileFixtures.js`
- `frontend/components/LedgerFlowV3/reconcileReducer.js`
- `frontend/components/LedgerFlowV3/ledgerReducerV3.js`
- `frontend/components/LedgerFlowV3/ReconcileCanvas.jsx`
- `frontend/components/LedgerFlowV3/LedgerFlowV3.jsx`
- `frontend/components/LedgerFlow/stageNarration.js`
- `frontend/components/LedgerFlowV3/fanoutNarration.js`
- `frontend/components/LedgerFlowV3/reconcileNarration.js`
