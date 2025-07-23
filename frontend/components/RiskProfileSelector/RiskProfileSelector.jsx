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
  setActiveRiskProfile
} from "@/lib/api/capital_markets/agents/capitalmarkets_agents_api";
import styles from "./RiskProfileSelector.module.css";

export default function RiskProfileSelector() {
  const [riskProfiles, setRiskProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);


  useEffect(() => {
    async function fetchProfiles() {
      try {
        const profiles = await listRiskProfiles();
        const active = await getActiveRiskProfile();
        setRiskProfiles(profiles);
        setActiveProfile(active.risk_id);
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
    return <div className={styles.selectorLabel}> <Body>Loading risk profiles...</Body></div>;
  }

  return (

    <div className={styles.comboBoxWrapper}>
      <Body className={styles.selectorLabel}>Current Risk Profile:</Body>
      <div className={styles.badgeContainer}>
        <Badge variant="lightgray">{activeProfile}</Badge>
        <IconButton
          className={styles.editButton}
          aria-label="Edit Risk Profile"
          onClick={() => setModalOpen(true)}
        >
          <Icon glyph="Edit" />
        </IconButton>
      </div>

      <Modal
        open={modalOpen}
        setOpen={setModalOpen}
        className={styles.riskModal}
      >
        <div className={styles.modalContent}>
          <Subtitle>Select a New Risk Profile</Subtitle>
          <Body className={styles.tooltipText}>
            Changes to your risk profile will apply starting the next day, when your portfolio is reanalyzed.
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