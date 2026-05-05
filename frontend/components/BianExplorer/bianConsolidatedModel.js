// bianConsolidatedModel.js
// Curated, demo-facing reference model for the Consolidated BIAN Data Model
// tab. Static data — not live introspection. Subset of BIAN v14 service
// domains chosen to tell a coherent end-to-end banking story (4 SDs are
// backed by real Leafy Bank collections; the rest are illustrative).

import { palette } from "@leafygreen-ui/palette";

// Group accent colors. Customer/Account/Lending/Wealth map to LG palette
// tokens; Payments/CapitalMarkets/FraudAML/GLFinance are deliberately
// outside-LG (orange, pink, deep-red, olive) to give each group a distinct
// identity. Hex literals are kept here so the entire 8-color palette stays
// centralized; the CSS module mirrors them as custom properties at the top
// of the cons* style block.
export const SD_GROUPS = [
  { key: "Customer",       label: "Customer",        accent: palette.blue.base },     // #016BF8
  { key: "Account",        label: "Account",         accent: palette.green.dark2 },   // #00684A
  { key: "Payments",       label: "Payments",        accent: "#C2410C"            },  // outside-LG orange
  { key: "Lending",        label: "Lending",         accent: palette.purple.dark2 }, // #5E0C9E
  { key: "CapitalMarkets", label: "Capital Markets", accent: "#DB2777"            },  // outside-LG pink
  { key: "Wealth",         label: "Wealth",          accent: palette.blue.dark1 },    // #1254B7
  { key: "FraudAML",       label: "Fraud & AML",     accent: palette.red.base },      // #DB3030
  { key: "GLFinance",      label: "GL & Finance",    accent: "#65A30D"            },  // outside-LG olive
];

// LG Badge variant per BIAN pattern (Badge has 6 variants: darkgray,
// lightgray, red, yellow, blue, green). No purple — Administration falls back
// to blue.
export const PATTERN_BADGE_VARIANT = {
  Fulfillment:    "yellow",
  Management:     "blue",
  Monitoring:     "red",
  Administration: "blue",
  "Cross-Domain": "lightgray",
};

// Pastel pills for BIAN semantic types (the [Object][Attribute][Type] suffix).
// Each pill uses an LG palette light/dark pair; outside-LG pastels (orange,
// pink) are kept for type categories LG palette doesn't cover.
export const SEMANTIC_TYPE_STYLES = {
  Reference:    { bg: palette.blue.light3,  color: palette.blue.dark1 },   // #E1F7FF / #1254B7
  Identifier:   { bg: palette.purple.light3, color: palette.purple.dark2 }, // #F9EBFF / #5E0C9E
  Amount:       { bg: palette.green.light3, color: palette.green.dark2 },  // #E3FCF7 / #00684A
  CurrencyCode: { bg: palette.green.light3, color: palette.green.dark1 },  // #E3FCF7 / #00A35C
  Date:         { bg: palette.red.light3,   color: palette.red.dark2 },    // #FFEAE5 / #970606
  DateTime:     { bg: palette.red.light3,   color: palette.red.dark2 },
  Status:       { bg: "#FCE7F3",            color: "#9D174D" },            // outside-LG pink
  Type:         { bg: palette.blue.light3,  color: palette.blue.dark2 },   // #E1F7FF / #083C90
  Indicator:    { bg: palette.yellow.light3, color: palette.yellow.dark2 }, // #FEF7DB / #944F01
  Value:        { bg: palette.blue.light3,  color: palette.blue.dark2 },
  Text:         { bg: palette.gray.light2,  color: palette.gray.dark1 },   // #E8EDEB / #5C6C75
  Code:         { bg: "#FFE0BF",            color: "#93450B" },            // outside-LG amber
  Duration:     { bg: palette.purple.light3, color: palette.purple.dark2 },
  Record:       { bg: palette.blue.light3,  color: palette.blue.dark1 },
  "Record[]":   { bg: palette.blue.light3,  color: palette.blue.dark1 },
};

// BSON type pills used in the Schema view. Tones picked to be subordinate to
// the SD group accent (P1-1 color discipline).
export const BSON_TYPE_STYLES = {
  string: { bg: palette.green.light3,  color: palette.green.dark2 },
  int:    { bg: palette.yellow.light3, color: palette.yellow.dark2 },
  long:   { bg: palette.yellow.light3, color: palette.yellow.dark2 },
  double: { bg: "#FFE0BF",             color: "#93450B" },
  bool:   { bg: "#FCE7F3",             color: "#9D174D" },
  date:   { bg: palette.red.light3,    color: palette.red.dark2 },
  object: { bg: palette.blue.light3,   color: palette.blue.dark2 },
  array:  { bg: palette.purple.light3, color: palette.purple.dark2 },
};

// Infer a BIAN semantic type from a PascalCase BIAN field name suffix.
// Used when synthesizing a Control-Record view from collection.fields for
// SDs that don't have explicit CR data modeled below.
export function inferSemanticType(bianName) {
  if (!bianName) return "Text";
  if (/Reference(List)?$/.test(bianName)) return "Reference";
  if (/Identifier$/.test(bianName) || /Number$/.test(bianName)) return "Identifier";
  if (/Amount$/.test(bianName)) return "Amount";
  if (/CurrencyCode$/.test(bianName)) return "CurrencyCode";
  if (/DateTime$/.test(bianName)) return "DateTime";
  if (/Date$/.test(bianName)) return "Date";
  if (/Status$/.test(bianName)) return "Status";
  if (/Type$/.test(bianName)) return "Type";
  if (/Indicator$/.test(bianName)) return "Indicator";
  if (/Value$/.test(bianName) || /Rate$/.test(bianName) || /Score$/.test(bianName)) return "Value";
  if (/Code$/.test(bianName)) return "Code";
  if (/Record$/.test(bianName)) return "Record";
  if (/Duration$/.test(bianName)) return "Duration";
  return "Text";
}

const SYSTEM_FIELDS = [
  "RecordCreateDateTime",
  "RecordUpdateDateTime",
  "RecordCreatedByReference",
  "RecordVersionNumber",
  "SourceSystemReference",
];

// ---- Service domains -------------------------------------------------------

export const SERVICE_DOMAINS = [
  // ────────────────────────────────────────────────────────── CUSTOMER GROUP
  {
    key: "CustomerManagement",
    label: "Customer Management",
    group: "Customer",
    bianServiceDomain: "Party Reference Data Directory",
    bianControlRecord: "PartyReferenceDataDirectoryEntry",
    pattern: "Management",
    icon: "Person",
    isLive: true,
    related: ["AccountManagement", "PaymentOrder", "ConsumerLoan", "FraudEvaluation"],
    summary:
      "Holds the bank's master party record (individuals, corporates) including identification, contact, KYC and consent data.",
    collection: {
      mongoName: "customers",
      shardKey: '{ "customerId": 1 }',
      immutable: false,
      validation: "moderate",
      fields: [
        { name: "customerId", bsonType: "string", pk: true, required: true, bian: "CustomerReference", note: "Globally unique party identifier" },
        { name: "status", bsonType: "string", required: true, bian: "PartyApexStatus", note: "PROSPECT | ACTIVE | DORMANT | SUSPENDED | CLOSED" },
        { name: "type", bsonType: "string", required: true, bian: "PartyType", note: "INDIVIDUAL | CORPORATE | SME | TRUST | GOVERNMENT" },
        { name: "segment", bsonType: "string", bian: "CustomerSegmentType", note: "RETAIL | PREMIER | PRIVATE_BANKING | CORPORATE" },
        { name: "since", bsonType: "date", bian: "CustomerSinceDate" },
        { name: "rmId", bsonType: "string", bian: "PartyRelationshipManagerReference" },
        { name: "legalName", bsonType: "string", bian: "PartyLegalName" },
        { name: "tradingName", bsonType: "string", bian: "PartyTradingName" },
        { name: "dateOfBirth", bsonType: "date", bian: "PartyDateOfBirthDate" },
        { name: "nationality", bsonType: "string", bian: "PartyNationalityCode", note: "ISO 3166-1 alpha-2" },
        { name: "nationalId", bsonType: "string", bian: "NationalIdentityNumber", note: "Encrypted at rest" },
        { name: "taxId", bsonType: "string", bian: "TaxIdentificationNumber", note: "Encrypted at rest" },
        { name: "lei", bsonType: "string", bian: "LegalEntityIdentifier", note: "ISO 17442 (corporates)" },
        { name: "email", bsonType: "string", bian: "PartyContactEmailAddress" },
        { name: "phone", bsonType: "string", bian: "PartyContactPhoneNumber", note: "E.164 format" },
        { name: "kycStatus", bsonType: "string", bian: "CustomerKYCProcedureStatus", note: "PENDING | VERIFIED | EXPIRED | FAILED" },
        { name: "kycLevel", bsonType: "string", bian: "CustomerKYCVerificationLevelType", note: "BASIC | STANDARD | ENHANCED | EDD" },
        { name: "isPEP", bsonType: "bool", bian: "PoliticallyExposedPersonIndicator", note: "FATF PEP flag" },
        { name: "sanctionsStatus", bsonType: "string", bian: "PartySanctionsStatusType", note: "CLEAR | HIT | PENDING_REVIEW" },
        { name: "addresses", bsonType: "array", bian: "PartyAddressRecord", note: "type, line1/2, city, state, postcode, country, validFrom/To" },
        { name: "kycDocuments", bsonType: "array", bian: "CustomerKYCDocumentRecord", note: "docType, vaultRef, issuedAt, expiresAt" },
        { name: "amlChecks", bsonType: "array", bian: "PartyAMLCheckRecord", note: "checkType, checkedAt, result, provider" },
        { name: "relationships", bsonType: "array", bian: "PartyRelationshipRecord", note: "relatedCustomerId, type, ownershipPct" },
        { name: "consents", bsonType: "array", bian: "PartyConsentRecord", note: "consentType, granted, channel — GDPR/CCPA" },
      ],
      systemFields: SYSTEM_FIELDS,
    },
    controlRecord: {
      fields: [
        { name: "CustomerReference", type: "Reference", impl: "customerId", note: "CR primary key — globally unique party identifier" },
        { name: "PartyApexStatus", type: "Status", impl: "status", note: "PROSPECT | ACTIVE | DORMANT | SUSPENDED | CLOSED" },
        { name: "PartyType", type: "Type", impl: "type", note: "INDIVIDUAL | CORPORATE | SME | TRUST | GOVERNMENT | FINANCIAL_INSTITUTION" },
        { name: "CustomerSegmentType", type: "Type", impl: "segment", note: "RETAIL | PREMIER | PRIVATE_BANKING | CORPORATE | INSTITUTIONAL" },
        { name: "PartyRelationshipManagerReference", type: "Reference", impl: "rmId", note: "→ EmployeeDirectory" },
        { name: "CustomerSinceDate", type: "Date", impl: "since", note: "Date relationship established" },
      ],
      behaviorQualifiers: [
        {
          name: "PartyIdentification",
          bianBQ: "Party Identification (BQ)",
          fields: [
            { name: "PartyLegalName", type: "Text" },
            { name: "PartyTradingName", type: "Text", note: "Corporate DBA name" },
            { name: "PartyDateOfBirthDate", type: "Date", note: "Individual only" },
            { name: "PartyNationalityCode", type: "Code", note: "ISO 3166-1 alpha-2" },
            { name: "NationalIdentityNumber", type: "Identifier", note: "Encrypted at rest" },
            { name: "TaxIdentificationNumber", type: "Identifier", note: "Encrypted — TIN/EIN/VAT" },
            { name: "LegalEntityIdentifier", type: "Identifier", note: "ISO 17442 LEI code" },
          ],
        },
        {
          name: "PartyContactRecord",
          bianBQ: "Party Contact Record (BQ)",
          fields: [
            { name: "PartyContactEmailAddress", type: "Text" },
            { name: "PartyContactPhoneNumber", type: "Text", note: "E.164 format" },
            { name: "PreferredLanguageCode", type: "Code", note: "ISO 639-1" },
            { name: "PreferredCommunicationChannelType", type: "Type", note: "MOBILE | WEB | BRANCH | PHONE | POST" },
            { name: "PartyAddressRecord[]", type: "Record[]", note: "HOME | WORK | MAILING | REGISTERED_OFFICE" },
          ],
        },
        {
          name: "CustomerKYCRecord",
          bianBQ: "Customer KYC Record (BQ)",
          fields: [
            { name: "CustomerKYCProcedureStatus", type: "Status", note: "PENDING | VERIFIED | EXPIRED | FAILED" },
            { name: "CustomerKYCVerificationLevelType", type: "Type", note: "BASIC | STANDARD | ENHANCED | EDD" },
            { name: "CustomerKYCVerificationDate", type: "Date" },
            { name: "CustomerKYCNextReviewDate", type: "Date" },
            { name: "PoliticallyExposedPersonIndicator", type: "Indicator", note: "PEP flag per FATF guidance" },
            { name: "PartySanctionsStatusType", type: "Type", note: "CLEAR | HIT | PENDING_REVIEW" },
            { name: "CustomerKYCDocumentRecord[]", type: "Record[]", note: "docType, vaultRef, expiryDate" },
            { name: "PartyAMLCheckRecord[]", type: "Record[]", note: "checkType, date, result, providerRef" },
          ],
        },
        {
          name: "PartyConsentRecord",
          bianBQ: "Party Consent Record (BQ) — GDPR/CCPA",
          fields: [
            { name: "PartyConsentType", type: "Type", note: "MARKETING | DATA_SHARING | CREDIT_BUREAU_ACCESS | THIRD_PARTY" },
            { name: "PartyConsentGrantedIndicator", type: "Indicator" },
            { name: "PartyConsentGrantedDateTime", type: "DateTime" },
            { name: "PartyConsentExpiryDate", type: "Date" },
          ],
        },
      ],
      indexes: [
        '{ "customerId": 1 } unique',
        '{ "nationalId": 1 }',
        '{ "sanctionsStatus": 1 }',
        '{ "type": 1, "status": 1 }',
      ],
    },
    services: {
      dddServices: [
        "CustomerManagementService",
        "CustomerKYCService",
        "CustomerOnboardingService",
        "PartyDataQualityService",
      ],
      events: [
        "CustomerCreated",
        "CustomerSegmentChanged",
        "KYCVerificationCompleted",
        "KYCExpired",
        "CustomerSuspended",
        "CustomerClosed",
      ],
      bianOperations: ["Initiate", "Update", "Request", "Retrieve", "Control", "Exchange"],
    },
  },

  {
    key: "ProductManagement",
    label: "Product Catalog",
    group: "Customer",
    bianServiceDomain: "Product Directory",
    bianControlRecord: "ProductDirectoryEntry",
    pattern: "Management",
    icon: "Tag",
    isLive: false,
    related: ["AccountManagement", "ConsumerLoan", "InvestmentPortfolio"],
    summary:
      "Bank's catalog of sellable financial products with pricing, eligibility, regulatory category and GL mapping.",
    collection: {
      mongoName: "products",
      shardKey: '{ "productId": 1 }',
      immutable: false,
      validation: "moderate",
      fields: [
        { name: "productId", bsonType: "string", pk: true, required: true, bian: "ProductReference" },
        { name: "productCode", bsonType: "string", required: true, bian: "ProductCode" },
        { name: "name", bsonType: "string", required: true, bian: "ProductName" },
        { name: "type", bsonType: "string", bian: "ProductType", note: "CURRENT_ACCOUNT | SAVINGS | FIXED_DEPOSIT | PERSONAL_LOAN | MORTGAGE…" },
        { name: "status", bsonType: "string", bian: "ProductApexStatus", note: "ACTIVE | DEPRECATED | DISCONTINUED" },
        { name: "currency", bsonType: "string", bian: "ProductCurrencyCode" },
        { name: "interest", bsonType: "object", bian: "ProductInterestRecord", note: "rateType, nominalRate, benchmark, spread, tiers[]" },
        { name: "fees", bsonType: "array", bian: "ProductFeesAndChargesRecord", note: "feeType, amount, frequency, waivable" },
        { name: "limits", bsonType: "object", bian: "ProductLimitsRecord", note: "min/max balance, daily/monthly txn limits" },
        { name: "eligibility", bsonType: "object", bian: "ProductEligibilityRecord", note: "minAge, minIncome, residency, segment" },
        { name: "regulatory", bsonType: "object", bian: "ProductRegulatoryRecord", note: "MiFID class, riskCategory, suitabilityRequired" },
        { name: "gl", bsonType: "object", bian: "ProductGLMappingRecord", note: "asset/liability/income/expense GL refs" },
      ],
      systemFields: SYSTEM_FIELDS,
    },
    services: {
      dddServices: ["ProductCatalogService", "ProductEligibilityService", "ProductPricingService"],
      events: ["ProductLaunched", "ProductRateChanged", "ProductDeprecated", "ProductDiscontinued"],
      bianOperations: ["Register", "Update", "Retrieve", "Control"],
    },
  },

  // ─────────────────────────────────────────────────────────── ACCOUNT GROUP
  {
    key: "AccountManagement",
    label: "Current Account",
    group: "Account",
    bianServiceDomain: "Current Account",
    bianControlRecord: "CurrentAccountFulfillmentArrangement",
    pattern: "Fulfillment",
    icon: "Building",
    isLive: true,
    related: ["CustomerManagement", "AccountTransactions", "IssuedDevice", "FinancialAccounting"],
    summary:
      "Operational current/savings/deposit account with balance, interest, signatory and restriction sub-records.",
    collection: {
      mongoName: "accounts",
      shardKey: '{ "customerId": 1, "accountId": 1 }',
      immutable: false,
      validation: "moderate",
      fields: [
        { name: "accountId", bsonType: "string", pk: true, required: true, bian: "CurrentAccountReference" },
        { name: "accountNumber", bsonType: "string", required: true, bian: "CurrentAccountNumber", note: "IBAN or internal number" },
        { name: "status", bsonType: "string", required: true, bian: "CurrentAccountApexStatus", note: "ACTIVE | DORMANT | FROZEN | CLOSED…" },
        { name: "type", bsonType: "string", required: true, bian: "CurrentAccountType", note: "CURRENT | SAVINGS | FIXED_DEPOSIT | NOSTRO | VOSTRO" },
        { name: "currency", bsonType: "string", required: true, bian: "CurrentAccountCurrencyCode", note: "ISO 4217" },
        { name: "customerId", bsonType: "string", fk: true, required: true, bian: "CustomerReference", note: "→ customers" },
        { name: "productId", bsonType: "string", fk: true, bian: "ProductReference", note: "→ products" },
        { name: "branchId", bsonType: "string", bian: "BranchReference" },
        { name: "openedAt", bsonType: "date", bian: "CurrentAccountOpenDate" },
        { name: "closedAt", bsonType: "date", bian: "CurrentAccountCloseDate" },
        { name: "linkedCardIds", bsonType: "array", fk: true, bian: "LinkedCardReferenceList", note: "→ cards.cardId — IDs only" },
        { name: "balance", bsonType: "object", bian: "CurrentAccountBalanceRecord", note: "current, available, ledger, hold, overdraftLimit" },
        { name: "interest", bsonType: "object", bian: "CurrentAccountInterestRecord", note: "rate, accrualMethod, accrued, nextPaymentAt" },
        { name: "gl", bsonType: "object", bian: "CurrentAccountGLMappingRecord", note: "glAccountId, costCenter, profitCenter" },
        { name: "signatories", bsonType: "array", bian: "CurrentAccountSignatoryRecord", note: "customerId, type, signingRule" },
        { name: "restrictions", bsonType: "array", bian: "CurrentAccountRestrictionRecord", note: "type, reason, appliedAt, expiresAt" },
      ],
      systemFields: SYSTEM_FIELDS,
    },
    controlRecord: {
      fields: [
        { name: "CurrentAccountReference", type: "Reference", impl: "accountId", note: "CR primary key" },
        { name: "CurrentAccountNumber", type: "Identifier", impl: "accountNumber", note: "IBAN or internal number" },
        { name: "CurrentAccountType", type: "Type", impl: "type", note: "CURRENT | SAVINGS | FIXED_DEPOSIT | NOSTRO | VOSTRO" },
        { name: "CurrentAccountApexStatus", type: "Status", impl: "status", note: "PENDING_ACTIVATION | ACTIVE | DORMANT | FROZEN | CLOSED" },
        { name: "CustomerReference", type: "Reference", impl: "customerId", note: "→ PartyReferenceDataDirectoryEntry" },
        { name: "ProductReference", type: "Reference", impl: "productId", note: "→ ProductDirectoryEntry" },
        { name: "CurrentAccountOpenDate", type: "Date", impl: "openedAt" },
        { name: "CurrentAccountCloseDate", type: "Date", impl: "closedAt" },
        { name: "CurrentAccountCurrencyCode", type: "CurrencyCode", impl: "currency" },
      ],
      behaviorQualifiers: [
        {
          name: "CurrentAccountBalanceRecord",
          bianBQ: "Current Account Balance (BQ)",
          fields: [
            { name: "CurrentAccountBalanceAmount", type: "Amount", note: "Ledger balance" },
            { name: "CurrentAccountAvailableBalanceAmount", type: "Amount" },
            { name: "CurrentAccountHoldAmount", type: "Amount" },
            { name: "CurrentAccountOverdraftLimitAmount", type: "Amount" },
            { name: "CurrentAccountBalanceUpdateDateTime", type: "DateTime" },
          ],
        },
        {
          name: "CurrentAccountInterestRecord",
          bianBQ: "Current Account Interest (BQ)",
          fields: [
            { name: "CurrentAccountInterestRateValue", type: "Value" },
            { name: "CurrentAccountInterestAccrualMethodType", type: "Type", note: "ACT_360 | ACT_365 | ACT_ACT | 30_360" },
            { name: "CurrentAccountAccruedInterestAmount", type: "Amount" },
            { name: "CurrentAccountInterestNextPaymentDate", type: "Date" },
          ],
        },
        {
          name: "CurrentAccountSignatoryRecord",
          bianBQ: "Current Account Signatory (BQ)",
          fields: [
            { name: "AccountSignatoryPartyReference", type: "Reference" },
            { name: "AccountSignatoryType", type: "Type", note: "PRIMARY | JOINT | AUTHORIZED_USER" },
            { name: "AccountSignatorySigningRuleType", type: "Type", note: "SOLE | ANY_ONE | ALL | TWO_OF_THREE" },
          ],
        },
        {
          name: "CurrentAccountRestrictionRecord",
          bianBQ: "Current Account Restriction (BQ)",
          fields: [
            { name: "AccountRestrictionType", type: "Type", note: "DEBIT_BLOCK | CREDIT_BLOCK | FULL_BLOCK | LIEN | GARNISHMENT" },
            { name: "AccountRestrictionReasonText", type: "Text" },
            { name: "AccountRestrictionAppliedDate", type: "Date" },
            { name: "AccountRestrictionExpiryDate", type: "Date" },
            { name: "AccountRestrictionLienAmount", type: "Amount" },
          ],
        },
      ],
      indexes: [
        '{ "accountId": 1 } unique',
        '{ "accountNumber": 1 } unique',
        '{ "customerId": 1 }',
        '{ "productId": 1 }',
        '{ "status": 1 }',
      ],
    },
    services: {
      dddServices: [
        "CurrentAccountService",
        "AccountBalanceService",
        "AccountStatementService",
        "AccountOpeningService",
      ],
      events: [
        "AccountOpened",
        "AccountActivated",
        "AccountClosed",
        "AccountFrozen",
        "BalanceUpdated",
        "InterestAccrued",
        "RestrictionApplied",
      ],
      bianOperations: ["Initiate", "Update", "Execute", "Request", "Retrieve", "Control", "Exchange"],
    },
  },

  {
    key: "AccountTransactions",
    label: "Account Transactions",
    group: "Account",
    bianServiceDomain: "Current Account / Payment (BQ)",
    bianControlRecord: "CurrentAccountFulfillmentArrangement / Payment (BQ)",
    pattern: "Fulfillment",
    icon: "Folder",
    isLive: true,
    related: ["AccountManagement", "PaymentOrder", "FinancialAccounting", "FraudEvaluation"],
    summary:
      "Immutable ledger of credit/debit postings against an account. Append-only — reversals are new entries.",
    collection: {
      mongoName: "transactions",
      shardKey: '{ "accountId": 1, "valueDate": 1 }',
      immutable: true,
      validation: "strict",
      fields: [
        { name: "txnId", bsonType: "string", pk: true, required: true, bian: "TransactionReference" },
        { name: "accountId", bsonType: "string", fk: true, required: true, bian: "CurrentAccountReference", note: "→ accounts" },
        { name: "paymentId", bsonType: "string", fk: true, bian: "PaymentOrderReference", note: "→ payments" },
        { name: "type", bsonType: "string", required: true, bian: "TransactionType", note: "CREDIT | DEBIT" },
        { name: "txnCode", bsonType: "string", bian: "TransactionCategoryCode", note: "ISO 20022 Bank Transaction Code" },
        { name: "amount", bsonType: "double", required: true, bian: "TransactionAmount" },
        { name: "currency", bsonType: "string", required: true, bian: "TransactionCurrencyCode" },
        { name: "fxRate", bsonType: "double", bian: "TransactionFXConversionRateValue" },
        { name: "baseAmount", bsonType: "double", bian: "TransactionBaseAmount" },
        { name: "valueDate", bsonType: "date", required: true, bian: "TransactionValueDate" },
        { name: "bookingDate", bsonType: "date", bian: "TransactionBookingDate" },
        { name: "description", bsonType: "string", bian: "TransactionDescriptionText" },
        { name: "balanceAfter", bsonType: "double", required: true, bian: "CurrentAccountBalanceAfterTransactionAmount", note: "Immutable balance snapshot" },
        { name: "channel", bsonType: "string", bian: "TransactionInitiationChannelType", note: "BRANCH | ATM | ONLINE | MOBILE | POS" },
        { name: "isReversed", bsonType: "bool", bian: "TransactionReversalIndicator" },
        { name: "reversalTxnId", bsonType: "string", fk: true, bian: "ReversalTransactionReference" },
        { name: "counterparty", bsonType: "object", bian: "TransactionCounterpartyRecord", note: "name, accountNo, bic, country" },
        { name: "gl", bsonType: "object", bian: "TransactionGLRecord", note: "glAccountCode, costCenter, postingStatus" },
      ],
      systemFields: ["RecordCreateDateTime", "RecordCreatedByReference"],
    },
    controlRecord: {
      fields: [
        { name: "TransactionReference", type: "Reference", impl: "txnId", note: "BQ primary key — modeled as standalone collection for ledger access patterns" },
        { name: "CurrentAccountReference", type: "Reference", impl: "accountId", note: "→ CurrentAccountFulfillmentArrangement" },
        { name: "PaymentOrderReference", type: "Reference", impl: "paymentId", note: "→ PaymentOrderProcedure (when sourced from a payment)" },
        { name: "TransactionType", type: "Type", impl: "type", note: "CREDIT | DEBIT" },
        { name: "TransactionCategoryCode", type: "Code", impl: "txnCode", note: "ISO 20022 Bank Transaction Code" },
        { name: "TransactionAmount", type: "Amount", impl: "amount" },
        { name: "TransactionCurrencyCode", type: "CurrencyCode", impl: "currency" },
        { name: "TransactionFXConversionRateValue", type: "Value", impl: "fxRate" },
        { name: "TransactionValueDate", type: "Date", impl: "valueDate" },
        { name: "TransactionBookingDate", type: "Date", impl: "bookingDate" },
        { name: "CurrentAccountBalanceAfterTransactionAmount", type: "Amount", impl: "balanceAfter", note: "Immutable balance snapshot at posting time" },
        { name: "TransactionInitiationChannelType", type: "Type", impl: "channel", note: "BRANCH | ATM | ONLINE | MOBILE | POS" },
        { name: "TransactionReversalIndicator", type: "Indicator", impl: "isReversed" },
        { name: "ReversalTransactionReference", type: "Reference", impl: "reversalTxnId", note: "Self-reference to the reversing entry" },
      ],
      behaviorQualifiers: [
        {
          name: "TransactionCounterpartyRecord",
          bianBQ: "Transaction Counterparty (BQ)",
          fields: [
            { name: "CounterpartyName", type: "Text" },
            { name: "CounterpartyAccountNumber", type: "Identifier" },
            { name: "CounterpartyBankIdentifierCode", type: "Code", note: "BIC/SWIFT" },
            { name: "CounterpartyCountryCode", type: "Code", note: "ISO 3166-1 alpha-2" },
          ],
        },
        {
          name: "TransactionGLRecord",
          bianBQ: "GL Posting (BQ) → FinancialAccounting domain",
          fields: [
            { name: "GLAccountCode", type: "Code", note: "→ FinancialAccountingArrangement" },
            { name: "CostCenterReference", type: "Reference" },
            { name: "LedgerPostingStatus", type: "Status", note: "PENDING | POSTED | REVERSED | FAILED" },
          ],
        },
      ],
      indexes: [
        '{ "txnId": 1 } unique',
        '{ "accountId": 1, "valueDate": -1 }',
        '{ "paymentId": 1 }',
        '{ "valueDate": 1 }',
      ],
    },
    services: {
      dddServices: ["AccountTransactionService", "GLPostingService"],
      events: ["TransactionPosted", "TransactionReversed", "GLEntryCreated"],
      bianOperations: ["Capture", "Retrieve"],
    },
  },

  // ─────────────────────────────────────────────────────────── PAYMENTS GROUP
  {
    key: "PaymentOrder",
    label: "Payment Order",
    group: "Payments",
    bianServiceDomain: "Payment Order",
    bianControlRecord: "PaymentOrderProcedure",
    pattern: "Fulfillment",
    icon: "Coin",
    isLive: true,
    related: ["CustomerManagement", "AccountManagement", "AccountTransactions", "IssuedDevice", "FraudEvaluation"],
    summary:
      "Orchestrates a single payment from initiation through validation, screening, network handover and settlement.",
    collection: {
      mongoName: "payments",
      shardKey: '{ "paymentId": 1 }',
      immutable: false,
      validation: "moderate",
      fields: [
        { name: "paymentId", bsonType: "string", pk: true, required: true, bian: "PaymentOrderReference" },
        { name: "endToEndId", bsonType: "string", bian: "PaymentEndToEndIdentifier", note: "ISO 20022 E2E reference" },
        { name: "uetr", bsonType: "string", bian: "PaymentUniqueTransactionReference", note: "pacs.008 GrpHdr/UETR" },
        { name: "customerId", bsonType: "string", fk: true, required: true, bian: "CustomerReference" },
        { name: "type", bsonType: "string", required: true, bian: "PaymentType", note: "CREDIT_TRANSFER | DIRECT_DEBIT | CARD_PAYMENT…" },
        { name: "rail", bsonType: "string", bian: "PaymentRailType", note: "SWIFT | SEPA_CT | FED_WIRE | ACH | RTP_FEDNOW | PIX…" },
        { name: "status", bsonType: "string", required: true, bian: "PaymentApexStatus", note: "RECEIVED → VALIDATED → AUTHORISED → SETTLED" },
        { name: "priority", bsonType: "string", bian: "PaymentPriorityType", note: "URGENT | NORMAL | BULK" },
        { name: "instructedAmount", bsonType: "double", required: true, bian: "PaymentInstructedAmount" },
        { name: "instructedCurrency", bsonType: "string", required: true, bian: "PaymentInstructedCurrencyCode" },
        { name: "amount", bsonType: "double", bian: "PaymentTransactionAmount" },
        { name: "fxRate", bsonType: "double", bian: "PaymentFXConversionRateValue" },
        { name: "debtor", bsonType: "object", bian: "PaymentDebtorRecord", note: "accountId, iban, name, bic, address" },
        { name: "creditor", bsonType: "object", bian: "PaymentCreditorRecord", note: "accountId, iban, name, bic, bankCountry" },
        { name: "remittance", bsonType: "object", bian: "PaymentRemittanceRecord", note: "structured + unstructured + ISO 20022 purposeCode" },
        { name: "correspondent", bsonType: "object", bian: "PaymentCorrespondentBankingRecord", note: "correspondentBic, intermediaryBic, sanctionsCheck" },
        { name: "clearing", bsonType: "object", bian: "PaymentClearingAndSettlementRecord", note: "receivedAt → settledAt chain" },
        { name: "fraud", bsonType: "object", bian: "PaymentFraudEvaluationRecord", note: "score, decision, rulesFired[]" },
      ],
      systemFields: SYSTEM_FIELDS,
    },
    controlRecord: {
      fields: [
        { name: "PaymentOrderReference", type: "Reference", impl: "paymentId", note: "CR primary key" },
        { name: "PaymentEndToEndIdentifier", type: "Identifier", impl: "endToEndId", note: "ISO 20022 E2E reference — unique across all parties" },
        { name: "PaymentType", type: "Type", impl: "type", note: "CREDIT_TRANSFER | DIRECT_DEBIT | CARD_PAYMENT | CHEQUE | INTRABANK_TRANSFER" },
        { name: "PaymentRailType", type: "Type", impl: "rail", note: "SWIFT | SEPA_CT | FED_WIRE | ACH | RTP_FEDNOW | PIX | PAYNOW…" },
        { name: "PaymentApexStatus", type: "Status", impl: "status", note: "RECEIVED | VALIDATED | AUTHORISED | PROCESSING | SETTLED | REJECTED" },
        { name: "PaymentPriorityType", type: "Type", impl: "priority", note: "URGENT | NORMAL | BULK" },
        { name: "PaymentInstructedAmount", type: "Amount", impl: "instructedAmount" },
        { name: "PaymentInstructedCurrencyCode", type: "CurrencyCode", impl: "instructedCurrency" },
        { name: "PaymentFXConversionRateValue", type: "Value", impl: "fxRate" },
      ],
      behaviorQualifiers: [
        {
          name: "PaymentDebtorRecord",
          bianBQ: "Payment Debtor (BQ)",
          fields: [
            { name: "DebtorAccountReference", type: "Reference", note: "→ CurrentAccountFulfillmentArrangement" },
            { name: "DebtorPartyName", type: "Text" },
            { name: "DebtorBankIdentifierCode", type: "Code", note: "BIC/SWIFT" },
            { name: "DebtorInternationalBankAccountNumber", type: "Identifier", note: "IBAN" },
          ],
        },
        {
          name: "PaymentCreditorRecord",
          bianBQ: "Payment Creditor (BQ)",
          fields: [
            { name: "CreditorAccountReference", type: "Reference" },
            { name: "CreditorInternationalBankAccountNumber", type: "Identifier" },
            { name: "CreditorPartyName", type: "Text" },
            { name: "CreditorBankIdentifierCode", type: "Code" },
            { name: "CreditorBankCountryCode", type: "Code" },
          ],
        },
        {
          name: "PaymentRemittanceRecord",
          bianBQ: "Remittance Information (BQ) — ISO 20022",
          fields: [
            { name: "RemittanceUnstructuredInformationText", type: "Text" },
            { name: "RemittanceStructuredReferenceText", type: "Text" },
            { name: "RemittancePurposeCode", type: "Code", note: "ISO 20022 e.g. SALA, SUPP, TAXS" },
          ],
        },
        {
          name: "PaymentClearingAndSettlementRecord",
          bianBQ: "Payment Clearing And Settlement (BQ)",
          fields: [
            { name: "PaymentReceivedDateTime", type: "DateTime" },
            { name: "PaymentValidatedDateTime", type: "DateTime" },
            { name: "PaymentSettlementDate", type: "Date" },
            { name: "PaymentSettledDateTime", type: "DateTime" },
            { name: "PaymentRejectionReasonCode", type: "Code", note: "ISO 20022 reason code" },
          ],
        },
        {
          name: "PaymentFraudEvaluationRecord",
          bianBQ: "Payment Fraud Evaluation (BQ) → FraudEvaluation domain",
          fields: [
            { name: "FraudEvaluationReference", type: "Reference", note: "→ FraudEvaluationAssessment" },
            { name: "PaymentFraudScore", type: "Value", note: "0-100" },
            { name: "PaymentFraudDecisionType", type: "Type", note: "APPROVED | DECLINED | REVIEW_REQUIRED" },
          ],
        },
      ],
      indexes: [
        '{ "paymentId": 1 } unique',
        '{ "endToEndId": 1 } unique',
        '{ "customerId": 1, "initiatedAt": -1 }',
        '{ "status": 1, "rail": 1 }',
      ],
    },
    services: {
      dddServices: [
        "PaymentInitiationService",
        "PaymentExecutionService",
        "PaymentSanctionsScreeningService",
        "FXConversionService",
        "PaymentRoutingService",
      ],
      events: [
        "PaymentInitiated",
        "PaymentValidated",
        "PaymentAuthorised",
        "PaymentSettled",
        "PaymentRejected",
        "PaymentReturned",
        "PaymentCancelled",
      ],
      bianOperations: ["Initiate", "Update", "Execute", "Request", "Retrieve", "Control", "Exchange"],
    },
  },

  {
    key: "IssuedDevice",
    label: "Card Issuance",
    group: "Payments",
    bianServiceDomain: "Issued Device Administration",
    bianControlRecord: "IssuedDeviceAdministration",
    pattern: "Administration",
    icon: "CreditCard",
    isLive: false,
    related: ["CustomerManagement", "AccountManagement", "PaymentOrder", "FraudEvaluation"],
    summary:
      "Lifecycle of a physical/virtual payment card or device — issuance, controls, limits and tokenization.",
    collection: {
      mongoName: "cards",
      shardKey: '{ "customerId": 1 }',
      immutable: false,
      validation: "moderate",
      fields: [
        { name: "cardId", bsonType: "string", pk: true, required: true, bian: "IssuedDeviceReference" },
        { name: "customerId", bsonType: "string", fk: true, required: true, bian: "CustomerReference" },
        { name: "accountId", bsonType: "string", fk: true, required: true, bian: "CurrentAccountReference" },
        { name: "type", bsonType: "string", required: true, bian: "IssuedDeviceType", note: "DEBIT | CREDIT | PREPAID | VIRTUAL | CORPORATE" },
        { name: "status", bsonType: "string", required: true, bian: "IssuedDeviceApexStatus", note: "ORDERED | DISPATCHED | ACTIVE | BLOCKED | EXPIRED" },
        { name: "network", bsonType: "string", bian: "CardNetworkType", note: "VISA | MASTERCARD | AMEX | UNIONPAY" },
        { name: "cardholderName", bsonType: "string", bian: "CardholderName" },
        { name: "expiresAt", bsonType: "string", bian: "CardExpiryDate", note: "MM/YY" },
        { name: "issuedAt", bsonType: "date", bian: "IssuedDeviceIssuedDate" },
        { name: "pan", bsonType: "object", bian: "IssuedDevicePANRecord", note: "maskedPan(last4), networkToken, vaultRef — raw PAN never stored" },
        { name: "limits", bsonType: "object", bian: "IssuedDeviceLimitsRecord", note: "dailyPurchase, dailyCash, monthlyPurchase, contactless" },
        { name: "controls", bsonType: "object", bian: "IssuedDeviceControlsRecord", note: "contactless/online/international/atm enabled, blockedMcc[]" },
        { name: "tokens", bsonType: "array", bian: "IssuedDeviceTokenRecord", note: "ApplePay | GooglePay | SamsungPay tokens" },
        { name: "credit", bsonType: "object", bian: "CardCreditFacilityRecord", note: "limit, available, outstanding, minPayment — credit cards only" },
      ],
      systemFields: SYSTEM_FIELDS,
    },
    services: {
      dddServices: ["CardIssuanceService", "CardTokenizationService", "CardControlsService"],
      events: ["CardIssued", "CardActivated", "CardBlocked", "TokenAdded", "LimitChanged"],
      bianOperations: ["Initiate", "Update", "Control", "Retrieve"],
    },
  },

  // ──────────────────────────────────────────────────────────── LENDING GROUP
  {
    key: "ConsumerLoan",
    label: "Consumer / Corporate Loan",
    group: "Lending",
    bianServiceDomain: "Consumer Loan",
    bianControlRecord: "ConsumerLoanFacility",
    pattern: "Fulfillment",
    icon: "Home",
    isLive: false,
    related: ["CustomerManagement", "ProductManagement", "AccountManagement", "LoanRepaymentSchedule", "FinancialAccounting"],
    summary:
      "Term-loan facility — disbursement, interest accrual, collateral, IFRS 9 staging and provisioning.",
    collection: {
      mongoName: "loans",
      shardKey: '{ "customerId": 1 }',
      immutable: false,
      validation: "moderate",
      fields: [
        { name: "loanId", bsonType: "string", pk: true, required: true, bian: "LoanFacilityReference" },
        { name: "customerId", bsonType: "string", fk: true, required: true, bian: "CustomerReference" },
        { name: "creditAssessmentId", bsonType: "string", fk: true, bian: "CustomerCreditRatingAssessmentReference" },
        { name: "status", bsonType: "string", required: true, bian: "LoanFacilityApexStatus", note: "PENDING | APPROVED | ACTIVE | DELINQUENT | DEFAULTED…" },
        { name: "type", bsonType: "string", bian: "LoanType", note: "PERSONAL | MORTGAGE | AUTO | STUDENT | SME | CORPORATE…" },
        { name: "currency", bsonType: "string", required: true, bian: "LoanFacilityCurrencyCode" },
        { name: "principalAmount", bsonType: "double", required: true, bian: "LoanFacilityAmount" },
        { name: "outstandingAmount", bsonType: "double", bian: "LoanOutstandingBalanceAmount" },
        { name: "interestRate", bsonType: "double", bian: "LoanNominalInterestRateValue" },
        { name: "rateType", bsonType: "string", bian: "LoanInterestRateType", note: "FIXED | VARIABLE | TRACKER" },
        { name: "benchmarkRate", bsonType: "string", bian: "LoanInterestBenchmarkRateType", note: "SOFR | EURIBOR | SONIA | PRIME" },
        { name: "originatedAt", bsonType: "date", bian: "LoanDisbursementDate" },
        { name: "maturesAt", bsonType: "date", bian: "LoanMaturityDate" },
        { name: "loanAccountId", bsonType: "string", fk: true, bian: "CurrentAccountReference", note: "Loan servicing account" },
        { name: "repaymentTerms", bsonType: "object", bian: "LoanRepaymentRecord", note: "AMORTIZING | INTEREST_ONLY | BULLET, installmentAmount, frequency" },
        { name: "collateral", bsonType: "array", bian: "LoanCollateralRecord", note: "type, asset, valuation, ltv" },
        { name: "ifrs9", bsonType: "object", bian: "LoanProvisionRecord", note: "stage(1|2|3), pd, lgd, ead, ecl" },
      ],
      systemFields: SYSTEM_FIELDS,
    },
    controlRecord: {
      fields: [
        { name: "LoanFacilityReference", type: "Reference", impl: "loanId", note: "CR primary key" },
        { name: "LoanType", type: "Type", impl: "type", note: "PERSONAL | AUTO | MORTGAGE | HOME_EQUITY | STUDENT | SME | CORPORATE" },
        { name: "CustomerReference", type: "Reference", impl: "customerId" },
        { name: "LoanFacilityApexStatus", type: "Status", impl: "status", note: "APPLICATION | APPROVED | DISBURSED | ACTIVE | DELINQUENT | DEFAULT" },
        { name: "LoanFacilityAmount", type: "Amount", impl: "principalAmount", note: "Total approved facility amount" },
        { name: "LoanOutstandingBalanceAmount", type: "Amount", impl: "outstandingAmount" },
        { name: "LoanFacilityCurrencyCode", type: "CurrencyCode", impl: "currency" },
        { name: "LoanDisbursementDate", type: "Date", impl: "originatedAt" },
        { name: "LoanMaturityDate", type: "Date", impl: "maturesAt" },
      ],
      behaviorQualifiers: [
        {
          name: "LoanInterestRecord",
          bianBQ: "Loan Interest (BQ)",
          fields: [
            { name: "LoanInterestRateType", type: "Type", note: "FIXED | VARIABLE | MIXED | STEP" },
            { name: "LoanNominalInterestRateValue", type: "Value" },
            { name: "LoanEffectiveInterestRateValue", type: "Value", note: "APR / EIR" },
            { name: "LoanInterestBenchmarkRateType", type: "Type", note: "SOFR | EURIBOR | SONIA | BASE_RATE | PRIME" },
            { name: "LoanInterestSpreadValue", type: "Value" },
          ],
        },
        {
          name: "LoanRepaymentRecord",
          bianBQ: "Loan Repayment (BQ)",
          fields: [
            { name: "LoanRepaymentType", type: "Type", note: "AMORTIZING | INTEREST_ONLY | BULLET | REVOLVING | BALLOON" },
            { name: "LoanRepaymentInstallmentAmount", type: "Amount" },
            { name: "LoanRepaymentFrequencyType", type: "Type" },
            { name: "LoanNextRepaymentDate", type: "Date" },
            { name: "LoanDelinquencyBucketType", type: "Type", note: "CURRENT | DPD_1_30 | DPD_31_60 | DPD_61_90 | DPD_120_PLUS" },
          ],
        },
        {
          name: "LoanCollateralRecord",
          bianBQ: "Loan Collateral (BQ)",
          fields: [
            { name: "CollateralAssetType", type: "Type", note: "REAL_ESTATE | VEHICLE | LISTED_SECURITIES | CASH | GUARANTOR" },
            { name: "CollateralEstimatedValueAmount", type: "Amount" },
            { name: "CollateralValuationDate", type: "Date" },
            { name: "CollateralLoanToValueRatioValue", type: "Value", note: "LTV ratio" },
          ],
        },
        {
          name: "LoanProvisionRecord",
          bianBQ: "Loan Credit Loss Provision (BQ) — IFRS 9 / CECL",
          fields: [
            { name: "IFRS9Stage", type: "Value", note: "1 | 2 | 3 per IFRS 9" },
            { name: "ProbabilityOfDefaultValue", type: "Value" },
            { name: "LossGivenDefaultValue", type: "Value" },
            { name: "ExposureAtDefaultAmount", type: "Amount" },
            { name: "ECLLifetimeAmount", type: "Amount" },
          ],
        },
      ],
      indexes: [
        '{ "loanId": 1 } unique',
        '{ "customerId": 1 }',
        '{ "status": 1, "type": 1 }',
        '{ "ifrs9.stage": 1 }',
      ],
    },
    services: {
      dddServices: [
        "LoanOriginationService",
        "LoanServicingService",
        "CollateralManagementService",
        "LoanProvisioningService",
        "LoanRecoveryService",
      ],
      events: [
        "LoanApproved",
        "LoanDisbursed",
        "RepaymentReceived",
        "LoanDelinquencyDetected",
        "LoanDefaulted",
        "ProvisionChanged",
      ],
      bianOperations: ["Initiate", "Update", "Execute", "Request", "Retrieve", "Control", "Exchange"],
    },
  },

  {
    key: "LoanRepaymentSchedule",
    label: "Loan Repayment Schedule",
    group: "Lending",
    bianServiceDomain: "Consumer Loan / Repayment (BQ)",
    bianControlRecord: "ConsumerLoanFacility / Repayment (BQ)",
    pattern: "Fulfillment",
    icon: "Calendar",
    isLive: false,
    related: ["ConsumerLoan", "PaymentOrder", "AccountTransactions"],
    summary:
      "Per-installment amortization schedule — projected and actual principal/interest splits, status per installment.",
    collection: {
      mongoName: "loanSchedule",
      shardKey: '{ "loanId": 1, "dueAt": 1 }',
      immutable: false,
      validation: "moderate",
      fields: [
        { name: "scheduleId", bsonType: "string", pk: true, required: true, bian: "LoanRepaymentScheduleReference" },
        { name: "loanId", bsonType: "string", fk: true, required: true, bian: "LoanFacilityReference", note: "→ loans" },
        { name: "installmentNo", bsonType: "int", required: true, bian: "RepaymentInstallmentNumber" },
        { name: "dueAt", bsonType: "date", required: true, bian: "RepaymentDueDate" },
        { name: "principal", bsonType: "double", bian: "RepaymentPrincipalAmount" },
        { name: "interest", bsonType: "double", bian: "RepaymentInterestAmount" },
        { name: "fees", bsonType: "double", bian: "RepaymentFeesAmount" },
        { name: "total", bsonType: "double", bian: "RepaymentTotalAmount" },
        { name: "openingBalance", bsonType: "double", bian: "LoanOpeningBalanceAmount" },
        { name: "closingBalance", bsonType: "double", bian: "LoanClosingBalanceAmount" },
        { name: "status", bsonType: "string", required: true, bian: "RepaymentApexStatus", note: "SCHEDULED | PAID | PARTIALLY_PAID | OVERDUE | WAIVED" },
        { name: "paidAt", bsonType: "date", bian: "RepaymentActualDate" },
        { name: "paidAmount", bsonType: "double", bian: "RepaymentActualAmount" },
        { name: "paymentId", bsonType: "string", fk: true, bian: "PaymentOrderReference", note: "→ payments" },
      ],
    },
    services: {
      dddServices: ["LoanServicingService"],
      events: ["RepaymentScheduled", "RepaymentPaid", "RepaymentOverdue"],
      bianOperations: ["Update", "Retrieve", "Control"],
    },
  },

  // ─────────────────────────────────────────────────────── CAPITAL MARKETS GROUP
  {
    key: "TradeConfirmation",
    label: "Trade Confirmation",
    group: "CapitalMarkets",
    bianServiceDomain: "Trade Confirmation",
    bianControlRecord: "TradeConfirmationProcedure",
    pattern: "Fulfillment",
    icon: "Charts",
    isLive: false,
    related: ["InvestmentPortfolio", "PaymentOrder", "FinancialAccounting"],
    summary:
      "Per-trade booking, confirmation and settlement record covering cash and derivatives across DVP / FOP rails.",
    collection: {
      mongoName: "trades",
      shardKey: '{ "tradeId": 1 }',
      immutable: false,
      validation: "moderate",
      fields: [
        { name: "tradeId", bsonType: "string", pk: true, required: true, bian: "TradeConfirmationReference" },
        { name: "portfolioId", bsonType: "string", fk: true, bian: "InvestmentPortfolioReference", note: "→ portfolios" },
        { name: "instrumentId", bsonType: "string", fk: true, bian: "FinancialInstrumentReference" },
        { name: "counterpartyId", bsonType: "string", bian: "TradeCounterpartyReference" },
        { name: "traderId", bsonType: "string", bian: "TraderReference" },
        { name: "tradeType", bsonType: "string", bian: "TradeType", note: "BUY | SELL | SHORT_SELL | REPO | REVERSE_REPO | SEC_LENDING" },
        { name: "status", bsonType: "string", bian: "TradeConfirmationApexStatus", note: "NEW | CONFIRMED | MATCHED | SETTLED | SETTLEMENT_FAILED | CANCELLED" },
        { name: "tradeDate", bsonType: "date", required: true, bian: "TradeDate" },
        { name: "quantity", bsonType: "double", bian: "TradeQuantity" },
        { name: "price", bsonType: "double", bian: "TradePriceAmount" },
        { name: "currency", bsonType: "string", bian: "TradeCurrencyCode" },
        { name: "grossAmount", bsonType: "double", bian: "TradeGrossAmount" },
        { name: "fees", bsonType: "double", bian: "TradeFeesAndCommissionsAmount" },
        { name: "netAmount", bsonType: "double", bian: "TradeNetAmount" },
        { name: "settlement", bsonType: "object", bian: "TradeSettlementRecord", note: "settlementDate, method(DVP|FOP|DAP|DFP), custodian, network" },
        { name: "matching", bsonType: "object", bian: "TradeConfirmationMatchingRecord", note: "matchMethod(SWIFT|DTCC|MANUAL), matchStatus" },
        { name: "risk", bsonType: "object", bian: "TradeRiskMeasuresRecord", note: "dv01, pv01, deltaEquivalent, varContribution" },
      ],
      systemFields: SYSTEM_FIELDS,
    },
    services: {
      dddServices: ["TradeBookingService", "TradeConfirmationService", "SettlementService"],
      events: [
        "TradeBooked",
        "TradeConfirmed",
        "TradeMatched",
        "TradeSettled",
        "TradeSettlementFailed",
        "TradeCancelled",
      ],
      bianOperations: ["Initiate", "Update", "Execute", "Request", "Retrieve", "Control"],
    },
  },

  // ────────────────────────────────────────────────────────────── WEALTH GROUP
  {
    key: "InvestmentPortfolio",
    label: "Investment Portfolio",
    group: "Wealth",
    bianServiceDomain: "Investment Portfolio Management",
    bianControlRecord: "InvestmentPortfolioManagementPlan",
    pattern: "Management",
    icon: "Diagram2",
    isLive: false,
    related: ["CustomerManagement", "ProductManagement", "TradeConfirmation"],
    summary:
      "Investor portfolio with policy / IPS, MiFID II suitability, target allocations and performance attribution.",
    collection: {
      mongoName: "portfolios",
      shardKey: '{ "customerId": 1 }',
      immutable: false,
      validation: "moderate",
      fields: [
        { name: "portfolioId", bsonType: "string", pk: true, required: true, bian: "InvestmentPortfolioReference" },
        { name: "name", bsonType: "string", bian: "InvestmentPortfolioName" },
        { name: "customerId", bsonType: "string", fk: true, required: true, bian: "CustomerReference" },
        { name: "advisorId", bsonType: "string", bian: "InvestmentPortfolioAdvisorReference" },
        { name: "type", bsonType: "string", bian: "InvestmentPortfolioType", note: "DISCRETIONARY | ADVISORY | EXECUTION_ONLY | ROBO_ADVISORY | PENSION" },
        { name: "status", bsonType: "string", bian: "InvestmentPortfolioApexStatus" },
        { name: "currency", bsonType: "string", bian: "InvestmentPortfolioCurrencyCode" },
        { name: "benchmarkId", bsonType: "string", bian: "InvestmentPortfolioBenchmarkReference" },
        { name: "policy", bsonType: "object", bian: "InvestmentPortfolioPolicyRecord", note: "riskProfile, horizon, returnObjective, targetAllocations[]" },
        { name: "suitability", bsonType: "object", bian: "CustomerSuitabilityRecord", note: "MiFID II: knowledgeLevel, experience, netWorth, reviewDate" },
        { name: "performance", bsonType: "object", bian: "InvestmentPortfolioPerformanceRecord", note: "totalMv, twr, mwr, alpha, sharpeRatio" },
        { name: "fees", bsonType: "object", bian: "InvestmentPortfolioFeesRecord", note: "mgmtFeeRate, performanceFeeRate, highWaterMark" },
      ],
      systemFields: SYSTEM_FIELDS,
    },
    services: {
      dddServices: [
        "PortfolioManagementService",
        "PortfolioRebalancingService",
        "PerformanceAttributionService",
        "SuitabilityAssessmentService",
      ],
      events: [
        "PortfolioCreated",
        "InvestmentPolicyUpdated",
        "AllocationChanged",
        "PerformanceCalculated",
        "RebalancingTriggered",
      ],
      bianOperations: ["Initiate", "Update", "Request", "Retrieve", "Control"],
    },
  },

  // ──────────────────────────────────────────────────────── FRAUD & AML GROUP
  {
    key: "FraudEvaluation",
    label: "Fraud Evaluation",
    group: "FraudAML",
    bianServiceDomain: "Fraud Evaluation",
    bianControlRecord: "FraudEvaluationAssessment",
    pattern: "Monitoring",
    icon: "Warning",
    isLive: false,
    related: ["CustomerManagement", "PaymentOrder", "IssuedDevice", "AccountTransactions"],
    summary:
      "Real-time fraud / AML alerts raised against payments, cards, accounts, customers or trades — with rule and ML scoring.",
    collection: {
      mongoName: "fraudAlerts",
      shardKey: '{ "customerId": 1 }',
      immutable: false,
      validation: "moderate",
      fields: [
        { name: "alertId", bsonType: "string", pk: true, required: true, bian: "FraudEvaluationReference" },
        { name: "alertType", bsonType: "string", bian: "FraudEvaluationAlertType", note: "FRAUD | AML_ALERT | SANCTIONS_HIT | INSIDER_ACTIVITY | MARKET_ABUSE" },
        { name: "subjectType", bsonType: "string", bian: "FraudEvaluationSubjectType", note: "PAYMENT | CARD_TRANSACTION | ACCOUNT | CUSTOMER | TRADE" },
        { name: "subjectId", bsonType: "string", fk: true, bian: "FraudEvaluationSubjectReference", note: "→ entity primary key" },
        { name: "customerId", bsonType: "string", fk: true, bian: "CustomerReference" },
        { name: "status", bsonType: "string", bian: "FraudEvaluationApexStatus", note: "OPEN | UNDER_REVIEW | ESCALATED | CLOSED_FALSE_POSITIVE | CLOSED_CONFIRMED" },
        { name: "priority", bsonType: "string", bian: "FraudAlertPriorityType", note: "LOW | MEDIUM | HIGH | CRITICAL" },
        { name: "compositeScore", bsonType: "double", bian: "FraudEvaluationCompositeScore", note: "0–100" },
        { name: "alertedAt", bsonType: "date", required: true, bian: "FraudEvaluationDateTime" },
        { name: "rulesEvaluation", bsonType: "array", bian: "FraudRulesEvaluationRecord", note: "ruleId, ruleName, ruleScore" },
        { name: "mlModel", bsonType: "object", bian: "FraudMLModelRecord", note: "modelId, version, score, featureValues" },
        { name: "investigation", bsonType: "object", bian: "FraudCaseInvestigationRecord", note: "assignedTo, notes[], resolution, sarFiled" },
      ],
      systemFields: SYSTEM_FIELDS,
    },
    services: {
      dddServices: [
        "FraudScoringService",
        "FraudCaseManagementService",
        "SanctionsScreeningService",
        "AMLTransactionMonitoringService",
      ],
      events: [
        "FraudAlertRaised",
        "FraudAlertEscalated",
        "FraudConfirmed",
        "SARFiled",
        "FraudAlertClosedFalsePositive",
      ],
      bianOperations: ["Evaluate", "Update", "Retrieve", "Control"],
    },
  },

  // ───────────────────────────────────────────────────────── GL & FINANCE GROUP
  {
    key: "FinancialAccounting",
    label: "Chart of Accounts",
    group: "GLFinance",
    bianServiceDomain: "Financial Accounting",
    bianControlRecord: "FinancialAccountingArrangement",
    pattern: "Management",
    icon: "Database",
    isLive: false,
    related: ["AccountManagement", "AccountTransactions", "ConsumerLoan", "TradeConfirmation"],
    summary:
      "Bank's general-ledger chart of accounts — hierarchical, multi-entity, IFRS-categorized.",
    collection: {
      mongoName: "glAccounts",
      shardKey: '{ "glCode": 1 }',
      immutable: false,
      validation: "moderate",
      fields: [
        { name: "glAccountId", bsonType: "string", pk: true, required: true, bian: "GLAccountReference" },
        { name: "glCode", bsonType: "string", required: true, bian: "GLAccountCode", note: "Unique account code" },
        { name: "name", bsonType: "string", required: true, bian: "GLAccountName" },
        { name: "parentGlCode", bsonType: "string", bian: "ParentGLAccountCode", note: "Self-reference for hierarchy" },
        { name: "type", bsonType: "string", required: true, bian: "GLAccountType", note: "ASSET | LIABILITY | EQUITY | INCOME | EXPENSE" },
        { name: "subType", bsonType: "string", bian: "GLAccountSubType" },
        { name: "normalBalance", bsonType: "string", bian: "GLAccountNormalBalanceType", note: "DEBIT | CREDIT" },
        { name: "currency", bsonType: "string", bian: "GLAccountCurrencyCode" },
        { name: "hierarchyLevel", bsonType: "int", bian: "GLAccountHierarchyLevel" },
        { name: "isLeaf", bsonType: "bool", bian: "GLAccountLeafNodeIndicator" },
        { name: "costCenter", bsonType: "string", bian: "CostCenterReference" },
        { name: "profitCenter", bsonType: "string", bian: "ProfitCenterReference" },
        { name: "legalEntityId", bsonType: "string", bian: "LegalEntityReference" },
        { name: "ifrsCategory", bsonType: "string", bian: "IFRSCategoryText" },
        { name: "status", bsonType: "string", bian: "GLAccountApexStatus", note: "ACTIVE | INACTIVE | FROZEN" },
      ],
      systemFields: SYSTEM_FIELDS,
    },
    services: {
      dddServices: ["ChartOfAccountsService", "FinancialReportingService"],
      events: ["GLAccountCreated", "GLAccountDeactivated", "GLAccountRestructured"],
      bianOperations: ["Initiate", "Update", "Retrieve", "Control"],
    },
  },
];

// Aggregate stats kept here in case the modal-level ComplianceStrip ever
// wants to read consolidated counts. Not currently rendered — the inner
// stats strip was removed during the design-elevation pass (P0-1/P0-3) so
// the modal-level ComplianceStrip remains the single source of summary
// truth across all three tabs.
export const CONSOLIDATED_STATS = (() => {
  const domains = SERVICE_DOMAINS.length;
  const fields = SERVICE_DOMAINS.reduce(
    (acc, sd) => acc + (sd.collection?.fields?.length || 0),
    0
  );
  const patterns = new Set(SERVICE_DOMAINS.map((sd) => sd.pattern)).size;
  const live = SERVICE_DOMAINS.filter((sd) => sd.isLive).length;
  return { domains, fields, patterns, live };
})();
