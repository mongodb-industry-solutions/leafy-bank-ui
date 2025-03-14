import { useState } from "react";
import styles from "./AssetCard.module.css";
import Icon from "@leafygreen-ui/icon";
import IconButton from "@leafygreen-ui/icon-button";

export default function AssetCard({ asset }) {
    const [expandedSection, setExpandedSection] = useState(null);

    const handleExpand = (section) => {
        setExpandedSection((prevSection) => (prevSection === section ? null : section));
    };

    return (
        <div className={`${styles.card} ${expandedSection ? styles.expanded : ""}`}>
            <div className={styles.mainContent}>
                <div className={styles.cell}>{asset.name}</div>
                <div className={styles.cell}>{asset.closePrice}</div>
                <div className={styles.cell}>{asset.portfolioAllocation}</div>
                <div className={styles.cell}>
                    <span className={styles.sentiment}>{asset.sentimentScore}</span>
                </div>
                <div className={`${styles.cell} ${styles[asset.vixSensitivity.toLowerCase()]}`}>
                    {asset.vixSensitivity}
                </div>
                <div className={`${styles.cell} ${styles.keep}`}>{asset.gdp}</div>
                <div className={`${styles.cell} ${styles.reduce}`}>{asset.interestRate}</div>
                <div className={`${styles.cell} ${styles.keep}`}>{asset.unemployment}</div>
                <div className={styles.actions}>
                    <IconButton aria-label="Diagram2" className={styles.actionButton} onClick={() => handleExpand("candleStick")}>
                        <Icon glyph="Diagram2" />
                    </IconButton>

                    <IconButton aria-label="CurlyBraces" className={styles.actionButton} onClick={() => handleExpand("docModel")}>
                        <Icon glyph="CurlyBraces" />
                    </IconButton>

                    <IconButton aria-label="Sparkle" className={styles.actionButton} onClick={() => handleExpand("insights")}>
                        <Icon glyph="Sparkle" />
                    </IconButton>
                </div>
            </div>

            {expandedSection && (
                <div className={styles.expandedSection}>
                    <h3>{expandedSection === "candleStick" ? "Candle Stick" : expandedSection === "docModel" ? "Doc Model" : "Insights"}</h3>
                </div>
            )}
        </div>
    );
}
