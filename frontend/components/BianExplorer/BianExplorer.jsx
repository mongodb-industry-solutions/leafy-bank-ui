"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Modal from "@leafygreen-ui/modal";
import { H3, Body } from "@leafygreen-ui/typography";
import Badge from "@leafygreen-ui/badge";
import { Tabs, Tab } from "@leafygreen-ui/tabs";
import { ParagraphSkeleton } from "@leafygreen-ui/skeleton-loader";
import styles from "./BianExplorer.module.css";
import BianDataModelTab from "./BianDataModelTab";
import BianApiTab from "./BianApiTab";
import { fetchBianMapping, fetchBianApiCatalog } from "@/lib/api/bian/bian_api";

// Skeleton shown while the consolidated tab's chunk loads. ParagraphSkeleton
// is the LG-canonical idle state per the MongoDB demo design system.
function ConsolidatedSkeleton() {
  return (
    <div className={styles.consSkeleton}>
      <ParagraphSkeleton />
      <ParagraphSkeleton />
    </div>
  );
}

// The consolidated tab pulls in a curated data module (~30 KB) that's only
// rendered on the third tab — split it out of the BIAN Explorer's main chunk.
const BianConsolidatedTab = dynamic(() => import("./BianConsolidatedTab"), {
  ssr: false,
  loading: ConsolidatedSkeleton,
});

const TITLE_ID = "bian-explorer-title";
const COMPLIANCE_DOMAINS = ["customers", "accounts", "payments", "transactions"];

function ComplianceStrip({ mapping }) {
  if (!mapping) return null;
  const totalFields = COMPLIANCE_DOMAINS.reduce(
    (acc, d) => acc + (mapping[d] ? Object.keys(mapping[d]).length : 0),
    0
  );
  const domainCount = COMPLIANCE_DOMAINS.filter((d) => !!mapping[d]).length;
  return (
    <div className={styles.complianceStrip} aria-label="BIAN compliance summary">
      <div className={styles.complianceStat}>
        <span className={styles.complianceValue}>{totalFields}</span>
        <span className={styles.complianceLabel}>Fields Mapped</span>
      </div>
      <div className={styles.complianceDivider} aria-hidden="true" />
      <div className={styles.complianceStat}>
        <span className={styles.complianceValue}>
          {domainCount}
          <span className={styles.complianceDenom}>/4</span>
        </span>
        <span className={styles.complianceLabel}>Service Domains</span>
      </div>
      <div className={styles.complianceDivider} aria-hidden="true" />
      <div className={`${styles.complianceStat} ${styles.complianceAccent}`}>
        <span className={styles.complianceValue}>BIAN v14</span>
        <span className={styles.complianceLabel}>Standard</span>
      </div>
    </div>
  );
}

const BianExplorer = ({ open, setOpen }) => {
  const [selected, setSelected] = useState(0);

  // Lazy-loaded payloads, cached for the session.
  const [mapping, setMapping] = useState(null);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [mappingError, setMappingError] = useState(null);

  const [catalog, setCatalog] = useState(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState(null);

  // Lock body scroll while the explorer is open so wheel events don't
  // reach the background page.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Mounted-flag ref so async resolutions after unmount don't write state.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadMapping = useCallback(() => {
    setMappingError(null);
    setMappingLoading(true);
    fetchBianMapping()
      .then((data) => {
        if (mountedRef.current) setMapping(data?.mapping || null);
      })
      .catch((err) => {
        if (mountedRef.current) {
          setMappingError(err?.message || "Failed to load BIAN mapping");
        }
      })
      .finally(() => {
        if (mountedRef.current) setMappingLoading(false);
      });
  }, []);

  const loadCatalog = useCallback(() => {
    setCatalogError(null);
    setCatalogLoading(true);
    fetchBianApiCatalog()
      .then((data) => {
        if (mountedRef.current) setCatalog(data?.catalog || null);
      })
      .catch((err) => {
        if (mountedRef.current) {
          setCatalogError(err?.message || "Failed to load BIAN API catalog");
        }
      })
      .finally(() => {
        if (mountedRef.current) setCatalogLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!open) return;
    // First-open lazy fetch. Successful payloads are cached for the session;
    // errors are NOT cached — the user can retry from the error banner. The
    // loading guards prevent StrictMode dev-only double-invoke from firing
    // two concurrent requests.
    if (!mapping && !mappingLoading && !mappingError) loadMapping();
    if (!catalog && !catalogLoading && !catalogError) loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const meta = mapping?.$meta || {};

  return (
    <Modal
      open={open}
      setOpen={setOpen}
      className={styles.modal}
      contentClassName={styles.modalDialog}
      aria-labelledby={TITLE_ID}
    >
      <div className={styles.modalContent}>
        <header className={styles.headerStrip}>
          <div className={styles.headerTitleRow}>
            <H3 id={TITLE_ID}>BIAN v14 Explorer</H3>
            <div className={styles.metaBadges}>
              {meta.bianVersion && (
                <Badge variant="green">BIAN {meta.bianVersion}</Badge>
              )}
            </div>
          </div>
          <Body className={styles.subtitle}>
            Mongo-canonical field paths mapped to BIAN v14 names
          </Body>
        </header>

        <ComplianceStrip mapping={mapping} />

        <div className={styles.tabsContainer}>
          <Tabs
            aria-label="BIAN explorer tabs"
            selected={selected}
            setSelected={setSelected}
          >
            <Tab name="Leafy Bank BIAN Data Model">
              <div className={styles.tabPanel}>
                <BianDataModelTab
                  mapping={mapping}
                  loading={mappingLoading}
                  error={mappingError}
                  onRetry={loadMapping}
                />
              </div>
            </Tab>
            <Tab name="Leafy Bank BIAN API">
              <div className={styles.tabPanel}>
                <BianApiTab
                  // Reset internal state (service filter, expanded op) if the
                  // catalog is replaced with a different version payload.
                  key={catalog?.version ?? "none"}
                  catalog={catalog}
                  loading={catalogLoading}
                  error={catalogError}
                  onRetry={loadCatalog}
                />
              </div>
            </Tab>
            <Tab name="Consolidated BIAN Data Model">
              <div className={styles.tabPanel}>
                <BianConsolidatedTab liveMapping={mapping} />
              </div>
            </Tab>
          </Tabs>
        </div>
      </div>
    </Modal>
  );
};

export default BianExplorer;
