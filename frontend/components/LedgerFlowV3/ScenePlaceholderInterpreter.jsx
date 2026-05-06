"use client";

import React from "react";
import { H3, Body, Overline } from "@leafygreen-ui/typography";
import DocumentSnippet from "../LedgerFlow/DocumentSnippet";
import styles from "../LedgerFlow/StageInterpreter.module.css";
import localStyles from "./ScenePlaceholderInterpreter.module.css";

// Interpreter for non-POSTING scenes. Renders narration + optional callout + optional doc.
export default function ScenePlaceholderInterpreter({ content, onOpenDrawer }) {
  if (!content) return null;
  const { overline, title, body, callout, doc } = content;
  return (
    <div className={styles.interpreter}>
      <div className={styles.left}>
        <div className={styles.narrationStack}>
          <Overline className={styles.overline}>{overline}</Overline>
          <H3 className={styles.title}>{title}</H3>
          <Body className={styles.body}>{body}</Body>
        </div>
        {callout && (
          <div className={`${localStyles.callout} ${callout.variant === "important" ? localStyles.calloutImportant : localStyles.calloutNote}`}>
            <span className={localStyles.calloutTitle}>{callout.title}</span>
            <span className={localStyles.calloutBody}>{callout.body}</span>
          </div>
        )}
      </div>
      <div className={styles.right}>
        {doc ? (
          <div className={styles.docMount}>
            <DocumentSnippet
              payload={doc.payload}
              collectionKey={doc.collectionKey}
              label={doc.label}
            />
          </div>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
