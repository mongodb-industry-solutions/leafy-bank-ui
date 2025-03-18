"use client";

import Header from "@/components/Header/Header";
import Assets from "@/components/Assets/Assets";
import styles from "./AssetPortfolio.module.css";
import Card from "@leafygreen-ui/card";
import { H2, Subtitle, Body } from "@leafygreen-ui/typography";

export default function AssetPortfolio() {
    return (
        <div className={styles.container}>
            <Header />

            <div className={styles.gridContainer}>
                <Card className={styles.roiCard} title="ROI">
                    Return of investment bar chart

                </Card>

                <div className={styles.rightColumn}>
                    <Card className={styles.assetCard} title="Asset Distribution">

                        <div className={styles.iframeContainer}>
                            <iframe
                                src="https://charts.mongodb.com/charts-jeffn-zsdtj/embed/charts?id=cd8d523c-b90a-4a39-a447-2e53cd392924&maxDataAge=3600&theme=light&autoRefresh=true"
                                className={styles.responsiveIframe}
                            ></iframe>
                        </div>

                    </Card>

                    <Card className={styles.marketCard} title="Market Event Calendar">
                        Market event calendar
                    </Card>
                </div>
            </div>

            <div className={styles.assetsSection}>

                <Assets></Assets>
            </div>
        </div>
    );
}
