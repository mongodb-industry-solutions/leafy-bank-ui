"use client";

import React from "react";
import { H3, Body, Overline } from "@leafygreen-ui/typography";
import Callout from "@leafygreen-ui/callout";
import { AnimatePresence, motion, LayoutGroup } from "motion/react";
import DocumentSnippet from "./DocumentSnippet";
import { narrationFor, STAGE_LIST, stageLabel } from "./stageNarration";
import { SPRING, STAGE_TRANSITION } from "./motionConfig";
import styles from "./StageInterpreter.module.css";

// LG-flavoured custom pipeline rail — chevron chips with a *shared* active
// pill that physically slides between stages via layoutId.
function StageRail({ stageIndex }) {
  return (
    <LayoutGroup id="lf-stage-rail">
      <ol className={styles.rail} aria-label="Pipeline stages">
        {STAGE_LIST.map((s, i) => {
          const isCurrent = i === stageIndex;
          const isReached = i < stageIndex;
          const cls = [
            styles.chip,
            isCurrent ? styles.chipCurrent : "",
            isReached ? styles.chipReached : "",
            !isCurrent && !isReached ? styles.chipPending : "",
          ].filter(Boolean).join(" ");
          return (
            <li key={s} className={cls}>
              {isCurrent && (
                <motion.span
                  layoutId="lf-active-stage-pill"
                  className={styles.activePill}
                  transition={SPRING.layout}
                  aria-hidden="true"
                />
              )}
              <span className={styles.chipIndex}>{i + 1}</span>
              <span className={styles.chipLabel}>{stageLabel(s)}</span>
            </li>
          );
        })}
      </ol>
    </LayoutGroup>
  );
}

const StageInterpreter = ({ state, onOpenDrawer }) => {
  const content = narrationFor(state);
  const stageIndex = state.stageIndex ?? -1;

  const stageKey = state.currentStage || "IDLE";

  return (
    <div className={styles.interpreter}>
      <div className={styles.left}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`narr-${stageKey}`}
            initial={STAGE_TRANSITION.initial}
            animate={STAGE_TRANSITION.animate}
            exit={STAGE_TRANSITION.exit}
            transition={STAGE_TRANSITION.transition}
            className={styles.narrationStack}
          >
            <Overline className={styles.overline}>{content.overline}</Overline>
            <H3 className={styles.title}>{content.title}</H3>
            <Body className={styles.body}>{content.body}</Body>
            {content.callout && (
              <div className={styles.calloutWrap}>
                <Callout variant={content.callout.variant} title={content.callout.title}>
                  {content.callout.body}
                  {onOpenDrawer && (
                    <>
                      {" "}
                      <button type="button" className={styles.calloutLink} onClick={onOpenDrawer}>
                        open Collections ▸
                      </button>
                    </>
                  )}
                </Callout>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className={styles.pipelineWrap}>
          <StageRail stageIndex={stageIndex} />
        </div>
      </div>

      <div className={styles.right}>
        <Overline className={styles.overline}>Active Document</Overline>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`doc-${stageKey}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={SPRING.default}
            className={styles.docMount}
          >
            <DocumentSnippet
              payload={content.doc?.payload}
              collectionKey={content.doc?.collectionKey}
              label={content.doc?.label}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StageInterpreter;
