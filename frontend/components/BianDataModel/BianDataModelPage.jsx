"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Body, H1, H2, H3, Subtitle, Overline } from "@leafygreen-ui/typography";
import { SearchInput } from "@leafygreen-ui/search-input";
import Badge from "@leafygreen-ui/badge";
import Banner from "@leafygreen-ui/banner";
import Button from "@leafygreen-ui/button";
import Icon from "@leafygreen-ui/icon";
import IconButton from "@leafygreen-ui/icon-button";
import Link from "next/link";
import { Tabs, Tab } from "@leafygreen-ui/tabs";
import { palette, uiTokens, spacing } from "@/lib/ui/leafygreenTokens";
import {
  DOMAIN_MAP,
  GROUPS,
  RELS,
  STATS,
  DB_MAP,
  COLL_DATA,
  PATTERN_COLORS,
} from "./bianDataModelData";
import BianApiTab from "../BianExplorer/BianApiTab";
import { BIAN_API_CATALOG } from "./bianApiCatalog";
import { PAYMENT_RAIL_API_CATALOG } from "./paymentRailApiCatalog";
import { PORTFOLIO_API_CATALOG } from "./portfolioApiCatalog";
import { DOMAIN_ICONS, SEMANTIC_API_ICON } from "./domainIconMap";
import styles from "./BianDataModelPage.module.css";

const SEMANTIC_API_KEY = "__semantic_api__";
const PAYMENT_RAIL_API_KEY = "__payment_rail_api__";
const PORTFOLIO_API_KEY = "__portfolio_api__";

// A "demo lens" highlights the collections + semantic-API view a given demo
// uses. Chosen at runtime via ?demo=<key> (the Header appends it based on the
// page you opened the explorer from), falling back to NEXT_PUBLIC_DEFAULT_DEMO.
// With neither set, nothing is highlighted. Each demo maps to its DB_MAP key
// (collections to pill) + the sidebar key of its semantic-API view to pill.
const DEMOS = {
  payments: { dbKey: "fsi-payments-processing", apiKey: PAYMENT_RAIL_API_KEY },
  "leafy-bank": { dbKey: "leafy_bank_bian", apiKey: SEMANTIC_API_KEY },
  portfolio: { dbKey: "agentic_capital_markets", apiKey: PORTFOLIO_API_KEY },
};
const NO_DEMO = { dbKey: null, apiKey: null };
const DEFAULT_DEMO = process.env.NEXT_PUBLIC_DEFAULT_DEMO || null;

function resolveDemo(slug) {
  return DEMOS[slug] || DEMOS[DEFAULT_DEMO] || NO_DEMO;
}

function BsonTag({ type }) {
  const cls = styles[`bson_${type}`] || styles.bsonTag;
  return <span className={`${styles.bsonTag} ${cls}`}>{type}</span>;
}

function FieldName({ field }) {
  const klass = field.pk
    ? `${styles.fName} ${styles.fNamePk}`
    : field.fk
    ? `${styles.fName} ${styles.fNameFk}`
    : styles.fName;
  return (
    <span className={klass}>
      {field.name}
      {field.pk && <span className={`${styles.kbPill} ${styles.kbPillPk}`}>PK</span>}
      {field.fk && <span className={`${styles.kbPill} ${styles.kbPillFk}`}>FK</span>}
    </span>
  );
}

function CollectionTab({ d }) {
  return (
    <div>
      <div className={styles.metaCard}>
        <div className={styles.metaRow}><span className={styles.metaLbl}>MongoDB collection</span><span className={styles.metaVal}>{d.mongoName}</span></div>
        <div className={styles.metaRow}><span className={styles.metaLbl}>BIAN CR</span><span className={styles.metaVal}>{d.bianCR}</span></div>
        <div className={styles.metaRow}><span className={styles.metaLbl}>BIAN SD</span><span className={styles.metaVal}>{d.bianSD}</span></div>
        <div className={styles.metaRow}><span className={styles.metaLbl}>Pattern</span><span className={styles.metaVal}>{d.pattern}</span></div>
        <div className={styles.metaRow}><span className={styles.metaLbl}>Immutable</span><span className={styles.metaVal}>{d.immutable ? "Yes — append only" : "No"}</span></div>
      </div>
      {d.immutable && (
        <div className={styles.immutBannerWrap}>
          <Banner variant="danger">
            IMMUTABLE — append only. Corrections create new reversal documents, never edit existing entries.
          </Banner>
        </div>
      )}
      <table className={styles.tbl}>
        <thead>
          <tr>
            <th>MongoDB Field</th>
            <th>bsonType</th>
            <th>Required</th>
            <th>Description · BIAN name</th>
          </tr>
        </thead>
        <tbody>
          {(d.fields || []).map((f, i) => (
            <tr key={i}>
              <td><FieldName field={f} /></td>
              <td><BsonTag type={f.bt || "string"} /></td>
              <td>{f.req ? <span className={styles.reqYes}>Req</span> : <span className={styles.reqNo}>Opt</span>}</td>
              <td>
                {f.note && <span className={styles.fNote}>{f.note}</span>}
                {f.bian && <span className={styles.fBian}>BIAN: {f.bian}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MappingTab({ d }) {
  const entries = Object.entries(d.bm || {});
  const top = entries.filter(([k]) => !k.includes(".") && !k.includes("["));
  const nested = entries.filter(([k]) => k.includes(".") || k.includes("["));
  const grps = {};
  for (const [k, v] of nested) {
    const seg = k.split(/[.[]/)[0];
    if (!grps[seg]) grps[seg] = [];
    grps[seg].push([k, v]);
  }
  const renderRow = ([k, v]) => (
    <tr key={k}>
      <td><span className={styles.mapBian}>{v}</span></td>
      <td><span className={styles.mapMongo}>{k}</span></td>
    </tr>
  );
  return (
    <div>
      <div className={styles.mapLegend}>
        <div className={styles.mapLi}><div className={styles.mapLd} style={{ background: "#00684A" }} />BIAN v14 canonical name</div>
        <div className={styles.mapLi}><div className={styles.mapLd} style={{ background: "#001E2B" }} />MongoDB field path</div>
      </div>
      <table className={styles.tbl}>
        <thead>
          <tr><th>BIAN v14 Canonical Name</th><th>MongoDB Field Path</th></tr>
        </thead>
        <tbody>
          {top.length > 0 && (
            <tr><td colSpan={2} className={styles.mapSec}>Top-level fields</td></tr>
          )}
          {top.map(renderRow)}
          {Object.entries(grps).map(([seg, rows]) => (
            <React.Fragment key={seg}>
              <tr><td colSpan={2} className={styles.mapSec}>{seg}</td></tr>
              {rows.map(renderRow)}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BqTab({ d }) {
  const entries = Object.entries(d.bqm || {});
  if (!entries.length) {
    return (
      <div className={styles.metaCard}>
        <Body>No Behaviour Qualifier mapping defined for this collection.</Body>
      </div>
    );
  }
  return (
    <div>
      {entries.map(([bqName, fields]) => (
        <div key={bqName} className={styles.bqCard}>
          <div className={styles.bqHeader}>
            <span>{bqName}</span>
            <span className={styles.bqCount}>{fields.length} field{fields.length === 1 ? "" : "s"}</span>
          </div>
          <div className={styles.bqList}>
            {fields.map((p) => <code key={p} className={styles.bqPath}>{p}</code>)}
          </div>
        </div>
      ))}
    </div>
  );
}

function IndexesTab({ d }) {
  const indexes = d.indexes || [];
  if (!indexes.length) {
    return (
      <div className={styles.metaCard}>
        <Body>No indexes documented for this collection.</Body>
      </div>
    );
  }
  return (
    <table className={styles.tbl}>
      <thead>
        <tr><th>Name</th><th>Key</th><th>Type</th><th>Note</th></tr>
      </thead>
      <tbody>
        {indexes.map((idx, i) => (
          <tr key={i}>
            <td><code className={styles.fName}>{idx.name}</code></td>
            <td><code className={styles.bqPath}>{idx.key}</code></td>
            <td>
              {idx.unique && <Badge variant="green">unique</Badge>}{" "}
              {idx.sparse && <Badge variant="blue">sparse</Badge>}{" "}
              {!idx.unique && !idx.sparse && <Badge variant="lightgray">standard</Badge>}
            </td>
            <td><span className={styles.fNote}>{idx.note || ""}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RelationshipsTab({ activeKey }) {
  const rels = RELS.filter((r) => r.from === activeKey || r.to === activeKey);
  if (!rels.length) {
    return (
      <div className={styles.metaCard}>
        <Body>No documented relationships for this collection.</Body>
      </div>
    );
  }
  return (
    <div>
      {rels.map((r, i) => (
        <div key={i} className={styles.relCard}>
          <div className={styles.relRow}>
            <span className={styles.relColl}>{r.from}</span>
            <span className={styles.relArrow}>→</span>
            <span className={styles.relColl}>{r.to}</span>
            <span className={styles.relCard1n}>{r.cardinality}</span>
          </div>
          <div className={styles.relVia}>via {r.via}</div>
          {r.description && <div className={styles.relDesc}>{r.description}</div>}
        </div>
      ))}
    </div>
  );
}

function DomainView({ activeKey, demoCollections, demoDbKey }) {
  const info = DOMAIN_MAP.find((d) => d.key === activeKey);
  const d = COLL_DATA[activeKey];
  const [tab, setTab] = useState(0);
  if (!info || !d) return null;

  const color = info.color;
  const patColor = PATTERN_COLORS[d.pattern] || "#5C6C75";
  const bqCount = Object.keys(d.bqm || {}).length;
  const bmCount = Object.keys(d.bm || {}).length;
  const fieldCount = (d.fields || []).length;

  return (
    <div>
      <div className={styles.domainHeader} style={{ "--accent": color }}>
        <div className={styles.dhLeft}>
          <div className={styles.dhRow1}>
            <span className={styles.dhBigIcon} style={{ color }}>
              <Icon glyph={DOMAIN_ICONS[activeKey] || "Folder"} size="large" />
            </span>
            <span className={styles.dhSdLabel}>BIAN Service Domain</span>
            <Badge
              style={{ background: `${patColor}20`, color: patColor, border: `1px solid ${patColor}40` }}
            >
              {d.pattern}
            </Badge>
          </div>
          <H2 className={styles.dhTitle}>
            <span className={styles.dhTitleAccent} style={{ color }}>
              {d.bianSD || info.label}
            </span>
          </H2>
          <div className={styles.dhCr}>
            MongoDB: <strong>{d.mongoName}</strong> &nbsp;·&nbsp; BIAN CR: <strong>{d.bianCR}</strong>
          </div>
          {d.description && <div className={styles.dhDesc}>{d.description}</div>}
        </div>
        <div className={styles.dhRight}>
          {demoCollections.has(activeKey) && (
            <span className={`${styles.infoChip} ${styles.infoChipDemo}`}>Used by this demo</span>
          )}
          <span className={styles.infoChip}>{fieldCount} fields</span>
          <span className={styles.infoChip}>{bmCount} BIAN mappings</span>
          {bqCount > 0 && <span className={`${styles.infoChip} ${styles.infoChipBq}`}>{bqCount} BQs</span>}
          {d.immutable && (
            <span className={`${styles.infoChip} ${styles.infoChipImmut}`}>
              <Icon glyph="Lock" size="small" /> Immutable
            </span>
          )}
        </div>
      </div>

      <div className={styles.tabsWrap}>
        <Tabs selected={tab} setSelected={setTab} aria-label="Domain detail tabs">
          <Tab name="Collection"><CollectionTab d={d} /></Tab>
          <Tab name="BIAN Mapping"><MappingTab d={d} /></Tab>
          <Tab name="BQ Mapping"><BqTab d={d} /></Tab>
          <Tab name="Indexes"><IndexesTab d={d} /></Tab>
          <Tab name="Relationships"><RelationshipsTab activeKey={activeKey} /></Tab>
        </Tabs>
      </div>

      <div className={styles.footerPanels}>
        <div className={styles.footerCard}>
          <div className={styles.footerCardLbl}>Pattern legend</div>
          {Object.entries(PATTERN_COLORS).map(([p, c]) => (
            <span key={p} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: c }} />
              {p}
            </span>
          ))}
        </div>
        <div className={styles.footerCard}>
          <div className={styles.footerCardLbl}>Database map</div>
          {Object.entries(DB_MAP).map(([db, colls]) => (
            <div key={db} className={styles.dbChip}>
              <div className={styles.dbName}>
                {db}
                {db === demoDbKey && <span className={styles.demoPill}>demo</span>}
              </div>
              <div className={styles.dbColls}>{colls.join(", ")}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SemanticApiView() {
  return (
    <div className={styles.semanticApi}>
      <div className={styles.semanticApiHero}>
        <H3>Leafy Bank — BIAN Semantic API</H3>
        <p>BIAN-compliant action endpoints (initiate / retrieve / update / execute / register) mapped to the consolidated MongoDB data model. Browse by service domain.</p>
      </div>
      <div className={styles.semanticApiInner}>
        <BianApiTab catalog={BIAN_API_CATALOG} loading={false} error={null} />
      </div>
    </div>
  );
}

function PaymentRailApiView() {
  return (
    <div className={styles.semanticApi}>
      <div className={styles.semanticApiHero}>
        <H3>Payment Rail — BIAN Semantic API</H3>
        <p>BIAN-compliant PaymentRail endpoints — message conversion exposed as Outbound / Inbound transactions on a single operating session — plus the operational and agentic routes the Agentic Payments Platform demo runs. Browse by service.</p>
      </div>
      <div className={styles.semanticApiInner}>
        <BianApiTab catalog={PAYMENT_RAIL_API_CATALOG} loading={false} error={null} />
      </div>
    </div>
  );
}

function PortfolioApiView() {
  return (
    <div className={styles.semanticApi}>
      <div className={styles.semanticApiHero}>
        <H3>Portfolio — BIAN Semantic API</H3>
        <p>BIAN-compliant Capital Markets endpoints — InvestmentPortfolioPlanning (allocation) and InvestmentPortfolioAnalysis (daily performance read + Execute) for the equity (PORT-0001) and crypto (PORT-0002) portfolios. GET for retrieves, POST for the performance write.</p>
      </div>
      <div className={styles.semanticApiInner}>
        <BianApiTab catalog={PORTFOLIO_API_CATALOG} loading={false} error={null} />
      </div>
    </div>
  );
}

export default function BianDataModelPage() {
  const [activeKey, setActiveKey] = useState(DOMAIN_MAP[0].key);
  const [filter, setFilter] = useState("");
  const [demo, setDemo] = useState(DEFAULT_DEMO);
  const router = useRouter();

  // Read the demo lens from ?demo=<key> once on mount (set by the Header link
  // based on the page the explorer was opened from). Unknown/absent => no lens.
  useEffect(() => {
    const d = new URLSearchParams(window.location.search).get("demo");
    if (d && DEMOS[d]) setDemo(d);
  }, []);

  const activeDemo = resolveDemo(demo);
  const demoCollections = useMemo(
    () => new Set(DB_MAP[activeDemo.dbKey] || []),
    [activeDemo.dbKey]
  );
  const handleBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }, [router]);

  const filteredDomains = useMemo(() => {
    if (!filter.trim()) return DOMAIN_MAP;
    const q = filter.toLowerCase();
    return DOMAIN_MAP.filter(
      (d) =>
        d.label.toLowerCase().includes(q) ||
        d.group.toLowerCase().includes(q) ||
        d.key.toLowerCase().includes(q)
    );
  }, [filter]);

  return (
    <div className={styles.shell}>
      {/* HERO */}
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <button
            type="button"
            className={styles.backButton}
            onClick={handleBack}
            aria-label="Go back"
          >
            <Icon glyph="ArrowLeft" size="small" />
            <span>Back</span>
          </button>
          <Overline className={styles.heroEyebrow}>
            <span className={styles.heroDot} />
            Leafy Bank · MongoDB · BIAN v14
          </Overline>
          <H1 className={styles.heroTitle}>
            BIAN Data Model, Semantic API &amp; Ledger Flow
            <small>Consolidated Banking Data Model — BIAN v14 + MongoDB</small>
          </H1>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.heroStat}><div className={styles.heroStatVal}>{STATS.colls}</div><div className={styles.heroStatLbl}>Collections</div></div>
          <div className={styles.heroStat}><div className={styles.heroStatVal}>{STATS.fields}</div><div className={styles.heroStatLbl}>Fields</div></div>
          <div className={styles.heroStat}><div className={styles.heroStatVal}>{STATS.bm}</div><div className={styles.heroStatLbl}>BIAN Maps</div></div>
          <div className={styles.heroStat}><div className={styles.heroStatVal}>{STATS.bqs}</div><div className={styles.heroStatLbl}>BQs</div></div>
          <div className={styles.heroStat}><div className={styles.heroStatVal}>{STATS.rels}</div><div className={styles.heroStatLbl}>Relationships</div></div>
          <Link href="/ledger-flow" className={styles.heroCtaLink}>
            <Button variant="primary" size="small" leftGlyph={<Icon glyph="Diagram3" />}>
              Open Ledger Flow Demo
            </Button>
          </Link>
        </div>
      </div>

      {/* BODY */}
      <div className={styles.body}>
        {/* SIDEBAR */}
        <nav className={styles.sidebar} aria-label="BIAN domains">
          <div className={styles.searchWrap}>
            <SearchInput
              placeholder="Search domains…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Filter BIAN domains"
              size="small"
            />
          </div>
          {filteredDomains.length === 0 && (
            <div className={styles.railEmpty} role="status">
              <Icon glyph="MagnifyingGlass" size="default" />
              <Body className={styles.railEmptyTitle}>No domains match</Body>
              <Button variant="default" size="small" onClick={() => setFilter("")}>
                Clear filter
              </Button>
            </div>
          )}
          {GROUPS.map((group) => {
            const groupDomains = filteredDomains.filter((d) => d.group === group);
            if (!groupDomains.length) return null;
            return (
              <React.Fragment key={group}>
                <Overline className={styles.groupLabel}>{group}</Overline>
                {groupDomains.map((d) => {
                  const isActive = d.key === activeKey;
                  const isDemo = demoCollections.has(d.key);
                  return (
                    <button
                      key={d.key}
                      type="button"
                      className={`${styles.domainBtn} ${isActive ? styles.domainBtnActive : ""} ${isDemo ? styles.domainBtnDemo : ""}`}
                      style={{ borderLeftColor: isActive ? d.color : "transparent" }}
                      onClick={() => setActiveKey(d.key)}
                    >
                      <span className={styles.domainIcon} style={{ color: isActive ? d.color : palette.gray.dark1 }}>
                        <Icon glyph={DOMAIN_ICONS[d.key] || "Folder"} size="small" />
                      </span>
                      <span
                        className={styles.domainName}
                        style={{ color: isActive ? d.color : undefined }}
                      >
                        {d.label}
                      </span>
                      {isDemo && <span className={styles.demoPill}>demo</span>}
                    </button>
                  );
                })}
              </React.Fragment>
            );
          })}

          {/* Semantic API — at the very end of the sidebar */}
          <Overline className={styles.semanticDivider}>Semantic Layer</Overline>
          <button
            type="button"
            className={`${styles.domainBtn} ${activeKey === SEMANTIC_API_KEY ? styles.domainBtnActive : ""} ${activeDemo.apiKey === SEMANTIC_API_KEY ? styles.domainBtnDemo : ""}`}
            style={{ borderLeftColor: activeKey === SEMANTIC_API_KEY ? palette.green.dark2 : "transparent" }}
            onClick={() => setActiveKey(SEMANTIC_API_KEY)}
          >
            <span className={styles.domainIcon} style={{ color: activeKey === SEMANTIC_API_KEY ? palette.green.dark2 : palette.gray.dark1 }}>
              <Icon glyph={SEMANTIC_API_ICON} size="small" />
            </span>
            <span
              className={styles.domainName}
              style={{ color: activeKey === SEMANTIC_API_KEY ? palette.green.dark2 : undefined }}
            >
              Leafy Bank Semantic API
            </span>
            {activeDemo.apiKey === SEMANTIC_API_KEY && <span className={styles.demoPill}>demo</span>}
          </button>
          <button
            type="button"
            className={`${styles.domainBtn} ${activeKey === PAYMENT_RAIL_API_KEY ? styles.domainBtnActive : ""} ${activeDemo.apiKey === PAYMENT_RAIL_API_KEY ? styles.domainBtnDemo : ""}`}
            style={{ borderLeftColor: activeKey === PAYMENT_RAIL_API_KEY ? palette.green.dark2 : "transparent" }}
            onClick={() => setActiveKey(PAYMENT_RAIL_API_KEY)}
          >
            <span className={styles.domainIcon} style={{ color: activeKey === PAYMENT_RAIL_API_KEY ? palette.green.dark2 : palette.gray.dark1 }}>
              <Icon glyph={SEMANTIC_API_ICON} size="small" />
            </span>
            <span
              className={styles.domainName}
              style={{ color: activeKey === PAYMENT_RAIL_API_KEY ? palette.green.dark2 : undefined }}
            >
              Payment Rail Semantic API
            </span>
            {activeDemo.apiKey === PAYMENT_RAIL_API_KEY && <span className={styles.demoPill}>demo</span>}
          </button>
          <button
            type="button"
            className={`${styles.domainBtn} ${activeKey === PORTFOLIO_API_KEY ? styles.domainBtnActive : ""} ${activeDemo.apiKey === PORTFOLIO_API_KEY ? styles.domainBtnDemo : ""}`}
            style={{ borderLeftColor: activeKey === PORTFOLIO_API_KEY ? palette.green.dark2 : "transparent" }}
            onClick={() => setActiveKey(PORTFOLIO_API_KEY)}
          >
            <span className={styles.domainIcon} style={{ color: activeKey === PORTFOLIO_API_KEY ? palette.green.dark2 : palette.gray.dark1 }}>
              <Icon glyph={SEMANTIC_API_ICON} size="small" />
            </span>
            <span
              className={styles.domainName}
              style={{ color: activeKey === PORTFOLIO_API_KEY ? palette.green.dark2 : undefined }}
            >
              Portfolio Semantic API
            </span>
            {activeDemo.apiKey === PORTFOLIO_API_KEY && <span className={styles.demoPill}>demo</span>}
          </button>
        </nav>

        {/* MAIN */}
        <main className={styles.main}>
          <div className={styles.mainInner}>
            {activeKey === SEMANTIC_API_KEY ? (
              <SemanticApiView />
            ) : activeKey === PAYMENT_RAIL_API_KEY ? (
              <PaymentRailApiView />
            ) : activeKey === PORTFOLIO_API_KEY ? (
              <PortfolioApiView />
            ) : (
              <DomainView activeKey={activeKey} demoCollections={demoCollections} demoDbKey={activeDemo.dbKey} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
