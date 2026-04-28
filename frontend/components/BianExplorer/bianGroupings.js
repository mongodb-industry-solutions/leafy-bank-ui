// bianGroupings.js
// Hard-coded sub-domain groupings used to render Mongo→BIAN field mappings
// in BIAN-meaningful sub-records. The keys are the first dot-prefix of a
// Mongo path; "_top" is the special bucket for paths with no nesting.

export const GROUP_LABELS = {
  customers: {
    _top: "Identity & Status",
    identification: "Party Identification (PartyIdentification)",
    contact: "Party Contact Record (PartyContactRecord)",
    "contact.addresses[]": "Address Records",
    kyc: "KYC Record (CustomerKYCRecord)",
    "kyc.documents[]": "KYC Documents",
    "consents[]": "Consents",
    preferences: "Preferences",
  },
  accounts: {
    _top: "Account Identity & Status",
    party: "Account Party Reference",
    product: "Product Reference",
    balances: "Account Balances",
    terms: "Account Terms",
    interest: "Interest Configuration",
    fees: "Fee Schedule",
    "fees[]": "Fee Schedule",
    routing: "Routing / Wire Identifiers",
    overdraft: "Overdraft Configuration",
    statements: "Statement Configuration",
    audit: "Audit Trail",
  },
  payments: {
    _top: "Payment Order Identity & Status",
    payer: "Payer Party",
    payee: "Payee Party",
    amount: "Payment Amount",
    instruction: "Payment Instruction",
    rails: "Payment Rails",
    fees: "Fees",
    "fees[]": "Fees",
    settlement: "Settlement",
    audit: "Audit Trail",
  },
  transactions: {
    _top: "Transaction Identity & Status",
    account: "Posting Account",
    counterparty: "Counterparty",
    amount: "Transaction Amount",
    posting: "Posting Details",
    classification: "Classification / Category",
    metadata: "Metadata",
    audit: "Audit Trail",
  },
};

// Title-case a prefix for fallback group labels when a key is not in
// GROUP_LABELS, e.g. "fxDetails" → "Fx Details", "kyc.documents[]" →
// "Kyc / Documents []".
export function fallbackGroupLabel(prefix) {
  if (!prefix || prefix === "_top") return "Top-level / Identity";
  return prefix
    .split(".")
    .map((seg) => {
      const isArray = seg.endsWith("[]");
      const base = isArray ? seg.slice(0, -2) : seg;
      const titled =
        base.charAt(0).toUpperCase() +
        base.slice(1).replace(/([A-Z])/g, " $1").replace(/_/g, " ");
      return isArray ? `${titled} []` : titled;
    })
    .join(" / ");
}

// Resolve a human label for a (domain, prefix) pair.
export function resolveGroupLabel(domain, prefix) {
  const labels = GROUP_LABELS[domain] || {};
  return labels[prefix] || fallbackGroupLabel(prefix);
}

// Compute the group key for a Mongo field path.
// Rules:
//   - "status"                    → "_top"
//   - "identification.taxId"      → "identification"
//   - "contact.addresses[].line1" → "contact.addresses[]"
//   - "kyc.documents[].type"      → "kyc.documents[]"
//   - "kyc.documents[]"           → "kyc.documents[]"  (path is itself an array root)
export function groupKeyForPath(path) {
  if (!path) return "_top";
  const dotIdx = path.indexOf(".");
  if (dotIdx === -1) return "_top";

  const segments = path.split(".");
  // Find the deepest prefix that ends in "[]", since array-of-record fields
  // belong to that array's group.
  for (let i = segments.length - 1; i >= 1; i--) {
    if (segments[i - 1].endsWith("[]")) {
      return segments.slice(0, i).join(".");
    }
  }
  // The path itself is an array root with a parent (e.g. "kyc.documents[]")
  // → route it to its own group rather than the parent's group.
  if (segments[segments.length - 1].endsWith("[]")) {
    return path;
  }
  return segments[0];
}
