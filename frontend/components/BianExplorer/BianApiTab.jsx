"use client";

import React, { useMemo, useState } from "react";
import { Body, Subtitle } from "@leafygreen-ui/typography";
import Banner from "@leafygreen-ui/banner";
import Button from "@leafygreen-ui/button";
import Code from "@leafygreen-ui/code";
import Icon from "@leafygreen-ui/icon";
import Badge from "@leafygreen-ui/badge";
import {
  SegmentedControl,
  SegmentedControlOption,
} from "@leafygreen-ui/segmented-control";
import styles from "./BianExplorer.module.css";

// Method → background-color class. Catalog pins method to "POST" today,
// but we keep the mapping flexible so the row visually self-documents
// if a future op uses a different verb.
const METHOD_CLASS = {
  GET: styles.methodGet,
  POST: styles.methodPost,
  PUT: styles.methodPut,
  PATCH: styles.methodPatch,
  DELETE: styles.methodDelete,
};

const ERROR_CODE_CLASS = (code) => {
  if (code >= 500) return styles.errorCode5xx;
  if (code >= 400) return styles.errorCode4xx;
  return styles.errorCodeOther;
};

const SUCCESS_CODE_CLASS = (code) => {
  if (code >= 200 && code < 300) return styles.successCode2xx;
  return styles.successCodeOther;
};

// ─────────────────────────────────────────────────────────────
// Conventions header strip
// ─────────────────────────────────────────────────────────────

function ConventionsBar({ conventions, statusCodes }) {
  const [showStatusCodes, setShowStatusCodes] = useState(false);

  // Build the fact pills. Render only those whose underlying field is
  // present so the bar degrades gracefully if conventions ever change.
  const pills = [];
  if (conventions?.method) {
    pills.push({ key: "method", text: conventions.method });
  }
  if (conventions?.verbInUrl) {
    pills.push({ key: "verbInUrl", text: "verb-in-URL" });
  }
  if (conventions?.extraFieldsRejected) {
    pills.push({ key: "extra", text: "extra=forbid" });
  }
  if (conventions?.currencyStandard) {
    pills.push({
      key: "currency",
      text: `${conventions.currencyStandard} currency`,
    });
  }
  if (conventions?.moneyEncoding) {
    const text =
      conventions.moneyEncoding === "json-number"
        ? "money=number"
        : `money=${conventions.moneyEncoding}`;
    pills.push({ key: "money", text });
  }

  const hasStatusCodes = Array.isArray(statusCodes) && statusCodes.length > 0;

  return (
    <div className={styles.conventionsBar}>
      <div className={styles.conventionsPills}>
        {pills.map((p) => (
          <span key={p.key} className={styles.factPill}>
            {p.text}
          </span>
        ))}
      </div>
      {hasStatusCodes && (
        <div className={styles.conventionsActions}>
          <Button
            size="small"
            variant="default"
            onClick={() => setShowStatusCodes((v) => !v)}
            aria-expanded={showStatusCodes}
            aria-controls="bian-status-codes-panel"
          >
            {showStatusCodes ? "Hide status codes" : "Status codes"}
          </Button>
        </div>
      )}
      {showStatusCodes && hasStatusCodes && (
        <div
          id="bian-status-codes-panel"
          role="region"
          aria-label="API status codes"
          className={styles.statusCodesPanel}
        >
          <table className={styles.statusCodesTable}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Meaning</th>
              </tr>
            </thead>
            <tbody>
              {statusCodes.map((sc, i) => (
                <tr key={`${sc.code}-${i}`}>
                  <td>
                    <span
                      className={`${styles.statusCodeBadge} ${
                        sc.code >= 500
                          ? styles.errorCode5xx
                          : sc.code >= 400
                          ? styles.errorCode4xx
                          : styles.successCode2xx
                      }`}
                    >
                      {sc.code}
                    </span>
                  </td>
                  <td>{sc.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Service filter (segmented control)
// ─────────────────────────────────────────────────────────────

function ServiceFilter({ services, value, onChange }) {
  if (!services || services.length < 2) return null;
  return (
    <div className={styles.serviceFilter}>
      <SegmentedControl
        followFocus
        value={value}
        onChange={onChange}
        aria-label="Filter by service"
      >
        <SegmentedControlOption value="all">All</SegmentedControlOption>
        {services.map((s) => (
          <SegmentedControlOption key={s.key} value={s.key}>
            {capitalize(s.key)}
            {s.port != null ? ` (:${s.port})` : ""}
          </SegmentedControlOption>
        ))}
      </SegmentedControl>
    </div>
  );
}

function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─────────────────────────────────────────────────────────────
// Operation row + expanded panel
// ─────────────────────────────────────────────────────────────

function isIdempotent(op) {
  // HTTP header names are case-insensitive (RFC 7230 §3.2). Compare lowercased.
  return Array.isArray(op?.headers) && op.headers.some(
    (h) => h && typeof h.name === "string" &&
      h.name.toLowerCase() === "idempotency-key"
  );
}

function OperationRow({ op, opKey, isOpen, onToggle }) {
  const method = String(op.method || "").toUpperCase();
  const methodClass = METHOD_CLASS[method] || styles.methodGet;
  const idempotent = isIdempotent(op);

  return (
    <button
      type="button"
      className={styles.apiOpRow}
      aria-expanded={isOpen}
      aria-controls={`${opKey}-panel`}
      onClick={onToggle}
    >
      <span className={`${styles.methodBadge} ${methodClass}`}>{method}</span>
      <span className={styles.apiOpPath}>{op.path}</span>

      <span className={styles.apiOpMeta}>
        {idempotent && (
          <span className={styles.idempotentChip} title="Supports Idempotency-Key replay">
            idempotent
          </span>
        )}
        {op.bianBehaviorQualifier && (
          <span className={styles.behaviorChip}>
            {op.bianBehaviorQualifier}
          </span>
        )}
        {op.bianAction && (
          <span className={styles.actionPill}>{op.bianAction}</span>
        )}
        <span
          className={`${styles.apiOpChevron} ${
            isOpen ? styles.apiOpChevronOpen : ""
          }`}
          aria-hidden="true"
        >
          <Icon glyph="ChevronDown" />
        </span>
      </span>
    </button>
  );
}

function HeadersTable({ headers }) {
  if (!headers || headers.length === 0) return null;
  return (
    <section className={styles.opSection}>
      <span className={styles.apiOpJsonLabel}>Headers</span>
      <table className={styles.headersTable}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Required</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {headers.map((h, i) => (
            <tr key={`${h.name}-${i}`}>
              <td className={styles.fieldName}>{h.name}</td>
              <td>
                {h.required ? (
                  <Badge variant="red">required</Badge>
                ) : (
                  <Badge variant="lightgray">optional</Badge>
                )}
              </td>
              <td>{h.notes || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function EnumsBlock({ enums }) {
  if (!enums || typeof enums !== "object") return null;
  const entries = Object.entries(enums);
  if (entries.length === 0) return null;

  return (
    <section className={styles.opSection}>
      <span className={styles.apiOpJsonLabel}>Enums</span>
      <div className={styles.enumsBlock}>
        {entries.map(([fieldName, values]) => (
          <div key={fieldName} className={styles.enumRow}>
            <span className={styles.fieldName}>{fieldName}</span>
            <div className={styles.enumChips}>
              {(values || []).map((v) => (
                <span key={v} className={styles.enumChip}>{v}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RequestSection({ request }) {
  if (!request) return null;
  const examples = Array.isArray(request.examples) ? request.examples : [];

  return (
    <section className={styles.opSection}>
      <span className={styles.apiOpJsonLabel}>Request</span>

      {request.notes && (
        <Body className={styles.requestNotes}>{request.notes}</Body>
      )}

      {examples.length === 0 ? (
        <Body className={styles.muted}>No request body</Body>
      ) : (
        examples.map((ex, i) => (
          <div key={`${ex.label || "example"}-${i}`} className={styles.exampleBlock}>
            <span className={styles.exampleLabel}>{ex.label || `Example ${i + 1}`}</span>
            {ex.value == null ? (
              <Body className={styles.muted}>No request body</Body>
            ) : (
              <Code language="json" copyable>
                {JSON.stringify(ex.value, null, 2)}
              </Code>
            )}
          </div>
        ))
      )}
    </section>
  );
}

function ResponseSection({ response }) {
  if (!response) return null;
  const codes = Array.isArray(response.successCodes) ? response.successCodes : [];
  const envelopeKeys = Array.isArray(response.envelopeKeys)
    ? response.envelopeKeys
    : [];

  return (
    <section className={styles.opSection}>
      <span className={styles.apiOpJsonLabel}>Response</span>

      {codes.length > 0 && (
        <div className={styles.successCodesRow}>
          {codes.map((c, i) => (
            <React.Fragment key={`${c}-${i}`}>
              {i > 0 && <span className={styles.successOr}>or</span>}
              <span
                className={`${styles.statusCodeBadge} ${SUCCESS_CODE_CLASS(c)}`}
              >
                {c}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}

      {envelopeKeys.length > 0 && (
        <div className={styles.envelopeKeysCaption}>
          <span>Envelope keys:</span>{" "}
          {envelopeKeys.map((k, i) => (
            <React.Fragment key={k}>
              {i > 0 && <span>, </span>}
              <span className={styles.envelopeKey}>{k}</span>
            </React.Fragment>
          ))}
        </div>
      )}

      {response.example == null ? (
        <Body className={styles.muted}>No response body</Body>
      ) : (
        <Code language="json" copyable>
          {JSON.stringify(response.example, null, 2)}
        </Code>
      )}
    </section>
  );
}

function ErrorsSection({ errors }) {
  if (!errors || errors.length === 0) return null;
  return (
    <section className={styles.opSection}>
      <span className={styles.apiOpJsonLabel}>Errors</span>
      <table className={styles.errorsTable}>
        <thead>
          <tr>
            <th>Code</th>
            <th>Case</th>
          </tr>
        </thead>
        <tbody>
          {errors.map((e, i) => (
            <tr key={`${e.code}-${i}`}>
              <td>
                <span
                  className={`${styles.statusCodeBadge} ${ERROR_CODE_CLASS(e.code)}`}
                >
                  {e.code}
                </span>
              </td>
              <td>{e.case}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ExpandedPanel({ op, opKey }) {
  return (
    <div
      id={`${opKey}-panel`}
      role="region"
      aria-label={op.summary || op.id || "API operation details"}
      className={styles.apiOpExpanded}
    >
      {op.summary && <Body className={styles.apiOpSummary}>{op.summary}</Body>}

      <HeadersTable headers={op.headers} />
      <EnumsBlock enums={op.enums} />
      <RequestSection request={op.request} />
      <ResponseSection response={op.response} />
      <ErrorsSection errors={op.errors} />

      {op.notesFooter && (
        <div className={styles.notesFooter}>
          <Icon glyph="InfoWithCircle" />
          <Body>{op.notesFooter}</Body>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Service section
// ─────────────────────────────────────────────────────────────

function ServiceSection({ service, expandedOpId, setExpandedOpId }) {
  const hostPort =
    service.host && service.port != null
      ? `${service.host}:${service.port}`
      : service.host || "";

  return (
    <section className={styles.serviceSection}>
      <header className={styles.serviceHeader}>
        <span className={styles.serviceIcon} aria-hidden="true">
          <Icon glyph="CurlyBraces" />
        </span>
        <span className={styles.serviceName}>{service.name || service.key}</span>
        {hostPort && (
          <Badge variant="lightgray" className={styles.serviceHostPortBadge}>
            {hostPort}
          </Badge>
        )}
      </header>

      {(service.serviceDomains || []).map((sd) => (
        <div key={sd.key} className={styles.serviceDomainBlock}>
          <header className={styles.apiDomainHeader}>
            <Subtitle>{sd.label || sd.key}</Subtitle>
            <span className={styles.apiDomainSubtitle}>{sd.key}</span>
            {sd.description && (
              <Body className={styles.muted}>{sd.description}</Body>
            )}
          </header>

          <div className={styles.apiOpList}>
            {(sd.operations || []).map((op) => {
              const opKey = `${service.key}::${sd.key}::${op.id}`;
              const isOpen = expandedOpId === opKey;
              return (
                <React.Fragment key={opKey}>
                  <OperationRow
                    op={op}
                    opKey={opKey}
                    isOpen={isOpen}
                    onToggle={() => setExpandedOpId(isOpen ? null : opKey)}
                  />
                  {isOpen && <ExpandedPanel op={op} opKey={opKey} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Top-level tab
// ─────────────────────────────────────────────────────────────

const BianApiTab = ({ catalog, loading, error, onRetry }) => {
  const [expandedOpId, setExpandedOpId] = useState(null);
  const [serviceFilter, setServiceFilter] = useState("all");

  const visibleServices = useMemo(() => {
    if (!catalog || !Array.isArray(catalog.services)) return [];
    if (serviceFilter === "all") return catalog.services;
    return catalog.services.filter((s) => s.key === serviceFilter);
  }, [catalog, serviceFilter]);

  if (loading) {
    return <Body className={styles.loading}>Loading BIAN API catalog…</Body>;
  }

  if (error) {
    return (
      <div className={styles.errorBanner}>
        <Banner variant="danger">{String(error)}</Banner>
        {onRetry && (
          <div className={styles.errorActions}>
            <Button size="small" onClick={onRetry}>Retry</Button>
          </div>
        )}
      </div>
    );
  }

  if (!catalog || !Array.isArray(catalog.services) || catalog.services.length === 0) {
    return <Body className={styles.muted}>No catalog data available.</Body>;
  }

  return (
    <div className={styles.apiScroll}>
      <ConventionsBar
        conventions={catalog.conventions}
        statusCodes={catalog.statusCodes}
      />
      <ServiceFilter
        services={catalog.services}
        value={serviceFilter}
        onChange={setServiceFilter}
      />

      {visibleServices.map((service) => (
        <ServiceSection
          key={service.key}
          service={service}
          expandedOpId={expandedOpId}
          setExpandedOpId={setExpandedOpId}
        />
      ))}
    </div>
  );
};

export default BianApiTab;
