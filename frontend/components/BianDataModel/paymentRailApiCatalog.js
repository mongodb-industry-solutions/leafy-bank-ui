// PaymentRail BIAN Semantic API catalog — Agentic Payments Platform demo.
// Copied from fsi-bian-model; export renamed BIAN_API_CATALOG -> PAYMENT_RAIL_API_CATALOG
// so it doesn't collide with this repo's BIAN_API_CATALOG (the Leafy Bank catalog).
//
// This demo's converter exposes payment-message conversion as BIAN PaymentRail
// transactions (CR: PaymentRailOperatingSession). One conversion run = one
// transaction under a single fixed implicit operating session
// (PRAIL-SESSION-DEFAULT). Direction is chosen by targetFormat:
//   targetFormat = a wire format (pacs.008 / MT103 / cain.001) -> OutboundTransaction
//   targetFormat = JSON                                        -> InboundTransaction
//
// BIAN routes use the verb-in-URL convention (POST /PaymentRail/.../Action).
// Agentic + operational routes stay on /api/v1/* and are NOT BIAN-shaped — they
// share snake_case SSE event payloads with the agent service and are surfaced
// here under a separate (non-BIAN) service for completeness.
//
// Shape contract — consumed by `BianApiTab`:
//   enums: { <label>: [values] }            (object, not array)
//   request.examples: [{ label?, value }]    (array, not request.example)
//   response.example: <object|null>          (singular)

export const PAYMENT_RAIL_API_CATALOG = {
  version: "v1.0",
  description:
    "Agentic Payments Platform — PaymentRail BIAN v14 Semantic API. The converter exposes message conversion (MT103 / pacs.008 / cain.001 / ISO 8583 ↔ canonical JSON) as PaymentRail Outbound/Inbound transactions under a single fixed operating session (PRAIL-SESSION-DEFAULT). BIAN operations are POST with the verb in the URL. Agentic and operational routes remain on /api/v1/* (non-BIAN).",
  conventions: {
    method: "POST",
    verbInUrl: true,
    extraFieldsRejected: true,
  },
  statusCodes: [
    { code: 200, meaning: "OK — Retrieve returned the stored document, or Initiate began streaming (text/event-stream)." },
    { code: 400, meaning: "Bad Request — malformed body or unparseable source message." },
    { code: 404, meaning: "Not Found — unknown operating session (sessionId) or conversionRunId." },
    { code: 422, meaning: "Unprocessable Entity — targetFormat does not match the route's behaviour qualifier (e.g. a JSON target on OutboundTransaction), or strict-body validation failed." },
    { code: 500, meaning: "Internal Server Error — conversion or agent failure." },
  ],
  services: [
    {
      key: "paymentrail",
      name: "Payment Rail",
      serviceDomains: [
        {
          key: "PaymentRail",
          label: "PaymentRail — Message Conversion",
          description:
            "Control record: PaymentRailOperatingSession. The demo has no scheduled/batched session lifecycle, so it collapses to a single fixed implicit session, PRAIL-SESSION-DEFAULT. Each conversion run is one transaction under that session; the run's _id (conversionRunId) is the transaction reference. Direction is the conversion's deliverable: a wire target = OutboundTransaction, a JSON target = InboundTransaction.",
          operations: [
            {
              id: "outbound_initiate",
              method: "POST",
              path: "/PaymentRail/{sessionId}/OutboundTransaction/Initiate",
              summary:
                "Convert a payment message to a wire format (multi-hop, e.g. MT103 → JSON → pacs.008). Emitting a message to send = OutboundTransaction. Response is a Server-Sent Events stream of conversion progress, not a single JSON body.",
              bianAction: "initiate",
              bianBehaviorQualifier: "OutboundTransaction",
              headers: [
                { name: "Content-Type", required: true, notes: "application/json" },
                { name: "Accept", required: false, notes: "text/event-stream (the response is an SSE stream)" },
              ],
              enums: {
                sourceFormat: ["MT103", "pacs.008", "cain.001", "ISO8583_0200"],
                targetFormat: ["pacs.008", "MT103", "cain.001", "ISO8583_0200"],
              },
              request: {
                notes:
                  "MultiHopConversionRequest (strict, extra fields rejected). useJsonBridge routes via canonical JSON as the intermediate hop; useAi=false forces the rules/regex lane only. sessionId in the path is PRAIL-SESSION-DEFAULT.",
                examples: [
                  {
                    label: "MT103 → pacs.008",
                    value: {
                      sourceFormat: "MT103",
                      targetFormat: "pacs.008",
                      message: "{1:F01BANKBEBBAXXX0000000000}{2:I103BANKDEFFXXXXN}{4:\n:20:REF123\n:23B:CRED\n:32A:260603USD50000,00\n:50K:/12345678\nACME CORP\n:59:/87654321\nGLOBEX LLC\n:71A:SHA\n-}",
                      useJsonBridge: true,
                      useAi: true,
                    },
                  },
                ],
              },
              response: {
                successCodes: [200],
                envelopeKeys: ["type", "conversion_run_id", "output", "processing_stats", "confidence_scores", "total_time"],
                example: {
                  type: "complete",
                  output: "<converted pacs.008 XML>",
                  processing_stats: { rules_lane: 8, ai_lane: 2, human_lane: 0 },
                  confidence_scores: { overall: 0.97 },
                  total_time: 0.81,
                  agent_correction: null,
                },
              },
              notesFooter:
                "Response is an SSE stream (Content-Type: text/event-stream). Each line is `data: {…}`. Sequence: start (carries conversion_run_id) → hop1_start/hop1_complete → hop2_start/hop2_complete → complete (shown above).",
            },
            {
              id: "inbound_initiate",
              method: "POST",
              path: "/PaymentRail/{sessionId}/InboundTransaction/Initiate",
              summary:
                "Ingest a received payment message into canonical JSON (targetFormat = JSON). Ingesting an inbound message = InboundTransaction. Response is an SSE stream of conversion progress.",
              bianAction: "initiate",
              bianBehaviorQualifier: "InboundTransaction",
              headers: [
                { name: "Content-Type", required: true, notes: "application/json" },
                { name: "Accept", required: false, notes: "text/event-stream (the response is an SSE stream)" },
              ],
              enums: {
                sourceFormat: ["MT103", "pacs.008", "cain.001", "ISO8583_0200"],
                targetFormat: ["JSON"],
              },
              request: {
                notes:
                  "MultiHopConversionRequest with targetFormat = JSON. The route's BQ is validated against targetFormat — a non-JSON target here returns 422.",
                examples: [
                  {
                    label: "pacs.008 → JSON",
                    value: {
                      sourceFormat: "pacs.008",
                      targetFormat: "JSON",
                      message: "<Document xmlns=\"urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08\">…</Document>",
                      useJsonBridge: true,
                      useAi: true,
                    },
                  },
                ],
              },
              response: {
                successCodes: [200],
                envelopeKeys: ["type", "conversion_run_id", "output", "processing_stats", "confidence_scores", "total_time"],
                example: {
                  type: "complete",
                  output: { transactionRef: "REF123", currency: "USD", amount: "50000.00" },
                  processing_stats: { rules_lane: 9, ai_lane: 1, human_lane: 0 },
                  confidence_scores: { overall: 0.98 },
                  total_time: 0.42,
                  agent_correction: null,
                },
              },
              notesFooter:
                "Response is an SSE stream (text/event-stream); same event sequence as OutboundTransaction. The terminal `complete` event carries the canonical JSON in `output`.",
            },
            {
              id: "outbound_retrieve",
              method: "POST",
              path: "/PaymentRail/{sessionId}/OutboundTransaction/{conversionRunId}/Retrieve",
              summary:
                "Return the stored canonicalJsonStorage document for one outbound conversion run.",
              bianAction: "retrieve",
              bianBehaviorQualifier: "OutboundTransaction",
              headers: [
                { name: "Content-Type", required: false, notes: "application/json — no request body is required" },
              ],
              request: {
                notes:
                  "conversionRunId is supplied in the path; there is no request body (the previous CanonicalJsonRetrieveRequest body was removed in the BQ-split refactor).",
                examples: [],
              },
              response: {
                successCodes: [200],
                envelopeKeys: ["conversionRunId", "canonicalJson"],
                example: {
                  conversionRunId: "1f3c9e2a-8b4d-4f7a-9c1e-2d6b5a0f3e88",
                  canonicalJson: {
                    _id: "1f3c9e2a-8b4d-4f7a-9c1e-2d6b5a0f3e88",
                    id: "PAYRAIL-RUN-1f3c9e2a",
                    conversionId: "MT103_to_pacs.008",
                    jsonData: {
                      transactionRef: "REF123",
                      currency: "USD",
                      amount: "50000.00",
                      debtorName: "ACME CORP",
                      creditorName: "GLOBEX LLC",
                      chargeBearer: "SHA",
                    },
                    metadata: {
                      sourceFormat: "MT103",
                      targetFormat: "pacs.008",
                      timestamp: "2026-06-03T10:14:22Z",
                      processingTimeSeconds: 0.81,
                    },
                    createdAt: "2026-06-03T10:14:22Z",
                  },
                },
              },
            },
            {
              id: "inbound_retrieve",
              method: "POST",
              path: "/PaymentRail/{sessionId}/InboundTransaction/{conversionRunId}/Retrieve",
              summary:
                "Return the stored canonicalJsonStorage document for one inbound (message → JSON) conversion run.",
              bianAction: "retrieve",
              bianBehaviorQualifier: "InboundTransaction",
              headers: [
                { name: "Content-Type", required: false, notes: "application/json — no request body is required" },
              ],
              request: {
                notes: "conversionRunId is supplied in the path; there is no request body.",
                examples: [],
              },
              response: {
                successCodes: [200],
                envelopeKeys: ["conversionRunId", "canonicalJson"],
                example: {
                  conversionRunId: "9b2e1d77-2a3c-4e55-8f0a-44c1b9e6d210",
                  canonicalJson: {
                    _id: "9b2e1d77-2a3c-4e55-8f0a-44c1b9e6d210",
                    id: "PAYRAIL-RUN-9b2e1d77",
                    conversionId: "pacs.008_to_JSON",
                    jsonData: { transactionRef: "REF888", currency: "EUR", amount: "12000.00" },
                    metadata: { sourceFormat: "pacs.008", targetFormat: "JSON", timestamp: "2026-06-03T11:02:09Z" },
                    createdAt: "2026-06-03T11:02:09Z",
                  },
                },
              },
            },
          ],
        },
      ],
    },
    {
      key: "operational",
      name: "Agentic & Operational (non-BIAN)",
      serviceDomains: [
        {
          key: "AgenticConversion",
          label: "Agentic Conversion",
          description:
            "LangGraph human-in-the-loop exception handling. SSE endpoints with snake_case event payloads shared across the converter and agent services — kept on /api/v1/* because renaming would break the shared event contract for zero BIAN benefit.",
          operations: [
            {
              id: "agent_resume",
              method: "POST",
              path: "/api/v1/agent/resume-stream",
              summary: "Resume an interrupted agent conversion after a human review decision (SSE stream).",
              request: {
                notes: "Resume payload keyed by thread_id; snake_case event protocol shared with the agent service.",
                examples: [{ value: { thread_id: "thr_abc123", approved: true, modified_value: null } }],
              },
              response: { successCodes: [200], envelopeKeys: [], example: null },
              notesFooter: "Non-BIAN. Response is an SSE stream (text/event-stream).",
            },
            {
              id: "ai_review_resume",
              method: "POST",
              path: "/api/v1/ai-review/resume-stream",
              summary: "Resume an AI-review stream; shares the agent SSE event protocol.",
              request: { notes: "Same shared snake_case event protocol as the agent resume route.", examples: [] },
              response: { successCodes: [200], envelopeKeys: [], example: null },
              notesFooter: "Non-BIAN. SSE stream.",
            },
            {
              id: "payment_agent_process",
              method: "POST",
              path: "/api/v1/payment-agent/process-stream-with-review",
              summary: "Run the multi-agent payment exception workflow with a human-review interrupt (SSE stream).",
              request: { notes: "Agent service endpoint.", examples: [] },
              response: { successCodes: [200], envelopeKeys: [], example: null },
              notesFooter: "Non-BIAN. SSE stream.",
            },
            {
              id: "collection_preview",
              method: "GET",
              path: "/api/v1/payment-agent/collection-preview/{collectionName}",
              summary: "Preview documents from a MongoDB collection the agent can read (debug/observability).",
              request: { notes: "collectionName in the path.", examples: [] },
              response: { successCodes: [200], envelopeKeys: [], example: null },
            },
          ],
        },
        {
          key: "ConfigAndOps",
          label: "Configuration & Operations",
          description:
            "Conversion configuration and operational endpoints. These act on agentic infrastructure (conversion_configs, format_specifications) or are health/audit views — no BIAN control record, so no BIAN verb.",
          operations: [
            {
              id: "canonical_diff",
              method: "GET",
              path: "/api/v1/canonical-json/{conversionRunId}/diff",
              summary: "Before/after diff and changed-field audit trail for a conversion run.",
              request: { notes: "conversionRunId in the path.", examples: [] },
              response: { successCodes: [200], envelopeKeys: ["conversionRunId", "diff", "changedFields"], example: null },
              notesFooter: "Reads the same PaymentRail CR but is an audit view, not a core-state Retrieve — kept on /api/v1/* deliberately.",
            },
            {
              id: "list_configs",
              method: "GET",
              path: "/api/v1/configs",
              summary: "List all conversion configurations.",
              request: { notes: "", examples: [] },
              response: { successCodes: [200], envelopeKeys: [], example: null },
            },
            {
              id: "auto_configure",
              method: "POST",
              path: "/api/v1/auto-configure",
              summary: "Auto-generate a draft conversion config from a sample message (LLM-assisted).",
              request: { notes: "", examples: [{ value: { sourceFormat: "MT103", sampleMessage: "{1:F01…}{4:\n:20:REF…\n-}" } }] },
              response: { successCodes: [200], envelopeKeys: ["configId", "draft", "notCoveredFields"], example: null },
            },
            {
              id: "approve_config",
              method: "POST",
              path: "/api/v1/auto-configure/{config_id}/approve",
              summary: "Approve and persist an auto-generated conversion config.",
              request: { notes: "config_id in the path.", examples: [] },
              response: { successCodes: [200], envelopeKeys: [], example: null },
            },
            {
              id: "format_specs",
              method: "GET",
              path: "/api/v1/format-specifications",
              summary: "List target format specifications.",
              request: { notes: "", examples: [] },
              response: { successCodes: [200], envelopeKeys: [], example: null },
            },
            {
              id: "health",
              method: "GET",
              path: "/api/v1/health",
              summary: "Converter service health check.",
              request: { notes: "", examples: [] },
              response: { successCodes: [200], envelopeKeys: ["status"], example: { status: "ok" } },
            },
          ],
        },
      ],
    },
  ],
};
