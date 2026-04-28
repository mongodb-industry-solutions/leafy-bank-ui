"use client";

import React, { useState } from "react";
import { Body, Subtitle } from "@leafygreen-ui/typography";
import Banner from "@leafygreen-ui/banner";
import Button from "@leafygreen-ui/button";
import Code from "@leafygreen-ui/code";
import Icon from "@leafygreen-ui/icon";
import styles from "./BianExplorer.module.css";

const METHOD_CLASS = {
  GET: styles.methodGet,
  POST: styles.methodPost,
  PUT: styles.methodPut,
  PATCH: styles.methodPatch,
  DELETE: styles.methodDelete,
};

function isEmptyObject(obj) {
  return (
    obj &&
    typeof obj === "object" &&
    !Array.isArray(obj) &&
    Object.keys(obj).length === 0
  );
}

const BianApiTab = ({ catalog, loading, error, onRetry }) => {
  const [expandedOpId, setExpandedOpId] = useState(null);

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

  if (!catalog || !Array.isArray(catalog.domains) || catalog.domains.length === 0) {
    return <Body className={styles.muted}>No catalog data available.</Body>;
  }

  return (
    <div className={styles.apiScroll}>
      {catalog.domains.map((domain) => (
        <section key={domain.key} className={styles.apiDomain}>
          <header className={styles.apiDomainHeader}>
            <Subtitle>{domain.label}</Subtitle>
            <span className={styles.apiDomainSubtitle}>
              {domain.bianServiceDomain}
            </span>
          </header>

          <div className={styles.apiOpList}>
            {(domain.operations || []).map((op) => {
              const opKey = `${domain.key}::${op.id}`;
              const isOpen = expandedOpId === opKey;
              const method = String(op.method || "").toUpperCase();
              const methodClass = METHOD_CLASS[method] || styles.methodGet;
              const reqEx = op?.request?.example;
              const resEx = op?.response?.example;

              return (
                <React.Fragment key={opKey}>
                  <button
                    type="button"
                    className={styles.apiOpRow}
                    aria-expanded={isOpen}
                    aria-controls={`${opKey}-panel`}
                    onClick={() => setExpandedOpId(isOpen ? null : opKey)}
                  >
                    <span className={`${styles.methodBadge} ${methodClass}`}>
                      {method}
                    </span>
                    <span className={styles.apiOpPath}>{op.path}</span>
                    <span className={styles.apiOpName}>
                      {op.bianOperationName}
                    </span>
                    <span
                      className={`${styles.apiOpChevron} ${
                        isOpen ? styles.apiOpChevronOpen : ""
                      }`}
                      aria-hidden="true"
                    >
                      <Icon glyph="ChevronDown" />
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      id={`${opKey}-panel`}
                      role="region"
                      className={styles.apiOpExpanded}
                    >
                      {op.summary && (
                        <Body className={styles.apiOpSummary}>{op.summary}</Body>
                      )}

                      <div className={styles.apiOpJsonRow}>
                        <div className={styles.apiOpJsonBlock}>
                          <span className={styles.apiOpJsonLabel}>Request</span>
                          {isEmptyObject(reqEx) || reqEx == null ? (
                            <Body className={styles.muted}>No request body</Body>
                          ) : (
                            <Code language="json" copyable>
                              {JSON.stringify(reqEx, null, 2)}
                            </Code>
                          )}
                        </div>

                        <div className={styles.apiOpJsonBlock}>
                          <span className={styles.apiOpJsonLabel}>Response</span>
                          {resEx == null ? (
                            <Body className={styles.muted}>No response body</Body>
                          ) : (
                            <Code language="json" copyable>
                              {JSON.stringify(resEx, null, 2)}
                            </Code>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

export default BianApiTab;
