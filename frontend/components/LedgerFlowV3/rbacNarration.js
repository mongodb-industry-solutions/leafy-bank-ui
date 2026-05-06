import { RBAC_STAGE_LIST } from "./rbacReducer";

export function rbacNarrationFor(r = {}) {
  const stage = r.currentStage;
  const idx = r.stageIndex ?? -1;
  const total = RBAC_STAGE_LIST.length;
  const label = idx >= 0 ? `Stage ${idx + 1} of ${total}` : `Stage 0 of ${total}`;

  switch (stage) {
    case "RBAC_ROLES":
      return {
        overline: label,
        title: "Seven-role catalog — least privilege enforced",
        body: "Every service account and human operator is assigned exactly one role. Roles are scoped to the minimum required: lbLedgerWriter can INSERT but never DELETE. lbCDCDaemon holds only a changeStream cursor on journalEntries. lbErasureOfficer can update only the DEK field in customers. No role has broad admin access by default.",
        doc: null,
      };
    case "RBAC_BLAST_RADIUS":
      return {
        overline: label,
        title: "Blast radius — compromised credentials",
        body: "If lbLedgerWriter credentials are compromised, the attacker can insert journal entries but cannot delete them, cannot alter validators, cannot reach encrypted DEK fields, and cannot read reconciliationRuns or auditLog. Least-privilege partitioning limits the blast radius of any single credential compromise — damage is bounded, detectable, and reversible.",
        doc: null,
      };
    case "RBAC_BREAKGLASS":
      return {
        overline: label,
        title: "breakGlassAdmin — 4-hour TTL, 2-person approval",
        body: "The breakGlassAdmin role is never permanently assigned. It is created on demand, requires a linked Jira/ServiceNow ticket, two-person approval, and auto-expires after 4 hours. Every grant event — creation, first use, expiry — is written to auditLog. The role cannot modify auditLog, preventing self-concealment.",
        doc: null,
      };
    case "RBAC_OCSF":
      return {
        overline: label,
        title: "OCSF audit — every authorization event emitted",
        body: "Setting auditAuthorizationSuccess: true emits an OCSF 4002 (Authorization Activity) event for every successful DB operation — not just failures. Events flow MongoDB → fluentd → SIEM. Query patterns across roles become visible to threat detection. Anomaly detection can fire before damage accumulates.",
        callout: {
          variant: "note",
          title: "OCSF 4002 — Authorization Activity schema",
          body: "Fields: actor.user, resources[].name, activity_id (1=allow/2=deny), time, dst_endpoint. Compatible with Splunk, CrowdStrike SIEM, Elastic SIEM.",
        },
        doc: null,
      };
    case "RBAC_WORM":
      return {
        overline: label,
        title: "Four WORM mechanisms — pick what fits your stack",
        body: "The auditLog must be tamper-evident. Four certified mechanisms: S3 Object Lock (Compliance mode, 7-year retention), siem-worm (append-only SIEM forwarding with hash chain), syslog-immutable (syslog-ng to append-only volume), blockchain-anchor (Merkle root anchored to public chain). All four are compatible with the RFC 3161 timestamp embedded in every WORM Sink record.",
        doc: null,
      };
    default:
      return {
        overline: "Idle",
        title: "RBAC & Audit — Seven Roles, Zero Trust",
        body: "Press Simulate to walk through the role catalog, blast radius analysis, breakGlass policy, OCSF audit configuration, and the four WORM tamper-evidence mechanisms.",
        doc: null,
      };
  }
}
