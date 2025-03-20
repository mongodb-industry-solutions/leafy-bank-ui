import { useState } from "react";
import styles from "./AssetCard.module.css";
import Icon from "@leafygreen-ui/icon";
import IconButton from "@leafygreen-ui/icon-button";
import Tooltip from "@leafygreen-ui/tooltip";

export default function AssetCard({ asset }) {
    const [expandedSection, setExpandedSection] = useState(null);

    const handleExpand = (section) => {
        setExpandedSection((prevSection) => (prevSection === section ? null : section));
    };

    return (
        <div className={`${styles.card} ${expandedSection ? styles.expanded : ""}`}>
            <div className={styles.mainContent}>
                <div className={styles.cell}>{asset.symbol}</div>
                <div className={styles.cell}>{asset.close ? asset.close.toFixed(2) : "No Price"}</div>
                <div className={styles.cell}>15%</div>
                <div className={styles.cell}>
                    <span className={styles.sentiment}>0.75</span>
                </div>
                <div className={`${styles.cell} ${styles.reduce}`}>
                    Neutral
                </div>
                <div className={`${styles.cell} ${styles.keep}`}>Keep</div>
                <div className={`${styles.cell} ${styles.reduce}`}>Reduce</div>
                <div className={`${styles.cell} ${styles.keep}`}>Keep</div>

                <div className={styles.actions}>
                    <Tooltip align="top" justify="middle" trigger={
                        <IconButton aria-label="Candle Stick" className={styles.actionButton} onClick={() => handleExpand("candleStick")}>
                            <Icon glyph="Diagram2" />
                        </IconButton>
                    }>
                        Candle Stick Chart
                    </Tooltip>

                    <Tooltip align="top" justify="middle" trigger={
                        <IconButton aria-label="Doc Model" className={styles.actionButton} onClick={() => handleExpand("docModel")}>
                            <Icon glyph="CurlyBraces" />
                        </IconButton>
                    }>
                        Doc Model
                    </Tooltip>

                    <Tooltip align="top" justify="middle" trigger={
                        <IconButton aria-label="Insights" className={styles.actionButton} onClick={() => handleExpand("insights")}>
                            <Icon glyph="Sparkle" />
                        </IconButton>
                    }>
                        Insights
                    </Tooltip>
                </div>
            </div>

            {expandedSection && (
                <div className={styles.expandedSection}>
                    <h3>
                        {expandedSection === "candleStick" ? ""
                            : expandedSection === "docModel" ? "Doc Model"
                                : "Insights"}
                    </h3>

                    {expandedSection === "candleStick" && (
                        <div className={styles.iframeContainer}>
                            <iframe
                                src="https://charts.mongodb.com/charts-jeffn-zsdtj/embed/charts?id=11452cb5-c307-4e8d-b01e-6f380bd5685d&maxDataAge=3600&theme=light&autoRefresh=true"
                                className={styles.responsiveIframe}
                            ></iframe>
                        </div>
                    )}

                    {expandedSection === "docModel" && (
                        <p>Here you can explore the document model structure for {asset.symbol}.</p>
                    )}

                    {expandedSection === "insights" && (
                        <ul>
                            <li>Insight 1</li>
                            <li>Insight 2</li>
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
