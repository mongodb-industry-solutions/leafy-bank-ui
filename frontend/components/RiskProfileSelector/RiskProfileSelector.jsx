'use client';

import { useState, useEffect } from "react";
import { Combobox, ComboboxOption } from "@leafygreen-ui/combobox";
import Tooltip from "@leafygreen-ui/tooltip";
import IconButton from "@leafygreen-ui/icon-button";
import Icon from "@leafygreen-ui/icon";
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
    return <div>Loading risk profiles...</div>;
  }

return (
    <div className={styles.comboBoxWrapper}>
      <Tooltip
        trigger={
          <IconButton
            className={styles.riskTooltip}
            aria-label="Risk profile info"
          >
            <Icon glyph="InfoWithCircle" />
          </IconButton>
        }
      >
        Changes to your risk profile will apply starting the next day, when your portfolio is reanalyzed.
      </Tooltip>
      <label className={styles.selectorLabel}>Selected Risk Profile:</label>
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
  );
}