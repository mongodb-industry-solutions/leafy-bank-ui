import { useState } from "react";
import styles from "./AssetCard.module.css";
import Icon from "@leafygreen-ui/icon";
import IconButton from "@leafygreen-ui/icon-button";
import Tooltip from "@leafygreen-ui/tooltip";
import { Body, H3, Link, Subtitle } from "@leafygreen-ui/typography";
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

    const timeAgoToMinutes = (str) => {
        const num = parseInt(str);
        if (str.includes("minute")) return num;
        if (str.includes("hour")) return num * 60;
        if (str.includes("day")) return num * 60 * 24;
        if (str.includes("week")) return num * 60 * 24 * 7;
        if (str.includes("month")) return num * 60 * 24 * 30;
        if (str.includes("year")) return num * 60 * 24 * 365;
        return Infinity; // fallback for "Just now" or unknown
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
                                : expandedSection === "insights" ? ""
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

                                <div className={styles.chartsSection}>
                                    <iframe
                                        src={getChartSrc()}
                                        className={styles.responsiveIframe}
                                    ></iframe>

                                    <Body>Any gaps in the last 7 days chart are due to weekends, during which financial markets are closed.</Body>
                                </div>
                            ) : (
                                <Body>No chart available for {asset.symbol} - {selectedTimeframe}</Body>
                            )}
                        </div>
                    )}

                    {expandedSection === "docModel" && (
                        <div className={styles.docModelSection}>
                            <div className={styles.codeColumn}>
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
                            </div>

                            <div className={styles.textColumn}>
                                <Body>
                                    Market data is stored in a{" "}
                                    <a
                                    href="https://www.mongodb.com/docs/manual/core/timeseries-collections/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    >
                                    time series collection
                                    </a>{" "}
                                    in MongoDB. 
                                    This specialized collection type is designed for efficient storage and retrieval of time-based measurements, making it ideal for our financial market data that spans multiple asset classes (equities, bonds, real estate, commodities, and volatility indices).
                                    <br /><br />
                                    Some of the benefits are:
                                    
                                    <ul className={styles.benefitsList}>
                                    <li><strong>Optimized Storage</strong>: Efficiently compresses time-based measurements while reducing storage costs</li>
                                    <li><strong>Enhanced Query Performance</strong>: Executes time-range queries significantly faster than standard collections</li>
                                    <li><strong>Intelligent Data Organization</strong>: Automatically clusters by instrument identifier for efficient cross-asset analysis</li>
                                    <li><strong>Flexible Time Granularity</strong>: Handles data at various resolutions from milliseconds to seconds, minutes, hours, and days</li>
                                    <li><strong>Built-in Data Management</strong>: Includes automated retention policies and recovery mechanisms</li>
                                    </ul>
                                    
                                    While time series collections have applications across many industries, they are particularly valuable for financial applications that require historical analysis, pattern recognition, and real-time market monitoring.
                                </Body>
                            </div>
                        </div>
                    )}
                    {expandedSection === "news" && (

                        <div className={styles.newsSection}>
                            <div className={styles.newsContainer}>
                                {asset.news && asset.news.length > 0 ? (
                                    [...asset.news]
                                        .sort((a, b) => timeAgoToMinutes(a.posted) - timeAgoToMinutes(b.posted)) // most recent = lower value
                                        .map((item, index) => (
                                            <div key={index} className={styles.newsCard}>
                                                <div className={styles.newsHeader}>
                                                    <Link href={item.link} target="_blank" className={styles.newsHeadline}>
                                                        {item.headline}
                                                    </Link>
                                                    <span className={styles.newsTime}>{item.posted}</span>
                                                </div>
                                                <Body className={styles.newsDescription}>{item.description}</Body>
                                                <Body className={styles.newsSource}>{item.source}</Body>
                                            </div>
                                        ))
                                ) : (
                                    <Body>No news available for {asset.symbol}.</Body>
                                )}
                            </div>


                            <div className={styles.explanationContainer}>
                                <div className={styles.explanation}>
                                    <Body>The <strong>Sentiment Score</strong> reflects the overall market sentiment for a given asset, calculated using <a href="https://huggingface.co/ProsusAI/finbert" target="_blank" rel="noopener noreferrer"><strong>FinBERT</strong></a>, a financial NLP model. This score is derived from analyzing relevant news articles retrieved through semantic search, representing the average sentiment across all related articles.</Body>
                                    <Body><em>Note: To simulate dynamic behavior in this demo, a randomizer alters the news articles that are displayed.</em></Body>
                                    <br/>

                                    <Body>The <strong>news articles are retrieved using a semantic search query</strong> that finds the most relevant articles based on the asset's symbol and description.</Body>
                                    <br/>
                                    <Body weight="medium" className={styles.sectionTitle}>How it works:</Body>
                                    <Body>
                                        1. We generate a semantic query embedding for <em>"Financial news articles related to {asset.symbol} ({asset.allocation?.description})"</em> using <a href="https://blog.voyageai.com/2024/06/03/domain-specific-embeddings-finance-edition-voyage-finance-2/" target="_blank" rel="noopener noreferrer">voyage-finance-2</a>, a domain-specific financial embedding model
                                        <br/>
                                        2. MongoDB's vector search finds the most semantically relevant news articles
                                        <br/>
                                    </Body>
                                    
                                    <Code
                                        className={styles.queryContainer}
                                        language="json"
                                    >
{`// MongoDB Vector Search Pipeline example
[
  {
    "$vectorSearch": {
      "index": "VECTOR_SEARCH_INDEX_NAME", // E.g. "financial_news_VS_IDX"
      "path": "VECTOR_FIELD_NAME", // E.g. "article_embedding"
      "queryVector": [0.23, 0.11, 0.67, ...], // Generated from "${asset.symbol}" query
      "numCandidates": 5,
      "limit": 3
    }
  }
]`}
                                    </Code>
                                    
                                    <Body><em>Note: The above vector search aggregation pipeline runs on news article data using <a href="https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-overview/" target="_blank" rel="noopener noreferrer">MongoDB Atlas Vector Search</a></em></Body>
                                </div>
                            </div>

                        </div>
                    )}

                    {expandedSection === "insights" && (
                        <div className={styles.insightsContainer}>
                            <H3 className={styles.insightsTitle}>{asset.symbol} Insights</H3>


                            {/* MA50 Analysis */}
                            <div className={styles.insightSection}>
                                <div className={styles.insightHeader}>
                                    <Subtitle>50-Day Moving Average Analysis</Subtitle>
                                    <Badge variant={trendBadgeVariant}>
                                        {assetTrend.charAt(0).toUpperCase() + assetTrend.slice(1)}
                                    </Badge>
                                </div>

                                <Body weight="medium">Price vs. MA50:</Body>
                                <Body>{asset.assetTrend?.fluctuation || "No data available."}</Body>

                                <Body weight="medium" className={styles.diagnosisLabel}>Diagnosis:</Body>
                                <Body className={`${styles.diagnosis} ${assetTrend === "uptrend" ? styles.positiveAction :
                                    assetTrend === "downtrend" ? styles.negativeAction :
                                        styles.neutralAction
                                    }`}>
                                    {asset.assetTrend?.diagnosis || "No diagnosis available."}
                                </Body>
                            </div>

                            <div className={styles.assetInsightCards}>
                                {/* VIX Sensitivity Analysis */}
                                <div className={styles.insightSection}>
                                    <div className={styles.insightHeader}>
                                        <Subtitle>VIX Sensitivity Analysis</Subtitle>
                                        <Badge variant={vixBadgeVariant}>{vixSensitivity}</Badge>
                                    </div>

                                    <Body weight="medium">Market Volatility:</Body>
                                    <Body>{asset.vixSensitivity?.marketData?.fluctuation || "No market volatility data available."}</Body>

                                    <Body weight="bold" className={styles.recommendationLabel}>Asset-Specific Recommendation:</Body>
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
                                        <Subtitle>GDP Analysis</Subtitle>
                                        <Badge variant={gdpBadgeVariant}>{gdpAction}</Badge>
                                    </div>

                                    <Body weight="medium">GDP Trend:</Body>
                                    <Body>{asset.macroIndicators?.gdp?.marketData?.fluctuation || "No market GDP data available."}</Body>

                                    <Body weight="bold" className={styles.recommendationLabel}>Asset-Specific Recommendation:</Body>
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
                                        <Subtitle>Interest Rate Analysis</Subtitle>
                                        <Badge variant={interestRateBadgeVariant}>{interestRateAction}</Badge>
                                    </div>

                                    <Body weight="medium">Interest Rate Trend:</Body>
                                    <Body>{asset.macroIndicators?.interestRate?.marketData?.fluctuation || "No market interest rate data available."}</Body>

                                    <Body weight="bold" className={styles.recommendationLabel}>Asset-Specific Recommendation:</Body>
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
                                        <Subtitle>Unemployment Rate Analysis</Subtitle>
                                        <Badge variant={unemploymentBadgeVariant}>{unemploymentAction}</Badge>
                                    </div>

                                    <Body weight="medium">Unemployment Rate Trend:</Body>
                                    <Body>{asset.macroIndicators?.unemployment?.marketData?.fluctuation || "No market unemployment data available."}</Body>

                                    <Body weight="bold" className={styles.recommendationLabel}>Asset-Specific Recommendation:</Body>
                                    <Body weight="medium">Action: <span className={unemploymentAction === "KEEP" ? styles.positiveAction : styles.negativeAction}>
                                        {unemploymentAction}
                                    </span></Body>

                                    <Body>{asset.macroIndicators?.unemployment?.explanation || "No explanation available."}</Body>

                                    {asset.macroIndicators?.unemployment?.note && (
                                        <Body className={styles.insightNote}>{asset.macroIndicators.unemployment.note}</Body>
                                    )}
                                </div>
                            </div>
                        </div>

                    )}
                </div>
            )}
        </div>
    );
}