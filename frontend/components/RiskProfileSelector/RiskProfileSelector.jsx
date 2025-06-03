
'use client';

import { Combobox, ComboboxOption } from "@leafygreen-ui/combobox";
import Tooltip from "@leafygreen-ui/tooltip";
import IconButton from "@leafygreen-ui/icon-button";
import Icon from "@leafygreen-ui/icon";

import styles from "./RiskProfileSelector.module.css"; // You'll create this file next

const riskProfiles = [
  {
    risk_id: "HIGH_RISK",
    short_description: "Aggressive growth, high volatility, high return",
    active: false,
  },
  {
    risk_id: "BALANCE",
    short_description: "Mix of growth and stability, moderate risk",
    active: true,
  },
  {
    risk_id: "CONSERVATIVE",
    short_description: "Low volatility, stable returns, minimal risk",
    active: false,
  },
  {
    risk_id: "LOW_RISK",
    short_description: "Capital preservation, very low exposure",
    active: false,
  },
];

export default function RiskProfileSelector() {

  //const defaultValue = riskProfiles.find(p => p.active)?.risk_id;

  return (
    <div className={styles.comboBoxWrapper}>
      <Tooltip
        trigger={
          <IconButton className={styles.riskTooltip}>
            <Icon glyph="InfoWithCircle" />
          </IconButton>
        }
      >
        Changes to your risk profile will apply starting the next day, when your portfolio is reanalyzed.
      </Tooltip>

      <Combobox
        multiselect={false}
        placeholder="Select a risk profile"
       // value={defaultValue}
        onChange={(val) => console.log("Selected risk profile:", val)}
        onClear={() => console.log("clear")}
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