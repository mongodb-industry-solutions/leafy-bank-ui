// Hardcoded BIAN Semantic API catalog.
//
// Mirrors the surface exposed by the proxy routes in `frontend/app/api/<SD>/...`.
// All operations use the BIAN verb-in-URL convention (POST /Domain/Action) and
// expect/return JSON envelopes per the conventions block below.
//
// Body keys, envelopeKeys, and example contents use BIAN v14 canonical names
// sourced from `bianDataModelData.js` (the `bm` block per collection).
// Operational/meta keys (patch wrapper, page, filter, restriction action) keep
// their conventional form.
//
// Shape contract — consumed by `BianApiTab`:
//   enums: { <label>: [values] }            (object, not array)
//   request.examples: [{ label?, value }]    (array, not request.example)
//   response.example: <object|null>          (singular)
//

export const BIAN_API_CATALOG = {
  "version": "v1.0",
  "description": "Leafy Bank — BIAN v14 Semantic API. Verb-in-URL convention; all operations are POST. JSON request bodies are strict (extra fields rejected) and use ISO 4217 currency codes with money encoded as JSON numbers. Body keys are BIAN v14 canonical attribute names.",
  "conventions": {
    "method": "POST",
    "verbInUrl": true,
    "extraFieldsRejected": true,
    "currencyStandard": "ISO 4217",
    "moneyEncoding": "json-number"
  },
  "statusCodes": [
    {
      "code": 200,
      "meaning": "OK — operation succeeded; envelope returned."
    },
    {
      "code": 201,
      "meaning": "Created — new resource (e.g. account, payment) materialised."
    },
    {
      "code": 202,
      "meaning": "Accepted — async operation queued; final state follows via change-stream/notification."
    },
    {
      "code": 400,
      "meaning": "Bad Request — malformed body, missing required field, or extra field rejected."
    },
    {
      "code": 401,
      "meaning": "Unauthorized — missing or invalid bearer token."
    },
    {
      "code": 403,
      "meaning": "Forbidden — caller is authenticated but lacks the role for this BQ."
    },
    {
      "code": 404,
      "meaning": "Not Found — referenced entity (customer, account, payment) does not exist."
    },
    {
      "code": 409,
      "meaning": "Conflict — idempotency-key reuse with different payload, or state guard failed."
    },
    {
      "code": 422,
      "meaning": "Unprocessable Entity — payload structurally valid but failed BIAN business validation."
    },
    {
      "code": 500,
      "meaning": "Internal Server Error — unexpected failure; safe to retry idempotent operations with the same Idempotency-Key."
    }
  ],
  "services": [
    {
      "key": "customer",
      "name": "Party Reference Data Directory",
      "serviceDomains": [
        {
          "key": "PartyReferenceDataDirectoryEntry",
          "name": "PartyReferenceDataDirectoryEntry — Customer Master",
          "operations": [
            {
              "id": "party_request",
              "method": "POST",
              "path": "/PartyReferenceDataDirectoryEntry/Request",
              "summary": "Register a new customer (party). Returns the materialised customer reference and KYC scaffolding.",
              "bianAction": "register",
              "bianBehaviorQualifier": "PartyIdentification",
              "headers": [
                {
                  "name": "Idempotency-Key",
                  "required": true,
                  "notes": "UUID per business intent. Same key + same body returns the original 201; same key + different body → 409."
                },
                {
                  "name": "Authorization",
                  "required": true,
                  "notes": "Bearer token. Caller must hold the Onboarding role."
                },
                {
                  "name": "Content-Type",
                  "required": true,
                  "notes": "application/json"
                }
              ],
              "request": {
                "notes": "Identification, contact, KYC seed, consents. PII fields (NationalIdentityNumber, TaxIdentificationNumber, PassportNumber) are encrypted client-side via Queryable Encryption before reaching the server. Body keys are BIAN canonical attribute names.",
                "examples": [
                  {
                    "value": {
                      "PartyIdentification": {
                        "PartyNameGivenName": "Frida",
                        "PartyNameFamilyName": "Karlsson",
                        "PartyDateOfBirthDate": "1986-04-12",
                        "PartyNationalityCode": "SE",
                        "NationalIdentityNumber": "<QE-ciphertext>",
                        "NationalIdentityNumberType": "PERSONNUMMER"
                      },
                      "PartyContactRecord": {
                        "PartyContactEmailAddress": "frida.karlsson@example.com",
                        "PartyContactPhoneNumber": "+46-70-555-0123",
                        "PartyAddressRecord": [
                          {
                            "PartyAddressType": "RESIDENTIAL",
                            "PartyAddressLine1Text": "Vasagatan 1",
                            "PartyAddressCityText": "Stockholm",
                            "PartyAddressCountryCode": "SE",
                            "PartyAddressIsPrimaryIndicator": true
                          }
                        ]
                      },
                      "CustomerKYCRecord": {
                        "CustomerKYCVerificationLevelType": "STANDARD"
                      },
                      "PartyConsentRecord": [
                        {
                          "PartyConsentType": "MARKETING",
                          "PartyConsentGrantedIndicator": false
                        }
                      ]
                    }
                  }
                ]
              },
              "response": {
                "successCodes": [
                  201
                ],
                "envelopeKeys": [
                  "CustomerReference",
                  "CustomerKYCProcedureStatus",
                  "RecordCreateDateTime"
                ],
                "example": {
                  "CustomerReference": "CUS-20260507-000142",
                  "CustomerKYCProcedureStatus": "PENDING_VERIFICATION",
                  "RecordCreateDateTime": "2026-05-07T10:23:45.120Z"
                }
              },
              "errors": [
                {
                  "code": 400,
                  "meaning": "Bad Request",
                  "when": "Missing PartyIdentification.PartyNameGivenName / .PartyNameFamilyName / .PartyDateOfBirthDate, or extra fields present."
                },
                {
                  "code": 409,
                  "meaning": "Conflict",
                  "when": "Same Idempotency-Key replayed with a different payload."
                },
                {
                  "code": 422,
                  "meaning": "Unprocessable Entity",
                  "when": "PartyDateOfBirthDate in the future or PartyNationalityCode not ISO 3166-1 alpha-2."
                }
              ],
              "notesFooter": "On success, a Change Stream event fires from the customers collection; downstream consumers (Onboarding, RBAC, KYC) pick it up via their resume tokens."
            },
            {
              "id": "party_retrieve",
              "method": "POST",
              "path": "/PartyReferenceDataDirectoryEntry/Retrieve",
              "summary": "Retrieve the full party reference record by CustomerReference.",
              "bianAction": "retrieve",
              "bianBehaviorQualifier": "PartyIdentification",
              "headers": [
                {
                  "name": "Authorization",
                  "required": true,
                  "notes": "Bearer token with Read scope on the Party domain."
                },
                {
                  "name": "Content-Type",
                  "required": true,
                  "notes": "application/json"
                }
              ],
              "request": {
                "examples": [
                  {
                    "value": {
                      "CustomerReference": "CUS-20260507-000142"
                    }
                  }
                ]
              },
              "response": {
                "successCodes": [
                  200
                ],
                "envelopeKeys": [
                  "CustomerReference",
                  "PartyIdentification",
                  "PartyContactRecord",
                  "CustomerKYCRecord",
                  "PartyConsentRecord",
                  "RecordVersionNumber"
                ],
                "example": {
                  "CustomerReference": "CUS-20260507-000142",
                  "PartyIdentification": {
                    "PartyNameGivenName": "Frida",
                    "PartyNameFamilyName": "Karlsson"
                  },
                  "PartyContactRecord": {
                    "PartyContactEmailAddress": "frida.karlsson@example.com"
                  },
                  "CustomerKYCRecord": {
                    "CustomerKYCProcedureStatus": "VERIFIED",
                    "CustomerKYCVerificationLevelType": "STANDARD",
                    "CustomerCreditRatingAssessment": "LOW"
                  },
                  "RecordVersionNumber": 4
                }
              },
              "errors": [
                {
                  "code": 404,
                  "meaning": "Not Found",
                  "when": "CustomerReference does not exist in the directory."
                }
              ]
            },
            {
              "id": "party_kyc_retrieve",
              "method": "POST",
              "path": "/PartyReferenceDataDirectoryEntry/CustomerKYCRecord/Retrieve",
              "summary": "Retrieve only the KYC sub-record for a party — verification status, risk rating, supporting documents.",
              "bianAction": "retrieve",
              "bianBehaviorQualifier": "CustomerKYCRecord",
              "headers": [
                {
                  "name": "Authorization",
                  "required": true,
                  "notes": "Bearer token with KYC-Read scope (more sensitive than Party read)."
                },
                {
                  "name": "Content-Type",
                  "required": true,
                  "notes": "application/json"
                }
              ],
              "request": {
                "examples": [
                  {
                    "value": {
                      "CustomerReference": "CUS-20260507-000142"
                    }
                  }
                ]
              },
              "response": {
                "successCodes": [
                  200
                ],
                "envelopeKeys": [
                  "CustomerReference",
                  "CustomerKYCProcedureStatus",
                  "CustomerKYCVerificationLevelType",
                  "CustomerCreditRatingAssessment",
                  "CustomerKYCVerificationDate",
                  "CustomerKYCDocumentRecord"
                ],
                "example": {
                  "CustomerReference": "CUS-20260507-000142",
                  "CustomerKYCProcedureStatus": "VERIFIED",
                  "CustomerKYCVerificationLevelType": "STANDARD",
                  "CustomerCreditRatingAssessment": "LOW",
                  "CustomerKYCVerificationDate": "2026-05-07T11:02:11.000Z",
                  "CustomerKYCDocumentRecord": [
                    {
                      "CustomerKYCDocumentType": "PASSPORT",
                      "CustomerKYCDocumentVerifiedDate": "2026-05-07T11:01:08.000Z"
                    }
                  ]
                }
              },
              "errors": [
                {
                  "code": 403,
                  "meaning": "Forbidden",
                  "when": "Caller has Party-Read but not KYC-Read."
                },
                {
                  "code": 404,
                  "meaning": "Not Found",
                  "when": "CustomerReference not in directory."
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "key": "account",
      "name": "Current Account",
      "serviceDomains": [
        {
          "key": "CurrentAccountFulfillmentArrangement",
          "name": "CurrentAccountFulfillmentArrangement — Account Lifecycle",
          "operations": [
            {
              "id": "account_initiate",
              "method": "POST",
              "path": "/CurrentAccountFulfillmentArrangement/Initiate",
              "summary": "Open a new current account for a registered customer.",
              "bianAction": "initiate",
              "bianBehaviorQualifier": "AccountAdministration",
              "headers": [
                {
                  "name": "Idempotency-Key",
                  "required": true,
                  "notes": "UUID per onboarding event."
                },
                {
                  "name": "Authorization",
                  "required": true,
                  "notes": "Bearer token with Account-Open scope."
                },
                {
                  "name": "Content-Type",
                  "required": true,
                  "notes": "application/json"
                }
              ],
              "enums": {
                "CurrentAccountType": [
                  "CHECKING",
                  "SAVINGS",
                  "BUSINESS"
                ],
                "CurrentAccountCurrencyCode": [
                  "USD",
                  "EUR",
                  "GBP",
                  "SEK",
                  "JPY"
                ]
              },
              "request": {
                "examples": [
                  {
                    "value": {
                      "CustomerReference": "CUS-20260507-000142",
                      "CurrentAccountType": "CHECKING",
                      "CurrentAccountCurrencyCode": "USD",
                      "ProductReference": "PROD-CHK-STD",
                      "BranchReference": "BR-NYC-01"
                    }
                  }
                ]
              },
              "response": {
                "successCodes": [
                  201
                ],
                "envelopeKeys": [
                  "CurrentAccountReference",
                  "CurrentAccountNumber",
                  "CurrentAccountApexStatus",
                  "CurrentAccountBalanceRecord",
                  "CurrentAccountOpenDate"
                ],
                "example": {
                  "CurrentAccountReference": "ACC-20260507-000891",
                  "CurrentAccountNumber": "5500-0142-0891",
                  "CurrentAccountApexStatus": "ACTIVE",
                  "CurrentAccountBalanceRecord": {
                    "CurrentAccountBalanceAmount": 0,
                    "CurrentAccountAvailableBalanceAmount": 0,
                    "CurrentAccountLedgerBalanceAmount": 0,
                    "CurrentAccountHoldAmount": 0
                  },
                  "CurrentAccountOpenDate": "2026-05-07T11:18:02.000Z"
                }
              },
              "errors": [
                {
                  "code": 404,
                  "meaning": "Not Found",
                  "when": "CustomerReference references no party in the directory."
                },
                {
                  "code": 422,
                  "meaning": "Unprocessable Entity",
                  "when": "CustomerKYCProcedureStatus != VERIFIED for the customer."
                }
              ]
            },
            {
              "id": "account_retrieve",
              "method": "POST",
              "path": "/CurrentAccountFulfillmentArrangement/Retrieve",
              "summary": "Retrieve the full current-account record.",
              "bianAction": "retrieve",
              "bianBehaviorQualifier": "AccountAdministration",
              "headers": [
                {
                  "name": "Authorization",
                  "required": true,
                  "notes": "Bearer token with Account-Read scope."
                },
                {
                  "name": "Content-Type",
                  "required": true,
                  "notes": "application/json"
                }
              ],
              "request": {
                "examples": [
                  {
                    "value": {
                      "CurrentAccountReference": "ACC-20260507-000891"
                    }
                  }
                ]
              },
              "response": {
                "successCodes": [
                  200
                ],
                "envelopeKeys": [
                  "CurrentAccountReference",
                  "CurrentAccountNumber",
                  "CurrentAccountType",
                  "CurrentAccountApexStatus",
                  "CurrentAccountBalanceRecord",
                  "CurrentAccountInterestRecord",
                  "CurrentAccountSignatoryRecord"
                ],
                "example": {
                  "CurrentAccountReference": "ACC-20260507-000891",
                  "CurrentAccountNumber": "5500-0142-0891",
                  "CurrentAccountType": "CHECKING",
                  "CurrentAccountApexStatus": "ACTIVE",
                  "CurrentAccountBalanceRecord": {
                    "CurrentAccountBalanceAmount": 12450.18,
                    "CurrentAccountAvailableBalanceAmount": 12450.18,
                    "CurrentAccountLedgerBalanceAmount": 12450.18,
                    "CurrentAccountHoldAmount": 0
                  }
                }
              },
              "errors": [
                {
                  "code": 404,
                  "meaning": "Not Found",
                  "when": "CurrentAccountReference does not exist."
                }
              ]
            },
            {
              "id": "account_request",
              "method": "POST",
              "path": "/CurrentAccountFulfillmentArrangement/Request",
              "summary": "Request a non-control mutation on an account (update interest schedule, statement frequency, signatory).",
              "bianAction": "update",
              "bianBehaviorQualifier": "AccountAdministration",
              "headers": [
                {
                  "name": "Idempotency-Key",
                  "required": true,
                  "notes": "UUID per change-of-record."
                },
                {
                  "name": "Authorization",
                  "required": true,
                  "notes": "Bearer token with Account-Update scope."
                },
                {
                  "name": "Content-Type",
                  "required": true,
                  "notes": "application/json"
                }
              ],
              "request": {
                "notes": "`patch` is the operational JSON-merge-patch wrapper (RFC 7396); its inner keys are BIAN canonical attribute names.",
                "examples": [
                  {
                    "value": {
                      "CurrentAccountReference": "ACC-20260507-000891",
                      "patch": {
                        "CurrentAccountStatementRecord": {
                          "AccountStatementFrequencyType": "MONTHLY",
                          "AccountStatementDeliveryChannelType": "EMAIL"
                        }
                      }
                    }
                  }
                ]
              },
              "response": {
                "successCodes": [
                  200
                ],
                "envelopeKeys": [
                  "CurrentAccountReference",
                  "RecordVersionNumber",
                  "RecordUpdateDateTime"
                ],
                "example": {
                  "CurrentAccountReference": "ACC-20260507-000891",
                  "RecordVersionNumber": 7,
                  "RecordUpdateDateTime": "2026-05-07T11:31:00.000Z"
                }
              },
              "errors": [
                {
                  "code": 409,
                  "meaning": "Conflict",
                  "when": "Optimistic-lock RecordVersionNumber mismatch."
                }
              ]
            },
            {
              "id": "account_control",
              "method": "POST",
              "path": "/CurrentAccountFulfillmentArrangement/Control",
              "summary": "Apply or release a control on an account — block, freeze, or restrict.",
              "bianAction": "execute",
              "bianBehaviorQualifier": "AccountRestriction",
              "headers": [
                {
                  "name": "Idempotency-Key",
                  "required": true,
                  "notes": "UUID per restriction event."
                },
                {
                  "name": "Authorization",
                  "required": true,
                  "notes": "Bearer token with Account-Control scope (typically Compliance / Fraud Ops)."
                },
                {
                  "name": "Content-Type",
                  "required": true,
                  "notes": "application/json"
                }
              ],
              "enums": {
                "Control action": [
                  "APPLY",
                  "RELEASE"
                ],
                "AccountRestrictionType": [
                  "FROZEN",
                  "DEBIT_BLOCK",
                  "CREDIT_BLOCK",
                  "FULL_BLOCK"
                ]
              },
              "request": {
                "notes": "`action` is an operational APPLY/RELEASE selector (not a BIAN attribute); the `CurrentAccountRestrictionRecord` payload uses BIAN canonical names.",
                "examples": [
                  {
                    "value": {
                      "CurrentAccountReference": "ACC-20260507-000891",
                      "action": "APPLY",
                      "CurrentAccountRestrictionRecord": {
                        "AccountRestrictionType": "DEBIT_BLOCK",
                        "AccountRestrictionReasonText": "AML investigation case CASE-2026-0042"
                      }
                    }
                  }
                ]
              },
              "response": {
                "successCodes": [
                  200
                ],
                "envelopeKeys": [
                  "CurrentAccountReference",
                  "CurrentAccountRestrictionRecord",
                  "AccountRestrictionAppliedDate",
                  "AccountRestrictionAppliedByReference"
                ],
                "example": {
                  "CurrentAccountReference": "ACC-20260507-000891",
                  "CurrentAccountRestrictionRecord": {
                    "AccountRestrictionType": "DEBIT_BLOCK",
                    "AccountRestrictionReasonText": "AML investigation case CASE-2026-0042"
                  },
                  "AccountRestrictionAppliedDate": "2026-05-07T11:42:18.000Z",
                  "AccountRestrictionAppliedByReference": "ops.compliance@leafybank.com"
                }
              },
              "errors": [
                {
                  "code": 403,
                  "meaning": "Forbidden",
                  "when": "Caller lacks Account-Control scope."
                },
                {
                  "code": 404,
                  "meaning": "Not Found",
                  "when": "CurrentAccountReference not found."
                }
              ],
              "notesFooter": "Each control action emits an OCSF 4002 Authorization Activity event to the WORM audit sink."
            },
            {
              "id": "account_balance_retrieve",
              "method": "POST",
              "path": "/CurrentAccountFulfillmentArrangement/CurrentAccountBalanceRecord/Retrieve",
              "summary": "Retrieve the projected balance record only — fast O(1) lookup against the ASP-maintained accountBalances projection.",
              "bianAction": "retrieve",
              "bianBehaviorQualifier": "CurrentAccountBalanceRecord",
              "headers": [
                {
                  "name": "Authorization",
                  "required": true,
                  "notes": "Bearer token with Account-Read scope."
                },
                {
                  "name": "Content-Type",
                  "required": true,
                  "notes": "application/json"
                }
              ],
              "request": {
                "examples": [
                  {
                    "value": {
                      "CurrentAccountReference": "ACC-20260507-000891"
                    }
                  }
                ]
              },
              "response": {
                "successCodes": [
                  200
                ],
                "envelopeKeys": [
                  "CurrentAccountReference",
                  "CurrentAccountBalanceRecord",
                  "CurrentAccountBalanceUpdateDateTime"
                ],
                "example": {
                  "CurrentAccountReference": "ACC-20260507-000891",
                  "CurrentAccountBalanceRecord": {
                    "CurrentAccountBalanceAmount": 12450.18,
                    "CurrentAccountAvailableBalanceAmount": 12450.18,
                    "CurrentAccountLedgerBalanceAmount": 12450.18,
                    "CurrentAccountHoldAmount": 0,
                    "CurrentAccountOverdraftLimitAmount": 500
                  },
                  "CurrentAccountBalanceUpdateDateTime": "2026-05-07T11:43:01.014Z"
                }
              },
              "errors": [
                {
                  "code": 404,
                  "meaning": "Not Found",
                  "when": "CurrentAccountReference not found."
                }
              ]
            },
            {
              "id": "account_txn_request",
              "method": "POST",
              "path": "/CurrentAccountFulfillmentArrangement/CurrentAccountTransaction/Request",
              "summary": "List or request transaction history for an account (paginated).",
              "bianAction": "retrieve",
              "bianBehaviorQualifier": "CurrentAccountTransaction",
              "headers": [
                {
                  "name": "Authorization",
                  "required": true,
                  "notes": "Bearer token with Account-Read scope."
                },
                {
                  "name": "Content-Type",
                  "required": true,
                  "notes": "application/json"
                }
              ],
              "request": {
                "notes": "`page` and `filter` are operational pagination/filter wrappers (not BIAN attributes).",
                "examples": [
                  {
                    "value": {
                      "CurrentAccountReference": "ACC-20260507-000891",
                      "page": {
                        "limit": 50,
                        "cursor": null
                      },
                      "filter": {
                        "from": "2026-04-01",
                        "to": "2026-05-07"
                      }
                    }
                  }
                ]
              },
              "response": {
                "successCodes": [
                  200
                ],
                "envelopeKeys": [
                  "CurrentAccountReference",
                  "CurrentAccountTransactionRecord",
                  "page"
                ],
                "example": {
                  "CurrentAccountReference": "ACC-20260507-000891",
                  "CurrentAccountTransactionRecord": [
                    {
                      "TransactionReference": "TXN-2026-04-15-0001",
                      "TransactionType": "CREDIT",
                      "TransactionAmount": 1000,
                      "TransactionCurrencyCode": "USD",
                      "TransactionBookingDate": "2026-04-15",
                      "CurrentAccountBalanceAfterTransactionAmount": 12450.18
                    }
                  ],
                  "page": {
                    "nextCursor": null,
                    "hasMore": false
                  }
                }
              },
              "errors": [
                {
                  "code": 404,
                  "meaning": "Not Found",
                  "when": "CurrentAccountReference not found."
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "key": "payment",
      "name": "Payment Order",
      "serviceDomains": [
        {
          "key": "PaymentOrderProcedure",
          "name": "PaymentOrderProcedure — Payment Initiation & Settlement",
          "operations": [
            {
              "id": "payment_initiate",
              "method": "POST",
              "path": "/PaymentOrderProcedure/Initiate",
              "summary": "Initiate a payment order. Routed to the relevant rail (SWIFT, RTGS, RTP, ACH, CARD). Idempotent.",
              "bianAction": "initiate",
              "bianBehaviorQualifier": "PaymentOrderInitiation",
              "headers": [
                {
                  "name": "Idempotency-Key",
                  "required": true,
                  "notes": "UUID per business intent (REQUIRED). Forward-propagated through the proxy → service → ledger to deduplicate journal postings."
                },
                {
                  "name": "Authorization",
                  "required": true,
                  "notes": "Bearer token with Payment-Initiate scope."
                },
                {
                  "name": "Content-Type",
                  "required": true,
                  "notes": "application/json"
                }
              ],
              "enums": {
                "PaymentRailType": [
                  "SWIFT",
                  "RTGS",
                  "RTP",
                  "ACH",
                  "CARD",
                  "INTERNAL"
                ],
                "PaymentChargeBearerType": [
                  "DEBT",
                  "CRED",
                  "SHAR",
                  "SLEV"
                ],
                "PaymentPriorityType": [
                  "NORM",
                  "HIGH",
                  "URGT"
                ]
              },
              "request": {
                "notes": "ISO 20022 pacs.008-style fields under BIAN canonical names. The proxy stamps the canonical envelope and forwards Idempotency-Key downstream.",
                "examples": [
                  {
                    "value": {
                      "CustomerReference": "CUS-20260507-000142",
                      "PaymentRailType": "SWIFT",
                      "PaymentType": "EXTERNAL_OUTBOUND",
                      "PaymentTransactionAmount": 1000,
                      "PaymentTransactionCurrencyCode": "USD",
                      "PaymentDebtorRecord": {
                        "DebtorAccountReference": "ACC-20260507-000891"
                      },
                      "PaymentCreditorRecord": {
                        "CreditorPartyName": "Acme GmbH",
                        "CreditorInternationalBankAccountNumber": "DE89370400440532013000",
                        "CreditorBankIdentifierCode": "COBADEFFXXX",
                        "CreditorBankName": "Commerzbank AG",
                        "CreditorBankCountryCode": "DE"
                      },
                      "PaymentRemittanceRecord": {
                        "RemittanceUnstructuredInformationText": "Invoice 2026-04-PRO-2010"
                      },
                      "PaymentChargeBearerType": "SHAR",
                      "PaymentPriorityType": "NORM"
                    }
                  }
                ]
              },
              "response": {
                "successCodes": [
                  201,
                  202
                ],
                "envelopeKeys": [
                  "PaymentOrderReference",
                  "PaymentEndToEndIdentifier",
                  "PaymentUniqueTransactionReference",
                  "PaymentApexStatus",
                  "PaymentInitiationDateTime"
                ],
                "example": {
                  "PaymentOrderReference": "PAY-20260507-0042",
                  "PaymentEndToEndIdentifier": "E2E-pay-550e8400-e29b",
                  "PaymentUniqueTransactionReference": "550e8400-e29b-41d4-a716-446655440000",
                  "PaymentApexStatus": "ACCEPTED",
                  "PaymentInitiationDateTime": "2026-05-07T11:48:32.401Z"
                }
              },
              "errors": [
                {
                  "code": 400,
                  "meaning": "Bad Request",
                  "when": "Missing CreditorInternationalBankAccountNumber for SWIFT/RTGS rails, or PaymentTransactionAmount <= 0."
                },
                {
                  "code": 403,
                  "meaning": "Forbidden",
                  "when": "Debtor account has a DEBIT_BLOCK restriction in force."
                },
                {
                  "code": 409,
                  "meaning": "Conflict",
                  "when": "Same Idempotency-Key replayed with a different payload."
                },
                {
                  "code": 422,
                  "meaning": "Unprocessable Entity",
                  "when": "Insufficient available balance + overdraft, or sanctions check FAIL."
                }
              ],
              "notesFooter": "On 201/202 the journal-entry posting is fired with the same Idempotency-Key — the unique index on journalEntries.idempotencyKey enforces single-posting under retry."
            },
            {
              "id": "payment_retrieve",
              "method": "POST",
              "path": "/PaymentOrderProcedure/Retrieve",
              "summary": "Retrieve a payment order by PaymentOrderReference — full ISO 20022 envelope, clearing/settlement timeline, and fraud evaluation.",
              "bianAction": "retrieve",
              "bianBehaviorQualifier": "PaymentOrderInitiation",
              "headers": [
                {
                  "name": "Authorization",
                  "required": true,
                  "notes": "Bearer token with Payment-Read scope."
                },
                {
                  "name": "Content-Type",
                  "required": true,
                  "notes": "application/json"
                }
              ],
              "request": {
                "examples": [
                  {
                    "value": {
                      "PaymentOrderReference": "PAY-20260507-0042"
                    }
                  }
                ]
              },
              "response": {
                "successCodes": [
                  200
                ],
                "envelopeKeys": [
                  "PaymentOrderReference",
                  "PaymentApexStatus",
                  "PaymentTransactionAmount",
                  "PaymentTransactionCurrencyCode",
                  "PaymentDebtorRecord",
                  "PaymentCreditorRecord",
                  "PaymentClearingAndSettlementRecord",
                  "PaymentFraudEvaluationRecord"
                ],
                "example": {
                  "PaymentOrderReference": "PAY-20260507-0042",
                  "PaymentApexStatus": "SETTLED",
                  "PaymentTransactionAmount": 1000,
                  "PaymentTransactionCurrencyCode": "USD",
                  "PaymentDebtorRecord": {
                    "DebtorAccountReference": "ACC-20260507-000891"
                  },
                  "PaymentCreditorRecord": {
                    "CreditorPartyName": "Acme GmbH",
                    "CreditorBankIdentifierCode": "COBADEFFXXX"
                  },
                  "PaymentClearingAndSettlementRecord": {
                    "PaymentReceivedDateTime": "2026-05-07T11:48:32.401Z",
                    "PaymentSettledDateTime": "2026-05-07T11:48:34.918Z",
                    "PaymentSettlementDate": "2026-05-07",
                    "PaymentClearingNetworkReference": "SWIFT-MT103-RX-2026-05-07-0098"
                  },
                  "PaymentFraudEvaluationRecord": {
                    "PaymentFraudScore": 0.12,
                    "PaymentFraudDecisionType": "ALLOW",
                    "FraudEvaluationDateTime": "2026-05-07T11:48:32.602Z"
                  }
                }
              },
              "errors": [
                {
                  "code": 404,
                  "meaning": "Not Found",
                  "when": "PaymentOrderReference not found."
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};
