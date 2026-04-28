"use client";

import React, { useMemo, useState } from "react";
import { Body, Subtitle } from "@leafygreen-ui/typography";
import TextInput from "@leafygreen-ui/text-input";
import Banner from "@leafygreen-ui/banner";
import Button from "@leafygreen-ui/button";
import styles from "./BianExplorer.module.css";
import { groupKeyForPath, resolveGroupLabel } from "./bianGroupings";

const DOMAIN_ORDER = ["customers", "accounts", "payments", "transactions"];
const DOMAIN_LABELS = {
  customers: "Customers",
  accounts: "Accounts",
  payments: "Payments",
  transactions: "Transactions",
};

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

/**
 * Substring highlight; case-insensitive. Returns a fragment.
 */
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

/**
 * Compute the indentation depth for a Mongo path *relative to its group
 * prefix* so nested leaves read as a tree under their group root rather
 * than under the document root.
 *
 *   group "_top",              path "status"                  → 0
 *   group "identification",    path "identification.taxId"    → 0
 *   group "kyc.documents[]",   path "kyc.documents[].type"    → 0
 *   group "contact",           path "contact.addresses[].line1" → 1
 */
function indentDepth(path, groupKey) {
  const pathDots = (path.match(/\./g) || []).length;
  if (groupKey === "_top") return pathDots;
  const groupDots = (groupKey.match(/\./g) || []).length;
  // Path's leaf segment lives one level below the group prefix's last segment,
  // so subtract groupDots + 1 (for the prefix segment itself).
  return Math.max(0, pathDots - (groupDots + 1));
}

function buildGroupedDomain(domainKey, domainObj, query) {
  // domainObj is a flat map of mongoPath → bianCanonicalName.
  // Returns { groups: [{ key, label, rows: [...] }], totalCount, filteredCount }
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

  // Stable group ordering: _top first, then alphabetical.
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
      // canonical "root" name: if any row's path equals the group key, that BIAN
      // value is the group's canonical name
      rootCanonical: (() => {
        const rootKey = gk === "_top" ? null : gk;
        if (!rootKey) return null;
        // domainObj is a path→name map, so look up the root key directly
        // instead of scanning entries.
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

  return (
    <div className={styles.dataModelLayout}>
      <nav className={styles.domainNav} aria-label="BIAN data domains">
        {DOMAIN_ORDER.map((d) => {
          const isActive = d === activeDomain;
          return (
            <button
              key={d}
              type="button"
              className={`${styles.domainPill} ${isActive ? styles.domainPillActive : ""}`}
              onClick={() => setActiveDomain(d)}
              aria-pressed={isActive}
            >
              <span>{DOMAIN_LABELS[d]}</span>
              <span className={styles.domainPillCount}>{domainCounts[d]}</span>
            </button>
          );
        })}
      </nav>

      <div className={styles.dataModelMain}>
        <div className={styles.domainSegmented}>
          {DOMAIN_ORDER.map((d) => {
            const isActive = d === activeDomain;
            return (
              <button
                key={d}
                type="button"
                className={`${styles.domainPill} ${isActive ? styles.domainPillActive : ""}`}
                onClick={() => setActiveDomain(d)}
                aria-pressed={isActive}
              >
                <span>{DOMAIN_LABELS[d]}</span>
                <span className={styles.domainPillCount}>{domainCounts[d]}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.searchBar}>
          <TextInput
            aria-label="Filter BIAN field mappings"
            placeholder="Filter by Mongo path or BIAN name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sizeVariant="small"
          />
        </div>

        <div className={styles.groupsScroll}>
          {grouped.groups.length === 0 ? (
            <div className={styles.emptyState}>
              <Body>No fields match “{query}”.</Body>
            </div>
          ) : (
            grouped.groups.map((g) => (
              <section key={g.key} className={styles.groupCard}>
                <header className={styles.groupHeader}>
                  <Subtitle className={styles.groupTitle}>{g.label}</Subtitle>
                  {g.rootCanonical && (
                    <span className={styles.groupCanonical}>
                      {g.rootCanonical}
                    </span>
                  )}
                </header>

                <div className={styles.fieldTable}>
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
                      </React.Fragment>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BianDataModelTab;
