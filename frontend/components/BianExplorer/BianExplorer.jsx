"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Modal from "@leafygreen-ui/modal";
import { H3, Body } from "@leafygreen-ui/typography";
import Badge from "@leafygreen-ui/badge";
import { Tabs, Tab } from "@leafygreen-ui/tabs";
import styles from "./BianExplorer.module.css";
import BianDataModelTab from "./BianDataModelTab";
import BianApiTab from "./BianApiTab";
import { fetchBianMapping, fetchBianApiCatalog } from "@/lib/api/bian/bian_api";

const TITLE_ID = "bian-explorer-title";

const BianExplorer = ({ open, setOpen }) => {
  const [selected, setSelected] = useState(0);

  // Lazy-loaded payloads, cached for the session.
  const [mapping, setMapping] = useState(null);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [mappingError, setMappingError] = useState(null);

  const [catalog, setCatalog] = useState(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState(null);

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
              {meta.mongoDatabase && (
                <Badge variant="blue">DB: {meta.mongoDatabase}</Badge>
              )}
            </div>
          </div>
          <Body className={styles.subtitle}>
            Mongo-canonical field paths mapped to BIAN v14 names
          </Body>
        </header>

        <div className={styles.tabsContainer}>
          <Tabs
            aria-label="BIAN explorer tabs"
            selected={selected}
            setSelected={setSelected}
          >
            <Tab name="BIAN Data Model">
              <div className={styles.tabPanel}>
                <BianDataModelTab
                  mapping={mapping}
                  loading={mappingLoading}
                  error={mappingError}
                  onRetry={loadMapping}
                />
              </div>
            </Tab>
            <Tab name="BIAN API">
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
          </Tabs>
        </div>
      </div>
    </Modal>
  );
};

export default BianExplorer;
