"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Body, Subtitle } from "@leafygreen-ui/typography";
import TextInput from "@leafygreen-ui/text-input";
import Banner from "@leafygreen-ui/banner";
import Button from "@leafygreen-ui/button";
import Icon from "@leafygreen-ui/icon";
import styles from "./BianExplorer.module.css";
import { groupKeyForPath, resolveGroupLabel } from "./bianGroupings";

const DOMAIN_ORDER = ["customers", "accounts", "payments", "transactions"];
const DOMAIN_LABELS = {
  customers: "Customers",
  accounts: "Accounts",
  payments: "Payments",
  transactions: "Transactions",
};

// BIAN v14 Service Domain metadata — static per the spec.
const BIAN_DOMAIN_META = {
  customers: {
    serviceDomain: "Party Reference Data Directory",
    pattern: "Directory",
  },
  accounts: {
    serviceDomain: "Current Account",
    pattern: "Fulfillment",
  },
  payments: {
    serviceDomain: "Payment Order",
    pattern: "Procedure",
  },
  transactions: {
    serviceDomain: "Financial Transaction Log",
    pattern: "Registry",
  },
};

// Infer a MongoDB type from a field path using naming conventions.
function inferMongoType(path) {
  if (path.endsWith("[]")) return "Array";
  const leaf = path.split(".").pop().replace(/\[\]$/, "");
  if (/At$|Date$|Time$|Since$|Expiry$|Expires$/.test(leaf)) return "Date";
  if (/Amount$|Balance$|Rate$|Fee$|Count$|Number$|Index$|Limit$|Score$/.test(leaf)) return "Number";
  if (/^is[A-Z]|Flag$|Enabled$|Active$|Verified$|Required$/.test(leaf)) return "Boolean";
  return "String";
}

const TYPE_CLASS = {
  Date:    styles.typeDate,
  Number:  styles.typeNumber,
  Boolean: styles.typeBoolean,
  Array:   styles.typeArray,
  String:  styles.typeString,
};

function TypeChip({ path }) {
  const type = inferMongoType(path);
  return (
    <span className={`${styles.typeChip} ${TYPE_CLASS[type] || styles.typeString}`}>
      {type}
    </span>
  );
}

// Domain pill used in both sidebar and mobile segmented row.
function DomainPill({ d, isActive, onClick, count }) {
  const meta = BIAN_DOMAIN_META[d];
  return (
    <button
      type="button"
      className={`${styles.domainPill} ${isActive ? styles.domainPillActive : ""}`}
      onClick={onClick}
      aria-pressed={isActive}
    >
      <span className={styles.domainPillTopRow}>
        <span>{DOMAIN_LABELS[d]}</span>
        <span className={styles.domainPillCount}>{count}</span>
      </span>
      {meta && (
        <>
          <span className={styles.domainPillMeta} title={meta.serviceDomain}>
            {meta.serviceDomain}
          </span>
          <span className={styles.domainPillPattern}>{meta.pattern}</span>
        </>
      )}
    </button>
  );
}

/**
 * Render a Mongo path with the prefix dimmed and the leaf bolded.
 * Array markers "[]" are rendered as small inline chips.
 * If a query is provided, matching substrings are highlighted with <mark>.
 */
function renderMongoPath(path, query) {
  const segments = path.split(".");
  const lastIdx = segments.length - 1;
  const parts = [];

  segments.forEach((seg, i) => {
    const isLeaf = i === lastIdx;
    const hasArray = seg.endsWith("[]");
    const base = hasArray ? seg.slice(0, -2) : seg;
    const klass = isLeaf ? styles.fieldPathLeaf : styles.fieldPathPrefix;

    parts.push(
      <span key={`s-${i}`} className={klass}>
        {highlight(base, query)}
      </span>
    );
    if (hasArray) {
      parts.push(
        <span key={`a-${i}`} className={styles.arrayChip}>[]</span>
      );
    }
    if (i < lastIdx) {
      parts.push(
        <span key={`d-${i}`} className={styles.fieldPathPrefix}>.</span>
      );
    }
  });

  return parts;
}

function highlight(text, query) {
  if (!query) return text;
  const q = query.trim();
  if (!q) return text;
  const lower = text.toLowerCase();
  const lowerQ = q.toLowerCase();
  const out = [];
  let i = 0;
  while (i < text.length) {
    const idx = lower.indexOf(lowerQ, i);
    if (idx === -1) {
      out.push(text.slice(i));
      break;
    }
    if (idx > i) out.push(text.slice(i, idx));
    out.push(<mark key={`m-${idx}`}>{text.slice(idx, idx + q.length)}</mark>);
    i = idx + q.length;
  }
  return <>{out}</>;
}

function indentDepth(path, groupKey) {
  const pathDots = (path.match(/\./g) || []).length;
  if (groupKey === "_top") return pathDots;
  const groupDots = (groupKey.match(/\./g) || []).length;
  return Math.max(0, pathDots - (groupDots + 1));
}

function buildGroupedDomain(domainKey, domainObj, query) {
  const entries = Object.entries(domainObj || {});
  const totalCount = entries.length;

  const q = (query || "").trim().toLowerCase();
  const passes = (path, bian) => {
    if (!q) return true;
    return (
      path.toLowerCase().includes(q) ||
      String(bian).toLowerCase().includes(q)
    );
  };

  const groupsMap = new Map();
  for (const [path, bian] of entries) {
    if (!passes(path, bian)) continue;
    const gk = groupKeyForPath(path);
    if (!groupsMap.has(gk)) groupsMap.set(gk, []);
    groupsMap.get(gk).push({ path, bian });
  }

  const groupKeys = Array.from(groupsMap.keys()).sort((a, b) => {
    if (a === "_top") return -1;
    if (b === "_top") return 1;
    return a.localeCompare(b);
  });

  const groups = groupKeys.map((gk) => {
    const rows = groupsMap.get(gk).sort((x, y) => x.path.localeCompare(y.path));
    return {
      key: gk,
      label: resolveGroupLabel(domainKey, gk),
      rootCanonical: (() => {
        const rootKey = gk === "_top" ? null : gk;
        if (!rootKey) return null;
        return domainObj?.[rootKey] ?? null;
      })(),
      rows,
    };
  });

  const filteredCount = groups.reduce((acc, g) => acc + g.rows.length, 0);
  return { groups, totalCount, filteredCount };
}

const BianDataModelTab = ({ mapping, loading, error, onRetry }) => {
  const [activeDomain, setActiveDomain] = useState(DOMAIN_ORDER[0]);
  const [query, setQuery] = useState("");
  const [devMode, setDevMode] = useState(false);
  // Track which group keys the user has manually closed.
  // All groups start open; user toggles individual cards.
  const [closedGroups, setClosedGroups] = useState(new Set());

  const toggleGroup = useCallback((key) => {
    setClosedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // Combine domain switch + closed-groups reset into one synchronous batch
  // so there is no intermediate frame where new-domain groups appear collapsed.
  function switchDomain(d) {
    setActiveDomain(d);
    setClosedGroups(new Set());
  }

  const domainCounts = useMemo(() => {
    const counts = {};
    for (const d of DOMAIN_ORDER) {
      counts[d] = mapping && mapping[d] ? Object.keys(mapping[d]).length : 0;
    }
    return counts;
  }, [mapping]);

  const grouped = useMemo(() => {
    if (!mapping) return { groups: [], totalCount: 0, filteredCount: 0 };
    return buildGroupedDomain(activeDomain, mapping[activeDomain], query);
  }, [mapping, activeDomain, query]);

  if (loading) {
    return <Body className={styles.loading}>Loading BIAN field mappings…</Body>;
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

  if (!mapping) {
    return <Body className={styles.muted}>No mapping data available.</Body>;
  }

  const threeCol = useMemo(
    () =>
      devMode
        ? { gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) max-content" }
        : undefined,
    [devMode]
  );

  return (
    <div className={styles.dataModelLayout}>
      {/* Sidebar domain nav */}
      <nav className={styles.domainNav} aria-label="BIAN data domains">
        {DOMAIN_ORDER.map((d) => (
          <DomainPill
            key={d}
            d={d}
            isActive={d === activeDomain}
            onClick={() => switchDomain(d)}
            count={domainCounts[d]}
          />
        ))}
      </nav>

      {/* Main content */}
      <div className={styles.dataModelMain}>
        {/* Mobile domain picker (hidden at ≥900px via CSS) */}
        <div
          className={styles.domainSegmented}
          role="navigation"
          aria-label="BIAN data domains"
        >
          {DOMAIN_ORDER.map((d) => (
            <DomainPill
              key={d}
              d={d}
              isActive={d === activeDomain}
              onClick={() => switchDomain(d)}
              count={domainCounts[d]}
            />
          ))}
        </div>

        {/* Search + dev-mode toggle */}
        <div className={styles.searchBar}>
          <div className={styles.searchBarRow}>
            <TextInput
              aria-label="Filter BIAN field mappings"
              placeholder="Filter by Mongo path or BIAN name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sizeVariant="small"
            />
            <button
              type="button"
              className={`${styles.devToggle} ${devMode ? styles.devToggleActive : ""}`}
              onClick={() => setDevMode((v) => !v)}
              title={devMode ? "Hide field types" : "Show inferred MongoDB types"}
              aria-pressed={devMode}
            >
              Dev
            </button>
          </div>
          {query && (
            <div className={styles.searchMeta} aria-live="polite">
              Showing {grouped.filteredCount} of {grouped.totalCount} fields
            </div>
          )}
        </div>

        {/* Field group cards */}
        <div className={styles.groupsScroll}>
          {grouped.groups.length === 0 ? (
            <div className={styles.emptyState}>
              <Body>No fields match &ldquo;{query}&rdquo;.</Body>
            </div>
          ) : (
            grouped.groups.map((g) => {
              const isOpen = !closedGroups.has(g.key);
              const panelId = `bian-group-${activeDomain}-${
                g.key.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")
              }`;
              return (
                <div key={g.key} className={styles.groupCard}>
                  <button
                    type="button"
                    className={styles.groupCardSummary}
                    onClick={() => toggleGroup(g.key)}
                    aria-expanded={isOpen ? "true" : "false"}
                    aria-controls={panelId}
                  >
                    <div className={styles.groupHeaderContent}>
                      <Subtitle className={styles.groupTitle}>{g.label}</Subtitle>
                      {g.rootCanonical && (
                        <span className={styles.groupCanonical}>
                          {g.rootCanonical}
                        </span>
                      )}
                    </div>
                    <div className={styles.groupHeaderRight}>
                      <span className={styles.groupFieldCount}>{g.rows.length}</span>
                      <span
                        className={`${styles.groupChevron} ${isOpen ? styles.groupChevronOpen : ""}`}
                        aria-hidden="true"
                      >
                        <Icon glyph="ChevronDown" size={14} />
                      </span>
                    </div>
                  </button>

                  <div
                    id={panelId}
                    className={styles.groupCardBody}
                    hidden={!isOpen}
                  >
                      <div className={styles.fieldTable} style={threeCol}>
                        <span className={styles.fieldColHeader}>MongoDB Path</span>
                        <span className={styles.fieldColHeader}>BIAN Name</span>
                        {devMode && (
                          <span className={styles.fieldColHeader}>Type</span>
                        )}
                        {g.rows.map(({ path, bian }) => {
                          const depth = indentDepth(path, g.key);
                          return (
                            <React.Fragment key={path}>
                              <div
                                className={styles.fieldPath}
                                style={{ paddingLeft: `${depth * 12}px` }}
                              >
                                {renderMongoPath(path, query)}
                              </div>
                              <div className={styles.bianName}>
                                {highlight(String(bian), query)}
                              </div>
                              {devMode && (
                                <div className={styles.fieldTypeCell}>
                                  <TypeChip path={path} />
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default BianDataModelTab;
