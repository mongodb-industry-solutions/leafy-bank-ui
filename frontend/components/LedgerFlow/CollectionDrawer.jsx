"use client";

import React, { useState } from "react";
import { Drawer, DrawerStackProvider } from "@leafygreen-ui/drawer";
import { H3, Body, Subtitle, Overline, InlineCode } from "@leafygreen-ui/typography";
import Badge from "@leafygreen-ui/badge";
import Code from "@leafygreen-ui/code";
import ExpandableCard from "@leafygreen-ui/expandable-card";
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

function FieldCard({ field }) {
  return (
    <motion.div
      className={`${styles.fieldCard} ${field.required ? styles.fieldRequired : ""}`}
      initial={{ opacity: 0, x: 14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={SPRING.default}
    >
      <div className={styles.fieldHead}>
        <code className={styles.fieldName}>{field.name}</code>
        <span className={`${styles.typePill} ${styles[`type_${field.type}`] || ""}`}>
          {field.type}
        </span>
        {field.required ? (
          <span className={styles.requiredFlag} title="Required">
            <Icon glyph="Checkmark" size="small" />
          </span>
        ) : (
          <span className={styles.optionalFlag} title="Optional">·</span>
        )}
      </div>
      {field.bian && (
        <div className={styles.bianRow}>
          <span className={styles.bianLabel}>BIAN</span>
          <code className={styles.bianValue}>{field.bian}</code>
        </div>
      )}
      {field.note && <Body className={styles.fieldNote}>{field.note}</Body>}
    </motion.div>
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
          <Overline className={styles.heroEyebrow}>{META.database}</Overline>
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
          <StatPill label="indexes" value={c.indexes.length} accent="purple" />
          {c.entryFields && (
            <StatPill label="entry sub-fields" value={c.entryFields.length} accent="yellow" />
          )}
        </div>
      </header>

      {/* FIELDS — visual card grid */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <Overline className={styles.sectionEyebrow}>Fields</Overline>
          <span className={styles.sectionCount}>{c.fields.length}</span>
        </div>
        <div className={styles.fieldGrid}>
          {c.fields.map((f) => (
            <FieldCard key={f.name} field={f} />
          ))}
        </div>
      </section>

      {c.entryFields && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <Overline className={styles.sectionEyebrow}>Entry sub-fields</Overline>
            <code className={styles.sectionPath}>entries[].*</code>
            <span className={styles.sectionCount}>{c.entryFields.length}</span>
          </div>
          <div className={styles.fieldGrid}>
            {c.entryFields.map((f) => (
              <FieldCard key={f.name} field={f} />
            ))}
          </div>
        </section>
      )}

      {/* INDEXES — visual cards */}
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

      {/* SAMPLE DOCUMENT */}
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

      {/* DESIGN DECISIONS */}
      {decisions.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <Overline className={styles.sectionEyebrow}>Design decisions</Overline>
            <span className={styles.sectionCount}>{decisions.length}</span>
          </div>
          <div className={styles.decisionGrid}>
            {decisions.map((d) => (
              <ExpandableCard
                key={d.id}
                title={`#${d.id} · ${d.topic}`}
                description={d.decision}
                defaultOpen={false}
                className={styles.decisionCard}
              >
                <Body>{d.rationale}</Body>
              </ExpandableCard>
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
              {COLLECTION_KEYS.map((k) => {
                const c = COLLECTIONS[k];
                const active = k === activeKey;
                return (
                  <li key={k}>
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
                        {c.fields.length} fields · {c.indexes.length} indexes
                        {c.immutable && <span className={styles.railImmutable}> · immutable</span>}
                      </span>
                    </button>
                  </li>
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
