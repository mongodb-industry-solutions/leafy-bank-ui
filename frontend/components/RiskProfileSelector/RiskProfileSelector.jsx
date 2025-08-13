'use client';

import { useState, useEffect } from "react";
import { Combobox, ComboboxOption } from "@leafygreen-ui/combobox";
import Tooltip from "@leafygreen-ui/tooltip";
import IconButton from "@leafygreen-ui/icon-button";
import Icon from "@leafygreen-ui/icon";
import Badge from "@leafygreen-ui/badge";
import Modal from "@leafygreen-ui/modal";
import { Body, Subtitle } from "@leafygreen-ui/typography";
import {
  listRiskProfiles,
  getActiveRiskProfile,
  setActiveRiskProfile,
  fetchConsolidatedReportRiskProfile
} from "@/lib/api/capital_markets/agents/capitalmarkets_agents_api";
import styles from "./RiskProfileSelector.module.css";

export default function RiskProfileSelector() {
  const [riskProfiles, setRiskProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState("");
  const [currentReportProfile, setCurrentReportProfile] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);


  useEffect(() => {
    async function fetchProfiles() {
      try {
        const [profiles, active, consolidated] = await Promise.all([
          listRiskProfiles(),
          getActiveRiskProfile(),
          fetchConsolidatedReportRiskProfile()
        ]);
        setRiskProfiles(profiles);
        setActiveProfile(active.risk_id);
        setCurrentReportProfile(consolidated.result);
      } catch (error) {
        console.error("Error fetching risk profiles", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfiles();
  }, []);

  const handleChange = async (val) => {
    setActiveProfile(val);
    try {
      await setActiveRiskProfile(val);
    } catch (error) {
      console.error("Error setting active risk profile", error);
    }
  };

  if (loading) {
    return <div className={styles.loadingContainer}><Body className={styles.profileLabel}>Loading risk profiles...</Body></div>;
  }

  return (

    <div className={styles.comboBoxWrapper}>
      <div className={styles.riskProfileHeader}>
        {/*<Icon glyph="Settings" size="small" className={styles.headerIcon} />*/}
        <Body className={styles.headerLabel}>Risk Profile</Body>
      </div>
      
      <div className={styles.profilesContainer}>
        <div className={styles.profileItem}>
          <Body className={styles.profileLabel}>Current:</Body>
          <div className={styles.badgeWrapper}>
            <Badge variant="darkgray" size="small">{currentReportProfile}</Badge>
          </div>
        </div>
        
        <div className={styles.divider} />
        
        <Tooltip
          align="bottom"
          justify="middle"
          trigger={
            <div className={`${styles.profileItem} ${styles.editableItem}`} onClick={() => setModalOpen(true)}>
              <Body className={styles.profileLabel}>Next Day:</Body>
              <div className={styles.editableProfile}>
                <div className={styles.badgeWrapper}>
                  <Badge variant="lightgray" size="small">{activeProfile}</Badge>
                </div>
                <Icon glyph="Edit" size="small" className={styles.editIcon} />
              </div>
            </div>
          }
        >
          Click to change risk profile for next day
        </Tooltip>
      </div>

      <Modal
        open={modalOpen}
        setOpen={setModalOpen}
        className={styles.riskModal}
      >
        <div className={styles.modalContent}>
          <Subtitle>Select Risk Profile for Next Day</Subtitle>
          <Body className={styles.tooltipText}>
            Changes to your risk profile will apply starting the next day, when your portfolio is reanalyzed. The current risk profile in reports will remain unchanged until tomorrow.
          </Body>

          <Combobox
            multiselect={false}
            value={activeProfile}
            onChange={handleChange}
            clearable={false}
          >
            {riskProfiles.map(({ risk_id, short_description }) => (
              <ComboboxOption
                key={risk_id}
                value={risk_id}
                description={short_description}
              />
            ))}
          </Combobox>
        </div>
      </Modal>
    </div>

  );
}