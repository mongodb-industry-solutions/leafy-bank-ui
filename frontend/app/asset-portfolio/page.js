"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header/Header";
import Assets from "@/components/Assets/Assets";
import styles from "./AssetPortfolio.module.css";
import Card from "@leafygreen-ui/card";
import { Subtitle, Body } from "@leafygreen-ui/typography";
import Badge from "@leafygreen-ui/badge";


export default function AssetPortfolio() {
    const [marketEvents, setMarketEvents] = useState([]);

    useEffect(() => {
        async function fetchMarketData() {
            try {
                const response = await fetch("/data/market-events.json");
                const data = await response.json();
                setMarketEvents(data);
            } catch (error) {
                console.error("Error fetching market events:", error);
            }
        }
        fetchMarketData();
    }, []);

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

                    <Card className={styles.marketCard}>
                        <Subtitle className={styles.cardSubtitle}>Market Events</Subtitle>
                        <div className={styles.headerRow}>
                            <span>INDICATOR</span>
                            <span>FREQUENCY</span>
                            <span>LAST RELEASE DATE</span>
                        </div>

                        <div className={styles.eventContainer}>
                            {marketEvents.map((event) => (
                                <div key={event.series_id} className={styles.eventCard}>
                                    <Body>{event.title} (US)</Body>
                                    <Badge>{event.frequency}</Badge>
                                    <Body>{new Date(event.date.$date).toLocaleDateString()}</Body>
                                </div>
                            ))}
                        </div>
                    </Card>

                </div>
            </div>

            <div className={styles.assetsSection}>
                <Assets />
            </div>
        </div>
    );
}
