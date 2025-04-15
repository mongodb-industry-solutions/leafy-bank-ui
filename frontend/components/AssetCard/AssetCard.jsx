import { useState, useEffect } from "react";
import styles from "./AssetCard.module.css";
import Icon from "@leafygreen-ui/icon";
import IconButton from "@leafygreen-ui/icon-button";
import Tooltip from "@leafygreen-ui/tooltip";
import { Subtitle, Body, H3, Link } from "@leafygreen-ui/typography";
import Code from "@leafygreen-ui/code";
import Badge from "@leafygreen-ui/badge";
import {
    SegmentedControl,
    SegmentedControlOption
} from "@leafygreen-ui/segmented-control";

import { fetchPortfolioAllocation } from "@/lib/api/capital_markets/agents/capitalmarkets_agents_api";

export default function AssetCard({ asset }) {
    const [expandedSection, setExpandedSection] = useState(null);
    const [news, setNews] = useState([]);
    const [selectedTimeframe, setSelectedTimeframe] = useState("day");

    const chartMap = {
        SPY: "chart-id-apple",
        VIX: "chart-id-microsoft",
        TSLA: "chart-id-tesla",
    };

    useEffect(() => {
        fetch("/data/news.json")
            .then((res) => res.json())
            .then((data) => setNews(data))
            .catch((err) => console.error("Error loading news:", err));
    }, []);

    const handleExpand = (section) => {
        setExpandedSection((prevSection) => (prevSection === section ? null : section));
    };

    // Filter news based on asset.symbol
    const filteredNews = news.filter((item) => item.ticker === asset.symbol);

    return (
        <div className={`${styles.card} ${expandedSection ? styles.expanded : ""}`}>
            <div className={styles.mainContent}>
                <div className={styles.cell}>{asset.symbol}</div>
                <div className={styles.cell}>{asset.close ? asset.close.toFixed(2) : "No Price"}</div>
                <div className={styles.cell}>
                    {asset.allocation ? asset.allocation.percentage : "N/A"}
                </div>
                <div className={styles.cell}>
                    <span className={styles.sentiment}>0.75</span>
                </div>

                <Badge className={`${styles.cell} ${styles.badge}`} variant="yellow">NEUTRAL</Badge>
                <Badge className={`${styles.cell} ${styles.badge}`} variant="green">KEEP</Badge>
                <Badge className={`${styles.cell} ${styles.badge}`} variant="red">REDUCE</Badge>
                <Badge className={`${styles.cell} ${styles.badge}`} variant="green">KEEP</Badge>

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
                        <IconButton aria-label="News" className={styles.actionButton} onClick={() => handleExpand("news")}>
                            <Icon glyph="University" />
                        </IconButton>
                    }>
                        News Headlines
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
                    <H3>
                        {expandedSection === "candleStick" ? ""
                            : expandedSection === "docModel" ? "Document Model"
                                : expandedSection === "insights" ? "Insights"
                                    : "News Headlines"}
                    </H3>

                    {expandedSection === "candleStick" && (
                        <div className={styles.iframeContainer}>
                            <div className={styles.segmentedControlWrapper}>
                                <SegmentedControl
                                    followFocus={true}
                                    defaultValue="day"
                                    onChange={(value) => setSelectedTimeframe(value)}
                                    className={styles.segmentedControl}
                                >
                                    <SegmentedControlOption value="day">Last Day</SegmentedControlOption>
                                    <SegmentedControlOption value="week">Last 7 Days</SegmentedControlOption>
                                    <SegmentedControlOption value="month">Last 6 Months</SegmentedControlOption>
                                </SegmentedControl>
                            </div>

                            {selectedTimeframe === "day" && (
                                <iframe
                                    src="https://charts.mongodb.com/charts-jeffn-zsdtj/embed/charts?id=dc497e8e-a010-49b4-9fcf-8dcbdcec7d8f&maxDataAge=3600&theme=light&autoRefresh=true"
                                    className={styles.responsiveIframe}
                                ></iframe>
                            )}

                            {selectedTimeframe === "week" && (

                                <iframe
                                    src="https://charts.mongodb.com/charts-jeffn-zsdtj/embed/charts?id=11452cb5-c307-4e8d-b01e-6f380bd5685d&maxDataAge=3600&theme=light&autoRefresh=true"
                                    className={styles.responsiveIframe}
                                ></iframe>

                            )}

                            {selectedTimeframe === "month" && (
                                <iframe src="https://charts.mongodb.com/charts-jeffn-zsdtj/embed/charts?id=b22df6e9-b776-4220-b21c-83180a321f4d&maxDataAge=3600&theme=light&autoRefresh=true"
                                    className={styles.responsiveIframe}
                                ></iframe>
                            )}
                        </div>
                    )}

                    {expandedSection === "docModel" && (
                        <Code
                            className={styles.documentContainer}
                            language="json"
                        >
                            {JSON.stringify(asset, null, 2)}
                        </Code>
                    )}


                    {expandedSection === "news" && (
                        <div className={styles.newsContainer}>

                            {filteredNews.length > 0 ? (
                                filteredNews.map((item) => (
                                    <div key={item._id.$oid} className={styles.newsCard}>
                                        <div className={styles.newsHeader}>
                                            <Link href={item.link} target="_blank" className={styles.newsHeadline}>
                                                {item.headline}
                                            </Link>
                                            <span className={styles.newsTime}>{item.posted}</span>
                                        </div>
                                        <Body className={styles.newsDescription}>{item.description}</Body>
                                        <Body className={styles.newsSource}>
                                            {item.source}
                                        </Body>
                                    </div>
                                ))
                            ) : (
                                <Body>No news available for {asset.symbol}.</Body>
                            )}
                        </div>
                    )}


                    {expandedSection === "insights" && (
                        <p>Here you can explore the insights for {asset.symbol}.</p>
                    )}

                </div>
            )}
        </div>
    );
}
