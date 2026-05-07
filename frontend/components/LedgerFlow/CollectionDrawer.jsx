"use client";

import React, { useState } from "react";
import { Drawer, DrawerStackProvider } from "@leafygreen-ui/drawer";
import { H3, Body, Subtitle, Overline, InlineCode } from "@leafygreen-ui/typography";
import Badge from "@leafygreen-ui/badge";
import Code from "@leafygreen-ui/code";
import Icon from "@leafygreen-ui/icon";
import { motion, AnimatePresence } from "motion/react";
import { SPRING } from "./motionConfig";
import { COLLECTIONS, COLLECTION_KEYS, DESIGN_DECISIONS, META } from "./ledgerSchema";
import styles from "./CollectionDrawer.module.css";

function StatPill({ label, value, accent }) {
  return (
    <div className={`${styles.statPill} ${accent ? styles[`statPill_${accent}`] : ""}`}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

function FieldTable({ fields }) {
  return (
    <table className={styles.fieldTable}>
      <thead>
        <tr>
          <th className={styles.fieldTh}>Field</th>
          <th className={styles.fieldTh}>Type</th>
          <th className={`${styles.fieldTh} ${styles.fieldThReq}`}>Req</th>
          <th className={styles.fieldTh} title="BIAN v14 canonical name — represents the SD/CR/BQ attribute or aggregate this Mongo field maps to">BIAN Name</th>
          <th className={styles.fieldTh}>Notes</th>
        </tr>
      </thead>
      <tbody>
        {fields.map((f) => (
          <tr key={f.name} className={`${styles.fieldTr} ${f.required ? styles.fieldTrRequired : ""}`}>
            <td className={styles.fieldTdName}><code>{f.name}</code></td>
            <td className={styles.fieldTdType}>
              <span className={`${styles.typePill} ${styles[`type_${f.type}`] || ""}`}>{f.type}</span>
            </td>
            <td className={styles.fieldTdReq}>{f.required ? <span className={styles.reqCheck}>✓</span> : <span className={styles.reqDot}>·</span>}</td>
            <td className={styles.fieldTdBian}>{f.bian ? <code className={styles.bianValue}>{f.bian}</code> : <span className={styles.bianNone}>—</span>}</td>
            <td className={styles.fieldTdNote}>{f.note || ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function IndexCard({ index }) {
  return (
    <div className={styles.indexCard}>
      <div className={styles.indexHead}>
        <code className={styles.indexName}>{index.name}</code>
        <div className={styles.indexFlags}>
          {index.unique && <Badge variant="green">unique</Badge>}
          {index.sparse && <Badge variant="blue">sparse</Badge>}
          {!index.unique && !index.sparse && <Badge variant="lightgray">standard</Badge>}
        </div>
      </div>
      <code className={styles.indexKey}>{index.key}</code>
    </div>
  );
}

function CollectionPanel({ collectionKey }) {
  const c = COLLECTIONS[collectionKey];
  if (!c) return null;
  const decisions = DESIGN_DECISIONS.filter((d) => c.designDecisionIds?.includes(d.id));
  const requiredCount = c.fields.filter((f) => f.required).length;

  return (
    <div className={styles.panel}>
      {/* HERO — title + classification badges + stats */}
      <header className={styles.hero}>
        <div className={styles.heroLeft}>
          <Overline className={styles.heroEyebrow}>{c.database || META.database}</Overline>
          <H3 className={styles.heroTitle}>
            <Icon glyph="DatabaseConnection" size="large" className={styles.heroIcon} />
            {c.mongoAlias}
          </H3>
          <Body className={styles.heroDesc}>{c.description}</Body>
          <div className={styles.heroBadges}>
            <Badge variant="green">SD · {c.bianClassification.sd}</Badge>
            <Badge variant="blue">CR · {c.bianClassification.cr}</Badge>
            <Badge variant="purple">BQ · {c.bianClassification.bq}</Badge>
            <Badge variant="darkgray">Pattern · {c.bianClassification.pattern}</Badge>
            {c.immutable && <Badge variant="yellow">immutable when POSTED</Badge>}
          </div>
        </div>
        <div className={styles.heroStats}>
          <StatPill label="fields" value={c.fields.length} accent="green" />
          <StatPill label="required" value={requiredCount} accent="blue" />
          {c.indexes?.length > 0 && (
            <StatPill label="indexes" value={c.indexes.length} accent="purple" />
          )}
          {c.entryFields && (
            <StatPill label="entry sub-fields" value={c.entryFields.length} accent="yellow" />
          )}
        </div>
      </header>

      {/* FIELDS — table */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <Overline className={styles.sectionEyebrow}>Fields</Overline>
          <span className={styles.sectionCount}>{c.fields.length}</span>
        </div>
        <FieldTable fields={c.fields} />
      </section>

      {c.entryFields && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <Overline className={styles.sectionEyebrow}>Entry sub-fields</Overline>
            <code className={styles.sectionPath}>entries[].*</code>
            <span className={styles.sectionCount}>{c.entryFields.length}</span>
          </div>
          <FieldTable fields={c.entryFields} />
        </section>
      )}

      {/* INDEXES — visual cards */}
      {c.indexes?.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <Overline className={styles.sectionEyebrow}>Indexes</Overline>
            <span className={styles.sectionCount}>{c.indexes.length}</span>
          </div>
          <div className={styles.indexGrid}>
            {c.indexes.map((idx) => (
              <IndexCard key={idx.name} index={idx} />
            ))}
          </div>
        </section>
      )}

      {/* SAMPLE DOCUMENT(S) */}
      {c.sampleDocuments ? (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <Overline className={styles.sectionEyebrow}>Sample documents</Overline>
            <span className={styles.sectionCount}>{c.sampleDocuments.length}</span>
            <span className={styles.sectionPath}>one per <code>$meta.versionType</code></span>
          </div>
          <div className={styles.sampleDocStack}>
            {c.sampleDocuments.map((s, i) => (
              <article
                key={i}
                className={`${styles.sampleDocCard} ${s.accent ? styles[`sampleDocCard_${s.accent}`] : ""}`}
              >
                <header className={styles.sampleDocHeader}>
                  <div className={styles.sampleDocHeaderLeft}>
                    <Badge variant={s.accent || "lightgray"} className={styles.sampleDocBadge}>
                      {(s.kind || "").toUpperCase() || s.label}
                    </Badge>
                    <div className={styles.sampleDocTitleBlock}>
                      <div className={styles.sampleDocTitle}>{s.label}</div>
                      {s.documentId && (
                        <code className={styles.sampleDocId}>{s.documentId}</code>
                      )}
                    </div>
                  </div>
                  <div className={styles.sampleDocHeaderRight}>
                    {s.version && (
                      <span className={styles.sampleDocPill}>
                        <span className={styles.sampleDocPillLabel}>version</span>
                        <code className={styles.sampleDocPillValue}>{s.version}</code>
                      </span>
                    )}
                    {s.scope && (
                      <span className={styles.sampleDocPill}>
                        <span className={styles.sampleDocPillLabel}>scope</span>
                        <span className={styles.sampleDocPillValue}>{s.scope}</span>
                      </span>
                    )}
                  </div>
                </header>
                {s.caption && <p className={styles.sampleDocCaption}>{s.caption}</p>}
                <div className={styles.codeWrap}>
                  <Code language="json" copyable>
                    {JSON.stringify(s.doc, null, 2)}
                  </Code>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : c.sampleDocument ? (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <Overline className={styles.sectionEyebrow}>Sample document</Overline>
          </div>
          <div className={styles.codeWrap}>
            <Code language="json" copyable>
              {JSON.stringify(c.sampleDocument, null, 2)}
            </Code>
          </div>
        </section>
      ) : null}

      {/* DESIGN DECISIONS */}
      {decisions.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <Overline className={styles.sectionEyebrow}>Design decisions</Overline>
            <span className={styles.sectionCount}>{decisions.length}</span>
          </div>
          <div className={styles.decisionGrid}>
            {decisions.map((d, i) => (
              <div key={d.id} className={`${styles.decisionCard} ${styles[`decisionAccent${(i % 4) + 1}`]}`}>
                <div className={styles.decisionHeader}>
                  <span className={styles.decisionTopic}>{d.topic}</span>
                  <span className={styles.decisionId}>#{d.id}</span>
                </div>
                <div className={styles.decisionBody}>
                  <span className={styles.decisionSectionLabel}>DECISION</span>
                  <p className={styles.decisionText}>{d.decision}</p>
                </div>
                {d.rationale && (
                  <div className={styles.decisionWhy}>
                    <span className={styles.decisionSectionLabel}>WHY</span>
                    <p className={styles.decisionRationale}>{d.rationale}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

const CollectionDrawer = ({ open, setOpen }) => {
  const [activeKey, setActiveKey] = useState(COLLECTION_KEYS[0]);

  return (
    <DrawerStackProvider>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Collection Schema"
        displayMode="overlay"
        className={styles.drawer}
      >
        <div className={styles.drawerBody}>
          {/* LEFT RAIL — collection picker */}
          <nav className={styles.rail} aria-label="Collections">
            <div className={styles.railHead}>
              <Overline className={styles.railEyebrow}>{META.database}</Overline>
              <Subtitle className={styles.railTitle}>BIAN {META.bianVersion}</Subtitle>
            </div>
            <ul className={styles.railList}>
              {COLLECTION_KEYS.map((k, i) => {
                const c = COLLECTIONS[k];
                const prev = i > 0 ? COLLECTIONS[COLLECTION_KEYS[i - 1]] : null;
                const showGroup = c.group && (!prev || prev.group !== c.group);
                const active = k === activeKey;
                return (
                  <React.Fragment key={k}>
                    {showGroup && (
                      <li className={styles.railGroup} aria-hidden="true">
                        <Overline className={styles.railGroupLabel}>{c.group}</Overline>
                      </li>
                    )}
                    <li>
                      <button
                        type="button"
                        className={`${styles.railItem} ${active ? styles.railItemActive : ""}`}
                        onClick={() => setActiveKey(k)}
                      >
                        <span className={styles.railItemTop}>
                          <Icon glyph="Folder" size="small" className={styles.railIcon} />
                          <code className={styles.railName}>{c.mongoAlias}</code>
                        </span>
                        <span className={styles.railItemMeta}>
                          {c.fields.length} fields
                          {c.indexes?.length > 0 && <> · {c.indexes.length} indexes</>}
                          {c.immutable && <span className={styles.railImmutable}> · immutable</span>}
                        </span>
                      </button>
                    </li>
                  </React.Fragment>
                );
              })}
            </ul>
          </nav>

          {/* RIGHT — active collection panel (crossfades on switch) */}
          <div className={styles.panelScroll}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={SPRING.default}
              >
                <CollectionPanel collectionKey={activeKey} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Drawer>
    </DrawerStackProvider>
  );
};

export default CollectionDrawer;
