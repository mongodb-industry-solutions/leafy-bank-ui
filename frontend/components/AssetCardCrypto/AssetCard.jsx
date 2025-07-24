import { useState } from "react";
import styles from "./AssetCardCrypto.module.css";
import Icon from "@leafygreen-ui/icon";
import IconButton from "@leafygreen-ui/icon-button";
import Tooltip from "@leafygreen-ui/tooltip";
import { Body, H3, H2, Link, Subtitle } from "@leafygreen-ui/typography";
import Code from "@leafygreen-ui/code";
import Badge from "@leafygreen-ui/badge";
import {
    SegmentedControl,
    SegmentedControlOption
} from "@leafygreen-ui/segmented-control";
import Banner from "@leafygreen-ui/banner";
import NewsCard from "../NewsCard/NewsCard";
import RedditCard from "../RedditCard/RedditCard";

export default function AssetCardCrypto({ asset, chartData }) {
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


    // NEWS sentiment
    const newsSentimentScore = asset.sentiment?.score ?? 0;
    const newsCategory = asset.sentiment?.category ?? null;
    const {
        formattedScore: formattedSentimentScore,
        colorClass: sentimentColor
    } = getSentimentInfo(newsSentimentScore, newsCategory);

    // SOCIAL sentiment
    const socialSentimentScore = asset.socialSentiment?.score ?? 0;
    const socialCategory = asset.socialSentiment?.category ?? null;
    const {
        formattedScore: formattedSocialSentimentScore,
        colorClass: socialSentimentColor
    } = getSentimentInfo(socialSentimentScore, socialCategory);

    // Get the sentiment category for color coding
    function getSentimentInfo(score = 0.5, categoryOverride = null) {
        const category = categoryOverride ||
            (score >= 0.6 ? "Positive" :
                score >= 0.4 ? "Neutral" : "Negative");

        const colorClass =
            category === "Positive" ? styles.positiveScore :
                category === "Negative" ? styles.negativeScore :
                    styles.neutralScore;

        return {
            formattedScore: score.toFixed(2),
            category,
            colorClass
        };
    }

    // Get the RSI analysis data (replacing VIX sensitivity)
    const rsiAnalysis = asset.rsiAnalysis;

    // Get RSI traffic light color based on RSI value and diagnosis
    const getRSITrafficLightColor = (rsiValue, diagnosis = null) => {
        if (!rsiValue) return "gray";
        
        // If we have diagnosis text, prioritize that
        if (diagnosis) {
            const diagnosisLower = diagnosis.toLowerCase();
            if (diagnosisLower.includes("buying opportunity") || diagnosisLower.includes("oversold")) return "green";
            if (diagnosisLower.includes("bearish momentum") || diagnosisLower.includes("downward pressure")) return "red";
            if (diagnosisLower.includes("overbought")) return "red";
        }
        
        // Fallback to numeric RSI logic
        if (rsiValue >= 70) return "red"; // Overbought
        if (rsiValue <= 30) return "green"; // Oversold - buying opportunity
        if (rsiValue >= 50) return "yellow"; // Above 50 - moderate bullish
        if (rsiValue <= 40) return "red"; // Below 40 - bearish momentum
        return "yellow"; // 40-50 range - neutral
    };

    // Get Volume Analysis traffic light color based on volume ratio
    const getVolumeTrafficLightColor = (volumeRatio) => {
        if (!volumeRatio) return "gray";
        
        const ratio = parseFloat(volumeRatio);
        if (ratio >= 2.0) return "green"; // High volume - strong signal
        if (ratio >= 1.2) return "yellow"; // Moderate volume
        return "red"; // Low volume - weak signal
    };

    // Get VWAP Analysis traffic light color based on VWAP position
    const getVWAPTrafficLightColor = (vwapPosition) => {
        if (vwapPosition === undefined || vwapPosition === null) return "gray";
        
        let percentage;
        
        // If it's already a number, use it directly
        if (typeof vwapPosition === 'number') {
            percentage = vwapPosition;
        } else {
            // Parse the percentage value from the string (e.g., "(-0.1%)" -> -0.1)
            const percentageMatch = vwapPosition.toString().match(/([-+]?\d*\.?\d+)%/);
            if (!percentageMatch) return "gray";
            percentage = parseFloat(percentageMatch[1]);
        }
        
        if (percentage >= 1.0) return "green"; // Above VWAP by 1%+ - bullish
        if (percentage >= -1.0) return "yellow"; // Around VWAP (-1% to +1%) - neutral
        return "red"; // Below VWAP by more than 1% - bearish
    };

    // Get Moving Average traffic light color based on consolidated MA analysis
    const getMovingAverageTrafficLightColor = (asset) => {
        // Get all MA indicators
        const maIndicators = asset.crypto_indicators?.filter(ind => 
            ind.indicator.includes("Moving Average")
        ) || [];
        
        if (maIndicators.length === 0) return "gray";
        
        let bullishCount = 0;
        let bearishCount = 0;
        let neutralCount = 0;
        
        // Analyze each MA indicator
        maIndicators.forEach(ma => {
            const suggestion = (ma.suggestion || "").toLowerCase();
            if (suggestion.includes("upward momentum") || suggestion.includes("price above")) {
                bullishCount++;
            } else if (suggestion.includes("downward momentum") || suggestion.includes("price below")) {
                bearishCount++;
            } else {
                neutralCount++;
            }
        });
        
        // Determine overall MA sentiment
        const totalMAs = maIndicators.length;
        if (bullishCount >= totalMAs * 0.67) return "green"; // 67% or more bullish
        if (bearishCount >= totalMAs * 0.67) return "red"; // 67% or more bearish
        if (bullishCount > bearishCount) return "yellow"; // More bullish than bearish but not overwhelming
        if (bearishCount > bullishCount) return "red"; // More bearish than bullish
        return "yellow"; // Even split or mostly neutral
    };

    // Get the combined crypto indicators traffic light color
    const getCryptoIndicatorColor = (indicatorTitle, data) => {
        if (indicatorTitle === "Moving Average Analysis") {
            // For consolidated MAs, analyze all MA indicators together
            return getMovingAverageTrafficLightColor(asset);
        } else if (indicatorTitle === "RSI Analysis") {
            // Use momentum indicators data from analysis report if available
            const rsiValue = asset.momentumIndicators?.rsi?.value || data.rsi_value;
            const rsiDiagnosis = asset.momentumIndicators?.rsi?.diagnosis || data.suggestion;
            return getRSITrafficLightColor(rsiValue, rsiDiagnosis);
        } else if (indicatorTitle === "Volume Analysis") {
            // Use momentum indicators data from analysis report if available
            const volumeRatio = asset.momentumIndicators?.volume?.ratio || data.volume_ratio;
            return getVolumeTrafficLightColor(volumeRatio);
        } else if (indicatorTitle === "VWAP Analysis") {
            // Use momentum indicators data from analysis report if available
            const vwapPercentage = asset.momentumIndicators?.vwap?.percentage;
            if (vwapPercentage !== undefined && vwapPercentage !== null) {
                return getVWAPTrafficLightColor(vwapPercentage);
            }
            return getVWAPTrafficLightColor(data.vwap_position);
        }
        return "gray";
    };

    // Set badge variant based on RSI analysis - use momentum indicators if available
    const rsiValue = asset.momentumIndicators?.rsi?.value || rsiAnalysis?.rsi_value;
    const rsiDiagnosis = asset.momentumIndicators?.rsi?.diagnosis || rsiAnalysis?.diagnosis;
    const rsiBadgeVariant = rsiValue ? getRSITrafficLightColor(rsiValue, rsiDiagnosis) : "gray";

    // Set badge variant based on Volume analysis - use momentum indicators if available
    const volumeRatio = asset.momentumIndicators?.volume?.ratio || asset.volumeAnalysis?.volume_ratio;
    const volumeBadgeVariant = volumeRatio ? getVolumeTrafficLightColor(volumeRatio) : "gray";

    // Set badge variant based on VWAP analysis - use momentum indicators if available
    const vwapPercentage = asset.momentumIndicators?.vwap?.percentage;
    const vwapPosition = asset.vwapAnalysis?.vwap_position;
    const vwapBadgeVariant = (vwapPercentage !== undefined && vwapPercentage !== null) ? 
        getVWAPTrafficLightColor(vwapPercentage) : 
        vwapPosition ? getVWAPTrafficLightColor(vwapPosition) : "gray";

    // Set badge variant based on trend direction
    const getTrendBadgeVariant = (trendDirection) => {
        switch ((trendDirection || "").toLowerCase()) {
            case "above":
                return "green";
            case "below":
                return "red";
            case "at":
                return "yellow";
            default:
                return "gray";
        }
    };
 
    // Get asset trend data
    const assetTrend = asset.assetTrend?.trend || "neutral";
    const trendBadgeVariant = assetTrend === "uptrend" ? "green" : assetTrend === "downtrend" ? "red" : "yellow";


    return (
        <div className={`${styles.card} ${expandedSection ? styles.expanded : ""}`}>
            <div className={styles.mainContent}>

                <div className={styles.cell}> <strong>{asset.symbol}</strong> </div>

                <div className={styles.cell}>{asset.allocation.description || "Unknown"}</div>

                <div className={styles.cell}>{asset.close ? asset.close.toFixed(2) : "No Price"}</div>

                <div className={styles.cell}>  {asset.allocation?.percentage || "N/A"}</div>

                <div className={styles.cell}>
                    <span className={`${styles.sentiment} ${sentimentColor}`}>{formattedSentimentScore}</span>
                </div>

                <div className={styles.cell}>
                    <span className={`${styles.sentiment} ${socialSentimentColor}`}>{formattedSocialSentimentScore}</span>
                </div>

                <div className={`${styles.cell} ${styles.circle} ${styles[rsiBadgeVariant]}`}></div>

                <div className={`${styles.cell} ${styles.circle} ${styles[volumeBadgeVariant]}`}></div>

                <div className={`${styles.cell} ${styles.circle} ${styles[vwapBadgeVariant]}`}></div>

                <div className={styles.actions}>


                    <Tooltip align="top" justify="middle" trigger={
                        <IconButton aria-label="Insights" className={styles.actionButton} onClick={() => handleExpand("insights")}>
                            <Icon glyph="Sparkle" />
                        </IconButton>
                    }>
                        Insights
                    </Tooltip>

                    <Tooltip align="top" justify="middle" trigger={
                        <IconButton aria-label="Candle Stick" className={styles.actionButton} onClick={() => handleExpand("candleStick")}>
                            <Icon glyph="Charts" />
                        </IconButton>
                    }>
                        Candle Stick Chart
                    </Tooltip>

                    <Tooltip align="top" justify="middle" trigger={
                        <IconButton aria-label="News" className={styles.actionButton} onClick={() => handleExpand("news")}>
                            <Icon glyph="University" />
                        </IconButton>
                    }>
                        News Headlines
                    </Tooltip>

                    <Tooltip align="top" justify="middle" trigger={
                        <IconButton aria-label="Social" className={styles.actionButton} onClick={() => handleExpand("social")}>
                            <Icon glyph="SMS" />
                        </IconButton>
                    }>
                        Social Media
                    </Tooltip>

                    <Tooltip align="top" justify="middle" trigger={
                        <IconButton aria-label="Doc Model" className={styles.actionButton} onClick={() => handleExpand("docModel")}>
                            <Icon glyph="CurlyBraces" />
                        </IconButton>
                    }>
                        Doc Model
                    </Tooltip>

                </div>
            </div>

            {expandedSection && (
                <div className={styles.expandedSection}>
                    <H3>
                        {expandedSection === "candleStick" ? ""
                            : expandedSection === "docModel" ? "Document Model"
                                : expandedSection === "insights" ? ""
                                    : expandedSection === "social" ? "Social Media"
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
                            <Banner>
                                This section illustrates the document model progression from raw ingested data to processed reports.
                                On the left, you can see the initial data as it's ingested into MongoDB. On the right, you'll find the
                                reports generated after this data has been processed by scheduled agents that apply business rules,
                                perform calculations, and create investment insights. Time series collections are used for efficient storage of financial data points,
                                while standard collections store news articles and analysis reports. This unified approach enables
                                seamless transitions from data ingestion to insight generation.
                            </Banner>

                            <div className={styles.docModelColumns}>
                                {/* LEFT COLUMN - RAW DATA */}
                                <div className={styles.rawDataColumn}>
                                    <H2>Raw Ingested Data</H2>

                                    <Subtitle className={styles.dataSubtitle}>Crypto Data</Subtitle>
                                    <Body className={styles.dataNote}>* Sample data is shown here. The actual system processes a much larger dataset.</Body>
                                    <Code
                                        className={styles.documentContainer}
                                        language="json"
                                        copyable={true}
                                    >
                                        {JSON.stringify({
                                            [asset.symbol]: (asset.recentData || []).map(item => ({
                                                timestamp: item.timestamp,
                                                open: item.open,
                                                high: item.high,
                                                low: item.low,
                                                close: item.close,
                                                volume: item.volume
                                            }))
                                        }, null, 2)}
                                    </Code>

                                    <Subtitle className={styles.dataSubtitle}>Crypto News Data</Subtitle>
                                    <Body className={styles.dataNote}>* Displaying only 3 of many news articles processed by the system.</Body>
                                    <Code
                                        className={styles.documentContainer}
                                        language="json"
                                        copyable={true}
                                    >
                                        {JSON.stringify((asset.news || []).slice(0, 3).map(item => ({
                                            asset: item.asset,
                                            headline: item.headline,
                                            description: item.description,
                                            source: item.source,
                                            link: item.link || `https://news.google.com/search?q=${asset.symbol}`
                                        })), null, 2)}
                                    </Code>

                                    <Subtitle className={styles.dataSubtitle}>Crypto Social Media Data</Subtitle>
                                    <Body className={styles.dataNote}>* Displaying only 3 of many social media posts processed by the system.</Body>
                                    <Code
                                        className={styles.documentContainer}
                                        language="json"
                                        copyable={true}
                                    >
                                        {JSON.stringify((asset.reddit || []).slice(0, 3).map(item => ({
                                            asset: item.asset,
                                            subreddit: item.subreddit,
                                            url: item.url,
                                            selftext: item.selftext ? item.selftext.substring(0, 80) + "..." : "",
                                            title: item.title,
                                            author: item.author,
                                            author_fullname: item.author_fullname,
                                            posted: item.posted,
                                            comments: Array.isArray(item.comments)
                                                ? item.comments.map(comment => {
                                                    const { create_at_utc, ...rest } = comment;
                                                    return rest;
                                                })
                                                : item.comments,
                                            ups: item.ups,
                                            downs: item.downs
                                        })), null, 2)}
                                    </Code>
                                </div>

                                {/* RIGHT COLUMN - PROCESSED REPORTS */}
                                <div className={styles.processedDataColumn}>
                                    <H2>Processed Reports</H2>

                                    <Subtitle className={styles.dataSubtitle}>AI Agent - Crypto Analysis Report</Subtitle>
                                    <Body className={styles.dataNote}>* Simplified view of the crypto analysis report with truncated embeddings.</Body>
                                    <Code
                                        className={styles.documentContainer}
                                        language="json"
                                        copyable={true}
                                    >
                                        {JSON.stringify({
                                            crypto_analysis_report: {
                                                report: {
                                                    rsi_analysis: {
                                                        rsi_value: asset.rsiAnalysis?.rsi_value || "No data",
                                                        interpretation: asset.rsiAnalysis?.interpretation || "No data",
                                                        diagnosis: asset.rsiAnalysis?.diagnosis || "No data"
                                                    },
                                                    crypto_indicators: asset.crypto_indicators?.map(indicator => ({
                                                        indicator: indicator.indicator,
                                                        action: indicator.action,
                                                        explanation: indicator.explanation
                                                    })) || [],
                                                    asset_trends: [
                                                        {
                                                            asset: asset.symbol,
                                                            moving_averages: asset.crypto_indicators?.filter(ind => ind.indicator.includes("Moving Average")) || [],
                                                            momentum_indicators: asset.crypto_indicators?.filter(ind => !ind.indicator.includes("Moving Average")) || []
                                                        }
                                                    ]
                                                },
                                                report_embedding: [0.023, 0.187, 0.452, "..."]
                                            }
                                        }, null, 2)}
                                    </Code>

                                    <Subtitle className={styles.dataSubtitle}>AI Agent - Crypto News Report</Subtitle>
                                    <Body className={styles.dataNote}>* Simplified view of the crypto news report with truncated embeddings.</Body>
                                    <Code
                                        className={styles.documentContainer}
                                        language="json"
                                        copyable={true}
                                    >
                                        {JSON.stringify({
                                            crypto_news_report: {
                                                report: {
                                                    asset_news: asset.news || [],
                                                    asset_news_summary: [
                                                        {
                                                            asset: asset.symbol,
                                                            overall_sentiment_score: asset.sentiment.originalScore,
                                                            overall_sentiment_category: asset.sentiment.category,
                                                            news_count: asset.news ? asset.news.length : 0
                                                        }
                                                    ]
                                                },
                                                report_embedding: [0.124, 0.394, 0.721, "..."]
                                            }
                                        }, null, 2)}
                                    </Code>

                                    <Subtitle className={styles.dataSubtitle}>AI Agent - Crypto Social Media Report</Subtitle>
                                    <Body className={styles.dataNote}>* Simplified view of the crypto social media report with truncated embeddings.</Body>
                                    <Code
                                        className={styles.documentContainer}
                                        language="json"
                                        copyable={true}
                                    >
                                        {JSON.stringify({
                                            crypto_sm_report: {
                                                report: {
                                                    asset_subreddits: asset.reddit || [],
                                                    asset_sm_sentiments: [
                                                        {
                                                            asset: asset.symbol,
                                                            final_sentiment_score: asset.socialSentiment?.score || 0.5,
                                                            sentiment_category: asset.socialSentiment?.category || "Neutral"
                                                        }
                                                    ]
                                                },
                                                report_embedding: [0.156, 0.428, 0.693, "..."]
                                            }
                                        }, null, 2)}
                                    </Code>
                                </div>
                            </div>

                        </div>
                    )}

                    {expandedSection === "news" && (
                        <div className={styles.newsSection}>

                            <div className={styles.newsContainer}>
                                {asset.news && asset.news.length > 0 ? (
                                    [...asset.news]
                                        .sort((a, b) => timeAgoToMinutes(a.posted) - timeAgoToMinutes(b.posted))
                                        .slice(0, 5) // Limit to 5 news items
                                        .map((item, index) => (

                                            <NewsCard key={index} item={item} />

                                        ))
                                ) : (
                                    <Body>No news available for {asset.symbol}.</Body>
                                )}
                            </div>


                            <div className={styles.explanationContainer}>
                                <div className={styles.explanation}>
                                    <Body>The <strong>Sentiment Score</strong> reflects the overall sentiment for a given asset, calculated using <a href="https://huggingface.co/ProsusAI/finbert" target="_blank" rel="noopener noreferrer"><strong>FinBERT</strong></a>, is a pre-trained NLP model to analyze sentiment of financial text. This score is derived from analyzing <strong>only the news articles semantically related to {asset.symbol}</strong>, retrieved through vector search.</Body>

                                    <Banner className={styles.formulaContainer}>
                                        <Body weight="medium">Sentiment Score Formula</Body>
                                        {asset.symbol} Sentiment Score = Sum of semantically relevant article sentiment scores ÷ Number of relevant articles
                                    </Banner>

                                    <Body>Sentiment scores are categorized as <Badge className={styles.inlineBadge} variant="green">Positive </Badge>(0.6 to 1.0), <Badge className={styles.inlineBadge} variant="yellow">Neutral</Badge> (0.4 to 0.6), and<Badge className={styles.inlineBadge} variant="red">Negative</Badge> (0.0 to 0.4).</Body>
                                    <br></br>

                                    <Body>The <strong>news articles are retrieved using a semantic search query</strong> that finds the most relevant articles based on the asset's symbol and description.</Body>
                                    <Body weight="medium" className={styles.sectionTitle}>How it works:</Body>
                                    <Body>
                                        1. We generate a semantic query embedding for <em>"financial news about {asset.symbol} ({asset.allocation?.description})"</em> using <a href="https://blog.voyageai.com/2024/06/03/domain-specific-embeddings-finance-edition-voyage-finance-2/" target="_blank" rel="noopener noreferrer">voyage-finance-2</a>, a domain-specific financial embedding model.
                                        <br />
                                        2. MongoDB's vector search finds the most semantically relevant news articles.
                                        <br />
                                    </Body>

                                    <div className={styles.queryContainer}>
                                        <Code
                                            className={styles.documentContainer}
                                            language="json"
                                        >
                                            {`// MongoDB Vector Search Pipeline example
[
  {
    "$vectorSearch": {
      "index": "VECTOR_SEARCH_INDEX_NAME", // E.g. "crypto_news_VS_IDX"
      "path": "VECTOR_FIELD_NAME", // E.g. "article_embedding"
      "filter": { // E.g. pre-filtering
        "$and": [
          {"ticker": "${asset.symbol}"}
        ]
      },
      "queryVector": [0.23, 0.11, 0.67, ...], // Generated from "${asset.symbol}" query
      "numCandidates": 15,
      "limit": 3
    }
  },
  {
    "$project": {
      "_id": 0,
      "asset": "$ticker",
      "headline": 1,
      "description": 1,
      "source": 1,
      "link": 1,
      ...
      "vectorSearchScore": { "$meta": "vectorSearchScore" }
    }
  }
]`}
                                        </Code>
                                    </div>
                                    <br />
                                    <Body><em>Note: The above vector search aggregation pipeline runs on news article data using <a href="https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-overview/" target="_blank" rel="noopener noreferrer">MongoDB Atlas Vector Search</a></em></Body>
                                </div>
                            </div>
                        </div>
                    )}

                    {expandedSection === "social" && (
                        <div className={styles.socialSection}>

                            <div className={styles.socialContainer}>
                                {asset.reddit && asset.reddit.length > 0 ? (
                                    [...asset.reddit]
                                        // Optional: Sort by recency if you have a date field like `posted`
                                        .sort((a, b) => new Date(b.posted) - new Date(a.posted))
                                        .slice(0, 3) // Limit to 3 posts
                                        .map((item, index) => (
                                            <RedditCard key={index} item={item} />
                                        ))
                                ) : (
                                    <Body>No Reddit posts available for {asset.symbol}.</Body>
                                )}
                            </div>


                            <div className={styles.explanationContainer}>
                                <div className={styles.explanation}>
                                    <Body>The <strong>Sentiment Score</strong> reflects the overall sentiment for a given asset, calculated using <a href="https://huggingface.co/ProsusAI/finbert" target="_blank" rel="noopener noreferrer"><strong>FinBERT</strong></a>, is a pre-trained NLP model to analyze sentiment of financial text. This score is derived from analyzing <strong>only the social media posts semantically related to {asset.symbol}</strong>, retrieved through vector search.</Body>

                                    <Banner className={styles.formulaContainer}>
                                        <Body weight="medium">Sentiment Score Formula</Body>
                                        {asset.symbol} Sentiment Score = Sum of semantically relevant article sentiment scores ÷ Number of relevant articles
                                    </Banner>

                                    <Body>Sentiment scores are categorized as <Badge className={styles.inlineBadge} variant="green">Positive </Badge>(0.6 to 1.0), <Badge className={styles.inlineBadge} variant="yellow">Neutral</Badge> (0.4 to 0.6), and<Badge className={styles.inlineBadge} variant="red">Negative</Badge> (0.0 to 0.4).</Body>
                                    <br></br>

                                <Body>The <strong>social media posts are retrieved using a semantic search query</strong> that finds the most relevant posts based on the asset's symbol and description.</Body>

                                    <br />
                                    <Body weight="medium" className={styles.sectionTitle}>How it works:</Body>
                                    <Body>
                                        1. We generate a semantic query embedding for <em>"social media discussion about {asset.symbol} ({asset.allocation?.description})"</em> using <a href="https://blog.voyageai.com/2024/06/03/domain-specific-embeddings-finance-edition-voyage-finance-2/" target="_blank" rel="noopener noreferrer">voyage-finance-2</a>, a domain-specific financial embedding model.
                                        <br />
                                        2. MongoDB's vector search finds the most semantically relevant social media posts.
                                        <br />
                                    </Body>

                                    <div className={styles.queryContainer}>
                                        <Code
                                            className={styles.documentContainer}
                                            language="json"
                                        >
                                            {`// MongoDB Vector Search Pipeline example
[
  {
    "$vectorSearch": {
      "index": "VECTOR_SEARCH_INDEX_NAME", // E.g. "social_media_VS_IDX"
      "path": "VECTOR_FIELD_NAME", // E.g. "post_embedding"
      "filter": { // E.g. pre-filtering
        "$and": [
          {"asset_id": "${asset.symbol}"}
        ]
      },
      "queryVector": [0.23, 0.11, 0.67, ...], // Generated from "${asset.symbol}" query
      "numCandidates": 20,
      "limit": 3
    }
  },
  {
    "$project": {
      "_id": 0,
      "asset": "$asset_id",
      "subreddit": 1,
      "url": 1,
      "author": 1,
      "title": 1,
      "description": "$selftext",
      ...
      },
      "vectorSearchScore": { "$meta": "vectorSearchScore" }
    }
  }
]`}
                                        </Code>
                                        <br></br>
                                        <Body><em>Note: The above vector search aggregation pipeline runs on social media posts data using <a href="https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-overview/" target="_blank" rel="noopener noreferrer">MongoDB Atlas Vector Search</a></em></Body>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {expandedSection === "insights" && (
                        <div className={styles.insightsContainer}>
                            <H3 className={styles.insightsTitle}>{asset.symbol} Insights</H3>

                            <div className={styles.assetInsightCards}>
                                {[
                                    "Moving Average Analysis",
                                    "RSI Analysis",
                                    "Volume Analysis",
                                    "VWAP Analysis"
                                ].map((indicatorTitle) => {
                                    // For Moving Average Analysis, we'll consolidate all MA data
                                    if (indicatorTitle === "Moving Average Analysis") {
                                        const maIndicators = asset.crypto_indicators?.filter(ind => 
                                            ind.indicator.includes("Moving Average")
                                        ) || [];
                                        
                                        if (maIndicators.length === 0) return null;

                                        return (
                                            <div key={indicatorTitle} className={styles.insightSection}>
                                                <div className={styles.insightHeader}>
                                                    <H2 className={styles.insightH2}>{indicatorTitle}</H2>
                                                    <div
                                                        className={`${styles.cell} ${styles.circleInsight} ${
                                                            styles[getCryptoIndicatorColor(indicatorTitle, null)]
                                                        }`}
                                                    />
                                                </div>

                                                <Body>Consolidated analysis of all Moving Average indicators (MA9, MA21, MA50)</Body>

                                                {/* Display detailed analysis for each MA */}
                                                {maIndicators.map((ma, index) => (
                                                    <div key={index} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: index < maIndicators.length - 1 ? '1px solid #e0e0e0' : 'none' }}>
                                                        <Body className={styles.insightSubtitles}><strong>{ma.indicator}:</strong></Body>
                                                        
                                                        {/* Show explanation if available */}
                                                        {ma.explanation && (
                                                            <Body>{ma.explanation}</Body>
                                                        )}

                                                        {/* Show individual MA values */}
                                                        {(ma.ma9_value || ma.ma21_value || ma.ma50_value) && (
                                                            <>
                                                                <Body className={styles.insightSubtitles}>Moving Average Values:</Body>
                                                                {ma.ma9_value && <Body>MA9: {ma.ma9_value}</Body>}
                                                                {ma.ma21_value && <Body>MA21: {ma.ma21_value}</Body>}
                                                                {ma.ma50_value && <Body>MA50: {ma.ma50_value}</Body>}
                                                            </>
                                                        )}

                                                        {/* Show note if available */}
                                                        {ma.note && (
                                                            <>
                                                                <Body className={styles.insightSubtitles}>Note:</Body>
                                                                <Body className={styles.insightNote}>{ma.note}</Body>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}

                                                {/* Overall MA analysis */}
                                                <Body className={styles.insightSubtitles}>Overall Moving Average Assessment:</Body>
                                                <Body>
                                                    {(() => {
                                                        const color = getCryptoIndicatorColor(indicatorTitle, null);
                                                        const bullishCount = maIndicators.filter(ma => {
                                                            const suggestion = (ma.suggestion || "").toLowerCase();
                                                            return suggestion.includes("upward momentum") || suggestion.includes("price above");
                                                        }).length;
                                                        const bearishCount = maIndicators.filter(ma => {
                                                            const suggestion = (ma.suggestion || "").toLowerCase();
                                                            return suggestion.includes("downward momentum") || suggestion.includes("price below");
                                                        }).length;
                                                        const neutralCount = maIndicators.length - bullishCount - bearishCount;

                                                        if (color === "green") return `Bullish momentum - ${bullishCount} of ${maIndicators.length} moving averages show upward trends`;
                                                        if (color === "red") return `Bearish momentum - ${bearishCount} of ${maIndicators.length} moving averages show downward trends`;
                                                        return `Mixed signals - ${bullishCount} bullish, ${bearishCount} bearish, ${neutralCount} neutral signals across ${maIndicators.length} moving averages`;
                                                    })()}
                                                </Body>
                                            </div>
                                        );
                                    }

                                    // For other indicators, use existing logic
                                    const data = asset.crypto_indicators?.find(
                                        (ind) => ind.indicator === indicatorTitle
                                    );

                                    if (!data) return null;

                                    return (
                                        <div key={indicatorTitle} className={styles.insightSection}>
                                            <div className={styles.insightHeader}>
                                                <H2 className={styles.insightH2}>{indicatorTitle}</H2>
                                                <div
                                                    className={`${styles.cell} ${styles.circleInsight} ${
                                                        styles[getCryptoIndicatorColor(indicatorTitle, data)]
                                                    }`}
                                                />
                                            </div>

                                            {data.explanation && (
                                                <Body>{data.explanation}</Body>
                                            )}

                                            {
                                                (data.rsi_value || (indicatorTitle === "RSI Analysis" && asset.momentumIndicators?.rsi)) && (
                                                    <>
                                                        <Body className={styles.insightSubtitles}>RSI Value:</Body>
                                                        <Body>{asset.momentumIndicators?.rsi?.value || data.rsi_value}</Body>
                                                        {asset.momentumIndicators?.rsi?.diagnosis && (
                                                            <>
                                                                <Body className={styles.insightSubtitles}>Note:</Body>
                                                                <Body>{asset.momentumIndicators.rsi.diagnosis}</Body>
                                                            </>
                                                        )}
                                                    </>
                                                )
                                            }

                                            {
                                                (data.volume_ratio || (indicatorTitle === "Volume Analysis" && asset.momentumIndicators?.volume)) && (
                                                    <>
                                                        <Body className={styles.insightSubtitles}>Volume Ratio:</Body>
                                                        <Body>{asset.momentumIndicators?.volume?.ratio || data.volume_ratio}</Body>
                                                        {asset.momentumIndicators?.volume?.diagnosis && (
                                                            <>
                                                                <Body className={styles.insightSubtitles}>Note:</Body>
                                                                <Body>{asset.momentumIndicators.volume.diagnosis}</Body>
                                                            </>
                                                        )}
                                                    </>
                                                )
                                            }

                                            {
                                                (data.vwap_position || (indicatorTitle === "VWAP Analysis" && asset.momentumIndicators?.vwap)) && (
                                                    <>
                                                        <Body className={styles.insightSubtitles}>VWAP Position:</Body>
                                                        <Body>
                                                            {asset.momentumIndicators?.vwap?.percentage !== undefined ? 
                                                                `${asset.momentumIndicators.vwap.percentage.toFixed(1)}%` : 
                                                                data.vwap_position
                                                            }
                                                        </Body>
                                                        {asset.momentumIndicators?.vwap?.diagnosis && (
                                                            <>
                                                                <Body className={styles.insightSubtitles}>Note:</Body>
                                                                <Body>{asset.momentumIndicators.vwap.diagnosis}</Body>
                                                            </>
                                                        )}
                                                    </>
                                                )
                                            }
                                        </div>
                                    );
                                })}
                                
                            </div>
                        </div>
                    )}
                </div>
            )
            }
        </div >
    );
}