# LedgerFlow Demo — v1 and v2

Leafy Bank ships two interactive ledger demos that walk through MongoDB's role in a core banking ledger. Both are built with Next.js 14, LeafyGreen UI, Framer Motion, and CSS Modules.

---

## LedgerFlow v1

**Route:** `/ledger-flow`

A single-scene, step-by-step simulation of a payment posting cycle. The user watches one transaction move through the full ledger stack — from payment initiation to end-of-day reconciliation — and can pause at each stage to read narration.

### Stages

| # | Stage key | What happens |
|---|-----------|-------------|
| 1 | `PAYMENT_INITIATED` | Payment instruction arrives; idempotency key generated |
| 2 | `SUBLEDGER_DEBIT` | Debit leg written to the subledger with Decimal128 precision |
| 3 | `SUBLEDGER_CREDIT` | Credit leg written; both legs form a balanced entry |
| 4 | `RECONCILE_SKIPPED` | Intra-day reconciliation window skipped (not end-of-day) |
| 5 | `JOURNAL_POSTED` | Multi-document transaction commits both legs atomically |
| 6 | `CHANGE_STREAM` | Change Stream event fires; CDC pipeline picks up the write |
| 7 | `BALANCE_PROJECTED_DEBIT` | Projected balance updated for the debit account |
| 8 | `BALANCE_PROJECTED_CREDIT` | Projected balance updated for the credit account |
| 9 | `EOD_RECONCILE_RUN` → `EOD_RECONCILE_RESULT` → `EOD_RECONCILE_RESOLVED` → `SETTLED` | End-of-day reconciliation run confirms both legs; transaction settles |

### Key MongoDB concepts shown

- **Idempotency key** — generated on `PAYMENT_INITIATED`; displayed in the ID row throughout
- **Decimal128** — monetary amounts stored as BSON Decimal128, not IEEE 754 float
- **Multi-document transactions** — journal entry commits as an atomic, all-or-nothing operation
- **Change Streams** — downstream balance projection driven by a resume-token cursor
- **Immutable audit** — journal entries are never updated; corrections are compensating entries

### Controls

- **Simulate** — plays all stages with timed delays
- **Step / Next / Prev** — manual stage-by-stage navigation
- **Reset** — clears state and returns to `PAYMENT_INITIATED`
- Keyboard: `→` / `Space` advance, `←` goes back

---

## LedgerFlow v2

**Route:** `/ledger-flow/v3`  
*(The URL suffix `/v3` is a historical artifact from the internal version numbering.)*

A nine-scene multi-arc demo covering the full lifecycle of a MongoDB-powered core banking platform — from customer onboarding through GDPR erasure. Each scene is independent; a scene strip at the top lets the presenter jump between them or advance linearly with the global Next button.

### Scene overview

| # | Scene key | Title | Stages |
|---|-----------|-------|--------|
| 1 | `ONBOARDING` | Onboarding — PII Vault & Queryable Encryption | 6 |
| 2 | `ARCH` | Architecture — Four-Layer Stack | 4 |
| 3 | `POSTING` | The Posting | 9 (same as v1) |
| 4 | `ENGINE` | Validation Engine | 4 |
| 5 | `RBAC` | RBAC & Least Privilege | 5 |
| 6 | `FANOUT` | CDC Fan-out | 7 |
| 7 | `HARD_EDGE` | Hard Edge — Error 286 | 6 |
| 8 | `RECONCILE` | Reconciliation | up to 12 (3 scenarios) |
| 9 | `ERASURE` | GDPR Erasure — Crypto-shredding | 6 |

---

### Scene 1 — ONBOARDING

Frida Karlsson is onboarded as a new customer. Her PII (national ID, tax ID, passport) is encrypted client-side via **MongoDB Queryable Encryption** before any write reaches the server.

| Stage | What happens |
|-------|-------------|
| `ONBOARD_KYC_CAPTURE` | KYC form submitted; PII fields marked for encryption |
| `ONBOARD_DEK_GEN` | A per-customer **Data Encryption Key (DEK)** is generated |
| `ONBOARD_ENCRYPT_WRITE` | PII encrypted to BSON subType `06`; ciphertext written to `customers` collection |
| `ONBOARD_BALANCE_INIT` | Initial account balance document created in `accountBalances` |
| `ONBOARD_KMS_WRAP` | DEK wrapped by the master key in the KMS (AWS KMS / Azure Key Vault / GCP KMS) |
| `ONBOARD_QUERY_DEMO` | Equality query runs against encrypted field without decrypting the stored ciphertext |

**Key concepts:** Queryable Encryption, per-customer DEK, KMS key wrapping, BSON subType 06.

---

### Scene 2 — ARCH

A visual tour of the four-layer architecture that underpins the ledger.

| Stage | What is revealed |
|-------|-----------------|
| `ARCH_LAYERS` | Four horizontal bands appear: Journal, CDC, ASP (Account State Processor), WORM |
| `ARCH_COLLECTIONS` | Collection pills appear inside each band: `journalEntries`, `paymentInstructions`, `cdcResumeTokens`, `accountBalances`, `customers`, `reconciliationRuns`, `reconciliationExceptions`, `auditLog` |
| `ARCH_ENFORCED` | Overlay table distinguishes ENGINE (preventive) vs DETECTIVE (after-the-fact) controls |
| `ARCH_PRINCIPLES` | Three invariant boxes: Immutable Journal, Single CDC Cursor, WORM Tamper Evidence |

---

### Scene 3 — POSTING

Identical to v1 stages; supports two configurable dimensions before starting:

- **Transaction type:** Domestic wire, SEPA credit transfer, SWIFT cross-border, Internal transfer
- **Scenario:** Standard posting, FX rounding, EOD reconciliation

---

### Scene 4 — ENGINE

The validation engine that runs before a journal entry is committed.

| Stage | Gate checked |
|-------|-------------|
| `ENGINE_SCHEMA` | JSON Schema validation — required fields, Decimal128 type enforcement |
| `ENGINE_BALANCE` | Pre-write balance check — sufficient funds, no overdraft |
| `ENGINE_IDEMPOTENCY` | Duplicate detection via idempotency key index |
| `ENGINE_COMMIT` | All gates pass; atomic multi-document transaction commits |

---

### Scene 5 — RBAC

MongoDB role-based access control for the ledger service accounts.

| Stage | What is shown |
|-------|--------------|
| `RBAC_ROLES` | Seven-role catalog rendered as a table: `lbLedgerWriter`, `lbLedgerReader`, `lbCDCDaemon`, `lbReconciler`, `lbErasureOfficer`, `lbAuditor`, `lbBreakGlass` |
| `RBAC_BLAST_RADIUS` | Blast-radius analysis — what each role can and cannot touch |
| `RBAC_BREAKGLASS` | `breakGlassAdmin` role with 4-hour TTL, MFA gate, dual-approval |
| `RBAC_OCSF` | MongoDB audit log emitting **OCSF 4002 Authorization Activity** events to SIEM |
| `RBAC_WORM` | WORM sink destinations: S3 Object Lock, siem-worm, syslog-immutable, blockchain-anchor |

---

### Scene 6 — FANOUT

Change Stream fan-out pattern: one CDC cursor drives multiple downstream consumers.

| Stage | What happens |
|-------|-------------|
| `FANOUT_STREAM_OPEN` | Change Stream cursor opens on `journalEntries`; resume token stored |
| `FANOUT_EVENT_ARRIVES` | Insert event received from the change stream |
| `FANOUT_BALANCE_UPDATE` | ASP writes projected balance to `accountBalances` |
| `FANOUT_NOTIFICATION` | Push notification dispatched to customer mobile app |
| `FANOUT_ANALYTICS` | Event forwarded to analytics pipeline (Kafka / Atlas Stream Processing) |
| `FANOUT_RESUME_TOKEN` | Resume token checkpointed; cursor survives process restart |
| `FANOUT_DLQ` | Poison-pill event detected; routed to Dead Letter Queue for manual review |

---

### Scene 7 — HARD_EDGE

What happens when the WORM sink returns **error 286** (storage class violation).

| Stage | What happens |
|-------|-------------|
| `HARD_EDGE_WRITE_ATTEMPT` | Audit log write attempted to immutable WORM collection |
| `HARD_EDGE_ERROR_286` | MongoDB returns error 286 — document violates storage class rules |
| `HARD_EDGE_RETRY` | Exponential back-off retry with jitter |
| `HARD_EDGE_FALLBACK` | Fallback path: event written to secondary WORM sink |
| `HARD_EDGE_RFC3161` | RFC 3161 timestamp token attached; SHA-256 chained hash computed |
| `HARD_EDGE_CAUGHT_UP` | Primary sink recovers; catch-up replay verifies hash chain integrity |

---

### Scene 8 — RECONCILE

Three runnable scenarios that exercise the reconciliation engine.

**Scenarios:**

| Scenario key | Description |
|---|---|
| `STANDARD` | Clean period — all entries balance; period closes cleanly |
| `FX_ROUNDING` | FX rounding differences surfaced as `reconciliationExceptions`; resolved via tolerance rules |
| `LATE_ARRIVAL` | Late-arriving journal entry processed after initial run; recon re-run to incorporate it |

**Stages (happy path):**

`RECONCILE_INIT` → `RECONCILE_LOAD_JOURNAL` → `RECONCILE_LOAD_BALANCES` → `RECONCILE_COMPARE` → `RECONCILE_MATCH` → `RECONCILE_EXCEPTION_CHECK` → `RECONCILE_EXCEPTION_RESOLVE` → `RECONCILE_SIGN_OFF` → `RECONCILE_WORM_WRITE` → `RECONCILE_AUDIT_LOG` → `PERIOD_CLOSED`

Exception scenarios insert additional stages between `RECONCILE_COMPARE` and `PERIOD_CLOSED`.

---

### Scene 9 — ERASURE

Frida exercises her **GDPR Article 17 Right to Erasure** via crypto-shredding.

| Stage | What happens |
|-------|-------------|
| `ERASURE_REQUEST` | Erasure request received and validated against the customer record |
| `ERASURE_DEK_REVOKE` | DEK deleted from the KMS; ciphertext in `customers` becomes permanently unreadable |
| `ERASURE_VERIFY` | Decryption attempt confirms the data is inaccessible (key not found) |
| `ERASURE_JOURNAL_RETAIN` | Journal entries are **not** deleted — the ledger is immutable; only PII is erased |
| `ERASURE_AUDIT_WRITE` | Erasure event written to WORM audit log with RFC 3161 timestamp |
| `ERASURE_AUDIT_LOGGED` | Audit log confirms the erasure; compliance record sealed |

**Key concept:** Crypto-shredding preserves ledger integrity (no deletions) while satisfying GDPR — the journal lives on, but the PII it referenced is permanently unreadable.

---

## Navigation

Both demos share the same keyboard shortcuts:

| Key | Action |
|-----|--------|
| `→` or `Space` | Advance one stage |
| `←` | Go back one stage |
| `R` | Reset current scene |

The v2 demo adds a **scene strip** at the top — click any chip to jump directly to that scene. The global Next / Prev buttons in the control bar advance through scenes in sequence.
