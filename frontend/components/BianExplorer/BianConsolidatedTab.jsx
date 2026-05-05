"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Body, Subtitle, InlineCode } from "@leafygreen-ui/typography";
import TextInput from "@leafygreen-ui/text-input";
import Icon from "@leafygreen-ui/icon";
import Badge from "@leafygreen-ui/badge";
import Code from "@leafygreen-ui/code";
import {
  SegmentedControl,
  SegmentedControlOption,
} from "@leafygreen-ui/segmented-control";
import styles from "./BianExplorer.module.css";
import {
  SD_GROUPS,
  SEMANTIC_TYPE_STYLES,
  BSON_TYPE_STYLES,
  SERVICE_DOMAINS,
  PATTERN_BADGE_VARIANT,
  inferSemanticType,
} from "./bianConsolidatedModel";

// LG Badge has 6 variants — pattern → variant mapping happens here so the
// data module stays presentation-agnostic.
function patternBadgeVariant(pattern) {
  return PATTERN_BADGE_VARIANT[pattern] || "lightgray";
}

// ─────────────────────────────────────────────────────────────────────────────
// Small primitives
// ─────────────────────────────────────────────────────────────────────────────

function SemanticTypePill({ type }) {
  const style = SEMANTIC_TYPE_STYLES[type] || SEMANTIC_TYPE_STYLES.Text;
  return (
    <span
      className={styles.consSemPill}
      style={{ background: style.bg, color: style.color }}
    >
      {type}
    </span>
  );
}

function BsonTypePill({ bsonType }) {
  const t = (bsonType || "string").toLowerCase();
  const style = BSON_TYPE_STYLES[t] || BSON_TYPE_STYLES.string;
  return (
    <span
      className={styles.consBsonPill}
      style={{ background: style.bg, color: style.color }}
    >
      {t}
    </span>
  );
}

function highlight(text, query) {
  if (!query) return text;
  const q = query.trim();
  if (!q) return text;
  const lower = String(text).toLowerCase();
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

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────────────────────

function Sidebar({ activeKey, onSelect, query, setQuery }) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SERVICE_DOMAINS;
    return SERVICE_DOMAINS.filter((sd) => {
      return (
        sd.label.toLowerCase().includes(q) ||
        sd.bianServiceDomain.toLowerCase().includes(q) ||
        sd.group.toLowerCase().includes(q) ||
        (sd.collection?.mongoName || "").toLowerCase().includes(q)
      );
    });
  }, [query]);

  const totalDomains = SERVICE_DOMAINS.length;

  return (
    <aside className={styles.consSidebar} aria-label="BIAN service domains">
      <div className={styles.consSearchWrap}>
        <TextInput
          aria-label="Search service domains"
          placeholder={`Search ${totalDomains} domains…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sizeVariant="small"
        />
      </div>
      {filtered.length === 0 ? (
        <div className={styles.consSidebarEmpty} role="status">
          <Body className={styles.consSidebarEmptyTitle}>
            No domains match.
          </Body>
          <Body className={styles.consSidebarEmptyHint}>
            Try “KYC”, “card”, “ledger”, or “fraud”.
          </Body>
        </div>
      ) : (
        SD_GROUPS.map((group) => {
          const inGroup = filtered.filter((sd) => sd.group === group.key);
          if (!inGroup.length) return null;
          return (
            <div key={group.key} className={styles.consGroupBlock}>
              <div
                className={styles.consGroupLabel}
                style={{ color: group.accent }}
              >
                {group.label}
              </div>
              {inGroup.map((sd) => {
                const isActive = sd.key === activeKey;
                return (
                  <button
                    key={sd.key}
                    type="button"
                    className={`${styles.consSdButton} ${
                      isActive ? styles.consSdButtonActive : ""
                    }`}
                    style={{
                      // Active = full accent; hover preview is handled in CSS
                      // via `--cons-hover-accent` set just below.
                      borderLeftColor: isActive ? group.accent : "transparent",
                      "--cons-hover-accent": group.accent,
                    }}
                    onClick={() => onSelect(sd.key)}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className={styles.consSdIcon} aria-hidden="true">
                      <Icon glyph={sd.icon} size={14} />
                    </span>
                    <span className={styles.consSdLabel}>{sd.label}</span>
                    {sd.isLive ? (
                      <span
                        className={styles.consLiveDot}
                        aria-label="Backed by live Leafy Bank data"
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          );
        })
      )}
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SD header strip
// ─────────────────────────────────────────────────────────────────────────────

function SdHeader({ sd, accent }) {
  const chipParts = [];
  if (sd.collection?.mongoName) {
    chipParts.push({ key: "mongo", label: "MongoDB", val: sd.collection.mongoName });
  }
  if (sd.bianControlRecord) {
    chipParts.push({ key: "cr", label: "BIAN CR", val: sd.bianControlRecord });
  }
  if (sd.collection?.shardKey) {
    chipParts.push({ key: "shard", label: "Shard key", val: sd.collection.shardKey });
  }

  return (
    <div className={styles.consSdHeader} style={{ borderTopColor: accent }}>
      <div className={styles.consSdHeaderTopRow}>
        <span className={styles.consSdHeaderIcon} style={{ color: accent }}>
          <Icon glyph={sd.icon} size={20} />
        </span>
        <span className={styles.consSdHeaderLabel}>BIAN Service Domain</span>
        <Badge variant={patternBadgeVariant(sd.pattern)}>{sd.pattern}</Badge>
        {sd.isLive ? (
          <Badge variant="green" className={styles.consLiveBadge}>
            <span className={styles.consLiveBadgePulse} aria-hidden="true" />
            Live
          </Badge>
        ) : (
          <Badge variant="lightgray">Reference</Badge>
        )}
      </div>
      <Subtitle className={styles.consSdHeaderTitle}>
        {sd.bianServiceDomain}
      </Subtitle>
      {sd.summary && (
        <Body className={styles.consSdHeaderSummary}>{sd.summary}</Body>
      )}
      {!sd.isLive && (
        <Body className={styles.consSdHeaderRefNote}>
          Reference model — illustrative; not backed by a Leafy Bank collection
          in this demo.
        </Body>
      )}
      {chipParts.length > 0 && (
        <div className={styles.consSdHeaderChipsLine}>
          {chipParts.map((c, i) => (
            <React.Fragment key={c.key}>
              {i > 0 && (
                <span className={styles.consSdHeaderSep} aria-hidden="true">
                  ·
                </span>
              )}
              <span className={styles.consSdHeaderChipKey}>{c.label}</span>
              <InlineCode className={styles.consSdHeaderChipVal}>
                {c.val}
              </InlineCode>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Schema sub-tab
// ─────────────────────────────────────────────────────────────────────────────

function ReqDot({ required }) {
  return (
    <span
      className={`${styles.consReqDot} ${required ? styles.consReqDotOn : ""}`}
      role="img"
      aria-label={required ? "required" : "optional"}
    />
  );
}

function SchemaTab({ sd }) {
  const [query, setQuery] = useState("");
  const fields = sd.collection?.fields || [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return fields;
    return fields.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.bian || "").toLowerCase().includes(q) ||
        (f.note || "").toLowerCase().includes(q)
    );
  }, [fields, query]);

  // Build the createIndex code block once per SD.
  const indexCode = useMemo(() => {
    const idxs = sd.controlRecord?.indexes || [];
    const coll = sd.collection?.mongoName || "collection";
    if (!idxs.length) return null;
    return idxs
      .map((spec) => {
        // Strip a trailing " unique" annotation we put in the data; convert to
        // a real `createIndex(spec, { unique: true })` call.
        const isUnique = / unique\s*$/i.test(spec);
        const cleaned = spec.replace(/ unique\s*$/i, "").trim();
        return isUnique
          ? `db.${coll}.createIndex(${cleaned}, { unique: true });`
          : `db.${coll}.createIndex(${cleaned});`;
      })
      .join("\n");
  }, [sd]);

  return (
    <div className={styles.consSchemaWrap}>
      <div className={styles.consSchemaToolbar}>
        <TextInput
          aria-label="Filter schema fields"
          placeholder="Filter by field, BIAN name, or note…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sizeVariant="small"
        />
        {query && (
          <span className={styles.consSchemaCount}>
            {filtered.length} of {fields.length}
          </span>
        )}
      </div>

      {sd.collection?.immutable && (
        <div className={styles.consImmutableBanner}>
          <Icon glyph="Lock" size={12} />
          <span>
            <strong>Immutable</strong> — append-only ledger. Reversals create new
            documents; existing entries are never modified.
          </span>
        </div>
      )}

      <div className={styles.consSchemaTable}>
        <div className={styles.consSchemaHeaderRow}>
          <span>Field</span>
          <span>Type</span>
          <span aria-label="Required">Req</span>
          <span>BIAN Name &amp; Notes</span>
        </div>
        {filtered.map((f, i) => (
          <div className={styles.consSchemaRow} key={f.name}>
            <div className={styles.consSchemaName}>
              {f.pk && <span className={styles.consPkChip}>PK</span>}
              {f.fk && <span className={styles.consFkChip}>FK</span>}
              <InlineCode>{highlight(f.name, query)}</InlineCode>
            </div>
            <div>
              <BsonTypePill bsonType={f.bsonType} />
            </div>
            <div className={styles.consReqCell}>
              <ReqDot required={!!f.required} />
            </div>
            <div className={styles.consSchemaBian}>
              {f.bian && (
                <InlineCode className={styles.consSchemaBianName}>
                  {highlight(f.bian, query)}
                </InlineCode>
              )}
              {f.note && (
                <div className={styles.consSchemaNote}>
                  {highlight(f.note, query)}
                </div>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className={styles.consEmpty}>
            No fields match &ldquo;{query}&rdquo;.
          </div>
        )}
      </div>

      {sd.collection?.systemFields && sd.collection.systemFields.length > 0 && (
        <div className={styles.consSystemFields}>
          <div className={styles.consSystemFieldsLabel}>
            BIAN System Fields (present on all CRs)
          </div>
          <div className={styles.consSystemFieldsRow}>
            {sd.collection.systemFields.map((f) => (
              <InlineCode key={f} className={styles.consSystemChip}>
                {f}
              </InlineCode>
            ))}
          </div>
        </div>
      )}

      {indexCode && (
        <div className={styles.consIndexBlock}>
          <div className={styles.consIndexLabel}>Indexes</div>
          <Code language="javascript" copyable={false}>
            {indexCode}
          </Code>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BIAN Model sub-tab
// ─────────────────────────────────────────────────────────────────────────────

function BqGroup({ bq, isOpen, onToggle }) {
  const fields = bq.fields || [];
  return (
    <div className={styles.consBqCard}>
      <button
        type="button"
        className={styles.consBqHeader}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div className={styles.consBqHeaderLeft}>
          <span className={styles.consBqTitle}>BQ: {bq.name}</span>
          {bq.bianBQ && (
            <span className={styles.consBqSubtitle}>{bq.bianBQ}</span>
          )}
        </div>
        <div className={styles.consBqHeaderRight}>
          <span className={styles.consBqCount}>{fields.length} fields</span>
          <span
            className={`${styles.consBqChevron} ${isOpen ? styles.consBqChevronOpen : ""}`}
            aria-hidden="true"
          >
            <Icon glyph="ChevronDown" size={14} />
          </span>
        </div>
      </button>
      {isOpen && (
        <div className={styles.consBqBody}>
          <div className={styles.consCrHeaderRow}>
            <span>BIAN Field</span>
            <span>Semantic Type</span>
            <span>Notes</span>
          </div>
          {fields.map((f) => (
            <div className={styles.consCrRow} key={f.name}>
              <InlineCode className={styles.consCrName}>{f.name}</InlineCode>
              <SemanticTypePill type={f.type} />
              <div className={styles.consCrNote}>{f.note || ""}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BianModelTab({ sd }) {
  const cr = sd.controlRecord;
  const synthesized = !cr;
  const bqs = cr?.behaviorQualifiers || [];

  const crFields = cr
    ? cr.fields
    : (sd.collection?.fields || [])
        .filter((f) => f.bian && f.bsonType !== "object" && f.bsonType !== "array")
        .map((f) => ({
          name: f.bian,
          type: inferSemanticType(f.bian),
          impl: f.name,
          note: f.note,
        }));

  // First BQ open by default; user can expand all / collapse all.
  const [openSet, setOpenSet] = useState(
    () => new Set(bqs.length ? [bqs[0].name] : [])
  );
  const allOpen = bqs.length > 0 && openSet.size === bqs.length;

  function toggleBq(name) {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }
  function expandAll() {
    setOpenSet(new Set(bqs.map((b) => b.name)));
  }
  function collapseAll() {
    setOpenSet(new Set());
  }

  return (
    <div className={styles.consBianModelWrap}>
      {synthesized && (
        <div className={styles.consSynthNote}>
          Detailed Control Record / Behavior Qualifiers are not modeled in this
          curated view. The fields below are synthesized from the collection
          schema, with semantic types inferred from BIAN naming conventions.
        </div>
      )}

      <div className={styles.consCrSection}>
        <div className={styles.consSectionLabel}>
          Control Record fields ({crFields.length})
        </div>
        <div className={styles.consCrTable}>
          <div className={styles.consCrHeaderRow}>
            <span>BIAN Field → impl alias</span>
            <span>Semantic Type</span>
            <span>Notes</span>
          </div>
          {crFields.map((f) => (
            <div className={styles.consCrRow} key={f.name}>
              <div className={styles.consCrNameWrap}>
                <InlineCode className={styles.consCrName}>{f.name}</InlineCode>
                {f.impl && (
                  <div className={styles.consCrImpl}>
                    impl: <span>{f.impl}</span>
                  </div>
                )}
              </div>
              <SemanticTypePill type={f.type} />
              <div className={styles.consCrNote}>{f.note || ""}</div>
            </div>
          ))}
        </div>
      </div>

      {bqs.length > 0 && (
        <div className={styles.consBqSection}>
          <div className={styles.consBqSectionHeader}>
            <div className={styles.consSectionLabel}>
              Behavior Qualifiers ({bqs.length})
            </div>
            <button
              type="button"
              className={styles.consBqToggleAll}
              onClick={allOpen ? collapseAll : expandAll}
            >
              {allOpen ? "Collapse all" : "Expand all"}
            </button>
          </div>
          {bqs.map((bq) => (
            <BqGroup
              key={bq.name}
              bq={bq}
              isOpen={openSet.has(bq.name)}
              onToggle={() => toggleBq(bq.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Services sub-tab
// ─────────────────────────────────────────────────────────────────────────────

function ServicesTab({ sd }) {
  const { dddServices = [], events = [], bianOperations = [] } =
    sd.services || {};
  return (
    <div className={styles.consServicesWrap}>
      <div className={styles.consServicesSection}>
        <div className={styles.consSectionLabel}>DDD Services</div>
        <div className={styles.consServiceList}>
          {dddServices.map((s) => (
            <div className={styles.consServiceItem} key={s}>
              <span className={styles.consServiceDot} aria-hidden="true" />
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {events.length > 0 && (
        <div className={styles.consServicesSection}>
          <div className={styles.consSectionLabel}>Domain Events</div>
          <div className={styles.consEventList}>
            {events.map((e) => (
              <span className={styles.consEventPill} key={e}>
                <Icon glyph="Connect" size={10} /> {e}
              </span>
            ))}
          </div>
        </div>
      )}

      {bianOperations.length > 0 && (
        <div className={styles.consServicesSection}>
          <div className={styles.consSectionLabel}>BIAN Operations</div>
          <div className={styles.consOpList}>
            {bianOperations.map((op) => (
              <span className={styles.consOpPill} key={op}>
                /{op}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Related-domains footer (cross-SD links)
// ─────────────────────────────────────────────────────────────────────────────

function RelatedDomains({ sd, onNavigate }) {
  const relatedKeys = sd.related || [];
  const items = relatedKeys
    .map((k) => SERVICE_DOMAINS.find((s) => s.key === k))
    .filter(Boolean);
  if (items.length === 0) return null;
  return (
    <div className={styles.consRelated}>
      <span className={styles.consRelatedLabel}>Related domains</span>
      <div className={styles.consRelatedPills}>
        {items.map((rsd) => {
          const grp = SD_GROUPS.find((g) => g.key === rsd.group);
          const accent = grp?.accent || "#1254B7";
          return (
            <button
              key={rsd.key}
              type="button"
              className={styles.consRelatedPill}
              onClick={() => onNavigate(rsd.key)}
              style={{ "--cons-hover-accent": accent }}
              title={rsd.bianServiceDomain}
            >
              <Icon glyph={rsd.icon} size={10} />
              <span>{rsd.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Top-level tab
// ─────────────────────────────────────────────────────────────────────────────

const BianConsolidatedTab = ({ liveMapping }) => {
  const [activeKey, setActiveKey] = useState(SERVICE_DOMAINS[0].key);
  const [search, setSearch] = useState("");
  const [subTab, setSubTab] = useState("schema");

  const sd = useMemo(
    () => SERVICE_DOMAINS.find((s) => s.key === activeKey) || SERVICE_DOMAINS[0],
    [activeKey]
  );

  const accent = useMemo(() => {
    const grp = SD_GROUPS.find((g) => g.key === sd.group);
    return grp?.accent || "#1254B7";
  }, [sd]);

  // Reset the schema/services sub-tab when switching SD so a Reference SD
  // landing on a non-existent state never happens.
  function selectSd(key) {
    setActiveKey(key);
    setSubTab("schema");
  }

  // Dev-only drift canary: if the live mapping disagrees with the static
  // BIAN names for the 4 live SDs, warn so we can update the static module.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (!liveMapping) return;
    const liveByMongo = {
      customers: "CustomerManagement",
      accounts: "AccountManagement",
      payments: "PaymentOrder",
      transactions: "AccountTransactions",
    };
    for (const [domain, sdKey] of Object.entries(liveByMongo)) {
      const target = SERVICE_DOMAINS.find((s) => s.key === sdKey);
      const live = liveMapping[domain];
      if (!target || !live) continue;
      for (const f of target.collection?.fields || []) {
        if (!f.bian) continue;
        const liveName = live[f.name];
        if (liveName && liveName !== f.bian) {
          // eslint-disable-next-line no-console
          console.warn(
            `[BIAN consolidated] drift on ${domain}.${f.name}: static="${f.bian}" live="${liveName}"`
          );
        }
      }
    }
  }, [liveMapping]);

  return (
    <div className={styles.consLayout}>
      <Sidebar
        activeKey={activeKey}
        onSelect={selectSd}
        query={search}
        setQuery={setSearch}
      />

      <div className={styles.consMain}>
        {/* SD switch fades content via key={sd.key}; CSS animation honors
            prefers-reduced-motion. */}
        <div key={sd.key} className={styles.consSdContent}>
          <SdHeader sd={sd} accent={accent} />

          <div className={styles.consSubTabs}>
            <SegmentedControl
              size="small"
              value={subTab}
              onChange={setSubTab}
              aria-label="Service domain views"
              aria-controls="bian-cons-subtab-body"
            >
              <SegmentedControlOption value="schema">
                Schema
              </SegmentedControlOption>
              <SegmentedControlOption value="bian">
                BIAN Model
              </SegmentedControlOption>
              <SegmentedControlOption value="services">
                Services
              </SegmentedControlOption>
            </SegmentedControl>
          </div>

          <div id="bian-cons-subtab-body" className={styles.consSubTabBody}>
            {subTab === "schema" && <SchemaTab key={sd.key} sd={sd} />}
            {subTab === "bian" && <BianModelTab key={sd.key} sd={sd} />}
            {subTab === "services" && <ServicesTab sd={sd} />}
          </div>

          <RelatedDomains sd={sd} onNavigate={selectSd} />
        </div>
      </div>
    </div>
  );
};

export default BianConsolidatedTab;
