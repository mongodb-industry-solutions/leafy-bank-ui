"use client";

import React from "react";
import { InfoSprinkle } from "@leafygreen-ui/info-sprinkle";
import { Body } from "@leafygreen-ui/typography";
import { aliasMap } from "./ledgerSchema";
import styles from "./DocumentSnippet.module.css";

// Renders a JSON-like document where every field name is wrapped with an
// InfoSprinkle that reveals the BIAN alias and field-level note on hover/focus.
//
// Indentation, formatting, and BSON sentinel rendering are all done locally
// (we want field names to be interactive — LG <Code> would syntax-highlight
// but lose hover targets, so we hand-render with monospace styling).

const INDENT = "  ";

function isBson(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const keys = Object.keys(value);
  if (keys.length === 1 && keys[0] === "$numberDecimal") return { kind: "decimal", value: value.$numberDecimal };
  if (keys.length === 1 && keys[0] === "$date") return { kind: "date", value: value.$date };
  return null;
}

function FieldName({ name, alias }) {
  if (!alias) {
    return <span className={styles.fieldName}>{name}</span>;
  }
  const tooltipBody = (
    <div className={styles.tipBody}>
      {alias.bian && (
        <Body weight="medium" className={styles.tipBian}>BIAN: {alias.bian}</Body>
      )}
      {alias.type && (
        <Body baseFontSize={13} className={styles.tipMeta}>
          type: {alias.type}{alias.required ? " · required" : ""}
        </Body>
      )}
      {alias.note && <Body baseFontSize={13} className={styles.tipNote}>{alias.note}</Body>}
    </div>
  );
  return (
    <span className={styles.fieldNameWrap}>
      <span className={styles.fieldNameLinked}>{name}</span>
      <InfoSprinkle align="top" justify="middle" triggerProps={{ className: styles.sprinkleTrigger }}>
        {tooltipBody}
      </InfoSprinkle>
    </span>
  );
}

function renderValue(value, depth, aliases) {
  if (value === null) return <span className={styles.valNull}>null</span>;
  if (value === undefined) return <span className={styles.valNull}>undefined</span>;
  if (typeof value === "string") return <span className={styles.valStr}>{`"${value}"`}</span>;
  if (typeof value === "number") return <span className={styles.valNum}>{String(value)}</span>;
  if (typeof value === "boolean") return <span className={styles.valBool}>{String(value)}</span>;

  const bson = isBson(value);
  if (bson?.kind === "decimal") {
    return (
      <span className={styles.valBson}>
        {"{ "}<span className={styles.bsonKey}>$numberDecimal</span>: <span className={styles.valStr}>{`"${bson.value}"`}</span>{" }"}
      </span>
    );
  }
  if (bson?.kind === "date") {
    return (
      <span className={styles.valBson}>
        {"{ "}<span className={styles.bsonKey}>$date</span>: <span className={styles.valStr}>{`"${bson.value}"`}</span>{" }"}
      </span>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className={styles.bracket}>[]</span>;
    return (
      <>
        <span className={styles.bracket}>[</span>
        {value.map((item, i) => (
          <div key={i} className={styles.indentLine} style={{ paddingLeft: `${(depth + 1) * 12}px` }}>
            {renderValue(item, depth + 1, aliases)}
            {i < value.length - 1 ? <span className={styles.punct}>,</span> : null}
          </div>
        ))}
        <div style={{ paddingLeft: `${depth * 12}px` }}>
          <span className={styles.bracket}>]</span>
        </div>
      </>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) return <span className={styles.bracket}>{"{}"}</span>;
    return (
      <>
        <span className={styles.bracket}>{"{"}</span>
        {entries.map(([k, v], i) => (
          <div key={k} className={styles.indentLine} style={{ paddingLeft: `${(depth + 1) * 12}px` }}>
            <FieldName name={k} alias={aliases[k]} />
            <span className={styles.punct}>: </span>
            {renderValue(v, depth + 1, aliases)}
            {i < entries.length - 1 ? <span className={styles.punct}>,</span> : null}
          </div>
        ))}
        <div style={{ paddingLeft: `${depth * 12}px` }}>
          <span className={styles.bracket}>{"}"}</span>
        </div>
      </>
    );
  }

  return <span>{String(value)}</span>;
}

const DocumentSnippet = ({ payload, collectionKey, label }) => {
  if (!payload) {
    return (
      <div className={styles.empty}>
        <Body baseFontSize={13} className={styles.emptyText}>No active document for this stage.</Body>
      </div>
    );
  }
  const aliases = collectionKey ? aliasMap(collectionKey) : {};

  return (
    <div className={styles.snippet}>
      {label && (
        <div className={styles.label}>
          <span className={styles.labelText}>{label}</span>
        </div>
      )}
      <pre className={styles.pre}>
        {renderValue(payload, 0, aliases)}
      </pre>
    </div>
  );
};

export default DocumentSnippet;
