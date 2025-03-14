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
                        Asset distribution pie chart
                        {/**  <iframe  width="640" height="300" src="https://charts.mongodb.com/charts-jeffn-zsdtj/embed/charts?id=648b19ea-4651-401c-817f-d66c5284a0d2&maxDataAge=3600&theme=light&autoRefresh=true"></iframe>
                   */}
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
