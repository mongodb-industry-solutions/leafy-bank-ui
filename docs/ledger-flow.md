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

### Data model — Collections drawer

A **Collections** button in the v1 toolbar opens a wide two-pane drawer that browses the BIAN v14 ledger data model backing the demo. Database: `leafy_bank_bian`. SD `FinancialAccounting` · CR `FinancialBookingLog` · BQ `LedgerPosting` · Pattern `Management`.

| Collection | Role | Immutable? |
|---|---|---|
| `subLedgerEntries` | Per-entity sub-ledger detail rolling up to a GL control account | ✓ when `status=POSTED` |
| `journalEntries` | GL double-entry journals — balanced debit/credit lines, atomic posting | ✓ when `status=POSTED` |
| `glAccounts` | Chart of Accounts master registry; only level-4 accounts accept postings | — |
| `bianMappings` | Versioned BIAN field-name catalog — see below | mixed (per document) |

For each collection the drawer shows:

- BIAN classification badges (SD / CR / BQ / Pattern) and a hero with field/index/required counts
- Full **field table** with type, required flag, BIAN canonical alias, and notes
- For `journalEntries`, a separate **entry sub-fields** table for `entries[].*`
- **Indexes** as visual cards (unique / sparse / standard)
- **Sample document(s)** rendered as JSON
- **Design decisions** — the architectural choices behind the schema (idempotency, immutability, double-entry enforcement, Decimal128, sub-ledger ↔ GL relationship, source reference, running balance, BIAN mapping, mapping versioning)

#### `bianMappings` — versioned BIAN catalog

Two coexisting document shapes in one collection:

| Document | `versionType` | Lifecycle | Covers |
|---|---|---|---|
| `bian-mapping-mutable` | `mutable` | Updated in place; consumers always read latest | All business-logic collections (customers, accounts, payments, fraudEvaluation, fraudResolution, portfolioAllocation, portfolioPerformance, loans, creditReports, canonicalJsonStorage, glAccounts) |
| `bian-mapping-immutable-v{N}` | `immutable` | Write-once; new version = new document | Ledger collections only (`journalEntries`, `subLedgerEntries`) |

**Why split?** Posted journals are append-only and pin the mapping version they were canonicalized against (e.g. `mappingVersion: "v1.0"`). If the v1.0 mapping mutated after the fact, every historical journal pointing at v1.0 would silently observe a different schema — breaking the audit trail. Mirrors the schema-registry pattern (Confluent, Avro): versions are content-addressed snapshots, not editable rows.

**Enforcement (defense in depth):**

1. App layer rejects `updateOne` / `replaceOne` on any document where `$meta.versionType === "immutable"`.
2. Unique index on `$meta.documentId` — and `documentId` encodes the version — so the index itself blocks accidental upsert overwrite.
3. Writes funnel through a single ingestion service that stamps `pinnedAt = lastUpdatedAt` at first insert and refuses any later mutation.

**Reader contract:** historical ledger entries are always resolved against their pinned immutable mapping — never auto-upgraded. The mutable catalog is read for business-logic collections only.

---

## LedgerFlow v2

**Route:** `/ledger-flow/v3`  
*(The URL suffix `/v3` is a historical artifact from the internal version numbering.)*

An eight-scene multi-arc demo covering the full lifecycle of a MongoDB-powered core banking platform — from customer onboarding through GDPR erasure. Each scene is independent; a scene strip at the top lets the presenter jump between them or advance linearly with the global Next button.

Engine reconcile (Pacioli double-entry, SoD, idempotency) is **not** a separate scene — it's part of POSTING, fired before the GL journal commits, which is where it actually runs in a real bank. RECONCILE is reserved for the **detective** EOD reconciliation that runs after posting.

### Scene overview

| # | Scene key | Title | Stages |
|---|-----------|-------|--------|
| 1 | `ONBOARDING` | Onboarding — PII Vault & Queryable Encryption | 6 |
| 2 | `ARCH` | Architecture — Four-Layer Stack | 4 |
| 3 | `POSTING` | The Posting (incl. engine-reconcile gate) | 12 |
| 4 | `RBAC` | RBAC & Least Privilege | 5 |
| 5 | `FANOUT` | CDC Fan-out | 7 |
| 6 | `HARD_EDGE` | Hard Edge — Error 286 | 6 |
| 7 | `RECONCILE` | Detective Reconciliation (EOD) | up to 12 (3 scenarios) |
| 8 | `ERASURE` | GDPR Erasure — Crypto-shredding | 6 |

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

Same stage list as v1, with the v1 `RECONCILE_SKIPPED` placeholder reinterpreted as the **engine-reconcile gate** that fires before the GL journal commits. Three pre-commit invariants are enforced at the database (not in application code):

| Gate | Mechanism |
|------|-----------|
| Pacioli double-entry | `$expr: { $eq: [{ $sum: '$lines.amountBaseMinor' }, 0] }` |
| Segregation of Duties | `$expr: { $ne: ['$createdBy', '$approvedBy'] }` |
| Idempotency | Partial unique index on `externalRef` (filter `status: 'POSTED'`) → `E11000` on dup |

Supports two configurable dimensions before starting:

- **Transaction type:** Domestic wire, SEPA credit transfer, SWIFT cross-border, Internal transfer
- **Scenario:** Standard posting, FX rounding, EOD reconciliation

---

### Scene 4 — RBAC

MongoDB role-based access control for the ledger service accounts.

| Stage | What is shown |
|-------|--------------|
| `RBAC_ROLES` | Seven-role catalog rendered as a table: `lbLedgerWriter`, `lbLedgerReader`, `lbCDCDaemon`, `lbReconciler`, `lbErasureOfficer`, `lbAuditor`, `lbBreakGlass` |
| `RBAC_BLAST_RADIUS` | Blast-radius analysis — what each role can and cannot touch |
| `RBAC_BREAKGLASS` | `breakGlassAdmin` role with 4-hour TTL, MFA gate, dual-approval |
| `RBAC_OCSF` | MongoDB audit log emitting **OCSF 4002 Authorization Activity** events to SIEM |
| `RBAC_WORM` | WORM sink destinations: S3 Object Lock, siem-worm, syslog-immutable, blockchain-anchor |

---

### Scene 5 — FANOUT

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

### Scene 6 — HARD_EDGE

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

### Scene 7 — RECONCILE

The **detective** EOD reconciliation — distinct from the engine-reconcile gate inside POSTING. Three runnable scenarios exercise it.

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

### Scene 8 — ERASURE

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
