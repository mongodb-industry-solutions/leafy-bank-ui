import { useState } from "react";
import styles from "./AssetCard.module.css";
import Icon from "@leafygreen-ui/icon";
import IconButton from "@leafygreen-ui/icon-button";
import Tooltip from "@leafygreen-ui/tooltip";
import { Body, H3, Link } from "@leafygreen-ui/typography";
import Code from "@leafygreen-ui/code";
import Badge from "@leafygreen-ui/badge";
import {
    SegmentedControl,
    SegmentedControlOption
} from "@leafygreen-ui/segmented-control";

export default function AssetCard({ asset, chartData }) {
    const [expandedSection, setExpandedSection] = useState(null);
    const [selectedTimeframe, setSelectedTimeframe] = useState("day");

    const handleExpand = (section) => {
        setExpandedSection((prevSection) => (prevSection === section ? null : section));
    };

    const getChartSrc = () => {
        if (!chartData || !chartData[selectedTimeframe]) return null;
        return `https://charts.mongodb.com/charts-jeffn-zsdtj/embed/charts?id=${chartData[selectedTimeframe]}&maxDataAge=3600&theme=light&autoRefresh=true`;
    };

    // Get the sentiment score from the asset data (default to 0 if not available)
    const sentimentScore = asset.sentiment ? asset.sentiment.score : 0;
    const formattedSentimentScore = sentimentScore.toFixed(2);

    // Get the sentiment category for color coding
    const sentimentCategory = asset.sentiment ? asset.sentiment.category : "Neutral";
    const sentimentColor = 
        sentimentCategory === "Positive" ? styles.positiveScore :
        sentimentCategory === "Negative" ? styles.negativeScore :
        styles.neutralScore;
        
    // Get the VIX sensitivity
    const vixSensitivity = asset.vixSensitivity?.sensitivity || "NEUTRAL";
    
    // Set badge variant based on VIX sensitivity
    const vixBadgeVariant = 
        vixSensitivity === "HIGH" ? "red" :
        vixSensitivity === "LOW" ? "green" :
        "yellow"; // NEUTRAL
    
    // Get actions from macro indicators
    const gdpAction = asset.macroIndicators?.gdp?.action || "KEEP";
    const interestRateAction = asset.macroIndicators?.interestRate?.action || "KEEP"; 
    const unemploymentAction = asset.macroIndicators?.unemployment?.action || "KEEP";
    
    // Set badge variants based on macro indicator actions
    const gdpBadgeVariant = gdpAction === "KEEP" ? "green" : "red";
    const interestRateBadgeVariant = interestRateAction === "KEEP" ? "green" : "red";
    const unemploymentBadgeVariant = unemploymentAction === "KEEP" ? "green" : "red";
    
    // Get asset trend data
    const assetTrend = asset.assetTrend?.trend || "neutral";
    const trendBadgeVariant = assetTrend === "uptrend" ? "green" : assetTrend === "downtrend" ? "red" : "yellow";

    return (
        <div className={`${styles.card} ${expandedSection ? styles.expanded : ""}`}>
            <div className={styles.mainContent}>
                <div className={styles.cell}>{asset.symbol} ({asset.allocation?.description})</div>
                <div className={styles.cell}>{asset.close ? asset.close.toFixed(2) : "No Price"}</div>
                <div className={styles.cell}>
                    {asset.allocation ? asset.allocation.percentage : "N/A"}
                </div>
                <div className={styles.cell}>
                    <span className={`${styles.sentiment} ${sentimentColor}`}>{formattedSentimentScore}</span>
                </div>

                <Badge className={`${styles.cell} ${styles.badge}`} variant={vixBadgeVariant}>{vixSensitivity}</Badge>
                <Badge className={`${styles.cell} ${styles.badge}`} variant={gdpBadgeVariant}>{gdpAction}</Badge>
                <Badge className={`${styles.cell} ${styles.badge}`} variant={interestRateBadgeVariant}>{interestRateAction}</Badge>
                <Badge className={`${styles.cell} ${styles.badge}`} variant={unemploymentBadgeVariant}>{unemploymentAction}</Badge>

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

                            {getChartSrc() ? (
                                <iframe
                                    src={getChartSrc()}
                                    className={styles.responsiveIframe}
                                ></iframe>
                            ) : (
                                <Body>No chart available for {asset.symbol} - {selectedTimeframe}</Body>
                            )}
                        </div>
                    )}

                    {expandedSection === "docModel" && (
                        <Code
                            className={styles.documentContainer}
                            language="json"
                        >
                            {(() => {
                                const displayAsset = {
                                    [asset.symbol]: asset.recentData?.map(item => ({
                                        timestamp: item.timestamp,
                                        open: item.open,
                                        high: item.high,
                                        low: item.low,
                                        close: item.close,
                                        volume: item.volume
                                    })) || []
                                };
                                
                                return JSON.stringify(displayAsset, null, 2);
                            })()}
                        </Code>
                    )}

                    {expandedSection === "news" && (
                        <div className={styles.newsContainer}>
                            {asset.news && asset.news.length > 0 ? (
                                asset.news.map((item, index) => (
                                    <div key={index} className={styles.newsCard}>
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
                        <div className={styles.insightsContainer}>
                            <H3>{asset.symbol} Insights</H3>
                            
                            {/* MA50 Analysis */}
                            <div className={styles.insightSection}>
                                <div className={styles.insightHeader}>
                                    <h4>50-Day Moving Average Analysis</h4>
                                    <Badge variant={trendBadgeVariant}>
                                        {assetTrend.charAt(0).toUpperCase() + assetTrend.slice(1)}
                                    </Badge>
                                </div>
                                
                                <Body weight="medium">Price vs. MA50:</Body>
                                <Body>{asset.assetTrend?.fluctuation || "No data available."}</Body>
                                
                                <Body weight="medium" className={styles.diagnosisLabel}>Diagnosis:</Body>
                                <Body className={`${styles.diagnosis} ${
                                    assetTrend === "uptrend" ? styles.positiveAction :
                                    assetTrend === "downtrend" ? styles.negativeAction :
                                    styles.neutralAction
                                }`}>
                                    {asset.assetTrend?.diagnosis || "No diagnosis available."}
                                </Body>
                            </div>
                            
                            {/* VIX Sensitivity Analysis */}
                            <div className={styles.insightSection}>
                                <div className={styles.insightHeader}>
                                    <h4>VIX Sensitivity Analysis</h4>
                                    <Badge variant={vixBadgeVariant}>{vixSensitivity}</Badge>
                                </div>
                                
                                <Body weight="medium">Market Volatility:</Body>
                                <Body>{asset.vixSensitivity?.marketData?.fluctuation || "No market volatility data available."}</Body>
                                
                                <Body weight="medium" className={styles.recommendationLabel}>Asset-Specific Recommendation:</Body>
                                <Body weight="medium">Action: <span className={asset.vixSensitivity?.action === "KEEP" ? styles.positiveAction : styles.negativeAction}>
                                    {asset.vixSensitivity?.action || "KEEP"}
                                </span></Body>
                                
                                <Body>{asset.vixSensitivity?.explanation || "No explanation available."}</Body>
                                
                                {asset.vixSensitivity?.note && (
                                    <Body className={styles.insightNote}>{asset.vixSensitivity.note}</Body>
                                )}
                            </div>

                            {/* GDP Analysis */}
                            <div className={styles.insightSection}>
                                <div className={styles.insightHeader}>
                                    <h4>GDP Analysis</h4>
                                    <Badge variant={gdpBadgeVariant}>{gdpAction}</Badge>
                                </div>
                                
                                <Body weight="medium">GDP Trend:</Body>
                                <Body>{asset.macroIndicators?.gdp?.marketData?.fluctuation || "No market GDP data available."}</Body>
                                
                                <Body weight="medium" className={styles.recommendationLabel}>Asset-Specific Recommendation:</Body>
                                <Body weight="medium">Action: <span className={gdpAction === "KEEP" ? styles.positiveAction : styles.negativeAction}>
                                    {gdpAction}
                                </span></Body>
                                
                                <Body>{asset.macroIndicators?.gdp?.explanation || "No explanation available."}</Body>
                                
                                {asset.macroIndicators?.gdp?.note && (
                                    <Body className={styles.insightNote}>{asset.macroIndicators.gdp.note}</Body>
                                )}
                            </div>

                            {/* Interest Rate Analysis */}
                            <div className={styles.insightSection}>
                                <div className={styles.insightHeader}>
                                    <h4>Interest Rate Analysis</h4>
                                    <Badge variant={interestRateBadgeVariant}>{interestRateAction}</Badge>
                                </div>
                                
                                <Body weight="medium">Interest Rate Trend:</Body>
                                <Body>{asset.macroIndicators?.interestRate?.marketData?.fluctuation || "No market interest rate data available."}</Body>

                                <Body weight="medium" className={styles.recommendationLabel}>Asset-Specific Recommendation:</Body>
                                <Body weight="medium">Action: <span className={interestRateAction === "KEEP" ? styles.positiveAction : styles.negativeAction}>
                                    {interestRateAction}
                                </span></Body>
                                
                                <Body>{asset.macroIndicators?.interestRate?.explanation || "No explanation available."}</Body>
                                
                                {asset.macroIndicators?.interestRate?.note && (
                                    <Body className={styles.insightNote}>{asset.macroIndicators.interestRate.note}</Body>
                                )}
                            </div>

                            {/* Unemployment Rate Analysis */}
                            <div className={styles.insightSection}>
                                <div className={styles.insightHeader}>
                                    <h4>Unemployment Rate Analysis</h4>
                                    <Badge variant={unemploymentBadgeVariant}>{unemploymentAction}</Badge>
                                </div>
                                
                                <Body weight="medium">Unemployment Rate Trend:</Body>
                                <Body>{asset.macroIndicators?.unemployment?.marketData?.fluctuation || "No market unemployment data available."}</Body>

                                <Body weight="medium" className={styles.recommendationLabel}>Asset-Specific Recommendation:</Body>
                                <Body weight="medium">Action: <span className={unemploymentAction === "KEEP" ? styles.positiveAction : styles.negativeAction}>
                                    {unemploymentAction}
                                </span></Body>
                                
                                <Body>{asset.macroIndicators?.unemployment?.explanation || "No explanation available."}</Body>
                                
                                {asset.macroIndicators?.unemployment?.note && (
                                    <Body className={styles.insightNote}>{asset.macroIndicators.unemployment.note}</Body>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}